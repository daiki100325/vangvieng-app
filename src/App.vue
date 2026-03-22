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
            :transferStep="transferStep"
            :transferIssueFrom="transferIssueFromName"
            :transferIssueTo="transferIssueToName"
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
                @update:checkingConsumption="inventoryCheckingConsumption = $event"
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
                @update:issueFromName="transferIssueFromName = $event"
                @update:issueToName="transferIssueToName = $event"
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

        <!-- Global Confirm Dialog -->
        <ConfirmDialog
            :visible="confirmDialog.visible"
            :message="confirmDialog.message"
            :okLabel="confirmDialog.okLabel"
            :okClass="confirmDialog.okClass"
            @ok="onConfirmDialogOk"
            @cancel="onConfirmDialogCancel"
        />

        <!-- Footer Navigation -->
        <AppFooter
            :appMode="appMode"
            :currentStep="currentStep"
            :transferStep="transferStep"
            :requestTotalQty="requestTotalQty"
            :issueConfirmItemsEmpty="issueConfirmItemsEmpty"
            :inspectAllChecked="inspectAllChecked"
            :inventoryCheckingConsumption="inventoryCheckingConsumption"
            @prev-step="prevStep"
            @next-step="nextStep"
            @submit-inventory="submitInventory"
            @open-request-review-modal="openRequestReviewModal"
            @go-to-issue-confirm="goToIssueConfirm"
            @submit-issue="submitIssue"
            @submit-inspection="submitInspection"
        />

        

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
import ConfirmDialog from './components/common/ConfirmDialog.vue'

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
    BrandFilterSheet,
    ConfirmDialog
  },
  name: 'App',
  provide() {
    return {
      requestConfirm: (msg, okLabel, okClass) => this.appConfirm(msg, okLabel, okClass)
    }
  },
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
      inventoryCheckingConsumption: false,
      // Request
      requestBrands: [],
      requestTotalQty: 0,
      // Transfer
      transferStep: 0,
      transferBrands: [],
      transferSelectedBrand: null,
      issueConfirmItemsEmpty: true,
      inspectAllChecked: false,
      transferIssueFromName: '',
      transferIssueToName: '',
      // Stock
      stockBrands: [],
      stockHasData: false,
      // Global confirm dialog
      confirmDialog: { visible: false, message: '', okLabel: 'OK', okClass: 'text-emerald-600 hover:bg-emerald-50', resolve: null }
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
    }
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
    // ─── Global confirm dialog ────────────────────────────────────────────
    appConfirm(message, okLabel = 'OK', okClass = 'text-emerald-600 hover:bg-emerald-50') {
      return new Promise((resolve) => {
        this.confirmDialog = { visible: true, message, okLabel, okClass, resolve }
      })
    },
    onConfirmDialogOk() {
      const { resolve } = this.confirmDialog
      this.confirmDialog = { visible: false, message: '', okLabel: 'OK', okClass: 'text-emerald-600 hover:bg-emerald-50', resolve: null }
      if (resolve) resolve(true)
    },
    onConfirmDialogCancel() {
      const { resolve } = this.confirmDialog
      this.confirmDialog = { visible: false, message: '', okLabel: 'OK', okClass: 'text-emerald-600 hover:bg-emerald-50', resolve: null }
      if (resolve) resolve(false)
    },
    // ─── History / navigation ─────────────────────────────────────────────
    pushHistoryState() {
      history.pushState({ appMode: this.appMode, currentStep: this.currentStep, transferStep: this.transferStep }, '')
    },
    handlePopState(event) {
      if (event.state) {
        this.appMode = event.state.appMode || null
        this.currentStep = event.state.currentStep || 0
        this.transferStep = event.state.transferStep || 0
      } else {
        this.appMode = null; this.currentStep = 0; this.transferStep = 0
      }
    },
    openInventoryApp() { this.appMode = 'inventory'; this.currentStep = 0; this.pushHistoryState() },
    openRequestApp() { this.appMode = 'request'; this.currentStep = 0; this.selectedBrand = null; this.pushHistoryState() },
    openTransferApp() {
      this.appMode = 'transfer'; this.transferStep = 0
      this.issueConfirmItemsEmpty = true; this.inspectAllChecked = false; this.errorMessage = ''
      this.pushHistoryState()
    },
    openStockApp() {
      this.appMode = 'stock'; this.stockBrands = []; this.selectedBrand = null
      this.errorMessage = ''; this.stockHasData = false
      this.pushHistoryState()
    },
    // ─── Header back button ───────────────────────────────────────────────
    async returnToPortal() {
      if (this.appMode === 'transfer') {
        await this.handleTransferHeaderBack()
        return
      }
      if (this.currentStep > 0) {
        const ok = await this.appConfirm('入力途中のデータがある場合、破棄されます。\nポータルに戻りますか？', 'ポータルへ', 'text-red-600 hover:bg-red-50')
        if (!ok) return
      }
      this.appMode = null; this.currentStep = 0; this.transferStep = 0; this.pushHistoryState()
    },
    transferHasSetupDraft(t) {
      if (!t) return false
      return !!(t.transferMonth || t.transferSubMode || t.issueFromStore || t.issueDestStore || t.issueDate || t.inspectDestStore)
    },
    async handleTransferHeaderBack() {
      const t = this.$refs.transferApp
      const atTop = this.transferStep === 0
      if (atTop) {
        if (this.transferHasSetupDraft(t)) {
          const ok = await this.appConfirm('入力内容が破棄されます。よろしいですか？', 'はい', 'text-red-600 hover:bg-red-50')
          if (!ok) return
        }
        this.appMode = null; this.currentStep = 0; this.transferStep = 0
        this.transferSelectedBrand = null; this.pushHistoryState()
        return
      }
      const ok = await this.appConfirm('入力内容が破棄されます。よろしいですか？', 'はい', 'text-red-600 hover:bg-red-50')
      if (!ok) return
      if (t) t.resetTransferApp()
      this.transferSelectedBrand = null; this.pushHistoryState()
    },
    // ─── Footer back / next ───────────────────────────────────────────────
    async prevStep() {
      if (this.appMode === 'inventory' && this.currentStep > 0) {
        if (this.storeKey === 'office') {
          if (this.currentStep === 4) this.currentStep = 3
          else if (this.currentStep === 3) this.currentStep = 0
        } else {
          this.currentStep--
        }
        if (this.$refs.inventoryApp) this.$refs.inventoryApp.saveLocally()
        history.replaceState({ appMode: 'inventory', currentStep: this.currentStep, transferStep: 0 }, '')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      if (this.appMode === 'transfer') {
        if (this.transferStep === '2a') {
          this.transferStep = '1a'
          history.replaceState({ appMode: 'transfer', currentStep: 0, transferStep: '1a' }, '')
          window.scrollTo({ top: 0, behavior: 'smooth' })
          return
        }
        if (this.transferStep === '1a' || this.transferStep === '1b') {
          const ok = await this.appConfirm('入力内容が破棄されます。よろしいですか？', 'はい', 'text-red-600 hover:bg-red-50')
          if (!ok) return
          if (this.$refs.transferApp) this.$refs.transferApp.resetTransferApp()
          this.transferSelectedBrand = null
          history.replaceState({ appMode: 'transfer', currentStep: 0, transferStep: 0 }, '')
          window.scrollTo({ top: 0, behavior: 'smooth' })
          return
        }
        return
      }
      if (this.appMode === 'request' && this.currentStep > 0) {
        const ok = await this.appConfirm('入力途中のデータがある場合、破棄されます。\n補充依頼のトップに戻りますか？', 'はい', 'text-red-600 hover:bg-red-50')
        if (!ok) return
        this.currentStep = 0
        history.replaceState({ appMode: 'request', currentStep: 0, transferStep: 0 }, '')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
    },
    nextStep() {
      if (this.storeKey === 'office') { if (this.currentStep === 3) this.currentStep = 4 }
      else { if (this.currentStep < 4) this.currentStep++ }
      if (this.appMode === 'inventory' && this.$refs.inventoryApp) this.$refs.inventoryApp.saveLocally()
      this.pushHistoryState(); window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    // ─── App-level delegates ──────────────────────────────────────────────
    goToIssueConfirm() { if (this.$refs.transferApp) this.$refs.transferApp.goToIssueConfirm() },
    submitIssue() { if (this.$refs.transferApp) this.$refs.transferApp.submitIssue() },
    submitInspection() { if (this.$refs.transferApp) this.$refs.transferApp.submitInspection() },
    submitInventory() { if (this.$refs.inventoryApp) this.$refs.inventoryApp.submitInventory() },
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
