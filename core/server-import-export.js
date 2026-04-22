export function setupServerImportExportCore(ctx) {
    const supportsNativeFileSave = typeof window.showSaveFilePicker === 'function';
    let panelFileHandle = null;
    let runtimeFileHandle = null;

    const sanitizeFilename = (rawName, fallbackName) => {
        const cleaned = String(rawName || '')
            .trim()
            .replace(/[\\/:*?"<>|]/g, '-')
            .replace(/\s+/g, ' ');
        const baseName = cleaned || fallbackName;
        return /\.json$/i.test(baseName) ? baseName : `${baseName}.json`;
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
        if (Array.isArray(data.serverInbounds)) ctx.serverInbounds.value = data.serverInbounds.map((item, index) => ctx.normalizeInbound(item, index));
        if (Array.isArray(data.routeRules)) ctx.routeRules.value = data.routeRules;
        ctx.showImportExport.value = false;
    };

    const doImportFile = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                applyPanelImport(data);
                ctx.showToast('服务端面板配置导入成功！', 'ok');
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
            applyPanelImport(data);
            ctx.showToast('服务端面板配置导入成功！', 'ok');
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
