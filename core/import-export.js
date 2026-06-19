import { validateRuntimeConfig } from './import-export/validation.js';
import {
    createRuntimeImporter,
    looksLikeRuntimeConfig,
} from './runtime-import.js';

const { computed, watch } = window.Vue;

export function setupImportExportCore(ctx) {
    const supportsNativeFileSave = typeof window.showSaveFilePicker === 'function';
    let panelFileHandle = null;
    let runtimeFileHandle = null;

    const deepClone = (value) => JSON.parse(JSON.stringify(value));
    const defaultSnapshots = {
        settings: deepClone(ctx.settings.value),
        fakeip: deepClone(ctx.fakeip.value),
        tun: deepClone(ctx.tun.value),
        clashApi: deepClone(ctx.clashApi.value),
        ntp: deepClone(ctx.ntp.value),
        tproxy: deepClone(ctx.tproxy.value),
        extraInbounds: deepClone(ctx.extraInbounds.value),
        corsProxyEnabled: !!ctx.corsProxyEnabled.value,
        dnsList: deepClone(ctx.dnsList.value),
        providers: deepClone(ctx.providers.value),
        nodes: deepClone(ctx.nodes.value),
        groups: deepClone(ctx.groups.value),
        ruleSets: deepClone(ctx.ruleSets.value),
        routeRules: deepClone(ctx.routeRules.value),
    };

    const padNumber = (value) => String(value).padStart(2, '0');
    const buildDefaultPanelExportFilename = () => {
        const now = new Date();
        return `singbox-panel-config-${now.getFullYear()}${padNumber(now.getMonth() + 1)}${padNumber(now.getDate())}-${padNumber(now.getHours())}${padNumber(now.getMinutes())}${padNumber(now.getSeconds())}.json`;
    };
    const sanitizeFilename = (rawName, fallbackName) => {
        const cleaned = String(rawName || '')
            .trim()
            .replace(/[\\/:*?"<>|]/g, '-')
            .replace(/\s+/g, ' ');
        const baseName = cleaned || fallbackName;
        return /\.json$/i.test(baseName) ? baseName : `${baseName}.json`;
    };
    const absorbFakeipServer = (server = {}) => {
        if (!server || server.type !== 'fakeip') return;
        ctx.fakeip.value.enabled = true;
        if (server.tag) ctx.fakeip.value.tag = server.tag;
        if (server.inet4_range) ctx.fakeip.value.inet4_range = server.inet4_range;
        if (server.inet6_range) ctx.fakeip.value.inet6_range = server.inet6_range;
    };
    const looksLikePanelState = (data) => Object.prototype.toString.call(data) === '[object Object]' && (
        !!data._version
        || 'settings' in data
        || 'dnsList' in data
        || 'nodes' in data
        || 'groups' in data
        || 'routeRules' in data
    );
    const resetExportFilenames = () => {
        ctx.panelExportFilename.value = buildDefaultPanelExportFilename();
        ctx.runtimeExportFilename.value = 'config.json';
    };

    const resetPanelStateToDefaults = () => {
        ctx.settings.value = deepClone(defaultSnapshots.settings);
        ctx.fakeip.value = deepClone(defaultSnapshots.fakeip);
        ctx.tun.value = deepClone(defaultSnapshots.tun);
        ctx.clashApi.value = deepClone(defaultSnapshots.clashApi);
        ctx.ntp.value = typeof ctx.normalizeNtp === 'function'
            ? ctx.normalizeNtp(deepClone(defaultSnapshots.ntp))
            : deepClone(defaultSnapshots.ntp);
        ctx.tproxy.value = deepClone(defaultSnapshots.tproxy);
        ctx.extraInbounds.value = deepClone(defaultSnapshots.extraInbounds).map((item) => ctx.normalizeExtraInbound(item));
        ctx.corsProxyEnabled.value = defaultSnapshots.corsProxyEnabled;
        ctx.dnsList.value = deepClone(defaultSnapshots.dnsList).map((dns, index) => (
            typeof ctx.normalizeDnsServer === 'function' ? ctx.normalizeDnsServer(dns, index) : dns
        ));
        ctx.providers.value = deepClone(defaultSnapshots.providers);
        ctx.nodes.value = deepClone(defaultSnapshots.nodes).map((node) => ctx.makeNode(node));
        ctx.groups.value = deepClone(defaultSnapshots.groups).map((group) => (
            typeof ctx.normalizeGroup === 'function' ? ctx.normalizeGroup(group) : group
        ));
        ctx.ruleSets.value = deepClone(defaultSnapshots.ruleSets);
        ctx.routeRules.value = deepClone(defaultSnapshots.routeRules)
            .map(ctx.migrateRule)
            .map((rule) => ({ ...rule, isEditing: false, draggable: false, id: rule.id || ctx.generateId('r') }));
    };

    const resetRuntimeImportState = () => {
        resetPanelStateToDefaults();
        ctx.providers.value = [];
        ctx.nodes.value = [];
        ctx.groups.value = [];
        ctx.ruleSets.value = [];
        ctx.routeRules.value = [];
        ctx.extraInbounds.value = [];
        ctx.dnsList.value = [];
    };
    const { applyRuntimeImport } = createRuntimeImporter(ctx, {
        resetRuntimeImportState,
        absorbFakeipServer,
    });

    const triggerJsonDownload = (content, nameRef, fallbackName, successMessage) => {
        const filename = sanitizeFilename(nameRef.value, fallbackName);
        nameRef.value = filename;
        const blob = new Blob([content], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
        if (successMessage) ctx.showToast(successMessage, 'ok');
    };

    const saveJsonFile = async (content, nameRef, fallbackName, handleType, successMessage) => {
        const filename = sanitizeFilename(nameRef.value, fallbackName);
        nameRef.value = filename;

        if (!supportsNativeFileSave) {
            triggerJsonDownload(content, nameRef, fallbackName, successMessage);
            return;
        }

        try {
            let handle = handleType === 'panel' ? panelFileHandle : runtimeFileHandle;
            if (!handle || handle.name !== filename) {
                handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [
                        {
                            description: 'JSON Files',
                            accept: {
                                'application/json': ['.json'],
                            },
                        },
                    ],
                });
            } else {
                const confirmed = window.confirm(`将覆盖已保存的本地文件：${filename}\n\n是否继续？`);
                if (!confirmed) return;
            }
            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();
            if (handleType === 'panel') panelFileHandle = handle;
            else runtimeFileHandle = handle;
            ctx.showToast(successMessage, 'ok');
        } catch (error) {
            if (error && error.name === 'AbortError') return;
            triggerJsonDownload(content, nameRef, fallbackName);
            ctx.showToast('当前环境不支持直接写入本地，已回退为浏览器下载', 'warn', 4200);
        }
    };

    const exportPreviewJson = computed(() => JSON.stringify(ctx.getFullState(), (key, value) => {
        if (value === '') return undefined;
        if (value === null) return undefined;
        return value;
    }, 2));

    const openImportExport = (tab) => {
        ctx.importExportTab.value = tab;
        ctx.importConfigKind.value = 'panel';
        ctx.importJsonText.value = '';
        ctx.importError.value = '';
        ctx.modalContentReady.value = false;
        if (tab === 'export') resetExportFilenames();
        ctx.showImportExport.value = true;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                ctx.exportSnapshotPanel.value = exportPreviewJson.value;
                ctx.exportSnapshotRuntime.value = ctx.generatedJson.value;
                ctx.modalContentReady.value = true;
            });
        });
    };

    watch(ctx.exportPreviewTab, (newTab) => {
        if (!ctx.showImportExport.value || !ctx.modalContentReady.value) return;
        if (newTab === 'panel' && !ctx.exportSnapshotPanel.value) {
            ctx.exportSnapshotPanel.value = exportPreviewJson.value;
        }
        if (newTab === 'runtime' && !ctx.exportSnapshotRuntime.value) {
            ctx.exportSnapshotRuntime.value = ctx.generatedJson.value;
        }
    });

    const doExportDownload = async () => {
        await saveJsonFile(exportPreviewJson.value, ctx.panelExportFilename, buildDefaultPanelExportFilename(), 'panel', supportsNativeFileSave ? '面板配置已保存到本地' : '面板配置已下载');
    };

    const doExportRuntimeDownload = () => {
        const warnings = validateRuntimeConfig(ctx);
        const doDownload = async () => {
            await saveJsonFile(ctx.generatedJson.value, ctx.runtimeExportFilename, 'config.json', 'runtime', supportsNativeFileSave ? '运行配置已保存到本地' : '运行配置已下载');
        };
        if (warnings.length > 0) {
            ctx.showConfirm(`检测到以下问题，确认仍要下载吗？<br><br>${warnings.map((warning) => `• ${warning}`).join('<br>')}`, doDownload, {
                title: '配置校验警告',
                okText: '仍然下载',
                safe: true,
            });
        } else {
            doDownload();
        }
    };

    const doExportCopy = async () => {
        const ok = await ctx.copyToClipboard(exportPreviewJson.value);
        ctx.showToast(ok ? '面板配置已复制到剪贴板！' : '复制失败，请手动复制', ok ? 'ok' : 'err');
    };

    const doExportRuntimeCopy = async () => {
        const ok = await ctx.copyToClipboard(ctx.generatedJson.value);
        ctx.showToast(ok ? '运行配置已复制到剪贴板！' : '复制失败，请手动复制', ok ? 'ok' : 'err');
    };

    const applyImport = (data) => {
        if (!data || typeof data !== 'object') throw new Error('无效的 JSON 格式');
        resetPanelStateToDefaults();
        if (data._version && data._version !== '1.12') {
            ctx.showToast(`配置版本为 ${data._version}，当前面板适配 v1.12，部分字段可能不兼容`, 'warn', 5000);
        }
        if (data.fakeip) Object.assign(ctx.fakeip.value, data.fakeip);
        if (data.settings) {
            Object.assign(ctx.settings.value, data.settings);
            if (Array.isArray(ctx.settings.value.default_network_type)) {
                ctx.settings.value.default_network_type = ctx.settings.value.default_network_type.join(', ');
            }
            if (Array.isArray(ctx.settings.value.default_fallback_network_type)) {
                ctx.settings.value.default_fallback_network_type = ctx.settings.value.default_fallback_network_type.join(', ');
            }
        }
        if (data.tun) {
            Object.assign(ctx.tun.value, data.tun);
            ['include_interface', 'exclude_interface', 'include_package', 'exclude_package', 'route_exclude_address'].forEach((key) => {
                if (Array.isArray(ctx.tun.value[key])) {
                    ctx.tun.value[key] = ctx.tun.value[key].join('\n');
                }
            });
        }
        if (data.clashApi) Object.assign(ctx.clashApi.value, data.clashApi);
        if (data.ntp) {
            Object.assign(
                ctx.ntp.value,
                typeof ctx.normalizeNtp === 'function' ? ctx.normalizeNtp(data.ntp) : data.ntp,
            );
        }
        if (data.tproxy) {
            const incomingTproxy = { ...data.tproxy };
            if (!incomingTproxy.dns_hijack_mode) {
                incomingTproxy.dns_hijack_mode = incomingTproxy.dns_port ? 'nat' : 'tproxy';
            }
            if (incomingTproxy.ingress_iface === undefined && incomingTproxy.egress_iface === undefined) {
                const legacyIface = String(incomingTproxy.iface || '').trim();
                incomingTproxy.ingress_iface = legacyIface || '';
                incomingTproxy.egress_iface = legacyIface || '';
            } else {
                if (incomingTproxy.ingress_iface === undefined) incomingTproxy.ingress_iface = '';
                if (incomingTproxy.egress_iface === undefined) incomingTproxy.egress_iface = '';
            }
            delete incomingTproxy.iface;
            delete incomingTproxy.server_ports;
            Object.assign(ctx.tproxy.value, incomingTproxy);
            ctx.extraInbounds.value = Array.isArray(data.extraInbounds) ? data.extraInbounds.map(ctx.normalizeExtraInbound) : [];
        }
        if (typeof data.corsProxyEnabled === 'boolean') ctx.corsProxyEnabled.value = data.corsProxyEnabled;
        if (data.dnsList) {
            const importedDnsList = Array.isArray(data.dnsList)
                ? data.dnsList.map((dns, index) => (
                    typeof ctx.normalizeDnsServer === 'function'
                        ? ctx.normalizeDnsServer(dns, index)
                        : dns
                ))
                : data.dnsList;
            if (Array.isArray(importedDnsList)) {
                importedDnsList
                    .filter((dns) => dns && dns.type === 'fakeip')
                    .forEach(absorbFakeipServer);
                ctx.dnsList.value = importedDnsList.filter((dns) => dns && dns.type !== 'fakeip');
            } else {
                ctx.dnsList.value = importedDnsList;
            }
        }
        if (data.providers) ctx.providers.value = data.providers;
        if (data.nodes) ctx.nodes.value = data.nodes.map((node) => ctx.makeNode(node));
        if (data.groups) {
            ctx.groups.value = data.groups.map((group) => (
                typeof ctx.normalizeGroup === 'function'
                    ? ctx.normalizeGroup(group)
                    : { ...group, id: group.id || ctx.generateId('g') }
            ));
        }
        if (data.ruleSets) ctx.ruleSets.value = data.ruleSets.map((ruleSet) => ({ ...ruleSet, id: ruleSet.id || ctx.generateId('rs') }));
        if (data.routeRules) {
            ctx.routeRules.value = data.routeRules
                .map(ctx.migrateRule)
                .map((rule) => ({ ...rule, isEditing: false, draggable: false, id: rule.id || ctx.generateId('r') }));
        }
        ctx.showImportExport.value = false;
    };

    const importParsedJson = (data) => {
        if (looksLikePanelState(data) && !looksLikeRuntimeConfig(data)) {
            applyImport(data);
            ctx.showToast('配置导入成功！', 'ok');
            return;
        }
        if (looksLikeRuntimeConfig(data) && !looksLikePanelState(data)) {
            applyRuntimeImport(data);
            ctx.showToast('运行配置已导入，已按可识别字段尽力还原到面板。', 'ok', 4200);
            return;
        }
        if (ctx.importConfigKind.value === 'runtime') {
            applyRuntimeImport(data);
            ctx.showToast('运行配置已导入，已按可识别字段尽力还原到面板。', 'ok', 4200);
        } else {
            applyImport(data);
            ctx.showToast('配置导入成功！', 'ok');
        }
    };

    const doImportFile = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                importParsedJson(data);
            } catch (err) {
                ctx.importError.value = '文件解析失败：' + err.message;
            }
        };
        reader.readAsText(file);
    };

    const doImportText = () => {
        ctx.importError.value = '';
        try {
            const data = JSON.parse(ctx.importJsonText.value);
            importParsedJson(data);
        } catch (err) {
            ctx.importError.value = '文本解析失败：' + err.message;
        }
    };

    Object.assign(ctx, {
        exportPreviewJson,
        openImportExport,
        doExportDownload,
        doExportRuntimeDownload,
        doExportCopy,
        doExportRuntimeCopy,
        applyImport,
        applyRuntimeImport,
        doImportFile,
        doImportText,
        resetExportFilenames,
        supportsNativeFileSave,
    });
}
