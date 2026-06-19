import {
    createNodeOutbound,
    finalizeNodeOutbound,
    parseKeyValueText,
} from './shared.js';

export const torCodec = {
    type: 'tor',
    buildOutbound(node, ctx) {
        const outbound = createNodeOutbound(node);
        if (node.tor_executable_path) outbound.executable_path = node.tor_executable_path;
        if (node.tor_data_directory) outbound.data_directory = node.tor_data_directory;
        if (node.tor_extra_args) {
            const args = node.tor_extra_args.trim().split(/\s+/).filter(Boolean);
            if (args.length) outbound.extra_args = args;
        }
        const torrc = parseKeyValueText(node.tor_torrc_text);
        if (torrc) outbound.torrc = torrc;
        return finalizeNodeOutbound(outbound, node, ctx);
    },
    parseOutbound(outbound, node) {
        node.tor_executable_path = outbound.executable_path || '';
        node.tor_data_directory = outbound.data_directory || '';
        node.tor_extra_args = Array.isArray(outbound.extra_args) ? outbound.extra_args.join(' ') : '';
    },
};
