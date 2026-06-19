import { splitCsv } from './normalize.js';
import { ROUTE_OPTION_FIELDS } from './schema.js';

const rangeIncludesPort = (raw, port) => {
    const text = String(raw || '').trim();
    if (!text) return false;
    if (/^\d+$/.test(text)) return parseInt(text, 10) === port;
    const match = text.match(/^(\d+)\s*[:\-]\s*(\d+)$/);
    if (!match) return false;
    const start = parseInt(match[1], 10);
    const end = parseInt(match[2], 10);
    if (Number.isNaN(start) || Number.isNaN(end)) return false;
    return port >= Math.min(start, end) && port <= Math.max(start, end);
};

export const ruleTargetsDns = (rule = {}) => (Array.isArray(rule.conditions) ? rule.conditions : []).some((cond) => {
    const values = splitCsv(cond?.value);
    if (cond?.type === 'protocol') return values.includes('dns');
    if (cond?.type === 'port' || cond?.type === 'source_port') return values.some((value) => parseInt(value, 10) === 53);
    if (cond?.type === 'port_range' || cond?.type === 'source_port_range') return values.some((value) => rangeIncludesPort(value, 53));
    if (cond?.type === 'inbound') return values.includes('dns-in');
    return false;
});

export const ruleHasResolvableTarget = (rule = {}) => {
    const domainTypes = new Set(['rule_set', 'domain', 'domain_suffix', 'domain_keyword', 'domain_regex']);
    return (Array.isArray(rule.conditions) ? rule.conditions : []).some((cond) => domainTypes.has(cond?.type));
};

export const ruleCanSniff = (rule = {}) => {
    const sniffDependentTypes = new Set(['rule_set', 'domain', 'domain_suffix', 'domain_keyword', 'domain_regex', 'protocol', 'client']);
    return !(Array.isArray(rule.conditions) ? rule.conditions : []).some((cond) => sniffDependentTypes.has(cond?.type));
};

export const ruleTargetsUdp = (rule = {}) => (Array.isArray(rule.conditions) ? rule.conditions : []).some((cond) => {
    const values = splitCsv(cond?.value);
    if (cond?.type === 'network') return values.includes('udp');
    if (cond?.type === 'protocol') return values.some((value) => ['dns', 'quic', 'stun', 'ntp', 'dtls', 'bittorrent'].includes(value));
    if (cond?.type === 'port' || cond?.type === 'source_port') return values.some((value) => [53, 123, 443, 3478].includes(parseInt(value, 10)));
    if (cond?.type === 'port_range' || cond?.type === 'source_port_range') {
        return values.some((value) => [53, 123, 443, 3478].some((port) => rangeIncludesPort(value, port)));
    }
    return false;
});

export const ruleTargetsTlsLikeTraffic = (rule = {}) => (Array.isArray(rule.conditions) ? rule.conditions : []).some((cond) => {
    const values = splitCsv(cond?.value);
    if (cond?.type === 'protocol') return values.some((value) => ['tls', 'quic', 'dtls'].includes(value));
    if (cond?.type === 'port' || cond?.type === 'source_port') return values.some((value) => parseInt(value, 10) === 443);
    if (cond?.type === 'port_range' || cond?.type === 'source_port_range') return values.some((value) => rangeIncludesPort(value, 443));
    return false;
});

export const isRuleActionSelectable = (rule, action) => {
    if (action === 'route' || action === 'reject') return true;
    if (action === 'hijack-dns') return ruleTargetsDns(rule);
    if (action === 'sniff') return ruleCanSniff(rule);
    if (action === 'resolve') return ruleHasResolvableTarget(rule);
    return false;
};

export const getRuleActionDisabledReason = (rule, action) => {
    if (action === 'hijack-dns' && !ruleTargetsDns(rule)) return '仅适用于 DNS 流量规则';
    if (action === 'sniff' && !ruleCanSniff(rule)) return '当前规则已依赖域名、协议或客户端信息';
    if (action === 'resolve' && !ruleHasResolvableTarget(rule)) return '仅适用于域名类规则';
    return '';
};

export const hasRuleRouteOptions = (rule = {}) => ROUTE_OPTION_FIELDS.some((field) => {
    const value = rule[field];
    if (typeof value === 'boolean') return value;
    return value !== null && value !== undefined && String(value).trim() !== '';
});

export const shouldSuggestRouteOptionField = (rule, field) => {
    if (!rule || rule.action !== 'route') return false;

    const value = rule[field];
    const hasValue = typeof value === 'boolean'
        ? value
        : value !== null && value !== undefined && String(value).trim() !== '';
    if (hasValue) return true;

    const conditionTypes = new Set((Array.isArray(rule.conditions) ? rule.conditions : []).map((cond) => cond?.type).filter(Boolean));
    const portLikeTypes = new Set(['port', 'source_port', 'port_range', 'source_port_range']);
    const contentRoutingTypes = new Set([
        'rule_set',
        'domain',
        'domain_suffix',
        'domain_keyword',
        'domain_regex',
        'geoip',
        'source_geoip',
        'ip_cidr',
        'source_ip_cidr',
        'auth_user',
        'client',
        'process_name',
        'process_path',
        'package_name',
        'user',
        'user_id',
        'ip_version',
    ]);

    const onlyContentRouting = conditionTypes.size > 0 && [...conditionTypes].every((type) => contentRoutingTypes.has(type));
    if (onlyContentRouting) return false;

    const hasNetworkCond = conditionTypes.has('network');
    const hasNetworkTypeCond = conditionTypes.has('network_type');
    const hasPortLikeCond = [...conditionTypes].some((type) => portLikeTypes.has(type));
    const hasProtocolCond = conditionTypes.has('protocol');
    const hasInboundCond = conditionTypes.has('inbound');

    if (['option_override_address', 'option_override_port'].includes(field)) {
        return hasNetworkCond || hasPortLikeCond;
    }

    if (['option_network_strategy', 'option_network_type', 'option_fallback_network_type', 'option_fallback_delay'].includes(field)) {
        return hasNetworkCond || hasNetworkTypeCond;
    }

    if (['option_udp_disable_domain_unmapping', 'option_udp_connect', 'option_udp_timeout'].includes(field)) {
        if (hasNetworkCond || hasProtocolCond || hasPortLikeCond) return ruleTargetsUdp(rule);
        if (hasInboundCond) {
            const inboundValues = (Array.isArray(rule.conditions) ? rule.conditions : [])
                .filter((cond) => cond?.type === 'inbound')
                .flatMap((cond) => splitCsv(cond?.value));
            return inboundValues.includes('dns-in');
        }
        return false;
    }

    if (['option_tls_fragment', 'option_tls_fragment_fallback_delay', 'option_tls_record_fragment'].includes(field)) {
        return (hasProtocolCond || hasPortLikeCond) && ruleTargetsTlsLikeTraffic(rule);
    }

    return false;
};

export const hasSuggestedRouteOptions = (rule = {}) => ROUTE_OPTION_FIELDS
    .some((field) => shouldSuggestRouteOptionField(rule, field));

export const shouldShowRuleRouteOptions = (rule = {}) => (
    rule.action === 'route' && (hasRuleRouteOptions(rule) || hasSuggestedRouteOptions(rule))
);
