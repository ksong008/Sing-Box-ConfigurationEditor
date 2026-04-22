import { useSharedContext } from './shared.js';

export const AppHeader = {
    name: 'ServerAppHeader',
    setup() {
        return useSharedContext();
    },
    template: `    <header class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h1 class="text-3xl font-extrabold text-indigo-700 tracking-tight mb-2">
                <i class="fas fa-server mr-2"></i>Sing-Box Server Config
                <span class="text-sm bg-gradient-to-r from-indigo-500 to-sky-600 text-white px-2.5 py-0.5 rounded-md align-top shadow-sm ml-1">v1.12</span>
            </h1>
            <p class="text-sm text-gray-500 font-medium">服务端配置器 · 入站优先 · 最小 DNS / 路由 / 出站 · 面向 sing-box server 部署</p>
        </div>
        <div class="flex gap-3 flex-wrap">
            <div class="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm text-xs text-gray-500">
                <i class="fas fa-database text-gray-400"></i>
                <span v-if="lastSavedAt" class="font-medium">缓存：{{ storageSavedAgo }}</span>
                <span v-else class="text-gray-400">无本地缓存</span>
                <button v-if="lastSavedAt" @click="clearLocalStorage" class="ml-1 text-red-500 hover:text-red-700 font-bold transition" title="手动清除本地缓存"><i class="fas fa-times-circle"></i></button>
            </div>
            <button @click="resetConfig" class="bg-white border border-red-200 hover:bg-red-50 text-red-600 px-5 py-2.5 rounded-xl font-bold transition shadow-sm flex items-center gap-2 text-sm">
                <i class="fas fa-trash-restore"></i>重置配置
            </button>
            <button @click="openImportExport('import')" class="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl font-bold transition shadow-sm flex items-center gap-2 text-sm">
                <i class="fas fa-file-import text-indigo-500"></i>导入
            </button>
            <button @click="openImportExport('export')" class="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl font-bold transition shadow-sm flex items-center gap-2 text-sm">
                <i class="fas fa-file-export text-indigo-500"></i>导出
            </button>
            <button @click="copyConfig" class="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold transition shadow flex items-center gap-2">
                <i :class="copyIcon"></i>{{ copyText }}
            </button>
        </div>
    </header>`,
};
