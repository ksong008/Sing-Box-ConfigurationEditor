export const routeRulesToolbarTemplate = `                        <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                            <div>
                                <div class="stitle mb-0">路由规则 (Route Rules)</div>
                                <p class="text-xs text-gray-500 mt-1 pl-3">从上到下顺序匹配。按住左侧 <i class="fas fa-grip-vertical mx-1"></i> 图标可拖拽排序。</p>
                            </div>
                            <button @click="addCustomRule('top')" class="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 font-bold shadow-md transition"><i class="fas fa-plus mr-1.5"></i>新建规则</button>
                        </div>
                        
                        <div class="mb-5 p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex flex-wrap gap-5 items-center shadow-sm">
                            <span class="text-sm font-extrabold text-indigo-800"><i class="fas fa-cloud-download-alt mr-2"></i>默认拉取设置:</span>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" v-model="settings.rule_set_cdn" class="w-4 h-4 text-indigo-600 rounded">
                                <span class="text-xs text-gray-700 font-bold">使用 cdn.jsdelivr.net 加速下载 (国内推荐)</span>
                            </label>
                            <div class="flex items-center gap-2 ml-auto">
                                <span class="text-xs text-gray-700 font-bold">全局默认出站:</span>
                                <select v-model="settings.rule_set_detour" class="px-3 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs outline-none font-bold text-indigo-700 shadow-sm focus:ring-1">
                                    <option value="direct">direct (直连)</option>
                                    <option v-for="tag in availableOutboundTags" :value="tag">{{ tag }}</option>
                                </select>
                            </div>
                        </div>

                        <div class="mb-5 p-3 bg-blue-50/50 border border-blue-200 rounded-xl shadow-sm">
                            <p class="text-xs text-blue-800 font-extrabold mb-3 pl-1"><i class="fas fa-shield-alt mr-1.5"></i>内建防护与探测 (Action 控制):</p>
                            <div class="flex flex-wrap gap-3 items-center">
                                <label class="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors shadow-sm">
                                    <input type="checkbox" v-model="settings.private_direct" class="w-4 h-4 text-blue-600 rounded">
                                    <span class="text-xs text-blue-800 font-bold">私有IP直连 (ip_is_private)</span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors shadow-sm">
                                    <input type="checkbox" v-model="settings.hijack_dns" class="w-4 h-4 text-blue-600 rounded">
                                    <span class="text-xs text-blue-800 font-bold">拦截DNS解析 (hijack-dns)</span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors shadow-sm">
                                    <input type="checkbox" v-model="settings.sniff_enabled" class="w-4 h-4 text-blue-600 rounded">
                                    <span class="text-xs text-blue-800 font-bold">启用嗅探 (sniff)</span>
                                </label>
                                <template v-if="settings.sniff_enabled">
                                    <label class="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-blue-200 shadow-sm hover:border-blue-300">
                                        <input type="checkbox" v-model="settings.sniff_override_destination" class="w-4 h-4 text-blue-600 rounded">
                                        <span class="text-xs text-blue-800 font-bold">重写目标 (override_destination)</span>
                                    </label>
                                    <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm">
                                        <span class="text-xs text-blue-800 font-bold">嗅探超时:</span>
                                        <input type="text" v-model="settings.sniff_timeout" class="w-20 px-2 py-1 text-xs border border-blue-200 rounded-md outline-none text-center font-mono focus:ring-1 focus:border-blue-400">
                                    </div>
                                </template>
                            </div>
                        </div>

                        <details class="mb-5 group" :open="hasRouteDefaultOptions">
                            <summary class="flex items-center gap-2 cursor-pointer select-none px-4 py-3 bg-emerald-50/60 border border-emerald-200 rounded-xl shadow-sm text-sm font-extrabold text-emerald-800 hover:bg-emerald-50 transition-colors">
                                <i class="fas fa-chevron-right group-open:rotate-90 transition-transform text-[11px]"></i>
                                <i class="fas fa-network-wired mr-1"></i>Route 默认拨号策略
                                <span class="text-[10px] font-bold text-emerald-700 bg-white border border-emerald-200 px-2 py-0.5 rounded-full ml-1">高级</span>
                                <span v-if="hasRouteDefaultOptions" class="ml-auto badge bg-emerald-100 text-emerald-700 border border-emerald-200">已配置</span>
                            </summary>
                            <div class="mt-2 p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl shadow-sm space-y-3">
                                <div class="flex flex-wrap gap-4 items-center">
                                    <label class="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-emerald-200 shadow-sm">
                                        <input type="checkbox" v-model="settings.find_process" class="w-4 h-4 text-emerald-600 rounded">
                                        <span class="text-xs text-emerald-800 font-bold">启用进程匹配 (find_process)</span>
                                    </label>
                                    <div class="flex items-center gap-2 ml-auto">
                                        <span class="text-xs text-gray-700 font-bold">default_network_strategy:</span>
                                        <select v-model="settings.default_network_strategy" class="px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs outline-none font-bold text-emerald-700 shadow-sm focus:ring-1">
                                            <option value="">默认</option>
                                            <option value="default">default</option>
                                            <option value="hybrid">hybrid</option>
                                            <option value="fallback">fallback</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="grid grid-cols-3 gap-3">
                                    <div>
                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">default_network_type <span class="normal-case font-normal text-gray-300">(逗号分隔)</span></label>
                                        <input v-model="settings.default_network_type" placeholder="wifi,cellular" class="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs outline-none font-mono focus:ring-1">
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">default_fallback_network_type <span class="normal-case font-normal text-gray-300">(逗号分隔)</span></label>
                                        <input v-model="settings.default_fallback_network_type" placeholder="ethernet,other" class="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs outline-none font-mono focus:ring-1">
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">default_fallback_delay</label>
                                        <input v-model="settings.default_fallback_delay" placeholder="300ms" class="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs outline-none font-mono focus:ring-1">
                                    </div>
                                </div>
                                <p class="text-[10px] text-emerald-800">网络类型支持 <code>wifi</code>、<code>cellular</code>、<code>ethernet</code>、<code>other</code>。这些字段会作为 route 顶层默认拨号策略输出。</p>
                            </div>
                        </details>`;
