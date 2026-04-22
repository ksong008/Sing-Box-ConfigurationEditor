const { ref, computed, watch } = window.Vue;

export function setupDnsModule(ctx) {
    const normalizeDnsServer = (dns = {}, index = 0) => {
        const type = ['tls', 'https', 'udp', 'tcp', 'quic', 'h3', 'local', 'fakeip'].includes(dns.type) ? dns.type : 'udp';
        const headersText = typeof dns.headers_text === 'string'
            ? dns.headers_text
            : (dns.headers && typeof dns.headers === 'object'
                ? Object.entries(dns.headers).map(([key, value]) => `${key}: ${value}`).join('\n')
                : '');
        const normalized = {
            tag: typeof dns.tag === 'string' && dns.tag.trim() ? dns.tag.trim() : `dns-${index + 1}`,
            type,
            server: typeof dns.server === 'string' ? dns.server : '',
            server_port: dns.server_port === 0 ? '0' : (dns.server_port ? String(dns.server_port) : ''),
            detour: typeof dns.detour === 'string' ? dns.detour : '',
            domain_resolver: typeof dns.domain_resolver === 'string'
                ? dns.domain_resolver
                : (dns.domain_resolver && typeof dns.domain_resolver.server === 'string' ? dns.domain_resolver.server : ''),
            path: typeof dns.path === 'string' ? dns.path : '',
            headers_text: headersText,
            client_subnet: typeof dns.client_subnet === 'string' ? dns.client_subnet : '',
            bind_interface: typeof dns.bind_interface === 'string' ? dns.bind_interface : '',
            inet4_bind_address: typeof dns.inet4_bind_address === 'string' ? dns.inet4_bind_address : '',
            inet6_bind_address: typeof dns.inet6_bind_address === 'string' ? dns.inet6_bind_address : '',
            routing_mark: dns.routing_mark === null || dns.routing_mark === undefined ? '' : String(dns.routing_mark),
            reuse_addr: !!dns.reuse_addr,
            netns: typeof dns.netns === 'string' ? dns.netns : '',
            connect_timeout: typeof dns.connect_timeout === 'string' ? dns.connect_timeout : '',
            tcp_fast_open: !!dns.tcp_fast_open,
            tcp_multi_path: !!dns.tcp_multi_path,
            udp_fragment: !!dns.udp_fragment,
            network_strategy: typeof dns.network_strategy === 'string' ? dns.network_strategy : '',
            network_type: Array.isArray(dns.network_type) ? dns.network_type.join(', ') : String(dns.network_type || ''),
            fallback_network_type: Array.isArray(dns.fallback_network_type) ? dns.fallback_network_type.join(', ') : String(dns.fallback_network_type || ''),
            fallback_delay: typeof dns.fallback_delay === 'string' ? dns.fallback_delay : '',
            domain_strategy: typeof dns.domain_strategy === 'string' ? dns.domain_strategy : '',
            inet4_range: typeof dns.inet4_range === 'string' ? dns.inet4_range : '',
            inet6_range: typeof dns.inet6_range === 'string' ? dns.inet6_range : '',
        };

        return normalized;
    };

    const dnsList = ref([
        normalizeDnsServer({ tag: 'remote-dns', type: 'https', server: 'dns.google', detour: '节点选择', domain_resolver: 'local-dns' }, 0),
        normalizeDnsServer({ tag: 'local-dns', type: 'udp', server: '223.5.5.5' }, 1),
    ]);

    const allDnsTags = computed(() => {
        const tags = dnsList.value.map((dns) => dns.tag).filter(Boolean);
        const fakeipTag = ctx.fakeip?.value?.enabled ? String(ctx.fakeip.value.tag || '').trim() : '';
        if (fakeipTag && !tags.includes(fakeipTag)) tags.push(fakeipTag);
        return tags;
    });

    const addDns = () => {
        dnsList.value.push(normalizeDnsServer({}, dnsList.value.length));
    };

    const addBootstrapDns = () => {
        const existing = dnsList.value.find((dns) => dns.tag === 'bootstrap-dns');
        if (existing) {
            ctx.showToast('已存在 bootstrap-dns，可直接在其他服务器的域名解析器中选择它', 'info');
            return;
        }
        dnsList.value.push(normalizeDnsServer({
            tag: 'bootstrap-dns',
            type: 'udp',
            server: '223.5.5.5',
        }, dnsList.value.length));
        ctx.showToast('Bootstrap DNS 已添加，可在其他 DoH/DoT 服务器的「域名解析器」中选择 bootstrap-dns', 'ok', 4000);
    };

    const removeDns = (index) => {
        ctx.showConfirm('确定要删除此 DNS 服务器吗？', () => dnsList.value.splice(index, 1), {
            title: '删除 DNS 服务器',
            okText: '删除',
        });
    };

    watch(() => ctx.fakeip.value.enabled, (newVal, oldVal) => {
        if (newVal && !oldVal && !ctx.settings.value.independent_cache) {
            ctx.settings.value.independent_cache = true;
        }
    });

    Object.assign(ctx, {
        dnsList,
        allDnsTags,
        normalizeDnsServer,
        addDns,
        addBootstrapDns,
        removeDns,
    });
}
