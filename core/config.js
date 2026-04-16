const { computed, watch, nextTick, onUnmounted } = window.Vue;

export function setupConfigCore(ctx) {
    const scrollJsonTo = async (keyword, { offset = 0, fallbackToEnd = false } = {}) => {
        await nextTick();
        const el = ctx.jsonContainer.value;
        if (!el || !ctx.generatedJson) return;
        const text = ctx.generatedJson.value;
        const lines = text.split('\n');
        let targetLine = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(keyword)) {
                targetLine = i;
                break;
            }
        }
        if (targetLine === -1) {
            if (fallbackToEnd) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
            return;
        }
        targetLine = Math.max(0, targetLine + offset);
        const lineHeight = el.scrollHeight / Math.max(lines.length, 1);
        el.scrollTo({
            top: Math.max(0, targetLine * lineHeight - el.clientHeight * 0.25),
            behavior: 'smooth',
        });
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
                outbounds.push(outbound);
                return;
            }

            if (node.type === 'ssh') {
                outbound.server = node.server;
                outbound.server_port = node.port;
                outbound.user = node.username;
                if (node.ssh_auth_type === 'key') outbound.private_key = node.secret;
                else outbound.password = node.secret;
                outbounds.push(outbound);
                return;
            }

            if (node.type === 'shadowtls') {
                outbound.server = node.server;
                outbound.server_port = node.port;
                outbound.password = node.shadowtls_password;
                outbound.version = parseInt(node.shadowtls_version, 10) || 3;
                if (node.shadowtls_handshake_server) {
                    outbound.handshake = {
                        server: node.shadowtls_handshake_server,
                        server_port: node.shadowtls_handshake_port || 443,
                    };
                }
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
                outbounds.push(outbound);
                return;
            }

            if (node.type === 'http') {
                outbound.server = node.server;
                outbound.server_port = node.port;
                if (node.username) outbound.username = node.username;
                if (node.secret) outbound.password = node.secret;
                if (node.tls) outbound.tls = { enabled: true };
                outbounds.push(outbound);
                return;
            }

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
                if (node.ss_plugin) {
                    outbound.plugin = node.ss_plugin;
                    if (node.ss_plugin_opts) outbound.plugin_opts = node.ss_plugin_opts;
                }
            } else if (node.type === 'hysteria2') {
                outbound.password = node.secret;
                if (node.hy2_up || node.hy2_down) {
                    outbound.up_mbps = node.hy2_up;
                    outbound.down_mbps = node.hy2_down;
                }
                if (node.hy2_obfs_type) {
                    outbound.obfs = { type: node.hy2_obfs_type, password: node.hy2_obfs_password };
                }
            } else if (node.type === 'hysteria') {
                outbound.up_mbps = node.hy_up_mbps || 100;
                outbound.down_mbps = node.hy_down_mbps || 100;
                if (node.secret) {
                    if (node.hy_auth_type === 'base64') outbound.auth = node.secret;
                    else outbound.auth_str = node.secret;
                }
                if (node.hy_obfs) outbound.obfs = node.hy_obfs;
            } else if (node.type === 'tuic') {
                outbound.uuid = node.secret;
                outbound.password = node.tuic_password;
                outbound.congestion_control = node.tuic_congestion || 'cubic';
                outbound.udp_relay_mode = node.tuic_udp_relay_mode || 'native';
            } else if (node.type === 'anytls') {
                outbound.password = node.secret;
                if (node.anytls_idle_session_check_interval) {
                    outbound.idle_session_check_interval = node.anytls_idle_session_check_interval;
                }
            } else if (node.type === 'naive') {
                outbound.username = node.username;
                outbound.password = node.secret;
                outbound.tls = { enabled: true };
                if (node.insecure) outbound.tls.insecure = true;
                if (node.sni) outbound.tls.server_name = node.sni;
                if (node.alpn) {
                    const alpn = node.alpn.split(',').map((item) => item.trim()).filter(Boolean);
                    if (alpn.length) outbound.tls.alpn = alpn;
                }
                outbounds.push(outbound);
                return;
            }

            if (node.type === 'vless' && node.flow) outbound.flow = node.flow;

            const needTls = ['vless', 'vmess', 'trojan', 'hysteria2', 'hysteria', 'tuic', 'anytls'].includes(node.type)
                ? (node.tls !== false)
                : (['naive'].includes(node.type) ? true : node.tls);
            if (needTls) {
                outbound.tls = { enabled: true };
                if (node.disable_sni) outbound.tls.disable_sni = true;
                if (node.insecure) outbound.tls.insecure = true;
                if (node.sni) outbound.tls.server_name = node.sni;
                if (node.alpn) {
                    const alpn = node.alpn.split(',').map((item) => item.trim()).filter(Boolean);
                    if (alpn.length) outbound.tls.alpn = alpn;
                }
                if (node.tls_min_version) outbound.tls.min_version = node.tls_min_version;
                if (node.tls_max_version) outbound.tls.max_version = node.tls_max_version;
                if (node.cipher_suites) {
                    const cipherSuites = node.cipher_suites.split(',').map((item) => item.trim()).filter(Boolean);
                    if (cipherSuites.length) outbound.tls.cipher_suites = cipherSuites;
                }
                if (node.utls_fingerprint) outbound.tls.utls = { enabled: true, fingerprint: node.utls_fingerprint };
                if (node.ech_enabled) {
                    const ech = { enabled: true };
                    if (node.ech_config) {
                        const echConfig = node.ech_config.split('\n').map((item) => item.trim()).filter(Boolean);
                        if (echConfig.length) ech.config = echConfig;
                    }
                    outbound.tls.ech = ech;
                }
                if (node.tls_fragment || node.tls_record_fragment) {
                    if (node.tls_fragment) outbound.tls.fragment = true;
                    if (node.tls_record_fragment) outbound.tls.record_fragment = true;
                    if (node.tls_fragment_fallback_delay) outbound.tls.fragment_fallback_delay = node.tls_fragment_fallback_delay;
                }
                if (node.reality && ['vless', 'trojan'].includes(node.type)) {
                    outbound.tls.reality = {
                        enabled: true,
                        public_key: node.reality_pubkey,
                        short_id: node.reality_sid,
                    };
                    if (!outbound.tls.utls) outbound.tls.utls = { enabled: true, fingerprint: 'chrome' };
                }
            }

            if (node.transport && ['vless', 'vmess', 'trojan', 'shadowsocks'].includes(node.type)) {
                if (node.transport === 'ws') {
                    outbound.transport = {
                        type: 'ws',
                        path: node.path || '/',
                        headers: node.ws_host ? { Host: node.ws_host } : undefined,
                    };
                } else if (node.transport === 'grpc') {
                    outbound.transport = { type: 'grpc', service_name: node.path || '' };
                } else if (node.transport === 'http') {
                    outbound.transport = {
                        type: 'http',
                        path: node.path || '/',
                        host: node.ws_host ? [node.ws_host] : undefined,
                    };
                } else if (node.transport === 'httpupgrade') {
                    outbound.transport = {
                        type: 'httpupgrade',
                        path: node.path || '/',
                        host: node.ws_host || undefined,
                    };
                } else if (node.transport === 'quic') {
                    outbound.transport = { type: 'quic' };
                }
            }

            if (node.network && ['vless', 'vmess', 'trojan'].includes(node.type)) {
                outbound.network = node.network;
            }

            if (['vless', 'vmess'].includes(node.type)) {
                if (node.packet_encoding === '') outbound.packet_encoding = '';
                else if (node.packet_encoding && !(node.type === 'vless' && node.packet_encoding === 'xudp')) outbound.packet_encoding = node.packet_encoding;
            }

            if (node.mux_enabled && ['vless', 'vmess', 'trojan'].includes(node.type)) {
                outbound.multiplex = {
                    enabled: true,
                    protocol: node.mux_protocol || 'smux',
                    max_connections: node.mux_max_connections || 4,
                    min_streams: node.mux_min_streams || 4,
                };
            }

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
                if (dns.type === 'fakeip') {
                    const server = { type: 'fakeip', tag: dns.tag };
                    if (dns.inet4_range) server.inet4_range = dns.inet4_range;
                    if (dns.inet6_range) server.inet6_range = dns.inet6_range;
                    return server;
                }
                if (dns.type === 'local') return { type: 'local', tag: dns.tag };
                const server = { type: dns.type, tag: dns.tag };
                if (dns.server) server.server = dns.server;
                if (dns.detour && dns.detour !== 'direct') server.detour = dns.detour;
                if (dns.domain_resolver && dnsTagSet.has(dns.domain_resolver)) server.domain_resolver = dns.domain_resolver;
                return server;
            })
            .filter((server) => server.type === 'fakeip' || server.type === 'local' || server.server);

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
                        else if (matchType === 'ip_cidr') obj.ip_cidr = tags;
                        else if (matchType === 'source_ip_cidr') obj.source_ip_cidr = tags;
                        else if (matchType === 'port') obj.port = tags.map(Number).filter((value) => !Number.isNaN(value));
                        else if (matchType === 'port_range') obj.port_range = tags;
                        else if (matchType === 'protocol') obj.protocol = tags;
                        else if (matchType === 'network') obj.network = tags;
                        else if (matchType === 'process_name') obj.process_name = tags;
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

                if (migratedRule.outbound === '__reject__') ruleObj.action = 'reject';
                else ruleObj.outbound = migratedRule.outbound;

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
            if (ctx.tun.value.auto_redirect) tunInbound.auto_redirect = true;
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

        const config = {
            log: { level: ctx.settings.value.log_level, timestamp: true },
            ntp: ctx.ntp.value.enabled
                ? {
                    enabled: true,
                    server: ctx.ntp.value.server,
                    server_port: ctx.ntp.value.server_port,
                    interval: ctx.ntp.value.interval,
                    detour: ctx.ntp.value.detour,
                }
                : undefined,
            dns: {
                servers: dnsServers,
                rules: dnsRules.length > 0 ? dnsRules : undefined,
                strategy: ctx.settings.value.dns_strategy,
                final: ctx.settings.value.dns_final || undefined,
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

    let diffScrollTimer = null;

    watch(generatedJson, (newStr, oldStr) => {
        if (!oldStr || !ctx.jsonContainer.value) return;
        clearTimeout(diffScrollTimer);
        diffScrollTimer = setTimeout(async () => {
            await nextTick();
            const el = ctx.jsonContainer.value;
            if (!el) return;
            const newLines = newStr.split('\n');
            const oldLines = oldStr.split('\n');
            let diffLine = -1;
            for (let i = 0; i < newLines.length; i++) {
                if (newLines[i] !== oldLines[i]) {
                    diffLine = i;
                    break;
                }
            }
            if (diffLine === -1 && newLines.length < oldLines.length) diffLine = newLines.length - 1;
            if (diffLine !== -1) {
                const lineHeight = el.scrollHeight / Math.max(newLines.length, 1);
                const targetY = diffLine * lineHeight;
                const currentTop = el.scrollTop;
                const viewHeight = el.clientHeight;
                if (targetY < currentTop + 60 || targetY > currentTop + viewHeight - 60) {
                    el.scrollTo({
                        top: Math.max(0, targetY - viewHeight * 0.25),
                        behavior: 'smooth',
                    });
                }
            }
        }, 80);
    });

    watch(ctx.currentTab, (newTab) => {
        if (!ctx.jsonContainer.value) return;
        const tabMap = {
            dns: '"dns": {',
            nodes: '"outbounds": [',
            groups: '"outbounds": [',
            rules: '"route": {',
            advanced: '"inbounds": [',
        };
        const keyword = tabMap[newTab];
        if (keyword) {
            setTimeout(() => {
                const el = ctx.jsonContainer.value;
                const text = generatedJson.value;
                const idx = text.indexOf(keyword);
                if (idx !== -1) {
                    const lines = text.substring(0, idx).split('\n');
                    const lineHeight = el.scrollHeight / Math.max(text.split('\n').length, 1);
                    const targetY = lines.length * lineHeight + 24;
                    el.scrollTo({ top: Math.max(0, targetY - 60), behavior: 'smooth' });
                }
            }, 50);
        }
    });

    const getFullState = () => {
        const defaultNode = ctx.makeNode();

        const cleanNodes = ctx.nodes.value.map((node) => {
            const cleanNode = { ...node };

            if (cleanNode.type !== 'shadowsocks') {
                delete cleanNode.ss_method;
                delete cleanNode.ss_plugin;
                delete cleanNode.ss_plugin_opts;
            }
            if (cleanNode.type !== 'tuic') {
                delete cleanNode.tuic_password;
                delete cleanNode.tuic_congestion;
                delete cleanNode.tuic_udp_relay_mode;
            }
            if (cleanNode.type !== 'hysteria') {
                delete cleanNode.hy_up_mbps;
                delete cleanNode.hy_down_mbps;
                delete cleanNode.hy_obfs;
                delete cleanNode.hy_auth_type;
            }
            if (cleanNode.type !== 'hysteria2') {
                delete cleanNode.hy2_up;
                delete cleanNode.hy2_down;
                delete cleanNode.hy2_obfs_type;
                delete cleanNode.hy2_obfs_password;
            }
            if (cleanNode.type !== 'wireguard') {
                delete cleanNode.wg_private_key;
                delete cleanNode.wg_peer_pubkey;
                delete cleanNode.wg_local_address;
                delete cleanNode.wg_psk;
                delete cleanNode.wg_mtu;
                delete cleanNode.wg_reserved;
            }
            if (cleanNode.type !== 'socks') delete cleanNode.socks_version;
            if (cleanNode.type !== 'ssh') delete cleanNode.ssh_auth_type;
            if (cleanNode.type !== 'shadowtls') {
                delete cleanNode.shadowtls_version;
                delete cleanNode.shadowtls_password;
                delete cleanNode.shadowtls_handshake_server;
                delete cleanNode.shadowtls_handshake_port;
            }
            if (cleanNode.type !== 'anytls') delete cleanNode.anytls_idle_session_check_interval;
            if (cleanNode.type !== 'tor') {
                delete cleanNode.tor_executable_path;
                delete cleanNode.tor_extra_args;
                delete cleanNode.tor_data_directory;
            }
            if (!ctx.PROTO_SUPPORT_USER.includes(cleanNode.type)) delete cleanNode.username;
            if (!ctx.PROTO_SUPPORT_TRANSPORT.includes(cleanNode.type)) {
                delete cleanNode.transport;
                delete cleanNode.path;
                delete cleanNode.ws_host;
                delete cleanNode.mux_enabled;
                delete cleanNode.mux_protocol;
                delete cleanNode.mux_max_connections;
                delete cleanNode.mux_min_streams;
            }
            if (cleanNode.type !== 'vless') delete cleanNode.flow;

            if (!cleanNode.reality) {
                delete cleanNode.reality_pubkey;
                delete cleanNode.reality_sid;
            }
            if (!cleanNode.mux_enabled) {
                delete cleanNode.mux_protocol;
                delete cleanNode.mux_max_connections;
                delete cleanNode.mux_min_streams;
            }

            Object.keys(cleanNode).forEach((key) => {
                if (['tag', 'type', 'server', 'port', 'insecure'].includes(key)) return;
                if (cleanNode[key] === '' || cleanNode[key] === null) {
                    delete cleanNode[key];
                } else if (cleanNode[key] === false && defaultNode[key] === false) {
                    delete cleanNode[key];
                }
            });

            const usesTls = [...ctx.PROTO_SUPPORT_TLS, ...ctx.PROTO_ALWAYS_TLS].includes(cleanNode.type);
            if (!usesTls) {
                delete cleanNode.tls;
                delete cleanNode.insecure;
                delete cleanNode.reality;
                delete cleanNode.alpn;
                delete cleanNode.utls_fingerprint;
                delete cleanNode.sni;
            }

            return cleanNode;
        });

        return {
            _version: '1.12',
            _exported: new Date().toISOString(),
            settings: ctx.settings.value,
            fakeip: ctx.fakeip.value,
            tun: ctx.tun.value,
            clashApi: ctx.clashApi.value,
            ntp: ctx.ntp.value,
            tproxy: (({ server_ports, ...rest }) => rest)(ctx.tproxy.value),
            extraInbounds: ctx.extraInbounds.value.map(ctx.normalizeExtraInbound),
            corsProxyEnabled: ctx.corsProxyEnabled.value,
            dnsList: ctx.dnsList.value,
            providers: ctx.providers.value,
            nodes: cleanNodes,
            groups: ctx.groups.value.map((group) => {
                const cleanGroup = { ...group };
                delete cleanGroup.draggable;
                return cleanGroup;
            }),
            ruleSets: ctx.ruleSets.value,
            routeRules: ctx.routeRules.value.map((rule) => {
                const cleanRule = { ...rule };
                delete cleanRule.isEditing;
                delete cleanRule.draggable;
                return cleanRule;
            }),
        };
    };

    onUnmounted(() => {
        clearTimeout(diffScrollTimer);
    });

    Object.assign(ctx, {
        scrollJsonTo,
        generatedJson,
        getFullState,
    });
}
