const { ref, watch, onUnmounted } = window.Vue;

export function setupStorageCore(ctx) {
    const lastSavedAt = ref('');
    const storageSavedAgo = ref('');

    const updateStorageAgo = () => {
        if (!lastSavedAt.value) return;
        const diff = Date.now() - new Date(lastSavedAt.value).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) storageSavedAgo.value = '刚刚';
        else if (minutes < 60) storageSavedAgo.value = `${minutes}分钟前`;
        else storageSavedAgo.value = `${Math.floor(minutes / 60)}小时前`;
    };

    let agoTimer = null;
    let saveTimer = null;

    const saveLocalStorage = () => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            try {
                const state = ctx.getFullState();
                localStorage.setItem('singbox_web_config', JSON.stringify(state));
                lastSavedAt.value = new Date().toISOString();
                updateStorageAgo();
            } catch {
                // ignore localStorage write errors
            }
        }, 400);
    };

    const loadLocalStorage = () => {
        try {
            const stored = localStorage.getItem('singbox_web_config');
            if (!stored) return false;
            const state = JSON.parse(stored);
            if (state._exported) {
                const savedTime = new Date(state._exported).getTime();
                if (Date.now() - savedTime > 86400000) {
                    localStorage.removeItem('singbox_web_config');
                    return false;
                }
            }
            ctx.applyImport(state);
            if (state._exported) {
                lastSavedAt.value = state._exported;
                updateStorageAgo();
            }
            return true;
        } catch {
            return false;
        }
    };

    const clearLocalStorage = () => {
        ctx.showConfirm('确定要清除本地缓存吗？刷新页面后将恢复默认配置。', () => {
            localStorage.removeItem('singbox_web_config');
            lastSavedAt.value = '';
            storageSavedAgo.value = '';
            ctx.showToast('本地缓存已清除', 'ok');
        }, { title: '清除缓存', okText: '清除' });
    };

    const resetConfig = () => {
        ctx.showConfirm('确定要重置所有配置吗？此操作将清空当前所有内容并清除本地缓存。', () => {
            localStorage.removeItem('singbox_web_config');
            location.reload();
        }, { title: '重置配置', okText: '重置并刷新', safe: false });
    };

    const copyConfig = async () => {
        ctx.copyIcon.value = 'fas fa-spinner fa-spin';
        ctx.copyText.value = '复制中...';
        const ok = await ctx.copyToClipboard(ctx.generatedJson.value);
        setTimeout(() => {
            if (ok) {
                ctx.copyIcon.value = 'fas fa-check';
                ctx.copyText.value = '已复制';
                ctx.showToast('运行配置已复制到剪贴板！', 'ok');
            } else {
                ctx.copyIcon.value = 'fas fa-times';
                ctx.copyText.value = '复制失败';
                ctx.showToast('复制失败，请手动全选复制', 'err');
            }
            setTimeout(() => {
                ctx.copyIcon.value = 'fas fa-copy';
                ctx.copyText.value = '复制配置';
            }, 2000);
        }, 300);
    };

    watch([
        ctx.settings,
        ctx.fakeip,
        ctx.tun,
        ctx.clashApi,
        ctx.ntp,
        ctx.tproxy,
        ctx.dnsList,
        ctx.providers,
        ctx.nodes,
        ctx.groups,
        ctx.ruleSets,
        ctx.routeRules,
        ctx.extraInbounds,
        ctx.corsProxyEnabled,
    ], () => {
        saveLocalStorage();
    }, { deep: true });

    loadLocalStorage();
    agoTimer = setInterval(updateStorageAgo, 60000);

    onUnmounted(() => {
        clearInterval(agoTimer);
        clearTimeout(saveTimer);
    });

    Object.assign(ctx, {
        lastSavedAt,
        storageSavedAgo,
        clearLocalStorage,
        resetConfig,
        copyConfig,
    });
}
