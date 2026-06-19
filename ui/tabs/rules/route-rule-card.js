import { ruleActionFieldsTemplate } from './rule-action-fields.js';
import { ruleConditionsTemplate } from './rule-conditions.js';
export const routeRuleCardTemplate = `                        <div class="space-y-3">
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
${ruleConditionsTemplate}

${ruleActionFieldsTemplate}

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
                        </div>`;
