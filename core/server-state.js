const { ref } = window.Vue;

const INBOUND_TYPES = ['vless', 'vmess', 'trojan', 'shadowsocks', 'hysteria2', 'tuic', 'hysteria', 'anytls', 'shadowtls'];
const TLS_TYPES = ['vless', 'vmess', 'trojan', 'hysteria2', 'tuic', 'hysteria', 'anytls'];
const DEFAULT_TLS_TYPES = ['vless', 'vmess', 'trojan', 'hysteria2', 'tuic', 'hysteria', 'anytls'];
const TRANSPORT_TYPES = ['vless', 'vmess', 'trojan'];
const MULTIPLEX_TYPES = ['vless', 'vmess', 'trojan', 'shadowsocks'];
const SHAREABLE_TYPES = ['vless', 'vmess', 'trojan', 'shadowsocks', 'hysteria2', 'tuic'];
const REMOTE_OUTBOUND_TYPES = ['vless', 'vmess', 'trojan', 'shadowsocks', 'hysteria2', 'tuic', 'wireguard'];
const LEGACY_SPECIAL_OUTBOUND_ACTIONS = Object.freeze({
    block: 'reject',
    dns: 'hijack-dns',
    'dns-out': 'hijack-dns',
});
const SHADOWSOCKS_2022_KEY_BYTES = Object.freeze({
    '2022-blake3-aes-128-gcm': 16,
    '2022-blake3-aes-256-gcm': 32,
    '2022-blake3-chacha20-poly1305': 32,
});

const dnsHeadersToText = (headers) => {
    if (!headers || typeof headers !== 'object') return '';
    return Object.entries(headers)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
};

const joinList = (value) => {
    if (!Array.isArray(value)) return '';
    return value.join(',');
};

const mappingToText = (mapping) => {
    if (!mapping || typeof mapping !== 'object') return '';
    return Object.entries(mapping)
        .map(([key, value]) => {
            if (!value || typeof value !== 'object' || !value.server) return '';
            const port = value.server_port ? `:${value.server_port}` : '';
            return `${key}=${value.server}${port}`;
        })
        .filter(Boolean)
        .join('\n');
};

const uuidStringToBytes = (uuid) => {
    const hex = uuid.replace(/-/g, '');
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i += 1) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
};

const bytesToUuidString = (bytes) => {
    const hex = Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('');
    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20, 32),
    ].join('-');
};

export function createServerState() {
    const generateId = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
    const getShadowsocks2022KeyBytes = (method) => SHADOWSOCKS_2022_KEY_BYTES[String(method || '').trim()] || null;
    const isShadowsocks2022Method = (method) => getShadowsocks2022KeyBytes(method) !== null;
    const generateShadowsocks2022Key = (method) => {
        const keyBytes = getShadowsocks2022KeyBytes(method);
        if (!keyBytes || !crypto?.getRandomValues) return '';
        const randomBytes = new Uint8Array(keyBytes);
        crypto.getRandomValues(randomBytes);
        let binary = '';
        randomBytes.forEach((byte) => {
            binary += String.fromCharCode(byte);
        });
        return btoa(binary);
    };
    const fillGeneratedShadowsocks2022Key = (target, field, method, label = 'SS-2022 密钥') => {
        const keyBytes = getShadowsocks2022KeyBytes(method);
        if (!keyBytes) {
            showToast('当前仅 SS-2022 方法支持一键生成密钥', 'warn');
            return;
        }
        if (!target || typeof target !== 'object') return;
        const generated = generateShadowsocks2022Key(method);
        if (!generated) {
            showToast('当前环境不支持生成随机密钥', 'err');
            return;
        }
        target[field] = generated;
        showToast(`${label} 已生成（${keyBytes} 字节 Base64）`, 'ok');
    };
    const sanitizeOutboundSelection = (value, fallback = 'direct', { allowEmpty = false } = {}) => {
        const rawTag = String(value || '').trim();
        if (!rawTag) return allowEmpty ? '' : fallback;
        const tag = rawTag;
        return LEGACY_SPECIAL_OUTBOUND_ACTIONS[tag] ? fallback : tag;
    };
    const normalizeRouteActionState = (rule = {}) => {
        const action = ['route', 'reject', 'hijack-dns'].includes(rule.action) ? rule.action : 'route';
        const outbound = sanitizeOutboundSelection(rule.outbound, 'direct');
        if (action === 'route') {
            const migratedAction = LEGACY_SPECIAL_OUTBOUND_ACTIONS[String(rule.outbound || '').trim()];
            if (migratedAction) {
                return {
                    action: migratedAction,
                    outbound: 'direct',
                };
            }
        }
        return {
            action,
            outbound,
        };
    };

    const showToast = (msg, type = 'ok', duration = 2800) => {
        const icons = {
            ok: 'fas fa-check-circle',
            err: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle',
            warn: 'fas fa-exclamation-triangle',
        };
        const el = document.createElement('div');
        el.className = `toast toast-${type}`;
        el.innerHTML = `<i class="${icons[type] || icons.info}"></i><span>${msg}</span>`;
        const container = document.getElementById('toast-container');
        if (!container) return;
        container.appendChild(el);
        setTimeout(() => {
            el.style.transition = 'opacity .3s';
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 350);
        }, duration);
    };

    const showConfirm = (msg, onOk, { title = '确认操作', okText = '确认', safe = false } = {}) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.zIndex = '2000';
        overlay.innerHTML = `
            <div class="confirm-box">
                <h3>${title}</h3>
                <p>${msg}</p>
                <div class="btns">
                    <button class="btn-cancel">取消</button>
                    <button class="btn-ok${safe ? ' safe' : ''}">${okText}</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('.btn-cancel').onclick = () => overlay.remove();
        overlay.querySelector('.btn-ok').onclick = () => {
            overlay.remove();
            onOk();
        };
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            try {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
                document.body.appendChild(ta);
                ta.select();
                const ok = document.execCommand('copy');
                document.body.removeChild(ta);
                return ok;
            } catch {
                return false;
            }
        }
    };

    const UUID_NAMESPACE = uuidStringToBytes('6ba7b810-9dad-11d1-80b4-00c04fd430c8');
    const generateUuidFromName = async (name) => {
        const source = String(name || '').trim() || crypto.randomUUID();
        if (!crypto?.subtle?.digest) return crypto.randomUUID();
        const input = new TextEncoder().encode(source);
        const merged = new Uint8Array(UUID_NAMESPACE.length + input.length);
        merged.set(UUID_NAMESPACE, 0);
        merged.set(input, UUID_NAMESPACE.length);
        const digest = new Uint8Array(await crypto.subtle.digest('SHA-1', merged));
        const uuidBytes = digest.slice(0, 16);
        uuidBytes[6] = (uuidBytes[6] & 0x0f) | 0x50;
        uuidBytes[8] = (uuidBytes[8] & 0x3f) | 0x80;
        return bytesToUuidString(uuidBytes);
    };

    const makeInboundUser = () => ({
        id: generateId('user'),
        name: '',
        uuid: crypto.randomUUID(),
        uuid_generated_from_name: false,
        password: '',
        flow: '',
        alterId: 0,
        auth: '',
        auth_str: '',
        auth_mode: 'plain',
    });

    const makeSsDestination = () => ({
        id: generateId('ss_dest'),
        name: '',
        server: '',
        server_port: 443,
        password: '',
    });

    const normalizeRemoteOutbound = (outbound = {}, index = 0) => {
        const tls = outbound.tls && typeof outbound.tls === 'object' ? outbound.tls : {};
        const reality = tls.reality && typeof tls.reality === 'object' ? tls.reality : {};
        const transport = outbound.transport && typeof outbound.transport === 'object' ? outbound.transport : {};
        return {
            id: outbound.id || generateId('outbound'),
            tag: typeof outbound.tag === 'string' && outbound.tag.trim() ? outbound.tag.trim() : `relay-${index + 1}`,
            type: REMOTE_OUTBOUND_TYPES.includes(outbound.type) ? outbound.type : 'vless',
            import_source: typeof outbound.import_source === 'string' ? outbound.import_source : '',
            server: typeof outbound.server === 'string' ? outbound.server : '',
            server_port: Number.isFinite(Number(outbound.server_port)) ? Number(outbound.server_port) : 443,
            uuid: typeof outbound.uuid === 'string' ? outbound.uuid : '',
            password: typeof outbound.password === 'string' ? outbound.password : '',
            flow: typeof outbound.flow === 'string' ? outbound.flow : '',
            security: typeof outbound.security === 'string' ? outbound.security : 'auto',
            alter_id: outbound.alter_id === null || outbound.alter_id === undefined ? 0 : Number(outbound.alter_id),
            global_padding: !!outbound.global_padding,
            authenticated_length: outbound.authenticated_length === undefined ? true : !!outbound.authenticated_length,
            method: typeof outbound.method === 'string' && outbound.method ? outbound.method : '2022-blake3-aes-128-gcm',
            network: typeof outbound.network === 'string' ? outbound.network : '',
            tls_enabled: outbound.tls_enabled !== undefined ? !!outbound.tls_enabled : (!!tls.enabled || ['vless', 'trojan', 'hysteria2', 'tuic'].includes(outbound.type)),
            server_name: typeof outbound.server_name === 'string' ? outbound.server_name : (typeof tls.server_name === 'string' ? tls.server_name : ''),
            alpn: typeof outbound.alpn === 'string' ? outbound.alpn : joinList(tls.alpn),
            allow_insecure: !!outbound.allow_insecure,
            reality_public_key: typeof outbound.reality_public_key === 'string' ? outbound.reality_public_key : (typeof reality.public_key === 'string' ? reality.public_key : ''),
            reality_short_id: typeof outbound.reality_short_id === 'string' ? outbound.reality_short_id : (typeof reality.short_id === 'string' ? reality.short_id : ''),
            transport: typeof outbound.transport === 'string' ? outbound.transport : (typeof transport.type === 'string' ? transport.type : ''),
            transport_path: typeof outbound.transport_path === 'string' ? outbound.transport_path : (typeof transport.path === 'string' ? transport.path : ''),
            transport_host: typeof outbound.transport_host === 'string'
                ? outbound.transport_host
                : (Array.isArray(transport.host) ? transport.host.join(',') : (typeof transport.host === 'string' ? transport.host : '')),
            transport_service_name: typeof outbound.transport_service_name === 'string' ? outbound.transport_service_name : (typeof transport.service_name === 'string' ? transport.service_name : ''),
            hy2_obfs_type: typeof outbound.hy2_obfs_type === 'string' ? outbound.hy2_obfs_type : (outbound.obfs && outbound.obfs.type ? outbound.obfs.type : ''),
            hy2_obfs_password: typeof outbound.hy2_obfs_password === 'string' ? outbound.hy2_obfs_password : (outbound.obfs && outbound.obfs.password ? outbound.obfs.password : ''),
            tuic_congestion: typeof outbound.tuic_congestion === 'string' && outbound.tuic_congestion ? outbound.tuic_congestion : (typeof outbound.congestion_control === 'string' ? outbound.congestion_control : 'cubic'),
            tuic_udp_relay_mode: typeof outbound.tuic_udp_relay_mode === 'string' && outbound.tuic_udp_relay_mode ? outbound.tuic_udp_relay_mode : (typeof outbound.udp_relay_mode === 'string' ? outbound.udp_relay_mode : 'native'),
            tuic_udp_over_stream: !!outbound.tuic_udp_over_stream || !!outbound.udp_over_stream,
            tuic_zero_rtt_handshake: !!outbound.tuic_zero_rtt_handshake || !!outbound.zero_rtt_handshake,
            tuic_heartbeat: typeof outbound.tuic_heartbeat === 'string' && outbound.tuic_heartbeat ? outbound.tuic_heartbeat : (typeof outbound.heartbeat === 'string' ? outbound.heartbeat : '10s'),
            local_address: typeof outbound.local_address === 'string' ? outbound.local_address : '',
            peer_public_key: typeof outbound.peer_public_key === 'string' ? outbound.peer_public_key : '',
            pre_shared_key: typeof outbound.pre_shared_key === 'string' ? outbound.pre_shared_key : '',
            mtu: outbound.mtu === null || outbound.mtu === undefined ? '' : String(outbound.mtu),
            persistent_keepalive_interval: typeof outbound.persistent_keepalive_interval === 'string' ? outbound.persistent_keepalive_interval : '',
            collapsed: outbound.collapsed === undefined ? false : !!outbound.collapsed,
        };
    };

    const normalizeRuleSet = (ruleSet = {}, index = 0) => ({
        id: ruleSet.id || generateId('ruleset'),
        tag: typeof ruleSet.tag === 'string' && ruleSet.tag.trim() ? ruleSet.tag.trim() : `ruleset-${index + 1}`,
        source_type: ['local', 'remote'].includes(ruleSet.source_type) ? ruleSet.source_type : 'remote',
        format: ['binary', 'source'].includes(ruleSet.format) ? ruleSet.format : 'binary',
        path: typeof ruleSet.path === 'string' ? ruleSet.path : '',
        url: typeof ruleSet.url === 'string' ? ruleSet.url : '',
        update_interval: typeof ruleSet.update_interval === 'string' ? ruleSet.update_interval : '24h',
        download_detour: sanitizeOutboundSelection(ruleSet.download_detour, 'direct', { allowEmpty: true }),
        enabled: ruleSet.enabled === undefined ? true : !!ruleSet.enabled,
        collapsed: ruleSet.collapsed === undefined ? false : !!ruleSet.collapsed,
    });

    const normalizeRouteRule = (rule = {}, index = 0) => {
        const normalizedRouteAction = normalizeRouteActionState(rule);
        return {
        id: rule.id || generateId('rule'),
        enabled: rule.enabled === undefined ? true : !!rule.enabled,
        name: typeof rule.name === 'string' && rule.name ? rule.name : `自定义路由 ${index + 1}`,
        match_type: ['protocol', 'port', 'inbound', 'domain_suffix', 'rule_set'].includes(rule.match_type) ? rule.match_type : 'protocol',
        match_value: typeof rule.match_value === 'string' ? rule.match_value : '',
        action: normalizedRouteAction.action,
        outbound: normalizedRouteAction.outbound,
        collapsed: rule.collapsed === undefined ? false : !!rule.collapsed,
        draggable: !!rule.draggable,
        };
    };

    const isBlankInboundUser = (user) => ![
        user?.name,
        user?.uuid,
        user?.password,
        user?.flow,
        user?.auth,
        user?.auth_str,
    ].some((value) => String(value || '').trim());

    const isLegacySeededInbound = (inbound) => {
        if (!inbound || inbound.type !== 'vless') return false;
        if (String(inbound.tag || '') !== 'vless-in') return false;
        if (String(inbound.listen || '') !== '::') return false;
        if (Number(inbound.listen_port || 0) !== 443) return false;
        if (!inbound.tls_enabled) return false;
        if (!Array.isArray(inbound.users) || inbound.users.length !== 1) return false;
        if (!isBlankInboundUser(inbound.users[0])) return false;
        const extraFields = [
            inbound.tls_cert_path,
            inbound.tls_key_path,
            inbound.share_server,
            inbound.share_name_prefix,
            inbound.reality_private_key,
            inbound.reality_short_id,
            inbound.transport,
        ];
        return extraFields.every((value) => !String(value || '').trim());
    };

    const isLegacySeededRemoteOutbound = (outbound) => {
        if (!outbound || outbound.type !== 'vless') return false;
        if (String(outbound.tag || '') !== 'relay-vps-b') return false;
        if (String(outbound.server || '').trim()) return false;
        if (String(outbound.uuid || '').trim()) return false;
        if (String(outbound.password || '').trim()) return false;
        return Number(outbound.server_port || 0) === 443;
    };

    const isLegacySeededRuleSet = (ruleSet) => {
        if (!ruleSet) return false;
        return String(ruleSet.tag || '') === 'google-sites'
            && String(ruleSet.source_type || '') === 'remote'
            && String(ruleSet.format || '') === 'binary'
            && !String(ruleSet.url || '').trim();
    };

    const isLegacySeededRouteRule = (rule) => {
        if (!rule) return false;
        return String(rule.name || '') === 'Rule Set 中继'
            && String(rule.match_type || '') === 'rule_set'
            && String(rule.match_value || '') === 'google-sites'
            && String(rule.outbound || '') === 'relay-vps-b';
    };

    const pruneLegacySeededDefaults = () => {
        serverInbounds.value = serverInbounds.value.filter((item) => !isLegacySeededInbound(item));
        remoteOutbounds.value = remoteOutbounds.value.filter((item) => !isLegacySeededRemoteOutbound(item));
        ruleSets.value = ruleSets.value.filter((item) => !isLegacySeededRuleSet(item));
        routeRules.value = routeRules.value.filter((item) => !isLegacySeededRouteRule(item));
    };

    const inboundSupportsTls = (type) => TLS_TYPES.includes(type);
    const inboundSupportsTransport = (type) => TRANSPORT_TYPES.includes(type);
    const inboundSupportsMultiplex = (type) => MULTIPLEX_TYPES.includes(type);
    const inboundSupportsShareLinks = (type) => SHAREABLE_TYPES.includes(type);
    const inboundUsesUsers = (type, inbound) => {
        if (type === 'shadowsocks') return inbound.ss_mode === 'multi-user';
        if (type === 'shadowtls') return String(inbound.shadowtls_version || '3') === '3';
        return ['vless', 'vmess', 'trojan', 'hysteria2', 'tuic', 'hysteria', 'anytls'].includes(type);
    };
    const inboundUsesDestinations = (type, inbound) => type === 'shadowsocks' && inbound.ss_mode === 'relay';

    const ensureInboundCollections = (inbound) => {
        if (!Array.isArray(inbound.users)) inbound.users = [];
        if (!Array.isArray(inbound.ss_destinations)) inbound.ss_destinations = [];
        if (inboundUsesUsers(inbound.type, inbound) && inbound.users.length === 0) {
            inbound.users.push(makeInboundUser());
        }
        if (!inboundUsesUsers(inbound.type, inbound)) {
            inbound.users = [];
        }
        if (!inboundUsesDestinations(inbound.type, inbound)) {
            inbound.ss_destinations = [];
        }
        return inbound;
    };

    const applyInboundTypeDefaults = (inbound) => {
        if (!INBOUND_TYPES.includes(inbound.type)) inbound.type = 'vless';
        if (!inboundSupportsTls(inbound.type)) {
            inbound.tls_enabled = false;
            inbound.reality_enabled = false;
        } else if (inbound.tls_enabled === undefined || inbound.tls_enabled === null) {
            inbound.tls_enabled = DEFAULT_TLS_TYPES.includes(inbound.type);
        }
        if (!inboundSupportsTransport(inbound.type)) inbound.transport = '';
        if (!inboundSupportsMultiplex(inbound.type)) inbound.mux_enabled = false;
        if (inbound.type !== 'shadowsocks') inbound.ss_mode = 'single';
        if (!['single', 'multi-user', 'relay'].includes(inbound.ss_mode)) inbound.ss_mode = 'single';
        if (!['1', '2', '3'].includes(String(inbound.shadowtls_version || '3'))) inbound.shadowtls_version = '3';
        if (inbound.type === 'shadowtls' && !inbound.shadowtls_password && String(inbound.shadowtls_version) === '2') {
            inbound.shadowtls_password = '';
        }
        return ensureInboundCollections(inbound);
    };

    const normalizeDnsServer = (dns = {}, index = 0) => {
        const type = ['tls', 'https', 'udp', 'tcp', 'quic', 'h3', 'local'].includes(dns.type) ? dns.type : 'udp';
        return {
            id: dns.id || generateId('dns'),
            tag: typeof dns.tag === 'string' && dns.tag.trim() ? dns.tag.trim() : `dns-${index + 1}`,
            type,
            server: typeof dns.server === 'string' ? dns.server : '',
            server_port: dns.server_port === 0 ? '0' : (dns.server_port ? String(dns.server_port) : ''),
            detour: typeof dns.detour === 'string' ? dns.detour : '',
            domain_resolver: typeof dns.domain_resolver === 'string'
                ? dns.domain_resolver
                : (dns.domain_resolver && typeof dns.domain_resolver.server === 'string' ? dns.domain_resolver.server : ''),
            path: typeof dns.path === 'string' ? dns.path : '',
            headers_text: typeof dns.headers_text === 'string' ? dns.headers_text : dnsHeadersToText(dns.headers),
            client_subnet: typeof dns.client_subnet === 'string' ? dns.client_subnet : '',
            connect_timeout: typeof dns.connect_timeout === 'string' ? dns.connect_timeout : '',
        };
    };

    const normalizeInbound = (inbound = {}, index = 0) => {
        const tls = inbound.tls && typeof inbound.tls === 'object' ? inbound.tls : {};
        const reality = tls.reality && typeof tls.reality === 'object' ? tls.reality : {};
        const realityHandshake = reality.handshake && typeof reality.handshake === 'object' ? reality.handshake : {};
        const transport = inbound.transport && typeof inbound.transport === 'object' ? inbound.transport : {};
        const multiplex = inbound.multiplex && typeof inbound.multiplex === 'object' ? inbound.multiplex : {};
        const hy2Masquerade = inbound.hy2_masquerade !== undefined ? inbound.hy2_masquerade : inbound.masquerade;
        const ssDestinations = Array.isArray(inbound.ss_destinations)
            ? inbound.ss_destinations
            : (Array.isArray(inbound.destinations) ? inbound.destinations : []);
        const ssUsers = Array.isArray(inbound.users) ? inbound.users : [];
        const inferredSsMode = inbound.ss_mode
            || (ssDestinations.length > 0 ? 'relay' : (ssUsers.length > 0 ? 'multi-user' : 'single'));

        const normalizedShadowTlsWildcard = (() => {
            const value = String(inbound.shadowtls_wildcard_sni || inbound.wildcard_sni || 'off');
            if (value === 'single') return 'authed';
            if (value === 'full') return 'all';
            if (['off', 'authed', 'all'].includes(value)) return value;
            return 'off';
        })();

        const hy2MasqueradeMode = (() => {
            if (typeof hy2Masquerade === 'string' && hy2Masquerade.trim()) return 'url';
            if (!hy2Masquerade || typeof hy2Masquerade !== 'object') return 'none';
            if (hy2Masquerade.type === 'file') return 'file';
            if (hy2Masquerade.type === 'proxy') return 'proxy';
            if (hy2Masquerade.type === 'string') return 'string';
            return 'none';
        })();

        return applyInboundTypeDefaults({
            id: inbound.id || generateId('inbound'),
            tag: typeof inbound.tag === 'string' && inbound.tag.trim() ? inbound.tag.trim() : `${inbound.type || 'vless'}-in-${index + 1}`,
            type: INBOUND_TYPES.includes(inbound.type) ? inbound.type : 'vless',
            listen: typeof inbound.listen === 'string' && inbound.listen ? inbound.listen : '::',
            listen_port: Number.isFinite(Number(inbound.listen_port)) ? Number(inbound.listen_port) : 443,
            users: ssUsers.map((user) => ({
                ...makeInboundUser(),
                ...user,
                id: user.id || generateId('user'),
                auth_mode: user.auth_mode || (user.auth ? 'base64' : 'plain'),
            })),
            tls_enabled: inbound.tls_enabled !== undefined ? !!inbound.tls_enabled : !!tls.enabled,
            tls_cert_path: typeof inbound.tls_cert_path === 'string' ? inbound.tls_cert_path : (tls.certificate_path || ''),
            tls_key_path: typeof inbound.tls_key_path === 'string' ? inbound.tls_key_path : (tls.key_path || ''),
            tls_server_name: typeof inbound.tls_server_name === 'string' ? inbound.tls_server_name : (tls.server_name || ''),
            tls_alpn: typeof inbound.tls_alpn === 'string' ? inbound.tls_alpn : joinList(tls.alpn),
            tls_min_version: typeof inbound.tls_min_version === 'string' ? inbound.tls_min_version : (tls.min_version || ''),
            tls_max_version: typeof inbound.tls_max_version === 'string' ? inbound.tls_max_version : (tls.max_version || ''),
            tls_handshake_timeout: typeof inbound.tls_handshake_timeout === 'string' ? inbound.tls_handshake_timeout : (tls.handshake_timeout || ''),
            reality_enabled: inbound.reality_enabled !== undefined ? !!inbound.reality_enabled : !!reality.enabled,
            reality_private_key: typeof inbound.reality_private_key === 'string' ? inbound.reality_private_key : (reality.private_key || ''),
            reality_short_id: typeof inbound.reality_short_id === 'string' ? inbound.reality_short_id : (reality.short_id || ''),
            reality_server: typeof inbound.reality_server === 'string' ? inbound.reality_server : (realityHandshake.server || ''),
            reality_server_port: Number.isFinite(Number(inbound.reality_server_port))
                ? Number(inbound.reality_server_port)
                : (Number.isFinite(Number(realityHandshake.server_port)) ? Number(realityHandshake.server_port) : 443),
            reality_max_time_difference: typeof inbound.reality_max_time_difference === 'string'
                ? inbound.reality_max_time_difference
                : (reality.max_time_difference || ''),
            share_server: typeof inbound.share_server === 'string' ? inbound.share_server : '',
            share_port: inbound.share_port === null || inbound.share_port === undefined ? '' : String(inbound.share_port),
            share_name_prefix: typeof inbound.share_name_prefix === 'string' ? inbound.share_name_prefix : '',
            share_utls_fingerprint: typeof inbound.share_utls_fingerprint === 'string' ? inbound.share_utls_fingerprint : '',
            share_allow_insecure: !!inbound.share_allow_insecure,
            share_reality_public_key: typeof inbound.share_reality_public_key === 'string' ? inbound.share_reality_public_key : '',
            transport: typeof inbound.transport === 'string' ? inbound.transport : (transport.type || ''),
            transport_path: typeof inbound.transport_path === 'string' ? inbound.transport_path : (transport.path || ''),
            transport_host: typeof inbound.transport_host === 'string'
                ? inbound.transport_host
                : (Array.isArray(transport.host) ? transport.host.join(',') : (transport.host || '')),
            transport_headers_text: typeof inbound.transport_headers_text === 'string' ? inbound.transport_headers_text : dnsHeadersToText(transport.headers),
            transport_method: typeof inbound.transport_method === 'string' ? inbound.transport_method : (transport.method || ''),
            transport_idle_timeout: typeof inbound.transport_idle_timeout === 'string' ? inbound.transport_idle_timeout : (transport.idle_timeout || ''),
            transport_ping_timeout: typeof inbound.transport_ping_timeout === 'string' ? inbound.transport_ping_timeout : (transport.ping_timeout || ''),
            transport_service_name: typeof inbound.transport_service_name === 'string' ? inbound.transport_service_name : (transport.service_name || ''),
            transport_early_data: inbound.transport_early_data === null || inbound.transport_early_data === undefined
                ? (transport.max_early_data || '')
                : inbound.transport_early_data,
            transport_early_data_header_name: typeof inbound.transport_early_data_header_name === 'string'
                ? inbound.transport_early_data_header_name
                : (transport.early_data_header_name || ''),
            transport_permit_without_stream: inbound.transport_permit_without_stream !== undefined
                ? !!inbound.transport_permit_without_stream
                : !!transport.permit_without_stream,
            mux_enabled: inbound.mux_enabled !== undefined ? !!inbound.mux_enabled : !!multiplex.enabled,
            mux_padding: inbound.mux_padding !== undefined ? !!inbound.mux_padding : !!multiplex.padding,
            mux_brutal_enabled: inbound.mux_brutal_enabled !== undefined ? !!inbound.mux_brutal_enabled : !!multiplex.brutal,
            ss_method: typeof inbound.ss_method === 'string' && inbound.ss_method ? inbound.ss_method : (inbound.method || '2022-blake3-aes-128-gcm'),
            ss_password: typeof inbound.ss_password === 'string' ? inbound.ss_password : (inbound.password || ''),
            ss_network: typeof inbound.ss_network === 'string' ? inbound.ss_network : (inbound.network || ''),
            ss_managed: inbound.ss_managed !== undefined ? !!inbound.ss_managed : !!inbound.managed,
            ss_mode: inferredSsMode,
            ss_destinations: ssDestinations.map((item) => ({
                ...makeSsDestination(),
                ...item,
                id: item.id || generateId('ss_dest'),
                server_port: Number.isFinite(Number(item.server_port)) ? Number(item.server_port) : 443,
            })),
            hy_up_mbps: inbound.hy_up_mbps === null || inbound.hy_up_mbps === undefined ? '' : String(inbound.hy_up_mbps),
            hy_down_mbps: inbound.hy_down_mbps === null || inbound.hy_down_mbps === undefined ? '' : String(inbound.hy_down_mbps),
            hy_obfs: typeof inbound.hy_obfs === 'string' ? inbound.hy_obfs : '',
            hy_recv_window_conn: inbound.hy_recv_window_conn === null || inbound.hy_recv_window_conn === undefined ? '' : String(inbound.hy_recv_window_conn),
            hy_recv_window_client: inbound.hy_recv_window_client === null || inbound.hy_recv_window_client === undefined ? '' : String(inbound.hy_recv_window_client),
            hy_max_conn_client: inbound.hy_max_conn_client === null || inbound.hy_max_conn_client === undefined ? '' : String(inbound.hy_max_conn_client),
            hy_disable_mtu_discovery: !!inbound.hy_disable_mtu_discovery,
            hy2_up_mbps: inbound.hy2_up_mbps === null || inbound.hy2_up_mbps === undefined ? '' : String(inbound.hy2_up_mbps ?? inbound.up_mbps ?? ''),
            hy2_down_mbps: inbound.hy2_down_mbps === null || inbound.hy2_down_mbps === undefined ? '' : String(inbound.hy2_down_mbps ?? inbound.down_mbps ?? ''),
            hy2_obfs_type: typeof inbound.hy2_obfs_type === 'string' ? inbound.hy2_obfs_type : (inbound.obfs && inbound.obfs.type ? inbound.obfs.type : ''),
            hy2_obfs_password: typeof inbound.hy2_obfs_password === 'string' ? inbound.hy2_obfs_password : (inbound.obfs && inbound.obfs.password ? inbound.obfs.password : ''),
            hy2_ignore_client_bandwidth: inbound.hy2_ignore_client_bandwidth !== undefined ? !!inbound.hy2_ignore_client_bandwidth : !!inbound.ignore_client_bandwidth,
            hy2_masquerade_mode: hy2MasqueradeMode,
            hy2_masquerade_url: hy2MasqueradeMode === 'url'
                ? hy2Masquerade
                : (hy2Masquerade && hy2Masquerade.url ? hy2Masquerade.url : ''),
            hy2_masquerade_directory: hy2Masquerade && hy2Masquerade.directory ? hy2Masquerade.directory : '',
            hy2_masquerade_rewrite_host: hy2Masquerade && hy2Masquerade.rewrite_host ? hy2Masquerade.rewrite_host : '',
            hy2_masquerade_status_code: hy2Masquerade && hy2Masquerade.status_code !== undefined ? String(hy2Masquerade.status_code) : '',
            hy2_masquerade_headers_text: hy2Masquerade && hy2Masquerade.headers ? dnsHeadersToText(hy2Masquerade.headers) : '',
            hy2_masquerade_content: hy2Masquerade && hy2Masquerade.content ? hy2Masquerade.content : '',
            tuic_congestion: typeof inbound.tuic_congestion === 'string' && inbound.tuic_congestion ? inbound.tuic_congestion : (inbound.congestion_control || 'cubic'),
            tuic_auth_timeout: typeof inbound.tuic_auth_timeout === 'string' && inbound.tuic_auth_timeout ? inbound.tuic_auth_timeout : (inbound.auth_timeout || '3s'),
            tuic_zero_rtt_handshake: inbound.tuic_zero_rtt_handshake !== undefined ? !!inbound.tuic_zero_rtt_handshake : !!inbound.zero_rtt_handshake,
            tuic_heartbeat: typeof inbound.tuic_heartbeat === 'string' && inbound.tuic_heartbeat ? inbound.tuic_heartbeat : (inbound.heartbeat || '10s'),
            anytls_padding_scheme_text: typeof inbound.anytls_padding_scheme_text === 'string'
                ? inbound.anytls_padding_scheme_text
                : (Array.isArray(inbound.padding_scheme) ? inbound.padding_scheme.join('\n') : ''),
            shadowtls_version: String(inbound.shadowtls_version || inbound.version || '3'),
            shadowtls_password: typeof inbound.shadowtls_password === 'string' ? inbound.shadowtls_password : (inbound.password || ''),
            shadowtls_handshake_server: typeof inbound.shadowtls_handshake_server === 'string'
                ? inbound.shadowtls_handshake_server
                : (inbound.handshake && inbound.handshake.server ? inbound.handshake.server : ''),
            shadowtls_handshake_port: Number.isFinite(Number(inbound.shadowtls_handshake_port))
                ? Number(inbound.shadowtls_handshake_port)
                : (Number.isFinite(Number(inbound.handshake && inbound.handshake.server_port)) ? Number(inbound.handshake.server_port) : 443),
            shadowtls_handshake_for_server_name_text: typeof inbound.shadowtls_handshake_for_server_name_text === 'string'
                ? inbound.shadowtls_handshake_for_server_name_text
                : mappingToText(inbound.handshake_for_server_name),
            shadowtls_strict_mode: !!inbound.shadowtls_strict_mode || !!inbound.strict_mode,
            shadowtls_wildcard_sni: typeof inbound.shadowtls_wildcard_sni === 'string'
                ? normalizedShadowTlsWildcard
                : normalizedShadowTlsWildcard,
            trojan_fallback_server: typeof inbound.trojan_fallback_server === 'string'
                ? inbound.trojan_fallback_server
                : (inbound.fallback && inbound.fallback.server ? inbound.fallback.server : ''),
            trojan_fallback_port: inbound.trojan_fallback_port === null || inbound.trojan_fallback_port === undefined
                ? String((inbound.fallback && inbound.fallback.server_port) || '')
                : String(inbound.trojan_fallback_port),
            trojan_fallback_for_alpn_text: typeof inbound.trojan_fallback_for_alpn_text === 'string'
                ? inbound.trojan_fallback_for_alpn_text
                : mappingToText(inbound.fallback_for_alpn),
            collapsed: inbound.collapsed === undefined ? false : !!inbound.collapsed,
        });
    };

    const copyText = ref('复制配置');
    const copyIcon = ref('fas fa-copy');
    const tabs = [
        { id: 'basic', name: '基础', icon: 'fas fa-server' },
        { id: 'dns', name: 'DNS', icon: 'fas fa-network-wired' },
        { id: 'inbounds', name: '入站协议', icon: 'fas fa-plug' },
        { id: 'route', name: '路由/出站', icon: 'fas fa-route' },
        { id: 'share', name: '订阅/链接', icon: 'fas fa-link' },
    ];
    const currentTab = ref('basic');

    const showImportExport = ref(false);
    const importExportTab = ref('export');
    const importJsonText = ref('');
    const importError = ref('');
    const modalContentReady = ref(false);
    const panelExportFilename = ref('');
    const runtimeExportFilename = ref('');
    const jsonContainer = ref(null);
    const tabContentContainer = ref(null);
    const lastSavedAt = ref('');
    const storageSavedAgo = ref('');

    const settings = ref({
        log_level: 'info',
        dns_strategy: 'prefer_ipv4',
        dns_final: '',
        dns_disable_cache: false,
        dns_disable_expire: false,
        dns_cache_capacity: null,
        dns_client_subnet: '',
        route_final: 'direct',
        auto_detect_interface: false,
        remote_import_use_cors: false,
        rule_set_cdn: false,
        rule_set_download_detour: 'direct',
        import_mode: 'panel',
    });

    const dnsList = ref([
        normalizeDnsServer({ tag: 'public-dns', type: 'https', server: '1.1.1.1', path: '/dns-query' }, 0),
        normalizeDnsServer({ tag: 'bootstrap-dns', type: 'udp', server: '223.5.5.5' }, 1),
    ]);

    const remoteOutbounds = ref([]);

    const ruleSets = ref([]);

    const serverInbounds = ref([]);

    const routeRules = ref([
        normalizeRouteRule({
            name: 'DNS 直连',
            match_type: 'protocol',
            match_value: 'dns',
            action: 'route',
            outbound: 'direct',
        }, 0),
    ]);
    const draggedRouteRuleIndex = ref(null);
    const dragOverRouteRuleIndex = ref(null);

    const sanitizeLegacySpecialOutbounds = () => {
        settings.value.route_final = sanitizeOutboundSelection(settings.value.route_final, 'direct');
        settings.value.rule_set_download_detour = sanitizeOutboundSelection(settings.value.rule_set_download_detour, 'direct');
        ruleSets.value = ruleSets.value.map((item, index) => normalizeRuleSet(item, index));
        routeRules.value = routeRules.value.map((item, index) => normalizeRouteRule(item, index));
    };

    const addDnsServer = () => {
        dnsList.value.push(normalizeDnsServer({}, dnsList.value.length));
    };
    const removeDnsServer = (index) => {
        dnsList.value.splice(index, 1);
    };

    const addInbound = (type = 'vless', placement = 'bottom') => {
        const inbound = normalizeInbound({ type, collapsed: false }, serverInbounds.value.length);
        if (placement === 'top') serverInbounds.value.unshift(inbound);
        else serverInbounds.value.push(inbound);
    };
    const removeInbound = (index) => {
        serverInbounds.value.splice(index, 1);
    };
    const addInboundUser = (inbound) => {
        const user = makeInboundUser();
        if (!['vless', 'vmess', 'tuic'].includes(inbound.type)) user.uuid = '';
        inbound.users.push(user);
    };
    const removeInboundUser = (inbound, index) => {
        inbound.users.splice(index, 1);
        ensureInboundCollections(inbound);
    };
    const addSsDestination = (inbound) => {
        inbound.ss_destinations.push(makeSsDestination());
    };
    const removeSsDestination = (inbound, index) => {
        inbound.ss_destinations.splice(index, 1);
    };
    const toggleInboundCollapsed = (index) => {
        serverInbounds.value[index].collapsed = !serverInbounds.value[index].collapsed;
    };
    const syncInboundType = (inbound) => {
        applyInboundTypeDefaults(inbound);
    };
    const syncShadowTlsVersion = (inbound) => {
        applyInboundTypeDefaults(inbound);
    };
    const syncShadowsocksMode = (inbound) => {
        applyInboundTypeDefaults(inbound);
    };
    const generateUserUuid = async (inbound, user) => {
        if (!String(user.name || '').trim()) {
            showToast('请先填写用户名称，再生成 UUID', 'warn');
            return;
        }
        user.uuid = await generateUuidFromName(user.name);
        user.uuid_generated_from_name = true;
        showToast('已根据用户名称生成 UUID', 'ok');
    };

    const addRemoteOutbound = (type = 'vless') => {
        remoteOutbounds.value.push(normalizeRemoteOutbound({ type }, remoteOutbounds.value.length));
    };
    const removeRemoteOutbound = (index) => {
        remoteOutbounds.value.splice(index, 1);
    };
    const toggleRemoteOutboundCollapsed = (index) => {
        remoteOutbounds.value[index].collapsed = !remoteOutbounds.value[index].collapsed;
    };
    const addRuleSet = (sourceType = 'remote') => {
        ruleSets.value.push(normalizeRuleSet({
            source_type: sourceType,
            download_detour: settings.value.rule_set_download_detour,
        }, ruleSets.value.length));
    };
    const removeRuleSet = (index) => {
        ruleSets.value.splice(index, 1);
    };
    const toggleRuleSetCollapsed = (index) => {
        ruleSets.value[index].collapsed = !ruleSets.value[index].collapsed;
    };
    const onRuleSetTagChange = (ruleSet) => {
        if (!ruleSet || ruleSet.source_type !== 'remote' || !ruleSet.tag) return;
        let category = '';
        if (ruleSet.tag.startsWith('geosite-')) category = 'geosite';
        else if (ruleSet.tag.startsWith('geoip-')) category = 'geoip';
        if (!category) return;
        const name = ruleSet.tag.replace(/^(geosite|geoip)-/, '');
        const ext = ruleSet.format === 'source' ? 'json' : 'srs';
        ruleSet.url = settings.value.rule_set_cdn
            ? `https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/${category}/${name}.${ext}`
            : `https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/sing/geo/${category}/${name}.${ext}`;
    };
    const onRuleSetFormatChange = (ruleSet) => {
        if (!ruleSet || !ruleSet.url) return;
        if (ruleSet.url.includes('MetaCubeX/meta-rules-dat')) {
            ruleSet.url = ruleSet.url.replace(/\.(srs|json)$/, ruleSet.format === 'source' ? '.json' : '.srs');
        }
    };
    const syncRuleSetUrlsFromCdnPreference = () => {
        ruleSets.value.forEach((ruleSet) => onRuleSetTagChange(ruleSet));
    };
    const syncRuleSetDownloadDetours = () => {
        ruleSets.value.forEach((ruleSet) => {
            if (ruleSet.source_type === 'remote') ruleSet.download_detour = sanitizeOutboundSelection(settings.value.rule_set_download_detour, 'direct');
        });
    };
    const addRuleSetTemplate = (tag) => {
        if (!tag) return;
        if (ruleSets.value.some((item) => item.tag === tag)) {
            showToast(`规则集 ${tag} 已存在`, 'info');
            return;
        }
        const ruleSet = normalizeRuleSet({
            tag,
            source_type: 'remote',
            format: 'binary',
            download_detour: settings.value.rule_set_download_detour,
        }, ruleSets.value.length);
        onRuleSetTagChange(ruleSet);
        ruleSets.value.push(ruleSet);
        showToast(`已添加模板 ${tag}`, 'ok');
    };

    const addRouteRule = () => {
        routeRules.value.push(normalizeRouteRule({
            name: '自定义路由',
            match_type: 'protocol',
            match_value: '',
            action: 'route',
            outbound: 'direct',
        }, routeRules.value.length));
    };
    const removeRouteRule = (index) => {
        routeRules.value.splice(index, 1);
    };
    const toggleRouteRuleCollapsed = (index) => {
        routeRules.value[index].collapsed = !routeRules.value[index].collapsed;
    };
    const onRouteRuleDragStart = (index, event) => {
        draggedRouteRuleIndex.value = index;
        routeRules.value[index].draggable = true;
        if (event?.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    };
    const onRouteRuleDragEnter = (index) => {
        if (draggedRouteRuleIndex.value !== null) dragOverRouteRuleIndex.value = index;
    };
    const onRouteRuleDragEnd = () => {
        draggedRouteRuleIndex.value = null;
        dragOverRouteRuleIndex.value = null;
        routeRules.value.forEach((rule) => {
            rule.draggable = false;
        });
    };
    const onRouteRuleDrop = (index) => {
        const from = draggedRouteRuleIndex.value;
        if (from !== null && from !== index) {
            const item = routeRules.value.splice(from, 1)[0];
            routeRules.value.splice(index, 0, item);
        }
        onRouteRuleDragEnd();
    };

    return {
        generateId,
        showToast,
        showConfirm,
        copyToClipboard,
        isShadowsocks2022Method,
        fillGeneratedShadowsocks2022Key,
        copyText,
        copyIcon,
        tabs,
        currentTab,
        showImportExport,
        importExportTab,
        importJsonText,
        importError,
        modalContentReady,
        panelExportFilename,
        runtimeExportFilename,
        jsonContainer,
        tabContentContainer,
        lastSavedAt,
        storageSavedAgo,
        settings,
        dnsList,
        remoteOutbounds,
        ruleSets,
        normalizeDnsServer,
        normalizeRemoteOutbound,
        normalizeRuleSet,
        normalizeRouteRule,
        addDnsServer,
        removeDnsServer,
        serverInbounds,
        normalizeInbound,
        addInbound,
        removeInbound,
        addInboundUser,
        removeInboundUser,
        addSsDestination,
        removeSsDestination,
        toggleInboundCollapsed,
        syncInboundType,
        syncShadowTlsVersion,
        syncShadowsocksMode,
        generateUserUuid,
        generateUuidFromName,
        pruneLegacySeededDefaults,
        sanitizeLegacySpecialOutbounds,
        addRemoteOutbound,
        removeRemoteOutbound,
        toggleRemoteOutboundCollapsed,
        addRuleSet,
        removeRuleSet,
        toggleRuleSetCollapsed,
        onRuleSetTagChange,
        onRuleSetFormatChange,
        syncRuleSetUrlsFromCdnPreference,
        syncRuleSetDownloadDetours,
        addRuleSetTemplate,
        inboundSupportsTls,
        inboundSupportsTransport,
        inboundSupportsMultiplex,
        inboundUsesUsers,
        inboundUsesDestinations,
        inboundSupportsShareLinks,
        REMOTE_OUTBOUND_TYPES,
        routeRules,
        addRouteRule,
        removeRouteRule,
        toggleRouteRuleCollapsed,
        draggedRouteRuleIndex,
        dragOverRouteRuleIndex,
        onRouteRuleDragStart,
        onRouteRuleDragEnter,
        onRouteRuleDrop,
        onRouteRuleDragEnd,
    };
}
