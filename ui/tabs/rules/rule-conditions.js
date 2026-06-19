export const ruleConditionsTemplate = `                                            <div class="flex flex-col gap-1.5">
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
                                            </div>`;
