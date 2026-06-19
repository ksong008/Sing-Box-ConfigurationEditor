import {
    applySharedQuicOutboundFields,
    createNodeOutbound,
    finalizeNodeOutbound,
    parsePortHoppingList,
    sanitizeNodeNetworkValue,
    toCsv,
} from './shared.js';

export const hysteria2Codec = {
    type: 'hysteria2',
    buildOutbound(node, ctx) {
        const outbound = createNodeOutbound(node, {
            server: node.server,
            server_port: node.port,
            password: node.secret,
        });
        if (node.hy2_up || node.hy2_down) {
            outbound.up_mbps = node.hy2_up;
            outbound.down_mbps = node.hy2_down;
        }
        if (node.hy2_obfs_type) {
            outbound.obfs = { type: node.hy2_obfs_type, password: node.hy2_obfs_password };
        }
        const serverPorts = parsePortHoppingList(node.hy2_server_ports);
        if (serverPorts.length > 0) {
            outbound.server_ports = serverPorts;
            delete outbound.server_port;
        }
        if (node.hy2_hop_interval) outbound.hop_interval = node.hy2_hop_interval;
        if (node.hy2_hop_interval_max) outbound.hop_interval_max = node.hy2_hop_interval_max;
        const network = sanitizeNodeNetworkValue(node, node.hy2_network);
        if (network) outbound.network = network;
        if (node.hy2_bbr_profile) outbound.bbr_profile = node.hy2_bbr_profile;
        if (node.hy2_brutal_debug) outbound.brutal_debug = true;
        applySharedQuicOutboundFields(outbound, node);
        return finalizeNodeOutbound(outbound, node, ctx);
    },
    parseOutbound(outbound, node) {
        node.secret = outbound.password || '';
        node.hy2_up = outbound.up_mbps || '';
        node.hy2_down = outbound.down_mbps || '';
        if (outbound.obfs) {
            node.hy2_obfs_type = outbound.obfs.type || '';
            node.hy2_obfs_password = outbound.obfs.password || '';
        }
        node.hy2_server_ports = toCsv(outbound.server_ports);
        node.hy2_hop_interval = outbound.hop_interval || '';
        node.hy2_network = typeof outbound.network === 'string' ? outbound.network : '';
    },
};
