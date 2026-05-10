<template>
    <footer v-if="(appMode !== null && currentStep > 0) || (appMode === 'transfer' && transferStep !== 0) || (appMode === 'dashboard' && dashboardSubModeActive)" class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 pb-safe-area">
        <div class="container mx-auto max-w-lg md:max-w-7xl flex justify-between items-center">
            <button @click="$emit('prev-step')"
                class="px-6 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors active:scale-95 text-sm">
                戻る
            </button>
            <div class="flex space-x-3">
                <!-- Inventory Buttons -->
                <template v-if="appMode === 'inventory'">
                    <button v-if="currentStep < 4" @click="$emit('next-step')"
                        class="group bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-slate-900/20 transition-colors transition-transform active:scale-95 flex items-center gap-2">
                        <span>次へ</span>
                        <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none"
                            stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7">
                            </path>
                        </svg>
                    </button>
                    <button v-if="currentStep === 4" @click="$emit('submit-inventory')"
                        :disabled="inventoryCheckingConsumption"
                        class="bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-brand-500/30 transition-transform transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                        完了する
                    </button>
                </template>

                <!-- Request Buttons -->
                <template v-if="appMode === 'request'">
                    <button v-if="currentStep === 1" @click="$emit('open-request-review-modal')"
                        :disabled="requestTotalQty === 0"
                        class="group bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-slate-900/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        <span>内容を確認</span>
                        <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none"
                            stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7">
                            </path>
                        </svg>
                    </button>
                </template>

                <!-- Transfer Buttons -->
                <template v-if="appMode === 'transfer'">
                    <!-- 1A: 起票入力 → 確認へ -->
                    <button v-if="transferStep === '1a'" @click="$emit('go-to-issue-confirm')"
                        :disabled="issueConfirmItemsEmpty"
                        class="group bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        <span>内容を確認</span>
                        <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none"
                            stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7">
                            </path>
                        </svg>
                    </button>
                    <!-- 2A: 起票確認 → 送信 -->
                    <button v-if="transferStep === '2a'" @click="$emit('submit-issue')"
                        :disabled="issueConfirmItemsEmpty"
                        class="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-500/30 transition-transform transition-colors active:scale-95 disabled:opacity-50">
                        データを記録
                    </button>
                    <!-- 1B: 検品 → 完了 -->
                    <button v-if="transferStep === '1b'" @click="$emit('submit-inspection')" :disabled="!inspectAllChecked"
                        class="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-500/30 transition-transform transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                        検品を完了
                    </button>
                    <!-- 1C: 修正 → 保存 -->
                    <button v-if="transferStep === '1c'" @click="$emit('submit-transfer-amend')"
                        class="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-500/30 transition-transform transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                        修正を保存
                    </button>
                </template>
            </div>
        </div>
    </footer>
</template>

<script>
export default {
    name: 'AppFooter',
    props: {
        appMode: {
            type: String,
            default: null
        },
        currentStep: {
            type: Number,
            default: 0
        },
        transferStep: {
            type: [Number, String],
            default: 0
        },
        dashboardSubModeActive: {
            type: Boolean,
            default: false
        },
        requestTotalQty: {
            type: Number,
            default: 0
        },
        issueConfirmItemsEmpty: {
            type: Boolean,
            default: true
        },
        inspectAllChecked: {
            type: Boolean,
            default: false
        },
        amendItemsEmpty: {
            type: Boolean,
            default: true
        },
        inventoryCheckingConsumption: {
            type: Boolean,
            default: false
        },
    },
    emits: [
        'prev-step',
        'next-step',
        'submit-inventory',
        'open-request-review-modal',
        'go-to-issue-confirm',
        'submit-issue',
        'submit-inspection',
        'submit-transfer-amend'
    ],
}

</script>
