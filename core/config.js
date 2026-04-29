import {
    getNodeCurrentNetworkValue,
    resolveNodeCapabilities,
    sanitizeNodeByCapabilities,
} from './node-capabilities.js';

const { computed, watch, nextTick, onUnmounted } = window.Vue;

export function setupConfigCore(ctx) {
    const parseOptionalInteger = (value) => {
        if (value === null || value === undefined) return undefined;
        const source = String(value).trim();
        if (!source) return undefined;
        const base = source.toLowerCase().startsWith('0x') ? 16 : 10;
        const parsed = parseInt(source, base);
        return Number.isInteger(parsed) ? parsed : undefined;
    };

    const parseList = (value) => {
        if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
        return String(value || '')
            .split(/[\n,]/)
            .map((item) => item.trim())
            .filter(Boolean);
    };

    const parseHeadersText = (value) => {
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

    const parseKeyValueText = (value) => {
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

    const parsePortHoppingList = (value) => parseList(value).filter(Boolean);

    const buildUdpOverTcp = (enabled, version) => {
        if (!enabled) return undefined;
        const payload = { enabled: true };
        const parsedVersion = parseOptionalInteger(version);
        if (parsedVersion === 1 || parsedVersion === 2) payload.version = parsedVersion;
        return payload;
    };

    const applySharedQuicFields = (target, source) => {
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

    const applyDialFields = (target, source, { validDnsTags = null } = {}) => {
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

    const applyRouteOptionsFields = (target, source) => {
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

    let jsonTargetScrollTimer = null;

    const findLineIndex = (lines, matcher, startIndex = 0) => {
        if (!matcher) return -1;
        for (let index = Math.max(0, startIndex); index < lines.length; index += 1) {
            const line = lines[index];
            if (typeof matcher === 'function') {
                if (matcher(line, index, lines)) return index;
                continue;
            }
            if (line.includes(matcher)) return index;
        }
        return -1;
    };

    const findFirstMatchingLineIndex = (lines, matchers = [], startIndex = 0) => {
        for (const matcher of matchers) {
            const lineIndex = findLineIndex(lines, matcher, startIndex);
            if (lineIndex !== -1) return lineIndex;
        }
        return -1;
    };

    const scrollJsonToLineIndex = async (lineIndex, { offset = 0, align = 0.5 } = {}) => {
        await nextTick();
        const el = ctx.jsonContainer.value;
        const text = ctx.generatedJson?.value;
        if (!el || !text) return;
        const lines = text.split('\n');
        if (lineIndex < 0 || lineIndex >= lines.length) return;
        const lineHeight = el.scrollHeight / Math.max(lines.length, 1) || 20;
        const targetLine = Math.max(0, Math.min(lines.length - 1, lineIndex + offset));
        const rawTop = targetLine * lineHeight - el.clientHeight * align;
        const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
        el.scrollTo({
            top: Math.max(0, Math.min(maxTop, rawTop)),
            behavior: 'smooth',
        });
    };

    const buildValueMatchers = (value) => {
        const matchers = [];
        parseList(value).forEach((item) => {
            matchers.push(JSON.stringify(item));
            const numericValue = parseOptionalInteger(item);
            if (numericValue !== undefined) matchers.push(String(numericValue));
        });
        return Array.from(new Set(matchers.filter(Boolean)));
    };

    const buildRouteRuleMatchers = (rule) => {
        const matchers = [];
        if (Array.isArray(rule?.conditions)) {
            rule.conditions.forEach((condition) => {
                if (!condition?.value) return;
                matchers.push(...buildValueMatchers(condition.value));
            });
        }
        if (rule?.action) matchers.push(`"action": ${JSON.stringify(rule.action)}`);
        if (rule?.action === 'route' && rule?.outbound) matchers.push(`"outbound": ${JSON.stringify(rule.outbound)}`);
        return Array.from(new Set(matchers.filter(Boolean)));
    };

    const unwrapJsonScrollPayload = (payload) => (
        payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'target')
            ? payload.target
            : payload
    );

    const getJsonScrollFieldKey = (payload) => (
        payload && typeof payload === 'object' && typeof payload.fieldKey === 'string'
            ? payload.fieldKey
            : ''
    );

    const normalizeLabelText = (value) => String(value || '')
        .toLowerCase()
        .replace(/（[^）]*）/g, '')
        .replace(/\([^)]*\)/g, '')
        .replace(/\s+/g, '')
        .trim();

    const findLabelTextForTarget = (target) => {
        if (!(target instanceof Element)) return '';
        const labelHost = target.closest('label');
        if (labelHost) return labelHost.innerText || labelHost.textContent || '';

        let current = target;
        for (let depth = 0; current && depth < 5; depth += 1, current = current.parentElement) {
            const directLabel = Array.from(current.children || []).find((child) => child.tagName === 'LABEL');
            if (directLabel) return directLabel.innerText || directLabel.textContent || '';
            let prev = current.previousElementSibling;
            while (prev) {
                if (prev.tagName === 'LABEL') return prev.innerText || prev.textContent || '';
                prev = prev.previousElementSibling;
            }
        }
        return '';
    };

    const inferJsonFieldKey = (type, payload, event) => {
        const target = event?.target;
        if (!(target instanceof Element)) return '';
        if (target.dataset?.jsonKey) return target.dataset.jsonKey;

        const labelText = normalizeLabelText(findLabelTextForTarget(target));
        if (!labelText) return '';
        const matches = (patterns) => patterns.some((pattern) => labelText.includes(pattern));

        if (matches(['日志级别'])) return 'level';
        if (matches(['mixed代理端口', 'tproxy监听端口'])) return 'listen_port';
        if (matches(['dns策略'])) return 'strategy';
        if (matches(['dns最终解析器'])) return 'final';
        if (matches(['默认域名解析'])) return 'default_domain_resolver';
        if (matches(['标签', '节点名称', '组名称'])) return 'tag';
        if (matches(['监听地址'])) return 'listen';
        if (matches(['服务器ip/域名', '服务器'])) return 'server';
        if (matches(['端口(port)', '服务器端口'])) return 'server_port';
        if (labelText === '端口') {
            if (type === 'dns-server' || type === 'node') return 'server_port';
            if (type === 'route-rule') return 'port';
            return 'listen_port';
        }
        if (matches(['路径'])) return 'path';
        if (matches(['远程地址', '订阅链接', '订阅源', 'url'])) return 'url';
        if (matches(['格式'])) return 'format';
        if (matches(['下载出站', '全局默认出站'])) return 'download_detour';
        if (matches(['更新间隔', '同步间隔'])) return 'update_interval';
        if (matches(['域名解析器'])) return 'domain_resolver';
        if (matches(['客户端子网'])) return 'client_subnet';
        if (matches(['连接超时'])) return 'connect_timeout';
        if (matches(['用户名'])) return type === 'node' && payload?.type === 'ssh' ? 'user' : 'username';
        if (matches(['密码'])) return 'password';
        if (matches(['uuid'])) return 'uuid';
        if (matches(['流控'])) return 'flow';
        if (matches(['版本'])) return 'version';
        if (matches(['override_address'])) return 'override_address';
        if (matches(['override_port'])) return 'override_port';
        if (matches(['启用tls', 'tls'])) return 'tls';
        if (matches(['证书路径'])) return 'certificate_path';
        if (payload?.type === 'ssh' && matches(['私钥路径'])) return 'private_key_path';
        if (matches(['私钥路径'])) return 'key_path';
        if (matches(['sni'])) return 'server_name';
        if (matches(['alpn'])) return 'alpn';
        if (matches(['reality公钥'])) return 'public_key';
        if (matches(['reality短id'])) return 'short_id';
        if (matches(['传输层', 'transport'])) return 'transport';
        if (matches(['主机(host)', '主机'])) return 'host';
        if (matches(['服务名'])) return 'service_name';
        if (matches(['网络(network)', '网络'])) return 'network';
        if (matches(['加密方法'])) return 'method';
        if (matches(['插件参数'])) return 'plugin_opts';
        if (matches(['插件'])) return 'plugin';
        if (matches(['udpovertcp'])) return 'udp_over_tcp';
        if (matches(['拥塞控制'])) return 'congestion_control';
        if (matches(['udp转发模式'])) return 'udp_relay_mode';
        if (matches(['udpoverstream'])) return 'udp_over_stream';
        if (matches(['0-rtt握手', 'zerortthandshake'])) return 'zero_rtt_handshake';
        if (matches(['心跳间隔', '心跳'])) return 'heartbeat';
        if (matches(['加密方式'])) return 'security';
        if (matches(['额外id'])) return 'alter_id';
        if (matches(['全局填充'])) return 'global_padding';
        if (matches(['认证长度'])) return 'authenticated_length';
        if (matches(['上行带宽'])) return 'up_mbps';
        if (matches(['下行带宽'])) return 'down_mbps';
        if (matches(['上行格式值'])) return 'up';
        if (matches(['下行格式值'])) return 'down';
        if (matches(['obfs类型', '混淆类型', 'obfs密钥', 'obfs密码', '混淆密码'])) return 'obfs';
        if (matches(['跳跃端口'])) return 'server_ports';
        if (matches(['跳跃间隔'])) return 'hop_interval';
        if (matches(['最大跳跃间隔'])) return 'hop_interval_max';
        if (matches(['bbrprofile'])) return 'bbr_profile';
        if (matches(['brutaldebug'])) return 'brutal_debug';
        if (matches(['连接接收窗'])) return 'recv_window_conn';
        if (matches(['流接收窗'])) return 'recv_window';
        if (matches(['禁用mtu探测'])) return 'disable_mtu_discovery';
        if (matches(['本地地址'])) return 'local_address';
        if (matches(['对端公钥'])) return 'public_key';
        if (matches(['预共享密钥'])) return 'pre_shared_key';
        if (matches(['接口名称'])) return 'interface_name';
        if (matches(['ipv4地址', 'ipv6地址'])) return 'address';
        if (labelText === 'mtu') return 'mtu';
        if (matches(['tun栈'])) return 'stack';
        if (matches(['回环地址'])) return 'loopback_address';
        if (matches(['路由表号'])) return 'iproute2_table_index';
        if (matches(['规则优先级'])) return 'iproute2_rule_index';
        if (matches(['包含接口'])) return 'include_interface';
        if (matches(['排除接口'])) return 'exclude_interface';
        if (matches(['包含应用'])) return 'include_package';
        if (matches(['排除应用'])) return 'exclude_package';
        if (matches(['排除地址列表'])) return 'route_exclude_address';
        if (matches(['auto_detect_interface'])) return 'auto_detect_interface';
        if (matches(['默认标记'])) return 'default_mark';
        if (labelText === 'auto_route') return 'auto_route';
        if (labelText === 'strict_route') return 'strict_route';
        if (labelText === 'auto_redirect') return 'auto_redirect';
        if (matches(['绑定接口'])) return 'bind_interface';
        if (matches(['路由标记', 'mark'])) return 'routing_mark';
        if (matches(['reuse_addr'])) return 'reuse_addr';
        if (matches(['网络命名空间'])) return 'netns';
        if (matches(['tcp快速打开'])) return 'tcp_fast_open';
        if (matches(['tcp多路径'])) return 'tcp_multi_path';
        if (matches(['udp分片'])) return 'udp_fragment';
        if (matches(['初始包大小'])) return 'initial_packet_size';
        if (matches(['禁用路径mtu探测'])) return 'disable_path_mtu_discovery';
        if (matches(['default_network_strategy'])) return 'default_network_strategy';
        if (matches(['default_network_type'])) return 'default_network_type';
        if (matches(['default_fallback_network_type'])) return 'default_fallback_network_type';
        if (matches(['default_fallback_delay'])) return 'default_fallback_delay';
        if (matches(['启用进程匹配'])) return 'find_process';
        if (labelText === '动作') return 'action';
        if (labelText === '出站') return 'outbound';
        if (matches(['规则集'])) return 'rule_set';
        if (matches(['启用嗅探'])) return 'sniff';
        if (matches(['重写目标'])) return 'sniff_override_destination';
        if (matches(['嗅探超时'])) return 'sniff_timeout';
        if (matches(['私有ip直连'])) return 'ip_is_private';
        if (matches(['拦截dns解析'])) return 'hijack_dns';
        if (matches(['认证值'])) return payload?.type === 'hysteria' && payload?.hy_auth_type === 'base64' ? 'auth' : 'auth_str';
        if (matches(['空闲连接检查间隔'])) return 'idle_session_check_interval';
        if (matches(['空闲会话超时'])) return 'idle_session_timeout';
        if (matches(['最小空闲会话数'])) return 'min_idle_session';
        if (matches(['不安全并发'])) return 'insecure_concurrency';
        if (matches(['额外请求头'])) return 'extra_headers';
        if (matches(['启用quic'])) return 'quic';
        if (matches(['quic拥塞控制'])) return 'quic_congestion_control';
        if (matches(['私钥口令'])) return 'private_key_passphrase';
        if (matches(['主机公钥'])) return 'host_key';
        if (matches(['主机密钥算法'])) return 'host_key_algorithms';
        if (matches(['客户端版本'])) return 'client_version';
        if (matches(['torrc'])) return 'torrc';
        return '';
    };

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

    const findFirstMatchingLineIndexInRange = (lines, matchers = [], startIndex = 0, endIndex = lines.length) => {
        const safeStart = Math.max(0, startIndex);
        const safeEnd = Math.max(safeStart, Math.min(lines.length, endIndex));
        for (let index = safeStart; index < safeEnd; index += 1) {
            const line = lines[index];
            for (const matcher of matchers) {
                if (!matcher) continue;
                if (typeof matcher === 'function') {
                    if (matcher(line, index, lines)) return index;
                    continue;
                }
                if (line.includes(matcher)) return index;
            }
        }
        return -1;
    };

    const buildJsonScrollRequest = (type, payload = null, lines = []) => {
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

    const scrollJsonToRequest = async (type, payload = null) => {
        await nextTick();
        const text = ctx.generatedJson?.value;
        if (!text) return;
        const lines = text.split('\n');
        const request = buildJsonScrollRequest(type, payload, lines);
        if (!request) return;

        let targetLine = findFirstMatchingLineIndex(lines, request.matchers, request.startIndex || 0);
        if (targetLine !== -1 && Array.isArray(request.fieldMatchers) && request.fieldMatchers.length > 0) {
            const nextTagIndex = findLineIndex(lines, '"tag":', targetLine + 1);
            const searchEnd = nextTagIndex === -1
                ? Math.min(lines.length, targetLine + (request.fieldSearchWindow || 180))
                : Math.min(nextTagIndex, targetLine + (request.fieldSearchWindow || 180));
            const fieldLine = findFirstMatchingLineIndexInRange(lines, request.fieldMatchers, targetLine, searchEnd);
            if (fieldLine !== -1) targetLine = fieldLine;
        }
        if (targetLine === -1) {
            targetLine = findFirstMatchingLineIndex(lines, request.fallbackMatchers, 0);
        }
        if (targetLine === -1) return;
        await scrollJsonToLineIndex(targetLine, { align: 0.5 });
    };

    const queueJsonScrollTo = (type, payload = null) => {
        clearTimeout(jsonTargetScrollTimer);
        jsonTargetScrollTimer = setTimeout(() => {
            scrollJsonToRequest(type, payload);
        }, 80);
    };

    const queueJsonScrollToTarget = (type, payload = null, event = null) => {
        const fieldKey = inferJsonFieldKey(type, payload, event);
        queueJsonScrollTo(type, {
            target: payload,
            fieldKey,
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
        const cleanNodes = ctx.nodes.value.map((node) => {
            const cleanNode = { ...node };
            sanitizeNodeByCapabilities(cleanNode);
            const defaultNode = ctx.makeNode({ type: cleanNode.type });

            Object.keys(cleanNode).forEach((key) => {
                if (['tag', 'type', 'server', 'port', 'insecure'].includes(key)) return;
                if (cleanNode[key] === '' || cleanNode[key] === null) {
                    delete cleanNode[key];
                } else if (cleanNode[key] === false && defaultNode[key] === false) {
                    delete cleanNode[key];
                }
            });

            return cleanNode;
        });

        const cleanDnsList = ctx.dnsList.value.map((dns, index) => {
            const cleanDns = typeof ctx.normalizeDnsServer === 'function' ? ctx.normalizeDnsServer(dns, index) : { ...dns };

            if (!['https', 'h3'].includes(cleanDns.type)) {
                delete cleanDns.path;
                delete cleanDns.headers_text;
            }

            Object.keys(cleanDns).forEach((key) => {
                if (['tag', 'type'].includes(key)) return;
                if (cleanDns[key] === '' || cleanDns[key] === null) delete cleanDns[key];
                else if (cleanDns[key] === false) delete cleanDns[key];
            });

            return cleanDns;
        });

        const defaultNtp = typeof ctx.normalizeNtp === 'function' ? ctx.normalizeNtp() : {};
        const cleanNtp = { ...ctx.ntp.value };
        Object.keys(cleanNtp).forEach((key) => {
            if (cleanNtp[key] === '' || cleanNtp[key] === null) {
                delete cleanNtp[key];
                return;
            }
            if (cleanNtp[key] === false && defaultNtp[key] === false) {
                delete cleanNtp[key];
                return;
            }
            if (cleanNtp[key] === defaultNtp[key]) {
                delete cleanNtp[key];
            }
        });

        return {
            _version: '1.12',
            _exported: new Date().toISOString(),
            settings: ctx.settings.value,
            fakeip: ctx.fakeip.value,
            tun: ctx.tun.value,
            clashApi: ctx.clashApi.value,
            ntp: cleanNtp,
            tproxy: (({ server_ports, ...rest }) => rest)(ctx.tproxy.value),
            extraInbounds: ctx.extraInbounds.value.map(ctx.normalizeExtraInbound),
            corsProxyEnabled: ctx.corsProxyEnabled.value,
            dnsList: cleanDnsList,
            providers: ctx.providers.value,
            nodes: cleanNodes,
            groups: ctx.groups.value.map((group) => {
                const cleanGroup = { ...group };
                delete cleanGroup.draggable;
                delete cleanGroup.collapsed;
                return cleanGroup;
            }),
            ruleSets: ctx.ruleSets.value,
            routeRules: ctx.routeRules.value.map((rule) => {
                const cleanRule = { ...rule };
                delete cleanRule.isEditing;
                delete cleanRule.draggable;
                delete cleanRule.route_options_enabled;
                delete cleanRule.route_options_show_all;

                if (cleanRule.action !== 'route') delete cleanRule.outbound;
                if (cleanRule.action !== 'reject') {
                    delete cleanRule.reject_method;
                    delete cleanRule.reject_no_drop;
                }
                if (cleanRule.action !== 'sniff') {
                    delete cleanRule.sniff_sniffer;
                    delete cleanRule.sniff_timeout;
                }
                if (cleanRule.action !== 'resolve') {
                    delete cleanRule.resolve_server;
                    delete cleanRule.resolve_strategy;
                    delete cleanRule.resolve_disable_cache;
                    delete cleanRule.resolve_rewrite_ttl;
                    delete cleanRule.resolve_client_subnet;
                }
                if (cleanRule.action !== 'route') {
                    delete cleanRule.option_override_address;
                    delete cleanRule.option_override_port;
                    delete cleanRule.option_network_strategy;
                    delete cleanRule.option_network_type;
                    delete cleanRule.option_fallback_network_type;
                    delete cleanRule.option_fallback_delay;
                    delete cleanRule.option_udp_disable_domain_unmapping;
                    delete cleanRule.option_udp_connect;
                    delete cleanRule.option_udp_timeout;
                    delete cleanRule.option_tls_fragment;
                    delete cleanRule.option_tls_fragment_fallback_delay;
                    delete cleanRule.option_tls_record_fragment;
                }

                Object.keys(cleanRule).forEach((key) => {
                    if (['id', 'enabled', 'name', 'mode', 'invert', 'conditions', 'action'].includes(key)) return;
                    if (cleanRule[key] === '' || cleanRule[key] === null) delete cleanRule[key];
                    else if (cleanRule[key] === false) delete cleanRule[key];
                });

                return cleanRule;
            }),
        };
    };

    onUnmounted(() => {
        clearTimeout(diffScrollTimer);
        clearTimeout(jsonTargetScrollTimer);
    });

    Object.assign(ctx, {
        scrollJsonTo,
        scrollJsonToRequest,
        queueJsonScrollTo,
        queueJsonScrollToTarget,
        generatedJson,
        getFullState,
    });
}
