export const buildTproxyNft = ({ tproxy = {}, settings = {}, fakeip = {} } = {}) => {
        if (!tproxy.enabled) return '';
        const {
            listen_port,
            nft_table,
            mark,
            route_mark,
            proxy_uid,
            proxy_gid,
            ipv6,
            dns_port,
            dns_hijack_mode,
            ingress_iface,
            egress_iface,
        } = tproxy;

        const enableDnsHijack = !!settings.hijack_dns;
        const dnsMode = dns_hijack_mode || 'tproxy';
        const useDnsNat = enableDnsHijack && dnsMode === 'nat';
        const useDnsDirectTproxy = enableDnsHijack && dnsMode !== 'nat';

        const toDec = (value, fallback) => {
            const source = String(value ?? '').trim();
            const num = parseInt(source, source.toLowerCase().startsWith('0x') ? 16 : 10);
            return Number.isNaN(num) ? fallback : num;
        };
        const markDec = toDec(mark, 111);
        const routeMarkDec = toDec(route_mark, 112);

        const table = nft_table || 'singbox';
        const tport = listen_port || 7893;
        const dnsPort = dns_port || 1053;

        const ingressIfaceName = String(ingress_iface || '').trim();
        const egressIfaceName = String(egress_iface || '').trim();
        const hasIngressIface = !!ingressIfaceName;
        const hasEgressIface = !!egressIfaceName;

        const uidVal = String(proxy_uid || '').trim();
        const gidVal = String(proxy_gid || '').trim();
        const hasUid = uidVal && gidVal;
        const replyBypassRule = 'ct direction reply accept';

        const fakeip4Range = (fakeip.enabled && fakeip.inet4_range) ? fakeip.inet4_range.trim() : '';
        const fakeip6Range = (fakeip.enabled && fakeip.inet6_range) ? fakeip.inet6_range.trim() : '';

        const ALL_PRIVATE4 = [
            '0.0.0.0/8', '10.0.0.0/8', '100.64.0.0/10',
            '127.0.0.0/8', '169.254.0.0/16', '172.16.0.0/12',
            '192.0.0.0/24', '192.0.2.0/24', '192.88.99.0/24',
            '192.168.0.0/16', '198.18.0.0/15', '198.51.100.0/24',
            '203.0.113.0/24', '224.0.0.0/4', '240.0.0.0/4',
        ];
        const ALL_PRIVATE6 = ['::1/128', 'fc00::/7', 'fe80::/10', 'ff00::/8', '100::/64'];

        const privateRanges4 = ALL_PRIVATE4.filter((range) => range !== fakeip4Range);
        const privateRanges6 = ALL_PRIVATE6.filter((range) => range !== fakeip6Range);

        const fakeip4Note = fakeip4Range ? ` # fakeip ${fakeip4Range} 已排除，流量正常进入 tproxy` : '';
        const fakeip6Note = fakeip6Range ? ` # fakeip ${fakeip6Range} 已排除` : '';

        const dnsSkipLine = hasUid
            ? '        meta skuid $PROXY_UID meta skgid $PROXY_GID accept # sing-box 自身 DNS 请求直接放行，防止死循环\n'
            : '        oifname "lo" return # 兜底：lo 上的包不劫持（需配合 auto_detect_interface）\n';

        const outputSkipLine = hasUid
            ? '        meta skuid $PROXY_UID meta skgid $PROXY_GID meta mark set $ROUTE_MARK accept # sing-box 出站流量打 ROUTE_MARK，走默认路由不触发策略路由\n'
            : '';

        const uidDefines = hasUid ? `define PROXY_UID    = ${uidVal}\ndefine PROXY_GID    = ${gidVal}\n` : '';

        const ingressDefineLine = hasIngressIface
            ? `define INGRESS_INTERFACE = "${ingressIfaceName}"\n`
            : '';

        const egressDefineLine = hasEgressIface
            ? `define EGRESS_INTERFACE  = "${egressIfaceName}"\n`
            : '';

        const dnsDefineLine = useDnsNat
            ? `define DNS_PORT     = ${dnsPort}\n`
            : '';

        const preroutingIngressGuard = hasIngressIface
            ? '        iifname != "lo" iifname != $INGRESS_INTERFACE accept             # 非 lo 且非目标入站接口直接放行\n'
            : '';

        const outputEgressGuard = hasEgressIface
            ? '        oifname != $EGRESS_INTERFACE accept                          # 非目标出口接口直接放行\n'
            : '';

        const dnsNatPreroutingLine = hasIngressIface
            ? '        iifname $INGRESS_INTERFACE meta l4proto { tcp, udp } th dport 53 dnat ip to 127.0.0.1:$DNS_PORT\n'
            : '        meta l4proto { tcp, udp } th dport 53 dnat ip to 127.0.0.1:$DNS_PORT\n';

        const dnsNatChains = useDnsNat ? `
    chain prerouting_dns {
        type nat hook prerouting priority dstnat; policy accept;
${dnsNatPreroutingLine}    }

    chain output_dns {
        type nat hook output priority dstnat; policy accept;
${dnsSkipLine}        meta l4proto { tcp, udp } th dport 53 dnat ip to 127.0.0.1:$DNS_PORT
    }
` : '';

        const preroutingDnsDirectLine = useDnsDirectTproxy
            ? '        meta l4proto { tcp, udp } th dport 53 tproxy to :$TPROXY_PORT meta mark set $PROXY_MARK accept\n'
            : '';

        const outputDnsDirectLine = useDnsDirectTproxy
            ? '        meta l4proto { tcp, udp } th dport 53 meta mark set $PROXY_MARK\n'
            : '';

        const preroutingDnsDirectLineV6 = useDnsDirectTproxy
            ? '        meta l4proto { tcp, udp } th dport 53 tproxy to :$TPROXY_PORT meta mark set $PROXY_MARK accept\n'
            : '';

        const outputDnsDirectLineV6 = useDnsDirectTproxy
            ? '        meta l4proto { tcp, udp } th dport 53 meta mark set $PROXY_MARK\n'
            : '';

        const ipv6Sets = ipv6 ? `
    set reserved_ipv6 {
        type ipv6_addr
        flags interval
        elements = {${fakeip6Note}
            ${privateRanges6.join(',\n            ')}
        }
    }
` : '';

        const ipv6Chains = ipv6 ? `
    chain prerouting_tproxy_v6 {
        type filter hook prerouting priority mangle; policy accept;
${preroutingIngressGuard}${preroutingDnsDirectLineV6}        fib daddr type local accept
        ip6 daddr @reserved_ipv6 accept
        meta l4proto { tcp, udp } th dport $TPROXY_PORT reject with icmpx type host-unreachable
        meta l4proto tcp socket transparent 1 meta mark set $PROXY_MARK accept
        meta l4proto { tcp, udp } tproxy to :$TPROXY_PORT meta mark set $PROXY_MARK
    }

    chain output_tproxy_v6 {
        type route hook output priority mangle; policy accept;
${outputEgressGuard}        ${replyBypassRule}
        meta mark $ROUTE_MARK accept
${outputSkipLine}${outputDnsDirectLineV6}        fib daddr type local accept
        ip6 daddr @reserved_ipv6 accept
        meta l4proto { tcp, udp } meta mark set $PROXY_MARK
    }
` : '';

        return `#!/usr/sbin/nft -f

${ingressDefineLine}${egressDefineLine}define TPROXY_PORT  = ${tport}
${dnsDefineLine}define PROXY_MARK   = ${markDec}
define ROUTE_MARK   = ${routeMarkDec}
${uidDefines}add table inet ${table}
flush table inet ${table}

table inet ${table} {

    set reserved_ipv4 {
        type ipv4_addr
        flags interval
        elements = {${fakeip4Note}
            ${privateRanges4.join(',\n            ')}
        }
    }
${ipv6Sets}${dnsNatChains}
    chain prerouting_tproxy {
        type filter hook prerouting priority mangle; policy accept;
${preroutingIngressGuard}${preroutingDnsDirectLine}        fib daddr type local accept
        ip daddr @reserved_ipv4 accept
        meta l4proto { tcp, udp } th dport $TPROXY_PORT reject with icmpx type host-unreachable
        meta l4proto tcp socket transparent 1 meta mark set $PROXY_MARK accept
        meta l4proto { tcp, udp } tproxy to :$TPROXY_PORT meta mark set $PROXY_MARK
    }

    chain output_tproxy {
        type route hook output priority mangle; policy accept;
${outputEgressGuard}        ${replyBypassRule}
        meta mark $ROUTE_MARK accept
${outputSkipLine}${outputDnsDirectLine}        fib daddr type local accept
        ip daddr @reserved_ipv4 accept
        meta l4proto { tcp, udp } meta mark set $PROXY_MARK
    }
${ipv6Chains}}
`;
};

export const cleanTproxyNft = (nft) => {
        if (!nft) return '';
        return nft
            .split('\n')
            .map((line, index) => {
                if (index === 0 && line.startsWith('#!')) return line;
                if (line.trim().startsWith('#')) return null;
                const commentIndex = line.indexOf('#');
                if (commentIndex !== -1) return line.slice(0, commentIndex).trimEnd();
                return line;
            })
            .filter((line) => line !== null)
            .reduce((acc, line) => {
                if (line.trim() === '' && acc.length > 0 && acc[acc.length - 1].trim() === '') return acc;
                acc.push(line);
                return acc;
            }, [])
            .join('\n')
            .trim() + '\n';
};
