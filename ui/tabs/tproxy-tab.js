import { createInjectedComponent } from './create-injected-component.js';

export const TproxyTab = createInjectedComponent('TproxyTab', `                <div v-show="currentTab==='tproxy'" class="space-y-5">

                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                            <div class="flex items-center gap-2">
                                <div class="stitle mb-0">TProxy 透明代理</div>
                                <span class="badge bg-blue-100 text-blue-700 border border-blue-200">Linux 专用</span>
                            </div>
                            <label class="toggle-switch"><input type="checkbox" v-model="tproxy.enabled"><span class="toggle-slider"></span></label>
                        </div>

                        <div v-if="!tproxy.enabled" class="text-center py-8 text-gray-400">
                            <i class="fas fa-network-wired text-4xl mb-3 block text-gray-300"></i>
                            <p class="text-sm font-semibold">开启后将在 sing-box 配置中生成 tproxy inbound</p>
                            <p class="text-xs mt-1">并在下方生成对应的 NFTables 规则文件</p>
                        </div>

                        <div v-if="tproxy.enabled" class="space-y-5">
                            <div class="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-800 font-medium leading-relaxed">
                                <i class="fas fa-info-circle mr-1.5"></i>
                                TProxy 模式需要 sing-box 以 <code class="bg-blue-100 px-1 rounded">root</code> 或具备 <code class="bg-blue-100 px-1 rounded">CAP_NET_ADMIN</code> 权限的用户运行，并配合 NFTables + 策略路由使用。
                                内核需支持 <code class="bg-blue-100 px-1 rounded">CONFIG_NETFILTER_XT_TARGET_TPROXY</code>。
                            </div>

                            <div v-if="tproxyConflicts.length > 0" class="bg-red-50 border border-red-300 rounded-xl px-4 py-3">
                                <p class="text-xs font-extrabold text-red-800 mb-2"><i class="fas fa-exclamation-triangle mr-1.5"></i>检测到 {{ tproxyConflicts.length }} 个配置冲突</p>
                                <div v-for="c in tproxyConflicts" :key="c.key" class="flex items-center justify-between py-1.5 border-b border-red-200 last:border-0">
                                    <span class="text-xs text-red-700 font-semibold">{{ c.label }}</span>
                                    <button @click="c.fix()" class="text-xs font-bold bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition shrink-0 ml-3">{{ c.fixLabel }}</button>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">TProxy 监听端口</label>
                                    <input type="number" v-model.number="tproxy.listen_port" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-mono focus:bg-white focus:ring-1">
                                </div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">NFTables 表名</label>
                                    <input type="text" v-model="tproxy.nft_table" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-mono focus:bg-white focus:ring-1">
                                </div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">路由标记 Mark (hex/dec) <span class="normal-case font-normal text-gray-300">代理流量</span></label>
                                    <input type="text" v-model="tproxy.mark" @blur="sanitizeTproxyMarks" placeholder="111" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-mono focus:bg-white focus:ring-1">
                                </div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">路由标记 Route Mark (hex/dec) <span class="normal-case font-normal text-gray-300">自身出站</span></label>
                                    <input type="text" v-model="tproxy.route_mark" @blur="sanitizeTproxyMarks" placeholder="112" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-mono focus:bg-white focus:ring-1">
                                    <p class="text-[10px] text-gray-400 mt-1">sing-box 自身出站流量标记，不触发策略路由，需与 proxy mark 不同</p>
                                </div>
                                
                                <div class="col-span-2">
                                    <div v-if="tproxyMarkIssues.length>0" class="bg-red-50 border border-red-300 rounded-xl px-4 py-3">
                                        <p class="text-xs font-black text-red-800 mb-2"><i class="fas fa-exclamation-triangle mr-1.5"></i>Mark 参数检查</p>
                                        <ul class="list-disc pl-5 text-[11px] text-red-700 leading-6">
                                            <li v-for="(msg, midx) in tproxyMarkIssues" :key="'mk-'+midx">{{ msg }}</li>
                                        </ul>
                                        <button @click="resetTproxyMarksSafe" class="mt-2 text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition">
                                            一键恢复 111 / 112
                                        </button>
                                    </div>
                                    <div v-else class="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
                                        <p class="text-[11px] text-emerald-700 font-semibold"><i class="fas fa-check-circle mr-1.5"></i>Mark 检查通过。避免使用保留值 0/253/254/255，且 Mark 与 Route Mark 不可相同。</p>
                                    </div>
                                </div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">sing-box UID <span class="normal-case font-normal text-red-400">★ 强烈建议填写，防 DNS 死循环</span></label>
                                    <input type="text" v-model="tproxy.proxy_uid" placeholder="用 id sing-box 查看" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-mono focus:bg-white focus:ring-1" :class="!tproxy.proxy_uid ? 'border-amber-300' : 'border-gray-300'">
                                    <p class="text-[10px] text-indigo-700 mt-1 font-bold"><i class="fas fa-info-circle mr-1"></i>建议命令：<code class="bg-indigo-50 px-1 rounded">id -u sing-box</code>（无需 sing-box 运行，仅需系统存在该用户）</p>
                                </div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">sing-box GID <span class="normal-case font-normal text-red-400">★ 强烈建议填写，防 DNS 死循环</span></label>
                                    <input type="text" v-model="tproxy.proxy_gid" placeholder="用 id sing-box 查看" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-mono focus:bg-white focus:ring-1" :class="!tproxy.proxy_gid ? 'border-amber-300' : 'border-gray-300'">
                                    <p class="text-[10px] text-indigo-700 mt-1 font-bold"><i class="fas fa-info-circle mr-1"></i>建议命令：<code class="bg-indigo-50 px-1 rounded">id -g sing-box</code>（无需 sing-box 运行，仅需系统存在该用户组）</p>
                                    <p v-if="!tproxy.proxy_uid || !tproxy.proxy_gid" class="text-[10px] text-amber-600 mt-1 font-bold"><i class="fas fa-exclamation-triangle mr-1"></i>未填写时将使用 oifname lo 兜底防回环，需确保已开启 auto_detect_interface，否则仍可能出现 DNS 死循环</p>
                                    <p v-else class="text-[10px] text-emerald-600 mt-1"><i class="fas fa-check-circle mr-1"></i>已启用 skuid/skgid 精准防回环</p>
                                </div>
                                <div class="col-span-2">
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">DNS 接管方式</label>
                                    <select v-model="tproxy.dns_hijack_mode" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-mono focus:bg-white focus:ring-1">
                                        <option value="tproxy">53 直接进入 TProxy（推荐）</option>
                                        <option value="nat">NAT DNAT 到 dns-in（兼容旧方案）</option>
                                    </select>
                                    <p class="text-[10px] text-gray-400 mt-1">
                                        {{ tproxy.dns_hijack_mode === 'nat'
                                            ? '将生成 dns-in + DNS NAT 规则（53 -> dns-in 端口）'
                                            : '不生成 DNS NAT，53 端口直接进入 tproxy-in' }}
                                    </p>
                                </div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">入站接口</label>
                                    <input type="text" v-model.trim="tproxy.ingress_iface" placeholder="br-lan / eth0" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-mono focus:bg-white focus:ring-1">
                                    <p class="text-[10px] text-gray-400 mt-1">仅处理来自此接口的入站/转发流量。留空则处理所有入站接口。路由常见为 br-lan，单网卡主机可留空或填写实际网卡名，比如 eth0。</p>
                                </div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">出口接口</label>
                                    <input type="text" v-model.trim="tproxy.egress_iface" placeholder="pppoe-wan / eth0" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-mono focus:bg-white focus:ring-1">
                                    <p class="text-[10px] text-gray-400 mt-1">仅对最终从此接口发出的本机流量应用 output 标记。留空表示不限制本机出口接口，所有本机出口流量都可能参与 output 标记，可能影响 Docker、VPN、隧道等虚拟接口。通常建议填写实际的物理/WAN 出口接口，如 pppoe-wan、eth0、enp1s0。</p>
                                </div>

                                <div v-if="!tproxy.egress_iface.trim()" class="col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                                    <span class="font-semibold">出口接口未填写：</span>当前将不限制本机出口接口，所有本机出口流量都可能参与 output 标记，可能影响 Docker、WireGuard、Tailscale、OpenVPN 等虚拟/隧道接口。通常建议填写实际的 WAN/物理出口接口，如 <code class="font-mono">pppoe-wan</code>、<code class="font-mono">eth0</code>、<code class="font-mono">enp1s0</code>。
                                </div>
                                <div v-if="tproxy.ingress_iface.trim() && tproxy.egress_iface.trim() && tproxy.ingress_iface.trim() === tproxy.egress_iface.trim()" class="col-span-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs leading-5 text-sky-800">
                                    <span class="font-semibold">单网卡场景提示：</span>当前入站接口与出口接口相同，通常见于单网卡主机、VPS 或仅代理本机流量的部署，属于正常配置。生成器会自动保留 <code class="font-mono">lo</code> 回注路径，确保本机 output 流量经策略路由回注后仍可进入 TProxy。若部署在软路由上，通常应改为“入站接口 = LAN/bridge（如 <code class="font-mono">br-lan</code>），出口接口 = WAN/默认路由接口（如 <code class="font-mono">pppoe-wan</code> / <code class="font-mono">eth0</code>）”。
                                </div>
                                <div v-if="tproxy.dns_hijack_mode === 'nat'" class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">sing-box DNS 入站端口 <span class="text-indigo-400 normal-case font-normal">(dns-in)</span></label>
                                    <input type="number" v-model.number="tproxy.dns_port" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-mono focus:bg-white focus:ring-1">
                                    <p class="text-[10px] text-gray-400 mt-1">仅 NAT 模式使用：nft 将 53 DNAT 到该端口</p>
                                </div>
                            </div>
                            <label class="flex items-center gap-3 cursor-pointer px-4 py-3 mt-4 rounded-xl border transition-colors"
                                   :class="settings.auto_detect_interface ? 'bg-teal-50 border-teal-200 hover:border-teal-300' : 'bg-gray-50 border-gray-200 hover:border-teal-300'">
                                <input type="checkbox" v-model="settings.auto_detect_interface" class="w-4 h-4 text-teal-600 rounded shrink-0">
                                <div class="flex-1">
                                    <span class="block text-sm font-extrabold"
                                          :class="settings.auto_detect_interface ? 'text-teal-800' : 'text-gray-700'">
                                        自动检测出口接口 (auto_detect_interface)
                                    </span>
                                    <span class="block text-xs mt-0.5 text-gray-400">
                                        TProxy 防环路的主要机制：开启后 sing-box 出站连接自动绑定物理网卡，不走策略路由表，避免代理流量被再次拦截。<strong class="text-teal-700">TProxy 模式下必须开启。</strong>
                                    </span>
                                </div>
                            </label>
                            <div class="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <label class="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white transition">
                                    <input type="checkbox" v-model="tproxy.bypass_private" class="w-4 h-4 text-blue-600 rounded">
                                    <div><span class="block text-sm font-bold text-gray-700">绕过私有地址</span><span class="block text-xs text-gray-400">10.x / 192.168.x / 127.x 等直连</span></div>
                                </label>
                                <label class="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white transition">
                                    <input type="checkbox" v-model="tproxy.ipv6" class="w-4 h-4 text-blue-600 rounded">
                                    <div><span class="block text-sm font-bold text-gray-700">启用 IPv6 规则</span><span class="block text-xs text-gray-400">生成对应 ip6 规则链</span></div>
                                </label>
                                <label class="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white transition col-span-2">
                                    <input type="checkbox" v-model="tproxy.udp_fragment" class="w-4 h-4 text-blue-600 rounded">
                                    <div><span class="block text-sm font-bold text-gray-700">启用 UDP 分片 <code class="text-[11px] font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 ml-1">udp_fragment</code></span><span class="block text-xs text-gray-400">QUIC / Hysteria2 / TUIC 等基于 UDP 的协议必须开启，否则大包传输会丢失</span></div>
                                </label>
                            </div>

                            <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <p class="text-xs font-black text-amber-800 mb-2"><i class="fas fa-terminal mr-1.5"></i>策略路由（加载 NFT 规则后在 Shell 中执行）</p>
                                <pre class="text-xs font-mono text-amber-900 bg-amber-100 rounded-lg p-3 select-all leading-relaxed">ip rule add fwmark {{ tproxy.mark || '111' }} lookup {{ tproxy.mark || '111' }}
ip route add local 0.0.0.0/0 dev lo table {{ tproxy.mark || '111' }}{{ tproxy.ipv6 ? '\\nip -6 rule add fwmark ' + (tproxy.mark||'111') + ' lookup ' + (tproxy.mark||'111') + '\\nip -6 route add local ::/0 dev lo table ' + (tproxy.mark||'111') : '' }}</pre>
                                <p class="text-[10px] text-amber-700 mt-2">这两条命令在重启后失效，建议写入 <code>/etc/network/interfaces</code> 或 systemd 服务。路由表号与 fwmark 值保持一致，方便排查。</p>
                            </div>
                            <div v-if="tproxy.dns_hijack_mode==='tproxy' && settings.hijack_dns" class="mt-4 bg-rose-50 border-2 border-rose-300 rounded-xl p-4 shadow-sm">
                                <p class="text-xs font-black text-rose-800 mb-2"><i class="fas fa-exclamation-triangle mr-1.5"></i>DNS 53 直接进入 tproxy-in：注意事项</p>
                                <ul class="text-[11px] text-rose-700 leading-6 list-disc pl-5">
                                    <li>sing-box 需具备 <code class="bg-rose-100 px-1 rounded">CAP_NET_BIND_SERVICE</code>（建议同时具备 <code class="bg-rose-100 px-1 rounded">CAP_NET_ADMIN</code> / <code class="bg-rose-100 px-1 rounded">CAP_NET_RAW</code>）。</li>
                                    <li>开启示例：<code class="bg-rose-100 px-1 rounded">sudo systemctl edit sing-box</code>，在 <code class="bg-rose-100 px-1 rounded">[Service]</code> 中添加 <code class="bg-rose-100 px-1 rounded">AmbientCapabilities=CAP_NET_ADMIN CAP_NET_RAW CAP_NET_BIND_SERVICE</code> 与 <code class="bg-rose-100 px-1 rounded">CapabilityBoundingSet=CAP_NET_ADMIN CAP_NET_RAW CAP_NET_BIND_SERVICE</code>，然后执行 <code class="bg-rose-100 px-1 rounded">sudo systemctl daemon-reload && sudo systemctl restart sing-box</code>。</li>
                                    <li>建议开启 <code class="bg-rose-100 px-1 rounded">net.ipv4.ip_nonlocal_bind=1</code>（如使用 IPv6 同时开启 <code class="bg-rose-100 px-1 rounded">net.ipv6.ip_nonlocal_bind=1</code>）。</li>
                                    <li>必须执行上方 fwmark 策略路由命令，且 mark/table 与 NFT、sing-box 保持一致。</li>
                                    <li>此模式不会生成 <code class="bg-rose-100 px-1 rounded">dns-in</code> 与 DNS NAT 规则，请勿再手动追加 DNAT 53。</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div v-if="tproxy.enabled" class="bg-[#1e1e1e] rounded-xl border border-gray-700 overflow-hidden shadow-xl">
                        <div class="bg-[#2d2d2d] px-5 py-3 flex justify-between items-center border-b border-[#3d3d3d]">
                            <span class="text-gray-200 font-mono text-sm font-bold"><i class="fas fa-file-code mr-2 text-blue-400"></i>{{ tproxy.nft_table || 'singbox' }}.nft</span>
                            <div class="flex gap-2">
                                <button @click="copyNft" class="text-xs bg-[#3d3d3d] hover:bg-indigo-600 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5">
                                    <i :class="nftCopyIcon"></i>{{ nftCopyText }}
                                </button>
                                <button @click="downloadNft" class="text-xs bg-[#3d3d3d] hover:bg-emerald-700 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5">
                                    <i class="fas fa-download"></i>下载 .nft
                                </button>
                            </div>
                        </div>
                        <div class="overflow-y-auto max-h-[480px] dark-scroll">
                            <pre class="p-5 text-[12px] font-mono leading-relaxed text-[#9cdcfe] whitespace-pre-wrap break-words">{{ generatedNft }}</pre>
                        </div>
                    </div>

                </div>
`);
