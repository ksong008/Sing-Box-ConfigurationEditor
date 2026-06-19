import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function loadNodeCapabilitiesModule() {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'singbox-node-capabilities-'));
    await fs.writeFile(path.join(tmpDir, 'package.json'), '{"type":"module"}\n', 'utf8');
    await fs.cp(path.join(rootDir, 'core'), path.join(tmpDir, 'core'), { recursive: true });

    try {
        const cacheBuster = Date.now();
        const capabilities = await import(`${pathToFileURL(path.join(tmpDir, 'core', 'node-capabilities.js')).href}?v=${cacheBuster}`);
        const protocolCodecs = await import(`${pathToFileURL(path.join(tmpDir, 'core', 'protocol-codecs', 'index.js')).href}?v=${cacheBuster}`);
        return {
            ...capabilities,
            ...protocolCodecs,
        };
    } finally {
        await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
}

const {
    getNodeAvailableNetworkOptions,
    getNodeAvailableTransportOptions,
    getNodeCapabilityIssues,
    buildNodeOutbound,
    isNodeTlsDefaultOn,
    isNodeTransportFieldVisible,
    resolveNodeCapabilities,
    sanitizeNodeByCapabilities,
} = await loadNodeCapabilitiesModule();

const values = (items) => items.map((item) => item.value);
const issueCodes = (node) => getNodeCapabilityIssues(node).map((issue) => issue.code);
const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('v2ray transports constrain network choices and transport fields', () => {
    assert.deepEqual(
        values(getNodeAvailableTransportOptions({ type: 'vless' })),
        ['', 'ws', 'grpc', 'http', 'httpupgrade', 'quic'],
    );
    assert.deepEqual(values(getNodeAvailableNetworkOptions({ type: 'vless', transport: 'quic' })), ['udp']);
    assert.deepEqual(values(getNodeAvailableNetworkOptions({ type: 'vless', transport: 'ws' })), ['tcp']);

    assert.equal(isNodeTransportFieldVisible({ type: 'vless', transport: 'ws' }, 'path'), true);
    assert.equal(isNodeTransportFieldVisible({ type: 'vless', transport: 'ws' }, 'ws_host'), true);
    assert.equal(isNodeTransportFieldVisible({ type: 'vless', transport: 'quic' }, 'path'), false);
    assert.equal(isNodeTransportFieldVisible({ type: 'vless', transport: 'quic' }, 'network'), true);
});

test('vless quic sanitizes stream-only transport, TLS, reality, mux, and quic advanced fields', () => {
    const node = sanitizeNodeByCapabilities({
        type: 'vless',
        server: 'example.com',
        port: 443,
        secret: '00000000-0000-4000-8000-000000000000',
        transport: 'quic',
        network: 'tcp',
        tls: true,
        path: '/ws',
        ws_host: 'example.com',
        mux_enabled: true,
        mux_protocol: 'h2mux',
        tls_fragment: true,
        reality: true,
        reality_pubkey: 'pub',
        cipher_suites: 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
        quic_initial_packet_size: '1200',
    });

    assert.equal(node.transport, 'quic');
    assert.equal(node.network, 'udp');
    assert.equal(hasOwn(node, 'path'), false);
    assert.equal(hasOwn(node, 'ws_host'), false);
    assert.equal(hasOwn(node, 'mux_enabled'), false);
    assert.equal(hasOwn(node, 'tls_fragment'), false);
    assert.equal(hasOwn(node, 'reality'), false);
    assert.equal(hasOwn(node, 'reality_pubkey'), false);
    assert.equal(hasOwn(node, 'cipher_suites'), false);
    assert.equal(hasOwn(node, 'quic_initial_packet_size'), false);

    const tls13Node = sanitizeNodeByCapabilities({
        type: 'vless',
        server: 'example.com',
        port: 443,
        secret: '00000000-0000-4000-8000-000000000000',
        tls: true,
        tls_min_version: '1.3',
        cipher_suites: 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
    });
    assert.equal(hasOwn(tls13Node, 'cipher_suites'), false);
});

test('invalid transport, invalid network, and TLS fields without TLS are diagnosed', () => {
    assert.ok(issueCodes({
        type: 'vless',
        server: 'example.com',
        port: 443,
        secret: '00000000-0000-4000-8000-000000000000',
        transport: 'ftp',
    }).includes('transport_unsupported'));

    assert.ok(issueCodes({
        type: 'vless',
        server: 'example.com',
        port: 443,
        secret: '00000000-0000-4000-8000-000000000000',
        transport: 'ws',
        network: 'udp',
    }).includes('network_invalid'));

    assert.ok(issueCodes({
        type: 'vless',
        server: 'example.com',
        port: 443,
        secret: '00000000-0000-4000-8000-000000000000',
        tls: false,
        insecure: true,
    }).includes('tls_fields_without_tls'));
});

test('ShadowTLS version rules require password only for v2/v3 and enforce required TLS', () => {
    assert.equal(isNodeTlsDefaultOn({ type: 'shadowtls' }), true);
    assert.equal(resolveNodeCapabilities({ type: 'shadowtls', shadowtls_version: '1' }).supportsShadowtlsPassword, false);
    assert.equal(resolveNodeCapabilities({ type: 'shadowtls', shadowtls_version: '3' }).supportsShadowtlsPassword, true);

    const legacyNode = sanitizeNodeByCapabilities({
        type: 'shadowtls',
        server: 'example.com',
        port: 443,
        shadowtls_version: '1',
        shadowtls_password: 'legacy',
    });
    assert.equal(hasOwn(legacyNode, 'shadowtls_password'), false);

    assert.ok(issueCodes({
        type: 'shadowtls',
        server: 'example.com',
        port: 443,
        shadowtls_version: '3',
    }).includes('shadowtls_password_missing'));

    assert.ok(issueCodes({
        type: 'shadowtls',
        server: 'example.com',
        port: 443,
        tls: false,
        shadowtls_version: '3',
        shadowtls_password: 'password',
    }).includes('tls_required'));

    const outboundCtx = { dnsList: { value: [] } };
    const modernOutbound = buildNodeOutbound({
        type: 'shadowtls',
        tag: 'shadowtls-v3',
        server: 'example.com',
        port: 443,
        tls: true,
        shadowtls_version: '3',
        shadowtls_password: 'password',
        insecure: true,
    }, outboundCtx);
    assert.equal(modernOutbound.version, 3);
    assert.equal(modernOutbound.password, 'password');
    assert.deepEqual(modernOutbound.tls, { enabled: true, insecure: true });

    const legacyOutbound = buildNodeOutbound({
        type: 'shadowtls',
        tag: 'shadowtls-v1',
        server: 'example.com',
        port: 443,
        tls: true,
        shadowtls_version: '1',
        shadowtls_password: 'stale-password',
    }, outboundCtx);
    assert.equal(legacyOutbound.version, 1);
    assert.equal(hasOwn(legacyOutbound, 'password'), false);
    assert.deepEqual(legacyOutbound.tls, { enabled: true });
});

test('Hysteria2 keeps native QUIC fields but strips TCP TLS-only fields', () => {
    const caps = resolveNodeCapabilities({
        type: 'hysteria2',
        hy2_network: 'udp',
    });
    assert.equal(caps.tlsRequired, true);
    assert.equal(caps.isQuicTlsContext, true);
    assert.equal(caps.supportsQuicAdvancedFields, true);
    assert.equal(caps.supportsTlsFragment, false);

    const node = sanitizeNodeByCapabilities({
        type: 'hysteria2',
        server: 'example.com',
        port: 443,
        tls: false,
        hy2_obfs_type: 'salamander',
        hy2_obfs_password: 'obfs-password',
        quic_initial_packet_size: '1200',
        tls_fragment: true,
    });
    assert.equal(node.tls, true);
    assert.equal(node.quic_initial_packet_size, '1200');
    assert.equal(hasOwn(node, 'tls_fragment'), false);

    assert.ok(issueCodes({
        type: 'hysteria2',
        server: 'example.com',
        port: 443,
        hy2_obfs_type: 'salamander',
    }).includes('hy2_obfs_password_missing'));

    const noObfs = sanitizeNodeByCapabilities({
        type: 'hysteria2',
        server: 'example.com',
        port: 443,
        hy2_obfs_type: '',
        hy2_obfs_password: 'unused',
    });
    assert.equal(hasOwn(noObfs, 'hy2_obfs_password'), false);
});

test('shadowsocks udp-over-tcp changes stream/datagram capability and strips stale fields', () => {
    const caps = resolveNodeCapabilities({
        type: 'shadowsocks',
        network: 'udp',
        ss_udp_over_tcp: true,
    });
    assert.equal(caps.supportsStreamTransport, true);
    assert.equal(caps.supportsDatagramTransport, false);
    assert.equal(caps.supportsMultiplex, false);

    const node = sanitizeNodeByCapabilities({
        type: 'shadowsocks',
        server: 'example.com',
        port: 8388,
        secret: 'password',
        network: 'udp',
        ss_udp_over_tcp: false,
        ss_udp_over_tcp_version: '2',
        mux_enabled: true,
        quic_initial_packet_size: '1200',
    });
    assert.equal(hasOwn(node, 'ss_udp_over_tcp_version'), false);
    assert.equal(hasOwn(node, 'mux_enabled'), false);
    assert.equal(hasOwn(node, 'quic_initial_packet_size'), false);

    assert.ok(issueCodes({
        type: 'shadowsocks',
        server: 'example.com',
        port: 8388,
        secret: 'password',
        quic_initial_packet_size: '1200',
    }).includes('quic_fields_unsupported'));
});

test('socks v4 is tcp-only and server endpoint requirements stay scoped', () => {
    assert.deepEqual(values(getNodeAvailableNetworkOptions({ type: 'socks', socks_version: '4' })), ['tcp']);
    assert.ok(issueCodes({
        type: 'socks',
        server: 'example.com',
        port: 1080,
        secret: 'password',
        socks_version: '4',
        socks_network: 'udp',
    }).includes('network_invalid'));

    assert.equal(issueCodes({ type: 'tor' }).includes('server_missing'), false);
    const httpIssues = issueCodes({ type: 'http' });
    assert.ok(httpIssues.includes('server_missing'));
    assert.ok(httpIssues.includes('port_invalid'));
});

let passed = 0;
for (const { name, fn } of tests) {
    try {
        fn();
        passed += 1;
        console.log(`[test] ok - ${name}`);
    } catch (error) {
        console.error(`[test] failed - ${name}`);
        throw error;
    }
}

console.log(`[test] node capability checks passed (${passed} tests)`);
