const COMMON_DIAL_FIELDS = ['detour', 'connect_timeout', 'bind_interface', 'routing_mark', 'inet4_bind_address', 'inet6_bind_address', 'reuse_addr', 'netns', 'network_strategy', 'network_type', 'fallback_network_type', 'fallback_delay'];
const DOMAIN_DIAL_FIELDS = ['domain_resolver'];
const LEGACY_DIAL_FIELDS = ['domain_strategy'];
const TCP_DIAL_FIELDS = ['tcp_fast_open', 'tcp_multi_path'];
const UDP_DIAL_FIELDS = ['udp_fragment'];
const PROTO_DIAL_FIELD_MATRIX = {
    http: { common: true, domain: true, tcp: true },
    socks: { common: true, domain: true, tcp: true, udp: true },
    ssh: { common: true, domain: true, tcp: true },
    shadowtls: { common: true, domain: true, tcp: true },
    anytls: { common: true, domain: true, tcp: true },
    naive: { common: true, domain: true, tcp: true, udp: true },
    tor: { common: true, tcp: true },
    wireguard: { common: true, domain: true, udp: true },
    hysteria: { common: true, domain: true, udp: true },
    hysteria2: { common: true, domain: true, udp: true },
    tuic: { common: true, domain: true, udp: true },
    dns: {},
};

const isNodeDialFieldConfigured = (node = {}, field) => {
    const value = node[field];
    if (typeof value === 'boolean') return value;
    return value !== null && value !== undefined && String(value).trim() !== '';
};

const isLiteralIpAddress = (value = '') => {
    const source = String(value || '').trim();
    if (!source) return false;
    if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(source)) return true;
    if (/^\[[0-9a-fA-F:]+\]$/.test(source)) return true;
    if (/^[0-9a-fA-F:]+$/.test(source) && source.includes(':')) return true;
    return false;
};

const getNodeDialDeps = ({
    isNodeStreamTransport = () => false,
    isNodeDatagramTransport = () => false,
} = {}) => ({
    isNodeStreamTransport,
    isNodeDatagramTransport,
});

export const getNodeDialVisibleFields = (node = {}, deps = {}) => {
    const { isNodeStreamTransport, isNodeDatagramTransport } = getNodeDialDeps(deps);
    const fields = new Set();
    const add = (items) => items.forEach((item) => fields.add(item));
    const type = node.type || 'vless';
    const usesQuicTransport = node.transport === 'quic';
    const shouldShowDomainFields = type !== 'tor' && (!String(node.server || '').trim() || !isLiteralIpAddress(node.server));
    const preset = PROTO_DIAL_FIELD_MATRIX[type];

    if (preset) {
        if (preset.common) add(COMMON_DIAL_FIELDS);
        if (preset.domain && shouldShowDomainFields) add(DOMAIN_DIAL_FIELDS);
        if (preset.tcp && isNodeStreamTransport(node)) add(TCP_DIAL_FIELDS);
        if (preset.udp && isNodeDatagramTransport(node)) add(UDP_DIAL_FIELDS);
    } else if (type === 'shadowsocks' || ['vless', 'vmess', 'trojan'].includes(type)) {
        add(COMMON_DIAL_FIELDS);
        if (shouldShowDomainFields) add(DOMAIN_DIAL_FIELDS);
        if (usesQuicTransport || isNodeDatagramTransport(node)) add(UDP_DIAL_FIELDS);
        if (isNodeStreamTransport(node)) add(TCP_DIAL_FIELDS);
    } else {
        add(COMMON_DIAL_FIELDS);
        if (shouldShowDomainFields) add(DOMAIN_DIAL_FIELDS);
        if (isNodeStreamTransport(node)) add(TCP_DIAL_FIELDS);
        if (isNodeDatagramTransport(node)) add(UDP_DIAL_FIELDS);
    }

    [...COMMON_DIAL_FIELDS, ...DOMAIN_DIAL_FIELDS, ...TCP_DIAL_FIELDS, ...UDP_DIAL_FIELDS].forEach((field) => {
        if (isNodeDialFieldConfigured(node, field)) fields.add(field);
    });
    LEGACY_DIAL_FIELDS.forEach((field) => {
        if (isNodeDialFieldConfigured(node, field)) fields.add(field);
    });

    return fields;
};

export const hasNodeDialOptions = (node = {}, deps = {}) => getNodeDialVisibleFields(node, deps).size > 0;

export const isNodeDialFieldVisible = (node = {}, field, deps = {}) => getNodeDialVisibleFields(node, deps).has(field);

export const hasNodeDialConfig = (node = {}, deps = {}) => {
    const fields = getNodeDialVisibleFields(node, deps);
    return [...fields].some((field) => {
        const value = node[field];
        if (typeof value === 'boolean') return value;
        return value !== null && value !== undefined && String(value).trim() !== '';
    });
};

export const nodeHasDetourOverride = (node = {}) => !!String(node.detour || '').trim();

export const nodeHasBindingOverride = (node = {}) => !!(
    String(node.bind_interface || '').trim()
    || String(node.inet4_bind_address || '').trim()
    || String(node.inet6_bind_address || '').trim()
);

export const isNodeDialFieldEffectivelyMuted = (node = {}, field) => {
    if (nodeHasDetourOverride(node) && field !== 'detour') return true;
    if (nodeHasBindingOverride(node) && ['network_strategy', 'network_type', 'fallback_network_type', 'fallback_delay'].includes(field)) return true;
    return false;
};
