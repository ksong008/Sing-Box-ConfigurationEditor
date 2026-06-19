import {
    createNodeOutbound,
    finalizeNodeOutbound,
    parseOptionalInteger,
    sanitizeNodeNetworkValue,
} from './shared.js';

export const wireguardCodec = {
    type: 'wireguard',
    buildOutbound(node, ctx) {
        const outbound = createNodeOutbound(node, {
            private_key: node.wg_private_key,
            peers: [{ public_key: node.wg_peer_pubkey, server: node.server, server_port: node.port }],
        });
        if (node.wg_psk) outbound.peers[0].pre_shared_key = node.wg_psk;
        outbound.local_address = [node.wg_local_address].filter(Boolean);
        if (node.wg_mtu) outbound.mtu = node.wg_mtu;
        if (node.wg_reserved) {
            const reserved = node.wg_reserved.split(',').map(Number).filter((value) => !Number.isNaN(value));
            if (reserved.length) outbound.reserved = reserved;
        }
        if (node.wg_system_interface) outbound.system_interface = true;
        if (node.wg_interface_name) outbound.interface_name = node.wg_interface_name;
        const workers = parseOptionalInteger(node.wg_workers);
        if (workers !== undefined && workers > 0) outbound.workers = workers;
        const network = sanitizeNodeNetworkValue(node, node.wg_network);
        if (network) outbound.network = network;
        return finalizeNodeOutbound(outbound, node, ctx, {
            applyTls: false,
            applyTransport: false,
            applyMux: false,
            applyNetwork: false,
            applyPacketEncoding: false,
        });
    },
    parseOutbound(outbound, node) {
        node.wg_private_key = outbound.private_key || '';
        const peer = Array.isArray(outbound.peers) ? (outbound.peers[0] || {}) : {};
        node.wg_peer_pubkey = peer.public_key || '';
        node.server = peer.server || '';
        node.port = peer.server_port || 443;
        node.wg_psk = peer.pre_shared_key || '';
        node.wg_local_address = Array.isArray(outbound.local_address) ? (outbound.local_address[0] || '') : '';
        node.wg_mtu = outbound.mtu || node.wg_mtu;
        node.wg_reserved = Array.isArray(outbound.reserved) ? outbound.reserved.join(',') : '';
        node.wg_system_interface = !!outbound.system_interface;
        node.wg_interface_name = outbound.interface_name || '';
        node.wg_workers = outbound.workers === null || outbound.workers === undefined ? '' : String(outbound.workers);
        node.wg_network = typeof outbound.network === 'string' ? outbound.network : '';
    },
};
