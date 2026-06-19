export const dnsFakeipTemplate = `                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
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
                    </div>`;
