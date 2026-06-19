import { getShareName } from './utils.js';

export const parseVless = (line, ctx) => {
    try {
        const url = new URL(line);
        const params = url.searchParams;
        const net = params.get('type') || '';
        const sec = params.get('security') || '';
        return ctx.makeNode({
            tag: getShareName(url, `VLESS-${ctx.nodes.value.length + 1}`),
            type: 'vless',
            server: url.hostname,
            port: parseInt(url.port, 10) || 443,
            secret: url.username,
            sni: params.get('sni') || params.get('host') || '',
            transport: ['ws', 'grpc', 'http', 'httpupgrade', 'quic'].includes(net) ? net : '',
            path: params.get('path') || params.get('serviceName') || '/',
            ws_host: params.get('host') || '',
            flow: params.get('flow') || '',
            tls: sec === 'tls' || sec === 'reality',
            insecure: params.get('allowInsecure') === '1',
            reality: sec === 'reality',
            reality_pubkey: params.get('pbk') || '',
            reality_sid: params.get('sid') || '',
            utls_fingerprint: params.get('fp') || '',
            alpn: params.get('alpn') || '',
            collapsed: true,
        });
    } catch {
        return null;
    }
};
