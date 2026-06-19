import {
    applyRouteOptionsFields,
    parseList,
    parseOptionalInteger,
} from '../config-utils.js';

export const getTproxyDnsContext = (ctx) => {
    const tproxyDnsMode = ctx.tproxy.value.dns_hijack_mode || 'tproxy';
    return {
        useDnsNatInTproxy: ctx.tproxy.value.enabled && ctx.settings.value.hijack_dns && tproxyDnsMode === 'nat',
        useDnsDirectInTproxy: ctx.tproxy.value.enabled && ctx.settings.value.hijack_dns && tproxyDnsMode !== 'nat',
    };
};

const buildRuleSetEntries = (ctx) => ctx.ruleSets.value
    .filter((ruleSet) => ruleSet.tag && ruleSet.url)
    .map((ruleSet) => ({
        tag: ruleSet.tag,
        type: 'remote',
        format: ruleSet.format || 'binary',
        url: ruleSet.url,
        download_detour: ruleSet.detour || 'direct',
        update_interval: ruleSet.update_interval || '1d',
    }));

const buildRouteRuleCondition = (cond) => {
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
};

const hasConditionKeyCollision = (conditions) => {
    const testKeys = new Set();
    for (const cond of conditions) {
        const key = Object.keys(cond)[0];
        if (testKeys.has(key)) return true;
        testKeys.add(key);
    }
    return false;
};

const buildRouteRuleObject = (ctx, rule, dnsTagSet) => {
    const migratedRule = ctx.migrateRule(rule);
    const validConds = migratedRule.conditions
        .map(buildRouteRuleCondition)
        .filter(Boolean);

    if (validConds.length === 0) return null;

    const ruleObj = {};
    const hasCollision = hasConditionKeyCollision(validConds);

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

    return ruleObj;
};

export const buildConfigRoute = (ctx, {
    dnsTagSet = new Set(),
    dnsServers = [],
    useDnsNatInTproxy = false,
    useDnsDirectInTproxy = false,
} = {}) => {
    const routeArr = [];
    const ruleSetEntries = buildRuleSetEntries(ctx);

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
            const ruleObj = buildRouteRuleObject(ctx, rule, dnsTagSet);
            if (ruleObj) routeArr.push(ruleObj);
        });

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
    if (ruleSetEntries.length > 0) route.rule_set = ruleSetEntries;

    return route;
};
