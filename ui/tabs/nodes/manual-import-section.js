export const nodesManualImportTemplate = `                    <div class="bg-emerald-50/50 p-5 rounded-xl border border-emerald-200 shadow-sm">
                        <div class="flex items-center gap-2 mb-3">
                            <span class="text-base font-extrabold text-emerald-800"><i class="fas fa-clipboard-check mr-2"></i>手动粘贴解析</span>
                            <div class="flex flex-wrap gap-1 ml-2">
                                <span v-for="p in ['VLESS','VMess','Trojan','SS','SSR','Hy2','TUIC','SOCKS','HTTP','WireGuard']" :key="p" class="badge bg-white text-emerald-700 border border-emerald-200">{{p}}</span>
                            </div>
                        </div>
                        <p class="text-xs text-emerald-700 mb-3 font-medium">将订阅链接在浏览器打开后复制内容粘贴，支持 Base64 编码或明文协议链接（多行混合）。</p>
                        <textarea v-model="rawPastedText" rows="4" placeholder="vless://...&#10;vmess://...&#10;ss://...&#10;hysteria2://...&#10;tuic://...&#10;&#10;或 Base64 内容" class="w-full px-4 py-3 text-xs border border-emerald-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400 font-mono bg-white mb-3 resize-none shadow-inner"></textarea>
                        <div class="flex justify-end"><button @click="parseManualText" class="text-sm font-bold bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-500 shadow-md transition-colors"><i class="fas fa-magic mr-2"></i>提取节点</button></div>
                    </div>
`;
