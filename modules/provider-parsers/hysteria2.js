import { getShareName } from './utils.js';

export const parseHysteria2 = (line, ctx) => {
    try {
        const url = new URL(line.replace(/^hy2:\/\//, 'hysteria2://'));
        return ctx.makeNode({
            tag: getShareName(url, `Hy2-${ctx.nodes.value.length + 1}`),
            type: 'hysteria2',
            server: url.hostname,
            port: parseInt(url.port, 10) || 443,
            secret: url.password || url.username,
            sni: url.searchParams.get('sni') || '',
            insecure: url.searchParams.get('insecure') === '1',
            hy2_obfs_type: url.searchParams.get('obfs') || '',
            hy2_obfs_password: url.searchParams.get('obfs-password') || '',
            tls: true,
            collapsed: true,
        });
    } catch {
        return null;
    }
};
