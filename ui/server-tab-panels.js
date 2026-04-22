import { useSharedContext } from './shared.js';

const createInjectedComponent = (name, template, extendSetup = null) => ({
    name,
    setup() {
        const ctx = useSharedContext();
        return extendSetup ? { ...ctx, ...extendSetup(ctx) } : ctx;
    },
    template,
});

const BasicTab = createInjectedComponent('ServerBasicTab', `                <div v-show="currentTab==='basic'" class="space-y-5">
                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div class="stitle">基础设置</div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">日志级别</label>
                                <select v-model="settings.log_level" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none">
                                    <option value="trace">trace</option>
                                    <option value="debug">debug</option>
                                    <option value="info">info</option>
                                    <option value="warn">warn</option>
                                    <option value="error">error</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">默认出站</label>
                                <select v-model="settings.route_final" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-bold text-indigo-700">
                                    <option value="direct">direct</option>
                                    <option value="block">block</option>
                                    <option value="dns-out">dns-out</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-5 shadow-sm">
                        <div class="text-sm font-extrabold text-indigo-800 mb-2"><i class="fas fa-circle-info mr-2"></i>服务端配置器第一期范围</div>
                        <div class="text-xs text-indigo-700 leading-6">
                            当前分支聚焦 sing-box 服务端部署最常用路径：<code>DNS + Inbounds + TLS/Reality + Minimal Route/Outbounds</code>。
                            已剔除订阅、客户端节点、策略组、TUN、TProxy、FakeIP、Clash API 等客户端功能。
                        </div>
                    </div>
                </div>
`);

const DnsTab = createInjectedComponent('ServerDnsTab', `                <div v-show="currentTab==='dns'" class="space-y-5">
                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                            <div class="stitle mb-0">上游 DNS</div>
                            <button @click="addDnsServer" class="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 font-bold shadow-md transition"><i class="fas fa-plus mr-1.5"></i>新建 DNS</button>
                        </div>
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">DNS 策略</label><select v-model="settings.dns_strategy" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none"><option value="prefer_ipv4">prefer_ipv4</option><option value="prefer_ipv6">prefer_ipv6</option><option value="ipv4_only">ipv4_only</option><option value="ipv6_only">ipv6_only</option></select></div>
                            <div><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">DNS Final</label><input v-model="settings.dns_final" placeholder="public-dns" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-mono"></div>
                            <div><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">客户端子网</label><input v-model="settings.dns_client_subnet" placeholder="1.2.3.0/24" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-mono"></div>
                            <div><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">缓存容量</label><input type="number" v-model.number="settings.dns_cache_capacity" placeholder="1024" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-mono"></div>
                        </div>
                        <div class="flex flex-wrap gap-4 mb-4 bg-gray-50 rounded-lg border border-gray-200 px-4 py-3">
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="settings.dns_disable_cache" class="w-4 h-4 text-indigo-600 rounded"><span class="text-sm font-bold text-gray-700">disable_cache</span></label>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="settings.dns_disable_expire" class="w-4 h-4 text-indigo-600 rounded"><span class="text-sm font-bold text-gray-700">disable_expire</span></label>
                        </div>

                        <div class="space-y-3">
                            <div v-for="(dns, idx) in dnsList" :key="dns.id" class="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <div class="flex justify-between items-center mb-3">
                                    <div class="text-sm font-extrabold text-gray-800">{{ dns.tag }}</div>
                                    <button @click="removeDnsServer(idx)" class="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 border border-red-200 font-bold transition"><i class="fas fa-trash-alt mr-1"></i>删除</button>
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">标签</label><input v-model="dns.tag" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-bold text-indigo-700"></div>
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">类型</label><select v-model="dns.type" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none"><option value="udp">udp</option><option value="tcp">tcp</option><option value="tls">tls</option><option value="https">https</option><option value="quic">quic</option><option value="h3">h3</option><option value="local">local</option></select></div>
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">服务器</label><input v-model="dns.server" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">端口</label><input v-model="dns.server_port" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">路径</label><input v-model="dns.path" placeholder="/dns-query" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">域名解析器</label><input v-model="dns.domain_resolver" placeholder="bootstrap-dns" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">客户端子网</label><input v-model="dns.client_subnet" placeholder="1.2.3.0/24" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">连接超时</label><input v-model="dns.connect_timeout" placeholder="5s" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                    <div class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">HTTP Headers</label><textarea v-model="dns.headers_text" rows="3" placeholder="Accept: application/dns-message" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none font-mono resize-none"></textarea></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
`);

const InboundsTab = createInjectedComponent('ServerInboundsTab', `                <div v-show="currentTab==='inbounds'" class="space-y-5">
                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div class="flex flex-wrap justify-between items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                            <div>
                                <div class="stitle mb-0">服务端入站</div>
                                <p class="text-xs text-gray-500 mt-1 pl-3">优先支持 VLESS / VMess / Trojan / Shadowsocks / Hysteria2 / TUIC / Hysteria / AnyTLS / ShadowTLS。</p>
                            </div>
                            <div class="flex gap-2 flex-wrap">
                                <button v-for="item in inboundTypeOptions" :key="item.type" @click="addInbound(item.type, 'bottom')" :class="item.buttonClass" class="text-xs text-white px-3 py-1.5 rounded-lg font-bold shadow-sm transition">
                                    <i class="fas fa-plus mr-1"></i>{{ item.label }}
                                </button>
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div v-for="(inbound, idx) in serverInbounds" :key="inbound.id" class="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <div class="flex justify-between items-center mb-3">
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <span class="text-sm font-extrabold text-gray-800">{{ inbound.tag }}</span>
                                        <span class="badge bg-white text-indigo-700 border border-indigo-200">{{ inbound.type }}</span>
                                        <span class="text-xs text-gray-500 font-semibold">{{ inbound.listen || '::' }}:{{ inbound.listen_port }}</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <button @click="toggleInboundCollapsed(idx)" class="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 w-7 h-7 flex justify-center items-center rounded-lg transition-colors"><i :class="inbound.collapsed ? 'fas fa-chevron-down text-sm' : 'fas fa-chevron-up text-sm'"></i></button>
                                        <button @click="removeInbound(idx)" class="text-red-400 hover:text-white hover:bg-red-500 w-7 h-7 flex justify-center items-center rounded-lg transition-colors"><i class="fas fa-trash-alt text-sm"></i></button>
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-3 mb-3">
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">标签</label><input v-model="inbound.tag" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-bold text-indigo-700"></div>
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">类型</label><select v-model="inbound.type" @change="syncInboundType(inbound)" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none"><option v-for="item in inboundTypeOptions" :key="item.type" :value="item.type">{{ item.label }}</option></select></div>
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">监听地址</label><input v-model="inbound.listen" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">监听端口</label><input type="number" v-model.number="inbound.listen_port" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                </div>

                                <div v-if="inbound.collapsed" class="text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2">
                                    {{ inboundSummary(inbound) }}
                                </div>

                                <div v-if="!inbound.collapsed" class="space-y-4">
                                    <div v-if="inbound.type==='shadowsocks'" class="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
                                        <div class="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Shadowsocks Server</div>
                                        <div class="grid grid-cols-2 gap-3">
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">method</label><input v-model="inbound.ss_method" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">network</label><input v-model="inbound.ss_network" placeholder="tcp udp" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">模式</label><select v-model="inbound.ss_mode" @change="syncShadowsocksMode(inbound)" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="single">single-user</option><option value="multi-user">multi-user</option><option value="relay">relay</option></select></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">主密码</label><input v-model="inbound.ss_password" placeholder="single/relay 模式常用" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                            <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="inbound.ss_managed" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">managed</span></label></div>
                                            <div class="text-[11px] text-gray-500 leading-5">multi-user 使用 users；relay 使用 destinations；single-user 使用主密码。</div>
                                        </div>
                                    </div>

                                    <div v-if="inbound.type==='trojan'" class="bg-white border border-gray-200 rounded-lg p-3 grid grid-cols-2 gap-3">
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">fallback.server</label><input v-model="inbound.trojan_fallback_server" placeholder="127.0.0.1" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">fallback.port</label><input v-model="inbound.trojan_fallback_port" placeholder="80" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">fallback_for_alpn</label><textarea v-model="inbound.trojan_fallback_for_alpn_text" rows="3" placeholder="h2=127.0.0.1:8443&#10;http/1.1=127.0.0.1:8080" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono resize-none"></textarea></div>
                                    </div>

                                    <div v-if="inbound.type==='hysteria'" class="bg-white border border-gray-200 rounded-lg p-3 grid grid-cols-2 gap-3">
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">up_mbps</label><input v-model="inbound.hy_up_mbps" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">down_mbps</label><input v-model="inbound.hy_down_mbps" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">obfs</label><input v-model="inbound.hy_obfs" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">recv_window_conn</label><input v-model="inbound.hy_recv_window_conn" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">recv_window_client</label><input v-model="inbound.hy_recv_window_client" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">max_conn_client</label><input v-model="inbound.hy_max_conn_client" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div class="col-span-2 flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="inbound.hy_disable_mtu_discovery" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">disable_mtu_discovery</span></label></div>
                                    </div>

                                    <div v-if="inbound.type==='hysteria2'" class="bg-white border border-gray-200 rounded-lg p-3 grid grid-cols-2 gap-3">
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">up_mbps</label><input v-model="inbound.hy2_up_mbps" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">down_mbps</label><input v-model="inbound.hy2_down_mbps" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">obfs.type</label><input v-model="inbound.hy2_obfs_type" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">obfs.password</label><input v-model="inbound.hy2_obfs_password" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">masquerade</label><select v-model="inbound.hy2_masquerade_mode" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="none">none</option><option value="url">url</option><option value="file">file</option><option value="proxy">proxy</option><option value="string">string</option></select></div>
                                        <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="inbound.hy2_ignore_client_bandwidth" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">ignore_client_bandwidth</span></label></div>
                                        <div v-if="['url','proxy'].includes(inbound.hy2_masquerade_mode)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">masquerade.url</label><input v-model="inbound.hy2_masquerade_url" placeholder="https://example.com" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div v-if="inbound.hy2_masquerade_mode==='file'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">masquerade.directory</label><input v-model="inbound.hy2_masquerade_directory" placeholder="/var/www/html" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div v-if="inbound.hy2_masquerade_mode==='proxy'" class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="inbound.hy2_masquerade_rewrite_host" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">rewrite_host</span></label></div>
                                        <div v-if="inbound.hy2_masquerade_mode==='string'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">status_code</label><input v-model="inbound.hy2_masquerade_status_code" placeholder="200" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div v-if="inbound.hy2_masquerade_mode==='string'" class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">headers</label><textarea v-model="inbound.hy2_masquerade_headers_text" rows="3" placeholder="Content-Type: text/html" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono resize-none"></textarea></div>
                                        <div v-if="inbound.hy2_masquerade_mode==='string'" class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">content</label><textarea v-model="inbound.hy2_masquerade_content" rows="3" placeholder="hello from sing-box" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono resize-none"></textarea></div>
                                    </div>

                                    <div v-if="inbound.type==='tuic'" class="bg-white border border-gray-200 rounded-lg p-3 grid grid-cols-2 gap-3">
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">congestion_control</label><input v-model="inbound.tuic_congestion" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">auth_timeout</label><input v-model="inbound.tuic_auth_timeout" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">heartbeat</label><input v-model="inbound.tuic_heartbeat" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="inbound.tuic_zero_rtt_handshake" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">zero_rtt_handshake</span></label></div>
                                    </div>

                                    <div v-if="inbound.type==='anytls'" class="bg-white border border-gray-200 rounded-lg p-3">
                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">padding_scheme</label>
                                        <textarea v-model="inbound.anytls_padding_scheme_text" rows="4" placeholder="stop&#10;0-16&#10;32-64" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono resize-none"></textarea>
                                    </div>

                                    <div v-if="inbound.type==='shadowtls'" class="bg-white border border-gray-200 rounded-lg p-3 grid grid-cols-2 gap-3">
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">version</label><select v-model="inbound.shadowtls_version" @change="syncShadowTlsVersion(inbound)" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></div>
                                        <div v-if="inbound.shadowtls_version==='2'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">password</label><input v-model="inbound.shadowtls_password" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">handshake.server</label><input v-model="inbound.shadowtls_handshake_server" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">handshake.port</label><input type="number" v-model.number="inbound.shadowtls_handshake_port" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">handshake_for_server_name</label><textarea v-model="inbound.shadowtls_handshake_for_server_name_text" rows="3" placeholder="example.com=127.0.0.1:443&#10;api.example.com=127.0.0.1:8443" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono resize-none"></textarea></div>
                                        <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="inbound.shadowtls_strict_mode" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">strict_mode</span></label></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">wildcard_sni</label><select v-model="inbound.shadowtls_wildcard_sni" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="off">off</option><option value="full">full</option><option value="single">single</option></select></div>
                                    </div>

                                    <div v-if="inboundUsesDestinations(inbound.type, inbound)" class="bg-white border border-gray-200 rounded-lg p-3">
                                        <div class="flex justify-between items-center mb-3">
                                            <div class="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Relay Destinations</div>
                                            <button @click="addSsDestination(inbound)" class="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 border border-emerald-200 font-bold transition"><i class="fas fa-plus mr-1"></i>添加目标</button>
                                        </div>
                                        <div class="space-y-3">
                                            <div v-for="(destination, dIdx) in inbound.ss_destinations" :key="destination.id" class="bg-gray-50 border border-gray-200 rounded-lg p-3 grid grid-cols-2 gap-3">
                                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">名称</label><input v-model="destination.name" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none"></div>
                                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">服务器</label><input v-model="destination.server" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">端口</label><input type="number" v-model.number="destination.server_port" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">密码</label><input v-model="destination.password" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                                <div class="col-span-2 flex justify-end"><button @click="removeSsDestination(inbound, dIdx)" class="text-xs bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 border border-red-200 font-bold transition"><i class="fas fa-trash-alt mr-1"></i>删除目标</button></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div v-if="inboundUsesUsers(inbound.type, inbound)" class="bg-white border border-gray-200 rounded-lg p-3">
                                        <div class="flex justify-between items-center mb-3">
                                            <div class="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Users</div>
                                            <button @click="addInboundUser(inbound)" class="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 border border-indigo-200 font-bold transition"><i class="fas fa-plus mr-1"></i>添加用户</button>
                                        </div>
                                        <div class="space-y-3">
                                            <div v-for="(user, uIdx) in inbound.users" :key="user.id" class="bg-gray-50 border border-gray-200 rounded-lg p-3 grid grid-cols-2 gap-3">
                                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">名称</label><input v-model="user.name" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none"></div>
                                                <div v-if="['vless','vmess','tuic'].includes(inbound.type)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">UUID</label><input v-model="user.uuid" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                                <div v-if="['trojan','hysteria2','tuic','anytls','shadowtls','shadowsocks'].includes(inbound.type)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">密码</label><input v-model="user.password" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                                <div v-if="inbound.type==='vless'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Flow</label><input v-model="user.flow" placeholder="xtls-rprx-vision" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                                <div v-if="inbound.type==='vmess'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Alter ID</label><input type="number" v-model.number="user.alterId" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none"></div>
                                                <div v-if="inbound.type==='hysteria'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">auth</label><input v-model="user.auth" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                                <div v-if="inbound.type==='hysteria'" class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">auth_str</label><input v-model="user.auth_str" placeholder="优先于 auth" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                                <div class="col-span-2 flex justify-end"><button @click="removeInboundUser(inbound, uIdx)" class="text-xs bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 border border-red-200 font-bold transition"><i class="fas fa-trash-alt mr-1"></i>删除用户</button></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div v-if="inboundSupportsTls(inbound.type)" class="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
                                        <div class="flex items-center justify-between">
                                            <div class="text-xs font-extrabold text-gray-700 uppercase tracking-wider">TLS / Reality</div>
                                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="inbound.tls_enabled" class="w-4 h-4 text-indigo-600 rounded"><span class="text-sm font-bold text-gray-700">启用 TLS</span></label>
                                        </div>
                                        <div v-if="inbound.tls_enabled" class="grid grid-cols-2 gap-3">
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">certificate_path</label><input v-model="inbound.tls_cert_path" placeholder="/etc/sing-box/cert.pem" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">key_path</label><input v-model="inbound.tls_key_path" placeholder="/etc/sing-box/key.pem" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">server_name</label><input v-model="inbound.tls_server_name" placeholder="example.com" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">ALPN</label><input v-model="inbound.tls_alpn" placeholder="h2,http/1.1" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">min_version</label><select v-model="inbound.tls_min_version" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="">default</option><option value="1.0">1.0</option><option value="1.1">1.1</option><option value="1.2">1.2</option><option value="1.3">1.3</option></select></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">max_version</label><select v-model="inbound.tls_max_version" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="">default</option><option value="1.0">1.0</option><option value="1.1">1.1</option><option value="1.2">1.2</option><option value="1.3">1.3</option></select></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">handshake_timeout</label><input v-model="inbound.tls_handshake_timeout" placeholder="5s" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="inbound.reality_enabled" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">启用 Reality</span></label></div>
                                            <template v-if="inbound.reality_enabled">
                                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">reality.private_key</label><input v-model="inbound.reality_private_key" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">reality.short_id</label><input v-model="inbound.reality_short_id" placeholder="0123456789abcdef" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">reality.handshake.server</label><input v-model="inbound.reality_server" placeholder="www.cloudflare.com" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">reality.handshake.port</label><input type="number" v-model.number="inbound.reality_server_port" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                                <div class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">reality.max_time_difference</label><input v-model="inbound.reality_max_time_difference" placeholder="1m" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            </template>
                                        </div>
                                    </div>

                                    <div v-if="inboundSupportsTransport(inbound.type)" class="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
                                        <div class="text-xs font-extrabold text-gray-700 uppercase tracking-wider">V2Ray Transport</div>
                                        <div class="grid grid-cols-2 gap-3">
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">transport</label><select v-model="inbound.transport" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="">tcp</option><option value="ws">ws</option><option value="grpc">grpc</option><option value="http">http</option><option value="httpupgrade">httpupgrade</option><option value="quic">quic</option></select></div>
                                            <div v-if="['ws','http','httpupgrade'].includes(inbound.transport)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">path</label><input v-model="inbound.transport_path" placeholder="/ws" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            <div v-if="inbound.transport==='grpc'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">service_name</label><input v-model="inbound.transport_service_name" placeholder="grpc-service" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            <div v-if="['ws','http','httpupgrade'].includes(inbound.transport)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">host</label><input v-model="inbound.transport_host" placeholder="example.com" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            <div v-if="inbound.transport==='http'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">method</label><input v-model="inbound.transport_method" placeholder="PUT" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            <div v-if="['http','grpc'].includes(inbound.transport)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">idle_timeout</label><input v-model="inbound.transport_idle_timeout" placeholder="15s" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            <div v-if="['http','grpc'].includes(inbound.transport)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">ping_timeout</label><input v-model="inbound.transport_ping_timeout" placeholder="15s" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            <div v-if="inbound.transport==='grpc'" class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="inbound.transport_permit_without_stream" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">permit_without_stream</span></label></div>
                                            <div v-if="inbound.transport==='ws'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">max_early_data</label><input v-model="inbound.transport_early_data" placeholder="0" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            <div v-if="inbound.transport==='ws'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">early_data_header_name</label><input v-model="inbound.transport_early_data_header_name" placeholder="Sec-WebSocket-Protocol" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            <div v-if="['ws','http','httpupgrade'].includes(inbound.transport)" class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">headers</label><textarea v-model="inbound.transport_headers_text" rows="3" placeholder="Server: nginx" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono resize-none"></textarea></div>
                                            <div v-if="inbound.transport==='quic'" class="col-span-2 text-[11px] text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">QUIC transport 没有额外字段，当前仅输出 <code>{ type: "quic" }</code>。</div>
                                        </div>
                                    </div>

                                    <div v-if="inboundSupportsMultiplex(inbound.type)" class="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
                                        <div class="flex items-center justify-between">
                                            <div class="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Multiplex</div>
                                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="inbound.mux_enabled" class="w-4 h-4 text-indigo-600 rounded"><span class="text-sm font-bold text-gray-700">启用 Multiplex</span></label>
                                        </div>
                                        <div v-if="inbound.mux_enabled" class="grid grid-cols-2 gap-3">
                                            <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="inbound.mux_padding" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">padding</span></label></div>
                                            <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="inbound.mux_brutal_enabled" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">brutal</span></label></div>
                                            <div class="col-span-2 text-[11px] text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">服务端 Multiplex 这里只暴露官方最常用的布尔项，不再沿用客户端 outbound 式的协议/连接数配置。</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
`, (ctx) => ({
    inboundTypeOptions: [
        { type: 'vless', label: 'VLESS', buttonClass: 'bg-indigo-600 hover:bg-indigo-500' },
        { type: 'vmess', label: 'VMess', buttonClass: 'bg-sky-600 hover:bg-sky-500' },
        { type: 'trojan', label: 'Trojan', buttonClass: 'bg-amber-600 hover:bg-amber-500' },
        { type: 'shadowsocks', label: 'Shadowsocks', buttonClass: 'bg-emerald-600 hover:bg-emerald-500' },
        { type: 'hysteria2', label: 'Hysteria2', buttonClass: 'bg-fuchsia-600 hover:bg-fuchsia-500' },
        { type: 'tuic', label: 'TUIC', buttonClass: 'bg-cyan-600 hover:bg-cyan-500' },
        { type: 'hysteria', label: 'Hysteria', buttonClass: 'bg-purple-600 hover:bg-purple-500' },
        { type: 'anytls', label: 'AnyTLS', buttonClass: 'bg-rose-600 hover:bg-rose-500' },
        { type: 'shadowtls', label: 'ShadowTLS', buttonClass: 'bg-slate-600 hover:bg-slate-500' },
    ],
    inboundSummary: (inbound) => {
        const bits = [];
        if (ctx.inboundUsesUsers(inbound.type, inbound)) bits.push(`${inbound.users.length} users`);
        if (ctx.inboundUsesDestinations(inbound.type, inbound)) bits.push(`${inbound.ss_destinations.length} destinations`);
        if (ctx.inboundSupportsTls(inbound.type) && inbound.tls_enabled) bits.push('TLS on');
        if (ctx.inboundSupportsTransport(inbound.type) && inbound.transport) bits.push(`transport=${inbound.transport}`);
        if (ctx.inboundSupportsMultiplex(inbound.type) && inbound.mux_enabled) bits.push('multiplex');
        return bits.length > 0 ? bits.join(' · ') : '展开后继续编辑协议细节';
    },
}));

const RouteTab = createInjectedComponent('ServerRouteTab', `                <div v-show="currentTab==='route'" class="space-y-5">
                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                            <div class="stitle mb-0">路由 / 出站</div>
                            <button @click="addRouteRule" class="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 font-bold shadow-md transition"><i class="fas fa-plus mr-1.5"></i>新建规则</button>
                        </div>
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">最终出站</label><select v-model="settings.route_final" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-bold text-indigo-700"><option value="direct">direct</option><option value="block">block</option><option value="dns-out">dns-out</option></select></div>
                            <div class="flex items-end pb-2"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="settings.auto_detect_interface" class="w-4 h-4 text-indigo-600 rounded"><span class="text-sm font-bold text-gray-700">auto_detect_interface</span></label></div>
                        </div>
                        <div class="space-y-3">
                            <div v-for="(rule, idx) in routeRules" :key="rule.id" class="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <div class="flex justify-between items-center mb-3">
                                    <div class="text-sm font-extrabold text-gray-800">{{ rule.name }}</div>
                                    <button @click="removeRouteRule(idx)" class="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 border border-red-200 font-bold transition"><i class="fas fa-trash-alt mr-1"></i>删除</button>
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">名称</label><input v-model="rule.name" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-bold text-indigo-700"></div>
                                    <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="rule.enabled" class="w-4 h-4 text-indigo-600 rounded"><span class="text-sm font-bold text-gray-700">启用</span></label></div>
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">匹配类型</label><select v-model="rule.match_type" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none"><option value="protocol">protocol</option><option value="port">port</option><option value="inbound">inbound</option><option value="domain_suffix">domain_suffix</option><option value="rule_set">rule_set</option></select></div>
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">匹配值</label><input v-model="rule.match_value" placeholder="多个用逗号或换行分隔" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">动作</label><select v-model="rule.action" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none"><option value="route">route</option><option value="reject">reject</option><option value="hijack-dns">hijack-dns</option></select></div>
                                    <div v-if="rule.action==='route'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">出站</label><select v-model="rule.outbound" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none"><option value="direct">direct</option><option value="block">block</option><option value="dns-out">dns-out</option></select></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
`);

const AdvancedTab = createInjectedComponent('ServerAdvancedTab', `                <div v-show="currentTab==='advanced'" class="space-y-5">
                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div class="stitle">当前阶段说明</div>
                        <div class="space-y-3 text-sm text-gray-600 leading-7">
                            <p>当前这版已经把服务端常用字段往真实部署场景收了一轮，重点覆盖 <code>inbounds</code>、<code>tls / reality</code>、<code>v2ray transport</code>、<code>multiplex</code> 和最小 <code>route / outbounds</code>。</p>
                            <p>下一阶段更适合继续补的是：</p>
                            <ul class="list-disc pl-5 space-y-1 text-gray-500">
                                <li>服务端运行配置导入</li>
                                <li>更完整的 Listen Fields</li>
                                <li>更完整的 DNS rules / Route rules</li>
                                <li>SSM API 等 Shadowsocks 进阶能力</li>
                            </ul>
                        </div>
                    </div>
                </div>
`);

export const EditorPanel = {
    name: 'ServerEditorPanel',
    components: { BasicTab, DnsTab, InboundsTab, RouteTab, AdvancedTab },
    setup() {
        return useSharedContext();
    },
    template: `        <div class="xl:col-span-7 flex flex-col min-h-0" ref="tabContentContainer">
            <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col min-h-0">
                <div class="border-b border-gray-100 bg-gray-50/70 px-4 py-3">
                    <div class="flex flex-wrap gap-2">
                        <button v-for="tab in tabs" :key="tab.id" @click="currentTab = tab.id" :class="currentTab===tab.id ? 'tab-active' : 'tab-inactive'" class="px-4 py-2 rounded-xl text-sm font-bold transition-all">
                            <i :class="tab.icon" class="mr-2"></i>{{ tab.name }}
                        </button>
                    </div>
                </div>
                <div class="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
                    <basic-tab></basic-tab>
                    <dns-tab></dns-tab>
                    <inbounds-tab></inbounds-tab>
                    <route-tab></route-tab>
                    <advanced-tab></advanced-tab>
                </div>
            </div>
        </div>`,
};
