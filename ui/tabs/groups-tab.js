import { createInjectedComponent } from './create-injected-component.js';

export const GroupsTab = createInjectedComponent('GroupsTab', `                <div v-show="currentTab==='groups'" class="space-y-5">
                    <div class="sticky top-0 z-20 flex flex-wrap justify-between items-center gap-3 bg-white/95 backdrop-blur p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-base font-extrabold text-gray-800"><i class="fas fa-layer-group mr-2 text-indigo-500"></i>策略组管理</span>
                            <span v-if="duplicateOutboundTags.length>0" class="badge bg-red-100 text-red-700 border border-red-200"><i class="fas fa-exclamation-triangle mr-1"></i>Tag 重名: {{ duplicateOutboundTags.join(', ') }}</span>
                        </div>
                        <div class="flex flex-wrap gap-3">
                            <button @click="generateCountryGroups" class="text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg hover:bg-emerald-100 transition"><i class="fas fa-globe-asia mr-2"></i>自动生成地区组</button>
                            <button @click="collapseAllGroups" class="text-sm font-bold bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"><i class="fas fa-compress-alt mr-2"></i>一键折叠</button>
                            <button @click="expandAllGroups" class="text-sm font-bold bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"><i class="fas fa-expand-alt mr-2"></i>一键展开</button>
                            <button @click="addGroup" class="text-sm font-bold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 shadow-md transition"><i class="fas fa-plus mr-2"></i>新建策略组</button>
                        </div>
                    </div>
                    
                    <div v-for="(group,gIdx) in groups" :key="group.id" 
                         @focusin.capture="queueJsonScrollToTarget('group', group, $event)"
                         @input.capture="queueJsonScrollToTarget('group', group, $event)"
                         @change.capture="queueJsonScrollToTarget('group', group, $event)"
                         :data-group-card-id="group.id"
                         :draggable="group.draggable || false"
                         @dragstart="onGroupDragStart(gIdx, $event)"
                         @dragenter.prevent="onGroupDragEnter(gIdx)"
                         @dragover.prevent
                         @drop="onGroupDrop(gIdx)"
                         @dragend="onGroupDragEnd"
                         :class="{
                             'opacity-40 border-dashed border-indigo-400': draggedGroupIndex === gIdx,
                             'shadow-[0_-3px_0_0_#4f46e5] border-indigo-300 z-10': dragOverGroupIndex === gIdx && draggedGroupIndex > gIdx,
                             'shadow-[0_3px_0_0_#4f46e5] border-indigo-300 z-10': dragOverGroupIndex === gIdx && draggedGroupIndex < gIdx,
                             'ring-2 ring-indigo-200 border-indigo-300': highlightedGroupId === group.id
                         }"
                         class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative hover:border-indigo-300 transition-all">
                        
                        <div class="absolute top-4 right-4 flex items-center gap-2 z-20">
                            <button @click="toggleGroupCollapsed(gIdx)" class="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 w-7 h-7 flex justify-center items-center rounded-lg transition-colors" :title="group.collapsed ? '展开卡片' : '折叠卡片'">
                                <i :class="group.collapsed ? 'fas fa-chevron-down text-sm' : 'fas fa-chevron-up text-sm'"></i>
                            </button>
                            <button @click="removeGroup(gIdx)" class="text-red-400 hover:text-white hover:bg-red-500 w-7 h-7 flex justify-center items-center rounded-lg transition-colors"><i class="fas fa-trash-alt text-sm"></i></button>
                        </div>
                        
                        <div class="flex items-start gap-4 pr-20" :class="group.collapsed ? 'mb-1' : 'mb-4'">
                            <div class="flex items-center justify-center shrink-0 w-8 h-8 cursor-move text-gray-400 hover:text-indigo-600 bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-colors mt-6" 
                                 title="按住此处拖动排顺"
                                 @mouseenter="group.draggable = true"
                                 @mouseleave="group.draggable = false"
                                 @mousedown="group.draggable = true"
                                 @mouseup="group.draggable = false">
                                <i class="fas fa-grip-vertical"></i>
                            </div>
                            
                            <div class="flex-1 grid grid-cols-12 gap-3">
                                <div class="col-span-5"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-wider">组名称</label><input type="text" data-group-name-input="true" :value="group.tag" @change="updateGroupTag(gIdx, $event.target.value)" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-bold text-indigo-700 outline-none focus:bg-white focus:ring-1"></div>
                                <div class="col-span-3"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-wider">策略</label>
                                    <select v-model="group.type" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 outline-none focus:bg-white focus:ring-1">
                                        <option value="selector">手动选择</option><option value="urltest">自动测速</option>
                                    </select>
                                </div>
                                <div class="col-span-4"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-wider">正则过滤 (匹配节点名称)</label><input type="text" v-model="group.regex" placeholder="港|HK" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none text-emerald-600 font-mono focus:bg-white focus:ring-1"></div>
                            </div>
                        </div>
                        
                        <div class="ml-12 flex flex-wrap items-center gap-2" :class="group.collapsed ? '' : 'mb-4'">
                            <span class="badge bg-gray-100 text-gray-600 border border-gray-200">节点选择 {{ group.members.length }} 项</span>
                            <span v-if="group.type==='urltest'" class="badge bg-blue-50 text-blue-700 border border-blue-200">自动测速组</span>
                            <span v-if="group.collapsed" class="text-xs text-gray-400 font-semibold">下半部分已折叠</span>
                        </div>

                        <div v-if="!group.collapsed" class="ml-12 space-y-4">
                            <div v-if="group.type==='urltest'" class="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">URL</label><input type="text" v-model="group.url" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none font-mono"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">测速间隔</label><input type="text" v-model="group.interval" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none"></div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">容差(ms)</label><input type="number" v-model.number="group.tolerance" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none"></div>
                            </div>
                            <div class="border-t border-gray-100 pt-3">
                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-wider">节点选择</label>
                                <div class="flex flex-wrap gap-2">
                                    <label v-for="tag in getAllPossibleMembers(group.tag)" :key="'m'+tag" class="inline-flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-white hover:border-indigo-300 transition-colors shadow-sm">
                                        <input type="checkbox" :value="tag" v-model="group.members" class="w-3.5 h-3.5 text-indigo-600 rounded mr-2">
                                        <span class="text-xs font-semibold text-gray-700">{{ tag }}</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
`);
