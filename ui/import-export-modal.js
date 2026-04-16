import { useSharedContext } from './shared.js';

export const ImportExportModal = {
    name: 'ImportExportModal',
    setup() {
        return useSharedContext();
    },
    template: `    <div v-if="showImportExport" class="modal-overlay" @click.self="showImportExport=false">
        <div class="modal-box">
            <div class="flex justify-between items-center mb-5 shrink-0">
                <h2 class="text-xl font-bold text-gray-800"><i class="fas fa-exchange-alt mr-2 text-indigo-500"></i>配置导入 / 导出</h2>
                <button @click="showImportExport=false" class="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center" style="transition:background-color .2s"><i class="fas fa-times"></i></button>
            </div>
            <div class="flex gap-3 mb-5 p-1 bg-gray-100 rounded-xl shrink-0">
                <button @click="importExportTab='export'" :class="importExportTab==='export'?'bg-white text-indigo-600 shadow-sm':'text-gray-500 hover:text-gray-700'" class="flex-1 py-2.5 rounded-lg text-sm font-bold" style="transition:background-color .2s,color .2s"><i class="fas fa-file-export mr-1.5"></i>导出配置</button>
                <button @click="importExportTab='import'" :class="importExportTab==='import'?'bg-white text-indigo-600 shadow-sm':'text-gray-500 hover:text-gray-700'" class="flex-1 py-2.5 rounded-lg text-sm font-bold" style="transition:background-color .2s,color .2s"><i class="fas fa-file-import mr-1.5"></i>导入配置</button>
            </div>

            <template v-if="modalContentReady">
                <div v-if="importExportTab==='export'" class="flex flex-col gap-4 flex-1 min-h-0 modal-content-ready">
                    <p class="text-sm text-gray-500 shrink-0">将当前所有设置导出为 JSON。可选择保存为"面板配置"以便后续重新导入修改，或直接下载可供 Sing-Box 运行的标准配置。</p>
                    <div class="grid grid-cols-2 gap-3 shrink-0">
                        <button @click="doExportDownload" class="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-sm font-bold shadow-sm" style="transition:background-color .2s"><i class="fas fa-download mr-2"></i>下载面板配置文件 (备份)</button>
                        <button @click="doExportRuntimeDownload" class="bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-bold shadow-sm" style="transition:background-color .2s"><i class="fas fa-file-code mr-2"></i>下载运行配置文件 (Sing-Box)</button>
                        <button @click="doExportCopy" class="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 py-3 rounded-xl text-sm font-bold" style="transition:background-color .2s"><i class="fas fa-copy mr-2"></i>复制面板配置至剪贴板</button>
                        <button @click="doExportRuntimeCopy" class="bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 py-3 rounded-xl text-sm font-bold" style="transition:background-color .2s"><i class="fas fa-copy mr-2"></i>复制运行配置至剪贴板</button>
                    </div>
                    <div class="flex gap-1 p-1 bg-gray-100 rounded-lg shrink-0">
                        <button @click="exportPreviewTab='panel'" :class="exportPreviewTab==='panel'?'bg-white text-emerald-700 shadow-sm font-bold':'text-gray-500 hover:text-gray-700'" class="flex-1 py-1.5 rounded-md text-xs font-semibold" style="transition:background-color .2s,color .2s"><i class="fas fa-sliders-h mr-1"></i>面板配置预览</button>
                        <button @click="exportPreviewTab='runtime'" :class="exportPreviewTab==='runtime'?'bg-white text-blue-700 shadow-sm font-bold':'text-gray-500 hover:text-gray-700'" class="flex-1 py-1.5 rounded-md text-xs font-semibold" style="transition:background-color .2s,color .2s"><i class="fas fa-cog mr-1"></i>运行配置预览 (Sing-Box)</button>
                    </div>
                    <textarea :value="exportPreviewTab==='runtime' ? exportSnapshotRuntime : exportSnapshotPanel" readonly class="flex-1 w-full p-5 text-[13px] leading-relaxed font-mono bg-[#1e1e1e] text-green-400 border-0 rounded-xl outline-none resize-none dark-scroll shadow-inner"></textarea>
                </div>

                <div v-if="importExportTab==='import'" class="flex flex-col gap-4 modal-content-ready">
                    <div class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                        <p class="text-sm text-amber-800 font-bold"><i class="fas fa-exclamation-triangle mr-2"></i>注意：只能导入"面板配置文件"。导入将覆盖当前所有设置，请确保已备份。</p>
                    </div>
                    <label class="cursor-pointer group">
                        <div class="bg-indigo-600 group-hover:bg-indigo-500 text-white py-4 rounded-xl text-sm font-bold text-center shadow-sm" style="transition:background-color .2s"><i class="fas fa-folder-open mr-2"></i>选择本地 JSON 文件</div>
                        <input type="file" accept=".json" @change="doImportFile" class="hidden">
                    </label>
                    <div class="flex items-center gap-3">
                        <div class="flex-1 h-px bg-gray-200"></div>
                        <span class="text-xs text-gray-400 font-bold">或粘贴 JSON 文本</span>
                        <div class="flex-1 h-px bg-gray-200"></div>
                    </div>
                    <textarea v-model="importJsonText" rows="5" placeholder='粘贴面板配置 JSON 内容...' class="w-full px-4 py-3 text-xs border border-gray-300 rounded-xl outline-none font-mono bg-gray-50 focus:bg-white resize-none"></textarea>
                    <button @click="doImportText" :disabled="!importJsonText.trim()" class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white py-3 rounded-xl text-sm font-bold shadow-sm" style="transition:background-color .2s"><i class="fas fa-file-import mr-2"></i>从文本导入</button>
                    <div v-if="importError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 font-semibold">{{ importError }}</div>
                </div>
            </template>
            <div v-else class="flex-1 flex items-center justify-center">
                <i class="fas fa-circle-notch fa-spin text-2xl text-gray-300"></i>
            </div>
        </div>
    </div>`,
};
