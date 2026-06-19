import { getShareName } from './utils.js';

export const parseTuic = (line, ctx) => {
    try {
        const url = new URL(line);
        return ctx.makeNode({
            tag: getShareName(url, `TUIC-${ctx.nodes.value.length + 1}`),
            type: 'tuic',
            server: url.hostname,
            port: parseInt(url.port, 10) || 443,
            secret: url.username,
            tuic_password: url.password,
            sni: url.searchParams.get('sni') || '',
            tuic_congestion: url.searchParams.get('congestion_control') || 'cubic',
            tuic_udp_relay_mode: url.searchParams.get('udp_relay_mode') || 'native',
            insecure: url.searchParams.get('allow_insecure') === '1',
            alpn: url.searchParams.get('alpn') || 'h3',
            tls: true,
            collapsed: true,
        });
    } catch {
        return null;
    }
};
