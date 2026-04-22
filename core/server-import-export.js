export function setupServerImportExportCore(ctx) {
    const supportsNativeFileSave = typeof window.showSaveFilePicker === 'function';
    let panelFileHandle = null;
    let runtimeFileHandle = null;

    const csv = (value) => (
        Array.isArray(value)
            ? value.map((item) => String(item).trim()).filter(Boolean).join(',')
            : String(value || '')
    );

    const sanitizeFilename = (rawName, fallbackName) => {
        const cleaned = String(rawName || '')
            .trim()
            .replace(/[\\/:*?"<>|]/g, '-')
            .replace(/\s+/g, ' ');
        const baseName = cleaned || fallbackName;
        return /\.json$/i.test(baseName) ? baseName : `${baseName}.json`;
    };

    const parseJsonLoose = (source) => {
        const text = String(source || '').replace(/^\uFEFF/, '');
        let out = '';
        let inString = false;
        let quoteChar = '';
        let escaped = false;
        let lineComment = false;
        let blockComment = false;

        for (let i = 0; i < text.length; i += 1) {
            const ch = text[i];
            const next = text[i + 1];

            if (lineComment) {
                if (ch === '\n') {
                    lineComment = false;
                    out += ch;
                }
                continue;
            }

            if (blockComment) {
                if (ch === '*' && next === '/') {
                    blockComment = false;
                    i += 1;
                }
                continue;
            }

            if (inString) {
                out += ch;
                if (escaped) {
                    escaped = false;
                } else if (ch === '\\') {
                    escaped = true;
                } else if (ch === quoteChar) {
                    inString = false;
                    quoteChar = '';
                }
                continue;
            }

            if (ch === '"' || ch === '\'') {
                inString = true;
                quoteChar = ch;
                out += ch;
                continue;
            }

            if (ch === '/' && next === '/') {
                lineComment = true;
                i += 1;
                continue;
            }

            if (ch === '/' && next === '*') {
                blockComment = true;
                i += 1;
                continue;
            }

            out += ch;
        }

        const stripped = out.replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(stripped);
    };

    const resetExportFilenames = () => {
        ctx.panelExportFilename.value = 'singbox-server-panel-config.json';
        ctx.runtimeExportFilename.value = 'server-config.json';
    };

    const saveJsonFile = async (content, nameRef, fallbackName, handleType, successMessage) => {
        const filename = sanitizeFilename(nameRef.value, fallbackName);
        nameRef.value = filename;

        if (!supportsNativeFileSave) {
            const blob = new Blob([content], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            URL.revokeObjectURL(a.href);
            ctx.showToast(successMessage, 'ok');
            return;
        }

        let handle = handleType === 'panel' ? panelFileHandle : runtimeFileHandle;
        if (!handle || handle.name !== filename) {
            handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [
                    {
                        description: 'JSON Files',
                        accept: { 'application/json': ['.json'] },
                    },
                ],
            });
        } else if (!window.confirm(`将覆盖已保存的本地文件：${filename}\n\n是否继续？`)) {
            return;
        }

        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        if (handleType === 'panel') panelFileHandle = handle;
        else runtimeFileHandle = handle;
        ctx.showToast(successMessage, 'ok');
    };

    const applyPanelImport = (data) => {
        if (!data || typeof data !== 'object') throw new Error('无效的 JSON 格式');
        if (data.settings) Object.assign(ctx.settings.value, data.settings);
        if (Array.isArray(data.dnsList)) ctx.dnsList.value = data.dnsList.map((item, index) => ctx.normalizeDnsServer(item, index));
        if (Array.isArray(data.remoteOutbounds)) ctx.remoteOutbounds.value = data.remoteOutbounds.map((item, index) => ctx.normalizeRemoteOutbound(item, index));
        if (Array.isArray(data.ruleSets)) ctx.ruleSets.value = data.ruleSets.map((item, index) => ctx.normalizeRuleSet(item, index));
        if (Array.isArray(data.serverInbounds)) ctx.serverInbounds.value = data.serverInbounds.map((item, index) => ctx.normalizeInbound(item, index));
        if (Array.isArray(data.routeRules)) ctx.routeRules.value = data.routeRules.map((item, index) => ctx.normalizeRouteRule(item, index));
        if (ctx.sanitizeLegacySpecialOutbounds) ctx.sanitizeLegacySpecialOutbounds();
        if (ctx.pruneLegacySeededDefaults) ctx.pruneLegacySeededDefaults();
        ctx.showImportExport.value = false;
    };

    const applyRuntimeImport = (data) => {
        if (!data || typeof data !== 'object') throw new Error('无效的 runtime JSON');

        if (data.log && typeof data.log === 'object' && data.log.level) {
            ctx.settings.value.log_level = data.log.level;
        }

        if (data.dns && typeof data.dns === 'object') {
            if (Array.isArray(data.dns.servers)) ctx.dnsList.value = data.dns.servers.map((item, index) => ctx.normalizeDnsServer(item, index));
            ctx.settings.value.dns_strategy = data.dns.strategy || ctx.settings.value.dns_strategy;
            ctx.settings.value.dns_final = data.dns.final || '';
            ctx.settings.value.dns_disable_cache = !!data.dns.disable_cache;
            ctx.settings.value.dns_disable_expire = !!data.dns.disable_expire;
            ctx.settings.value.dns_cache_capacity = data.dns.cache_capacity ?? null;
            ctx.settings.value.dns_client_subnet = data.dns.client_subnet || '';
        }

        const supportedInboundTypes = new Set(['vless', 'vmess', 'trojan', 'shadowsocks', 'hysteria2', 'tuic', 'hysteria', 'anytls', 'shadowtls']);
        const supportedOutboundTypes = new Set(['vless', 'vmess', 'trojan', 'shadowsocks', 'hysteria2', 'tuic', 'wireguard']);
        const builtinOutboundTags = new Set(['direct', 'block', 'dns', 'dns-out']);

        if (Array.isArray(data.inbounds)) {
            ctx.serverInbounds.value = data.inbounds
                .filter((item) => supportedInboundTypes.has(item.type))
                .map((item, index) => ctx.normalizeInbound({ ...item, collapsed: true }, index));
        }

        if (Array.isArray(data.outbounds)) {
            ctx.remoteOutbounds.value = data.outbounds
                .filter((item) => supportedOutboundTypes.has(item.type) && !builtinOutboundTags.has(item.tag))
                .map((item, index) => ctx.normalizeRemoteOutbound({ ...item, collapsed: true }, index));
        }

        if (data.route && typeof data.route === 'object') {
            ctx.settings.value.route_final = data.route.final || 'direct';
            ctx.settings.value.auto_detect_interface = !!data.route.auto_detect_interface;

            if (Array.isArray(data.route.rule_set)) {
                ctx.ruleSets.value = data.route.rule_set.map((item, index) => ctx.normalizeRuleSet({ ...item, collapsed: true }, index));
                const firstRemote = ctx.ruleSets.value.find((item) => item.source_type === 'remote');
                if (firstRemote) {
                    ctx.settings.value.rule_set_download_detour = firstRemote.download_detour || 'direct';
                    if (firstRemote.url.includes('cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat')) ctx.settings.value.rule_set_cdn = true;
                    else if (firstRemote.url.includes('raw.githubusercontent.com/MetaCubeX/meta-rules-dat')) ctx.settings.value.rule_set_cdn = false;
                }
            } else {
                ctx.ruleSets.value = [];
            }

            if (Array.isArray(data.route.rules)) {
                ctx.routeRules.value = data.route.rules
                    .map((rule, index) => {
                        let match_type = '';
                        let match_value = '';
                        if (rule.rule_set) {
                            match_type = 'rule_set';
                            match_value = csv(rule.rule_set);
                        } else if (rule.protocol) {
                            match_type = 'protocol';
                            match_value = csv(rule.protocol);
                        } else if (rule.port !== undefined) {
                            match_type = 'port';
                            match_value = csv(rule.port);
                        } else if (rule.inbound) {
                            match_type = 'inbound';
                            match_value = csv(rule.inbound);
                        } else if (rule.domain_suffix) {
                            match_type = 'domain_suffix';
                            match_value = csv(rule.domain_suffix);
                        } else {
                            return null;
                        }

                        const action = rule.action || (rule.outbound ? 'route' : 'route');
                        return ctx.normalizeRouteRule({
                            id: rule.id,
                            enabled: true,
                            name: rule.name || `导入规则 ${index + 1}`,
                            match_type,
                            match_value,
                            action,
                            outbound: rule.outbound || 'direct',
                            collapsed: true,
                        }, index);
                    })
                    .filter(Boolean);
            } else {
                ctx.routeRules.value = [];
            }
        }

        if (ctx.sanitizeLegacySpecialOutbounds) ctx.sanitizeLegacySpecialOutbounds();
        if (ctx.pruneLegacySeededDefaults) ctx.pruneLegacySeededDefaults();
        ctx.showImportExport.value = false;
    };

    const detectImportKind = (data) => {
        if (data && typeof data === 'object') {
            if (Array.isArray(data.inbounds) || Array.isArray(data.outbounds) || data.route || data.dns) return 'runtime';
            if (data.settings || data.serverInbounds || data.remoteOutbounds || data.ruleSets || data.routeRules) return 'panel';
        }
        return ctx.settings.value.import_mode || 'panel';
    };

    const applyImportedJson = (data) => {
        const kind = detectImportKind(data);
        if (kind === 'runtime') {
            applyRuntimeImport(data);
            ctx.showToast('服务端运行配置导入成功！', 'ok');
        } else {
            applyPanelImport(data);
            ctx.showToast('服务端面板配置导入成功！', 'ok');
        }
    };

    const doImportFile = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = parseJsonLoose(ev.target.result);
                applyImportedJson(data);
            } catch (err) {
                ctx.importError.value = '文件解析失败：' + err.message;
            }
        };
        reader.readAsText(file);
    };

    const doImportText = () => {
        ctx.importError.value = '';
        try {
            const data = parseJsonLoose(ctx.importJsonText.value);
            applyImportedJson(data);
        } catch (err) {
            ctx.importError.value = '文本解析失败：' + err.message;
        }
    };

    const openImportExport = (tab) => {
        ctx.importExportTab.value = tab;
        ctx.importJsonText.value = '';
        ctx.importError.value = '';
        ctx.modalContentReady.value = false;
        if (tab === 'export') resetExportFilenames();
        ctx.showImportExport.value = true;
        requestAnimationFrame(() => {
            ctx.modalContentReady.value = true;
        });
    };

    const doExportDownload = async () => {
        await saveJsonFile(JSON.stringify(ctx.getFullState(), null, 2), ctx.panelExportFilename, 'singbox-server-panel-config.json', 'panel', supportsNativeFileSave ? '服务端面板配置已保存到本地' : '服务端面板配置已下载');
    };

    const doExportRuntimeDownload = async () => {
        await saveJsonFile(ctx.generatedJson.value, ctx.runtimeExportFilename, 'server-config.json', 'runtime', supportsNativeFileSave ? '服务端运行配置已保存到本地' : '服务端运行配置已下载');
    };

    const doExportCopy = async () => {
        const ok = await ctx.copyToClipboard(JSON.stringify(ctx.getFullState(), null, 2));
        ctx.showToast(ok ? '服务端面板配置已复制到剪贴板！' : '复制失败，请手动复制', ok ? 'ok' : 'err');
    };

    const doExportRuntimeCopy = async () => {
        const ok = await ctx.copyToClipboard(ctx.generatedJson.value);
        ctx.showToast(ok ? '服务端运行配置已复制到剪贴板！' : '复制失败，请手动复制', ok ? 'ok' : 'err');
    };

    Object.assign(ctx, {
        openImportExport,
        doExportDownload,
        doExportRuntimeDownload,
        doExportCopy,
        doExportRuntimeCopy,
        doImportFile,
        doImportText,
        supportsNativeFileSave,
        resetExportFilenames,
    });
}
