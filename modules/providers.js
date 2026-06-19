import { parseProviderNodes } from './provider-parsers/index.js';

const { ref } = window.Vue;

export function setupProvidersModule(ctx) {
    const providers = ref([{ tag: 'MySub', url: '' }]);
    const corsProxyEnabled = ref(false);

    const addProvider = () => {
        providers.value.push({ tag: `Sub${providers.value.length + 1}`, url: '' });
    };

    const removeProvider = (index) => {
        ctx.showConfirm('确定要删除此订阅源吗？', () => providers.value.splice(index, 1), {
            title: '删除订阅源',
            okText: '删除',
        });
    };

    const coreParser = (text) => {
        const result = parseProviderNodes(text, ctx);
        if (result.nodes.length > 0) {
            ctx.nodes.value.push(...result.nodes);
        }
        return { count: result.count, firstNewIndex: result.firstNewIndex };
    };

    const PROXIES = [
        (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
        (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
    ];

    const tryFetch = async (url, timeout = 10000) => {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), timeout);
        try {
            const res = await fetch(url, { signal: ctrl.signal, mode: 'cors', credentials: 'omit' });
            clearTimeout(tid);
            if (!res.ok) return null;
            let text = await res.text();
            try {
                const json = JSON.parse(text);
                if (json && json.contents) text = json.contents;
            } catch {
                // ignore non-JSON body
            }
            return text && text.length > 10 ? text : null;
        } catch {
            clearTimeout(tid);
            return null;
        }
    };

    const fetchAndParse = async (index) => {
        const provider = providers.value[index];
        if (!provider.url) return ctx.showToast('请先填写订阅链接！', 'warn');
        ctx.isFetching.value = true;
        ctx.fetchStatus.value = null;

        ctx.fetchStatus.value = { type: 'loading', msg: '尝试直接拉取...' };
        let text = await tryFetch(provider.url, 8000);
        if (text) {
            const result = coreParser(text);
            if (result.count > 0) {
                if (typeof ctx.focusNodeCard === 'function') ctx.focusNodeCard(result.firstNewIndex);
                ctx.fetchStatus.value = { type: 'ok', msg: `直接拉取成功，导入 ${result.count} 个节点` };
                setTimeout(() => {
                    ctx.fetchStatus.value = null;
                }, 4000);
                ctx.isFetching.value = false;
                return;
            }
        }

        if (!corsProxyEnabled.value) {
            ctx.isFetching.value = false;
            ctx.fetchStatus.value = { type: 'warn', msg: '直接拉取失败。CORS 代理已关闭，请手动复制订阅内容到上方解析框。或在订阅区开启代理拉取（存在隐私风险）。' };
            return;
        }

        for (let i = 0; i < PROXIES.length; i++) {
            ctx.fetchStatus.value = { type: 'loading', msg: `尝试 CORS 代理 ${i + 1}/${PROXIES.length}...` };
            text = await tryFetch(PROXIES[i](provider.url), 12000);
            if (text) {
                const result = coreParser(text);
                if (result.count > 0) {
                    if (typeof ctx.focusNodeCard === 'function') ctx.focusNodeCard(result.firstNewIndex);
                    ctx.fetchStatus.value = { type: 'ok', msg: `代理拉取成功，导入 ${result.count} 个节点` };
                    setTimeout(() => {
                        ctx.fetchStatus.value = null;
                    }, 4000);
                    ctx.isFetching.value = false;
                    return;
                }
            }
        }

        ctx.isFetching.value = false;
        ctx.fetchStatus.value = { type: 'err', msg: '所有代理拉取均失败。请手动复制订阅内容到上方解析框后点击「提取节点」。' };
    };

    const parseManualText = () => {
        if (!ctx.rawPastedText.value.trim()) return ctx.showToast('请先粘贴内容！', 'warn');
        const result = coreParser(ctx.rawPastedText.value);
        if (result.count === 0) ctx.showToast('未能识别任何节点，请确认格式正确或 Base64 内容完整', 'err');
        else {
            if (typeof ctx.focusNodeCard === 'function') ctx.focusNodeCard(result.firstNewIndex);
            ctx.showToast(`本地解析成功，导入 ${result.count} 个节点`, 'ok');
            ctx.rawPastedText.value = '';
        }
    };

    Object.assign(ctx, {
        providers,
        corsProxyEnabled,
        addProvider,
        removeProvider,
        fetchAndParse,
        parseManualText,
    });
}
