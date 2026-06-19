import {
    applyDialFields,
    applyRouteOptionsFields,
    parseList,
    parseOptionalInteger,
} from './config-utils.js';
import { buildConfigDns } from './config/dns.js';
import { buildConfigOutbounds } from './config/outbounds.js';
import { setupJsonPreviewScroll } from './json-scroll.js';
import { createFullStateGetter } from './state-snapshot.js';

const { computed, onUnmounted } = window.Vue;

export function setupConfigCore(ctx) {
    const generatedJson = computed(() => {
        const outbounds = buildConfigOutbounds(ctx);
        const { dnsTagSet, dnsServers, dnsRules } = buildConfigDns(ctx);

        const routeArr = [];
        const tproxyDnsMode = ctx.tproxy.value.dns_hijack_mode || 'tproxy';
        const useDnsNatInTproxy = ctx.tproxy.value.enabled && ctx.settings.value.hijack_dns && tproxyDnsMode === 'nat';
        const useDnsDirectInTproxy = ctx.tproxy.value.enabled && ctx.settings.value.hijack_dns && tproxyDnsMode !== 'nat';

        const rsArr = ctx.ruleSets.value
            .filter((ruleSet) => ruleSet.tag && ruleSet.url)
            .map((ruleSet) => ({
                tag: ruleSet.tag,
                type: 'remote',
                format: ruleSet.format || 'binary',
                url: ruleSet.url,
                download_detour: ruleSet.detour || 'direct',
                update_interval: ruleSet.update_interval || '1d',
            }));

        if (ctx.settings.value.sniff_enabled) {
            const sniffRule = { action: 'sniff' };
            if (ctx.settings.value.sniff_timeout) sniffRule.timeout = ctx.settings.value.sniff_timeout;
            routeArr.push(sniffRule);
        }

        if (ctx.settings.value.hijack_dns) {
            if (ctx.tproxy.value.enabled) {
                if (useDnsNatInTproxy) {
                    routeArr.push({ inbound: ['dns-in'], action: 'hijack-dns' });
                } else if (useDnsDirectInTproxy) {
                    routeArr.push({
                        inbound: ['tproxy-in'],
                        network: ['tcp', 'udp'],
                        port: [53],
                        action: 'hijack-dns',
                    });
                }
            } else if (ctx.tun.value.enabled) {
                routeArr.push({ inbound: ['tun-in'], protocol: 'dns', action: 'hijack-dns' });
            } else {
                routeArr.push({ protocol: 'dns', action: 'hijack-dns' });
            }
        }

        if (ctx.settings.value.private_direct) routeArr.push({ ip_is_private: true, outbound: 'direct' });

        if (ctx.clashApi.value.enabled) {
            const globalOutbound = ctx.settings.value.final_outbound || 'direct';
            routeArr.push(
                { clash_mode: 'global', outbound: globalOutbound },
                { clash_mode: 'direct', outbound: 'direct' },
            );
        }

        ctx.routeRules.value
            .filter((rule) => rule.enabled)
            .forEach((rule) => {
                const migratedRule = ctx.migrateRule(rule);
                const validConds = migratedRule.conditions
                    .map((cond) => {
                        if (!cond.value) return null;
                        const tags = cond.value.split(',').map((item) => item.trim()).filter(Boolean);
                        if (!tags.length) return null;

                        const obj = {};
                        const matchType = cond.type;
                        if (matchType === 'rule_set') obj.rule_set = tags;
                        else if (matchType === 'domain') obj.domain = tags;
                        else if (matchType === 'domain_suffix') obj.domain_suffix = tags;
                        else if (matchType === 'domain_keyword') obj.domain_keyword = tags;
                        else if (matchType === 'domain_regex') obj.domain_regex = tags;
                        else if (matchType === 'auth_user') obj.auth_user = tags;
                        else if (matchType === 'client') obj.client = tags;
                        else if (matchType === 'ip_version') {
                            const ipVersion = parseInt(tags[0], 10);
                            if (!Number.isNaN(ipVersion)) obj.ip_version = ipVersion;
                        }
                        else if (matchType === 'ip_cidr') obj.ip_cidr = tags;
                        else if (matchType === 'source_ip_cidr') obj.source_ip_cidr = tags;
                        else if (matchType === 'source_geoip') obj.source_geoip = tags;
                        else if (matchType === 'port') obj.port = tags.map(Number).filter((value) => !Number.isNaN(value));
                        else if (matchType === 'source_port') obj.source_port = tags.map(Number).filter((value) => !Number.isNaN(value));
                        else if (matchType === 'port_range') obj.port_range = tags;
                        else if (matchType === 'source_port_range') obj.source_port_range = tags;
                        else if (matchType === 'protocol') obj.protocol = tags;
                        else if (matchType === 'network') obj.network = tags;
                        else if (matchType === 'network_type') obj.network_type = tags;
                        else if (matchType === 'process_name') obj.process_name = tags;
                        else if (matchType === 'process_path') obj.process_path = tags;
                        else if (matchType === 'package_name') obj.package_name = tags;
                        else if (matchType === 'user') obj.user = tags;
                        else if (matchType === 'user_id') obj.user_id = tags.map(Number).filter((value) => !Number.isNaN(value));
                        else if (matchType === 'geoip') obj.geoip = tags;
                        else if (matchType === 'inbound') obj.inbound = tags;
                        return obj;
                    })
                    .filter(Boolean);

                if (validConds.length === 0) return;

                const ruleObj = {};
                let hasCollision = false;
                const testKeys = new Set();
                for (const cond of validConds) {
                    const key = Object.keys(cond)[0];
                    if (testKeys.has(key)) hasCollision = true;
                    testKeys.add(key);
                }

                if (migratedRule.mode === 'or' || (migratedRule.mode === 'and' && hasCollision)) {
                    if (validConds.length > 1) {
                        ruleObj.type = 'logical';
                        ruleObj.mode = migratedRule.mode;
                        ruleObj.rules = validConds;
                    } else {
                        Object.assign(ruleObj, validConds[0]);
                    }
                } else {
                    validConds.forEach((cond) => Object.assign(ruleObj, cond));
                }

                if (migratedRule.invert) {
                    ruleObj.invert = true;
                }

                const action = typeof migratedRule.action === 'string' && migratedRule.action ? migratedRule.action : (migratedRule.outbound === '__reject__' ? 'reject' : 'route');
                if (action === 'reject') {
                    ruleObj.action = 'reject';
                    if (migratedRule.reject_method && migratedRule.reject_method !== 'default') ruleObj.method = migratedRule.reject_method;
                    if (migratedRule.reject_no_drop) ruleObj.no_drop = true;
                } else if (action === 'hijack-dns') {
                    ruleObj.action = 'hijack-dns';
                } else if (action === 'sniff') {
                    ruleObj.action = 'sniff';
                    const sniffers = parseList(migratedRule.sniff_sniffer || migratedRule.sniffer);
                    if (sniffers.length > 0) ruleObj.sniffer = sniffers;
                    if (migratedRule.sniff_timeout) ruleObj.timeout = migratedRule.sniff_timeout;
                } else if (action === 'resolve') {
                    ruleObj.action = 'resolve';
                    if (migratedRule.resolve_server && dnsTagSet.has(migratedRule.resolve_server)) ruleObj.server = migratedRule.resolve_server;
                    if (migratedRule.resolve_strategy) ruleObj.strategy = migratedRule.resolve_strategy;
                    if (migratedRule.resolve_disable_cache) ruleObj.disable_cache = true;
                    const rewriteTtl = parseOptionalInteger(migratedRule.resolve_rewrite_ttl);
                    if (rewriteTtl !== undefined) ruleObj.rewrite_ttl = rewriteTtl;
                    if (migratedRule.resolve_client_subnet) ruleObj.client_subnet = migratedRule.resolve_client_subnet;
                } else {
                    ruleObj.action = 'route';
                    ruleObj.outbound = migratedRule.outbound || 'direct';
                    applyRouteOptionsFields(ruleObj, migratedRule);
                }

                routeArr.push(ruleObj);
            });

        const inbounds = [];
        const mixedIn = {
            type: 'mixed',
            tag: 'mixed-in',
            listen: '127.0.0.1',
            listen_port: ctx.settings.value.listen_port,
        };
        if (ctx.tproxy.value.enabled) {
            const tproxyInbound = {
                type: 'tproxy',
                tag: 'tproxy-in',
                listen: '::',
                listen_port: ctx.tproxy.value.listen_port,
            };
            if (ctx.tproxy.value.udp_fragment) tproxyInbound.udp_fragment = true;
            if (ctx.settings.value.sniff_enabled) {
                tproxyInbound.sniff = true;
                if (ctx.settings.value.sniff_override_destination) tproxyInbound.sniff_override_destination = true;
                if (ctx.settings.value.sniff_timeout) tproxyInbound.sniff_timeout = ctx.settings.value.sniff_timeout;
            }
            inbounds.push(tproxyInbound);
            if (useDnsNatInTproxy) {
                inbounds.push({
                    type: 'direct',
                    tag: 'dns-in',
                    listen: '127.0.0.1',
                    listen_port: ctx.tproxy.value.dns_port || 1053,
                    override_port: 53,
                });
            }
        }
        if (ctx.settings.value.sniff_enabled) {
            mixedIn.sniff = true;
            if (ctx.settings.value.sniff_override_destination) mixedIn.sniff_override_destination = true;
            if (ctx.settings.value.sniff_timeout) mixedIn.sniff_timeout = ctx.settings.value.sniff_timeout;
        }
        inbounds.push(mixedIn);

        if (ctx.tun.value.enabled) {
            const addresses = [ctx.tun.value.address_v4].filter(Boolean);
            if (ctx.tun.value.address_v6) addresses.push(ctx.tun.value.address_v6);
            const tunInbound = {
                type: 'tun',
                tag: 'tun-in',
                interface_name: ctx.tun.value.interface_name,
                address: addresses,
                mtu: ctx.tun.value.mtu,
                stack: ctx.tun.value.stack,
                auto_route: ctx.tun.value.auto_route,
                strict_route: ctx.tun.value.strict_route,
                endpoint_independent_nat: ctx.tun.value.endpoint_independent_nat,
            };
            if (ctx.tun.value.loopback_address) tunInbound.loopback_address = ctx.tun.value.loopback_address;
            if (ctx.tun.value.auto_redirect) tunInbound.auto_redirect = true;
            if (ctx.tun.value.auto_redirect && ctx.tun.value.auto_redirect_input_mark) tunInbound.auto_redirect_input_mark = ctx.tun.value.auto_redirect_input_mark;
            if (ctx.tun.value.auto_redirect && ctx.tun.value.auto_redirect_output_mark) tunInbound.auto_redirect_output_mark = ctx.tun.value.auto_redirect_output_mark;
            if (ctx.tun.value.udp_timeout) tunInbound.udp_timeout = ctx.tun.value.udp_timeout;
            const iproute2TableIndex = parseOptionalInteger(ctx.tun.value.iproute2_table_index);
            if (iproute2TableIndex !== undefined) tunInbound.iproute2_table_index = iproute2TableIndex;
            const iproute2RuleIndex = parseOptionalInteger(ctx.tun.value.iproute2_rule_index);
            if (iproute2RuleIndex !== undefined) tunInbound.iproute2_rule_index = iproute2RuleIndex;
            const includeInterface = parseList(ctx.tun.value.include_interface);
            if (includeInterface.length > 0) tunInbound.include_interface = includeInterface;
            const excludeInterface = parseList(ctx.tun.value.exclude_interface);
            if (excludeInterface.length > 0) tunInbound.exclude_interface = excludeInterface;
            const includePackage = parseList(ctx.tun.value.include_package);
            if (includePackage.length > 0) tunInbound.include_package = includePackage;
            const excludePackage = parseList(ctx.tun.value.exclude_package);
            if (excludePackage.length > 0) tunInbound.exclude_package = excludePackage;
            if (ctx.tun.value.non_gateway_mode && ctx.tun.value.route_exclude_address) {
                const excludeList = ctx.tun.value.route_exclude_address
                    .split('\n')
                    .map((line) => line.replace(/#.*$/, '').trim())
                    .filter((line) => line.length > 0);
                if (excludeList.length > 0) tunInbound.route_exclude_address = excludeList;
            }
            if (ctx.settings.value.sniff_enabled) {
                tunInbound.sniff = true;
                if (ctx.settings.value.sniff_override_destination) tunInbound.sniff_override_destination = true;
                if (ctx.settings.value.sniff_timeout) tunInbound.sniff_timeout = ctx.settings.value.sniff_timeout;
            }
            inbounds.push(tunInbound);
        }

        inbounds.push(...ctx.buildExtraInbounds());

        const route = {
            rules: routeArr,
            final: ctx.settings.value.final_outbound,
            auto_detect_interface: ctx.settings.value.auto_detect_interface,
        };
        const validDnsTags = new Set(dnsServers.map((server) => server.tag));
        if (ctx.settings.value.default_domain_resolver && validDnsTags.has(ctx.settings.value.default_domain_resolver)) {
            route.default_domain_resolver = ctx.settings.value.default_domain_resolver;
        }
        if (ctx.settings.value.default_interface) route.default_interface = ctx.settings.value.default_interface;
        if (ctx.settings.value.default_mark) route.default_mark = ctx.settings.value.default_mark;
        if (ctx.settings.value.find_process) route.find_process = true;
        if (ctx.settings.value.default_network_strategy) route.default_network_strategy = ctx.settings.value.default_network_strategy;
        const defaultNetworkType = parseList(ctx.settings.value.default_network_type);
        if (defaultNetworkType.length > 0) route.default_network_type = defaultNetworkType;
        const defaultFallbackNetworkType = parseList(ctx.settings.value.default_fallback_network_type);
        if (defaultFallbackNetworkType.length > 0) route.default_fallback_network_type = defaultFallbackNetworkType;
        if (ctx.settings.value.default_fallback_delay) route.default_fallback_delay = ctx.settings.value.default_fallback_delay;
        if (rsArr.length > 0) route.rule_set = rsArr;

        let experimental = undefined;
        const cache_file = {};
        let hasCache = false;

        if (ctx.settings.value.cache_file_path) {
            cache_file.path = ctx.settings.value.cache_file_path;
            hasCache = true;
        }
        if (ctx.clashApi.value.store_fakeip) {
            cache_file.store_fakeip = true;
            hasCache = true;
        }
        if (ctx.settings.value.store_rdrc) {
            cache_file.store_rdrc = true;
            hasCache = true;
        }

        if (hasCache) cache_file.enabled = true;

        if (ctx.clashApi.value.enabled) {
            const clashApi = {
                external_controller: ctx.clashApi.value.external_controller,
                default_mode: ctx.clashApi.value.default_mode || 'rule',
            };
            if (ctx.clashApi.value.secret) clashApi.secret = ctx.clashApi.value.secret;
            if (ctx.clashApi.value.external_ui) clashApi.external_ui = ctx.clashApi.value.external_ui;
            if (ctx.clashApi.value.download_url) clashApi.external_ui_download_url = ctx.clashApi.value.download_url;
            if (ctx.clashApi.value.allow_lan) clashApi.access_control_allow_private_network = true;

            experimental = { clash_api: clashApi };
            if (hasCache) experimental.cache_file = cache_file;
        } else if (hasCache) {
            experimental = { cache_file };
        }

        let ntpConfig;
        if (ctx.ntp.value.enabled) {
            ntpConfig = {
                enabled: true,
                server: ctx.ntp.value.server,
                server_port: ctx.ntp.value.server_port,
                interval: ctx.ntp.value.interval,
                detour: ctx.ntp.value.detour,
            };
            applyDialFields(ntpConfig, ctx.ntp.value, { validDnsTags: dnsTagSet });
        }

        const config = {
            log: { level: ctx.settings.value.log_level, timestamp: true },
            ntp: ntpConfig,
            dns: {
                servers: dnsServers,
                rules: dnsRules.length > 0 ? dnsRules : undefined,
                strategy: ctx.settings.value.dns_strategy,
                final: ctx.settings.value.dns_final || undefined,
                disable_cache: ctx.settings.value.dns_disable_cache || undefined,
                disable_expire: ctx.settings.value.dns_disable_expire || undefined,
                cache_capacity: ctx.settings.value.dns_cache_capacity || undefined,
                client_subnet: ctx.settings.value.dns_client_subnet || undefined,
                independent_cache: ctx.settings.value.independent_cache || undefined,
                reverse_mapping: ctx.settings.value.reverse_mapping || undefined,
            },
            inbounds,
            outbounds,
            route,
            experimental,
        };

        return JSON.stringify(config, (key, value) => {
            if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) return undefined;
            return value;
        }, 2);
    });

    const jsonScroll = setupJsonPreviewScroll(ctx, generatedJson);
    const getFullState = createFullStateGetter(ctx);

    onUnmounted(() => {
        jsonScroll.cleanupJsonScroll();
    });

    Object.assign(ctx, {
        scrollJsonTo: jsonScroll.scrollJsonTo,
        scrollJsonToRequest: jsonScroll.scrollJsonToRequest,
        queueJsonScrollTo: jsonScroll.queueJsonScrollTo,
        queueJsonScrollToTarget: jsonScroll.queueJsonScrollToTarget,
        generatedJson,
        getFullState,
    });
}
