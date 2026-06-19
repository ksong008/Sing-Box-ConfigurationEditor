import {
    parseRuntimeGroupOutbound,
    parseRuntimeOutbound,
} from './protocol-codecs/index.js';
import { applyRuntimeDnsImport } from './runtime-import/dns.js';
import { applyRuntimeInboundsImport } from './runtime-import/inbounds.js';
import {
    isGeneratedHijackDnsRule,
    runtimeRuleToPanel,
} from './runtime-import/route-rules.js';
import {
    looksLikeRuntimeConfig,
    toCsv,
} from './runtime-import/utils.js';

export { looksLikeRuntimeConfig } from './runtime-import/utils.js';

export function createRuntimeImporter(ctx, {
    resetRuntimeImportState,
    absorbFakeipServer,
} = {}) {
    const resetRuntime = typeof resetRuntimeImportState === 'function' ? resetRuntimeImportState : () => {};
    const absorbFakeip = typeof absorbFakeipServer === 'function' ? absorbFakeipServer : () => {};

    const applyRuntimeImport = (data) => {
        if (!looksLikeRuntimeConfig(data)) throw new Error('这不是可识别的 sing-box 运行配置 JSON');
        resetRuntime();

        if (data.log && typeof data.log.level === 'string') {
            ctx.settings.value.log_level = data.log.level;
        }

        applyRuntimeDnsImport(ctx, data.dns, absorbFakeip);

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

        applyRuntimeInboundsImport(ctx, data.inbounds);

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
