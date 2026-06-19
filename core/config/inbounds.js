import {
    parseList,
    parseOptionalInteger,
} from '../config-utils.js';

const applySniffFields = (target, settings) => {
    if (!settings.sniff_enabled) return;
    target.sniff = true;
    if (settings.sniff_override_destination) target.sniff_override_destination = true;
    if (settings.sniff_timeout) target.sniff_timeout = settings.sniff_timeout;
};

export const buildConfigInbounds = (ctx, { useDnsNatInTproxy = false } = {}) => {
    const inbounds = [];
    const mixedIn = {
        type: 'mixed',
        tag: 'mixed-in',
        listen: '127.0.0.1',
        listen_port: ctx.settings.value.listen_port,
    };
    if (ctx.tproxy.value.enabled) {
        const tproxyInbound = {
            type: 'tproxy',
            tag: 'tproxy-in',
            listen: '::',
            listen_port: ctx.tproxy.value.listen_port,
        };
        if (ctx.tproxy.value.udp_fragment) tproxyInbound.udp_fragment = true;
        applySniffFields(tproxyInbound, ctx.settings.value);
        inbounds.push(tproxyInbound);
        if (useDnsNatInTproxy) {
            inbounds.push({
                type: 'direct',
                tag: 'dns-in',
                listen: '127.0.0.1',
                listen_port: ctx.tproxy.value.dns_port || 1053,
                override_port: 53,
            });
        }
    }
    applySniffFields(mixedIn, ctx.settings.value);
    inbounds.push(mixedIn);

    if (ctx.tun.value.enabled) {
        const addresses = [ctx.tun.value.address_v4].filter(Boolean);
        if (ctx.tun.value.address_v6) addresses.push(ctx.tun.value.address_v6);
        const tunInbound = {
            type: 'tun',
            tag: 'tun-in',
            interface_name: ctx.tun.value.interface_name,
            address: addresses,
            mtu: ctx.tun.value.mtu,
            stack: ctx.tun.value.stack,
            auto_route: ctx.tun.value.auto_route,
            strict_route: ctx.tun.value.strict_route,
            endpoint_independent_nat: ctx.tun.value.endpoint_independent_nat,
        };
        if (ctx.tun.value.loopback_address) tunInbound.loopback_address = ctx.tun.value.loopback_address;
        if (ctx.tun.value.auto_redirect) tunInbound.auto_redirect = true;
        if (ctx.tun.value.auto_redirect && ctx.tun.value.auto_redirect_input_mark) tunInbound.auto_redirect_input_mark = ctx.tun.value.auto_redirect_input_mark;
        if (ctx.tun.value.auto_redirect && ctx.tun.value.auto_redirect_output_mark) tunInbound.auto_redirect_output_mark = ctx.tun.value.auto_redirect_output_mark;
        if (ctx.tun.value.udp_timeout) tunInbound.udp_timeout = ctx.tun.value.udp_timeout;
        const iproute2TableIndex = parseOptionalInteger(ctx.tun.value.iproute2_table_index);
        if (iproute2TableIndex !== undefined) tunInbound.iproute2_table_index = iproute2TableIndex;
        const iproute2RuleIndex = parseOptionalInteger(ctx.tun.value.iproute2_rule_index);
        if (iproute2RuleIndex !== undefined) tunInbound.iproute2_rule_index = iproute2RuleIndex;
        const includeInterface = parseList(ctx.tun.value.include_interface);
        if (includeInterface.length > 0) tunInbound.include_interface = includeInterface;
        const excludeInterface = parseList(ctx.tun.value.exclude_interface);
        if (excludeInterface.length > 0) tunInbound.exclude_interface = excludeInterface;
        const includePackage = parseList(ctx.tun.value.include_package);
        if (includePackage.length > 0) tunInbound.include_package = includePackage;
        const excludePackage = parseList(ctx.tun.value.exclude_package);
        if (excludePackage.length > 0) tunInbound.exclude_package = excludePackage;
        if (ctx.tun.value.non_gateway_mode && ctx.tun.value.route_exclude_address) {
            const excludeList = ctx.tun.value.route_exclude_address
                .split('\n')
                .map((line) => line.replace(/#.*$/, '').trim())
                .filter((line) => line.length > 0);
            if (excludeList.length > 0) tunInbound.route_exclude_address = excludeList;
        }
        applySniffFields(tunInbound, ctx.settings.value);
        inbounds.push(tunInbound);
    }

    inbounds.push(...ctx.buildExtraInbounds());

    return inbounds;
};
