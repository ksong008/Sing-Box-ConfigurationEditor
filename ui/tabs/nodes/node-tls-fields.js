export const nodeTlsFieldsTemplate = `                        <div v-if="isNodeTlsSupported(node)" class="flex flex-wrap gap-4 mt-2">
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
`;
