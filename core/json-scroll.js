import { parseList, parseOptionalInteger } from './config-utils.js';

const { watch, nextTick } = window.Vue;

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

export function setupJsonPreviewScroll(ctx, generatedJson) {
    let jsonTargetScrollTimer = null;
    let diffScrollTimer = null;

    const scrollJsonToLineIndex = async (lineIndex, { offset = 0, align = 0.5 } = {}) => {
        await nextTick();
        const el = ctx.jsonContainer.value;
        const text = generatedJson?.value;
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

    const scrollJsonTo = async (keyword, { offset = 0, fallbackToEnd = false } = {}) => {
        await nextTick();
        const el = ctx.jsonContainer.value;
        if (!el || !generatedJson) return;
        const text = generatedJson.value;
        const lines = text.split('\n');
        let targetLine = -1;
        for (let i = 0; i < lines.length; i += 1) {
            if (lines[i].includes(keyword)) {
                targetLine = i;
                break;
            }
        }
        if (targetLine === -1) {
            if (fallbackToEnd) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
            return;
        }
        await scrollJsonToLineIndex(targetLine, { offset, align: 0.25 });
    };

    const scrollJsonToRequest = async (type, payload = null) => {
        await nextTick();
        const text = generatedJson?.value;
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
            for (let i = 0; i < newLines.length; i += 1) {
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

    const cleanupJsonScroll = () => {
        clearTimeout(diffScrollTimer);
        clearTimeout(jsonTargetScrollTimer);
    };

    return {
        scrollJsonTo,
        scrollJsonToRequest,
        queueJsonScrollTo,
        queueJsonScrollToTarget,
        cleanupJsonScroll,
    };
}
