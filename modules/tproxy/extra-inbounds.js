export const EXTRA_INBOUND_RESERVED_TAGS = ['mixed-in', 'tun-in', 'tproxy-in', 'dns-in'];

export const defaultExtraInboundPort = (type = 'http') => {
    if (type === 'socks') return 1080;
    if (type === 'direct') return 9000;
    return 8080;
};

export const isAutoExtraInboundTag = (tag = '') => /^(http|socks|direct)-in(?:-\d+)?$/.test(String(tag));

export const normalizeExtraInbound = (item = {}, generateId = () => '') => {
    const type = ['direct', 'http', 'socks'].includes(item.type) ? item.type : 'http';
    return {
        id: item.id || generateId('extra_inbound'),
        type,
        tag: String(item.tag || `${type}-in`),
        listen: String(item.listen || '127.0.0.1'),
        listen_port: Number(item.listen_port || defaultExtraInboundPort(type)),
        sniff: !!item.sniff,
        override_address: String(item.override_address || ''),
        override_port: item.override_port === 0 ? 0 : (item.override_port || ''),
        username: String(item.username || ''),
        password: String(item.password || ''),
        socks_version: ['4', '4a', '5'].includes(String(item.socks_version || '5')) ? String(item.socks_version || '5') : '5',
        tls: !!item.tls,
        tls_cert_path: String(item.tls_cert_path || ''),
        tls_key_path: String(item.tls_key_path || ''),
    };
};

export const nextExtraInboundTag = (extraInbounds = [], type = 'http') => {
    const base = `${type}-in`;
    const used = new Set([
        ...EXTRA_INBOUND_RESERVED_TAGS,
        ...extraInbounds.map((item) => String(item && item.tag ? item.tag : '').trim()).filter(Boolean),
    ]);
    if (!used.has(base)) return base;
    let index = 2;
    while (used.has(`${base}-${index}`)) index += 1;
    return `${base}-${index}`;
};

export const makeExtraInbound = ({ type = 'http', existing = [], generateId = () => '' } = {}) => normalizeExtraInbound({
    id: generateId('extra_inbound'),
    type,
    tag: nextExtraInboundTag(existing, type),
    listen: '127.0.0.1',
    listen_port: defaultExtraInboundPort(type),
    sniff: false,
    socks_version: '5',
    tls: false,
}, generateId);

export const resetExtraInboundTls = (inbound) => {
    if (!inbound || inbound.tls) return;
    inbound.tls_cert_path = '';
    inbound.tls_key_path = '';
};

export const onExtraInboundSocksVersionChange = (inbound) => {
    if (!inbound || inbound.type !== 'socks') return;
    if (String(inbound.socks_version || '5') !== '5') {
        inbound.tls = false;
        inbound.tls_cert_path = '';
        inbound.tls_key_path = '';
    }
};

export const onExtraInboundTypeChange = (inbound, getNextTag = (type) => `${type}-in`) => {
    if (!inbound) return;

    if (!inbound.listen) inbound.listen = '127.0.0.1';

    const portNum = parseInt(inbound.listen_port, 10);
    if (!(portNum > 0 && portNum < 65536)) {
        inbound.listen_port = defaultExtraInboundPort(inbound.type || 'http');
    }

    if (!inbound.tag || isAutoExtraInboundTag(inbound.tag)) {
        inbound.tag = getNextTag(inbound.type || 'http');
    }

    if (inbound.type === 'direct') {
        inbound.username = '';
        inbound.password = '';
        inbound.socks_version = '5';
        inbound.tls = false;
        inbound.tls_cert_path = '';
        inbound.tls_key_path = '';
    } else if (inbound.type === 'http') {
        inbound.override_address = '';
        inbound.override_port = '';
        inbound.socks_version = '5';
    } else if (inbound.type === 'socks') {
        inbound.override_address = '';
        inbound.override_port = '';
        if (!['4', '4a', '5'].includes(String(inbound.socks_version || '5'))) {
            inbound.socks_version = '5';
        }
        onExtraInboundSocksVersionChange(inbound);
    }
};

export const buildExtraInbounds = ({
    extraInbounds = [],
    settings = {},
    generateId = () => '',
    warn = console.warn,
} = {}) => {
    const seenTags = new Set(EXTRA_INBOUND_RESERVED_TAGS);

    return extraInbounds
        .map((item) => normalizeExtraInbound(item, generateId))
        .map((item) => {
            const tag = String(item.tag || '').trim();
            const listen = String(item.listen || '').trim();
            const listenPort = parseInt(item.listen_port, 10);

            if (!tag || !listen || !(listenPort > 0 && listenPort < 65536)) {
                return null;
            }

            if (seenTags.has(tag)) {
                warn('[extraInbounds] 跳过重复或保留的入站 tag:', tag);
                return null;
            }
            seenTags.add(tag);

            const inbound = {
                type: item.type,
                tag,
                listen,
                listen_port: listenPort,
            };

            if (item.sniff) {
                inbound.sniff = true;
                if (settings.sniff_override_destination) inbound.sniff_override_destination = true;
                if (settings.sniff_timeout) inbound.sniff_timeout = settings.sniff_timeout;
            }

            if (item.type === 'direct') {
                if (item.override_address) inbound.override_address = item.override_address;
                if (String(item.override_port).trim() !== '') {
                    const overridePort = parseInt(item.override_port, 10);
                    if (overridePort > 0 && overridePort < 65536) inbound.override_port = overridePort;
                }
                return inbound;
            }

            if (item.username && item.password) {
                inbound.users = [{
                    username: item.username,
                    password: item.password,
                }];
            }

            if (item.type === 'socks') {
                inbound.version = item.socks_version || '5';
            }

            const canUseTls = item.type === 'http' || (item.type === 'socks' && String(item.socks_version || '5') === '5');
            if (item.tls && canUseTls) {
                inbound.tls = { enabled: true };
                if (item.tls_cert_path) inbound.tls.certificate_path = item.tls_cert_path;
                if (item.tls_key_path) inbound.tls.key_path = item.tls_key_path;
            }

            return inbound;
        })
        .filter(Boolean);
};
