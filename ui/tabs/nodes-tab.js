import { createInjectedComponent } from './create-injected-component.js';

export const NodesTab = createInjectedComponent('NodesTab', `                <div v-show="currentTab==='nodes'" class="space-y-5">
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
