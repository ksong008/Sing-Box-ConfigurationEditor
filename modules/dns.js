const { ref, computed, watch } = window.Vue;

export function setupDnsModule(ctx) {
    const dnsList = ref([
        { tag: 'remote-dns', type: 'https', server: 'dns.google', detour: '节点选择', domain_resolver: 'local-dns', inet4_range: '', inet6_range: '' },
        { tag: 'local-dns', type: 'udp', server: '223.5.5.5', detour: '', domain_resolver: '', inet4_range: '', inet6_range: '' },
    ]);

    const allDnsTags = computed(() => dnsList.value.map((dns) => dns.tag).filter(Boolean));

    const addDns = () => {
        dnsList.value.push({
            tag: `dns-${dnsList.value.length + 1}`,
            type: 'udp',
            server: '',
            detour: '',
            domain_resolver: '',
            inet4_range: '',
            inet6_range: '',
        });
    };

    const addBootstrapDns = () => {
        const existing = dnsList.value.find((dns) => dns.tag === 'bootstrap-dns');
        if (existing) {
            ctx.showToast('已存在 bootstrap-dns，可直接在其他服务器的域名解析器中选择它', 'info');
            return;
        }
        dnsList.value.push({
            tag: 'bootstrap-dns',
            type: 'udp',
            server: '223.5.5.5',
            detour: '',
            domain_resolver: '',
            inet4_range: '',
            inet6_range: '',
        });
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
        addDns,
        addBootstrapDns,
        removeDns,
    });
}
