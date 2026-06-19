import {
    buildUdpOverTcp,
    createNodeOutbound,
    finalizeNodeOutbound,
    sanitizeNodeNetworkValue,
} from './shared.js';

export const shadowsocksCodec = {
    type: 'shadowsocks',
    buildOutbound(node, ctx) {
        const outbound = createNodeOutbound(node, {
            server: node.server,
            server_port: node.port,
            method: node.ss_method || 'chacha20-ietf-poly1305',
            password: node.secret,
        });
        const network = sanitizeNodeNetworkValue(node, node.network);
        if (network) outbound.network = network;
        if (node.ss_plugin) {
            outbound.plugin = node.ss_plugin;
            if (node.ss_plugin_opts) outbound.plugin_opts = node.ss_plugin_opts;
        }
        const udpOverTcp = buildUdpOverTcp(node.ss_udp_over_tcp, node.ss_udp_over_tcp_version);
        if (udpOverTcp) outbound.udp_over_tcp = udpOverTcp;
        return finalizeNodeOutbound(outbound, node, ctx);
    },
    parseOutbound(outbound, node) {
        node.secret = outbound.password || '';
        node.ss_method = outbound.method || node.ss_method;
        node.network = typeof outbound.network === 'string' ? outbound.network : '';
        node.ss_plugin = outbound.plugin || '';
        node.ss_plugin_opts = outbound.plugin_opts || '';
        if (outbound.udp_over_tcp && outbound.udp_over_tcp.enabled) {
            node.ss_udp_over_tcp = true;
            node.ss_udp_over_tcp_version = String(outbound.udp_over_tcp.version || '2');
        }
    },
};
