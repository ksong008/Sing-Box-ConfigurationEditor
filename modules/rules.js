import { createDefaultRouteRules, createDefaultRuleSets } from './rules/defaults.js';
import { migrateRule as migrateRuleBase, normalizeRule as normalizeRuleBase, csvString } from './rules/normalize.js';
import {
    getRuleActionDisabledReason,
    hasRuleRouteOptions,
    hasSuggestedRouteOptions,
    isRuleActionSelectable,
    shouldShowRuleRouteOptions,
    shouldSuggestRouteOptionField,
} from './rules/route-options.js';
import { RULE_ACTIONS, SNIFF_PROTOCOLS } from './rules/schema.js';

const { ref, watch, nextTick, computed } = window.Vue;

export function setupRulesModule(ctx) {
    const normalizeRule = (rule) => normalizeRuleBase(rule, ctx.generateId);
    const migrateRule = (rule) => migrateRuleBase(rule, ctx.generateId);

    const onRuleActionChange = (rule) => {
        if (!rule) return;
        if (!RULE_ACTIONS.includes(rule.action)) rule.action = 'route';
        if (rule.action === 'route' && (!rule.outbound || rule.outbound === '__reject__')) {
            rule.outbound = 'direct';
        }
        if (rule.action === 'reject' && !['default', 'drop', 'reply'].includes(rule.reject_method)) {
            rule.reject_method = 'default';
        }
    };

    const ruleSets = ref(createDefaultRuleSets(ctx.generateId));

    watch(() => ruleSets.value.length, (newLen, oldLen) => {
        if (newLen > 0 && oldLen === 0) ctx.settings.value.store_rdrc = true;
    });

    const addRuleSet = async () => {
        ruleSets.value.push({
            id: ctx.generateId('rs'),
            tag: '',
            format: 'binary',
            url: '',
            detour: ctx.settings.value.rule_set_detour || 'direct',
            update_interval: '1d',
        });
        await nextTick();
        if (ctx.ruleSetContainer.value) {
            ctx.ruleSetContainer.value.scrollTo({
                top: ctx.ruleSetContainer.value.scrollHeight,
                behavior: 'smooth',
            });
        }
        await nextTick();
        const el = ctx.jsonContainer.value;
        if (!el || !ctx.generatedJson) return;
        const text = ctx.generatedJson.value;
        const lines = text.split('\n');
        let targetLine = -1;
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].includes('"update_interval"')) {
                targetLine = i;
                break;
            }
        }
        if (targetLine !== -1) {
            const lineHeight = el.scrollHeight / Math.max(lines.length, 1);
            const targetY = Math.max(0, targetLine - 4) * lineHeight;
            el.scrollTo({ top: Math.max(0, targetY - el.clientHeight * 0.25), behavior: 'smooth' });
        } else {
            el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        }
    };

    const removeRuleSet = (index) => {
        ctx.showConfirm('确定要删除此规则集吗？', () => ruleSets.value.splice(index, 1), {
            title: '删除规则集',
            okText: '删除',
        });
    };

    const onRuleSetTagChange = (ruleSet) => {
        if (!ruleSet.tag) return;
        let type = '';
        if (ruleSet.tag.includes('geoip')) type = 'geoip';
        else if (ruleSet.tag.includes('geosite')) type = 'geosite';
        else if (ruleSet.tag.match(/^(ip|ipcidr)-/i)) type = 'geoip';
        else if (ruleSet.tag.match(/^(domain|site)-/i)) type = 'geosite';

        if (type) {
            const name = ruleSet.tag.replace(/^(geosite|geoip)-/i, '');
            const ext = ruleSet.format === 'source' ? 'json' : 'srs';
            ruleSet.url = ctx.settings.value.rule_set_cdn
                ? `https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/${type}/${name}.${ext}`
                : `https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/sing/geo/${type}/${name}.${ext}`;
        }
    };

    const onRuleSetFormatChange = (ruleSet) => {
        if (!ruleSet.url.includes('MetaCubeX/meta-rules-dat')) return;
        const match = ruleSet.url.match(/geo\/(geoip|geosite)\/(.+)\.(srs|json)/);
        if (!match) return;
        const ext = ruleSet.format === 'source' ? 'json' : 'srs';
        ruleSet.url = ruleSet.url.replace(/\.(srs|json)$/, `.${ext}`);
    };

    watch(() => ctx.settings.value.rule_set_cdn, (useCdn) => {
        ruleSets.value.forEach((ruleSet) => {
            if (ruleSet.url.includes('MetaCubeX/meta-rules-dat')) {
                const match = ruleSet.url.match(/geo\/(geoip|geosite)\/(.+)\.(srs|json)/);
                if (match) {
                    const ext = ruleSet.format === 'source' ? 'json' : 'srs';
                    ruleSet.url = useCdn
                        ? `https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/${match[1]}/${match[2]}.${ext}`
                        : `https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/sing/geo/${match[1]}/${match[2]}.${ext}`;
                }
            }
        });
    });

    watch(() => ctx.settings.value.rule_set_detour, (newDetour) => {
        ruleSets.value.forEach((ruleSet) => {
            ruleSet.detour = newDetour;
        });
    });

    const routeRules = ref(createDefaultRouteRules(ctx.generateId).map(migrateRule));

    const availableInboundTags = computed(() => {
        const tags = ['mixed-in'];
        if (ctx.tproxy.value.enabled) tags.push('tproxy-in');
        if (ctx.tproxy.value.enabled && ctx.settings.value.hijack_dns && (ctx.tproxy.value.dns_hijack_mode || 'tproxy') === 'nat') tags.push('dns-in');
        if (ctx.tun.value.enabled) tags.push('tun-in');
        const extraInbounds = Array.isArray(ctx.extraInbounds?.value) ? ctx.extraInbounds.value : [];
        extraInbounds.forEach((item) => {
            const tag = String(item && item.tag ? item.tag : '').trim();
            if (tag && !tags.includes(tag)) tags.push(tag);
        });
        return tags;
    });

    watch(routeRules, (rules) => {
        rules.forEach((rule) => {
            if (!isRuleActionSelectable(rule, rule.action)) {
                rule.action = 'route';
                if (!rule.outbound || rule.outbound === '__reject__') rule.outbound = 'direct';
            }
        });
    }, { deep: true });

    const addCustomRule = async (placement = 'top') => {
        const newRule = normalizeRule({
            id: ctx.generateId('r'),
            enabled: true,
            name: '自定义规则',
            mode: 'and',
            invert: false,
            conditions: [{ type: 'domain_suffix', value: '' }],
            action: 'route',
            isEditing: true,
            outbound: 'direct',
            draggable: false,
        });
        if (placement === 'bottom') routeRules.value.push(newRule);
        else routeRules.value.unshift(newRule);
        await nextTick();
        if (typeof ctx.scrollJsonTo === 'function') {
            ctx.scrollJsonTo('"rules": [', { offset: 1, fallbackToEnd: false });
        }
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const el = document.getElementById(`route-rule-${newRule.id}`);
                if (!el) return;
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.style.transition = 'box-shadow 0.2s, border-color 0.2s';
                el.style.borderColor = '#4f46e5';
                el.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.18)';
                setTimeout(() => {
                    el.style.borderColor = '';
                    el.style.boxShadow = '';
                }, 1800);
                const nameInput = el.querySelector('input[type="text"]');
                if (nameInput) {
                    setTimeout(() => {
                        nameInput.focus();
                        if (typeof nameInput.select === 'function') nameInput.select();
                    }, 160);
                }
            });
        });
    };

    const removeRule = (index) => {
        ctx.showConfirm('确定要删除此路由规则吗？', () => routeRules.value.splice(index, 1), {
            title: '删除路由规则',
            okText: '删除',
        });
    };

    const toggleRuleSetCond = (cond, tag) => {
        const tags = cond.value ? cond.value.split(',').map((item) => item.trim()).filter(Boolean) : [];
        const index = tags.indexOf(tag);
        if (index === -1) tags.push(tag);
        else tags.splice(index, 1);
        cond.value = tags.join(', ');
    };

    const toggleCsvField = (obj, key, tag) => {
        if (!obj || typeof key !== 'string') return;
        const current = csvString(obj[key]);
        const tags = current ? current.split(',').map((item) => item.trim()).filter(Boolean) : [];
        const index = tags.indexOf(tag);
        if (index === -1) tags.push(tag);
        else tags.splice(index, 1);
        obj[key] = tags.join(', ');
    };

    const hasRouteDefaultOptions = computed(() => !!(
        ctx.settings.value.find_process
        || ctx.settings.value.default_network_strategy
        || ctx.settings.value.default_network_type
        || ctx.settings.value.default_fallback_network_type
        || ctx.settings.value.default_fallback_delay
    ));

    const draggedRuleIndex = ref(null);
    const dragOverRuleIndex = ref(null);
    const onRuleDragStart = (index, event) => {
        draggedRuleIndex.value = index;
        event.dataTransfer.effectAllowed = 'move';
    };
    const onRuleDragEnter = (index) => {
        if (draggedRuleIndex.value !== null) dragOverRuleIndex.value = index;
    };
    const onRuleDragEnd = () => {
        draggedRuleIndex.value = null;
        dragOverRuleIndex.value = null;
        routeRules.value.forEach((rule) => {
            rule.draggable = false;
        });
    };
    const onRuleDrop = (index) => {
        const from = draggedRuleIndex.value;
        if (from !== null && from !== index) {
            const item = routeRules.value.splice(from, 1)[0];
            routeRules.value.splice(index, 0, item);
        }
        onRuleDragEnd();
    };

    Object.assign(ctx, {
        ruleSets,
        addRuleSet,
        removeRuleSet,
        onRuleSetTagChange,
        onRuleSetFormatChange,
        migrateRule,
        normalizeRule,
        onRuleActionChange,
        routeRules,
        ruleActions: RULE_ACTIONS,
        sniffProtocols: SNIFF_PROTOCOLS,
        availableInboundTags,
        isRuleActionSelectable,
        getRuleActionDisabledReason,
        hasRuleRouteOptions,
        hasRouteDefaultOptions,
        shouldShowRuleRouteOptions,
        hasSuggestedRouteOptions,
        shouldSuggestRouteOptionField,
        addCustomRule,
        removeRule,
        toggleRuleSetCond,
        toggleCsvField,
        draggedRuleIndex,
        dragOverRuleIndex,
        onRuleDragStart,
        onRuleDragEnter,
        onRuleDrop,
        onRuleDragEnd,
    });
}
