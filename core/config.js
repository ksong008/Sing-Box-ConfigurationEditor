import {
    getNodeCurrentNetworkValue,
    resolveNodeCapabilities,
} from './node-capabilities.js';
import {
    applyDialFields,
    applyRouteOptionsFields,
    applySharedQuicFields,
    buildUdpOverTcp,
    parseHeadersText,
    parseKeyValueText,
    parseList,
    parseOptionalInteger,
    parsePortHoppingList,
} from './config-utils.js';
import { setupJsonPreviewScroll } from './json-scroll.js';
import { createFullStateGetter } from './state-snapshot.js';

const { computed, onUnmounted } = window.Vue;

export function setupConfigCore(ctx) {
    const sanitizeNodeNetworkValue = (node = {}, rawValue = '') => {
        const value = String(rawValue || '').trim();
        if (!value) return '';
        const allowedValues = resolveNodeCapabilities(node).networkOptions
            .map((item) => item.value)
            .filter(Boolean);
        return allowedValues.includes(value) ? value : '';
    };

    const buildMultiplex = (node) => {
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

    const generatedJson = computed(() => {
        const allTags = [...ctx.groups.value.map((group) => group.tag), ...ctx.nodes.value.map((node) => node.tag)];
        const tagCount = {};
        allTags.forEach((tag) => {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
        const dupTags = Object.keys(tagCount).filter((tag) => tagCount[tag] > 1);
        if (dupTags.length > 0) {
            console.warn('[sing-box] 出站 tag 重名，sing-box 将拒绝启动:', dupTags);
        }

        const outbounds = [];
        const validOutboundTags = new Set([...ctx.groups.value.map((group) => group.tag), ...ctx.nodes.value.map((node) => node.tag), 'direct']);

        ctx.groups.value.forEach((group) => {
            const outbound = { type: group.type, tag: group.tag };
            const validMembers = group.members.filter((member) => validOutboundTags.has(member));
            if (validMembers.length === 0) validMembers.push('direct');
            outbound.outbounds = [...validMembers];
            if (group.type === 'urltest') {
                outbound.url = group.url || 'https://www.gstatic.com/generate_204';
                outbound.interval = group.interval || '3m';
                if (group.tolerance) outbound.tolerance = group.tolerance;
            }
            outbounds.push(outbound);
        });

        ctx.nodes.value.forEach((node) => {
            const outbound = { type: node.type, tag: node.tag };
            const applyNodeDialFields = () => applyDialFields(outbound, node, { validDnsTags: new Set(ctx.dnsList.value.map((dns) => dns.tag)) });
            const caps = resolveNodeCapabilities(node);

            if (node.type === 'wireguard') {
                outbound.private_key = node.wg_private_key;
                outbound.peers = [{ public_key: node.wg_peer_pubkey, server: node.server, server_port: node.port }];
                if (node.wg_psk) outbound.peers[0].pre_shared_key = node.wg_psk;
                outbound.local_address = [node.wg_local_address].filter(Boolean);
                if (node.wg_mtu) outbound.mtu = node.wg_mtu;
                if (node.wg_reserved) {
                    const reserved = node.wg_reserved.split(',').map(Number).filter((value) => !Number.isNaN(value));
                    if (reserved.length) outbound.reserved = reserved;
                }
                if (node.wg_system_interface) outbound.system_interface = true;
                if (node.wg_interface_name) outbound.interface_name = node.wg_interface_name;
                const wgWorkers = parseOptionalInteger(node.wg_workers);
                if (wgWorkers !== undefined && wgWorkers > 0) outbound.workers = wgWorkers;
                const wgNetwork = sanitizeNodeNetworkValue(node, node.wg_network);
                if (wgNetwork) outbound.network = wgNetwork;
                applyNodeDialFields();
                outbounds.push(outbound);
                return;
            }

            if (node.type === 'ssh') {
                outbound.server = node.server;
                outbound.server_port = node.port;
                outbound.user = node.username;
                if (node.ssh_auth_type === 'key') outbound.private_key = node.secret;
                else outbound.password = node.secret;
                if (node.ssh_private_key_path) outbound.private_key_path = node.ssh_private_key_path;
                if (node.ssh_private_key_passphrase) outbound.private_key_passphrase = node.ssh_private_key_passphrase;
                const hostKey = parseList(node.ssh_host_key_text);
                if (hostKey.length > 0) outbound.host_key = hostKey;
                const hostKeyAlgorithms = parseList(node.ssh_host_key_algorithms);
                if (hostKeyAlgorithms.length > 0) outbound.host_key_algorithms = hostKeyAlgorithms;
                if (node.ssh_client_version) outbound.client_version = node.ssh_client_version;
                applyNodeDialFields();
                outbounds.push(outbound);
                return;
            }

            if (node.type === 'shadowtls') {
                outbound.server = node.server;
                outbound.server_port = node.port;
                outbound.password = node.shadowtls_password;
                outbound.version = parseInt(node.shadowtls_version, 10) || 3;
                applyNodeDialFields();
                outbounds.push(outbound);
                return;
            }

            if (node.type === 'tor') {
                if (node.tor_executable_path) outbound.executable_path = node.tor_executable_path;
                if (node.tor_data_directory) outbound.data_directory = node.tor_data_directory;
                if (node.tor_extra_args) {
                    const args = node.tor_extra_args.trim().split(/\s+/).filter(Boolean);
                    if (args.length) outbound.extra_args = args;
                }
                const torrc = parseKeyValueText(node.tor_torrc_text);
                if (torrc) outbound.torrc = torrc;
                applyNodeDialFields();
                outbounds.push(outbound);
                return;
            }

            if (node.type === 'dns') {
                outbounds.push(outbound);
                return;
            }

            if (node.type === 'socks') {
                outbound.server = node.server;
                outbound.server_port = node.port;
                outbound.version = node.socks_version || '5';
                if (node.username) outbound.username = node.username;
                if (node.secret) outbound.password = node.secret;
                const socksNetwork = sanitizeNodeNetworkValue(node, node.socks_network);
                if (socksNetwork) outbound.network = socksNetwork;
                const udpOverTcp = buildUdpOverTcp(node.socks_udp_over_tcp, node.socks_udp_over_tcp_version);
                if (udpOverTcp) outbound.udp_over_tcp = udpOverTcp;
                applyNodeDialFields();
                outbounds.push(outbound);
                return;
            }

            if (node.type === 'http') {
                outbound.server = node.server;
                outbound.server_port = node.port;
                if (node.username) outbound.username = node.username;
                if (node.secret) outbound.password = node.secret;
                if (node.http_path) outbound.path = node.http_path;
                const headers = parseHeadersText(node.http_headers_text);
                if (headers) outbound.headers = headers;
                if (node.tls) outbound.tls = { enabled: true };
            }
            else {
                outbound.server = node.server;
                outbound.server_port = node.port;

                if (node.type === 'vless') outbound.uuid = node.secret;
                else if (node.type === 'vmess') {
                    outbound.uuid = node.secret;
                    outbound.security = node.vmess_security || 'auto';
                    outbound.alter_id = node.vmess_alter_id || 0;
                    if (node.vmess_global_padding) outbound.global_padding = true;
                    if (node.vmess_authenticated_length === false) outbound.authenticated_length = false;
                } else if (node.type === 'trojan') outbound.password = node.secret;
                else if (node.type === 'shadowsocks') {
                    outbound.method = node.ss_method || 'chacha20-ietf-poly1305';
                    outbound.password = node.secret;
                    const ssNetwork = sanitizeNodeNetworkValue(node, node.network);
                    if (ssNetwork) outbound.network = ssNetwork;
                    if (node.ss_plugin) {
                        outbound.plugin = node.ss_plugin;
                        if (node.ss_plugin_opts) outbound.plugin_opts = node.ss_plugin_opts;
                    }
                    const udpOverTcp = buildUdpOverTcp(node.ss_udp_over_tcp, node.ss_udp_over_tcp_version);
                    if (udpOverTcp) outbound.udp_over_tcp = udpOverTcp;
                } else if (node.type === 'hysteria2') {
                    outbound.password = node.secret;
                    if (node.hy2_up || node.hy2_down) {
                        outbound.up_mbps = node.hy2_up;
                        outbound.down_mbps = node.hy2_down;
                    }
                    if (node.hy2_obfs_type) {
                        outbound.obfs = { type: node.hy2_obfs_type, password: node.hy2_obfs_password };
                    }
                    const serverPorts = parsePortHoppingList(node.hy2_server_ports);
                    if (serverPorts.length > 0) {
                        outbound.server_ports = serverPorts;
                        delete outbound.server_port;
                    }
                    if (node.hy2_hop_interval) outbound.hop_interval = node.hy2_hop_interval;
                    if (node.hy2_hop_interval_max) outbound.hop_interval_max = node.hy2_hop_interval_max;
                    const hy2Network = sanitizeNodeNetworkValue(node, node.hy2_network);
                    if (hy2Network) outbound.network = hy2Network;
                    if (node.hy2_bbr_profile) outbound.bbr_profile = node.hy2_bbr_profile;
                    if (node.hy2_brutal_debug) outbound.brutal_debug = true;
                    applySharedQuicFields(outbound, node);
                } else if (node.type === 'hysteria') {
                    if (node.hy_up_text) outbound.up = node.hy_up_text;
                    else outbound.up_mbps = node.hy_up_mbps || 100;
                    if (node.hy_down_text) outbound.down = node.hy_down_text;
                    else outbound.down_mbps = node.hy_down_mbps || 100;
                    if (node.secret) {
                        if (node.hy_auth_type === 'base64') outbound.auth = node.secret;
                        else outbound.auth_str = node.secret;
                    }
                    if (node.hy_obfs) outbound.obfs = node.hy_obfs;
                    const serverPorts = parsePortHoppingList(node.hy_server_ports);
                    if (serverPorts.length > 0) {
                        outbound.server_ports = serverPorts;
                        delete outbound.server_port;
                    }
                    if (node.hy_hop_interval) outbound.hop_interval = node.hy_hop_interval;
                    const recvWindowConn = parseOptionalInteger(node.hy_recv_window_conn);
                    if (recvWindowConn !== undefined && recvWindowConn > 0) outbound.recv_window_conn = recvWindowConn;
                    const recvWindow = parseOptionalInteger(node.hy_recv_window);
                    if (recvWindow !== undefined && recvWindow > 0) outbound.recv_window = recvWindow;
                    if (node.hy_disable_mtu_discovery) outbound.disable_mtu_discovery = true;
                    const hyNetwork = sanitizeNodeNetworkValue(node, node.hy_network);
                    if (hyNetwork) outbound.network = hyNetwork;
                    applySharedQuicFields(outbound, node);
                } else if (node.type === 'tuic') {
                    outbound.uuid = node.secret;
                    outbound.password = node.tuic_password;
                    outbound.congestion_control = node.tuic_congestion || 'cubic';
                    const tuicNetwork = sanitizeNodeNetworkValue(node, node.tuic_network);
                    if (tuicNetwork) outbound.network = tuicNetwork;
                    if (node.tuic_udp_over_stream) outbound.udp_over_stream = true;
                    else outbound.udp_relay_mode = node.tuic_udp_relay_mode || 'native';
                    if (node.tuic_zero_rtt_handshake) outbound.zero_rtt_handshake = true;
                    if (node.tuic_heartbeat) outbound.heartbeat = node.tuic_heartbeat;
                    applySharedQuicFields(outbound, node);
                } else if (node.type === 'anytls') {
                    outbound.password = node.secret;
                    if (node.anytls_idle_session_check_interval) {
                        outbound.idle_session_check_interval = node.anytls_idle_session_check_interval;
                    }
                    if (node.anytls_idle_session_timeout) outbound.idle_session_timeout = node.anytls_idle_session_timeout;
                    const minIdleSession = parseOptionalInteger(node.anytls_min_idle_session);
                    if (minIdleSession !== undefined && minIdleSession >= 0) outbound.min_idle_session = minIdleSession;
                } else if (node.type === 'naive') {
                    outbound.username = node.username;
                    outbound.password = node.secret;
                    outbound.tls = { enabled: true };
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
                    applyNodeDialFields();
                    outbounds.push(outbound);
                    return;
                }

                if (node.type === 'vless' && node.flow) outbound.flow = node.flow;
            }

            if (caps.hasTlsContext) {
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
            }

            if (caps.supportsTransport && caps.transport) {
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
            }

            if (caps.networkField === 'network') {
                const v2rayNetwork = sanitizeNodeNetworkValue(node, getNodeCurrentNetworkValue(node));
                if (v2rayNetwork) outbound.network = v2rayNetwork;
            }

            if (caps.supportsPacketEncoding) {
                if (node.packet_encoding === '') outbound.packet_encoding = '';
                else if (node.packet_encoding && !(node.type === 'vless' && node.packet_encoding === 'xudp')) outbound.packet_encoding = node.packet_encoding;
            }

            const multiplex = buildMultiplex(node);
            if (multiplex) outbound.multiplex = multiplex;

            applyNodeDialFields();
            outbounds.push(outbound);
        });

        outbounds.push({
            type: 'direct',
            tag: 'direct',
            ...(ctx.tun.value.enabled && ctx.tun.value.non_gateway_mode && ctx.tun.value.bind_interface ? { bind_interface: ctx.tun.value.bind_interface } : {}),
        });

        const dnsTagSet = new Set(ctx.dnsList.value.map((dns) => dns.tag));
        const dnsServers = ctx.dnsList.value
            .map((dns) => {
                if (dns.type === 'fakeip') return null;
                if (dns.type === 'local') return { type: 'local', tag: dns.tag };
                const server = { type: dns.type, tag: dns.tag };
                if (dns.server) server.server = dns.server;
                const serverPort = parseOptionalInteger(dns.server_port);
                if (serverPort !== undefined && serverPort > 0) server.server_port = serverPort;
                if (dns.path && ['https', 'h3'].includes(dns.type)) server.path = dns.path;
                const headers = parseHeadersText(dns.headers_text);
                if (headers && ['https', 'h3'].includes(dns.type)) server.headers = headers;
                if (dns.client_subnet) server.client_subnet = dns.client_subnet;
                if (dns.detour && dns.detour !== 'direct') server.detour = dns.detour;
                if (dns.domain_resolver && dnsTagSet.has(dns.domain_resolver)) server.domain_resolver = dns.domain_resolver;
                applyDialFields(server, dns, { validDnsTags: dnsTagSet });
                return server;
            })
            .filter((server) => server && (server.type === 'local' || server.server));

        if (ctx.fakeip.value.enabled && !dnsServers.find((server) => server.type === 'fakeip')) {
            const fakeipServer = { type: 'fakeip', tag: ctx.fakeip.value.tag };
            if (ctx.fakeip.value.queryA && ctx.fakeip.value.inet4_range) fakeipServer.inet4_range = ctx.fakeip.value.inet4_range;
            if (ctx.fakeip.value.queryAAAA && ctx.fakeip.value.inet6_range) fakeipServer.inet6_range = ctx.fakeip.value.inet6_range;
            dnsServers.push(fakeipServer);
        }

        const dnsRules = [];
        const localTag = dnsServers.find((server) => server.tag === 'local-dns')
            ? 'local-dns'
            : dnsServers.find((server) => server.type === 'udp' || server.type === 'tcp' || server.type === 'local')?.tag;
        if (ctx.fakeip.value.enabled) {
            if (localTag) dnsRules.push({ rule_set: ['geosite-cn'], server: localTag });
            const exclude = ctx.fakeip.value.excludeText
                .split('\n')
                .map((item) => item.replace(/^[-*\s]+/, '').replace(/['"]/g, '').replace(/^\+\./, '').trim())
                .filter((item) => item);
            if (exclude.length > 0 && localTag) dnsRules.push({ domain_suffix: exclude, server: localTag });
            const queryType = [];
            if (ctx.fakeip.value.queryA) queryType.push('A');
            if (ctx.fakeip.value.queryAAAA) queryType.push('AAAA');
            if (queryType.length > 0) dnsRules.push({ query_type: queryType, server: ctx.fakeip.value.tag });
        } else if (localTag) {
            dnsRules.push({ rule_set: ['geosite-cn'], server: localTag });
        }

        const routeArr = [];
        const tproxyDnsMode = ctx.tproxy.value.dns_hijack_mode || 'tproxy';
        const useDnsNatInTproxy = ctx.tproxy.value.enabled && ctx.settings.value.hijack_dns && tproxyDnsMode === 'nat';
        const useDnsDirectInTproxy = ctx.tproxy.value.enabled && ctx.settings.value.hijack_dns && tproxyDnsMode !== 'nat';

        const rsArr = ctx.ruleSets.value
            .filter((ruleSet) => ruleSet.tag && ruleSet.url)
            .map((ruleSet) => ({
                tag: ruleSet.tag,
                type: 'remote',
                format: ruleSet.format || 'binary',
                url: ruleSet.url,
                download_detour: ruleSet.detour || 'direct',
                update_interval: ruleSet.update_interval || '1d',
            }));

        if (ctx.settings.value.sniff_enabled) {
            const sniffRule = { action: 'sniff' };
            if (ctx.settings.value.sniff_timeout) sniffRule.timeout = ctx.settings.value.sniff_timeout;
            routeArr.push(sniffRule);
        }

        if (ctx.settings.value.hijack_dns) {
            if (ctx.tproxy.value.enabled) {
                if (useDnsNatInTproxy) {
                    routeArr.push({ inbound: ['dns-in'], action: 'hijack-dns' });
                } else if (useDnsDirectInTproxy) {
                    routeArr.push({
                        inbound: ['tproxy-in'],
                        network: ['tcp', 'udp'],
                        port: [53],
                        action: 'hijack-dns',
                    });
                }
            } else if (ctx.tun.value.enabled) {
                routeArr.push({ inbound: ['tun-in'], protocol: 'dns', action: 'hijack-dns' });
            } else {
                routeArr.push({ protocol: 'dns', action: 'hijack-dns' });
            }
        }

        if (ctx.settings.value.private_direct) routeArr.push({ ip_is_private: true, outbound: 'direct' });

        if (ctx.clashApi.value.enabled) {
            const globalOutbound = ctx.settings.value.final_outbound || 'direct';
            routeArr.push(
                { clash_mode: 'global', outbound: globalOutbound },
                { clash_mode: 'direct', outbound: 'direct' },
            );
        }

        ctx.routeRules.value
            .filter((rule) => rule.enabled)
            .forEach((rule) => {
                const migratedRule = ctx.migrateRule(rule);
                const validConds = migratedRule.conditions
                    .map((cond) => {
                        if (!cond.value) return null;
                        const tags = cond.value.split(',').map((item) => item.trim()).filter(Boolean);
                        if (!tags.length) return null;

                        const obj = {};
                        const matchType = cond.type;
                        if (matchType === 'rule_set') obj.rule_set = tags;
                        else if (matchType === 'domain') obj.domain = tags;
                        else if (matchType === 'domain_suffix') obj.domain_suffix = tags;
                        else if (matchType === 'domain_keyword') obj.domain_keyword = tags;
                        else if (matchType === 'domain_regex') obj.domain_regex = tags;
                        else if (matchType === 'auth_user') obj.auth_user = tags;
                        else if (matchType === 'client') obj.client = tags;
                        else if (matchType === 'ip_version') {
                            const ipVersion = parseInt(tags[0], 10);
                            if (!Number.isNaN(ipVersion)) obj.ip_version = ipVersion;
                        }
                        else if (matchType === 'ip_cidr') obj.ip_cidr = tags;
                        else if (matchType === 'source_ip_cidr') obj.source_ip_cidr = tags;
                        else if (matchType === 'source_geoip') obj.source_geoip = tags;
                        else if (matchType === 'port') obj.port = tags.map(Number).filter((value) => !Number.isNaN(value));
                        else if (matchType === 'source_port') obj.source_port = tags.map(Number).filter((value) => !Number.isNaN(value));
                        else if (matchType === 'port_range') obj.port_range = tags;
                        else if (matchType === 'source_port_range') obj.source_port_range = tags;
                        else if (matchType === 'protocol') obj.protocol = tags;
                        else if (matchType === 'network') obj.network = tags;
                        else if (matchType === 'network_type') obj.network_type = tags;
                        else if (matchType === 'process_name') obj.process_name = tags;
                        else if (matchType === 'process_path') obj.process_path = tags;
                        else if (matchType === 'package_name') obj.package_name = tags;
                        else if (matchType === 'user') obj.user = tags;
                        else if (matchType === 'user_id') obj.user_id = tags.map(Number).filter((value) => !Number.isNaN(value));
                        else if (matchType === 'geoip') obj.geoip = tags;
                        else if (matchType === 'inbound') obj.inbound = tags;
                        return obj;
                    })
                    .filter(Boolean);

                if (validConds.length === 0) return;

                const ruleObj = {};
                let hasCollision = false;
                const testKeys = new Set();
                for (const cond of validConds) {
                    const key = Object.keys(cond)[0];
                    if (testKeys.has(key)) hasCollision = true;
                    testKeys.add(key);
                }

                if (migratedRule.mode === 'or' || (migratedRule.mode === 'and' && hasCollision)) {
                    if (validConds.length > 1) {
                        ruleObj.type = 'logical';
                        ruleObj.mode = migratedRule.mode;
                        ruleObj.rules = validConds;
                    } else {
                        Object.assign(ruleObj, validConds[0]);
                    }
                } else {
                    validConds.forEach((cond) => Object.assign(ruleObj, cond));
                }

                if (migratedRule.invert) {
                    ruleObj.invert = true;
                }

                const action = typeof migratedRule.action === 'string' && migratedRule.action ? migratedRule.action : (migratedRule.outbound === '__reject__' ? 'reject' : 'route');
                if (action === 'reject') {
                    ruleObj.action = 'reject';
                    if (migratedRule.reject_method && migratedRule.reject_method !== 'default') ruleObj.method = migratedRule.reject_method;
                    if (migratedRule.reject_no_drop) ruleObj.no_drop = true;
                } else if (action === 'hijack-dns') {
                    ruleObj.action = 'hijack-dns';
                } else if (action === 'sniff') {
                    ruleObj.action = 'sniff';
                    const sniffers = parseList(migratedRule.sniff_sniffer || migratedRule.sniffer);
                    if (sniffers.length > 0) ruleObj.sniffer = sniffers;
                    if (migratedRule.sniff_timeout) ruleObj.timeout = migratedRule.sniff_timeout;
                } else if (action === 'resolve') {
                    ruleObj.action = 'resolve';
                    if (migratedRule.resolve_server && dnsTagSet.has(migratedRule.resolve_server)) ruleObj.server = migratedRule.resolve_server;
                    if (migratedRule.resolve_strategy) ruleObj.strategy = migratedRule.resolve_strategy;
                    if (migratedRule.resolve_disable_cache) ruleObj.disable_cache = true;
                    const rewriteTtl = parseOptionalInteger(migratedRule.resolve_rewrite_ttl);
                    if (rewriteTtl !== undefined) ruleObj.rewrite_ttl = rewriteTtl;
                    if (migratedRule.resolve_client_subnet) ruleObj.client_subnet = migratedRule.resolve_client_subnet;
                } else {
                    ruleObj.action = 'route';
                    ruleObj.outbound = migratedRule.outbound || 'direct';
                    applyRouteOptionsFields(ruleObj, migratedRule);
                }

                routeArr.push(ruleObj);
            });

        const inbounds = [];
        const mixedIn = {
            type: 'mixed',
            tag: 'mixed-in',
            listen: '127.0.0.1',
            listen_port: ctx.settings.value.listen_port,
        };
        if (ctx.tproxy.value.enabled) {
            const tproxyInbound = {
                type: 'tproxy',
                tag: 'tproxy-in',
                listen: '::',
                listen_port: ctx.tproxy.value.listen_port,
            };
            if (ctx.tproxy.value.udp_fragment) tproxyInbound.udp_fragment = true;
            if (ctx.settings.value.sniff_enabled) {
                tproxyInbound.sniff = true;
                if (ctx.settings.value.sniff_override_destination) tproxyInbound.sniff_override_destination = true;
                if (ctx.settings.value.sniff_timeout) tproxyInbound.sniff_timeout = ctx.settings.value.sniff_timeout;
            }
            inbounds.push(tproxyInbound);
            if (useDnsNatInTproxy) {
                inbounds.push({
                    type: 'direct',
                    tag: 'dns-in',
                    listen: '127.0.0.1',
                    listen_port: ctx.tproxy.value.dns_port || 1053,
                    override_port: 53,
                });
            }
        }
        if (ctx.settings.value.sniff_enabled) {
            mixedIn.sniff = true;
            if (ctx.settings.value.sniff_override_destination) mixedIn.sniff_override_destination = true;
            if (ctx.settings.value.sniff_timeout) mixedIn.sniff_timeout = ctx.settings.value.sniff_timeout;
        }
        inbounds.push(mixedIn);

        if (ctx.tun.value.enabled) {
            const addresses = [ctx.tun.value.address_v4].filter(Boolean);
            if (ctx.tun.value.address_v6) addresses.push(ctx.tun.value.address_v6);
            const tunInbound = {
                type: 'tun',
                tag: 'tun-in',
                interface_name: ctx.tun.value.interface_name,
                address: addresses,
                mtu: ctx.tun.value.mtu,
                stack: ctx.tun.value.stack,
                auto_route: ctx.tun.value.auto_route,
                strict_route: ctx.tun.value.strict_route,
                endpoint_independent_nat: ctx.tun.value.endpoint_independent_nat,
            };
            if (ctx.tun.value.loopback_address) tunInbound.loopback_address = ctx.tun.value.loopback_address;
            if (ctx.tun.value.auto_redirect) tunInbound.auto_redirect = true;
            if (ctx.tun.value.auto_redirect && ctx.tun.value.auto_redirect_input_mark) tunInbound.auto_redirect_input_mark = ctx.tun.value.auto_redirect_input_mark;
            if (ctx.tun.value.auto_redirect && ctx.tun.value.auto_redirect_output_mark) tunInbound.auto_redirect_output_mark = ctx.tun.value.auto_redirect_output_mark;
            if (ctx.tun.value.udp_timeout) tunInbound.udp_timeout = ctx.tun.value.udp_timeout;
            const iproute2TableIndex = parseOptionalInteger(ctx.tun.value.iproute2_table_index);
            if (iproute2TableIndex !== undefined) tunInbound.iproute2_table_index = iproute2TableIndex;
            const iproute2RuleIndex = parseOptionalInteger(ctx.tun.value.iproute2_rule_index);
            if (iproute2RuleIndex !== undefined) tunInbound.iproute2_rule_index = iproute2RuleIndex;
            const includeInterface = parseList(ctx.tun.value.include_interface);
            if (includeInterface.length > 0) tunInbound.include_interface = includeInterface;
            const excludeInterface = parseList(ctx.tun.value.exclude_interface);
            if (excludeInterface.length > 0) tunInbound.exclude_interface = excludeInterface;
            const includePackage = parseList(ctx.tun.value.include_package);
            if (includePackage.length > 0) tunInbound.include_package = includePackage;
            const excludePackage = parseList(ctx.tun.value.exclude_package);
            if (excludePackage.length > 0) tunInbound.exclude_package = excludePackage;
            if (ctx.tun.value.non_gateway_mode && ctx.tun.value.route_exclude_address) {
                const excludeList = ctx.tun.value.route_exclude_address
                    .split('\n')
                    .map((line) => line.replace(/#.*$/, '').trim())
                    .filter((line) => line.length > 0);
                if (excludeList.length > 0) tunInbound.route_exclude_address = excludeList;
            }
            if (ctx.settings.value.sniff_enabled) {
                tunInbound.sniff = true;
                if (ctx.settings.value.sniff_override_destination) tunInbound.sniff_override_destination = true;
                if (ctx.settings.value.sniff_timeout) tunInbound.sniff_timeout = ctx.settings.value.sniff_timeout;
            }
            inbounds.push(tunInbound);
        }

        inbounds.push(...ctx.buildExtraInbounds());

        const route = {
            rules: routeArr,
            final: ctx.settings.value.final_outbound,
            auto_detect_interface: ctx.settings.value.auto_detect_interface,
        };
        const validDnsTags = new Set(dnsServers.map((server) => server.tag));
        if (ctx.settings.value.default_domain_resolver && validDnsTags.has(ctx.settings.value.default_domain_resolver)) {
            route.default_domain_resolver = ctx.settings.value.default_domain_resolver;
        }
        if (ctx.settings.value.default_interface) route.default_interface = ctx.settings.value.default_interface;
        if (ctx.settings.value.default_mark) route.default_mark = ctx.settings.value.default_mark;
        if (ctx.settings.value.find_process) route.find_process = true;
        if (ctx.settings.value.default_network_strategy) route.default_network_strategy = ctx.settings.value.default_network_strategy;
        const defaultNetworkType = parseList(ctx.settings.value.default_network_type);
        if (defaultNetworkType.length > 0) route.default_network_type = defaultNetworkType;
        const defaultFallbackNetworkType = parseList(ctx.settings.value.default_fallback_network_type);
        if (defaultFallbackNetworkType.length > 0) route.default_fallback_network_type = defaultFallbackNetworkType;
        if (ctx.settings.value.default_fallback_delay) route.default_fallback_delay = ctx.settings.value.default_fallback_delay;
        if (rsArr.length > 0) route.rule_set = rsArr;

        let experimental = undefined;
        const cache_file = {};
        let hasCache = false;

        if (ctx.settings.value.cache_file_path) {
            cache_file.path = ctx.settings.value.cache_file_path;
            hasCache = true;
        }
        if (ctx.clashApi.value.store_fakeip) {
            cache_file.store_fakeip = true;
            hasCache = true;
        }
        if (ctx.settings.value.store_rdrc) {
            cache_file.store_rdrc = true;
            hasCache = true;
        }

        if (hasCache) cache_file.enabled = true;

        if (ctx.clashApi.value.enabled) {
            const clashApi = {
                external_controller: ctx.clashApi.value.external_controller,
                default_mode: ctx.clashApi.value.default_mode || 'rule',
            };
            if (ctx.clashApi.value.secret) clashApi.secret = ctx.clashApi.value.secret;
            if (ctx.clashApi.value.external_ui) clashApi.external_ui = ctx.clashApi.value.external_ui;
            if (ctx.clashApi.value.download_url) clashApi.external_ui_download_url = ctx.clashApi.value.download_url;
            if (ctx.clashApi.value.allow_lan) clashApi.access_control_allow_private_network = true;

            experimental = { clash_api: clashApi };
            if (hasCache) experimental.cache_file = cache_file;
        } else if (hasCache) {
            experimental = { cache_file };
        }

        let ntpConfig;
        if (ctx.ntp.value.enabled) {
            ntpConfig = {
                enabled: true,
                server: ctx.ntp.value.server,
                server_port: ctx.ntp.value.server_port,
                interval: ctx.ntp.value.interval,
                detour: ctx.ntp.value.detour,
            };
            applyDialFields(ntpConfig, ctx.ntp.value, { validDnsTags: dnsTagSet });
        }

        const config = {
            log: { level: ctx.settings.value.log_level, timestamp: true },
            ntp: ntpConfig,
            dns: {
                servers: dnsServers,
                rules: dnsRules.length > 0 ? dnsRules : undefined,
                strategy: ctx.settings.value.dns_strategy,
                final: ctx.settings.value.dns_final || undefined,
                disable_cache: ctx.settings.value.dns_disable_cache || undefined,
                disable_expire: ctx.settings.value.dns_disable_expire || undefined,
                cache_capacity: ctx.settings.value.dns_cache_capacity || undefined,
                client_subnet: ctx.settings.value.dns_client_subnet || undefined,
                independent_cache: ctx.settings.value.independent_cache || undefined,
                reverse_mapping: ctx.settings.value.reverse_mapping || undefined,
            },
            inbounds,
            outbounds,
            route,
            experimental,
        };

        return JSON.stringify(config, (key, value) => {
            if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) return undefined;
            return value;
        }, 2);
    });

    const jsonScroll = setupJsonPreviewScroll(ctx, generatedJson);
    const getFullState = createFullStateGetter(ctx);

    onUnmounted(() => {
        jsonScroll.cleanupJsonScroll();
    });

    Object.assign(ctx, {
        scrollJsonTo: jsonScroll.scrollJsonTo,
        scrollJsonToRequest: jsonScroll.scrollJsonToRequest,
        queueJsonScrollTo: jsonScroll.queueJsonScrollTo,
        queueJsonScrollToTarget: jsonScroll.queueJsonScrollToTarget,
        generatedJson,
        getFullState,
    });
}
