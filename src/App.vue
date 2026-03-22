<template>
    <div id="app" class="min-h-[100dvh] flex flex-col">

        <!-- PIN認証オーバーレイ -->
        <PinAuth v-if="!authenticated" @authenticated="authenticated = true" />

        <!-- Header -->
        <AppHeader
            :appMode="appMode"
            :currentStep="currentStep"
            :displayStep="displayStep"
            :totalSteps="totalSteps"
            :currentStoreName="currentStoreName"
            :requestCurrentStoreName="requestCurrentStoreName"
            :requestTotalQty="requestTotalQty"
            :currentMonth="currentMonth"
            :currentDate="currentDate"
            @return-to-portal="returnToPortal"
        />

        <!-- Loading Overlay -->
        <LoadingOverlay :show="loading" :message="loadingMessage" />

        <!-- Main Content -->
        <main v-show="appMode === null || appMode === 'inventory'" class="container mx-auto px-4 py-6 max-w-lg md:max-w-7xl transition-all duration-300 flex-grow">

            <!-- Portal Screen -->
            <transition name="slide-up">
                <PortalMenu
                    v-if="appMode === null"
                    @open-inventory="openInventoryApp"
                    @open-request="openRequestApp"
                    @open-transfer="openTransferApp"
                    @open-stock="openStockApp"
                />
            </transition>

            <!-- ========================================== -->
            <!-- INVENTORY APP (棚卸し)                       -->
            <!-- ========================================== -->
            <InventoryApp
                v-if="appMode === 'inventory'"
                ref="inventoryApp"
                v-model:currentStep="currentStep"
                v-model:storeKey="storeKey"
                v-model:month="month"
                v-model:date="date"
                :selectedBrand="activeSelectedBrand"
                :stores="stores"
                :months="months"
                @update:loading="loading = $event"
                @update:loadingMessage="loadingMessage = $event"
                @update:brands="b => inventoryBrands = b"
                @update:hasData="d => inventoryHasData = d"
            />
        </main>

        <!-- ========================================== -->
        <!-- TRANSFER APP (移動記録)                    -->
        <!-- ========================================== -->
        <main v-if="appMode === 'transfer'" class="container mx-auto px-4 py-6 max-w-lg md:max-w-7xl transition-all duration-300 flex-grow">
            <TransferApp
                ref="transferApp"
                :transferStep="transferStep"
                :selectedBrand="activeSelectedBrand"
                @update:transferStep="transferStep = $event"
                @update:loading="loading = $event"
                @update:loadingMessage="loadingMessage = $event"
                @update:brands="transferBrands = $event"
                @update:inspectAllChecked="inspectAllChecked = $event"
                @update:issueConfirmItemsEmpty="issueConfirmItemsEmpty = $event"
            />
        </main>

        <!-- ========================================== -->
        <!-- REQUEST APP (補充依頼)                     -->
        <!-- ========================================== -->

        <main v-if="appMode === 'request'" class="container mx-auto px-4 py-6 max-w-lg md:max-w-7xl transition-all duration-300 flex-grow">
            <RequestApp
                ref="requestApp"
                :currentStep="currentStep"
                :selectedBrand="activeSelectedBrand"
                @update:currentStep="currentStep = $event"
                @update:loading="loading = $event"
                @update:loadingMessage="loadingMessage = $event"
                @update:brands="requestBrands = $event"
                @update:totalQty="requestTotalQty = $event"
            />
        </main>

        <!-- ========================================== -->
        <!-- ========================================== -->
        <!-- STOCK APP (在庫量確認)                       -->
        <!-- ========================================== -->
        <StockApp
            v-if="appMode === 'stock'"
            :selectedBrand="activeSelectedBrand"
            @update:loading="val => loading = val"
            @update:loadingMessage="msg => loadingMessage = msg"
            @update:brands="brands => stockBrands = brands"
            @update:hasData="val => stockHasData = val"
        />

        <!-- Brand Filter -->
        <BrandFilterSheet
            :brands="brands"
            v-model:selectedBrand="activeSelectedBrand"
            :showFab="showBrandFilterFab"
            :theme="appMode || 'inventory'"
        />

        <!-- Footer Navigation -->
        <AppFooter
            :appMode="appMode"
            :currentStep="currentStep"
            :transferStep="transferStep"
            :requestTotalQty="requestTotalQty"
            :issueConfirmItemsEmpty="issueConfirmItemsEmpty"
            :inspectAllChecked="inspectAllChecked"
            @prev-step="prevStep"
            @next-step="nextStep"
            @submit-inventory="submitInventory"
            @open-request-review-modal="openRequestReviewModal"
            @go-to-issue-confirm="goToIssueConfirm"
            @submit-issue="submitIssue"
            @submit-inspection="submitInspection"
        />

        

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

import PinAuth from './components/common/PinAuth.vue'
import LoadingOverlay from './components/common/LoadingOverlay.vue'
import AppHeader from './components/common/AppHeader.vue'
import AppFooter from './components/common/AppFooter.vue'
import PortalMenu from './components/PortalMenu.vue'
import StockApp from './components/apps/StockApp.vue'
import InventoryApp from './components/apps/InventoryApp.vue'
import RequestApp from './components/apps/RequestApp.vue'
import TransferApp from './components/apps/TransferApp.vue'
import BrandFilterSheet from './components/common/BrandFilterSheet.vue'

export default {
  components: {
    PinAuth,
    LoadingOverlay,
    AppHeader,
    AppFooter,
    PortalMenu,
    StockApp,
    InventoryApp,
    RequestApp,
    TransferApp,
    BrandFilterSheet
  },
  name: 'App',
  data() {
    return {
      authenticated: false,
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
      selectedBrand: null,
      months: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
      inventoryBrands: [],
      // Request
      requestBrands: [],
      requestTotalQty: 0,
      // Transfer
      transferStep: 0,
      transferBrands: [],
      transferSelectedBrand: null,
      issueConfirmItemsEmpty: true,
      inspectAllChecked: false,
      // Stock
      stockBrands: [],
      stockHasData: false,
    }
  },
  computed: {
    activeSelectedBrand: {
      get() { return this.appMode === 'transfer' ? this.transferSelectedBrand : this.selectedBrand },
      set(val) { if (this.appMode === 'transfer') this.transferSelectedBrand = val; else this.selectedBrand = val }
    },
    showBrandFilterFab() {
      return (this.appMode === 'inventory' && this.currentStep > 0 && this.currentStep < 4) ||
             (this.appMode === 'request' && this.currentStep === 1) ||
             (this.appMode === 'transfer' && this.transferStep === '1a') ||
             (this.appMode === 'stock' && this.stockHasData);
    },
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
    
      },
  watch: {
    stockMonth(val) { if (val) this.loadStockData() },
    currentStep(newVal, oldVal) {
      if (this.appMode !== 'inventory') return
      if (oldVal === 0 && (newVal === 1 || newVal === 3)) {
        this.$nextTick(() => {
          history.replaceState(
            { appMode: 'inventory', currentStep: newVal, transferStep: 0 },
            ''
          )
        })
      }
    }
  },
  created() {
    history.replaceState({ appMode: null, currentStep: 0, transferStep: 0 }, '')
  },
  mounted() {
    window.addEventListener('popstate', this.handlePopState)
  },
  beforeUnmount() {
    window.removeEventListener('popstate', this.handlePopState)
  },
  methods: {
    pushHistoryState() {
      history.pushState({ appMode: this.appMode, currentStep: this.currentStep, transferStep: this.transferStep }, '')
    },
    handlePopState(event) {
      if (event.state) {
        this.appMode = event.state.appMode || null
        this.currentStep = event.state.currentStep || 0
        this.transferStep = event.state.transferStep || 0
      } else {
        this.appMode = null
        this.currentStep = 0
        this.transferStep = 0
      }
    },
    openInventoryApp() { this.appMode = 'inventory'; this.currentStep = 0; this.pushHistoryState() },
    openRequestApp() { this.appMode = 'request'; this.currentStep = 0; this.selectedBrand = null; this.pushHistoryState() },
    openTransferApp() {
      this.appMode = 'transfer'; this.transferStep = 0;
      this.issueConfirmItemsEmpty = true; this.inspectAllChecked = false; this.errorMessage = ''
      this.pushHistoryState()
    },
    openStockApp() {
      this.appMode = 'stock'
      this.stockBrands = []
      this.selectedBrand = null
      this.errorMessage = ''
      this.stockHasData = false
      this.pushHistoryState()
    },
    goToIssueConfirm() { if (this.$refs.transferApp) this.$refs.transferApp.goToIssueConfirm() },
    submitIssue() { if (this.$refs.transferApp) this.$refs.transferApp.submitIssue() },
    submitInspection() { if (this.$refs.transferApp) this.$refs.transferApp.submitInspection() },
    returnToPortal() {
      if (this.currentStep > 0) {
        if (confirm('入力途中のデータがある場合、破棄されます。ポータルに戻りますか？')) {
          this.appMode = null; this.currentStep = 0; this.transferStep = 0; this.pushHistoryState()
        }
      } else {
        this.appMode = null; this.currentStep = 0; this.transferStep = 0; this.pushHistoryState()
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
      if (this.appMode === 'inventory' && this.currentStep > 0) {
        if (this.storeKey === 'office') {
          if (this.currentStep === 4) this.currentStep = 3
          else if (this.currentStep === 3) this.currentStep = 0
        } else {
          this.currentStep--
        }
        if (this.$refs.inventoryApp) this.$refs.inventoryApp.saveLocally()
        history.replaceState(
          { appMode: 'inventory', currentStep: this.currentStep, transferStep: 0 },
          ''
        )
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      history.back()
    },
    nextStep() {
      if (this.storeKey === 'office') { if (this.currentStep === 3) this.currentStep = 4 }
      else { if (this.currentStep < 4) this.currentStep++ }
      if (this.appMode === 'inventory' && this.$refs.inventoryApp) this.$refs.inventoryApp.saveLocally()
      this.pushHistoryState(); window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    selectBrand(brand) {
      this.showBrandFilter = false
      setTimeout(() => {
        if (this.appMode === 'transfer') { this.transferSelectedBrand = brand }
        else { this.selectedBrand = brand }
      }, 300)
    },
    hasValues(obj) { if (!obj) return false; return Object.values(obj).some(v => this.isValid(v)) },
    isValid(val) { return val !== '' && val !== null && val !== undefined },
    formatValues(obj) {
      if (!obj) return ''
      return Object.entries(obj).filter(([, v]) => this.isValid(v))
        .map(([k, v]) => { const l = k.replace('val',''); return l === 'Other' ? `他:${v}` : `${l}:${v}` }).join(', ')
    },
    submitInventory() {
      if (this.$refs.inventoryApp) {
        this.$refs.inventoryApp.submitInventory()
      }
    },
                
    
    
    
    
    
    
    
    openRequestReviewModal() { if (this.$refs.requestApp) this.$refs.requestApp.openRequestReviewModal() }
    
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
