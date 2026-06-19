export const nodeDialFieldsTemplate = `                        <div v-if="hasNodeDialOptions(node)" class="mt-3">
                            <details class="group">
                                <summary class="flex items-center gap-2 cursor-pointer select-none px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-xs font-bold text-gray-500">
                                    <i class="fas fa-chevron-right group-open:rotate-90 transition-transform text-[10px]"></i>
                                    <i class="fas fa-network-wired text-emerald-400 mr-0.5"></i>高级拨号选项
                                    <span v-if="hasNodeDialConfig(node)" class="ml-auto badge bg-emerald-100 text-emerald-700 border border-emerald-200">已配置</span>
                                </summary>
                                <div class="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                                    <div class="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                        按协议与当前场景自动筛选，仅显示更可能有效的拨号字段；若某字段已经配置过，仍会继续显示，方便修改。
                                    </div>
                                    <div v-if="nodeHasDetourOverride(node)" class="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                        当前已设置 <code>detour</code>。根据手册，这会让下面大多数拨号字段失去意义，因此它们会被禁用显示。
                                    </div>
                                    <div v-else-if="nodeHasBindingOverride(node)" class="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                        当前已设置接口/地址绑定字段，<code>network_strategy / network_type / fallback_*</code> 通常不再生效，因此会被禁用显示。
                                    </div>
                                    <div class="grid grid-cols-2 gap-3">
                                        <div v-if="isNodeDialFieldVisible(node, 'detour')">
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">出站中转 (Detour)</label>
                                            <select v-model="node.detour" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1 font-semibold" :class="node.detour?'text-emerald-700':'text-gray-400'">
                                                <option value="">默认直连/默认路由</option>
                                                <option v-for="tag in availableOutboundTags.filter(t=>t!=='direct'&&t!==node.tag)" :value="tag">{{ tag }}</option>
                                            </select>
                                            <p class="mt-1 text-[10px] font-medium text-amber-700">改用其它出站拨号；设置后，下方大多数拨号字段通常不再生效。</p>
                                        </div>
                                        <div v-if="isNodeDialFieldVisible(node, 'domain_resolver')">
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">域名解析器 (Domain Resolver)</label>
                                            <select v-model="node.domain_resolver" :disabled="isNodeDialFieldEffectivelyMuted(node, 'domain_resolver')" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1 font-semibold disabled:opacity-40" :class="node.domain_resolver?'text-violet-700':'text-gray-400'">
                                                <option value="">不指定</option>
                                                <option v-for="tag in allDnsTags" :value="tag">{{ tag }}</option>
                                            </select>
                                            <p class="mt-1 text-[10px] font-medium text-violet-700">仅当服务端是域名时通常有意义；如果 <code>server</code> 已是 IP，一般不需要。</p>
                                        </div>
                                        <div v-if="isNodeDialFieldVisible(node, 'connect_timeout')">
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">连接超时 (Connect Timeout)</label>
                                            <input v-model="node.connect_timeout" :disabled="isNodeDialFieldEffectivelyMuted(node, 'connect_timeout')" placeholder="5s" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1 disabled:opacity-40">
                                            <p class="mt-1 text-[10px] font-medium text-gray-500">限制单次连接建立等待时间。</p>
                                        </div>
                                        <div v-if="isNodeDialFieldVisible(node, 'bind_interface')">
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">绑定接口 (Bind Interface)</label>
                                            <input v-model="node.bind_interface" :disabled="isNodeDialFieldEffectivelyMuted(node, 'bind_interface')" placeholder="eth0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1 disabled:opacity-40">
                                            <p class="mt-1 text-[10px] font-medium text-gray-500">绑定物理网卡；常见于多网卡、策略路由或 Linux 场景。</p>
                                        </div>
                                        <div v-if="isNodeDialFieldVisible(node, 'inet4_bind_address')">
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">IPv4 绑定地址 (IPv4 Bind Address)</label>
                                            <input v-model="node.inet4_bind_address" :disabled="isNodeDialFieldEffectivelyMuted(node, 'inet4_bind_address')" placeholder="192.168.1.10" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1 disabled:opacity-40">
                                            <p class="mt-1 text-[10px] font-medium text-gray-500">绑定本地 IPv4 出口地址。</p>
                                        </div>
                                        <div v-if="isNodeDialFieldVisible(node, 'inet6_bind_address')">
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">IPv6 绑定地址 (IPv6 Bind Address)</label>
                                            <input v-model="node.inet6_bind_address" :disabled="isNodeDialFieldEffectivelyMuted(node, 'inet6_bind_address')" placeholder="2001:db8::10" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1 disabled:opacity-40">
                                            <p class="mt-1 text-[10px] font-medium text-gray-500">绑定本地 IPv6 出口地址。</p>
                                        </div>
                                        <div v-if="isNodeDialFieldVisible(node, 'network_strategy')">
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">网络策略 (Network Strategy)</label>
                                            <select v-model="node.network_strategy" :disabled="isNodeDialFieldEffectivelyMuted(node, 'network_strategy')" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1 disabled:opacity-40">
                                                <option value="">默认</option>
                                                <option value="default">default</option>
                                                <option value="hybrid">hybrid</option>
                                                <option value="fallback">fallback</option>
                                            </select>
                                            <p class="mt-1 text-[10px] font-medium text-amber-700">主要对图形客户端 / 移动平台有意义；与 <code>bind_interface</code> 等字段可能冲突。</p>
                                        </div>
                                        <div v-if="isNodeDialFieldVisible(node, 'network_type')">
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">网络类型 (Network Type) <span class="normal-case font-normal text-gray-300">(逗号分隔)</span></label>
                                            <input v-model="node.network_type" :disabled="isNodeDialFieldEffectivelyMuted(node, 'network_type')" placeholder="wifi,cellular" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1 disabled:opacity-40">
                                            <p class="mt-1 text-[10px] font-medium text-gray-500">通常配合 <code>network_strategy</code> 使用，例如 <code>wifi</code> / <code>cellular</code>。</p>
                                        </div>
                                        <div v-if="isNodeDialFieldVisible(node, 'fallback_network_type')">
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">回退网络类型 (Fallback Network Type) <span class="normal-case font-normal text-gray-300">(逗号分隔)</span></label>
                                            <input v-model="node.fallback_network_type" :disabled="isNodeDialFieldEffectivelyMuted(node, 'fallback_network_type')" placeholder="ethernet,other" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1 disabled:opacity-40">
                                            <p class="mt-1 text-[10px] font-medium text-gray-500">仅对 <code>fallback</code> 策略相关。</p>
                                        </div>
                                        <div v-if="isNodeDialFieldVisible(node, 'fallback_delay')" class="col-span-2">
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">回退延迟 (Fallback Delay)</label>
                                            <input v-model="node.fallback_delay" :disabled="isNodeDialFieldEffectivelyMuted(node, 'fallback_delay')" placeholder="300ms" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1 disabled:opacity-40">
                                            <p class="text-[10px] font-medium text-gray-500 mt-1">仅在域名策略 / 网络策略启用回退时有意义。支持的网络类型包括 <code>wifi</code>、<code>cellular</code>、<code>ethernet</code>、<code>other</code>。</p>
                                        </div>
                                        <div v-if="isNodeDialFieldVisible(node, 'routing_mark')">
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">路由标记 (Routing Mark)</label>
                                            <input v-model="node.routing_mark" :disabled="isNodeDialFieldEffectivelyMuted(node, 'routing_mark')" placeholder="255 / 0xff" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1 disabled:opacity-40">
                                            <p class="mt-1 text-[10px] font-medium text-amber-700">Linux only；用于 fwmark / 策略路由。</p>
                                        </div>
                                        <div v-if="isNodeDialFieldVisible(node, 'netns')">
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">网络命名空间 (NetNS)</label>
                                            <input v-model="node.netns" :disabled="isNodeDialFieldEffectivelyMuted(node, 'netns')" placeholder="singbox" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1 disabled:opacity-40">
                                            <p class="mt-1 text-[10px] font-medium text-amber-700">Linux only；指定网络命名空间。</p>
                                        </div>
                                    </div>
                                    <div class="pt-3 border-t border-gray-200 flex flex-wrap gap-4">
                                        <label v-if="isNodeDialFieldVisible(node, 'reuse_addr')" class="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" v-model="node.reuse_addr" :disabled="isNodeDialFieldEffectivelyMuted(node, 'reuse_addr')" class="w-4 h-4 text-emerald-600 rounded disabled:opacity-40">
                                            <span class="text-xs font-bold text-gray-700">地址复用 (Reuse Address)</span>
                                            <span class="text-[10px] font-medium text-gray-500">快速重启或端口复用场景更常见</span>
                                        </label>
                                        <label v-if="isNodeDialFieldVisible(node, 'tcp_fast_open')" class="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" v-model="node.tcp_fast_open" :disabled="isNodeDialFieldEffectivelyMuted(node, 'tcp_fast_open')" class="w-4 h-4 text-emerald-600 rounded disabled:opacity-40">
                                            <span class="text-xs font-bold text-gray-700">TCP 快速打开 (TCP Fast Open)</span>
                                            <span class="text-[10px] font-medium text-amber-700">仅 TCP 协议 / 传输有意义</span>
                                        </label>
                                        <label v-if="isNodeDialFieldVisible(node, 'tcp_multi_path')" class="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" v-model="node.tcp_multi_path" :disabled="isNodeDialFieldEffectivelyMuted(node, 'tcp_multi_path')" class="w-4 h-4 text-emerald-600 rounded disabled:opacity-40">
                                            <span class="text-xs font-bold text-gray-700">TCP 多路径 (TCP MultiPath)</span>
                                            <span class="text-[10px] font-medium text-amber-700">仅 TCP 场景，依赖系统 / 内核支持</span>
                                        </label>
                                        <label v-if="isNodeDialFieldVisible(node, 'udp_fragment')" class="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" v-model="node.udp_fragment" :disabled="isNodeDialFieldEffectivelyMuted(node, 'udp_fragment')" class="w-4 h-4 text-emerald-600 rounded disabled:opacity-40">
                                            <span class="text-xs font-bold text-gray-700">UDP 分片 (UDP Fragment)</span>
                                            <span class="text-[10px] font-medium text-emerald-700">仅 UDP / QUIC / Datagram 场景更有意义</span>
                                        </label>
                                    </div>
                                </div>
                            </details>
                        </div>
`;
