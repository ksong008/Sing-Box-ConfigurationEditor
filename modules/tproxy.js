const { ref, computed, watch, nextTick } = window.Vue;

export function setupTproxyModule(ctx) {
    const EXTRA_INBOUND_RESERVED_TAGS = ['mixed-in', 'tun-in', 'tproxy-in', 'dns-in'];

    const defaultExtraInboundPort = (type = 'http') => {
        if (type === 'socks') return 1080;
        if (type === 'direct') return 9000;
        return 8080;
    };

    const isAutoExtraInboundTag = (tag = '') => /^(http|socks|direct)-in(?:-\d+)?$/.test(String(tag));

    const normalizeExtraInbound = (item = {}) => {
        const type = ['direct', 'http', 'socks'].includes(item.type) ? item.type : 'http';
        return {
            id: item.id || ctx.generateId('extra_inbound'),
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

    const extraInbounds = ref([]);

    const nextExtraInboundTag = (type = 'http') => {
        const base = `${type}-in`;
        const used = new Set([
            ...EXTRA_INBOUND_RESERVED_TAGS,
            ...extraInbounds.value.map((item) => String(item && item.tag ? item.tag : '').trim()).filter(Boolean),
        ]);
        if (!used.has(base)) return base;
        let index = 2;
        while (used.has(`${base}-${index}`)) index += 1;
        return `${base}-${index}`;
    };

    const makeExtraInbound = (type = 'http') => normalizeExtraInbound({
        id: ctx.generateId('extra_inbound'),
        type,
        tag: nextExtraInboundTag(type),
        listen: '127.0.0.1',
        listen_port: defaultExtraInboundPort(type),
        sniff: false,
        socks_version: '5',
        tls: false,
    });

    const addExtraInbound = (type = 'http') => {
        extraInbounds.value.push(makeExtraInbound(type));
    };

    const removeExtraInbound = (index) => {
        extraInbounds.value.splice(index, 1);
    };

    const resetExtraInboundTls = (inbound) => {
        if (!inbound || inbound.tls) return;
        inbound.tls_cert_path = '';
        inbound.tls_key_path = '';
    };

    const onExtraInboundSocksVersionChange = (inbound) => {
        if (!inbound || inbound.type !== 'socks') return;
        if (String(inbound.socks_version || '5') !== '5') {
            inbound.tls = false;
            inbound.tls_cert_path = '';
            inbound.tls_key_path = '';
        }
    };

    const onExtraInboundTypeChange = (inbound) => {
        if (!inbound) return;

        if (!inbound.listen) inbound.listen = '127.0.0.1';

        const portNum = parseInt(inbound.listen_port, 10);
        if (!(portNum > 0 && portNum < 65536)) {
            inbound.listen_port = defaultExtraInboundPort(inbound.type || 'http');
        }

        if (!inbound.tag || isAutoExtraInboundTag(inbound.tag)) {
            inbound.tag = nextExtraInboundTag(inbound.type || 'http');
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

    const buildExtraInbounds = () => {
        const seenTags = new Set(EXTRA_INBOUND_RESERVED_TAGS);

        return extraInbounds.value
            .map((item) => normalizeExtraInbound(item))
            .map((item) => {
                const tag = String(item.tag || '').trim();
                const listen = String(item.listen || '').trim();
                const listenPort = parseInt(item.listen_port, 10);

                if (!tag || !listen || !(listenPort > 0 && listenPort < 65536)) {
                    return null;
                }

                if (seenTags.has(tag)) {
                    console.warn('[extraInbounds] 跳过重复或保留的入站 tag:', tag);
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
                    if (ctx.settings.value.sniff_override_destination) inbound.sniff_override_destination = true;
                    if (ctx.settings.value.sniff_timeout) inbound.sniff_timeout = ctx.settings.value.sniff_timeout;
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

    const RESERVED_MARK_TABLE_IDS = new Set([0, 253, 254, 255]);

    const parseTproxyMark = (value) => {
        if (value === null || value === undefined) return NaN;
        const source = String(value).trim();
        if (!source) return NaN;
        const base = source.toLowerCase().startsWith('0x') ? 16 : 10;
        const num = parseInt(source, base);
        return Number.isFinite(num) ? num : NaN;
    };

    const tproxyMarkIssues = computed(() => {
        const issues = [];
        const mark = parseTproxyMark(ctx.tproxy.value.mark);
        const routeMark = parseTproxyMark(ctx.tproxy.value.route_mark);

        if (!Number.isInteger(mark) || mark < 1 || mark > 4294967295) {
            issues.push('Mark 必须是 1~4294967295 的整数（支持十进制或 0x 十六进制）');
        } else if (RESERVED_MARK_TABLE_IDS.has(mark)) {
            issues.push(`Mark=${mark} 与系统保留路由表号冲突（0/253/254/255）`);
        }

        if (!Number.isInteger(routeMark) || routeMark < 1 || routeMark > 4294967295) {
            issues.push('Route Mark 必须是 1~4294967295 的整数（支持十进制或 0x 十六进制）');
        } else if (RESERVED_MARK_TABLE_IDS.has(routeMark)) {
            issues.push(`Route Mark=${routeMark} 与系统保留路由表号冲突（0/253/254/255）`);
        }

        if (Number.isInteger(mark) && Number.isInteger(routeMark) && mark === routeMark) {
            issues.push('Mark 与 Route Mark 不能相同（会导致策略路由冲突/回环）');
        }

        return issues;
    });

    const sanitizeTproxyMarks = () => {
        const fallbackMark = 111;
        const fallbackRoute = 112;

        let mark = parseTproxyMark(ctx.tproxy.value.mark);
        let routeMark = parseTproxyMark(ctx.tproxy.value.route_mark);

        const markBad = !Number.isInteger(mark) || mark < 1 || mark > 4294967295 || RESERVED_MARK_TABLE_IDS.has(mark);
        const routeMarkBad = !Number.isInteger(routeMark) || routeMark < 1 || routeMark > 4294967295 || RESERVED_MARK_TABLE_IDS.has(routeMark);

        if (markBad) mark = fallbackMark;
        if (routeMarkBad) routeMark = fallbackRoute;
        if (mark === routeMark) routeMark = (mark === fallbackMark ? fallbackRoute : fallbackMark);

        const oldMark = String(ctx.tproxy.value.mark ?? '').trim();
        const oldRouteMark = String(ctx.tproxy.value.route_mark ?? '').trim();

        ctx.tproxy.value.mark = String(mark);
        ctx.tproxy.value.route_mark = String(routeMark);

        if (oldMark !== String(mark) || oldRouteMark !== String(routeMark)) {
            ctx.showToast('Mark 已自动修正为安全值（111/112 或可用值）', 'warn', 3200);
        }
    };

    const resetTproxyMarksSafe = () => {
        ctx.tproxy.value.mark = '111';
        ctx.tproxy.value.route_mark = '112';
        ctx.showToast('已恢复安全默认：Mark=111，Route Mark=112', 'ok', 2800);
    };

    const tproxyConflicts = computed(() => {
        if (!ctx.tproxy.value.enabled) return [];
        const conflicts = [];
        const markIssues = tproxyMarkIssues.value;
        if (markIssues.length > 0) {
            conflicts.push({
                key: 'mark_guard',
                label: 'Mark / Route Mark 配置异常',
                desc: markIssues[0],
                fix: () => {
                    resetTproxyMarksSafe();
                },
                fixLabel: '恢复默认 111/112',
            });
        }
        if (ctx.tun.value.enabled) {
            conflicts.push({
                key: 'tun',
                label: 'TUN 模式已启用',
                desc: 'TProxy 和 TUN 模式会同时接管系统路由，导致流量重复处理或回环。建议只选择其中一种透明代理方式。',
                fix: () => {
                    ctx.tun.value.enabled = false;
                },
                fixLabel: '自动关闭 TUN',
            });
        }
        if (ctx.tun.value.enabled && ctx.tun.value.auto_route) {
            conflicts.push({
                key: 'tun_auto_route',
                label: 'TUN auto_route 已启用',
                desc: 'auto_route 自动接管系统路由表，与 TProxy 的 fwmark 策略路由冲突，会导致出站流量循环。',
                fix: () => {
                    ctx.tun.value.auto_route = false;
                },
                fixLabel: '关闭 auto_route',
            });
        }
        if (ctx.tun.value.enabled && ctx.tun.value.strict_route) {
            conflicts.push({
                key: 'tun_strict_route',
                label: 'TUN strict_route 已启用',
                desc: 'strict_route 会拦截未匹配路由的流量并丢弃，干扰 TProxy 的 fwmark 标记流量正常转发。',
                fix: () => {
                    ctx.tun.value.strict_route = false;
                },
                fixLabel: '关闭 strict_route',
            });
        }
        if (ctx.tun.value.enabled && ctx.tun.value.auto_redirect) {
            conflicts.push({
                key: 'tun_auto_redirect',
                label: 'TUN auto_redirect 已启用',
                desc: 'auto_redirect 通过 iptables/nftables REDIRECT 接管 TCP 流量，与 TProxy 的 TPROXY target 双重处理同一流量，造成冲突。',
                fix: () => {
                    ctx.tun.value.auto_redirect = false;
                },
                fixLabel: '关闭 auto_redirect',
            });
        }
        return conflicts;
    });

    const showTproxyConflictModal = (conflicts) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.zIndex = '2000';

        let fixedCount = 0;
        const total = conflicts.length;

        const renderConflicts = () => conflicts.map((conflict, index) => `
            <div id="conflict-item-${index}" style="margin-bottom:12px;padding:12px;background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                    <i class="fas fa-exclamation-triangle" style="color:#ef4444;font-size:13px;"></i>
                    <span style="font-weight:800;color:#991b1b;font-size:13px;">${conflict.label}</span>
                </div>
                <p style="font-size:12px;color:#b91c1c;line-height:1.6;margin:0 0 8px;">${conflict.desc}</p>
                <button data-fix="${index}" class="fix-btn" style="font-size:12px;font-weight:700;background:#ef4444;color:#fff;border:none;padding:6px 14px;border-radius:8px;cursor:pointer;transition:background .2s;">${conflict.fixLabel}</button>
            </div>
        `).join('');

        const getFooterHtml = (allFixed) => allFixed
            ? '<button id="tproxy-conflict-done" style="padding:9px 24px;border-radius:8px;border:none;background:#10b981;color:#fff;font-size:13px;font-weight:700;cursor:pointer;"><i class="fas fa-check" style="margin-right:6px;"></i>全部已修复，关闭</button>'
            : '<button id="tproxy-conflict-cancel" style="padding:9px 20px;border-radius:8px;border:1px solid #d1d5db;background:#f9fafb;color:#374151;font-size:13px;font-weight:700;cursor:pointer;">取消（关闭 TProxy）</button><button id="tproxy-conflict-ignore" style="padding:9px 20px;border-radius:8px;border:none;background:#4f46e5;color:#fff;font-size:13px;font-weight:700;cursor:pointer;">忽略，继续启用</button>';

        overlay.innerHTML = `
            <div id="conflict-box" style="background:#fff;border-radius:16px;padding:28px;width:95%;max-width:520px;box-shadow:0 20px 60px rgba(0,0,0,.25);max-height:88vh;overflow-y:auto;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <i class="fas fa-exclamation-circle" style="color:#ef4444;font-size:20px;"></i>
                        <h3 style="font-size:16px;font-weight:800;color:#1f2937;margin:0;">TProxy 冲突检测</h3>
                    </div>
                    <span id="conflict-counter" style="font-size:12px;font-weight:700;color:#ef4444;background:#fef2f2;padding:3px 10px;border-radius:20px;border:1px solid #fca5a5;">待修复 ${total} 项</span>
                </div>
                <p style="font-size:13px;color:#6b7280;margin-bottom:18px;line-height:1.6;">开启 TProxy 后检测到以下冲突，建议逐项修复。也可忽略直接启用（可能导致功能异常）。</p>
                <div id="conflict-list">${renderConflicts()}</div>
                <div id="conflict-footer" style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;padding-top:16px;border-top:1px solid #e5e7eb;">
                    ${getFooterHtml(false)}
                </div>
            </div>`;

        document.body.appendChild(overlay);

        const updateFooter = () => {
            const allFixed = fixedCount >= total;
            document.getElementById('conflict-footer').innerHTML = getFooterHtml(allFixed);
            const counter = document.getElementById('conflict-counter');
            const remaining = total - fixedCount;
            if (allFixed) {
                counter.textContent = '✓ 全部已修复';
                counter.style.color = '#065f46';
                counter.style.background = '#ecfdf5';
                counter.style.borderColor = '#6ee7b7';
            } else {
                counter.textContent = `待修复 ${remaining} 项`;
            }
            bindFooterButtons();
        };

        const bindFooterButtons = () => {
            const cancelBtn = document.getElementById('tproxy-conflict-cancel');
            const ignoreBtn = document.getElementById('tproxy-conflict-ignore');
            const doneBtn = document.getElementById('tproxy-conflict-done');
            if (cancelBtn) cancelBtn.onclick = () => {
                overlay.remove();
                ctx.tproxy.value.enabled = false;
            };
            if (ignoreBtn) ignoreBtn.onclick = () => overlay.remove();
            if (doneBtn) doneBtn.onclick = () => overlay.remove();
        };

        overlay.querySelectorAll('.fix-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.fix, 10);
                conflicts[index].fix();
                fixedCount++;
                const item = document.getElementById(`conflict-item-${index}`);
                if (item) {
                    item.style.background = '#f0fdf4';
                    item.style.borderColor = '#86efac';
                    btn.textContent = '✓ 已修复';
                    btn.style.background = '#10b981';
                    btn.style.cursor = 'default';
                    btn.disabled = true;
                }
                updateFooter();
            });
        });

        bindFooterButtons();
    };

    watch(() => ctx.tproxy.value.enabled, (newVal) => {
        if (newVal) {
            nextTick(() => {
                const conflicts = tproxyConflicts.value;
                if (conflicts.length > 0) {
                    showTproxyConflictModal(conflicts);
                }
            });
        }
    });

    const generatedNft = computed(() => {
        if (!ctx.tproxy.value.enabled) return '';
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
        } = ctx.tproxy.value;

        const enableDnsHijack = !!ctx.settings.value.hijack_dns;
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

        const fakeip4Range = (ctx.fakeip.value.enabled && ctx.fakeip.value.inet4_range) ? ctx.fakeip.value.inet4_range.trim() : '';
        const fakeip6Range = (ctx.fakeip.value.enabled && ctx.fakeip.value.inet6_range) ? ctx.fakeip.value.inet6_range.trim() : '';

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
    });

    const generatedNftClean = computed(() => {
        if (!generatedNft.value) return '';
        return generatedNft.value
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
    });

    const nftCopyText = ref('复制 .nft');
    const nftCopyIcon = ref('fas fa-copy');

    const copyNft = async () => {
        nftCopyIcon.value = 'fas fa-spinner fa-spin';
        const ok = await ctx.copyToClipboard(generatedNftClean.value);
        setTimeout(() => {
            if (ok) {
                nftCopyIcon.value = 'fas fa-check';
                nftCopyText.value = '已复制';
                ctx.showToast('NFTables 规则已复制（纯净版）', 'ok');
            } else {
                nftCopyIcon.value = 'fas fa-times';
                nftCopyText.value = '复制失败';
            }
            setTimeout(() => {
                nftCopyIcon.value = 'fas fa-copy';
                nftCopyText.value = '复制 .nft';
            }, 2000);
        }, 300);
    };

    const downloadNft = () => {
        const blob = new Blob([generatedNftClean.value], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${ctx.tproxy.value.nft_table || 'singbox'}.nft`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    Object.assign(ctx, {
        normalizeExtraInbound,
        buildExtraInbounds,
        extraInbounds,
        addExtraInbound,
        removeExtraInbound,
        onExtraInboundTypeChange,
        onExtraInboundSocksVersionChange,
        resetExtraInboundTls,
        tproxyMarkIssues,
        sanitizeTproxyMarks,
        resetTproxyMarksSafe,
        tproxyConflicts,
        generatedNft,
        generatedNftClean,
        nftCopyText,
        nftCopyIcon,
        copyNft,
        downloadNft,
    });
}
