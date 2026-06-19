export const nodesToolbarTemplate = `                    <div class="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <span class="text-base font-extrabold text-gray-800"><i class="fas fa-server mr-2 text-indigo-500"></i>代理节点 <span class="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-black">{{ nodes.length }}</span></span>
                        <div class="flex gap-3">
                            <button @click="clearNodes" class="text-xs font-bold bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-100 transition"><i class="fas fa-trash mr-1.5"></i>清空全部</button>
                            <button @click="addNode('top')" class="text-xs font-bold bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 shadow-md transition"><i class="fas fa-plus mr-1.5"></i>新建节点</button>
                        </div>
                    </div>
`;
