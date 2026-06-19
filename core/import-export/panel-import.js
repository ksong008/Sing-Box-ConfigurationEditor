export const looksLikePanelState = (data) => Object.prototype.toString.call(data) === '[object Object]' && (
    !!data._version
    || 'settings' in data
    || 'dnsList' in data
    || 'nodes' in data
    || 'groups' in data
    || 'routeRules' in data
);

export const applyPanelImport = (ctx, data, {
    resetPanelStateToDefaults,
    absorbFakeipServer,
} = {}) => {
    const absorbFakeip = typeof absorbFakeipServer === 'function' ? absorbFakeipServer : () => {};
    if (!data || typeof data !== 'object') throw new Error('无效的 JSON 格式');
    if (typeof resetPanelStateToDefaults === 'function') resetPanelStateToDefaults();
    if (data._version && data._version !== '1.12') {
        ctx.showToast(`配置版本为 ${data._version}，当前面板适配 v1.12，部分字段可能不兼容`, 'warn', 5000);
    }
    if (data.fakeip) Object.assign(ctx.fakeip.value, data.fakeip);
    if (data.settings) {
        Object.assign(ctx.settings.value, data.settings);
        if (Array.isArray(ctx.settings.value.default_network_type)) {
            ctx.settings.value.default_network_type = ctx.settings.value.default_network_type.join(', ');
        }
        if (Array.isArray(ctx.settings.value.default_fallback_network_type)) {
            ctx.settings.value.default_fallback_network_type = ctx.settings.value.default_fallback_network_type.join(', ');
        }
    }
    if (data.tun) {
        Object.assign(ctx.tun.value, data.tun);
        ['include_interface', 'exclude_interface', 'include_package', 'exclude_package', 'route_exclude_address'].forEach((key) => {
            if (Array.isArray(ctx.tun.value[key])) {
                ctx.tun.value[key] = ctx.tun.value[key].join('\n');
            }
        });
    }
    if (data.clashApi) Object.assign(ctx.clashApi.value, data.clashApi);
    if (data.ntp) {
        Object.assign(
            ctx.ntp.value,
            typeof ctx.normalizeNtp === 'function' ? ctx.normalizeNtp(data.ntp) : data.ntp,
        );
    }
    if (data.tproxy) {
        const incomingTproxy = { ...data.tproxy };
        if (!incomingTproxy.dns_hijack_mode) {
            incomingTproxy.dns_hijack_mode = incomingTproxy.dns_port ? 'nat' : 'tproxy';
        }
        if (incomingTproxy.ingress_iface === undefined && incomingTproxy.egress_iface === undefined) {
            const legacyIface = String(incomingTproxy.iface || '').trim();
            incomingTproxy.ingress_iface = legacyIface || '';
            incomingTproxy.egress_iface = legacyIface || '';
        } else {
            if (incomingTproxy.ingress_iface === undefined) incomingTproxy.ingress_iface = '';
            if (incomingTproxy.egress_iface === undefined) incomingTproxy.egress_iface = '';
        }
        delete incomingTproxy.iface;
        delete incomingTproxy.server_ports;
        Object.assign(ctx.tproxy.value, incomingTproxy);
        ctx.extraInbounds.value = Array.isArray(data.extraInbounds) ? data.extraInbounds.map(ctx.normalizeExtraInbound) : [];
    }
    if (typeof data.corsProxyEnabled === 'boolean') ctx.corsProxyEnabled.value = data.corsProxyEnabled;
    if (data.dnsList) {
        const importedDnsList = Array.isArray(data.dnsList)
            ? data.dnsList.map((dns, index) => (
                typeof ctx.normalizeDnsServer === 'function'
                    ? ctx.normalizeDnsServer(dns, index)
                    : dns
            ))
            : data.dnsList;
        if (Array.isArray(importedDnsList)) {
            importedDnsList
                .filter((dns) => dns && dns.type === 'fakeip')
                .forEach(absorbFakeip);
            ctx.dnsList.value = importedDnsList.filter((dns) => dns && dns.type !== 'fakeip');
        } else {
            ctx.dnsList.value = importedDnsList;
        }
    }
    if (data.providers) ctx.providers.value = data.providers;
    if (data.nodes) ctx.nodes.value = data.nodes.map((node) => ctx.makeNode(node));
    if (data.groups) {
        ctx.groups.value = data.groups.map((group) => (
            typeof ctx.normalizeGroup === 'function'
                ? ctx.normalizeGroup(group)
                : { ...group, id: group.id || ctx.generateId('g') }
        ));
    }
    if (data.ruleSets) ctx.ruleSets.value = data.ruleSets.map((ruleSet) => ({ ...ruleSet, id: ruleSet.id || ctx.generateId('rs') }));
    if (data.routeRules) {
        ctx.routeRules.value = data.routeRules
            .map(ctx.migrateRule)
            .map((rule) => ({ ...rule, isEditing: false, draggable: false, id: rule.id || ctx.generateId('r') }));
    }
    ctx.showImportExport.value = false;
};
