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

    const b64dec = (source) => {
        try {
            let base64 = source.replace(/[\r\n\s]/g, '').replace(/-/g, '+').replace(/_/g, '/');
            while (base64.length % 4) base64 += '=';
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            return new TextDecoder('utf-8').decode(bytes);
        } catch {
            return source;
        }
    };

    const parseVless = (line) => {
        try {
            const url = new URL(line);
            const params = url.searchParams;
            const tag = url.hash ? decodeURIComponent(url.hash.slice(1)) : `VLESS-${ctx.nodes.value.length + 1}`;
            const net = params.get('type') || '';
            const sec = params.get('security') || '';
            return ctx.makeNode({
                tag,
                type: 'vless',
                server: url.hostname,
                port: parseInt(url.port, 10) || 443,
                secret: url.username,
                sni: params.get('sni') || params.get('host') || '',
                transport: ['ws', 'grpc', 'http', 'httpupgrade', 'quic'].includes(net) ? net : '',
                path: params.get('path') || params.get('serviceName') || '/',
                ws_host: params.get('host') || '',
                flow: params.get('flow') || '',
                tls: sec === 'tls' || sec === 'reality',
                insecure: params.get('allowInsecure') === '1',
                reality: sec === 'reality',
                reality_pubkey: params.get('pbk') || '',
                reality_sid: params.get('sid') || '',
                utls_fingerprint: params.get('fp') || '',
                alpn: params.get('alpn') || '',
                collapsed: true,
            });
        } catch {
            return null;
        }
    };

    const parseTrojan = (line) => {
        try {
            const url = new URL(line);
            const params = url.searchParams;
            const tag = url.hash ? decodeURIComponent(url.hash.slice(1)) : `Trojan-${ctx.nodes.value.length + 1}`;
            const net = params.get('type') || '';
            const sec = params.get('security') || 'tls';
            return ctx.makeNode({
                tag,
                type: 'trojan',
                server: url.hostname,
                port: parseInt(url.port, 10) || 443,
                secret: url.username || decodeURIComponent(url.password || ''),
                sni: params.get('sni') || params.get('host') || '',
                transport: ['ws', 'grpc', 'http', 'httpupgrade'].includes(net) ? net : '',
                path: params.get('path') || params.get('serviceName') || '/',
                ws_host: params.get('host') || '',
                tls: sec === 'tls' || sec === 'reality',
                insecure: params.get('allowInsecure') === '1',
                reality: sec === 'reality',
                reality_pubkey: params.get('pbk') || '',
                reality_sid: params.get('sid') || '',
                utls_fingerprint: params.get('fp') || '',
                alpn: params.get('alpn') || '',
                collapsed: true,
            });
        } catch {
            return null;
        }
    };

    const parseVmess = (line) => {
        try {
            const payload = JSON.parse(b64dec(line.slice(8)));
            if (!payload.add) return null;
            const net = payload.net || '';
            return ctx.makeNode({
                tag: payload.ps || `VMess-${ctx.nodes.value.length + 1}`,
                type: 'vmess',
                server: payload.add,
                port: parseInt(payload.port, 10) || 443,
                secret: payload.id,
                sni: payload.sni || payload.host || '',
                transport: ['ws', 'grpc', 'http', 'httpupgrade'].includes(net) ? net : '',
                path: payload.path || payload.serviceName || '/',
                ws_host: payload.host || '',
                tls: payload.tls === 'tls',
                alpn: payload.alpn || '',
                collapsed: true,
            });
        } catch {
            return null;
        }
    };

    const parseSS = (line) => {
        try {
            const hashIndex = line.indexOf('#');
            const name = hashIndex !== -1 ? decodeURIComponent(line.slice(hashIndex + 1)) : `SS-${ctx.nodes.value.length + 1}`;
            const body = line.slice(5, hashIndex !== -1 ? hashIndex : undefined);
            let method = 'chacha20-ietf-poly1305';
            let password = '';
            let host = '';
            let port = 443;
            if (body.includes('@')) {
                const atIndex = body.lastIndexOf('@');
                let cred = body.slice(0, atIndex);
                if (!cred.includes(':')) cred = b64dec(cred);
                const colonIndex = cred.indexOf(':');
                method = cred.slice(0, colonIndex);
                password = cred.slice(colonIndex + 1);
                const match = body.slice(atIndex + 1).match(/^(.+):(\d+)$/);
                if (match) {
                    host = match[1];
                    port = parseInt(match[2], 10);
                }
            } else {
                const decoded = b64dec(body);
                const colonIndex = decoded.indexOf(':');
                const atIndex = decoded.lastIndexOf('@');
                if (atIndex !== -1) {
                    method = decoded.slice(0, colonIndex);
                    password = decoded.slice(colonIndex + 1, atIndex);
                    const match = decoded.slice(atIndex + 1).match(/^(.+):(\d+)$/);
                    if (match) {
                        host = match[1];
                        port = parseInt(match[2], 10);
                    }
                }
            }
            return ctx.makeNode({ tag: name, type: 'shadowsocks', server: host, port, secret: password, ss_method: method, tls: false, collapsed: true });
        } catch {
            return null;
        }
    };

    const parseHy2 = (line) => {
        try {
            const url = new URL(line.replace(/^hy2:\/\//, 'hysteria2://'));
            const tag = url.hash ? decodeURIComponent(url.hash.slice(1)) : `Hy2-${ctx.nodes.value.length + 1}`;
            return ctx.makeNode({
                tag,
                type: 'hysteria2',
                server: url.hostname,
                port: parseInt(url.port, 10) || 443,
                secret: url.password || url.username,
                sni: url.searchParams.get('sni') || '',
                insecure: url.searchParams.get('insecure') === '1',
                hy2_obfs_type: url.searchParams.get('obfs') || '',
                hy2_obfs_password: url.searchParams.get('obfs-password') || '',
                tls: true,
                collapsed: true,
            });
        } catch {
            return null;
        }
    };

    const parseTuic = (line) => {
        try {
            const url = new URL(line);
            const tag = url.hash ? decodeURIComponent(url.hash.slice(1)) : `TUIC-${ctx.nodes.value.length + 1}`;
            return ctx.makeNode({
                tag,
                type: 'tuic',
                server: url.hostname,
                port: parseInt(url.port, 10) || 443,
                secret: url.username,
                tuic_password: url.password,
                sni: url.searchParams.get('sni') || '',
                tuic_congestion: url.searchParams.get('congestion_control') || 'cubic',
                tuic_udp_relay_mode: url.searchParams.get('udp_relay_mode') || 'native',
                insecure: url.searchParams.get('allow_insecure') === '1',
                alpn: url.searchParams.get('alpn') || 'h3',
                tls: true,
                collapsed: true,
            });
        } catch {
            return null;
        }
    };

    const coreParser = (text) => {
        const firstNewIndex = ctx.nodes.value.length;
        let source = text.trim();
        const hasProtocol = ['vless://', 'vmess://', 'trojan://', 'ss://', 'hysteria2://', 'hy2://', 'tuic://', 'socks://', 'http://'].some((prefix) => source.includes(prefix));
        if (!hasProtocol) {
            try {
                source = b64dec(source);
            } catch {
                source = text.trim();
            }
        }
        const parsedNodes = [];
        source
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 5)
            .forEach((line) => {
                let node = null;
                if (line.startsWith('vless://')) node = parseVless(line);
                else if (line.startsWith('trojan://')) node = parseTrojan(line);
                else if (line.startsWith('vmess://')) node = parseVmess(line);
                else if (line.startsWith('ss://')) node = parseSS(line);
                else if (line.startsWith('hysteria2://') || line.startsWith('hy2://')) node = parseHy2(line);
                else if (line.startsWith('tuic://')) node = parseTuic(line);
                if (node) {
                    parsedNodes.push(ctx.makeNode({ ...node, collapsed: true }));
                }
            });
        if (parsedNodes.length > 0) {
            ctx.nodes.value.push(...parsedNodes);
        }
        return { count: parsedNodes.length, firstNewIndex };
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
