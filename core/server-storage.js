const { watch } = window.Vue;

export function setupServerStorageCore(ctx) {
    const STORAGE_KEY = 'singbox_server_config_v1_12_testserver';

    const updateStorageAgo = () => {
        if (!ctx.lastSavedAt.value) return;
        const diff = Date.now() - new Date(ctx.lastSavedAt.value).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) ctx.storageSavedAgo.value = '刚刚';
        else if (minutes < 60) ctx.storageSavedAgo.value = `${minutes}分钟前`;
        else ctx.storageSavedAgo.value = `${Math.floor(minutes / 60)}小时前`;
    };

    let agoTimer = null;
    let saveTimer = null;

    const saveLocalStorage = () => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            try {
                const state = ctx.getFullState();
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                ctx.lastSavedAt.value = new Date().toISOString();
                updateStorageAgo();
            } catch {
                // ignore localStorage write errors
            }
        }, 300);
    };

    const loadLocalStorage = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return false;
            const state = JSON.parse(raw);
            if (!state || typeof state !== 'object') return false;
            if (state.settings) Object.assign(ctx.settings.value, state.settings);
            if (Array.isArray(state.dnsList)) ctx.dnsList.value = state.dnsList.map((item, index) => ctx.normalizeDnsServer(item, index));
            if (Array.isArray(state.serverInbounds)) ctx.serverInbounds.value = state.serverInbounds.map((item, index) => ctx.normalizeInbound(item, index));
            if (Array.isArray(state.routeRules)) ctx.routeRules.value = state.routeRules;
            if (state._exported) {
                ctx.lastSavedAt.value = state._exported;
                updateStorageAgo();
            }
            return true;
        } catch {
            return false;
        }
    };

    const clearLocalStorage = () => {
        ctx.showConfirm('确定要清除本地缓存吗？刷新页面后将恢复默认配置。', () => {
            localStorage.removeItem(STORAGE_KEY);
            ctx.lastSavedAt.value = '';
            ctx.storageSavedAgo.value = '';
            ctx.showToast('本地缓存已清除', 'ok');
        }, { title: '清除缓存', okText: '清除' });
    };

    const resetConfig = () => {
        ctx.showConfirm('确定要重置服务端配置吗？此操作将清空当前内容并清除本地缓存。', () => {
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        }, { title: '重置配置', okText: '重置并刷新' });
    };

    const copyConfig = async () => {
        ctx.copyIcon.value = 'fas fa-spinner fa-spin';
        ctx.copyText.value = '复制中...';
        const ok = await ctx.copyToClipboard(ctx.generatedJson.value);
        setTimeout(() => {
            ctx.copyIcon.value = ok ? 'fas fa-check' : 'fas fa-times';
            ctx.copyText.value = ok ? '已复制' : '复制失败';
            ctx.showToast(ok ? '服务端配置已复制到剪贴板！' : '复制失败，请手动复制', ok ? 'ok' : 'err');
            setTimeout(() => {
                ctx.copyIcon.value = 'fas fa-copy';
                ctx.copyText.value = '复制配置';
            }, 2000);
        }, 300);
    };

    watch([
        ctx.settings,
        ctx.dnsList,
        ctx.serverInbounds,
        ctx.routeRules,
    ], () => {
        saveLocalStorage();
    }, { deep: true });

    loadLocalStorage();
    agoTimer = setInterval(updateStorageAgo, 60000);

    Object.assign(ctx, {
        clearLocalStorage,
        resetConfig,
        copyConfig,
    });
}
