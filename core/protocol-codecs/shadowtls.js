import {
    createNodeOutbound,
    finalizeNodeOutbound,
} from './shared.js';

export const shadowtlsCodec = {
    type: 'shadowtls',
    buildOutbound(node, ctx) {
        const version = parseInt(node.shadowtls_version, 10) || 3;
        const outbound = createNodeOutbound(node, {
            server: node.server,
            server_port: node.port,
            version,
        });
        if (version !== 1 && node.shadowtls_password) outbound.password = node.shadowtls_password;
        return finalizeNodeOutbound(outbound, node, ctx);
    },
    parseOutbound(outbound, node) {
        node.shadowtls_password = outbound.password || '';
        node.shadowtls_version = String(outbound.version || '3');
    },
};
