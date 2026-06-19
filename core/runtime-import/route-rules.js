import { toCsv } from './utils.js';

const collectRuleConditions = (source, conditions = []) => {
    const mappings = [
        ['rule_set', 'rule_set'],
        ['domain', 'domain'],
        ['domain_suffix', 'domain_suffix'],
        ['domain_keyword', 'domain_keyword'],
        ['domain_regex', 'domain_regex'],
        ['auth_user', 'auth_user'],
        ['client', 'client'],
        ['ip_version', 'ip_version'],
        ['ip_cidr', 'ip_cidr'],
        ['source_ip_cidr', 'source_ip_cidr'],
        ['source_geoip', 'source_geoip'],
        ['port', 'port'],
        ['source_port', 'source_port'],
        ['port_range', 'port_range'],
        ['source_port_range', 'source_port_range'],
        ['protocol', 'protocol'],
        ['network', 'network'],
        ['network_type', 'network_type'],
        ['process_name', 'process_name'],
        ['process_path', 'process_path'],
        ['package_name', 'package_name'],
        ['user', 'user'],
        ['user_id', 'user_id'],
        ['geoip', 'geoip'],
        ['inbound', 'inbound'],
    ];
    mappings.forEach(([key, type]) => {
        if (source[key] === undefined) return;
        conditions.push({ type, value: toCsv(source[key]) });
    });
    return conditions;
};

const flattenRuntimeRuleConditions = (rule = {}) => {
    const result = {
        mode: 'and',
        invert: !!rule.invert,
        conditions: [],
        lossy: false,
    };

    if (!rule || typeof rule !== 'object') return result;

    if (rule.type !== 'logical' || !Array.isArray(rule.rules)) {
        result.conditions = collectRuleConditions(rule, []);
        return result;
    }

    result.mode = rule.mode === 'or' ? 'or' : 'and';
    for (const subRule of rule.rules) {
        const flattened = flattenRuntimeRuleConditions(subRule);
        if (flattened.invert) result.lossy = true;
        if (result.mode === 'and') {
            if (flattened.mode === 'or') result.lossy = true;
            result.conditions.push(...flattened.conditions);
        } else {
            if (flattened.mode === 'and') {
                if (flattened.conditions.length !== 1) result.lossy = true;
                result.conditions.push(...flattened.conditions);
            } else {
                result.conditions.push(...flattened.conditions);
            }
        }
        if (flattened.lossy) result.lossy = true;
    }

    const selfConditions = collectRuleConditions(rule, []);
    if (selfConditions.length > 0) {
        if (result.mode === 'or' && selfConditions.length !== 1) result.lossy = true;
        result.conditions.push(...selfConditions);
    }

    return result;
};

export const runtimeRuleToPanel = (ctx, rule = {}, index = 0) => {
    const flattened = flattenRuntimeRuleConditions(rule);
    const panelRule = {
        id: ctx.generateId('r'),
        enabled: true,
        name: flattened.lossy ? `导入规则 ${index + 1}（需检查）` : `导入规则 ${index + 1}`,
        mode: flattened.mode,
        invert: flattened.invert,
        conditions: [],
        action: 'route',
        outbound: 'direct',
        isEditing: false,
        draggable: false,
    };

    panelRule.conditions = flattened.conditions.map((cond) => ({ ...cond }));
    if (panelRule.conditions.length === 0) panelRule.conditions = [{ type: 'rule_set', value: '' }];

    const action = typeof rule.action === 'string' && rule.action ? rule.action : (rule.outbound ? 'route' : 'route');
    if (action === 'reject') {
        panelRule.action = 'reject';
        panelRule.reject_method = rule.method || 'default';
        panelRule.reject_no_drop = !!rule.no_drop;
    } else if (action === 'hijack-dns') {
        panelRule.action = 'hijack-dns';
    } else if (action === 'sniff') {
        panelRule.action = 'sniff';
        panelRule.sniff_sniffer = toCsv(rule.sniffer);
        panelRule.sniff_timeout = rule.timeout || '';
    } else if (action === 'resolve') {
        panelRule.action = 'resolve';
        panelRule.resolve_server = rule.server || '';
        panelRule.resolve_strategy = rule.strategy || '';
        panelRule.resolve_disable_cache = !!rule.disable_cache;
        panelRule.resolve_rewrite_ttl = rule.rewrite_ttl === null || rule.rewrite_ttl === undefined ? '' : String(rule.rewrite_ttl);
        panelRule.resolve_client_subnet = rule.client_subnet || '';
    } else {
        panelRule.action = 'route';
        panelRule.outbound = rule.outbound || 'direct';
        panelRule.option_override_address = rule.override_address || '';
        panelRule.option_override_port = rule.override_port === null || rule.override_port === undefined ? '' : String(rule.override_port);
        panelRule.option_network_strategy = rule.network_strategy || '';
        panelRule.option_network_type = toCsv(rule.network_type);
        panelRule.option_fallback_network_type = toCsv(rule.fallback_network_type);
        panelRule.option_fallback_delay = rule.fallback_delay || '';
        panelRule.option_udp_disable_domain_unmapping = !!rule.udp_disable_domain_unmapping;
        panelRule.option_udp_connect = !!rule.udp_connect;
        panelRule.option_udp_timeout = rule.udp_timeout || '';
        panelRule.option_tls_fragment = !!rule.tls_fragment;
        panelRule.option_tls_fragment_fallback_delay = rule.tls_fragment_fallback_delay || '';
        panelRule.option_tls_record_fragment = !!rule.tls_record_fragment;
    }

    return ctx.migrateRule(panelRule);
};

export const isGeneratedHijackDnsRule = (rule = {}) => {
    if (!rule || rule.action !== 'hijack-dns') return false;
    const inbound = toCsv(rule.inbound);
    const network = toCsv(rule.network);
    const protocol = toCsv(rule.protocol);
    const port = toCsv(rule.port);

    if (protocol === 'dns' && !inbound && !network && !port) return true;
    if (inbound === 'tun-in' && protocol === 'dns' && !network && !port) return true;
    if (inbound === 'dns-in' && !protocol && !network && !port) return true;
    if (inbound === 'tproxy-in' && network === 'tcp, udp' && port === '53' && !protocol) return true;
    return false;
};
