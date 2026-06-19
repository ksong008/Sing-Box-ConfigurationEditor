import {
    parseRuntimeGroupOutbound,
    parseRuntimeOutbound,
} from '../protocol-codecs/index.js';

export const applyRuntimeOutboundsImport = (ctx, sourceOutbounds) => {
    const outbounds = Array.isArray(sourceOutbounds) ? sourceOutbounds : [];
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
};
