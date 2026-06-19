import { nodeDialFieldsTemplate } from './node-dial-fields.js';
import { nodeMultiplexFieldsTemplate } from './node-multiplex-fields.js';
import { nodeProtocolFieldsTemplate } from './node-protocol-fields.js';
import { nodeTlsFieldsTemplate } from './node-tls-fields.js';
import { nodeTransportFieldsTemplate } from './node-transport-fields.js';

export const nodeCardTemplate = `                    <div v-for="(node,idx) in nodes" :key="idx" :id="\`node-card-\${idx}\`"
                         @focusin.capture="queueJsonScrollToTarget('node', node, $event)"
                         @input.capture="queueJsonScrollToTarget('node', node, $event)"
                         @change.capture="queueJsonScrollToTarget('node', node, $event)"
                         :draggable="node.draggable || false"
                         @dragstart="onNodeDragStart(idx, $event)"
                         @dragenter.prevent="onNodeDragEnter(idx)"
                         @dragover.prevent
                         @drop="onNodeDrop(idx)"
                         @dragend="onNodeDragEnd"
                         :class="{
                             'opacity-40 border-dashed border-indigo-400': draggedNodeIndex === idx,
                             'shadow-[0_-3px_0_0_#4f46e5] border-indigo-300 z-10': dragOverNodeIndex === idx && draggedNodeIndex > idx,
                             'shadow-[0_3px_0_0_#4f46e5] border-indigo-300 z-10': dragOverNodeIndex === idx && draggedNodeIndex < idx,
                             'border-rose-300': hasNodeCapabilityIssues(node)
                         }"
                         class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative group hover:border-indigo-300 transition-all">
                        <div class="absolute top-4 right-4 flex items-center gap-2 z-10">
                            <button @click="toggleNodeCollapsed(idx)" class="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 w-7 h-7 flex justify-center items-center rounded-lg transition-colors" :title="node.collapsed ? '展开卡片' : '折叠卡片'">
                                <i :class="node.collapsed ? 'fas fa-chevron-down text-sm' : 'fas fa-chevron-up text-sm'"></i>
                            </button>
                            <button @click="removeNode(idx)" class="text-red-400 hover:text-white hover:bg-red-500 w-7 h-7 flex justify-center items-center rounded-lg transition-colors"><i class="fas fa-trash-alt text-sm"></i></button>
                        </div>
                        
                        <div class="flex items-start gap-4 pr-20" :class="node.collapsed ? 'mb-1' : 'mb-3'">
                            <div class="flex items-center justify-center shrink-0 w-8 h-8 cursor-move text-gray-400 hover:text-indigo-600 bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-colors mt-6"
                                 title="按住此处拖动排序"
                                 @mouseenter="node.draggable = true"
                                 @mouseleave="node.draggable = false"
                                 @mousedown="node.draggable = true"
                                 @mouseup="node.draggable = false">
                                <i class="fas fa-grip-vertical"></i>
                            </div>
                            <div class="flex-1">
                                <div v-if="node.collapsed" class="flex flex-wrap items-center gap-2 min-h-[42px]">
                                    <span class="text-sm font-extrabold text-gray-800">{{ node.tag || '未命名节点' }}</span>
                                    <span class="badge bg-gray-100 text-gray-600 border border-gray-200">{{ node.type }}</span>
                                    <span class="badge bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">{{ getNodeDisplayEndpoint(node) }}</span>
                                    <span v-if="hasNodeCapabilityIssues(node)" class="badge bg-rose-100 text-rose-700 border border-rose-200">{{ getNodeCapabilityMessages(node).length }} 项待修正</span>
                                </div>
                                <div v-else class="grid grid-cols-12 gap-3">
                                    <div class="col-span-5"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">节点名称</label><input type="text" v-model="node.tag" class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-bold text-indigo-700 outline-none focus:ring-1 focus:bg-white"></div>
                                    <div class="col-span-3"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">协议</label>
                                        <select v-model="node.type" @change="onNodeTypeChange(node)" class="w-full px-2 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none font-bold text-gray-700 focus:ring-1 focus:bg-white">
                                            <optgroup label="常用">
                                                <option value="vless">VLESS</option>
                                                <option value="vmess">VMess</option>
                                                <option value="trojan">Trojan</option>
                                                <option value="shadowsocks">Shadowsocks</option>
                                            </optgroup>
                                            <optgroup label="新型">
                                                <option value="hysteria2">Hysteria2</option>
                                                <option value="hysteria">Hysteria</option>
                                                <option value="tuic">TUIC v5</option>
                                                <option value="anytls">AnyTLS</option>
                                            </optgroup>
                                            <optgroup label="混淆/隐匿">
                                                <option value="shadowtls">ShadowTLS</option>
                                                <option value="naive">NaiveProxy</option>
                                            </optgroup>
                                            <optgroup label="基础">
                                                <option value="socks">SOCKS5</option>
                                                <option value="http">HTTP</option>
                                                <option value="wireguard">WireGuard</option>
                                                <option value="ssh">SSH</option>
                                            </optgroup>
                                            <optgroup label="特殊">
                                                <option value="tor">Tor</option>
                                                <option value="dns">DNS</option>
                                            </optgroup>
                                        </select>
                                    </div>
                                    <div v-if="isNodeServerEndpointVisible(node)" class="col-span-4 grid grid-cols-3 gap-2">
                                        <div class="col-span-2">
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">服务器 IP/域名</label>
                                            <input type="text" v-model="node.server" :class="isNodeCapabilityFieldInvalid(node, 'server') ? 'border-rose-300 bg-rose-50 focus:ring-rose-200' : 'border-gray-300 bg-gray-50'" class="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:bg-white font-mono">
                                            <p v-for="message in getNodeCapabilityFieldMessages(node, 'server')" :key="'server-msg-' + idx + '-' + message" class="mt-1 text-[10px] font-medium text-rose-700">{{ message }}</p>
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">端口</label>
                                            <input type="number" v-model.number="node.port" :class="isNodeCapabilityFieldInvalid(node, 'port') ? 'border-rose-300 bg-rose-50 focus:ring-rose-200' : 'border-gray-300 bg-gray-50'" class="w-full px-2 py-2 border rounded-lg text-sm outline-none text-center focus:ring-1 focus:bg-white font-mono">
                                            <p v-for="message in getNodeCapabilityFieldMessages(node, 'port')" :key="'port-msg-' + idx + '-' + message" class="mt-1 text-[10px] font-medium text-rose-700">{{ message }}</p>
                                        </div>
                                    </div>
                                    <div v-else class="col-span-4 flex items-end justify-end">
                                        <div class="text-[10px] font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">当前协议不使用 server / port</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-if="!node.collapsed" class="ml-12 flex flex-wrap items-center gap-2 mb-3">
                            <span class="badge bg-gray-100 text-gray-600 border border-gray-200">{{ node.type }}</span>
                            <span class="badge bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">{{ getNodeDisplayEndpoint(node) }}</span>
                            <span v-if="hasNodeCapabilityIssues(node)" class="badge bg-rose-100 text-rose-700 border border-rose-200">待修正 {{ getNodeCapabilityMessages(node).length }} 项</span>
                        </div>

                        <div v-if="!node.collapsed && hasNodeCapabilityIssues(node)" class="ml-12 mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
                            <div class="text-[11px] font-bold text-rose-800"><i class="fas fa-exclamation-circle mr-1.5"></i>当前节点还有以下问题</div>
                            <ul class="mt-2 space-y-1">
                                <li v-for="message in getNodeCapabilityMessages(node)" :key="'node-issue-' + idx + '-' + message" class="text-[11px] text-rose-700">• {{ message }}</li>
                            </ul>
                        </div>

                        <div v-if="!node.collapsed" class="ml-12">

                        <div v-if="isNodeSharedSecretSectionVisible(node)" class="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">{{ getNodeSharedSecretLabel(node) }}</label>
                                <input type="text" v-model="node.secret" :class="isNodeCapabilityFieldInvalid(node, 'secret') ? 'border-rose-300 bg-rose-50 focus:ring-rose-200' : 'border-gray-300 bg-white'" class="w-full px-3 py-2 border rounded-lg text-xs outline-none font-mono focus:ring-1">
                                <p v-for="message in getNodeCapabilityFieldMessages(node, 'secret')" :key="'secret-msg-' + idx + '-' + message" class="mt-1 text-[10px] font-medium text-rose-700">{{ message }}</p>
                            </div>
                            <div v-show="isNodeCredentialSniVisible(node)"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">SNI (Server Name Indication)</label><input type="text" v-model="node.sni" placeholder="example.com" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none bg-white focus:ring-1"></div>
                        </div>
${nodeProtocolFieldsTemplate}
${nodeTransportFieldsTemplate}
${nodeMultiplexFieldsTemplate}
${nodeTlsFieldsTemplate}
${nodeDialFieldsTemplate}
                        </div>
                    </div>
`;
