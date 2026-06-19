import { createNodeOutbound, finalizeNodeOutbound } from './shared.js';

export const trojanCodec = {
    type: 'trojan',
    buildOutbound(node, ctx) {
        return finalizeNodeOutbound(createNodeOutbound(node, {
            server: node.server,
            server_port: node.port,
            password: node.secret,
        }), node, ctx);
    },
    parseOutbound(outbound, node) {
        node.secret = outbound.password || '';
    },
};
