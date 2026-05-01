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
                    @open-dashboard="openDashboardApp"
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
                :years="years"
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
                @update:amendItemsEmpty="amendItemsEmpty = $event"
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
        <!-- DASHBOARD APP (ダッシュボードモード)          -->
        <!-- ========================================== -->
        <DashboardApp
            v-if="appMode === 'dashboard'"
            ref="dashboardApp"
            :selectedBrand="activeSelectedBrand"
            :stores="stores"
            @update:loading="val => loading = val"
            @update:loadingMessage="msg => loadingMessage = msg"
            @update:brands="brands => dashboardBrands = brands"
            @update:hasData="val => dashboardHasData = val"
            @update:subModeActive="val => dashboardSubModeActive = val"
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
            :dashboardSubModeActive="dashboardSubModeActive"
            :requestTotalQty="requestTotalQty"
            :issueConfirmItemsEmpty="issueConfirmItemsEmpty"
            :inspectAllChecked="inspectAllChecked"
            :amendItemsEmpty="amendItemsEmpty"
            :inventoryCheckingConsumption="inventoryCheckingConsumption"
            @prev-step="prevStep"
            @next-step="nextStep"
            @submit-inventory="submitInventory"
            @open-request-review-modal="openRequestReviewModal"
            @go-to-issue-confirm="goToIssueConfirm"
            @submit-issue="submitIssue"
            @submit-inspection="submitInspection"
            @submit-transfer-amend="submitTransferAmend"
        />

        

    </div>
</template>

<script>
import {
  getSheetData, submitData,
  getInventoryData,
  getFlavorListForTransfer, getPendingTransferRecords,
  getTransferRecordDetail, submitTransferRecord, completeInspection,
  fetchLatestTransferPeriodKey
} from './api.js'

import PinAuth from './components/common/PinAuth.vue'
import LoadingOverlay from './components/common/LoadingOverlay.vue'
import AppHeader from './components/common/AppHeader.vue'
import AppFooter from './components/common/AppFooter.vue'
import PortalMenu from './components/PortalMenu.vue'
import DashboardApp from './components/apps/DashboardApp.vue'
import InventoryApp from './components/apps/InventoryApp.vue'
import RequestApp from './components/apps/RequestApp.vue'
import TransferApp from './components/apps/TransferApp.vue'
import BrandFilterSheet from './components/common/BrandFilterSheet.vue'
import ConfirmDialog from './components/common/ConfirmDialog.vue'
import { buildYearOptions, buildMonthOptions, formatPeriodLabel, getCurrentPeriodKey } from './utils/periods.js'

export default {
  components: {
    PinAuth,
    LoadingOverlay,
    AppHeader,
    AppFooter,
    PortalMenu,
    DashboardApp,
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
      years: buildYearOptions(),
      months: buildMonthOptions(),
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
      amendItemsEmpty: true,
      transferIssueFromName: '',
      transferIssueToName: '',
      // Dashboard
      dashboardBrands: [],
      dashboardHasData: false,
      dashboardSubModeActive: false,
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
             (this.appMode === 'dashboard' && this.dashboardSubModeActive && this.dashboardHasData);
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
    currentMonth() { return formatPeriodLabel(this.month) },
    currentDate() { return this.date },
    brands() {
      if (this.appMode === 'transfer') return this.transferBrands
      if (this.appMode === 'dashboard') return this.dashboardBrands
      return this.appMode === 'request' ? this.requestBrands : this.inventoryBrands
    }
  },
  watch: {
    brands(newBrands) {
      if (this.appMode === 'transfer') {
        if (this.transferSelectedBrand && !newBrands.includes(this.transferSelectedBrand)) {
          this.transferSelectedBrand = null
        }
        return
      }
      if (this.selectedBrand && !newBrands.includes(this.selectedBrand)) {
        this.selectedBrand = null
      }
    },
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
    handlePopState() {
      // ブラウザバックを「戻るボタン押下」と同じ挙動にするため、
      // まず現在の状態を push し直して history 上の位置を元に戻し、
      // その後に通常の戻るロジック（確認ダイアログ込み）を呼ぶ。
      history.pushState(
        { appMode: this.appMode, currentStep: this.currentStep, transferStep: this.transferStep },
        ''
      )
      const footerBackVisible =
        (this.appMode !== null && this.currentStep > 0) ||
        (this.appMode === 'transfer' && this.transferStep !== 0) ||
        (this.appMode === 'dashboard' && this.dashboardSubModeActive)
      if (footerBackVisible) {
        this.prevStep()
      } else if (this.appMode !== null) {
        this.returnToPortal()
      }
    },
    async openInventoryApp() {
      this.appMode = 'inventory'
      this.currentStep = 0
      this.selectedBrand = null
      try {
        const pk = await fetchLatestTransferPeriodKey()
        this.month = String(pk ?? getCurrentPeriodKey())
      } catch {
        this.month = String(getCurrentPeriodKey())
      }
      this.pushHistoryState()
    },
    openRequestApp() { this.appMode = 'request'; this.currentStep = 0; this.selectedBrand = null; this.pushHistoryState() },
    openTransferApp() {
      this.appMode = 'transfer'; this.transferStep = 0
      this.issueConfirmItemsEmpty = true; this.inspectAllChecked = false; this.errorMessage = ''
      this.pushHistoryState()
    },
    openDashboardApp() {
      this.appMode = 'dashboard'; this.dashboardBrands = []; this.selectedBrand = null
      this.errorMessage = ''; this.dashboardHasData = false; this.dashboardSubModeActive = false
      this.pushHistoryState()
    },
    // ─── Header back button ───────────────────────────────────────────────
    async returnToPortal() {
      if (this.appMode === 'transfer') {
        await this.handleTransferHeaderBack()
        return
      }
      if (this.appMode === 'dashboard' && this.dashboardSubModeActive) {
        if (this.$refs.dashboardApp) this.$refs.dashboardApp.goBackToSelection()
        this.dashboardSubModeActive = false
        this.dashboardHasData = false
        this.selectedBrand = null
        return
      }
      if (this.appMode === 'inventory' && this.currentStep > 0) {
        if (this.$refs.inventoryApp) this.$refs.inventoryApp.saveLocally()
        const ok = await this.appConfirm('未送信のデータがあります。ポータルに戻りますか？\n入力途中のデータはブラウザに保存されます。', 'ポータルへ', 'text-brand-600 hover:bg-brand-50')
        if (!ok) return
      } else if (this.currentStep > 0) {
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
        const nextStep = this.storeKey === 'office'
          ? (this.currentStep === 4 ? 3 : 0)
          : this.currentStep - 1
        if (nextStep === 0) {
          if (this.$refs.inventoryApp) this.$refs.inventoryApp.saveLocally()
          const ok = await this.appConfirm('未送信のデータがあります。トップ画面に戻りますか？\n入力途中のデータはブラウザに保存されます。', 'トップに戻る', 'text-brand-600 hover:bg-brand-50')
          if (!ok) return
        }
        this.currentStep = nextStep
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
        if (this.transferStep === '1a' || this.transferStep === '1b' || this.transferStep === '1c') {
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
      if (this.appMode === 'dashboard') {
        if (this.dashboardSubModeActive) {
          if (this.$refs.dashboardApp) this.$refs.dashboardApp.goBackToSelection()
          this.dashboardSubModeActive = false
          this.dashboardHasData = false
          this.selectedBrand = null
          window.scrollTo({ top: 0, behavior: 'smooth' })
          return
        }
        this.appMode = null
        this.currentStep = 0
        this.transferStep = 0
        this.selectedBrand = null
        this.dashboardBrands = []
        this.dashboardHasData = false
        this.dashboardSubModeActive = false
        this.pushHistoryState()
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
    submitTransferAmend() { if (this.$refs.transferApp) this.$refs.transferApp.submitAmend() },
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
