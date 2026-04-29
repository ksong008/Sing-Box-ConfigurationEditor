import {
    getNodeAvailableNetworkOptions as resolveNodeAvailableNetworkOptions,
    getNodeCapabilityIssues as resolveNodeCapabilityIssues,
    getNodeAvailableTransportOptions as resolveNodeAvailableTransportOptions,
    getNodeCurrentNetworkValue as resolveNodeCurrentNetworkValue,
    isNodeTransportFieldVisible as resolveNodeTransportFieldVisible,
    isNodeTlsDefaultOn,
    resolveNodeCapabilities,
    sanitizeNodeByCapabilities,
    setNodeCurrentNetworkValue as resolveSetNodeCurrentNetworkValue,
    shouldShowNodeTransportSection as resolveShouldShowNodeTransportSection,
} from '../core/node-capabilities.js';

const { ref, nextTick } = window.Vue;

export function setupNodesModule(ctx) {
    const COMMON_DIAL_FIELDS = ['detour', 'connect_timeout', 'bind_interface', 'routing_mark', 'inet4_bind_address', 'inet6_bind_address', 'reuse_addr', 'netns', 'network_strategy', 'network_type', 'fallback_network_type', 'fallback_delay'];
    const DOMAIN_DIAL_FIELDS = ['domain_resolver'];
    const LEGACY_DIAL_FIELDS = ['domain_strategy'];
    const TCP_DIAL_FIELDS = ['tcp_fast_open', 'tcp_multi_path'];
    const UDP_DIAL_FIELDS = ['udp_fragment'];
    const PROTO_DIAL_FIELD_MATRIX = {
        http: { common: true, domain: true, tcp: true },
        socks: { common: true, domain: true, tcp: true, udp: true },
        ssh: { common: true, domain: true, tcp: true },
        shadowtls: { common: true, domain: true, tcp: true },
        anytls: { common: true, domain: true, tcp: true },
        naive: { common: true, domain: true, tcp: true, udp: true },
        tor: { common: true, tcp: true },
        wireguard: { common: true, domain: true, udp: true },
        hysteria: { common: true, domain: true, udp: true },
        hysteria2: { common: true, domain: true, udp: true },
        tuic: { common: true, domain: true, udp: true },
        dns: {},
    };
    const isNodeDialFieldConfigured = (node = {}, field) => {
        const value = node[field];
        if (typeof value === 'boolean') return value;
        return value !== null && value !== undefined && String(value).trim() !== '';
    };

    const isLiteralIpAddress = (value = '') => {
        const source = String(value || '').trim();
        if (!source) return false;
        if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(source)) return true;
        if (/^\[[0-9a-fA-F:]+\]$/.test(source)) return true;
        if (/^[0-9a-fA-F:]+$/.test(source) && source.includes(':')) return true;
        return false;
    };

    const makeNode = (overrides = {}) => {
        const type = overrides.type || 'vless';
        const tlsDefault = isNodeTlsDefaultOn({ type });
        const node = {
            tag: '',
            type: 'vless',
            server: '',
            port: 443,
            secret: '',
            sni: '',
            transport: '',
            path: '',
            ws_host: '',
            transport_headers_text: '',
            transport_method: '',
            transport_idle_timeout: '',
            transport_ping_timeout: '',
            transport_max_early_data: '',
            transport_early_data_header_name: '',
            transport_permit_without_stream: false,
            flow: '',
            mux_enabled: false,
            mux_protocol: 'h2mux',
            mux_max_connections: 4,
            mux_min_streams: 4,
            mux_max_streams: '',
            mux_padding: false,
            mux_brutal_enabled: false,
            mux_brutal_up_mbps: '',
            mux_brutal_down_mbps: '',
            tls: tlsDefault,
            insecure: false,
            reality: false,
            reality_pubkey: '',
            reality_sid: '',
            utls_fingerprint: '',
            alpn: '',
            alpn_custom: false,
            network: '',
            packet_encoding: 'xudp',
            vmess_security: 'auto',
            vmess_alter_id: 0,
            vmess_global_padding: false,
            vmess_authenticated_length: true,
            disable_sni: false,
            tls_min_version: '',
            tls_max_version: '',
            cipher_suites: '',
            tls_fragment: false,
            tls_record_fragment: false,
            tls_fragment_fallback_delay: '',
            ech_enabled: false,
            ech_config: '',
            ss_method: 'chacha20-ietf-poly1305',
            ss_plugin: '',
            ss_plugin_opts: '',
            ss_udp_over_tcp: false,
            ss_udp_over_tcp_version: '2',
            tuic_password: '',
            tuic_congestion: 'cubic',
            tuic_udp_relay_mode: 'native',
            tuic_network: '',
            tuic_udp_over_stream: false,
            tuic_zero_rtt_handshake: false,
            tuic_heartbeat: '',
            hy_up_mbps: 100,
            hy_down_mbps: 100,
            hy_up_text: '',
            hy_down_text: '',
            hy_obfs: '',
            hy_auth_type: 'str',
            hy_server_ports: '',
            hy_hop_interval: '',
            hy_recv_window_conn: '',
            hy_recv_window: '',
            hy_disable_mtu_discovery: false,
            hy_network: '',
            hy2_up: '',
            hy2_down: '',
            hy2_obfs_type: '',
            hy2_obfs_password: '',
            hy2_server_ports: '',
            hy2_hop_interval: '',
            hy2_hop_interval_max: '',
            hy2_network: '',
            hy2_bbr_profile: '',
            hy2_brutal_debug: false,
            shadowtls_version: '3',
            shadowtls_password: '',
            anytls_idle_session_check_interval: '',
            anytls_idle_session_timeout: '',
            anytls_min_idle_session: '',
            username: '',
            socks_version: '5',
            socks_network: '',
            socks_udp_over_tcp: false,
            socks_udp_over_tcp_version: '2',
            http_path: '',
            http_headers_text: '',
            naive_insecure_concurrency: '',
            naive_extra_headers_text: '',
            naive_udp_over_tcp: false,
            naive_udp_over_tcp_version: '2',
            naive_quic: false,
            naive_quic_congestion_control: '',
            wg_private_key: '',
            wg_peer_pubkey: '',
            wg_local_address: '',
            wg_psk: '',
            wg_mtu: 1280,
            wg_reserved: '',
            wg_system_interface: false,
            wg_interface_name: '',
            wg_workers: '',
            wg_network: '',
            ssh_auth_type: 'password',
            ssh_private_key_path: '',
            ssh_private_key_passphrase: '',
            ssh_host_key_text: '',
            ssh_host_key_algorithms: '',
            ssh_client_version: '',
            tor_executable_path: '',
            tor_extra_args: '',
            tor_data_directory: '',
            tor_torrc_text: '',
            quic_initial_packet_size: '',
            quic_disable_path_mtu_discovery: false,
            quic_idle_timeout: '',
            quic_keep_alive_period: '',
            quic_stream_receive_window: '',
            quic_connection_receive_window: '',
            quic_max_concurrent_streams: '',
            dns_tag: '',
            detour: '',
            bind_interface: '',
            inet4_bind_address: '',
            inet6_bind_address: '',
            routing_mark: '',
            reuse_addr: false,
            netns: '',
            connect_timeout: '',
            tcp_fast_open: false,
            tcp_multi_path: false,
            udp_fragment: false,
            domain_resolver: '',
            network_strategy: '',
            network_type: '',
            fallback_network_type: '',
            fallback_delay: '',
            domain_strategy: '',
            collapsed: overrides.collapsed === undefined ? false : !!overrides.collapsed,
            draggable: !!overrides.draggable,
            ...overrides,
        };

        if (typeof node.domain_resolver === 'object' && node.domain_resolver !== null) {
            node.domain_resolver = typeof node.domain_resolver.server === 'string' ? node.domain_resolver.server : '';
        }
        node.routing_mark = node.routing_mark === null || node.routing_mark === undefined ? '' : String(node.routing_mark);
        node.network_type = Array.isArray(node.network_type) ? node.network_type.join(', ') : String(node.network_type || '');
        node.fallback_network_type = Array.isArray(node.fallback_network_type) ? node.fallback_network_type.join(', ') : String(node.fallback_network_type || '');
        node.hy_server_ports = Array.isArray(node.hy_server_ports) ? node.hy_server_ports.join(', ') : String(node.hy_server_ports || '');
        node.hy2_server_ports = Array.isArray(node.hy2_server_ports) ? node.hy2_server_ports.join(', ') : String(node.hy2_server_ports || '');
        node.wg_workers = node.wg_workers === null || node.wg_workers === undefined ? '' : String(node.wg_workers);

        return sanitizeNodeByCapabilities(node);
    };

    const nodes = ref([]);
    const draggedNodeIndex = ref(null);
    const dragOverNodeIndex = ref(null);

    const focusNodeCard = async (index) => {
        await nextTick();
        const el = document.getElementById(`node-card-${index}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.transition = 'box-shadow 0.2s, border-color 0.2s';
            el.style.borderColor = '#6366f1';
            el.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.25)';
            setTimeout(() => {
                el.style.borderColor = '';
                el.style.boxShadow = '';
            }, 1800);
            const nameInput = el.querySelector('input[type="text"]');
            if (nameInput) setTimeout(() => nameInput.focus(), 300);
        }
    };

    const addNode = async (placement = 'top') => {
        const newTag = `Node-${nodes.value.length + 1}`;
        const newNode = makeNode({ tag: newTag, collapsed: true });
        if (placement === 'bottom') nodes.value.push(newNode);
        else nodes.value.unshift(newNode);
        const newIdx = placement === 'bottom' ? nodes.value.length - 1 : 0;
        await focusNodeCard(newIdx);
        if (typeof ctx.scrollJsonTo === 'function') {
            ctx.scrollJsonTo(`"tag": "${newTag}"`, { fallbackToEnd: true });
        }
    };

    const toggleNodeCollapsed = (index) => {
        nodes.value[index].collapsed = !nodes.value[index].collapsed;
    };

    const onNodeDragStart = (index, event) => {
        draggedNodeIndex.value = index;
        event.dataTransfer.effectAllowed = 'move';
    };
    const onNodeDragEnter = (index) => {
        if (draggedNodeIndex.value !== null) dragOverNodeIndex.value = index;
    };
    const onNodeDragEnd = () => {
        draggedNodeIndex.value = null;
        dragOverNodeIndex.value = null;
        nodes.value.forEach((node) => {
            node.draggable = false;
        });
    };
    const onNodeDrop = (index) => {
        const from = draggedNodeIndex.value;
        if (from !== null && from !== index) {
            const item = nodes.value.splice(from, 1)[0];
            nodes.value.splice(index, 0, item);
        }
        onNodeDragEnd();
    };

    const isNodeStreamTransport = (node = {}) => resolveNodeCapabilities(node).supportsStreamTransport;
    const isNodeDatagramTransport = (node = {}) => resolveNodeCapabilities(node).supportsDatagramTransport;
    const isNodeTlsSupported = (node = {}) => resolveNodeCapabilities(node).supportsTls;
    const isNodeTlsToggleVisible = (node = {}) => resolveNodeCapabilities(node).tlsToggleVisible;
    const isNodeMultiplexSupported = (node = {}) => resolveNodeCapabilities(node).supportsMultiplex;
    const isNodeQuicFieldSupported = (node = {}) => resolveNodeCapabilities(node).supportsQuicAdvancedFields;
    const isNodeTlsInsecureSupported = (node = {}) => resolveNodeCapabilities(node).supportsTlsInsecure;
    const isNodeTlsAlpnSupported = (node = {}) => resolveNodeCapabilities(node).supportsTlsAlpn;
    const isNodeTlsDisableSniSupported = (node = {}) => resolveNodeCapabilities(node).supportsTlsDisableSni;
    const isNodeTlsVersionSupported = (node = {}) => resolveNodeCapabilities(node).supportsTlsVersion;
    const isNodeTlsFragmentSupported = (node = {}) => resolveNodeCapabilities(node).supportsTlsFragment;
    const isNodeTlsContext = (node = {}) => resolveNodeCapabilities(node).hasTlsContext;
    const isNodeQuicTlsContext = (node = {}) => resolveNodeCapabilities(node).isQuicTlsContext;
    const isNodeTcpTlsContext = (node = {}) => resolveNodeCapabilities(node).isTcpTlsContext;
    const isNodeUtlsSupported = (node = {}) => resolveNodeCapabilities(node).supportsUtls;
    const isNodeRealitySupported = (node = {}) => resolveNodeCapabilities(node).supportsReality;
    const isNodeShadowtlsPasswordSupported = (node = {}) => resolveNodeCapabilities(node).supportsShadowtlsPassword;
    const isNodeTransportSectionVisible = (node = {}) => resolveShouldShowNodeTransportSection(node);
    const isNodeTransportFieldVisible = (node = {}, field = '') => resolveNodeTransportFieldVisible(node, field);
    const getNodeResolvedTransport = (node = {}) => resolveNodeCapabilities(node).transport;
    const isNodeTransport = (node = {}, transport = '') => getNodeResolvedTransport(node) === String(transport || '').trim();
    const getNodeAvailableTransportOptions = (node = {}) => resolveNodeAvailableTransportOptions(node);
    const getNodeCapabilityIssues = (node = {}) => resolveNodeCapabilityIssues(node);
    const hasNodeCapabilityIssues = (node = {}) => getNodeCapabilityIssues(node).length > 0;
    const getNodeCapabilityMessages = (node = {}) => getNodeCapabilityIssues(node).map((issue) => issue.message);
    const getNodeCapabilityFieldMessages = (node = {}, field = '') => {
        const targetField = String(field || '').trim();
        return getNodeCapabilityIssues(node)
            .filter((issue) => issue.field === targetField)
            .map((issue) => issue.message);
    };
    const isNodeCapabilityFieldInvalid = (node = {}, field = '') => getNodeCapabilityFieldMessages(node, field).length > 0;
    const isNodeServerEndpointVisible = (node = {}) => resolveNodeCapabilities(node).supportsServerEndpoint;
    const getNodeDisplayEndpoint = (node = {}) => {
        if (!isNodeServerEndpointVisible(node)) {
            return node.type === 'tor' ? 'local tor' : 'internal dns';
        }
        return `${node.server || '未设置'}${node.port ? `:${node.port}` : ''}`;
    };
    const isNodeSharedSecretSectionVisible = (node = {}) => ['vless', 'vmess', 'trojan', 'shadowsocks', 'tuic', 'hysteria2'].includes(node.type || '');
    const getNodeSharedSecretLabel = (node = {}) => (['vless', 'vmess', 'tuic'].includes(node.type || '') ? 'UUID' : '密码 (Password)');
    const isNodeCredentialSniVisible = (node = {}) => isNodeTlsContext(node) && ['vless', 'vmess', 'trojan', 'hysteria2', 'hysteria'].includes(node.type || '');

    const getNodeDialVisibleFields = (node = {}) => {
        const fields = new Set();
        const add = (items) => items.forEach((item) => fields.add(item));
        const type = node.type || 'vless';
        const usesQuicTransport = node.transport === 'quic';
        const shouldShowDomainFields = type !== 'tor' && (!String(node.server || '').trim() || !isLiteralIpAddress(node.server));
        const preset = PROTO_DIAL_FIELD_MATRIX[type];

        if (preset) {
            if (preset.common) add(COMMON_DIAL_FIELDS);
            if (preset.domain && shouldShowDomainFields) add(DOMAIN_DIAL_FIELDS);
            if (preset.tcp && isNodeStreamTransport(node)) add(TCP_DIAL_FIELDS);
            if (preset.udp && isNodeDatagramTransport(node)) add(UDP_DIAL_FIELDS);
        } else if (type === 'shadowsocks' || ['vless', 'vmess', 'trojan'].includes(type)) {
            add(COMMON_DIAL_FIELDS);
            if (shouldShowDomainFields) add(DOMAIN_DIAL_FIELDS);
            if (usesQuicTransport || isNodeDatagramTransport(node)) add(UDP_DIAL_FIELDS);
            if (isNodeStreamTransport(node)) add(TCP_DIAL_FIELDS);
        } else {
            add(COMMON_DIAL_FIELDS);
            if (shouldShowDomainFields) add(DOMAIN_DIAL_FIELDS);
            if (isNodeStreamTransport(node)) add(TCP_DIAL_FIELDS);
            if (isNodeDatagramTransport(node)) add(UDP_DIAL_FIELDS);
        }

        [...COMMON_DIAL_FIELDS, ...DOMAIN_DIAL_FIELDS, ...TCP_DIAL_FIELDS, ...UDP_DIAL_FIELDS].forEach((field) => {
            if (isNodeDialFieldConfigured(node, field)) fields.add(field);
        });
        LEGACY_DIAL_FIELDS.forEach((field) => {
            if (isNodeDialFieldConfigured(node, field)) fields.add(field);
        });

        return fields;
    };

    const hasNodeDialOptions = (node = {}) => getNodeDialVisibleFields(node).size > 0;

    const isNodeDialFieldVisible = (node = {}, field) => getNodeDialVisibleFields(node).has(field);

    const isNodeCipherSuitesMeaningful = (node = {}) => isNodeTcpTlsContext(node) && node.tls_min_version !== '1.3';

    const hasNodeTlsAdvancedConfig = (node = {}) => {
        if (!isNodeTlsContext(node)) return false;
        const supportsClassicTlsAdvanced = node.type !== 'naive';
        return !!(
            (supportsClassicTlsAdvanced && node.disable_sni)
            || (supportsClassicTlsAdvanced && node.tls_min_version)
            || (supportsClassicTlsAdvanced && node.tls_max_version)
            || (supportsClassicTlsAdvanced && isNodeCipherSuitesMeaningful(node) && node.cipher_suites)
            || (supportsClassicTlsAdvanced && isNodeTcpTlsContext(node) && (node.tls_fragment || node.tls_record_fragment || node.tls_fragment_fallback_delay))
            || node.ech_enabled
        );
    };

    const hasNodeDialConfig = (node = {}) => {
        const fields = getNodeDialVisibleFields(node);
        return [...fields].some((field) => {
            const value = node[field];
            if (typeof value === 'boolean') return value;
            return value !== null && value !== undefined && String(value).trim() !== '';
        });
    };

    const nodeHasDetourOverride = (node = {}) => !!String(node.detour || '').trim();

    const nodeHasBindingOverride = (node = {}) => !!(
        String(node.bind_interface || '').trim()
        || String(node.inet4_bind_address || '').trim()
        || String(node.inet6_bind_address || '').trim()
    );

    const isNodeDialFieldEffectivelyMuted = (node = {}, field) => {
        if (nodeHasDetourOverride(node) && field !== 'detour') return true;
        if (nodeHasBindingOverride(node) && ['network_strategy', 'network_type', 'fallback_network_type', 'fallback_delay'].includes(field)) return true;
        return false;
    };

    const getNodeAvailableNetworkOptions = (node = {}) => resolveNodeAvailableNetworkOptions(node);
    const getNodeCurrentNetworkValue = (node = {}) => resolveNodeCurrentNetworkValue(node);
    const setNodeCurrentNetworkValue = (node = {}, value = '') => resolveSetNodeCurrentNetworkValue(node, value);

    const syncNodeNetworkConstraints = (node = {}) => {
        sanitizeNodeByCapabilities(node);
    };

    const onNodeTypeChange = (node) => {
        if (['tor', 'dns'].includes(node.type)) {
            node.server = '';
            node.port = 0;
        } else if (!node.port) {
            node.port = 443;
        }
        node.tls = isNodeTlsDefaultOn(node);
        sanitizeNodeByCapabilities(node);
    };

    const removeNode = (index) => {
        ctx.showConfirm('确定要删除此节点吗？此操作不可恢复。', () => {
            const tagToRemove = nodes.value[index].tag;
            nodes.value.splice(index, 1);
            ctx.groups.value.forEach((group) => {
                const groupIndex = group.members.indexOf(tagToRemove);
                if (groupIndex !== -1) group.members.splice(groupIndex, 1);
            });
            ctx.dnsList.value.forEach((dns) => {
                if (dns.detour === tagToRemove) dns.detour = '';
            });
            if (ctx.ntp.value.detour === tagToRemove) ctx.ntp.value.detour = 'direct';
            ctx.routeRules.value.forEach((rule) => {
                if (rule.outbound === tagToRemove) rule.outbound = 'direct';
            });
            if (ctx.settings.value.final_outbound === tagToRemove) ctx.settings.value.final_outbound = 'direct';
        }, { title: '删除节点', okText: '删除' });
    };

    const clearNodes = () => {
        ctx.showConfirm('确定清空所有节点吗？此操作不可恢复！', () => {
            const nodeTags = new Set(nodes.value.map((node) => node.tag));
            nodes.value = [];
            ctx.groups.value.forEach((group) => {
                group.members = group.members.filter((member) => !nodeTags.has(member));
            });
        }, { title: '清空节点', okText: '清空' });
    };

    Object.assign(ctx, {
        makeNode,
        nodes,
        draggedNodeIndex,
        dragOverNodeIndex,
        focusNodeCard,
        addNode,
        toggleNodeCollapsed,
        onNodeDragStart,
        onNodeDragEnter,
        onNodeDrop,
        onNodeDragEnd,
        getNodeDialVisibleFields,
        hasNodeDialOptions,
        isNodeDialFieldVisible,
        isNodeTlsSupported,
        isNodeTlsToggleVisible,
        isNodeCipherSuitesMeaningful,
        isNodeTlsContext,
        isNodeQuicTlsContext,
        isNodeTcpTlsContext,
        isNodeUtlsSupported,
        isNodeRealitySupported,
        isNodeShadowtlsPasswordSupported,
        isNodeTransportSectionVisible,
        isNodeTransportFieldVisible,
        getNodeResolvedTransport,
        isNodeTransport,
        isNodeMultiplexSupported,
        isNodeQuicFieldSupported,
        isNodeTlsInsecureSupported,
        isNodeTlsAlpnSupported,
        isNodeTlsDisableSniSupported,
        isNodeTlsVersionSupported,
        isNodeTlsFragmentSupported,
        hasNodeTlsAdvancedConfig,
        hasNodeDialConfig,
        nodeHasDetourOverride,
        nodeHasBindingOverride,
        isNodeDialFieldEffectivelyMuted,
        getNodeAvailableTransportOptions,
        getNodeAvailableNetworkOptions,
        getNodeCurrentNetworkValue,
        getNodeCapabilityIssues,
        hasNodeCapabilityIssues,
        getNodeCapabilityMessages,
        getNodeCapabilityFieldMessages,
        isNodeCapabilityFieldInvalid,
        isNodeServerEndpointVisible,
        getNodeDisplayEndpoint,
        isNodeSharedSecretSectionVisible,
        getNodeSharedSecretLabel,
        isNodeCredentialSniVisible,
        setNodeCurrentNetworkValue,
        syncNodeNetworkConstraints,
        onNodeTypeChange,
        removeNode,
        clearNodes,
    });
}
