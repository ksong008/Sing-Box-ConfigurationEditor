const { computed } = window.Vue;

const isWildcardHost = (host) => ['::', '0.0.0.0', '[::]', '::0', ''].includes(String(host || '').trim());

const encodeBase64 = (text) => {
    const bytes = new TextEncoder().encode(String(text || ''));
    let binary = '';
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary);
};

const displayUserLabel = (user, fallback) => user?.name || user?.uuid || fallback;

const formatTag = (inbound, user, fallback) => {
    const base = inbound.share_name_prefix || inbound.tag || inbound.type;
    const userPart = displayUserLabel(user, fallback || 'user');
    return `${base}-${userPart}`;
};

const pickShareAddress = (inbound) => {
    const candidates = [
        inbound.share_server,
        inbound.tls_server_name,
        inbound.reality_server,
        inbound.transport_host && !String(inbound.transport_host).includes(',') ? inbound.transport_host : '',
        isWildcardHost(inbound.listen) ? '' : inbound.listen,
    ];
    const server = candidates.find((value) => typeof value === 'string' && value.trim()) || '';
    const port = parseInt(String(inbound.share_port || inbound.listen_port || ''), 10);
    return {
        server: server.trim(),
        port: Number.isInteger(port) && port > 0 ? port : null,
    };
};

const appendCommonTlsParams = (url, inbound) => {
    if (inbound.tls_server_name) url.searchParams.set('sni', inbound.tls_server_name);
    if (inbound.share_allow_insecure) url.searchParams.set('allowInsecure', '1');
    if (inbound.tls_alpn) url.searchParams.set('alpn', inbound.tls_alpn);
};

const appendTransportParams = (url, inbound) => {
    const transport = inbound.transport || 'tcp';
    url.searchParams.set('type', transport);
    if (['ws', 'http', 'httpupgrade'].includes(transport) && inbound.transport_path) {
        url.searchParams.set('path', inbound.transport_path);
    }
    if (transport === 'grpc' && (inbound.transport_service_name || inbound.transport_path)) {
        url.searchParams.set('serviceName', inbound.transport_service_name || inbound.transport_path);
    }
    if (['ws', 'http', 'httpupgrade'].includes(transport) && inbound.transport_host) {
        url.searchParams.set('host', inbound.transport_host);
    }
};

const buildVlessLink = (inbound, user, address) => {
    if (!user.uuid) return null;
    if (!address.server || !address.port) return null;
    const url = new URL(`vless://${encodeURIComponent(user.uuid)}@${address.server}:${address.port}`);
    appendTransportParams(url, inbound);
    if (inbound.reality_enabled) {
        if (!inbound.share_reality_public_key) return null;
        url.searchParams.set('security', 'reality');
        appendCommonTlsParams(url, inbound);
        url.searchParams.set('pbk', inbound.share_reality_public_key);
        if (inbound.reality_short_id) url.searchParams.set('sid', inbound.reality_short_id);
        if (inbound.share_utls_fingerprint) url.searchParams.set('fp', inbound.share_utls_fingerprint);
    } else if (inbound.tls_enabled) {
        url.searchParams.set('security', 'tls');
        appendCommonTlsParams(url, inbound);
        if (inbound.share_utls_fingerprint) url.searchParams.set('fp', inbound.share_utls_fingerprint);
    } else {
        url.searchParams.set('security', 'none');
    }
    if (user.flow) url.searchParams.set('flow', user.flow);
    url.hash = encodeURIComponent(formatTag(inbound, user, 'vless'));
    return url.toString();
};

const buildTrojanLink = (inbound, user, address) => {
    const secret = user.password || inbound.ss_password;
    if (!secret || !address.server || !address.port) return null;
    const url = new URL(`trojan://${encodeURIComponent(secret)}@${address.server}:${address.port}`);
    appendTransportParams(url, inbound);
    if (inbound.reality_enabled) {
        if (!inbound.share_reality_public_key) return null;
        url.searchParams.set('security', 'reality');
        appendCommonTlsParams(url, inbound);
        url.searchParams.set('pbk', inbound.share_reality_public_key);
        if (inbound.reality_short_id) url.searchParams.set('sid', inbound.reality_short_id);
        if (inbound.share_utls_fingerprint) url.searchParams.set('fp', inbound.share_utls_fingerprint);
    } else {
        url.searchParams.set('security', inbound.tls_enabled ? 'tls' : 'none');
        if (inbound.tls_enabled) appendCommonTlsParams(url, inbound);
        if (inbound.share_utls_fingerprint) url.searchParams.set('fp', inbound.share_utls_fingerprint);
    }
    url.hash = encodeURIComponent(formatTag(inbound, user, 'trojan'));
    return url.toString();
};

const buildVmessLink = (inbound, user, address) => {
    if (!user.uuid || !address.server || !address.port) return null;
    const payload = {
        v: '2',
        ps: formatTag(inbound, user, 'vmess'),
        add: address.server,
        port: String(address.port),
        id: user.uuid,
        aid: String(user.alterId || 0),
        net: inbound.transport || 'tcp',
        type: 'none',
        host: inbound.transport_host || '',
        path: inbound.transport === 'grpc' ? (inbound.transport_service_name || inbound.transport_path || '') : (inbound.transport_path || ''),
        tls: inbound.tls_enabled ? 'tls' : '',
        sni: inbound.tls_server_name || '',
        alpn: inbound.tls_alpn || '',
    };
    return `vmess://${encodeBase64(JSON.stringify(payload))}`;
};

const buildShadowsocksLink = (inbound, user, address) => {
    const password = user?.password || inbound.ss_password;
    if (!password || !address.server || !address.port || !inbound.ss_method) return null;
    const cred = encodeBase64(`${inbound.ss_method}:${password}`);
    return `ss://${cred}@${address.server}:${address.port}#${encodeURIComponent(formatTag(inbound, user, 'ss'))}`;
};

const buildHy2Link = (inbound, user, address) => {
    const password = user.password;
    if (!password || !address.server || !address.port) return null;
    const url = new URL(`hysteria2://${encodeURIComponent(password)}@${address.server}:${address.port}`);
    if (inbound.tls_server_name) url.searchParams.set('sni', inbound.tls_server_name);
    if (inbound.share_allow_insecure) url.searchParams.set('insecure', '1');
    if (inbound.hy2_obfs_type) url.searchParams.set('obfs', inbound.hy2_obfs_type);
    if (inbound.hy2_obfs_password) url.searchParams.set('obfs-password', inbound.hy2_obfs_password);
    url.hash = encodeURIComponent(formatTag(inbound, user, 'hy2'));
    return url.toString();
};

const buildTuicLink = (inbound, user, address) => {
    if (!user.uuid || !user.password || !address.server || !address.port) return null;
    const url = new URL(`tuic://${encodeURIComponent(user.uuid)}:${encodeURIComponent(user.password)}@${address.server}:${address.port}`);
    if (inbound.tls_server_name) url.searchParams.set('sni', inbound.tls_server_name);
    if (inbound.share_allow_insecure) url.searchParams.set('allow_insecure', '1');
    if (inbound.tuic_congestion) url.searchParams.set('congestion_control', inbound.tuic_congestion);
    if (inbound.tls_alpn) url.searchParams.set('alpn', inbound.tls_alpn);
    url.hash = encodeURIComponent(formatTag(inbound, user, 'tuic'));
    return url.toString();
};

export function setupServerShareCore(ctx) {
    const userBundles = computed(() => {
        const bundles = new Map();

        const pushBundleLink = (bundleKey, userLabel, inbound, user, protocolLabel, link, problems = []) => {
            if (!bundles.has(bundleKey)) {
                bundles.set(bundleKey, {
                    key: bundleKey,
                    label: userLabel,
                    links: [],
                    problems: new Set(),
                });
            }
            const bundle = bundles.get(bundleKey);
            problems.forEach((problem) => bundle.problems.add(problem));
            if (link) {
                bundle.links.push({
                    protocol: protocolLabel,
                    inboundTag: inbound.tag,
                    userLabel,
                    link,
                });
            }
        };

        ctx.serverInbounds.value.forEach((inbound, inboundIndex) => {
            if (!ctx.inboundSupportsShareLinks(inbound.type)) return;
            const address = pickShareAddress(inbound);
            const baseProblems = [];
            if (!address.server) baseProblems.push('缺少客户端接入地址（share_server / tls_server_name）');
            if (!address.port) baseProblems.push('缺少客户端端口（share_port / listen_port）');
            if (inbound.reality_enabled && !inbound.share_reality_public_key) baseProblems.push('Reality 缺少 public key，无法生成客户端链接');

            const emit = (user, protocol, builder, fallbackLabel) => {
                const userLabel = displayUserLabel(user, fallbackLabel);
                const bundleKey = user?.uuid || `${protocol}:${user?.password || fallbackLabel}:${user?.name || ''}`;
                const userProblems = [...baseProblems];
                if (['VLESS', 'VMess', 'TUIC'].includes(protocol) && !user?.uuid) userProblems.push('用户缺少 UUID');
                if (['Trojan', 'Hysteria2'].includes(protocol) && !user?.password) userProblems.push('用户缺少密码');
                if (protocol === 'Shadowsocks' && !(user?.password || inbound.ss_password)) userProblems.push('Shadowsocks 缺少密码');
                const link = userProblems.length > 0 ? null : builder(inbound, user, address);
                pushBundleLink(bundleKey, userLabel, inbound, user, protocol, link, userProblems);
            };

            if (inbound.type === 'vless') inbound.users.forEach((user, userIndex) => emit(user, 'VLESS', buildVlessLink, `vless-${inboundIndex + 1}-${userIndex + 1}`));
            else if (inbound.type === 'vmess') inbound.users.forEach((user, userIndex) => emit(user, 'VMess', buildVmessLink, `vmess-${inboundIndex + 1}-${userIndex + 1}`));
            else if (inbound.type === 'trojan') inbound.users.forEach((user, userIndex) => emit(user, 'Trojan', buildTrojanLink, `trojan-${inboundIndex + 1}-${userIndex + 1}`));
            else if (inbound.type === 'hysteria2') inbound.users.forEach((user, userIndex) => emit(user, 'Hysteria2', buildHy2Link, `hy2-${inboundIndex + 1}-${userIndex + 1}`));
            else if (inbound.type === 'tuic') inbound.users.forEach((user, userIndex) => emit(user, 'TUIC', buildTuicLink, `tuic-${inboundIndex + 1}-${userIndex + 1}`));
            else if (inbound.type === 'shadowsocks') {
                if (inbound.ss_mode === 'multi-user') inbound.users.forEach((user, userIndex) => emit(user, 'Shadowsocks', buildShadowsocksLink, `ss-${inboundIndex + 1}-${userIndex + 1}`));
                else {
                    const pseudoUser = { name: inbound.tag, password: inbound.ss_password };
                    emit(pseudoUser, 'Shadowsocks', buildShadowsocksLink, `ss-${inboundIndex + 1}`);
                }
            }
        });

        return Array.from(bundles.values()).map((bundle) => ({
            ...bundle,
            problems: Array.from(bundle.problems),
            plainText: bundle.links.map((item) => item.link).join('\n'),
        }));
    });

    const copyBundlePlainText = async (bundle) => {
        const ok = await ctx.copyToClipboard(bundle.plainText);
        ctx.showToast(ok ? `已复制 ${bundle.label} 的订阅原文` : '复制失败，请手动复制', ok ? 'ok' : 'err');
    };

    const copyShareLink = async (linkItem) => {
        const ok = await ctx.copyToClipboard(linkItem.link);
        ctx.showToast(ok ? `已复制 ${linkItem.protocol} 节点链接` : '复制失败，请手动复制', ok ? 'ok' : 'err');
    };

    Object.assign(ctx, {
        userBundles,
        copyBundlePlainText,
        copyShareLink,
    });
}
