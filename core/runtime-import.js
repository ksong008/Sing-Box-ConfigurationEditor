import {
    parseRuntimeGroupOutbound,
    parseRuntimeOutbound,
} from './protocol-codecs/index.js';
import {
    isGeneratedHijackDnsRule,
    runtimeRuleToPanel,
} from './runtime-import/route-rules.js';
import {
    looksLikeRuntimeConfig,
    toCsv,
    toLines,
} from './runtime-import/utils.js';

export { looksLikeRuntimeConfig } from './runtime-import/utils.js';

const RESERVED_RUNTIME_INBOUND_TAGS = new Set(['mixed-in', 'tun-in', 'tproxy-in', 'dns-in']);

export function createRuntimeImporter(ctx, {
    resetRuntimeImportState,
    absorbFakeipServer,
} = {}) {
    const resetRuntime = typeof resetRuntimeImportState === 'function' ? resetRuntimeImportState : () => {};
    const absorbFakeip = typeof absorbFakeipServer === 'function' ? absorbFakeipServer : () => {};

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
            const group = parseRuntimeGroupOutbound(outbound, ctx);
            if (group) {
                ctx.groups.value.push(group);
                return;
            }
            const node = parseRuntimeOutbound(outbound, ctx);
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
                ...runtimeRuleToPanel(ctx, rule, index),
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
