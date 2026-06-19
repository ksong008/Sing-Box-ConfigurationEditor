export const routeOptionsFieldsTemplate = `                                                <details v-if="shouldShowRuleRouteOptions(rule)" class="group" :open="hasRuleRouteOptions(rule)">
                                                    <summary class="flex items-center gap-2 cursor-pointer select-none px-3 py-2 bg-white rounded-lg border border-emerald-200 hover:bg-emerald-50 transition-colors text-xs font-bold text-emerald-800">
                                                        <i class="fas fa-chevron-right group-open:rotate-90 transition-transform text-[10px]"></i>
                                                        高级 route-options
                                                        <span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded-full">可选</span>
                                                        <span v-if="hasRuleRouteOptions(rule)" class="ml-auto badge bg-emerald-100 text-emerald-700 border border-emerald-200">已配置</span>
                                                        <span v-else-if="hasSuggestedRouteOptions(rule)" class="ml-auto badge bg-emerald-50 text-emerald-700 border border-emerald-200">按当前规则推荐</span>
                                                    </summary>
                                                    <div class="mt-2 space-y-3">
                                                        <div class="grid grid-cols-2 gap-3">
                                                            <div v-if="shouldSuggestRouteOptionField(rule, 'option_override_address')">
                                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">覆盖地址 (Override Address)</label>
                                                                <input v-model="rule.option_override_address" placeholder="1.1.1.1" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs outline-none font-mono shadow-sm focus:ring-1">
                                                                <p class="mt-1 text-[10px] font-medium text-gray-500">命中规则后，改写目标地址。</p>
                                                            </div>
                                                            <div v-if="shouldSuggestRouteOptionField(rule, 'option_override_port')">
                                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">覆盖端口 (Override Port)</label>
                                                                <input v-model="rule.option_override_port" placeholder="443" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs outline-none font-mono shadow-sm focus:ring-1">
                                                                <p class="mt-1 text-[10px] font-medium text-gray-500">命中规则后，改写目标端口。</p>
                                                            </div>
                                                            <div v-if="shouldSuggestRouteOptionField(rule, 'option_network_strategy')">
                                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">网络策略 (Network Strategy)</label>
                                                                <select v-model="rule.option_network_strategy" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm outline-none shadow-sm focus:ring-1">
                                                                    <option value="">默认</option>
                                                                    <option value="default">default</option>
                                                                    <option value="hybrid">hybrid</option>
                                                                    <option value="fallback">fallback</option>
                                                                </select>
                                                                <p class="mt-1 text-[10px] font-medium text-amber-700">更偏图形客户端 / 移动平台；与接口绑定类字段存在适用前提。</p>
                                                            </div>
                                                            <div v-if="shouldSuggestRouteOptionField(rule, 'option_fallback_delay')">
                                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">回退延迟 (Fallback Delay)</label>
                                                                <input v-model="rule.option_fallback_delay" placeholder="300ms" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs outline-none font-mono shadow-sm focus:ring-1">
                                                                <p class="mt-1 text-[10px] font-medium text-gray-500">仅在域名策略 / 网络策略回退时有意义。</p>
                                                            </div>
                                                            <div v-if="shouldSuggestRouteOptionField(rule, 'option_network_type')">
                                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">网络类型 (Network Type)</label>
                                                                <input v-model="rule.option_network_type" placeholder="wifi,cellular" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs outline-none font-mono shadow-sm focus:ring-1">
                                                                <p class="mt-1 text-[10px] font-medium text-gray-500">例如 <code>wifi</code> / <code>cellular</code>；通常配合网络策略使用。</p>
                                                            </div>
                                                            <div v-if="shouldSuggestRouteOptionField(rule, 'option_fallback_network_type')">
                                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">回退网络类型 (Fallback Network Type)</label>
                                                                <input v-model="rule.option_fallback_network_type" placeholder="ethernet,other" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs outline-none font-mono shadow-sm focus:ring-1">
                                                                <p class="mt-1 text-[10px] font-medium text-gray-500">仅对回退策略相关。</p>
                                                            </div>
                                                            <div v-if="shouldSuggestRouteOptionField(rule, 'option_udp_timeout')">
                                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">UDP 超时 (UDP Timeout)</label>
                                                                <input v-model="rule.option_udp_timeout" placeholder="5m" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs outline-none font-mono shadow-sm focus:ring-1">
                                                                <p class="mt-1 text-[10px] font-medium text-emerald-700">更适合 UDP / DNS / QUIC 相关流量。</p>
                                                            </div>
                                                            <div v-if="shouldSuggestRouteOptionField(rule, 'option_tls_fragment_fallback_delay')">
                                                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">TLS 分片回退延迟 (TLS Fragment Fallback Delay)</label>
                                                                <input v-model="rule.option_tls_fragment_fallback_delay" placeholder="300ms" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs outline-none font-mono shadow-sm focus:ring-1">
                                                                <p class="mt-1 text-[10px] font-medium text-amber-700">更适合 TLS / 443 场景。</p>
                                                            </div>
                                                        </div>
                                                        <div class="flex flex-wrap gap-4 pt-2 border-t border-emerald-200">
                                                            <label v-if="shouldSuggestRouteOptionField(rule, 'option_udp_disable_domain_unmapping')" class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="rule.option_udp_disable_domain_unmapping" class="w-4 h-4 text-emerald-600 rounded"><span class="text-xs font-bold text-gray-700">禁用域名反解 (UDP Disable Domain Unmapping)</span></label>
                                                            <label v-if="shouldSuggestRouteOptionField(rule, 'option_udp_connect')" class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="rule.option_udp_connect" class="w-4 h-4 text-emerald-600 rounded"><span class="text-xs font-bold text-gray-700">连接式 UDP (UDP Connect)</span></label>
                                                            <label v-if="shouldSuggestRouteOptionField(rule, 'option_tls_fragment')" class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="rule.option_tls_fragment" class="w-4 h-4 text-emerald-600 rounded"><span class="text-xs font-bold text-gray-700">TLS 分片 (TLS Fragment)</span></label>
                                                            <label v-if="shouldSuggestRouteOptionField(rule, 'option_tls_record_fragment')" class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="rule.option_tls_record_fragment" class="w-4 h-4 text-emerald-600 rounded"><span class="text-xs font-bold text-gray-700">TLS Record 分片 (TLS Record Fragment)</span></label>
                                                        </div>
                                                    </div>
                                                </details>`;
