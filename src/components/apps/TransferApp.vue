<template>
    <div class="transition-all duration-300">
        <!-- Transfer Step 0: Setup -->
        <transition name="slide-up">
            <div v-if="transferStep === 0" class="flex flex-col items-center pt-6 pb-20">
                <div class="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 w-full max-w-md">
                    <h2 class="text-xl font-bold text-slate-700 mb-8 text-center">移動記録を開始</h2>
                    
                    <!-- Select Month -->
                    <div class="mb-6">
                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">対象月</label>
                        <div class="grid grid-cols-2 gap-3">
                            <select v-model="transferYear"
                                :class="transferYear ? 'text-slate-800' : 'text-slate-500'"
                                class="appearance-none w-full bg-slate-50 border border-slate-200 text-lg font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 block p-4 text-center">
                                <option value="" disabled>年を選択</option>
                                <option v-for="y in years" :value="y.value" :key="y.value" class="text-slate-800">{{ y.label }}</option>
                            </select>
                            <select v-model="transferMonthPart"
                                :class="transferMonthPart ? 'text-slate-800' : 'text-slate-500'"
                                class="appearance-none w-full bg-slate-50 border border-slate-200 text-lg font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 block p-4 text-center">
                                <option value="" disabled>月を選択</option>
                                <option v-for="m in months" :value="m.value" :key="m.value" class="text-slate-800">{{ m.label }}</option>
                            </select>
                        </div>
                        <p class="text-xs text-slate-500 mt-2">
                            その月の棚卸しが全拠点完了し、まだ月をまたいでいない場合、来月を選んでください。<br>
                            例）３月の棚卸しが全拠点完了し、3/30に移動する場合、4月を選択。
                        </p>
                    </div>

                    <!-- Select SubMode -->
                    <div class="mb-6">
                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">実施タスク</label>
                        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <button @click="transferSubMode = 'issue'"
                                :class="transferSubMode === 'issue' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/30' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600'"
                                class="py-4 rounded-2xl font-bold border-2 transition-all active:scale-95 text-center">
                                <div class="text-xl mb-1">📋</div>
                                起票
                            </button>
                            <button @click="transferSubMode = 'inspect'"
                                :class="transferSubMode === 'inspect' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/30' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600'"
                                class="py-4 rounded-2xl font-bold border-2 transition-all active:scale-95 text-center">
                                <div class="text-xl mb-1">✅</div>
                                検品
                            </button>
                            <button @click="transferSubMode = 'arrival'"
                                :class="transferSubMode === 'arrival' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/30' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600'"
                                class="py-4 rounded-2xl font-bold border-2 transition-all active:scale-95 text-center">
                                <div class="text-xl mb-1">📦</div>
                                入荷
                            </button>
                            <button @click="transferSubMode = 'dispose'"
                                :class="transferSubMode === 'dispose' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/30' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600'"
                                class="py-4 rounded-2xl font-bold border-2 transition-all active:scale-95 text-center">
                                <div class="text-xl mb-1">🗑️</div>
                                廃棄
                            </button>
                            <button @click="transferSubMode = 'amend'"
                                :class="transferSubMode === 'amend' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/30' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600'"
                                class="py-4 rounded-2xl font-bold border-2 transition-all active:scale-95 text-center">
                                <div class="text-xl mb-1">✏️</div>
                                修正
                            </button>
                        </div>
                    </div>

                    <!-- Issue Setup -->
                    <transition name="slide-up">
                        <div v-if="transferSubMode === 'issue'" class="border-t border-slate-100 pt-6 space-y-4">
                            <h3 class="text-sm font-bold text-slate-600 mb-3">起票の詳細</h3>
                            <div>
                                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">移動元店舗（あなたの店舗）</label>
                                <select v-model="issueFromStore" :class="issueFromStore ? 'text-slate-800' : 'text-slate-500'" class="appearance-none w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 block p-4 text-center">
                                    <option value="" disabled>選択してください</option>
                                    <option v-for="s in stores" :value="s.key" :key="s.key" class="text-slate-800">{{ s.name }}</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">移動先店舗</label>
                                <select v-model="issueDestStore" :class="issueDestStore ? 'text-slate-800' : 'text-slate-500'" class="appearance-none w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 block p-4 text-center" :disabled="!issueFromStore">
                                    <option value="" disabled>選択してください</option>
                                    <option v-for="s in stores.filter(s => s.key !== issueFromStore)" :value="s.key" :key="s.key" class="text-slate-800">{{ s.name }}</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">実施日</label>
                                <input type="date" v-model="issueDate" :class="issueDate ? 'text-slate-800' : 'text-slate-500'" class="w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 block p-4 text-center">
                            </div>
                            <button @click="startIssue" :disabled="!transferMonth || !issueFromStore || !issueDestStore || !issueDate" class="mt-4 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-4 rounded-full shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50">
                                移動記録を開始する
                            </button>
                        </div>
                    </transition>

                    <!-- Arrival Setup -->
                    <transition name="slide-up">
                        <div v-if="transferSubMode === 'arrival'" class="border-t border-slate-100 pt-6 space-y-4">
                            <h3 class="text-sm font-bold text-slate-600 mb-3">入荷の詳細</h3>
                            <div>
                                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">実施店舗（あなたの店舗）</label>
                                <select v-model="issueFromStore" :class="issueFromStore ? 'text-slate-800' : 'text-slate-500'" class="appearance-none w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 block p-4 text-center">
                                    <option value="" disabled>選択してください</option>
                                    <option v-for="s in stores" :value="s.key" :key="s.key" class="text-slate-800">{{ s.name }}</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">実施日</label>
                                <input type="date" v-model="issueDate" :class="issueDate ? 'text-slate-800' : 'text-slate-500'" class="w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 block p-4 text-center">
                            </div>
                            <div class="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                                <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wide">新規銘柄を追加</p>
                                <select v-model="arrivalSelectedBrand"
                                    class="w-full bg-white border border-slate-200 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
                                    <option value="" disabled>ブランド名を選択</option>
                                    <option v-for="brand in arrivalBrandOptions" :key="'brand-'+brand" :value="brand">{{ brand }}</option>
                                    <option value="__other__">その他</option>
                                </select>
                                <input v-if="arrivalSelectedBrand === '__other__'" v-model.trim="arrivalNewBrandShortName" type="text" maxlength="40" placeholder="ブランド略称（大文字アルファベット）"
                                    class="w-full bg-white border border-slate-200 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
                                <input v-if="arrivalSelectedBrand === '__other__'" v-model.trim="arrivalNewBrandFormalName" type="text" maxlength="80" placeholder="ブランド正式名称（例: Al Fakher）"
                                    class="w-full bg-white border border-slate-200 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
                                <p v-if="arrivalBrandValidationMessage" class="text-xs text-rose-600 font-medium">{{ arrivalBrandValidationMessage }}</p>
                                <input v-model.trim="arrivalNewFlavorName" type="text" maxlength="120" placeholder="フレーバー名を入力"
                                    class="w-full bg-white border border-slate-200 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
                                <p v-if="arrivalFlavorValidationMessage" class="text-xs text-rose-600 font-medium">{{ arrivalFlavorValidationMessage }}</p>
                                <button @click="addArrivalFlavor" :disabled="arrivalAddDisabled"
                                    class="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50">
                                    {{ arrivalAddingFlavor ? '追加中...' : 'この銘柄を追加' }}
                                </button>
                            </div>
                            <button @click="startIssue" :disabled="!transferMonth || !issueFromStore || !issueDate" class="mt-4 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-4 rounded-full shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50">
                                入荷記録を開始する
                            </button>
                        </div>
                    </transition>

                    <!-- Dispose Setup -->
                    <transition name="slide-up">
                        <div v-if="transferSubMode === 'dispose'" class="border-t border-slate-100 pt-6 space-y-4">
                            <h3 class="text-sm font-bold text-slate-600 mb-3">廃棄の詳細</h3>
                            <div>
                                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">実施店舗（あなたの店舗）</label>
                                <select v-model="issueFromStore" :class="issueFromStore ? 'text-slate-800' : 'text-slate-500'" class="appearance-none w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 block p-4 text-center">
                                    <option value="" disabled>選択してください</option>
                                    <option v-for="s in stores" :value="s.key" :key="s.key" class="text-slate-800">{{ s.name }}</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">実施日</label>
                                <input type="date" v-model="issueDate" :class="issueDate ? 'text-slate-800' : 'text-slate-500'" class="w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 block p-4 text-center">
                            </div>
                            <button @click="startIssue" :disabled="!transferMonth || !issueFromStore || !issueDate" class="mt-4 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-4 rounded-full shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50">
                                廃棄記録を開始する
                            </button>
                        </div>
                    </transition>

                    <!-- Inspect Setup -->
                    <transition name="slide-up">
                        <div v-if="transferSubMode === 'inspect'" class="border-t border-slate-100 pt-6 space-y-4">
                            <h3 class="text-sm font-bold text-slate-600 mb-3">検品の詳細</h3>
                            <div>
                                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">移動先店舗（あなたの店舗）</label>
                                <select v-model="inspectDestStore" @change="loadPendingRecords" :class="inspectDestStore ? 'text-slate-800' : 'text-slate-500'" class="appearance-none w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 block p-4 text-center" :disabled="!transferMonth">
                                    <option value="" disabled>選択してください</option>
                                    <option v-for="s in stores" :value="s.key" :key="s.key" class="text-slate-800">{{ s.name }}</option>
                                </select>
                            </div>
                            
                            <!-- Pending List -->
                            <div v-if="inspectDestStore">
                                <div v-if="inspectPendingList.length === 0" class="text-center py-6 text-slate-400 text-sm font-medium">
                                    未検品の移動記録はありません
                                </div>
                                <div v-else class="space-y-2">
                                    <label v-for="rec in inspectPendingList" :key="rec.blockIndex" class="flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all" :class="inspectSelectedBlock === rec.blockIndex ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white hover:border-emerald-200'">
                                        <input type="radio" v-model="inspectSelectedBlock" :value="rec.blockIndex" class="sr-only">
                                        <div class="flex-1">
                                            <div class="font-bold text-slate-800">{{ transferStoreName(rec.fromStoreKey) }} → {{ transferStoreName(inspectDestStore) }}</div>
                                            <div class="text-xs text-slate-400 mt-0.5">{{ rec.date }}</div>
                                        </div>
                                        <div :class="inspectSelectedBlock === rec.blockIndex ? 'bg-emerald-500' : 'bg-slate-200'" class="w-5 h-5 rounded-full flex items-center justify-center transition-colors">
                                            <svg v-if="inspectSelectedBlock === rec.blockIndex" class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 111.414-1.414L8.414 12.586l7.879-7.879a1 1 0 011.414 0z" clip-rule="evenodd" />
                                            </svg>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <button @click="startInspect" :disabled="inspectSelectedBlock === null" class="mt-4 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-4 rounded-full shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50">
                                検品を開始する
                            </button>
                        </div>
                    </transition>

                    <!-- Amend Setup -->
                    <transition name="slide-up">
                        <div v-if="transferSubMode === 'amend'" class="border-t border-slate-100 pt-6 space-y-4">
                            <h3 class="text-sm font-bold text-slate-600 mb-3">修正の詳細</h3>
                            <div>
                                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">修正したい記録</label>
                                <div v-if="!transferMonth" class="text-center py-6 text-slate-400 text-sm font-medium">
                                    対象月を選択してください
                                </div>
                                <div v-else-if="allRecordsLoading" class="text-center py-6 text-slate-400 text-sm font-medium">
                                    移動記録を読み込み中...
                                </div>
                                <div v-else-if="allTransferRecords.length === 0" class="text-center py-6 text-slate-400 text-sm font-medium">
                                    この月の移動記録はありません
                                </div>
                                <div v-else class="space-y-2 max-h-72 overflow-auto pr-1">
                                    <div v-for="rec in allTransferRecords" :key="'amend-'+rec.blockIndex"
                                        class="rounded-2xl border-2 transition-all overflow-hidden"
                                        :class="amendSelectedBlock === rec.blockIndex ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white'">
                                        <label class="flex items-center gap-3 p-4 cursor-pointer"
                                            :class="amendSelectedBlock === rec.blockIndex ? '' : 'hover:bg-slate-50'">
                                            <input type="radio" v-model="amendSelectedBlock" :value="rec.blockIndex" class="sr-only">
                                            <div class="flex-1 min-w-0">
                                                <div class="font-bold text-slate-800 truncate">{{ recordRouteLabel(rec) }}</div>
                                                <div class="text-xs text-slate-400 mt-0.5">{{ rec.date }}</div>
                                            </div>
                                            <span v-if="rec.inspected" class="text-[10px] font-bold text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">検品済</span>
                                            <span v-else class="text-[10px] font-bold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">未検品</span>
                                        </label>
                                        <button @click="toggleBlockDetail(rec)"
                                            class="w-full flex items-center justify-between px-4 py-2 text-left text-xs font-bold text-slate-500 border-t border-slate-100 hover:bg-slate-50 transition-colors">
                                            <span>明細を表示</span>
                                            <svg :class="expandedBlocks[rec.blockIndex] ? 'rotate-180' : ''"
                                                class="w-4 h-4 text-slate-300 transition-transform duration-200"
                                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        <transition name="slide-up">
                                            <div v-if="expandedBlocks[rec.blockIndex]" class="border-t border-slate-100 px-4 py-3 bg-white/70">
                                                <div v-if="blockDetailsLoading[rec.blockIndex]" class="text-xs text-slate-400 text-center py-2">
                                                    読み込み中...
                                                </div>
                                                <div v-else-if="blockDetails[rec.blockIndex] && blockDetails[rec.blockIndex].length > 0" class="space-y-1">
                                                    <div v-for="item in blockDetails[rec.blockIndex]" :key="'amend-detail-'+rec.blockIndex+'-'+item.rowIndex"
                                                        class="flex items-center justify-between text-sm py-0.5">
                                                        <span class="text-slate-600 truncate flex-1">
                                                            <span class="text-xs text-slate-400 mr-1">{{ item.brand }}</span>{{ item.flavorName }}
                                                        </span>
                                                        <span class="font-bold text-slate-800 ml-3 flex-shrink-0">{{ item.qty.toLocaleString() }}g</span>
                                                    </div>
                                                </div>
                                                <div v-else class="text-xs text-slate-400 text-center py-1">
                                                    明細データなし
                                                </div>
                                            </div>
                                        </transition>
                                    </div>
                                </div>
                            </div>
                            <button @click="startAmend" :disabled="amendSelectedBlock === null" class="mt-4 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-4 rounded-full shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50">
                                修正を開始する
                            </button>
                        </div>
                    </transition>
                </div>

                <!-- Transfer Record History -->
                <div v-if="transferMonth" class="mt-4 w-full max-w-md">
                    <button
                        @click="allRecordsExpanded = !allRecordsExpanded"
                        class="w-full flex items-center justify-between px-5 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-700 font-bold text-sm transition-all active:scale-95">
                        <span v-if="allRecordsLoading" class="text-slate-400">{{ selectedPeriodLabel }}の移動記録を取得中...</span>
                        <span v-else>{{ selectedPeriodLabel }}の移動記録一覧（{{ allTransferRecords.length }}件）</span>
                        <svg v-if="!allRecordsLoading" :class="allRecordsExpanded ? 'rotate-180' : ''" class="w-4 h-4 text-slate-400 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                        <svg v-else class="w-4 h-4 text-slate-300 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                    </button>

                    <transition name="slide-up">
                        <div v-if="allRecordsExpanded && allTransferRecords.length > 0" class="mt-2 space-y-2">
                            <div v-for="rec in allTransferRecords" :key="rec.blockIndex"
                                class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <!-- Record Summary Row -->
                                <button @click="toggleBlockDetail(rec)"
                                    class="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 active:bg-slate-100">
                                    <!-- Inspection Badge -->
                                    <span v-if="rec.inspected"
                                        class="flex-shrink-0 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 111.414-1.414L8.414 12.586l7.879-7.879a1 1 0 011.414 0z" clip-rule="evenodd" />
                                        </svg>
                                        検品済
                                    </span>
                                    <span v-else
                                        class="flex-shrink-0 inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">
                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        未検品
                                    </span>
                                    <!-- Route & Date -->
                                    <div class="flex-1 min-w-0">
                                        <div class="font-bold text-slate-800 text-sm truncate">{{ recordRouteLabel(rec) }}</div>
                                        <div class="text-xs text-slate-400 mt-0.5">{{ rec.date }}</div>
                                    </div>
                                    <!-- Expand Arrow -->
                                    <svg :class="expandedBlocks[rec.blockIndex] ? 'rotate-180' : ''"
                                        class="flex-shrink-0 w-4 h-4 text-slate-300 transition-transform duration-200"
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                <!-- Record Detail (expanded) -->
                                <transition name="slide-up">
                                    <div v-if="expandedBlocks[rec.blockIndex]" class="border-t border-slate-100 px-4 py-3">
                                        <div v-if="blockDetailsLoading[rec.blockIndex]" class="text-xs text-slate-400 text-center py-2">
                                            読み込み中...
                                        </div>
                                        <div v-else-if="blockDetails[rec.blockIndex] && blockDetails[rec.blockIndex].length > 0"
                                            class="space-y-1">
                                            <div v-for="item in blockDetails[rec.blockIndex]" :key="item.rowIndex"
                                                class="flex items-center justify-between text-sm py-0.5">
                                                <span class="text-slate-600 truncate flex-1">
                                                    <span class="text-xs text-slate-400 mr-1">{{ item.brand }}</span>{{ item.flavorName }}
                                                </span>
                                                <span class="font-bold text-slate-800 ml-3 flex-shrink-0">{{ item.qty.toLocaleString() }}g</span>
                                            </div>
                                        </div>
                                        <div v-else class="text-xs text-slate-400 text-center py-1">
                                            明細データなし
                                        </div>
                                        <div v-if="!blockDetailsLoading[rec.blockIndex] && transferRecordCommentText(rec)" class="mt-3 pt-3 border-t border-slate-100">
                                            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">コメント</div>
                                            <p class="text-xs text-slate-600 whitespace-pre-wrap break-words leading-relaxed">{{ transferRecordCommentText(rec) }}</p>
                                        </div>
                                    </div>
                                </transition>
                            </div>
                        </div>
                        <div v-else-if="allRecordsExpanded && !allRecordsLoading" class="mt-2 text-center py-4 text-slate-400 text-sm">
                            この月の移動記録はありません
                        </div>
                    </transition>
                </div>
            </div>
        </transition>

        <!-- Step 1A: Issue Entry -->
        <div v-if="transferStep === '1a'" class="space-y-4">
            <div class="flex items-center gap-2 mb-1 px-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <h2 class="text-lg font-bold text-slate-800">{{ transferStep1aTitle }}</h2>
                <span v-if="transferSubMode !== 'issue'" class="text-xs text-slate-500 font-semibold ml-auto max-w-[55%] text-right leading-snug">{{ transferStep1aDesc }}</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div v-for="item in transferFilteredItems" :key="item.rowIndex" class="p-4 rounded-2xl shadow-sm border border-slate-100 bg-white flex flex-col gap-3">
                    <div class="flex flex-col gap-3">
                        <template v-if="showTransferStep1aStock">
                            <div class="flex justify-between items-start gap-2">
                                <div class="pr-2 min-w-0">
                                    <span class="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100/50 text-[9px] font-bold px-2 py-0.5 rounded-full mb-1">{{ item.brand }}</span>
                                    <div class="font-bold text-slate-800 leading-tight">{{ item.flavorName }}</div>
                                </div>
                                <div class="text-right flex-shrink-0">
                                    <div class="text-[10px] uppercase font-bold text-slate-400 mb-0.5">{{ transferCurrentStoreStockLabel }}在庫</div>
                                    <div class="text-2xl font-bold bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 inline-flex items-center" :class="getTransferStockColorClass(transferItemStockAtCurrentStore(item))">
                                        <span v-if="(Number(transferItemStockAtCurrentStore(item)) || 0) < 500" class="inline-flex items-center justify-center w-5 h-5 bg-red-100 text-red-600 rounded-full text-[10px] mr-1">!</span>
                                        {{ Number(transferItemStockAtCurrentStore(item)) || 0 }}
                                    </div>
                                </div>
                            </div>
                            <div class="grid grid-cols-3 gap-2">
                                <div v-for="storeCode in transferOtherInventoryKeys" :key="storeCode" class="text-center rounded-xl py-2 px-1 border" :class="getTransferOtherStockStyle(item, storeCode)">
                                    <div class="text-[10px] text-slate-400 font-bold mb-0.5">{{ transferInventoryStoreLabel(storeCode) }}</div>
                                    <div class="text-sm">{{ Number(item.stock && item.stock[storeCode]) || 0 }}</div>
                                </div>
                            </div>
                        </template>
                        <template v-else>
                            <div>
                                <span class="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100/50 text-[9px] font-bold px-2 py-0.5 rounded-full mb-1">{{ item.brand }}</span>
                                <div class="font-bold text-slate-800 leading-tight">{{ item.flavorName }}</div>
                            </div>
                        </template>
                    </div>
                    <input type="number" min="0" class="w-full text-xl font-bold p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all text-center bg-white text-slate-800 placeholder-slate-200" placeholder="0" :value="issueOrderState[item.rowIndex] || ''" @input="updateIssueQty(item.rowIndex, $event.target.value)">
                </div>
            </div>
            <div class="h-24"></div>
        </div>

        <!-- Step 2A: Issue Review -->
        <div v-if="transferStep === '2a'" class="space-y-4">
            <div class="flex items-center gap-2 mb-4 px-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <h2 class="text-lg font-bold text-slate-800">{{ transferStep2aTitle }}</h2>
            </div>
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div class="px-5 py-4 bg-emerald-50 border-b border-emerald-100">
                    <div v-if="transferSubMode === 'issue' && issueFromStore && issueDestStore" class="mb-3 rounded-xl border border-emerald-200 bg-white/90 px-3 py-2.5">
                        <p class="text-[10px] font-bold text-emerald-700 uppercase tracking-wide mb-1">移動ルート</p>
                        <p class="text-base font-black text-slate-900">{{ issueStoreName(issueFromStore) }} <span class="text-emerald-600 mx-1">→</span> {{ issueStoreName(issueDestStore) }}</p>
                    </div>
                    <p v-else class="text-sm font-bold text-emerald-700">{{ transferStep1aDesc }}</p>
                    <p class="text-xs text-slate-500 mt-0.5">{{ issueDate }}</p>
                </div>
                <div v-if="issueConfirmItems.length === 0" class="p-8 text-center text-slate-400 text-sm">
                    移動数量が入力されていません
                </div>
                <table v-else class="w-full text-sm">
                    <thead class="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th class="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">フレーバー</th>
                            <th class="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase">数量 (g)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in issueConfirmItems" :key="item.rowIndex" class="border-b border-slate-50 last:border-0">
                            <td class="px-4 py-3">
                                <div class="text-[10px] font-bold text-slate-400">{{ item.brand }}</div>
                                <div class="font-bold text-slate-800">{{ item.flavorName }}</div>
                            </td>
                            <td class="px-4 py-3 text-right font-bold text-emerald-600 text-lg">{{ item.qty }}</td>
                        </tr>
                    </tbody>
                </table>
                <div v-if="issueConfirmItems.length > 0" class="border-t border-slate-100 px-4 py-4 bg-slate-50/60">
                    <label for="transfer-submit-comment" class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">コメント（任意）</label>
                    <textarea id="transfer-submit-comment" v-model="issueSubmitComment" rows="3" maxlength="500"
                        placeholder="担当者・理由など、必要に応じて入力してください"
                        class="w-full text-sm text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:outline-none resize-y min-h-[4.5rem] placeholder:text-slate-300"></textarea>
                    <p class="text-[10px] text-slate-400 mt-1.5">{{ issueSubmitComment.length }}/500</p>
                </div>
            </div>
            <div class="h-24"></div>
        </div>

        <!-- Step 1B: Inspect Review -->
        <div v-if="transferStep === '1b'" class="space-y-4">
            <div class="flex items-center gap-2 mb-4 px-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <h2 class="text-lg font-bold text-slate-800">検品</h2>
                <span class="text-xs text-slate-400 font-medium ml-auto">
                    {{ transferStoreName(inspectFromStoreKey) }} → {{ transferStoreName(inspectDestStore) }}
                </span>
            </div>

            <div v-if="inspectDetail.length === 0" class="text-center py-20 text-slate-400">
                移動記録にデータがありません
            </div>

            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th class="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">フレーバー</th>
                            <th class="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase">数量</th>
                            <th class="px-4 py-3 text-xs font-bold text-slate-400 uppercase text-center">確認</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in inspectDetail" :key="item.rowIndex" class="border-b border-slate-50 last:border-0">
                            <td class="px-4 py-3">
                                <div class="text-[10px] font-bold text-slate-400">{{ item.brand }}</div>
                                <div class="font-bold text-slate-800">{{ item.flavorName }}</div>
                            </td>
                            <td class="px-4 py-3 text-right">
                                <input type="number" v-model.number="item.qty" @change="confirmQtyChange(item)" min="0" class="w-16 text-right font-bold p-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none bg-white">
                            </td>
                            <td class="px-4 py-3 text-center">
                                <button @click="toggleInspectCheck(item.rowIndex)" :class="inspectChecked[item.rowIndex] ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'" class="w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all mx-auto active:scale-90">
                                    <svg v-if="inspectChecked[item.rowIndex]" class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div class="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center gap-2">
                    <select v-model="inspectAddSelectedFlavor" class="flex-1 w-0 min-w-0 bg-white border border-slate-200 rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
                        <option value="">＋ フレーバーを追加...</option>
                        <option v-for="opt in availableInspectFlavors" :value="opt.rowIndex" :key="'add-'+opt.rowIndex">
                            {{ opt.brand }} / {{ opt.flavorName }}
                        </option>
                    </select>
                    <button @click="addInspectFlavor" :disabled="!inspectAddSelectedFlavor" class="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50">追加</button>
                </div>
            </div>

            <div v-if="inspectAllChecked" class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center mt-4">
                <p class="text-emerald-700 font-bold text-sm">✅ 全てのフレーバーを確認しました</p>
            </div>
            <div class="h-24"></div>
        </div>

        <!-- Step 1C: Amend Edit -->
        <div v-if="transferStep === '1c'" class="space-y-4">
            <div class="flex items-center gap-2 mb-4 px-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <h2 class="text-lg font-bold text-slate-800">修正</h2>
                <span class="text-xs text-slate-400 font-medium ml-auto">{{ amendRouteLabel }}</span>
            </div>

            <div v-if="amendItems.length === 0" class="text-center py-20 text-slate-400">
                移動記録にデータがありません
            </div>

            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th class="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">フレーバー</th>
                            <th class="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase">数量</th>
                            <th class="px-4 py-3 text-xs font-bold text-slate-400 uppercase text-center">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in amendItems" :key="'amend-row-'+item.rowIndex" class="border-b border-slate-50 last:border-0">
                            <td class="px-4 py-3">
                                <div class="text-[10px] font-bold text-slate-400">{{ item.brand }}</div>
                                <div class="font-bold text-slate-800">{{ item.flavorName }}</div>
                            </td>
                            <td class="px-4 py-3 text-right">
                                <input type="number" v-model.number="item.qty" @change="confirmAmendQtyChange(item)" min="0" class="w-20 text-right font-bold p-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none bg-white">
                            </td>
                            <td class="px-4 py-3 text-center">
                                <button @click="removeAmendFlavor(item.rowIndex)" class="text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors">
                                    削除
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div class="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center gap-2">
                    <select v-model="amendAddSelectedFlavor" class="flex-1 w-0 min-w-0 bg-white border border-slate-200 rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
                        <option value="">＋ 別の銘柄を追加...</option>
                        <option v-for="opt in availableAmendFlavors" :value="opt.rowIndex" :key="'amend-add-'+opt.rowIndex">
                            {{ opt.brand }} / {{ opt.flavorName }}
                        </option>
                    </select>
                    <button @click="addAmendFlavor" :disabled="!amendAddSelectedFlavor" class="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50">
                        追加
                    </button>
                </div>
            </div>

            <div class="h-24"></div>
        </div>
    </div>
</template>

<script>
import { getFlavorListForTransfer, getPendingTransferRecords, getTransferRecordDetail, submitTransferRecord, completeInspection, getAllTransferRecords, getDisposeRecordDetail, addFlavorForArrival, fetchLatestInventoryPeriodKey, amendTransferRecord } from '../../api.js'
import { buildYearOptions, buildMonthOptions, composePeriodKey, formatPeriodLabel, parsePeriodKey, getNextPeriodKey, getCurrentPeriodKey } from '../../utils/periods.js'

export default {
  name: 'TransferApp',
  inject: ['requestConfirm'],
  props: {
    transferStep: { type: [Number, String], default: 0 },
    selectedBrand: String
  },
  data() {
    return {
      years: buildYearOptions(),
      months: buildMonthOptions(),
      stores: [
        { key: 'office', name: '事務所' },
        { key: 'baba', name: '馬場本店' },
        { key: 'nakano', name: '中野店' },
        { key: 'baba_2nd', name: '馬場2号店' },
      ],
      transferYear: '',
      transferMonthPart: '',
      transferSubMode: null,
      issueFromStore: '',
      issueDestStore: '',
      issueDate: '',
      issueItems: [],
      issueOrderState: {},
      issueSubmitComment: '',
      arrivalSelectedBrand: '',
      arrivalNewBrandShortName: '',
      arrivalNewBrandFormalName: '',
      arrivalNewFlavorName: '',
      arrivalAddingFlavor: false,
      transferBrands: [],
      inspectDestStore: '',
      inspectPendingList: [],
      inspectSelectedBlock: null,
      inspectFromStoreKey: '',
      inspectDetail: [],
      inspectChecked: {},
      inspectAvailableItems: [],
      inspectAddSelectedFlavor: '',
      amendSelectedBlock: null,
      amendSelectedRecord: null,
      amendItems: [],
      amendAvailableItems: [],
      amendAddSelectedFlavor: '',
      allTransferRecords: [],
      allRecordsLoading: false,
      allRecordsExpanded: false,
      expandedBlocks: {},
      blockDetails: {},
      blockDetailsLoading: {}
    }
  },
  mounted() {
    this.applyDefaultTransferMonth()
  },
  computed: {
    issueConfirmItems() {
      return this.issueItems
        .filter(i => { const q = parseInt(this.issueOrderState[i.rowIndex], 10); return !isNaN(q) && q > 0 })
        .map(i => ({ rowIndex: i.rowIndex, brand: i.brand, flavorName: i.flavorName, qty: parseInt(this.issueOrderState[i.rowIndex], 10) }))
    },
    transferFilteredItems() {
      if (!this.selectedBrand) return this.issueItems;
      return this.issueItems.filter(i => i.brand === this.selectedBrand)
    },
    inspectAllChecked() {
      if (this.inspectDetail.length === 0) return false
      return this.inspectDetail.every(i => this.inspectChecked[i.rowIndex])
    },
    availableInspectFlavors() {
      const existing = new Set(this.inspectDetail.map(i => i.rowIndex))
      return this.inspectAvailableItems.filter(i => !existing.has(i.rowIndex))
    },
    availableAmendFlavors() {
      const existing = new Set(this.amendItems.map(i => i.rowIndex))
      return this.amendAvailableItems.filter(i => !existing.has(i.rowIndex))
    },
    transferStep1aTitle() {
      if (this.transferSubMode === 'arrival') return '入荷 — 入荷数量の入力'
      if (this.transferSubMode === 'dispose') return '廃棄 — 廃棄数量の入力'
      return '起票 — 移動数量の入力'
    },
    transferStep1aDesc() {
      if (this.transferSubMode === 'arrival') return this.issueStoreName(this.issueFromStore) + '（入荷）'
      if (this.transferSubMode === 'dispose') return this.issueStoreName(this.issueFromStore) + '（廃棄）'
      return this.issueStoreName(this.issueFromStore) + ' → ' + this.issueStoreName(this.issueDestStore)
    },
    transferStep2aTitle() {
      if (this.transferSubMode === 'arrival') return '入荷 — 内容確認'
      if (this.transferSubMode === 'dispose') return '廃棄 — 内容確認'
      return '起票 — 内容確認'
    },
    /** 起票・廃棄の入力画面で、補充依頼と同じ在庫（移動元／実施店舗＋他拠点）を表示 */
    showTransferStep1aStock() {
      return this.transferStep === '1a' && (this.transferSubMode === 'issue' || this.transferSubMode === 'dispose' || this.transferSubMode === 'arrival')
    },
    transferIssueInventoryKey() {
      const m = { office: 'office', baba: 'baba_main', nakano: 'nakano', baba_2nd: 'baba_2nd' }
      return m[this.issueFromStore] || 'office'
    },
    transferCurrentStoreStockLabel() {
      return this.transferInventoryStoreLabel(this.transferIssueInventoryKey)
    },
    transferOtherInventoryKeys() {
      return ['office', 'baba_main', 'nakano', 'baba_2nd'].filter(k => k !== this.transferIssueInventoryKey)
    },
    arrivalBrandOptions() {
      return this.transferBrands || []
    },
    arrivalResolvedBrand() {
      if (this.arrivalSelectedBrand === '__other__') return (this.arrivalNewBrandFormalName || '').trim()
      return (this.arrivalSelectedBrand || '').trim()
    },
    arrivalResolvedBrandShortName() {
      if (this.arrivalSelectedBrand === '__other__') return (this.arrivalNewBrandShortName || '').trim()
      return ''
    },
    arrivalBrandValidationMessage() {
      if (!this.transferMonth) return '対象月を選択してください。'
      if (!this.arrivalSelectedBrand) return 'ブランド名を選択してください。'
      if (this.arrivalSelectedBrand !== '__other__') return ''
      if (!this.arrivalResolvedBrandShortName) return 'ブランド略称を入力してください。'
      if (!this.arrivalResolvedBrand) return 'ブランド正式名称を入力してください。'
      const shortNameRule = /^[A-Z]+(?: [A-Z]+)*$/
      if (!shortNameRule.test(this.arrivalResolvedBrandShortName)) {
        return 'ブランド略称は大文字アルファベットのみ、単語間は半角スペースで入力してください。'
      }
      const formalNameRule = /^[A-Z][a-z]*(?: [A-Z][a-z]*)*$/
      if (!formalNameRule.test(this.arrivalResolvedBrand)) {
        return 'ブランド正式名称は各単語の頭文字のみ大文字、単語間は半角スペースで入力してください。'
      }
      return ''
    },
    arrivalFlavorValidationMessage() {
      const v = (this.arrivalNewFlavorName || '').trim()
      if (!v) return 'フレーバー名を入力してください。'
      // 例: Mexi Cola
      const flavorRule = /^[A-Z][a-z0-9]*(?: [A-Z][a-z0-9]*)*$/
      if (!flavorRule.test(v)) {
        return 'フレーバー名は各単語の頭文字のみ大文字、単語間は半角スペースで入力してください。'
      }
      return ''
    },
    arrivalAddDisabled() {
      return this.arrivalAddingFlavor || !this.transferMonth || !!this.arrivalBrandValidationMessage || !!this.arrivalFlavorValidationMessage
    },
    selectedPeriodLabel() {
      return formatPeriodLabel(this.transferMonth)
    },
    transferMonth() {
      return composePeriodKey(this.transferYear, this.transferMonthPart)
    },
    amendRouteLabel() {
      return this.amendSelectedRecord ? this.recordRouteLabel(this.amendSelectedRecord) : ''
    }
  },
  watch: {
    inspectAllChecked(newVal) {
      this.$emit('update:inspectAllChecked', newVal);
      this.$emit('update:issueConfirmItemsEmpty', false);
    },
    issueConfirmItems: {
        handler(newVal) {
            if (this.transferStep === '1a' || this.transferStep === '2a') {
              this.$emit('update:issueConfirmItemsEmpty', newVal.length === 0);
            }
        },
        deep: true
    },
    amendItems: {
      handler(newVal) {
        this.$emit('update:amendItemsEmpty', newVal.length === 0)
      },
      deep: true
    },
    issueFromStore(v) {
      this.$emit('update:issueFromName', this.transferSubMode === 'issue' && v ? this.transferStoreName(v) : '')
    },
    issueDestStore(v) {
      this.$emit('update:issueToName', this.transferSubMode === 'issue' && v ? this.transferStoreName(v) : '')
    },
    transferSubMode(v) {
      if (v !== 'issue') {
        this.$emit('update:issueFromName', '')
        this.$emit('update:issueToName', '')
      } else {
        this.$emit('update:issueFromName', this.issueFromStore ? this.transferStoreName(this.issueFromStore) : '')
        this.$emit('update:issueToName', this.issueDestStore ? this.transferStoreName(this.issueDestStore) : '')
      }
      if (v === 'arrival' && this.transferMonth) this.ensureArrivalBrandOptions()
    },
    transferMonth(val) {
      this.allTransferRecords = []
      this.allRecordsExpanded = false
      this.expandedBlocks = {}
      this.blockDetails = {}
      this.blockDetailsLoading = {}
      this.amendSelectedBlock = null
      this.amendSelectedRecord = null
      this.amendItems = []
      this.amendAvailableItems = []
      this.amendAddSelectedFlavor = ''
      if (val) this.loadAllTransferRecords()
      if (val && this.transferSubMode === 'arrival') this.ensureArrivalBrandOptions()
    }
  },
  methods: {
    async applyDefaultTransferMonth() {
      if (this.transferYear || this.transferMonthPart) return
      try {
        const latestInv = await fetchLatestInventoryPeriodKey()
        const base = latestInv ?? getCurrentPeriodKey()
        const target = getNextPeriodKey(base)
        const p = parsePeriodKey(target)
        if (p) {
          this.transferYear = String(p.year)
          this.transferMonthPart = String(p.month)
        }
      } catch {
        const p = parsePeriodKey(getNextPeriodKey(getCurrentPeriodKey()))
        if (p) {
          this.transferYear = String(p.year)
          this.transferMonthPart = String(p.month)
        }
      }
    },
    async ensureArrivalBrandOptions() {
      if (!this.transferMonth) return
      if (this.transferBrands.length > 0) return
      try {
        await this.reloadTransferItems(this.transferMonth)
      } catch (_) {
        // ブランド選択肢の事前取得失敗は、開始ボタン/追加ボタン押下時に再度検知する
      }
    },
    async reloadTransferItems(periodKey) {
      const rawIssueItems = await getFlavorListForTransfer(periodKey)
      this.issueItems = rawIssueItems.filter(i => i.appDisplay !== false)
      const seen = new Set()
      this.transferBrands = this.issueItems.map(i => i.brand).filter(b => b && !seen.has(b) && seen.add(b))
      this.$emit('update:brands', this.transferBrands)
    },
    transferStoreName(key) {
      const normalizedKey = key === 'baba_main' ? 'baba' : key
      const s = this.stores.find(x => x.key === normalizedKey)
      return s ? s.name : key
    },
    issueStoreName(key) { return this.transferStoreName(key) },
    transferInventoryStoreLabel(key) {
      return { office: '事務所', baba_main: '馬場本店', nakano: '中野店', baba_2nd: '馬場2号店' }[key] || key
    },
    transferItemStockAtCurrentStore(item) {
      if (!item || !item.stock) return 0
      return item.stock[this.transferIssueInventoryKey]
    },
    getTransferStockColorClass(val) {
      const n = Number(val) || 0
      if (n < 500) return 'text-red-600 font-black'
      if (n < 1000) return 'text-red-500 font-bold'
      return 'text-slate-700'
    },
    getTransferOtherStockStyle(item, storeCode) {
      const val = Number(item.stock && item.stock[storeCode]) || 0
      const max = Math.max(
        Number(item.stock && item.stock.office) || 0,
        Number(item.stock && item.stock.baba_main) || 0,
        Number(item.stock && item.stock.nakano) || 0,
        Number(item.stock && item.stock.baba_2nd) || 0
      )
      if (max > 0 && val === max) return 'bg-emerald-50 text-emerald-700 font-bold border-emerald-100 ring-1 ring-emerald-100/50'
      return 'bg-slate-50 text-slate-600 font-medium border-slate-100'
    },
    async startIssue() {
      this.$emit('update:loading', true);
      this.$emit('update:loadingMessage', 'フレーバー一覧を取得中...');
      try {
        await this.reloadTransferItems(this.transferMonth)
        this.issueOrderState = {}
        this.issueSubmitComment = ''
        this.$emit('update:transferStep', '1a');
      } catch (e) {
        alert(e.message || 'データの取得に失敗しました。')
      } finally {
        this.$emit('update:loading', false);
      }
    },
    async addArrivalFlavor() {
      if (this.transferSubMode !== 'arrival') return
      const brand = this.arrivalResolvedBrand
      const brandShortName = this.arrivalResolvedBrandShortName
      const brandFormalName = this.arrivalResolvedBrand
      const flavorName = (this.arrivalNewFlavorName || '').trim()
      if (this.arrivalBrandValidationMessage || this.arrivalFlavorValidationMessage) {
        alert(this.arrivalBrandValidationMessage || this.arrivalFlavorValidationMessage)
        return
      }
      const periodKey = Number(this.transferMonth)
      if (!periodKey) {
        alert('対象月を選択してください。')
        return
      }
      this.arrivalAddingFlavor = true
      this.$emit('update:loading', true)
      this.$emit('update:loadingMessage', '新規銘柄を追加中...')
      try {
        await addFlavorForArrival({
          monthNum: periodKey,
          periodKey,
          brand,
          brandShortName,
          brandFormalName,
          flavorName
        })
        await this.reloadTransferItems(periodKey)
        this.arrivalSelectedBrand = ''
        this.arrivalNewBrandShortName = ''
        this.arrivalNewBrandFormalName = ''
        this.arrivalNewFlavorName = ''
        alert('新規銘柄を追加しました。')
      } catch (e) {
        alert(e.message || '新規銘柄の追加に失敗しました。')
      } finally {
        this.arrivalAddingFlavor = false
        this.$emit('update:loading', false)
      }
    },
    updateIssueQty(rowIndex, val) {
      const qty = parseInt(val, 10)
      if (!isNaN(qty) && qty > 0) {
        this.issueOrderState[rowIndex] = qty
      } else {
        delete this.issueOrderState[rowIndex]
      }
    },
    goToIssueConfirm() { 
      this.$emit('update:transferStep', '2a');
    },
    async submitIssue() {
      const modeLabel = this.transferSubMode === 'arrival' ? '入荷記録' : (this.transferSubMode === 'dispose' ? '廃棄記録' : '移動記録')
      if (!await this.requestConfirm('データを記録してよろしいですか？')) return
      this.$emit('update:loading', true);
      this.$emit('update:loadingMessage', 'データベースに書き込み中...');
      const periodKey = Number(this.transferMonth)
      const items = this.issueConfirmItems.map(i => ({ rowIndex: i.rowIndex, qty: i.qty }))
      let fromStore = this.issueFromStore, destStore = this.issueDestStore, autoInspect = false
      if (this.transferSubMode === 'arrival') { fromStore = null; destStore = this.issueFromStore; autoInspect = true }
      else if (this.transferSubMode === 'dispose') { destStore = null; autoInspect = true }
      try {
        await submitTransferRecord({
          monthNum: periodKey,
          periodKey,
          fromStoreKey: fromStore,
          destStoreKey: destStore,
          date: this.issueDate,
          items,
          autoInspect,
          comment: this.issueSubmitComment
        })
        alert(`${modeLabel}を保存しました。`)
        this.resetTransferApp()
        if (this.transferMonth) await this.loadAllTransferRecords()
      } catch (e) {
        alert(e.message || '書き込みに失敗しました。')
      } finally {
        this.$emit('update:loading', false);
      }
    },
    async loadPendingRecords() {
      if (!this.transferMonth || !this.inspectDestStore) return
      this.$emit('update:loading', true);
      this.$emit('update:loadingMessage', '移動記録を取得中...');
      this.inspectPendingList = []; this.inspectSelectedBlock = null
      try {
        this.inspectPendingList = await getPendingTransferRecords(this.transferMonth, this.inspectDestStore)
      } catch (e) {
        alert(e.message || '取得に失敗しました。')
      } finally {
        this.$emit('update:loading', false);
      }
    },
    async startInspect() {
      if (this.inspectSelectedBlock === null) return
      this.$emit('update:loading', true);
      this.$emit('update:loadingMessage', '移動記録とフレーバーを追加読み込み中...');
      const rec = this.inspectPendingList.find(r => r.blockIndex === this.inspectSelectedBlock)
      this.inspectFromStoreKey = rec ? rec.fromStoreKey : ''
      try {
        const [allItems, detail] = await Promise.all([
          getFlavorListForTransfer(this.transferMonth),
          getTransferRecordDetail(this.transferMonth, this.inspectSelectedBlock, this.inspectDestStore)
        ])
        this.inspectAvailableItems = allItems
        this.inspectAddSelectedFlavor = ''
        this.inspectDetail = detail.map(i => ({ ...i, originalQty: i.qty }))
        this.inspectChecked = {}
        this.$emit('update:transferStep', '1b');
      } catch (e) {
        alert(e.message || 'データ読み込みに失敗しました。')
      } finally {
        this.$emit('update:loading', false);
      }
    },
    async startAmend() {
      if (this.amendSelectedBlock === null) return
      this.$emit('update:loading', true)
      this.$emit('update:loadingMessage', '修正対象を読み込み中...')
      try {
        const rec = this.allTransferRecords.find(r => r.blockIndex === this.amendSelectedBlock)
        if (!rec) throw new Error('対象の移動記録が見つかりません。')
        const detailStoreKey = rec.recordType === 'dispose' ? rec.fromStoreKey : (rec.destStoreKey || rec.fromStoreKey)
        const [allItems, detail] = await Promise.all([
          getFlavorListForTransfer(this.transferMonth),
          rec.recordType === 'dispose'
            ? getDisposeRecordDetail(this.transferMonth, rec.blockIndex, detailStoreKey)
            : getTransferRecordDetail(this.transferMonth, rec.blockIndex, detailStoreKey)
        ])
        this.amendSelectedRecord = rec
        this.amendAvailableItems = allItems
        this.amendAddSelectedFlavor = ''
        this.amendItems = detail.map(i => ({ ...i, originalQty: i.qty }))
        this.$emit('update:transferStep', '1c')
      } catch (e) {
        alert(e.message || 'データ読み込みに失敗しました。')
      } finally {
        this.$emit('update:loading', false)
      }
    },
    async confirmAmendQtyChange(item) {
      const newQty = parseInt(item.qty, 10)
      if (isNaN(newQty) || newQty < 0) { item.qty = item.originalQty; return }
      if (newQty !== item.originalQty) {
        const ok = await this.requestConfirm('移動記録の数量を変更して\nデータベースに上書きします。よろしいですか？')
        if (ok) { item.originalQty = newQty; item.qty = newQty }
        else { item.qty = item.originalQty }
      }
    },
    addAmendFlavor() {
      if (!this.amendAddSelectedFlavor) return
      const item = this.amendAvailableItems.find(i => i.rowIndex === this.amendAddSelectedFlavor)
      if (item) {
        this.amendItems.push({ rowIndex: item.rowIndex, brand: item.brand, flavorName: item.flavorName, qty: 0, originalQty: 0 })
      }
      this.amendAddSelectedFlavor = ''
    },
    async removeAmendFlavor(rowIndex) {
      const ok = await this.requestConfirm('この銘柄を修正対象から削除します。よろしいですか？')
      if (!ok) return
      this.amendItems = this.amendItems.filter(i => i.rowIndex !== rowIndex)
    },
    async submitAmend() {
      if (!this.amendSelectedRecord) return
      const normalizedItems = this.amendItems
        .map(i => ({ flavorId: i.rowIndex, qty: Number(i.qty) || 0 }))
        .filter(i => i.qty > 0)
      if (normalizedItems.length === 0) {
        alert('最低1件以上の銘柄を残してください。')
        return
      }
      if (!await this.requestConfirm('移動記録の修正内容を保存してよろしいですか？\n※既存の移動記録が上書きされます。')) return
      this.$emit('update:loading', true)
      this.$emit('update:loadingMessage', '修正内容を保存中...')
      try {
        await amendTransferRecord({
          periodKey: this.transferMonth,
          blockIndex: this.amendSelectedRecord.blockIndex,
          items: normalizedItems
        })
        alert('移動記録を修正しました。')
        this.resetTransferApp()
        if (this.transferMonth) await this.loadAllTransferRecords()
      } catch (e) {
        alert(e.message || '修正の保存に失敗しました。')
      } finally {
        this.$emit('update:loading', false)
      }
    },
    addInspectFlavor() {
      if (!this.inspectAddSelectedFlavor) return
      const item = this.inspectAvailableItems.find(i => i.rowIndex === this.inspectAddSelectedFlavor)
      if (item) {
        this.inspectDetail.push({ rowIndex: item.rowIndex, brand: item.brand, flavorName: item.flavorName, qty: 0, originalQty: 0 })
        this.inspectChecked[item.rowIndex] = false
      }
      this.inspectAddSelectedFlavor = ''
    },
    async confirmQtyChange(item) {
      const newQty = parseInt(item.qty, 10)
      if (isNaN(newQty) || newQty < 0) { item.qty = item.originalQty; return }
      if (newQty !== item.originalQty) {
        const ok = await this.requestConfirm('移動されたフレーバーの数量を変更して\nデータベースに上書きします。よろしいですか？')
        if (ok) { item.originalQty = newQty; item.qty = newQty }
        else { item.qty = item.originalQty }
      }
    },
    toggleInspectCheck(rowIndex) {
      this.inspectChecked[rowIndex] = !this.inspectChecked[rowIndex]
      this.$emit('update:inspectAllChecked', this.inspectAllChecked); // Watcher does this too, but trigger it explicitly just in case
    },
    async submitInspection() {
      if (!this.inspectAllChecked) return
      if (!await this.requestConfirm('検品を完了してよろしいですか？\n※数量を修正した場合はデータベースが上書きされます。')) return
      this.$emit('update:loading', true);
      this.$emit('update:loadingMessage', '送信中...');
      try {
        const items = this.inspectDetail.map(i => ({ rowIndex: i.rowIndex, qty: i.qty }))
        await completeInspection({ monthNum: Number(this.transferMonth), periodKey: this.transferMonth, blockIndex: this.inspectSelectedBlock, fromStoreKey: this.inspectFromStoreKey, destStoreKey: this.inspectDestStore, items })
        alert('検品が完了し、データベースに反映されました。')
        this.resetTransferApp()
        if (this.transferMonth) await this.loadAllTransferRecords()
      } catch (e) {
        alert(e.message || '送信に失敗しました。')
      } finally {
        this.$emit('update:loading', false);
      }
    },
    resetTransferApp() {
      this.issueFromStore = ''; this.issueDestStore = ''
      this.issueDate = ''; this.issueItems = []; this.issueOrderState = {}; this.issueSubmitComment = ''
      this.arrivalSelectedBrand = ''; this.arrivalNewBrandShortName = ''; this.arrivalNewBrandFormalName = ''; this.arrivalNewFlavorName = ''; this.arrivalAddingFlavor = false
      this.inspectDestStore = ''; this.inspectPendingList = []; this.inspectSelectedBlock = null
      this.inspectDetail = []; this.inspectChecked = {}; this.transferSubMode = null
      this.amendSelectedBlock = null; this.amendSelectedRecord = null
      this.amendItems = []; this.amendAvailableItems = []; this.amendAddSelectedFlavor = ''
      this.allRecordsLoading = false
      this.expandedBlocks = {}; this.blockDetails = {}; this.blockDetailsLoading = {}
      this.$emit('update:issueFromName', '')
      this.$emit('update:issueToName', '')
      this.$emit('update:amendItemsEmpty', true)
      this.$emit('update:transferStep', 0);
    },
    async loadAllTransferRecords() {
      this.allRecordsLoading = true
      try {
        this.allTransferRecords = await getAllTransferRecords(this.transferMonth)
      } catch (e) {
        this.allTransferRecords = []
      } finally {
        this.allRecordsLoading = false
      }
    },
    recordRouteLabel(rec) {
      const from = rec.fromStoreKey ? this.transferStoreName(rec.fromStoreKey) : ''
      const dest = rec.destStoreKey ? this.transferStoreName(rec.destStoreKey) : ''
      if (rec.recordType === 'arrival') return dest + '（入荷）'
      if (rec.recordType === 'dispose') return from + '（廃棄）'
      return from + ' → ' + dest
    },
    transferRecordCommentText(rec) {
      if (!rec || rec.comment == null) return ''
      const s = String(rec.comment).trim()
      return s
    },
    async toggleBlockDetail(rec) {
      const key = rec.blockIndex
      if (this.expandedBlocks[key]) {
        this.expandedBlocks = { ...this.expandedBlocks, [key]: false }
        return
      }
      this.expandedBlocks = { ...this.expandedBlocks, [key]: true }
      if (this.blockDetails[key] !== undefined) return
      this.blockDetailsLoading = { ...this.blockDetailsLoading, [key]: true }
      try {
        let detail = []
        if (rec.recordType === 'dispose') {
          detail = await getDisposeRecordDetail(this.transferMonth, key, rec.fromStoreKey)
        } else {
          const detailStoreKey = rec.destStoreKey || rec.fromStoreKey
          if (detailStoreKey) detail = await getTransferRecordDetail(this.transferMonth, key, detailStoreKey)
        }
        this.blockDetails = { ...this.blockDetails, [key]: detail }
      } catch (e) {
        this.blockDetails = { ...this.blockDetails, [key]: [] }
      } finally {
        this.blockDetailsLoading = { ...this.blockDetailsLoading, [key]: false }
      }
    }
  }
}
</script>
