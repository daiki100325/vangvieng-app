<template>
    <main class="container mx-auto px-4 py-6 max-w-lg md:max-w-3xl flex-grow">
        <!-- Step 0: トップ（店舗・対象月・サブモード選択） -->
        <div v-if="step === 0" class="flex flex-col items-center pt-6 pb-20">
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 w-full max-w-md">
                <div class="text-center space-y-1">
                    <h2 class="text-xl font-bold text-slate-800">原価計算を開始</h2>
                </div>

                <div class="space-y-3">
                    <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">対象店舗</label>
                    <select v-model="selectedStoreKey"
                        class="appearance-none w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl p-4 text-center focus:ring-2 focus:ring-purple-500"
                        :class="selectedStoreKey ? 'text-slate-800' : 'text-slate-400'">
                        <option value="" disabled>店舗を選択</option>
                        <option v-for="store in costStores" :key="store.key" :value="store.key">{{ store.name }}</option>
                    </select>
                </div>

                <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">対象月</label>
                    <div class="grid grid-cols-2 gap-3">
                        <select v-model="selectedYear"
                            class="appearance-none w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl p-4 text-center focus:ring-2 focus:ring-purple-500"
                            :class="selectedYear ? 'text-slate-800' : 'text-slate-400'">
                            <option value="" disabled>年を選択</option>
                            <option v-for="y in years" :key="y.value" :value="y.value">{{ y.label }}</option>
                        </select>
                        <select v-model="selectedMonth"
                            class="appearance-none w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl p-4 text-center focus:ring-2 focus:ring-purple-500"
                            :class="selectedMonth ? 'text-slate-800' : 'text-slate-400'">
                            <option value="" disabled>月を選択</option>
                            <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
                        </select>
                    </div>
                </div>

                <!-- サブモード選択 -->
                <div class="space-y-3">
                    <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">モード</label>
                    <div class="grid grid-cols-2 gap-3">
                        <button @click="costSubMode = 'shisha'"
                            :class="costSubMode === 'shisha' ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/30' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-purple-50 hover:text-purple-600'"
                            class="py-4 rounded-2xl font-bold border-2 transition-all active:scale-95 text-center text-sm">
                            <div class="flex items-center justify-center gap-2">
                                <span class="text-xl">💨</span>
                                <span>シーシャ</span>
                            </div>
                        </button>
                        <button @click="costSubMode = 'drink'"
                            :class="costSubMode === 'drink' ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/30' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-purple-50 hover:text-purple-600'"
                            class="py-4 rounded-2xl font-bold border-2 transition-all active:scale-95 text-center text-sm">
                            <div class="flex items-center justify-center gap-2">
                                <span class="text-xl">🥤</span>
                                <span>ドリンク</span>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- シーシャモード: 開始ボタン -->
                <button v-if="costSubMode === 'shisha'"
                    type="button"
                    @click="startCostEntry"
                    :disabled="!selectedStoreKey || !selectedYear || !selectedMonth"
                    class="w-full py-4 rounded-2xl text-base font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-purple-600 hover:bg-purple-700 text-white">
                    開始する
                </button>
            </div>

            <!-- ドリンクモード: インライン表示（店舗・月選択後に自動ロード） -->
            <template v-if="costSubMode === 'drink' && selectedStoreKey && selectedYear && selectedMonth">
                <div v-if="isDrinkLoading" class="w-full max-w-md mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center text-slate-400 text-sm">
                    読み込み中...
                </div>
                <template v-else>
                    <!-- ドリンク発注入力フォーム -->
                    <div class="w-full max-w-md mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                        <div class="text-sm font-bold text-slate-700">ドリンク発注の追加</div>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="space-y-1">
                                <label class="text-xs text-slate-400">発注日</label>
                                <input type="date" v-model="newDrink.orderDate"
                                    class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs text-slate-400">金額 (¥)</label>
                                <input type="number" min="0" v-model.number="newDrink.amount" placeholder="0"
                                    class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs text-slate-400">備考（ドリンクの種類等）</label>
                            <input type="text" v-model="newDrink.description" placeholder="例：水×3、お茶×2"
                                class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                        </div>
                        <button type="button" @click="addDrinkEntry"
                            :disabled="!newDrink.orderDate || !newDrink.amount || isAddingDrink"
                            class="w-full py-3 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                            {{ isAddingDrink ? '追加中...' : '追加する' }}
                        </button>
                    </div>

                    <!-- ドリンク発注一覧 -->
                    <div v-if="drinkOrders.length > 0" class="w-full max-w-md mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2">
                        <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">発注記録</div>
                        <div v-for="(d, idx) in drinkOrders" :key="d.id || idx"
                            class="py-2 border-b border-slate-50 last:border-0">
                            <!-- 編集フォーム -->
                            <template v-if="editingDrinkId === d.id">
                                <div class="space-y-2">
                                    <div class="grid grid-cols-2 gap-2">
                                        <div class="space-y-1">
                                            <label class="text-xs text-slate-400">発注日</label>
                                            <input type="date" v-model="editingDrink.orderDate"
                                                class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                        </div>
                                        <div class="space-y-1">
                                            <label class="text-xs text-slate-400">金額 (¥)</label>
                                            <input type="number" min="0" v-model.number="editingDrink.amount"
                                                class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                        </div>
                                    </div>
                                    <input type="text" v-model="editingDrink.description" placeholder="備考（任意）"
                                        class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    <div class="flex gap-2">
                                        <button type="button" @click="saveEditDrink(d)"
                                            :disabled="!editingDrink.orderDate || !editingDrink.amount || isSavingDrink"
                                            class="flex-1 py-2 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                            {{ isSavingDrink ? '保存中...' : '保存' }}
                                        </button>
                                        <button type="button" @click="cancelEditDrink"
                                            class="flex-1 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                            キャンセル
                                        </button>
                                    </div>
                                </div>
                            </template>
                            <!-- 通常表示 -->
                            <template v-else>
                                <div class="flex items-center justify-between">
                                    <div>
                                        <div class="text-sm font-bold text-slate-800">{{ d.orderDate }} — ¥{{ Number(d.amount).toLocaleString() }}</div>
                                        <div v-if="d.description" class="text-xs text-slate-400 mt-0.5">{{ d.description }}</div>
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <button type="button" @click="startEditDrink(d)"
                                            class="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-50 text-purple-600 border border-purple-200 hover:bg-purple-50 transition-colors">
                                            修正
                                        </button>
                                        <button type="button" @click="removeDrinkEntry(d)"
                                            class="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-50 text-red-500 border border-red-200 hover:bg-red-50 transition-colors">
                                            削除
                                        </button>
                                    </div>
                                </div>
                            </template>
                        </div>
                        <div class="flex justify-between text-sm pt-1">
                            <span class="text-slate-500">ドリンク発注合計</span>
                            <span class="font-bold text-slate-800">¥{{ drinkTotal.toLocaleString() }}</span>
                        </div>
                    </div>
                    <div v-else class="w-full max-w-md mt-4 text-center py-4 text-slate-400 text-sm">発注記録がありません</div>
                </template>
            </template>

            <div v-if="errorMessage" class="w-full max-w-md mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 font-medium">
                {{ errorMessage }}
            </div>
        </div>

        <!-- Step 1〜5: シーシャ入力ステップ -->
        <div v-if="step > 0" class="space-y-4">
            <!-- ステップヘッダー -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-xs font-bold text-purple-600 uppercase tracking-wider">{{ currentStoreLabel }} / {{ periodLabel }}</div>
                        <div class="text-base font-bold text-slate-800 mt-0.5">{{ stepLabels[step - 1] }}</div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span v-for="i in 5" :key="i"
                            :class="['w-2 h-2 rounded-full transition-colors',
                                i === step ? 'bg-purple-500' : i < step ? 'bg-purple-200' : 'bg-slate-200']">
                        </span>
                    </div>
                </div>
            </div>

            <!-- Step 1: 集計期間 -->
            <div v-if="step === 1" class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <p class="text-sm text-slate-500">集計開始日は前月の集計終了日の翌日です。</p>
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-slate-400">集計開始日</label>
                        <input type="date" v-model="form.startDate"
                            class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-slate-400">集計終了日</label>
                        <input type="date" v-model="form.endDate"
                            class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                    </div>
                </div>
                <div v-if="form.startDate && form.endDate" class="bg-purple-50 rounded-xl p-3 text-sm text-purple-700 font-medium">
                    集計日数: {{ dayCount }}日
                </div>
            </div>

            <!-- Step 2: シーシャ販売数 -->
            <div v-if="step === 2" class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <p class="text-sm text-slate-500">Airレジのデータから各販売数を入力してください。</p>
                <div class="space-y-3">
                    <div v-for="field in hookahFields" :key="field.key" class="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                        <span class="text-sm font-bold text-slate-700">{{ field.label }}</span>
                        <div class="flex items-center gap-1">
                            <input type="number" min="0"
                                v-model.number="form.hookahs[field.key]"
                                class="w-24 bg-slate-50 border border-slate-200 rounded-xl p-2 text-center text-base font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                            <span class="text-xs text-slate-400">{{ field.unit }}</span>
                        </div>
                    </div>
                </div>
                <div class="bg-slate-50 rounded-xl p-3 space-y-1 text-sm">
                    <div class="flex justify-between">
                        <span class="text-slate-500">シーシャ提供本数 <span class="text-xs text-slate-400">(①＋③＋④＋⑤)</span></span>
                        <span class="font-bold text-slate-800">{{ totalServings }} 本</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500">滞在時間にかかる来店人数 <span class="text-xs text-slate-400">(②＋③＋④＋⑤)</span></span>
                        <span class="font-bold text-slate-800">{{ totalVisitors }} 人</span>
                    </div>
                </div>
            </div>

            <!-- Step 3: フレーバー消費量 -->
            <div v-if="step === 3" class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <p class="text-sm text-slate-500">棚卸し結果から自動取得した総消費量を確認し、物販数を入力してください。</p>
                <div class="overflow-auto max-h-[60vh]">
                    <table class="w-full text-sm border-separate border-spacing-0">
                        <thead class="sticky top-0 z-10">
                            <tr>
                                <th class="bg-slate-50 text-left px-3 py-2 text-xs font-bold text-slate-400 border-b border-slate-200">ブランド</th>
                                <th class="bg-slate-50 text-right px-3 py-2 text-xs font-bold text-slate-400 border-b border-slate-200 w-28">総消費量(g)</th>
                                <th class="bg-slate-50 text-right px-3 py-2 text-xs font-bold text-slate-400 border-b border-slate-200 w-20">1パケ(g)</th>
                                <th class="bg-slate-50 text-right px-3 py-2 text-xs font-bold text-slate-400 border-b border-slate-200 w-24">物販(個)</th>
                                <th class="bg-slate-50 text-right px-3 py-2 text-xs font-bold text-slate-400 border-b border-slate-200 w-24">提供(g)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <template v-for="b in form.brandSales" :key="b.brandId">
                                <tr v-if="b.brandName !== 'VV (Vang Vieng Mix)'"
                                    class="border-b border-slate-50 last:border-0"
                                    :class="serveConsumption(b) < 0 ? 'bg-red-50' : ''">
                                    <td class="px-3 py-2 font-bold text-slate-700 text-xs">{{ b.brandName }}</td>
                                    <!-- 総消費量: 棚卸しから自動取得、表示のみ -->
                                    <td class="px-3 py-2 text-right text-sm font-bold text-slate-800">
                                        {{ (b.totalConsumptionG || 0).toLocaleString() }}
                                    </td>
                                    <!-- 1パケ(g): 規定値を表示のみ -->
                                    <td class="px-3 py-2 text-right text-sm text-slate-500">
                                        <span v-if="b.brandName === 'Tangiers'">100/250</span>
                                        <span v-else>{{ b.gramsPerPack }}</span>
                                    </td>
                                    <!-- 物販(個): Tangiersは100g/250g別入力 -->
                                    <td class="px-2 py-1 text-right">
                                        <div v-if="b.brandName === 'Tangiers'" class="space-y-1">
                                            <div class="flex items-center gap-1 justify-end">
                                                <span class="text-xs text-slate-400">100g</span>
                                                <input type="number" min="0" v-model.number="b.merchCount"
                                                    class="w-14 bg-slate-50 border border-slate-200 rounded-lg p-1 text-right text-sm font-bold text-slate-800 focus:ring-1 focus:ring-purple-500 focus:outline-none" />
                                            </div>
                                            <div class="flex items-center gap-1 justify-end">
                                                <span class="text-xs text-slate-400">250g</span>
                                                <input type="number" min="0" v-model.number="b.merchCount250"
                                                    class="w-14 bg-slate-50 border border-slate-200 rounded-lg p-1 text-right text-sm font-bold text-slate-800 focus:ring-1 focus:ring-purple-500 focus:outline-none" />
                                            </div>
                                        </div>
                                        <input v-else type="number" min="0"
                                            v-model.number="b.merchCount"
                                            class="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-right text-sm font-bold text-slate-800 focus:ring-1 focus:ring-purple-500 focus:outline-none" />
                                    </td>
                                    <td class="px-3 py-2 text-right">
                                        <span class="font-bold text-sm" :class="serveConsumption(b) < 0 ? 'text-red-600' : 'text-slate-700'">
                                            {{ serveConsumption(b).toLocaleString() }}
                                        </span>
                                    </td>
                                </tr>
                            </template>
                        </tbody>
                        <tfoot>
                            <tr class="bg-slate-50">
                                <td class="px-3 py-2 text-xs font-bold text-slate-500">合計</td>
                                <td class="px-3 py-2 text-right text-sm font-bold text-slate-800">{{ totalFlavorConsumption.toLocaleString() }}g</td>
                                <td></td>
                                <td class="px-3 py-2 text-right text-sm font-bold text-slate-600">{{ totalMerchCount }} 個</td>
                                <td class="px-3 py-2 text-right text-sm font-bold text-purple-700">{{ totalFlavorServe.toLocaleString() }}g</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <!-- Step 4: 炭消費量 -->
            <div v-if="step === 4" class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <p class="text-sm text-slate-500">1箱 = 1kg として入力してください。</p>
                <div class="space-y-4">
                    <div v-for="brand in charcoalBrands" :key="brand.key" class="space-y-2">
                        <div class="text-sm font-bold text-slate-700">{{ brand.label }}</div>
                        <div class="grid grid-cols-2 gap-3 pl-2">
                            <div v-for="type in brand.types" :key="type.key" class="space-y-1">
                                <label class="text-xs text-slate-500">{{ type.label }}</label>
                                <div class="flex items-center gap-1">
                                    <input type="number" min="0" step="0.5"
                                        v-model.number="form.charcoal[type.field]"
                                        :disabled="type.disabled"
                                        class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center text-base font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:opacity-40" />
                                    <span class="text-xs text-slate-400 shrink-0">kg</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-slate-50 rounded-xl p-3 space-y-1 text-sm">
                    <div class="flex justify-between">
                        <span class="text-slate-500">提供の炭消費量</span>
                        <span class="font-bold text-slate-800">{{ charcoalServeTotal }} kg</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500">物販の炭販売量</span>
                        <span class="font-bold text-slate-600">{{ charcoalMerchTotal }} kg</span>
                    </div>
                </div>
            </div>

            <!-- Step 5: 計算プレビュー（ドリンク入力はドリンクモードで） -->
            <div v-if="step === 5" class="space-y-4">
                <!-- ドリンク発注一覧 [5-1]（修正・削除可） -->
                <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2">
                    <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">ドリンク発注記録 [5-1]</div>
                    <template v-if="drinkOrders.length > 0">
                        <div v-for="(d, idx) in drinkOrders" :key="d.id || idx"
                            class="py-2 border-b border-slate-50 last:border-0">
                            <!-- 編集フォーム -->
                            <template v-if="editingDrinkId === d.id">
                                <div class="space-y-2">
                                    <div class="grid grid-cols-2 gap-2">
                                        <div class="space-y-1">
                                            <label class="text-xs text-slate-400">発注日</label>
                                            <input type="date" v-model="editingDrink.orderDate"
                                                class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                        </div>
                                        <div class="space-y-1">
                                            <label class="text-xs text-slate-400">金額 (¥)</label>
                                            <input type="number" min="0" v-model.number="editingDrink.amount"
                                                class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                        </div>
                                    </div>
                                    <input type="text" v-model="editingDrink.description" placeholder="備考（任意）"
                                        class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    <div class="flex gap-2">
                                        <button type="button" @click="saveEditDrink(d)"
                                            :disabled="!editingDrink.orderDate || !editingDrink.amount || isSavingDrink"
                                            class="flex-1 py-2 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                            {{ isSavingDrink ? '保存中...' : '保存' }}
                                        </button>
                                        <button type="button" @click="cancelEditDrink"
                                            class="flex-1 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                            キャンセル
                                        </button>
                                    </div>
                                </div>
                            </template>
                            <!-- 通常表示 -->
                            <template v-else>
                                <div class="flex items-center justify-between">
                                    <div>
                                        <div class="text-sm font-bold text-slate-800">{{ d.orderDate }} — ¥{{ Number(d.amount).toLocaleString() }}</div>
                                        <div v-if="d.description" class="text-xs text-slate-400 mt-0.5">{{ d.description }}</div>
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <button type="button" @click="startEditDrink(d)"
                                            class="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-50 text-purple-600 border border-purple-200 hover:bg-purple-50 transition-colors">
                                            修正
                                        </button>
                                        <button type="button" @click="removeDrinkEntry(d)"
                                            class="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-50 text-red-500 border border-red-200 hover:bg-red-50 transition-colors">
                                            削除
                                        </button>
                                    </div>
                                </div>
                            </template>
                        </div>
                        <div class="flex justify-between text-sm pt-1">
                            <span class="text-slate-500">合計</span>
                            <span class="font-bold text-slate-800">¥{{ drinkTotal.toLocaleString() }}</span>
                        </div>
                    </template>
                    <p v-else class="text-sm text-slate-400">発注記録がありません。「ドリンク」モードで追加してください。</p>
                </div>

                <!-- 計算プレビュー -->
                <div class="bg-purple-50 border border-purple-100 rounded-2xl p-5 space-y-3">
                    <div class="text-xs font-bold text-purple-400 uppercase tracking-wider">計算結果プレビュー</div>
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <div v-for="item in calcPreview" :key="item.label"
                            class="bg-white rounded-xl p-3 shadow-sm">
                            <div class="text-xs text-slate-400 mb-0.5">{{ item.label }}</div>
                            <div class="font-bold text-slate-800">
                                {{ item.value !== null ? item.displayValue : '—' }}
                                <span v-if="item.value !== null" class="text-xs text-slate-400 font-normal ml-0.5">{{ item.unit }}</span>
                            </div>
                            <div class="text-xs text-slate-400 mt-0.5">{{ item.desc }}</div>
                        </div>
                    </div>
                </div>

                <!-- 送信ボタン -->
                <button type="button" @click="submitCostReport"
                    :disabled="isSubmitting"
                    class="w-full py-4 rounded-2xl text-base font-bold bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    {{ isSubmitting ? '保存中...' : '保存する' }}
                </button>
            </div>

            <!-- ナビゲーション -->
            <div class="flex gap-3">
                <button type="button" @click="prevCostStep"
                    class="flex-1 py-3 rounded-2xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                    {{ step === 1 ? '店舗選択に戻る' : '前へ' }}
                </button>
                <button v-if="step < 5" type="button" @click="nextCostStep"
                    :disabled="!canProceed"
                    class="flex-2 flex-1 py-3 rounded-2xl text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    次へ
                </button>
            </div>

            <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 font-medium">
                {{ errorMessage }}
            </div>
        </div>
    </main>
</template>

<script>
import { getBrandsForCost, getBrandConsumptionForCost, getCostReport, upsertCostReport, saveBrandSales, addDrinkOrder, updateDrinkOrder, deleteDrinkOrder, getDrinkOrders, fetchLatestTransferPeriodKey, getActiveCostPrice } from '../../api.js'
import { buildYearOptions, buildMonthOptions, composePeriodKey, parsePeriodKey } from '../../utils/periods.js'

// ブランド別デフォルト1パケあたりグラム数
const DEFAULT_GRAMS_PER_PACK = {
  'Al Fakher': 50,
  'Al Waha Elite Edition': 50,
  'Al Waha JSE': 50,
  'Afzal': 50,
  'Azure Gold/Black': 100,
  'Debaj': 50,
  'Dozaj': 50,
  'Fantasia': 100,
  'Fumari': 100,
  'Gixom': 50,
  'Hookafina': 100,
  'Mazaya': 50,
  'Musthave': 25,
  'Oduman Blend': 50,
  'Pure Tobacco': 100,
  'Revoshi': 50,
  'Starbuzz/Bold': 100,
  'Social Smoke': 100,
  'Trifecta': 100,
  'Tangiers': 100,
  'VV (Vang Vieng Mix)': 0
}

export default {
    name: 'CostApp',
    inject: ['requestConfirm'],
    props: {
        stores: { type: Array, default: () => [] }
    },
    emits: ['update:loading', 'update:loadingMessage', 'update:stepActive', 'submitted'],
    data() {
        return {
            step: 0,
            costSubMode: null,
            selectedStoreKey: '',
            selectedYear: '',
            selectedMonth: '',
            isDrinkLoading: false,
            form: {
                startDate: '',
                endDate: '',
                hookahs: { first: 0, charge: 0, refill: 0, staff: 0, event: 0 },
                charcoal: {
                    nyancoFlatServe: 0,
                    nyancoFlatMerch: 0,
                    nyancoCubeMerch: 0,
                    kingcoFlatServe: 0,
                    kingcoFlatMerch: 0,
                    kinkcoCubeMerch: 0
                },
                brandSales: [],
                prices: {
                    priceFlavorPerG: 40,
                    priceCharcoalPerKg: 600,
                    priceHookahFirst: 1900,
                    priceHookahRefill: 1800,
                    priceHookahStaff: 1800,
                    priceCharge: 900
                }
            },
            drinkOrders: [],
            newDrink: { orderDate: '', amount: null, description: '' },
            isAddingDrink: false,
            editingDrinkId: null,
            editingDrink: { orderDate: '', amount: null, description: '' },
            isSavingDrink: false,
            isSubmitting: false,
            errorMessage: '',
            existingReportId: null
        }
    },
    computed: {
        costStores() {
            return this.stores.filter((s) => s.key !== 'office')
        },
        years() { return buildYearOptions() },
        months() { return buildMonthOptions() },
        periodKey() {
            return composePeriodKey(this.selectedYear, this.selectedMonth)
        },
        periodLabel() {
            if (!this.selectedYear || !this.selectedMonth) return ''
            return `${this.selectedYear}年${String(this.selectedMonth).padStart(2, '0')}月`
        },
        currentStoreLabel() {
            const s = this.costStores.find((x) => x.key === this.selectedStoreKey)
            return s ? s.name : ''
        },
        stepLabels() {
            return ['集計期間', 'シーシャ販売数', 'フレーバー消費量', '炭消費量', '計算結果確認']
        },
        hookahFields() {
            return [
                { key: 'first', label: '① シーシャ1本目', unit: '本' },
                { key: 'charge', label: '② チャージ', unit: '個' },
                { key: 'refill', label: '③ おかわりシーシャ', unit: '本' },
                { key: 'staff', label: '④ スタッフシーシャ', unit: '本' },
                { key: 'event', label: '⑤ イベント等', unit: '本' }
            ]
        },
        charcoalBrands() {
            return [
                {
                    key: 'nyanco', label: 'ニャンココ',
                    types: [
                        { key: 'nf_serve', label: 'FLAT 提供', field: 'nyancoFlatServe' },
                        { key: 'nf_merch', label: 'FLAT 物販', field: 'nyancoFlatMerch' },
                        { key: 'nc_serve', label: 'CUBE 提供', field: '_nyancoNoServe', disabled: true },
                        { key: 'nc_merch', label: 'CUBE 物販', field: 'nyancoCubeMerch', disabled: false }
                    ]
                },
                {
                    key: 'kingco', label: 'KINGCO',
                    types: [
                        { key: 'kf_serve', label: 'FLAT 提供', field: 'kingcoFlatServe' },
                        { key: 'kf_merch', label: 'FLAT 物販', field: 'kingcoFlatMerch' },
                        { key: 'kc_serve', label: 'CUBE 提供', field: '_kingcoNoServe', disabled: true },
                        { key: 'kc_merch', label: 'CUBE 物販', field: 'kinkcoCubeMerch', disabled: false }
                    ]
                }
            ]
        },
        totalServings() {
            const h = this.form.hookahs
            return (h.first || 0) + (h.refill || 0) + (h.staff || 0) + (h.event || 0)
        },
        totalVisitors() {
            const h = this.form.hookahs
            return (h.charge || 0) + (h.refill || 0) + (h.staff || 0) + (h.event || 0)
        },
        charcoalServeTotal() {
            const c = this.form.charcoal
            return (c.nyancoFlatServe || 0) + (c.kingcoFlatServe || 0)
        },
        charcoalMerchTotal() {
            const c = this.form.charcoal
            return (c.nyancoFlatMerch || 0) + (c.nyancoCubeMerch || 0) + (c.kingcoFlatMerch || 0) + (c.kinkcoCubeMerch || 0)
        },
        totalFlavorConsumption() {
            return this.form.brandSales.reduce((acc, b) => acc + (b.totalConsumptionG || 0), 0)
        },
        totalFlavorServe() {
            return this.form.brandSales.reduce((acc, b) => acc + Math.max(0, this.serveConsumption(b)), 0)
        },
        totalMerchCount() {
            return this.form.brandSales.reduce((acc, b) => acc + (b.merchCount || 0) + (b.merchCount250 || 0), 0)
        },
        drinkTotal() {
            return this.drinkOrders.reduce((acc, d) => acc + (d.amount || 0), 0)
        },
        dayCount() {
            if (!this.form.startDate || !this.form.endDate) return 0
            const diff = new Date(this.form.endDate) - new Date(this.form.startDate)
            return Math.round(diff / (1000 * 60 * 60 * 24)) + 1
        },
        calcA() {
            return this.totalServings > 0 ? this.totalFlavorServe / this.totalServings : 0
        },
        calcB() { return this.form.prices.priceFlavorPerG * this.calcA },
        calcC() {
            return this.totalServings > 0 ? this.charcoalServeTotal * 1000 / this.totalServings : 0
        },
        calcD() { return this.form.prices.priceCharcoalPerKg * this.calcC / 1000 },
        calcE() {
            return this.totalVisitors > 0 ? this.drinkTotal / this.totalVisitors : 0
        },
        calcF() {
            return this.totalVisitors > 0 ? this.totalServings / this.totalVisitors : 0
        },
        calcPreview() {
            const fmt = (v, digits = 2) => v > 0 ? v.toFixed(digits) : null
            return [
                { label: 'A', desc: '1本当たりフレーバー使用量', value: fmt(this.calcA), displayValue: fmt(this.calcA), unit: 'g' },
                { label: 'B', desc: '1本当たりフレーバー原価', value: fmt(this.calcB), displayValue: `¥${Math.round(this.calcB).toLocaleString()}`, unit: '' },
                { label: 'C', desc: '1本当たり炭使用量', value: fmt(this.calcC), displayValue: fmt(this.calcC), unit: 'g' },
                { label: 'D', desc: '1本当たり炭原価', value: fmt(this.calcD), displayValue: `¥${Math.round(this.calcD).toLocaleString()}`, unit: '' },
                { label: 'E', desc: '1人当たりドリンク代', value: this.totalVisitors > 0 ? fmt(this.calcE) : null, displayValue: `¥${Math.round(this.calcE).toLocaleString()}`, unit: '' },
                { label: 'F', desc: '1人当たりシーシャ本数', value: this.totalVisitors > 0 ? fmt(this.calcF, 2) : null, displayValue: fmt(this.calcF, 2), unit: '本' }
            ]
        },
        canProceed() {
            if (this.step === 1) return !!(this.form.startDate && this.form.endDate)
            return true
        }
    },
    created() {
        this.initializeLatestPeriod()
    },
    watch: {
        costSubMode(newVal) {
            if (newVal === 'drink' && this.selectedStoreKey && this.periodKey) {
                this.loadDrinkOrders()
            } else if (newVal !== 'drink' && this.step === 0) {
                this.drinkOrders = []
            }
        },
        selectedStoreKey() {
            if (this.costSubMode === 'drink' && this.selectedStoreKey && this.periodKey) {
                this.loadDrinkOrders()
            } else if (this.step === 0) {
                this.drinkOrders = []
            }
        },
        periodKey() {
            if (this.costSubMode === 'drink' && this.selectedStoreKey && this.periodKey) {
                this.loadDrinkOrders()
            } else if (this.step === 0) {
                this.drinkOrders = []
            }
        }
    },
    methods: {
        async initializeLatestPeriod() {
            try {
                const latestPeriodKey = await fetchLatestTransferPeriodKey()
                if (latestPeriodKey) {
                    const parsed = parsePeriodKey(latestPeriodKey)
                    if (parsed) {
                        this.selectedYear = String(parsed.year)
                        this.selectedMonth = String(parsed.month)
                    }
                }
            } catch (e) {
                console.error('最新対象月の読み込みに失敗しました:', e)
            }
        },
        serveConsumption(b) {
            if (b.brandName === 'Tangiers') {
                return (b.totalConsumptionG || 0) - (b.merchCount || 0) * 100 - (b.merchCount250 || 0) * 250
            }
            return (b.totalConsumptionG || 0) - (b.merchCount || 0) * (b.gramsPerPack || 0)
        },
        async loadDrinkOrders() {
            if (!this.selectedStoreKey || !this.periodKey) return
            this.isDrinkLoading = true
            this.errorMessage = ''
            try {
                const drinks = await getDrinkOrders(this.selectedStoreKey, this.periodKey)
                this.drinkOrders = drinks.map((d) => ({
                    id: d.id, orderDate: d.order_date, amount: d.amount, description: d.description
                }))
            } catch (e) {
                this.errorMessage = e.message || 'ドリンク一覧の読み込みに失敗しました。'
                this.drinkOrders = []
            } finally {
                this.isDrinkLoading = false
            }
        },
        async startCostEntry() {
            if (!this.selectedStoreKey || !this.periodKey) return
            this.$emit('update:loading', true)
            this.$emit('update:loadingMessage', 'データを読み込み中...')
            this.errorMessage = ''
            try {
                const parsed = parsePeriodKey(this.periodKey)
                const prevPeriodKey = parsed
                    ? composePeriodKey(
                        parsed.month === 1 ? parsed.year - 1 : parsed.year,
                        parsed.month === 1 ? 12 : parsed.month - 1
                      )
                    : null
                const [existing, brands, consumptionMap, prevReport, activePrices] = await Promise.all([
                    getCostReport(this.selectedStoreKey, this.periodKey),
                    getBrandsForCost(),
                    getBrandConsumptionForCost(this.selectedStoreKey, this.periodKey),
                    prevPeriodKey ? getCostReport(this.selectedStoreKey, prevPeriodKey).catch(() => null) : Promise.resolve(null),
                    getActiveCostPrice(this.periodKey).catch(() => null)
                ])

                if (existing) {
                    this.existingReportId = existing.report.id
                    const r = existing.report
                    this.form.startDate = r.start_date
                    this.form.endDate = r.end_date
                    this.form.hookahs = {
                        first: r.hookahs_first, charge: r.hookahs_charge,
                        refill: r.hookahs_refill, staff: r.hookahs_staff, event: r.hookahs_event
                    }
                    this.form.charcoal = {
                        nyancoFlatServe: r.charcoal_nyanco_flat_serve,
                        nyancoFlatMerch: r.charcoal_nyanco_flat_merch,
                        nyancoCubeMerch: r.charcoal_nyanco_cube_merch,
                        kingcoFlatServe: r.charcoal_kingco_flat_serve,
                        kingcoFlatMerch: r.charcoal_kingco_flat_merch,
                        kinkcoCubeMerch: r.charcoal_kingco_cube_merch
                    }
                    // 価格は常に cost_price_masters から該当期間のものを参照（snapshot 廃止）
                    if (activePrices) {
                        this.form.prices = {
                            priceFlavorPerG: Number(activePrices.price_flavor_per_g) || 40,
                            priceCharcoalPerKg: Number(activePrices.price_charcoal_per_kg) || 600,
                            priceHookahFirst: Number(activePrices.price_hookah_first) || 1900,
                            priceHookahRefill: Number(activePrices.price_hookah_refill) || 1800,
                            priceHookahStaff: Number(activePrices.price_hookah_staff) || 1800,
                            priceCharge: Number(activePrices.price_charge) || 900
                        }
                    }
                    const salesMap = new Map(existing.brandSales.map((s) => [s.brand_id, s]))
                    this.form.brandSales = brands.map((b) => {
                        const saved = salesMap.get(b.id)
                        return {
                            brandId: b.id,
                            brandName: b.name,
                            totalConsumptionG: consumptionMap.get(b.id) ?? 0,
                            gramsPerPack: DEFAULT_GRAMS_PER_PACK[b.name] ?? 50,
                            merchCount: saved?.merch_count ?? 0,
                            merchCount250: saved?.merch_count_secondary ?? 0
                        }
                    })
                    this.drinkOrders = existing.drinks.map((d) => ({
                        id: d.id, orderDate: d.order_date, amount: d.amount, description: d.description
                    }))
                } else {
                    this.existingReportId = null
                    this.form.brandSales = brands.map((b) => ({
                        brandId: b.id,
                        brandName: b.name,
                        totalConsumptionG: consumptionMap.get(b.id) ?? 0,
                        gramsPerPack: DEFAULT_GRAMS_PER_PACK[b.name] ?? 50,
                        merchCount: 0,
                        merchCount250: 0
                    }))
                    const drinks = await getDrinkOrders(this.selectedStoreKey, this.periodKey)
                    this.drinkOrders = drinks.map((d) => ({
                        id: d.id, orderDate: d.order_date, amount: d.amount, description: d.description
                    }))
                    let autoStartDate = ''
                    if (prevReport && prevReport.report && prevReport.report.end_date) {
                        const prevEnd = new Date(prevReport.report.end_date)
                        prevEnd.setDate(prevEnd.getDate() + 1)
                        autoStartDate = prevEnd.toISOString().slice(0, 10)
                    }
                    this.form.startDate = autoStartDate
                    this.form.endDate = ''
                    this.form.hookahs = { first: 0, charge: 0, refill: 0, staff: 0, event: 0 }
                    this.form.charcoal = {
                        nyancoFlatServe: 0, nyancoFlatMerch: 0, nyancoCubeMerch: 0,
                        kingcoFlatServe: 0, kingcoFlatMerch: 0, kinkcoCubeMerch: 0
                    }
                    // 対象期間に適用される価格マスタをセット
                    if (activePrices) {
                        this.form.prices = {
                            priceFlavorPerG: Number(activePrices.price_flavor_per_g) || 40,
                            priceCharcoalPerKg: Number(activePrices.price_charcoal_per_kg) || 600,
                            priceHookahFirst: Number(activePrices.price_hookah_first) || 1900,
                            priceHookahRefill: Number(activePrices.price_hookah_refill) || 1800,
                            priceHookahStaff: Number(activePrices.price_hookah_staff) || 1800,
                            priceCharge: Number(activePrices.price_charge) || 900
                        }
                    }
                }
                this.step = 1
                this.$emit('update:stepActive', true)
            } catch (e) {
                this.errorMessage = e.message || 'データの読み込みに失敗しました。'
            } finally {
                this.$emit('update:loading', false)
            }
        },
        nextCostStep() {
            if (this.step < 5) this.step++
            window.scrollTo({ top: 0, behavior: 'smooth' })
        },
        prevCostStep() {
            if (this.step > 1) {
                this.step--
                window.scrollTo({ top: 0, behavior: 'smooth' })
            } else {
                this.step = 0
                this.$emit('update:stepActive', false)
            }
        },
        goBackToTop() {
            this.step = 0
            this.$emit('update:stepActive', false)
        },
        async addDrinkEntry() {
            if (!this.newDrink.orderDate || !this.newDrink.amount) return
            this.isAddingDrink = true
            this.errorMessage = ''
            try {
                const saved = await addDrinkOrder(this.selectedStoreKey, this.periodKey, {
                    orderDate: this.newDrink.orderDate,
                    amount: this.newDrink.amount,
                    description: this.newDrink.description
                })
                this.drinkOrders.push({
                    id: saved.id,
                    orderDate: saved.order_date,
                    amount: saved.amount,
                    description: saved.description
                })
                this.newDrink = { orderDate: '', amount: null, description: '' }
            } catch (e) {
                this.errorMessage = e.message || 'ドリンク発注の保存に失敗しました。'
            } finally {
                this.isAddingDrink = false
            }
        },
        async startEditDrink(drink) {
            if (!await this.requestConfirm('この記録を修正しますか？')) return
            this.editingDrinkId = drink.id
            this.editingDrink = { orderDate: drink.orderDate, amount: drink.amount, description: drink.description || '' }
        },
        cancelEditDrink() {
            this.editingDrinkId = null
            this.editingDrink = { orderDate: '', amount: null, description: '' }
        },
        async saveEditDrink(drink) {
            if (!this.editingDrink.orderDate || !this.editingDrink.amount) return
            this.isSavingDrink = true
            this.errorMessage = ''
            try {
                const saved = await updateDrinkOrder(drink.id, {
                    orderDate: this.editingDrink.orderDate,
                    amount: this.editingDrink.amount,
                    description: this.editingDrink.description
                })
                const idx = this.drinkOrders.findIndex((d) => d.id === drink.id)
                if (idx !== -1) {
                    this.drinkOrders[idx] = {
                        id: saved.id,
                        orderDate: saved.order_date,
                        amount: saved.amount,
                        description: saved.description
                    }
                }
                this.editingDrinkId = null
            } catch (e) {
                this.errorMessage = e.message || '更新に失敗しました。'
            } finally {
                this.isSavingDrink = false
            }
        },
        async removeDrinkEntry(drink) {
            if (!await this.requestConfirm('この記録を削除しますか？')) return
            this.errorMessage = ''
            try {
                if (drink.id) await deleteDrinkOrder(drink.id)
                this.drinkOrders = this.drinkOrders.filter((d) => d !== drink)
                if (this.editingDrinkId === drink.id) this.editingDrinkId = null
            } catch (e) {
                this.errorMessage = e.message || '削除に失敗しました。'
            }
        },
        async submitCostReport() {
            this.isSubmitting = true
            this.errorMessage = ''
            this.$emit('update:loading', true)
            this.$emit('update:loadingMessage', '保存中...')
            try {
                const c = this.form.charcoal
                const reportId = await upsertCostReport(this.selectedStoreKey, this.periodKey, {
                    start_date: this.form.startDate,
                    end_date: this.form.endDate,
                    hookahs_first: this.form.hookahs.first || 0,
                    hookahs_charge: this.form.hookahs.charge || 0,
                    hookahs_refill: this.form.hookahs.refill || 0,
                    hookahs_staff: this.form.hookahs.staff || 0,
                    hookahs_event: this.form.hookahs.event || 0,
                    charcoal_nyanco_flat_serve: c.nyancoFlatServe || 0,
                    charcoal_nyanco_flat_merch: c.nyancoFlatMerch || 0,
                    charcoal_nyanco_cube_merch: c.nyancoCubeMerch || 0,
                    charcoal_kingco_flat_serve: c.kingcoFlatServe || 0,
                    charcoal_kingco_flat_merch: c.kingcoFlatMerch || 0,
                    charcoal_kingco_cube_merch: c.kinkcoCubeMerch || 0
                })
                await saveBrandSales(reportId, this.form.brandSales.filter((b) => b.totalConsumptionG !== 0 || b.merchCount > 0 || (b.merchCount250 || 0) > 0))
                this.$emit('submitted')
                this.step = 0
                this.$emit('update:stepActive', false)
            } catch (e) {
                this.errorMessage = e.message || '保存に失敗しました。'
            } finally {
                this.isSubmitting = false
                this.$emit('update:loading', false)
            }
        }
    }
}
</script>
