<template>
    <div>
        <!-- Filter FAB -->
        <div v-show="showFab" class="fixed bottom-24 right-4 z-30">
            <button @click="isVisible = true"
                class="relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-95"
                :class="selectedBrand
                    ? (themeColorClass + ' text-white')
                    : 'bg-slate-800 text-white shadow-slate-900/30'">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z">
                    </path>
                </svg>
                <span v-if="selectedBrand" class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-400 rounded-full border-2 border-white"></span>
            </button>
        </div>

        <!-- Bottom Sheet Overlay -->
        <transition name="fade">
            <div v-if="isVisible" @click="isVisible = false"
                class="fixed inset-0 bg-black/40 backdrop-blur-sm z-40">
            </div>
        </transition>

        <!-- Bottom Sheet Panel -->
        <transition name="sheet">
            <div v-if="isVisible"
                class="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl pb-safe-area">
                <!-- Handle bar -->
                <div class="flex justify-center pt-3 pb-1">
                    <div class="w-10 h-1 bg-slate-300 rounded-full"></div>
                </div>
                <!-- Header -->
                <div class="flex justify-between items-center px-5 pt-2 pb-3 border-b border-slate-100">
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4" :class="themeTextColorClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z">
                            </path>
                        </svg>
                        <span class="text-sm font-bold text-slate-700">ブランドで絞り込む</span>
                        <span v-if="selectedBrand" class="text-xs font-bold px-2 py-0.5 rounded-full"
                            :class="themeBadgeClass">{{ selectedBrand }}</span>
                    </div>
                    <button @click="isVisible = false"
                        class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 active:scale-95">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <!-- Brand bubbles -->
                <div class="px-4 pt-4 pb-6 max-h-[50vh] overflow-y-auto">
                    <div class="flex flex-wrap gap-2 justify-start">
                        <button @click="selectBrand(null)" 
                            :class="selectedBrand === null ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                            class="px-5 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95">
                            すべて
                        </button>
                        <button v-for="brand in brands" :key="brand" @click="selectBrand(brand)"
                            :class="selectedBrand === brand ? themeActiveButtonClass : themeInactiveButtonClass"
                            class="px-5 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95">
                            {{ brand }}
                        </button>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
export default {
    name: 'BrandFilterSheet',
    props: {
        brands: {
            type: Array,
            required: true
        },
        selectedBrand: {
            type: String,
            default: null
        },
        showFab: {
            type: Boolean,
            default: true
        },
        theme: {
            type: String,
            default: 'inventory', // 'inventory', 'request', 'transfer', 'dashboard'
            validator: (value) => ['inventory', 'request', 'transfer', 'dashboard'].includes(value)
        }
    },
    emits: ['update:selectedBrand'],
    data() {
        return {
            isVisible: false
        }
    },
    computed: {
        themeColorClass() {
            return {
                inventory: 'bg-brand-600 shadow-brand-500/40',
                request: 'bg-orange-600 shadow-orange-500/40',
                transfer: 'bg-emerald-600 shadow-emerald-500/40',
                dashboard: 'bg-red-600 shadow-red-500/40'
            }[this.theme]
        },
        themeTextColorClass() {
             return {
                inventory: 'text-brand-600',
                request: 'text-orange-600',
                transfer: 'text-emerald-600',
                dashboard: 'text-red-600'
            }[this.theme]
        },
        themeBadgeClass() {
            return {
                inventory: 'text-brand-600 bg-brand-50',
                request: 'text-orange-600 bg-orange-50',
                transfer: 'text-emerald-600 bg-emerald-50',
                dashboard: 'text-red-600 bg-red-50'
            }[this.theme]
        },
        themeActiveButtonClass() {
            return {
                inventory: 'bg-brand-600 text-white shadow-md shadow-brand-500/30',
                request: 'bg-orange-600 text-white shadow-md shadow-orange-500/30',
                transfer: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30',
                dashboard: 'bg-red-600 text-white shadow-md shadow-red-500/30'
            }[this.theme]
        },
        themeInactiveButtonClass() {
            return {
                inventory: 'bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-600',
                request: 'bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-600',
                transfer: 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600',
                dashboard: 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600'
            }[this.theme]
        }
    },
    methods: {
        selectBrand(brand) {
            this.$emit('update:selectedBrand', brand)
            this.isVisible = false
            this.$nextTick(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' })
            })
        }
    }
}
</script>
