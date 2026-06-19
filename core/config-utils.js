export const parseOptionalInteger = (value) => {
    if (value === null || value === undefined) return undefined;
    const source = String(value).trim();
    if (!source) return undefined;
    const base = source.toLowerCase().startsWith('0x') ? 16 : 10;
    const parsed = parseInt(source, base);
    return Number.isInteger(parsed) ? parsed : undefined;
};

export const parseList = (value) => {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    return String(value || '')
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean);
};

export const parseHeadersText = (value) => {
    const headers = {};
    String(value || '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line) => {
            const idx = line.indexOf(':');
            if (idx === -1) return;
            const key = line.slice(0, idx).trim();
            const headerValue = line.slice(idx + 1).trim();
            if (!key || !headerValue) return;
            headers[key] = headerValue;
        });
    return Object.keys(headers).length > 0 ? headers : undefined;
};

export const parseKeyValueText = (value) => {
    const mapping = {};
    String(value || '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line) => {
            const idx = line.indexOf('=');
            if (idx === -1) return;
            const key = line.slice(0, idx).trim();
            const mappedValue = line.slice(idx + 1).trim();
            if (!key || !mappedValue) return;
            mapping[key] = mappedValue;
        });
    return Object.keys(mapping).length > 0 ? mapping : undefined;
};

export const parsePortHoppingList = (value) => parseList(value).filter(Boolean);

export const buildUdpOverTcp = (enabled, version) => {
    if (!enabled) return undefined;
    const payload = { enabled: true };
    const parsedVersion = parseOptionalInteger(version);
    if (parsedVersion === 1 || parsedVersion === 2) payload.version = parsedVersion;
    return payload;
};

export const applySharedQuicFields = (target, source) => {
    if (!target || !source) return;
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

export const applyDialFields = (target, source, { validDnsTags = null } = {}) => {
    if (!target || !source) return;

    if (source.detour && source.detour !== 'direct') target.detour = source.detour;
    if (source.bind_interface) target.bind_interface = source.bind_interface;
    if (source.inet4_bind_address) target.inet4_bind_address = source.inet4_bind_address;
    if (source.inet6_bind_address) target.inet6_bind_address = source.inet6_bind_address;
    const routingMark = parseOptionalInteger(source.routing_mark);
    if (routingMark !== undefined) target.routing_mark = routingMark;
    if (source.reuse_addr) target.reuse_addr = true;
    if (source.netns) target.netns = source.netns;
    if (source.connect_timeout) target.connect_timeout = source.connect_timeout;
    if (source.tcp_fast_open) target.tcp_fast_open = true;
    if (source.tcp_multi_path) target.tcp_multi_path = true;
    if (source.udp_fragment) target.udp_fragment = true;
    if (source.domain_resolver && (!validDnsTags || validDnsTags.has(source.domain_resolver))) {
        target.domain_resolver = source.domain_resolver;
    }
    if (source.network_strategy) target.network_strategy = source.network_strategy;
    const networkType = parseList(source.network_type);
    if (networkType.length > 0) target.network_type = networkType;
    const fallbackNetworkType = parseList(source.fallback_network_type);
    if (fallbackNetworkType.length > 0) target.fallback_network_type = fallbackNetworkType;
    if (source.fallback_delay) target.fallback_delay = source.fallback_delay;
    if (source.domain_strategy) target.domain_strategy = source.domain_strategy;
};

export const applyRouteOptionsFields = (target, source) => {
    if (!target || !source) return;

    if (source.option_override_address) target.override_address = source.option_override_address;
    const overridePort = parseOptionalInteger(source.option_override_port);
    if (overridePort !== undefined && overridePort >= 0) target.override_port = overridePort;
    if (source.option_network_strategy) target.network_strategy = source.option_network_strategy;
    const networkType = parseList(source.option_network_type);
    if (networkType.length > 0) target.network_type = networkType;
    const fallbackNetworkType = parseList(source.option_fallback_network_type);
    if (fallbackNetworkType.length > 0) target.fallback_network_type = fallbackNetworkType;
    if (source.option_fallback_delay) target.fallback_delay = source.option_fallback_delay;
    if (source.option_udp_disable_domain_unmapping) target.udp_disable_domain_unmapping = true;
    if (source.option_udp_connect) target.udp_connect = true;
    if (source.option_udp_timeout) target.udp_timeout = source.option_udp_timeout;
    if (source.option_tls_fragment) target.tls_fragment = true;
    if (source.option_tls_fragment_fallback_delay) target.tls_fragment_fallback_delay = source.option_tls_fragment_fallback_delay;
    if (source.option_tls_record_fragment) target.tls_record_fragment = true;
};
