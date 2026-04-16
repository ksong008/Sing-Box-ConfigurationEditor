const { ref, nextTick } = window.Vue;

export function setupNodesModule(ctx) {
    const makeNode = (overrides = {}) => {
        const type = overrides.type || 'vless';
        const tlsDefault = ['vless', 'vmess', 'trojan', 'hysteria2', 'hysteria', 'tuic', 'naive', 'anytls'].includes(type);
        return {
            tag: '',
            type: 'vless',
            server: '',
            port: 443,
            secret: '',
            sni: '',
            transport: '',
            path: '',
            ws_host: '',
            flow: '',
            mux_enabled: false,
            mux_protocol: 'smux',
            mux_max_connections: 4,
            mux_min_streams: 4,
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
            tuic_password: '',
            tuic_congestion: 'cubic',
            tuic_udp_relay_mode: 'native',
            hy_up_mbps: 100,
            hy_down_mbps: 100,
            hy_obfs: '',
            hy_auth_type: 'str',
            hy2_up: '',
            hy2_down: '',
            hy2_obfs_type: '',
            hy2_obfs_password: '',
            shadowtls_version: '3',
            shadowtls_password: '',
            shadowtls_handshake_server: '',
            shadowtls_handshake_port: 443,
            anytls_idle_session_check_interval: '',
            username: '',
            socks_version: '5',
            wg_private_key: '',
            wg_peer_pubkey: '',
            wg_local_address: '',
            wg_psk: '',
            wg_mtu: 1280,
            wg_reserved: '',
            ssh_auth_type: 'password',
            tor_executable_path: '',
            tor_extra_args: '',
            tor_data_directory: '',
            dns_tag: '',
            ...overrides,
        };
    };

    const nodes = ref([]);

    const addNode = async () => {
        const newTag = `Node-${nodes.value.length + 1}`;
        nodes.value.push(makeNode({ tag: newTag }));
        await nextTick();
        const newIdx = nodes.value.length - 1;
        const el = document.getElementById(`node-card-${newIdx}`);
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
        if (typeof ctx.scrollJsonTo === 'function') {
            ctx.scrollJsonTo(`"tag": "${newTag}"`, { fallbackToEnd: true });
        }
    };

    const PROTO_TLS_DEFAULT_ON = ['vless', 'vmess', 'trojan', 'hysteria2', 'hysteria', 'tuic', 'naive', 'anytls'];

    const onNodeTypeChange = (node) => {
        if (!ctx.PROTO_SUPPORT_TRANSPORT.includes(node.type)) node.transport = '';
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
        addNode,
        onNodeTypeChange,
        removeNode,
        clearNodes,
    });
}
