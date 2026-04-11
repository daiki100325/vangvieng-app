<template>
    <transition name="fade">
        <div class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900">
            <div class="w-full max-w-xs px-6">
                <!-- ロゴ・タイトル -->
                <div class="text-center mb-10">
                    <div class="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/40">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z">
                            </path>
                        </svg>
                    </div>
                    <h1 class="text-2xl font-bold text-white">V-MINT</h1>
                    <p class="text-slate-400 text-xs mt-0.5">店舗業務ポータル</p>
                    <p class="text-slate-400 text-sm mt-2">暗証番号を入力してください</p>
                </div>

                <!-- テンキー入力エリア -->
                <div class="mb-6">
                    <!-- ドット表示 -->
                    <div class="flex justify-center gap-4 mb-3">
                        <div v-for="i in 4" :key="i"
                            class="w-4 h-4 rounded-full transition-all duration-200"
                            :class="pinInput.length >= i ? 'bg-brand-400 scale-110' : 'bg-slate-600'">
                        </div>
                    </div>
                    <!-- エラーメッセージ -->
                    <p v-if="pinError"
                        class="text-center text-red-400 text-sm font-bold animate-pulse mt-2">{{ pinError }}</p>
                </div>

                <!-- テンキー -->
                <div class="grid grid-cols-3 gap-3">
                    <button v-for="n in [1,2,3,4,5,6,7,8,9]" :key="n"
                        @click="appendPin(String(n))"
                        class="h-16 text-2xl font-bold text-white bg-slate-700 hover:bg-slate-600 active:bg-slate-500 rounded-2xl transition-all active:scale-95 select-none">
                        {{ n }}
                    </button>
                    <!-- 空白 -->
                    <div></div>
                    <!-- 0 -->
                    <button @click="appendPin('0')"
                        class="h-16 text-2xl font-bold text-white bg-slate-700 hover:bg-slate-600 active:bg-slate-500 rounded-2xl transition-all active:scale-95 select-none">
                        0
                    </button>
                    <!-- 削除 -->
                    <button @click="deletePin"
                        class="h-16 flex items-center justify-center text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-2xl transition-all active:scale-95 select-none">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z">
                            </path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
export default {
    name: 'PinAuth',
    data() {
        return {
            pinInput: '',
            pinError: ''
        }
    },
    watch: {
        pinInput(val) {
            if (val.length === 4) {
                this.checkPin()
            }
        }
    },
    methods: {
        appendPin(num) {
            if (this.pinInput.length < 4) {
                this.pinInput += num
            }
        },
        deletePin() {
            this.pinInput = this.pinInput.slice(0, -1)
        },
        checkPin() {
            if (this.pinInput === '4646') {
                this.pinError = ''
                this.$emit('authenticated')
            } else {
                this.pinError = '暗証番号が違います'
                setTimeout(() => {
                    this.pinInput = ''
                    this.pinError = ''
                }, 800)
            }
        }
    }
}
</script>
