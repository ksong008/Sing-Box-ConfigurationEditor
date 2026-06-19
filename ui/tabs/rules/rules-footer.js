export const rulesFooterTemplate = `                        <div class="mt-4 flex justify-end">
                            <button @click="addCustomRule('bottom')" class="text-sm bg-white border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-50 font-bold shadow-sm transition"><i class="fas fa-plus mr-1.5"></i>新建规则</button>
                        </div>
                        <div class="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 shadow-sm">
                            <span class="text-sm font-extrabold text-gray-800"><i class="fas fa-flag-checkered mr-2 text-indigo-500"></i>默认路由 (Final Outbound)</span>
                            <select v-model="settings.final_outbound" class="w-1/3 px-3 py-2 bg-white border border-indigo-300 rounded-lg text-sm outline-none font-black text-indigo-700 shadow-sm focus:ring-2 focus:ring-indigo-100">
                                <option v-for="tag in availableOutboundTags" :value="tag">{{ tag }}</option>
                            </select>
                        </div>`;
