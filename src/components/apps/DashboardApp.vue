<template>
    <main class="container mx-auto px-4 pt-0 pb-6 max-w-lg md:max-w-7xl transition-all duration-300 flex-grow">
        <transition name="slide-up">
            <div class="space-y-4 mt-2">
                <div v-if="!activeSubMode" class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                    <div class="text-center space-y-2">
                        <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Dashboard</div>
                        <h2 class="text-xl font-bold text-slate-800">何を確認しますか？</h2>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            v-for="mode in dashboardModes"
                            :key="mode.key"
                            type="button"
                            @click="selectSubMode(mode.key)"
                            class="text-left rounded-2xl border border-slate-200 bg-slate-50 hover:bg-red-50 hover:border-red-200 p-5 transition-colors">
                            <div class="text-base font-bold text-slate-800">{{ mode.label }}</div>
                            <div class="mt-2 text-sm text-slate-500">{{ mode.description }}</div>
                        </button>
                    </div>
                </div>

                <template v-else>
                    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                        <div class="flex items-center justify-between gap-4">
                            <div>
                                <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">サブモード</div>
                                <div class="text-lg font-bold text-slate-800">{{ activeSubModeLabel }}</div>
                            </div>
                            <button
                                type="button"
                                @click="goBackToSelection"
                                class="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-colors">
                                選択に戻る
                            </button>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">対象月</label>
                            <div class="grid grid-cols-2 gap-3">
                                <select v-model="dashboardYear"
                                    :class="dashboardYear ? 'text-slate-800' : 'text-slate-500'"
                                    class="appearance-none w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl focus:ring-2 focus:ring-red-500 block p-4 text-center">
                                    <option value="" disabled>年を選択</option>
                                    <option v-for="y in years" :key="y.value" :value="y.value" class="text-slate-800">{{ y.label }}</option>
                                </select>
                                <select v-model="dashboardMonthPart"
                                    :class="dashboardMonth ? 'text-slate-800' : 'text-slate-500'"
                                    class="appearance-none w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl focus:ring-2 focus:ring-red-500 block p-4 text-center">
                                    <option value="" disabled>月を選択</option>
                                    <option v-for="m in months" :key="m.value" :value="m.value" class="text-slate-800">{{ m.label }}</option>
                                </select>
                            </div>
                        </div>

                        <div v-if="activeSubMode === 'results'">
                            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">対象拠点</label>
                            <select v-model="selectedStoreKey"
                                class="appearance-none w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl focus:ring-2 focus:ring-red-500 block p-4 text-center text-slate-800">
                                <option v-for="store in stores" :key="store.key" :value="store.key">{{ store.name }}</option>
                            </select>
                        </div>
                    </div>
                </template>

                <div v-if="errorMessage" class="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-700 font-medium">
                    {{ errorMessage }}
                </div>

                <div v-if="activeSubMode === 'overview' && overviewItems.length > 0" class="space-y-4">
                    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                        <div class="flex flex-wrap gap-3">
                            <label class="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <input v-model="showStoreStocks" type="checkbox" class="rounded border-slate-300 text-red-600 focus:ring-red-500">
                                各拠点在庫
                            </label>
                            <label class="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <input v-model="showTotalStock" type="checkbox" class="rounded border-slate-300 text-red-600 focus:ring-red-500">
                                総在庫
                            </label>
                        </div>
                    </div>

                    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div class="overflow-auto max-h-[55vh]">
                            <table :class="['w-full text-sm border-separate border-spacing-0', overviewTableWidthClass]">
                                <thead class="sticky top-0 z-30">
                                    <tr>
                                        <th class="sticky left-0 z-40 bg-slate-50 text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase border-b border-slate-200 w-[25vw] min-w-[25vw] max-w-[25vw]">フレーバー</th>
                                        <th v-if="showStoreStocks" v-for="store in stores" :key="store.key" class="bg-slate-50 text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase border-b border-slate-200">
                                            {{ store.name }}
                                        </th>
                                        <th v-if="showTotalStock" class="bg-slate-50 text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase border-b border-slate-200">総在庫量</th>
                                        <th class="bg-slate-50 text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase border-b border-slate-200">前月消費量</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="item in filteredOverviewItems"
                                        :key="item.rowIndex"
                                        class="border-b border-slate-50 last:border-0 transition-colors"
                                        :class="item.totalStock <= 0 ? 'bg-red-50' : ''">
                                        <td class="sticky left-0 z-10 bg-white px-4 py-3 w-[25vw] min-w-[25vw] max-w-[25vw] align-top" :class="item.totalStock <= 0 ? 'bg-red-50' : 'bg-white'">
                                            <div class="text-[10px] font-bold text-slate-400 break-words whitespace-normal">{{ item.brand }}</div>
                                            <div class="font-bold text-slate-800 break-words whitespace-normal">{{ item.flavorName }}</div>
                                        </td>
                                        <td v-if="showStoreStocks" v-for="store in stores" :key="store.key" class="px-4 py-3 text-right">
                                            <span class="font-bold text-slate-700">{{ formatNumber(item.storeStocks[store.key]) }}</span>
                                            <span class="text-xs text-slate-400 ml-1">g</span>
                                        </td>
                                        <td v-if="showTotalStock" class="px-4 py-3 text-right">
                                            <span class="font-bold text-lg" :class="item.totalStock <= 0 ? 'text-red-600' : 'text-slate-800'">
                                                {{ formatNumber(item.totalStock) }}
                                            </span>
                                            <span class="text-xs text-slate-400 ml-1">g</span>
                                        </td>
                                        <td class="px-4 py-3 text-right">
                                            <span class="font-bold text-slate-600">{{ formatNumber(item.prevConsumption) }}</span>
                                            <span class="text-xs text-slate-400 ml-1">g</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div v-else-if="activeSubMode === 'results' && resultItems.length > 0">
                    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div class="overflow-auto max-h-[55vh]">
                            <table class="w-full min-w-[1200px] text-sm border-separate border-spacing-0">
                                <thead class="sticky top-0 z-30">
                                    <tr>
                                        <th class="sticky left-0 z-40 bg-slate-50 text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase border-b border-slate-200 w-[25vw] min-w-[25vw] max-w-[25vw]">フレーバー</th>
                                        <th class="bg-slate-50 text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase border-b border-slate-200">タッパー1</th>
                                        <th class="bg-slate-50 text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase border-b border-slate-200">タッパー2</th>
                                        <th class="bg-slate-50 text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase border-b border-slate-200">物販</th>
                                        <th class="bg-slate-50 text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase border-b border-slate-200">在庫</th>
                                        <th class="bg-slate-50 text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase border-b border-slate-200">当月棚卸し</th>
                                        <th class="bg-slate-50 text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase border-b border-slate-200">前月棚卸し</th>
                                        <th class="bg-slate-50 text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase border-b border-slate-200">当月移動量</th>
                                        <th class="bg-slate-50 text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase border-b border-slate-200">当月消費量</th>
                                        <th class="bg-slate-50 text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase border-b border-slate-200">前月消費量</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="item in filteredResultItems"
                                        :key="item.rowIndex"
                                        class="border-b border-slate-50 last:border-0">
                                        <td class="sticky left-0 z-10 bg-white px-4 py-3 w-[25vw] min-w-[25vw] max-w-[25vw] align-top">
                                            <div class="text-[10px] font-bold text-slate-400 break-words whitespace-normal">{{ item.brand }}</div>
                                            <div class="font-bold text-slate-800 break-words whitespace-normal">{{ item.flavorName }}</div>
                                        </td>
                                        <td class="px-4 py-3 text-right">
                                            <span class="font-bold text-slate-700">{{ formatNumber(item.tupperBasicStock) }}</span>
                                            <span class="text-xs text-slate-400 ml-1">g</span>
                                        </td>
                                        <td class="px-4 py-3 text-right">
                                            <span class="font-bold text-slate-700">{{ formatNumber(item.tupperReserveStock) }}</span>
                                            <span class="text-xs text-slate-400 ml-1">g</span>
                                        </td>
                                        <td class="px-4 py-3 text-right">
                                            <span class="font-bold text-slate-700">{{ formatNumber(item.merchStock) }}</span>
                                            <span class="text-xs text-slate-400 ml-1">g</span>
                                        </td>
                                        <td class="px-4 py-3 text-right">
                                            <span class="font-bold text-slate-700">{{ formatNumber(item.inventoryStock) }}</span>
                                            <span class="text-xs text-slate-400 ml-1">g</span>
                                        </td>
                                        <td class="px-4 py-3 text-right">
                                            <span class="font-bold text-slate-800">{{ formatNumber(item.currentTotal) }}</span>
                                            <span class="text-xs text-slate-400 ml-1">g</span>
                                        </td>
                                        <td class="px-4 py-3 text-right">
                                            <span class="font-bold text-slate-700">{{ formatNumber(item.prevTotal) }}</span>
                                            <span class="text-xs text-slate-400 ml-1">g</span>
                                        </td>
                                        <td class="px-4 py-3 text-right">
                                            <span class="font-bold text-slate-700">{{ formatNumber(item.transferAmount) }}</span>
                                            <span class="text-xs text-slate-400 ml-1">g</span>
                                        </td>
                                        <td class="px-4 py-3 text-right rounded-md" :class="getCurrentConsumptionCellClass(item.currentConsumption)">
                                            <span class="font-bold" :class="getCurrentConsumptionTextClass(item.currentConsumption)">{{ formatNumber(item.currentConsumption) }}</span>
                                            <span class="text-xs text-slate-400 ml-1">g</span>
                                        </td>
                                        <td class="px-4 py-3 text-right">
                                            <span class="font-bold text-slate-600">{{ formatNumber(item.prevConsumption) }}</span>
                                            <span class="text-xs text-slate-400 ml-1">g</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                <div v-else-if="activeSubMode && dashboardMonth && !isLoading" class="text-center py-12 text-slate-400 text-sm font-medium">
                    {{ activeSubMode === 'overview' ? '対象月のダッシュボードデータがありません' : '対象月・拠点の棚卸し結果がありません' }}
                </div>
                <div v-else-if="activeSubMode && !dashboardMonth" class="text-center py-12 text-slate-400 text-sm font-medium">
                    対象月を選択するとダッシュボードが表示されます
                </div>

                <div class="h-24"></div>
            </div>
        </transition>
    </main>
</template>

<script>
import { getDashboardStockOverview, getInventoryResultDetails, fetchLatestInventoryPeriodKey } from '../../api.js'
import { buildYearOptions, buildMonthOptions, composePeriodKey, parsePeriodKey, getNextPeriodKey, getCurrentPeriodKey } from '../../utils/periods.js'

export default {
    name: 'DashboardApp',
    props: {
        selectedBrand: {
            type: String,
            default: null
        },
        stores: {
            type: Array,
            default: () => []
        }
    },
    emits: ['update:loading', 'update:loadingMessage', 'update:brands', 'update:hasData', 'update:subModeActive'],
    data() {
        return {
            dashboardYear: '',
            dashboardMonthPart: '',
            activeSubMode: null,
            selectedStoreKey: 'office',
            showStoreStocks: true,
            showTotalStock: true,
            overviewItems: [],
            resultItems: [],
            errorMessage: '',
            isLoading: false
        }
    },
    computed: {
        dashboardMonth() {
            return composePeriodKey(this.dashboardYear, this.dashboardMonthPart)
        },
        years() {
            return buildYearOptions()
        },
        months() {
            return buildMonthOptions()
        },
        dashboardModes() {
            return [
                { key: 'overview', label: '在庫量', description: '総在庫量、各拠点在庫、前月消費量を確認します。' },
                { key: 'results', label: '棚卸し結果', description: '拠点ごとの棚卸し結果と関連指標を確認します。' }
            ]
        },
        activeSubModeLabel() {
            return this.dashboardModes.find((mode) => mode.key === this.activeSubMode)?.label || ''
        },
        filteredOverviewItems() {
            if (!this.selectedBrand) return this.overviewItems
            return this.overviewItems.filter((item) => item.brand === this.selectedBrand)
        },
        filteredResultItems() {
            if (!this.selectedBrand) return this.resultItems
            return this.resultItems.filter((item) => item.brand === this.selectedBrand)
        },
        overviewTableWidthClass() {
            return this.showStoreStocks ? 'min-w-[720px]' : 'min-w-full'
        }
    },
    watch: {
        dashboardMonth() {
            this.loadDashboardData()
        },
        selectedStoreKey() {
            if (this.activeSubMode === 'results') {
                this.loadDashboardData()
            }
        }
    },
    methods: {
        async selectSubMode(modeKey) {
            this.activeSubMode = modeKey
            this.$emit('update:subModeActive', true)
            const prevMonth = this.dashboardMonth
            await this.applyDashboardMonthDefault(modeKey)
            await this.$nextTick()
            if (this.dashboardMonth === prevMonth) {
                this.loadDashboardData()
            }
        },
        async applyDashboardMonthDefault(modeKey) {
            let periodKeyNum = null
            try {
                const latestInv = await fetchLatestInventoryPeriodKey()
                if (modeKey === 'overview') {
                    const base = latestInv ?? getCurrentPeriodKey()
                    periodKeyNum = getNextPeriodKey(base)
                } else {
                    periodKeyNum = latestInv ?? getCurrentPeriodKey()
                }
            } catch {
                periodKeyNum = modeKey === 'overview'
                    ? getNextPeriodKey(getCurrentPeriodKey())
                    : getCurrentPeriodKey()
            }
            const p = parsePeriodKey(periodKeyNum)
            if (p) {
                this.dashboardYear = String(p.year)
                this.dashboardMonthPart = String(p.month)
            }
        },
        goBackToSelection() {
            this.activeSubMode = null
            this.errorMessage = ''
            this.resetDataState()
            this.$emit('update:subModeActive', false)
            this.$emit('update:loading', false)
        },
        formatNumber(value) {
            return Number(value || 0).toLocaleString()
        },
        getCurrentConsumptionCellClass(value) {
            const num = Number(value || 0)
            if (this.selectedStoreKey === 'office') {
                return num !== 0 ? 'bg-red-50' : ''
            }
            if (num < 0) return 'bg-red-50'
            if (num >= 500) return 'bg-amber-50'
            return ''
        },
        getCurrentConsumptionTextClass(value) {
            const num = Number(value || 0)
            if (this.selectedStoreKey === 'office') {
                return num !== 0 ? 'text-red-600' : 'text-slate-700'
            }
            if (num < 0) return 'text-red-600'
            if (num >= 500) return 'text-amber-700'
            return 'text-slate-700'
        },
        updateBrandState(items) {
            const seen = new Set()
            const brands = items.map((item) => item.brand).filter((brand) => brand && !seen.has(brand) && seen.add(brand))
            this.$emit('update:brands', brands)
            this.$emit('update:hasData', items.length > 0)
        },
        resetDataState() {
            this.overviewItems = []
            this.resultItems = []
            this.$emit('update:hasData', false)
            this.$emit('update:brands', [])
        },
        async loadDashboardData() {
            if (!this.activeSubMode) {
                this.resetDataState()
                return
            }
            if (!this.dashboardMonth) {
                this.resetDataState()
                return
            }

            this.errorMessage = ''
            this.isLoading = true
            this.$emit('update:loading', true)
            this.$emit('update:loadingMessage', this.activeSubMode === 'overview'
                ? 'ダッシュボードデータを読み込み中...'
                : '棚卸し結果を読み込み中...')

            try {
                if (this.activeSubMode === 'overview') {
                    this.resultItems = []
                    const data = await getDashboardStockOverview(this.dashboardMonth)
                    this.overviewItems = (data || []).filter((item) => item.appDisplay !== false)
                    this.updateBrandState(this.overviewItems)
                    return
                }

                this.overviewItems = []
                const data = await getInventoryResultDetails(this.dashboardMonth, this.selectedStoreKey)
                this.resultItems = data || []
                this.updateBrandState(this.resultItems)
            } catch (e) {
                this.resetDataState()
                this.errorMessage = e.message || 'ダッシュボードデータの取得に失敗しました。'
            } finally {
                this.isLoading = false
                this.$emit('update:loading', false)
            }
        }
    }
}
</script>
