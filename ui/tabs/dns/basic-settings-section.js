export const dnsBasicSettingsTemplate = `                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div class="stitle">基础设置</div>
                        <div class="grid grid-cols-2 gap-4">
                            <div @focusin.capture="queueJsonScrollToTarget('inbound', { tag: 'mixed-in' }, $event)" @input.capture="queueJsonScrollToTarget('inbound', { tag: 'mixed-in' }, $event)" @change.capture="queueJsonScrollToTarget('inbound', { tag: 'mixed-in' }, $event)"><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Mixed 代理端口</label><input type="number" v-model.number="settings.listen_port" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none"></div>
                            <div @focusin.capture="queueJsonScrollToTarget('log-root', null, $event)" @change.capture="queueJsonScrollToTarget('log-root', null, $event)"><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">日志级别</label>
                                <select v-model="settings.log_level" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none">
                                    <option value="trace">Trace</option><option value="debug">Debug</option><option value="info">Info</option><option value="warn">Warn</option><option value="error">Error</option>
                                </select>
                            </div>
                            <div @focusin.capture="queueJsonScrollToTarget('dns-root', null, $event)" @change.capture="queueJsonScrollToTarget('dns-root', null, $event)"><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">DNS 策略</label>
                                <select v-model="settings.dns_strategy" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none">
                                    <option value="ipv4_only">仅 IPv4</option><option value="ipv6_only">仅 IPv6</option><option value="prefer_ipv4">优先 IPv4</option><option value="prefer_ipv6">优先 IPv6</option>
                                </select>
                            </div>
                            <div @focusin.capture="queueJsonScrollToTarget('route-root', null, $event)" @change.capture="queueJsonScrollToTarget('route-root', null, $event)"><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">默认域名解析 <span class="text-indigo-400 normal-case font-normal">(route)</span></label>
                                <select v-model="settings.default_domain_resolver" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-semibold text-indigo-700">
                                    <option value="">不指定</option>
                                    <option v-for="tag in allDnsTags" :value="tag">{{ tag }}</option>
                                </select>
                            </div>
                            <div @focusin.capture="queueJsonScrollToTarget('dns-root', null, $event)" @change.capture="queueJsonScrollToTarget('dns-root', null, $event)"><label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">DNS 最终解析器 <span class="text-violet-400 normal-case font-normal">(dns.final)</span></label>
                                <select v-model="settings.dns_final" class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none font-semibold text-violet-700">
                                    <option value="">不指定</option>
                                    <option v-for="tag in allDnsTags" :value="tag">{{ tag }}</option>
                                </select>
                            </div>
                        </div>
                    </div>`;
