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
                <pre class="text-[#d4d4d4] font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words">{{ generatedJson }}</pre>
            </div>
        </div>`,
};
