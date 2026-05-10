<template>
    <header class="bg-white/90 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200/60 shadow-sm transform-gpu">
        <div class="container mx-auto px-4 h-16 flex justify-between items-center relative">
            <!-- Portal Back Button (Only visible when within an app) -->
            <button v-if="appMode !== null" @click="$emit('return-to-portal')"
                class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 transition-colors active:scale-95 z-40">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7">
                    </path>
                </svg>
            </button>

            <div class="flex items-center gap-2" :class="{'ml-12': appMode !== null}">
                <div class="w-2 h-7 rounded-full shrink-0 self-center"
                    :class="appMode === null ? 'bg-slate-600' : (appMode === 'request' ? 'bg-orange-600' : (appMode === 'transfer' ? 'bg-emerald-600' : (appMode === 'dashboard' ? 'bg-red-600' : (appMode === 'cost' ? 'bg-purple-600' : (appMode === 'admin' ? 'bg-slate-600' : 'bg-brand-600')))))">
                </div>
                <div v-if="appMode === null" class="flex flex-col min-w-0 leading-tight">
                    <h1 class="text-xl font-bold tracking-tight text-slate-800">V-MINT test</h1>
                    <span class="text-[11px] text-slate-500 font-medium">店舗業務ポータル</span>
                </div>
                <h1 v-else class="text-xl font-bold tracking-tight text-slate-800">
                    {{ appMode === 'request' ? '補充依頼' : (appMode === 'inventory' ? '棚卸し入力' : (appMode === 'transfer' ? '移動記録' : (appMode === 'cost' ? '原価計算' : (appMode === 'admin' ? '管理者画面' : 'ダッシュボード')))) }}
                </h1>
                <span v-if="currentStoreName && appMode === 'inventory'"
                    class="ml-2 px-3 py-1 bg-gradient-to-br from-brand-600 to-brand-500 text-white font-bold text-base rounded-lg shadow-sm border border-brand-400">
                    {{ currentStoreName }}
                </span>
                <span v-if="requestCurrentStoreName && appMode === 'request'"
                    class="ml-2 px-3 py-1 bg-gradient-to-br from-orange-600 to-orange-500 text-white font-bold text-base rounded-lg shadow-sm border border-orange-400">
                    {{ requestCurrentStoreName }}
                </span>
            </div>

            <!-- Inventory Indicators -->
            <div v-if="appMode === 'inventory' && currentStep > 0" class="text-right flex flex-col items-end">
                <span class="text-[10px] text-slate-400 font-bold block mb-0.5">{{ currentMonth }} / {{ currentDate }}</span>
                <span class="text-xs font-bold text-brand-700 px-2.5 py-0.5 bg-brand-50 border border-brand-100 rounded-full">
                    Step {{ displayStep }}/{{ totalSteps }}
                </span>
            </div>

            <!-- Request Indicators -->
            <div v-if="appMode === 'request' && currentStep > 0" class="text-right flex flex-col items-end">
                <span class="text-[10px] text-slate-400 font-bold block mb-0.5">移動総量</span>
                <div class="flex items-baseline justify-end gap-1">
                    <span class="text-2xl font-black text-orange-600 leading-none">{{ requestTotalQty }}</span>
                    <span class="text-xs font-bold text-slate-500">g</span>
                </div>
            </div>

            <!-- Transfer Issue Route -->
            <div v-if="appMode === 'transfer' && transferStep === '1a' && transferIssueFrom && transferIssueTo"
                class="flex items-center gap-1.5">
                <span class="text-sm font-black text-slate-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-lg leading-none max-w-[90px] truncate" :title="transferIssueFrom">{{ transferIssueFrom }}</span>
                <svg class="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 12h14M13 6l6 6-6 6"/>
                </svg>
                <span class="text-sm font-black text-slate-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-lg leading-none max-w-[90px] truncate" :title="transferIssueTo">{{ transferIssueTo }}</span>
            </div>
        </div>
    </header>
</template>

<script>
export default {
    name: 'AppHeader',
    props: {
        appMode: {
            type: String,
            default: null
        },
        currentStep: {
            type: Number,
            default: 0
        },
        displayStep: {
            type: Number,
            default: 1
        },
        totalSteps: {
            type: Number,
            default: 4
        },
        currentStoreName: {
            type: String,
            default: ''
        },
        requestCurrentStoreName: {
            type: String,
            default: ''
        },
        requestTotalQty: {
            type: Number,
            default: 0
        },
        currentMonth: {
            type: String,
            default: ''
        },
        currentDate: {
            type: String,
            default: ''
        },
        transferStep: {
            type: [Number, String],
            default: 0
        },
        transferIssueFrom: {
            type: String,
            default: ''
        },
        transferIssueTo: {
            type: String,
            default: ''
        }
    },
    emits: ['return-to-portal']
}
</script>
