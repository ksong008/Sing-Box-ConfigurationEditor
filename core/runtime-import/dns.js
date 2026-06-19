import { isPlainObject } from './utils.js';

const runtimeDnsServerToPanel = (ctx, server = {}, index = 0) => {
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

export const applyRuntimeDnsImport = (ctx, dns, absorbFakeip) => {
    if (!isPlainObject(dns)) return;

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
        .map((server, index) => runtimeDnsServerToPanel(ctx, server, index));
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
};
