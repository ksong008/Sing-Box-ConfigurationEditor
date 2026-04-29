import { createInjectedComponent } from './create-injected-component.js';

export const AdvancedTab = createInjectedComponent('AdvancedTab', `                <div v-show="currentTab==='advanced'" class="space-y-5">

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
