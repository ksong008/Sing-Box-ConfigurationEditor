const { computed, nextTick, watch } = window.Vue;

const TRANSPORT_TYPES = ['vless', 'vmess', 'trojan'];
const MULTIPLEX_TYPES = ['vless', 'vmess', 'trojan', 'shadowsocks'];
const TLS_TYPES = ['vless', 'vmess', 'trojan', 'hysteria2', 'tuic', 'hysteria', 'anytls'];
const INBOUND_TYPES_WITH_REQUIRED_USERS = ['vless', 'vmess', 'trojan', 'tuic', 'hysteria', 'hysteria2', 'anytls'];
const BUILTIN_OUTBOUND_TAGS = new Set(['direct', 'block', 'dns', 'dns-out']);
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

export function setupServerConfigCore(ctx) {
    const INTEGER_PATTERN = /^-?\d+$/;
    const HYSTERIA_BANDWIDTH_PATTERN = /^(0|[1-9]\d*)\s*(?:bps|Bps|Kbps|KBps|Mbps|MBps|Gbps|GBps|Tbps|TBps)$/;
    const cloneState = (value) => {
        if (typeof globalThis.structuredClone === 'function') {
            try {
                return globalThis.structuredClone(value);
            } catch {
                // Vue reactive proxies are not always structured-cloneable.
            }
        }
        return JSON.parse(JSON.stringify(value));
    };
    const sanitizeInboundForExport = (inbound) => {
        if (!inbound || typeof ctx.sanitizeInboundByCapabilities !== 'function') return inbound;
        return ctx.sanitizeInboundByCapabilities(cloneState(inbound));
    };
    const sanitizeRemoteOutboundForExport = (outbound) => {
        if (!outbound || typeof ctx.sanitizeRemoteOutboundByCapabilities !== 'function') return outbound;
        return ctx.sanitizeRemoteOutboundByCapabilities(cloneState(outbound));
    };
    const parseOptionalInteger = (value) => {
        if (value === null || value === undefined) return undefined;
        const source = String(value).trim();
        if (!source) return undefined;
        if (!INTEGER_PATTERN.test(source)) return undefined;
        const parsed = parseInt(source, 10);
        return Number.isInteger(parsed) ? parsed : undefined;
    };
    const parsePositiveInteger = (value) => {
        const parsed = parseOptionalInteger(value);
        return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
    };
    const parseNonNegativeInteger = (value) => {
        const parsed = parseOptionalInteger(value);
        return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
    };
    const hasTextValue = (value) => String(value === null || value === undefined ? '' : value).trim() !== '';
    const isValidHysteriaBandwidth = (value) => HYSTERIA_BANDWIDTH_PATTERN.test(String(value || '').trim());
    const parseRoutingMark = (value) => {
        if (value === null || value === undefined) return { empty: true, valid: true, value: undefined };
        const source = String(value).trim();
        if (!source) return { empty: true, valid: true, value: undefined };
        if (/^0x[0-9a-f]+$/i.test(source)) return { empty: false, valid: true, value: source.toLowerCase() };
        if (/^\d+$/.test(source)) return { empty: false, valid: true, value: parseInt(source, 10) };
        return { empty: false, valid: false, value: undefined };
    };
    const parseOptionalBoolean = (value) => {
        if (value === true || value === false) return value;
        if (value === null || value === undefined) return undefined;
        const source = String(value).trim().toLowerCase();
        if (source === 'true') return true;
        if (source === 'false') return false;
        return undefined;
    };

    const parseList = (value) => String(value || '')
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean);

    const sanitizeOutboundSelection = (value, fallback = 'direct', { allowEmpty = false } = {}) => {
        const rawTag = String(value || '').trim();
        if (!rawTag) return allowEmpty ? '' : fallback;
        const tag = rawTag;
        return LEGACY_SPECIAL_OUTBOUND_ACTIONS[tag] ? fallback : tag;
    };
    const hasExportableOutboundTag = (value, exportableOutboundTags = null) => {
        const tag = sanitizeOutboundSelection(value, '', { allowEmpty: true });
        if (!tag) return false;
        if (!(exportableOutboundTags instanceof Set)) return true;
        return exportableOutboundTags.has(tag);
    };
    const collectDuplicateTags = (items = [], resolveTag = (item) => item?.tag) => {
        const counts = new Map();
        items.forEach((item) => {
            const tag = String(resolveTag(item) || '').trim();
            if (!tag) return;
            counts.set(tag, (counts.get(tag) || 0) + 1);
        });
        return Array.from(counts.entries())
            .filter(([, count]) => count > 1)
            .map(([tag]) => tag);
    };
    const isLikelyIpLiteral = (value) => {
        const source = String(value || '').trim();
        if (!source) return false;
        if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(source)) {
            return source.split('.').every((part) => {
                const valuePart = Number(part);
                return Number.isInteger(valuePart) && valuePart >= 0 && valuePart <= 255;
            });
        }
        const normalized = source.startsWith('[') && source.endsWith(']') ? source.slice(1, -1) : source;
        return normalized.includes(':') && /^[0-9a-f:]+$/i.test(normalized);
    };
    const buildInboundTagMap = () => new Map(
        ctx.serverInbounds.value
            .map((item) => {
                const tag = String(item?.tag || '').trim();
                if (!tag) return null;
                return [tag, item?.type || ''];
            })
            .filter(Boolean),
    );
    const supportsInjectableInbound = (type) => {
        if (typeof ctx.inboundSupportsDetourTarget === 'function') return !!ctx.inboundSupportsDetourTarget({ type });
        if (typeof ctx.resolveInboundCapabilities !== 'function') return true;
        return !!ctx.resolveInboundCapabilities({ type }).injectable;
    };
    const sanitizeInboundDetour = (value, currentTag = '', availableInboundTags = null) => {
        const detour = String(value || '').trim();
        const ownTag = String(currentTag || '').trim();
        if (!detour || detour === ownTag) return '';
        if (availableInboundTags instanceof Map) {
            const detourType = String(availableInboundTags.get(detour) || '').trim();
            if (!detourType || !supportsInjectableInbound(detourType)) return '';
        }
        return detour;
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
    const getShadowsocks2022KeyLength = (method) => SHADOWSOCKS_2022_KEY_BYTES[String(method || '').trim()] || null;
    const getBase64DecodedLength = (value) => {
        const source = String(value || '').trim();
        if (!source) return null;
        if (!/^[A-Za-z0-9+/=]+$/.test(source)) return null;
        try {
            return atob(source).length;
        } catch {
            return null;
        }
    };
    const isValidShadowsocks2022Password = (method, password) => {
        const expectedLength = getShadowsocks2022KeyLength(method);
        if (!expectedLength) return true;
        return getBase64DecodedLength(password) === expectedLength;
    };
    const buildShadowsocks2022PasswordError = (label, method) => {
        const expectedLength = getShadowsocks2022KeyLength(method);
        if (!expectedLength) return '';
        return `${label} 使用 ${method} 时，password 必须是 ${expectedLength} 字节随机密钥的 Base64 编码`;
    };

    const parseHeadersText = (value) => {
        const headers = {};
        String(value || '')
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .forEach((line) => {
                const idx = line.indexOf(':');
                if (idx === -1) return;
                const key = line.slice(0, idx).trim();
                const headerValue = line.slice(idx + 1).trim();
                if (!key || !headerValue) return;
                headers[key] = headerValue;
            });
        return Object.keys(headers).length > 0 ? headers : undefined;
    };

    const parseHostPort = (value, defaultPort = 443) => {
        const source = String(value || '').trim();
        if (!source) return null;
        if (source.startsWith('[')) {
            const end = source.indexOf(']');
            if (end === -1) return { server: source, server_port: defaultPort };
            const host = source.slice(1, end);
            const portText = source.slice(end + 2);
            return {
                server: host,
                server_port: parseOptionalInteger(portText) || defaultPort,
            };
        }
        const idx = source.lastIndexOf(':');
        if (idx === -1 || source.indexOf(':') !== idx) {
            return { server: source, server_port: defaultPort };
        }
        return {
            server: source.slice(0, idx),
            server_port: parseOptionalInteger(source.slice(idx + 1)) || defaultPort,
        };
    };

    const parseServerMapText = (value) => {
        const mapping = {};
        String(value || '')
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .forEach((line) => {
                const idx = line.indexOf('=');
                if (idx === -1) return;
                const key = line.slice(0, idx).trim();
                const target = line.slice(idx + 1).trim();
                if (!key || !target) return;
                const parsed = parseHostPort(target);
                if (!parsed || !parsed.server) return;
                mapping[key] = parsed;
            });
        return Object.keys(mapping).length > 0 ? mapping : undefined;
    };

    const buildDnsServer = (dns) => {
        if (!dns || !dns.tag) return null;
        const usesServerAddress = dns.type !== 'local';
        const usesHttpFields = ['https', 'h3'].includes(dns.type);
        const server = { type: dns.type, tag: dns.tag };
        if (usesServerAddress && dns.server) server.server = dns.server;
        const serverPort = parseOptionalInteger(dns.server_port);
        if (usesServerAddress && serverPort !== undefined && serverPort > 0) server.server_port = serverPort;
        if (dns.detour) server.detour = dns.detour;
        if (usesServerAddress && dns.domain_resolver) server.domain_resolver = dns.domain_resolver;
        if (usesHttpFields && dns.path) server.path = dns.path;
        const headers = parseHeadersText(dns.headers_text);
        if (usesHttpFields && headers) server.headers = headers;
        if (dns.client_subnet) server.client_subnet = dns.client_subnet;
        if (dns.connect_timeout) server.connect_timeout = dns.connect_timeout;
        return server;
    };

    const buildUsers = (inbound) => {
        if (!Array.isArray(inbound.users)) return [];
        return inbound.users
            .map((user) => {
                if (inbound.type === 'vless') {
                    if (!user.uuid) return null;
                    const mapped = { uuid: user.uuid };
                    if (user.flow) mapped.flow = user.flow;
                    if (user.name) mapped.name = user.name;
                    return mapped;
                }
                if (inbound.type === 'vmess') {
                    if (!user.uuid) return null;
                    const mapped = { uuid: user.uuid };
                    const alterId = parseOptionalInteger(user.alterId);
                    if (alterId !== undefined) mapped.alterId = alterId;
                    if (user.name) mapped.name = user.name;
                    return mapped;
                }
                if (inbound.type === 'tuic') {
                    if (!user.uuid || !user.password) return null;
                    const mapped = { uuid: user.uuid, password: user.password };
                    if (user.name) mapped.name = user.name;
                    return mapped;
                }
                if (inbound.type === 'hysteria') {
                    const mapped = {};
                    if (user.auth_mode === 'base64') {
                        if (!user.auth) return null;
                        mapped.auth = user.auth;
                    } else if (user.auth_str) {
                        mapped.auth_str = user.auth_str;
                    } else if (user.auth) {
                        mapped.auth = user.auth;
                    }
                    if (!mapped.auth && !mapped.auth_str) return null;
                    if (user.name) mapped.name = user.name;
                    return mapped;
                }
                if (['trojan', 'hysteria2', 'anytls', 'shadowtls', 'shadowsocks'].includes(inbound.type)) {
                    if (!user.password) return null;
                    const mapped = { password: user.password };
                    if (user.name) mapped.name = user.name;
                    return mapped;
                }
                return null;
            })
            .filter(Boolean);
    };
    const shouldPreserveUsersArray = (inbound) => {
        if (!inbound) return false;
        if (INBOUND_TYPES_WITH_REQUIRED_USERS.includes(inbound.type)) return true;
        if (inbound.type === 'shadowtls' && String(inbound.shadowtls_version || '3') === '3') return true;
        if (inbound.type === 'shadowsocks' && inbound.ss_mode === 'multi-user') return true;
        return false;
    };

    const buildTransport = (inbound) => {
        if (!TRANSPORT_TYPES.includes(inbound.type) || !inbound.transport) return undefined;
        const headers = parseHeadersText(inbound.transport_headers_text);
        if (inbound.transport === 'ws') {
            const transport = { type: 'ws' };
            if (inbound.transport_path) transport.path = inbound.transport_path;
            if (headers) transport.headers = headers;
            if (inbound.transport_host) {
                transport.headers = {
                    ...(transport.headers || {}),
                    Host: inbound.transport_host,
                };
            }
            const maxEarlyData = parseOptionalInteger(inbound.transport_early_data);
            if (maxEarlyData !== undefined) transport.max_early_data = maxEarlyData;
            if (inbound.transport_early_data_header_name) transport.early_data_header_name = inbound.transport_early_data_header_name;
            return transport;
        }
        if (inbound.transport === 'grpc') {
            const transport = {
                type: 'grpc',
                service_name: inbound.transport_service_name || inbound.transport_path || '',
            };
            if (inbound.transport_idle_timeout) transport.idle_timeout = inbound.transport_idle_timeout;
            if (inbound.transport_ping_timeout) transport.ping_timeout = inbound.transport_ping_timeout;
            if (inbound.transport_permit_without_stream) transport.permit_without_stream = true;
            return transport;
        }
        if (inbound.transport === 'http') {
            const transport = {
                type: 'http',
                host: parseList(inbound.transport_host),
            };
            if (inbound.transport_path) transport.path = inbound.transport_path;
            if (inbound.transport_method) transport.method = inbound.transport_method;
            if (headers) transport.headers = headers;
            if (inbound.transport_idle_timeout) transport.idle_timeout = inbound.transport_idle_timeout;
            if (inbound.transport_ping_timeout) transport.ping_timeout = inbound.transport_ping_timeout;
            return transport;
        }
        if (inbound.transport === 'httpupgrade') {
            const transport = { type: 'httpupgrade' };
            if (inbound.transport_host) transport.host = inbound.transport_host;
            if (inbound.transport_path) transport.path = inbound.transport_path;
            if (headers) transport.headers = headers;
            return transport;
        }
        if (inbound.transport === 'quic') {
            return { type: 'quic' };
        }
        return undefined;
    };

    const buildMultiplex = (inbound) => {
        if (!MULTIPLEX_TYPES.includes(inbound.type) || !inbound.mux_enabled) return undefined;
        const multiplex = { enabled: true };
        if (inbound.mux_padding) multiplex.padding = true;
        if (inbound.mux_brutal_enabled) {
            multiplex.brutal = { enabled: true };
            const brutalUp = parsePositiveInteger(inbound.mux_brutal_up_mbps);
            const brutalDown = parsePositiveInteger(inbound.mux_brutal_down_mbps);
            if (brutalUp !== undefined) multiplex.brutal.up_mbps = brutalUp;
            if (brutalDown !== undefined) multiplex.brutal.down_mbps = brutalDown;
        }
        return multiplex;
    };

    const buildTls = (inbound) => {
        if (!TLS_TYPES.includes(inbound.type) || !inbound.tls_enabled) return undefined;
        const tls = { enabled: true };
        if (inbound.tls_certificate) tls.certificate = inbound.tls_certificate;
        if (inbound.tls_cert_path) tls.certificate_path = inbound.tls_cert_path;
        if (inbound.tls_key) tls.key = inbound.tls_key;
        if (inbound.tls_key_path) tls.key_path = inbound.tls_key_path;
        if (inbound.tls_server_name) tls.server_name = inbound.tls_server_name;
        const alpn = parseList(inbound.tls_alpn);
        if (alpn.length > 0) tls.alpn = alpn;
        if (inbound.tls_min_version) tls.min_version = inbound.tls_min_version;
        if (inbound.tls_max_version) tls.max_version = inbound.tls_max_version;
        if (inbound.tls_handshake_timeout) tls.handshake_timeout = inbound.tls_handshake_timeout;
        if (inbound.reality_enabled) {
            tls.reality = { enabled: true };
            if (inbound.reality_server) {
                tls.reality.handshake = {
                    server: inbound.reality_server,
                    server_port: parseOptionalInteger(inbound.reality_server_port) || 443,
                };
            }
            if (inbound.reality_private_key) tls.reality.private_key = inbound.reality_private_key;
            if (inbound.reality_short_id) tls.reality.short_id = inbound.reality_short_id;
            if (inbound.reality_max_time_difference) {
                tls.reality.max_time_difference = inbound.reality_max_time_difference;
            }
        }
        return tls;
    };

    const buildMasquerade = (inbound) => {
        if (inbound.hy2_masquerade_mode === 'url' && inbound.hy2_masquerade_url) return inbound.hy2_masquerade_url;
        if (inbound.hy2_masquerade_mode === 'file' && inbound.hy2_masquerade_directory) {
            return {
                type: 'file',
                directory: inbound.hy2_masquerade_directory,
            };
        }
        if (inbound.hy2_masquerade_mode === 'proxy' && inbound.hy2_masquerade_url) {
            const masquerade = {
                type: 'proxy',
                url: inbound.hy2_masquerade_url,
            };
            if (inbound.hy2_masquerade_rewrite_host) masquerade.rewrite_host = true;
            return masquerade;
        }
        if (inbound.hy2_masquerade_mode === 'string') {
            const masquerade = { type: 'string' };
            const statusCode = parseOptionalInteger(inbound.hy2_masquerade_status_code);
            if (statusCode !== undefined) masquerade.status_code = statusCode;
            const headers = parseHeadersText(inbound.hy2_masquerade_headers_text);
            if (headers) masquerade.headers = headers;
            if (inbound.hy2_masquerade_content) masquerade.content = inbound.hy2_masquerade_content;
            return Object.keys(masquerade).length > 1 ? masquerade : undefined;
        }
        return undefined;
    };

    const buildRemoteOutboundTransport = (outbound) => {
        if (!['vless', 'vmess', 'trojan'].includes(outbound.type) || !outbound.transport) return undefined;
        if (outbound.transport === 'ws') {
            const transport = { type: 'ws' };
            if (outbound.transport_path) transport.path = outbound.transport_path;
            if (outbound.transport_host) transport.headers = { Host: outbound.transport_host };
            return transport;
        }
        if (outbound.transport === 'grpc') {
            return {
                type: 'grpc',
                service_name: outbound.transport_service_name || outbound.transport_path || '',
            };
        }
        if (outbound.transport === 'http') {
            return {
                type: 'http',
                path: outbound.transport_path || undefined,
                host: parseList(outbound.transport_host),
            };
        }
        if (outbound.transport === 'httpupgrade') {
            const transport = { type: 'httpupgrade' };
            if (outbound.transport_path) transport.path = outbound.transport_path;
            if (outbound.transport_host) transport.host = outbound.transport_host;
            return transport;
        }
        if (outbound.transport === 'quic') {
            return { type: 'quic' };
        }
        return undefined;
    };

    const buildInbound = (inbound, availableInboundTags = null) => {
        if (!inbound || !inbound.tag) return null;
        const listenPort = parseOptionalInteger(inbound.listen_port);
        const obj = {
            type: inbound.type,
            tag: inbound.tag,
            listen: inbound.listen || '::',
            listen_port: listenPort === undefined ? 443 : listenPort,
        };
        const routingMark = parseRoutingMark(inbound.routing_mark);
        const reuseAddr = parseOptionalBoolean(inbound.reuse_addr);
        const tcpFastOpen = parseOptionalBoolean(inbound.tcp_fast_open);
        const tcpMultiPath = parseOptionalBoolean(inbound.tcp_multi_path);
        const udpFragment = parseOptionalBoolean(inbound.udp_fragment);
        if (inbound.bind_interface) obj.bind_interface = inbound.bind_interface;
        if (routingMark.valid && routingMark.value !== undefined) obj.routing_mark = routingMark.value;
        if (reuseAddr !== undefined) obj.reuse_addr = reuseAddr;
        if (inbound.netns) obj.netns = inbound.netns;
        if (tcpFastOpen !== undefined) obj.tcp_fast_open = tcpFastOpen;
        if (tcpMultiPath !== undefined) obj.tcp_multi_path = tcpMultiPath;
        if (udpFragment !== undefined) obj.udp_fragment = udpFragment;
        if (inbound.udp_timeout) obj.udp_timeout = inbound.udp_timeout;
        const detour = sanitizeInboundDetour(inbound.detour, inbound.tag, availableInboundTags);
        if (detour) obj.detour = detour;

        if (['vless', 'vmess', 'trojan', 'tuic', 'hysteria', 'hysteria2', 'anytls'].includes(inbound.type)) {
            const users = buildUsers(inbound);
            if (users.length > 0 || shouldPreserveUsersArray(inbound)) obj.users = users;
        }

        if (inbound.type === 'shadowsocks') {
            obj.method = inbound.ss_method || '2022-blake3-aes-128-gcm';
            if (inbound.ss_password) obj.password = inbound.ss_password;
            if (inbound.ss_network) obj.network = inbound.ss_network;
            if (inbound.ss_managed) obj.managed = true;
            if (inbound.ss_mode === 'multi-user') {
                const users = buildUsers(inbound);
                obj.users = users;
            }
            if (inbound.ss_mode === 'relay' && Array.isArray(inbound.ss_destinations) && inbound.ss_destinations.length > 0) {
                obj.destinations = inbound.ss_destinations
                    .map((destination) => {
                        if (!destination.server) return null;
                        const mapped = {
                            server: destination.server,
                            server_port: parseOptionalInteger(destination.server_port) || 443,
                        };
                        if (destination.name) mapped.name = destination.name;
                        if (destination.password) mapped.password = destination.password;
                        return mapped;
                    })
                    .filter(Boolean);
            }
        }

        if (inbound.type === 'hysteria') {
            if (inbound.hy_up) obj.up = inbound.hy_up;
            if (inbound.hy_down) obj.down = inbound.hy_down;
            const hyUpMbps = parsePositiveInteger(inbound.hy_up_mbps);
            const hyDownMbps = parsePositiveInteger(inbound.hy_down_mbps);
            const hyRecvWindowConn = parseNonNegativeInteger(inbound.hy_recv_window_conn);
            const hyRecvWindowClient = parseNonNegativeInteger(inbound.hy_recv_window_client);
            const hyMaxConnClient = parseNonNegativeInteger(inbound.hy_max_conn_client);
            if (hyUpMbps !== undefined) obj.up_mbps = hyUpMbps;
            if (hyDownMbps !== undefined) obj.down_mbps = hyDownMbps;
            if (inbound.hy_obfs) obj.obfs = inbound.hy_obfs;
            if (hyRecvWindowConn !== undefined) obj.recv_window_conn = hyRecvWindowConn;
            if (hyRecvWindowClient !== undefined) obj.recv_window_client = hyRecvWindowClient;
            if (hyMaxConnClient !== undefined) obj.max_conn_client = hyMaxConnClient;
            if (inbound.hy_disable_mtu_discovery) obj.disable_mtu_discovery = true;
        }

        if (inbound.type === 'hysteria2') {
            const users = buildUsers(inbound);
            if (users.length > 0 || shouldPreserveUsersArray(inbound)) obj.users = users;
            const hy2UpMbps = parsePositiveInteger(inbound.hy2_up_mbps);
            const hy2DownMbps = parsePositiveInteger(inbound.hy2_down_mbps);
            if (hy2UpMbps !== undefined) obj.up_mbps = hy2UpMbps;
            if (hy2DownMbps !== undefined) obj.down_mbps = hy2DownMbps;
            if (inbound.hy2_obfs_type) obj.obfs = { type: inbound.hy2_obfs_type, password: inbound.hy2_obfs_password || '' };
            if (inbound.hy2_ignore_client_bandwidth) obj.ignore_client_bandwidth = true;
            const masquerade = buildMasquerade(inbound);
            if (masquerade !== undefined) obj.masquerade = masquerade;
        }

        if (inbound.type === 'tuic') {
            const users = buildUsers(inbound);
            if (users.length > 0 || shouldPreserveUsersArray(inbound)) obj.users = users;
            if (inbound.tuic_congestion) obj.congestion_control = inbound.tuic_congestion;
            if (inbound.tuic_auth_timeout) obj.auth_timeout = inbound.tuic_auth_timeout;
            if (inbound.tuic_zero_rtt_handshake) obj.zero_rtt_handshake = true;
            if (inbound.tuic_heartbeat) obj.heartbeat = inbound.tuic_heartbeat;
        }

        if (inbound.type === 'anytls') {
            const users = buildUsers(inbound);
            if (users.length > 0 || shouldPreserveUsersArray(inbound)) obj.users = users;
            const paddingScheme = parseList(inbound.anytls_padding_scheme_text);
            if (paddingScheme.length > 0) obj.padding_scheme = paddingScheme;
        }

        if (inbound.type === 'shadowtls') {
            obj.version = parseOptionalInteger(inbound.shadowtls_version) || 3;
            if (String(obj.version) === '2' && inbound.shadowtls_password) obj.password = inbound.shadowtls_password;
            if (String(obj.version) === '3') {
                const users = buildUsers(inbound);
                if (users.length > 0 || shouldPreserveUsersArray(inbound)) obj.users = users;
            }
            if (inbound.shadowtls_handshake_server) {
                obj.handshake = {
                    server: inbound.shadowtls_handshake_server,
                    server_port: parseOptionalInteger(inbound.shadowtls_handshake_port) || 443,
                };
            }
            const handshakeForServerName = parseServerMapText(inbound.shadowtls_handshake_for_server_name_text);
            if (handshakeForServerName) obj.handshake_for_server_name = handshakeForServerName;
            if (inbound.shadowtls_strict_mode) obj.strict_mode = true;
            if (inbound.shadowtls_wildcard_sni && inbound.shadowtls_wildcard_sni !== 'off') obj.wildcard_sni = inbound.shadowtls_wildcard_sni;
        }

        const tls = buildTls(inbound);
        if (tls) obj.tls = tls;

        const transport = buildTransport(inbound);
        if (transport) obj.transport = transport;

        const multiplex = buildMultiplex(inbound);
        if (multiplex) obj.multiplex = multiplex;

        if (inbound.type === 'trojan') {
            if (inbound.trojan_fallback_server) {
                obj.fallback = {
                    server: inbound.trojan_fallback_server,
                    server_port: parseOptionalInteger(inbound.trojan_fallback_port) || 80,
                };
            }
            const fallbackForAlpn = parseServerMapText(inbound.trojan_fallback_for_alpn_text);
            if (fallbackForAlpn) obj.fallback_for_alpn = fallbackForAlpn;
        }

        return obj;
    };

    const buildRouteRule = (rule) => {
        if (!rule.enabled || !rule.match_value) return null;
        const values = parseList(rule.match_value);
        if (!values.length) return null;
        const obj = {};
        if (rule.match_type === 'protocol') obj.protocol = values;
        else if (rule.match_type === 'port') obj.port = values.map((item) => parseOptionalInteger(item)).filter((item) => item !== undefined);
        else if (rule.match_type === 'inbound') obj.inbound = values;
        else if (rule.match_type === 'domain_suffix') obj.domain_suffix = values;
        else if (rule.match_type === 'rule_set') obj.rule_set = values;
        const normalizedRouteAction = normalizeRouteActionState(rule);
        if (normalizedRouteAction.action === 'reject') {
            obj.action = 'reject';
        } else if (normalizedRouteAction.action === 'hijack-dns') {
            obj.action = 'hijack-dns';
        } else {
            obj.action = 'route';
            obj.outbound = normalizedRouteAction.outbound;
        }
        return obj;
    };

    const buildRuleSet = (ruleSet) => {
        if (!ruleSet?.enabled || !ruleSet.tag) return null;
        const obj = {
            tag: ruleSet.tag,
            type: ruleSet.source_type === 'local' ? 'local' : 'remote',
            format: ruleSet.format || 'binary',
        };
        if (obj.type === 'local') {
            if (!ruleSet.path) return null;
            obj.path = ruleSet.path;
        } else {
            if (!ruleSet.url) return null;
            obj.url = ruleSet.url;
            const downloadDetour = sanitizeOutboundSelection(ruleSet.download_detour, 'direct', { allowEmpty: true });
            if (downloadDetour) obj.download_detour = downloadDetour;
            if (ruleSet.update_interval) obj.update_interval = ruleSet.update_interval;
        }
        return obj;
    };

    const buildRemoteOutbound = (outbound) => {
        if (!outbound?.tag || !outbound?.server) return null;
        const port = parseOptionalInteger(outbound.server_port);
        const obj = {
            type: outbound.type,
            tag: outbound.tag,
            server: outbound.server,
            server_port: port === undefined ? 443 : port,
        };

        if (outbound.type === 'vless') {
            if (!outbound.uuid) return null;
            obj.uuid = outbound.uuid;
            if (outbound.flow) obj.flow = outbound.flow;
            if (outbound.tls_enabled) {
                obj.tls = {
                    enabled: true,
                };
                if (outbound.server_name) obj.tls.server_name = outbound.server_name;
                const alpn = parseList(outbound.alpn);
                if (alpn.length > 0) obj.tls.alpn = alpn;
                if (outbound.allow_insecure) obj.tls.insecure = true;
                if (outbound.reality_public_key) {
                    obj.tls.reality = {
                        enabled: true,
                        public_key: outbound.reality_public_key,
                        short_id: outbound.reality_short_id || '',
                    };
                }
            }
        } else if (outbound.type === 'vmess') {
            if (!outbound.uuid) return null;
            obj.uuid = outbound.uuid;
            const alterId = parseOptionalInteger(outbound.alter_id);
            if (alterId !== undefined) obj.alter_id = alterId;
            if (outbound.security && outbound.security !== 'auto') obj.security = outbound.security;
            if (outbound.global_padding) obj.global_padding = true;
            if (!outbound.authenticated_length) obj.authenticated_length = false;
            if (outbound.network) obj.network = outbound.network;
            if (outbound.tls_enabled) {
                obj.tls = {
                    enabled: true,
                };
                if (outbound.server_name) obj.tls.server_name = outbound.server_name;
                const alpn = parseList(outbound.alpn);
                if (alpn.length > 0) obj.tls.alpn = alpn;
                if (outbound.allow_insecure) obj.tls.insecure = true;
            }
        } else if (outbound.type === 'trojan') {
            if (!outbound.password) return null;
            obj.password = outbound.password;
            if (outbound.tls_enabled) {
                obj.tls = {
                    enabled: true,
                };
                if (outbound.server_name) obj.tls.server_name = outbound.server_name;
                const alpn = parseList(outbound.alpn);
                if (alpn.length > 0) obj.tls.alpn = alpn;
                if (outbound.allow_insecure) obj.tls.insecure = true;
                if (outbound.reality_public_key) {
                    obj.tls.reality = {
                        enabled: true,
                        public_key: outbound.reality_public_key,
                        short_id: outbound.reality_short_id || '',
                    };
                }
            }
        } else if (outbound.type === 'shadowsocks') {
            if (!outbound.password || !outbound.method) return null;
            obj.method = outbound.method;
            obj.password = outbound.password;
            if (outbound.network) obj.network = outbound.network;
        } else if (outbound.type === 'hysteria2') {
            if (!outbound.password) return null;
            obj.password = outbound.password;
            if (outbound.network) obj.network = outbound.network;
            if (outbound.hy2_obfs_type) {
                obj.obfs = {
                    type: outbound.hy2_obfs_type,
                    password: outbound.hy2_obfs_password || '',
                };
            }
            obj.tls = {
                enabled: true,
            };
            if (outbound.server_name) obj.tls.server_name = outbound.server_name;
            const alpn = parseList(outbound.alpn);
            if (alpn.length > 0) obj.tls.alpn = alpn;
            if (outbound.allow_insecure) obj.tls.insecure = true;
        } else if (outbound.type === 'tuic') {
            if (!outbound.uuid || !outbound.password) return null;
            obj.uuid = outbound.uuid;
            obj.password = outbound.password;
            if (outbound.network) obj.network = outbound.network;
            if (outbound.tuic_congestion) obj.congestion_control = outbound.tuic_congestion;
            if (outbound.tuic_udp_relay_mode) obj.udp_relay_mode = outbound.tuic_udp_relay_mode;
            if (outbound.tuic_udp_over_stream) obj.udp_over_stream = true;
            if (outbound.tuic_zero_rtt_handshake) obj.zero_rtt_handshake = true;
            if (outbound.tuic_heartbeat) obj.heartbeat = outbound.tuic_heartbeat;
            obj.tls = {
                enabled: true,
            };
            if (outbound.server_name) obj.tls.server_name = outbound.server_name;
            const alpn = parseList(outbound.alpn);
            if (alpn.length > 0) obj.tls.alpn = alpn;
            if (outbound.allow_insecure) obj.tls.insecure = true;
        } else if (outbound.type === 'wireguard') {
            if (!outbound.local_address || !outbound.private_key || !outbound.peer_public_key) return null;
            obj.local_address = parseList(outbound.local_address);
            obj.private_key = outbound.private_key;
            obj.peer_public_key = outbound.peer_public_key;
            if (outbound.pre_shared_key) obj.pre_shared_key = outbound.pre_shared_key;
            const mtu = parseOptionalInteger(outbound.mtu);
            if (mtu !== undefined) obj.mtu = mtu;
            if (outbound.persistent_keepalive_interval) obj.persistent_keepalive_interval = outbound.persistent_keepalive_interval;
        }

        const transport = buildRemoteOutboundTransport(outbound);
        if (transport) obj.transport = transport;

        return obj;
    };
    const buildExportableRemoteOutbounds = () => ctx.remoteOutbounds.value
        .map(sanitizeRemoteOutboundForExport)
        .map(buildRemoteOutbound)
        .filter(Boolean);
    const buildExportableOutboundTagSet = (outbounds = buildExportableRemoteOutbounds()) => new Set(
        ['direct', ...outbounds.map((item) => String(item?.tag || '').trim()).filter(Boolean)],
    );
    const buildDnsServers = () => ctx.dnsList.value.map(buildDnsServer).filter(Boolean);
    const buildDnsTagSet = (dnsServers = buildDnsServers()) => new Set(
        dnsServers.map((item) => String(item?.tag || '').trim()).filter(Boolean),
    );
    const buildExportableRuleSets = () => ctx.ruleSets.value.map(buildRuleSet).filter(Boolean);
    const buildRuleSetTagSet = (ruleSets = buildExportableRuleSets()) => new Set(
        ruleSets.map((item) => String(item?.tag || '').trim()).filter(Boolean),
    );
    const exportableOutboundOptions = computed(() => Array.from(buildExportableOutboundTagSet()));

    const generatedJson = computed(() => {
        const dnsServers = buildDnsServers();
        const availableInboundTags = buildInboundTagMap();
        const inbounds = ctx.serverInbounds.value
            .map((inbound) => buildInbound(sanitizeInboundForExport(inbound), availableInboundTags))
            .filter(Boolean);
        const ruleSets = buildExportableRuleSets();
        const routeRules = ctx.routeRules.value.map(buildRouteRule).filter(Boolean);
        const customOutbounds = buildExportableRemoteOutbounds();
        const route = {
            rules: routeRules,
            final: sanitizeOutboundSelection(ctx.settings.value.route_final, 'direct'),
            auto_detect_interface: !!ctx.settings.value.auto_detect_interface,
        };
        if (ruleSets.length > 0) route.rule_set = ruleSets;

        const config = {
            log: { level: ctx.settings.value.log_level, timestamp: true },
            dns: {
                servers: dnsServers,
                strategy: ctx.settings.value.dns_strategy || undefined,
                final: ctx.settings.value.dns_final || undefined,
                disable_cache: ctx.settings.value.dns_disable_cache || undefined,
                disable_expire: ctx.settings.value.dns_disable_expire || undefined,
                cache_capacity: ctx.settings.value.dns_cache_capacity || undefined,
                client_subnet: ctx.settings.value.dns_client_subnet || undefined,
            },
            inbounds,
            outbounds: [
                { type: 'direct', tag: 'direct' },
                ...customOutbounds,
            ],
            route,
        };

        return JSON.stringify(config, function replacer(key, value) {
            if (Array.isArray(value) && value.length === 0) {
                if (key === 'users' && this && typeof this === 'object' && typeof this.type === 'string') {
                    if (INBOUND_TYPES_WITH_REQUIRED_USERS.includes(this.type) || this.type === 'shadowtls' || this.type === 'shadowsocks') {
                        return value;
                    }
                }
                return undefined;
            }
            if (value === undefined || value === null || value === '') return undefined;
            return value;
        }, 2);
    });
    const runtimeValidationErrors = computed(() => {
        const errors = [];
        const availableInboundTags = buildInboundTagMap();
        const dnsServers = buildDnsServers();
        const availableDnsTags = buildDnsTagSet(dnsServers);
        const exportableRuleSets = buildExportableRuleSets();
        const exportableRuleSetTags = buildRuleSetTagSet(exportableRuleSets);
        const exportableOutbounds = buildExportableRemoteOutbounds();
        const exportableOutboundTags = buildExportableOutboundTagSet(exportableOutbounds);

        collectDuplicateTags(ctx.serverInbounds.value).forEach((tag) => {
            errors.push(`入站 tag "${tag}" 重复`);
        });
        collectDuplicateTags(dnsServers).forEach((tag) => {
            errors.push(`DNS 服务器 tag "${tag}" 重复`);
        });
        collectDuplicateTags(exportableRuleSets).forEach((tag) => {
            errors.push(`规则集 tag "${tag}" 重复`);
        });
        collectDuplicateTags(ctx.remoteOutbounds.value).forEach((tag) => {
            errors.push(`远端出站 tag "${tag}" 重复`);
        });
        ctx.remoteOutbounds.value.forEach((outbound, outboundIndex) => {
            const outboundTag = String(outbound?.tag || '').trim() || `relay-${outboundIndex + 1}`;
            if (!BUILTIN_OUTBOUND_TAGS.has(outboundTag)) return;
            errors.push(`远端出站 "${outboundTag}" 不能使用保留 tag`);
        });

        ctx.serverInbounds.value.forEach((inbound, inboundIndex) => {
            const inboundTag = inbound?.tag || `inbound-${inboundIndex + 1}`;
            const sanitizedInbound = sanitizeInboundForExport(inbound);
            const capabilities = typeof ctx.resolveInboundCapabilities === 'function' ? ctx.resolveInboundCapabilities(sanitizedInbound) : null;
            const builtUsers = buildUsers(sanitizedInbound);
            const detour = String(sanitizedInbound?.detour || '').trim();
            const routingMark = parseRoutingMark(sanitizedInbound?.routing_mark);

            if (capabilities?.requiresTls && !sanitizedInbound?.tls_enabled) {
                errors.push(`入站 "${inboundTag}" 的协议要求启用 TLS`);
            }
            if (!routingMark.empty && !routingMark.valid) {
                errors.push(`入站 "${inboundTag}" 的 routing_mark 必须是十进制整数或 0x 开头的十六进制字符串`);
            }
            if (detour) {
                if (detour === inboundTag) {
                    errors.push(`入站 "${inboundTag}" 的 detour 不能指向自己`);
                } else if (!availableInboundTags.has(detour)) {
                    errors.push(`入站 "${inboundTag}" 的 detour 指向了不存在的入站 "${detour}"`);
                } else {
                    const detourType = String(availableInboundTags.get(detour) || '').trim();
                    if (!supportsInjectableInbound(detourType)) {
                        errors.push(`入站 "${inboundTag}" 的 detour 指向了不支持 Injectable 的入站 "${detour}"`);
                    }
                }
            }
            if (sanitizedInbound?.tls_enabled) {
                const hasCertificate = !!String(sanitizedInbound?.tls_certificate || sanitizedInbound?.tls_cert_path || '').trim();
                const hasKey = !!String(sanitizedInbound?.tls_key || sanitizedInbound?.tls_key_path || '').trim();
                if (!hasCertificate || !hasKey) {
                    errors.push(`入站 "${inboundTag}" 已启用 TLS，但缺少证书链或私钥（可填写 PEM 内容或文件路径）`);
                }
            }
            if (inbound?.reality_enabled && !capabilities?.supportsReality) {
                errors.push(`入站 "${inboundTag}" 当前协议不支持 Reality`);
            }
            if (capabilities?.activeTransport === 'grpc' && !String(sanitizedInbound?.transport_service_name || '').trim()) {
                errors.push(`入站 "${inboundTag}" 使用 gRPC transport 时建议填写 service_name，当前导出会生成空 service_name`);
            }
            if (capabilities?.activeTransport === 'ws' && String(sanitizedInbound?.transport_early_data_header_name || '').trim()) {
                const maxEarlyData = parseOptionalInteger(sanitizedInbound?.transport_early_data);
                if (!maxEarlyData || maxEarlyData <= 0) {
                    errors.push(`入站 "${inboundTag}" 设置了 WebSocket early_data_header_name，但 max_early_data 为空或为 0`);
                }
            }
            if (sanitizedInbound?.reality_enabled) {
                if (!String(sanitizedInbound?.reality_server || '').trim()) {
                    errors.push(`入站 "${inboundTag}" 已启用 Reality，但缺少 handshake server`);
                }
                if (!String(sanitizedInbound?.reality_private_key || '').trim()) {
                    errors.push(`入站 "${inboundTag}" 已启用 Reality，但缺少 private_key`);
                }
                if (!String(sanitizedInbound?.reality_short_id || '').trim()) {
                    errors.push(`入站 "${inboundTag}" 已启用 Reality，但缺少 short_id`);
                }
            }
            if (['vless', 'vmess', 'trojan', 'tuic', 'hysteria', 'hysteria2', 'anytls'].includes(sanitizedInbound?.type) && builtUsers.length === 0) {
                errors.push(`入站 "${inboundTag}" 缺少有效用户配置`);
            }
            if (sanitizedInbound?.type === 'hysteria') {
                const hasStringBandwidth = hasTextValue(sanitizedInbound?.hy_up) && hasTextValue(sanitizedInbound?.hy_down);
                const hasMbpsBandwidth = hasTextValue(sanitizedInbound?.hy_up_mbps) && hasTextValue(sanitizedInbound?.hy_down_mbps);
                if (!hasStringBandwidth && !hasMbpsBandwidth) {
                    errors.push(`Hysteria 入站 "${inboundTag}" 缺少 up/down 或 up_mbps/down_mbps`);
                }
                if ((hasTextValue(sanitizedInbound?.hy_up) || hasTextValue(sanitizedInbound?.hy_down))
                    && (!isValidHysteriaBandwidth(sanitizedInbound?.hy_up) || !isValidHysteriaBandwidth(sanitizedInbound?.hy_down))) {
                    errors.push(`Hysteria 入站 "${inboundTag}" 的 up/down 必须符合官方带宽格式，例如 100 Mbps 或 640 KBps`);
                }
                if ((hasTextValue(sanitizedInbound?.hy_up_mbps) || hasTextValue(sanitizedInbound?.hy_down_mbps))
                    && (parsePositiveInteger(sanitizedInbound?.hy_up_mbps) === undefined || parsePositiveInteger(sanitizedInbound?.hy_down_mbps) === undefined)) {
                    errors.push(`Hysteria 入站 "${inboundTag}" 的 up_mbps/down_mbps 必须是正整数`);
                }
                if (hasTextValue(sanitizedInbound?.hy_recv_window_conn) && parseNonNegativeInteger(sanitizedInbound?.hy_recv_window_conn) === undefined) {
                    errors.push(`Hysteria 入站 "${inboundTag}" 的 recv_window_conn 必须是非负整数`);
                }
                if (hasTextValue(sanitizedInbound?.hy_recv_window_client) && parseNonNegativeInteger(sanitizedInbound?.hy_recv_window_client) === undefined) {
                    errors.push(`Hysteria 入站 "${inboundTag}" 的 recv_window_client 必须是非负整数`);
                }
                if (hasTextValue(sanitizedInbound?.hy_max_conn_client) && parseNonNegativeInteger(sanitizedInbound?.hy_max_conn_client) === undefined) {
                    errors.push(`Hysteria 入站 "${inboundTag}" 的 max_conn_client 必须是非负整数`);
                }
            }
            if (sanitizedInbound?.mux_enabled && sanitizedInbound?.mux_brutal_enabled) {
                if (!hasTextValue(sanitizedInbound?.mux_brutal_up_mbps) || !hasTextValue(sanitizedInbound?.mux_brutal_down_mbps)) {
                    errors.push(`入站 "${inboundTag}" 启用 Multiplex Brutal 时缺少 up_mbps/down_mbps`);
                } else if (parsePositiveInteger(sanitizedInbound?.mux_brutal_up_mbps) === undefined || parsePositiveInteger(sanitizedInbound?.mux_brutal_down_mbps) === undefined) {
                    errors.push(`入站 "${inboundTag}" 的 Multiplex Brutal up_mbps/down_mbps 必须是正整数`);
                }
            }
            if (sanitizedInbound?.type === 'shadowtls') {
                const shadowTlsCaps = capabilities?.shadowtls;
                const wildcardAll = shadowTlsCaps?.allowWildcardSni && String(sanitizedInbound?.shadowtls_wildcard_sni || 'off') === 'all';
                if (!wildcardAll && !String(sanitizedInbound?.shadowtls_handshake_server || '').trim()) {
                    errors.push(`ShadowTLS 入站 "${inboundTag}" 缺少 handshake server；仅 wildcard_sni=all 时可省略`);
                }
                if (shadowTlsCaps?.version === '2' && !String(sanitizedInbound?.shadowtls_password || '').trim()) {
                    errors.push(`ShadowTLS 入站 "${inboundTag}" 在 v2 模式下缺少 password`);
                }
                if (shadowTlsCaps?.version === '3' && builtUsers.length === 0) {
                    errors.push(`ShadowTLS 入站 "${inboundTag}" 在 v3 模式下缺少有效用户配置`);
                }
            }
            if (inbound?.type === 'hysteria2' && inbound?.hy2_ignore_client_bandwidth) {
                if (hasTextValue(inbound?.hy2_up_mbps) || hasTextValue(inbound?.hy2_down_mbps)) {
                    errors.push(`Hysteria2 入站 "${inboundTag}" 开启 ignore_client_bandwidth 时，不应继续填写 up_mbps/down_mbps`);
                }
            } else if (sanitizedInbound?.type === 'hysteria2') {
                if (hasTextValue(sanitizedInbound?.hy2_up_mbps) && parsePositiveInteger(sanitizedInbound?.hy2_up_mbps) === undefined) {
                    errors.push(`Hysteria2 入站 "${inboundTag}" 的 up_mbps 必须是正整数`);
                }
                if (hasTextValue(sanitizedInbound?.hy2_down_mbps) && parsePositiveInteger(sanitizedInbound?.hy2_down_mbps) === undefined) {
                    errors.push(`Hysteria2 入站 "${inboundTag}" 的 down_mbps 必须是正整数`);
                }
            }
            if (inbound?.type !== 'shadowsocks') return;
            const shadowsocksInboundTag = inbound.tag || `shadowsocks-in-${inboundIndex + 1}`;
            const method = inbound.ss_method || '2022-blake3-aes-128-gcm';
            if (!getShadowsocks2022KeyLength(method)) return;

            if (inbound.ss_mode === 'multi-user') {
                (Array.isArray(inbound.users) ? inbound.users : []).forEach((user, userIndex) => {
                    if (!String(user?.password || '').trim()) return;
                    if (isValidShadowsocks2022Password(method, user.password)) return;
                    const userLabel = user?.name ? `用户 "${user.name}"` : `用户 #${userIndex + 1}`;
                    errors.push(buildShadowsocks2022PasswordError(`Shadowsocks 入站 "${shadowsocksInboundTag}" 的${userLabel}`, method));
                });
                return;
            }

            if (inbound.ss_mode === 'relay') {
                (Array.isArray(inbound.ss_destinations) ? inbound.ss_destinations : []).forEach((destination, destinationIndex) => {
                    if (!String(destination?.password || '').trim()) return;
                    if (isValidShadowsocks2022Password(method, destination.password)) return;
                    const destinationLabel = destination?.name ? `目标 "${destination.name}"` : `目标 #${destinationIndex + 1}`;
                    errors.push(buildShadowsocks2022PasswordError(`Shadowsocks 入站 "${shadowsocksInboundTag}" 的${destinationLabel}`, method));
                });
                return;
            }

            if (!String(inbound.ss_password || '').trim()) return;
            if (!isValidShadowsocks2022Password(method, inbound.ss_password)) {
                errors.push(buildShadowsocks2022PasswordError(`Shadowsocks 入站 "${shadowsocksInboundTag}"`, method));
            }
        });

        if (ctx.settings.value.dns_final) {
            const dnsFinal = String(ctx.settings.value.dns_final || '').trim();
            if (dnsFinal && !availableDnsTags.has(dnsFinal)) {
                errors.push(`最终 DNS "${dnsFinal}" 指向了不存在的 DNS 服务器 tag`);
            }
        }

        ctx.dnsList.value.forEach((dns, dnsIndex) => {
            const dnsTag = String(dns?.tag || '').trim() || `dns-${dnsIndex + 1}`;
            const dnsType = String(dns?.type || 'udp').trim();
            const server = String(dns?.server || '').trim();
            const domainResolver = String(dns?.domain_resolver || '').trim();
            const detour = sanitizeOutboundSelection(dns?.detour, '', { allowEmpty: true });

            if (dnsType !== 'local' && !server) {
                errors.push(`DNS 服务器 "${dnsTag}" 缺少 server`);
            }
            if (dnsType !== 'local' && server && !isLikelyIpLiteral(server) && !domainResolver) {
                errors.push(`DNS 服务器 "${dnsTag}" 使用域名作为 server 时，必须设置 domain_resolver`);
            }
            if (dnsType !== 'local' && domainResolver) {
                if (domainResolver === dnsTag) {
                    errors.push(`DNS 服务器 "${dnsTag}" 的 domain_resolver 不能指向自己`);
                } else if (!availableDnsTags.has(domainResolver)) {
                    errors.push(`DNS 服务器 "${dnsTag}" 的 domain_resolver 指向了不存在的 DNS 服务器 "${domainResolver}"`);
                }
            }
            if (detour && !hasExportableOutboundTag(detour, exportableOutboundTags)) {
                errors.push(`DNS 服务器 "${dnsTag}" 的 detour 指向了未导出的远端出站 "${detour}"`);
            }
        });

        ctx.remoteOutbounds.value.forEach((outbound, outboundIndex) => {
            const outboundTag = String(outbound?.tag || '').trim() || `relay-${outboundIndex + 1}`;
            const sanitizedOutbound = sanitizeRemoteOutboundForExport(outbound);
            const capabilities = typeof ctx.resolveRemoteOutboundCapabilities === 'function' ? ctx.resolveRemoteOutboundCapabilities(sanitizedOutbound) : null;
            const outboundType = String(sanitizedOutbound?.type || '').trim();
            const outboundServer = String(sanitizedOutbound?.server || '').trim();
            const outboundPort = parseOptionalInteger(sanitizedOutbound?.server_port);

            if (!outboundServer) {
                errors.push(`远端出站 "${outboundTag}" 缺少 server`);
            }
            if (outboundPort === undefined || outboundPort <= 0) {
                errors.push(`远端出站 "${outboundTag}" 的 server_port 必须是正整数`);
            }
            if (capabilities?.requiresTls && !sanitizedOutbound?.tls_enabled) {
                errors.push(`远端出站 "${outboundTag}" 的协议要求启用 TLS`);
            }
            if (capabilities?.supportsTransport && capabilities?.activeTransport === 'grpc' && !String(sanitizedOutbound?.transport_service_name || '').trim()) {
                errors.push(`远端出站 "${outboundTag}" 使用 gRPC transport 时建议填写 service_name，当前导出会生成空 service_name`);
            }
            if (outboundType === 'vless' && !String(sanitizedOutbound?.uuid || '').trim()) {
                errors.push(`VLESS 远端出站 "${outboundTag}" 缺少 uuid`);
            }
            if (outboundType === 'vmess' && !String(sanitizedOutbound?.uuid || '').trim()) {
                errors.push(`VMess 远端出站 "${outboundTag}" 缺少 uuid`);
            }
            if (outboundType === 'trojan' && !String(sanitizedOutbound?.password || '').trim()) {
                errors.push(`Trojan 远端出站 "${outboundTag}" 缺少 password`);
            }
            if (outboundType === 'shadowsocks') {
                if (!String(sanitizedOutbound?.method || '').trim()) {
                    errors.push(`Shadowsocks 远端出站 "${outboundTag}" 缺少 method`);
                }
                if (!String(sanitizedOutbound?.password || '').trim()) {
                    errors.push(`Shadowsocks 远端出站 "${outboundTag}" 缺少 password`);
                }
                const method = sanitizedOutbound?.method || '2022-blake3-aes-128-gcm';
                if (getShadowsocks2022KeyLength(method) && String(sanitizedOutbound?.password || '').trim()
                    && !isValidShadowsocks2022Password(method, sanitizedOutbound.password)) {
                    errors.push(buildShadowsocks2022PasswordError(`Shadowsocks 远端出站 "${outboundTag}"`, method));
                }
            }
            if (outboundType === 'hysteria2') {
                if (!String(sanitizedOutbound?.password || '').trim()) {
                    errors.push(`Hysteria2 远端出站 "${outboundTag}" 缺少 password`);
                }
            }
            if (outboundType === 'tuic') {
                if (!String(sanitizedOutbound?.uuid || '').trim()) {
                    errors.push(`TUIC 远端出站 "${outboundTag}" 缺少 uuid`);
                }
                if (!String(sanitizedOutbound?.password || '').trim()) {
                    errors.push(`TUIC 远端出站 "${outboundTag}" 缺少 password`);
                }
            }
            if (outboundType === 'wireguard') {
                if (parseList(sanitizedOutbound?.local_address).length === 0) {
                    errors.push(`WireGuard 远端出站 "${outboundTag}" 缺少 local_address`);
                }
                if (!String(sanitizedOutbound?.private_key || '').trim()) {
                    errors.push(`WireGuard 远端出站 "${outboundTag}" 缺少 private_key`);
                }
                if (!String(sanitizedOutbound?.peer_public_key || '').trim()) {
                    errors.push(`WireGuard 远端出站 "${outboundTag}" 缺少 peer_public_key`);
                }
            }
        });
        const finalOutbound = sanitizeOutboundSelection(ctx.settings.value.route_final, 'direct');
        if (!hasExportableOutboundTag(finalOutbound, exportableOutboundTags)) {
            errors.push(`默认出站 "${finalOutbound}" 没有对应已导出的远端出站配置`);
        }

        ctx.ruleSets.value.forEach((ruleSet, ruleSetIndex) => {
            if (!ruleSet?.enabled || ruleSet?.source_type !== 'remote') return;
            const downloadDetour = sanitizeOutboundSelection(ruleSet.download_detour, '', { allowEmpty: true });
            if (!downloadDetour || hasExportableOutboundTag(downloadDetour, exportableOutboundTags)) return;
            const ruleSetTag = ruleSet.tag || `ruleset-${ruleSetIndex + 1}`;
            errors.push(`规则集 "${ruleSetTag}" 的 download_detour 指向了未导出的远端出站 "${downloadDetour}"`);
        });

        ctx.routeRules.value.forEach((rule, ruleIndex) => {
            if (!rule?.enabled) return;
            const ruleLabel = String(rule?.name || '').trim() || `路由规则 #${ruleIndex + 1}`;
            const matchValues = parseList(rule.match_value);
            if (rule.match_type === 'port' && matchValues.some((item) => parseOptionalInteger(item) === undefined)) {
                errors.push(`路由规则 "${ruleLabel}" 的 port 必须是整数列表`);
            }
            if (rule.match_type === 'inbound') {
                const missingInboundTags = matchValues.filter((item) => !availableInboundTags.has(item));
                if (missingInboundTags.length > 0) {
                    errors.push(`路由规则 "${ruleLabel}" 引用了不存在的入站: ${Array.from(new Set(missingInboundTags)).join(', ')}`);
                }
            }
            if (rule.match_type === 'rule_set') {
                const missingRuleSetTags = matchValues.filter((item) => !exportableRuleSetTags.has(item));
                if (missingRuleSetTags.length > 0) {
                    errors.push(`路由规则 "${ruleLabel}" 引用了不存在或未导出的规则集: ${Array.from(new Set(missingRuleSetTags)).join(', ')}`);
                }
            }
            const normalizedRouteAction = normalizeRouteActionState(rule);
            if (normalizedRouteAction.action !== 'route') return;
            if (hasExportableOutboundTag(normalizedRouteAction.outbound, exportableOutboundTags)) return;
            errors.push(`路由规则 "${ruleLabel}" 的 outbound 指向了未导出的远端出站 "${normalizedRouteAction.outbound}"`);
        });

        return errors;
    });

    let jsonScrollTimer = null;

    const findLineIndex = (lines, matcher) => {
        if (!matcher) return -1;
        if (typeof matcher === 'function') return lines.findIndex((line, index) => matcher(line, index, lines));
        return lines.findIndex((line) => line.includes(matcher));
    };

    const findFirstMatchingLineIndex = (lines, matchers = []) => {
        for (const matcher of matchers) {
            const lineIndex = findLineIndex(lines, matcher);
            if (lineIndex !== -1) return lineIndex;
        }
        return -1;
    };

    const findNthMatchingLineIndex = (lines, matcher, occurrence = 0) => {
        let seen = 0;
        for (let index = 0; index < lines.length; index += 1) {
            if (!matcher(lines[index], index, lines)) continue;
            if (seen === occurrence) return index;
            seen += 1;
        }
        return -1;
    };

    const scrollJsonToLineIndex = async (lineIndex, { offset = 0, align = 0.5 } = {}) => {
        await nextTick();
        const el = ctx.jsonContainer.value;
        const text = ctx.generatedJson?.value;
        if (!el || !text) return;
        const lines = text.split('\n');
        if (lineIndex < 0 || lineIndex >= lines.length) return;
        const lineHeight = el.scrollHeight / Math.max(lines.length, 1) || 20;
        const targetLine = Math.max(0, Math.min(lines.length - 1, lineIndex + offset));
        const rawTop = targetLine * lineHeight - el.clientHeight * align;
        const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
        el.scrollTo({
            top: Math.max(0, Math.min(maxTop, rawTop)),
            behavior: 'smooth',
        });
    };

    const firstListValue = (value) => parseList(value)[0] || '';

    const resolveRouteRuleLineIndex = (lines, rule) => {
        const sourceIndex = ctx.routeRules.value.indexOf(rule);
        if (sourceIndex === -1) return -1;
        const builtRules = ctx.routeRules.value.map(buildRouteRule).filter(Boolean);
        if (!buildRouteRule(rule)) return -1;
        const occurrence = ctx.routeRules.value
            .slice(0, sourceIndex + 1)
            .map(buildRouteRule)
            .filter(Boolean)
            .length - 1;
        if (occurrence < 0 || occurrence >= builtRules.length) return -1;
        const actionLineIndex = findNthMatchingLineIndex(lines, (line) => line.includes('"action": '), occurrence);
        return actionLineIndex === -1 ? -1 : Math.max(0, actionLineIndex - 1);
    };

    const buildJsonScrollRequest = (type, payload = null) => {
        if (type === 'log') return { matchers: ['"log": {'] };
        if (type === 'dns-root') return { matchers: ['"dns": {'] };
        if (type === 'inbounds-root') return { matchers: ['"inbounds": ['] };
        if (type === 'outbounds-root') return { matchers: ['"outbounds": ['] };
        if (type === 'route-root') return { matchers: ['"route": {'] };
        if (type === 'rule-sets-root') return { matchers: ['"rule_set": [', '"route": {'] };
        if (type === 'route-rules-root') return { matchers: ['"rules": [', '"route": {'] };

        if (type === 'dns-server') {
            return {
                matchers: [
                    payload?.tag ? `"tag": ${JSON.stringify(payload.tag)}` : '',
                    payload?.server ? `"server": ${JSON.stringify(payload.server)}` : '',
                ],
                fallbackMatchers: ['"servers": [', '"dns": {'],
            };
        }

        if (type === 'inbound') {
            return {
                matchers: [
                    payload?.tag ? `"tag": ${JSON.stringify(payload.tag)}` : '',
                ],
                fallbackMatchers: ['"inbounds": ['],
            };
        }

        if (type === 'remote-outbound') {
            return {
                matchers: [
                    payload?.tag ? `"tag": ${JSON.stringify(payload.tag)}` : '',
                    payload?.server ? `"server": ${JSON.stringify(payload.server)}` : '',
                ],
                fallbackMatchers: ['"outbounds": ['],
            };
        }

        if (type === 'rule-set') {
            return {
                matchers: [
                    payload?.tag ? `"tag": ${JSON.stringify(payload.tag)}` : '',
                    payload?.url ? `"url": ${JSON.stringify(payload.url)}` : '',
                    payload?.path ? `"path": ${JSON.stringify(payload.path)}` : '',
                ],
                fallbackMatchers: ['"rule_set": [', '"route": {'],
            };
        }

        if (type === 'route-rule') {
            const firstValue = firstListValue(payload?.match_value);
            const valueMatcher = firstValue ? JSON.stringify(firstValue) : '';
            return {
                lineIndexResolver: (lines) => resolveRouteRuleLineIndex(lines, payload),
                matchers: [valueMatcher],
                fallbackMatchers: ['"rules": [', '"route": {'],
            };
        }

        return null;
    };

    const scrollJsonToRequest = async (type, payload = null) => {
        const request = buildJsonScrollRequest(type, payload);
        await nextTick();
        const text = ctx.generatedJson?.value;
        if (!request || !text) return;
        const lines = text.split('\n');
        let lineIndex = typeof request.lineIndexResolver === 'function' ? request.lineIndexResolver(lines) : -1;
        if (lineIndex === -1) lineIndex = findFirstMatchingLineIndex(lines, request.matchers);
        if (lineIndex === -1) lineIndex = findFirstMatchingLineIndex(lines, request.fallbackMatchers);
        if (lineIndex === -1) return;
        await scrollJsonToLineIndex(lineIndex);
    };

    const queueJsonScrollTo = (type, payload = null) => {
        clearTimeout(jsonScrollTimer);
        jsonScrollTimer = setTimeout(() => {
            scrollJsonToRequest(type, payload);
        }, 70);
    };

    const wrapInsertMethod = (name, resolver) => {
        if (typeof ctx[name] !== 'function') return;
        const original = ctx[name];
        ctx[name] = (...args) => {
            const result = original(...args);
            const target = resolver(...args);
            if (target?.type) queueJsonScrollTo(target.type, target.payload);
            return result;
        };
    };

    wrapInsertMethod('addDnsServer', () => ({
        type: 'dns-server',
        payload: ctx.dnsList.value[ctx.dnsList.value.length - 1] || null,
    }));
    wrapInsertMethod('addInbound', (_, placement = 'bottom') => ({
        type: 'inbound',
        payload: placement === 'top' ? ctx.serverInbounds.value[0] : ctx.serverInbounds.value[ctx.serverInbounds.value.length - 1],
    }));
    wrapInsertMethod('addRemoteOutbound', () => ({
        type: 'remote-outbound',
        payload: ctx.remoteOutbounds.value[ctx.remoteOutbounds.value.length - 1] || null,
    }));
    wrapInsertMethod('addRuleSet', () => ({
        type: 'rule-set',
        payload: ctx.ruleSets.value[ctx.ruleSets.value.length - 1] || null,
    }));
    wrapInsertMethod('addRuleSetTemplate', (tag) => ({
        type: 'rule-set',
        payload: ctx.ruleSets.value.find((item) => item.tag === tag) || null,
    }));
    wrapInsertMethod('addRouteRule', () => ({
        type: 'route-rule',
        payload: ctx.routeRules.value[ctx.routeRules.value.length - 1] || null,
    }));

    watch(ctx.currentTab, (tab) => {
        const tabTargetMap = {
            basic: 'log',
            dns: 'dns-root',
            inbounds: 'inbounds-root',
            route: 'outbounds-root',
            share: 'inbounds-root',
        };
        if (tabTargetMap[tab]) queueJsonScrollTo(tabTargetMap[tab]);
    });

    const getFullState = () => ({
        _version: '1.12-server',
        _exported: new Date().toISOString(),
        settings: ctx.settings.value,
        dnsList: ctx.dnsList.value,
        remoteOutbounds: ctx.remoteOutbounds.value,
        ruleSets: ctx.ruleSets.value,
        serverInbounds: ctx.serverInbounds.value,
        routeRules: ctx.routeRules.value,
    });

    Object.assign(ctx, {
        exportableOutboundOptions,
        generatedJson,
        runtimeValidationErrors,
        queueJsonScrollTo,
        scrollJsonToRequest,
        getFullState,
    });
}
