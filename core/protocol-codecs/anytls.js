import {
    createNodeOutbound,
    finalizeNodeOutbound,
    parseOptionalInteger,
} from './shared.js';

export const anytlsCodec = {
    type: 'anytls',
    buildOutbound(node, ctx) {
        const outbound = createNodeOutbound(node, {
            server: node.server,
            server_port: node.port,
            password: node.secret,
        });
        if (node.anytls_idle_session_check_interval) {
            outbound.idle_session_check_interval = node.anytls_idle_session_check_interval;
        }
        if (node.anytls_idle_session_timeout) outbound.idle_session_timeout = node.anytls_idle_session_timeout;
        const minIdleSession = parseOptionalInteger(node.anytls_min_idle_session);
        if (minIdleSession !== undefined && minIdleSession >= 0) outbound.min_idle_session = minIdleSession;
        return finalizeNodeOutbound(outbound, node, ctx);
    },
    parseOutbound(outbound, node) {
        node.secret = outbound.password || '';
        node.anytls_idle_session_check_interval = outbound.idle_session_check_interval || '';
    },
};
