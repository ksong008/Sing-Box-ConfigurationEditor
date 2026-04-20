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
                    <div class="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 shrink-0">
                        <p class="text-xs font-semibold" :class="supportsNativeFileSave ? 'text-emerald-700' : 'text-amber-700'">
                            <i :class="supportsNativeFileSave ? 'fas fa-hdd mr-2' : 'fas fa-download mr-2'"></i>{{ supportsNativeFileSave ? '当前浏览器支持直接写入本地文件。首次保存时选择路径，之后同名保存会先确认是否覆盖。' : '当前浏览器不支持直接写入本地文件，将自动回退为普通下载。' }}
                        </p>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
                        <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                            <label class="block text-[10px] font-black text-emerald-700 uppercase mb-2 tracking-wider">面板配置文件名</label>
                            <input v-model="panelExportFilename" placeholder="singbox-panel-config.json" class="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm outline-none font-mono text-emerald-700 focus:ring-1 focus:border-emerald-400">
                            <p class="text-[11px] text-emerald-700/80 mt-2">支持自定义重命名；未带 <code>.json</code> 时会自动补上。</p>
                            <button @click="doExportDownload" class="mt-3 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-sm font-bold shadow-sm" style="transition:background-color .2s"><i :class="supportsNativeFileSave ? 'fas fa-save mr-2' : 'fas fa-download mr-2'"></i>{{ supportsNativeFileSave ? '保存面板配置到本地' : '下载面板配置文件 (备份)' }}</button>
                        </div>
                        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <label class="block text-[10px] font-black text-blue-700 uppercase mb-2 tracking-wider">运行配置文件名</label>
                            <input v-model="runtimeExportFilename" placeholder="config.json" class="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm outline-none font-mono text-blue-700 focus:ring-1 focus:border-blue-400">
                            <p class="text-[11px] text-blue-700/80 mt-2">可改成你习惯的文件名；默认仍为 <code>config.json</code>。</p>
                            <button @click="doExportRuntimeDownload" class="mt-3 w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-bold shadow-sm" style="transition:background-color .2s"><i :class="supportsNativeFileSave ? 'fas fa-save mr-2' : 'fas fa-file-code mr-2'"></i>{{ supportsNativeFileSave ? '保存运行配置到本地' : '下载运行配置文件 (Sing-Box)' }}</button>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
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
                    <div class="flex gap-3 p-1 bg-gray-100 rounded-xl">
                        <button @click="importConfigKind='panel'" :class="importConfigKind==='panel'?'bg-white text-indigo-600 shadow-sm':'text-gray-500 hover:text-gray-700'" class="flex-1 py-2.5 rounded-lg text-sm font-bold" style="transition:background-color .2s,color .2s"><i class="fas fa-sliders-h mr-1.5"></i>面板配置</button>
                        <button @click="importConfigKind='runtime'" :class="importConfigKind==='runtime'?'bg-white text-blue-600 shadow-sm':'text-gray-500 hover:text-gray-700'" class="flex-1 py-2.5 rounded-lg text-sm font-bold" style="transition:background-color .2s,color .2s"><i class="fas fa-cog mr-1.5"></i>运行配置</button>
                    </div>
                    <div class="rounded-xl px-4 py-3" :class="importConfigKind==='panel' ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'">
                        <p v-if="importConfigKind==='panel'" class="text-sm text-amber-800 font-bold"><i class="fas fa-exclamation-triangle mr-2"></i>导入面板配置会完整覆盖当前面板状态，请确保已备份。</p>
                        <p v-else class="text-sm text-blue-800 font-bold"><i class="fas fa-circle-info mr-2"></i>导入运行配置会按 sing-box runtime JSON 尽力还原回面板状态，推荐优先导入由本编辑器导出的运行配置。</p>
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
                    <textarea v-model="importJsonText" rows="5" :placeholder="importConfigKind==='panel' ? '粘贴面板配置 JSON 内容...' : '粘贴 sing-box 运行配置 JSON 内容...'" class="w-full px-4 py-3 text-xs border border-gray-300 rounded-xl outline-none font-mono bg-gray-50 focus:bg-white resize-none"></textarea>
                    <button @click="doImportText" :disabled="!importJsonText.trim()" class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white py-3 rounded-xl text-sm font-bold shadow-sm" style="transition:background-color .2s"><i class="fas fa-file-import mr-2"></i>{{ importConfigKind==='panel' ? '导入面板配置' : '导入运行配置' }}</button>
                    <div v-if="importError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 font-semibold">{{ importError }}</div>
                </div>
            </template>
            <div v-else class="flex-1 flex items-center justify-center">
                <i class="fas fa-circle-notch fa-spin text-2xl text-gray-300"></i>
            </div>
        </div>
    </div>`,
};
