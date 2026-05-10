<template>
    <div class="space-y-4">

        <!-- サブモード選択 -->
        <div v-if="adminSubMode === null">
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 max-w-md mx-auto">
                <div class="text-center space-y-2">
                    <h2 class="text-xl font-bold text-slate-800">管理メニューを選択</h2>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button @click="openFlavorVisibility"
                        class="text-left rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 p-5 transition-colors focus:outline-none">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-2xl">👁️</span>
                            <span class="text-base font-bold text-slate-800">フレーバー表示制御</span>
                        </div>
                        <div class="text-sm text-slate-500">フレーバーの表示/非表示を一括管理します</div>
                    </button>
                    <button @click="openAddFlavor"
                        class="text-left rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 p-5 transition-colors focus:outline-none">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-2xl">➕</span>
                            <span class="text-base font-bold text-slate-800">新フレーバー追加</span>
                        </div>
                        <div class="text-sm text-slate-500">新しいブランド・銘柄をマスタに登録します</div>
                    </button>
                </div>
            </div>
        </div>

        <!-- フレーバー表示制御 -->
        <div v-if="adminSubMode === 'flavor-visibility'">
            <button @click="adminSubMode = null"
                class="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 font-medium transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                管理メニューへ戻る
            </button>
            <h2 class="text-base font-bold text-slate-700 mb-1">フレーバー表示制御</h2>
            <p class="text-xs text-slate-400 mb-4">チェックをオフにすると棚卸し・補充依頼・移動記録から非表示になります</p>

            <div v-if="flavorsLoading" class="text-center py-12 text-slate-400 text-sm">読み込み中...</div>
            <div v-else-if="groupedFlavors.length === 0" class="text-center py-12 text-slate-400 text-sm">
                フレーバーが見つかりません
            </div>
            <div v-else class="pb-28 space-y-3">
                <div v-for="group in groupedFlavors" :key="group.brand"
                    class="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">{{ group.brand
                            }}</span>
                    </div>
                    <div class="divide-y divide-slate-50">
                        <div v-for="flavor in group.flavors" :key="flavor.id"
                            class="flex items-center justify-between px-4 py-3 gap-3">
                            <span class="text-sm font-medium text-slate-700 flex-1 min-w-0 truncate">{{
                                flavor.name }}</span>
                            <label class="flex items-center gap-2 cursor-pointer shrink-0">
                                <span class="text-xs font-bold w-10 text-right"
                                    :class="currentIsActive(flavor) ? 'text-emerald-600' : 'text-slate-400'">
                                    {{ currentIsActive(flavor) ? '表示' : '非表示' }}
                                </span>
                                <div @click="onToggle(flavor.id, !currentIsActive(flavor))"
                                    class="relative w-10 h-6 rounded-full transition-colors duration-200 cursor-pointer"
                                    :class="currentIsActive(flavor) ? 'bg-emerald-500' : 'bg-slate-300'">
                                    <div class="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200"
                                        :class="currentIsActive(flavor) ? 'left-5' : 'left-1'">
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 固定フッター：変更を反映ボタン -->
            <transition name="slide-up">
                <div v-if="hasChanges"
                    class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 z-20">
                    <div class="container mx-auto max-w-lg">
                        <button @click="saveChanges" :disabled="savingChanges"
                            class="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold py-4 rounded-full shadow-lg transition-all active:scale-95 disabled:opacity-50">
                            {{ savingChanges ? '保存中...' : `変更を反映（${Object.keys(pendingChanges).length}件）` }}
                        </button>
                    </div>
                </div>
            </transition>
        </div>

        <!-- 新フレーバー追加 -->
        <div v-if="adminSubMode === 'add-flavor'">
            <button @click="adminSubMode = null"
                class="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 font-medium transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                管理メニューへ戻る
            </button>
            <h2 class="text-base font-bold text-slate-700 mb-4">新フレーバー追加</h2>

            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
                <p class="text-xs font-bold text-slate-500 uppercase tracking-wide">新規銘柄を追加</p>

                <select v-model="arrivalSelectedBrand"
                    class="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-3 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none">
                    <option value="" disabled>ブランド名を選択</option>
                    <option v-for="brand in arrivalBrandOptions" :key="'brand-' + brand" :value="brand">{{ brand
                        }}</option>
                    <option value="__other__">その他（新規ブランド）</option>
                </select>

                <input v-if="arrivalSelectedBrand === '__other__'" v-model.trim="arrivalNewBrandShortName"
                    type="text" maxlength="40" placeholder="ブランド略称（大文字アルファベット）"
                    class="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-3 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none">

                <input v-if="arrivalSelectedBrand === '__other__'" v-model.trim="arrivalNewBrandFormalName"
                    type="text" maxlength="80" placeholder="ブランド正式名称（例: Al Fakher）"
                    class="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-3 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none">

                <p v-if="arrivalBrandValidationMessage" class="text-xs text-rose-600 font-medium">{{
                    arrivalBrandValidationMessage }}</p>

                <input v-model.trim="arrivalNewFlavorName" type="text" maxlength="120"
                    placeholder="フレーバー名を入力"
                    class="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-3 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none">

                <p v-if="arrivalFlavorValidationMessage" class="text-xs text-rose-600 font-medium">{{
                    arrivalFlavorValidationMessage }}</p>

                <button @click="addArrivalFlavor" :disabled="arrivalAddDisabled"
                    class="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
                    {{ arrivalAddingFlavor ? '追加中...' : 'この銘柄を追加' }}
                </button>
            </div>
        </div>

    </div>
</template>

<script>
import { getAllFlavorsWithBrand, batchUpdateFlavorIsActive, addFlavorForArrival, listTransferBrandsOrdered } from '../../api.js'

export default {
    name: 'AdminApp',
    emits: ['update:loading', 'update:loadingMessage'],
    data() {
        return {
            adminSubMode: null,
            // フレーバー表示制御
            allFlavors: [],
            pendingChanges: {},
            flavorsLoading: false,
            savingChanges: false,
            // 新フレーバー追加
            adminBrands: [],
            arrivalSelectedBrand: '',
            arrivalNewBrandShortName: '',
            arrivalNewBrandFormalName: '',
            arrivalNewFlavorName: '',
            arrivalAddingFlavor: false,
        }
    },
    computed: {
        hasChanges() {
            return Object.keys(this.pendingChanges).length > 0
        },
        groupedFlavors() {
            const map = new Map()
            for (const f of this.allFlavors) {
                const brand = f.brands?.name || '(不明)'
                if (!map.has(brand)) map.set(brand, [])
                map.get(brand).push(f)
            }
            return [...map.entries()]
                .sort((a, b) => a[0].localeCompare(b[0], 'ja'))
                .map(([brand, flavors]) => ({
                    brand,
                    flavors: flavors.sort((a, b) => a.name.localeCompare(b.name, 'ja'))
                }))
        },
        arrivalBrandOptions() {
            return this.adminBrands
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
            const flavorRule = /^[A-Z][a-z0-9]*(?: [A-Z][a-z0-9]*)*$/
            if (!flavorRule.test(v)) {
                return 'フレーバー名は各単語の頭文字のみ大文字、単語間は半角スペースで入力してください。'
            }
            return ''
        },
        arrivalAddDisabled() {
            return this.arrivalAddingFlavor || !!this.arrivalBrandValidationMessage || !!this.arrivalFlavorValidationMessage
        },
    },
    methods: {
        currentIsActive(flavor) {
            return this.pendingChanges[flavor.id] !== undefined
                ? this.pendingChanges[flavor.id]
                : flavor.is_active
        },
        onToggle(flavorId, checked) {
            const original = this.allFlavors.find(f => f.id === flavorId)?.is_active
            if (checked === original) {
                const updated = { ...this.pendingChanges }
                delete updated[flavorId]
                this.pendingChanges = updated
            } else {
                this.pendingChanges = { ...this.pendingChanges, [flavorId]: checked }
            }
        },
        async openFlavorVisibility() {
            this.adminSubMode = 'flavor-visibility'
            this.pendingChanges = {}
            await this.loadAllFlavors()
        },
        async openAddFlavor() {
            this.adminSubMode = 'add-flavor'
            await this.loadAdminBrands()
        },
        async loadAllFlavors() {
            this.flavorsLoading = true
            try {
                this.allFlavors = await getAllFlavorsWithBrand()
            } catch (e) {
                alert(e.message || 'フレーバー一覧の取得に失敗しました。')
            } finally {
                this.flavorsLoading = false
            }
        },
        async loadAdminBrands() {
            try {
                const rows = await listTransferBrandsOrdered()
                const seen = new Set()
                this.adminBrands = rows.map(r => r.brand).filter(b => b && !seen.has(b) && seen.add(b))
            } catch {
                // ブランドリスト取得失敗はサイレントに扱う
            }
        },
        async saveChanges() {
            if (!this.hasChanges) return
            this.savingChanges = true
            this.$emit('update:loading', true)
            this.$emit('update:loadingMessage', '変更を保存中...')
            try {
                const updates = Object.entries(this.pendingChanges).map(([id, is_active]) => ({
                    id: Number(id),
                    is_active
                }))
                await batchUpdateFlavorIsActive(updates)
                await this.loadAllFlavors()
                this.pendingChanges = {}
                alert('変更を反映しました。')
            } catch (e) {
                alert(e.message || '変更の保存に失敗しました。')
            } finally {
                this.savingChanges = false
                this.$emit('update:loading', false)
            }
        },
        async addArrivalFlavor() {
            if (this.arrivalBrandValidationMessage || this.arrivalFlavorValidationMessage) {
                alert(this.arrivalBrandValidationMessage || this.arrivalFlavorValidationMessage)
                return
            }
            const brand = this.arrivalResolvedBrand
            const brandShortName = this.arrivalResolvedBrandShortName
            const flavorName = (this.arrivalNewFlavorName || '').trim()
            this.arrivalAddingFlavor = true
            this.$emit('update:loading', true)
            this.$emit('update:loadingMessage', '新規銘柄を追加中...')
            try {
                await addFlavorForArrival({ brand, brandShortName, brandFormalName: brand, flavorName })
                await this.loadAdminBrands()
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
    }
}
</script>
