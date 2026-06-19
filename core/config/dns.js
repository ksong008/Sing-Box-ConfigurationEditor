import {
    applyDialFields,
    parseHeadersText,
    parseOptionalInteger,
} from '../config-utils.js';

export const buildConfigDns = (ctx) => {
    const dnsTagSet = new Set(ctx.dnsList.value.map((dns) => dns.tag));
    const dnsServers = ctx.dnsList.value
        .map((dns) => {
            if (dns.type === 'fakeip') return null;
            if (dns.type === 'local') return { type: 'local', tag: dns.tag };
            const server = { type: dns.type, tag: dns.tag };
            if (dns.server) server.server = dns.server;
            const serverPort = parseOptionalInteger(dns.server_port);
            if (serverPort !== undefined && serverPort > 0) server.server_port = serverPort;
            if (dns.path && ['https', 'h3'].includes(dns.type)) server.path = dns.path;
            const headers = parseHeadersText(dns.headers_text);
            if (headers && ['https', 'h3'].includes(dns.type)) server.headers = headers;
            if (dns.client_subnet) server.client_subnet = dns.client_subnet;
            if (dns.detour && dns.detour !== 'direct') server.detour = dns.detour;
            if (dns.domain_resolver && dnsTagSet.has(dns.domain_resolver)) server.domain_resolver = dns.domain_resolver;
            applyDialFields(server, dns, { validDnsTags: dnsTagSet });
            return server;
        })
        .filter((server) => server && (server.type === 'local' || server.server));

    if (ctx.fakeip.value.enabled && !dnsServers.find((server) => server.type === 'fakeip')) {
        const fakeipServer = { type: 'fakeip', tag: ctx.fakeip.value.tag };
        if (ctx.fakeip.value.queryA && ctx.fakeip.value.inet4_range) fakeipServer.inet4_range = ctx.fakeip.value.inet4_range;
        if (ctx.fakeip.value.queryAAAA && ctx.fakeip.value.inet6_range) fakeipServer.inet6_range = ctx.fakeip.value.inet6_range;
        dnsServers.push(fakeipServer);
    }

    const dnsRules = [];
    const localTag = dnsServers.find((server) => server.tag === 'local-dns')
        ? 'local-dns'
        : dnsServers.find((server) => server.type === 'udp' || server.type === 'tcp' || server.type === 'local')?.tag;
    if (ctx.fakeip.value.enabled) {
        if (localTag) dnsRules.push({ rule_set: ['geosite-cn'], server: localTag });
        const exclude = ctx.fakeip.value.excludeText
            .split('\n')
            .map((item) => item.replace(/^[-*\s]+/, '').replace(/['"]/g, '').replace(/^\+\./, '').trim())
            .filter((item) => item);
        if (exclude.length > 0 && localTag) dnsRules.push({ domain_suffix: exclude, server: localTag });
        const queryType = [];
        if (ctx.fakeip.value.queryA) queryType.push('A');
        if (ctx.fakeip.value.queryAAAA) queryType.push('AAAA');
        if (queryType.length > 0) dnsRules.push({ query_type: queryType, server: ctx.fakeip.value.tag });
    } else if (localTag) {
        dnsRules.push({ rule_set: ['geosite-cn'], server: localTag });
    }

    return {
        dnsTagSet,
        dnsServers,
        dnsRules,
    };
};
