export const nodeTransportFieldsTemplate = `                        <div v-if="isNodeTransportSectionVisible(node)" class="mb-3">
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
`;
