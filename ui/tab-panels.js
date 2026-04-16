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
                            <div><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Mixed 代理端口</label><input type="number" v-model.number="settings.listen_port" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none"></div>
                            <div><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">日志级别</label>
                                <select v-model="settings.log_level" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none">
                                    <option value="trace">Trace</option><option value="debug">Debug</option><option value="info">Info</option><option value="warn">Warn</option><option value="error">Error</option>
                                </select>
                            </div>
                            <div><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">DNS 策略</label>
                                <select v-model="settings.dns_strategy" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none">
                                    <option value="ipv4_only">仅 IPv4</option><option value="ipv6_only">仅 IPv6</option><option value="prefer_ipv4">优先 IPv4</option><option value="prefer_ipv6">优先 IPv6</option>
                                </select>
                            </div>
                            <div><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">默认域名解析 <span class="text-indigo-400 normal-case font-normal">(route)</span></label>
                                <select v-model="settings.default_domain_resolver" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-semibold text-indigo-700">
                                    <option value="">不指定</option>
                                    <option v-for="tag in allDnsTags" :value="tag">{{ tag }}</option>
                                </select>
                            </div>
                            <div><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">DNS 最终解析器 <span class="text-violet-400 normal-case font-normal">(dns.final)</span></label>
                                <select v-model="settings.dns_final" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-semibold text-violet-700">
                                    <option value="">不指定</option>
                                    <option v-for="tag in allDnsTags" :value="tag">{{ tag }}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                                        <!-- ===== EXTRA_INBOUNDS_PATCH_START ===== -->
                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div class="flex justify-between items-center mb-4">
                            <div>
                                <div class="stitle mb-0">额外入站</div>
                                <p class="text-xs text-gray-500 mt-1 pl-3">
                                    在 mixed / tun / tproxy 之外额外追加 http / socks / direct 入站。
                                    TLS 为可选项，勾选后才显示证书和私钥路径；SOCKS 仅 version=5 显示 TLS。
                                </p>
                            </div>
                            <div class="flex flex-wrap gap-2 justify-end">
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
                                <div class="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">标签</div>
                                <div class="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">类型</div>
                                <div class="col-span-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">服务器地址</div>
                                <div class="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">出站 detour <span class="normal-case text-gray-400 font-normal">(留空=不写入)</span></div>
                                <div class="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-violet-500">域名解析器</div>
                                <div class="col-span-1"></div>
                            </div>
                            <div v-for="(dns,idx) in dnsList" :key="idx" class="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors">
                                <div class="grid grid-cols-12 gap-2 items-center">
                                    <input v-model="dns.tag" placeholder="标签" class="col-span-2 px-2.5 py-1.5 text-xs border rounded-md outline-none bg-white font-bold text-indigo-700">
                                    <select v-model="dns.type" class="col-span-2 px-1.5 py-1.5 text-xs border rounded-md outline-none bg-white font-semibold text-gray-700">
                                        <option value="tls">DoT</option><option value="https">DoH</option><option value="udp">UDP</option>
                                        <option value="tcp">TCP</option><option value="quic">DoQ</option><option value="h3">DoH3</option><option value="local">本地</option>
                                    </select>
                                    <input v-if="dns.type!=='local'" v-model="dns.server" placeholder="IP或域名" class="col-span-4 px-2.5 py-1.5 text-xs border rounded-md outline-none bg-white font-mono">
                                    <div v-else class="col-span-4 text-xs text-gray-400 italic px-2.5 py-1.5 bg-gray-100 rounded-md border border-dashed border-gray-300 text-center">使用系统 DNS</div>
                                    <select v-model="dns.detour" class="col-span-2 px-2 py-1.5 text-xs border rounded-md outline-none bg-white font-semibold" :class="dns.detour?'text-indigo-700':'text-gray-400'">
                                        <option value="">默认出站</option>
                                        <option v-for="tag in availableOutboundTags.filter(t=>t!=='direct')" :value="tag">{{ tag }}</option>
                                    </select>
                                    <select v-if="['tls','https','quic','h3'].includes(dns.type)" v-model="dns.domain_resolver" class="col-span-2 px-2 py-1.5 text-xs border rounded-md outline-none bg-white text-violet-700 font-semibold">
                                        <option value="">(无解析器)</option>
                                        <option v-for="d in dnsList.filter(x=>x.tag&&x.tag!==dns.tag)" :value="d.tag">{{ d.tag }}</option>
                                    </select>
                                    <div v-else class="col-span-2 text-[10px] text-gray-300 text-center italic py-1.5">仅加密协议需要</div>
                                    <button @click="removeDns(idx)" class="col-span-1 flex justify-center text-red-400 hover:text-white hover:bg-red-500 p-1.5 rounded-md transition-colors"><i class="fas fa-trash-alt text-xs"></i></button>
                                </div>
                            </div>
                        </div>
                        <div class="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-5 bg-indigo-50/50 p-3 rounded-lg">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" v-model="settings.independent_cache" class="w-4 h-4 text-indigo-600 rounded">
                                <span class="text-sm text-gray-700 font-medium">独立缓存 <span class="text-gray-400 text-xs font-normal">(FakeIP 推荐，开启时自动勾选)</span></span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" v-model="settings.reverse_mapping" class="w-4 h-4 text-indigo-600 rounded">
                                <span class="text-sm text-gray-700 font-medium">反向映射 (reverse_mapping)</span>
                            </label>
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
                            <button @click="addNode" class="text-xs font-bold bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 shadow-md transition"><i class="fas fa-plus mr-1.5"></i>新建节点</button>
                        </div>
                    </div>

                    <div v-for="(node,idx) in nodes" :key="idx" :id="\`node-card-\${idx}\`" class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative group hover:border-indigo-300 transition-colors">
                        <button @click="removeNode(idx)" class="absolute -top-2.5 -right-2.5 w-7 h-7 flex items-center justify-center bg-white text-red-400 border border-red-200 hover:text-white hover:bg-red-500 hover:border-red-500 rounded-full opacity-0 group-hover:opacity-100 shadow-md transition-all z-10"><i class="fas fa-times text-xs"></i></button>
                        
                        <div class="grid grid-cols-12 gap-3 mb-3">
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
                            <div class="col-span-4 grid grid-cols-3 gap-2">
                                <div class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">服务器 IP/域名</label><input type="text" v-model="node.server" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:bg-white font-mono"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">端口</label><input type="number" v-model.number="node.port" class="w-full px-2 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none text-center focus:ring-1 focus:bg-white font-mono"></div>
                            </div>
                        </div>

                        <div v-if="['vless','vmess','trojan','shadowsocks','tuic','hysteria2','hysteria'].includes(node.type)" class="grid grid-cols-2 gap-3 mb-3">
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">{{ ['vless','vmess','tuic'].includes(node.type)?'UUID':'密码 (Password)' }}</label><input type="text" v-model="node.secret" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                            <div v-show="['vless','vmess','trojan'].includes(node.type)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">SNI (Server Name Indication)</label><input type="text" v-model="node.sni" placeholder="example.com" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none bg-white focus:ring-1"></div>
                            <div v-show="['hysteria2','hysteria'].includes(node.type)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">SNI (Server Name Indication)</label><input type="text" v-model="node.sni" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none bg-white focus:ring-1"></div>
                        </div>

                        <div v-if="node.type==='shadowsocks'" class="grid grid-cols-2 gap-3 mb-3">
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">加密方法</label>
                                <select v-model="node.ss_method" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option value="chacha20-ietf-poly1305">chacha20-ietf-poly1305</option>
                                    <option value="aes-128-gcm">aes-128-gcm</option>
                                    <option value="aes-256-gcm">aes-256-gcm</option>
                                    <option value="2022-blake3-aes-128-gcm">2022-blake3-aes-128-gcm</option>
                                    <option value="2022-blake3-aes-256-gcm">2022-blake3-aes-256-gcm</option>
                                    <option value="2022-blake3-chacha20-poly1305">2022-blake3-chacha20-poly1305</option>
                                    <option value="rc4-md5">rc4-md5 (不推荐)</option>
                                    <option value="aes-128-cfb">aes-128-cfb (不推荐)</option>
                                </select>
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">插件 (Plugin)</label>
                                <select v-model="node.ss_plugin" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option value="">无</option>
                                    <option value="obfs-local">obfs-local</option>
                                    <option value="v2ray-plugin">v2ray-plugin</option>
                                </select>
                            </div>
                            <div v-if="node.ss_plugin" class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">插件参数 (Plugin Opts)</label><input type="text" v-model="node.ss_plugin_opts" placeholder="obfs=http;obfs-host=www.bing.com" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                        </div>

                        <div v-if="node.type==='tuic'" class="grid grid-cols-2 gap-3 mb-3">
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">密码 (Password)</label><input type="text" v-model="node.tuic_password" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">SNI</label><input type="text" v-model="node.sni" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">拥塞控制</label>
                                <select v-model="node.tuic_congestion" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option value="cubic">cubic</option><option value="new_reno">new_reno</option><option value="bbr">bbr</option>
                                </select>
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">UDP Relay Mode</label>
                                <select v-model="node.tuic_udp_relay_mode" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option value="native">native</option><option value="quic">quic</option>
                                </select>
                            </div>
                        </div>

                        <div v-if="node.type==='hysteria'" class="grid grid-cols-2 gap-3 mb-3">
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">上行带宽 (Mbps)</label><input type="number" v-model.number="node.hy_up_mbps" placeholder="100" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">下行带宽 (Mbps)</label><input type="number" v-model.number="node.hy_down_mbps" placeholder="100" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">OBFS 密钥</label><input type="text" v-model="node.hy_obfs" placeholder="salamander" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">认证协议</label>
                                <select v-model="node.hy_auth_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option value="str">string</option><option value="base64">base64</option>
                                </select>
                            </div>
                        </div>

                        <div v-if="node.type==='hysteria2'" class="grid grid-cols-2 gap-3 mb-3">
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">上行带宽 (up_mbps)</label><input type="text" v-model="node.hy2_up" placeholder="100 mbps" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">下行带宽 (down_mbps)</label><input type="text" v-model="node.hy2_down" placeholder="100 mbps" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">OBFS 类型</label>
                                <select v-model="node.hy2_obfs_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option value="">无</option><option value="salamander">salamander</option>
                                </select>
                            </div>
                            <div v-if="node.hy2_obfs_type"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">OBFS 密钥</label><input type="text" v-model="node.hy2_obfs_password" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                        </div>

                        <div v-if="node.type==='socks'" class="grid grid-cols-2 gap-3 mb-3">
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">版本</label>
                                <select v-model="node.socks_version" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option value="5">SOCKS5</option><option value="4a">SOCKS4a</option><option value="4">SOCKS4</option>
                                </select>
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">用户名 (可选)</label><input type="text" v-model="node.username" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                            <div class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">密码 (可选)</label><input type="text" v-model="node.secret" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                        </div>

                        <div v-if="node.type==='http'" class="grid grid-cols-2 gap-3 mb-3">
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">用户名 (可选)</label><input type="text" v-model="node.username" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">密码 (可选)</label><input type="text" v-model="node.secret" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                            <div class="col-span-2"><label class="flex items-center gap-2 cursor-pointer bg-gray-50 p-2 rounded-lg border border-gray-200"><input type="checkbox" v-model="node.tls" class="w-4 h-4 text-indigo-600 rounded"><span class="text-sm font-bold text-gray-700">启用 TLS</span></label></div>
                        </div>

                        <div v-if="node.type==='wireguard'" class="grid grid-cols-1 gap-3 mb-3">
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">本地私钥 (Private Key)</label><input type="text" v-model="node.wg_private_key" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">对端公钥 (Peer Public Key)</label><input type="text" v-model="node.wg_peer_pubkey" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                            <div class="grid grid-cols-2 gap-3">
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">本地地址 (Local Address)</label><input type="text" v-model="node.wg_local_address" placeholder="10.0.0.2/32" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Pre-Shared Key (可选)</label><input type="text" v-model="node.wg_psk" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">MTU</label><input type="number" v-model.number="node.wg_mtu" placeholder="1280" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Reserved (逗号分隔)</label><input type="text" v-model="node.wg_reserved" placeholder="0,0,0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
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
                        </div>

                        <!-- ShadowTLS -->
                        <div v-if="node.type==='shadowtls'" class="grid grid-cols-2 gap-3 mb-3">
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">密码 (Password)</label>
                                <input type="text" v-model="node.shadowtls_password" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">版本 (Version)</label>
                                <select v-model="node.shadowtls_version" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                    <option value="3">v3 (推荐)</option>
                                    <option value="2">v2</option>
                                    <option value="1">v1</option>
                                </select>
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">握手目标服务器 (Handshake Server)</label>
                                <input type="text" v-model="node.shadowtls_handshake_server" placeholder="example.com" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none bg-white focus:ring-1">
                            </div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">握手目标端口</label>
                                <input type="number" v-model.number="node.shadowtls_handshake_port" placeholder="443" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                            </div>
                            <div class="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p class="text-xs text-blue-700"><i class="fas fa-info-circle mr-1.5"></i><strong>ShadowTLS</strong> 是一个流量混淆协议，需套在其他代理协议（如 Shadowsocks）外层使用。<code class="bg-blue-100 px-1 rounded">server/port</code> 填写 ShadowTLS 服务器地址，<code class="bg-blue-100 px-1 rounded">handshake</code> 填写用于模仿握手的真实 TLS 站点。</p>
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
                            <div class="flex items-center gap-2 pt-5">
                                <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="node.insecure" class="w-4 h-4 text-yellow-600 rounded"><span class="text-sm font-bold text-gray-700">跳过证书验证</span></label>
                            </div>
                            <div class="col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p class="text-xs text-amber-700"><i class="fas fa-info-circle mr-1.5"></i><strong>NaiveProxy</strong> 强制使用 TLS（HTTPS），利用真实 Chrome 网络栈抗 TLS 指纹探测。<code class="bg-amber-100 px-1 rounded">ALPN</code> 通常设为 <code class="bg-amber-100 px-1 rounded">h2</code> 或 <code class="bg-amber-100 px-1 rounded">http/1.1</code>。</p>
                            </div>
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
                                </div>
                            </div>
                        </div>

                        <!-- DNS outbound -->
                        <div v-if="node.type==='dns'" class="mb-3">
                            <div class="bg-sky-50 border border-sky-200 rounded-lg p-3">
                                <p class="text-xs text-sky-700"><i class="fas fa-info-circle mr-1.5"></i><strong>DNS 出站</strong>将连接作为 DNS 查询转发到 sing-box 内部 DNS 系统处理，通常用于路由规则中劫持并响应 DNS 请求。此出站无额外配置，<strong>服务器/端口</strong>字段无意义。</p>
                            </div>
                        </div>

                        <div v-if="['vless','vmess','trojan','shadowsocks'].includes(node.type)" class="mb-3">
                            <div class="grid grid-cols-3 gap-3 mb-2">
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">传输层</label>
                                    <select v-model="node.transport" class="w-full px-2 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:bg-white">
                                        <option value="">TCP (默认)</option>
                                        <option value="ws">WebSocket</option>
                                        <option value="grpc">gRPC</option>
                                        <option value="http">HTTP/2</option>
                                        <option value="httpupgrade">HTTPUpgrade</option>
                                        <option value="quic">QUIC</option>
                                    </select>
                                </div>
                                <div v-if="['ws','http','httpupgrade'].includes(node.transport)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">路径 (Path)</label><input type="text" v-model="node.path" placeholder="/ws" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                                <div v-if="node.transport==='grpc'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Service Name</label><input type="text" v-model="node.path" placeholder="grpc" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1"></div>
                                <div v-if="node.transport==='ws'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">WS Host Header</label><input type="text" v-model="node.ws_host" placeholder="example.com" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                                <div v-if="node.transport==='http'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">HTTP Host</label><input type="text" v-model="node.ws_host" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                                <div v-if="node.type==='vless'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Flow (XTLS)</label>
                                    <select v-model="node.flow" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1">
                                        <option value="">不启用（默认）</option>
                                        <option value="xtls-rprx-vision">xtls-rprx-vision</option>
                                    </select>
                                </div>
                            </div>
                            <!-- network + packet_encoding 行 -->
                            <div class="grid grid-cols-3 gap-3 mt-2">
                                <div v-if="['vless','vmess','trojan'].includes(node.type)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Network <span class="normal-case font-normal text-gray-400">(启用的网络)</span></label>
                                    <select v-model="node.network" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                        <option value="">TCP + UDP (默认)</option>
                                        <option value="tcp">仅 TCP</option>
                                        <option value="udp">仅 UDP</option>
                                    </select>
                                </div>
                                <div v-if="['vless','vmess'].includes(node.type)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">packet_encoding <span class="normal-case font-normal text-gray-400">(UDP 封包)</span></label>
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
                            <div v-if="['vless','vmess','trojan'].includes(node.type)" class="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <label class="flex items-center gap-2 cursor-pointer mb-3">
                                    <input type="checkbox" v-model="node.mux_enabled" class="w-4 h-4 text-indigo-600 rounded">
                                    <span class="text-sm font-bold text-gray-700">启用多路复用 (Multiplex / Mux)</span>
                                </label>
                                <div v-if="node.mux_enabled" class="grid grid-cols-3 gap-3">
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">协议</label>
                                        <select v-model="node.mux_protocol" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                            <option value="smux">smux</option><option value="yamux">yamux</option><option value="h2mux">h2mux</option>
                                        </select>
                                    </div>
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">最大并发</label><input type="number" v-model.number="node.mux_max_connections" placeholder="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">每连接最大流</label><input type="number" v-model.number="node.mux_min_streams" placeholder="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1"></div>
                                </div>
                            </div>
                        </div>

                        <div v-if="['vless','vmess','trojan','hysteria2','hysteria','tuic','http','socks','anytls','naive'].includes(node.type)" class="flex flex-wrap gap-4 mt-2">
                            <label v-if="['vless','vmess','trojan','http','socks','anytls'].includes(node.type)" class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="node.tls" class="w-4 h-4 text-indigo-600 rounded"><span class="text-sm font-bold text-gray-700">TLS</span></label>
                            <template v-if="node.tls || ['hysteria2','hysteria','tuic','naive'].includes(node.type)">
                                <label v-if="!['naive'].includes(node.type)" class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="node.insecure" class="w-4 h-4 text-yellow-600 rounded"><span class="text-sm font-bold text-gray-700">跳过证书验证</span></label>
                                <label v-if="['vless','trojan'].includes(node.type)" class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="node.reality" class="w-4 h-4 text-purple-600 rounded"><span class="text-sm font-bold text-gray-700">REALITY</span></label>
                                <!-- uTLS + ALPN 网格：仅对支持的协议显示对应控件 -->
                                <div class="w-full mt-1 grid grid-cols-2 gap-3">
                                    <!-- uTLS：仅 vless/vmess/trojan -->
                                    <div v-if="['vless','vmess','trojan'].includes(node.type)">
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
                                    </div>
                                    <!-- ALPN：对支持 TLS 且 ALPN 有实际意义的协议显示 -->
                                    <div v-if="['vless','vmess','trojan','hysteria2','hysteria','tuic','anytls','naive'].includes(node.type)">
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

                        <div v-if="node.reality && ['vless','trojan'].includes(node.type) && node.tls" class="mt-4 grid grid-cols-2 gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                            <div><label class="block text-[10px] font-black text-purple-400 uppercase mb-1 tracking-wider">Public Key</label><input type="text" v-model="node.reality_pubkey" class="w-full px-3 py-2 border border-purple-200 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1 focus:border-purple-400"></div>
                            <div><label class="block text-[10px] font-black text-purple-400 uppercase mb-1 tracking-wider">Short ID</label><input type="text" v-model="node.reality_sid" class="w-full px-3 py-2 border border-purple-200 rounded-lg text-xs outline-none font-mono bg-white focus:ring-1 focus:border-purple-400"></div>
                        </div>

                        <!-- ── 高级 TLS 选项 ── -->
                        <div v-if="node.tls || ['hysteria2','hysteria','tuic','naive'].includes(node.type)" class="mt-3">
                            <details class="group">
                                <summary class="flex items-center gap-2 cursor-pointer select-none px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-xs font-bold text-gray-500">
                                    <i class="fas fa-chevron-right group-open:rotate-90 transition-transform text-[10px]"></i>
                                    <i class="fas fa-shield-alt text-indigo-400 mr-0.5"></i>高级 TLS 选项
                                    <span v-if="node.disable_sni||node.tls_min_version||node.tls_max_version||node.cipher_suites||node.tls_fragment||node.tls_record_fragment||node.ech_enabled" class="ml-auto badge bg-indigo-100 text-indigo-600 border border-indigo-200">已配置</span>
                                </summary>
                                <div class="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">

                                    <!-- SNI 控制：QUIC 协议不支持（仅 TCP TLS 有意义） -->
                                    <div v-if="!['hysteria','hysteria2','tuic'].includes(node.type)" class="flex flex-wrap gap-4 items-center pb-2 border-b border-gray-200">
                                        <label class="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" v-model="node.disable_sni" class="w-4 h-4 text-orange-600 rounded">
                                            <span class="text-xs font-bold text-gray-700">禁用 SNI <span class="text-gray-400 font-normal">(disable_sni)</span></span>
                                        </label>
                                        <span class="text-[10px] text-gray-400">勾选后 ClientHello 中不发送 server_name，可用于防止 SNI 探测，但可能导致某些服务器拒绝连接</span>
                                    </div>

                                    <!-- TLS 版本 & 加密套件：QUIC 协议不支持（QUIC 内部处理） -->
                                    <div v-if="!['hysteria','hysteria2','tuic'].includes(node.type)" class="grid grid-cols-2 gap-3">
                                        <div>
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">最低 TLS 版本 <span class="normal-case font-normal text-gray-300">(min_version)</span></label>
                                            <select v-model="node.tls_min_version" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                                <option value="">默认 (TLS 1.2)</option>
                                                <option value="1.0">TLS 1.0</option>
                                                <option value="1.1">TLS 1.1</option>
                                                <option value="1.2">TLS 1.2</option>
                                                <option value="1.3">TLS 1.3</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">最高 TLS 版本 <span class="normal-case font-normal text-gray-300">(max_version)</span></label>
                                            <select v-model="node.tls_max_version" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1">
                                                <option value="">默认 (TLS 1.3)</option>
                                                <option value="1.0">TLS 1.0</option>
                                                <option value="1.1">TLS 1.1</option>
                                                <option value="1.2">TLS 1.2</option>
                                                <option value="1.3">TLS 1.3</option>
                                            </select>
                                        </div>
                                        <div class="col-span-2">
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">
                                                加密套件 <span class="normal-case font-normal text-gray-300">(cipher_suites · 逗号分隔 · 仅 TLS 1.0–1.2)</span>
                                            </label>
                                            <select v-model="node.cipher_suites" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none bg-white focus:ring-1 font-mono">
                                                <option value="">默认（推荐留空）</option>
                                                <option value="TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256">AES-128-GCM (ECDHE)</option>
                                                <option value="TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384">AES-256-GCM (ECDHE)</option>
                                                <option value="TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256,TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256">ChaCha20-Poly1305 (ECDHE)</option>
                                                <option value="TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256,TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256">AES-128-GCM + ChaCha20（均衡）</option>
                                            </select>
                                        </div>
                                    </div>

                                    <!-- 握手分片：仅 TCP TLS 协议有效，QUIC 无效 -->
                                    <div v-if="!['hysteria','hysteria2','tuic'].includes(node.type)" class="pt-2 border-t border-gray-200">
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
                                        <p class="text-[10px] text-gray-400 mt-1.5">建议优先尝试 Record 分片，性能更好；两者均仅针对明文包匹配型防火墙有效，不用于绕过实质性审查</p>
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
                    </div>
                </div>
`);
const GroupsTab = createInjectedComponent('GroupsTab', `                <div v-show="currentTab==='groups'" class="space-y-5">
                    <div class="flex justify-between items-center bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <span class="text-base font-extrabold text-gray-800"><i class="fas fa-layer-group mr-2 text-indigo-500"></i>策略组管理</span>
                        <span v-if="duplicateOutboundTags.length>0" class="badge bg-red-100 text-red-700 border border-red-200 ml-2"><i class="fas fa-exclamation-triangle mr-1"></i>Tag 重名: {{ duplicateOutboundTags.join(', ') }}</span>
                        <div class="flex gap-3">
                            <button @click="generateCountryGroups" class="text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg hover:bg-emerald-100 transition"><i class="fas fa-globe-asia mr-2"></i>自动生成地区组</button>
                            <button @click="addGroup" class="text-sm font-bold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 shadow-md transition"><i class="fas fa-plus mr-2"></i>新建策略组</button>
                        </div>
                    </div>
                    
                    <div v-for="(group,gIdx) in groups" :key="group.id" 
                         :draggable="group.draggable || false"
                         @dragstart="onGroupDragStart(gIdx, $event)"
                         @dragenter.prevent="onGroupDragEnter(gIdx)"
                         @dragover.prevent
                         @drop="onGroupDrop(gIdx)"
                         @dragend="onGroupDragEnd"
                         :class="{
                             'opacity-40 border-dashed border-indigo-400': draggedGroupIndex === gIdx,
                             'shadow-[0_-3px_0_0_#4f46e5] border-indigo-300 z-10': dragOverGroupIndex === gIdx && draggedGroupIndex > gIdx,
                             'shadow-[0_3px_0_0_#4f46e5] border-indigo-300 z-10': dragOverGroupIndex === gIdx && draggedGroupIndex < gIdx
                         }"
                         class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative hover:border-indigo-300 transition-all">
                        
                        <button @click="removeGroup(gIdx)" class="absolute top-4 right-4 text-red-400 hover:text-white hover:bg-red-500 w-7 h-7 flex justify-center items-center rounded-lg transition-colors z-20"><i class="fas fa-trash-alt text-sm"></i></button>
                        
                        <div class="flex items-start gap-4 mb-4 pr-10">
                            <div class="flex items-center justify-center shrink-0 w-8 h-8 cursor-move text-gray-400 hover:text-indigo-600 bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-colors mt-6" 
                                 title="按住此处拖动排顺"
                                 @mouseenter="group.draggable = true"
                                 @mouseleave="group.draggable = false"
                                 @mousedown="group.draggable = true"
                                 @mouseup="group.draggable = false">
                                <i class="fas fa-grip-vertical"></i>
                            </div>
                            
                            <div class="flex-1 grid grid-cols-12 gap-3">
                                <div class="col-span-5"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-wider">组名称</label><input type="text" :value="group.tag" @change="updateGroupTag(gIdx, $event.target.value)" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-bold text-indigo-700 outline-none focus:bg-white focus:ring-1"></div>
                                <div class="col-span-3"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-wider">策略</label>
                                    <select v-model="group.type" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 outline-none focus:bg-white focus:ring-1">
                                        <option value="selector">手动选择</option><option value="urltest">自动测速</option>
                                    </select>
                                </div>
                                <div class="col-span-4"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-wider">正则过滤 (匹配节点名称)</label><input type="text" v-model="group.regex" placeholder="港|HK" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none text-emerald-600 font-mono focus:bg-white focus:ring-1"></div>
                            </div>
                        </div>
                        
                        <div v-if="group.type==='urltest'" class="mb-4 grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 ml-12">
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">URL</label><input type="text" v-model="group.url" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">测速间隔</label><input type="text" v-model="group.interval" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">容差(ms)</label><input type="number" v-model.number="group.tolerance" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none"></div>
                        </div>
                        <div class="border-t border-gray-100 pt-3 ml-12">
                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-wider">引用目标</label>
                            <div class="flex flex-wrap gap-2">
                                <label v-for="tag in getAllPossibleMembers(group.tag)" :key="'m'+tag" class="inline-flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-white hover:border-indigo-300 transition-colors shadow-sm">
                                    <input type="checkbox" :value="tag" v-model="group.members" class="w-3.5 h-3.5 text-indigo-600 rounded mr-2">
                                    <span class="text-xs font-semibold text-gray-700">{{ tag }}</span>
                                </label>
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
                            <div v-for="(rs, idx) in ruleSets" :key="rs.id" class="grid grid-cols-12 gap-2 items-center bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors shadow-sm">
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
                            <button @click="addCustomRule" class="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 font-bold shadow-md transition"><i class="fas fa-plus mr-1.5"></i>新建规则</button>
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

                        <div class="space-y-3">
                            <div v-for="(rule,rIdx) in routeRules" :key="rule.id" 
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
                                        <select v-model="rule.outbound" :disabled="!rule.enabled" class="w-[140px] px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none font-black text-indigo-700 disabled:opacity-50 shadow-sm focus:ring-1 focus:border-indigo-400">
                                            <option value="__reject__">拒绝 (reject)</option>
                                            <option v-for="tag in availableOutboundTags" :value="tag">{{ tag }}</option>
                                        </select>
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
                                                            </optgroup>
                                                            <optgroup label="IP 与网络">
                                                                <option value="network">network (tcp/udp)</option>
                                                                <option value="port">port</option>
                                                                <option value="port_range">port_range</option>
                                                                <option value="ip_cidr">ip_cidr</option>
                                                                <option value="source_ip_cidr">source_ip_cidr</option>
                                                            </optgroup>
                                                            <optgroup label="协议与应用">
                                                                <option value="protocol">protocol</option>
                                                                <option value="process_name">process_name</option>
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
                                                        <input v-else type="text" v-model="cond.value" placeholder="值 (多个用逗号分隔)" class="flex-1 px-3 py-1.5 bg-white border border-indigo-300 rounded-md text-xs font-mono outline-none focus:ring-1 focus:ring-indigo-300 shadow-sm text-gray-700">
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
                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
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
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">接口名称</label>
                                    <input v-model="tun.interface_name" placeholder="tun0" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:bg-white focus:ring-1 font-mono">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">TUN 栈</label>
                                    <select v-model="tun.stack" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:bg-white focus:ring-1">
                                        <option value="system">system (推荐)</option><option value="gvisor">gvisor</option><option value="mixed">mixed</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">IPv4 地址</label>
                                    <input v-model="tun.address_v4" placeholder="172.19.0.1/30" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono focus:bg-white focus:ring-1">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">IPv6 地址 (可选)</label>
                                    <input v-model="tun.address_v6" placeholder="fdfe:dcba:9876::1/126" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono focus:bg-white focus:ring-1">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">MTU</label>
                                    <input type="number" v-model.number="tun.mtu" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:bg-white focus:ring-1">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">default_mark <span class="normal-case font-normal text-gray-400">(可选 fwmark)</span></label>
                                    <input type="number" v-model.number="settings.default_mark" placeholder="留空则不设置" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:bg-white focus:ring-1">
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

                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
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
                        <div v-if="ntp.enabled" class="grid grid-cols-2 gap-4">
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">服务器</label><input v-model="ntp.server" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">端口</label><input type="number" v-model.number="ntp.server_port" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">同步间隔</label><input v-model="ntp.interval" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:bg-white focus:ring-1"></div>
                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">出站</label>
                                <select v-model="ntp.detour" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-bold text-gray-700 focus:bg-white focus:ring-1">
                                    <option value="direct">direct</option>
                                    <option v-for="tag in availableOutboundTags" :value="tag">{{ tag }}</option>
                                </select>
                            </div>
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
