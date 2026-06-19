export const nodeMultiplexFieldsTemplate = `                        <div v-if="isNodeMultiplexSupported(node)" class="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
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
`;
