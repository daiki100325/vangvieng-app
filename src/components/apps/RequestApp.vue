<template>
    <div>
        <!-- Request Step 0: Setup -->
        <transition name="slide-up">
            <div v-if="currentStep === 0" class="flex flex-col items-center pt-6 pb-20">
                <div class="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 w-full max-w-md text-center">
                    <h2 class="text-xl font-bold text-slate-700 mb-8">補充依頼を開始</h2>

                    <div v-if="errorMessage" class="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl text-left shadow-sm animate-pulse">
                        <div class="flex items-start gap-3">
                            <svg class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                            <div>
                                <h3 class="text-sm font-bold text-red-800">アクセスエラー</h3>
                                <p class="text-xs text-red-600 mt-1">{{ errorMessage }}</p>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-6 text-left">
                        <div>
                            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">依頼元店舗（あなたの店舗）</label>
                            <div class="relative">
                                <select v-model="requestStoreKey" :class="requestStoreKey ? 'text-slate-800' : 'text-slate-500'"
                                    class="appearance-none w-full bg-slate-50 border border-slate-200 text-lg font-bold rounded-xl focus:ring-2 focus:ring-orange-500 block p-4 text-center cursor-pointer">
                                    <option value="" disabled>店舗を選択してください</option>
                                    <option value="baba_main" class="text-slate-800">馬場本店</option>
                                    <option value="nakano" class="text-slate-800">中野店</option>
                                    <option value="baba_2nd" class="text-slate-800">馬場2号店</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">対象月</label>
                            <div class="relative">
                                <select v-model="requestMonth" :class="requestMonth ? 'text-slate-800' : 'text-slate-500'"
                                    class="appearance-none w-full bg-slate-50 border border-slate-200 text-lg font-bold rounded-xl focus:ring-2 focus:ring-orange-500 block p-4 text-center">
                                    <option value="" disabled>実施月を選択してください</option>
                                    <option v-for="m in requestMonths" :value="m.val" :key="m.val" class="text-slate-800">{{ m.label }}</option>
                                </select>
                            </div>
                            <p class="text-xs text-slate-500 mt-2">
                                その月の棚卸しが全拠点完了し、まだ月をまたいでいない場合、来月を選んでください。<br>
                                例）３月の棚卸しが全拠点完了し、3/30に補充依頼をかける場合、4月を選択。
                            </p>
                        </div>
                    </div>

                    <button @click="startRequest" :disabled="!requestStoreKey || !requestMonth"
                        class="mt-10 w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-4 rounded-full shadow-lg shadow-orange-500/30 transition-all transform active:scale-95 disabled:opacity-50">
                        依頼を開始する
                    </button>
                </div>
            </div>
        </transition>

        <!-- Request Step 1: Request Board -->
        <div v-if="currentStep === 1" class="space-y-4">
            <!-- Filter Toggle -->
            <div class="sticky top-[64px] z-20 py-3 -mx-4 px-4 backdrop-blur-xl bg-slate-50/90 border-b border-slate-200/50 transition-all duration-300 mb-6">
                <div class="flex items-center justify-end max-w-7xl mx-auto">
                    <label class="inline-flex items-center cursor-pointer group bg-white px-3 py-2.5 rounded-xl ring-1 ring-slate-200 shadow-sm hover:bg-slate-50 transition-all">
                        <input type="checkbox" v-model="requestHideZero" class="sr-only peer">
                        <div class="relative w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all after:shadow-sm peer-checked:bg-orange-600 transition-colors"></div>
                        <span class="ms-2 text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors hidden sm:inline">在庫ゼロ非表示</span>
                        <span class="ms-2 text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors sm:hidden">ゼロ隠す</span>
                    </label>
                </div>
            </div>

            <!-- Empty State -->
            <div v-if="requestFilteredItems.length === 0" class="text-center py-20">
                <div class="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <p class="text-slate-500 font-bold">該当するフレーバーがありません</p>
            </div>

            <!-- Item Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div v-for="item in requestFilteredItems" :key="item.id"
                    class="bg-white p-5 rounded-2xl shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col gap-4 transition-transform duration-200 hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] hover:-translate-y-0.5">

                    <!-- Header -->
                    <div class="flex justify-between items-start">
                        <div class="pr-2">
                            <span class="inline-block bg-orange-50 text-orange-600 border border-orange-100/50 text-[10px] font-bold px-2.5 py-1 rounded-full mb-1.5 shadow-sm">{{ item.brand }}</span>
                            <h3 class="text-lg font-bold text-slate-800 leading-snug">{{ item.flavor }}</h3>
                        </div>
                        <div class="flex-shrink-0">
                            <div class="grid grid-cols-[auto_auto] items-end gap-x-2">
                                <div class="min-w-[3.5rem] flex flex-col items-center text-center">
                                    <div class="text-[10px] font-bold text-slate-400 tracking-wide mb-0.5">前月消費</div>
                                    <div class="text-sm font-semibold text-slate-500 tabular-nums leading-tight">
                                        {{ formatRequestPrevMonthCons(item) }}
                                    </div>
                                </div>
                                <div class="flex flex-col items-center text-center">
                                    <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-0.5">{{ requestCurrentStoreLabel }}在庫</div>
                                    <div class="text-2xl font-bold bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 inline-flex items-center justify-center" :class="getStockColorClass(item.stock[requestStoreKey])">
                                        <span v-if="item.stock[requestStoreKey] < 500" class="inline-flex items-center justify-center w-5 h-5 bg-red-100 text-red-600 rounded-full text-[10px] mr-1">!</span>
                                        {{ Number(item.stock[requestStoreKey]) || 0 }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Other Stocks -->
                    <div class="grid grid-cols-3 gap-3">
                        <div v-for="storeCode in requestOtherStoreKeys" :key="storeCode" class="text-center rounded-xl py-2 px-1 border" :class="getOtherStockStyle(item, storeCode)">
                            <div class="text-[10px] text-slate-400 font-bold mb-0.5">{{ requestStoreLabel(storeCode) }}</div>
                            <div class="text-sm">{{ Number(item.stock[storeCode]) || 0 }}</div>
                        </div>
                    </div>

                    <!-- Input & Checkboxes -->
                    <div class="pt-2 border-t border-slate-50 mt-1">
                        <div class="flex flex-col sm:flex-row sm:items-end gap-3">
                            <div class="relative flex-1">
                                <label class="block text-[10px] font-bold text-slate-400 tracking-wider mb-1.5 ml-1">移動量 (g)</label>
                                <input type="number" min="0"
                                    class="w-full text-xl font-bold p-3 pl-4 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all shadow-sm text-center bg-white text-slate-800 placeholder-slate-200"
                                    placeholder="0" :value="getOrderAmount(item.id)" @input="updateOrderAmount(item.id, $event.target.value)">
                            </div>
                            <div class="flex flex-col shrink-0 sm:min-w-[11rem]">
                                <div class="block text-[10px] font-bold text-slate-400 tracking-wider mb-1.5 ml-1">依頼先</div>
                                <div class="flex gap-2">
                                    <label v-for="reqStore in requestTargetStores" :key="reqStore" class="cursor-pointer group relative">
                                        <input type="checkbox" class="peer sr-only" :checked="isOrderTargetChecked(item.id, reqStore)" @change="handleRequestSourceToggle(item.id, reqStore, $event.target.checked)">
                                        <div class="w-12 h-12 rounded-xl border-2 border-slate-100 bg-white flex items-center justify-center text-xs font-bold text-slate-400 transition-all peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-checked:text-orange-600 group-hover:bg-slate-50 peer-checked:shadow-md">
                                            {{ requestStoreLabel(reqStore) }}
                                        </div>
                                        <div class="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white opacity-0 peer-checked:opacity-100 transition-all"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Alert -->
                    <div v-if="isOrderExceedingStock(item.id)" class="mt-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 animate-pulse">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                        <span>在庫が不足しています</span>
                    </div>
                </div>
            </div>

            <div class="h-24"></div>
        </div>

        <!-- Request Review Modal -->
        <div v-if="showRequestModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col transform ring-1 ring-black/5">
                <div class="p-5 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 class="text-xl font-bold text-slate-800">依頼リスト確認</h2>
                        <p class="text-xs text-slate-500 mt-1">コピーして送信してください</p>
                    </div>
                    <button @click="showRequestModal = false"
                        class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition">
                        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div class="p-5 overflow-y-auto flex-1 text-sm space-y-8 bg-slate-50/50">
                    <div v-if="requestGeneratedSections.length === 0" class="text-center py-12">
                        <p class="text-slate-500 font-bold">依頼対象の商品がありません</p>
                    </div>

                    <div v-for="section in requestGeneratedSections" :key="section.title"
                        class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6">
                        <div class="flex justify-between items-center mb-4">
                            <div class="flex items-center gap-3">
                                <span class="w-3 h-3 rounded-full" :class="section.badgeColor"></span>
                                <h3 class="font-bold text-lg text-slate-800">{{ section.title }}</h3>
                            </div>
                            <button @click="copyRequestText(section.fullText, section.title)"
                                :class="copiedSection === section.title ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'"
                                class="flex items-center gap-2 font-bold py-2 px-4 rounded-lg text-xs transition-all">
                                <span v-if="copiedSection === section.title">完了</span>
                                <span v-else>コピー</span>
                                <svg v-if="copiedSection !== section.title" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                                </svg>
                                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </button>
                        </div>
                        <pre class="whitespace-pre-wrap text-slate-600 bg-slate-50 p-4 rounded-xl text-sm border border-slate-100 font-mono leading-relaxed transition-colors">{{ section.fullText }}</pre>
                    </div>
                </div>
            </div>
        </div>

        <!-- Notification Toast -->
        <div :class="toastVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'"
            class="fixed top-6 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-xl shadow-slate-900/20 z-[60] transition-all duration-300 pointer-events-none flex items-center gap-2 font-bold">
            <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>コピーしました！</span>
        </div>
    </div>
</template>

<script>
import { getInventoryData } from '../../api.js'

export default {
    name: 'RequestApp',
    props: {
        currentStep: { type: Number, required: true },
        selectedBrand: { type: String, default: null }
    },
    emits: [
        'update:currentStep',
        'update:loading',
        'update:loadingMessage',
        'update:brands',
        'update:totalQty'
    ],
    data() {
        return {
            requestStoreKey: '',
            requestMonth: '',
            requestMonths: Array.from({ length: 12 }, (_, i) => ({ val: i + 1, label: `${i + 1}月` })),
            requestItems: [],
            requestOrderState: {},
            requestHideZero: false,
            showRequestModal: false,
            requestGeneratedSections: [],
            toastVisible: false,
            copiedSection: null,
            requestBrands: [],
            errorMessage: ''
        }
    },
    computed: {
        requestOtherStoreKeys() {
            return ['office', 'baba_main', 'nakano', 'baba_2nd'].filter(k => k !== this.requestStoreKey)
        },
        requestTargetStores() {
            return ['office', 'baba_main', 'nakano', 'baba_2nd'].filter(k => k !== this.requestStoreKey)
        },
        requestCurrentStoreLabel() {
            return this.requestStoreLabel(this.requestStoreKey)
        },
        requestFilteredItems() {
            return this.requestItems.filter(item => {
                if (this.selectedBrand && item.brand !== this.selectedBrand) return false
                if (this.requestHideZero) {
                    const allZero = (item.stock.office === 0 && item.stock.baba_main === 0 && item.stock.nakano === 0 && item.stock.baba_2nd === 0)
                    if (allZero) return false
                }
                return true
            })
        },
        requestTotalQty() {
            return Object.values(this.requestOrderState).reduce((s, st) => s + (st.amount || 0), 0)
        }
    },
    watch: {
        requestTotalQty(newVal) {
            this.$emit('update:totalQty', newVal)
        }
    },
    methods: {
        async startRequest() {
            this.errorMessage = ''
            this.$emit('update:loadingMessage', 'データを取得中...')
            this.$emit('update:loading', true)
            this.requestItems = []
            this.requestOrderState = {}

            try {
                // requestMonth is the month value (1-12)
                const data = await getInventoryData(this.requestMonth)
                this.requestItems = data.filter(i => i.appDisplay !== false)
                data.forEach(item => {
                    const state = { amount: 0 }
                    if (this.requestTargetStores.includes('office')) state.officeRequest = true
                    this.requestOrderState[item.id] = state
                })
                
                const seen = new Set()
                this.requestBrands = this.requestItems.map(i => i.brand).filter(b => b && !seen.has(b) && seen.add(b))
                this.$emit('update:brands', this.requestBrands)
                this.$emit('update:currentStep', 1)
            } catch (e) {
                this.errorMessage = e.message || 'データの取得に失敗しました。'
            } finally {
                this.$emit('update:loading', false)
            }
        },
        requestStoreLabel(key) {
            return { office: '事務所', baba_main: '本店', nakano: '中野', baba_2nd: '2号店' }[key] || key
        },
        formatRequestPrevMonthCons(item) {
            const pmc = item.prevMonthConsumption
            if (!pmc || !this.requestStoreKey) return '—'
            const n = Number(pmc[this.requestStoreKey])
            if (!Number.isFinite(n)) return '—'
            return String(Math.round(n))
        },
        getStockColorClass(val) {
            const n = Number(val) || 0
            if (n < 500) return 'text-red-600 font-black'
            if (n < 1000) return 'text-red-500 font-bold'
            return 'text-slate-700'
        },
        getOtherStockStyle(item, storeCode) {
            const val = Number(item.stock[storeCode]) || 0
            const max = Math.max(Number(item.stock.office) || 0, Number(item.stock.baba_main) || 0, Number(item.stock.nakano) || 0)
            if (max > 0 && val === max) return 'bg-emerald-50 text-emerald-700 font-bold border-emerald-100 ring-1 ring-emerald-100/50'
            return 'bg-slate-50 text-slate-600 font-medium border-slate-100'
        },
        getOrderAmount(id) {
            return this.requestOrderState[id] ? this.requestOrderState[id].amount || '' : ''
        },
        updateOrderAmount(id, val) {
            const num = parseInt(val, 10)
            if (!this.requestOrderState[id]) {
                const s = { amount: 0 }
                if (this.requestTargetStores.includes('office')) s.officeRequest = true
                this.requestOrderState[id] = s
            }
            this.requestOrderState[id].amount = isNaN(num) ? 0 : num
        },
        isOrderTargetChecked(id, key) {
            return this.requestOrderState[id] ? this.requestOrderState[id][`${key}Request`] || false : false
        },
        handleRequestSourceToggle(id, key, checked) {
            if (!this.requestOrderState[id]) {
                const s = { amount: 0 }
                if (this.requestTargetStores.includes('office')) s.officeRequest = true
                this.requestOrderState[id] = s
            }
            const state = this.requestOrderState[id]
            state[`${key}Request`] = checked
            if (checked) {
                this.requestTargetStores.forEach(k => { if (k !== key) state[`${k}Request`] = false })
            }
        },
        isOrderExceedingStock(id) {
            const state = this.requestOrderState[id]
            if (!state || state.amount <= 0) return false
            const item = this.requestItems.find(d => String(d.id) === String(id))
            if (!item) return false
            
            let isError = false, hasChecked = false
            for (const k of this.requestTargetStores) {
                if (state[`${k}Request`]) { 
                    hasChecked = true
                    if (state.amount > (item.stock[k] || 0)) isError = true 
                }
            }
            if (!hasChecked && state.amount > (item.stock.office || 0)) isError = true
            return isError
        },
        openRequestReviewModal() {
            const storeItems = { office: [], baba_main: [], nakano: [], baba_2nd: [] }
            Object.keys(this.requestOrderState).forEach(id => {
                const s = this.requestOrderState[id]
                if (s.amount <= 0) return
                const item = this.requestItems.find(d => String(d.id) === String(id))
                if (!item) return
                const entry = { brand: item.brand, flavor: item.flavor, amount: s.amount }
                
                let assigned = false
                Object.keys(storeItems).forEach(k => { 
                    if (s[`${k}Request`]) { storeItems[k].push(entry); assigned = true } 
                })
                if (!assigned) storeItems['office'].push(entry)
            })

            this.requestGeneratedSections = []
            const colors = { office: 'bg-slate-400', baba_main: 'bg-red-500', nakano: 'bg-green-500', baba_2nd: 'bg-orange-500' }
            
            Object.keys(storeItems).forEach(k => {
                const items = storeItems[k]
                if (items.length > 0) {
                    const from = this.requestStoreLabel(k), to = this.requestStoreLabel(this.requestStoreKey)
                    const grouped = {}
                    items.forEach(i => { 
                        const b = i.brand || 'Other'
                        if (!grouped[b]) grouped[b] = []
                        grouped[b].push(i) 
                    })
                    
                    let body = ''
                    Object.keys(grouped).forEach((b, idx) => {
                        body += `・${b} \n`
                        grouped[b].forEach(i => { body += `${i.flavor} ${i.amount} \n` })
                        if (idx < Object.keys(grouped).length - 1) body += '\n'
                    })
                    this.requestGeneratedSections.push({ 
                        title: `${from} への依頼`, 
                        badgeColor: colors[k] || 'bg-slate-400', 
                        fullText: `${from}から${to} への補充依頼です。\n\n${body}` 
                    })
                }
            })
            this.showRequestModal = true
        },
        async copyRequestText(text, title) {
            try {
                await navigator.clipboard.writeText(text)
                this.copiedSection = title; this.toastVisible = true
                setTimeout(() => { if (this.copiedSection === title) this.copiedSection = null }, 2000)
                setTimeout(() => { this.toastVisible = false }, 2000)
            } catch { 
                alert('コピーに失敗しました。') 
            }
        }
    }
}
</script>
