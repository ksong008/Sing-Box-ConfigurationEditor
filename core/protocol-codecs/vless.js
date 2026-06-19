import { createNodeOutbound, finalizeNodeOutbound } from './shared.js';

export const vlessCodec = {
    type: 'vless',
    buildOutbound(node, ctx) {
        const outbound = createNodeOutbound(node, {
            server: node.server,
            server_port: node.port,
            uuid: node.secret,
        });
        if (node.flow) outbound.flow = node.flow;
        return finalizeNodeOutbound(outbound, node, ctx);
    },
    parseOutbound(outbound, node) {
        node.secret = outbound.uuid || '';
        node.flow = outbound.flow || '';
    },
};
