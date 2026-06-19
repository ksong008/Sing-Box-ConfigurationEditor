import {
    applyNodeDialFields,
    createNodeOutbound,
} from './shared.js';

export const shadowtlsCodec = {
    type: 'shadowtls',
    buildOutbound(node, ctx) {
        const outbound = createNodeOutbound(node, {
            server: node.server,
            server_port: node.port,
            password: node.shadowtls_password,
            version: parseInt(node.shadowtls_version, 10) || 3,
        });
        applyNodeDialFields(outbound, node, ctx);
        return outbound;
    },
    parseOutbound(outbound, node) {
        node.shadowtls_password = outbound.password || '';
        node.shadowtls_version = String(outbound.version || '3');
    },
};
