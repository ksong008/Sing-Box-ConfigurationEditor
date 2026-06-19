import { anytlsCodec } from './anytls.js';
import { dnsCodec } from './dns.js';
import { httpCodec } from './http.js';
import { hysteriaCodec } from './hysteria.js';
import { hysteria2Codec } from './hysteria2.js';
import { naiveCodec } from './naive.js';
import { shadowsocksCodec } from './shadowsocks.js';
import { shadowtlsCodec } from './shadowtls.js';
import { socksCodec } from './socks.js';
import { sshCodec } from './ssh.js';
import { torCodec } from './tor.js';
import { trojanCodec } from './trojan.js';
import { tuicCodec } from './tuic.js';
import { vlessCodec } from './vless.js';
import { vmessCodec } from './vmess.js';
import { wireguardCodec } from './wireguard.js';
import {
    finalizeRuntimeNode,
    parseRuntimeDialFields,
} from './shared.js';

const protocolCodecs = [
    vlessCodec,
    vmessCodec,
    trojanCodec,
    shadowsocksCodec,
    hysteria2Codec,
    hysteriaCodec,
    tuicCodec,
    anytlsCodec,
    shadowtlsCodec,
    naiveCodec,
    socksCodec,
    httpCodec,
    wireguardCodec,
    sshCodec,
    torCodec,
    dnsCodec,
];

const protocolCodecMap = new Map(protocolCodecs.map((codec) => [codec.type, codec]));

export const getProtocolCodec = (type) => protocolCodecMap.get(String(type || '').trim()) || null;

export const buildNodeOutbound = (node, ctx) => {
    const codec = getProtocolCodec(node?.type);
    return codec && typeof codec.buildOutbound === 'function'
        ? codec.buildOutbound(node, ctx)
        : null;
};

export const parseRuntimeOutbound = (outbound = {}, ctx) => {
    if (!outbound || typeof outbound.type !== 'string' || !outbound.tag) return null;
    if (['direct', 'block', 'selector', 'urltest'].includes(outbound.type)) return null;
    const codec = getProtocolCodec(outbound.type);
    if (!codec || typeof codec.parseOutbound !== 'function') return null;
    const node = ctx.makeNode({
        tag: outbound.tag,
        type: outbound.type,
        server: outbound.server || '',
        port: outbound.server_port || 443,
        collapsed: false,
    });
    parseRuntimeDialFields(node, outbound);
    codec.parseOutbound(outbound, node, ctx);
    return finalizeRuntimeNode(node, outbound);
};

export const parseRuntimeGroupOutbound = (outbound = {}, ctx) => {
    if (!outbound || !['selector', 'urltest'].includes(outbound.type) || !outbound.tag) return null;
    return ctx.normalizeGroup({
        tag: outbound.tag,
        type: outbound.type,
        members: Array.isArray(outbound.outbounds) ? outbound.outbounds : [],
        url: outbound.url || 'https://www.gstatic.com/generate_204',
        interval: outbound.interval || '3m',
        tolerance: outbound.tolerance === null || outbound.tolerance === undefined ? 50 : outbound.tolerance,
        collapsed: false,
    });
};
