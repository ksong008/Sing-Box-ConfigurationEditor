export const dnsExtraInboundsTemplate = `                                        <!-- ===== EXTRA_INBOUNDS_PATCH_START ===== -->
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
                    <!-- ===== EXTRA_INBOUNDS_PATCH_END ===== -->`;
