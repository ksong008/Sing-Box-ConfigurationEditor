import {
    getNodeCurrentNetworkValue,
    resolveNodeCapabilities,
    sanitizeNodeByCapabilities,
} from '../node-capabilities.js';
import {
    applyDialFields,
    buildUdpOverTcp,
    parseHeadersText,
    parseKeyValueText,
    parseList,
    parseOptionalInteger,
    parsePortHoppingList,
} from '../config-utils.js';

export {
    buildUdpOverTcp,
    parseHeadersText,
    parseKeyValueText,
    parseList,
    parseOptionalInteger,
    parsePortHoppingList,
};

export const toCsv = (value) => {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean).join(', ');
    return String(value || '');
};

export const headersToText = (headers) => {
    if (!headers || typeof headers !== 'object') return '';
    return Object.entries(headers)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
};

export const sanitizeNodeNetworkValue = (node = {}, rawValue = '') => {
    const value = String(rawValue || '').trim();
    if (!value) return '';
    const allowedValues = resolveNodeCapabilities(node).networkOptions
        .map((item) => item.value)
        .filter(Boolean);
    return allowedValues.includes(value) ? value : '';
};

export const createNodeOutbound = (node, fields = {}) => ({
    type: node.type,
    tag: node.tag,
    ...fields,
});

export const applyNodeDialFields = (outbound, node, ctx) => {
    applyDialFields(outbound, node, {
        validDnsTags: new Set(ctx.dnsList.value.map((dns) => dns.tag)),
    });
};

export const buildMultiplex = (node) => {
    if (!node.mux_enabled) return undefined;
    if (!resolveNodeCapabilities(node).supportsMultiplex) return undefined;
    const multiplex = {
        enabled: true,
        protocol: node.mux_protocol || 'h2mux',
    };
    const maxConnections = parseOptionalInteger(node.mux_max_connections);
    const minStreams = parseOptionalInteger(node.mux_min_streams);
    const maxStreams = parseOptionalInteger(node.mux_max_streams);
    if (maxConnections !== undefined && maxConnections > 0) multiplex.max_connections = maxConnections;
    if (minStreams !== undefined && minStreams > 0) multiplex.min_streams = minStreams;
    if (maxStreams !== undefined && maxStreams > 0) multiplex.max_streams = maxStreams;
    if (node.mux_padding) multiplex.padding = true;
    if (node.mux_brutal_enabled) {
        const upMbps = parseOptionalInteger(node.mux_brutal_up_mbps);
        const downMbps = parseOptionalInteger(node.mux_brutal_down_mbps);
        if (upMbps !== undefined && upMbps > 0 && downMbps !== undefined && downMbps > 0) {
            multiplex.brutal = { enabled: true, up_mbps: upMbps, down_mbps: downMbps };
        }
    }
    return multiplex;
};

export const applySharedQuicOutboundFields = (target, source) => {
    const initialPacketSize = parseOptionalInteger(source.quic_initial_packet_size);
    if (initialPacketSize !== undefined && initialPacketSize > 0) target.initial_packet_size = initialPacketSize;
    if (source.quic_disable_path_mtu_discovery) target.disable_path_mtu_discovery = true;
    if (source.quic_idle_timeout) target.idle_timeout = source.quic_idle_timeout;
    if (source.quic_keep_alive_period) target.keep_alive_period = source.quic_keep_alive_period;
    const streamReceiveWindow = parseOptionalInteger(source.quic_stream_receive_window);
    if (streamReceiveWindow !== undefined && streamReceiveWindow > 0) target.stream_receive_window = streamReceiveWindow;
    const connectionReceiveWindow = parseOptionalInteger(source.quic_connection_receive_window);
    if (connectionReceiveWindow !== undefined && connectionReceiveWindow > 0) target.connection_receive_window = connectionReceiveWindow;
    const maxConcurrentStreams = parseOptionalInteger(source.quic_max_concurrent_streams);
    if (maxConcurrentStreams !== undefined && maxConcurrentStreams > 0) target.max_concurrent_streams = maxConcurrentStreams;
};

export const applyTlsFields = (outbound, node, caps = resolveNodeCapabilities(node)) => {
    if (!caps.hasTlsContext) return;
    const isQuicTlsContext = caps.isQuicTlsContext;
    outbound.tls = { enabled: true };
    if (node.disable_sni) outbound.tls.disable_sni = true;
    if (node.insecure) outbound.tls.insecure = true;
    if (node.sni) outbound.tls.server_name = node.sni;
    if (node.alpn) {
        const alpn = node.alpn.split(',').map((item) => item.trim()).filter(Boolean);
        if (alpn.length) outbound.tls.alpn = alpn;
    }
    const tlsMinVersion = isQuicTlsContext && node.tls_min_version !== '1.3' ? '' : node.tls_min_version;
    const tlsMaxVersion = isQuicTlsContext && node.tls_max_version !== '1.3' ? '' : node.tls_max_version;
    if (tlsMinVersion) outbound.tls.min_version = tlsMinVersion;
    if (tlsMaxVersion) outbound.tls.max_version = tlsMaxVersion;
    if (!isQuicTlsContext && node.cipher_suites) {
        const cipherSuites = node.cipher_suites.split(',').map((item) => item.trim()).filter(Boolean);
        if (cipherSuites.length) outbound.tls.cipher_suites = cipherSuites;
    }
    if (!isQuicTlsContext && node.utls_fingerprint) outbound.tls.utls = { enabled: true, fingerprint: node.utls_fingerprint };
    if (node.ech_enabled) {
        const ech = { enabled: true };
        if (node.ech_config) {
            const echConfig = node.ech_config.split('\n').map((item) => item.trim()).filter(Boolean);
            if (echConfig.length) ech.config = echConfig;
        }
        outbound.tls.ech = ech;
    }
    if (!isQuicTlsContext && (node.tls_fragment || node.tls_record_fragment)) {
        if (node.tls_fragment) outbound.tls.fragment = true;
        if (node.tls_record_fragment) outbound.tls.record_fragment = true;
        if (node.tls_fragment_fallback_delay) outbound.tls.fragment_fallback_delay = node.tls_fragment_fallback_delay;
    }
    if (!isQuicTlsContext && node.reality && caps.supportsReality) {
        outbound.tls.reality = {
            enabled: true,
            public_key: node.reality_pubkey,
            short_id: node.reality_sid,
        };
        if (!outbound.tls.utls) outbound.tls.utls = { enabled: true, fingerprint: 'chrome' };
    }
};

export const applyTransportFields = (outbound, node, caps = resolveNodeCapabilities(node)) => {
    if (!caps.supportsTransport || !caps.transport) return;
    if (caps.transport === 'ws') {
        const headers = parseHeadersText(node.transport_headers_text) || {};
        if (node.ws_host) headers.Host = node.ws_host;
        outbound.transport = {
            type: 'ws',
            path: node.path || '/',
            headers: Object.keys(headers).length > 0 ? headers : undefined,
        };
        const maxEarlyData = parseOptionalInteger(node.transport_max_early_data);
        if (maxEarlyData !== undefined && maxEarlyData >= 0) outbound.transport.max_early_data = maxEarlyData;
        if (node.transport_early_data_header_name) outbound.transport.early_data_header_name = node.transport_early_data_header_name;
    } else if (caps.transport === 'grpc') {
        outbound.transport = { type: 'grpc', service_name: node.path || '' };
        if (node.transport_idle_timeout) outbound.transport.idle_timeout = node.transport_idle_timeout;
        if (node.transport_ping_timeout) outbound.transport.ping_timeout = node.transport_ping_timeout;
        if (node.transport_permit_without_stream) outbound.transport.permit_without_stream = true;
    } else if (caps.transport === 'http') {
        const host = parseList(node.ws_host);
        outbound.transport = {
            type: 'http',
            path: node.path || '/',
            host: host.length > 0 ? host : undefined,
        };
        if (node.transport_method) outbound.transport.method = node.transport_method;
        const headers = parseHeadersText(node.transport_headers_text);
        if (headers) outbound.transport.headers = headers;
        if (node.transport_idle_timeout) outbound.transport.idle_timeout = node.transport_idle_timeout;
        if (node.transport_ping_timeout) outbound.transport.ping_timeout = node.transport_ping_timeout;
    } else if (caps.transport === 'httpupgrade') {
        outbound.transport = {
            type: 'httpupgrade',
            path: node.path || '/',
            host: node.ws_host || undefined,
        };
        const headers = parseHeadersText(node.transport_headers_text);
        if (headers) outbound.transport.headers = headers;
    } else if (caps.transport === 'quic') {
        outbound.transport = { type: 'quic' };
    }
};

export const finalizeNodeOutbound = (outbound, node, ctx, {
    applyDial = true,
    applyTls = true,
    applyTransport = true,
    applyMux = true,
    applyNetwork = true,
    applyPacketEncoding = true,
} = {}) => {
    const caps = resolveNodeCapabilities(node);
    if (applyTls) applyTlsFields(outbound, node, caps);
    if (applyTransport) applyTransportFields(outbound, node, caps);
    if (applyNetwork && caps.networkField === 'network') {
        const network = sanitizeNodeNetworkValue(node, getNodeCurrentNetworkValue(node));
        if (network) outbound.network = network;
    }
    if (applyPacketEncoding && caps.supportsPacketEncoding) {
        if (node.packet_encoding === '') outbound.packet_encoding = '';
        else if (node.packet_encoding && !(node.type === 'vless' && node.packet_encoding === 'xudp')) outbound.packet_encoding = node.packet_encoding;
    }
    if (applyMux) {
        const multiplex = buildMultiplex(node);
        if (multiplex) outbound.multiplex = multiplex;
    }
    if (applyDial) applyNodeDialFields(outbound, node, ctx);
    return outbound;
};

export const parseRuntimeDialFields = (target, source = {}) => {
    target.detour = typeof source.detour === 'string' && source.detour !== 'direct' ? source.detour : '';
    target.bind_interface = typeof source.bind_interface === 'string' ? source.bind_interface : '';
    target.inet4_bind_address = typeof source.inet4_bind_address === 'string' ? source.inet4_bind_address : '';
    target.inet6_bind_address = typeof source.inet6_bind_address === 'string' ? source.inet6_bind_address : '';
    target.routing_mark = source.routing_mark === null || source.routing_mark === undefined ? '' : String(source.routing_mark);
    target.reuse_addr = !!source.reuse_addr;
    target.netns = typeof source.netns === 'string' ? source.netns : '';
    target.connect_timeout = typeof source.connect_timeout === 'string' ? source.connect_timeout : '';
    target.tcp_fast_open = !!source.tcp_fast_open;
    target.tcp_multi_path = !!source.tcp_multi_path;
    target.udp_fragment = !!source.udp_fragment;
    target.domain_resolver = typeof source.domain_resolver === 'string'
        ? source.domain_resolver
        : (source.domain_resolver && typeof source.domain_resolver.server === 'string' ? source.domain_resolver.server : '');
    target.network_strategy = typeof source.network_strategy === 'string' ? source.network_strategy : '';
    target.network_type = toCsv(source.network_type);
    target.fallback_network_type = toCsv(source.fallback_network_type);
    target.fallback_delay = typeof source.fallback_delay === 'string' ? source.fallback_delay : '';
    target.domain_strategy = typeof source.domain_strategy === 'string' ? source.domain_strategy : '';
};

export const parseRuntimeTls = (node, tls = {}) => {
    if (!tls || tls.enabled === false) return;
    node.tls = true;
    node.disable_sni = !!tls.disable_sni;
    node.insecure = !!tls.insecure;
    node.sni = typeof tls.server_name === 'string' ? tls.server_name : node.sni;
    node.alpn = Array.isArray(tls.alpn) ? tls.alpn.join(', ') : String(tls.alpn || '');
    node.tls_min_version = typeof tls.min_version === 'string' ? tls.min_version : '';
    node.tls_max_version = typeof tls.max_version === 'string' ? tls.max_version : '';
    node.cipher_suites = Array.isArray(tls.cipher_suites) ? tls.cipher_suites.join(', ') : String(tls.cipher_suites || '');
    if (tls.utls && tls.utls.enabled) node.utls_fingerprint = tls.utls.fingerprint || '';
    node.ech_enabled = !!(tls.ech && tls.ech.enabled);
    node.ech_config = tls.ech && Array.isArray(tls.ech.config) ? tls.ech.config.join('\n') : '';
    node.tls_fragment = !!tls.fragment;
    node.tls_record_fragment = !!tls.record_fragment;
    node.tls_fragment_fallback_delay = typeof tls.fragment_fallback_delay === 'string' ? tls.fragment_fallback_delay : '';
    if (tls.reality && tls.reality.enabled) {
        node.reality = true;
        node.reality_pubkey = tls.reality.public_key || '';
        node.reality_sid = tls.reality.short_id || '';
    }
};

export const parseRuntimeTransport = (node, transport = {}) => {
    if (!transport || typeof transport.type !== 'string') return;
    node.transport = transport.type;
    if (transport.type === 'ws') {
        node.path = transport.path || '/';
        const headers = { ...(transport.headers || {}) };
        if (headers.Host) {
            node.ws_host = headers.Host;
            delete headers.Host;
        }
        node.transport_headers_text = headersToText(headers);
        node.transport_max_early_data = transport.max_early_data === null || transport.max_early_data === undefined ? '' : String(transport.max_early_data);
        node.transport_early_data_header_name = transport.early_data_header_name || '';
    } else if (transport.type === 'grpc') {
        node.path = transport.service_name || '';
        node.transport_idle_timeout = transport.idle_timeout || '';
        node.transport_ping_timeout = transport.ping_timeout || '';
        node.transport_permit_without_stream = !!transport.permit_without_stream;
    } else if (transport.type === 'http') {
        node.path = transport.path || '/';
        node.ws_host = Array.isArray(transport.host) ? transport.host.join(', ') : String(transport.host || '');
        node.transport_method = transport.method || '';
        node.transport_headers_text = headersToText(transport.headers);
        node.transport_idle_timeout = transport.idle_timeout || '';
        node.transport_ping_timeout = transport.ping_timeout || '';
    } else if (transport.type === 'httpupgrade') {
        node.path = transport.path || '/';
        node.ws_host = transport.host || '';
        node.transport_headers_text = headersToText(transport.headers);
    }
};

export const parseRuntimeMultiplex = (node, multiplex = {}) => {
    if (!multiplex || !multiplex.enabled) return;
    node.mux_enabled = true;
    node.mux_protocol = multiplex.protocol || 'h2mux';
    node.mux_max_connections = multiplex.max_connections === null || multiplex.max_connections === undefined ? 4 : multiplex.max_connections;
    node.mux_min_streams = multiplex.min_streams === null || multiplex.min_streams === undefined ? 4 : multiplex.min_streams;
    node.mux_max_streams = multiplex.max_streams === null || multiplex.max_streams === undefined ? '' : String(multiplex.max_streams);
    node.mux_padding = !!multiplex.padding;
    if (multiplex.brutal && multiplex.brutal.enabled) {
        node.mux_brutal_enabled = true;
        node.mux_brutal_up_mbps = multiplex.brutal.up_mbps === null || multiplex.brutal.up_mbps === undefined ? '' : String(multiplex.brutal.up_mbps);
        node.mux_brutal_down_mbps = multiplex.brutal.down_mbps === null || multiplex.brutal.down_mbps === undefined ? '' : String(multiplex.brutal.down_mbps);
    }
};

export const finalizeRuntimeNode = (node, outbound = {}) => {
    parseRuntimeTls(node, outbound.tls);
    parseRuntimeTransport(node, outbound.transport);
    parseRuntimeMultiplex(node, outbound.multiplex);
    return sanitizeNodeByCapabilities(node);
};
