export const RULE_ACTIONS = ['route', 'reject', 'hijack-dns', 'sniff', 'resolve'];

export const SNIFF_PROTOCOLS = ['http', 'tls', 'quic', 'stun', 'dns', 'bittorrent', 'dtls', 'ssh', 'rdp', 'ntp'];

export const ROUTE_OPTION_FIELDS = [
    'option_override_address',
    'option_override_port',
    'option_network_strategy',
    'option_network_type',
    'option_fallback_network_type',
    'option_fallback_delay',
    'option_udp_disable_domain_unmapping',
    'option_udp_connect',
    'option_udp_timeout',
    'option_tls_fragment',
    'option_tls_fragment_fallback_delay',
    'option_tls_record_fragment',
];
