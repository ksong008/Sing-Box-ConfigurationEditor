export const unwrapJsonScrollPayload = (payload) => (
    payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'target')
        ? payload.target
        : payload
);

export const getJsonScrollFieldKey = (payload) => (
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

export const inferJsonFieldKey = (type, payload, event) => {
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
