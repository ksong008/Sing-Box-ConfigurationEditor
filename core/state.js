const { ref, computed } = window.Vue;

export function createBaseState() {
    const generateId = (prefix) => prefix + '_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();

    const PROTO_SUPPORT_TRANSPORT = ['vless', 'vmess', 'trojan'];
    const PROTO_SUPPORT_MULTIPLEX = ['vless', 'vmess', 'trojan', 'shadowsocks'];
    const PROTO_SUPPORT_TLS = ['vless', 'vmess', 'trojan', 'http', 'anytls'];
    const PROTO_ALWAYS_TLS = ['hysteria2', 'hysteria', 'tuic', 'naive'];
    const PROTO_SUPPORT_SECRET = ['vless', 'vmess', 'trojan', 'shadowsocks', 'tuic', 'hysteria2', 'hysteria', 'shadowtls', 'anytls'];
    const PROTO_SUPPORT_USER = ['socks', 'http', 'ssh', 'naive'];

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

    const copyText = ref('复制配置');
    const copyIcon = ref('fas fa-copy');
    const tabs = [
        { id: 'dns', name: '基础/DNS', icon: 'fas fa-network-wired' },
        { id: 'nodes', name: '订阅/节点', icon: 'fas fa-link' },
        { id: 'groups', name: '策略组', icon: 'fas fa-layer-group' },
        { id: 'rules', name: '路由分流', icon: 'fas fa-route' },
        { id: 'tun', name: 'TUN', icon: 'fas fa-layer-group' },
        { id: 'tproxy', name: 'TProxy', icon: 'fas fa-shield-alt' },
        { id: 'advanced', name: '其他设置', icon: 'fas fa-sliders-h' },
    ];

    const currentTab = ref('dns');
    const isFetching = ref(false);
    const fetchStatus = ref(null);
    const rawPastedText = ref('');

    const showImportExport = ref(false);
    const importExportTab = ref('export');
    const exportPreviewTab = ref('panel');
    const importJsonText = ref('');
    const importError = ref('');
    const modalContentReady = ref(false);
    const exportSnapshotPanel = ref('');
    const exportSnapshotRuntime = ref('');
    const panelExportFilename = ref('');
    const runtimeExportFilename = ref('');

    const jsonContainer = ref(null);
    const ruleSetContainer = ref(null);
    const tabContentContainer = ref(null);

    const settings = ref({
        listen_port: 2080,
        log_level: 'info',
        final_outbound: '节点选择',
        dns_strategy: 'ipv4_only',
        default_domain_resolver: 'remote-dns',
        dns_final: 'remote-dns',
        dns_disable_cache: false,
        dns_disable_expire: false,
        dns_cache_capacity: null,
        dns_client_subnet: '',
        sniff_enabled: true,
        sniff_override_destination: true,
        sniff_timeout: '300ms',
        hijack_dns: true,
        private_direct: true,
        independent_cache: false,
        reverse_mapping: false,
        auto_detect_interface: true,
        default_interface: '',
        default_mark: null,
        find_process: false,
        default_network_strategy: '',
        default_network_type: '',
        default_fallback_network_type: '',
        default_fallback_delay: '',
        rule_set_cdn: true,
        rule_set_detour: 'direct',
        store_rdrc: true,
        cache_file_path: '/var/lib/sing-box/cache.db',
    });

    const fakeip = ref({
        enabled: false,
        tag: 'fakeip',
        inet4_range: '198.18.0.0/15',
        inet6_range: 'fc00::/18',
        queryA: true,
        queryAAAA: true,
        excludeText: 'lan\nlocal',
    });

    const cleanExcludeText = () => {
        if (!fakeip.value.excludeText) return;
        fakeip.value.excludeText = fakeip.value.excludeText
            .split('\n')
            .map((s) => s.replace(/^[-*\s]+/, '').replace(/['"]/g, '').replace(/^\+\./, '').trim())
            .filter((s) => s)
            .join('\n');
    };

    const handlePasteCleanup = () => {
        setTimeout(cleanExcludeText, 50);
    };

    const tun = ref({
        enabled: false,
        interface_name: 'tun0',
        stack: 'system',
        address_v4: '172.19.0.1/30',
        address_v6: '',
        mtu: 9000,
        loopback_address: '',
        auto_route: true,
        strict_route: true,
        auto_redirect: false,
        iproute2_table_index: '',
        iproute2_rule_index: '',
        auto_redirect_input_mark: '',
        auto_redirect_output_mark: '',
        endpoint_independent_nat: false,
        udp_timeout: '',
        include_interface: '',
        exclude_interface: '',
        include_package: '',
        exclude_package: '',
        non_gateway_mode: false,
        bind_interface: '',
        route_exclude_address: '',
    });

    const tunOpts = [
        { key: 'auto_route', label: 'auto_route', desc: '自动配置系统路由' },
        { key: 'strict_route', label: 'strict_route', desc: '严格路由，防泄漏' },
        { key: 'endpoint_independent_nat', label: 'endpoint_independent_nat', desc: 'Full Cone NAT (UDP)' },
        { key: 'auto_redirect', label: 'auto_redirect', desc: 'Linux 高性能重定向' },
    ];

    const panels = [
        {
            id: 'zashboard',
            name: 'Zashboard',
            icon: 'fas fa-tachometer-alt',
            desc: '现代化界面，支持 sing-box',
            url: 'https://github.com/Zephyruso/zashboard/releases/latest/download/dist-cdn-fonts.zip',
        },
        {
            id: 'metacubexd',
            name: 'MetaCubeX-D',
            icon: 'fas fa-cube',
            desc: 'MetaCubeX 官方面板',
            url: 'https://github.com/MetaCubeX/metacubexd/archive/gh-pages.zip',
        },
        {
            id: 'yacd-meta',
            name: 'Yacd-meta',
            icon: 'fas fa-chart-bar',
            desc: 'Yacd 增强版，MetaCubeX 出品',
            url: 'https://github.com/MetaCubeX/Yacd-meta/archive/gh-pages.zip',
        },
        {
            id: 'yacd',
            name: 'Yacd',
            icon: 'fas fa-chart-line',
            desc: '经典 Yacd 原版',
            url: 'https://github.com/haishanh/yacd/archive/gh-pages.zip',
        },
    ];

    const clashApi = ref({
        enabled: false,
        panel: '',
        download_url: '',
        external_controller: '127.0.0.1:9090',
        external_ui: './ui',
        secret: '',
        default_mode: 'rule',
        store_fakeip: false,
        allow_lan: false,
    });
    const pickPanel = (panel) => {
        clashApi.value.panel = panel.id;
        if (panel.url) clashApi.value.download_url = panel.url;
    };

    const panelLinks = computed(() => {
        const ctrl = clashApi.value.external_controller || '127.0.0.1:9090';
        const pid = clashApi.value.panel;
        const links = [{ name: '本地 /ui', url: `http://${ctrl}/ui/` }];
        if (pid === 'zashboard') links.push({ name: 'zashboard.pages.dev', url: 'https://board.zash.run.place/#/' });
        if (pid === 'metacubexd') links.push({ name: 'metacubex.github.io', url: 'https://metacubex.github.io/metacubexd/#/' });
        if (pid === 'yacd-meta') links.push({ name: 'yacd.metacubex.one', url: 'http://yacd.metacubex.one/' });
        if (pid === 'yacd') links.push({ name: 'yacd.haishan.me', url: 'http://yacd.haishan.me/' });
        return links;
    });

    const normalizeNtp = (ntp = {}) => {
        const normalized = {
            enabled: !!ntp.enabled,
            server: typeof ntp.server === 'string' && ntp.server ? ntp.server : 'time.apple.com',
            server_port: Number.isFinite(Number(ntp.server_port)) ? Number(ntp.server_port) : 123,
            interval: typeof ntp.interval === 'string' && ntp.interval ? ntp.interval : '30m',
            detour: typeof ntp.detour === 'string' && ntp.detour ? ntp.detour : 'direct',
            bind_interface: typeof ntp.bind_interface === 'string' ? ntp.bind_interface : '',
            inet4_bind_address: typeof ntp.inet4_bind_address === 'string' ? ntp.inet4_bind_address : '',
            inet6_bind_address: typeof ntp.inet6_bind_address === 'string' ? ntp.inet6_bind_address : '',
            routing_mark: ntp.routing_mark === null || ntp.routing_mark === undefined ? '' : String(ntp.routing_mark),
            reuse_addr: !!ntp.reuse_addr,
            netns: typeof ntp.netns === 'string' ? ntp.netns : '',
            connect_timeout: typeof ntp.connect_timeout === 'string' ? ntp.connect_timeout : '',
            tcp_fast_open: !!ntp.tcp_fast_open,
            tcp_multi_path: !!ntp.tcp_multi_path,
            udp_fragment: !!ntp.udp_fragment,
            domain_resolver: typeof ntp.domain_resolver === 'string'
                ? ntp.domain_resolver
                : (ntp.domain_resolver && typeof ntp.domain_resolver.server === 'string' ? ntp.domain_resolver.server : ''),
            network_strategy: typeof ntp.network_strategy === 'string' ? ntp.network_strategy : '',
            network_type: Array.isArray(ntp.network_type) ? ntp.network_type.join(', ') : String(ntp.network_type || ''),
            fallback_network_type: Array.isArray(ntp.fallback_network_type) ? ntp.fallback_network_type.join(', ') : String(ntp.fallback_network_type || ''),
            fallback_delay: typeof ntp.fallback_delay === 'string' ? ntp.fallback_delay : '',
            domain_strategy: typeof ntp.domain_strategy === 'string' ? ntp.domain_strategy : '',
        };

        return normalized;
    };

    const ntp = ref(normalizeNtp());

    const tproxy = ref({
        enabled: false,
        listen_port: 7893,
        bypass_private: true,
        nft_table: 'singbox',
        mark: '111',
        route_mark: '112',
        proxy_uid: '989',
        proxy_gid: '989',
        ipv6: false,
        udp_fragment: true,
        dns_hijack_mode: 'tproxy',
        dns_port: 1053,
        ingress_iface: '',
        egress_iface: '',
    });

        return {
        PROTO_SUPPORT_TRANSPORT,
        PROTO_SUPPORT_MULTIPLEX,
        PROTO_SUPPORT_TLS,
        PROTO_ALWAYS_TLS,
        PROTO_SUPPORT_SECRET,
        PROTO_SUPPORT_USER,
        generateId,
        showToast,
        showConfirm,
        copyToClipboard,
        copyText,
        copyIcon,
        tabs,
        currentTab,
        isFetching,
        fetchStatus,
        rawPastedText,
        showImportExport,
        importExportTab,
        exportPreviewTab,
        importJsonText,
        importError,
        modalContentReady,
        exportSnapshotPanel,
        exportSnapshotRuntime,
        panelExportFilename,
        runtimeExportFilename,
        jsonContainer,
        ruleSetContainer,
        tabContentContainer,
        settings,
        fakeip,
        cleanExcludeText,
        handlePasteCleanup,
        tun,
        tunOpts,
        panels,
        clashApi,
        pickPanel,
        panelLinks,
        ntp,
        normalizeNtp,
        tproxy,
    };
}
