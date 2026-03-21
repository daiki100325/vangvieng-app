<template>
    <div class="flex flex-col items-center justify-center py-10">
        <h3 class="text-lg font-bold text-slate-600 mb-6 bg-slate-100 px-6 py-2 rounded-full">業務を選択してください</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
            <!-- Inventory App Card -->
            <button @click="$emit('open-inventory')"
                class="group bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-colors transition-transform transition-shadow duration-300 text-left flex flex-col h-full focus:outline-none focus:ring-4 focus:ring-brand-500/20 active:scale-95">
                <div
                    class="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-6 shadow-inner group-hover:bg-brand-600 transition-colors duration-300">
                    <svg class="w-8 h-8 text-brand-600 group-hover:text-white transition-colors duration-300"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01">
                        </path>
                    </svg>
                </div>
                <h3
                    class="text-2xl font-bold text-slate-800 mb-2 group-hover:text-brand-600 transition-colors">
                    棚卸し入力</h3>
                <p class="text-slate-500 font-medium leading-relaxed flex-grow">
                    各店舗の月末棚卸し結果をシステムに入力し、在庫情報を更新します。</p>
                <div
                    class="mt-6 flex items-center text-brand-600 font-bold text-sm bg-brand-50 px-4 py-2 rounded-full self-start">
                    <span>開く</span>
                    <svg class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7">
                        </path>
                    </svg>
                </div>
            </button>

            <!-- Request App Card -->
            <button @click="$emit('open-request')"
                class="group bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-colors transition-transform transition-shadow duration-300 text-left flex flex-col h-full focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:scale-95">
                <div
                    class="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mb-6 shadow-inner group-hover:bg-orange-600 transition-colors duration-300">
                    <svg class="w-8 h-8 text-orange-600 group-hover:text-white transition-colors duration-300"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                    </svg>
                </div>
                <h3
                    class="text-2xl font-bold text-slate-800 mb-2 group-hover:text-orange-600 transition-colors">
                    補充依頼</h3>
                <p class="text-slate-500 font-medium leading-relaxed flex-grow">
                    他店舗の在庫数を確認し、在庫が不足しているフレーバーの補充依頼を作成します。</p>
                <div
                    class="mt-6 flex items-center text-orange-600 font-bold text-sm bg-orange-50 px-4 py-2 rounded-full self-start">
                    <span>開く</span>
                    <svg class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7">
                        </path>
                    </svg>
                </div>
            </button>

            <!-- Transfer Record Card -->
            <button @click="$emit('open-transfer')"
                class="group bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-colors transition-transform transition-shadow duration-300 text-left flex flex-col h-full focus:outline-none focus:ring-4 focus:ring-emerald-500/20 active:scale-95">
                <div
                    class="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6 shadow-inner group-hover:bg-emerald-600 transition-colors duration-300">
                    <svg class="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors duration-300"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z">
                        </path>
                    </svg>
                </div>
                <h3
                    class="text-2xl font-bold text-slate-800 mb-2 group-hover:text-emerald-600 transition-colors">
                    移動記録</h3>
                <p class="text-slate-500 font-medium leading-relaxed flex-grow">
                    店舗間の商品移動を起票・記録し、受け取り側が検品を行います。</p>
                <div
                    class="mt-6 flex items-center text-emerald-600 font-bold text-sm bg-emerald-50 px-4 py-2 rounded-full self-start">
                    <span>開く</span>
                    <svg class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7">
                        </path>
                    </svg>
                </div>
            </button>

            <!-- Stock Overview Card -->
            <button @click="$emit('open-stock')"
                class="group bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-colors transition-transform transition-shadow duration-300 text-left flex flex-col h-full focus:outline-none focus:ring-4 focus:ring-red-500/20 active:scale-95">
                <div
                    class="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-6 shadow-inner group-hover:bg-red-600 transition-colors duration-300">
                    <svg class="w-8 h-8 text-red-600 group-hover:text-white transition-colors duration-300"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z">
                        </path>
                    </svg>
                </div>
                <h3
                    class="text-2xl font-bold text-slate-800 mb-2 group-hover:text-red-600 transition-colors">
                    在庫量確認</h3>
                <p class="text-slate-500 font-medium leading-relaxed flex-grow">
                    各フレーバーの総在庫量・前月消費量を一覧表示します。発注の際の参考にどうぞ。</p>
                <div
                    class="mt-6 flex items-center text-red-600 font-bold text-sm bg-red-50 px-4 py-2 rounded-full self-start">
                    <span>開く</span>
                    <svg class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7">
                        </path>
                    </svg>
                </div>
            </button>
        </div>
    </div>
</template>

<script>
export default {
    name: 'PortalMenu',
    emits: ['open-inventory', 'open-request', 'open-transfer', 'open-stock']
}
</script>
