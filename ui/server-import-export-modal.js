import { useSharedContext } from './shared.js';

export const ImportExportModal = {
    name: 'ServerImportExportModal',
    setup() {
        return useSharedContext();
    },
    template: `    <div v-if="showImportExport" class="modal-overlay" @click.self="showImportExport=false">
        <div class="modal-box">
            <div class="flex justify-between items-center mb-5 shrink-0">
                <h2 class="text-xl font-bold text-gray-800"><i class="fas fa-exchange-alt mr-2 text-indigo-500"></i>服务端配置导入 / 导出</h2>
                <button @click="showImportExport=false" class="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center"><i class="fas fa-times"></i></button>
            </div>
            <div class="flex gap-3 mb-5 p-1 bg-gray-100 rounded-xl shrink-0">
                <button @click="importExportTab='export'" :class="importExportTab==='export'?'bg-white text-indigo-600 shadow-sm':'text-gray-500 hover:text-gray-700'" class="flex-1 py-2.5 rounded-lg text-sm font-bold"><i class="fas fa-file-export mr-1.5"></i>导出配置</button>
                <button @click="importExportTab='import'" :class="importExportTab==='import'?'bg-white text-indigo-600 shadow-sm':'text-gray-500 hover:text-gray-700'" class="flex-1 py-2.5 rounded-lg text-sm font-bold"><i class="fas fa-file-import mr-1.5"></i>导入配置</button>
            </div>

            <template v-if="modalContentReady">
                <div v-if="importExportTab==='export'" class="flex flex-col gap-4 flex-1 min-h-0 modal-content-ready">
                    <p class="text-sm text-gray-500 shrink-0">导出当前服务端面板配置，或直接导出可部署的 sing-box 服务端运行配置。</p>
                    <div class="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 shrink-0">
                        <p class="text-xs font-semibold" :class="supportsNativeFileSave ? 'text-emerald-700' : 'text-amber-700'">
                            <i :class="supportsNativeFileSave ? 'fas fa-hdd mr-2' : 'fas fa-download mr-2'"></i>{{ supportsNativeFileSave ? '当前浏览器支持直接写入本地文件。首次保存时选择路径，之后同名保存会先确认是否覆盖。' : '当前浏览器不支持直接写入本地文件，将自动回退为普通下载。' }}
                        </p>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
                        <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                            <label class="block text-[10px] font-black text-emerald-700 uppercase mb-2 tracking-wider">面板配置文件名</label>
                            <input v-model="panelExportFilename" placeholder="singbox-server-panel-config.json" class="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm outline-none font-mono text-emerald-700 focus:ring-1 focus:border-emerald-400">
                            <button @click="doExportDownload" class="mt-3 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-sm font-bold shadow-sm"><i :class="supportsNativeFileSave ? 'fas fa-save mr-2' : 'fas fa-download mr-2'"></i>{{ supportsNativeFileSave ? '保存面板配置到本地' : '下载面板配置' }}</button>
                        </div>
                        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <label class="block text-[10px] font-black text-blue-700 uppercase mb-2 tracking-wider">运行配置文件名</label>
                            <input v-model="runtimeExportFilename" placeholder="server-config.json" class="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm outline-none font-mono text-blue-700 focus:ring-1 focus:border-blue-400">
                            <button @click="doExportRuntimeDownload" class="mt-3 w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-bold shadow-sm"><i :class="supportsNativeFileSave ? 'fas fa-save mr-2' : 'fas fa-file-code mr-2'"></i>{{ supportsNativeFileSave ? '保存运行配置到本地' : '下载运行配置' }}</button>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
                        <button @click="doExportCopy" class="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 py-3 rounded-xl text-sm font-bold"><i class="fas fa-copy mr-2"></i>复制面板配置</button>
                        <button @click="doExportRuntimeCopy" class="bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 py-3 rounded-xl text-sm font-bold"><i class="fas fa-copy mr-2"></i>复制运行配置</button>
                    </div>
                    <textarea :value="generatedJson" readonly class="flex-1 w-full p-5 text-[13px] leading-relaxed font-mono bg-[#1e1e1e] text-green-400 border-0 rounded-xl outline-none resize-none dark-scroll shadow-inner"></textarea>
                </div>

                <div v-if="importExportTab==='import'" class="flex flex-col gap-4 modal-content-ready">
                    <div class="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                        <p class="text-sm text-blue-800 font-bold"><i class="fas fa-circle-info mr-2"></i>当前支持导入面板配置和运行配置；会优先自动识别 JSON 结构，识别不到时按下方模式处理。</p>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <button @click="settings.import_mode='panel'" :class="settings.import_mode==='panel' ? 'bg-white text-indigo-600 border-indigo-300 shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-200'" class="py-3 rounded-xl text-sm font-bold border transition"><i class="fas fa-layer-group mr-2"></i>面板配置</button>
                        <button @click="settings.import_mode='runtime'" :class="settings.import_mode==='runtime' ? 'bg-white text-indigo-600 border-indigo-300 shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-200'" class="py-3 rounded-xl text-sm font-bold border transition"><i class="fas fa-file-code mr-2"></i>运行配置</button>
                    </div>
                    <label class="cursor-pointer group">
                        <div class="bg-indigo-600 group-hover:bg-indigo-500 text-white py-4 rounded-xl text-sm font-bold text-center shadow-sm"><i class="fas fa-folder-open mr-2"></i>选择本地 JSON 文件</div>
                        <input type="file" accept=".json" @change="doImportFile" class="hidden">
                    </label>
                    <div class="flex items-center gap-3">
                        <div class="flex-1 h-px bg-gray-200"></div>
                        <span class="text-xs text-gray-400 font-bold">或粘贴 JSON 文本</span>
                        <div class="flex-1 h-px bg-gray-200"></div>
                    </div>
                    <textarea v-model="importJsonText" rows="6" :placeholder="settings.import_mode==='runtime' ? '粘贴服务端运行配置 JSON 内容...' : '粘贴服务端面板配置 JSON 内容...'" class="w-full px-4 py-3 text-xs border border-gray-300 rounded-xl outline-none font-mono bg-gray-50 focus:bg-white resize-none"></textarea>
                    <button @click="doImportText" :disabled="!importJsonText.trim()" class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white py-3 rounded-xl text-sm font-bold shadow-sm"><i class="fas fa-file-import mr-2"></i>{{ settings.import_mode==='runtime' ? '导入运行配置' : '导入面板配置' }}</button>
                    <div v-if="importError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 font-semibold">{{ importError }}</div>
                </div>
            </template>
            <div v-else class="flex-1 flex items-center justify-center">
                <i class="fas fa-circle-notch fa-spin text-2xl text-gray-300"></i>
            </div>
        </div>
    </div>`,
};
