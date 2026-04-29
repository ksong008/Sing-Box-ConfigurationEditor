import { createInjectedComponent } from './create-injected-component.js';

export const DnsTab = createInjectedComponent('DnsTab', `                <div v-show="currentTab==='dns'" class="space-y-5">
                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div class="stitle">基础设置</div>
                        <div class="grid grid-cols-2 gap-4">
                            <div @focusin.capture="queueJsonScrollToTarget('inbound', { tag: 'mixed-in' }, $event)" @input.capture="queueJsonScrollToTarget('inbound', { tag: 'mixed-in' }, $event)" @change.capture="queueJsonScrollToTarget('inbound', { tag: 'mixed-in' }, $event)"><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Mixed 代理端口</label><input type="number" v-model.number="settings.listen_port" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none"></div>
                            <div @focusin.capture="queueJsonScrollToTarget('log-root', null, $event)" @change.capture="queueJsonScrollToTarget('log-root', null, $event)"><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">日志级别</label>
                                <select v-model="settings.log_level" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none">
                                    <option value="trace">Trace</option><option value="debug">Debug</option><option value="info">Info</option><option value="warn">Warn</option><option value="error">Error</option>
                                </select>
                            </div>
                            <div @focusin.capture="queueJsonScrollToTarget('dns-root', null, $event)" @change.capture="queueJsonScrollToTarget('dns-root', null, $event)"><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">DNS 策略</label>
                                <select v-model="settings.dns_strategy" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none">
                                    <option value="ipv4_only">仅 IPv4</option><option value="ipv6_only">仅 IPv6</option><option value="prefer_ipv4">优先 IPv4</option><option value="prefer_ipv6">优先 IPv6</option>
                                </select>
                            </div>
                            <div @focusin.capture="queueJsonScrollToTarget('route-root', null, $event)" @change.capture="queueJsonScrollToTarget('route-root', null, $event)"><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">默认域名解析 <span class="text-indigo-400 normal-case font-normal">(route)</span></label>
                                <select v-model="settings.default_domain_resolver" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-semibold text-indigo-700">
                                    <option value="">不指定</option>
                                    <option v-for="tag in allDnsTags" :value="tag">{{ tag }}</option>
                                </select>
                            </div>
                            <div @focusin.capture="queueJsonScrollToTarget('dns-root', null, $event)" @change.capture="queueJsonScrollToTarget('dns-root', null, $event)"><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">DNS 最终解析器 <span class="text-violet-400 normal-case font-normal">(dns.final)</span></label>
                                <select v-model="settings.dns_final" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-semibold text-violet-700">
                                    <option value="">不指定</option>
                                    <option v-for="tag in allDnsTags" :value="tag">{{ tag }}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                                        <!-- ===== EXTRA_INBOUNDS_PATCH_START ===== -->
                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div class="flex flex-wrap md:flex-nowrap justify-between items-start gap-4 mb-4">
                            <div class="flex-1 min-w-0">
                                <div class="stitle mb-0">额外入站</div>
                                <p class="text-xs text-gray-500 mt-1 pl-3">
                                    新建入站。TLS 为可选项，勾选后才显示证书和私钥路径；SOCKS 仅 version=5 显示 TLS。
                                </p>
                            </div>
                            <div class="flex flex-wrap md:flex-nowrap gap-2 justify-end shrink-0">
                                <button @click="addExtraInbound('http')" class="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 border border-indigo-200 font-bold transition">
                                    <i class="fas fa-plus mr-1"></i>HTTP
                                </button>
                                <button @click="addExtraInbound('socks')" class="text-xs bg-sky-50 text-sky-700 px-3 py-1.5 rounded-lg hover:bg-sky-100 border border-sky-200 font-bold transition">
                                    <i class="fas fa-plus mr-1"></i>SOCKS
                                </button>
                                <button @click="addExtraInbound('direct')" class="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 border border-emerald-200 font-bold transition">
                                    <i class="fas fa-plus mr-1"></i>DIRECT
                                </button>
                            </div>
                        </div>

                        <div v-if="extraInbounds.length === 0" class="text-center text-sm font-bold text-gray-400 py-6 border-2 border-dashed border-gray-200 rounded-xl">
                            暂无额外入站，请点击右上角按钮添加。
                        </div>

                        <div
                            v-for="(inb, idx) in extraInbounds"
                            :key="inb.id"
                            @focusin.capture="queueJsonScrollToTarget('inbound', inb, $event)"
                            @input.capture="queueJsonScrollToTarget('inbound', inb, $event)"
                            @change.capture="queueJsonScrollToTarget('inbound', inb, $event)"
                            class="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-indigo-300 transition-colors shadow-sm mb-4 last:mb-0"
                        >
                            <div class="flex justify-between items-center mb-4">
                                <div class="flex items-center gap-2">
                                    <span class="badge bg-white text-indigo-700 border border-indigo-200">Inbound {{ idx + 1 }}</span>
                                    <span class="text-xs text-gray-500 font-medium">会追加到 inbounds 数组</span>
                                </div>
                                <button
                                    @click="removeExtraInbound(idx)"
                                    class="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 border border-red-200 font-bold transition"
                                >
                                    <i class="fas fa-trash-alt mr-1"></i>删除
                                </button>
                            </div>

                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">类型</label>
                                    <select
                                        v-model="inb.type"
                                        @change="onExtraInboundTypeChange(inb)"
                                        class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-bold text-gray-700 focus:ring-1"
                                    >
                                        <option value="http">HTTP</option>
                                        <option value="socks">SOCKS</option>
                                        <option value="direct">DIRECT</option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">标签</label>
                                    <input
                                        v-model="inb.tag"
                                        placeholder="http-in"
                                        class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-bold text-indigo-700 focus:ring-1"
                                    >
                                </div>

                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">监听地址</label>
                                    <input
                                        v-model="inb.listen"
                                        placeholder="127.0.0.1"
                                        class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-mono focus:ring-1"
                                    >
                                </div>

                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">端口</label>
                                    <input
                                        type="number"
                                        v-model.number="inb.listen_port"
                                        min="1"
                                        max="65535"
                                        placeholder="8080"
                                        class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-mono focus:ring-1"
                                    >
                                </div>

                                <template v-if="inb.type === 'direct'">
                                    <div>
                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">override_address</label>
                                        <input
                                            v-model="inb.override_address"
                                            placeholder="1.1.1.1"
                                            class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-mono focus:ring-1"
                                        >
                                    </div>

                                    <div>
                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">override_port</label>
                                        <input
                                            type="number"
                                            v-model="inb.override_port"
                                            min="1"
                                            max="65535"
                                            placeholder="53"
                                            class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-mono focus:ring-1"
                                        >
                                    </div>
                                </template>

                                <template v-else>
                                    <div>
                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">用户名</label>
                                        <input
                                            v-model="inb.username"
                                            placeholder="admin"
                                            class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-1"
                                        >
                                    </div>

                                    <div>
                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">密码</label>
                                        <input
                                            v-model="inb.password"
                                            type="password"
                                            placeholder="留空表示不启用认证"
                                            class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-mono focus:ring-1"
                                        >
                                    </div>
                                </template>

                                <div v-if="inb.type === 'socks'">
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">SOCKS 版本</label>
                                    <select
                                        v-model="inb.socks_version"
                                        @change="onExtraInboundSocksVersionChange(inb)"
                                        class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-bold text-gray-700 focus:ring-1"
                                    >
                                        <option value="4">4</option>
                                        <option value="4a">4a</option>
                                        <option value="5">5</option>
                                    </select>
                                </div>

                                <div class="col-span-2 flex flex-wrap gap-5 bg-white p-3 rounded-lg border border-gray-200">
                                    <label class="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" v-model="inb.sniff" class="w-4 h-4 text-indigo-600 rounded">
                                        <span class="text-sm font-bold text-gray-700">启用 sniff</span>
                                    </label>

                                    <label
                                        v-if="inb.type === 'http' || (inb.type === 'socks' && inb.socks_version === '5')"
                                        class="flex items-center gap-2 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            v-model="inb.tls"
                                            @change="resetExtraInboundTls(inb)"
                                            class="w-4 h-4 text-indigo-600 rounded"
                                        >
                                        <span class="text-sm font-bold text-gray-700">启用 TLS</span>
                                    </label>

                                    <span
                                        v-if="inb.type === 'socks' && inb.socks_version !== '5'"
                                        class="text-xs text-gray-400 font-semibold"
                                    >
                                        SOCKS 4 / 4a 不显示 TLS
                                    </span>
                                </div>

                                <template v-if="(inb.type === 'http' || (inb.type === 'socks' && inb.socks_version === '5')) && inb.tls">
                                    <div>
                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">证书路径</label>
                                        <input
                                            v-model="inb.tls_cert_path"
                                            placeholder="/etc/sing-box/cert.pem"
                                            class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-mono focus:ring-1"
                                        >
                                    </div>

                                    <div>
                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">私钥路径</label>
                                        <input
                                            v-model="inb.tls_key_path"
                                            placeholder="/etc/sing-box/key.pem"
                                            class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-mono focus:ring-1"
                                        >
                                    </div>
                                </template>

                                <div
                                    v-if="(inb.username && !inb.password) || (!inb.username && inb.password)"
                                    class="col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3"
                                >
                                    <p class="text-xs text-amber-700 font-semibold">
                                        <i class="fas fa-info-circle mr-1.5"></i>用户名和密码需要同时填写，生成 JSON 时才会写入 users。
                                    </p>
                                </div>

                                <div
                                    v-if="(inb.type === 'http' || (inb.type === 'socks' && inb.socks_version === '5')) && inb.tls && (!inb.tls_cert_path || !inb.tls_key_path)"
                                    class="col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3"
                                >
                                    <p class="text-xs text-amber-700 font-semibold">
                                        <i class="fas fa-exclamation-triangle mr-1.5"></i>已启用 TLS，建议同时填写证书路径和私钥路径。
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- ===== EXTRA_INBOUNDS_PATCH_END ===== -->

<div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
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
                    </div>

                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                            <div class="flex items-center gap-2">
                                <div class="stitle mb-0">FakeIP 模式</div>
                                <span class="badge bg-purple-100 text-purple-700 border border-purple-200">TUN 推荐</span>
                            </div>
                            <label class="toggle-switch"><input type="checkbox" v-model="fakeip.enabled"><span class="toggle-slider"></span></label>
                        </div>
                        <div v-if="fakeip.enabled" class="space-y-4">
                            <p class="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 font-medium">
                                <i class="fas fa-info-circle mr-1.5"></i>启用后自动生成 FakeIP DNS 服务器及对应规则。需配合 TUN 模式使用。
                            </p>
                            <div class="grid grid-cols-2 gap-4">
                                <div><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">服务器标签</label><input v-model="fakeip.tag" placeholder="fakeip" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-mono"></div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">触发查询类型</label>
                                    <div class="flex gap-5 mt-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                        <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="fakeip.queryA" class="w-4 h-4 text-purple-600 rounded"><span class="text-xs font-bold text-gray-700">A (IPv4)</span></label>
                                        <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="fakeip.queryAAAA" class="w-4 h-4 text-purple-600 rounded"><span class="text-xs font-bold text-gray-700">AAAA (IPv6)</span></label>
                                    </div>
                                </div>
                                <div v-if="fakeip.queryA"><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">IPv4 范围</label><input v-model="fakeip.inet4_range" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-mono"></div>
                                <div v-if="fakeip.queryAAAA"><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">IPv6 范围</label><input v-model="fakeip.inet6_range" placeholder="fc00::/18" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-mono"></div>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">排除域名后缀（每行一条，无需添加 + 或 .）</label>
                                <textarea v-model="fakeip.excludeText" @blur="cleanExcludeText" @paste="handlePasteCleanup" rows="3" placeholder="lan&#10;local&#10;time.apple.com" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none bg-gray-50 focus:bg-white font-mono resize-none"></textarea>
                            </div>
                        </div>
                    </div>
                </div>
`);
