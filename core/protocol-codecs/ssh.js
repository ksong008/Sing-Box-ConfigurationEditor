import {
    createNodeOutbound,
    finalizeNodeOutbound,
    parseList,
} from './shared.js';

export const sshCodec = {
    type: 'ssh',
    buildOutbound(node, ctx) {
        const outbound = createNodeOutbound(node, {
            server: node.server,
            server_port: node.port,
            user: node.username,
        });
        if (node.ssh_auth_type === 'key') outbound.private_key = node.secret;
        else outbound.password = node.secret;
        if (node.ssh_private_key_path) outbound.private_key_path = node.ssh_private_key_path;
        if (node.ssh_private_key_passphrase) outbound.private_key_passphrase = node.ssh_private_key_passphrase;
        const hostKey = parseList(node.ssh_host_key_text);
        if (hostKey.length > 0) outbound.host_key = hostKey;
        const hostKeyAlgorithms = parseList(node.ssh_host_key_algorithms);
        if (hostKeyAlgorithms.length > 0) outbound.host_key_algorithms = hostKeyAlgorithms;
        if (node.ssh_client_version) outbound.client_version = node.ssh_client_version;
        return finalizeNodeOutbound(outbound, node, ctx);
    },
    parseOutbound(outbound, node) {
        node.username = outbound.user || '';
        if (outbound.private_key) {
            node.ssh_auth_type = 'key';
            node.secret = outbound.private_key;
        } else {
            node.ssh_auth_type = 'password';
            node.secret = outbound.password || '';
        }
    },
};
