<template>
    <main class="container mx-auto px-4 pt-0 pb-6 max-w-lg md:max-w-7xl transition-all duration-300 flex-grow">
        <transition name="slide-up">
            <div class="space-y-4 mt-2">
                <!-- 対象月選択 -->
                <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">対象月</label>
                    <div class="grid grid-cols-2 gap-3">
                        <select v-model="stockYear"
                            :class="stockYear ? 'text-slate-800' : 'text-slate-500'"
                            class="appearance-none w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl focus:ring-2 focus:ring-red-500 block p-4 text-center">
                            <option value="" disabled>年を選択</option>
                            <option v-for="y in years" :value="y.value" :key="y.value" class="text-slate-800">{{ y.label }}</option>
                        </select>
                        <select v-model="stockMonthPart"
                            :class="stockMonth ? 'text-slate-800' : 'text-slate-500'"
                            class="appearance-none w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl focus:ring-2 focus:ring-red-500 block p-4 text-center">
                            <option value="" disabled>月を選択</option>
                            <option v-for="m in months" :value="m.value" :key="m.value" class="text-slate-800">{{ m.label }}</option>
                        </select>
                    </div>
                </div>

                <!-- エラー表示 -->
                <div v-if="errorMessage" class="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-700 font-medium">
                    {{ errorMessage }}
                </div>

                <!-- 一覧テーブル -->
                <div v-if="stockItems.length > 0"
                    class="bg-white rounded-2xl border border-slate-100 shadow-sm relative">
                    <div class="w-full">
                        <table class="w-full text-sm border-separate border-spacing-0">
                            <thead class="sticky top-[64px] z-20 shadow-sm">
                                <tr>
                                    <th class="bg-slate-50 text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase border-b border-slate-100 rounded-tl-2xl">フレーバー
                                    </th>
                                    <th class="bg-slate-50 text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase border-b border-slate-100">総在庫量
                                    </th>
                                    <th class="bg-slate-50 text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase border-b border-slate-100 rounded-tr-2xl">
                                        前月消費量</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in stockFilteredItems" :key="item.rowIndex"
                                    class="border-b border-slate-50 last:border-0 transition-colors"
                                    :class="item.totalStock <= 0 ? 'bg-red-50' : ''">
                                    <td class="px-4 py-3">
                                        <div class="text-[10px] font-bold text-slate-400">{{ item.brand }}</div>
                                        <div class="font-bold text-slate-800">{{ item.flavorName }}</div>
                                    </td>
                                    <td class="px-4 py-3 text-right">
                                        <span class="font-bold text-lg"
                                            :class="item.totalStock <= 0 ? 'text-red-600' : 'text-slate-800'">
                                            {{ item.totalStock.toLocaleString() }}
                                        </span>
                                        <span class="text-xs text-slate-400 ml-1">g</span>
                                    </td>
                                    <td class="px-4 py-3 text-right">
                                        <span class="font-bold text-slate-600">{{
                                            item.prevConsumption.toLocaleString() }}</span>
                                        <span class="text-xs text-slate-400 ml-1">g</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div v-else-if="stockMonth && !isLoading"
                    class="text-center py-12 text-slate-400 text-sm font-medium">
                    データがアりません
                </div>
                <div v-else-if="!stockMonth" class="text-center py-12 text-slate-400 text-sm font-medium">
                    対象月を選択すると在庫量が表示されます
                </div>

                <div class="h-24"></div>
            </div>
        </transition>
    </main>
</template>

<script>
import { getStockOverview } from '../../api.js'
import { buildYearOptions, buildMonthOptions, composePeriodKey } from '../../utils/periods.js'

export default {
    name: 'StockApp',
    props: {
        selectedBrand: {
            type: String,
            default: null
        }
    },
    emits: ['update:loading', 'update:loadingMessage', 'update:brands', 'update:hasData'],
    data() {
        return {
            stockYear: '',
            stockMonthPart: '',
            stockItems: [],
            errorMessage: '',
            isLoading: false // Local track to show empty state correctly without flashing
        }
    },
    computed: {
        stockMonth() {
            return composePeriodKey(this.stockYear, this.stockMonthPart)
        },
        years() {
            return buildYearOptions()
        },
        months() {
            return buildMonthOptions()
        },
        stockFilteredItems() {
            if (!this.selectedBrand) return this.stockItems
            return this.stockItems.filter(i => i.brand === this.selectedBrand)
        }
    },
    methods: {
        async loadStockData() {
            if (!this.stockMonth) {
                this.stockItems = []
                this.$emit('update:hasData', false)
                this.$emit('update:brands', [])
                return
            }
            
            this.errorMessage = ''
            this.isLoading = true
            this.$emit('update:loadingMessage', '在庫データを読み込み中...')
            this.$emit('update:loading', true)
            this.stockItems = []
            this.$emit('update:hasData', false)

            try {
                const data = await getStockOverview(this.stockMonth)
                this.stockItems = (data || []).filter(i => i.appDisplay !== false)
                
                const seen = new Set()
                const brands = this.stockItems.map(i => i.brand).filter(b => b && !seen.has(b) && seen.add(b))
                
                this.$emit('update:brands', brands)
                this.$emit('update:hasData', this.stockItems.length > 0)
            } catch (e) {
                this.errorMessage = e.message || '在庫データの取得に失敗しました。'
                this.$emit('update:hasData', false)
                this.$emit('update:brands', [])
            } finally {
                this.isLoading = false
                this.$emit('update:loading', false)
            }
        }
    },
    watch: {
        stockMonth(newVal) {
            if (newVal) {
                this.loadStockData()
                return
            }
            if(!newVal) {
                this.stockItems = []
                this.$emit('update:hasData', false)
                this.$emit('update:brands', [])
            }
        }
    }
}
</script>
