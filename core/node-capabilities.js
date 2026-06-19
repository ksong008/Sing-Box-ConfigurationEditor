import {
    DEFAULT_NETWORK_OPTIONS,
    MUX_FIELDS,
    NETWORK_FIELDS,
    PROTOCOL_CAPABILITY_SCHEMA,
    PROTOCOL_FIELD_GROUPS,
    REALITY_FIELDS,
    SHARED_QUIC_FIELDS,
    TCP_ONLY_NETWORK_OPTIONS,
    TLS_CONFIG_FIELDS,
    TLS_FIELDS,
    TRANSPORT_FIELDS,
    TRANSPORT_FIELD_GROUPS,
    TRANSPORT_HEADER_FIELDS,
    TRANSPORT_PATH_FIELDS,
    UDP_ONLY_NETWORK_OPTIONS,
} from './node-capability-schema.js';

const deleteFields = (target, fields) => {
    fields.forEach((field) => {
        delete target[field];
    });
};

const hasConfiguredValue = (value) => {
    if (typeof value === 'boolean') return value;
    return value !== null && value !== undefined && String(value).trim() !== '';
};

const nodeHasAnyConfiguredField = (node = {}, fields = []) => fields.some((field) => hasConfiguredValue(node[field]));

const getNodeShadowtlsVersion = (node = {}) => {
    const version = String(node.shadowtls_version || '3').trim();
    return version || '3';
};

const isNodeValidPort = (value) => {
    const port = Number(value);
    return Number.isFinite(port) && port > 0 && port <= 65535;
};

export function getNodeCapabilitySchema(type) {
    return PROTOCOL_CAPABILITY_SCHEMA[String(type || '').trim()] || PROTOCOL_CAPABILITY_SCHEMA.default;
}

export function getNodeAvailableTransportOptions(node = {}) {
    const schema = getNodeCapabilitySchema(node.type);
    return Array.isArray(schema.transportOptions) ? [...schema.transportOptions] : [];
}

export function getNodeTransportValue(node = {}) {
    return String(node.transport || '').trim();
}

export function getNodeCurrentNetworkValue(node = {}) {
    const field = getNodeCapabilitySchema(node.type).networkField || '';
    if (!field) return '';
    return String(node[field] || '').trim();
}

export function setNodeCurrentNetworkValue(node = {}, value = '') {
    const field = getNodeCapabilitySchema(node.type).networkField || '';
    if (field) node[field] = value;
}

export function getNodeAvailableNetworkOptions(node = {}) {
    const schema = getNodeCapabilitySchema(node.type);
    const transport = getNodeTransportValue(node);

    if (schema.networkMode === 'v2ray') {
        if (transport === 'quic') return [...UDP_ONLY_NETWORK_OPTIONS];
        if (['ws', 'http', 'grpc', 'httpupgrade'].includes(transport)) return [...TCP_ONLY_NETWORK_OPTIONS];
        return [...DEFAULT_NETWORK_OPTIONS];
    }

    if (schema.networkMode === 'socks') {
        if (String(node.socks_version || '5') !== '5') return [...TCP_ONLY_NETWORK_OPTIONS];
        return [...DEFAULT_NETWORK_OPTIONS];
    }

    if (schema.networkMode === 'default') return [...DEFAULT_NETWORK_OPTIONS];

    return [];
}

export function isNodeTlsDefaultOn(node = {}) {
    const schema = getNodeCapabilitySchema(node.type);
    return schema.tlsMode === 'required' || schema.tlsDefaultOn === true;
}

export function resolveNodeCapabilities(node = {}) {
    const type = String(node.type || 'vless').trim() || 'vless';
    const schema = getNodeCapabilitySchema(type);
    const shadowtlsVersion = type === 'shadowtls' ? getNodeShadowtlsVersion(node) : '';
    const transportOptions = getNodeAvailableTransportOptions(node);
    const allowedTransportValues = new Set(transportOptions.map((item) => item.value));
    const requestedTransport = getNodeTransportValue(node);
    const transportAllowed = requestedTransport === '' || allowedTransportValues.has(requestedTransport);
    const transport = transportAllowed ? requestedTransport : '';

    const networkField = schema.networkField || '';
    const networkOptions = getNodeAvailableNetworkOptions({ ...node, transport });
    const allowedNetworkValues = new Set(networkOptions.map((item) => item.value));
    const defaultNetworkValue = networkOptions.length > 0 ? (networkOptions[0]?.value || '') : '';
    const requestedNetworkValue = networkField ? String(node[networkField] || '').trim() : '';
    const networkAllowed = !networkField || requestedNetworkValue === '' || allowedNetworkValues.has(requestedNetworkValue);
    const effectiveNetworkValue = !networkField
        ? ''
        : (requestedNetworkValue && allowedNetworkValues.has(requestedNetworkValue) ? requestedNetworkValue : defaultNetworkValue);

    let supportsStreamTransport = false;
    let supportsDatagramTransport = false;

    if (['hysteria', 'hysteria2', 'tuic', 'wireguard'].includes(type)) {
        supportsDatagramTransport = effectiveNetworkValue !== 'tcp';
    } else if (type === 'naive') {
        supportsStreamTransport = !node.naive_quic;
        supportsDatagramTransport = !!node.naive_quic;
    } else if (['vless', 'vmess', 'trojan'].includes(type)) {
        supportsStreamTransport = transport !== 'quic' && effectiveNetworkValue !== 'udp';
        supportsDatagramTransport = transport === 'quic';
    } else if (type === 'shadowsocks') {
        supportsStreamTransport = effectiveNetworkValue !== 'udp' || !!node.ss_udp_over_tcp;
        supportsDatagramTransport = effectiveNetworkValue !== 'tcp' && !node.ss_udp_over_tcp;
    } else if (type === 'socks') {
        supportsStreamTransport = effectiveNetworkValue !== 'udp';
        supportsDatagramTransport = effectiveNetworkValue !== 'tcp';
    } else if (['http', 'ssh', 'shadowtls', 'anytls', 'tor'].includes(type)) {
        supportsStreamTransport = true;
    }

    const supportsTls = schema.tlsMode !== 'none';
    const tlsToggleVisible = schema.tlsMode === 'optional';
    const tlsRequired = schema.tlsMode === 'required';
    const hasTlsContext = tlsRequired || (tlsToggleVisible && !!node.tls);
    const isQuicTlsContext = hasTlsContext && (schema.nativeQuic === true || transport === 'quic' || (type === 'naive' && !!node.naive_quic));
    const isTcpTlsContext = hasTlsContext && !isQuicTlsContext;
    const supportsMultiplex = schema.multiplexMode === 'stream'
        && supportsStreamTransport
        && !(type === 'shadowsocks' && !!node.ss_udp_over_tcp);

    return {
        type,
        schema,
        transportOptions,
        transportAllowed,
        transport,
        requestedTransport,
        supportsTransport: transportOptions.length > 0,
        networkField,
        networkOptions,
        networkAllowed,
        requestedNetworkValue,
        effectiveNetworkValue,
        supportsSharedSecret: schema.sharedSecret === true,
        supportsSharedUsername: schema.sharedUsername === true,
        supportsTls,
        tlsToggleVisible,
        tlsRequired,
        tlsDefaultOn: tlsRequired || schema.tlsDefaultOn === true,
        hasTlsContext,
        isQuicTlsContext,
        isTcpTlsContext,
        supportsTlsInsecure: hasTlsContext && type !== 'naive',
        supportsTlsAlpn: hasTlsContext && type !== 'naive',
        supportsTlsDisableSni: hasTlsContext && type !== 'naive',
        supportsTlsVersion: hasTlsContext && type !== 'naive',
        supportsTlsFragment: isTcpTlsContext && type !== 'naive',
        supportsUtls: isTcpTlsContext && ['vless', 'vmess', 'trojan'].includes(type),
        supportsReality: isTcpTlsContext && ['vless', 'trojan'].includes(type),
        supportsPacketEncoding: schema.packetEncoding === true && effectiveNetworkValue !== 'tcp',
        supportsQuicAdvancedFields: schema.quicAdvanced === true,
        supportsStreamTransport,
        supportsDatagramTransport,
        supportsMultiplex,
        supportsServerEndpoint: schema.serverEndpoint !== false,
        shadowtlsVersion,
        supportsShadowtlsPassword: type === 'shadowtls' && shadowtlsVersion !== '1',
    };
}

export function shouldShowNodeTransportSection(node = {}) {
    return resolveNodeCapabilities(node).supportsTransport;
}

export function isNodeTransportFieldVisible(node = {}, field = '') {
    const caps = resolveNodeCapabilities(node);
    const name = String(field || '').trim();

    if (name === 'transport') return caps.supportsTransport;
    if (!caps.supportsTransport) return false;

    if (name === 'path') return TRANSPORT_PATH_FIELDS.includes(caps.transport);
    if (name === 'ws_host') return TRANSPORT_HEADER_FIELDS.includes(caps.transport);
    if (name === 'transport_headers_text') return TRANSPORT_HEADER_FIELDS.includes(caps.transport);
    if (name === 'transport_method') return caps.transport === 'http';
    if (name === 'transport_idle_timeout' || name === 'transport_ping_timeout') return ['http', 'grpc'].includes(caps.transport);
    if (name === 'transport_max_early_data' || name === 'transport_early_data_header_name') return caps.transport === 'ws';
    if (name === 'transport_permit_without_stream') return caps.transport === 'grpc';
    if (name === 'network') return caps.networkField === 'network';
    if (name === 'packet_encoding') return caps.supportsPacketEncoding;

    return false;
}

export function sanitizeNodeByCapabilities(node = {}) {
    if (!node || typeof node !== 'object') return node;

    const type = String(node.type || 'vless').trim() || 'vless';
    const caps = resolveNodeCapabilities(node);

    Object.entries(PROTOCOL_FIELD_GROUPS).forEach(([protocol, fields]) => {
        if (protocol !== type) deleteFields(node, fields);
    });

    NETWORK_FIELDS.forEach((field) => {
        if (field !== caps.networkField) delete node[field];
    });

    if (!caps.supportsSharedUsername) delete node.username;
    if (!caps.supportsSharedSecret) delete node.secret;

    // Legacy outbound shadowtls editors incorrectly exposed inbound-only handshake fields.
    delete node.shadowtls_handshake_server;
    delete node.shadowtls_handshake_port;

    if (!caps.supportsTransport) {
        deleteFields(node, TRANSPORT_FIELDS);
    } else {
        node.transport = caps.transport;
        Object.entries(TRANSPORT_FIELD_GROUPS).forEach(([transport, fields]) => {
            if (transport !== caps.transport) deleteFields(node, fields);
        });
        if (caps.transport !== 'ws') {
            delete node.transport_max_early_data;
            delete node.transport_early_data_header_name;
        }
        if (caps.transport !== 'http') delete node.transport_method;
        if (!['http', 'grpc'].includes(caps.transport)) {
            delete node.transport_idle_timeout;
            delete node.transport_ping_timeout;
        }
        if (caps.transport !== 'grpc') delete node.transport_permit_without_stream;
        if (!['ws', 'http', 'httpupgrade', 'grpc'].includes(caps.transport)) delete node.path;
        if (!['ws', 'http', 'httpupgrade'].includes(caps.transport)) delete node.ws_host;
    }

    if (caps.networkField) {
        node[caps.networkField] = caps.effectiveNetworkValue;
    }

    if (!caps.supportsMultiplex) {
        deleteFields(node, MUX_FIELDS);
    } else {
        if (!node.mux_enabled) deleteFields(node, MUX_FIELDS.filter((field) => field !== 'mux_enabled'));
        if (!node.mux_brutal_enabled) {
            delete node.mux_brutal_up_mbps;
            delete node.mux_brutal_down_mbps;
        }
    }

    if (!caps.supportsPacketEncoding) delete node.packet_encoding;

    if (!caps.supportsQuicAdvancedFields) deleteFields(node, SHARED_QUIC_FIELDS);

    if (!caps.supportsTls) {
        deleteFields(node, TLS_FIELDS);
    } else {
        if (caps.tlsRequired) node.tls = true;
        if (!caps.hasTlsContext) {
            deleteFields(node, TLS_FIELDS.filter((field) => field !== 'tls'));
        } else {
            if (!caps.supportsTlsInsecure) delete node.insecure;
            if (!caps.supportsTlsAlpn) {
                delete node.alpn;
                delete node.alpn_custom;
            }
            if (!caps.supportsTlsDisableSni) delete node.disable_sni;
            if (!caps.supportsTlsVersion) {
                delete node.tls_min_version;
                delete node.tls_max_version;
            }
            if (!caps.isTcpTlsContext) delete node.cipher_suites;
            if (!caps.supportsTlsFragment) {
                delete node.tls_fragment;
                delete node.tls_record_fragment;
                delete node.tls_fragment_fallback_delay;
            }
            if (!caps.supportsUtls) delete node.utls_fingerprint;
            if (!caps.supportsReality) deleteFields(node, REALITY_FIELDS);
        }
    }

    if (!node.reality) {
        delete node.reality_pubkey;
        delete node.reality_sid;
    }
    if (!node.ech_enabled) delete node.ech_config;
    if (!caps.supportsShadowtlsPassword) delete node.shadowtls_password;

    if (!node.ss_udp_over_tcp) delete node.ss_udp_over_tcp_version;
    if (!node.ss_plugin) delete node.ss_plugin_opts;
    if (!node.socks_udp_over_tcp) delete node.socks_udp_over_tcp_version;
    if (!node.hy2_obfs_type) delete node.hy2_obfs_password;
    if (!node.naive_udp_over_tcp) delete node.naive_udp_over_tcp_version;
    if (!node.naive_quic) delete node.naive_quic_congestion_control;

    if (!caps.supportsServerEndpoint) {
        delete node.server;
        delete node.port;
    }

    return node;
}

export function getNodeCapabilityIssues(node = {}) {
    const caps = resolveNodeCapabilities(node);
    const issues = [];

    if (caps.requestedTransport && !caps.transportAllowed) {
        issues.push({ code: 'transport_unsupported', field: 'transport', message: `选择了当前协议不支持的传输层 "${caps.requestedTransport}"` });
    }

    if (caps.networkField && caps.requestedNetworkValue && !caps.networkAllowed) {
        issues.push({ code: 'network_invalid', field: caps.networkField, message: `network 取值 "${caps.requestedNetworkValue}" 与当前协议/传输层组合不匹配` });
    }

    if (node.mux_enabled && !caps.supportsMultiplex) {
        issues.push({ code: 'multiplex_unsupported', field: 'mux_enabled', message: '当前协议/传输层不支持 multiplex' });
    }

    if (caps.tlsRequired && node.tls === false) {
        issues.push({ code: 'tls_required', field: 'tls', message: '所选协议要求 TLS，当前配置却显式关闭了 TLS' });
    }

    if (node.reality && !caps.supportsReality) {
        issues.push({ code: 'reality_unsupported', field: 'reality', message: '当前 TLS 上下文不支持 REALITY' });
    }

    if (node.utls_fingerprint && !caps.supportsUtls) {
        issues.push({ code: 'utls_unsupported', field: 'utls_fingerprint', message: '当前 TLS 上下文不支持 uTLS 指纹' });
    }

    if (node.packet_encoding && !caps.supportsPacketEncoding) {
        issues.push({ code: 'packet_encoding_ignored', field: 'packet_encoding', message: '当前 network 组合下 packet_encoding 不会生效' });
    }

    if (!caps.supportsQuicAdvancedFields && nodeHasAnyConfiguredField(node, SHARED_QUIC_FIELDS)) {
        issues.push({ code: 'quic_fields_unsupported', field: 'quic_initial_packet_size', message: '配置了 QUIC 高级参数，但当前协议不使用这组字段' });
    }

    if (!caps.hasTlsContext && nodeHasAnyConfiguredField(node, TLS_CONFIG_FIELDS)) {
        issues.push({ code: 'tls_fields_without_tls', field: 'tls', message: '填写了 TLS 相关参数，但当前协议/开关下 TLS 并未启用' });
    }

    if (caps.supportsServerEndpoint) {
        if (!String(node.server || '').trim()) {
            issues.push({ code: 'server_missing', field: 'server', message: '缺少服务器地址' });
        }
        if (!isNodeValidPort(node.port)) {
            issues.push({ code: 'port_invalid', field: 'port', message: '服务器端口无效或为空' });
        }
    }

    if (['vless', 'vmess', 'tuic'].includes(caps.type) && !String(node.secret || '').trim()) {
        issues.push({ code: 'uuid_missing', field: 'secret', message: '缺少 UUID' });
    }

    if (['trojan', 'shadowsocks', 'anytls'].includes(caps.type) && !String(node.secret || '').trim()) {
        issues.push({ code: 'password_missing', field: 'secret', message: '缺少密码' });
    }

    if (caps.type === 'hysteria') {
        const hasUp = String(node.hy_up_text || '').trim() || hasConfiguredValue(node.hy_up_mbps);
        const hasDown = String(node.hy_down_text || '').trim() || hasConfiguredValue(node.hy_down_mbps);
        if (!hasUp) issues.push({ code: 'hysteria_up_missing', field: 'hy_up_text', message: '缺少上行带宽，需填写 up 或 up_mbps' });
        if (!hasDown) issues.push({ code: 'hysteria_down_missing', field: 'hy_down_text', message: '缺少下行带宽，需填写 down 或 down_mbps' });
    }

    if (caps.type === 'hysteria2' && String(node.hy2_obfs_type || '').trim() && !String(node.hy2_obfs_password || '').trim()) {
        issues.push({ code: 'hy2_obfs_password_missing', field: 'hy2_obfs_password', message: '已选择 Hysteria2 混淆类型，但未填写 OBFS 密码' });
    }

    if (caps.type === 'wireguard') {
        if (!String(node.wg_private_key || '').trim()) issues.push({ code: 'wg_private_key_missing', field: 'wg_private_key', message: '缺少 WireGuard 本地私钥' });
        if (!String(node.wg_peer_pubkey || '').trim()) issues.push({ code: 'wg_peer_pubkey_missing', field: 'wg_peer_pubkey', message: '缺少 WireGuard 对端公钥' });
        if (!String(node.wg_local_address || '').trim()) issues.push({ code: 'wg_local_address_missing', field: 'wg_local_address', message: '缺少 WireGuard 本地地址' });
    }

    if (caps.type === 'ssh') {
        if (node.ssh_auth_type === 'key') {
            if (!String(node.secret || '').trim() && !String(node.ssh_private_key_path || '').trim()) {
                issues.push({ code: 'ssh_key_missing', field: 'secret', message: 'SSH 密钥认证需要填写私钥内容或私钥路径' });
            }
        } else if (!String(node.secret || '').trim()) {
            issues.push({ code: 'ssh_password_missing', field: 'secret', message: 'SSH 密码认证需要填写密码' });
        }
    }

    if (caps.type === 'shadowtls' && caps.supportsShadowtlsPassword && !String(node.shadowtls_password || '').trim()) {
        issues.push({ code: 'shadowtls_password_missing', field: 'shadowtls_password', message: `ShadowTLS v${caps.shadowtlsVersion} 需要填写 password` });
    }

    return issues;
}
