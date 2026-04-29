import { createInjectedComponent } from './create-injected-component.js';

export const TunTab = createInjectedComponent('TunTab', `                <div v-show="currentTab==='tun'" class="space-y-5">
                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm" @focusin.capture="queueJsonScrollToTarget('inbound', { tag: 'tun-in' }, $event)" @input.capture="queueJsonScrollToTarget('inbound', { tag: 'tun-in' }, $event)" @change.capture="queueJsonScrollToTarget('inbound', { tag: 'tun-in' }, $event)">
                        <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                            <div class="flex items-center gap-2">
                                <div class="stitle mb-0">TUN 模式</div>
                                <span class="badge bg-purple-100 text-purple-700 border border-purple-200">透明代理</span>
                                <span v-if="tun.enabled && tun.non_gateway_mode" class="badge bg-amber-100 text-amber-700 border border-amber-200"><i class="fas fa-sitemap mr-1"></i>非默认网关模式</span>
                            </div>
                            <label class="toggle-switch"><input type="checkbox" v-model="tun.enabled"><span class="toggle-slider"></span></label>
                        </div>
                        <div v-if="tun.enabled" class="space-y-4">
                            <p class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 font-medium">
                                <i class="fas fa-exclamation-triangle mr-1.5"></i>注意 v1.12 格式使用 <code>address</code> 数组，旧版的 <code>inet4_address</code> 参数已废弃。
                            </p>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">接口名称 (Interface Name)</label>
                                    <input v-model="tun.interface_name" placeholder="tun0" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:bg-white focus:ring-1 font-mono">
                                    <p class="mt-1 text-[10px] font-medium text-gray-500">生成的 TUN 设备名称，常见如 <code>tun0</code>。</p>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">TUN 栈 (TUN Stack)</label>
                                    <select v-model="tun.stack" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:bg-white focus:ring-1">
                                        <option value="system">system (推荐)</option><option value="gvisor">gvisor</option><option value="mixed">mixed</option>
                                    </select>
                                    <p class="mt-1 text-[10px] font-medium text-gray-500">决定 TUN 包处理方式；一般优先用 <code>system</code>。</p>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">IPv4 地址 (IPv4 Address)</label>
                                    <input v-model="tun.address_v4" placeholder="172.19.0.1/30" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono focus:bg-white focus:ring-1">
                                    <p class="mt-1 text-[10px] font-medium text-gray-500">TUN 设备内的 IPv4 地址/CIDR。</p>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">IPv6 地址 (IPv6 Address)</label>
                                    <input v-model="tun.address_v6" placeholder="fdfe:dcba:9876::1/126" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono focus:bg-white focus:ring-1">
                                    <p class="mt-1 text-[10px] font-medium text-gray-500">可选；启用 IPv6 透明代理时更常见。</p>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">MTU (Maximum Transmission Unit)</label>
                                    <input type="number" v-model.number="tun.mtu" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:bg-white focus:ring-1">
                                    <p class="mt-1 text-[10px] font-medium text-gray-500">影响包大小；过大或过小都可能带来性能问题。</p>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">UDP 超时 (UDP Timeout)</label>
                                    <input v-model="tun.udp_timeout" placeholder="5m" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono focus:bg-white focus:ring-1">
                                    <p class="mt-1 text-[10px] font-medium text-gray-500">控制 UDP 会话保持时间，流式 UDP 或长连接场景更敏感。</p>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">回环地址 (Loopback Address)</label>
                                    <input v-model="tun.loopback_address" placeholder="10.7.0.1" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono focus:bg-white focus:ring-1">
                                    <p class="mt-1 text-[10px] font-medium text-gray-500">用于回注或特殊回环流量处理，通常高级场景才需要。</p>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">默认标记 (Default Mark)</label>
                                    <input type="number" v-model.number="settings.default_mark" placeholder="留空则不设置" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:bg-white focus:ring-1">
                                    <p class="mt-1 text-[10px] font-medium text-amber-700">可选 fwmark；更偏 Linux 策略路由场景。</p>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">路由表号 (iproute2 Table Index)</label>
                                    <input type="number" v-model.number="tun.iproute2_table_index" placeholder="2022" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono focus:bg-white focus:ring-1">
                                    <p class="mt-1 text-[10px] font-medium text-amber-700">Linux only；自定义 TUN 使用的策略路由表号。</p>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">规则优先级 (iproute2 Rule Index)</label>
                                    <input type="number" v-model.number="tun.iproute2_rule_index" placeholder="9000" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono focus:bg-white focus:ring-1">
                                    <p class="mt-1 text-[10px] font-medium text-amber-700">Linux only；策略路由规则优先级。</p>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-3">
                                <label v-for="opt in tunOpts" :key="opt.key"
                                    class="flex items-center gap-3 p-3 rounded-lg border transition-colors bg-gray-50 border-gray-200 hover:border-purple-300 cursor-pointer">
                                    <input type="checkbox" v-model="tun[opt.key]" class="w-4 h-4 rounded text-purple-600">
                                    <div>
                                        <span class="block text-sm font-bold text-gray-700">{{ opt.label }}</span>
                                        <span class="block text-xs text-gray-400">{{ opt.desc }}</span>
                                    </div>
                                </label>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">包含接口 (Include Interfaces)</label>
                                    <textarea v-model="tun.include_interface" rows="3" placeholder="eth0&#10;en0" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono focus:bg-white focus:ring-1 resize-none"></textarea>
                                    <p class="mt-1 text-[10px] font-medium text-gray-500">每行一个；仅这些接口进入 TUN 处理。</p>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">排除接口 (Exclude Interfaces)</label>
                                    <textarea v-model="tun.exclude_interface" rows="3" placeholder="docker0&#10;veth*" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono focus:bg-white focus:ring-1 resize-none"></textarea>
                                    <p class="mt-1 text-[10px] font-medium text-gray-500">每行一个；这些接口不会进入 TUN 处理。</p>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">包含应用 (Include Packages)</label>
                                    <textarea v-model="tun.include_package" rows="3" placeholder="com.example.app" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono focus:bg-white focus:ring-1 resize-none"></textarea>
                                    <p class="mt-1 text-[10px] font-medium text-gray-500">移动平台更常见；只让这些包名走 TUN。</p>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">排除应用 (Exclude Packages)</label>
                                    <textarea v-model="tun.exclude_package" rows="3" placeholder="com.apple.WebKit.Networking" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono focus:bg-white focus:ring-1 resize-none"></textarea>
                                    <p class="mt-1 text-[10px] font-medium text-gray-500">移动平台更常见；这些包名不会走 TUN。</p>
                                </div>
                            </div>

                            <div v-if="tun.auto_redirect" class="grid grid-cols-2 gap-4 p-4 rounded-xl border border-indigo-200 bg-indigo-50/50">
                                <div>
                                    <label class="block text-[10px] font-black text-indigo-500 uppercase mb-1 tracking-wider">输入标记 (auto_redirect_input_mark)</label>
                                    <input v-model="tun.auto_redirect_input_mark" placeholder="0x2023" class="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg text-xs outline-none font-mono focus:ring-1">
                                    <p class="mt-1 text-[10px] font-medium text-indigo-700">仅在启用 <code>auto_redirect</code> 时有意义。</p>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-indigo-500 uppercase mb-1 tracking-wider">输出标记 (auto_redirect_output_mark)</label>
                                    <input v-model="tun.auto_redirect_output_mark" placeholder="0x2024" class="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg text-xs outline-none font-mono focus:ring-1">
                                    <p class="mt-1 text-[10px] font-medium text-indigo-700">仅在启用 <code>auto_redirect</code> 时有意义。</p>
                                </div>
                            </div>

                            <label class="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl border transition-colors"
                                   :class="settings.auto_detect_interface ? 'bg-teal-50 border-teal-200 hover:border-teal-300' : 'bg-gray-50 border-gray-200 hover:border-teal-300'">
                                <input type="checkbox" v-model="settings.auto_detect_interface" class="w-4 h-4 text-teal-600 rounded shrink-0">
                                <div class="flex-1">
                                    <span class="block text-sm font-extrabold"
                                          :class="settings.auto_detect_interface ? 'text-teal-800' : 'text-gray-700'">
                                        auto_detect_interface
                                    </span>
                                    <span class="block text-xs mt-0.5 text-gray-400">自动检测出口接口，Tun模式建议开启</span>
                                </div>
                            </label>

                            <div class="border-t border-dashed border-amber-200 pt-4">
                                <label class="flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all"
                                       :class="tun.non_gateway_mode ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-gray-50 hover:border-amber-300'">
                                    <input type="checkbox" v-model="tun.non_gateway_mode" class="w-5 h-5 text-amber-600 rounded shrink-0">
                                    <div>
                                        <span class="block text-sm font-extrabold text-gray-800">非默认网关模式</span>
                                        <span class="block text-xs text-gray-500 mt-0.5">sing-box 不是系统网关时启用（可选）。自动为 direct 出站绑定物理网卡等，防止出口流量回环。</span>
                                    </div>
                                </label>

                                <div v-if="tun.non_gateway_mode" class="mt-4 space-y-4 p-4 bg-amber-50/60 rounded-xl border border-amber-200">
                                    <div class="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800 font-medium">
                                        <i class="fas fa-info-circle mr-1.5"></i>
                                        非默认网关模式场景下，sing-box 的 <code class="bg-blue-100 px-1 rounded">direct</code> 出站绑定物理网卡（如 <code class="bg-blue-100 px-1 rounded">eth0</code>），添加排除的网段，避免直连流量再次进入 tun 接口造成环路。（可选）
                                    </div>

                                    <div>
                                        <label class="block text-[10px] font-black text-amber-700 uppercase mb-1 tracking-wider">
                                            <i class="fas fa-plug mr-1"></i>绑定物理网卡名称 <span class="normal-case font-normal text-gray-500">(direct outbound 的 bind_interface，可选)</span>
                                        </label>
                                        <input type="text" v-model="tun.bind_interface" placeholder="如 eth0 / enp1s0 等，留空不绑定。" class="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm outline-none font-mono focus:ring-2 focus:ring-amber-200">
                                        <p class="text-[10px] text-gray-400 mt-1">可通过 <code>ip link</code> 查看网卡名</p>
                                    </div>

                                    <div>
                                        <label class="block text-[10px] font-black text-amber-700 uppercase mb-1 tracking-wider">
                                            <i class="fas fa-ban mr-1"></i>排除地址列表 <span class="normal-case font-normal text-gray-500">(route_exclude_address，每行一条 CIDR)</span>
                                        </label>
                                        <textarea v-model="tun.route_exclude_address" rows="5"
                                            placeholder="# 内网段（可选，私有地址规则已处理）&#10;# 192.168.0.0/16&#10;# 10.0.0.0/8"
                                            class="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs outline-none font-mono focus:ring-2 focus:ring-amber-200 resize-none leading-relaxed"></textarea>
                                        <p class="text-[10px] text-gray-400 mt-1">支持 <code>#</code> 注释，每行一条 CIDR。内网段通常已由路由规则处理。</p>
                                    </div>

                                    <div class="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-800">
                                        <p class="font-extrabold mb-1"><i class="fas fa-lightbulb mr-1.5"></i>DNS 建议</p>
                                        <p>非默认网关模式使用 TUN 时，DNS 服务器的<strong>出站 detour</strong> 应选择<strong>默认出站</strong>，使 DNS 查询不进入 tun 接口。</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
`);
