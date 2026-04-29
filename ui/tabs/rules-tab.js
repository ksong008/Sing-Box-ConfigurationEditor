import { createInjectedComponent } from './create-injected-component.js';

export const RulesTab = createInjectedComponent('RulesTab', `                <div v-show="currentTab==='rules'" class="space-y-5">
                    
                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                            <div>
                                <div class="stitle mb-0">规则集配置 (Rule Sets)</div>
                                <p class="text-xs text-gray-500 mt-1 pl-3">在此配置远程规则集库，供下方的rule-set路由规则引用。<br>默认使用MetaCubeX库（https://github.com/MetaCubeX/meta-rules-dat/tree/sing/geo）。<br>输入 geosite/ip-xxx 后自动补全。使用第三方库，删除自动生成的链接后自行填入。</p>
                            </div>
                            <button @click="addRuleSet" class="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 font-bold shadow-md transition"><i class="fas fa-plus mr-1.5"></i>添加规则集</button>
                        </div>
                        <div class="space-y-3 max-h-[360px] overflow-y-auto pr-2" ref="ruleSetContainer">
                            <div v-for="(rs, idx) in ruleSets" :key="rs.id" @focusin.capture="queueJsonScrollToTarget('rule-set', rs, $event)" @input.capture="queueJsonScrollToTarget('rule-set', rs, $event)" @change.capture="queueJsonScrollToTarget('rule-set', rs, $event)" class="grid grid-cols-12 gap-2 items-center bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors shadow-sm">
                                <input type="text" v-model="rs.tag" placeholder="标签(如 geosite-cn)" @change="onRuleSetTagChange(rs)" class="col-span-2 px-2 py-2 text-xs font-bold border border-gray-300 rounded-lg outline-none text-indigo-700 focus:bg-white focus:ring-1">
                                <select v-model="rs.format" @change="onRuleSetFormatChange(rs)" class="col-span-2 px-2 py-2 text-xs font-bold text-gray-700 border border-gray-300 rounded-lg outline-none focus:bg-white focus:ring-1">
                                    <option value="binary">binary</option>
                                    <option value="source">source</option>
                                </select>
                                <input type="text" v-model="rs.url" placeholder="https://..." class="col-span-3 px-2 py-2 text-[11px] font-mono border border-gray-300 rounded-lg outline-none text-gray-600 focus:bg-white focus:ring-1">
                                <select v-model="rs.detour" class="col-span-2 px-2 py-2 text-xs font-bold border border-gray-300 rounded-lg outline-none focus:bg-white focus:ring-1">
                                    <option value="direct">direct</option>
                                    <option v-for="tag in availableOutboundTags" :value="tag">{{ tag }}</option>
                                </select>
                                <input type="text" v-model="rs.update_interval" placeholder="更新(1d)" class="col-span-2 px-2 py-2 text-xs font-bold border border-gray-300 rounded-lg outline-none text-gray-700 focus:bg-white focus:ring-1">
                                <button @click="removeRuleSet(idx)" class="col-span-1 mx-auto w-8 h-8 flex justify-center items-center text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-colors shadow-sm"><i class="fas fa-trash-alt text-sm"></i></button>
                            </div>
                            <div v-if="ruleSets.length === 0" class="text-center text-sm font-bold text-gray-400 py-6 border-2 border-dashed border-gray-200 rounded-xl">暂无规则集配置，请点击右上方添加。</div>
                        </div>
                    </div>

                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
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
                        </details>

                        <div class="space-y-3">
                            <div v-for="(rule,rIdx) in routeRules" :key="rule.id" 
                                 @focusin.capture="queueJsonScrollToTarget('route-rule', rule, $event)"
                                 @input.capture="queueJsonScrollToTarget('route-rule', rule, $event)"
                                 @change.capture="queueJsonScrollToTarget('route-rule', rule, $event)"
                                 :id="'route-rule-' + rule.id"
                                 :draggable="rule.draggable || false"
                                 @dragstart="onRuleDragStart(rIdx, $event)"
                                 @dragenter.prevent="onRuleDragEnter(rIdx)"
                                 @dragover.prevent
                                 @drop="onRuleDrop(rIdx)"
                                 @dragend="onRuleDragEnd"
                                 :class="{
                                     'opacity-40 border-dashed border-indigo-400': draggedRuleIndex === rIdx,
                                     'shadow-[0_-3px_0_0_#4f46e5] border-indigo-300 z-10': dragOverRuleIndex === rIdx && draggedRuleIndex > rIdx,
                                     'shadow-[0_3px_0_0_#4f46e5] border-indigo-300 z-10': dragOverRuleIndex === rIdx && draggedRuleIndex < rIdx
                                 }"
                                 class="flex flex-col bg-gray-50 p-3 rounded-xl border border-gray-200 hover:border-indigo-300 transition-all shadow-sm">
                                
                                <div class="flex items-center">
                                    <div class="flex items-center justify-center shrink-0 w-8 h-8 cursor-move text-gray-400 hover:text-indigo-600 bg-white border border-gray-200 rounded-lg shadow-sm mr-3 transition-colors" 
                                         title="按住此处拖动排顺"
                                         @mouseenter="rule.draggable = true"
                                         @mouseleave="rule.draggable = false"
                                         @mousedown="rule.draggable = true"
                                         @mouseup="rule.draggable = false">
                                        <i class="fas fa-grip-vertical"></i>
                                    </div>
                                    
                                    <div class="w-[35%] flex items-center gap-3">
                                        <input type="checkbox" v-model="rule.enabled" class="w-5 h-5 text-indigo-600 rounded shrink-0 transition-colors cursor-pointer">
                                        <input v-if="rule.isEditing" type="text" v-model="rule.name" class="px-3 py-1.5 text-sm font-extrabold border border-indigo-300 rounded-md w-full outline-none focus:ring-2 focus:ring-indigo-200 text-indigo-800">
                                        <span v-else class="text-sm font-extrabold text-gray-800 truncate w-full" :title="rule.name" :class="{'opacity-50 line-through':!rule.enabled}">{{ rule.name }}</span>
                                    </div>
                                    <div class="flex-1 flex items-center justify-end gap-3 pl-3">
                                        <i class="fas fa-arrow-right text-gray-300 text-sm"></i>
                                        <template v-if="!rule.isEditing">
                                            <select v-model="rule.action" @change="onRuleActionChange(rule)" :disabled="!rule.enabled" class="w-[150px] px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none font-black text-indigo-700 disabled:opacity-50 shadow-sm focus:ring-1 focus:border-indigo-400">
                                                <option v-for="action in ruleActions" :key="action" :value="action" :disabled="!isRuleActionSelectable(rule, action)">{{ action }}</option>
                                            </select>
                                            <select v-if="rule.action==='route'" v-model="rule.outbound" :disabled="!rule.enabled" class="w-[140px] px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none font-black text-indigo-700 disabled:opacity-50 shadow-sm focus:ring-1 focus:border-indigo-400">
                                                <option v-for="tag in availableOutboundTags" :value="tag">{{ tag }}</option>
                                            </select>
                                        </template>
                                        <template v-else>
                                            <span class="text-[10px] font-black text-emerald-700 border border-emerald-200 bg-emerald-50 px-2 py-1 rounded shadow-sm">{{ rule.action }}</span>
                                            <span v-if="rule.action==='route'" class="text-[10px] font-black text-indigo-700 border border-indigo-200 bg-indigo-50 px-2 py-1 rounded shadow-sm">{{ rule.outbound }}</span>
                                        </template>
                                        <button @click="removeRule(rIdx)" class="w-9 h-9 flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500 rounded-lg bg-white border border-red-200 transition-colors shadow-sm"><i class="fas fa-trash-alt text-sm"></i></button>
                                    </div>
                                </div>
                                
                                <div v-if="rule.enabled" class="mt-4 pl-[2.75rem] flex items-start gap-3">
                                    <template v-if="rule.isEditing">
                                        <div class="flex-1 flex flex-col gap-3">
                                            <div class="flex flex-col gap-1.5">
                                                <div class="flex items-center gap-4 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100" :class="{'opacity-60 grayscale': rule.conditions.length < 2}">
                                                    <span class="text-xs font-bold text-indigo-800"><i class="fas fa-code-branch mr-1.5"></i>规则逻辑:</span>
                                                    <label class="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-gray-700 hover:text-indigo-600 transition-colors">
                                                        <input type="radio" v-model="rule.mode" value="and" :disabled="rule.conditions.length < 2" class="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                                        全部满足 (AND)
                                                    </label>
                                                    <label class="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-gray-700 hover:text-indigo-600 transition-colors">
                                                        <input type="radio" v-model="rule.mode" value="or" :disabled="rule.conditions.length < 2" class="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                                        满足任一 (OR)
                                                    </label>
                                                    <div class="w-px h-3.5 bg-gray-300 mx-1"></div>
                                                    <label class="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-gray-700 hover:text-red-500 transition-colors">
                                                        <input type="checkbox" v-model="rule.invert" class="w-3.5 h-3.5 rounded text-red-500 focus:ring-red-500">
                                                        <span :class="rule.invert ? 'text-red-600 font-bold' : ''">取反 (NOT)</span>
                                                    </label>
                                                </div>
                                                <div v-if="rule.conditions.length < 2" class="text-[10px] text-gray-400 font-medium pl-1">
                                                    * 提示：当前仅 1 行条件（框内逗号分隔天然为"或"关系，性能更优）。需点击下方"添加条件"增加到 2 行以上方可组合。
                                                </div>
                                            </div>
                                    
                                            <div class="space-y-2">
                                                <div v-for="(cond, cIdx) in rule.conditions" :key="cIdx" class="flex flex-col gap-1.5 p-2 bg-white border border-gray-200 rounded-lg shadow-sm relative pr-10">
                                                    <button @click="rule.conditions.splice(cIdx, 1)" class="absolute top-2 right-2 w-7 h-7 flex items-center justify-center text-red-400 hover:text-white hover:bg-red-500 rounded-md transition-colors"><i class="fas fa-times text-xs"></i></button>
                                                    <div class="flex items-center gap-2">
                                                        <select v-model="cond.type" class="px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-md outline-none bg-gray-50 text-gray-700 shadow-sm w-[130px]">
                                                            <optgroup label="域名与规则集">
                                                                <option value="rule_set">rule_set</option>
                                                                <option value="domain_suffix">domain_suffix</option>
                                                                <option value="domain_keyword">domain_keyword</option>
                                                                <option value="domain">domain</option>
                                                                <option value="domain_regex">domain_regex</option>
                                                                <option value="auth_user">auth_user</option>
                                                                <option value="client">client</option>
                                                            </optgroup>
                                                            <optgroup label="IP 与网络">
                                                                <option value="ip_version">ip_version</option>
                                                                <option value="network">network (tcp/udp)</option>
                                                                <option value="network_type">network_type</option>
                                                                <option value="port">port</option>
                                                                <option value="source_port">source_port</option>
                                                                <option value="port_range">port_range</option>
                                                                <option value="source_port_range">source_port_range</option>
                                                                <option value="ip_cidr">ip_cidr</option>
                                                                <option value="source_ip_cidr">source_ip_cidr</option>
                                                                <option value="source_geoip">source_geoip</option>
                                                            </optgroup>
                                                            <optgroup label="协议与应用">
                                                                <option value="protocol">protocol</option>
                                                                <option value="process_name">process_name</option>
                                                                <option value="process_path">process_path</option>
                                                                <option value="package_name">package_name</option>
                                                                <option value="user">user</option>
                                                                <option value="user_id">user_id</option>
                                                                <option value="geoip">geoip (旧版)</option>
                                                                <option value="inbound">inbound</option>
                                                            </optgroup>
                                                        </select>
                                        
                                                        <div v-if="cond.type === 'network'" class="flex-1 flex items-center gap-5 px-3 py-1.5 bg-white border border-indigo-300 rounded-md shadow-sm min-h-[34px]">
                                                            <label class="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700 hover:text-indigo-600 transition-colors">
                                                                <input type="checkbox" :checked="cond.value.split(',').map(s=>s.trim()).includes('tcp')" @change="toggleRuleSetCond(cond, 'tcp')" class="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500">
                                                                TCP
                                                            </label>
                                                            <label class="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700 hover:text-indigo-600 transition-colors">
                                                                <input type="checkbox" :checked="cond.value.split(',').map(s=>s.trim()).includes('udp')" @change="toggleRuleSetCond(cond, 'udp')" class="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500">
                                                                UDP
                                                            </label>
                                                        </div>
                                                        <div v-else-if="cond.type === 'network_type'" class="flex-1 flex items-center gap-5 px-3 py-1.5 bg-white border border-indigo-300 rounded-md shadow-sm min-h-[34px]">
                                                            <label class="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700 hover:text-indigo-600 transition-colors">
                                                                <input type="checkbox" :checked="cond.value.split(',').map(s=>s.trim()).includes('wifi')" @change="toggleRuleSetCond(cond, 'wifi')" class="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500">
                                                                Wi-Fi
                                                            </label>
                                                            <label class="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700 hover:text-indigo-600 transition-colors">
                                                                <input type="checkbox" :checked="cond.value.split(',').map(s=>s.trim()).includes('cellular')" @change="toggleRuleSetCond(cond, 'cellular')" class="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500">
                                                                Cellular
                                                            </label>
                                                            <label class="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700 hover:text-indigo-600 transition-colors">
                                                                <input type="checkbox" :checked="cond.value.split(',').map(s=>s.trim()).includes('ethernet')" @change="toggleRuleSetCond(cond, 'ethernet')" class="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500">
                                                                Ethernet
                                                            </label>
                                                            <label class="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700 hover:text-indigo-600 transition-colors">
                                                                <input type="checkbox" :checked="cond.value.split(',').map(s=>s.trim()).includes('other')" @change="toggleRuleSetCond(cond, 'other')" class="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500">
                                                                Other
                                                            </label>
                                                        </div>
                                                        <select v-else-if="cond.type === 'ip_version'" v-model="cond.value" class="flex-1 px-3 py-1.5 bg-white border border-indigo-300 rounded-md text-xs font-mono outline-none focus:ring-1 focus:ring-indigo-300 shadow-sm text-gray-700">
                                                            <option value="">选择 IP 版本</option>
                                                            <option value="4">IPv4</option>
                                                            <option value="6">IPv6</option>
                                                        </select>
                                                        <div v-else-if="cond.type === 'protocol'" class="flex-1 space-y-2">
                                                            <div class="flex flex-wrap gap-2 px-3 py-2 bg-white border border-indigo-300 rounded-md shadow-sm min-h-[34px]">
                                                                <button v-for="protocol in sniffProtocols" :key="protocol"
                                                                    @click="toggleRuleSetCond(cond, protocol)"
                                                                    :class="cond.value.split(',').map(s=>s.trim()).includes(protocol)
                                                                        ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                                                                        : 'bg-gray-50 text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'"
                                                                    class="px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all cursor-pointer select-none">
                                                                    {{ protocol }}
                                                                </button>
                                                            </div>
                                                            <input type="text" v-model="cond.value" placeholder="可继续手动补充，多个用逗号分隔" class="w-full px-3 py-1.5 bg-white border border-indigo-300 rounded-md text-xs font-mono outline-none focus:ring-1 focus:ring-indigo-300 shadow-sm text-gray-700">
                                                        </div>
                                                        <div v-else-if="cond.type === 'inbound'" class="flex-1 space-y-2">
                                                            <div class="flex flex-wrap gap-2 px-3 py-2 bg-white border border-indigo-300 rounded-md shadow-sm min-h-[34px]">
                                                                <button v-for="tag in availableInboundTags" :key="tag"
                                                                    @click="toggleRuleSetCond(cond, tag)"
                                                                    :class="cond.value.split(',').map(s=>s.trim()).includes(tag)
                                                                        ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                                                                        : 'bg-gray-50 text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'"
                                                                    class="px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all cursor-pointer select-none">
                                                                    {{ tag }}
                                                                </button>
                                                            </div>
                                                            <input type="text" v-model="cond.value" placeholder="可继续手动补充入站 tag，多个用逗号分隔" class="w-full px-3 py-1.5 bg-white border border-indigo-300 rounded-md text-xs font-mono outline-none focus:ring-1 focus:ring-indigo-300 shadow-sm text-gray-700">
                                                        </div>
                                                        <input v-else type="text" v-model="cond.value" :placeholder="cond.type==='source_port' ? '源端口，多个用逗号分隔' : cond.type==='source_port_range' ? '源端口范围，如 1000:2000' : cond.type==='source_geoip' ? '如 cn,private' : cond.type==='process_path' ? '/usr/bin/curl,/usr/bin/wget' : cond.type==='package_name' ? 'com.example.app' : cond.type==='user' ? 'nobody,root' : cond.type==='user_id' ? '0,1000' : cond.type==='client' ? 'clash,stash' : cond.type==='auth_user' ? 'user-a,user-b' : '值 (多个用逗号分隔)'" class="flex-1 px-3 py-1.5 bg-white border border-indigo-300 rounded-md text-xs font-mono outline-none focus:ring-1 focus:ring-indigo-300 shadow-sm text-gray-700">
                                                    </div>
                                                    
                                                    <div v-if="cond.type === 'rule_set'" class="flex flex-wrap gap-1.5 mt-1">
                                                        <button v-for="rs in ruleSets" :key="rs.id"
                                                            @click="toggleRuleSetCond(cond, rs.tag)"
                                                            :class="cond.value.split(',').map(s=>s.trim()).includes(rs.tag)
                                                                ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                                                                : 'bg-gray-50 text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'"
                                                            class="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all cursor-pointer select-none">
                                                            <i :class="cond.value.split(',').map(s=>s.trim()).includes(rs.tag) ? 'fas fa-check-circle' : 'far fa-circle'"></i>
                                                            {{ rs.tag }}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-3">
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

                                                <details v-if="shouldShowRuleRouteOptions(rule)" class="group" :open="hasRuleRouteOptions(rule)">
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
                                                </details>

                                                <div v-if="rule.action==='hijack-dns'" class="text-[11px] text-emerald-800 bg-white border border-emerald-200 rounded-lg px-3 py-2">
                                                    命中后会执行 <code>hijack-dns</code>，适合按条件把流量交给 sing-box DNS 模块处理。
                                                </div>
                                            </div>
                                    
                                            <div class="flex items-center mt-1">
                                                <button @click="rule.conditions.push({type: 'domain_suffix', value: ''})" class="text-xs font-bold bg-white text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 shadow-sm transition-colors">
                                                    <i class="fas fa-plus mr-1"></i>添加条件
                                                </button>
                                                <button @click="rule.isEditing=false" class="text-xs font-bold bg-emerald-500 text-white px-5 py-1.5 rounded-lg hover:bg-emerald-600 shadow-sm transition-colors ml-auto">
                                                    <i class="fas fa-check mr-1.5"></i>完成编辑
                                                </button>
                                            </div>
                                        </div>
                                    </template>
                                    <template v-else>
                                        <div class="flex-1 flex flex-wrap gap-2 items-center px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-inner min-h-[36px]">
                                            <span v-if="rule.invert" class="text-[10px] font-black text-red-500 border border-red-200 bg-red-50 px-1.5 py-0.5 rounded shadow-sm">NOT</span>
                                            <span v-if="rule.mode === 'or' && rule.conditions.length > 1" class="text-[10px] font-black text-amber-600 border border-amber-200 bg-amber-50 px-1.5 py-0.5 rounded shadow-sm">OR</span>
                                            <span v-if="rule.mode === 'and' && rule.conditions.length > 1" class="text-[10px] font-black text-blue-600 border border-blue-200 bg-blue-50 px-1.5 py-0.5 rounded shadow-sm">AND</span>
                                            <span class="text-[10px] font-black text-emerald-700 border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 rounded shadow-sm">{{ rule.action }}</span>
                                            <span v-if="rule.action==='route'" class="text-[10px] font-black text-indigo-700 border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 rounded shadow-sm">-> {{ rule.outbound }}</span>
                                            
                                            <template v-for="(cond, cIdx) in rule.conditions" :key="cIdx">
                                                <span v-if="cIdx > 0" class="text-[10px] font-bold text-gray-400">{{ rule.mode === 'or' ? '或' : '且' }}</span>
                                                <div class="flex items-center text-xs font-mono text-gray-600 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 max-w-[200px] shadow-sm">
                                                    <span class="font-bold text-gray-500 mr-1.5">{{ cond.type }}:</span>
                                                    <span class="truncate" :title="cond.value">{{ cond.value || '...' }}</span>
                                                </div>
                                            </template>
                                            <span v-if="!rule.conditions.length" class="text-xs text-gray-400 italic">（未配置任何条件）</span>
                                        </div>
                                        <button @click="rule.isEditing=true" class="text-sm font-bold bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 shrink-0 shadow-sm transition-colors"><i class="fas fa-edit"></i></button>
                                    </template>
                                </div>
                            </div>
                        </div>
                        <div class="mt-4 flex justify-end">
                            <button @click="addCustomRule('bottom')" class="text-sm bg-white border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-50 font-bold shadow-sm transition"><i class="fas fa-plus mr-1.5"></i>新建规则</button>
                        </div>
                        <div class="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 shadow-sm">
                            <span class="text-sm font-extrabold text-gray-800"><i class="fas fa-flag-checkered mr-2 text-indigo-500"></i>默认路由 (Final Outbound)</span>
                            <select v-model="settings.final_outbound" class="w-1/3 px-3 py-2 bg-white border border-indigo-300 rounded-lg text-sm outline-none font-black text-indigo-700 shadow-sm focus:ring-2 focus:ring-indigo-100">
                                <option v-for="tag in availableOutboundTags" :value="tag">{{ tag }}</option>
                            </select>
                        </div>
                    </div>
                </div>
`);
