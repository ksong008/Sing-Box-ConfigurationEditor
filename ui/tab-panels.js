import { useSharedContext } from './shared.js';

const createInjectedComponent = (name, template) => ({
    name,
    setup() {
        return useSharedContext();
    },
    template,
});

const DnsTab = createInjectedComponent('DnsTab', `                <div v-show="currentTab==='dns'" class="space-y-5">
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
const NodesTab = createInjectedComponent('NodesTab', `                <div v-show="currentTab==='nodes'" class="space-y-5">
                    <div class="bg-emerald-50/50 p-5 rounded-xl border border-emerald-200 shadow-sm">
                        <div class="flex items-center gap-2 mb-3">
                            <span class="text-base font-extrabold text-emerald-800"><i class="fas fa-clipboard-check mr-2"></i>手动粘贴解析</span>
                            <div class="flex flex-wrap gap-1 ml-2">
                                <span v-for="p in ['VLESS','VMess','Trojan','SS','SSR','Hy2','TUIC','SOCKS','HTTP','WireGuard']" :key="p" class="badge bg-white text-emerald-700 border border-emerald-200">{{p}}</span>
                            </div>
                        </div>
                        <p class="text-xs text-emerald-700 mb-3 font-medium">将订阅链接在浏览器打开后复制内容粘贴，支持 Base64 编码或明文协议链接（多行混合）。</p>
                        <textarea v-model="rawPastedText" rows="4" placeholder="vless://...&#10;vmess://...&#10;ss://...&#10;hysteria2://...&#10;tuic://...&#10;&#10;或 Base64 内容" class="w-full px-4 py-3 text-xs border border-emerald-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400 font-mono bg-white mb-3 resize-none shadow-inner"></textarea>
                        <div class="flex justify-end"><button @click="parseManualText" class="text-sm font-bold bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-500 shadow-md transition-colors"><i class="fas fa-magic mr-2"></i>提取节点</button></div>
                    </div>

                    <div class="bg-indigo-50/40 p-5 rounded-xl border border-indigo-100 shadow-sm">
                        <div class="flex justify-between items-center mb-4">
                            <span class="text-base font-extrabold text-indigo-800"><i class="fas fa-link mr-2"></i>订阅源</span>
                            <button @click="addProvider" class="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-500 shadow-sm transition"><i class="fas fa-plus mr-1"></i>添加订阅</button>
                        </div>
                        <div class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div class="flex items-start justify-between gap-3">
                                <p class="text-xs text-amber-800 font-semibold"><i class="fas fa-shield-alt mr-1.5"></i>试验性功能，直接拉取可能因跨域限制失败。开启 CORS 代理后，订阅链接将经第三方服务器转发，存在<strong>链接泄露风险</strong>。建议优先手动复制订阅链接在浏览器打开后复制内容粘贴内容到上方解析框。</p>
                                <label class="flex items-center gap-2 cursor-pointer shrink-0 bg-white px-3 py-1.5 rounded-lg border border-amber-300 shadow-sm">
                                    <input type="checkbox" v-model="corsProxyEnabled" class="w-4 h-4 text-amber-600 rounded">
                                    <span class="text-xs text-amber-800 font-bold whitespace-nowrap">{{ corsProxyEnabled ? '代理已开启' : '开启代理' }}</span>
                                </label>
                            </div>
                            <p v-if="corsProxyEnabled" class="text-xs text-red-700 font-bold mt-2 bg-red-50 border border-red-200 rounded px-2 py-1"><i class="fas fa-exclamation-triangle mr-1"></i>代理已开启，订阅链接将经第三方转发，拉取完成后建议立即关闭。</p>
                        </div>
                        <div v-if="fetchStatus" class="mb-4 px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm"
                            :class="fetchStatus.type==='ok'?'bg-green-50 text-green-700 border border-green-200':fetchStatus.type==='err'?'bg-red-50 text-red-700 border border-red-200':fetchStatus.type==='warn'?'bg-amber-50 text-amber-800 border border-amber-200':'bg-blue-50 text-blue-700 border border-blue-200'">
                            <i :class="fetchStatus.type==='ok'?'fas fa-check-circle':fetchStatus.type==='err'?'fas fa-exclamation-circle':fetchStatus.type==='warn'?'fas fa-exclamation-triangle':'fas fa-spinner fa-spin'"></i>
                            <span>{{ fetchStatus.msg }}</span>
                        </div>
                        <div class="space-y-3">
                            <div v-for="(prov,idx) in providers" :key="idx" class="bg-white p-4 rounded-xl border border-indigo-100 relative group shadow-sm hover:border-indigo-300 transition-colors">
                                <button @click="removeProvider(idx)" class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-red-500 text-gray-400 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"><i class="fas fa-trash-alt text-sm"></i></button>
                                <div class="flex items-center gap-3 mb-3 pr-10">
                                    <input type="text" v-model="prov.tag" placeholder="机场名称" class="w-[25%] px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none font-bold text-indigo-700 focus:ring-1">
                                    <input type="text" v-model="prov.url" placeholder="https://... 订阅链接" class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-1">
                                </div>
                                <div class="flex items-center justify-between">
                                    <p class="text-[11px] text-gray-400 font-medium">支持 Base64 编码订阅或多行明文</p>
                                    <button @click="fetchAndParse(idx)" :disabled="isFetching" class="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-100 disabled:opacity-50 font-bold shadow-sm transition">
                                        <i :class="isFetching?'fas fa-spinner fa-spin':'fas fa-cloud-download-alt'" class="mr-1.5"></i>{{ isFetching?'拉取解析中...':'在线拉取' }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <span class="text-base font-extrabold text-gray-800"><i class="fas fa-server mr-2 text-indigo-500"></i>代理节点 <span class="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-black">{{ nodes.length }}</span></span>
                        <div class="flex gap-3">
                            <button @click="clearNodes" class="text-xs font-bold bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-100 transition"><i class="fas fa-trash mr-1.5"></i>清空全部</button>
                            <button @click="addNode('top')" class="text-xs font-bold bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 shadow-md transition"><i class="fas fa-plus mr-1.5"></i>新建节点</button>
                        </div>
                    </div>

                    <div v-for="(node,idx) in nodes" :key="idx" :id="\`node-card-\${idx}\`"
                         @focusin.capture="queueJsonScrollToTarget('node', node, $event)"
                         @input.capture="queueJsonScrollToTarget('node', node, $event)"
                         @change.capture="queueJsonScrollToTarget('node', node, $event)"
                         :draggable="node.draggable || false"
                         @dragstart="onNodeDragStart(idx, $event)"
                         @dragenter.prevent="onNodeDragEnter(idx)"
                         @dragover.prevent
                         @drop="onNodeDrop(idx)"
                         @dragend="onNodeDragEnd"
                         :class="{
                             'opacity-40 border-dashed border-indigo-400': draggedNodeIndex === idx,
                             'shadow-[0_-3px_0_0_#4f46e5] border-indigo-300 z-10': dragOverNodeIndex === idx && draggedNodeIndex > idx,
                             'shadow-[0_3px_0_0_#4f46e5] border-indigo-300 z-10': dragOverNodeIndex === idx && draggedNodeIndex < idx,
                             'border-rose-300': hasNodeCapabilityIssues(node)
                         }"
                         class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative group hover:border-indigo-300 transition-all">
                        <div class="absolute top-4 right-4 flex items-center gap-2 z-10">
                            <button @click="toggleNodeCollapsed(idx)" class="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 w-7 h-7 flex justify-center items-center rounded-lg transition-colors" :title="node.collapsed ? '展开卡片' : '折叠卡片'">
                                <i :class="node.collapsed ? 'fas fa-chevron-down text-sm' : 'fas fa-chevron-up text-sm'"></i>
                            </button>
                            <button @click="removeNode(idx)" class="text-red-400 hover:text-white hover:bg-red-500 w-7 h-7 flex justify-center items-center rounded-lg transition-colors"><i class="fas fa-trash-alt text-sm"></i></button>
                        </div>
                        
                        <div class="flex items-start gap-4 pr-20" :class="node.collapsed ? 'mb-1' : 'mb-3'">
                            <div class="flex items-center justify-center shrink-0 w-8 h-8 cursor-move text-gray-400 hover:text-indigo-600 bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-colors mt-6"
                                 title="按住此处拖动排序"
                                 @mouseenter="node.draggable = true"
                                 @mouseleave="node.draggable = false"
                                 @mousedown="node.draggable = true"
                                 @mouseup="node.draggable = false">
                                <i class="fas fa-grip-vertical"></i>
                            </div>
                            <div class="flex-1">
                                <div v-if="node.collapsed" class="flex flex-wrap items-center gap-2 min-h-[42px]">
                                    <span class="text-sm font-extrabold text-gray-800">{{ node.tag || '未命名节点' }}</span>
                                    <span class="badge bg-gray-100 text-gray-600 border border-gray-200">{{ node.type }}</span>
                                    <span class="badge bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">{{ getNodeDisplayEndpoint(node) }}</span>
                                    <span v-if="hasNodeCapabilityIssues(node)" class="badge bg-rose-100 text-rose-700 border border-rose-200">{{ getNodeCapabilityMessages(node).length }} 项待修正</span>
                                </div>
                                <div v-else class="grid grid-cols-12 gap-3">
                                    <div class="col-span-5"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">节点名称</label><input type="text" v-model="node.tag" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-bold text-indigo-700 outline-none focus:ring-1 focus:bg-white"></div>
                                    <div class="col-span-3"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">协议</label>
                                        <select v-model="node.type" @change="onNodeTypeChange(node)" class="w-full px-2 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-bold text-gray-700 focus:ring-1 focus:bg-white">
                                            <optgroup label="常用">
                                                <option value="vless">VLESS</option>
                                                <option value="vmess">VMess</option>
                                                <option value="trojan">Trojan</option>
                                                <option value="shadowsocks">Shadowsocks</option>
                                            </optgroup>
                                            <optgroup label="新型">
                                                <option value="hysteria2">Hysteria2</option>
                                                <option value="hysteria">Hysteria</option>
                                                <option value="tuic">TUIC v5</option>
                                                <option value="anytls">AnyTLS</option>
                                            </optgroup>
                                            <optgroup label="混淆/隐匿">
                                                <option value="shadowtls">ShadowTLS</option>
                                                <option value="naive">NaiveProxy</option>
                                            </optgroup>
                                            <optgroup label="基础">
                                                <option value="socks">SOCKS5</option>
                                                <option value="http">HTTP</option>
                                                <option value="wireguard">WireGuard</option>
                                                <option value="ssh">SSH</option>
                                            </optgroup>
                                            <optgroup label="特殊">
                                                <option value="tor">Tor</option>
                                                <option value="dns">DNS</option>
                                            </optgroup>
                                        </select>
                                    </div>
                                    <div v-if="isNodeServerEndpointVisible(node)" class="col-span-4 grid grid-cols-3 gap-2">
                                        <div class="col-span-2">
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">服务器 IP/域名</label>
                                            <input type="text" v-model="node.server" :class="isNodeCapabilityFieldInvalid(node, 'server') ? 'border-rose-300 bg-rose-50 focus:ring-rose-200' : 'border-gray-300 bg-gray-50'" class="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:bg-white font-mono">
                                            <p v-for="message in getNodeCapabilityFieldMessages(node, 'server')" :key="'server-msg-' + idx + '-' + message" class="mt-1 text-[10px] font-medium text-rose-700">{{ message }}</p>
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">端口</label>
                                            <input type="number" v-model.number="node.port" :class="isNodeCapabilityFieldInvalid(node, 'port') ? 'border-rose-300 bg-rose-50 focus:ring-rose-200' : 'border-gray-300 bg-gray-50'" class="w-full px-2 py-2 border rounded-lg text-sm outline-none text-center focus:ring-1 focus:bg-white font-mono">
                                            <p v-for="message in getNodeCapabilityFieldMessages(node, 'port')" :key="'port-msg-' + idx + '-' + message" class="mt-1 text-[10px] font-medium text-rose-700">{{ message }}</p>
                                        </div>
                                    </div>
                                    <div v-else class="col-span-4 flex items-end justify-end">
                                        <div class="text-[10px] font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">当前协议不使用 server / port</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-if="!node.collapsed" class="ml-12 flex flex-wrap items-center gap-2 mb-3">
                            <span class="badge bg-gray-100 text-gray-600 border border-gray-200">{{ node.type }}</span>
                            <span class="badge bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">{{ getNodeDisplayEndpoint(node) }}</span>
                            <span v-if="hasNodeCapabilityIssues(node)" class="badge bg-rose-100 text-rose-700 border border-rose-200">待修正 {{ getNodeCapabilityMessages(node).length }} 项</span>
                        </div>

                        <div v-if="!node.collapsed && hasNodeCapabilityIssues(node)" class="ml-12 mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
                            <div class="text-[11px] font-bold text-rose-800"><i class="fas fa-exclamation-circle mr-1.5"></i>当前节点还有以下问题</div>
                            <ul class="mt-2 space-y-1">
                                <li v-for="message in getNodeCapabilityMessages(node)" :key="'node-issue-' + idx + '-' + message" class="text-[11px] text-rose-700">• {{ message }}</li>
                            </ul>
                        </div>

                        <div v-if="!node.collapsed" class="ml-12">

                        <div v-if="isNodeSharedSecretSectionVisible(node)" class="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">{{ getNodeSharedSecretLabel(node) }}</label>
                                <input type="text" v-model="node.secret" :class="isNodeCapabilityFieldInvalid(node, 'secret') ? 'border-rose-300 bg-rose-50 focus:ring-rose-200' : 'border-gray-300 bg-white'" class="w-full px-3 py-2 border rounded-lg text-xs outline-none font-mono focus:ring-1">
                                <p v-for="message in getNodeCapabilityFieldMessages(node, 'secret')" :key="'secret-msg-' + idx + '-' + message" class="mt-1 text-[10px] font-medium text-rose-700">{{ message }}</p>
                            </div>
                            <div v-show="isNodeCredentialSniVisible(node)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">SNI (Server Name Indication)</label><input type="text" v-model="node.sni" placeholder="example.com" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none bg-white focus:ring-1"></div>
                        </div>

                        <div v-if="node.type==='shadowsocks'" class="grid grid-cols-2 gap-3 mb-3">
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">加密方法</label>
                                <select v-model="node.ss_method" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option value="none">none</option>
                                    <option value="chacha20-ietf-poly1305">chacha20-ietf-poly1305</option>
                                    <option value="xchacha20-ietf-poly1305">xchacha20-ietf-poly1305</option>
                                    <option value="aes-128-gcm">aes-128-gcm</option>
                                    <option value="aes-192-gcm">aes-192-gcm</option>
                                    <option value="aes-256-gcm">aes-256-gcm</option>
                                    <option value="2022-blake3-aes-128-gcm">2022-blake3-aes-128-gcm</option>
                                    <option value="2022-blake3-aes-256-gcm">2022-blake3-aes-256-gcm</option>
                                    <option value="2022-blake3-chacha20-poly1305">2022-blake3-chacha20-poly1305</option>
                                    <option value="aes-128-ctr">aes-128-ctr (legacy)</option>
                                    <option value="aes-192-ctr">aes-192-ctr (legacy)</option>
                                    <option value="aes-256-ctr">aes-256-ctr (legacy)</option>
                                    <option value="rc4-md5">rc4-md5 (不推荐)</option>
                                    <option value="aes-128-cfb">aes-128-cfb (不推荐)</option>
                                    <option value="aes-192-cfb">aes-192-cfb (legacy)</option>
                                    <option value="aes-256-cfb">aes-256-cfb (legacy)</option>
                                    <option value="chacha20-ietf">chacha20-ietf (legacy)</option>
                                    <option value="xchacha20">xchacha20 (legacy)</option>
                                </select>
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">网络 (Network)</label>
                                <select v-model="node.network" @change="syncNodeNetworkConstraints(node)" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option v-for="item in getNodeAvailableNetworkOptions(node)" :key="'ss-network-' + item.value" :value="item.value">{{ item.label }}</option>
                                </select>
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">插件 (Plugin)</label>
                                <select v-model="node.ss_plugin" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option value="">无</option>
                                    <option value="obfs-local">obfs-local</option>
                                    <option value="v2ray-plugin">v2ray-plugin</option>
                                </select>
                            </div>
                            <div class="flex items-end">
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" v-model="node.ss_udp_over_tcp" :disabled="node.mux_enabled" class="w-4 h-4 text-indigo-600 rounded disabled:opacity-40">
                                    <span class="text-xs font-bold text-gray-700">UDP over TCP <span class="text-gray-400 font-normal">(与 Multiplex 互斥)</span></span>
                                </label>
                            </div>
                            <div v-if="node.ss_udp_over_tcp"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">UDP over TCP 版本</label>
                                <select v-model="node.ss_udp_over_tcp_version" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option value="2">2 (默认)</option>
                                    <option value="1">1</option>
                                </select>
                            </div>
                            <div v-if="node.ss_plugin" class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">插件参数 (Plugin Opts)</label><input type="text" v-model="node.ss_plugin_opts" placeholder="obfs=http;obfs-host=www.bing.com" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                        </div>

                        <div v-if="node.type==='tuic'" class="grid grid-cols-2 gap-3 mb-3">
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">密码 (Password)</label><input type="text" v-model="node.tuic_password" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">SNI</label><input type="text" v-model="node.sni" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">拥塞控制 (Congestion Control)</label>
                                <select v-model="node.tuic_congestion" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option value="cubic">cubic</option><option value="new_reno">new_reno</option><option value="bbr">bbr</option>
                                </select>
                                <p class="mt-1 text-[10px] font-medium text-gray-500">控制 UDP / QUIC 拥塞算法，常见默认是 <code>cubic</code>。</p>
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">UDP 转发模式 (UDP Relay Mode)</label>
                                <select v-model="node.tuic_udp_relay_mode" :disabled="node.tuic_udp_over_stream" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1 disabled:opacity-40">
                                    <option value="native">native</option><option value="quic">quic</option>
                                </select>
                                <p class="mt-1 text-[10px] font-medium text-amber-700">仅在未启用 <code>udp_over_stream</code> 时有效。</p>
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">网络 (Network)</label>
                                <select v-model="node.tuic_network" @change="syncNodeNetworkConstraints(node)" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option v-for="item in getNodeAvailableNetworkOptions(node)" :key="'tuic-network-' + item.value" :value="item.value">{{ item.label }}</option>
                                </select>
                                <p class="mt-1 text-[10px] font-medium text-gray-500">限制本节点允许的底层网络类型。</p>
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">心跳间隔 (Heartbeat)</label><input type="text" v-model="node.tuic_heartbeat" placeholder="10s" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"><p class="mt-1 text-[10px] font-medium text-gray-500">用于保持连接活性，长连接场景更常见。</p></div>
                            <div class="col-span-2 flex flex-wrap gap-4 pt-1">
                                <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="node.tuic_udp_over_stream" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">UDP Over Stream</span><span class="text-[10px] font-medium text-gray-500">把 UDP 封装到流里</span></label>
                                <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="node.tuic_zero_rtt_handshake" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">0-RTT 握手 (Zero RTT Handshake)</span><span class="text-[10px] font-medium text-amber-700">降低延迟，但依赖服务端支持</span></label>
                            </div>
                            <div v-if="node.tuic_udp_over_stream" class="col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p class="text-xs text-amber-700 font-semibold"><i class="fas fa-info-circle mr-1.5"></i>启用 <code>udp_over_stream</code> 后，<code>udp_relay_mode</code> 将不再写入配置。</p>
                            </div>
                        </div>

                        <div v-if="node.type==='hysteria'" class="grid grid-cols-2 gap-3 mb-3">
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">{{ node.hy_auth_type === 'base64' ? '认证值 (auth)' : '认证值 (auth_str)' }}</label><input type="text" v-model="node.secret" :placeholder="node.hy_auth_type === 'base64' ? 'Base64 auth' : 'Plain auth string'" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">SNI (Server Name Indication)</label><input type="text" v-model="node.sni" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">上行带宽 (Mbps)</label><input type="number" v-model.number="node.hy_up_mbps" placeholder="100" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">下行带宽 (Mbps)</label><input type="number" v-model.number="node.hy_down_mbps" placeholder="100" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">上行格式值 (up)</label><input type="text" v-model="node.hy_up_text" placeholder="100 Mbps" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">下行格式值 (down)</label><input type="text" v-model="node.hy_down_text" placeholder="100 Mbps" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">OBFS 密钥 (OBFS Password)</label><input type="text" v-model="node.hy_obfs" placeholder="salamander" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"><p class="mt-1 text-[10px] font-medium text-gray-500">用于混淆流量；仅配置对应服务端时才需要。</p></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">认证类型 (Auth Type)</label>
                                <select v-model="node.hy_auth_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option value="str">string</option><option value="base64">base64</option>
                                </select>
                                <p class="mt-1 text-[10px] font-medium text-gray-500">控制认证字段写入为普通字符串还是 Base64。</p>
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">跳跃端口 (Server Ports)</label><input type="text" v-model="node.hy_server_ports" placeholder="2080:3000,4000:5000" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"><p class="mt-1 text-[10px] font-medium text-amber-700">启用端口跳跃时使用；可填多个端口或端口范围。</p></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">跳跃间隔 (Hop Interval)</label><input type="text" v-model="node.hy_hop_interval" placeholder="30s" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"><p class="mt-1 text-[10px] font-medium text-gray-500">控制端口跳跃切换频率。</p></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">连接接收窗 (recv_window_conn)</label><input type="number" v-model.number="node.hy_recv_window_conn" placeholder="15728640" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">流接收窗 (recv_window)</label><input type="number" v-model.number="node.hy_recv_window" placeholder="67108864" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">网络 (Network)</label>
                                <select v-model="node.hy_network" @change="syncNodeNetworkConstraints(node)" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option v-for="item in getNodeAvailableNetworkOptions(node)" :key="'hy-network-' + item.value" :value="item.value">{{ item.label }}</option>
                                </select>
                                <p class="mt-1 text-[10px] font-medium text-gray-500">限制本节点允许的底层网络类型。</p>
                            </div>
                            <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="node.hy_disable_mtu_discovery" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">禁用 MTU 探测 (disable_mtu_discovery)</span></label></div>
                            <div class="col-span-2 text-[10px] font-medium text-gray-500">支持填写多个跳跃端口或端口范围，使用逗号分隔，例如 <code>2080:3000,4000:5000</code>。</div>
                        </div>

                        <div v-if="node.type==='hysteria2'" class="grid grid-cols-2 gap-3 mb-3">
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">上行带宽 (up_mbps)</label><input type="text" v-model="node.hy2_up" placeholder="100 mbps" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">下行带宽 (down_mbps)</label><input type="text" v-model="node.hy2_down" placeholder="100 mbps" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">OBFS 类型 (OBFS Type)</label>
                                <select v-model="node.hy2_obfs_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option value="">无</option><option value="salamander">salamander</option>
                                </select>
                                <p class="mt-1 text-[10px] font-medium text-gray-500">控制 Hysteria2 的混淆方式；仅服务端启用时才需要。</p>
                            </div>
                            <div v-if="node.hy2_obfs_type"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">OBFS 密钥 (OBFS Password)</label><input type="text" v-model="node.hy2_obfs_password" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"><p class="mt-1 text-[10px] font-medium text-gray-500">与上面的混淆类型配套使用。</p></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">跳跃端口 (Server Ports)</label><input type="text" v-model="node.hy2_server_ports" placeholder="2080:3000,4000:5000" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"><p class="mt-1 text-[10px] font-medium text-amber-700">启用端口跳跃时使用；可填多个端口或端口范围。</p></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">跳跃间隔 (Hop Interval)</label><input type="text" v-model="node.hy2_hop_interval" placeholder="30s" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"><p class="mt-1 text-[10px] font-medium text-gray-500">控制端口跳跃切换频率。</p></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">最大跳跃间隔 (Hop Interval Max)</label><input type="text" v-model="node.hy2_hop_interval_max" placeholder="2m" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">BBR Profile</label><select v-model="node.hy2_bbr_profile" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"><option value="">default</option><option value="conservative">conservative</option><option value="standard">standard</option><option value="aggressive">aggressive</option></select></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">网络 (Network)</label>
                                <select v-model="node.hy2_network" @change="syncNodeNetworkConstraints(node)" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option v-for="item in getNodeAvailableNetworkOptions(node)" :key="'hy2-network-' + item.value" :value="item.value">{{ item.label }}</option>
                                </select>
                                <p class="mt-1 text-[10px] font-medium text-gray-500">限制本节点允许的底层网络类型。</p>
                            </div>
                            <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="node.hy2_brutal_debug" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">Brutal Debug</span></label></div>
                            <div class="col-span-2 text-[10px] font-medium text-gray-500">支持填写多个跳跃端口或端口范围，使用逗号分隔，例如 <code>2080:3000,4000:5000</code>。</div>
                        </div>

                        <div v-if="node.type==='socks'" class="grid grid-cols-2 gap-3 mb-3">
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">版本</label>
                                <select v-model="node.socks_version" @change="syncNodeNetworkConstraints(node)" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option value="5">SOCKS5</option><option value="4a">SOCKS4a</option><option value="4">SOCKS4</option>
                                </select>
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">网络 (Network)</label>
                                <select v-model="node.socks_network" @change="syncNodeNetworkConstraints(node)" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option v-for="item in getNodeAvailableNetworkOptions(node)" :key="'socks-network-' + item.value" :value="item.value">{{ item.label }}</option>
                                </select>
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">用户名 (可选)</label><input type="text" v-model="node.username" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">密码 (可选)</label><input type="text" v-model="node.secret" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                            <div class="flex items-end">
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" v-model="node.socks_udp_over_tcp" class="w-4 h-4 text-indigo-600 rounded">
                                    <span class="text-xs font-bold text-gray-700">UDP over TCP</span>
                                </label>
                            </div>
                            <div v-if="node.socks_udp_over_tcp"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">UDP over TCP 版本</label>
                                <select v-model="node.socks_udp_over_tcp_version" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option value="2">2 (默认)</option>
                                    <option value="1">1</option>
                                </select>
                            </div>
                        </div>

                        <div v-if="node.type==='http'" class="grid grid-cols-2 gap-3 mb-3">
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">用户名 (可选)</label><input type="text" v-model="node.username" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">密码 (可选)</label><input type="text" v-model="node.secret" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                            <div v-if="isNodeTlsContext(node)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">SNI</label><input type="text" v-model="node.sni" placeholder="example.com" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">路径 (Path)</label><input type="text" v-model="node.http_path" placeholder="/" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                            <div class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">请求头 (Headers)</label><textarea v-model="node.http_headers_text" rows="3" placeholder="User-Agent: sing-box&#10;X-Proxy: corp" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white resize-none focus:ring-1"></textarea></div>
                        </div>

                        <div v-if="node.type==='wireguard'" class="grid grid-cols-1 gap-3 mb-3">
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">本地私钥 (Private Key)</label><input type="text" v-model="node.wg_private_key" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">对端公钥 (Peer Public Key)</label><input type="text" v-model="node.wg_peer_pubkey" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                            <div class="grid grid-cols-2 gap-3">
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">本地地址 (Local Address)</label><input type="text" v-model="node.wg_local_address" placeholder="10.0.0.2/32" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Pre-Shared Key (可选)</label><input type="text" v-model="node.wg_psk" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">MTU</label><input type="number" v-model.number="node.wg_mtu" placeholder="1280" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Reserved (逗号分隔)</label><input type="text" v-model="node.wg_reserved" placeholder="0,0,0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Interface Name</label><input type="text" v-model="node.wg_interface_name" placeholder="wg0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Workers</label><input type="number" v-model.number="node.wg_workers" min="1" placeholder="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Network</label>
                                    <select v-model="node.wg_network" @change="syncNodeNetworkConstraints(node)" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                        <option v-for="item in getNodeAvailableNetworkOptions(node)" :key="'wg-network-' + item.value" :value="item.value">{{ item.label }}</option>
                                    </select>
                                </div>
                                <div class="flex items-end pb-2">
                                    <label class="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" v-model="node.wg_system_interface" class="w-4 h-4 text-indigo-600 rounded">
                                        <span class="text-xs font-bold text-gray-700">system_interface</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div v-if="node.type==='ssh'" class="grid grid-cols-2 gap-3 mb-3">
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">用户名</label><input type="text" v-model="node.username" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">认证方式</label>
                                <select v-model="node.ssh_auth_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option value="password">密码</option><option value="key">私钥</option>
                                </select>
                            </div>
                            <div class="col-span-2">
                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">{{ node.ssh_auth_type==='key'?'私钥内容 (PEM)':'密码' }}</label>
                                <textarea v-if="node.ssh_auth_type==='key'" v-model="node.secret" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white resize-none focus:ring-1"></textarea>
                                <input v-else type="text" v-model="node.secret" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                            </div>
                            <div v-if="node.ssh_auth_type==='key'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">私钥路径 (private_key_path)</label><input type="text" v-model="node.ssh_private_key_path" placeholder="/home/user/.ssh/id_ed25519" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                            <div v-if="node.ssh_auth_type==='key'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">私钥口令 (private_key_passphrase)</label><input type="text" v-model="node.ssh_private_key_passphrase" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                            <div class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">主机公钥 (host_key，每行一条)</label><textarea v-model="node.ssh_host_key_text" rows="3" placeholder="ssh-ed25519 AAAA..." class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white resize-none focus:ring-1"></textarea></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">主机密钥算法 (host_key_algorithms)</label><input type="text" v-model="node.ssh_host_key_algorithms" placeholder="ssh-ed25519,rsa-sha2-512" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">客户端版本 (client_version)</label><input type="text" v-model="node.ssh_client_version" placeholder="SSH-2.0-OpenSSH_9.0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                        </div>

                        <!-- ShadowTLS -->
                        <div v-if="node.type==='shadowtls'" class="grid grid-cols-2 gap-3 mb-3">
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">版本 (Version)</label>
                                <select v-model="node.shadowtls_version" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option value="3">v3 (推荐)</option>
                                    <option value="2">v2</option>
                                    <option value="1">v1</option>
                                </select>
                                <p v-if="node.shadowtls_version==='1'" class="mt-1 text-[10px] font-medium text-gray-500">官方出站文档中，v1 没有 <code>password</code> 字段。</p>
                            </div>
                            <div v-if="isNodeShadowtlsPasswordSupported(node)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">密码 (Password)</label>
                                <input type="text" v-model="node.shadowtls_password" :class="isNodeCapabilityFieldInvalid(node, 'shadowtls_password') ? 'border-rose-300 bg-rose-50 focus:ring-rose-200' : 'border-gray-300 bg-white'" class="w-full px-3 py-2 border rounded-lg text-xs outline-none font-mono focus:ring-1">
                                <p v-for="message in getNodeCapabilityFieldMessages(node, 'shadowtls_password')" :key="'shadowtls-password-' + idx + '-' + message" class="mt-1 text-[10px] font-medium text-rose-700">{{ message }}</p>
                            </div>
                            <div class="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p class="text-xs text-blue-700"><i class="fas fa-info-circle mr-1.5"></i><strong>ShadowTLS</strong> 是一个流量混淆协议，需套在其他代理协议（如 Shadowsocks）外层使用。<code class="bg-blue-100 px-1 rounded">server/port</code> 填写 ShadowTLS 服务器地址；<code class="bg-blue-100 px-1 rounded">password</code> 仅适用于 v2 / v3 客户端。</p>
                            </div>
                        </div>

                        <!-- AnyTLS -->
                        <div v-if="node.type==='anytls'" class="grid grid-cols-2 gap-3 mb-3">
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">密码 (Password)</label>
                                <input type="text" v-model="node.secret" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">SNI</label>
                                <input type="text" v-model="node.sni" placeholder="example.com" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none bg-white focus:ring-1">
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">空闲连接检查间隔 <span class="normal-case font-normal text-gray-400">(idle_session_check_interval)</span></label>
                                <input type="text" v-model="node.anytls_idle_session_check_interval" placeholder="30s (留空使用默认)" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">空闲会话超时 <span class="normal-case font-normal text-gray-400">(idle_session_timeout)</span></label>
                                <input type="text" v-model="node.anytls_idle_session_timeout" placeholder="15m" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">最小空闲会话数 <span class="normal-case font-normal text-gray-400">(min_idle_session)</span></label>
                                <input type="number" v-model.number="node.anytls_min_idle_session" min="0" placeholder="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                            </div>
                        </div>

                        <!-- NaiveProxy -->
                        <div v-if="node.type==='naive'" class="grid grid-cols-2 gap-3 mb-3">
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">用户名 (Username)</label>
                                <input type="text" v-model="node.username" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">密码 (Password)</label>
                                <input type="text" v-model="node.secret" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">SNI</label>
                                <input type="text" v-model="node.sni" placeholder="example.com" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none bg-white focus:ring-1">
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">不安全并发 <span class="normal-case font-normal text-gray-400">(insecure_concurrency)</span></label>
                                <input type="number" v-model.number="node.naive_insecure_concurrency" min="0" placeholder="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                            </div>
                            <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="node.naive_quic" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">启用 QUIC</span></label></div>
                            <div v-if="node.naive_quic"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">QUIC 拥塞控制 <span class="normal-case font-normal text-gray-400">(quic_congestion_control)</span></label>
                                <select v-model="node.naive_quic_congestion_control" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option value="">默认</option>
                                    <option value="bbr">bbr</option>
                                    <option value="bbr2">bbr2</option>
                                    <option value="cubic">cubic</option>
                                    <option value="new_reno">new_reno</option>
                                    <option value="reno">reno</option>
                                </select>
                            </div>
                            <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="node.naive_udp_over_tcp" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">UDP over TCP</span></label></div>
                            <div v-if="node.naive_udp_over_tcp"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">UDP over TCP 版本</label>
                                <select v-model="node.naive_udp_over_tcp_version" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option value="2">2 (默认)</option>
                                    <option value="1">1</option>
                                </select>
                            </div>
                            <div class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">额外请求头 <span class="normal-case font-normal text-gray-400">(extra_headers)</span></label>
                                <textarea v-model="node.naive_extra_headers_text" rows="3" placeholder="User-Agent: naive&#10;X-Test: 1" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white resize-none focus:ring-1"></textarea>
                            </div>
                            <div class="col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p class="text-xs text-amber-700"><i class="fas fa-info-circle mr-1.5"></i><strong>NaiveProxy</strong> 强制使用 TLS（HTTPS）。当前按官方文档仅突出保留它自己的关键字段，如 <code class="bg-amber-100 px-1 rounded">server_name</code>、<code class="bg-amber-100 px-1 rounded">ECH</code>、<code class="bg-amber-100 px-1 rounded">QUIC</code> 和额外请求头。</p>
                            </div>
                        </div>

                        <div v-if="isNodeQuicFieldSupported(node)" class="grid grid-cols-2 gap-3 mb-3">
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">初始包大小 <span class="normal-case font-normal text-gray-400">(initial_packet_size)</span></label>
                                <input type="number" v-model.number="node.quic_initial_packet_size" min="0" placeholder="1200" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                            </div>
                            <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="node.quic_disable_path_mtu_discovery" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">禁用路径 MTU 探测</span></label></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">空闲超时 <span class="normal-case font-normal text-gray-400">(idle_timeout)</span></label>
                                <input type="text" v-model="node.quic_idle_timeout" placeholder="30s" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">保活周期 <span class="normal-case font-normal text-gray-400">(keep_alive_period)</span></label>
                                <input type="text" v-model="node.quic_keep_alive_period" placeholder="15s" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">流接收窗 <span class="normal-case font-normal text-gray-400">(stream_receive_window)</span></label>
                                <input type="number" v-model.number="node.quic_stream_receive_window" min="0" placeholder="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">连接接收窗 <span class="normal-case font-normal text-gray-400">(connection_receive_window)</span></label>
                                <input type="number" v-model.number="node.quic_connection_receive_window" min="0" placeholder="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">最大并发流 <span class="normal-case font-normal text-gray-400">(max_concurrent_streams)</span></label>
                                <input type="number" v-model.number="node.quic_max_concurrent_streams" min="0" placeholder="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                            </div>
                            <div class="col-span-2 text-[10px] font-medium text-gray-500">适用于原生 QUIC 协议场景（如 Hysteria / Hysteria2 / TUIC）。</div>
                        </div>

                        <!-- Tor -->
                        <div v-if="node.type==='tor'" class="grid grid-cols-1 gap-3 mb-3">
                            <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <p class="text-xs text-gray-600 mb-3"><i class="fas fa-info-circle mr-1.5 text-indigo-400"></i>Tor 出站通过本地 Tor 客户端程序发送流量，<strong>服务器/端口</strong>字段在此协议中无意义。需要系统中已安装 Tor 或指定可执行文件路径。</p>
                                <div class="grid grid-cols-2 gap-3">
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Tor 可执行文件路径 <span class="normal-case font-normal">(留空使用系统 tor)</span></label>
                                        <input type="text" v-model="node.tor_executable_path" placeholder="/usr/bin/tor" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                                    </div>
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">数据目录 <span class="normal-case font-normal">(data_directory)</span></label>
                                        <input type="text" v-model="node.tor_data_directory" placeholder="/var/lib/tor" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                                    </div>
                                    <div class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">附加参数 <span class="normal-case font-normal">(extra_args · 空格分隔)</span></label>
                                        <input type="text" v-model="node.tor_extra_args" placeholder="--SOCKSPort 9050" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                                    </div>
                                    <div class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Torrc 覆盖项 <span class="normal-case font-normal">(torrc · 每行 key=value)</span></label>
                                        <textarea v-model="node.tor_torrc_text" rows="3" placeholder="UseBridges=1&#10;ClientTransportPlugin=..." class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white resize-none focus:ring-1"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- DNS outbound -->
                        <div v-if="node.type==='dns'" class="mb-3">
                            <div class="bg-sky-50 border border-sky-200 rounded-lg p-3">
                                <p class="text-xs text-sky-700"><i class="fas fa-info-circle mr-1.5"></i><strong>DNS 出站</strong>将连接作为 DNS 查询转发到 sing-box 内部 DNS 系统处理，通常用于路由规则中劫持并响应 DNS 请求。此出站无额外配置，<strong>服务器/端口</strong>字段无意义。</p>
                            </div>
                        </div>

                        <div v-if="isNodeTransportSectionVisible(node)" class="mb-3">
                            <div class="grid grid-cols-3 gap-3 mb-2">
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">传输层</label>
                                    <select v-model="node.transport" @change="syncNodeNetworkConstraints(node)" class="w-full px-2 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:bg-white">
                                        <option v-for="item in getNodeAvailableTransportOptions(node)" :key="'transport-' + item.value" :value="item.value">{{ item.label }}</option>
                                    </select>
                                </div>
                                <div v-if="isNodeTransportFieldVisible(node, 'path')"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">{{ isNodeTransport(node, 'grpc') ? 'Service Name' : '路径 (Path)' }}</label><input type="text" v-model="node.path" :placeholder="isNodeTransport(node, 'grpc') ? 'grpc' : '/ws'" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                                <div v-if="isNodeTransportFieldVisible(node, 'ws_host')"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">{{ isNodeTransport(node, 'http') ? 'HTTP Host' : 'WS Host Header' }}</label><input type="text" v-model="node.ws_host" placeholder="example.com" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                                <div v-if="node.type==='vless'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Flow (XTLS)</label>
                                    <select v-model="node.flow" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                                        <option value="">不启用（默认）</option>
                                        <option value="xtls-rprx-vision">xtls-rprx-vision</option>
                                    </select>
                                </div>
                            </div>
                            <div v-if="isNodeTransportFieldVisible(node, 'transport_headers_text')" class="mt-2">
                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">传输层请求头 (Headers)</label>
                                <textarea v-model="node.transport_headers_text" rows="3" placeholder="Host: example.com&#10;User-Agent: sing-box" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white resize-none focus:ring-1"></textarea>
                            </div>
                            <div v-if="isNodeTransportFieldVisible(node, 'transport_max_early_data')" class="grid grid-cols-2 gap-3 mt-2">
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">最大 Early Data</label><input type="number" v-model.number="node.transport_max_early_data" min="0" placeholder="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Early Data Header</label><input type="text" v-model="node.transport_early_data_header_name" placeholder="Sec-WebSocket-Protocol" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                            </div>
                            <div v-if="isNodeTransport(node, 'http')" class="grid grid-cols-3 gap-3 mt-2">
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">方法 (Method)</label><input type="text" v-model="node.transport_method" placeholder="PUT" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">空闲超时</label><input type="text" v-model="node.transport_idle_timeout" placeholder="15s" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Ping 超时</label><input type="text" v-model="node.transport_ping_timeout" placeholder="15s" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                            </div>
                            <div v-if="isNodeTransport(node, 'grpc')" class="grid grid-cols-3 gap-3 mt-2">
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">空闲超时</label><input type="text" v-model="node.transport_idle_timeout" placeholder="15s" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Ping 超时</label><input type="text" v-model="node.transport_ping_timeout" placeholder="15s" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                                <div class="flex items-end pb-2"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="node.transport_permit_without_stream" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">Permit Without Stream</span></label></div>
                            </div>
                            <!-- network + packet_encoding 行 -->
                            <div class="grid grid-cols-3 gap-3 mt-2">
                                <div v-if="isNodeTransportFieldVisible(node, 'network')"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Network <span class="normal-case font-normal text-gray-400">(启用的网络)</span></label>
                                    <select v-model="node.network" @change="syncNodeNetworkConstraints(node)" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                        <option v-for="item in getNodeAvailableNetworkOptions(node)" :key="'v2ray-network-' + item.value" :value="item.value">{{ item.label }}</option>
                                    </select>
                                </div>
                                <div v-if="isNodeTransportFieldVisible(node, 'packet_encoding')"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">packet_encoding <span class="normal-case font-normal text-gray-400">(UDP 封包)</span></label>
                                    <select v-model="node.packet_encoding" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1 font-mono">
                                        <option value="xudp">xudp (默认，xray)</option>
                                        <option value="packetaddr">packetaddr (v2ray 5+)</option>
                                        <option value="">禁用</option>
                                    </select>
                                </div>
                                <div v-if="node.type==='vmess'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">security <span class="normal-case font-normal text-gray-400">(加密方式)</span></label>
                                    <select v-model="node.vmess_security" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1 font-mono">
                                        <option value="auto">auto (推荐)</option>
                                        <option value="aes-128-gcm">aes-128-gcm</option>
                                        <option value="chacha20-poly1305">chacha20-poly1305</option>
                                        <option value="none">none</option>
                                        <option value="zero">zero</option>
                                    </select>
                                </div>
                            </div>
                            <!-- VMess 协议参数 -->
                            <div v-if="node.type==='vmess'" class="grid grid-cols-3 gap-3 mt-2">
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">alter_id</label>
                                    <input type="number" v-model.number="node.vmess_alter_id" placeholder="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                </div>
                                <div class="flex items-end pb-2"><label class="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" v-model="node.vmess_global_padding" class="w-4 h-4 text-indigo-600 rounded">
                                    <span class="text-xs font-bold text-gray-700">global_padding</span>
                                </label></div>
                                <div class="flex items-end pb-2"><label class="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" v-model="node.vmess_authenticated_length" class="w-4 h-4 text-indigo-600 rounded">
                                    <span class="text-xs font-bold text-gray-700">authenticated_length</span>
                                </label></div>
                            </div>
                        </div>

                        <div v-if="isNodeMultiplexSupported(node)" class="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <label class="flex items-center gap-2 cursor-pointer mb-3">
                                <input type="checkbox" v-model="node.mux_enabled" :disabled="node.type==='shadowsocks' && node.ss_udp_over_tcp" class="w-4 h-4 text-indigo-600 rounded disabled:opacity-40">
                                <span class="text-sm font-bold text-gray-700">启用多路复用 (Multiplex / Mux)</span>
                            </label>
                            <p v-if="node.type==='shadowsocks' && node.ss_udp_over_tcp" class="mb-3 text-[10px] font-medium text-amber-700">Shadowsocks 的 <code>udp_over_tcp</code> 与 <code>multiplex</code> 互斥；当前已启用前者，因此这里会被禁用。</p>
                            <div v-if="node.mux_enabled" class="grid grid-cols-3 gap-3">
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">协议</label>
                                    <select v-model="node.mux_protocol" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                        <option value="h2mux">h2mux</option><option value="smux">smux</option><option value="yamux">yamux</option>
                                    </select>
                                </div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">最大并发</label><input type="number" v-model.number="node.mux_max_connections" placeholder="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">每连接最大流</label><input type="number" v-model.number="node.mux_min_streams" placeholder="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">最大总流数</label><input type="number" v-model.number="node.mux_max_streams" min="0" placeholder="留空=不限制" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                                <div class="flex items-end pb-2"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="node.mux_padding" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">填充 (Padding)</span></label></div>
                                <div class="flex items-end pb-2"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="node.mux_brutal_enabled" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">TCP Brutal</span></label></div>
                            </div>
                            <div v-if="node.mux_enabled && node.mux_brutal_enabled" class="grid grid-cols-2 gap-3 mt-3">
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Brutal 上行 Mbps</label><input type="number" v-model.number="node.mux_brutal_up_mbps" min="1" placeholder="100" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Brutal 下行 Mbps</label><input type="number" v-model.number="node.mux_brutal_down_mbps" min="1" placeholder="100" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                            </div>
                        </div>

                        <div v-if="isNodeTlsSupported(node)" class="flex flex-wrap gap-4 mt-2">
                            <label v-if="isNodeTlsToggleVisible(node)" class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="node.tls" class="w-4 h-4 text-indigo-600 rounded"><span class="text-sm font-bold text-gray-700">TLS</span></label>
                            <template v-if="isNodeTlsContext(node)">
                                <label v-if="isNodeTlsInsecureSupported(node)" class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="node.insecure" class="w-4 h-4 text-yellow-600 rounded"><span class="text-sm font-bold text-gray-700">跳过证书验证</span></label>
                                <label v-if="isNodeRealitySupported(node)" class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="node.reality" class="w-4 h-4 text-purple-600 rounded"><span class="text-sm font-bold text-gray-700">REALITY</span></label>
                                <!-- uTLS + ALPN 网格：仅对支持的协议显示对应控件 -->
                                <div class="w-full mt-1 grid grid-cols-2 gap-3">
                                    <!-- uTLS：仅非 QUIC 的 vless/vmess/trojan -->
                                    <div v-if="isNodeUtlsSupported(node)">
                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">uTLS 指纹</label>
                                        <select v-model="node.utls_fingerprint" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none bg-white focus:ring-1 font-mono">
                                            <option value="">不启用（默认）</option>
                                            <option value="chrome">chrome</option>
                                            <option value="firefox">firefox</option>
                                            <option value="safari">safari</option>
                                            <option value="edge">edge</option>
                                            <option value="ios">ios</option>
                                            <option value="android">android</option>
                                            <option value="random">random</option>
                                            <option value="randomized">randomized</option>
                                        </select>
                                        <p class="mt-1 text-[10px] font-medium text-amber-700">官方标注为 <code>Not Recommended</code>；仅在明确需要伪装 TLS 指纹时再启用。</p>
                                    </div>
                                    <!-- ALPN：对支持 TLS 且 ALPN 有实际意义的协议显示 -->
                                    <div v-if="isNodeTlsAlpnSupported(node)">
                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">ALPN</label>
                                        <select v-if="!node.alpn_custom" v-model="node.alpn" @change="if(node.alpn==='__custom__'){node.alpn_custom=true;node.alpn=''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none bg-white focus:ring-1 font-mono">
                                            <option value="">不指定（默认）</option>
                                            <option value="h2">h2</option>
                                            <option value="http/1.1">http/1.1</option>
                                            <option value="h2,http/1.1">h2, http/1.1</option>
                                            <option value="h3">h3</option>
                                            <option value="h3,h2">h3, h2</option>
                                            <option value="__custom__">自定义...</option>
                                        </select>
                                        <div v-if="node.alpn_custom" class="flex gap-1">
                                            <input type="text" v-model="node.alpn" placeholder="h2,http/1.1" class="flex-1 px-3 py-2 border border-indigo-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                                            <button @click="node.alpn_custom=false; node.alpn=''" class="px-2 py-1 text-gray-400 hover:text-red-500 border border-gray-200 rounded-lg bg-white text-xs transition-colors" title="取消自定义"><i class="fas fa-times"></i></button>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </div>

                        <div v-if="node.reality && isNodeRealitySupported(node)" class="mt-4 grid grid-cols-2 gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                            <div><label class="block text-[10px] font-black text-purple-400 uppercase mb-1 tracking-wider">Public Key</label><input type="text" v-model="node.reality_pubkey" class="w-full px-3 py-2 border border-purple-200 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1 focus:border-purple-400"></div>
                            <div><label class="block text-[10px] font-black text-purple-400 uppercase mb-1 tracking-wider">Short ID</label><input type="text" v-model="node.reality_sid" class="w-full px-3 py-2 border border-purple-200 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1 focus:border-purple-400"></div>
                        </div>

                        <!-- ── 高级 TLS 选项 ── -->
                        <div v-if="isNodeTlsContext(node)" class="mt-3">
                            <details class="group">
                                <summary class="flex items-center gap-2 cursor-pointer select-none px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-xs font-bold text-gray-500">
                                    <i class="fas fa-chevron-right group-open:rotate-90 transition-transform text-[10px]"></i>
                                    <i class="fas fa-shield-alt text-indigo-400 mr-0.5"></i>高级 TLS 选项
                                    <span v-if="hasNodeTlsAdvancedConfig(node)" class="ml-auto badge bg-indigo-100 text-indigo-600 border border-indigo-200">已配置</span>
                                </summary>
                                <div class="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">

                                    <!-- SNI 控制：标准 TLS 字段，TCP / QUIC TLS 均可配置 -->
                                    <div v-if="isNodeTlsDisableSniSupported(node)" class="flex flex-wrap gap-4 items-center pb-2 border-b border-gray-200">
                                        <label class="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" v-model="node.disable_sni" class="w-4 h-4 text-orange-600 rounded">
                                            <span class="text-xs font-bold text-gray-700">禁用 SNI <span class="text-gray-400 font-normal">(disable_sni)</span></span>
                                        </label>
                                        <span class="text-[10px] text-gray-400">标准 TLS 字段；勾选后 ClientHello 中不发送 server_name，可用于降低 SNI 暴露，但也可能导致某些服务器拒绝连接。</span>
                                    </div>

                                    <!-- TLS 版本：通用 TLS 字段；cipher_suites 仅 TCP TLS 1.0–1.2 有意义 -->
                                    <div v-if="isNodeTlsVersionSupported(node)" class="grid grid-cols-2 gap-3">
                                        <div>
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">最低 TLS 版本 <span class="normal-case font-normal text-gray-300">(min_version)</span></label>
                                            <select v-model="node.tls_min_version" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                                <option value="">{{ isNodeQuicTlsContext(node) ? '默认 (QUIC 通常为 TLS 1.3)' : '默认 (TLS 1.2)' }}</option>
                                                <option value="1.0" :disabled="isNodeQuicTlsContext(node)">TLS 1.0</option>
                                                <option value="1.1" :disabled="isNodeQuicTlsContext(node)">TLS 1.1</option>
                                                <option value="1.2" :disabled="isNodeQuicTlsContext(node)">TLS 1.2</option>
                                                <option value="1.3">TLS 1.3</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">最高 TLS 版本 <span class="normal-case font-normal text-gray-300">(max_version)</span></label>
                                            <select v-model="node.tls_max_version" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                                <option value="">{{ isNodeQuicTlsContext(node) ? '默认 (QUIC 通常为 TLS 1.3)' : '默认 (TLS 1.3)' }}</option>
                                                <option value="1.0" :disabled="isNodeQuicTlsContext(node)">TLS 1.0</option>
                                                <option value="1.1" :disabled="isNodeQuicTlsContext(node)">TLS 1.1</option>
                                                <option value="1.2" :disabled="isNodeQuicTlsContext(node)">TLS 1.2</option>
                                                <option value="1.3">TLS 1.3</option>
                                            </select>
                                        </div>
                                        <div v-if="isNodeQuicTlsContext(node)" class="col-span-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[10px] font-medium text-sky-700">
                                            当前是 QUIC TLS 场景，实际通常只使用 <code>TLS 1.3</code>；保留 <code>min_version / max_version</code> 是为了和官方字段保持一致，但一般建议留空或显式设为 <code>1.3</code>。
                                        </div>
                                        <div class="col-span-2">
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">
                                                加密套件 <span class="normal-case font-normal text-gray-300">(cipher_suites · 逗号分隔 · 仅 TLS 1.0–1.2)</span>
                                            </label>
                                            <select v-model="node.cipher_suites" :disabled="!isNodeCipherSuitesMeaningful(node)" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none bg-white focus:ring-1 font-mono disabled:opacity-40">
                                                <option value="">默认（推荐留空）</option>
                                                <option value="TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256">AES-128-GCM (ECDHE)</option>
                                                <option value="TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384">AES-256-GCM (ECDHE)</option>
                                                <option value="TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256,TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256">ChaCha20-Poly1305 (ECDHE)</option>
                                                <option value="TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256,TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256">AES-128-GCM + ChaCha20（均衡）</option>
                                            </select>
                                            <p class="mt-1 text-[10px] font-medium text-amber-700">
                                                仅对 TCP TLS 的 TLS 1.0–1.2 有意义；
                                                <span v-if="isNodeQuicTlsContext(node)">当前是 QUIC TLS，实际使用 TLS 1.3，此项会自动禁用。</span>
                                                <span v-else>如果最低 TLS 版本已设为 <code>1.3</code>，此项会自动禁用。</span>
                                            </p>
                                        </div>
                                    </div>

                                    <!-- 握手分片：仅 TCP TLS 协议有效，QUIC 无效 -->
                                    <div v-if="isNodeTlsFragmentSupported(node)" class="pt-2 border-t border-gray-200">
                                        <div class="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-wider">握手分片（绕过简单防火墙）</div>
                                        <div class="flex flex-wrap gap-4 items-start">
                                            <label class="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" v-model="node.tls_record_fragment" class="w-4 h-4 text-sky-600 rounded">
                                                <span class="text-xs font-bold text-gray-700">TLS Record 分片 <span class="text-gray-400 font-normal">(record_fragment)</span></span>
                                            </label>
                                            <label class="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" v-model="node.tls_fragment" class="w-4 h-4 text-amber-600 rounded">
                                                <span class="text-xs font-bold text-gray-700">TCP 层分片 <span class="text-gray-400 font-normal">(fragment · 性能差，慎用)</span></span>
                                            </label>
                                            <div v-if="node.tls_fragment" class="flex items-center gap-2">
                                                <label class="text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">回退延迟</label>
                                                <input type="text" v-model="node.tls_fragment_fallback_delay" placeholder="500ms" class="w-24 px-2 py-1 border border-gray-300 rounded-md text-xs outline-none font-mono bg-white focus:ring-1">
                                            </div>
                                        </div>
                                        <p class="text-[10px] text-gray-400 mt-1.5">仅对 TCP TLS 场景有意义；QUIC / Hysteria / TUIC 不适用。建议优先尝试 Record 分片，性能更好；两者均仅针对明文包匹配型防火墙有效，不用于绕过实质性审查。</p>
                                    </div>

                                    <!-- ECH：所有 TLS 协议均支持 -->
                                    <div class="pt-2 border-t border-gray-200">
                                        <label class="flex items-center gap-2 cursor-pointer mb-2">
                                            <input type="checkbox" v-model="node.ech_enabled" class="w-4 h-4 text-violet-600 rounded">
                                            <span class="text-xs font-bold text-gray-700">
                                                启用 ECH <span class="text-gray-400 font-normal">(Encrypted Client Hello · 加密 ClientHello 隐藏 SNI)</span>
                                            </span>
                                        </label>
                                        <div v-if="node.ech_enabled" class="mt-2">
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">ECH 配置 (PEM · 每行一条，留空则从 DNS 自动获取)</label>
                                            <textarea v-model="node.ech_config" rows="3" placeholder="-----BEGIN ECH CONFIGS-----&#10;...&#10;-----END ECH CONFIGS-----" class="w-full px-3 py-2 border border-violet-200 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1 focus:border-violet-400 resize-none"></textarea>
                                            <p class="text-[10px] text-gray-400 mt-1">留空时 sing-box 自动从 DNS HTTPS 记录中查询 ECH 配置（需 DNS 支持）</p>
                                        </div>
                                    </div>

                                </div>
                            </details>
                        </div>
                        <div v-if="hasNodeDialOptions(node)" class="mt-3">
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
                        </div>
                    </div>
                    <div class="mt-4 flex justify-end">
                        <button @click="addNode('bottom')" class="text-sm bg-white border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-50 font-bold shadow-sm transition"><i class="fas fa-plus mr-1.5"></i>新建节点</button>
                    </div>
                </div>
`);
const GroupsTab = createInjectedComponent('GroupsTab', `                <div v-show="currentTab==='groups'" class="space-y-5">
                    <div class="sticky top-0 z-20 flex flex-wrap justify-between items-center gap-3 bg-white/95 backdrop-blur p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-base font-extrabold text-gray-800"><i class="fas fa-layer-group mr-2 text-indigo-500"></i>策略组管理</span>
                            <span v-if="duplicateOutboundTags.length>0" class="badge bg-red-100 text-red-700 border border-red-200"><i class="fas fa-exclamation-triangle mr-1"></i>Tag 重名: {{ duplicateOutboundTags.join(', ') }}</span>
                        </div>
                        <div class="flex flex-wrap gap-3">
                            <button @click="generateCountryGroups" class="text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg hover:bg-emerald-100 transition"><i class="fas fa-globe-asia mr-2"></i>自动生成地区组</button>
                            <button @click="collapseAllGroups" class="text-sm font-bold bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"><i class="fas fa-compress-alt mr-2"></i>一键折叠</button>
                            <button @click="expandAllGroups" class="text-sm font-bold bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"><i class="fas fa-expand-alt mr-2"></i>一键展开</button>
                            <button @click="addGroup" class="text-sm font-bold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 shadow-md transition"><i class="fas fa-plus mr-2"></i>新建策略组</button>
                        </div>
                    </div>
                    
                    <div v-for="(group,gIdx) in groups" :key="group.id" 
                         @focusin.capture="queueJsonScrollToTarget('group', group, $event)"
                         @input.capture="queueJsonScrollToTarget('group', group, $event)"
                         @change.capture="queueJsonScrollToTarget('group', group, $event)"
                         :data-group-card-id="group.id"
                         :draggable="group.draggable || false"
                         @dragstart="onGroupDragStart(gIdx, $event)"
                         @dragenter.prevent="onGroupDragEnter(gIdx)"
                         @dragover.prevent
                         @drop="onGroupDrop(gIdx)"
                         @dragend="onGroupDragEnd"
                         :class="{
                             'opacity-40 border-dashed border-indigo-400': draggedGroupIndex === gIdx,
                             'shadow-[0_-3px_0_0_#4f46e5] border-indigo-300 z-10': dragOverGroupIndex === gIdx && draggedGroupIndex > gIdx,
                             'shadow-[0_3px_0_0_#4f46e5] border-indigo-300 z-10': dragOverGroupIndex === gIdx && draggedGroupIndex < gIdx,
                             'ring-2 ring-indigo-200 border-indigo-300': highlightedGroupId === group.id
                         }"
                         class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative hover:border-indigo-300 transition-all">
                        
                        <div class="absolute top-4 right-4 flex items-center gap-2 z-20">
                            <button @click="toggleGroupCollapsed(gIdx)" class="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 w-7 h-7 flex justify-center items-center rounded-lg transition-colors" :title="group.collapsed ? '展开卡片' : '折叠卡片'">
                                <i :class="group.collapsed ? 'fas fa-chevron-down text-sm' : 'fas fa-chevron-up text-sm'"></i>
                            </button>
                            <button @click="removeGroup(gIdx)" class="text-red-400 hover:text-white hover:bg-red-500 w-7 h-7 flex justify-center items-center rounded-lg transition-colors"><i class="fas fa-trash-alt text-sm"></i></button>
                        </div>
                        
                        <div class="flex items-start gap-4 pr-20" :class="group.collapsed ? 'mb-1' : 'mb-4'">
                            <div class="flex items-center justify-center shrink-0 w-8 h-8 cursor-move text-gray-400 hover:text-indigo-600 bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-colors mt-6" 
                                 title="按住此处拖动排顺"
                                 @mouseenter="group.draggable = true"
                                 @mouseleave="group.draggable = false"
                                 @mousedown="group.draggable = true"
                                 @mouseup="group.draggable = false">
                                <i class="fas fa-grip-vertical"></i>
                            </div>
                            
                            <div class="flex-1 grid grid-cols-12 gap-3">
                                <div class="col-span-5"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-wider">组名称</label><input type="text" data-group-name-input="true" :value="group.tag" @change="updateGroupTag(gIdx, $event.target.value)" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-bold text-indigo-700 outline-none focus:bg-white focus:ring-1"></div>
                                <div class="col-span-3"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-wider">策略</label>
                                    <select v-model="group.type" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 outline-none focus:bg-white focus:ring-1">
                                        <option value="selector">手动选择</option><option value="urltest">自动测速</option>
                                    </select>
                                </div>
                                <div class="col-span-4"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-wider">正则过滤 (匹配节点名称)</label><input type="text" v-model="group.regex" placeholder="港|HK" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none text-emerald-600 font-mono focus:bg-white focus:ring-1"></div>
                            </div>
                        </div>
                        
                        <div class="ml-12 flex flex-wrap items-center gap-2" :class="group.collapsed ? '' : 'mb-4'">
                            <span class="badge bg-gray-100 text-gray-600 border border-gray-200">节点选择 {{ group.members.length }} 项</span>
                            <span v-if="group.type==='urltest'" class="badge bg-blue-50 text-blue-700 border border-blue-200">自动测速组</span>
                            <span v-if="group.collapsed" class="text-xs text-gray-400 font-semibold">下半部分已折叠</span>
                        </div>

                        <div v-if="!group.collapsed" class="ml-12 space-y-4">
                            <div v-if="group.type==='urltest'" class="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">URL</label><input type="text" v-model="group.url" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">测速间隔</label><input type="text" v-model="group.interval" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">容差(ms)</label><input type="number" v-model.number="group.tolerance" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none"></div>
                            </div>
                            <div class="border-t border-gray-100 pt-3">
                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-wider">节点选择</label>
                                <div class="flex flex-wrap gap-2">
                                    <label v-for="tag in getAllPossibleMembers(group.tag)" :key="'m'+tag" class="inline-flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-white hover:border-indigo-300 transition-colors shadow-sm">
                                        <input type="checkbox" :value="tag" v-model="group.members" class="w-3.5 h-3.5 text-indigo-600 rounded mr-2">
                                        <span class="text-xs font-semibold text-gray-700">{{ tag }}</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
`);
const RulesTab = createInjectedComponent('RulesTab', `                <div v-show="currentTab==='rules'" class="space-y-5">
                    
                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                            <div>
                                <div class="stitle mb-0">规则集配置 (Rule Sets)</div>
                                <p class="text-xs text-gray-500 mt-1 pl-3">在此配置远程规则集库，供下方的rule-set路由规则引用。<br>默认使用MetaCubeX库（https://github.com/MetaCubeX/meta-rules-dat/tree/sing/geo）。<br>输入 geosite/ip-xxx 后自动补全。使用第三方库，删除自动生成的链接后自行填入。</p>
                            </div>
                            <button @click="addRuleSet" class="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 font-bold shadow-md transition"><i class="fas fa-plus mr-1.5"></i>添加规则集</button>
                        </div>
                        <div class="space-y-3 max-h-[360px] overflow-y-auto pr-2" ref="ruleSetContainer">
                            <div v-for="(rs, idx) in ruleSets" :key="rs.id" @focusin.capture="queueJsonScrollToTarget('rule-set', rs, $event)" @input.capture="queueJsonScrollToTarget('rule-set', rs, $event)" @change.capture="queueJsonScrollToTarget('rule-set', rs, $event)" class="grid grid-cols-12 gap-2 items-center bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors shadow-sm">
                                <input type="text" v-model="rs.tag" placeholder="标签(如 geosite-cn)" @change="onRuleSetTagChange(rs)" class="col-span-2 px-2 py-2 text-xs font-bold border border-gray-300 rounded-lg outline-none text-indigo-700 focus:bg-white focus:ring-1">
                                <select v-model="rs.format" @change="onRuleSetFormatChange(rs)" class="col-span-2 px-2 py-2 text-xs font-bold text-gray-700 border border-gray-300 rounded-lg outline-none focus:bg-white focus:ring-1">
                                    <option value="binary">binary</option>
                                    <option value="source">source</option>
                                </select>
                                <input type="text" v-model="rs.url" placeholder="https://..." class="col-span-3 px-2 py-2 text-[11px] font-mono border border-gray-300 rounded-lg outline-none text-gray-600 focus:bg-white focus:ring-1">
                                <select v-model="rs.detour" class="col-span-2 px-2 py-2 text-xs font-bold border border-gray-300 rounded-lg outline-none focus:bg-white focus:ring-1">
                                    <option value="direct">direct</option>
                                    <option v-for="tag in availableOutboundTags" :value="tag">{{ tag }}</option>
                                </select>
                                <input type="text" v-model="rs.update_interval" placeholder="更新(1d)" class="col-span-2 px-2 py-2 text-xs font-bold border border-gray-300 rounded-lg outline-none text-gray-700 focus:bg-white focus:ring-1">
                                <button @click="removeRuleSet(idx)" class="col-span-1 mx-auto w-8 h-8 flex justify-center items-center text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-colors shadow-sm"><i class="fas fa-trash-alt text-sm"></i></button>
                            </div>
                            <div v-if="ruleSets.length === 0" class="text-center text-sm font-bold text-gray-400 py-6 border-2 border-dashed border-gray-200 rounded-xl">暂无规则集配置，请点击右上方添加。</div>
                        </div>
                    </div>

                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                            <div>
                                <div class="stitle mb-0">路由规则 (Route Rules)</div>
                                <p class="text-xs text-gray-500 mt-1 pl-3">从上到下顺序匹配。按住左侧 <i class="fas fa-grip-vertical mx-1"></i> 图标可拖拽排序。</p>
                            </div>
                            <button @click="addCustomRule('top')" class="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 font-bold shadow-md transition"><i class="fas fa-plus mr-1.5"></i>新建规则</button>
                        </div>
                        
                        <div class="mb-5 p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex flex-wrap gap-5 items-center shadow-sm">
                            <span class="text-sm font-extrabold text-indigo-800"><i class="fas fa-cloud-download-alt mr-2"></i>默认拉取设置:</span>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" v-model="settings.rule_set_cdn" class="w-4 h-4 text-indigo-600 rounded">
                                <span class="text-xs text-gray-700 font-bold">使用 cdn.jsdelivr.net 加速下载 (国内推荐)</span>
                            </label>
                            <div class="flex items-center gap-2 ml-auto">
                                <span class="text-xs text-gray-700 font-bold">全局默认出站:</span>
                                <select v-model="settings.rule_set_detour" class="px-3 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs outline-none font-bold text-indigo-700 shadow-sm focus:ring-1">
                                    <option value="direct">direct (直连)</option>
                                    <option v-for="tag in availableOutboundTags" :value="tag">{{ tag }}</option>
                                </select>
                            </div>
                        </div>

                        <div class="mb-5 p-3 bg-blue-50/50 border border-blue-200 rounded-xl shadow-sm">
                            <p class="text-xs text-blue-800 font-extrabold mb-3 pl-1"><i class="fas fa-shield-alt mr-1.5"></i>内建防护与探测 (Action 控制):</p>
                            <div class="flex flex-wrap gap-3 items-center">
                                <label class="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors shadow-sm">
                                    <input type="checkbox" v-model="settings.private_direct" class="w-4 h-4 text-blue-600 rounded">
                                    <span class="text-xs text-blue-800 font-bold">私有IP直连 (ip_is_private)</span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors shadow-sm">
                                    <input type="checkbox" v-model="settings.hijack_dns" class="w-4 h-4 text-blue-600 rounded">
                                    <span class="text-xs text-blue-800 font-bold">拦截DNS解析 (hijack-dns)</span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors shadow-sm">
                                    <input type="checkbox" v-model="settings.sniff_enabled" class="w-4 h-4 text-blue-600 rounded">
                                    <span class="text-xs text-blue-800 font-bold">启用嗅探 (sniff)</span>
                                </label>
                                <template v-if="settings.sniff_enabled">
                                    <label class="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-blue-200 shadow-sm hover:border-blue-300">
                                        <input type="checkbox" v-model="settings.sniff_override_destination" class="w-4 h-4 text-blue-600 rounded">
                                        <span class="text-xs text-blue-800 font-bold">重写目标 (override_destination)</span>
                                    </label>
                                    <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm">
                                        <span class="text-xs text-blue-800 font-bold">嗅探超时:</span>
                                        <input type="text" v-model="settings.sniff_timeout" class="w-20 px-2 py-1 text-xs border border-blue-200 rounded-md outline-none text-center font-mono focus:ring-1 focus:border-blue-400">
                                    </div>
                                </template>
                            </div>
                        </div>

                        <details class="mb-5 group" :open="hasRouteDefaultOptions">
                            <summary class="flex items-center gap-2 cursor-pointer select-none px-4 py-3 bg-emerald-50/60 border border-emerald-200 rounded-xl shadow-sm text-sm font-extrabold text-emerald-800 hover:bg-emerald-50 transition-colors">
                                <i class="fas fa-chevron-right group-open:rotate-90 transition-transform text-[11px]"></i>
                                <i class="fas fa-network-wired mr-1"></i>Route 默认拨号策略
                                <span class="text-[10px] font-bold text-emerald-700 bg-white border border-emerald-200 px-2 py-0.5 rounded-full ml-1">高级</span>
                                <span v-if="hasRouteDefaultOptions" class="ml-auto badge bg-emerald-100 text-emerald-700 border border-emerald-200">已配置</span>
                            </summary>
                            <div class="mt-2 p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl shadow-sm space-y-3">
                                <div class="flex flex-wrap gap-4 items-center">
                                    <label class="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-emerald-200 shadow-sm">
                                        <input type="checkbox" v-model="settings.find_process" class="w-4 h-4 text-emerald-600 rounded">
                                        <span class="text-xs text-emerald-800 font-bold">启用进程匹配 (find_process)</span>
                                    </label>
                                    <div class="flex items-center gap-2 ml-auto">
                                        <span class="text-xs text-gray-700 font-bold">default_network_strategy:</span>
                                        <select v-model="settings.default_network_strategy" class="px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs outline-none font-bold text-emerald-700 shadow-sm focus:ring-1">
                                            <option value="">默认</option>
                                            <option value="default">default</option>
                                            <option value="hybrid">hybrid</option>
                                            <option value="fallback">fallback</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="grid grid-cols-3 gap-3">
                                    <div>
                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">default_network_type <span class="normal-case font-normal text-gray-300">(逗号分隔)</span></label>
                                        <input v-model="settings.default_network_type" placeholder="wifi,cellular" class="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs outline-none font-mono focus:ring-1">
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">default_fallback_network_type <span class="normal-case font-normal text-gray-300">(逗号分隔)</span></label>
                                        <input v-model="settings.default_fallback_network_type" placeholder="ethernet,other" class="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs outline-none font-mono focus:ring-1">
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">default_fallback_delay</label>
                                        <input v-model="settings.default_fallback_delay" placeholder="300ms" class="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs outline-none font-mono focus:ring-1">
                                    </div>
                                </div>
                                <p class="text-[10px] text-emerald-800">网络类型支持 <code>wifi</code>、<code>cellular</code>、<code>ethernet</code>、<code>other</code>。这些字段会作为 route 顶层默认拨号策略输出。</p>
                            </div>
                        </details>

                        <div class="space-y-3">
                            <div v-for="(rule,rIdx) in routeRules" :key="rule.id" 
                                 @focusin.capture="queueJsonScrollToTarget('route-rule', rule, $event)"
                                 @input.capture="queueJsonScrollToTarget('route-rule', rule, $event)"
                                 @change.capture="queueJsonScrollToTarget('route-rule', rule, $event)"
                                 :id="'route-rule-' + rule.id"
                                 :draggable="rule.draggable || false"
                                 @dragstart="onRuleDragStart(rIdx, $event)"
                                 @dragenter.prevent="onRuleDragEnter(rIdx)"
                                 @dragover.prevent
                                 @drop="onRuleDrop(rIdx)"
                                 @dragend="onRuleDragEnd"
                                 :class="{
                                     'opacity-40 border-dashed border-indigo-400': draggedRuleIndex === rIdx,
                                     'shadow-[0_-3px_0_0_#4f46e5] border-indigo-300 z-10': dragOverRuleIndex === rIdx && draggedRuleIndex > rIdx,
                                     'shadow-[0_3px_0_0_#4f46e5] border-indigo-300 z-10': dragOverRuleIndex === rIdx && draggedRuleIndex < rIdx
                                 }"
                                 class="flex flex-col bg-gray-50 p-3 rounded-xl border border-gray-200 hover:border-indigo-300 transition-all shadow-sm">
                                
                                <div class="flex items-center">
                                    <div class="flex items-center justify-center shrink-0 w-8 h-8 cursor-move text-gray-400 hover:text-indigo-600 bg-white border border-gray-200 rounded-lg shadow-sm mr-3 transition-colors" 
                                         title="按住此处拖动排顺"
                                         @mouseenter="rule.draggable = true"
                                         @mouseleave="rule.draggable = false"
                                         @mousedown="rule.draggable = true"
                                         @mouseup="rule.draggable = false">
                                        <i class="fas fa-grip-vertical"></i>
                                    </div>
                                    
                                    <div class="w-[35%] flex items-center gap-3">
                                        <input type="checkbox" v-model="rule.enabled" class="w-5 h-5 text-indigo-600 rounded shrink-0 transition-colors cursor-pointer">
                                        <input v-if="rule.isEditing" type="text" v-model="rule.name" class="px-3 py-1.5 text-sm font-extrabold border border-indigo-300 rounded-md w-full outline-none focus:ring-2 focus:ring-indigo-200 text-indigo-800">
                                        <span v-else class="text-sm font-extrabold text-gray-800 truncate w-full" :title="rule.name" :class="{'opacity-50 line-through':!rule.enabled}">{{ rule.name }}</span>
                                    </div>
                                    <div class="flex-1 flex items-center justify-end gap-3 pl-3">
                                        <i class="fas fa-arrow-right text-gray-300 text-sm"></i>
                                        <template v-if="!rule.isEditing">
                                            <select v-model="rule.action" @change="onRuleActionChange(rule)" :disabled="!rule.enabled" class="w-[150px] px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none font-black text-indigo-700 disabled:opacity-50 shadow-sm focus:ring-1 focus:border-indigo-400">
                                                <option v-for="action in ruleActions" :key="action" :value="action" :disabled="!isRuleActionSelectable(rule, action)">{{ action }}</option>
                                            </select>
                                            <select v-if="rule.action==='route'" v-model="rule.outbound" :disabled="!rule.enabled" class="w-[140px] px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none font-black text-indigo-700 disabled:opacity-50 shadow-sm focus:ring-1 focus:border-indigo-400">
                                                <option v-for="tag in availableOutboundTags" :value="tag">{{ tag }}</option>
                                            </select>
                                        </template>
                                        <template v-else>
                                            <span class="text-[10px] font-black text-emerald-700 border border-emerald-200 bg-emerald-50 px-2 py-1 rounded shadow-sm">{{ rule.action }}</span>
                                            <span v-if="rule.action==='route'" class="text-[10px] font-black text-indigo-700 border border-indigo-200 bg-indigo-50 px-2 py-1 rounded shadow-sm">{{ rule.outbound }}</span>
                                        </template>
                                        <button @click="removeRule(rIdx)" class="w-9 h-9 flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500 rounded-lg bg-white border border-red-200 transition-colors shadow-sm"><i class="fas fa-trash-alt text-sm"></i></button>
                                    </div>
                                </div>
                                
                                <div v-if="rule.enabled" class="mt-4 pl-[2.75rem] flex items-start gap-3">
                                    <template v-if="rule.isEditing">
                                        <div class="flex-1 flex flex-col gap-3">
                                            <div class="flex flex-col gap-1.5">
                                                <div class="flex items-center gap-4 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100" :class="{'opacity-60 grayscale': rule.conditions.length < 2}">
                                                    <span class="text-xs font-bold text-indigo-800"><i class="fas fa-code-branch mr-1.5"></i>规则逻辑:</span>
                                                    <label class="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-gray-700 hover:text-indigo-600 transition-colors">
                                                        <input type="radio" v-model="rule.mode" value="and" :disabled="rule.conditions.length < 2" class="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                                        全部满足 (AND)
                                                    </label>
                                                    <label class="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-gray-700 hover:text-indigo-600 transition-colors">
                                                        <input type="radio" v-model="rule.mode" value="or" :disabled="rule.conditions.length < 2" class="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                                        满足任一 (OR)
                                                    </label>
                                                    <div class="w-px h-3.5 bg-gray-300 mx-1"></div>
                                                    <label class="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-gray-700 hover:text-red-500 transition-colors">
                                                        <input type="checkbox" v-model="rule.invert" class="w-3.5 h-3.5 rounded text-red-500 focus:ring-red-500">
                                                        <span :class="rule.invert ? 'text-red-600 font-bold' : ''">取反 (NOT)</span>
                                                    </label>
                                                </div>
                                                <div v-if="rule.conditions.length < 2" class="text-[10px] text-gray-400 font-medium pl-1">
                                                    * 提示：当前仅 1 行条件（框内逗号分隔天然为"或"关系，性能更优）。需点击下方"添加条件"增加到 2 行以上方可组合。
                                                </div>
                                            </div>
                                    
                                            <div class="space-y-2">
                                                <div v-for="(cond, cIdx) in rule.conditions" :key="cIdx" class="flex flex-col gap-1.5 p-2 bg-white border border-gray-200 rounded-lg shadow-sm relative pr-10">
                                                    <button @click="rule.conditions.splice(cIdx, 1)" class="absolute top-2 right-2 w-7 h-7 flex items-center justify-center text-red-400 hover:text-white hover:bg-red-500 rounded-md transition-colors"><i class="fas fa-times text-xs"></i></button>
                                                    <div class="flex items-center gap-2">
                                                        <select v-model="cond.type" class="px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-md outline-none bg-gray-50 text-gray-700 shadow-sm w-[130px]">
                                                            <optgroup label="域名与规则集">
                                                                <option value="rule_set">rule_set</option>
                                                                <option value="domain_suffix">domain_suffix</option>
                                                                <option value="domain_keyword">domain_keyword</option>
                                                                <option value="domain">domain</option>
                                                                <option value="domain_regex">domain_regex</option>
                                                                <option value="auth_user">auth_user</option>
                                                                <option value="client">client</option>
                                                            </optgroup>
                                                            <optgroup label="IP 与网络">
                                                                <option value="ip_version">ip_version</option>
                                                                <option value="network">network (tcp/udp)</option>
                                                                <option value="network_type">network_type</option>
                                                                <option value="port">port</option>
                                                                <option value="source_port">source_port</option>
                                                                <option value="port_range">port_range</option>
                                                                <option value="source_port_range">source_port_range</option>
                                                                <option value="ip_cidr">ip_cidr</option>
                                                                <option value="source_ip_cidr">source_ip_cidr</option>
                                                                <option value="source_geoip">source_geoip</option>
                                                            </optgroup>
                                                            <optgroup label="协议与应用">
                                                                <option value="protocol">protocol</option>
                                                                <option value="process_name">process_name</option>
                                                                <option value="process_path">process_path</option>
                                                                <option value="package_name">package_name</option>
                                                                <option value="user">user</option>
                                                                <option value="user_id">user_id</option>
                                                                <option value="geoip">geoip (旧版)</option>
                                                                <option value="inbound">inbound</option>
                                                            </optgroup>
                                                        </select>
                                        
                                                        <div v-if="cond.type === 'network'" class="flex-1 flex items-center gap-5 px-3 py-1.5 bg-white border border-indigo-300 rounded-md shadow-sm min-h-[34px]">
                                                            <label class="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700 hover:text-indigo-600 transition-colors">
                                                                <input type="checkbox" :checked="cond.value.split(',').map(s=>s.trim()).includes('tcp')" @change="toggleRuleSetCond(cond, 'tcp')" class="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500">
                                                                TCP
                                                            </label>
                                                            <label class="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700 hover:text-indigo-600 transition-colors">
                                                                <input type="checkbox" :checked="cond.value.split(',').map(s=>s.trim()).includes('udp')" @change="toggleRuleSetCond(cond, 'udp')" class="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500">
                                                                UDP
                                                            </label>
                                                        </div>
                                                        <div v-else-if="cond.type === 'network_type'" class="flex-1 flex items-center gap-5 px-3 py-1.5 bg-white border border-indigo-300 rounded-md shadow-sm min-h-[34px]">
                                                            <label class="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700 hover:text-indigo-600 transition-colors">
                                                                <input type="checkbox" :checked="cond.value.split(',').map(s=>s.trim()).includes('wifi')" @change="toggleRuleSetCond(cond, 'wifi')" class="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500">
                                                                Wi-Fi
                                                            </label>
                                                            <label class="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700 hover:text-indigo-600 transition-colors">
                                                                <input type="checkbox" :checked="cond.value.split(',').map(s=>s.trim()).includes('cellular')" @change="toggleRuleSetCond(cond, 'cellular')" class="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500">
                                                                Cellular
                                                            </label>
                                                            <label class="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700 hover:text-indigo-600 transition-colors">
                                                                <input type="checkbox" :checked="cond.value.split(',').map(s=>s.trim()).includes('ethernet')" @change="toggleRuleSetCond(cond, 'ethernet')" class="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500">
                                                                Ethernet
                                                            </label>
                                                            <label class="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700 hover:text-indigo-600 transition-colors">
                                                                <input type="checkbox" :checked="cond.value.split(',').map(s=>s.trim()).includes('other')" @change="toggleRuleSetCond(cond, 'other')" class="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500">
                                                                Other
                                                            </label>
                                                        </div>
                                                        <select v-else-if="cond.type === 'ip_version'" v-model="cond.value" class="flex-1 px-3 py-1.5 bg-white border border-indigo-300 rounded-md text-xs font-mono outline-none focus:ring-1 focus:ring-indigo-300 shadow-sm text-gray-700">
                                                            <option value="">选择 IP 版本</option>
                                                            <option value="4">IPv4</option>
                                                            <option value="6">IPv6</option>
                                                        </select>
                                                        <div v-else-if="cond.type === 'protocol'" class="flex-1 space-y-2">
                                                            <div class="flex flex-wrap gap-2 px-3 py-2 bg-white border border-indigo-300 rounded-md shadow-sm min-h-[34px]">
                                                                <button v-for="protocol in sniffProtocols" :key="protocol"
                                                                    @click="toggleRuleSetCond(cond, protocol)"
                                                                    :class="cond.value.split(',').map(s=>s.trim()).includes(protocol)
                                                                        ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                                                                        : 'bg-gray-50 text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'"
                                                                    class="px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all cursor-pointer select-none">
                                                                    {{ protocol }}
                                                                </button>
                                                            </div>
                                                            <input type="text" v-model="cond.value" placeholder="可继续手动补充，多个用逗号分隔" class="w-full px-3 py-1.5 bg-white border border-indigo-300 rounded-md text-xs font-mono outline-none focus:ring-1 focus:ring-indigo-300 shadow-sm text-gray-700">
                                                        </div>
                                                        <div v-else-if="cond.type === 'inbound'" class="flex-1 space-y-2">
                                                            <div class="flex flex-wrap gap-2 px-3 py-2 bg-white border border-indigo-300 rounded-md shadow-sm min-h-[34px]">
                                                                <button v-for="tag in availableInboundTags" :key="tag"
                                                                    @click="toggleRuleSetCond(cond, tag)"
                                                                    :class="cond.value.split(',').map(s=>s.trim()).includes(tag)
                                                                        ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                                                                        : 'bg-gray-50 text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'"
                                                                    class="px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all cursor-pointer select-none">
                                                                    {{ tag }}
                                                                </button>
                                                            </div>
                                                            <input type="text" v-model="cond.value" placeholder="可继续手动补充入站 tag，多个用逗号分隔" class="w-full px-3 py-1.5 bg-white border border-indigo-300 rounded-md text-xs font-mono outline-none focus:ring-1 focus:ring-indigo-300 shadow-sm text-gray-700">
                                                        </div>
                                                        <input v-else type="text" v-model="cond.value" :placeholder="cond.type==='source_port' ? '源端口，多个用逗号分隔' : cond.type==='source_port_range' ? '源端口范围，如 1000:2000' : cond.type==='source_geoip' ? '如 cn,private' : cond.type==='process_path' ? '/usr/bin/curl,/usr/bin/wget' : cond.type==='package_name' ? 'com.example.app' : cond.type==='user' ? 'nobody,root' : cond.type==='user_id' ? '0,1000' : cond.type==='client' ? 'clash,stash' : cond.type==='auth_user' ? 'user-a,user-b' : '值 (多个用逗号分隔)'" class="flex-1 px-3 py-1.5 bg-white border border-indigo-300 rounded-md text-xs font-mono outline-none focus:ring-1 focus:ring-indigo-300 shadow-sm text-gray-700">
                                                    </div>
                                                    
                                                    <div v-if="cond.type === 'rule_set'" class="flex flex-wrap gap-1.5 mt-1">
                                                        <button v-for="rs in ruleSets" :key="rs.id"
                                                            @click="toggleRuleSetCond(cond, rs.tag)"
                                                            :class="cond.value.split(',').map(s=>s.trim()).includes(rs.tag)
                                                                ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                                                                : 'bg-gray-50 text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'"
                                                            class="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all cursor-pointer select-none">
                                                            <i :class="cond.value.split(',').map(s=>s.trim()).includes(rs.tag) ? 'fas fa-check-circle' : 'far fa-circle'"></i>
                                                            {{ rs.tag }}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-3">
                                                <div class="grid grid-cols-3 gap-3 items-end">
                                                    <div>
                                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">规则动作</label>
                                                        <select v-model="rule.action" @change="onRuleActionChange(rule)" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm outline-none font-bold text-emerald-700 shadow-sm focus:ring-1">
                                                            <option v-for="action in ruleActions" :key="action" :value="action" :disabled="!isRuleActionSelectable(rule, action)">{{ action }}</option>
                                                        </select>
                                                    </div>
                                                    <div v-if="rule.action==='route'" class="col-span-2">
                                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">出站</label>
                                                        <select v-model="rule.outbound" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm outline-none font-bold text-indigo-700 shadow-sm focus:ring-1">
                                                            <option v-for="tag in availableOutboundTags" :value="tag">{{ tag }}</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div v-if="!isRuleActionSelectable(rule, 'hijack-dns') || !isRuleActionSelectable(rule, 'sniff') || !isRuleActionSelectable(rule, 'resolve')" class="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 space-y-1">
                                                    <div v-if="!isRuleActionSelectable(rule, 'hijack-dns')"><strong>hijack-dns</strong>：{{ getRuleActionDisabledReason(rule, 'hijack-dns') }}</div>
                                                    <div v-if="!isRuleActionSelectable(rule, 'sniff')"><strong>sniff</strong>：{{ getRuleActionDisabledReason(rule, 'sniff') }}</div>
                                                    <div v-if="!isRuleActionSelectable(rule, 'resolve')"><strong>resolve</strong>：{{ getRuleActionDisabledReason(rule, 'resolve') }}</div>
                                                </div>

                                                <div v-if="rule.action==='reject'" class="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">拒绝方式 (Reject Method)</label>
                                                        <select v-model="rule.reject_method" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm outline-none font-bold text-gray-700 shadow-sm focus:ring-1">
                                                            <option value="default">default</option>
                                                            <option value="drop">drop</option>
                                                            <option value="reply">reply</option>
                                                        </select>
                                                        <p class="mt-1 text-[10px] font-medium text-gray-500">控制拒绝时是直接丢弃还是显式回应。</p>
                                                    </div>
                                                    <div class="flex items-end pb-2">
                                                        <label class="flex items-center gap-2 cursor-pointer">
                                                            <input type="checkbox" v-model="rule.reject_no_drop" class="w-4 h-4 text-emerald-600 rounded">
                                                            <span class="text-xs font-bold text-gray-700">不丢弃连接 (No Drop)</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                <div v-if="rule.action==='sniff'" class="space-y-3">
                                                    <div>
                                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">嗅探协议 (Sniffer)</label>
                                                        <div class="flex flex-wrap gap-2 px-3 py-2 bg-white border border-emerald-300 rounded-lg shadow-sm min-h-[38px]">
                                                            <button v-for="protocol in sniffProtocols" :key="protocol"
                                                                @click="toggleCsvField(rule, 'sniff_sniffer', protocol)"
                                                                :class="rule.sniff_sniffer.split(',').map(s=>s.trim()).includes(protocol)
                                                                    ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                                                                    : 'bg-gray-50 text-gray-600 border-gray-300 hover:border-emerald-400 hover:text-emerald-600'"
                                                                class="px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all cursor-pointer select-none">
                                                                {{ protocol }}
                                                            </button>
                                                        </div>
                                                        <p class="mt-1 text-[10px] font-medium text-gray-500">选择允许尝试识别的协议类型。</p>
                                                    </div>
                                                    <div class="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">自定义嗅探协议 (Custom Sniffer)</label>
                                                            <input v-model="rule.sniff_sniffer" placeholder="多个用逗号分隔" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs outline-none font-mono shadow-sm focus:ring-1">
                                                            <p class="mt-1 text-[10px] font-medium text-gray-500">用于补充上面未列出的协议名。</p>
                                                        </div>
                                                        <div>
                                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">超时 (Timeout)</label>
                                                            <input v-model="rule.sniff_timeout" placeholder="300ms" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs outline-none font-mono shadow-sm focus:ring-1">
                                                            <p class="mt-1 text-[10px] font-medium text-gray-500">限制嗅探等待时间，避免阻塞过久。</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div v-if="rule.action==='resolve'" class="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">解析服务器 (Resolve Server)</label>
                                                        <select v-model="rule.resolve_server" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm outline-none font-bold text-violet-700 shadow-sm focus:ring-1">
                                                            <option value="">默认 DNS</option>
                                                            <option v-for="tag in allDnsTags" :value="tag">{{ tag }}</option>
                                                        </select>
                                                        <p class="mt-1 text-[10px] font-medium text-violet-700">指定命中此规则时使用哪一个 DNS server 解析。</p>
                                                    </div>
                                                    <div>
                                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">解析策略 (Resolve Strategy)</label>
                                                        <select v-model="rule.resolve_strategy" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm outline-none shadow-sm focus:ring-1">
                                                            <option value="">默认</option>
                                                            <option value="prefer_ipv4">prefer_ipv4</option>
                                                            <option value="prefer_ipv6">prefer_ipv6</option>
                                                            <option value="ipv4_only">ipv4_only</option>
                                                            <option value="ipv6_only">ipv6_only</option>
                                                        </select>
                                                        <p class="mt-1 text-[10px] font-medium text-gray-500">控制解析结果偏好 IPv4 / IPv6。</p>
                                                    </div>
                                                    <div>
                                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">重写 TTL (Rewrite TTL)</label>
                                                        <input v-model="rule.resolve_rewrite_ttl" placeholder="60" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs outline-none font-mono shadow-sm focus:ring-1">
                                                        <p class="mt-1 text-[10px] font-medium text-gray-500">强制覆盖解析结果的 TTL。</p>
                                                    </div>
                                                    <div>
                                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">客户端子网 (Client Subnet)</label>
                                                        <input v-model="rule.resolve_client_subnet" placeholder="1.2.3.0/24" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs outline-none font-mono shadow-sm focus:ring-1">
                                                        <p class="mt-1 text-[10px] font-medium text-gray-500">向上游 DNS 携带客户端网段，常见于地理位置优化。</p>
                                                    </div>
                                                    <div class="col-span-2">
                                                        <label class="flex items-center gap-2 cursor-pointer">
                                                            <input type="checkbox" v-model="rule.resolve_disable_cache" class="w-4 h-4 text-emerald-600 rounded">
                                                            <span class="text-xs font-bold text-gray-700">禁用缓存 (Disable Cache)</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                <details v-if="shouldShowRuleRouteOptions(rule)" class="group" :open="hasRuleRouteOptions(rule)">
                                                    <summary class="flex items-center gap-2 cursor-pointer select-none px-3 py-2 bg-white rounded-lg border border-emerald-200 hover:bg-emerald-50 transition-colors text-xs font-bold text-emerald-800">
                                                        <i class="fas fa-chevron-right group-open:rotate-90 transition-transform text-[10px]"></i>
                                                        高级 route-options
                                                        <span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded-full">可选</span>
                                                        <span v-if="hasRuleRouteOptions(rule)" class="ml-auto badge bg-emerald-100 text-emerald-700 border border-emerald-200">已配置</span>
                                                        <span v-else-if="hasSuggestedRouteOptions(rule)" class="ml-auto badge bg-emerald-50 text-emerald-700 border border-emerald-200">按当前规则推荐</span>
                                                    </summary>
                                                    <div class="mt-2 space-y-3">
                                                        <div class="grid grid-cols-2 gap-3">
                                                            <div v-if="shouldSuggestRouteOptionField(rule, 'option_override_address')">
                                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">覆盖地址 (Override Address)</label>
                                                                <input v-model="rule.option_override_address" placeholder="1.1.1.1" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs outline-none font-mono shadow-sm focus:ring-1">
                                                                <p class="mt-1 text-[10px] font-medium text-gray-500">命中规则后，改写目标地址。</p>
                                                            </div>
                                                            <div v-if="shouldSuggestRouteOptionField(rule, 'option_override_port')">
                                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">覆盖端口 (Override Port)</label>
                                                                <input v-model="rule.option_override_port" placeholder="443" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs outline-none font-mono shadow-sm focus:ring-1">
                                                                <p class="mt-1 text-[10px] font-medium text-gray-500">命中规则后，改写目标端口。</p>
                                                            </div>
                                                            <div v-if="shouldSuggestRouteOptionField(rule, 'option_network_strategy')">
                                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">网络策略 (Network Strategy)</label>
                                                                <select v-model="rule.option_network_strategy" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm outline-none shadow-sm focus:ring-1">
                                                                    <option value="">默认</option>
                                                                    <option value="default">default</option>
                                                                    <option value="hybrid">hybrid</option>
                                                                    <option value="fallback">fallback</option>
                                                                </select>
                                                                <p class="mt-1 text-[10px] font-medium text-amber-700">更偏图形客户端 / 移动平台；与接口绑定类字段存在适用前提。</p>
                                                            </div>
                                                            <div v-if="shouldSuggestRouteOptionField(rule, 'option_fallback_delay')">
                                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">回退延迟 (Fallback Delay)</label>
                                                                <input v-model="rule.option_fallback_delay" placeholder="300ms" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs outline-none font-mono shadow-sm focus:ring-1">
                                                                <p class="mt-1 text-[10px] font-medium text-gray-500">仅在域名策略 / 网络策略回退时有意义。</p>
                                                            </div>
                                                            <div v-if="shouldSuggestRouteOptionField(rule, 'option_network_type')">
                                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">网络类型 (Network Type)</label>
                                                                <input v-model="rule.option_network_type" placeholder="wifi,cellular" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs outline-none font-mono shadow-sm focus:ring-1">
                                                                <p class="mt-1 text-[10px] font-medium text-gray-500">例如 <code>wifi</code> / <code>cellular</code>；通常配合网络策略使用。</p>
                                                            </div>
                                                            <div v-if="shouldSuggestRouteOptionField(rule, 'option_fallback_network_type')">
                                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">回退网络类型 (Fallback Network Type)</label>
                                                                <input v-model="rule.option_fallback_network_type" placeholder="ethernet,other" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs outline-none font-mono shadow-sm focus:ring-1">
                                                                <p class="mt-1 text-[10px] font-medium text-gray-500">仅对回退策略相关。</p>
                                                            </div>
                                                            <div v-if="shouldSuggestRouteOptionField(rule, 'option_udp_timeout')">
                                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">UDP 超时 (UDP Timeout)</label>
                                                                <input v-model="rule.option_udp_timeout" placeholder="5m" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs outline-none font-mono shadow-sm focus:ring-1">
                                                                <p class="mt-1 text-[10px] font-medium text-emerald-700">更适合 UDP / DNS / QUIC 相关流量。</p>
                                                            </div>
                                                            <div v-if="shouldSuggestRouteOptionField(rule, 'option_tls_fragment_fallback_delay')">
                                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">TLS 分片回退延迟 (TLS Fragment Fallback Delay)</label>
                                                                <input v-model="rule.option_tls_fragment_fallback_delay" placeholder="300ms" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs outline-none font-mono shadow-sm focus:ring-1">
                                                                <p class="mt-1 text-[10px] font-medium text-amber-700">更适合 TLS / 443 场景。</p>
                                                            </div>
                                                        </div>
                                                        <div class="flex flex-wrap gap-4 pt-2 border-t border-emerald-200">
                                                            <label v-if="shouldSuggestRouteOptionField(rule, 'option_udp_disable_domain_unmapping')" class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="rule.option_udp_disable_domain_unmapping" class="w-4 h-4 text-emerald-600 rounded"><span class="text-xs font-bold text-gray-700">禁用域名反解 (UDP Disable Domain Unmapping)</span></label>
                                                            <label v-if="shouldSuggestRouteOptionField(rule, 'option_udp_connect')" class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="rule.option_udp_connect" class="w-4 h-4 text-emerald-600 rounded"><span class="text-xs font-bold text-gray-700">连接式 UDP (UDP Connect)</span></label>
                                                            <label v-if="shouldSuggestRouteOptionField(rule, 'option_tls_fragment')" class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="rule.option_tls_fragment" class="w-4 h-4 text-emerald-600 rounded"><span class="text-xs font-bold text-gray-700">TLS 分片 (TLS Fragment)</span></label>
                                                            <label v-if="shouldSuggestRouteOptionField(rule, 'option_tls_record_fragment')" class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="rule.option_tls_record_fragment" class="w-4 h-4 text-emerald-600 rounded"><span class="text-xs font-bold text-gray-700">TLS Record 分片 (TLS Record Fragment)</span></label>
                                                        </div>
                                                    </div>
                                                </details>

                                                <div v-if="rule.action==='hijack-dns'" class="text-[11px] text-emerald-800 bg-white border border-emerald-200 rounded-lg px-3 py-2">
                                                    命中后会执行 <code>hijack-dns</code>，适合按条件把流量交给 sing-box DNS 模块处理。
                                                </div>
                                            </div>
                                    
                                            <div class="flex items-center mt-1">
                                                <button @click="rule.conditions.push({type: 'domain_suffix', value: ''})" class="text-xs font-bold bg-white text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 shadow-sm transition-colors">
                                                    <i class="fas fa-plus mr-1"></i>添加条件
                                                </button>
                                                <button @click="rule.isEditing=false" class="text-xs font-bold bg-emerald-500 text-white px-5 py-1.5 rounded-lg hover:bg-emerald-600 shadow-sm transition-colors ml-auto">
                                                    <i class="fas fa-check mr-1.5"></i>完成编辑
                                                </button>
                                            </div>
                                        </div>
                                    </template>
                                    <template v-else>
                                        <div class="flex-1 flex flex-wrap gap-2 items-center px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-inner min-h-[36px]">
                                            <span v-if="rule.invert" class="text-[10px] font-black text-red-500 border border-red-200 bg-red-50 px-1.5 py-0.5 rounded shadow-sm">NOT</span>
                                            <span v-if="rule.mode === 'or' && rule.conditions.length > 1" class="text-[10px] font-black text-amber-600 border border-amber-200 bg-amber-50 px-1.5 py-0.5 rounded shadow-sm">OR</span>
                                            <span v-if="rule.mode === 'and' && rule.conditions.length > 1" class="text-[10px] font-black text-blue-600 border border-blue-200 bg-blue-50 px-1.5 py-0.5 rounded shadow-sm">AND</span>
                                            <span class="text-[10px] font-black text-emerald-700 border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 rounded shadow-sm">{{ rule.action }}</span>
                                            <span v-if="rule.action==='route'" class="text-[10px] font-black text-indigo-700 border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 rounded shadow-sm">-> {{ rule.outbound }}</span>
                                            
                                            <template v-for="(cond, cIdx) in rule.conditions" :key="cIdx">
                                                <span v-if="cIdx > 0" class="text-[10px] font-bold text-gray-400">{{ rule.mode === 'or' ? '或' : '且' }}</span>
                                                <div class="flex items-center text-xs font-mono text-gray-600 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 max-w-[200px] shadow-sm">
                                                    <span class="font-bold text-gray-500 mr-1.5">{{ cond.type }}:</span>
                                                    <span class="truncate" :title="cond.value">{{ cond.value || '...' }}</span>
                                                </div>
                                            </template>
                                            <span v-if="!rule.conditions.length" class="text-xs text-gray-400 italic">（未配置任何条件）</span>
                                        </div>
                                        <button @click="rule.isEditing=true" class="text-sm font-bold bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 shrink-0 shadow-sm transition-colors"><i class="fas fa-edit"></i></button>
                                    </template>
                                </div>
                            </div>
                        </div>
                        <div class="mt-4 flex justify-end">
                            <button @click="addCustomRule('bottom')" class="text-sm bg-white border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-50 font-bold shadow-sm transition"><i class="fas fa-plus mr-1.5"></i>新建规则</button>
                        </div>
                        <div class="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 shadow-sm">
                            <span class="text-sm font-extrabold text-gray-800"><i class="fas fa-flag-checkered mr-2 text-indigo-500"></i>默认路由 (Final Outbound)</span>
                            <select v-model="settings.final_outbound" class="w-1/3 px-3 py-2 bg-white border border-indigo-300 rounded-lg text-sm outline-none font-black text-indigo-700 shadow-sm focus:ring-2 focus:ring-indigo-100">
                                <option v-for="tag in availableOutboundTags" :value="tag">{{ tag }}</option>
                            </select>
                        </div>
                    </div>
                </div>
`);
const TunTab = createInjectedComponent('TunTab', `                <div v-show="currentTab==='tun'" class="space-y-5">
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
const AdvancedTab = createInjectedComponent('AdvancedTab', `                <div v-show="currentTab==='advanced'" class="space-y-5">

                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm" @focusin.capture="queueJsonScrollToTarget('inbound', { tag: 'tproxy-in' }, $event)" @input.capture="queueJsonScrollToTarget('inbound', { tag: 'tproxy-in' }, $event)" @change.capture="queueJsonScrollToTarget('inbound', { tag: 'tproxy-in' }, $event)">
                        <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                            <div class="flex items-center gap-2">
                                <div class="stitle mb-0">Clash API + Web 面板</div>
                                <span class="badge bg-orange-100 text-orange-700 border border-orange-200">Experimental</span>
                            </div>
                            <label class="toggle-switch"><input type="checkbox" v-model="clashApi.enabled"><span class="toggle-slider"></span></label>
                        </div>
                        <div v-if="clashApi.enabled" class="space-y-5">
                            <div>
                                <p class="text-sm font-bold text-gray-600 mb-3">选择前端控制面板</p>
                                <div class="grid grid-cols-2 gap-3 mb-4">
                                    <div v-for="p in panels" :key="p.id" @click="pickPanel(p)" class="panel-card" :class="{selected:clashApi.panel===p.id}">
                                        <div class="flex items-center gap-3">
                                            <i :class="p.icon" class="text-indigo-500 w-6 text-center text-lg"></i>
                                            <div><div class="text-sm font-extrabold text-gray-800">{{ p.name }}</div><div class="text-[10px] text-gray-500 mt-1">{{ p.desc }}</div></div>
                                        </div>
                                    </div>
                                    <div @click="pickPanel({id:'custom',url:''})" class="panel-card" :class="{selected:clashApi.panel==='custom'}">
                                        <div class="flex items-center gap-3">
                                            <i class="fas fa-code text-gray-400 w-6 text-center text-lg"></i>
                                            <div><div class="text-sm font-extrabold text-gray-800">自定义 URL</div><div class="text-[10px] text-gray-500 mt-1">填写任意前端 ZIP 链接</div></div>
                                        </div>
                                    </div>
                                </div>
                                <div v-if="clashApi.panel">
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">external_ui_download_url</label>
                                    <input v-model="clashApi.download_url" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono focus:bg-white focus:ring-1">
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">监听地址</label><input v-model="clashApi.external_controller" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono focus:bg-white focus:ring-1"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">密钥 (Secret)</label><input v-model="clashApi.secret" placeholder="可选" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:bg-white focus:ring-1"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">本地 external_ui 目录</label><input v-model="clashApi.external_ui" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono focus:bg-white focus:ring-1"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">默认模式 (default_mode)</label>
                                    <select v-model="clashApi.default_mode" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:bg-white focus:ring-1">
                                        <option value="rule">rule（按规则分流）</option>
                                        <option value="global">global（全部走代理）</option>
                                        <option value="direct">direct（全部直连）</option>
                                    </select>
                                    <p class="text-[11px] text-gray-400 mt-1 leading-relaxed"><i class="fas fa-info-circle mr-1"></i>global / direct 需通过 <code class="bg-gray-100 px-1 rounded">clash_mode</code> 路由规则实现，配置文件会自动在路由最前端插入对应规则。</p>
                                </div>
                            </div>
                            <div class="flex flex-wrap gap-5 items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="clashApi.allow_lan" class="w-4 h-4 text-orange-600 rounded"><span class="text-sm font-bold text-gray-700">允许局域网设备访问 API</span></label>
                            </div>
                            <div v-if="clashApi.panel" class="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 shadow-sm">
                                <p class="text-xs text-indigo-800 font-bold mb-2"><i class="fas fa-link mr-1"></i>面板在线访问地址快捷链接</p>
                                <div class="flex flex-wrap gap-2">
                                    <a v-for="link in panelLinks" :key="link.name" :href="link.url" target="_blank" rel="noopener noreferrer" class="text-xs font-semibold text-indigo-700 hover:text-white hover:bg-indigo-600 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors shadow-sm">
                                        <i class="fas fa-external-link-alt mr-1"></i>{{ link.name }}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mt-5">
                        <div class="stitle mb-4">缓存配置 (Cache File) <span class="badge bg-orange-100 text-orange-700 border border-orange-200 ml-2">Experimental</span></div>
                        <p class="text-xs text-gray-500 mb-3">用于持久化保存 FakeIP 等运行时缓存数据。</p>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">缓存文件路径 (path)</label>
                                <input v-model="settings.cache_file_path" placeholder="/var/lib/sing-box/cache.db" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono focus:bg-white focus:ring-1">
                            </div>
                            <div class="flex flex-col justify-center gap-3 mt-1 md:mt-4">
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" v-model="clashApi.store_fakeip" class="w-4 h-4 text-indigo-600 rounded">
                                    <span class="text-sm font-bold text-gray-700">保存 FakeIP 缓存 (store_fakeip)</span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" v-model="settings.store_rdrc" class="w-4 h-4 text-indigo-600 rounded">
                                    <span class="text-sm font-bold text-gray-700">保存 Reject 缓存 (store_rdrc)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mt-5">
                        <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                            <div class="stitle mb-0">NTP 时间同步</div>
                            <label class="toggle-switch"><input type="checkbox" v-model="ntp.enabled"><span class="toggle-slider"></span></label>
                        </div>
                        <div v-if="ntp.enabled" class="space-y-4">
                            <div class="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                NTP 通常只需要服务器、端口、同步间隔和出站；下方高级拨号项更偏多网卡、策略路由或 Linux 场景。
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">服务器 (Server)</label><input v-model="ntp.server" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:bg-white focus:ring-1"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">端口 (Port)</label><input type="number" v-model.number="ntp.server_port" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:bg-white focus:ring-1"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">同步间隔 (Interval)</label><input v-model="ntp.interval" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:bg-white focus:ring-1"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">出站 (Detour)</label>
                                    <select v-model="ntp.detour" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-bold text-gray-700 focus:bg-white focus:ring-1">
                                        <option value="direct">direct</option>
                                        <option v-for="tag in availableOutboundTags" :value="tag">{{ tag }}</option>
                                    </select>
                                </div>
                            </div>
                            <details class="group">
                                <summary class="flex items-center gap-2 cursor-pointer select-none px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-xs font-bold text-gray-500">
                                    <i class="fas fa-chevron-right group-open:rotate-90 transition-transform text-[10px]"></i>
                                    <i class="fas fa-network-wired text-emerald-400 mr-0.5"></i>NTP 高级拨号选项
                                    <span v-if="ntp.bind_interface||ntp.inet4_bind_address||ntp.inet6_bind_address||ntp.routing_mark||ntp.reuse_addr||ntp.netns||ntp.connect_timeout||ntp.tcp_fast_open||ntp.tcp_multi_path||ntp.udp_fragment||ntp.domain_resolver||ntp.network_strategy||ntp.network_type||ntp.fallback_network_type||ntp.fallback_delay||ntp.domain_strategy" class="ml-auto badge bg-emerald-100 text-emerald-700 border border-emerald-200">已配置</span>
                                </summary>
                                <div class="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                                    <div class="grid grid-cols-2 gap-3">
                                        <div>
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">连接超时 (Connect Timeout)</label>
                                            <input v-model="ntp.connect_timeout" placeholder="5s" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                                            <p class="mt-1 text-[10px] font-medium text-gray-500">限制连接 NTP 服务器的等待时间；这是最常用的高级项之一。</p>
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">绑定接口 (Bind Interface)</label>
                                            <input v-model="ntp.bind_interface" placeholder="eth0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                                            <p class="mt-1 text-[10px] font-medium text-gray-500">多网卡或策略路由场景更常见。</p>
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">IPv4 绑定地址 (IPv4 Bind Address)</label>
                                            <input v-model="ntp.inet4_bind_address" placeholder="192.168.1.10" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                                            <p class="mt-1 text-[10px] font-medium text-gray-500">显式绑定本地 IPv4 出口地址。</p>
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">IPv6 绑定地址 (IPv6 Bind Address)</label>
                                            <input v-model="ntp.inet6_bind_address" placeholder="2001:db8::10" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                                            <p class="mt-1 text-[10px] font-medium text-gray-500">显式绑定本地 IPv6 出口地址。</p>
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">路由标记 (Routing Mark)</label>
                                            <input v-model="ntp.routing_mark" placeholder="255 / 0xff" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                                            <p class="mt-1 text-[10px] font-medium text-amber-700">Linux only；用于 fwmark / policy routing。</p>
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">网络命名空间 (NetNS)</label>
                                            <input v-model="ntp.netns" placeholder="singbox" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                                            <p class="mt-1 text-[10px] font-medium text-amber-700">Linux only；指定网络命名空间。</p>
                                        </div>
                                    </div>
                                    <div class="pt-3 border-t border-gray-200 text-[10px] font-medium text-gray-500 bg-white rounded-lg px-3 py-2">
                                        更偏平台依赖或低频场景的字段，如 <code>network_strategy</code>、<code>network_type</code>、<code>fallback_*</code>、<code>domain_resolver</code>、<code>domain_strategy</code>、<code>tcp_fast_open</code>、<code>tcp_multi_path</code>、<code>udp_fragment</code>，当前界面暂不突出展示。
                                    </div>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>
`);
const TproxyTab = createInjectedComponent('TproxyTab', `                <div v-show="currentTab==='tproxy'" class="space-y-5">

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

export const EditorPanel = {
    name: 'EditorPanel',
    components: {
        DnsTab,
        NodesTab,
        GroupsTab,
        RulesTab,
        TunTab,
        AdvancedTab,
        TproxyTab,
    },
    setup() {
        return useSharedContext();
    },
    template: `
        <div class="xl:col-span-7 bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col overflow-hidden max-h-full">
            <div class="flex border-b border-gray-200 overflow-x-auto shrink-0 bg-gray-50">
                <button
                    v-for="tab in tabs"
                    :key="tab.id"
                    @click="currentTab=tab.id"
                    class="flex-shrink-0 py-4 px-5 text-sm transition-all text-center border-r border-gray-200/60 last:border-0"
                    :class="currentTab===tab.id?'tab-active':'tab-inactive'"
                >
                    <i :class="tab.icon" class="mr-1.5"></i>{{ tab.name }}
                </button>
            </div>

            <div class="p-5 overflow-y-auto flex-1 bg-[#f8fafc]" ref="tabContentContainer">
                <dns-tab v-show="currentTab==='dns'"></dns-tab>
                <nodes-tab v-show="currentTab==='nodes'"></nodes-tab>
                <groups-tab v-show="currentTab==='groups'"></groups-tab>
                <rules-tab v-show="currentTab==='rules'"></rules-tab>
                <tun-tab v-show="currentTab==='tun'"></tun-tab>
                <advanced-tab v-show="currentTab==='advanced'"></advanced-tab>
                <tproxy-tab v-show="currentTab==='tproxy'"></tproxy-tab>
            </div>
        </div>
    `,
};
