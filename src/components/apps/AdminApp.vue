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
                            <span class="text-base font-bold text-slate-800">フレーバー表示設定</span>
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
                    <button @click="openPackageControl"
                        class="text-left rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 p-5 transition-colors focus:outline-none">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-2xl">📦</span>
                            <span class="text-base font-bold text-slate-800">パッケージサイズ設定</span>
                        </div>
                        <div class="text-sm text-slate-500">ブランドごとのパッケージサイズ表示を設定します</div>
                    </button>
                    <button @click="openUnitPriceControl"
                        class="text-left rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 p-5 transition-colors focus:outline-none">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-2xl">💴</span>
                            <span class="text-base font-bold text-slate-800">単位原価・販売値設定</span>
                        </div>
                        <div class="text-sm text-slate-500">原価計算に使用するフレーバー原価・炭原価・販売値を管理します</div>
                    </button>
                </div>
            </div>
        </div>

        <!-- フレーバー表示設定 -->
        <div v-if="adminSubMode === 'flavor-visibility'">
            <button @click="adminSubMode = null"
                class="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 font-medium transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                管理メニューへ戻る
            </button>
            <h2 class="text-base font-bold text-slate-700 mb-1">フレーバー表示設定</h2>
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

        <!-- パッケージサイズ設定 -->
        <div v-if="adminSubMode === 'package-control'">
            <button @click="adminSubMode = null"
                class="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 font-medium transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                管理メニューへ戻る
            </button>
            <h2 class="text-base font-bold text-slate-700 mb-1">パッケージサイズ設定</h2>
            <p class="text-xs text-slate-400 mb-4">ブランドごとに棚卸し入力で表示するパッケージサイズを設定します</p>

            <div v-if="pkgBrandsLoading" class="text-center py-12 text-slate-400 text-sm">読み込み中...</div>
            <div v-else-if="pkgBrands.length === 0" class="text-center py-12 text-slate-400 text-sm">ブランドが見つかりません</div>
            <div v-else class="pb-28 space-y-3">
                <div v-for="brand in pkgBrands" :key="brand.id"
                    class="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <div class="px-4 py-3 flex items-center justify-between gap-3">
                        <span class="text-sm font-bold text-slate-700 flex-1 min-w-0 truncate">{{ brand.name }}</span>
                        <label class="flex items-center gap-2 cursor-pointer shrink-0">
                            <span class="text-xs font-bold shrink-0"
                                :class="pkgCurrentFlag(brand, 'packages_configured') ? 'text-emerald-600' : 'text-slate-400'">
                                {{ pkgCurrentFlag(brand, 'packages_configured') ? '設定済み' : '未設定' }}
                            </span>
                            <div @click="onPkgToggle(brand.id, 'packages_configured', !pkgCurrentFlag(brand, 'packages_configured'))"
                                class="relative w-10 h-6 rounded-full transition-colors duration-200 cursor-pointer"
                                :class="pkgCurrentFlag(brand, 'packages_configured') ? 'bg-emerald-500' : 'bg-slate-300'">
                                <div class="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200"
                                    :class="pkgCurrentFlag(brand, 'packages_configured') ? 'left-5' : 'left-1'">
                                </div>
                            </div>
                        </label>
                    </div>
                    <div class="px-4 pb-3 pt-2 flex flex-wrap gap-2 border-t border-slate-50"
                        :class="{ 'opacity-40 pointer-events-none': !pkgCurrentFlag(brand, 'packages_configured') }">
                        <button v-for="size in PKG_SIZES" :key="size"
                            @click="onPkgToggle(brand.id, pkgSizeToCol[size], !pkgCurrentFlag(brand, pkgSizeToCol[size]))"
                            class="px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
                            :class="pkgCurrentFlag(brand, pkgSizeToCol[size]) ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'">
                            {{ pkgSizeLabel(size) }}
                        </button>
                    </div>
                </div>
            </div>

            <transition name="slide-up">
                <div v-if="pkgHasChanges"
                    class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 z-20">
                    <div class="container mx-auto max-w-lg">
                        <button @click="savePkgChanges" :disabled="pkgSaving"
                            class="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold py-4 rounded-full shadow-lg transition-all active:scale-95 disabled:opacity-50">
                            {{ pkgSaving ? '保存中...' : `変更を反映（${Object.keys(pkgPending).length}件）` }}
                        </button>
                    </div>
                </div>
            </transition>
        </div>

        <!-- 単位原価・販売値設定 -->
        <div v-if="adminSubMode === 'unit-price-control'">
            <button @click="adminSubMode = null"
                class="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 font-medium transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                管理メニューへ戻る
            </button>
            <h2 class="text-base font-bold text-slate-700 mb-1">単位原価・販売値設定</h2>
            <p class="text-xs text-slate-400 mb-4">各期間の価格改定を管理します。改定後の月から新しい価格が原価計算に自動適用されます。</p>

            <div v-if="priceMastersLoading" class="text-center py-12 text-slate-400 text-sm">読み込み中...</div>
            <div v-else class="pb-4 space-y-3">

                <!-- 現在適用中 -->
                <div v-if="priceMasters.length > 0"
                    class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="text-sm font-bold text-slate-800">{{ priceRangeLabel(0) }}</span>
                        <span class="text-xs font-bold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">現在適用中</span>
                    </div>
                    <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div class="flex justify-between">
                            <span class="text-slate-500">フレーバー原価</span>
                            <span class="font-bold text-slate-700">{{ priceMasters[0].price_flavor_per_g }}円/g</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-500">炭原価</span>
                            <span class="font-bold text-slate-700">{{ priceMasters[0].price_charcoal_per_kg }}円/kg</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-500">1本目</span>
                            <span class="font-bold text-slate-700">¥{{ Number(priceMasters[0].price_hookah_first).toLocaleString() }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-500">おかわり</span>
                            <span class="font-bold text-slate-700">¥{{ Number(priceMasters[0].price_hookah_refill).toLocaleString() }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-500">スタッフ</span>
                            <span class="font-bold text-slate-700">¥{{ Number(priceMasters[0].price_hookah_staff).toLocaleString() }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-500">チャージ</span>
                            <span class="font-bold text-slate-700">¥{{ Number(priceMasters[0].price_charge).toLocaleString() }}</span>
                        </div>
                    </div>
                    <div v-if="priceMasters[0].note" class="mt-2 text-xs text-slate-400 italic">{{ priceMasters[0].note }}</div>
                </div>
                <div v-else class="text-center py-8 text-slate-400 text-sm">
                    価格改定の記録がありません
                </div>

                <!-- 新規改定追加フォーム -->
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3 mt-4">
                    <div class="flex items-center justify-between">
                        <p class="text-xs font-bold text-slate-500 uppercase tracking-wide">新しい改定を追加</p>
                        <button v-if="priceMasters.length > 0" @click="prefillNewPriceFromLatest"
                            class="text-xs text-purple-600 hover:text-purple-700 font-medium">
                            現在の値をコピー
                        </button>
                    </div>

                    <div class="space-y-1">
                        <label class="text-xs text-slate-400">適用開始月</label>
                        <div class="grid grid-cols-2 gap-2">
                            <select v-model="newPrice.year"
                                class="bg-slate-50 border border-slate-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none"
                                :class="newPrice.year ? 'text-slate-800' : 'text-slate-400'">
                                <option value="" disabled>年</option>
                                <option v-for="y in years" :key="y.value" :value="y.value">{{ y.label }}</option>
                            </select>
                            <select v-model="newPrice.month"
                                class="bg-slate-50 border border-slate-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none"
                                :class="newPrice.month ? 'text-slate-800' : 'text-slate-400'">
                                <option value="" disabled>月</option>
                                <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div class="space-y-1">
                            <label class="text-xs text-slate-400">フレーバー原価 (円/g)</label>
                            <input type="number" min="0" step="0.1" v-model.number="newPrice.priceFlavorPerG"
                                class="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none" />
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs text-slate-400">炭原価 (円/kg)</label>
                            <input type="number" min="0" v-model.number="newPrice.priceCharcoalPerKg"
                                class="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none" />
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs text-slate-400">1本目料金 (円)</label>
                            <input type="number" min="0" v-model.number="newPrice.priceHookahFirst"
                                class="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none" />
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs text-slate-400">おかわり料金 (円)</label>
                            <input type="number" min="0" v-model.number="newPrice.priceHookahRefill"
                                class="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none" />
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs text-slate-400">スタッフ料金 (円)</label>
                            <input type="number" min="0" v-model.number="newPrice.priceHookahStaff"
                                class="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none" />
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs text-slate-400">チャージ料金 (円)</label>
                            <input type="number" min="0" v-model.number="newPrice.priceCharge"
                                class="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none" />
                        </div>
                    </div>

                    <div class="space-y-1">
                        <label class="text-xs text-slate-400">改定理由メモ（任意）</label>
                        <input type="text" v-model="newPrice.note" placeholder="例：炭原価値上がりのため"
                            class="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-2.5 text-slate-700 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none" />
                    </div>

                    <p v-if="newPriceValidationMessage" class="text-xs text-rose-600 font-medium">{{ newPriceValidationMessage }}</p>

                    <button @click="addPriceMasterEntry" :disabled="newPriceAddDisabled"
                        class="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
                        {{ priceSaving ? '追加中...' : '追加する' }}
                    </button>
                </div>

                <!-- 改定履歴（過去分） -->
                <div v-if="priceMasters.length > 1" class="space-y-2">
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 mt-2">改定履歴</p>
                    <div v-for="(master, index) in priceMasters.slice(1)" :key="master.id"
                        class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                        <div class="flex items-start justify-between gap-3 mb-3">
                            <span class="text-sm font-bold text-slate-800">{{ priceRangeLabel(index + 1) }}</span>
                            <button
                                v-if="index < priceMasters.slice(1).length - 1"
                                @click="deletePriceMasterEntry(master, index + 1)"
                                :disabled="priceSaving"
                                class="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-50 text-red-500 border border-red-200 hover:bg-red-50 transition-colors shrink-0 disabled:opacity-40">
                                削除
                            </button>
                            <span v-else class="text-xs text-slate-400 shrink-0 py-1.5">削除不可</span>
                        </div>
                        <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <div class="flex justify-between">
                                <span class="text-slate-500">フレーバー原価</span>
                                <span class="font-bold text-slate-700">{{ master.price_flavor_per_g }}円/g</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500">炭原価</span>
                                <span class="font-bold text-slate-700">{{ master.price_charcoal_per_kg }}円/kg</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500">1本目</span>
                                <span class="font-bold text-slate-700">¥{{ Number(master.price_hookah_first).toLocaleString() }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500">おかわり</span>
                                <span class="font-bold text-slate-700">¥{{ Number(master.price_hookah_refill).toLocaleString() }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500">スタッフ</span>
                                <span class="font-bold text-slate-700">¥{{ Number(master.price_hookah_staff).toLocaleString() }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500">チャージ</span>
                                <span class="font-bold text-slate-700">¥{{ Number(master.price_charge).toLocaleString() }}</span>
                            </div>
                        </div>
                        <div v-if="master.note" class="mt-2 text-xs text-slate-400 italic">{{ master.note }}</div>
                    </div>
                </div>

            </div>
        </div>

    </div>
</template>

<script>
import { getAllFlavorsWithBrand, batchUpdateFlavorIsActive, addFlavorForArrival, listTransferBrandsOrdered, getBrandsWithPackageFlags, updateBrandPackageFlags, getCostPriceMasters, addCostPriceMaster, deleteCostPriceMaster } from '../../api.js'
import { buildYearOptions, buildMonthOptions, composePeriodKey } from '../../utils/periods.js'

export default {
    name: 'AdminApp',
    emits: ['update:loading', 'update:loadingMessage'],
    data() {
        return {
            adminSubMode: null,
            // フレーバー表示設定
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
            // パッケージサイズ設定
            pkgBrands: [],
            pkgPending: {},
            pkgBrandsLoading: false,
            pkgSaving: false,
            PKG_SIZES: ['50', '100', '125', '200', '250', '1kg'],
            pkgSizeToCol: { '50': 'has_pkg_50', '100': 'has_pkg_100', '125': 'has_pkg_125', '200': 'has_pkg_200', '250': 'has_pkg_250', '1kg': 'has_pkg_1kg' },
            // 単位原価・販売値設定
            priceMasters: [],
            priceMastersLoading: false,
            priceSaving: false,
            newPrice: {
                year: '',
                month: '',
                priceFlavorPerG: 40,
                priceCharcoalPerKg: 600,
                priceHookahFirst: 1900,
                priceHookahRefill: 1800,
                priceHookahStaff: 1800,
                priceCharge: 900,
                note: ''
            }
        }
    },
    computed: {
        hasChanges() {
            return Object.keys(this.pendingChanges).length > 0
        },
        pkgHasChanges() {
            return Object.keys(this.pkgPending).length > 0
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
        years() { return buildYearOptions() },
        months() { return buildMonthOptions() },
        newPriceEffectiveFrom() {
            return composePeriodKey(this.newPrice.year, this.newPrice.month)
        },
        newPriceValidationMessage() {
            if (!this.newPrice.year || !this.newPrice.month) return '適用開始月を選択してください。'
            if (!this.newPriceEffectiveFrom) return '適用開始月が不正です。'
            const exists = this.priceMasters.some(m => m.effective_from === Number(this.newPriceEffectiveFrom))
            if (exists) return 'その月の改定はすでに登録されています。'
            return ''
        },
        newPriceAddDisabled() {
            return this.priceSaving || !!this.newPriceValidationMessage
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
        pkgSizeLabel(size) {
            return size === '1kg' ? '1kg' : `${size}g`
        },
        pkgCurrentFlag(brand, key) {
            const pending = this.pkgPending[brand.id]
            return pending !== undefined && key in pending ? pending[key] : brand[key]
        },
        onPkgToggle(brandId, key, value) {
            const brand = this.pkgBrands.find(b => b.id === brandId)
            if (!brand) return
            const existing = this.pkgPending[brandId] || {}
            const updated = { ...existing, [key]: value }
            if (updated[key] === brand[key]) delete updated[key]
            if (Object.keys(updated).length === 0) {
                const newPending = { ...this.pkgPending }
                delete newPending[brandId]
                this.pkgPending = newPending
            } else {
                this.pkgPending = { ...this.pkgPending, [brandId]: updated }
            }
        },
        async openPackageControl() {
            this.adminSubMode = 'package-control'
            this.pkgPending = {}
            await this.loadPkgBrands()
        },
        async loadPkgBrands() {
            this.pkgBrandsLoading = true
            try {
                this.pkgBrands = await getBrandsWithPackageFlags()
            } catch (e) {
                alert(e.message || 'ブランド一覧の取得に失敗しました。')
            } finally {
                this.pkgBrandsLoading = false
            }
        },
        async savePkgChanges() {
            if (!this.pkgHasChanges) return
            this.pkgSaving = true
            this.$emit('update:loading', true)
            this.$emit('update:loadingMessage', '変更を保存中...')
            try {
                await Promise.all(
                    Object.entries(this.pkgPending).map(([brandId, flags]) =>
                        updateBrandPackageFlags(Number(brandId), flags)
                    )
                )
                await this.loadPkgBrands()
                this.pkgPending = {}
                alert('変更を反映しました。')
            } catch (e) {
                alert(e.message || '変更の保存に失敗しました。')
            } finally {
                this.pkgSaving = false
                this.$emit('update:loading', false)
            }
        },
        async openUnitPriceControl() {
            this.adminSubMode = 'unit-price-control'
            await this.loadPriceMasters()
        },
        async loadPriceMasters() {
            this.priceMastersLoading = true
            try {
                this.priceMasters = await getCostPriceMasters()
            } catch (e) {
                alert(e.message || '価格マスタの取得に失敗しました。')
            } finally {
                this.priceMastersLoading = false
            }
        },
        priceRangeLabel(index) {
            const m = this.priceMasters[index]
            const from = m.effective_from
            const fromLabel = `${String(from).slice(0, 4)}年${String(from).slice(4)}月〜`
            if (index === 0) return fromLabel
            const prev = this.priceMasters[index - 1]
            const prevFrom = prev.effective_from
            const prevYear = Number(String(prevFrom).slice(0, 4))
            const prevMonth = Number(String(prevFrom).slice(4))
            const endYear = prevMonth === 1 ? prevYear - 1 : prevYear
            const endMonth = prevMonth === 1 ? 12 : prevMonth - 1
            return `${fromLabel} 〜 ${endYear}年${endMonth}月まで`
        },
        async addPriceMasterEntry() {
            if (this.newPriceValidationMessage) return
            this.priceSaving = true
            this.$emit('update:loading', true)
            this.$emit('update:loadingMessage', '価格改定を追加中...')
            try {
                await addCostPriceMaster({
                    effective_from: Number(this.newPriceEffectiveFrom),
                    price_flavor_per_g: this.newPrice.priceFlavorPerG,
                    price_charcoal_per_kg: this.newPrice.priceCharcoalPerKg,
                    price_hookah_first: this.newPrice.priceHookahFirst,
                    price_hookah_refill: this.newPrice.priceHookahRefill,
                    price_hookah_staff: this.newPrice.priceHookahStaff,
                    price_charge: this.newPrice.priceCharge,
                    note: this.newPrice.note || null
                })
                await this.loadPriceMasters()
                this.newPrice.year = ''
                this.newPrice.month = ''
                this.newPrice.note = ''
                alert('価格改定を追加しました。')
            } catch (e) {
                alert(e.message || '価格改定の追加に失敗しました。')
            } finally {
                this.priceSaving = false
                this.$emit('update:loading', false)
            }
        },
        async deletePriceMasterEntry(master, index) {
            if (index === this.priceMasters.length - 1) return
            const from = master.effective_from
            const label = `${String(from).slice(0, 4)}年${String(from).slice(4)}月〜`
            if (!confirm(`「${label}」の価格改定を削除しますか？`)) return
            this.priceSaving = true
            this.$emit('update:loading', true)
            this.$emit('update:loadingMessage', '削除中...')
            try {
                await deleteCostPriceMaster(master.id)
                await this.loadPriceMasters()
            } catch (e) {
                alert(e.message || '削除に失敗しました。')
            } finally {
                this.priceSaving = false
                this.$emit('update:loading', false)
            }
        },
        prefillNewPriceFromLatest() {
            if (this.priceMasters.length === 0) return
            const latest = this.priceMasters[0]
            this.newPrice.priceFlavorPerG = Number(latest.price_flavor_per_g)
            this.newPrice.priceCharcoalPerKg = Number(latest.price_charcoal_per_kg)
            this.newPrice.priceHookahFirst = Number(latest.price_hookah_first)
            this.newPrice.priceHookahRefill = Number(latest.price_hookah_refill)
            this.newPrice.priceHookahStaff = Number(latest.price_hookah_staff)
            this.newPrice.priceCharge = Number(latest.price_charge)
        },
    }
}
</script>
