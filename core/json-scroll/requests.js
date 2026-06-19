import { getJsonScrollFieldKey, unwrapJsonScrollPayload } from './field-inference.js';
import { findLineIndex } from './line-search.js';
import { buildRouteRuleMatchers } from './route-matchers.js';

const buildFieldMatchers = (fieldKey) => {
    const builders = {
        level: () => ['"level":'],
        strategy: () => ['"strategy":'],
        final: () => ['"final":'],
        default_domain_resolver: () => ['"default_domain_resolver":'],
        tag: () => ['"tag":'],
        type: () => ['"type":'],
        listen: () => ['"listen":'],
        listen_port: () => ['"listen_port":'],
        server: () => ['"server":'],
        server_port: () => ['"server_port":'],
        path: () => ['"path":'],
        url: () => ['"url":'],
        format: () => ['"format":'],
        download_detour: () => ['"download_detour":', '"detour":'],
        update_interval: () => ['"update_interval":', '"interval":'],
        domain_resolver: () => ['"domain_resolver":'],
        client_subnet: () => ['"client_subnet":'],
        connect_timeout: () => ['"connect_timeout":'],
        username: () => ['"username":'],
        user: () => ['"user":'],
        password: () => ['"password":'],
        uuid: () => ['"uuid":'],
        flow: () => ['"flow":'],
        version: () => ['"version":'],
        override_address: () => ['"override_address":'],
        override_port: () => ['"override_port":'],
        tls: () => ['"tls": {'],
        certificate_path: () => ['"certificate_path":'],
        key_path: () => ['"key_path":'],
        server_name: () => ['"server_name":'],
        alpn: () => ['"alpn":'],
        public_key: () => ['"public_key":'],
        short_id: () => ['"short_id":'],
        transport: () => ['"transport": {'],
        host: () => ['"host":'],
        service_name: () => ['"service_name":'],
        network: () => ['"network":'],
        method: () => ['"method":'],
        plugin: () => ['"plugin":'],
        plugin_opts: () => ['"plugin_opts":'],
        udp_over_tcp: () => ['"udp_over_tcp":'],
        congestion_control: () => ['"congestion_control":'],
        udp_relay_mode: () => ['"udp_relay_mode":'],
        udp_over_stream: () => ['"udp_over_stream": true'],
        zero_rtt_handshake: () => ['"zero_rtt_handshake": true'],
        heartbeat: () => ['"heartbeat":'],
        security: () => ['"security":'],
        alter_id: () => ['"alter_id":'],
        global_padding: () => ['"global_padding": true'],
        authenticated_length: () => ['"authenticated_length": false'],
        up_mbps: () => ['"up_mbps":'],
        down_mbps: () => ['"down_mbps":'],
        up: () => ['"up":'],
        down: () => ['"down":'],
        obfs: () => ['"obfs":'],
        server_ports: () => ['"server_ports":'],
        hop_interval: () => ['"hop_interval":'],
        hop_interval_max: () => ['"hop_interval_max":'],
        bbr_profile: () => ['"bbr_profile":'],
        brutal_debug: () => ['"brutal_debug": true'],
        recv_window_conn: () => ['"recv_window_conn":'],
        recv_window: () => ['"recv_window":'],
        local_address: () => ['"local_address":'],
        pre_shared_key: () => ['"pre_shared_key":'],
        interface_name: () => ['"interface_name":'],
        address: () => ['"address": ['],
        mtu: () => ['"mtu":'],
        stack: () => ['"stack":'],
        loopback_address: () => ['"loopback_address":'],
        iproute2_table_index: () => ['"iproute2_table_index":'],
        iproute2_rule_index: () => ['"iproute2_rule_index":'],
        include_interface: () => ['"include_interface": ['],
        exclude_interface: () => ['"exclude_interface": ['],
        include_package: () => ['"include_package": ['],
        exclude_package: () => ['"exclude_package": ['],
        route_exclude_address: () => ['"route_exclude_address": ['],
        auto_detect_interface: () => ['"auto_detect_interface": true'],
        default_mark: () => ['"default_mark":'],
        auto_route: () => ['"auto_route": true'],
        strict_route: () => ['"strict_route": true'],
        auto_redirect: () => ['"auto_redirect": true'],
        bind_interface: () => ['"bind_interface":'],
        routing_mark: () => ['"routing_mark":'],
        reuse_addr: () => ['"reuse_addr": true'],
        netns: () => ['"netns":'],
        tcp_fast_open: () => ['"tcp_fast_open": true'],
        tcp_multi_path: () => ['"tcp_multi_path": true'],
        udp_fragment: () => ['"udp_fragment": true'],
        initial_packet_size: () => ['"initial_packet_size":'],
        disable_path_mtu_discovery: () => ['"disable_path_mtu_discovery": true'],
        default_network_strategy: () => ['"default_network_strategy":'],
        default_network_type: () => ['"default_network_type":'],
        default_fallback_network_type: () => ['"default_fallback_network_type":'],
        default_fallback_delay: () => ['"default_fallback_delay":'],
        find_process: () => ['"find_process": true'],
        action: () => ['"action":'],
        outbound: () => ['"outbound":'],
        rule_set: () => ['"rule_set":'],
        sniff: () => ['"sniff": true', '"action": "sniff"'],
        sniff_override_destination: () => ['"sniff_override_destination": true'],
        sniff_timeout: () => ['"sniff_timeout":', '"timeout":'],
        ip_is_private: () => ['"ip_is_private": true'],
        hijack_dns: () => ['"action": "hijack-dns"'],
        auth: () => ['"auth":'],
        auth_str: () => ['"auth_str":'],
        idle_session_check_interval: () => ['"idle_session_check_interval":'],
        idle_session_timeout: () => ['"idle_session_timeout":'],
        min_idle_session: () => ['"min_idle_session":'],
        insecure_concurrency: () => ['"insecure_concurrency":'],
        extra_headers: () => ['"extra_headers":'],
        quic: () => ['"quic": true'],
        quic_congestion_control: () => ['"quic_congestion_control":'],
        private_key_path: () => ['"private_key_path":'],
        private_key_passphrase: () => ['"private_key_passphrase":'],
        host_key: () => ['"host_key":'],
        host_key_algorithms: () => ['"host_key_algorithms":'],
        client_version: () => ['"client_version":'],
        torrc: () => ['"torrc":'],
    };
    return builders[fieldKey] ? builders[fieldKey]() : [];
};

export const buildJsonScrollRequest = (type, payload = null, lines = []) => {
    const target = unwrapJsonScrollPayload(payload);
    const fieldKey = getJsonScrollFieldKey(payload);
    const inboundsStart = Math.max(0, findLineIndex(lines, '"inbounds": ['));
    const outboundsStart = Math.max(0, findLineIndex(lines, '"outbounds": ['));
    const routeStart = Math.max(0, findLineIndex(lines, '"route": {'));
    const dnsServersStart = Math.max(0, findLineIndex(lines, '"servers": ['));
    const ruleSetsStart = Math.max(routeStart, findLineIndex(lines, '"rule_set": [', routeStart));
    const routeRulesStart = Math.max(routeStart, findLineIndex(lines, '"rules": [', routeStart));
    const baseRequest = {
        fieldMatchers: buildFieldMatchers(fieldKey),
        fieldSearchWindow: 180,
    };

    if (type === 'log-root') return { ...baseRequest, startIndex: 0, matchers: ['"log": {'] };
    if (type === 'dns-root') return { ...baseRequest, startIndex: 0, matchers: ['"dns": {'] };
    if (type === 'route-root') return { ...baseRequest, startIndex: 0, matchers: ['"route": {'] };
    if (type === 'inbounds-root') return { ...baseRequest, startIndex: 0, matchers: ['"inbounds": ['] };
    if (type === 'outbounds-root') return { ...baseRequest, startIndex: 0, matchers: ['"outbounds": ['] };

    if (type === 'dns-server') {
        return {
            ...baseRequest,
            startIndex: dnsServersStart,
            matchers: [
                target?.tag ? `"tag": ${JSON.stringify(target.tag)}` : '',
                target?.server ? `"server": ${JSON.stringify(target.server)}` : '',
            ],
            fallbackMatchers: ['"servers": [', '"dns": {'],
        };
    }

    if (type === 'inbound') {
        return {
            ...baseRequest,
            startIndex: inboundsStart,
            matchers: [
                target?.tag ? `"tag": ${JSON.stringify(target.tag)}` : '',
                target?.listen ? `"listen": ${JSON.stringify(target.listen)}` : '',
            ],
            fallbackMatchers: ['"inbounds": ['],
        };
    }

    if (type === 'group' || type === 'node') {
        return {
            ...baseRequest,
            startIndex: outboundsStart,
            matchers: [
                target?.tag ? `"tag": ${JSON.stringify(target.tag)}` : '',
                target?.server ? `"server": ${JSON.stringify(target.server)}` : '',
                target?.url ? `"url": ${JSON.stringify(target.url)}` : '',
            ],
            fallbackMatchers: ['"outbounds": ['],
        };
    }

    if (type === 'rule-set') {
        return {
            ...baseRequest,
            startIndex: ruleSetsStart,
            matchers: [
                target?.tag ? `"tag": ${JSON.stringify(target.tag)}` : '',
                target?.url ? `"url": ${JSON.stringify(target.url)}` : '',
            ],
            fallbackMatchers: ['"rule_set": [', '"route": {'],
        };
    }

    if (type === 'route-rule') {
        return {
            ...baseRequest,
            startIndex: routeRulesStart,
            matchers: buildRouteRuleMatchers(target),
            fallbackMatchers: ['"rules": [', '"route": {'],
        };
    }

    return null;
};
