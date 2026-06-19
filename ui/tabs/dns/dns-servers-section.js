export const dnsServersTemplate = `<div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div class="flex justify-between items-center mb-4">
                            <div class="flex items-center gap-2">
                                <div class="stitle mb-0">DNS 服务器</div>
                                <span class="badge bg-emerald-100 text-emerald-700 border border-emerald-200">新格式</span>
                            </div>
                            <div class="flex gap-2">
                                <button @click="addBootstrapDns" class="text-xs bg-violet-50 text-violet-700 px-3 py-1.5 rounded-lg hover:bg-violet-100 border border-violet-200 font-bold transition" title="添加一条 UDP 类型的纯 IP DNS，专供其他 DoH/DoT 服务器用作 domain_resolver，避免循环解析"><i class="fas fa-anchor mr-1"></i>添加 Bootstrap DNS</button>
                                <button @click="addDns" class="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 border border-indigo-200 font-bold transition"><i class="fas fa-plus mr-1"></i>添加</button>
                            </div>
                        </div>
                        <div class="space-y-3">
                            <div class="grid grid-cols-12 gap-2 items-center px-1 mb-1">
                                <div class="col-span-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">标签</div>
                                <div class="col-span-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">类型</div>
                                <div class="col-span-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">服务器地址</div>
                                <div class="col-span-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">域名解析器</div>
                                <div class="col-span-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">出站 detour</div>
                                <div class="col-span-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">端口</div>
                                <div class="col-span-1"></div>
                            </div>
                            <div v-for="(dns,idx) in dnsList" :key="idx" @focusin.capture="queueJsonScrollToTarget('dns-server', dns, $event)" @input.capture="queueJsonScrollToTarget('dns-server', dns, $event)" @change.capture="queueJsonScrollToTarget('dns-server', dns, $event)" class="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors">
                                <div class="grid grid-cols-12 gap-2 items-center">
                                    <input v-model="dns.tag" placeholder="标签" class="col-span-2 px-2.5 py-1.5 text-xs border rounded-md outline-none bg-white font-bold text-indigo-700">
                                    <select v-model="dns.type" class="col-span-2 px-1.5 py-1.5 text-xs border rounded-md outline-none bg-white font-semibold text-gray-700">
                                        <option value="tls">DoT</option><option value="https">DoH</option><option value="udp">UDP</option>
                                        <option value="tcp">TCP</option><option value="quic">DoQ</option><option value="h3">DoH3</option><option value="local">本地</option>
                                    </select>
                                    <input v-if="dns.type!=='local'" v-model="dns.server" placeholder="IP或域名" class="col-span-3 px-2.5 py-1.5 text-xs border rounded-md outline-none bg-white font-mono">
                                    <div v-else class="col-span-3 text-xs text-gray-400 italic px-2.5 py-1.5 bg-gray-100 rounded-md border border-dashed border-gray-300 text-center">使用系统 DNS</div>
                                    <select v-if="['tls','https','quic','h3'].includes(dns.type)" v-model="dns.domain_resolver" class="col-span-2 px-2 py-1.5 text-xs border rounded-md outline-none bg-white text-violet-700 font-semibold">
                                        <option value="">不指定</option>
                                        <option v-for="tag in allDnsTags.filter(tag=>tag!==dns.tag)" :value="tag">{{ tag }}</option>
                                    </select>
                                    <div v-else class="col-span-2 text-[10px] text-gray-300 text-center italic py-1.5">通常不需要</div>
                                    <select v-model="dns.detour" class="col-span-2 px-2 py-1.5 text-xs border rounded-md outline-none bg-white font-semibold" :class="dns.detour?'text-indigo-700':'text-gray-400'">
                                        <option value="">默认出站</option>
                                        <option v-for="tag in availableOutboundTags.filter(t=>t!=='direct')" :value="tag">{{ tag }}</option>
                                    </select>
                                    <input v-if="dns.type!=='local'" v-model="dns.server_port" type="text" placeholder="默认" class="col-span-1 px-2 py-1.5 text-xs border rounded-md outline-none bg-white font-mono text-center">
                                    <div v-else class="col-span-1 text-[10px] text-gray-300 text-center italic py-1.5">-</div>
                                    <button @click="removeDns(idx)" class="col-span-1 flex justify-center text-red-400 hover:text-white hover:bg-red-500 p-1.5 rounded-md transition-colors"><i class="fas fa-trash-alt text-xs"></i></button>
                                </div>
                                <details v-if="dns.type!=='local'" class="mt-3 group">
                                    <summary class="flex items-center gap-2 cursor-pointer select-none px-3 py-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-xs font-bold text-gray-500">
                                        <i class="fas fa-chevron-right group-open:rotate-90 transition-transform text-[10px]"></i>
                                        <i class="fas fa-satellite-dish text-violet-400 mr-0.5"></i>DNS 高级选项
                                        <span v-if="dns.client_subnet||dns.path||dns.headers_text||dns.bind_interface||dns.inet4_bind_address||dns.inet6_bind_address||dns.routing_mark||dns.reuse_addr||dns.netns||dns.connect_timeout||dns.network_strategy||dns.network_type||dns.fallback_network_type||dns.fallback_delay||dns.domain_strategy" class="ml-auto badge bg-violet-100 text-violet-700 border border-violet-200">已配置</span>
                                    </summary>
                                    <div class="mt-2 p-3 bg-white rounded-lg border border-gray-200 space-y-3">
                                        <div class="text-[10px] font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2">
                                            这里是 DNS server 的拨号与解析细节。常见情况只需要 <code>server</code>、<code>server_port</code> 和必要时的 <code>domain_resolver</code>。
                                        </div>
                                        <div class="grid grid-cols-2 gap-3">
                                            <div>
                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">域名策略 (Domain Strategy)</label>
                                                <select v-model="dns.domain_strategy" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                                    <option value="">默认</option>
                                                    <option value="prefer_ipv4">prefer_ipv4</option>
                                                    <option value="prefer_ipv6">prefer_ipv6</option>
                                                    <option value="ipv4_only">ipv4_only</option>
                                                    <option value="ipv6_only">ipv6_only</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">连接超时 (Connect Timeout)</label>
                                                <input v-model="dns.connect_timeout" placeholder="5s" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                                                <p class="mt-1 text-[10px] font-medium text-gray-500">最常见的高级项之一；限制连接上游 DNS 服务器的等待时间。</p>
                                            </div>
                                            <div>
                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">客户端子网 (Client Subnet)</label>
                                                <input v-model="dns.client_subnet" placeholder="1.2.3.0/24" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                                                <p class="mt-1 text-[10px] font-medium text-gray-500">向上游 DNS 显式携带客户端网段，常见于地理位置优化场景。</p>
                                            </div>
                                            <div>
                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">绑定接口 (Bind Interface)</label>
                                                <input v-model="dns.bind_interface" placeholder="eth0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                                                <p class="mt-1 text-[10px] font-medium text-gray-500">多网卡或策略路由场景更常见。</p>
                                            </div>
                                            <div>
                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">IPv4 绑定地址 (IPv4 Bind Address)</label>
                                                <input v-model="dns.inet4_bind_address" placeholder="192.168.1.10" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                                                <p class="mt-1 text-[10px] font-medium text-gray-500">显式绑定本地 IPv4 出口地址。</p>
                                            </div>
                                            <div>
                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">IPv6 绑定地址 (IPv6 Bind Address)</label>
                                                <input v-model="dns.inet6_bind_address" placeholder="2001:db8::10" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                                                <p class="mt-1 text-[10px] font-medium text-gray-500">显式绑定本地 IPv6 出口地址。</p>
                                            </div>
                                            <div>
                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">网络策略 (Network Strategy)</label>
                                                <select v-model="dns.network_strategy" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                                    <option value="">默认</option>
                                                    <option value="default">default</option>
                                                    <option value="hybrid">hybrid</option>
                                                </select>
                                                <p class="mt-1 text-[10px] font-medium text-gray-500">更常见于 Android / Apple 图形客户端的多网络选择场景。</p>
                                            </div>
                                            <div>
                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">网络类型 (Network Type)</label>
                                                <input v-model="dns.network_type" placeholder="wifi,cellular" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                                                <p class="mt-1 text-[10px] font-medium text-gray-500">通常配合 <code>network_strategy</code> 使用，如 <code>wifi</code> / <code>cellular</code>。</p>
                                            </div>
                                            <div>
                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">回退网络类型 (Fallback Network Type)</label>
                                                <input v-model="dns.fallback_network_type" placeholder="ethernet,other" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                                                <p class="mt-1 text-[10px] font-medium text-gray-500">当首选网络类型不可用时的候选类型列表。</p>
                                            </div>
                                            <div>
                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">回退延迟 (Fallback Delay)</label>
                                                <input v-model="dns.fallback_delay" placeholder="300ms" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                                                <p class="mt-1 text-[10px] font-medium text-gray-500">仅在配置了 <code>network_strategy</code> 或其它回退策略时更有意义。</p>
                                            </div>
                                            <div>
                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">路由标记 (Routing Mark)</label>
                                                <input v-model="dns.routing_mark" placeholder="255 / 0xff" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                                                <p class="mt-1 text-[10px] font-medium text-amber-700">Linux only；常见于 fwmark / policy routing。</p>
                                            </div>
                                            <div>
                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">地址复用 (Reuse Address)</label>
                                                <label class="mt-0.5 flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" v-model="dns.reuse_addr" class="w-4 h-4 text-violet-600 rounded">
                                                    <span class="text-xs font-bold text-gray-700">启用 <span class="text-gray-400 font-normal">(reuse_addr)</span></span>
                                                </label>
                                                <p class="mt-1 text-[10px] font-medium text-gray-500">底层 socket 复用选项，通常仅在特殊端口占用/重启场景才需要。</p>
                                            </div>
                                            <div>
                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">网络命名空间 (NetNS)</label>
                                                <input v-model="dns.netns" placeholder="singbox" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                                                <p class="mt-1 text-[10px] font-medium text-amber-700">Linux only；指定网络命名空间。</p>
                                            </div>
                                        </div>
                                        <div v-if="['https','h3'].includes(dns.type)" class="pt-3 border-t border-gray-200 space-y-3">
                                            <div class="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">请求路径 (HTTP Path)</label>
                                                    <input v-model="dns.path" placeholder="/dns-query" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                                                    <p class="mt-1 text-[10px] font-medium text-gray-500">仅对 DoH / DoH3 这类 HTTP 风格 DNS 有意义。</p>
                                                </div>
                                                <div></div>
                                            </div>
                                            <div>
                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">HTTP 头 (HTTP Headers)</label>
                                                <textarea v-model="dns.headers_text" rows="3" placeholder="Accept: application/dns-message&#10;X-Client: sing-box" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white resize-none focus:ring-1"></textarea>
                                                <p class="mt-1 text-[10px] font-medium text-gray-500">仅对 DoH / DoH3 有意义；每行一条 <code>Key: Value</code>。</p>
                                            </div>
                                        </div>
                                        <div class="pt-3 border-t border-gray-200 text-[10px] font-medium text-gray-500 bg-violet-50/60 rounded-lg px-3 py-2">
                                            目前仍未突出展示的低频项主要是 <code>tcp_fast_open</code>、<code>tcp_multi_path</code>、<code>udp_fragment</code>；其余 DNS 常见拨号策略项已恢复到上面的高级区。
                                        </div>
                                    </div>
                                </details>
                            </div>
                        </div>
                        <div class="mt-4 pt-4 border-t border-gray-100 bg-indigo-50/50 p-3 rounded-lg space-y-3">
                            <div class="flex flex-wrap gap-5">
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" v-model="settings.independent_cache" class="w-4 h-4 text-indigo-600 rounded">
                                    <span class="text-sm text-gray-700 font-medium">独立缓存 <span class="text-gray-400 text-xs font-normal">(FakeIP 推荐，开启时自动勾选)</span></span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" v-model="settings.reverse_mapping" class="w-4 h-4 text-indigo-600 rounded">
                                    <span class="text-sm text-gray-700 font-medium">反向映射 (reverse_mapping)</span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" v-model="settings.dns_disable_cache" class="w-4 h-4 text-indigo-600 rounded">
                                    <span class="text-sm text-gray-700 font-medium">禁用 DNS 缓存 (disable_cache)</span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" v-model="settings.dns_disable_expire" class="w-4 h-4 text-indigo-600 rounded">
                                    <span class="text-sm text-gray-700 font-medium">禁止过期应答 (disable_expire)</span>
                                </label>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">客户端子网 <span class="normal-case font-normal text-gray-300">(dns.client_subnet)</span></label>
                                    <input v-model="settings.dns_client_subnet" placeholder="1.2.3.0/24" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none font-mono focus:ring-1">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">缓存容量 <span class="normal-case font-normal text-gray-300">(cache_capacity)</span></label>
                                    <input type="number" v-model.number="settings.dns_cache_capacity" min="0" placeholder="1024" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-mono focus:ring-1">
                                </div>
                            </div>
                        </div>
                    </div>`;
