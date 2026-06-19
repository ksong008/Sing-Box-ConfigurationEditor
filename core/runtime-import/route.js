import {
    isGeneratedHijackDnsRule,
    runtimeRuleToPanel,
} from './route-rules.js';
import {
    isPlainObject,
    toCsv,
} from './utils.js';

export const applyRuntimeRouteImport = (ctx, sourceRoute) => {
    const route = isPlainObject(sourceRoute) ? sourceRoute : {};
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
};
