import {
    buildUdpOverTcp,
    createNodeOutbound,
    finalizeNodeOutbound,
    sanitizeNodeNetworkValue,
} from './shared.js';

export const socksCodec = {
    type: 'socks',
    buildOutbound(node, ctx) {
        const outbound = createNodeOutbound(node, {
            server: node.server,
            server_port: node.port,
            version: node.socks_version || '5',
        });
        if (node.username) outbound.username = node.username;
        if (node.secret) outbound.password = node.secret;
        const network = sanitizeNodeNetworkValue(node, node.socks_network);
        if (network) outbound.network = network;
        const udpOverTcp = buildUdpOverTcp(node.socks_udp_over_tcp, node.socks_udp_over_tcp_version);
        if (udpOverTcp) outbound.udp_over_tcp = udpOverTcp;
        return finalizeNodeOutbound(outbound, node, ctx);
    },
    parseOutbound(outbound, node) {
        node.socks_version = String(outbound.version || '5');
        node.username = outbound.username || '';
        node.secret = outbound.password || '';
        node.socks_network = typeof outbound.network === 'string' ? outbound.network : '';
        if (outbound.udp_over_tcp && outbound.udp_over_tcp.enabled) {
            node.socks_udp_over_tcp = true;
            node.socks_udp_over_tcp_version = String(outbound.udp_over_tcp.version || '2');
        }
    },
};
