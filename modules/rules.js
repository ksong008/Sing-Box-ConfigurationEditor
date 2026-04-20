const { ref, watch, nextTick, computed } = window.Vue;

export function setupRulesModule(ctx) {
    const RULE_ACTIONS = ['route', 'reject', 'hijack-dns', 'sniff', 'resolve'];
    const SNIFF_PROTOCOLS = ['http', 'tls', 'quic', 'stun', 'dns', 'bittorrent', 'dtls', 'ssh', 'rdp', 'ntp'];

    const csvString = (value) => (
        Array.isArray(value)
            ? value.map((item) => String(item).trim()).filter(Boolean).join(', ')
            : String(value || '')
    );

    const splitCsv = (value) => csvString(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

    const normalizeCondition = (cond = {}) => ({
        type: typeof cond.type === 'string' && cond.type ? cond.type : 'domain_suffix',
        value: csvString(cond.value)
            .split(/\r?\n/)
            .map((item) => item.trim())
            .filter(Boolean)
            .join(', '),
    });

    const normalizeRule = (rule = {}) => {
        const normalizedConditions = Array.isArray(rule.conditions) && rule.conditions.length > 0
            ? rule.conditions.map(normalizeCondition)
            : [{ type: 'rule_set', value: '' }];
        const normalizedAction = RULE_ACTIONS.includes(rule.action)
            ? rule.action
            : (rule.outbound === '__reject__' ? 'reject' : 'route');

        return {
            id: rule.id || ctx.generateId('r'),
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
        if (rule.conditions) return normalizeRule(rule);
        const conds = [];
        if (rule.tagsStr) {
            conds.push({ type: rule.matchType || 'rule_set', value: rule.tagsStr });
        }
        return normalizeRule({
            ...rule,
            mode: 'and',
            invert: false,
            conditions: conds.length ? conds : [{ type: 'rule_set', value: '' }],
        });
    };

    const defaultRouteRules = [
        { id: ctx.generateId('r'), enabled: true, name: '拦截广告', conditions: [{ type: 'rule_set', value: 'geosite-category-ads-all,geoip-ad' }], mode: 'or', invert: false, action: 'reject', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: 'YouTube', conditions: [{ type: 'rule_set', value: 'geosite-youtube' }], mode: 'and', invert: false, action: 'route', outbound: '节点选择', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: 'AI 服务', conditions: [{ type: 'rule_set', value: 'geosite-category-ai-!cn' }], mode: 'and', invert: false, action: 'route', outbound: '节点选择', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: 'Google', conditions: [{ type: 'rule_set', value: 'geosite-google,geoip-google' }], mode: 'or', invert: false, action: 'route', outbound: '节点选择', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: 'Telegram', conditions: [{ type: 'rule_set', value: 'geosite-telegram,geoip-telegram' }], mode: 'or', invert: false, action: 'route', outbound: '节点选择', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: 'Twitter / X', conditions: [{ type: 'rule_set', value: 'geosite-twitter,geoip-twitter' }], mode: 'or', invert: false, action: 'route', outbound: '节点选择', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: 'Netflix', conditions: [{ type: 'rule_set', value: 'geosite-netflix,geoip-netflix' }], mode: 'or', invert: false, action: 'route', outbound: '节点选择', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: 'Spotify', conditions: [{ type: 'rule_set', value: 'geosite-spotify' }], mode: 'and', invert: false, action: 'route', outbound: '节点选择', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: '海外流媒体', conditions: [{ type: 'rule_set', value: 'geosite-proxymedia' }], mode: 'and', invert: false, action: 'route', outbound: '节点选择', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: 'GitHub', conditions: [{ type: 'rule_set', value: 'geosite-github' }], mode: 'and', invert: false, action: 'route', outbound: '节点选择', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: '微软(国内)', conditions: [{ type: 'rule_set', value: 'geosite-microsoft@cn' }], mode: 'and', invert: false, action: 'route', outbound: 'direct', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: '微软', conditions: [{ type: 'rule_set', value: 'geosite-microsoft' }], mode: 'and', invert: false, action: 'route', outbound: '节点选择', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: 'Apple(国内)', conditions: [{ type: 'rule_set', value: 'geosite-apple-cn' }], mode: 'and', invert: false, action: 'route', outbound: 'direct', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: 'Apple', conditions: [{ type: 'rule_set', value: 'geosite-apple' }], mode: 'and', invert: false, action: 'route', outbound: '节点选择', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: '中国直连', conditions: [{ type: 'rule_set', value: 'geosite-cn,geoip-cn' }], mode: 'or', invert: false, action: 'route', outbound: 'direct', isEditing: false, draggable: false },
        { id: ctx.generateId('r'), enabled: true, name: '境外兜底代理', conditions: [{ type: 'rule_set', value: 'geosite-geolocation-!cn' }], mode: 'and', invert: false, action: 'route', outbound: '节点选择', isEditing: false, draggable: false },
    ];

    const routeRules = ref(defaultRouteRules.map(migrateRule));

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

    const ruleTargetsDns = (rule = {}) => (Array.isArray(rule.conditions) ? rule.conditions : []).some((cond) => {
        const values = splitCsv(cond?.value);
        if (cond?.type === 'protocol') return values.includes('dns');
        if (cond?.type === 'port' || cond?.type === 'source_port') return values.some((value) => parseInt(value, 10) === 53);
        if (cond?.type === 'port_range' || cond?.type === 'source_port_range') return values.some((value) => rangeIncludesPort(value, 53));
        if (cond?.type === 'inbound') return values.includes('dns-in');
        return false;
    });

    const ruleHasResolvableTarget = (rule = {}) => {
        const domainTypes = new Set(['rule_set', 'domain', 'domain_suffix', 'domain_keyword', 'domain_regex']);
        return (Array.isArray(rule.conditions) ? rule.conditions : []).some((cond) => domainTypes.has(cond?.type));
    };

    const ruleCanSniff = (rule = {}) => {
        const sniffDependentTypes = new Set(['rule_set', 'domain', 'domain_suffix', 'domain_keyword', 'domain_regex', 'protocol', 'client']);
        return !(Array.isArray(rule.conditions) ? rule.conditions : []).some((cond) => sniffDependentTypes.has(cond?.type));
    };

    const ruleTargetsUdp = (rule = {}) => (Array.isArray(rule.conditions) ? rule.conditions : []).some((cond) => {
        const values = splitCsv(cond?.value);
        if (cond?.type === 'network') return values.includes('udp');
        if (cond?.type === 'protocol') return values.some((value) => ['dns', 'quic', 'stun', 'ntp', 'dtls', 'bittorrent'].includes(value));
        if (cond?.type === 'port' || cond?.type === 'source_port') return values.some((value) => [53, 123, 443, 3478].includes(parseInt(value, 10)));
        if (cond?.type === 'port_range' || cond?.type === 'source_port_range') {
            return values.some((value) => [53, 123, 443, 3478].some((port) => rangeIncludesPort(value, port)));
        }
        return false;
    });

    const ruleTargetsTlsLikeTraffic = (rule = {}) => (Array.isArray(rule.conditions) ? rule.conditions : []).some((cond) => {
        const values = splitCsv(cond?.value);
        if (cond?.type === 'protocol') return values.some((value) => ['tls', 'quic', 'dtls'].includes(value));
        if (cond?.type === 'port' || cond?.type === 'source_port') return values.some((value) => parseInt(value, 10) === 443);
        if (cond?.type === 'port_range' || cond?.type === 'source_port_range') return values.some((value) => rangeIncludesPort(value, 443));
        return false;
    });

    const isRuleActionSelectable = (rule, action) => {
        if (action === 'route' || action === 'reject') return true;
        if (action === 'hijack-dns') return ruleTargetsDns(rule);
        if (action === 'sniff') return ruleCanSniff(rule);
        if (action === 'resolve') return ruleHasResolvableTarget(rule);
        return false;
    };

    const getRuleActionDisabledReason = (rule, action) => {
        if (action === 'hijack-dns' && !ruleTargetsDns(rule)) return '仅适用于 DNS 流量规则';
        if (action === 'sniff' && !ruleCanSniff(rule)) return '当前规则已依赖域名、协议或客户端信息';
        if (action === 'resolve' && !ruleHasResolvableTarget(rule)) return '仅适用于域名类规则';
        return '';
    };

    const hasRuleRouteOptions = (rule = {}) => !!(
        rule.option_override_address
        || rule.option_override_port
        || rule.option_network_strategy
        || rule.option_network_type
        || rule.option_fallback_network_type
        || rule.option_fallback_delay
        || rule.option_udp_disable_domain_unmapping
        || rule.option_udp_connect
        || rule.option_udp_timeout
        || rule.option_tls_fragment
        || rule.option_tls_fragment_fallback_delay
        || rule.option_tls_record_fragment
    );

    const hasRouteDefaultOptions = computed(() => !!(
        ctx.settings.value.find_process
        || ctx.settings.value.default_network_strategy
        || ctx.settings.value.default_network_type
        || ctx.settings.value.default_fallback_network_type
        || ctx.settings.value.default_fallback_delay
    ));

    const shouldSuggestRouteOptionField = (rule, field) => {
        if (!rule || rule.action !== 'route') return false;

        const hasValue = (() => {
            const value = rule[field];
            if (typeof value === 'boolean') return value;
            return value !== null && value !== undefined && String(value).trim() !== '';
        })();
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

    const hasSuggestedRouteOptions = (rule = {}) => [
        'option_override_address',
        'option_override_port',
        'option_network_strategy',
        'option_network_type',
        'option_fallback_network_type',
        'option_fallback_delay',
        'option_udp_disable_domain_unmapping',
        'option_udp_connect',
        'option_udp_timeout',
        'option_tls_fragment',
        'option_tls_fragment_fallback_delay',
        'option_tls_record_fragment',
    ].some((field) => shouldSuggestRouteOptionField(rule, field));

    const shouldShowRuleRouteOptions = (rule = {}) => rule.action === 'route' && (hasRuleRouteOptions(rule) || hasSuggestedRouteOptions(rule));

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
