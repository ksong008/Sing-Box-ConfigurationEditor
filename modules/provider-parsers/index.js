import { parseHysteria2 } from './hysteria2.js';
import { parseShadowsocks } from './shadowsocks.js';
import { parseTrojan } from './trojan.js';
import { parseTuic } from './tuic.js';
import { decodeBase64Text } from './utils.js';
import { parseVless } from './vless.js';
import { parseVmess } from './vmess.js';

const SUPPORTED_PROTOCOL_PREFIXES = [
    'vless://',
    'vmess://',
    'trojan://',
    'ss://',
    'hysteria2://',
    'hy2://',
    'tuic://',
    'socks://',
    'http://',
];

const parseLine = (line, ctx) => {
    if (line.startsWith('vless://')) return parseVless(line, ctx);
    if (line.startsWith('trojan://')) return parseTrojan(line, ctx);
    if (line.startsWith('vmess://')) return parseVmess(line, ctx);
    if (line.startsWith('ss://')) return parseShadowsocks(line, ctx);
    if (line.startsWith('hysteria2://') || line.startsWith('hy2://')) return parseHysteria2(line, ctx);
    if (line.startsWith('tuic://')) return parseTuic(line, ctx);
    return null;
};

export const parseProviderNodes = (text, ctx) => {
    const firstNewIndex = ctx.nodes.value.length;
    let source = text.trim();
    const hasProtocol = SUPPORTED_PROTOCOL_PREFIXES.some((prefix) => source.includes(prefix));
    if (!hasProtocol) {
        source = decodeBase64Text(source);
    }

    const parsedNodes = [];
    source
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 5)
        .forEach((line) => {
            const node = parseLine(line, ctx);
            if (node) parsedNodes.push(ctx.makeNode({ ...node, collapsed: true }));
        });

    return {
        firstNewIndex,
        nodes: parsedNodes,
        count: parsedNodes.length,
    };
};
