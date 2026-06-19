import {
    applySharedQuicOutboundFields,
    createNodeOutbound,
    finalizeNodeOutbound,
    sanitizeNodeNetworkValue,
} from './shared.js';

export const tuicCodec = {
    type: 'tuic',
    buildOutbound(node, ctx) {
        const outbound = createNodeOutbound(node, {
            server: node.server,
            server_port: node.port,
            uuid: node.secret,
            password: node.tuic_password,
            congestion_control: node.tuic_congestion || 'cubic',
        });
        const network = sanitizeNodeNetworkValue(node, node.tuic_network);
        if (network) outbound.network = network;
        if (node.tuic_udp_over_stream) outbound.udp_over_stream = true;
        else outbound.udp_relay_mode = node.tuic_udp_relay_mode || 'native';
        if (node.tuic_zero_rtt_handshake) outbound.zero_rtt_handshake = true;
        if (node.tuic_heartbeat) outbound.heartbeat = node.tuic_heartbeat;
        applySharedQuicOutboundFields(outbound, node);
        return finalizeNodeOutbound(outbound, node, ctx);
    },
    parseOutbound(outbound, node) {
        node.secret = outbound.uuid || '';
        node.tuic_password = outbound.password || '';
        node.tuic_congestion = outbound.congestion_control || node.tuic_congestion;
        node.tuic_network = typeof outbound.network === 'string' ? outbound.network : '';
        node.tuic_udp_over_stream = !!outbound.udp_over_stream;
        node.tuic_udp_relay_mode = outbound.udp_relay_mode || node.tuic_udp_relay_mode;
        node.tuic_zero_rtt_handshake = !!outbound.zero_rtt_handshake;
        node.tuic_heartbeat = outbound.heartbeat || '';
    },
};
