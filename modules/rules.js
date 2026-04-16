const { ref, watch, nextTick } = window.Vue;

export function setupRulesModule(ctx) {
    const ruleSets = ref([
        { id: ctx.generateId('rs'), tag: 'geosite-category-ads-all', format: 'binary', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/category-ads-all.srs', detour: 'direct', update_interval: '1d' },
        { id: ctx.generateId('rs'), tag: 'geoip-ad', format: 'binary', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geoip/ad.srs', detour: 'direct', update_interval: '1d' },
        { id: ctx.generateId('rs'), tag: 'geosite-youtube', format: 'binary', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/youtube.srs', detour: 'direct', update_interval: '1d' },
        { id: ctx.generateId('rs'), tag: 'geosite-category-ai-!cn', format: 'binary', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/category-ai-!cn.srs', detour: 'direct', update_interval: '1d' },
        { id: ctx.generateId('rs'), tag: 'geosite-google', format: 'binary', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/google.srs', detour: 'direct', update_interval: '1d' },
        { id: ctx.generateId('rs'), tag: 'geoip-google', format: 'binary', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geoip/google.srs', detour: 'direct', update_interval: '1d' },
        { id: ctx.generateId('rs'), tag: 'geosite-telegram', format: 'binary', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/telegram.srs', detour: 'direct', update_interval: '1d' },
        { id: ctx.generateId('rs'), tag: 'geoip-telegram', format: 'binary', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geoip/telegram.srs', detour: 'direct', update_interval: '1d' },
        { id: ctx.generateId('rs'), tag: 'geosite-twitter', format: 'binary', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/twitter.srs', detour: 'direct', update_interval: '1d' },
        { id: ctx.generateId('rs'), tag: 'geoip-twitter', format: 'binary', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geoip/twitter.srs', detour: 'direct', update_interval: '1d' },
        { id: ctx.generateId('rs'), tag: 'geosite-netflix', format: 'binary', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/netflix.srs', detour: 'direct', update_interval: '1d' },
        { id: ctx.generateId('rs'), tag: 'geoip-netflix', format: 'binary', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geoip/netflix.srs', detour: 'direct', update_interval: '1d' },
        { id: ctx.generateId('rs'), tag: 'geosite-spotify', format: 'binary', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/spotify.srs', detour: 'direct', update_interval: '1d' },
        { id: ctx.generateId('rs'), tag: 'geosite-proxymedia', format: 'binary', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo-lite/geosite/proxymedia.srs', detour: 'direct', update_interval: '1d' },
        { id: ctx.generateId('rs'), tag: 'geosite-github', format: 'binary', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/github.srs', detour: 'direct', update_interval: '1d' },
        { id: ctx.generateId('rs'), tag: 'geosite-microsoft@cn', format: 'binary', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/microsoft@cn.srs', detour: 'direct', update_interval: '1d' },
        { id: ctx.generateId('rs'), tag: 'geosite-microsoft', format: 'binary', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/microsoft.srs', detour: 'direct', update_interval: '1d' },
        { id: ctx.generateId('rs'), tag: 'geosite-apple-cn', format: 'binary', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/apple-cn.srs', detour: 'direct', update_interval: '1d' },
        { id: ctx.generateId('rs'), tag: 'geosite-apple', format: 'binary', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/apple.srs', detour: 'direct', update_interval: '1d' },
        { id: ctx.generateId('rs'), tag: 'geosite-cn', format: 'binary', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/cn.srs', detour: 'direct', update_interval: '1d' },
        { id: ctx.generateId('rs'), tag: 'geoip-cn', format: 'binary', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geoip/cn.srs', detour: 'direct', update_interval: '1d' },
        { id: ctx.generateId('rs'), tag: 'geosite-geolocation-!cn', format: 'binary', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/geolocation-!cn.srs', detour: 'direct', update_interval: '1d' },
    ]);

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

    const migrateRule = (rule) => {
        if (rule.conditions) return rule;
        const conds = [];
        if (rule.tagsStr) {
            conds.push({ type: rule.matchType || 'rule_set', value: rule.tagsStr });
        }
        return {
            ...rule,
            mode: 'and',
            invert: false,
            conditions: conds.length ? conds : [{ type: 'rule_set', value: '' }],
        };
    };

    const defaultRouteRules = [
        { id: ctx.generateId('r'), enabled: true, name: '拦截广告', conditions: [{ type: 'rule_set', value: 'geosite-category-ads-all,geoip-ad' }], mode: 'or', invert: false, outbound: '__reject__', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: 'YouTube', conditions: [{ type: 'rule_set', value: 'geosite-youtube' }], mode: 'and', invert: false, outbound: '节点选择', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: 'AI 服务', conditions: [{ type: 'rule_set', value: 'geosite-category-ai-!cn' }], mode: 'and', invert: false, outbound: '节点选择', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: 'Google', conditions: [{ type: 'rule_set', value: 'geosite-google,geoip-google' }], mode: 'or', invert: false, outbound: '节点选择', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: 'Telegram', conditions: [{ type: 'rule_set', value: 'geosite-telegram,geoip-telegram' }], mode: 'or', invert: false, outbound: '节点选择', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: 'Twitter / X', conditions: [{ type: 'rule_set', value: 'geosite-twitter,geoip-twitter' }], mode: 'or', invert: false, outbound: '节点选择', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: 'Netflix', conditions: [{ type: 'rule_set', value: 'geosite-netflix,geoip-netflix' }], mode: 'or', invert: false, outbound: '节点选择', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: 'Spotify', conditions: [{ type: 'rule_set', value: 'geosite-spotify' }], mode: 'and', invert: false, outbound: '节点选择', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: '海外流媒体', conditions: [{ type: 'rule_set', value: 'geosite-proxymedia' }], mode: 'and', invert: false, outbound: '节点选择', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: 'GitHub', conditions: [{ type: 'rule_set', value: 'geosite-github' }], mode: 'and', invert: false, outbound: '节点选择', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: '微软(国内)', conditions: [{ type: 'rule_set', value: 'geosite-microsoft@cn' }], mode: 'and', invert: false, outbound: 'direct', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: '微软', conditions: [{ type: 'rule_set', value: 'geosite-microsoft' }], mode: 'and', invert: false, outbound: '节点选择', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: 'Apple(国内)', conditions: [{ type: 'rule_set', value: 'geosite-apple-cn' }], mode: 'and', invert: false, outbound: 'direct', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: 'Apple', conditions: [{ type: 'rule_set', value: 'geosite-apple' }], mode: 'and', invert: false, outbound: '节点选择', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: '中国直连', conditions: [{ type: 'rule_set', value: 'geosite-cn,geoip-cn' }], mode: 'or', invert: false, outbound: 'direct', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: '境外兜底代理', conditions: [{ type: 'rule_set', value: 'geosite-geolocation-!cn' }], mode: 'and', invert: false, outbound: '节点选择', isEditing: false, draggable: false },
    ];

    const routeRules = ref(defaultRouteRules.map(migrateRule));

    const addCustomRule = async () => {
        routeRules.value.unshift({
            id: ctx.generateId('r'),
            enabled: true,
            name: '自定义规则',
            mode: 'and',
            invert: false,
            conditions: [{ type: 'domain_suffix', value: '' }],
            isEditing: true,
            outbound: 'direct',
            draggable: false,
        });
        if (typeof ctx.scrollJsonTo === 'function') {
            ctx.scrollJsonTo('"rules": [', { offset: 1, fallbackToEnd: false });
        }
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
        routeRules,
        addCustomRule,
        removeRule,
        toggleRuleSetCond,
        draggedRuleIndex,
        dragOverRuleIndex,
        onRuleDragStart,
        onRuleDragEnter,
        onRuleDrop,
        onRuleDragEnd,
    });
}
