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
                        <div class="relative">
                            <select v-model="transferMonth"
                                :class="transferMonth ? 'text-slate-800' : 'text-slate-500'"
                                class="appearance-none w-full bg-slate-50 border border-slate-200 text-lg font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 block p-4 text-center">
                                <option value="" disabled>実施月を選択してください</option>
                                <option v-for="m in months" :value="m" class="text-slate-800">{{ m }}</option>
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
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
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
    </div>
</template>

<script>
import { getFlavorListForTransfer, getPendingTransferRecords, getTransferRecordDetail, submitTransferRecord, completeInspection } from '../../api.js'

export default {
  name: 'TransferApp',
  inject: ['requestConfirm'],
  props: {
    transferStep: { type: [Number, String], default: 0 },
    selectedBrand: String
  },
  data() {
    return {
      months: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
      stores: [
        { key: 'office', name: '事務所' },
        { key: 'baba', name: '馬場本店' },
        { key: 'nakano', name: '中野店' },
        { key: 'baba_2nd', name: '馬場2号店' },
      ],
      transferMonth: '',
      transferSubMode: null,
      issueFromStore: '',
      issueDestStore: '',
      issueDate: '',
      issueItems: [],
      issueOrderState: {},
      transferBrands: [],
      inspectDestStore: '',
      inspectPendingList: [],
      inspectSelectedBlock: null,
      inspectFromStoreKey: '',
      inspectDetail: [],
      inspectChecked: {},
      inspectAvailableItems: [],
      inspectAddSelectedFlavor: ''
    }
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
    }
  },
  watch: {
    inspectAllChecked(newVal) {
      this.$emit('update:inspectAllChecked', newVal);
      this.$emit('update:issueConfirmItemsEmpty', false);
    },
    issueConfirmItems: {
        handler(newVal) {
            this.$emit('update:issueConfirmItemsEmpty', newVal.length === 0);
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
    }
  },
  methods: {
    transferStoreName(key) {
      const s = this.stores.find(x => x.key === key)
      return s ? s.name : key
    },
    issueStoreName(key) { return this.transferStoreName(key) },
    transferInventoryStoreLabel(key) {
      return { office: '事務所', baba_main: '本店', nakano: '中野', baba_2nd: '2号店' }[key] || key
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
        const monthNum = parseInt(this.transferMonth, 10)
        const rawIssueItems = await getFlavorListForTransfer(monthNum)
        this.issueItems = rawIssueItems.filter(i => i.appDisplay !== false)
        this.issueOrderState = {}
        const seen = new Set()
        this.transferBrands = this.issueItems.map(i => i.brand).filter(b => b && !seen.has(b) && seen.add(b))
        this.$emit('update:brands', this.transferBrands);
        this.$emit('update:transferStep', '1a');
      } catch (e) {
        alert(e.message || 'データの取得に失敗しました。')
      } finally {
        this.$emit('update:loading', false);
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
      this.$emit('update:loadingMessage', 'スプレッドシートに書き込み中...');
      const monthNum = parseInt(this.transferMonth, 10)
      const items = this.issueConfirmItems.map(i => ({ rowIndex: i.rowIndex, qty: i.qty }))
      let fromStore = this.issueFromStore, destStore = this.issueDestStore, autoInspect = false
      if (this.transferSubMode === 'arrival') { fromStore = null; destStore = this.issueFromStore; autoInspect = true }
      else if (this.transferSubMode === 'dispose') { destStore = null; autoInspect = true }
      try {
        await submitTransferRecord({ monthNum, fromStoreKey: fromStore, destStoreKey: destStore, date: this.issueDate, items, autoInspect })
        alert(`${modeLabel}を保存しました。`)
        this.resetTransferApp()
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
        const monthNum = parseInt(this.transferMonth, 10)
        this.inspectPendingList = await getPendingTransferRecords(monthNum, this.inspectDestStore)
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
      const monthNum = parseInt(this.transferMonth, 10)
      const rec = this.inspectPendingList.find(r => r.blockIndex === this.inspectSelectedBlock)
      this.inspectFromStoreKey = rec ? rec.fromStoreKey : ''
      try {
        const [allItems, detail] = await Promise.all([
          getFlavorListForTransfer(monthNum),
          getTransferRecordDetail(monthNum, this.inspectSelectedBlock, this.inspectDestStore)
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
        const ok = await this.requestConfirm('移動されたフレーバーの数量を変更して\nスプレッドシートに上書きします。よろしいですか？')
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
      if (!await this.requestConfirm('検品を完了してよろしいですか？\n※数量を修正した場合はスプレッドシートが上書きされます。')) return
      this.$emit('update:loading', true);
      this.$emit('update:loadingMessage', '送信中...');
      try {
        const monthNum = parseInt(this.transferMonth, 10)
        const items = this.inspectDetail.map(i => ({ rowIndex: i.rowIndex, qty: i.qty }))
        await completeInspection({ monthNum, blockIndex: this.inspectSelectedBlock, fromStoreKey: this.inspectFromStoreKey, destStoreKey: this.inspectDestStore, items })
        alert('検品が完了し、スプレッドシートに反映されました。')
        this.resetTransferApp()
      } catch (e) {
        alert(e.message || '送信に失敗しました。')
      } finally {
        this.$emit('update:loading', false);
      }
    },
    resetTransferApp() {
      this.transferMonth = ''; this.issueFromStore = ''; this.issueDestStore = ''
      this.issueDate = ''; this.issueItems = []; this.issueOrderState = {}
      this.inspectDestStore = ''; this.inspectPendingList = []; this.inspectSelectedBlock = null
      this.inspectDetail = []; this.inspectChecked = {}; this.transferSubMode = null
      this.$emit('update:issueFromName', '')
      this.$emit('update:issueToName', '')
      this.$emit('update:transferStep', 0);
    }
  }
}
</script>
