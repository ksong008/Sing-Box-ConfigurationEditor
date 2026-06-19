import { toLines } from './utils.js';

const RESERVED_RUNTIME_INBOUND_TAGS = new Set(['mixed-in', 'tun-in', 'tproxy-in', 'dns-in']);

const applyRuntimeSniffFields = (ctx, inbound = {}) => {
    if (!inbound.sniff) return;
    ctx.settings.value.sniff_enabled = true;
    ctx.settings.value.sniff_override_destination = !!inbound.sniff_override_destination;
    ctx.settings.value.sniff_timeout = inbound.sniff_timeout || ctx.settings.value.sniff_timeout;
};

const runtimeInboundToExtra = (ctx, inbound = {}) => {
    if (!inbound || !['http', 'socks', 'direct'].includes(inbound.type) || !inbound.tag) return null;
    if (RESERVED_RUNTIME_INBOUND_TAGS.has(inbound.tag)) return null;
    const mapped = {
        type: inbound.type,
        tag: inbound.tag,
        listen: inbound.listen || '127.0.0.1',
        listen_port: inbound.listen_port || (inbound.type === 'direct' ? 9000 : inbound.type === 'socks' ? 1080 : 8080),
        sniff: !!inbound.sniff,
        override_address: inbound.override_address || '',
        override_port: inbound.override_port === null || inbound.override_port === undefined ? '' : inbound.override_port,
        socks_version: inbound.version || '5',
        tls: !!(inbound.tls && inbound.tls.enabled),
        tls_cert_path: inbound.tls && inbound.tls.certificate_path ? inbound.tls.certificate_path : '',
        tls_key_path: inbound.tls && inbound.tls.key_path ? inbound.tls.key_path : '',
    };
    if (Array.isArray(inbound.users) && inbound.users[0]) {
        mapped.username = inbound.users[0].username || '';
        mapped.password = inbound.users[0].password || '';
    }
    return ctx.normalizeExtraInbound(mapped);
};

export const applyRuntimeInboundsImport = (ctx, sourceInbounds) => {
    const inbounds = Array.isArray(sourceInbounds) ? sourceInbounds : [];
    inbounds.forEach((inbound) => {
        if (!inbound || typeof inbound !== 'object') return;
        if (inbound.type === 'mixed') {
            if (inbound.listen_port) ctx.settings.value.listen_port = inbound.listen_port;
            applyRuntimeSniffFields(ctx, inbound);
        } else if (inbound.type === 'tun') {
            ctx.tun.value.enabled = true;
            ctx.tun.value.interface_name = inbound.interface_name || ctx.tun.value.interface_name;
            ctx.tun.value.stack = inbound.stack || ctx.tun.value.stack;
            ctx.tun.value.mtu = inbound.mtu || ctx.tun.value.mtu;
            ctx.tun.value.auto_route = !!inbound.auto_route;
            ctx.tun.value.strict_route = !!inbound.strict_route;
            ctx.tun.value.endpoint_independent_nat = !!inbound.endpoint_independent_nat;
            ctx.tun.value.loopback_address = inbound.loopback_address || '';
            ctx.tun.value.auto_redirect = !!inbound.auto_redirect;
            ctx.tun.value.auto_redirect_input_mark = inbound.auto_redirect_input_mark || '';
            ctx.tun.value.auto_redirect_output_mark = inbound.auto_redirect_output_mark || '';
            ctx.tun.value.udp_timeout = inbound.udp_timeout || '';
            ctx.tun.value.iproute2_table_index = inbound.iproute2_table_index === null || inbound.iproute2_table_index === undefined ? '' : inbound.iproute2_table_index;
            ctx.tun.value.iproute2_rule_index = inbound.iproute2_rule_index === null || inbound.iproute2_rule_index === undefined ? '' : inbound.iproute2_rule_index;
            ctx.tun.value.include_interface = toLines(inbound.include_interface);
            ctx.tun.value.exclude_interface = toLines(inbound.exclude_interface);
            ctx.tun.value.include_package = toLines(inbound.include_package);
            ctx.tun.value.exclude_package = toLines(inbound.exclude_package);
            ctx.tun.value.route_exclude_address = toLines(inbound.route_exclude_address);
            const addresses = Array.isArray(inbound.address) ? inbound.address : [];
            ctx.tun.value.address_v4 = addresses.find((item) => String(item).includes('.')) || '';
            ctx.tun.value.address_v6 = addresses.find((item) => String(item).includes(':')) || '';
            applyRuntimeSniffFields(ctx, inbound);
        } else if (inbound.type === 'tproxy') {
            ctx.tproxy.value.enabled = true;
            ctx.tproxy.value.listen_port = inbound.listen_port || ctx.tproxy.value.listen_port;
            ctx.tproxy.value.udp_fragment = !!inbound.udp_fragment;
            applyRuntimeSniffFields(ctx, inbound);
        } else {
            const extra = runtimeInboundToExtra(ctx, inbound);
            if (extra) ctx.extraInbounds.value.push(extra);
        }
    });
};
