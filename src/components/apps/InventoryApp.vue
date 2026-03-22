<template>
    <div :style="inventoryFooterClearanceStyle">
        <!-- Inventory Step 0: Setup -->
        <transition name="slide-up">
            <div v-if="currentStep === 0" class="flex flex-col items-center pt-6 pb-20">
                <div
                    class="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 w-full max-w-md text-center">
                    <h2 class="text-xl font-bold text-slate-700 mb-8">棚卸しを開始</h2>

                    <div v-if="errorMessage"
                        class="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl text-left shadow-sm animate-pulse">
                        <div class="flex items-start gap-3">
                            <svg class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z">
                                </path>
                            </svg>
                            <div>
                                <h3 class="text-sm font-bold text-red-800">アクセスエラー</h3>
                                <p class="text-xs text-red-600 mt-1">{{ errorMessage }}</p>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-6 text-left">
                        <div>
                            <label
                                class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">対象店舗</label>
                            <div class="relative">
                                <select :value="storeKey" @input="$emit('update:storeKey', $event.target.value)"
                                    :class="storeKey ? 'text-slate-800' : 'text-slate-500'"
                                    class="appearance-none w-full bg-slate-50 border border-slate-200 text-lg font-bold rounded-xl focus:ring-2 focus:ring-brand-500 block p-4 text-center cursor-pointer">
                                    <option value="" disabled>店舗を選択してください</option>
                                    <option v-for="store in stores" :value="store.key" :key="store.key" class="text-slate-800">{{
                                        store.name }}</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label
                                class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">対象月</label>
                            <div class="relative">
                                <select :value="month" @input="$emit('update:month', $event.target.value)"
                                    :class="month ? 'text-slate-800' : 'text-slate-500'"
                                    class="appearance-none w-full bg-slate-50 border border-slate-200 text-lg font-bold rounded-xl focus:ring-2 focus:ring-brand-500 block p-4 text-center">
                                    <option value="" disabled>実施月を選択してください</option>
                                    <option v-for="m in months" :value="m" :key="m" class="text-slate-800">{{ m }}</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label
                                class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">実施日</label>
                            <input type="date" :value="date" @input="$emit('update:date', $event.target.value)"
                                :class="date ? 'text-slate-800' : 'text-slate-500'"
                                class="w-full bg-slate-50 border border-slate-200 text-lg font-bold rounded-xl focus:ring-2 focus:ring-brand-500 block p-4 text-center">
                        </div>
                    </div>

                    <button @click="showInventoryStartModal = true" :disabled="!storeKey || !month || !date"
                        class="mt-10 w-full bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold py-4 rounded-full shadow-lg shadow-brand-500/30 transition-all transform active:scale-95 disabled:opacity-50">
                        入力を開始する
                    </button>
                </div>
            </div>
        </transition>

        <!-- Inventory Step 1: Tupper -->
        <div v-if="currentStep === 1" class="space-y-4">
            <div
                class="sticky top-16 z-20 -mx-4 px-4 py-2.5 mb-2 flex items-center gap-2 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200/80 shadow-sm">
                <h2 class="text-lg font-bold text-slate-800">タッパー</h2>
                <span class="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-center">単位:
                    g</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div v-for="item in filteredItems" :key="item.rowIndex"
                    class="p-3 rounded-xl shadow-sm border border-slate-100"
                    :class="item.brandIndex % 2 === 0 ? 'bg-white' : 'bg-slate-100'">
                    <div class="mb-2 text-slate-800 border-b border-slate-200/50 pb-1.5">
                        <span
                            class="inline-block bg-brand-50 text-brand-600 border border-brand-100/50 text-[9px] font-bold px-1.5 py-0.5 rounded-full mb-0.5 leading-none">{{
                            item.brand }}</span>
                        <div class="font-bold text-base leading-tight">{{ item.flavorName || item.flavor || item.name }}</div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label
                                class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">タッパー1</label>
                            <input type="number" v-model.number="item.tupper.basic"
                                class="w-full bg-slate-50 border border-slate-200 text-slate-800 text-lg font-bold rounded-lg p-2 text-center focus:ring-2 focus:ring-brand-500 focus:outline-none placeholder-slate-300"
                                placeholder="0">
                        </div>
                        <div>
                            <label
                                class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">タッパー2</label>
                            <input type="number" v-model.number="item.tupper.reserve"
                                class="w-full bg-slate-50 border border-slate-200 text-slate-800 text-lg font-bold rounded-lg p-2 text-center focus:ring-2 focus:ring-brand-500 focus:outline-none placeholder-slate-300"
                                placeholder="0">
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Inventory Step 2: Merch -->
        <div v-if="currentStep === 2" class="space-y-4">
            <div
                class="sticky top-16 z-20 -mx-4 px-4 py-2.5 mb-2 flex items-center gap-2 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200/80 shadow-sm">
                <h2 class="text-lg font-bold text-slate-800">物販</h2>
                <span class="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-center">単位:
                    個</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div v-for="item in filteredItems" :key="item.rowIndex"
                    class="p-3 rounded-xl shadow-sm border border-slate-100"
                    :class="item.brandIndex % 2 === 0 ? 'bg-white' : 'bg-slate-100'">
                    <div class="mb-2 text-slate-800 border-b border-slate-200/50 pb-1.5">
                        <span
                            class="inline-block bg-brand-50 text-brand-600 border border-brand-100/50 text-[9px] font-bold px-1.5 py-0.5 rounded-full mb-0.5 leading-none">{{
                            item.brand }}</span>
                        <div class="font-bold text-base leading-tight">{{ item.flavorName || item.flavor || item.name }}</div>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <div v-for="size in ['50','100','125','200','250','1kg']" :key="size">
                            <label
                                class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 block text-center">{{size}}</label>
                            <input type="number" v-model.number="item.merch['val'+size]"
                                class="w-full bg-slate-50 border border-slate-200 text-slate-800 text-base font-bold rounded-lg p-1.5 text-center focus:ring-2 focus:ring-pink-500 focus:outline-none placeholder-slate-300"
                                placeholder="0">
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Inventory Step 3: Flavor -->
        <div v-if="currentStep === 3" class="space-y-4">
            <div
                class="sticky top-16 z-20 -mx-4 px-4 py-2.5 mb-2 flex items-center gap-2 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200/80 shadow-sm">
                <h2 class="text-lg font-bold text-slate-800">在庫</h2>
                <span class="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-center">単位:
                    個</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div v-for="item in filteredItems" :key="item.rowIndex"
                    class="p-3 rounded-xl shadow-sm border border-slate-100"
                    :class="item.brandIndex % 2 === 0 ? 'bg-white' : 'bg-slate-100'">
                    <div class="mb-2 text-slate-800 border-b border-slate-200/50 pb-1.5">
                        <span
                            class="inline-block bg-brand-50 text-brand-600 border border-brand-100/50 text-[9px] font-bold px-1.5 py-0.5 rounded-full mb-0.5 leading-none">{{
                            item.brand }}</span>
                        <div class="font-bold text-base leading-tight">{{ item.flavorName || item.flavor || item.name }}</div>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <div v-for="size in ['50','100','125','200','250','1kg']" :key="size">
                            <label
                                class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 block text-center">{{size}}</label>
                            <input type="number" v-model.number="item.flavor['val'+size]"
                                class="w-full bg-slate-50 border border-slate-200 text-slate-800 text-base font-bold rounded-lg p-1.5 text-center focus:ring-2 focus:ring-yellow-500 focus:outline-none placeholder-slate-300"
                                placeholder="0">
                        </div>
                        <div class="col-span-3">
                            <label
                                class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 block">その他</label>
                            <input type="number" v-model.number="item.flavor.valOther"
                                class="w-full bg-slate-50 border border-slate-200 text-slate-800 text-base font-bold rounded-lg p-1.5 text-center focus:ring-2 focus:ring-yellow-500 focus:outline-none placeholder-slate-300"
                                placeholder="0">
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Inventory Step 4: Confirmation -->
        <div v-if="currentStep === 4" class="space-y-4">
            <div
                class="sticky top-16 z-20 -mx-4 px-4 py-2.5 mb-2 flex items-center gap-2 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200/80 shadow-sm">
                <h2 class="text-lg font-bold text-slate-800">入力内容確認</h2>
                <template v-if="isCheckingConsumption">
                    <div class="w-4 h-4 border-2 border-slate-300 border-t-brand-500 rounded-full animate-spin ml-1 flex-shrink-0"></div>
                    <span class="text-[11px] text-slate-500 font-medium">消費量チェック中...</span>
                </template>
            </div>

            <!-- Negative consumption warning banner -->
            <div v-if="previewNegativeItems.length > 0"
                class="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <div class="w-full">
                        <h3 class="text-sm font-bold text-amber-800">前月消費量がマイナスになるフレーバーがあります</h3>
                        <ul class="mt-2 space-y-1">
                            <li v-for="item in previewNegativeItems" :key="item.name"
                                class="flex justify-between text-xs font-bold">
                                <span class="text-amber-700">・{{ item.name }}</span>
                                <span class="ml-4 text-red-600 tabular-nums">{{ item.amount }} g</span>
                            </li>
                        </ul>
                        <p class="text-xs text-amber-600 mt-2">送信前に数値を確認してください。このまま送信することも可能です。</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div class="overflow-x-auto max-h-[70vh]">
                    <table class="w-full text-left border-collapse text-xs">
                        <thead class="bg-slate-50 sticky top-0 z-10 shadow-sm font-bold text-slate-500">
                            <tr>
                                <th class="p-2 whitespace-nowrap">銘柄/フレーバー</th>
                                <th v-if="storeKey !== 'office'" class="p-2 whitespace-nowrap text-center w-20">タッパー
                                </th>
                                <th v-if="storeKey !== 'office'" class="p-2 whitespace-nowrap text-center">物販</th>
                                <th class="p-2 whitespace-nowrap text-center">在庫</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-for="item in items" :key="item.rowIndex" class="hover:bg-slate-50/50">
                                <td class="p-2 align-middle">
                                    <div class="text-[10px] text-brand-600 font-bold leading-none mb-0.5">{{
                                        item.brand }}</div>
                                    <div class="text-sm text-slate-800 font-bold leading-tight">{{ item.flavorName || item.flavor || item.name
                                        }}</div>
                                </td>
                                <td v-if="storeKey !== 'office'" class="p-2 align-middle text-center">
                                    <div v-if="isValid(item.tupper.basic) || isValid(item.tupper.reserve)"
                                        class="inline-flex flex-col text-[10px] leading-tight">
                                        <span v-if="isValid(item.tupper.basic)"
                                            class="bg-slate-100 px-1 rounded mb-0.5">基:{{item.tupper.basic}}</span>
                                        <span v-if="isValid(item.tupper.reserve)"
                                            class="bg-slate-100 px-1 rounded">予:{{item.tupper.reserve}}</span>
                                    </div>
                                    <span v-else class="text-slate-300">-</span>
                                </td>
                                <td v-if="storeKey !== 'office'" class="p-2 align-middle text-center max-w-[120px]">
                                    <div v-if="hasValues(item.merch)"
                                        class="text-[10px] leading-tight bg-pink-50 text-pink-700 px-1.5 py-1 rounded break-words">
                                        {{ formatValues(item.merch) }}
                                    </div>
                                    <span v-else class="text-slate-300">-</span>
                                </td>
                                <td class="p-2 align-middle text-center max-w-[120px]">
                                    <div v-if="hasValues(item.flavor)"
                                        class="text-[10px] leading-tight bg-yellow-50 text-yellow-700 px-1.5 py-1 rounded break-words">
                                        {{ formatValues(item.flavor) }}
                                    </div>
                                    <span v-else class="text-slate-300">-</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Submit Confirm Modal -->
        <div v-if="showSubmitConfirmModal"
            class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
                class="bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col transform ring-1 ring-black/5 overflow-hidden">
                <div class="px-6 pt-8 pb-6 text-center">
                    <div
                        class="w-16 h-16 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z">
                            </path>
                        </svg>
                    </div>
                    <h2 class="text-xl font-bold text-slate-800 mb-2">データを送信します</h2>
                    <p class="text-slate-500 text-sm">よろしいですか？</p>
                </div>
                <div class="flex border-t border-slate-100">
                    <button @click="showSubmitConfirmModal = false"
                        class="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 transition-colors">
                        キャンセル
                    </button>
                    <div class="w-px bg-slate-100"></div>
                    <button @click="doSubmit"
                        class="flex-1 py-4 text-brand-600 font-bold hover:bg-brand-50 transition-colors">
                        送信する
                    </button>
                </div>
            </div>
        </div>

        <!-- Inventory Start Confirm Modal -->
        <div v-if="showInventoryStartModal"
            class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
                class="bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col transform ring-1 ring-black/5 overflow-hidden">
                <div class="px-6 pt-8 pb-6 text-center">
                    <div
                        class="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z">
                            </path>
                        </svg>
                    </div>
                    <h2 class="text-xl font-bold text-slate-800 mb-2">店舗の確認</h2>
                    <p class="text-slate-500 text-sm mb-6">以下の店舗の棚卸しを開始します。<br>よろしいですか？</p>

                    <div class="bg-slate-50 rounded-2xl py-4 px-2 border border-slate-100 mb-2">
                        <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">選択中の店舗</div>
                        <div class="text-3xl font-black text-brand-600 tracking-tight">{{ currentStoreName }}</div>
                    </div>
                </div>

                <div class="flex border-t border-slate-100">
                    <button @click="showInventoryStartModal = false"
                        class="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 transition-colors">
                        キャンセル
                    </button>
                    <div class="w-px bg-slate-100"></div>
                    <button @click="confirmStartInventory"
                        class="flex-1 py-4 text-brand-600 font-bold hover:bg-brand-50 transition-colors">
                        開始する
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { getSheetData, submitData, checkNegativeConsumption } from '../../api.js'

export default {
    name: 'InventoryApp',
    inject: ['requestConfirm'],
    props: {
        currentStep: { type: Number, required: true },
        storeKey: { type: String, required: true },
        month: { type: String, required: true },
        date: { type: String, required: true },
        stores: { type: Array, required: true },
        months: { type: Array, required: true },
        selectedBrand: { type: String, default: null }
    },
    emits: [
        'update:currentStep',
        'update:storeKey',
        'update:month',
        'update:date',
        'update:loading',
        'update:loadingMessage',
        'update:brands',
        'update:hasData',
        'update:checkingConsumption'
    ],
    data() {
        return {
            showInventoryStartModal: false,
            showSubmitConfirmModal: false,
            items: [],
            errorMessage: '',
            previewNegativeItems: [],
            isCheckingConsumption: false
        }
    },
    watch: {
        async currentStep(newVal) {
            if (newVal !== 4) return
            const payload = {
                storeKey: this.storeKey,
                sheetName: this.month,
                date: this.date,
                items: this.items
            }
            this.isCheckingConsumption = true
            this.$emit('update:checkingConsumption', true)
            this.previewNegativeItems = []
            try {
                const res = await checkNegativeConsumption(payload)
                this.previewNegativeItems = res.negativeConsumptionItems || []
            } catch {
                this.previewNegativeItems = []
            } finally {
                this.isCheckingConsumption = false
                this.$emit('update:checkingConsumption', false)
            }
        }
    },
    computed: {
        currentStoreName() {
            const s = this.stores.find(x => x.key === this.storeKey)
            return s ? s.name : ''
        },
        filteredItems() {
            if (!this.selectedBrand) return this.items
            return this.items.filter(i => i.brand === this.selectedBrand)
        },
        /** 固定フッター（戻る／次へ）と最下段カードの重なりを防ぐ */
        inventoryFooterClearanceStyle() {
            if (this.currentStep < 1 || this.currentStep > 4) return {}
            return {
                paddingBottom: 'calc(7.5rem + env(safe-area-inset-bottom, 0px))'
            }
        }
    },
    beforeUnmount() {
        if (this.storeKey && this.month && this.items.length > 0 && this.currentStep > 0) {
            this.saveLocally()
        }
    },
    methods: {
        async confirmStartInventory() {
            this.showInventoryStartModal = false
            await this.loadInventoryData()
        },
        async loadInventoryData() {
            this.errorMessage = ''
            this.$emit('update:loadingMessage', 'データ読み込み中...')
            this.$emit('update:loading', true)
            this.$emit('update:hasData', false)

            const savedKey = 'inventory_draft_' + this.storeKey + '_' + this.month
            const saved = localStorage.getItem(savedKey)
            if (saved) {
                const parsed = JSON.parse(saved)
                if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
                    const ok = await this.requestConfirm('保存されたデータが見つかりました。\n復元しますか？', '復元する', 'text-brand-600 hover:bg-brand-50')
                    if (ok) {
                        this.items = parsed.items
                        if (parsed.date) this.$emit('update:date', parsed.date)
                        const seen = new Set()
                        const brands = this.items.map(i => i.brand).filter(b => b && !seen.has(b) && seen.add(b))
                        this.$emit('update:brands', brands)
                        this.$emit('update:hasData', true)
                        this.$emit('update:currentStep', this.storeKey === 'office' ? 3 : 1)
                        this.$emit('update:loading', false)
                        return
                    }
                } else {
                    localStorage.removeItem(savedKey)
                }
            }

            try {
                const response = await getSheetData(this.storeKey, this.month)
                this.items = response.items.map(i => ({
                    ...i,
                    flavorName: i.flavorName || i.flavor || i.name || '',
                    tupper: i.tupper || { basic: '', reserve: '' },
                    merch: i.merch || { val50: '', val100: '', val125: '', val200: '', val250: '', val1kg: '' },
                    flavor: (i.flavor && typeof i.flavor === 'object') ? i.flavor : { val50: '', val100: '', val125: '', val200: '', val250: '', val1kg: '', valOther: '' }
                }))
                if (response.date && !this.date) this.$emit('update:date', response.date)
                const seen = new Set()
                const brands = this.items.map(i => i.brand).filter(b => b && !seen.has(b) && seen.add(b))
                this.$emit('update:brands', brands)
                this.$emit('update:hasData', this.items.length > 0)
                this.$emit('update:currentStep', this.storeKey === 'office' ? 3 : 1)
            } catch (e) {
                this.errorMessage = e.message || 'データの取得に失敗しました。'
            } finally {
                this.$emit('update:loading', false)
            }
        },
        submitInventory() {
            if (this.isCheckingConsumption) return
            this.showSubmitConfirmModal = true
        },
        async doSubmit() {
            this.showSubmitConfirmModal = false
            this.$emit('update:loadingMessage', 'スプレッドシートに書き込み中...')
            this.$emit('update:loading', true)
            try {
                const payload = {
                    storeKey: this.storeKey,
                    sheetName: this.month,
                    date: this.date,
                    items: this.items
                }
                const result = await submitData(payload)
                if (result.success) {
                    if (result.negativeConsumptionItems && result.negativeConsumptionItems.length > 0) {
                        alert(`【警告】以下のフレーバーの前月消費量がマイナスになっています：\n\n・${result.negativeConsumptionItems.join('\n・')}\n\n確認してください。`)
                    } else {
                        alert('送信が完了しました。')
                    }
                    localStorage.removeItem('inventory_draft_' + this.storeKey + '_' + this.month)
                    this.items = []
                    this.previewNegativeItems = []
                    this.$emit('update:storeKey', '')
                    this.$emit('update:month', '')
                    this.$emit('update:date', '')
                    this.$emit('update:brands', [])
                    this.$emit('update:hasData', false)
                    this.$emit('update:currentStep', 0)
                } else {
                    throw new Error(result.error || '不明なエラー')
                }
            } catch (error) {
                this.errorMessage = 'エラーが発生しました: ' + error.message
            } finally {
                this.$emit('update:loading', false)
            }
        },
        saveLocally() {
            localStorage.setItem('inventory_draft_' + this.storeKey + '_' + this.month, JSON.stringify({ items: this.items, date: this.date, timestamp: Date.now() }))
        },
        isValid(val) { return val !== null && val !== "" && !isNaN(val) },
        hasValues(obj) { return Object.values(obj).some(val => this.isValid(val)) },
        formatValues(obj) {
            return Object.entries(obj)
                .filter(([_, val]) => this.isValid(val))
                .map(([key, val]) => `${key.replace('val', '')}:${val}`)
                .join(' / ')
        }
    }
}
</script>
