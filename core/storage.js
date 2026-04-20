const { ref, watch, onUnmounted } = window.Vue;

export function setupStorageCore(ctx) {
    const STORAGE_KEY = 'singbox_web_config_v1_12_test';
    const LEGACY_STORAGE_KEYS = ['singbox_web_config'];
    const ALL_STORAGE_KEYS = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS];
    const lastSavedAt = ref('');
    const storageSavedAgo = ref('');

    const setBootNotice = (message, type = 'warn') => {
        try {
            sessionStorage.setItem('singbox_boot_notice', JSON.stringify({ message, type }));
        } catch {
            // ignore sessionStorage errors
        }
    };

    const consumeBootNotice = () => {
        try {
            const raw = sessionStorage.getItem('singbox_boot_notice');
            if (!raw) return;
            sessionStorage.removeItem('singbox_boot_notice');
            const notice = JSON.parse(raw);
            if (notice && notice.message) ctx.showToast(notice.message, notice.type || 'warn', 4500);
        } catch {
            // ignore sessionStorage errors
        }
    };

    const clearAllStorageKeys = () => {
        ALL_STORAGE_KEYS.forEach((key) => {
            try {
                localStorage.removeItem(key);
            } catch {
                // ignore localStorage errors
            }
        });
    };

    const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]';
    const isValidStoredStateShape = (state) => {
        if (!isPlainObject(state)) return false;

        const objectKeys = ['settings', 'fakeip', 'tun', 'clashApi', 'ntp', 'tproxy'];
        const arrayKeys = ['dnsList', 'providers', 'nodes', 'groups', 'ruleSets', 'routeRules', 'extraInbounds'];

        for (const key of objectKeys) {
            if (state[key] !== undefined && !isPlainObject(state[key])) return false;
        }
        for (const key of arrayKeys) {
            if (state[key] !== undefined && !Array.isArray(state[key])) return false;
        }
        return true;
    };

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
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                lastSavedAt.value = new Date().toISOString();
                updateStorageAgo();
            } catch {
                // ignore localStorage write errors
            }
        }, 400);
    };

    const loadLocalStorage = () => {
        for (const key of ALL_STORAGE_KEYS) {
            try {
                const stored = localStorage.getItem(key);
                if (!stored) continue;

                const state = JSON.parse(stored);
                if (!isValidStoredStateShape(state)) {
                    localStorage.removeItem(key);
                    setBootNotice('检测到损坏或旧版缓存，已自动忽略。', 'warn');
                    continue;
                }

                if (state._exported) {
                    const savedTime = new Date(state._exported).getTime();
                    if (Number.isFinite(savedTime) && Date.now() - savedTime > 86400000) {
                        localStorage.removeItem(key);
                        continue;
                    }
                }

                ctx.applyImport(state);
                if (state._exported) {
                    lastSavedAt.value = state._exported;
                    updateStorageAgo();
                }

                if (key !== STORAGE_KEY) {
                    try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx.getFullState()));
                        localStorage.removeItem(key);
                    } catch {
                        // ignore migration write errors
                    }
                }

                return true;
            } catch {
                try {
                    localStorage.removeItem(key);
                } catch {
                    // ignore localStorage errors
                }
                setBootNotice('缓存恢复失败，已自动清除异常缓存。', 'warn');
            }
        }
        return false;
    };

    const clearLocalStorage = () => {
        ctx.showConfirm('确定要清除本地缓存吗？刷新页面后将恢复默认配置。', () => {
            clearAllStorageKeys();
            lastSavedAt.value = '';
            storageSavedAgo.value = '';
            ctx.showToast('本地缓存已清除', 'ok');
        }, { title: '清除缓存', okText: '清除' });
    };

    const resetConfig = () => {
        ctx.showConfirm('确定要重置所有配置吗？此操作将清空当前所有内容并清除本地缓存。', () => {
            clearAllStorageKeys();
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
    consumeBootNotice();
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
