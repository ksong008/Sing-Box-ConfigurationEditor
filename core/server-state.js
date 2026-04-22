const { ref } = window.Vue;

const INBOUND_TYPES = ['vless', 'vmess', 'trojan', 'shadowsocks', 'hysteria2', 'tuic', 'hysteria', 'anytls', 'shadowtls'];
const TLS_TYPES = ['vless', 'vmess', 'trojan', 'hysteria2', 'tuic', 'hysteria', 'anytls'];
const DEFAULT_TLS_TYPES = ['vless', 'vmess', 'trojan', 'hysteria2', 'tuic', 'hysteria', 'anytls'];
const TRANSPORT_TYPES = ['vless', 'vmess', 'trojan'];
const MULTIPLEX_TYPES = ['vless', 'vmess', 'trojan', 'shadowsocks'];

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

export function createServerState() {
    const generateId = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;

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

    const makeInboundUser = () => ({
        id: generateId('user'),
        name: '',
        uuid: '',
        password: '',
        flow: '',
        alterId: 0,
        auth: '',
        auth_str: '',
    });

    const makeSsDestination = () => ({
        id: generateId('ss_dest'),
        name: '',
        server: '',
        server_port: 443,
        password: '',
    });

    const inboundSupportsTls = (type) => TLS_TYPES.includes(type);
    const inboundSupportsTransport = (type) => TRANSPORT_TYPES.includes(type);
    const inboundSupportsMultiplex = (type) => MULTIPLEX_TYPES.includes(type);
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
                ? inbound.shadowtls_wildcard_sni
                : (inbound.wildcard_sni || 'off'),
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
        { id: 'advanced', name: '高级', icon: 'fas fa-sliders-h' },
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
    });

    const dnsList = ref([
        normalizeDnsServer({ tag: 'public-dns', type: 'https', server: '1.1.1.1', path: '/dns-query' }, 0),
        normalizeDnsServer({ tag: 'bootstrap-dns', type: 'udp', server: '223.5.5.5' }, 1),
    ]);

    const serverInbounds = ref([
        normalizeInbound({
            tag: 'vless-in',
            type: 'vless',
            listen: '::',
            listen_port: 443,
            users: [makeInboundUser()],
            tls_enabled: true,
        }, 0),
    ]);

    const routeRules = ref([
        {
            id: generateId('rule'),
            enabled: true,
            name: 'DNS 劫持',
            match_type: 'protocol',
            match_value: 'dns',
            action: 'hijack-dns',
            outbound: 'direct',
        },
    ]);

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
        inbound.users.push(makeInboundUser());
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

    const addRouteRule = () => {
        routeRules.value.push({
            id: generateId('rule'),
            enabled: true,
            name: '自定义路由',
            match_type: 'protocol',
            match_value: '',
            action: 'route',
            outbound: 'direct',
        });
    };
    const removeRouteRule = (index) => {
        routeRules.value.splice(index, 1);
    };

    return {
        generateId,
        showToast,
        showConfirm,
        copyToClipboard,
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
        normalizeDnsServer,
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
        inboundSupportsTls,
        inboundSupportsTransport,
        inboundSupportsMultiplex,
        inboundUsesUsers,
        inboundUsesDestinations,
        routeRules,
        addRouteRule,
        removeRouteRule,
    };
}
