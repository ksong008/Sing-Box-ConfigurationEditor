import { useSharedContext } from './shared.js';

const { computed, ref, onMounted, onBeforeUnmount } = window.Vue;

const createInjectedComponent = (name, template, extendSetup = null) => ({
    name,
    setup() {
        const ctx = useSharedContext();
        return extendSetup ? { ...ctx, ...extendSetup(ctx) } : ctx;
    },
    template,
});

const createOutboundOptions = (ctx) => computed(() => {
    const reservedTags = new Set(['direct', 'block', 'dns', 'dns-out']);
    const custom = ctx.remoteOutbounds.value
        .map((item) => item.tag)
        .filter((tag) => tag && !reservedTags.has(tag));
    return Array.from(new Set(['direct', ...custom]));
});

const BasicTab = createInjectedComponent('ServerBasicTab', `                <div v-show="currentTab==='basic'" class="space-y-5">
                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div class="stitle">基础设置</div>
                        <div class="grid grid-cols-2 gap-4">
                            <div @focusin.capture="queueJsonScrollTo('log')" @change.capture="queueJsonScrollTo('log')">
                                <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">日志级别 (Log Level)</label>
                                <select v-model="settings.log_level" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none">
                                    <option value="trace">trace</option>
                                    <option value="debug">debug</option>
                                    <option value="info">info</option>
                                    <option value="warn">warn</option>
                                    <option value="error">error</option>
                                </select>
                            </div>
                            <div @focusin.capture="queueJsonScrollTo('route-root')" @change.capture="queueJsonScrollTo('route-root')">
                                <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">默认出站 (Final Outbound)</label>
                                <select v-model="settings.route_final" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-bold text-indigo-700">
                                    <option v-for="item in outboundOptions" :key="item" :value="item">{{ item }}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
`, (ctx) => ({
    outboundOptions: createOutboundOptions(ctx),
}));

const DnsTab = createInjectedComponent('ServerDnsTab', `                <div v-show="currentTab==='dns'" class="space-y-5">
                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                            <div class="stitle mb-0">上游 DNS</div>
                            <button @click="addDnsServer" class="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 font-bold shadow-md transition"><i class="fas fa-plus mr-1.5"></i>新建 DNS</button>
                        </div>
                        <div class="grid grid-cols-2 gap-4 mb-4" @focusin.capture="queueJsonScrollTo('dns-root')" @input.capture="queueJsonScrollTo('dns-root')" @change.capture="queueJsonScrollTo('dns-root')">
                            <div><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">DNS 策略 (DNS Strategy)</label><select v-model="settings.dns_strategy" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none"><option value="prefer_ipv4">prefer_ipv4</option><option value="prefer_ipv6">prefer_ipv6</option><option value="ipv4_only">ipv4_only</option><option value="ipv6_only">ipv6_only</option></select></div>
                            <div><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">最终 DNS (DNS Final)</label><select v-model="settings.dns_final" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-mono"><option value="">default</option><option v-for="item in dnsTagOptions(settings.dns_final)" :key="item" :value="item">{{ item }}</option></select></div>
                            <div><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">客户端子网 (Client Subnet)</label><input v-model="settings.dns_client_subnet" placeholder="1.2.3.0/24" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-mono"></div>
                            <div><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">缓存容量 (Cache Capacity)</label><input type="number" v-model.number="settings.dns_cache_capacity" placeholder="1024" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-mono"></div>
                        </div>
                        <div class="flex flex-wrap gap-4 mb-4 bg-gray-50 rounded-lg border border-gray-200 px-4 py-3" @focusin.capture="queueJsonScrollTo('dns-root')" @change.capture="queueJsonScrollTo('dns-root')">
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="settings.dns_disable_cache" class="w-4 h-4 text-indigo-600 rounded"><span class="text-sm font-bold text-gray-700">disable_cache</span></label>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="settings.dns_disable_expire" class="w-4 h-4 text-indigo-600 rounded"><span class="text-sm font-bold text-gray-700">disable_expire</span></label>
                        </div>

                        <div class="space-y-3">
                            <div v-for="(dns, idx) in dnsList" :key="dns.id" class="bg-gray-50 border border-gray-200 rounded-xl p-4" @focusin.capture="queueJsonScrollTo('dns-server', dns)" @input.capture="queueJsonScrollTo('dns-server', dns)" @change.capture="queueJsonScrollTo('dns-server', dns)">
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
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">域名解析器</label><select v-model="dns.domain_resolver" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-mono"><option value="">none</option><option v-for="item in dnsTagOptions(dns.domain_resolver, dns.tag)" :key="item" :value="item">{{ item }}</option></select></div>
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">客户端子网</label><input v-model="dns.client_subnet" placeholder="1.2.3.0/24" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">连接超时</label><input v-model="dns.connect_timeout" placeholder="5s" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                    <div class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">HTTP 请求头 (HTTP Headers)</label><textarea v-model="dns.headers_text" rows="3" placeholder="Accept: application/dns-message" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none font-mono resize-none"></textarea></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
`, (ctx) => ({
    dnsTagOptions: (current = '', excludeTag = '') => {
        const tags = ctx.dnsList.value
            .map((item) => item.tag)
            .filter((tag) => tag && tag !== excludeTag);
        const unique = Array.from(new Set(tags));
        return current && !unique.includes(current) ? [current, ...unique] : unique;
    },
}));

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

                        <div v-if="serverInbounds.length === 0" class="text-center text-sm font-bold text-gray-400 py-8 border-2 border-dashed border-gray-200 rounded-xl">暂无入站协议，请点击上方按钮添加。</div>
                        <div v-else class="space-y-4">
                            <div v-for="(inbound, idx) in serverInbounds" :key="inbound.id" class="bg-gray-50 p-4 rounded-xl border border-gray-200" @focusin.capture="queueJsonScrollTo('inbound', inbound)" @input.capture="queueJsonScrollTo('inbound', inbound)" @change.capture="queueJsonScrollTo('inbound', inbound)">
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
                                    <div v-if="inboundSupportsShareLinks(inbound.type)" class="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
                                        <div class="flex items-center justify-between">
                                            <div class="text-xs font-extrabold text-gray-700 uppercase tracking-wider">客户端分享参数</div>
                                            <span class="text-[11px] text-gray-500 font-semibold">用于生成节点链接和订阅原文</span>
                                        </div>
                                        <div class="grid grid-cols-2 gap-3">
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">订阅地址 (Share Server)</label><input v-model="inbound.share_server" placeholder="server.example.com" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">订阅端口 (Share Port)</label><input v-model="inbound.share_port" placeholder="443" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">备注前缀 (Remark Prefix)</label><input v-model="inbound.share_name_prefix" placeholder="hk-edge" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"></div>
                                            <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="inbound.share_allow_insecure" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">允许不安全证书 (Allow Insecure)</span></label></div>
                                            <div v-if="['vless','trojan'].includes(inbound.type)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">uTLS 指纹 (uTLS Fingerprint)</label><select v-model="inbound.share_utls_fingerprint" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="">none</option><option v-for="item in fingerprintOptions(inbound.share_utls_fingerprint)" :key="item" :value="item">{{ item }}</option></select></div>
                                            <div v-if="inbound.reality_enabled && ['vless','trojan'].includes(inbound.type)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Reality 公钥 (Reality Public Key)</label><input v-model="inbound.share_reality_public_key" placeholder="用于客户端链接生成" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        </div>
                                    </div>

                                    <div v-if="inbound.type==='shadowsocks'" class="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
                                        <div class="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Shadowsocks 设置 (Shadowsocks Settings)</div>
                                        <div class="grid grid-cols-2 gap-3">
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">加密方法 (Method)</label><select v-model="inbound.ss_method" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option v-for="item in ssMethodOptions(inbound.ss_method)" :key="item" :value="item">{{ item }}</option></select></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">网络 (Network)</label><select v-model="inbound.ss_network" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="">default (tcp+udp)</option><option v-for="item in ssNetworkOptions(inbound.ss_network)" :key="item" :value="item">{{ item }}</option></select></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">模式</label><select v-model="inbound.ss_mode" @change="syncShadowsocksMode(inbound)" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="single">single-user</option><option value="multi-user">multi-user</option><option value="relay">relay</option></select></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">主密码</label><input v-model="inbound.ss_password" placeholder="single/relay 模式常用" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                            <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="inbound.ss_managed" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">托管模式 (Managed)</span></label></div>
                                            <div class="text-[11px] text-gray-500 leading-5">multi-user 使用 users；relay 使用 destinations；single-user 使用主密码。</div>
                                        </div>
                                    </div>

                                    <div v-if="inbound.type==='trojan'" class="bg-white border border-gray-200 rounded-lg p-3 grid grid-cols-2 gap-3">
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">回落地址 (Fallback Server)</label><input v-model="inbound.trojan_fallback_server" placeholder="127.0.0.1" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">回落端口 (Fallback Port)</label><input v-model="inbound.trojan_fallback_port" placeholder="80" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">ALPN 回落 (Fallback For ALPN)</label><textarea v-model="inbound.trojan_fallback_for_alpn_text" rows="3" placeholder="h2=127.0.0.1:8443&#10;http/1.1=127.0.0.1:8080" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono resize-none"></textarea></div>
                                    </div>

                                    <div v-if="inbound.type==='hysteria'" class="bg-white border border-gray-200 rounded-lg p-3 grid grid-cols-2 gap-3">
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">上行带宽 (Up Mbps)</label><input v-model="inbound.hy_up_mbps" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">下行带宽 (Down Mbps)</label><input v-model="inbound.hy_down_mbps" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">混淆 (Obfs)</label><input v-model="inbound.hy_obfs" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">连接接收窗 (Recv Window Conn)</label><input v-model="inbound.hy_recv_window_conn" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">客户端接收窗 (Recv Window Client)</label><input v-model="inbound.hy_recv_window_client" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">客户端最大连接 (Max Conn Client)</label><input v-model="inbound.hy_max_conn_client" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div class="col-span-2 flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="inbound.hy_disable_mtu_discovery" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">禁用 MTU 探测 (Disable MTU Discovery)</span></label></div>
                                    </div>

                                    <div v-if="inbound.type==='hysteria2'" class="bg-white border border-gray-200 rounded-lg p-3 grid grid-cols-2 gap-3">
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">上行带宽 (Up Mbps)</label><input v-model="inbound.hy2_up_mbps" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">下行带宽 (Down Mbps)</label><input v-model="inbound.hy2_down_mbps" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">混淆类型 (Obfs Type)</label><select v-model="inbound.hy2_obfs_type" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="">none</option><option v-for="item in hy2ObfsTypeOptions(inbound.hy2_obfs_type)" :key="item" :value="item">{{ item }}</option></select></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">混淆密码 (Obfs Password)</label><input v-model="inbound.hy2_obfs_password" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">伪装模式 (Masquerade)</label><select v-model="inbound.hy2_masquerade_mode" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="none">none</option><option value="url">url</option><option value="file">file</option><option value="proxy">proxy</option><option value="string">string</option></select></div>
                                        <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="inbound.hy2_ignore_client_bandwidth" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">忽略客户端带宽 (Ignore Client Bandwidth)</span></label></div>
                                        <div v-if="['url','proxy'].includes(inbound.hy2_masquerade_mode)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">伪装地址 (Masquerade URL)</label><input v-model="inbound.hy2_masquerade_url" placeholder="https://example.com" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div v-if="inbound.hy2_masquerade_mode==='file'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">伪装目录 (Masquerade Directory)</label><input v-model="inbound.hy2_masquerade_directory" placeholder="/var/www/html" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div v-if="inbound.hy2_masquerade_mode==='proxy'" class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="inbound.hy2_masquerade_rewrite_host" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">重写 Host (Rewrite Host)</span></label></div>
                                        <div v-if="inbound.hy2_masquerade_mode==='string'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">状态码 (Status Code)</label><input v-model="inbound.hy2_masquerade_status_code" placeholder="200" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div v-if="inbound.hy2_masquerade_mode==='string'" class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">请求头 (Headers)</label><textarea v-model="inbound.hy2_masquerade_headers_text" rows="3" placeholder="Content-Type: text/html" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono resize-none"></textarea></div>
                                        <div v-if="inbound.hy2_masquerade_mode==='string'" class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">内容 (Content)</label><textarea v-model="inbound.hy2_masquerade_content" rows="3" placeholder="hello from sing-box" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono resize-none"></textarea></div>
                                    </div>

                                    <div v-if="inbound.type==='tuic'" class="bg-white border border-gray-200 rounded-lg p-3 grid grid-cols-2 gap-3">
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">拥塞控制 (Congestion Control)</label><select v-model="inbound.tuic_congestion" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="cubic">cubic</option><option value="new_reno">new_reno</option><option value="bbr">bbr</option></select></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">认证超时 (Auth Timeout)</label><input v-model="inbound.tuic_auth_timeout" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">心跳 (Heartbeat)</label><input v-model="inbound.tuic_heartbeat" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="inbound.tuic_zero_rtt_handshake" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">零 RTT 握手 (Zero RTT Handshake)</span></label></div>
                                    </div>

                                    <div v-if="inbound.type==='anytls'" class="bg-white border border-gray-200 rounded-lg p-3">
                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">填充方案 (Padding Scheme)</label>
                                        <textarea v-model="inbound.anytls_padding_scheme_text" rows="4" placeholder="stop&#10;0-16&#10;32-64" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono resize-none"></textarea>
                                    </div>

                                    <div v-if="inbound.type==='shadowtls'" class="bg-white border border-gray-200 rounded-lg p-3 grid grid-cols-2 gap-3">
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">版本 (Version)</label><select v-model="inbound.shadowtls_version" @change="syncShadowTlsVersion(inbound)" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></div>
                                        <div v-if="inbound.shadowtls_version==='2'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">密码 (Password)</label><input v-model="inbound.shadowtls_password" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">握手地址 (Handshake Server)</label><input v-model="inbound.shadowtls_handshake_server" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">握手端口 (Handshake Port)</label><input type="number" v-model.number="inbound.shadowtls_handshake_port" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">按域名握手 (Handshake For Server Name)</label><textarea v-model="inbound.shadowtls_handshake_for_server_name_text" rows="3" placeholder="example.com=127.0.0.1:443&#10;api.example.com=127.0.0.1:8443" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono resize-none"></textarea></div>
                                        <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="inbound.shadowtls_strict_mode" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">严格模式 (Strict Mode)</span></label></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">通配 SNI (Wildcard SNI)</label><select v-model="inbound.shadowtls_wildcard_sni" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="off">off</option><option value="authed">authed</option><option value="all">all</option></select></div>
                                    </div>

                                    <div v-if="inboundUsesDestinations(inbound.type, inbound)" class="bg-white border border-gray-200 rounded-lg p-3">
                                        <div class="flex justify-between items-center mb-3">
                                            <div class="text-xs font-extrabold text-gray-700 uppercase tracking-wider">中继目标 (Relay Destinations)</div>
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
                                            <div class="text-xs font-extrabold text-gray-700 uppercase tracking-wider">用户 (Users)</div>
                                            <button @click="addInboundUser(inbound)" class="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 border border-indigo-200 font-bold transition"><i class="fas fa-plus mr-1"></i>添加用户</button>
                                        </div>
                                        <div class="space-y-3">
                                            <div v-for="(user, uIdx) in inbound.users" :key="user.id" class="bg-gray-50 border border-gray-200 rounded-lg p-3 grid grid-cols-2 gap-3">
                                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">名称</label><input v-model="user.name" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none"></div>
                                                <div v-if="['vless','vmess','tuic'].includes(inbound.type)">
                                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">用户 UUID (UUID)</label>
                                                    <div class="flex gap-2">
                                                        <input v-model="user.uuid" class="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none font-mono">
                                                        <button @click="generateUserUuid(inbound, user)" type="button" class="px-3 py-2 rounded-lg text-xs font-bold border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 whitespace-nowrap">按名称生成</button>
                                                    </div>
                                                    <div class="text-[11px] text-gray-500 mt-1">默认先给随机 UUID；需要时可点击按钮按名称生成稳定 UUID。</div>
                                                </div>
                                                <div v-if="['trojan','hysteria2','tuic','anytls','shadowtls','shadowsocks'].includes(inbound.type)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">密码</label><input v-model="user.password" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                                <div v-if="inbound.type==='vless'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">流控 (Flow)</label><select v-model="user.flow" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none"><option value="">none</option><option value="xtls-rprx-vision">xtls-rprx-vision</option></select></div>
                                                <div v-if="inbound.type==='vmess'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">额外 ID (Alter ID)</label><select v-model.number="user.alterId" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none"><option :value="0">0</option><option :value="1">1</option></select></div>
                                                <div v-if="inbound.type==='hysteria'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">认证方式</label><select v-model="user.auth_mode" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none"><option value="plain">auth_str</option><option value="base64">auth</option></select></div>
                                                <div v-if="inbound.type==='hysteria'" class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">{{ user.auth_mode === 'base64' ? 'auth' : 'auth_str' }}</label><input v-model="user[user.auth_mode === 'base64' ? 'auth' : 'auth_str']" :placeholder="user.auth_mode === 'base64' ? 'Base64 编码认证串' : '明文认证串'" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
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
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">证书路径 (Certificate Path)</label><input v-model="inbound.tls_cert_path" placeholder="/etc/sing-box/cert.pem" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">私钥路径 (Key Path)</label><input v-model="inbound.tls_key_path" placeholder="/etc/sing-box/key.pem" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">服务器名称 (Server Name)</label><input v-model="inbound.tls_server_name" placeholder="example.com" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">应用层协议 (ALPN)</label><select v-model="inbound.tls_alpn" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="">default</option><option v-for="item in alpnOptions(inbound.type, inbound.tls_alpn)" :key="item" :value="item">{{ item }}</option></select></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">最低版本 (Min Version)</label><select v-model="inbound.tls_min_version" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="">default</option><option value="1.0">1.0</option><option value="1.1">1.1</option><option value="1.2">1.2</option><option value="1.3">1.3</option></select></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">最高版本 (Max Version)</label><select v-model="inbound.tls_max_version" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="">default</option><option value="1.0">1.0</option><option value="1.1">1.1</option><option value="1.2">1.2</option><option value="1.3">1.3</option></select></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">握手超时 (Handshake Timeout)</label><input v-model="inbound.tls_handshake_timeout" placeholder="5s" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="inbound.reality_enabled" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">启用 Reality</span></label></div>
                                            <template v-if="inbound.reality_enabled">
                                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Reality 私钥 (Reality Private Key)</label><input v-model="inbound.reality_private_key" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Reality 短 ID (Reality Short ID)</label><input v-model="inbound.reality_short_id" placeholder="0123456789abcdef" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Reality 握手地址 (Reality Handshake Server)</label><input v-model="inbound.reality_server" placeholder="www.cloudflare.com" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Reality 握手端口 (Reality Handshake Port)</label><input type="number" v-model.number="inbound.reality_server_port" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                                <div class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">最大时间差 (Max Time Difference)</label><input v-model="inbound.reality_max_time_difference" placeholder="1m" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            </template>
                                        </div>
                                    </div>

                                    <div v-if="inboundSupportsTransport(inbound.type)" class="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
                                        <div class="text-xs font-extrabold text-gray-700 uppercase tracking-wider">V2Ray 传输层 (V2Ray Transport)</div>
                                        <div class="grid grid-cols-2 gap-3">
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">传输层 (Transport)</label><select v-model="inbound.transport" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="">tcp</option><option value="ws">ws</option><option value="grpc">grpc</option><option value="http">http</option><option value="httpupgrade">httpupgrade</option><option value="quic">quic</option></select></div>
                                            <div v-if="['ws','http','httpupgrade'].includes(inbound.transport)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">路径 (Path)</label><input v-model="inbound.transport_path" placeholder="/ws" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            <div v-if="inbound.transport==='grpc'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">服务名 (Service Name)</label><input v-model="inbound.transport_service_name" placeholder="grpc-service" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            <div v-if="['ws','http','httpupgrade'].includes(inbound.transport)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">主机 (Host)</label><input v-model="inbound.transport_host" placeholder="example.com" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            <div v-if="inbound.transport==='http'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">方法 (Method)</label><select v-model="inbound.transport_method" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="">default</option><option v-for="item in httpMethodOptions(inbound.transport_method)" :key="item" :value="item">{{ item }}</option></select></div>
                                            <div v-if="['http','grpc'].includes(inbound.transport)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">空闲超时 (Idle Timeout)</label><input v-model="inbound.transport_idle_timeout" placeholder="15s" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            <div v-if="['http','grpc'].includes(inbound.transport)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Ping 超时 (Ping Timeout)</label><input v-model="inbound.transport_ping_timeout" placeholder="15s" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            <div v-if="inbound.transport==='grpc'" class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="inbound.transport_permit_without_stream" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">无流探测 (Permit Without Stream)</span></label></div>
                                            <div v-if="inbound.transport==='ws'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">最大提前数据 (Max Early Data)</label><input v-model="inbound.transport_early_data" placeholder="0" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                            <div v-if="inbound.transport==='ws'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">提前数据头 (Early Data Header Name)</label><select v-model="inbound.transport_early_data_header_name" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="">default</option><option v-for="item in earlyDataHeaderOptions(inbound.transport_early_data_header_name)" :key="item" :value="item">{{ item }}</option></select></div>
                                            <div v-if="['ws','http','httpupgrade'].includes(inbound.transport)" class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">请求头 (Headers)</label><textarea v-model="inbound.transport_headers_text" rows="3" placeholder="Server: nginx" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono resize-none"></textarea></div>
                                            <div v-if="inbound.transport==='quic'" class="col-span-2 text-[11px] text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">QUIC transport 没有额外字段，当前仅输出 <code>{ type: "quic" }</code>。</div>
                                        </div>
                                    </div>

                                    <div v-if="inboundSupportsMultiplex(inbound.type)" class="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
                                        <div class="flex items-center justify-between">
                                            <div class="text-xs font-extrabold text-gray-700 uppercase tracking-wider">多路复用 (Multiplex)</div>
                                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="inbound.mux_enabled" class="w-4 h-4 text-indigo-600 rounded"><span class="text-sm font-bold text-gray-700">启用 Multiplex</span></label>
                                        </div>
                                        <div v-if="inbound.mux_enabled" class="grid grid-cols-2 gap-3">
                                            <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="inbound.mux_padding" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">填充 (Padding)</span></label></div>
                                            <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="inbound.mux_brutal_enabled" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">Brutal 模式 (Brutal)</span></label></div>
                                            <div class="col-span-2 text-[11px] text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">服务端 Multiplex 这里只暴露官方最常用的布尔项，不再沿用客户端 outbound 式的协议/连接数配置。</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
`, (ctx) => ({
    optionWithCurrent: (base, current = '') => current && !base.includes(current) ? [current, ...base] : base,
    fingerprintOptions: (current = '') => {
        const options = ['chrome', 'firefox', 'safari', 'edge', 'ios', 'android', 'randomized'];
        return (current && !options.includes(current)) ? [current, ...options] : options;
    },
    alpnOptions: (type, current = '') => {
        const preset = ['h2,http/1.1', 'http/1.1', 'h2', 'h3', 'h3,hq', 'h3,http/1.1'];
        const udpPreferred = ['h3', 'h3,hq', 'h3,http/1.1', 'http/1.1'];
        const options = ['hysteria', 'hysteria2', 'tuic'].includes(type) ? udpPreferred : preset;
        return current && !options.includes(current) ? [current, ...options] : options;
    },
    ssMethodOptions: (current = '') => {
        const options = [
            '2022-blake3-aes-128-gcm',
            '2022-blake3-aes-256-gcm',
            '2022-blake3-chacha20-poly1305',
            'aes-128-gcm',
            'aes-256-gcm',
            'chacha20-ietf-poly1305',
            'xchacha20-ietf-poly1305',
            'none',
        ];
        return current && !options.includes(current) ? [current, ...options] : options;
    },
    ssNetworkOptions: (current = '') => {
        const options = ['tcp', 'udp'];
        return current && !options.includes(current) ? [current, ...options] : options;
    },
    hy2ObfsTypeOptions: (current = '') => {
        const options = ['salamander'];
        return current && !options.includes(current) ? [current, ...options] : options;
    },
    httpMethodOptions: (current = '') => {
        const options = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
        return current && !options.includes(current) ? [current, ...options] : options;
    },
    earlyDataHeaderOptions: (current = '') => {
        const options = ['Sec-WebSocket-Protocol'];
        return current && !options.includes(current) ? [current, ...options] : options;
    },
    outboundOptions: createOutboundOptions(ctx),
    enabledRuleSetTags: computed(() => ctx.ruleSets.value.filter((item) => item.enabled && item.tag).map((item) => item.tag)),
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

const ShareTab = createInjectedComponent('ServerShareTab', `                <div v-show="currentTab==='share'" class="space-y-5">
                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div class="stitle">订阅 / 节点链接</div>
                        <div class="space-y-3 text-sm text-gray-600 leading-7">
                            <p>这里生成的是本地“节点链接原文”，不会自动托管成在线订阅 URL。</p>
                            <p>当前优先支持 <code>VLESS / VMess / Trojan / Shadowsocks / Hysteria2 / TUIC</code>。生成质量依赖每个入站里填写的 <code>share_server / share_port</code>；如果启用了 Reality，还需要补 <code>Reality public key</code>。</p>
                        </div>
                    </div>

                    <div v-if="userBundles.length === 0" class="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800 font-semibold">
                        还没有可生成的订阅内容。请先在支持的入站协议里填写用户与客户端分享参数。
                    </div>

                    <div v-for="bundle in userBundles" :key="bundle.key" class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <div class="flex flex-wrap justify-between items-center gap-3">
                            <div>
                                <div class="text-base font-extrabold text-gray-900">{{ bundle.label }}</div>
                                <div class="text-xs text-gray-500 font-semibold mt-1">{{ bundle.links.length }} 条节点链接</div>
                            </div>
                            <div class="flex gap-2 flex-wrap">
                                <button @click="copyBundlePlainText(bundle)" :disabled="!bundle.plainText" class="px-4 py-2 rounded-lg text-sm font-bold border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed"><i class="fas fa-copy mr-1.5"></i>复制订阅原文</button>
                            </div>
                        </div>

                        <div v-if="bundle.problems.length > 0" class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                            <div class="text-xs font-black text-amber-800 uppercase tracking-wider mb-2">需检查</div>
                            <ul class="list-disc pl-5 text-sm text-amber-800 space-y-1">
                                <li v-for="problem in bundle.problems" :key="problem">{{ problem }}</li>
                            </ul>
                        </div>

                        <div class="space-y-3">
                            <div v-for="(item, idx) in bundle.links" :key="item.protocol + '-' + item.inboundTag + '-' + idx" class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div class="flex flex-wrap justify-between items-center gap-3 mb-2">
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <span class="badge bg-white text-indigo-700 border border-indigo-200">{{ item.protocol }}</span>
                                        <span class="text-sm font-bold text-gray-800">{{ item.inboundTag }}</span>
                                    </div>
                                    <button @click="copyShareLink(item)" class="px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"><i class="fas fa-copy mr-1"></i>复制链接</button>
                                </div>
                                <textarea :value="item.link" rows="3" readonly class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none font-mono resize-y"></textarea>
                            </div>
                        </div>

                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">订阅原文</label>
                            <textarea :value="bundle.plainText" rows="6" readonly class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none font-mono resize-y"></textarea>
                        </div>
                    </div>
                </div>
`);

const RouteTab = createInjectedComponent('ServerRouteTab', `                <div v-show="currentTab==='route'" class="space-y-5">
                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div class="stitle mb-4">路由 / 出站</div>
                        <div class="grid grid-cols-2 gap-4 mb-6" @focusin.capture="queueJsonScrollTo('route-root')" @input.capture="queueJsonScrollTo('route-root')" @change.capture="queueJsonScrollTo('route-root')">
                            <div><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">最终出站 (Final Outbound)</label><select v-model="settings.route_final" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-bold text-indigo-700"><option v-for="item in outboundOptions" :key="item" :value="item">{{ item }}</option></select></div>
                            <div class="flex items-end pb-2"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="settings.auto_detect_interface" class="w-4 h-4 text-indigo-600 rounded"><span class="text-sm font-bold text-gray-700">自动探测接口 (Auto Detect Interface)</span></label></div>
                        </div>

                        <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                            <div class="flex justify-between items-center mb-4">
                                <div>
                                    <div class="text-sm font-extrabold text-gray-800">远端出站 (Remote Outbounds)</div>
                                    <div class="text-xs text-gray-500 mt-1">用于把命中规则集的流量转发到另一台 VPS。</div>
                                </div>
                                <div class="flex gap-2 flex-wrap">
                                    <button @click="addRemoteOutbound('vless')" class="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-500 font-bold transition">VLESS</button>
                                    <button @click="addRemoteOutbound('vmess')" class="text-xs bg-sky-600 text-white px-3 py-1.5 rounded-lg hover:bg-sky-500 font-bold transition">VMess</button>
                                    <button @click="addRemoteOutbound('trojan')" class="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-500 font-bold transition">Trojan</button>
                                    <button @click="addRemoteOutbound('shadowsocks')" class="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-500 font-bold transition">Shadowsocks</button>
                                    <button @click="addRemoteOutbound('hysteria2')" class="text-xs bg-fuchsia-600 text-white px-3 py-1.5 rounded-lg hover:bg-fuchsia-500 font-bold transition">Hysteria2</button>
                                    <button @click="addRemoteOutbound('tuic')" class="text-xs bg-cyan-600 text-white px-3 py-1.5 rounded-lg hover:bg-cyan-500 font-bold transition">TUIC</button>
                                    <button @click="addRemoteOutbound('wireguard')" class="text-xs bg-slate-600 text-white px-3 py-1.5 rounded-lg hover:bg-slate-500 font-bold transition">WireGuard</button>
                                </div>
                            </div>

                            <div v-if="remoteOutbounds.length === 0" class="text-center text-sm font-bold text-gray-400 py-6 border-2 border-dashed border-gray-200 rounded-xl">暂无远端出站，请点击上方按钮添加。</div>
                            <div v-else class="space-y-3">
                                <div v-for="(outbound, idx) in remoteOutbounds" :key="outbound.id" class="bg-white border border-gray-200 rounded-xl p-4" @focusin.capture="queueJsonScrollTo('remote-outbound', outbound)" @input.capture="queueJsonScrollTo('remote-outbound', outbound)" @change.capture="queueJsonScrollTo('remote-outbound', outbound)">
                                    <div class="flex justify-between items-center mb-3">
                                        <div class="flex items-center gap-2">
                                            <span class="text-sm font-extrabold text-gray-800">{{ outbound.tag }}</span>
                                            <span class="badge bg-white text-indigo-700 border border-indigo-200">{{ outbound.type }}</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <button @click="toggleRemoteOutboundCollapsed(idx)" class="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 w-7 h-7 flex justify-center items-center rounded-lg transition-colors"><i :class="outbound.collapsed ? 'fas fa-chevron-down text-sm' : 'fas fa-chevron-up text-sm'"></i></button>
                                            <button @click="removeRemoteOutbound(idx)" class="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 border border-red-200 font-bold transition"><i class="fas fa-trash-alt mr-1"></i>删除</button>
                                        </div>
                                    </div>
                                    <div v-if="outbound.collapsed" class="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                        {{ outbound.type }} · {{ outbound.server || '未填写服务器' }}:{{ outbound.server_port || 443 }}<span v-if="outbound.transport"> · {{ outbound.transport }}</span><span v-if="outbound.tls_enabled"> · TLS</span>
                                    </div>
                                    <template v-else>
                                    <div class="grid grid-cols-3 gap-3 mb-3">
                                        <div class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">订阅链接/节点原文 (Subscription URL / Node Link)</label><input v-model="outbound.import_source" placeholder="https://... 或 vless://..." class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div class="flex items-end"><button @click="importRemoteOutboundFromSource(outbound)" class="w-full text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 font-bold transition"><i class="fas fa-download mr-1.5"></i>读取并填入</button></div>
                                    </div>
                                    <div class="mb-3 flex items-center gap-2 text-xs text-gray-600">
                                        <input type="checkbox" v-model="settings.remote_import_use_cors" class="w-4 h-4 text-indigo-600 rounded">
                                        <span class="font-bold">使用 CORS 代理兜底</span>
                                        <span class="text-gray-400">默认关闭，先直连拉取，失败后仅在开启时再尝试代理。</span>
                                    </div>
                                    <div class="grid grid-cols-2 gap-3">
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">标签 (Tag)</label><input v-model="outbound.tag" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-bold text-indigo-700"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">类型 (Type)</label><select v-model="outbound.type" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option v-for="item in REMOTE_OUTBOUND_TYPES" :key="item" :value="item">{{ item }}</option></select></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">服务器 (Server)</label><input v-model="outbound.server" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">端口 (Server Port)</label><input type="number" v-model.number="outbound.server_port" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>

                                        <template v-if="outbound.type==='vless'">
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">UUID (UUID)</label><input v-model="outbound.uuid" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">流控 (Flow)</label><select v-model="outbound.flow" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="">none</option><option value="xtls-rprx-vision">xtls-rprx-vision</option></select></div>
                                        </template>

                                        <template v-if="outbound.type==='vmess'">
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">UUID (UUID)</label><input v-model="outbound.uuid" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">额外 ID (Alter ID)</label><select v-model.number="outbound.alter_id" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option :value="0">0</option><option :value="1">1</option></select></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">加密方式 (Security)</label><select v-model="outbound.security" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option v-for="item in vmessSecurityOptions(outbound.security)" :key="item" :value="item">{{ item }}</option></select></div>
                                            <div class="flex items-end gap-4">
                                                <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="outbound.global_padding" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">全局填充 (Global Padding)</span></label>
                                                <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="outbound.authenticated_length" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">认证长度 (Authenticated Length)</span></label>
                                            </div>
                                        </template>

                                        <template v-if="outbound.type==='trojan'">
                                            <div class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">密码 (Password)</label><input v-model="outbound.password" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        </template>

                                        <template v-if="outbound.type==='shadowsocks'">
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">加密方法 (Method)</label><select v-model="outbound.method" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option v-for="item in ssMethodOptions(outbound.method)" :key="item" :value="item">{{ item }}</option></select></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">网络 (Network)</label><select v-model="outbound.network" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="">default (tcp+udp)</option><option v-for="item in ssNetworkOptions(outbound.network)" :key="item" :value="item">{{ item }}</option></select></div>
                                            <div class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">密码 (Password)</label><input v-model="outbound.password" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        </template>

                                        <template v-if="outbound.type==='hysteria2'">
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">密码 (Password)</label><input v-model="outbound.password" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">网络 (Network)</label><select v-model="outbound.network" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="">default</option><option v-for="item in genericNetworkOptions(outbound.network)" :key="item" :value="item">{{ item }}</option></select></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">混淆类型 (Obfs Type)</label><select v-model="outbound.hy2_obfs_type" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="">none</option><option v-for="item in hy2ObfsTypeOptions(outbound.hy2_obfs_type)" :key="item" :value="item">{{ item }}</option></select></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">混淆密码 (Obfs Password)</label><input v-model="outbound.hy2_obfs_password" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        </template>

                                        <template v-if="outbound.type==='tuic'">
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">UUID (UUID)</label><input v-model="outbound.uuid" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">密码 (Password)</label><input v-model="outbound.password" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">拥塞控制 (Congestion Control)</label><select v-model="outbound.tuic_congestion" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="cubic">cubic</option><option value="new_reno">new_reno</option><option value="bbr">bbr</option></select></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">UDP 中继模式 (UDP Relay Mode)</label><select v-model="outbound.tuic_udp_relay_mode" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option v-for="item in tuicUdpRelayModeOptions(outbound.tuic_udp_relay_mode)" :key="item" :value="item">{{ item }}</option></select></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">网络 (Network)</label><select v-model="outbound.network" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="">default</option><option v-for="item in genericNetworkOptions(outbound.network)" :key="item" :value="item">{{ item }}</option></select></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">心跳 (Heartbeat)</label><input v-model="outbound.tuic_heartbeat" placeholder="10s" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                            <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="outbound.tuic_udp_over_stream" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">UDP over Stream</span></label></div>
                                            <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="outbound.tuic_zero_rtt_handshake" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">Zero RTT Handshake</span></label></div>
                                        </template>

                                        <template v-if="['vless','vmess','trojan','hysteria2','tuic'].includes(outbound.type)">
                                            <div class="col-span-2 flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="outbound.tls_enabled" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">启用 TLS (Enable TLS)</span></label></div>
                                            <div v-if="outbound.tls_enabled"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">服务器名称 (Server Name)</label><input v-model="outbound.server_name" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                            <div v-if="outbound.tls_enabled"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">应用层协议 (ALPN)</label><select v-model="outbound.alpn" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="">default</option><option v-for="item in alpnOptions(outbound.type, outbound.alpn)" :key="item" :value="item">{{ item }}</option></select></div>
                                            <div v-if="outbound.tls_enabled" class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="outbound.allow_insecure" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">允许不安全证书 (Allow Insecure)</span></label></div>
                                            <div v-if="outbound.tls_enabled && ['vless','trojan'].includes(outbound.type)" class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Reality 公钥 (Reality Public Key)</label><input v-model="outbound.reality_public_key" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                            <div v-if="outbound.tls_enabled && ['vless','trojan'].includes(outbound.type) && outbound.reality_public_key"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Reality 短 ID (Reality Short ID)</label><input v-model="outbound.reality_short_id" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                            <div v-if="['vless','vmess','trojan'].includes(outbound.type)" class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">传输层 (Transport)</label><select v-model="outbound.transport" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="">tcp</option><option value="ws">ws</option><option value="grpc">grpc</option><option value="http">http</option><option value="httpupgrade">httpupgrade</option><option value="quic">quic</option></select></div>
                                            <div v-if="['ws','http','httpupgrade'].includes(outbound.transport)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">路径 (Path)</label><input v-model="outbound.transport_path" placeholder="/ws" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                            <div v-if="outbound.transport==='grpc'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">服务名 (Service Name)</label><input v-model="outbound.transport_service_name" placeholder="grpc-service" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                            <div v-if="['ws','http','httpupgrade'].includes(outbound.transport)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">主机 (Host)</label><input v-model="outbound.transport_host" placeholder="example.com" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        </template>

                                        <template v-if="outbound.type==='wireguard'">
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">本地地址 (Local Address)</label><input v-model="outbound.local_address" placeholder="10.0.0.2/32" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">对端公钥 (Peer Public Key)</label><input v-model="outbound.peer_public_key" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">预共享密钥 (Pre Shared Key)</label><input v-model="outbound.pre_shared_key" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                            <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">MTU (MTU)</label><input v-model="outbound.mtu" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                            <div class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">保活间隔 (Persistent Keepalive Interval)</label><input v-model="outbound.persistent_keepalive_interval" placeholder="25s" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        </template>
                                    </div>
                                    </template>
                                </div>
                            </div>
                        </div>

                        <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                            <div class="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-wrap gap-4 items-center" @focusin.capture="queueJsonScrollTo('rule-sets-root')" @change.capture="queueJsonScrollTo('rule-sets-root')">
                                <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="settings.rule_set_cdn" @change="syncRuleSetUrlsFromCdnPreference()" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-indigo-800">使用 jsDelivr CDN 补全 Rule Set 链接</span></label>
                                <div class="flex items-center gap-2 ml-auto">
                                    <span class="text-xs text-gray-700 font-bold">全局下载出站:</span>
                                    <select v-model="settings.rule_set_download_detour" @change="syncRuleSetDownloadDetours()" class="px-3 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs outline-none font-bold text-indigo-700 shadow-sm">
                                        <option v-for="item in outboundOptions" :key="'global-'+item" :value="item">{{ item }}</option>
                                    </select>
                                </div>
                            </div>
                            <div class="flex justify-between items-center mb-4">
                                <div>
                                    <div class="text-sm font-extrabold text-gray-800">规则集 (Rule Sets)</div>
                                    <div class="text-xs text-gray-500 mt-1">本地或远端规则集，默认使用 MetaCubeX 库。标签输入 <code>geosite-*</code> / <code>geoip-*</code> 自动补远端 URL。</div>
                                </div>
                                <div class="flex gap-2 flex-wrap">
                                    <div class="relative" data-ruleset-template-menu="media">
                                        <button @click="toggleRuleSetTemplateMenu('media')" class="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-500 font-bold transition"><i class="fas fa-plus mr-1"></i>媒体</button>
                                        <div v-if="openRuleSetTemplateMenu==='media'" class="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-20">
                                            <button @click="selectRuleSetTemplate('geosite-proxymedia')" class="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-emerald-50">海外媒体 (geosite-proxymedia)</button>
                                            <button @click="selectRuleSetTemplate('geosite-youtube')" class="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-emerald-50">YouTube (geosite-youtube)</button>
                                            <button @click="selectRuleSetTemplate('geosite-netflix')" class="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-emerald-50">Netflix (geosite-netflix)</button>
                                            <button @click="selectRuleSetTemplate('geoip-netflix')" class="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-emerald-50">Netflix IP 段 (geoip-netflix)</button>
                                            <button @click="selectRuleSetTemplate('geosite-spotify')" class="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-emerald-50">Spotify (geosite-spotify)</button>
                                            <button @click="selectRuleSetTemplate('geosite-hbo')" class="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-emerald-50">HBO (geosite-hbo)</button>
                                            <button @click="selectRuleSetTemplate('geosite-disney')" class="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-emerald-50">Disney (geosite-disney)</button>
                                            <button @click="selectRuleSetTemplate('geosite-primevideo')" class="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-emerald-50">Prime Video (geosite-primevideo)</button>
                                            <button @click="selectRuleSetTemplate('geosite-tiktok')" class="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-emerald-50">TikTok (geosite-tiktok)</button>
                                        </div>
                                    </div>
                                    <div class="relative" data-ruleset-template-menu="ai">
                                        <button @click="toggleRuleSetTemplateMenu('ai')" class="text-xs bg-fuchsia-600 text-white px-3 py-1.5 rounded-lg hover:bg-fuchsia-500 font-bold transition"><i class="fas fa-plus mr-1"></i>AI</button>
                                        <div v-if="openRuleSetTemplateMenu==='ai'" class="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-20">
                                            <button @click="selectRuleSetTemplate('geosite-category-ai-!cn')" class="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-fuchsia-50">AI 服务总类 (geosite-category-ai-!cn)</button>
                                            <button @click="selectRuleSetTemplate('geoip-ai')" class="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-fuchsia-50">AI IP 段 (geoip-ai)</button>
                                            <button @click="selectRuleSetTemplate('geosite-openai')" class="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-fuchsia-50">OpenAI (geosite-openai)</button>
                                            <button @click="selectRuleSetTemplate('geosite-google-gemini')" class="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-fuchsia-50">Google Gemini (geosite-google-gemini)</button>
                                            <button @click="selectRuleSetTemplate('geosite-bing')" class="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-fuchsia-50">微软 AI / Copilot (geosite-bing)</button>
                                            <button @click="selectRuleSetTemplate('geosite-anthropic')" class="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-fuchsia-50">Anthropic (geosite-anthropic)</button>
                                        </div>
                                    </div>
                                    <button @click="addRuleSet('remote')" class="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-500 font-bold transition"><i class="fas fa-plus mr-1"></i>远端规则集</button>
                                    <button @click="addRuleSet('local')" class="text-xs bg-slate-600 text-white px-3 py-1.5 rounded-lg hover:bg-slate-500 font-bold transition"><i class="fas fa-plus mr-1"></i>本地规则集</button>
                                </div>
                            </div>
                            <div v-if="ruleSets.length === 0" class="text-center text-sm font-bold text-gray-400 py-6 border-2 border-dashed border-gray-200 rounded-xl">暂无规则集，请点击上方按钮添加。</div>
                            <div v-else class="space-y-3">
                                <div v-for="(ruleSet, idx) in ruleSets" :key="ruleSet.id" class="bg-white border border-gray-200 rounded-xl p-4" @focusin.capture="queueJsonScrollTo('rule-set', ruleSet)" @input.capture="queueJsonScrollTo('rule-set', ruleSet)" @change.capture="queueJsonScrollTo('rule-set', ruleSet)">
                                    <div class="flex justify-between items-center mb-3">
                                        <div class="flex items-center gap-2">
                                            <span class="text-sm font-extrabold text-gray-800">{{ ruleSet.tag }}</span>
                                            <span class="badge bg-white text-indigo-700 border border-indigo-200">{{ ruleSet.source_type }}</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <button @click="toggleRuleSetCollapsed(idx)" class="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 w-7 h-7 flex justify-center items-center rounded-lg transition-colors"><i :class="ruleSet.collapsed ? 'fas fa-chevron-down text-sm' : 'fas fa-chevron-up text-sm'"></i></button>
                                            <button @click="removeRuleSet(idx)" class="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 border border-red-200 font-bold transition"><i class="fas fa-trash-alt mr-1"></i>删除</button>
                                        </div>
                                    </div>
                                    <div v-if="ruleSet.collapsed" class="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                        {{ ruleSet.tag || '未命名规则集' }} · {{ ruleSet.source_type }} · {{ ruleSet.format }}<span v-if="ruleSet.source_type==='remote' && ruleSet.url"> · {{ ruleSet.url }}</span><span v-else-if="ruleSet.source_type==='local' && ruleSet.path"> · {{ ruleSet.path }}</span>
                                    </div>
                                    <div v-else class="grid grid-cols-2 gap-3">
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">标签 (Tag)</label><input v-model="ruleSet.tag" @change="onRuleSetTagChange(ruleSet)" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-bold text-indigo-700"></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">来源类型 (Source Type)</label><select v-model="ruleSet.source_type" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="remote">remote</option><option value="local">local</option></select></div>
                                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">格式 (Format)</label><select v-model="ruleSet.format" @change="onRuleSetFormatChange(ruleSet)" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="binary">binary</option><option value="source">source</option></select></div>
                                        <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="ruleSet.enabled" class="w-4 h-4 text-indigo-600 rounded"><span class="text-xs font-bold text-gray-700">启用 (Enabled)</span></label></div>
                                        <div v-if="ruleSet.source_type==='remote'" class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">远端地址 (URL)</label><input v-model="ruleSet.url" placeholder="https://example.com/google.srs" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div v-if="ruleSet.source_type==='local'" class="col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">本地路径 (Path)</label><input v-model="ruleSet.path" placeholder="/etc/sing-box/rules/google.srs" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div v-if="ruleSet.source_type==='remote'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">更新间隔 (Update Interval)</label><input v-model="ruleSet.update_interval" placeholder="24h" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                        <div v-if="ruleSet.source_type==='remote'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">下载出站 (Download Detour)</label><select v-model="ruleSet.download_detour" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"><option value="">default</option><option v-for="item in outboundOptions" :key="item" :value="item">{{ item }}</option></select></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                            <div class="text-sm font-extrabold text-gray-800">路由规则 (Route Rules)</div>
                            <button @click="addRouteRule" class="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 font-bold shadow-md transition"><i class="fas fa-plus mr-1.5"></i>新建规则</button>
                        </div>
                        <div v-if="routeRules.length === 0" class="text-center text-sm font-bold text-gray-400 py-6 border-2 border-dashed border-gray-200 rounded-xl">暂无路由规则，请点击上方按钮添加。</div>
                        <div v-else class="space-y-3">
                            <div v-for="(rule, idx) in routeRules" :key="rule.id"
                                 :draggable="rule.draggable || false"
                                 @dragstart="onRouteRuleDragStart(idx, $event)"
                                 @dragenter.prevent="onRouteRuleDragEnter(idx)"
                                 @dragover.prevent
                                 @drop="onRouteRuleDrop(idx)"
                                 @dragend="onRouteRuleDragEnd"
                                 @focusin.capture="queueJsonScrollTo('route-rule', rule)"
                                 @input.capture="queueJsonScrollTo('route-rule', rule)"
                                 @change.capture="queueJsonScrollTo('route-rule', rule)"
                                 :class="{
                                     'opacity-40 border-dashed border-indigo-400': draggedRouteRuleIndex === idx,
                                     'shadow-[0_-3px_0_0_#4f46e5] border-indigo-300 z-10': dragOverRouteRuleIndex === idx && draggedRouteRuleIndex > idx,
                                     'shadow-[0_3px_0_0_#4f46e5] border-indigo-300 z-10': dragOverRouteRuleIndex === idx && draggedRouteRuleIndex < idx
                                 }"
                                 class="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <div class="flex justify-between items-center mb-3">
                                    <div class="flex items-center gap-3">
                                        <div class="flex items-center justify-center shrink-0 w-8 h-8 cursor-move text-gray-400 hover:text-indigo-600 bg-white border border-gray-200 rounded-lg shadow-sm transition-colors"
                                             title="按住此处拖动排顺"
                                             @mouseenter="rule.draggable = true"
                                             @mouseleave="rule.draggable = false"
                                             @mousedown="rule.draggable = true"
                                             @mouseup="rule.draggable = false">
                                            <i class="fas fa-grip-vertical"></i>
                                        </div>
                                        <div>
                                            <div class="text-sm font-extrabold text-gray-800">{{ rule.name }}</div>
                                            <div v-if="rule.collapsed" class="text-xs text-gray-500 mt-1">{{ rule.match_type }}: {{ rule.match_value || '未填写' }} · {{ rule.action==='route' ? rule.outbound : rule.action }}</div>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <button @click="toggleRouteRuleCollapsed(idx)" class="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 w-7 h-7 flex justify-center items-center rounded-lg transition-colors"><i :class="rule.collapsed ? 'fas fa-chevron-down text-sm' : 'fas fa-chevron-up text-sm'"></i></button>
                                        <button @click="removeRouteRule(idx)" class="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 border border-red-200 font-bold transition"><i class="fas fa-trash-alt mr-1"></i>删除</button>
                                    </div>
                                </div>
                                <div v-if="!rule.collapsed" class="grid grid-cols-2 gap-3">
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">名称</label><input v-model="rule.name" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-bold text-indigo-700"></div>
                                    <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="rule.enabled" class="w-4 h-4 text-indigo-600 rounded"><span class="text-sm font-bold text-gray-700">启用</span></label></div>
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">匹配类型 (Match Type)</label><select v-model="rule.match_type" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none"><option value="protocol">protocol</option><option value="port">port</option><option value="inbound">inbound</option><option value="domain_suffix">domain_suffix</option><option value="rule_set">rule_set</option></select></div>
                                    <div v-if="rule.match_type==='rule_set'" class="relative" :data-rule-value-menu="rule.id + ':rule_set'">
                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">规则集 (Rule Set)</label>
                                        <div v-if="enabledRuleSetTags.length === 0" class="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">暂无可选规则集</div>
                                        <template v-else>
                                            <button type="button" @click="toggleRuleValueMenu(rule.id + ':rule_set')" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none text-left flex items-center justify-between hover:border-indigo-300 transition-colors">
                                                <span class="truncate text-gray-700 font-semibold">{{ csvSummary(rule.match_value) || '请选择规则集' }}</span>
                                                <i :class="openRuleValueMenuKey===rule.id + ':rule_set' ? 'fas fa-chevron-up text-xs text-gray-400' : 'fas fa-chevron-down text-xs text-gray-400'"></i>
                                            </button>
                                            <div v-if="openRuleValueMenuKey===rule.id + ':rule_set'" class="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-20 max-h-56 overflow-y-auto">
                                                <div class="flex flex-wrap gap-2">
                                                    <label v-for="item in enabledRuleSetTags" :key="item" class="inline-flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-white hover:border-indigo-300 transition-colors shadow-sm">
                                                        <input type="checkbox" :checked="csvHas(rule.match_value, item)" @change="toggleCsvValue(rule, 'match_value', item, $event.target.checked)" class="w-3.5 h-3.5 text-indigo-600 rounded mr-2">
                                                        <span class="text-xs font-semibold text-gray-700">{{ item }}</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </template>
                                    </div>
                                    <div v-else-if="rule.match_type==='protocol'" class="relative" :data-rule-value-menu="rule.id + ':protocol'">
                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">协议 (Protocol)</label>
                                        <button type="button" @click="toggleRuleValueMenu(rule.id + ':protocol')" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none text-left flex items-center justify-between hover:border-indigo-300 transition-colors">
                                            <span class="truncate text-gray-700 font-semibold">{{ csvSummary(rule.match_value) || '请选择协议' }}</span>
                                            <i :class="openRuleValueMenuKey===rule.id + ':protocol' ? 'fas fa-chevron-up text-xs text-gray-400' : 'fas fa-chevron-down text-xs text-gray-400'"></i>
                                        </button>
                                        <div v-if="openRuleValueMenuKey===rule.id + ':protocol'" class="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-20 max-h-56 overflow-y-auto">
                                            <div class="flex flex-wrap gap-2">
                                                <label v-for="item in protocolOptions" :key="item" class="inline-flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-white hover:border-indigo-300 transition-colors shadow-sm">
                                                    <input type="checkbox" :checked="csvHas(rule.match_value, item)" @change="toggleCsvValue(rule, 'match_value', item, $event.target.checked)" class="w-3.5 h-3.5 text-indigo-600 rounded mr-2">
                                                    <span class="text-xs font-semibold text-gray-700">{{ item }}</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-else-if="rule.match_type==='inbound'" class="relative" :data-rule-value-menu="rule.id + ':inbound'">
                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">入站 (Inbound)</label>
                                        <div v-if="availableInboundTags.length === 0" class="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">暂无可选入站</div>
                                        <template v-else>
                                            <button type="button" @click="toggleRuleValueMenu(rule.id + ':inbound')" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none text-left flex items-center justify-between hover:border-indigo-300 transition-colors">
                                                <span class="truncate text-gray-700 font-semibold">{{ csvSummary(rule.match_value) || '请选择入站' }}</span>
                                                <i :class="openRuleValueMenuKey===rule.id + ':inbound' ? 'fas fa-chevron-up text-xs text-gray-400' : 'fas fa-chevron-down text-xs text-gray-400'"></i>
                                            </button>
                                            <div v-if="openRuleValueMenuKey===rule.id + ':inbound'" class="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-20 max-h-56 overflow-y-auto">
                                                <div class="flex flex-wrap gap-2">
                                                    <label v-for="item in availableInboundTags" :key="item" class="inline-flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-white hover:border-indigo-300 transition-colors shadow-sm">
                                                        <input type="checkbox" :checked="csvHas(rule.match_value, item)" @change="toggleCsvValue(rule, 'match_value', item, $event.target.checked)" class="w-3.5 h-3.5 text-indigo-600 rounded mr-2">
                                                        <span class="text-xs font-semibold text-gray-700">{{ item }}</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </template>
                                    </div>
                                    <div v-else><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">匹配值 (Match Value)</label><input v-model="rule.match_value" placeholder="多个用逗号或换行分隔" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none font-mono"></div>
                                    <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">动作 (Action)</label><select v-model="rule.action" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none"><option value="route">route</option><option value="reject">reject</option><option value="hijack-dns">hijack-dns</option></select></div>
                                    <div v-if="rule.action==='route'"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">出站 (Outbound)</label><select v-model="rule.outbound" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none"><option v-for="item in outboundOptions" :key="item" :value="item">{{ item }}</option></select></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
`, (ctx) => {
    const openRuleSetTemplateMenu = ref('');
    const openRuleValueMenuKey = ref('');
    const closeTemplateMenus = (event) => {
        const menuHost = event.target?.closest?.('[data-ruleset-template-menu]');
        const ruleSetMenuHost = event.target?.closest?.('[data-rule-value-menu]');
        if (!menuHost) openRuleSetTemplateMenu.value = '';
        if (!ruleSetMenuHost) openRuleValueMenuKey.value = '';
    };

    onMounted(() => {
        document.addEventListener('click', closeTemplateMenus);
    });

    onBeforeUnmount(() => {
        document.removeEventListener('click', closeTemplateMenus);
    });

    return {
    openRuleSetTemplateMenu,
    openRuleValueMenuKey,
    toggleRuleSetTemplateMenu: (menu) => {
        openRuleSetTemplateMenu.value = openRuleSetTemplateMenu.value === menu ? '' : menu;
    },
    toggleRuleValueMenu: (menuKey) => {
        openRuleValueMenuKey.value = openRuleValueMenuKey.value === menuKey ? '' : menuKey;
    },
    selectRuleSetTemplate: (tag) => {
        ctx.addRuleSetTemplate(tag);
        openRuleSetTemplateMenu.value = '';
    },
    ssMethodOptions: (current = '') => {
        const options = [
            '2022-blake3-aes-128-gcm',
            '2022-blake3-aes-256-gcm',
            '2022-blake3-chacha20-poly1305',
            'aes-128-gcm',
            'aes-256-gcm',
            'chacha20-ietf-poly1305',
            'xchacha20-ietf-poly1305',
            'none',
        ];
        return current && !options.includes(current) ? [current, ...options] : options;
    },
    ssNetworkOptions: (current = '') => {
        const options = ['tcp', 'udp'];
        return current && !options.includes(current) ? [current, ...options] : options;
    },
    vmessSecurityOptions: (current = '') => {
        const options = ['auto', 'none', 'zero', 'aes-128-gcm', 'chacha20-poly1305'];
        return current && !options.includes(current) ? [current, ...options] : options;
    },
    hy2ObfsTypeOptions: (current = '') => {
        const options = ['salamander'];
        return current && !options.includes(current) ? [current, ...options] : options;
    },
    alpnOptions: (type, current = '') => {
        const preset = ['h2,http/1.1', 'http/1.1', 'h2', 'h3', 'h3,hq', 'h3,http/1.1'];
        const udpPreferred = ['h3', 'h3,hq', 'h3,http/1.1', 'http/1.1'];
        const options = ['hysteria', 'hysteria2', 'tuic'].includes(type) ? udpPreferred : preset;
        return current && !options.includes(current) ? [current, ...options] : options;
    },
    genericNetworkOptions: (current = '') => {
        const options = ['tcp', 'udp'];
        return current && !options.includes(current) ? [current, ...options] : options;
    },
    tuicUdpRelayModeOptions: (current = '') => {
        const options = ['native', 'quic'];
        return current && !options.includes(current) ? [current, ...options] : options;
    },
    outboundOptions: createOutboundOptions(ctx),
    enabledRuleSetTags: computed(() => ctx.ruleSets.value.filter((item) => item.enabled && item.tag).map((item) => item.tag)),
    availableInboundTags: computed(() => ctx.serverInbounds.value.map((item) => item.tag).filter(Boolean)),
    protocolOptions: ['dns', 'http', 'tls', 'quic', 'stun', 'bittorrent', 'dtls', 'ssh', 'rdp', 'ntp'],
    csvValues: (value) => String(value || '').split(',').map((item) => item.trim()).filter(Boolean),
    csvHas: (value, item) => String(value || '').split(',').map((part) => part.trim()).filter(Boolean).includes(item),
    csvSummary: (value) => {
        const items = String(value || '').split(',').map((part) => part.trim()).filter(Boolean);
        if (items.length === 0) return '';
        if (items.length <= 2) return items.join(', ');
        return `${items.slice(0, 2).join(', ')} 等 ${items.length} 项`;
    },
    toggleCsvValue: (target, field, item, checked) => {
        const values = String(target[field] || '').split(',').map((part) => part.trim()).filter(Boolean);
        const next = checked ? Array.from(new Set([...values, item])) : values.filter((part) => part !== item);
        target[field] = next.join(',');
    },
    };
});

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
    components: {
        'basic-tab': BasicTab,
        'dns-tab': DnsTab,
        'inbounds-tab': InboundsTab,
        'share-tab': ShareTab,
        'route-tab': RouteTab,
    },
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
                    <share-tab></share-tab>
                </div>
            </div>
        </div>`,
};
