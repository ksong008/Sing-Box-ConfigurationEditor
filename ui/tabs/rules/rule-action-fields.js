import { routeOptionsFieldsTemplate } from './route-options-fields.js';
export const ruleActionFieldsTemplate = `                                            <div class="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-3">
                                                <div class="grid grid-cols-3 gap-3 items-end">
                                                    <div>
                                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">规则动作</label>
                                                        <select v-model="rule.action" @change="onRuleActionChange(rule)" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm outline-none font-bold text-emerald-700 shadow-sm focus:ring-1">
                                                            <option v-for="action in ruleActions" :key="action" :value="action" :disabled="!isRuleActionSelectable(rule, action)">{{ action }}</option>
                                                        </select>
                                                    </div>
                                                    <div v-if="rule.action==='route'" class="col-span-2">
                                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">出站</label>
                                                        <select v-model="rule.outbound" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm outline-none font-bold text-indigo-700 shadow-sm focus:ring-1">
                                                            <option v-for="tag in availableOutboundTags" :value="tag">{{ tag }}</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div v-if="!isRuleActionSelectable(rule, 'hijack-dns') || !isRuleActionSelectable(rule, 'sniff') || !isRuleActionSelectable(rule, 'resolve')" class="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 space-y-1">
                                                    <div v-if="!isRuleActionSelectable(rule, 'hijack-dns')"><strong>hijack-dns</strong>：{{ getRuleActionDisabledReason(rule, 'hijack-dns') }}</div>
                                                    <div v-if="!isRuleActionSelectable(rule, 'sniff')"><strong>sniff</strong>：{{ getRuleActionDisabledReason(rule, 'sniff') }}</div>
                                                    <div v-if="!isRuleActionSelectable(rule, 'resolve')"><strong>resolve</strong>：{{ getRuleActionDisabledReason(rule, 'resolve') }}</div>
                                                </div>

                                                <div v-if="rule.action==='reject'" class="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">拒绝方式 (Reject Method)</label>
                                                        <select v-model="rule.reject_method" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm outline-none font-bold text-gray-700 shadow-sm focus:ring-1">
                                                            <option value="default">default</option>
                                                            <option value="drop">drop</option>
                                                            <option value="reply">reply</option>
                                                        </select>
                                                        <p class="mt-1 text-[10px] font-medium text-gray-500">控制拒绝时是直接丢弃还是显式回应。</p>
                                                    </div>
                                                    <div class="flex items-end pb-2">
                                                        <label class="flex items-center gap-2 cursor-pointer">
                                                            <input type="checkbox" v-model="rule.reject_no_drop" class="w-4 h-4 text-emerald-600 rounded">
                                                            <span class="text-xs font-bold text-gray-700">不丢弃连接 (No Drop)</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                <div v-if="rule.action==='sniff'" class="space-y-3">
                                                    <div>
                                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">嗅探协议 (Sniffer)</label>
                                                        <div class="flex flex-wrap gap-2 px-3 py-2 bg-white border border-emerald-300 rounded-lg shadow-sm min-h-[38px]">
                                                            <button v-for="protocol in sniffProtocols" :key="protocol"
                                                                @click="toggleCsvField(rule, 'sniff_sniffer', protocol)"
                                                                :class="rule.sniff_sniffer.split(',').map(s=>s.trim()).includes(protocol)
                                                                    ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                                                                    : 'bg-gray-50 text-gray-600 border-gray-300 hover:border-emerald-400 hover:text-emerald-600'"
                                                                class="px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all cursor-pointer select-none">
                                                                {{ protocol }}
                                                            </button>
                                                        </div>
                                                        <p class="mt-1 text-[10px] font-medium text-gray-500">选择允许尝试识别的协议类型。</p>
                                                    </div>
                                                    <div class="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">自定义嗅探协议 (Custom Sniffer)</label>
                                                            <input v-model="rule.sniff_sniffer" placeholder="多个用逗号分隔" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs outline-none font-mono shadow-sm focus:ring-1">
                                                            <p class="mt-1 text-[10px] font-medium text-gray-500">用于补充上面未列出的协议名。</p>
                                                        </div>
                                                        <div>
                                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">超时 (Timeout)</label>
                                                            <input v-model="rule.sniff_timeout" placeholder="300ms" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs outline-none font-mono shadow-sm focus:ring-1">
                                                            <p class="mt-1 text-[10px] font-medium text-gray-500">限制嗅探等待时间，避免阻塞过久。</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div v-if="rule.action==='resolve'" class="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">解析服务器 (Resolve Server)</label>
                                                        <select v-model="rule.resolve_server" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm outline-none font-bold text-violet-700 shadow-sm focus:ring-1">
                                                            <option value="">默认 DNS</option>
                                                            <option v-for="tag in allDnsTags" :value="tag">{{ tag }}</option>
                                                        </select>
                                                        <p class="mt-1 text-[10px] font-medium text-violet-700">指定命中此规则时使用哪一个 DNS server 解析。</p>
                                                    </div>
                                                    <div>
                                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">解析策略 (Resolve Strategy)</label>
                                                        <select v-model="rule.resolve_strategy" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm outline-none shadow-sm focus:ring-1">
                                                            <option value="">默认</option>
                                                            <option value="prefer_ipv4">prefer_ipv4</option>
                                                            <option value="prefer_ipv6">prefer_ipv6</option>
                                                            <option value="ipv4_only">ipv4_only</option>
                                                            <option value="ipv6_only">ipv6_only</option>
                                                        </select>
                                                        <p class="mt-1 text-[10px] font-medium text-gray-500">控制解析结果偏好 IPv4 / IPv6。</p>
                                                    </div>
                                                    <div>
                                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">重写 TTL (Rewrite TTL)</label>
                                                        <input v-model="rule.resolve_rewrite_ttl" placeholder="60" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs outline-none font-mono shadow-sm focus:ring-1">
                                                        <p class="mt-1 text-[10px] font-medium text-gray-500">强制覆盖解析结果的 TTL。</p>
                                                    </div>
                                                    <div>
                                                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">客户端子网 (Client Subnet)</label>
                                                        <input v-model="rule.resolve_client_subnet" placeholder="1.2.3.0/24" class="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs outline-none font-mono shadow-sm focus:ring-1">
                                                        <p class="mt-1 text-[10px] font-medium text-gray-500">向上游 DNS 携带客户端网段，常见于地理位置优化。</p>
                                                    </div>
                                                    <div class="col-span-2">
                                                        <label class="flex items-center gap-2 cursor-pointer">
                                                            <input type="checkbox" v-model="rule.resolve_disable_cache" class="w-4 h-4 text-emerald-600 rounded">
                                                            <span class="text-xs font-bold text-gray-700">禁用缓存 (Disable Cache)</span>
                                                        </label>
                                                    </div>
                                                </div>

${routeOptionsFieldsTemplate}

                                                <div v-if="rule.action==='hijack-dns'" class="text-[11px] text-emerald-800 bg-white border border-emerald-200 rounded-lg px-3 py-2">
                                                    命中后会执行 <code>hijack-dns</code>，适合按条件把流量交给 sing-box DNS 模块处理。
                                                </div>
                                            </div>`;
