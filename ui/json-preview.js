import { useSharedContext } from './shared.js';

export const JsonPreview = {
    name: 'JsonPreview',
    setup() {
        return useSharedContext();
    },
    template: `        <div class="xl:col-span-5 bg-[#1e1e1e] rounded-2xl shadow-xl flex flex-col overflow-hidden border border-gray-800 max-h-full relative">
            <div class="bg-[#2d2d2d] px-6 py-4 border-b border-[#3d3d3d] flex justify-between items-center shadow-md z-10">
                <span class="text-gray-200 font-mono text-sm font-bold tracking-wide"><i class="fas fa-file-code mr-2 text-indigo-400"></i>config.json</span>
                <span class="text-emerald-400 text-xs font-mono font-bold bg-emerald-400/10 px-3 py-1 rounded-md border border-emerald-400/20 shadow-sm"><i class="fas fa-sync-alt fa-spin mr-1.5 opacity-70"></i>实时同步</span>
            </div>
            <div class="flex-1 overflow-y-auto p-6 relative dark-scroll" ref="jsonContainer">
                <div v-if="runtimeValidationErrors && runtimeValidationErrors.length > 0" class="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-200">
                    <div class="text-sm font-bold mb-2"><i class="fas fa-triangle-exclamation mr-2"></i>运行配置校验未通过</div>
                    <ul class="list-disc pl-5 space-y-1 text-xs leading-6">
                        <li v-for="(error, index) in runtimeValidationErrors" :key="index">{{ error }}</li>
                    </ul>
                </div>
                <pre class="text-[#d4d4d4] font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words">{{ generatedJson }}</pre>
            </div>
        </div>`,
};
