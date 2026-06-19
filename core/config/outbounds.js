import { buildNodeOutbound } from '../protocol-codecs/index.js';

export const buildConfigOutbounds = (ctx) => {
    const allTags = [...ctx.groups.value.map((group) => group.tag), ...ctx.nodes.value.map((node) => node.tag)];
    const tagCount = {};
    allTags.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
    const dupTags = Object.keys(tagCount).filter((tag) => tagCount[tag] > 1);
    if (dupTags.length > 0) {
        console.warn('[sing-box] 出站 tag 重名，sing-box 将拒绝启动:', dupTags);
    }

    const outbounds = [];
    const validOutboundTags = new Set([...ctx.groups.value.map((group) => group.tag), ...ctx.nodes.value.map((node) => node.tag), 'direct']);

    ctx.groups.value.forEach((group) => {
        const outbound = { type: group.type, tag: group.tag };
        const validMembers = group.members.filter((member) => validOutboundTags.has(member));
        if (validMembers.length === 0) validMembers.push('direct');
        outbound.outbounds = [...validMembers];
        if (group.type === 'urltest') {
            outbound.url = group.url || 'https://www.gstatic.com/generate_204';
            outbound.interval = group.interval || '3m';
            if (group.tolerance) outbound.tolerance = group.tolerance;
        }
        outbounds.push(outbound);
    });

    ctx.nodes.value.forEach((node) => {
        const outbound = buildNodeOutbound(node, ctx);
        if (outbound) outbounds.push(outbound);
    });

    outbounds.push({
        type: 'direct',
        tag: 'direct',
        ...(ctx.tun.value.enabled && ctx.tun.value.non_gateway_mode && ctx.tun.value.bind_interface ? { bind_interface: ctx.tun.value.bind_interface } : {}),
    });

    return outbounds;
};
