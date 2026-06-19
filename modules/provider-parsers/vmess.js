import { decodeBase64Text } from './utils.js';

export const parseVmess = (line, ctx) => {
    try {
        const payload = JSON.parse(decodeBase64Text(line.slice(8)));
        if (!payload.add) return null;
        const net = payload.net || '';
        return ctx.makeNode({
            tag: payload.ps || `VMess-${ctx.nodes.value.length + 1}`,
            type: 'vmess',
            server: payload.add,
            port: parseInt(payload.port, 10) || 443,
            secret: payload.id,
            sni: payload.sni || payload.host || '',
            transport: ['ws', 'grpc', 'http', 'httpupgrade'].includes(net) ? net : '',
            path: payload.path || payload.serviceName || '/',
            ws_host: payload.host || '',
            tls: payload.tls === 'tls',
            alpn: payload.alpn || '',
            collapsed: true,
        });
    } catch {
        return null;
    }
};
