const { ref, nextTick } = window.Vue;

export function setupNodesModule(ctx) {
    const COMMON_DIAL_FIELDS = ['detour', 'connect_timeout', 'bind_interface', 'routing_mark', 'inet4_bind_address', 'inet6_bind_address', 'reuse_addr', 'netns', 'network_strategy', 'network_type', 'fallback_network_type', 'fallback_delay'];
    const DOMAIN_DIAL_FIELDS = ['domain_resolver'];
    const LEGACY_DIAL_FIELDS = ['domain_strategy'];
    const TCP_DIAL_FIELDS = ['tcp_fast_open', 'tcp_multi_path'];
    const UDP_DIAL_FIELDS = ['udp_fragment'];
    const PROTO_DIAL_FIELD_MATRIX = {
        http: { common: true, domain: true, tcp: true },
        socks: { common: true, domain: true, tcp: true },
        ssh: { common: true, domain: true, tcp: true },
        shadowtls: { common: true, domain: true, tcp: true },
        anytls: { common: true, domain: true, tcp: true },
        naive: { common: true, domain: true, tcp: true },
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
        const tlsDefault = ['vless', 'vmess', 'trojan', 'hysteria2', 'hysteria', 'tuic', 'naive', 'anytls'].includes(type);
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
            hy_obfs: '',
            hy_auth_type: 'str',
            hy_server_ports: '',
            hy_hop_interval: '',
            hy_network: '',
            hy2_up: '',
            hy2_down: '',
            hy2_obfs_type: '',
            hy2_obfs_password: '',
            hy2_server_ports: '',
            hy2_hop_interval: '',
            hy2_network: '',
            shadowtls_version: '3',
            shadowtls_password: '',
            shadowtls_handshake_server: '',
            shadowtls_handshake_port: 443,
            anytls_idle_session_check_interval: '',
            username: '',
            socks_version: '5',
            socks_network: '',
            socks_udp_over_tcp: false,
            socks_udp_over_tcp_version: '2',
            http_path: '',
            http_headers_text: '',
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
            tor_executable_path: '',
            tor_extra_args: '',
            tor_data_directory: '',
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

        return node;
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

    const PROTO_TLS_DEFAULT_ON = ['vless', 'vmess', 'trojan', 'hysteria2', 'hysteria', 'tuic', 'naive', 'anytls'];
    const PROTO_ALWAYS_TLS = ['hysteria2', 'hysteria', 'tuic', 'naive'];

    const isNodeTlsContext = (node = {}) => {
        if (!node) return false;
        return !!(node.tls || PROTO_ALWAYS_TLS.includes(node.type || ''));
    };

    const isNodeQuicTlsContext = (node = {}) => {
        if (!isNodeTlsContext(node)) return false;
        const type = node.type || '';
        return ['hysteria', 'hysteria2', 'tuic'].includes(type) || node.transport === 'quic';
    };

    const isNodeTcpTlsContext = (node = {}) => isNodeTlsContext(node) && !isNodeQuicTlsContext(node);

    const isNodeUtlsSupported = (node = {}) => isNodeTcpTlsContext(node) && ['vless', 'vmess', 'trojan'].includes(node.type || '');

    const isNodeRealitySupported = (node = {}) => isNodeTcpTlsContext(node) && ['vless', 'trojan'].includes(node.type || '');

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
            if (preset.tcp) add(TCP_DIAL_FIELDS);
            if (preset.udp) add(UDP_DIAL_FIELDS);
        } else if (type === 'shadowsocks' || ['vless', 'vmess', 'trojan'].includes(type)) {
            add(COMMON_DIAL_FIELDS);
            if (shouldShowDomainFields) add(DOMAIN_DIAL_FIELDS);
            if (usesQuicTransport) add(UDP_DIAL_FIELDS);
            else add(TCP_DIAL_FIELDS);
        } else {
            add(COMMON_DIAL_FIELDS);
            if (shouldShowDomainFields) add(DOMAIN_DIAL_FIELDS);
            add(TCP_DIAL_FIELDS);
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
        return !!(
            node.disable_sni
            || node.tls_min_version
            || node.tls_max_version
            || (isNodeCipherSuitesMeaningful(node) && node.cipher_suites)
            || (isNodeTcpTlsContext(node) && (node.tls_fragment || node.tls_record_fragment || node.tls_fragment_fallback_delay))
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

    const onNodeTypeChange = (node) => {
        if (!ctx.PROTO_SUPPORT_TRANSPORT.includes(node.type)) node.transport = '';
        if (!ctx.PROTO_SUPPORT_TRANSPORT.includes(node.type)) {
            node.path = '';
            node.ws_host = '';
            node.transport_headers_text = '';
            node.transport_method = '';
            node.transport_idle_timeout = '';
            node.transport_ping_timeout = '';
            node.transport_max_early_data = '';
            node.transport_early_data_header_name = '';
            node.transport_permit_without_stream = false;
        }
        if (!ctx.PROTO_SUPPORT_MULTIPLEX.includes(node.type)) node.mux_enabled = false;
        if (PROTO_TLS_DEFAULT_ON.includes(node.type)) node.tls = true;
        else node.tls = false;
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
        isNodeCipherSuitesMeaningful,
        isNodeTlsContext,
        isNodeQuicTlsContext,
        isNodeTcpTlsContext,
        isNodeUtlsSupported,
        isNodeRealitySupported,
        hasNodeTlsAdvancedConfig,
        hasNodeDialConfig,
        nodeHasDetourOverride,
        nodeHasBindingOverride,
        isNodeDialFieldEffectivelyMuted,
        onNodeTypeChange,
        removeNode,
        clearNodes,
    });
}
