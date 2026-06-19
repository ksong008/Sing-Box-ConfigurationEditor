import {
    createNodeOutbound,
    finalizeNodeOutbound,
    headersToText,
    parseHeadersText,
} from './shared.js';

export const httpCodec = {
    type: 'http',
    buildOutbound(node, ctx) {
        const outbound = createNodeOutbound(node, {
            server: node.server,
            server_port: node.port,
        });
        if (node.username) outbound.username = node.username;
        if (node.secret) outbound.password = node.secret;
        if (node.http_path) outbound.path = node.http_path;
        const headers = parseHeadersText(node.http_headers_text);
        if (headers) outbound.headers = headers;
        return finalizeNodeOutbound(outbound, node, ctx);
    },
    parseOutbound(outbound, node) {
        node.username = outbound.username || '';
        node.secret = outbound.password || '';
        node.http_path = outbound.path || '';
        node.http_headers_text = headersToText(outbound.headers);
    },
};
