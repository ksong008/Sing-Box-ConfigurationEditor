export const ruleSetsSectionTemplate = `                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
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
                    </div>`;
