import { sanitizeNodeByCapabilities } from './node-capabilities.js';

const RESERVED_RUNTIME_INBOUND_TAGS = new Set(['mixed-in', 'tun-in', 'tproxy-in', 'dns-in']);

const toCsv = (value) => {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean).join(', ');
    return String(value || '');
};

const toLines = (value) => {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean).join('\n');
    return String(value || '');
};

const headersToText = (headers) => {
    if (!headers || typeof headers !== 'object') return '';
    return Object.entries(headers)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
};

export const looksLikeRuntimeConfig = (data) => Object.prototype.toString.call(data) === '[object Object]' && (
    Array.isArray(data.outbounds)
    || Array.isArray(data.inbounds)
    || Object.prototype.toString.call(data.route) === '[object Object]'
    || Object.prototype.toString.call(data.dns) === '[object Object]'
);

export function createRuntimeImporter(ctx, {
    resetRuntimeImportState,
    absorbFakeipServer,
} = {}) {
    const resetRuntime = typeof resetRuntimeImportState === 'function' ? resetRuntimeImportState : () => {};
    const absorbFakeip = typeof absorbFakeipServer === 'function' ? absorbFakeipServer : () => {};

    const parseRuntimeDialFields = (target, source = {}) => {
        target.detour = typeof source.detour === 'string' && source.detour !== 'direct' ? source.detour : '';
        target.bind_interface = typeof source.bind_interface === 'string' ? source.bind_interface : '';
        target.inet4_bind_address = typeof source.inet4_bind_address === 'string' ? source.inet4_bind_address : '';
        target.inet6_bind_address = typeof source.inet6_bind_address === 'string' ? source.inet6_bind_address : '';
        target.routing_mark = source.routing_mark === null || source.routing_mark === undefined ? '' : String(source.routing_mark);
        target.reuse_addr = !!source.reuse_addr;
        target.netns = typeof source.netns === 'string' ? source.netns : '';
        target.connect_timeout = typeof source.connect_timeout === 'string' ? source.connect_timeout : '';
        target.tcp_fast_open = !!source.tcp_fast_open;
        target.tcp_multi_path = !!source.tcp_multi_path;
        target.udp_fragment = !!source.udp_fragment;
        target.domain_resolver = typeof source.domain_resolver === 'string'
            ? source.domain_resolver
            : (source.domain_resolver && typeof source.domain_resolver.server === 'string' ? source.domain_resolver.server : '');
        target.network_strategy = typeof source.network_strategy === 'string' ? source.network_strategy : '';
        target.network_type = toCsv(source.network_type);
        target.fallback_network_type = toCsv(source.fallback_network_type);
        target.fallback_delay = typeof source.fallback_delay === 'string' ? source.fallback_delay : '';
        target.domain_strategy = typeof source.domain_strategy === 'string' ? source.domain_strategy : '';
    };

    const parseRuntimeTls = (node, tls = {}) => {
        if (!tls || tls.enabled === false) return;
        node.tls = true;
        node.disable_sni = !!tls.disable_sni;
        node.insecure = !!tls.insecure;
        node.sni = typeof tls.server_name === 'string' ? tls.server_name : node.sni;
        node.alpn = Array.isArray(tls.alpn) ? tls.alpn.join(', ') : String(tls.alpn || '');
        node.tls_min_version = typeof tls.min_version === 'string' ? tls.min_version : '';
        node.tls_max_version = typeof tls.max_version === 'string' ? tls.max_version : '';
        node.cipher_suites = Array.isArray(tls.cipher_suites) ? tls.cipher_suites.join(', ') : String(tls.cipher_suites || '');
        if (tls.utls && tls.utls.enabled) node.utls_fingerprint = tls.utls.fingerprint || '';
        node.ech_enabled = !!(tls.ech && tls.ech.enabled);
        node.ech_config = tls.ech && Array.isArray(tls.ech.config) ? tls.ech.config.join('\n') : '';
        node.tls_fragment = !!tls.fragment;
        node.tls_record_fragment = !!tls.record_fragment;
        node.tls_fragment_fallback_delay = typeof tls.fragment_fallback_delay === 'string' ? tls.fragment_fallback_delay : '';
        if (tls.reality && tls.reality.enabled) {
            node.reality = true;
            node.reality_pubkey = tls.reality.public_key || '';
            node.reality_sid = tls.reality.short_id || '';
        }
    };

    const parseRuntimeTransport = (node, transport = {}) => {
        if (!transport || typeof transport.type !== 'string') return;
        node.transport = transport.type;
        if (transport.type === 'ws') {
            node.path = transport.path || '/';
            const headers = { ...(transport.headers || {}) };
            if (headers.Host) {
                node.ws_host = headers.Host;
                delete headers.Host;
            }
            node.transport_headers_text = headersToText(headers);
            node.transport_max_early_data = transport.max_early_data === null || transport.max_early_data === undefined ? '' : String(transport.max_early_data);
            node.transport_early_data_header_name = transport.early_data_header_name || '';
        } else if (transport.type === 'grpc') {
            node.path = transport.service_name || '';
            node.transport_idle_timeout = transport.idle_timeout || '';
            node.transport_ping_timeout = transport.ping_timeout || '';
            node.transport_permit_without_stream = !!transport.permit_without_stream;
        } else if (transport.type === 'http') {
            node.path = transport.path || '/';
            node.ws_host = Array.isArray(transport.host) ? transport.host.join(', ') : String(transport.host || '');
            node.transport_method = transport.method || '';
            node.transport_headers_text = headersToText(transport.headers);
            node.transport_idle_timeout = transport.idle_timeout || '';
            node.transport_ping_timeout = transport.ping_timeout || '';
        } else if (transport.type === 'httpupgrade') {
            node.path = transport.path || '/';
            node.ws_host = transport.host || '';
            node.transport_headers_text = headersToText(transport.headers);
        }
    };

    const parseRuntimeMultiplex = (node, multiplex = {}) => {
        if (!multiplex || !multiplex.enabled) return;
        node.mux_enabled = true;
        node.mux_protocol = multiplex.protocol || 'h2mux';
        node.mux_max_connections = multiplex.max_connections === null || multiplex.max_connections === undefined ? 4 : multiplex.max_connections;
        node.mux_min_streams = multiplex.min_streams === null || multiplex.min_streams === undefined ? 4 : multiplex.min_streams;
        node.mux_max_streams = multiplex.max_streams === null || multiplex.max_streams === undefined ? '' : String(multiplex.max_streams);
        node.mux_padding = !!multiplex.padding;
        if (multiplex.brutal && multiplex.brutal.enabled) {
            node.mux_brutal_enabled = true;
            node.mux_brutal_up_mbps = multiplex.brutal.up_mbps === null || multiplex.brutal.up_mbps === undefined ? '' : String(multiplex.brutal.up_mbps);
            node.mux_brutal_down_mbps = multiplex.brutal.down_mbps === null || multiplex.brutal.down_mbps === undefined ? '' : String(multiplex.brutal.down_mbps);
        }
    };

    const runtimeOutboundToNode = (outbound = {}) => {
        if (!outbound || typeof outbound.type !== 'string' || !outbound.tag) return null;
        const type = outbound.type;
        if (['direct', 'block', 'selector', 'urltest'].includes(type)) return null;

        const node = ctx.makeNode({
            tag: outbound.tag,
            type,
            server: outbound.server || '',
            port: outbound.server_port || 443,
            collapsed: false,
        });
        parseRuntimeDialFields(node, outbound);

        if (type === 'vless') {
            node.secret = outbound.uuid || '';
            node.flow = outbound.flow || '';
        } else if (type === 'vmess') {
            node.secret = outbound.uuid || '';
            node.vmess_security = outbound.security || 'auto';
            node.vmess_alter_id = outbound.alter_id || 0;
            node.vmess_global_padding = !!outbound.global_padding;
            node.vmess_authenticated_length = outbound.authenticated_length !== false;
        } else if (type === 'trojan') {
            node.secret = outbound.password || '';
        } else if (type === 'shadowsocks') {
            node.secret = outbound.password || '';
            node.ss_method = outbound.method || node.ss_method;
            node.network = typeof outbound.network === 'string' ? outbound.network : '';
            node.ss_plugin = outbound.plugin || '';
            node.ss_plugin_opts = outbound.plugin_opts || '';
            if (outbound.udp_over_tcp && outbound.udp_over_tcp.enabled) {
                node.ss_udp_over_tcp = true;
                node.ss_udp_over_tcp_version = String(outbound.udp_over_tcp.version || '2');
            }
        } else if (type === 'socks') {
            node.socks_version = String(outbound.version || '5');
            node.username = outbound.username || '';
            node.secret = outbound.password || '';
            node.socks_network = typeof outbound.network === 'string' ? outbound.network : '';
            if (outbound.udp_over_tcp && outbound.udp_over_tcp.enabled) {
                node.socks_udp_over_tcp = true;
                node.socks_udp_over_tcp_version = String(outbound.udp_over_tcp.version || '2');
            }
        } else if (type === 'http') {
            node.username = outbound.username || '';
            node.secret = outbound.password || '';
            node.http_path = outbound.path || '';
            node.http_headers_text = headersToText(outbound.headers);
        } else if (type === 'wireguard') {
            node.wg_private_key = outbound.private_key || '';
            const peer = Array.isArray(outbound.peers) ? (outbound.peers[0] || {}) : {};
            node.wg_peer_pubkey = peer.public_key || '';
            node.server = peer.server || '';
            node.port = peer.server_port || 443;
            node.wg_psk = peer.pre_shared_key || '';
            node.wg_local_address = Array.isArray(outbound.local_address) ? (outbound.local_address[0] || '') : '';
            node.wg_mtu = outbound.mtu || node.wg_mtu;
            node.wg_reserved = Array.isArray(outbound.reserved) ? outbound.reserved.join(',') : '';
            node.wg_system_interface = !!outbound.system_interface;
            node.wg_interface_name = outbound.interface_name || '';
            node.wg_workers = outbound.workers === null || outbound.workers === undefined ? '' : String(outbound.workers);
            node.wg_network = typeof outbound.network === 'string' ? outbound.network : '';
        } else if (type === 'ssh') {
            node.username = outbound.user || '';
            if (outbound.private_key) {
                node.ssh_auth_type = 'key';
                node.secret = outbound.private_key;
            } else {
                node.ssh_auth_type = 'password';
                node.secret = outbound.password || '';
            }
        } else if (type === 'shadowtls') {
            node.shadowtls_password = outbound.password || '';
            node.shadowtls_version = String(outbound.version || '3');
        } else if (type === 'tor') {
            node.tor_executable_path = outbound.executable_path || '';
            node.tor_data_directory = outbound.data_directory || '';
            node.tor_extra_args = Array.isArray(outbound.extra_args) ? outbound.extra_args.join(' ') : '';
        } else if (type === 'hysteria2') {
            node.secret = outbound.password || '';
            node.hy2_up = outbound.up_mbps || '';
            node.hy2_down = outbound.down_mbps || '';
            if (outbound.obfs) {
                node.hy2_obfs_type = outbound.obfs.type || '';
                node.hy2_obfs_password = outbound.obfs.password || '';
            }
            node.hy2_server_ports = toCsv(outbound.server_ports);
            node.hy2_hop_interval = outbound.hop_interval || '';
            node.hy2_network = typeof outbound.network === 'string' ? outbound.network : '';
        } else if (type === 'hysteria') {
            node.secret = outbound.auth_str || outbound.auth || '';
            node.hy_auth_type = outbound.auth ? 'base64' : 'str';
            node.hy_up_mbps = outbound.up_mbps || node.hy_up_mbps;
            node.hy_down_mbps = outbound.down_mbps || node.hy_down_mbps;
            node.hy_obfs = outbound.obfs || '';
            node.hy_server_ports = toCsv(outbound.server_ports);
            node.hy_hop_interval = outbound.hop_interval || '';
            node.hy_network = typeof outbound.network === 'string' ? outbound.network : '';
        } else if (type === 'tuic') {
            node.secret = outbound.uuid || '';
            node.tuic_password = outbound.password || '';
            node.tuic_congestion = outbound.congestion_control || node.tuic_congestion;
            node.tuic_network = typeof outbound.network === 'string' ? outbound.network : '';
            node.tuic_udp_over_stream = !!outbound.udp_over_stream;
            node.tuic_udp_relay_mode = outbound.udp_relay_mode || node.tuic_udp_relay_mode;
            node.tuic_zero_rtt_handshake = !!outbound.zero_rtt_handshake;
            node.tuic_heartbeat = outbound.heartbeat || '';
        } else if (type === 'anytls') {
            node.secret = outbound.password || '';
            node.anytls_idle_session_check_interval = outbound.idle_session_check_interval || '';
        } else if (type === 'naive') {
            node.username = outbound.username || '';
            node.secret = outbound.password || '';
        } else if (type === 'dns') {
            // no extra fields currently exposed
        } else {
            return null;
        }

        parseRuntimeTls(node, outbound.tls);
        parseRuntimeTransport(node, outbound.transport);
        parseRuntimeMultiplex(node, outbound.multiplex);
        return sanitizeNodeByCapabilities(node);
    };

    const runtimeOutboundToGroup = (outbound = {}) => {
        if (!outbound || !['selector', 'urltest'].includes(outbound.type) || !outbound.tag) return null;
        return ctx.normalizeGroup({
            tag: outbound.tag,
            type: outbound.type,
            members: Array.isArray(outbound.outbounds) ? outbound.outbounds : [],
            url: outbound.url || 'https://www.gstatic.com/generate_204',
            interval: outbound.interval || '3m',
            tolerance: outbound.tolerance === null || outbound.tolerance === undefined ? 50 : outbound.tolerance,
            collapsed: false,
        });
    };

    const runtimeDnsServerToPanel = (server = {}, index = 0) => {
        const mapped = {
            tag: server.tag,
            type: server.type,
            server: server.server || '',
            server_port: server.server_port,
            detour: server.detour || '',
            domain_resolver: typeof server.domain_resolver === 'string'
                ? server.domain_resolver
                : (server.domain_resolver && typeof server.domain_resolver.server === 'string' ? server.domain_resolver.server : ''),
            path: server.path || '',
            headers: server.headers || undefined,
            client_subnet: server.client_subnet || '',
            bind_interface: server.bind_interface || '',
            inet4_bind_address: server.inet4_bind_address || '',
            inet6_bind_address: server.inet6_bind_address || '',
            routing_mark: server.routing_mark,
            reuse_addr: !!server.reuse_addr,
            netns: server.netns || '',
            connect_timeout: server.connect_timeout || '',
            tcp_fast_open: !!server.tcp_fast_open,
            tcp_multi_path: !!server.tcp_multi_path,
            udp_fragment: !!server.udp_fragment,
            network_strategy: server.network_strategy || '',
            network_type: server.network_type || '',
            fallback_network_type: server.fallback_network_type || '',
            fallback_delay: server.fallback_delay || '',
            domain_strategy: server.domain_strategy || '',
            inet4_range: server.inet4_range || '',
            inet6_range: server.inet6_range || '',
        };
        return typeof ctx.normalizeDnsServer === 'function' ? ctx.normalizeDnsServer(mapped, index) : mapped;
    };

    const runtimeInboundToExtra = (inbound = {}) => {
        if (!inbound || !['http', 'socks', 'direct'].includes(inbound.type) || !inbound.tag) return null;
        if (RESERVED_RUNTIME_INBOUND_TAGS.has(inbound.tag)) return null;
        const mapped = {
            type: inbound.type,
            tag: inbound.tag,
            listen: inbound.listen || '127.0.0.1',
            listen_port: inbound.listen_port || (inbound.type === 'direct' ? 9000 : inbound.type === 'socks' ? 1080 : 8080),
            sniff: !!inbound.sniff,
            override_address: inbound.override_address || '',
            override_port: inbound.override_port === null || inbound.override_port === undefined ? '' : inbound.override_port,
            socks_version: inbound.version || '5',
            tls: !!(inbound.tls && inbound.tls.enabled),
            tls_cert_path: inbound.tls && inbound.tls.certificate_path ? inbound.tls.certificate_path : '',
            tls_key_path: inbound.tls && inbound.tls.key_path ? inbound.tls.key_path : '',
        };
        if (Array.isArray(inbound.users) && inbound.users[0]) {
            mapped.username = inbound.users[0].username || '';
            mapped.password = inbound.users[0].password || '';
        }
        return ctx.normalizeExtraInbound(mapped);
    };

    const collectRuleConditions = (source, conditions = []) => {
        const mappings = [
            ['rule_set', 'rule_set'],
            ['domain', 'domain'],
            ['domain_suffix', 'domain_suffix'],
            ['domain_keyword', 'domain_keyword'],
            ['domain_regex', 'domain_regex'],
            ['auth_user', 'auth_user'],
            ['client', 'client'],
            ['ip_version', 'ip_version'],
            ['ip_cidr', 'ip_cidr'],
            ['source_ip_cidr', 'source_ip_cidr'],
            ['source_geoip', 'source_geoip'],
            ['port', 'port'],
            ['source_port', 'source_port'],
            ['port_range', 'port_range'],
            ['source_port_range', 'source_port_range'],
            ['protocol', 'protocol'],
            ['network', 'network'],
            ['network_type', 'network_type'],
            ['process_name', 'process_name'],
            ['process_path', 'process_path'],
            ['package_name', 'package_name'],
            ['user', 'user'],
            ['user_id', 'user_id'],
            ['geoip', 'geoip'],
            ['inbound', 'inbound'],
        ];
        mappings.forEach(([key, type]) => {
            if (source[key] === undefined) return;
            conditions.push({ type, value: toCsv(source[key]) });
        });
        return conditions;
    };

    const flattenRuntimeRuleConditions = (rule = {}) => {
        const result = {
            mode: 'and',
            invert: !!rule.invert,
            conditions: [],
            lossy: false,
        };

        if (!rule || typeof rule !== 'object') return result;

        if (rule.type !== 'logical' || !Array.isArray(rule.rules)) {
            result.conditions = collectRuleConditions(rule, []);
            return result;
        }

        result.mode = rule.mode === 'or' ? 'or' : 'and';
        for (const subRule of rule.rules) {
            const flattened = flattenRuntimeRuleConditions(subRule);
            if (flattened.invert) result.lossy = true;
            if (result.mode === 'and') {
                if (flattened.mode === 'or') result.lossy = true;
                result.conditions.push(...flattened.conditions);
            } else {
                if (flattened.mode === 'and') {
                    if (flattened.conditions.length !== 1) result.lossy = true;
                    result.conditions.push(...flattened.conditions);
                } else {
                    result.conditions.push(...flattened.conditions);
                }
            }
            if (flattened.lossy) result.lossy = true;
        }

        const selfConditions = collectRuleConditions(rule, []);
        if (selfConditions.length > 0) {
            if (result.mode === 'or' && selfConditions.length !== 1) result.lossy = true;
            result.conditions.push(...selfConditions);
        }

        return result;
    };

    const runtimeRuleToPanel = (rule = {}, index = 0) => {
        const flattened = flattenRuntimeRuleConditions(rule);
        const panelRule = {
            id: ctx.generateId('r'),
            enabled: true,
            name: flattened.lossy ? `导入规则 ${index + 1}（需检查）` : `导入规则 ${index + 1}`,
            mode: flattened.mode,
            invert: flattened.invert,
            conditions: [],
            action: 'route',
            outbound: 'direct',
            isEditing: false,
            draggable: false,
        };

        panelRule.conditions = flattened.conditions.map((cond) => ({ ...cond }));
        if (panelRule.conditions.length === 0) panelRule.conditions = [{ type: 'rule_set', value: '' }];

        const action = typeof rule.action === 'string' && rule.action ? rule.action : (rule.outbound ? 'route' : 'route');
        if (action === 'reject') {
            panelRule.action = 'reject';
            panelRule.reject_method = rule.method || 'default';
            panelRule.reject_no_drop = !!rule.no_drop;
        } else if (action === 'hijack-dns') {
            panelRule.action = 'hijack-dns';
        } else if (action === 'sniff') {
            panelRule.action = 'sniff';
            panelRule.sniff_sniffer = toCsv(rule.sniffer);
            panelRule.sniff_timeout = rule.timeout || '';
        } else if (action === 'resolve') {
            panelRule.action = 'resolve';
            panelRule.resolve_server = rule.server || '';
            panelRule.resolve_strategy = rule.strategy || '';
            panelRule.resolve_disable_cache = !!rule.disable_cache;
            panelRule.resolve_rewrite_ttl = rule.rewrite_ttl === null || rule.rewrite_ttl === undefined ? '' : String(rule.rewrite_ttl);
            panelRule.resolve_client_subnet = rule.client_subnet || '';
        } else {
            panelRule.action = 'route';
            panelRule.outbound = rule.outbound || 'direct';
            panelRule.option_override_address = rule.override_address || '';
            panelRule.option_override_port = rule.override_port === null || rule.override_port === undefined ? '' : String(rule.override_port);
            panelRule.option_network_strategy = rule.network_strategy || '';
            panelRule.option_network_type = toCsv(rule.network_type);
            panelRule.option_fallback_network_type = toCsv(rule.fallback_network_type);
            panelRule.option_fallback_delay = rule.fallback_delay || '';
            panelRule.option_udp_disable_domain_unmapping = !!rule.udp_disable_domain_unmapping;
            panelRule.option_udp_connect = !!rule.udp_connect;
            panelRule.option_udp_timeout = rule.udp_timeout || '';
            panelRule.option_tls_fragment = !!rule.tls_fragment;
            panelRule.option_tls_fragment_fallback_delay = rule.tls_fragment_fallback_delay || '';
            panelRule.option_tls_record_fragment = !!rule.tls_record_fragment;
        }

        return ctx.migrateRule(panelRule);
    };

    const isGeneratedHijackDnsRule = (rule = {}) => {
        if (!rule || rule.action !== 'hijack-dns') return false;
        const inbound = toCsv(rule.inbound);
        const network = toCsv(rule.network);
        const protocol = toCsv(rule.protocol);
        const port = toCsv(rule.port);

        if (protocol === 'dns' && !inbound && !network && !port) return true;
        if (inbound === 'tun-in' && protocol === 'dns' && !network && !port) return true;
        if (inbound === 'dns-in' && !protocol && !network && !port) return true;
        if (inbound === 'tproxy-in' && network === 'tcp, udp' && port === '53' && !protocol) return true;
        return false;
    };

    const applyRuntimeImport = (data) => {
        if (!looksLikeRuntimeConfig(data)) throw new Error('这不是可识别的 sing-box 运行配置 JSON');
        resetRuntime();

        if (data.log && typeof data.log.level === 'string') {
            ctx.settings.value.log_level = data.log.level;
        }

        if (data.dns && Object.prototype.toString.call(data.dns) === '[object Object]') {
            const dns = data.dns;
            ctx.settings.value.dns_strategy = dns.strategy || ctx.settings.value.dns_strategy;
            ctx.settings.value.dns_final = dns.final || '';
            ctx.settings.value.dns_disable_cache = !!dns.disable_cache;
            ctx.settings.value.dns_disable_expire = !!dns.disable_expire;
            ctx.settings.value.dns_cache_capacity = dns.cache_capacity === null || dns.cache_capacity === undefined ? null : dns.cache_capacity;
            ctx.settings.value.dns_client_subnet = dns.client_subnet || '';
            ctx.settings.value.independent_cache = !!dns.independent_cache;
            ctx.settings.value.reverse_mapping = !!dns.reverse_mapping;

            const dnsServers = Array.isArray(dns.servers) ? dns.servers : [];
            dnsServers
                .filter((server) => server && server.type === 'fakeip')
                .forEach(absorbFakeip);
            ctx.dnsList.value = dnsServers
                .filter((server) => server && server.type !== 'fakeip')
                .map((server, index) => runtimeDnsServerToPanel(server, index));
            const dnsRules = Array.isArray(dns.rules) ? dns.rules : [];
            const localDnsRule = dnsRules.find((rule) => rule && Array.isArray(rule.rule_set) && rule.rule_set.includes('geosite-cn') && typeof rule.server === 'string');
            const localTag = localDnsRule?.server
                || dnsServers.find((server) => server && server.type !== 'fakeip' && server.tag === 'local-dns')?.tag
                || dnsServers.find((server) => server && server.type !== 'fakeip' && ['udp', 'tcp', 'local'].includes(server.type))?.tag
                || '';

            const fakeipServer = dnsServers.find((server) => server && server.type === 'fakeip');
            if (fakeipServer) {
                absorbFakeip(fakeipServer);
                const fakeRule = dnsRules.find((rule) => rule && rule.server === ctx.fakeip.value.tag && Array.isArray(rule.query_type));
                if (fakeRule) {
                    ctx.fakeip.value.queryA = fakeRule.query_type.includes('A');
                    ctx.fakeip.value.queryAAAA = fakeRule.query_type.includes('AAAA');
                }
                const excludeRules = dnsRules.filter((rule) => rule && rule.server === localTag && Array.isArray(rule.domain_suffix));
                if (excludeRules.length > 0) {
                    const suffixes = [...new Set(excludeRules.flatMap((rule) => rule.domain_suffix).map((item) => String(item).trim()).filter(Boolean))];
                    ctx.fakeip.value.excludeText = suffixes.join('\n');
                }
            }
        }

        if (data.experimental && Object.prototype.toString.call(data.experimental) === '[object Object]') {
            if (data.experimental.cache_file) {
                const cacheFile = data.experimental.cache_file;
                ctx.settings.value.cache_file_path = cacheFile.path || ctx.settings.value.cache_file_path;
                ctx.clashApi.value.store_fakeip = !!cacheFile.store_fakeip;
                ctx.settings.value.store_rdrc = !!cacheFile.store_rdrc;
            }
            if (data.experimental.clash_api) {
                const clashApi = data.experimental.clash_api;
                ctx.clashApi.value.enabled = true;
                ctx.clashApi.value.external_controller = clashApi.external_controller || ctx.clashApi.value.external_controller;
                ctx.clashApi.value.default_mode = clashApi.default_mode || ctx.clashApi.value.default_mode;
                ctx.clashApi.value.secret = clashApi.secret || '';
                ctx.clashApi.value.external_ui = clashApi.external_ui || '';
                ctx.clashApi.value.download_url = clashApi.external_ui_download_url || '';
                ctx.clashApi.value.allow_lan = !!clashApi.access_control_allow_private_network;
            }
        }

        if (data.ntp && Object.prototype.toString.call(data.ntp) === '[object Object]') {
            ctx.ntp.value = typeof ctx.normalizeNtp === 'function' ? ctx.normalizeNtp(data.ntp) : data.ntp;
        }

        const inbounds = Array.isArray(data.inbounds) ? data.inbounds : [];
        inbounds.forEach((inbound) => {
            if (!inbound || typeof inbound !== 'object') return;
            if (inbound.type === 'mixed') {
                if (inbound.listen_port) ctx.settings.value.listen_port = inbound.listen_port;
                if (inbound.sniff) {
                    ctx.settings.value.sniff_enabled = true;
                    ctx.settings.value.sniff_override_destination = !!inbound.sniff_override_destination;
                    ctx.settings.value.sniff_timeout = inbound.sniff_timeout || ctx.settings.value.sniff_timeout;
                }
            } else if (inbound.type === 'tun') {
                ctx.tun.value.enabled = true;
                ctx.tun.value.interface_name = inbound.interface_name || ctx.tun.value.interface_name;
                ctx.tun.value.stack = inbound.stack || ctx.tun.value.stack;
                ctx.tun.value.mtu = inbound.mtu || ctx.tun.value.mtu;
                ctx.tun.value.auto_route = !!inbound.auto_route;
                ctx.tun.value.strict_route = !!inbound.strict_route;
                ctx.tun.value.endpoint_independent_nat = !!inbound.endpoint_independent_nat;
                ctx.tun.value.loopback_address = inbound.loopback_address || '';
                ctx.tun.value.auto_redirect = !!inbound.auto_redirect;
                ctx.tun.value.auto_redirect_input_mark = inbound.auto_redirect_input_mark || '';
                ctx.tun.value.auto_redirect_output_mark = inbound.auto_redirect_output_mark || '';
                ctx.tun.value.udp_timeout = inbound.udp_timeout || '';
                ctx.tun.value.iproute2_table_index = inbound.iproute2_table_index === null || inbound.iproute2_table_index === undefined ? '' : inbound.iproute2_table_index;
                ctx.tun.value.iproute2_rule_index = inbound.iproute2_rule_index === null || inbound.iproute2_rule_index === undefined ? '' : inbound.iproute2_rule_index;
                ctx.tun.value.include_interface = toLines(inbound.include_interface);
                ctx.tun.value.exclude_interface = toLines(inbound.exclude_interface);
                ctx.tun.value.include_package = toLines(inbound.include_package);
                ctx.tun.value.exclude_package = toLines(inbound.exclude_package);
                ctx.tun.value.route_exclude_address = toLines(inbound.route_exclude_address);
                const addresses = Array.isArray(inbound.address) ? inbound.address : [];
                ctx.tun.value.address_v4 = addresses.find((item) => String(item).includes('.')) || '';
                ctx.tun.value.address_v6 = addresses.find((item) => String(item).includes(':')) || '';
                if (inbound.sniff) {
                    ctx.settings.value.sniff_enabled = true;
                    ctx.settings.value.sniff_override_destination = !!inbound.sniff_override_destination;
                    ctx.settings.value.sniff_timeout = inbound.sniff_timeout || ctx.settings.value.sniff_timeout;
                }
            } else if (inbound.type === 'tproxy') {
                ctx.tproxy.value.enabled = true;
                ctx.tproxy.value.listen_port = inbound.listen_port || ctx.tproxy.value.listen_port;
                ctx.tproxy.value.udp_fragment = !!inbound.udp_fragment;
                if (inbound.sniff) {
                    ctx.settings.value.sniff_enabled = true;
                    ctx.settings.value.sniff_override_destination = !!inbound.sniff_override_destination;
                    ctx.settings.value.sniff_timeout = inbound.sniff_timeout || ctx.settings.value.sniff_timeout;
                }
            } else {
                const extra = runtimeInboundToExtra(inbound);
                if (extra) ctx.extraInbounds.value.push(extra);
            }
        });

        const outbounds = Array.isArray(data.outbounds) ? data.outbounds : [];
        outbounds.forEach((outbound) => {
            if (!outbound || typeof outbound !== 'object') return;
            if (outbound.type === 'direct' && outbound.bind_interface) {
                ctx.tun.value.non_gateway_mode = true;
                ctx.tun.value.bind_interface = outbound.bind_interface;
                return;
            }
            const group = runtimeOutboundToGroup(outbound);
            if (group) {
                ctx.groups.value.push(group);
                return;
            }
            const node = runtimeOutboundToNode(outbound);
            if (node) ctx.nodes.value.push(node);
        });

        const route = Object.prototype.toString.call(data.route) === '[object Object]' ? data.route : {};
        ctx.settings.value.final_outbound = route.final || ctx.settings.value.final_outbound;
        ctx.settings.value.auto_detect_interface = !!route.auto_detect_interface;
        ctx.settings.value.default_domain_resolver = route.default_domain_resolver || '';
        ctx.settings.value.default_interface = route.default_interface || '';
        ctx.settings.value.default_mark = route.default_mark === null || route.default_mark === undefined ? null : route.default_mark;
        ctx.settings.value.find_process = !!route.find_process;
        ctx.settings.value.default_network_strategy = route.default_network_strategy || '';
        ctx.settings.value.default_network_type = toCsv(route.default_network_type);
        ctx.settings.value.default_fallback_network_type = toCsv(route.default_fallback_network_type);
        ctx.settings.value.default_fallback_delay = route.default_fallback_delay || '';

        const ruleSets = Array.isArray(route.rule_set) ? route.rule_set : [];
        ctx.ruleSets.value = ruleSets
            .filter((ruleSet) => ruleSet && ruleSet.tag && ruleSet.url)
            .map((ruleSet) => ({
                id: ctx.generateId('rs'),
                tag: ruleSet.tag,
                format: ruleSet.format || 'binary',
                url: ruleSet.url,
                detour: ruleSet.download_detour || ruleSet.detour || 'direct',
                update_interval: ruleSet.update_interval || '1d',
            }));

        const routeRules = Array.isArray(route.rules) ? route.rules : [];
        routeRules.forEach((rule, index) => {
            if (!rule || typeof rule !== 'object') return;
            if (rule.ip_is_private === true && (rule.outbound === 'direct' || (rule.action === 'route' && rule.outbound === 'direct'))) {
                ctx.settings.value.private_direct = true;
                return;
            }
            if (rule.action === 'sniff' && !rule.type && !rule.domain && !rule.rule_set && !rule.inbound && !rule.protocol && !rule.port && !rule.network) {
                ctx.settings.value.sniff_enabled = true;
                ctx.settings.value.sniff_timeout = rule.timeout || ctx.settings.value.sniff_timeout;
                return;
            }
            if (isGeneratedHijackDnsRule(rule)) {
                ctx.settings.value.hijack_dns = true;
                if (Array.isArray(rule.inbound) && rule.inbound.includes('dns-in')) {
                    ctx.tproxy.value.enabled = true;
                    ctx.tproxy.value.dns_hijack_mode = 'nat';
                } else if (Array.isArray(rule.inbound) && rule.inbound.includes('tproxy-in')) {
                    ctx.tproxy.value.enabled = true;
                    ctx.tproxy.value.dns_hijack_mode = 'tproxy';
                }
                return;
            }
            if (rule.clash_mode === 'global' || rule.clash_mode === 'direct') return;
            ctx.routeRules.value.push({
                ...runtimeRuleToPanel(rule, index),
                isEditing: false,
                draggable: false,
            });
        });

        ctx.showImportExport.value = false;
    };

    return {
        applyRuntimeImport,
    };
}
