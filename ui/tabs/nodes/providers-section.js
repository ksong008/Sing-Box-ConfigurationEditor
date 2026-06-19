export const nodesProvidersTemplate = `                    <div class="bg-indigo-50/40 p-5 rounded-xl border border-indigo-100 shadow-sm">
                        <div class="flex justify-between items-center mb-4">
                            <span class="text-base font-extrabold text-indigo-800"><i class="fas fa-link mr-2"></i>订阅源</span>
                            <button @click="addProvider" class="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-500 shadow-sm transition"><i class="fas fa-plus mr-1"></i>添加订阅</button>
                        </div>
                        <div class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div class="flex items-start justify-between gap-3">
                                <p class="text-xs text-amber-800 font-semibold"><i class="fas fa-shield-alt mr-1.5"></i>试验性功能，直接拉取可能因跨域限制失败。开启 CORS 代理后，订阅链接将经第三方服务器转发，存在<strong>链接泄露风险</strong>。建议优先手动复制订阅链接在浏览器打开后复制内容粘贴内容到上方解析框。</p>
                                <label class="flex items-center gap-2 cursor-pointer shrink-0 bg-white px-3 py-1.5 rounded-lg border border-amber-300 shadow-sm">
                                    <input type="checkbox" v-model="corsProxyEnabled" class="w-4 h-4 text-amber-600 rounded">
                                    <span class="text-xs text-amber-800 font-bold whitespace-nowrap">{{ corsProxyEnabled ? '代理已开启' : '开启代理' }}</span>
                                </label>
                            </div>
                            <p v-if="corsProxyEnabled" class="text-xs text-red-700 font-bold mt-2 bg-red-50 border border-red-200 rounded px-2 py-1"><i class="fas fa-exclamation-triangle mr-1"></i>代理已开启，订阅链接将经第三方转发，拉取完成后建议立即关闭。</p>
                        </div>
                        <div v-if="fetchStatus" class="mb-4 px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm"
                            :class="fetchStatus.type==='ok'?'bg-green-50 text-green-700 border border-green-200':fetchStatus.type==='err'?'bg-red-50 text-red-700 border border-red-200':fetchStatus.type==='warn'?'bg-amber-50 text-amber-800 border border-amber-200':'bg-blue-50 text-blue-700 border border-blue-200'">
                            <i :class="fetchStatus.type==='ok'?'fas fa-check-circle':fetchStatus.type==='err'?'fas fa-exclamation-circle':fetchStatus.type==='warn'?'fas fa-exclamation-triangle':'fas fa-spinner fa-spin'"></i>
                            <span>{{ fetchStatus.msg }}</span>
                        </div>
                        <div class="space-y-3">
                            <div v-for="(prov,idx) in providers" :key="idx" class="bg-white p-4 rounded-xl border border-indigo-100 relative group shadow-sm hover:border-indigo-300 transition-colors">
                                <button @click="removeProvider(idx)" class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-red-500 text-gray-400 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"><i class="fas fa-trash-alt text-sm"></i></button>
                                <div class="flex items-center gap-3 mb-3 pr-10">
                                    <input type="text" v-model="prov.tag" placeholder="机场名称" class="w-[25%] px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none font-bold text-indigo-700 focus:ring-1">
                                    <input type="text" v-model="prov.url" placeholder="https://... 订阅链接" class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-1">
                                </div>
                                <div class="flex items-center justify-between">
                                    <p class="text-[11px] text-gray-400 font-medium">支持 Base64 编码订阅或多行明文</p>
                                    <button @click="fetchAndParse(idx)" :disabled="isFetching" class="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-100 disabled:opacity-50 font-bold shadow-sm transition">
                                        <i :class="isFetching?'fas fa-spinner fa-spin':'fas fa-cloud-download-alt'" class="mr-1.5"></i>{{ isFetching?'拉取解析中...':'在线拉取' }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
`;
