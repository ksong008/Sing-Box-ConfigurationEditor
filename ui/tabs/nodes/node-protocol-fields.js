export const nodeProtocolFieldsTemplate = `                        <div v-if="node.type==='shadowsocks'" class="grid grid-cols-2 gap-3 mb-3">
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
`;
