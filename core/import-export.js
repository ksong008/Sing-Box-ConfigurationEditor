const { computed, watch } = window.Vue;

export function setupImportExportCore(ctx) {
    const exportPreviewJson = computed(() => JSON.stringify(ctx.getFullState(), (key, value) => {
        if (value === '') return undefined;
        if (value === null) return undefined;
        return value;
    }, 2));

    const openImportExport = (tab) => {
        ctx.importExportTab.value = tab;
        ctx.importJsonText.value = '';
        ctx.importError.value = '';
        ctx.modalContentReady.value = false;
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

    const doExportDownload = () => {
        const blob = new Blob([exportPreviewJson.value], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `singbox-panel-config-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const validateConfig = () => {
        const warnings = [];
        if (ctx.nodes.value.length === 0 && ctx.groups.value.length === 0) warnings.push('没有任何出站节点或策略组');
        const finalTag = ctx.settings.value.final_outbound;
        const allOut = new Set([...ctx.groups.value.map((group) => group.tag), ...ctx.nodes.value.map((node) => node.tag), 'direct']);
        if (finalTag && !allOut.has(finalTag)) warnings.push(`默认路由出站 "${finalTag}" 不存在`);
        const dnsTagSet = new Set();
        let dnsDup = false;
        ctx.dnsList.value.forEach((dns) => {
            if (dns.tag) {
                if (dnsTagSet.has(dns.tag)) dnsDup = true;
                dnsTagSet.add(dns.tag);
            }
        });
        if (dnsDup) warnings.push('DNS 服务器存在重复 tag');
        if (ctx.duplicateOutboundTags.value.length > 0) warnings.push(`出站 tag 重名: ${ctx.duplicateOutboundTags.value.join(', ')}`);
        const emptyRuleSets = ctx.ruleSets.value.filter((ruleSet) => ruleSet.tag && !ruleSet.url);
        if (emptyRuleSets.length > 0) warnings.push(`${emptyRuleSets.length} 个规则集 URL 为空（已自动忽略）`);
        return warnings;
    };

    const doExportRuntimeDownload = () => {
        const warnings = validateConfig();
        const doDownload = () => {
            const blob = new Blob([ctx.generatedJson.value], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'config.json';
            a.click();
            URL.revokeObjectURL(a.href);
            ctx.showToast('运行配置已下载', 'ok');
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
        if (data._version && data._version !== '1.12') {
            ctx.showToast(`配置版本为 ${data._version}，当前面板适配 v1.12，部分字段可能不兼容`, 'warn', 5000);
        }
        if (data.fakeip) Object.assign(ctx.fakeip.value, data.fakeip);
        if (data.settings) Object.assign(ctx.settings.value, data.settings);
        if (data.tun) Object.assign(ctx.tun.value, data.tun);
        if (data.clashApi) Object.assign(ctx.clashApi.value, data.clashApi);
        if (data.ntp) Object.assign(ctx.ntp.value, data.ntp);
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
        if (data.dnsList) ctx.dnsList.value = data.dnsList;
        if (data.providers) ctx.providers.value = data.providers;
        if (data.nodes) ctx.nodes.value = data.nodes.map((node) => ctx.makeNode(node));
        if (data.groups) ctx.groups.value = data.groups.map((group) => ({ ...group, id: group.id || ctx.generateId('g') }));
        if (data.ruleSets) ctx.ruleSets.value = data.ruleSets.map((ruleSet) => ({ ...ruleSet, id: ruleSet.id || ctx.generateId('rs') }));
        if (data.routeRules) {
            ctx.routeRules.value = data.routeRules
                .map(ctx.migrateRule)
                .map((rule) => ({ ...rule, isEditing: false, draggable: false, id: rule.id || ctx.generateId('r') }));
        }
        ctx.showImportExport.value = false;
    };

    const doImportFile = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                applyImport(data);
                ctx.showToast('配置导入成功！', 'ok');
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
            applyImport(data);
            ctx.showToast('配置导入成功！', 'ok');
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
        doImportFile,
        doImportText,
    });
}
