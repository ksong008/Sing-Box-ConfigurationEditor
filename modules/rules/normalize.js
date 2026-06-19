import { RULE_ACTIONS } from './schema.js';

export const csvString = (value) => (
    Array.isArray(value)
        ? value.map((item) => String(item).trim()).filter(Boolean).join(', ')
        : String(value || '')
);

export const splitCsv = (value) => csvString(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const normalizeCondition = (cond = {}) => ({
    type: typeof cond.type === 'string' && cond.type ? cond.type : 'domain_suffix',
    value: csvString(cond.value)
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean)
        .join(', '),
});

export const normalizeRule = (rule = {}, generateId = () => '') => {
    const normalizedConditions = Array.isArray(rule.conditions) && rule.conditions.length > 0
        ? rule.conditions.map(normalizeCondition)
        : [{ type: 'rule_set', value: '' }];
    const normalizedAction = RULE_ACTIONS.includes(rule.action)
        ? rule.action
        : (rule.outbound === '__reject__' ? 'reject' : 'route');

    return {
        id: rule.id || generateId('r'),
        enabled: rule.enabled !== false,
        name: typeof rule.name === 'string' && rule.name ? rule.name : '自定义规则',
        mode: rule.mode === 'or' ? 'or' : 'and',
        invert: !!rule.invert,
        conditions: normalizedConditions,
        action: normalizedAction,
        outbound: typeof rule.outbound === 'string' && rule.outbound && rule.outbound !== '__reject__' ? rule.outbound : 'direct',
        reject_method: ['default', 'drop', 'reply'].includes(rule.reject_method) ? rule.reject_method : 'default',
        reject_no_drop: !!rule.reject_no_drop,
        sniff_sniffer: csvString(rule.sniffer || rule.sniff_sniffer),
        sniff_timeout: typeof rule.sniff_timeout === 'string'
            ? rule.sniff_timeout
            : (typeof rule.timeout === 'string' ? rule.timeout : ''),
        resolve_server: typeof rule.resolve_server === 'string'
            ? rule.resolve_server
            : (typeof rule.server === 'string' ? rule.server : ''),
        resolve_strategy: typeof rule.resolve_strategy === 'string'
            ? rule.resolve_strategy
            : (typeof rule.strategy === 'string' ? rule.strategy : ''),
        resolve_disable_cache: !!(rule.resolve_disable_cache || rule.disable_cache),
        resolve_rewrite_ttl: rule.resolve_rewrite_ttl === null || rule.resolve_rewrite_ttl === undefined
            ? (rule.rewrite_ttl === null || rule.rewrite_ttl === undefined ? '' : String(rule.rewrite_ttl))
            : String(rule.resolve_rewrite_ttl),
        resolve_client_subnet: typeof rule.resolve_client_subnet === 'string'
            ? rule.resolve_client_subnet
            : (typeof rule.client_subnet === 'string' ? rule.client_subnet : ''),
        option_override_address: typeof rule.option_override_address === 'string'
            ? rule.option_override_address
            : (typeof rule.override_address === 'string' ? rule.override_address : ''),
        option_override_port: rule.option_override_port === 0
            ? '0'
            : (rule.option_override_port ? String(rule.option_override_port) : (rule.override_port ? String(rule.override_port) : '')),
        option_network_strategy: typeof rule.option_network_strategy === 'string'
            ? rule.option_network_strategy
            : (typeof rule.network_strategy === 'string' ? rule.network_strategy : ''),
        option_network_type: csvString(rule.option_network_type || rule.network_type),
        option_fallback_network_type: csvString(rule.option_fallback_network_type || rule.fallback_network_type),
        option_fallback_delay: typeof rule.option_fallback_delay === 'string'
            ? rule.option_fallback_delay
            : (typeof rule.fallback_delay === 'string' ? rule.fallback_delay : ''),
        option_udp_disable_domain_unmapping: !!(rule.option_udp_disable_domain_unmapping || rule.udp_disable_domain_unmapping),
        option_udp_connect: !!(rule.option_udp_connect || rule.udp_connect),
        option_udp_timeout: typeof rule.option_udp_timeout === 'string'
            ? rule.option_udp_timeout
            : (typeof rule.udp_timeout === 'string' ? rule.udp_timeout : ''),
        option_tls_fragment: !!(rule.option_tls_fragment || rule.tls_fragment),
        option_tls_fragment_fallback_delay: typeof rule.option_tls_fragment_fallback_delay === 'string'
            ? rule.option_tls_fragment_fallback_delay
            : (typeof rule.tls_fragment_fallback_delay === 'string' ? rule.tls_fragment_fallback_delay : ''),
        option_tls_record_fragment: !!(rule.option_tls_record_fragment || rule.tls_record_fragment),
        isEditing: !!rule.isEditing,
        draggable: !!rule.draggable,
    };
};

export const migrateRule = (rule, generateId = () => '') => {
    if (rule.conditions) return normalizeRule(rule, generateId);
    const conds = [];
    if (rule.tagsStr) {
        conds.push({ type: rule.matchType || 'rule_set', value: rule.tagsStr });
    }
    return normalizeRule({
        ...rule,
        mode: 'and',
        invert: false,
        conditions: conds.length ? conds : [{ type: 'rule_set', value: '' }],
    }, generateId);
};
