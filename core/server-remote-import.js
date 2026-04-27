export function setupServerRemoteImportCore(ctx) {
    const b64dec = (source) => {
        try {
            let base64 = String(source || '').replace(/[\r\n\s]/g, '').replace(/-/g, '+').replace(/_/g, '/');
            while (base64.length % 4) base64 += '=';
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
            return new TextDecoder('utf-8').decode(bytes);
        } catch {
            return String(source || '');
        }
    };

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
            return text && text.length > 5 ? text : null;
        } catch {
            clearTimeout(tid);
            return null;
        }
    };

    const PROXIES = [
        (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
        (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    ];

    const fetchSubscriptionText = async (url) => {
        const direct = await tryFetch(url);
        if (direct) return direct;
        if (!ctx.settings?.value?.remote_import_use_cors) return null;
        for (const proxy of PROXIES) {
            const proxied = await tryFetch(proxy(url));
            if (proxied) return proxied;
        }
        return null;
    };

    const pickFirstSupportedLine = (text) => {
        let source = String(text || '').trim();
        const hasProtocol = ['vless://', 'vmess://', 'trojan://', 'ss://', 'hysteria2://', 'hy2://', 'tuic://'].some((prefix) => source.includes(prefix));
        if (!hasProtocol) source = b64dec(source);
        return source
            .split(/\r?\n/)
            .map((line) => line.trim())
            .find((line) => line.startsWith('vless://') || line.startsWith('vmess://') || line.startsWith('trojan://') || line.startsWith('ss://') || line.startsWith('hysteria2://') || line.startsWith('hy2://') || line.startsWith('tuic://')) || '';
    };

    const applyCommonLinkFields = (outbound, url) => {
        const transportType = url.searchParams.get('type') || '';
        outbound.server = url.hostname || '';
        outbound.server_port = parseInt(url.port, 10) || 443;
        outbound.server_name = url.searchParams.get('sni') || url.searchParams.get('host') || outbound.server_name || '';
        outbound.alpn = url.searchParams.get('alpn') || '';
        outbound.allow_insecure = url.searchParams.get('allowInsecure') === '1' || url.searchParams.get('allow_insecure') === '1' || url.searchParams.get('insecure') === '1';
        outbound.transport = transportType === 'tcp' ? '' : transportType;
        outbound.transport_path = url.searchParams.get('path') || '';
        outbound.transport_host = url.searchParams.get('host') || '';
        outbound.transport_service_name = url.searchParams.get('serviceName') || '';
        outbound.reality_public_key = url.searchParams.get('pbk') || '';
        outbound.reality_short_id = url.searchParams.get('sid') || '';
    };

    const parseVlessOutbound = (line, outbound) => {
        const url = new URL(line);
        outbound.type = 'vless';
        outbound.tag = url.hash ? decodeURIComponent(url.hash.slice(1)) : outbound.tag;
        outbound.uuid = decodeURIComponent(url.username || '');
        outbound.flow = url.searchParams.get('flow') || '';
        outbound.tls_enabled = ['tls', 'reality'].includes(url.searchParams.get('security') || '');
        applyCommonLinkFields(outbound, url);
    };

    const parseTrojanOutbound = (line, outbound) => {
        const url = new URL(line);
        outbound.type = 'trojan';
        outbound.tag = url.hash ? decodeURIComponent(url.hash.slice(1)) : outbound.tag;
        outbound.password = decodeURIComponent(url.username || url.password || '');
        outbound.tls_enabled = (url.searchParams.get('security') || 'tls') !== 'none';
        applyCommonLinkFields(outbound, url);
    };

    const parseSsOutbound = (line, outbound) => {
        const hashIndex = line.indexOf('#');
        const body = line.slice(5, hashIndex !== -1 ? hashIndex : undefined);
        let method = '2022-blake3-aes-128-gcm';
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
        outbound.type = 'shadowsocks';
        outbound.tag = hashIndex !== -1 ? decodeURIComponent(line.slice(hashIndex + 1)) : outbound.tag;
        outbound.server = host;
        outbound.server_port = port;
        outbound.method = method;
        outbound.password = password;
        outbound.tls_enabled = false;
        outbound.transport = '';
        outbound.transport_path = '';
        outbound.transport_host = '';
        outbound.transport_service_name = '';
        outbound.server_name = '';
        outbound.alpn = '';
    };

    const parseVmessOutbound = (line, outbound) => {
        const payload = JSON.parse(b64dec(line.slice(8)));
        outbound.type = 'vmess';
        outbound.tag = payload.ps || outbound.tag;
        outbound.server = payload.add || '';
        outbound.server_port = parseInt(payload.port, 10) || 443;
        outbound.uuid = payload.id || '';
        outbound.alter_id = parseInt(payload.aid, 10) || 0;
        outbound.security = payload.scy || 'auto';
        outbound.server_name = payload.sni || payload.host || '';
        outbound.alpn = payload.alpn || '';
        outbound.tls_enabled = payload.tls === 'tls';
        outbound.transport = ['ws', 'grpc', 'http', 'httpupgrade', 'quic'].includes(payload.net || '') ? payload.net : '';
        outbound.transport_path = payload.net === 'grpc' ? (payload.serviceName || payload.path || '') : (payload.path || '');
        outbound.transport_host = payload.host || '';
        outbound.transport_service_name = payload.serviceName || '';
    };

    const parseHysteria2Outbound = (line, outbound) => {
        const url = new URL(line.replace(/^hy2:\/\//, 'hysteria2://'));
        outbound.type = 'hysteria2';
        outbound.tag = url.hash ? decodeURIComponent(url.hash.slice(1)) : outbound.tag;
        outbound.server = url.hostname || '';
        outbound.server_port = parseInt(url.port, 10) || 443;
        outbound.password = decodeURIComponent(url.password || url.username || '');
        outbound.server_name = url.searchParams.get('sni') || '';
        outbound.alpn = url.searchParams.get('alpn') || '';
        outbound.allow_insecure = url.searchParams.get('insecure') === '1';
        outbound.hy2_obfs_type = url.searchParams.get('obfs') || '';
        outbound.hy2_obfs_password = url.searchParams.get('obfs-password') || '';
        outbound.network = url.searchParams.get('network') || '';
        outbound.tls_enabled = true;
    };

    const parseTuicOutbound = (line, outbound) => {
        const url = new URL(line);
        outbound.type = 'tuic';
        outbound.tag = url.hash ? decodeURIComponent(url.hash.slice(1)) : outbound.tag;
        outbound.server = url.hostname || '';
        outbound.server_port = parseInt(url.port, 10) || 443;
        outbound.uuid = decodeURIComponent(url.username || '');
        outbound.password = decodeURIComponent(url.password || '');
        outbound.server_name = url.searchParams.get('sni') || '';
        outbound.alpn = url.searchParams.get('alpn') || '';
        outbound.allow_insecure = url.searchParams.get('allow_insecure') === '1';
        outbound.tuic_congestion = url.searchParams.get('congestion_control') || 'cubic';
        outbound.tuic_udp_relay_mode = url.searchParams.get('udp_relay_mode') || 'native';
        outbound.tuic_udp_over_stream = url.searchParams.get('udp_over_stream') === '1' || url.searchParams.get('udp_over_stream') === 'true';
        outbound.network = url.searchParams.get('network') || '';
        outbound.tls_enabled = true;
    };

    const importRemoteOutboundFromSource = async (outbound) => {
        const source = String(outbound.import_source || '').trim();
        if (!source) {
            ctx.showToast('请先填写订阅链接或节点原文', 'warn');
            return;
        }

        let content = source;
        if (/^https?:\/\//i.test(source)) {
            const fetched = await fetchSubscriptionText(source);
            if (!fetched) {
                ctx.showToast('读取订阅失败，请检查链接或网络/CORS 状态', 'err');
                return;
            }
            content = fetched;
        }

        const line = pickFirstSupportedLine(content);
        if (!line) {
            ctx.showToast('未识别到可导入的 VLESS / VMess / Trojan / Shadowsocks / Hysteria2 / TUIC 节点', 'warn');
            return;
        }

        try {
            if (line.startsWith('vless://')) parseVlessOutbound(line, outbound);
            else if (line.startsWith('vmess://')) parseVmessOutbound(line, outbound);
            else if (line.startsWith('trojan://')) parseTrojanOutbound(line, outbound);
            else if (line.startsWith('ss://')) parseSsOutbound(line, outbound);
            else if (line.startsWith('hysteria2://') || line.startsWith('hy2://')) parseHysteria2Outbound(line, outbound);
            else if (line.startsWith('tuic://')) parseTuicOutbound(line, outbound);
            else {
                ctx.showToast('当前仅支持导入 VLESS / VMess / Trojan / Shadowsocks / Hysteria2 / TUIC 远端出站', 'warn');
                return;
            }
            if (typeof ctx.normalizeRemoteOutbound === 'function') {
                const index = Array.isArray(ctx.remoteOutbounds?.value)
                    ? ctx.remoteOutbounds.value.findIndex((item) => item === outbound || item?.id === outbound?.id)
                    : -1;
                const normalized = ctx.normalizeRemoteOutbound({
                    ...outbound,
                    id: outbound.id,
                    collapsed: outbound.collapsed,
                }, index >= 0 ? index : 0);
                Object.assign(outbound, normalized);
            }
            ctx.showToast('远端出站已根据订阅链接自动填充', 'ok');
        } catch (error) {
            ctx.showToast(`导入失败：${error.message || error}`, 'err');
        }
    };

    Object.assign(ctx, {
        importRemoteOutboundFromSource,
    });
}
