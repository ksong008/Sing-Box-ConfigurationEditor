import {
    applyNodeDialFields,
    buildUdpOverTcp,
    createNodeOutbound,
    parseHeadersText,
    parseOptionalInteger,
} from './shared.js';

export const naiveCodec = {
    type: 'naive',
    buildOutbound(node, ctx) {
        const outbound = createNodeOutbound(node, {
            server: node.server,
            server_port: node.port,
            username: node.username,
            password: node.secret,
            tls: { enabled: true },
        });
        if (node.sni) outbound.tls.server_name = node.sni;
        if (node.ech_enabled) {
            const ech = { enabled: true };
            if (node.ech_config) {
                const echConfig = node.ech_config.split('\n').map((item) => item.trim()).filter(Boolean);
                if (echConfig.length) ech.config = echConfig;
            }
            outbound.tls.ech = ech;
        }
        const insecureConcurrency = parseOptionalInteger(node.naive_insecure_concurrency);
        if (insecureConcurrency !== undefined && insecureConcurrency >= 0) outbound.insecure_concurrency = insecureConcurrency;
        const extraHeaders = parseHeadersText(node.naive_extra_headers_text);
        if (extraHeaders) outbound.extra_headers = extraHeaders;
        const udpOverTcp = buildUdpOverTcp(node.naive_udp_over_tcp, node.naive_udp_over_tcp_version);
        if (udpOverTcp) outbound.udp_over_tcp = udpOverTcp;
        if (node.naive_quic) outbound.quic = true;
        if (node.naive_quic_congestion_control) outbound.quic_congestion_control = node.naive_quic_congestion_control;
        applyNodeDialFields(outbound, node, ctx);
        return outbound;
    },
    parseOutbound(outbound, node) {
        node.username = outbound.username || '';
        node.secret = outbound.password || '';
    },
};
