import { decodeBase64Text } from './utils.js';

export const parseShadowsocks = (line, ctx) => {
    try {
        const hashIndex = line.indexOf('#');
        const name = hashIndex !== -1 ? decodeURIComponent(line.slice(hashIndex + 1)) : `SS-${ctx.nodes.value.length + 1}`;
        const body = line.slice(5, hashIndex !== -1 ? hashIndex : undefined);
        let method = 'chacha20-ietf-poly1305';
        let password = '';
        let host = '';
        let port = 443;
        if (body.includes('@')) {
            const atIndex = body.lastIndexOf('@');
            let cred = body.slice(0, atIndex);
            if (!cred.includes(':')) cred = decodeBase64Text(cred);
            const colonIndex = cred.indexOf(':');
            method = cred.slice(0, colonIndex);
            password = cred.slice(colonIndex + 1);
            const match = body.slice(atIndex + 1).match(/^(.+):(\d+)$/);
            if (match) {
                host = match[1];
                port = parseInt(match[2], 10);
            }
        } else {
            const decoded = decodeBase64Text(body);
            const colonIndex = decoded.indexOf(':');
            const atIndex = decoded.lastIndexOf('@');
            if (atIndex !== -1) {
                method = decoded.slice(0, colonIndex);
                password = decoded.slice(colonIndex + 1, atIndex);
                const match = decoded.slice(atIndex + 1).match(/^(.+):(\d+)$/);
                if (match) {
                    host = match[1];
                    port = parseInt(match[2], 10);
                }
            }
        }
        return ctx.makeNode({ tag: name, type: 'shadowsocks', server: host, port, secret: password, ss_method: method, tls: false, collapsed: true });
    } catch {
        return null;
    }
};
