import {
    applySharedQuicOutboundFields,
    createNodeOutbound,
    finalizeNodeOutbound,
    parseOptionalInteger,
    parsePortHoppingList,
    sanitizeNodeNetworkValue,
    toCsv,
} from './shared.js';

export const hysteriaCodec = {
    type: 'hysteria',
    buildOutbound(node, ctx) {
        const outbound = createNodeOutbound(node, {
            server: node.server,
            server_port: node.port,
        });
        if (node.hy_up_text) outbound.up = node.hy_up_text;
        else outbound.up_mbps = node.hy_up_mbps || 100;
        if (node.hy_down_text) outbound.down = node.hy_down_text;
        else outbound.down_mbps = node.hy_down_mbps || 100;
        if (node.secret) {
            if (node.hy_auth_type === 'base64') outbound.auth = node.secret;
            else outbound.auth_str = node.secret;
        }
        if (node.hy_obfs) outbound.obfs = node.hy_obfs;
        const serverPorts = parsePortHoppingList(node.hy_server_ports);
        if (serverPorts.length > 0) {
            outbound.server_ports = serverPorts;
            delete outbound.server_port;
        }
        if (node.hy_hop_interval) outbound.hop_interval = node.hy_hop_interval;
        const recvWindowConn = parseOptionalInteger(node.hy_recv_window_conn);
        if (recvWindowConn !== undefined && recvWindowConn > 0) outbound.recv_window_conn = recvWindowConn;
        const recvWindow = parseOptionalInteger(node.hy_recv_window);
        if (recvWindow !== undefined && recvWindow > 0) outbound.recv_window = recvWindow;
        if (node.hy_disable_mtu_discovery) outbound.disable_mtu_discovery = true;
        const network = sanitizeNodeNetworkValue(node, node.hy_network);
        if (network) outbound.network = network;
        applySharedQuicOutboundFields(outbound, node);
        return finalizeNodeOutbound(outbound, node, ctx);
    },
    parseOutbound(outbound, node) {
        node.secret = outbound.auth_str || outbound.auth || '';
        node.hy_auth_type = outbound.auth ? 'base64' : 'str';
        node.hy_up_mbps = outbound.up_mbps || node.hy_up_mbps;
        node.hy_down_mbps = outbound.down_mbps || node.hy_down_mbps;
        node.hy_obfs = outbound.obfs || '';
        node.hy_server_ports = toCsv(outbound.server_ports);
        node.hy_hop_interval = outbound.hop_interval || '';
        node.hy_network = typeof outbound.network === 'string' ? outbound.network : '';
    },
};
