import { createNodeOutbound, finalizeNodeOutbound } from './shared.js';

export const vmessCodec = {
    type: 'vmess',
    buildOutbound(node, ctx) {
        const outbound = createNodeOutbound(node, {
            server: node.server,
            server_port: node.port,
            uuid: node.secret,
            security: node.vmess_security || 'auto',
            alter_id: node.vmess_alter_id || 0,
        });
        if (node.vmess_global_padding) outbound.global_padding = true;
        if (node.vmess_authenticated_length === false) outbound.authenticated_length = false;
        return finalizeNodeOutbound(outbound, node, ctx);
    },
    parseOutbound(outbound, node) {
        node.secret = outbound.uuid || '';
        node.vmess_security = outbound.security || 'auto';
        node.vmess_alter_id = outbound.alter_id || 0;
        node.vmess_global_padding = !!outbound.global_padding;
        node.vmess_authenticated_length = outbound.authenticated_length !== false;
    },
};
