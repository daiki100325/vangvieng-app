<template>
    <div id="app" class="min-h-[100dvh] flex flex-col">

        <!-- Header -->
        <header
            class="bg-white/90 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200/60 shadow-sm transform-gpu">
            <div class="container mx-auto px-4 h-16 flex justify-between items-center relative">
                <!-- Portal Back Button (Only visible when within an app) -->
                <button v-if="appMode !== null" @click="returnToPortal"
                    class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 transition-colors active:scale-95 z-40">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7">
                        </path>
                    </svg>
                </button>

                <div class="flex items-center gap-2" :class="{'ml-12': appMode !== null}">
                    <div class="w-2 h-7 rounded-full"
                        :class="appMode === null ? 'bg-slate-600' : (appMode === 'request' ? 'bg-orange-600' : (appMode === 'transfer' ? 'bg-emerald-600' : (appMode === 'stock' ? 'bg-red-600' : 'bg-brand-600')))">
                    </div>
                    <h1 class="text-xl font-bold tracking-tight text-slate-800">
                        {{ appMode === 'request' ? '補充依頼' : (appMode === 'inventory' ? '棚卸し入力' : (appMode === 'transfer'
                        ? '移動記録' : (appMode === 'stock' ? '在庫量確認' : '店舗業務ポータル'))) }}
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
                    <span class="text-[10px] text-slate-400 font-bold block mb-0.5">{{ currentMonth }} / {{ currentDate
                        }}</span>
                    <span
                        class="text-xs font-bold text-brand-700 px-2.5 py-0.5 bg-brand-50 border border-brand-100 rounded-full">
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
            </div>
        </header>

        <!-- Loading Overlay -->
        <div v-if="loading"
            class="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col justify-center items-center z-50">
            <div class="w-12 h-12 border-4 border-slate-100 rounded-full animate-spin mb-4"
                :class="appMode === 'request' ? 'border-l-orange-600' : 'border-l-brand-600'"></div>
            <p class="font-bold animate-pulse" :class="appMode === 'request' ? 'text-orange-600' : 'text-brand-600'">{{
                loadingMessage }}</p>
        </div>

        <!-- Main Content -->
        <main class="container mx-auto px-4 py-6 max-w-lg md:max-w-7xl transition-all duration-300 flex-grow">

            <!-- Portal Screen -->
            <transition name="slide-up">
                <div v-if="appMode === null" class="flex flex-col items-center justify-center py-10">
                    <h2 class="text-2xl font-bold text-slate-800 mb-8">業務を選択してください</h2>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                        <!-- Inventory App Card -->
                        <button @click="openInventoryApp"
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
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 5l7 7-7 7"></path>
                                </svg>
                            </div>
                        </button>

                        <!-- Request App Card -->
                        <button @click="openRequestApp"
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
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 5l7 7-7 7"></path>
                                </svg>
                            </div>
                        </button>

                        <!-- Transfer Record Card -->
                        <button @click="openTransferApp"
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
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 5l7 7-7 7"></path>
                                </svg>
                            </div>
                        </button>

                        <!-- Stock Overview Card -->
                        <button @click="openStockApp"
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
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 5l7 7-7 7"></path>
                                </svg>
                            </div>
                        </button>
                    </div>
                </div>
            </transition>

            <!-- ========================================== -->
            <!-- INVENTORY APP (棚卸し)                       -->
            <!-- ========================================== -->

            <!-- Inventory Step 0: Setup -->
            <transition name="slide-up">
                <div v-if="appMode === 'inventory' && currentStep === 0"
                    class="flex flex-col items-center justify-center py-10">
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
                                    <select v-model="storeKey" :class="storeKey ? 'text-slate-800' : 'text-slate-500'"
                                        class="appearance-none w-full bg-slate-50 border border-slate-200 text-lg font-bold rounded-xl focus:ring-2 focus:ring-brand-500 block p-4 text-center cursor-pointer">
                                        <option value="" disabled>店舗を選択してください</option>
                                        <option v-for="store in stores" :value="store.key" class="text-slate-800">{{
                                            store.name }}</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label
                                    class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">対象月</label>
                                <div class="relative">
                                    <select v-model="month" :class="month ? 'text-slate-800' : 'text-slate-500'"
                                        class="appearance-none w-full bg-slate-50 border border-slate-200 text-lg font-bold rounded-xl focus:ring-2 focus:ring-brand-500 block p-4 text-center">
                                        <option value="" disabled>実施月を選択してください</option>
                                        <option v-for="m in months" :value="m" class="text-slate-800">{{ m }}</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label
                                    class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">実施日</label>
                                <input type="date" v-model="date" :class="date ? 'text-slate-800' : 'text-slate-500'"
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
            <div v-if="appMode === 'inventory' && currentStep === 1" class="space-y-4">
                <div class="flex items-center gap-2 mb-2 px-1">
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
                            <div class="font-bold text-base leading-tight">{{ item.flavorName }}</div>
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
            <div v-if="appMode === 'inventory' && currentStep === 2" class="space-y-4">
                <div class="flex items-center gap-2 mb-2 px-1">
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
                            <div class="font-bold text-base leading-tight">{{ item.flavorName }}</div>
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
            <div v-if="appMode === 'inventory' && currentStep === 3" class="space-y-4">
                <div class="flex items-center gap-2 mb-2 px-1">
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
                            <div class="font-bold text-base leading-tight">{{ item.flavorName }}</div>
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
                <div class="h-20"></div>
            </div>

            <!-- Inventory Step 4: Confirmation -->
            <div v-if="appMode === 'inventory' && currentStep === 4" class="space-y-4">
                <div class="flex items-center gap-2 mb-2 px-1">
                    <h2 class="text-lg font-bold text-slate-800">入力内容確認</h2>
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
                                        <div class="text-sm text-slate-800 font-bold leading-tight">{{ item.flavorName
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
                <div class="h-20"></div>
            </div>

        </main>

        <!-- ================================================= -->
        <!-- TRANSFER APP (移動記録)                             -->
        <!-- ================================================= -->
        <main v-if="appMode === 'transfer'"
            class="container mx-auto px-4 py-6 max-w-lg md:max-w-3xl transition-all duration-300 flex-grow">

            <!-- Step 0: トップ画面 -->
            <transition name="slide-up">
                <div v-if="transferStep === 0" class="flex flex-col items-center justify-center py-10">
                    <div
                        class="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 w-full max-w-md">
                        <h2 class="text-xl font-bold text-slate-700 mb-8 text-center">移動記録</h2>

                        <div v-if="errorMessage"
                            class="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-700 font-medium">
                            {{ errorMessage }}
                        </div>

                        <!-- 対象月 -->
                        <div class="mb-5">
                            <label
                                class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">対象月</label>
                            <div class="relative">
                                <select v-model="transferMonth"
                                    :class="transferMonth ? 'text-slate-800' : 'text-slate-500'"
                                    class="appearance-none w-full bg-slate-50 border border-slate-200 text-lg font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 block p-4 text-center">
                                    <option value="" disabled>実施月を選択してください</option>
                                    <option v-for="m in months" :value="m" class="text-slate-800">{{ m }}</option>
                                </select>
                            </div>
                            <p class="text-xs text-slate-500 mt-2">
                                その月の棚卸しが全拠点完了し、まだ月をまたいでいない場合、来月を選んでください。<br>
                                例）３月の棚卸しが全拠点完了し、3/30に移動する場合、4月を選択。
                            </p>
                        </div>

                        <!-- サブモード選択 -->
                        <div class="mb-6">
                            <label
                                class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">実施タスク</label>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <button @click="transferSubMode = 'issue'"
                                    :class="transferSubMode === 'issue' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/30' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600'"
                                    class="py-4 rounded-2xl font-bold border-2 transition-all active:scale-95">
                                    <div class="text-xl mb-1">📋</div>
                                    起票
                                </button>
                                <button @click="transferSubMode = 'inspect'"
                                    :class="transferSubMode === 'inspect' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/30' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600'"
                                    class="py-4 rounded-2xl font-bold border-2 transition-all active:scale-95">
                                    <div class="text-xl mb-1">✅</div>
                                    検品
                                </button>
                                <button @click="transferSubMode = 'arrival'"
                                    :class="transferSubMode === 'arrival' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/30' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600'"
                                    class="py-4 rounded-2xl font-bold border-2 transition-all active:scale-95">
                                    <div class="text-xl mb-1">📦</div>
                                    入荷
                                </button>
                                <button @click="transferSubMode = 'dispose'"
                                    :class="transferSubMode === 'dispose' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/30' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600'"
                                    class="py-4 rounded-2xl font-bold border-2 transition-all active:scale-95">
                                    <div class="text-xl mb-1">🗑️</div>
                                    廃棄
                                </button>
                            </div>
                        </div>

                        <!-- 起票フォーム（展開） -->
                        <transition name="slide-up">
                            <div v-if="transferSubMode === 'issue'" class="border-t border-slate-100 pt-6 space-y-4">
                                <h3 class="text-sm font-bold text-slate-600 mb-3">起票の詳細</h3>

                                <!-- 移動元店舗 -->
                                <div>
                                    <label
                                        class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">移動元店舗（あなたの店舗）</label>
                                    <select v-model="issueFromStore"
                                        :class="issueFromStore ? 'text-slate-800' : 'text-slate-500'"
                                        class="appearance-none w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 block p-4 text-center">
                                        <option value="" disabled>選択してください</option>
                                        <option v-for="s in stores" :value="s.key" class="text-slate-800">{{ s.name }}
                                        </option>
                                    </select>
                                </div>

                                <!-- 移動先店舗（移動元以外） -->
                                <div>
                                    <label
                                        class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">移動先店舗</label>
                                    <select v-model="issueDestStore"
                                        :class="issueDestStore ? 'text-slate-800' : 'text-slate-500'"
                                        class="appearance-none w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 block p-4 text-center"
                                        :disabled="!issueFromStore">
                                        <option value="" disabled>選択してください</option>
                                        <option v-for="s in stores.filter(s => s.key !== issueFromStore)" :value="s.key"
                                            class="text-slate-800">{{ s.name }}</option>
                                    </select>
                                </div>

                                <!-- 実施日 -->
                                <div>
                                    <label
                                        class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">実施日</label>
                                    <input type="date" v-model="issueDate"
                                        :class="issueDate ? 'text-slate-800' : 'text-slate-500'"
                                        class="w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 block p-4 text-center">
                                </div>

                                <button @click="startIssue"
                                    :disabled="!transferMonth || !issueFromStore || !issueDestStore || !issueDate || loading"
                                    class="mt-4 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-4 rounded-full shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50">
                                    移動記録を開始する
                                </button>
                            </div>
                        </transition>

                        <!-- 入荷フォーム（展開） -->
                        <transition name="slide-up">
                            <div v-if="transferSubMode === 'arrival'" class="border-t border-slate-100 pt-6 space-y-4">
                                <h3 class="text-sm font-bold text-slate-600 mb-3">入荷の詳細 (事務所のみ対象)</h3>

                                <!-- 実施日 -->
                                <div>
                                    <label
                                        class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">実施日</label>
                                    <input type="date" v-model="issueDate"
                                        :class="issueDate ? 'text-slate-800' : 'text-slate-500'"
                                        class="w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 block p-4 text-center">
                                </div>

                                <button @click="startIssue" :disabled="!transferMonth || !issueDate || loading"
                                    class="mt-4 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-4 rounded-full shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50">
                                    入荷記録を開始する
                                </button>
                            </div>
                        </transition>

                        <!-- 廃棄フォーム（展開） -->
                        <transition name="slide-up">
                            <div v-if="transferSubMode === 'dispose'" class="border-t border-slate-100 pt-6 space-y-4">
                                <h3 class="text-sm font-bold text-slate-600 mb-3">廃棄の詳細</h3>

                                <!-- 実施店舗 -->
                                <div>
                                    <label
                                        class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">実施店舗（あなたの店舗）</label>
                                    <select v-model="issueFromStore"
                                        :class="issueFromStore ? 'text-slate-800' : 'text-slate-500'"
                                        class="appearance-none w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 block p-4 text-center">
                                        <option value="" disabled>選択してください</option>
                                        <option v-for="s in stores" :value="s.key" class="text-slate-800">{{ s.name }}
                                        </option>
                                    </select>
                                </div>

                                <!-- 実施日 -->
                                <div>
                                    <label
                                        class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">実施日</label>
                                    <input type="date" v-model="issueDate"
                                        :class="issueDate ? 'text-slate-800' : 'text-slate-500'"
                                        class="w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 block p-4 text-center">
                                </div>

                                <button @click="startIssue"
                                    :disabled="!transferMonth || !issueFromStore || !issueDate || loading"
                                    class="mt-4 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-4 rounded-full shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50">
                                    廃棄記録を開始する
                                </button>
                            </div>
                        </transition>

                        <!-- 検品フォーム（展開） -->
                        <transition name="slide-up">
                            <div v-if="transferSubMode === 'inspect'" class="border-t border-slate-100 pt-6 space-y-4">
                                <h3 class="text-sm font-bold text-slate-600 mb-3">検品の詳細</h3>

                                <!-- 移動先店舗（自分の店舗） -->
                                <div>
                                    <label
                                        class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">移動先店舗（あなたの店舗）</label>
                                    <select v-model="inspectDestStore" @change="loadPendingRecords"
                                        :class="inspectDestStore ? 'text-slate-800' : 'text-slate-500'"
                                        class="appearance-none w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 block p-4 text-center"
                                        :disabled="!transferMonth">
                                        <option value="" disabled>選択してください</option>
                                        <option v-for="s in stores" :value="s.key" class="text-slate-800">{{ s.name }}
                                        </option>
                                    </select>
                                </div>

                                <!-- 未検品一覧 -->
                                <div v-if="inspectDestStore && !loading">
                                    <div v-if="inspectPendingList.length === 0"
                                        class="text-center py-6 text-slate-400 text-sm font-medium">
                                        未検品の移動記録はありません
                                    </div>
                                    <div v-else class="space-y-2">
                                        <label v-for="rec in inspectPendingList" :key="rec.blockIndex"
                                            class="flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all"
                                            :class="inspectSelectedBlock === rec.blockIndex ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white hover:border-emerald-200'">
                                            <input type="radio" v-model="inspectSelectedBlock" :value="rec.blockIndex"
                                                class="sr-only">
                                            <div class="flex-1">
                                                <div class="font-bold text-slate-800">{{
                                                    transferStoreName(rec.fromStoreKey) }} → {{
                                                    transferStoreName(inspectDestStore) }}</div>
                                                <div class="text-xs text-slate-400 mt-0.5">{{ rec.date }}</div>
                                            </div>
                                            <div :class="inspectSelectedBlock === rec.blockIndex ? 'bg-emerald-500' : 'bg-slate-200'"
                                                class="w-5 h-5 rounded-full flex items-center justify-center transition-colors">
                                                <svg v-if="inspectSelectedBlock === rec.blockIndex"
                                                    class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fill-rule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 111.414-1.414L8.414 12.586l7.879-7.879a1 1 0 011.414 0z"
                                                        clip-rule="evenodd" />
                                                </svg>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <button @click="startInspect" :disabled="inspectSelectedBlock === null || loading"
                                    class="mt-4 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-4 rounded-full shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50">
                                    検品を開始する
                                </button>
                            </div>
                        </transition>
                    </div>
                </div>
            </transition>

            <!-- Step 1A: 起票-入力画面 -->
            <div v-if="transferStep === '1a'" class="space-y-4">
                <div class="flex items-center gap-2 mb-4 px-1">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <h2 class="text-lg font-bold text-slate-800">{{ transferStep1aTitle }}</h2>
                    <span class="text-xs text-slate-400 font-medium ml-auto">{{ transferStep1aDesc }}</span>
                </div>



                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div v-for="item in transferFilteredItems" :key="item.rowIndex"
                        class="p-4 rounded-2xl shadow-sm border border-slate-100 bg-white">
                        <div class="mb-3">
                            <span
                                class="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100/50 text-[9px] font-bold px-2 py-0.5 rounded-full mb-1">{{
                                item.brand }}</span>
                            <div class="font-bold text-slate-800 leading-tight">{{ item.flavorName }}</div>
                        </div>
                        <input type="number" min="0"
                            class="w-full text-xl font-bold p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all text-center bg-white text-slate-800 placeholder-slate-200"
                            placeholder="0" :value="issueOrderState[item.rowIndex] || ''"
                            @input="updateIssueQty(item.rowIndex, $event.target.value)">
                    </div>
                </div>
                <div class="h-24"></div>
            </div>

            <!-- Step 2A: 起票-確認画面 -->
            <div v-if="transferStep === '2a'" class="space-y-4">
                <div class="flex items-center gap-2 mb-4 px-1">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <h2 class="text-lg font-bold text-slate-800">{{ transferStep2aTitle }}</h2>
                </div>

                <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div class="px-5 py-4 bg-emerald-50 border-b border-emerald-100">
                        <p class="text-sm font-bold text-emerald-700">{{ transferStep1aDesc }}</p>
                        <p class="text-xs text-slate-500 mt-0.5">{{ issueDate }}</p>
                    </div>
                    <div v-if="issueConfirmItems.length === 0" class="p-8 text-center text-slate-400 text-sm">
                        移動数量が入力されていません
                    </div>
                    <table v-else class="w-full text-sm">
                        <thead class="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th class="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">フレーバー</th>
                                <th class="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase">数量 (g)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in issueConfirmItems" :key="item.rowIndex"
                                class="border-b border-slate-50 last:border-0">
                                <td class="px-4 py-3">
                                    <div class="text-[10px] font-bold text-slate-400">{{ item.brand }}</div>
                                    <div class="font-bold text-slate-800">{{ item.flavorName }}</div>
                                </td>
                                <td class="px-4 py-3 text-right font-bold text-emerald-600 text-lg">{{ item.qty }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="h-24"></div>
            </div>

            <!-- Step 1B: 検品-入力画面 -->
            <div v-if="transferStep === '1b'" class="space-y-4">
                <div class="flex items-center gap-2 mb-4 px-1">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <h2 class="text-lg font-bold text-slate-800">検品</h2>
                    <span class="text-xs text-slate-400 font-medium ml-auto">
                        {{ transferStoreName(inspectFromStoreKey) }} → {{ transferStoreName(inspectDestStore) }}
                    </span>
                </div>

                <div v-if="inspectDetail.length === 0" class="text-center py-20 text-slate-400">
                    移動記録にデータがありません
                </div>

                <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <table class="w-full text-sm">
                        <thead class="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th class="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">フレーバー</th>
                                <th class="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase">数量</th>
                                <th class="px-4 py-3 text-xs font-bold text-slate-400 uppercase text-center">確認</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in inspectDetail" :key="item.rowIndex"
                                class="border-b border-slate-50 last:border-0">
                                <td class="px-4 py-3">
                                    <div class="text-[10px] font-bold text-slate-400">{{ item.brand }}</div>
                                    <div class="font-bold text-slate-800">{{ item.flavorName }}</div>
                                </td>
                                <td class="px-4 py-3 text-right">
                                    <input type="number" v-model.number="item.qty" @change="confirmQtyChange(item)"
                                        min="0"
                                        class="w-16 text-right font-bold p-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none bg-white">
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <button @click="toggleInspectCheck(item.rowIndex)"
                                        :class="inspectChecked[item.rowIndex] ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'"
                                        class="w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all mx-auto active:scale-90">
                                        <svg v-if="inspectChecked[item.rowIndex]" class="w-4 h-4 text-white" fill="none"
                                            stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3"
                                                d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- 追加フォーム -->
                    <div class="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center gap-2">
                        <select v-model="inspectAddSelectedFlavor"
                            class="flex-1 w-0 min-w-0 bg-white border border-slate-200 rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
                            <option value="">＋ フレーバーを追加...</option>
                            <option v-for="opt in availableInspectFlavors" :value="opt.rowIndex"
                                :key="'add-'+opt.rowIndex">
                                {{ opt.brand }} / {{ opt.flavorName }}
                            </option>
                        </select>
                        <button @click="addInspectFlavor" :disabled="!inspectAddSelectedFlavor"
                            class="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50">追加</button>
                    </div>
                </div>

                <div v-if="inspectAllChecked"
                    class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                    <p class="text-emerald-700 font-bold text-sm">✅ 全てのフレーバーを確認しました</p>
                </div>
                <div class="h-24"></div>
            </div>
        </main>

        <!-- ========================================== -->
        <!-- REQUEST APP (補充依頼)                     -->
        <!-- ========================================== -->

        <main v-if="appMode === 'request'"
            class="container mx-auto px-4 py-6 max-w-lg md:max-w-7xl transition-all duration-300 flex-grow">
            <!-- Request Step 0: Setup -->
            <transition name="slide-up">
                <div v-if="currentStep === 0" class="flex flex-col items-center justify-center py-10">
                    <div
                        class="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 w-full max-w-md text-center">
                        <h2 class="text-xl font-bold text-slate-700 mb-8">補充依頼を開始</h2>

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
                                    class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">依頼元店舗（あなたの店舗）</label>
                                <div class="relative">
                                    <select v-model="requestStoreKey"
                                        :class="requestStoreKey ? 'text-slate-800' : 'text-slate-500'"
                                        class="appearance-none w-full bg-slate-50 border border-slate-200 text-lg font-bold rounded-xl focus:ring-2 focus:ring-orange-500 block p-4 text-center cursor-pointer">
                                        <option value="" disabled>店舗を選択してください</option>
                                        <!-- V-StockRequest側ではbaba_mainとしていたが互換性のため一旦baba_mainとするか、STORESの定義に合わせる -->
                                        <option value="baba_main" class="text-slate-800">馬場本店</option>
                                        <option value="nakano" class="text-slate-800">中野店</option>
                                        <option value="baba_2nd" class="text-slate-800">馬場2号店</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label
                                    class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">対象月</label>
                                <div class="relative">
                                    <select v-model="requestMonth"
                                        :class="requestMonth ? 'text-slate-800' : 'text-slate-500'"
                                        class="appearance-none w-full bg-slate-50 border border-slate-200 text-lg font-bold rounded-xl focus:ring-2 focus:ring-orange-500 block p-4 text-center">
                                        <option value="" disabled>実施月を選択してください</option>
                                        <option v-for="m in requestMonths" :value="m.val" class="text-slate-800">{{
                                            m.label }}</option>
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
                <div
                    class="sticky top-[64px] z-20 py-3 -mx-4 px-4 backdrop-blur-xl bg-slate-50/90 border-b border-slate-200/50 transition-all duration-300 mb-6">
                    <div class="flex items-center justify-end max-w-7xl mx-auto">
                        <label
                            class="inline-flex items-center cursor-pointer group bg-white px-3 py-2.5 rounded-xl ring-1 ring-slate-200 shadow-sm hover:bg-slate-50 transition-all">
                            <input type="checkbox" v-model="requestHideZero" class="sr-only peer">
                            <div
                                class="relative w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all after:shadow-sm peer-checked:bg-orange-600 transition-colors">
                            </div>
                            <span
                                class="ms-2 text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors hidden sm:inline">在庫ゼロ非表示</span>
                            <span
                                class="ms-2 text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors sm:hidden">ゼロ隠す</span>
                        </label>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-if="requestFilteredItems.length === 0" class="text-center py-20">
                    <div
                        class="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z">
                            </path>
                        </svg>
                    </div>
                    <p class="text-slate-500 font-bold">該当するフレーバーがありません</p>
                </div>

                <!-- Item Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <div v-for="(item, index) in requestDisplayedItems" :key="item.id"
                        class="bg-white p-5 rounded-2xl shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col gap-4 transition-transform duration-200 hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] hover:-translate-y-0.5">

                        <!-- Header -->
                        <div class="flex justify-between items-start">
                            <div class="pr-2">
                                <span
                                    class="inline-block bg-orange-50 text-orange-600 border border-orange-100/50 text-[10px] font-bold px-2.5 py-1 rounded-full mb-1.5 shadow-sm">{{
                                    item.brand }}</span>
                                <h3 class="text-lg font-bold text-slate-800 leading-snug">{{ item.flavor }}</h3>
                            </div>
                            <div class="text-right flex-shrink-0">
                                <div class="text-[10px] uppercase font-bold text-slate-400 mb-0.5">{{
                                    requestCurrentStoreLabel }}在庫</div>
                                <div class="text-2xl font-bold bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 inline-flex items-center"
                                    :class="getStockColorClass(item.stock[requestStoreKey])">
                                    <span v-if="item.stock[requestStoreKey] < 500"
                                        class="inline-flex items-center justify-center w-5 h-5 bg-red-100 text-red-600 rounded-full text-[10px] mr-1">!</span>
                                    {{ Number(item.stock[requestStoreKey]) || 0 }}
                                </div>
                            </div>
                        </div>

                        <!-- Other Stocks -->
                        <div class="grid grid-cols-3 gap-3">
                            <div v-for="storeCode in requestOtherStoreKeys" :key="storeCode"
                                class="text-center rounded-xl py-2 px-1 border"
                                :class="getOtherStockStyle(item, storeCode)">
                                <div class="text-[10px] text-slate-400 font-bold mb-0.5">{{ requestStoreLabel(storeCode)
                                    }}</div>
                                <div class="text-sm">{{ Number(item.stock[storeCode]) || 0 }}</div>
                            </div>
                        </div>

                        <!-- Input & Checkboxes -->
                        <div class="pt-2 border-t border-slate-50 mt-1">
                            <div class="flex items-end gap-3">
                                <div class="relative flex-1">
                                    <label
                                        class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">移動量
                                        (g)</label>
                                    <input type="number" min="0"
                                        class="w-full text-xl font-bold p-3 pl-4 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all shadow-sm text-center bg-white text-slate-800 placeholder-slate-200"
                                        placeholder="0" :value="getOrderAmount(item.id)"
                                        @input="updateOrderAmount(item.id, $event.target.value)">
                                </div>
                                <div class="flex gap-2">
                                    <label v-for="reqStore in requestTargetStores" :key="reqStore"
                                        class="cursor-pointer group relative">
                                        <input type="checkbox" class="peer sr-only"
                                            :checked="isOrderTargetChecked(item.id, reqStore)"
                                            @change="handleRequestSourceToggle(item.id, reqStore, $event.target.checked)">
                                        <div
                                            class="w-12 h-12 rounded-xl border-2 border-slate-100 bg-white flex items-center justify-center text-xs font-bold text-slate-400 transition-all peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-checked:text-orange-600 group-hover:bg-slate-50 peer-checked:shadow-md">
                                            {{ requestStoreLabel(reqStore) }}
                                        </div>
                                        <div
                                            class="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white opacity-0 peer-checked:opacity-100 transition-all">
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Alert -->
                        <div v-if="isOrderExceedingStock(item.id)"
                            class="mt-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 animate-pulse">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z">
                                </path>
                            </svg>
                            <span>在庫が不足しています</span>
                        </div>
                    </div>
                </div>

                <!-- Load More Button -->
                <div v-if="requestFilteredItems.length > requestDisplayLimit" class="flex justify-center mt-8 mb-4">
                    <button @click="loadMoreRequestItems"
                        class="bg-white border-2 border-slate-200 text-slate-600 font-bold py-3 px-8 rounded-full shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 flex items-center gap-2">
                        <span>さらに表示する</span>
                        <span class="bg-slate-100 text-xs py-0.5 px-2 rounded-full text-slate-500">{{
                            requestFilteredItems.length - requestDisplayLimit }}件</span>
                        <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7">
                            </path>
                        </svg>
                    </button>
                </div>

                <div class="h-24"></div>
            </div>
        </main>

        <!-- ========================================== -->
        <!-- STOCK APP (在庫量確認)                       -->
        <!-- ========================================== -->
        <main v-if="appMode === 'stock'"
            class="container mx-auto px-4 pt-0 pb-6 max-w-lg md:max-w-7xl transition-all duration-300 flex-grow">
            <transition name="slide-up">
                <div class="space-y-4 mt-2">
                    <!-- 対象月選択 -->
                    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">対象月</label>
                        <select v-model="stockMonth"
                            :class="stockMonth ? 'text-slate-800' : 'text-slate-500'"
                            class="appearance-none w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl focus:ring-2 focus:ring-red-500 block p-4 text-center">
                            <option value="" disabled>選択してください</option>
                            <option v-for="m in months" :value="m" class="text-slate-800">{{ m }}</option>
                        </select>
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

                    <div v-else-if="stockMonth && !loading"
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

        <!-- Filter FAB -->
        <div v-if="(appMode === 'inventory' && currentStep > 0 && currentStep < 4) || (appMode === 'request' && currentStep === 1) || (appMode === 'transfer' && transferStep === '1a') || (appMode === 'stock' && stockItems.length > 0)"
            class="fixed bottom-24 right-4 z-30">
            <button @click="showBrandFilter = true"
                class="relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-95"
                :class="(appMode === 'transfer' ? transferSelectedBrand : selectedBrand)
                    ? (appMode === 'request' ? 'bg-orange-600 shadow-orange-500/40 text-white' : (appMode === 'transfer' ? 'bg-emerald-600 shadow-emerald-500/40 text-white' : (appMode === 'stock' ? 'bg-red-600 shadow-red-500/40 text-white' : 'bg-brand-600 shadow-brand-500/40 text-white')))
                    : 'bg-slate-800 text-white shadow-slate-900/30'">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z">
                    </path>
                </svg>
                <span v-if="appMode === 'transfer' ? transferSelectedBrand : selectedBrand"
                    class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-400 rounded-full border-2 border-white"></span>
            </button>
        </div>

        <!-- Bottom Sheet Overlay -->
        <transition name="fade">
            <div v-if="showBrandFilter" @click="showBrandFilter = false"
                class="fixed inset-0 bg-black/40 backdrop-blur-sm z-40">
            </div>
        </transition>

        <!-- Bottom Sheet Panel -->
        <transition name="sheet">
            <div v-if="showBrandFilter"
                class="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl pb-safe-area">
                <!-- Handle bar -->
                <div class="flex justify-center pt-3 pb-1">
                    <div class="w-10 h-1 bg-slate-300 rounded-full"></div>
                </div>
                <!-- Header -->
                <div class="flex justify-between items-center px-5 pt-2 pb-3 border-b border-slate-100">
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4" :class="appMode === 'request' ? 'text-orange-600' : 'text-brand-600'"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z">
                            </path>
                        </svg>
                        <span class="text-sm font-bold text-slate-700">ブランドで絞り込む</span>
                        <span v-if="selectedBrand" class="text-xs font-bold px-2 py-0.5 rounded-full"
                            :class="appMode === 'request' ? 'text-orange-600 bg-orange-50' : 'text-brand-600 bg-brand-50'">{{
                            selectedBrand }}</span>
                    </div>
                    <button @click="showBrandFilter = false"
                        class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 active:scale-95">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <!-- Brand bubbles -->
                <div class="px-4 pt-4 pb-6">
                    <div class="flex flex-wrap gap-2 justify-start">
                        <button @click="selectBrand(null)" :class="(appMode === 'transfer' ? transferSelectedBrand : selectedBrand) === null
                                ? 'bg-slate-800 text-white shadow-md'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                            class="px-5 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95">
                            すべて
                        </button>
                        <button v-for="brand in brands" :key="brand" @click="selectBrand(brand)" :class="[
                                (appMode === 'transfer' ? transferSelectedBrand : selectedBrand) === brand && appMode === 'inventory' ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30' : '',
                                (appMode === 'transfer' ? transferSelectedBrand : selectedBrand) === brand && appMode === 'request' ? 'bg-orange-600 text-white shadow-md shadow-orange-500/30' : '',
                                (appMode === 'transfer' ? transferSelectedBrand : selectedBrand) === brand && appMode === 'transfer' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30' : '',
                                (appMode === 'transfer' ? transferSelectedBrand : selectedBrand) !== brand && appMode === 'inventory' ? 'bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-600' : '',
                                (appMode === 'transfer' ? transferSelectedBrand : selectedBrand) !== brand && appMode === 'request' ? 'bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-600' : '',
                                (appMode === 'transfer' ? transferSelectedBrand : selectedBrand) !== brand && appMode === 'transfer' ? 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600' : ''
                            ]" class="px-5 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95">
                            {{ brand }}
                        </button>
                    </div>
                </div>
            </div>
        </transition>

        <!-- Footer Navigation -->
        <footer v-if="(appMode !== null && currentStep > 0) || (appMode === 'transfer' && transferStep !== 0) || appMode === 'stock'" class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200
                            p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 pb-safe-area">
            <div class="container mx-auto max-w-lg md:max-w-7xl flex justify-between items-center">
                <button @click="prevStep"
                    class="px-6 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors active:scale-95 text-sm">
                    戻る
                </button>
                <div class="flex space-x-3">
                    <!-- Inventory Buttons -->
                    <template v-if="appMode === 'inventory'">
                        <button v-if="currentStep < 4" @click="nextStep"
                            class="group bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-slate-900/20 transition-colors transition-transform active:scale-95 flex items-center gap-2">
                            <span>次へ</span>
                            <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none"
                                stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7">
                                </path>
                            </svg>
                        </button>
                        <button v-if="currentStep === 4" @click="submitInventory"
                            class="bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-brand-500/30 transition-transform transition-colors active:scale-95">
                            完了する
                        </button>
                    </template>

                    <!-- Request Buttons -->
                    <template v-if="appMode === 'request'">
                        <button v-if="currentStep === 1" @click="openRequestReviewModal"
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
                        <button v-if="transferStep === '1a'" @click="goToIssueConfirm"
                            :disabled="issueConfirmItems.length === 0"
                            class="group bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            <span>内容を確認</span>
                            <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none"
                                stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7">
                                </path>
                            </svg>
                        </button>
                        <!-- 2A: 起票確認 → 送信 -->
                        <button v-if="transferStep === '2a'" @click="submitIssue"
                            :disabled="issueConfirmItems.length === 0"
                            class="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-500/30 transition-transform transition-colors active:scale-95 disabled:opacity-50">
                            データを記録
                        </button>
                        <!-- 1B: 検品 → 完了 -->
                        <button v-if="transferStep === '1b'" @click="submitInspection" :disabled="!inspectAllChecked"
                            class="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-500/30 transition-transform transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                            検品を完了
                        </button>
                    </template>
                </div>
            </div>
        </footer>

        <!-- Request Review Modal -->
        <div v-if="appMode === 'request' && showRequestModal"
            class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
                class="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col transform ring-1 ring-black/5">
                <div class="p-5 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 class="text-xl font-bold text-slate-800">依頼リスト確認</h2>
                        <p class="text-xs text-slate-500 mt-1">コピーして送信してください</p>
                    </div>
                    <button @click="showRequestModal = false"
                        class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition">
                        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"></path>
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
                                <svg v-if="copiedSection !== section.title" class="w-4 h-4" fill="none"
                                    stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3">
                                    </path>
                                </svg>
                                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7"></path>
                                </svg>
                            </button>
                        </div>
                        <pre
                            class="whitespace-pre-wrap text-slate-600 bg-slate-50 p-4 rounded-xl text-sm border border-slate-100 font-mono leading-relaxed transition-colors">{{ section.fullText }}</pre>
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

        <!-- Inventory Start Confirm Modal -->
        <div v-if="appMode === 'inventory' && showInventoryStartModal"
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
import {
  getSheetData, submitData,
  getInventoryData,
  getFlavorListForTransfer, getPendingTransferRecords,
  getTransferRecordDetail, submitTransferRecord, completeInspection,
  getStockOverview
} from './api.js'

export default {
  name: 'App',
  data() {
    return {
      currentStep: 0,
      appMode: null,
      loading: false,
      loadingMessage: '',
      errorMessage: '',
      storeKey: '',
      stores: [
        { key: 'office', name: '事務所' },
        { key: 'baba', name: '馬場本店' },
        { key: 'nakano', name: '中野店' },
        { key: 'baba_2nd', name: '馬場2号店' },
      ],
      month: '',
      date: '',
      items: [],
      selectedBrand: null,
      showBrandFilter: false,
      showInventoryStartModal: false,
      months: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
      inventoryBrands: [],
      // Request
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
      requestDisplayLimit: 20,
      requestBrands: [],
      // Transfer
      transferStep: 0,
      transferMonth: '',
      transferSubMode: null,
      issueFromStore: '',
      issueDestStore: '',
      issueDate: '',
      issueItems: [],
      issueOrderState: {},
      transferBrands: [],
      transferSelectedBrand: null,
      inspectDestStore: '',
      inspectPendingList: [],
      inspectSelectedBlock: null,
      inspectFromStoreKey: '',
      inspectDetail: [],
      inspectChecked: {},
      inspectAvailableItems: [],
      inspectAddSelectedFlavor: '',
      // Stock
      stockMonth: '',
      stockItems: [],
      stockBrands: [],
    }
  },
  computed: {
    currentStoreName() {
      const s = this.stores.find(x => x.key === this.storeKey)
      return s ? s.name : ''
    },
    totalSteps() { return this.storeKey === 'office' ? 2 : 4 },
    displayStep() {
      if (this.storeKey === 'office') {
        if (this.currentStep === 3) return 1
        if (this.currentStep === 4) return 2
      }
      return this.currentStep
    },
    currentMonth() { return this.month },
    currentDate() { return this.date },
    brands() {
      if (this.appMode === 'transfer') return this.transferBrands
      if (this.appMode === 'stock') return this.stockBrands
      return this.appMode === 'request' ? this.requestBrands : this.inventoryBrands
    },
    filteredItems() {
      if (!this.selectedBrand) return this.items
      return this.items.filter(i => i.brand === this.selectedBrand)
    },
    requestCurrentStoreName() {
      const s = this.stores.find(x => x.key === this.requestStoreKey)
      return s ? s.name : ''
    },
    requestCurrentStoreLabel() {
      const labels = { office: '事務所', baba_main: '本店', nakano: '中野', baba_2nd: '2号店' }
      return labels[this.requestStoreKey] || ''
    },
    requestOtherStoreKeys() {
      return ['office','baba_main','nakano','baba_2nd'].filter(k => k !== this.requestStoreKey)
    },
    requestTargetStores() {
      return ['office','baba_main','nakano','baba_2nd'].filter(k => k !== this.requestStoreKey && k !== 'office')
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
    requestDisplayedItems() { return this.requestFilteredItems.slice(0, this.requestDisplayLimit) },
    requestTotalQty() {
      return Object.values(this.requestOrderState).reduce((s, st) => s + (st.amount || 0), 0)
    },
    issueConfirmItems() {
      return this.issueItems
        .filter(i => { const q = parseInt(this.issueOrderState[i.rowIndex], 10); return !isNaN(q) && q > 0 })
        .map(i => ({ rowIndex: i.rowIndex, brand: i.brand, flavorName: i.flavorName, qty: parseInt(this.issueOrderState[i.rowIndex], 10) }))
    },
    transferFilteredItems() {
      if (!this.transferSelectedBrand) return this.issueItems
      return this.issueItems.filter(i => i.brand === this.transferSelectedBrand)
    },
    inspectAllChecked() {
      if (this.inspectDetail.length === 0) return false
      return this.inspectDetail.every(i => this.inspectChecked[i.rowIndex])
    },
    availableInspectFlavors() {
      const existing = new Set(this.inspectDetail.map(i => i.rowIndex))
      return this.inspectAvailableItems.filter(i => !existing.has(i.rowIndex))
    },
    stockFilteredItems() {
      if (!this.selectedBrand) return this.stockItems
      return this.stockItems.filter(i => i.brand === this.selectedBrand)
    },
    transferStep1aTitle() {
      if (this.transferSubMode === 'arrival') return '入荷 — 入荷数量の入力'
      if (this.transferSubMode === 'dispose') return '廃棄 — 廃棄数量の入力'
      return '起票 — 移動数量の入力'
    },
    transferStep1aDesc() {
      if (this.transferSubMode === 'arrival') return '事務所（入荷）'
      if (this.transferSubMode === 'dispose') return this.issueStoreName(this.issueFromStore) + '（廃棄）'
      return this.issueStoreName(this.issueFromStore) + ' → ' + this.issueStoreName(this.issueDestStore)
    },
    transferStep2aTitle() {
      if (this.transferSubMode === 'arrival') return '入荷 — 内容確認'
      if (this.transferSubMode === 'dispose') return '廃棄 — 内容確認'
      return '起票 — 内容確認'
    },
  },
  watch: {
    stockMonth(val) { if (val) this.loadStockData() }
  },
  methods: {
    openInventoryApp() { this.appMode = 'inventory'; this.currentStep = 0 },
    openRequestApp() { this.appMode = 'request'; this.currentStep = 0; this.selectedBrand = null },
    openTransferApp() {
      this.appMode = 'transfer'; this.transferStep = 0; this.transferSubMode = null
      this.transferMonth = ''; this.issueFromStore = ''; this.issueDestStore = ''
      this.issueDate = ''; this.issueItems = []; this.issueOrderState = {}
      this.inspectDestStore = ''; this.inspectPendingList = []; this.inspectSelectedBlock = null
      this.inspectDetail = []; this.inspectChecked = {}; this.errorMessage = ''
    },
    openStockApp() {
      this.appMode = 'stock'; this.stockMonth = ''; this.stockItems = []
      this.stockBrands = []; this.selectedBrand = null; this.errorMessage = ''
    },
    async loadStockData() {
      if (!this.stockMonth) return
      this.errorMessage = ''; this.loading = true; this.loadingMessage = '在庫データを読み込み中...'
      this.stockItems = []
      try {
        const monthNum = parseInt(this.stockMonth, 10)
        const data = await getStockOverview(monthNum)
        this.stockItems = data || []
        const seen = new Set()
        this.stockBrands = this.stockItems.map(i => i.brand).filter(b => b && !seen.has(b) && seen.add(b))
        this.selectedBrand = null
      } catch (e) {
        this.errorMessage = e.message || '在庫データの取得に失敗しました。'
      } finally {
        this.loading = false
      }
    },
    transferStoreName(key) {
      const s = this.stores.find(x => x.key === key)
      return s ? s.name : key
    },
    issueStoreName(key) { return this.transferStoreName(key) },
    async startIssue() {
      this.errorMessage = ''; this.loading = true; this.loadingMessage = 'フレーバー一覧を取得中...'
      try {
        const monthNum = parseInt(this.transferMonth, 10)
        this.issueItems = await getFlavorListForTransfer(monthNum)
        this.issueOrderState = {}
        const seen = new Set()
        this.transferBrands = this.issueItems.map(i => i.brand).filter(b => b && !seen.has(b) && seen.add(b))
        this.transferStep = '1a'
      } catch (e) {
        this.errorMessage = e.message || 'データの取得に失敗しました。'
      } finally {
        this.loading = false
      }
    },
    updateIssueQty(rowIndex, val) {
      const qty = parseInt(val, 10)
      if (!isNaN(qty) && qty > 0) {
        this.issueOrderState[rowIndex] = qty
      } else {
        delete this.issueOrderState[rowIndex]
      }
    },
    goToIssueConfirm() { this.transferStep = '2a' },
    async submitIssue() {
      const modeLabel = this.transferSubMode === 'arrival' ? '入荷記録' : (this.transferSubMode === 'dispose' ? '廃棄記録' : '移動記録')
      if (!confirm('データを記録してよろしいですか？')) return
      this.loading = true; this.loadingMessage = 'スプレッドシートに書き込み中...'
      const monthNum = parseInt(this.transferMonth, 10)
      const items = this.issueConfirmItems.map(i => ({ rowIndex: i.rowIndex, qty: i.qty }))
      let fromStore = this.issueFromStore, destStore = this.issueDestStore, autoInspect = false
      if (this.transferSubMode === 'arrival') { fromStore = null; destStore = 'office'; autoInspect = true }
      else if (this.transferSubMode === 'dispose') { destStore = null; autoInspect = true }
      try {
        await submitTransferRecord({ monthNum, fromStoreKey: fromStore, destStoreKey: destStore, date: this.issueDate, items, autoInspect })
        alert(`${modeLabel}を保存しました。`)
        this.openTransferApp()
      } catch (e) {
        this.errorMessage = e.message || '書き込みに失敗しました。'
      } finally {
        this.loading = false
      }
    },
    async loadPendingRecords() {
      if (!this.transferMonth || !this.inspectDestStore) return
      this.loading = true; this.loadingMessage = '移動記録を取得中...'
      this.inspectPendingList = []; this.inspectSelectedBlock = null
      try {
        const monthNum = parseInt(this.transferMonth, 10)
        this.inspectPendingList = await getPendingTransferRecords(monthNum, this.inspectDestStore)
      } catch (e) {
        this.errorMessage = e.message || '取得に失敗しました。'
      } finally {
        this.loading = false
      }
    },
    async startInspect() {
      if (this.inspectSelectedBlock === null) return
      this.loading = true; this.loadingMessage = '移動記録とフレーバーを追加読み込み中...'
      const monthNum = parseInt(this.transferMonth, 10)
      const rec = this.inspectPendingList.find(r => r.blockIndex === this.inspectSelectedBlock)
      this.inspectFromStoreKey = rec ? rec.fromStoreKey : ''
      try {
        const [allItems, detail] = await Promise.all([
          getFlavorListForTransfer(monthNum),
          getTransferRecordDetail(monthNum, this.inspectSelectedBlock, this.inspectDestStore)
        ])
        this.inspectAvailableItems = allItems
        this.inspectAddSelectedFlavor = ''
        this.inspectDetail = detail.map(i => ({ ...i, originalQty: i.qty }))
        this.inspectChecked = {}
        this.transferStep = '1b'
      } catch (e) {
        this.errorMessage = e.message || 'データ読み込みに失敗しました。'
      } finally {
        this.loading = false
      }
    },
    addInspectFlavor() {
      if (!this.inspectAddSelectedFlavor) return
      const item = this.inspectAvailableItems.find(i => i.rowIndex === this.inspectAddSelectedFlavor)
      if (item) {
        this.inspectDetail.push({ rowIndex: item.rowIndex, brand: item.brand, flavorName: item.flavorName, qty: 0, originalQty: 0 })
        this.inspectChecked[item.rowIndex] = false
      }
      this.inspectAddSelectedFlavor = ''
    },
    confirmQtyChange(item) {
      const newQty = parseInt(item.qty, 10)
      if (isNaN(newQty) || newQty < 0) { item.qty = item.originalQty; return }
      if (newQty !== item.originalQty) {
        if (confirm('移動されたフレーバーの数量を変更してスプレッドシートに上書きします。よろしいですか？')) {
          item.originalQty = newQty; item.qty = newQty
        } else { item.qty = item.originalQty }
      }
    },
    toggleInspectCheck(rowIndex) {
      this.inspectChecked[rowIndex] = !this.inspectChecked[rowIndex]
    },
    async submitInspection() {
      if (!this.inspectAllChecked) return
      if (!confirm('検品を完了してよろしいですか？\n※数量を修正した場合はスプレッドシートが上書きされます。')) return
      this.loading = true; this.loadingMessage = '送信中...'
      try {
        const monthNum = parseInt(this.transferMonth, 10)
        const items = this.inspectDetail.map(i => ({ rowIndex: i.rowIndex, qty: i.qty }))
        await completeInspection({ monthNum, blockIndex: this.inspectSelectedBlock, fromStoreKey: this.inspectFromStoreKey, destStoreKey: this.inspectDestStore, items })
        alert('検品が完了し、スプレッドシートに反映されました。')
        this.openTransferApp()
      } catch (e) {
        this.errorMessage = e.message || '送信に失敗しました。'
      } finally {
        this.loading = false
      }
    },
    returnToPortal() {
      if (this.currentStep > 0) {
        if (confirm('入力途中のデータがある場合、破棄されます。ポータルに戻りますか？')) {
          this.appMode = null; this.currentStep = 0
        }
      } else {
        this.appMode = null; this.currentStep = 0
      }
    },
    confirmStartInventory() { this.showInventoryStartModal = false; this.startInventory() },
    async startInventory() {
      this.errorMessage = ''; this.loading = true; this.loadingMessage = 'データを取得中...'
      const saved = localStorage.getItem('inventory_draft_' + this.storeKey + '_' + this.month)
      if (saved) {
        if (confirm('保存されたデータが見つかりました。復元しますか？')) {
          const parsed = JSON.parse(saved)
          this.items = parsed.items; this.date = parsed.date
          this.currentStep = (this.storeKey === 'office') ? 3 : 1
          this.loading = false; return
        }
      }
      try {
        const response = await getSheetData(this.storeKey, this.month)
        this.onDataLoaded(response)
      } catch (e) {
        this.onError(e)
      }
    },
    onDataLoaded(response) {
      this.items = response.items
      const seen = new Set()
      this.inventoryBrands = this.items.map(i => i.brand).filter(b => b && !seen.has(b) && seen.add(b))
      if (!this.date && response.date) {
        this.date = response.date
      } else if (!this.date) {
        const now = new Date()
        this.date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
      }
      this.currentStep = (this.storeKey === 'office') ? 3 : 1
      this.loading = false; this.saveLocally()
    },
    prevStep() {
      if (this.appMode === 'transfer') {
        if (this.transferStep === '2a') { this.transferStep = '1a' }
        else { this.transferStep = 0; this.transferSubMode = null }
        return
      }
      if (this.appMode === 'stock') { this.appMode = null; this.currentStep = 0; return }
      if (this.appMode === 'request') { if (this.currentStep > 0) this.currentStep--; return }
      if (this.storeKey === 'office') {
        if (this.currentStep === 3) this.currentStep = 0
        else if (this.currentStep === 4) this.currentStep = 3
      } else {
        if (this.currentStep > 0) this.currentStep--
      }
    },
    nextStep() {
      if (this.storeKey === 'office') { if (this.currentStep === 3) this.currentStep = 4 }
      else { if (this.currentStep < 4) this.currentStep++ }
      this.saveLocally(); window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    selectBrand(brand) {
      this.showBrandFilter = false
      setTimeout(() => {
        if (this.appMode === 'transfer') { this.transferSelectedBrand = brand }
        else { this.selectedBrand = brand; if (this.appMode === 'request') this.requestDisplayLimit = 20 }
      }, 300)
    },
    hasValues(obj) { if (!obj) return false; return Object.values(obj).some(v => this.isValid(v)) },
    isValid(val) { return val !== '' && val !== null && val !== undefined },
    formatValues(obj) {
      if (!obj) return ''
      return Object.entries(obj).filter(([, v]) => this.isValid(v))
        .map(([k, v]) => { const l = k.replace('val',''); return l === 'Other' ? `他:${v}` : `${l}:${v}` }).join(', ')
    },
    saveLocally() {
      localStorage.setItem('inventory_draft_' + this.storeKey + '_' + this.month, JSON.stringify({ items: this.items, date: this.date, timestamp: Date.now() }))
    },
    async submitInventory() {
      if (!confirm('入力内容をスプレッドシートに反映しますか？')) return
      this.errorMessage = ''; this.loading = true; this.loadingMessage = 'データを送信中...'
      try {
        const response = await submitData({ storeKey: this.storeKey, sheetName: this.month, date: this.date, items: this.items })
        this.onSubmitSuccess(response)
      } catch (e) { this.onError(e) }
    },
    onSubmitSuccess(response) {
      this.loading = false
      if (response && response.negativeConsumptionItems && response.negativeConsumptionItems.length > 0) {
        alert(`【警告】以下のフレーバーの前月消費量がマイナスになっています。\n\n・${response.negativeConsumptionItems.join('\n・')}\n\n確認してください。`)
      } else { alert('送信が完了しました！') }
      localStorage.removeItem('inventory_draft_' + this.storeKey + '_' + this.month)
      this.currentStep = 0; this.items = []
    },
    onError(error) {
      this.loading = false; this.errorMessage = error.message
      if (this.currentStep > 0) alert('エラーが発生しました: ' + error.message)
    },
    async startRequest() {
      this.errorMessage = ''; this.loading = true; this.loadingMessage = 'データを取得中...'
      this.requestItems = []; this.requestOrderState = {}
      try {
        const data = await getInventoryData(this.requestMonth)
        this.requestItems = data
        data.forEach(item => { this.requestOrderState[item.id] = { amount: 0 } })
        const seen = new Set()
        this.requestBrands = this.requestItems.map(i => i.brand).filter(b => b && !seen.has(b) && seen.add(b))
        this.currentStep = 1
      } catch (e) { this.onError(e) } finally { this.loading = false }
    },
    requestStoreLabel(key) {
      return { office: '事務所', baba_main: '本店', nakano: '中野', baba_2nd: '2号店' }[key] || key
    },
    getStockColorClass(val) {
      const n = Number(val) || 0
      if (n < 500) return 'text-red-600 font-black'
      if (n < 1000) return 'text-red-500 font-bold'
      return 'text-slate-700'
    },
    getOtherStockStyle(item, storeCode) {
      const val = Number(item.stock[storeCode]) || 0
      const max = Math.max(Number(item.stock.office)||0, Number(item.stock.baba_main)||0, Number(item.stock.nakano)||0)
      if (max > 0 && val === max) return 'bg-emerald-50 text-emerald-700 font-bold border-emerald-100 ring-1 ring-emerald-100/50'
      return 'bg-slate-50 text-slate-600 font-medium border-slate-100'
    },
    getOrderAmount(id) { return this.requestOrderState[id] ? this.requestOrderState[id].amount || '' : '' },
    updateOrderAmount(id, val) {
      const num = parseInt(val, 10)
      if (!this.requestOrderState[id]) this.requestOrderState[id] = { amount: 0 }
      this.requestOrderState[id].amount = isNaN(num) ? 0 : num
    },
    isOrderTargetChecked(id, key) { return this.requestOrderState[id] ? this.requestOrderState[id][`${key}Request`] || false : false },
    handleRequestSourceToggle(id, key, checked) {
      if (!this.requestOrderState[id]) this.requestOrderState[id] = { amount: 0 }
      const state = this.requestOrderState[id]
      state[`${key}Request`] = checked
      if (checked) this.requestTargetStores.forEach(k => { if (k !== key) state[`${k}Request`] = false })
    },
    isOrderExceedingStock(id) {
      const state = this.requestOrderState[id]
      if (!state || state.amount <= 0) return false
      const item = this.requestItems.find(d => String(d.id) === id)
      if (!item) return false
      let isError = false, hasChecked = false
      for (const k of this.requestTargetStores) {
        if (state[`${k}Request`]) { hasChecked = true; if (state.amount > (item.stock[k] || 0)) isError = true }
      }
      if (!hasChecked && state.amount > (item.stock.office || 0)) isError = true
      return isError
    },
    openRequestReviewModal() {
      const storeItems = { office: [], baba_main: [], nakano: [], baba_2nd: [] }
      Object.keys(this.requestOrderState).forEach(id => {
        const s = this.requestOrderState[id]
        if (s.amount <= 0) return
        const item = this.requestItems.find(d => String(d.id) === id)
        if (!item) return
        const entry = { brand: item.brand, flavor: item.flavor, amount: s.amount }
        let assigned = false
        Object.keys(storeItems).forEach(k => { if (s[`${k}Request`]) { storeItems[k].push(entry); assigned = true } })
        if (!assigned) storeItems['office'].push(entry)
      })
      this.requestGeneratedSections = []
      const colors = { office: 'bg-slate-400', baba_main: 'bg-red-500', nakano: 'bg-green-500', baba_2nd: 'bg-orange-500' }
      Object.keys(storeItems).forEach(k => {
        const items = storeItems[k]
        if (items.length > 0) {
          const from = this.requestStoreLabel(k), to = this.requestStoreLabel(this.requestStoreKey)
          const grouped = {}
          items.forEach(i => { const b = i.brand||'Other'; if (!grouped[b]) grouped[b]=[]; grouped[b].push(i) })
          let body = ''
          Object.keys(grouped).forEach((b, idx) => {
            body += `・${b} \n`
            grouped[b].forEach(i => { body += `${i.flavor} ${i.amount} \n` })
            if (idx < Object.keys(grouped).length - 1) body += '\n'
          })
          this.requestGeneratedSections.push({ title: `${from} への依頼`, badgeColor: colors[k]||'bg-slate-400', fullText: `${from}から${to} への補充依頼です。\n\n${body}` })
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
      } catch { alert('コピーに失敗しました。') }
    },
    loadMoreRequestItems() { this.requestDisplayLimit += 20 },
  }
}
</script>

<style>
body { font-family: 'Noto Sans JP', sans-serif; background-color: #f8fafc; color: #1e293b; -webkit-font-smoothing: antialiased; }
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-up-enter-active { transition: transform 0.3s ease-out, opacity 0.3s ease-out; }
.slide-up-enter-from { transform: translateY(20px); opacity: 0; }
.sheet-enter-active { transition: transform 0.32s cubic-bezier(0.32,0.72,0,1); }
.sheet-leave-active { transition: transform 0.26s cubic-bezier(0.32,0.72,0,1); }
.sheet-enter-from, .sheet-leave-to { transform: translateY(100%); }
</style>
