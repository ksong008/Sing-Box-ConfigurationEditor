import { createNodeOutbound } from './shared.js';

export const dnsCodec = {
    type: 'dns',
    buildOutbound(node) {
        return createNodeOutbound(node);
    },
    parseOutbound() {
        // no extra fields currently exposed
    },
};
