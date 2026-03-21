const fs = require('fs');
const path = require('path');

const appVuePath = path.join(__dirname, 'App.vue');
let content = fs.readFileSync(appVuePath, 'utf8');

// 1. Template Replace (from <main v-if="appMode === 'transfer'"... to </main>)
// We know it is between the stock app/inventory app comments and "<!-- REQUEST APP"
// The preceding marker: "<!-- TRANSFER APP"
const tmplStart = content.indexOf(`<!-- TRANSFER APP (移動記録)                    -->`);
const requestAppMarker = content.indexOf(`<!-- ========================================== -->\n        <!-- REQUEST APP (補充依頼)                     -->`);
if (tmplStart !== -1 && requestAppMarker !== -1) {
    const oldTmpl = content.substring(tmplStart, requestAppMarker);
    const newTmpl = `<!-- TRANSFER APP (移動記録)                    -->
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

        `;
    content = content.replace(oldTmpl, newTmpl);
}

// 2. Import
if (!content.includes("import TransferApp")) {
    content = content.replace(
        "import RequestApp from './components/apps/RequestApp.vue'",
        "import RequestApp from './components/apps/RequestApp.vue'\nimport TransferApp from './components/apps/TransferApp.vue'"
    );
}

// 3. Register Component
if (!content.includes("TransferApp,")) {
    content = content.replace(
        "    RequestApp,",
        "    RequestApp,\n    TransferApp,"
    );
}

// 4. Data Replace
const oldDataStr = `// Transfer
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
      inspectAddSelectedFlavor: '',`;

const newDataStr = `// Transfer
      transferStep: 0,
      transferBrands: [],
      transferSelectedBrand: null,
      issueConfirmItemsEmpty: true,
      inspectAllChecked: false,`;

if (content.includes(oldDataStr)) {
    content = content.replace(oldDataStr, newDataStr);
}

// 5. Computed Properties Replace
// Delete from issueConfirmItems() to transferStep2aTitle()
// We can use regex or substring
const compStart = content.indexOf(`issueConfirmItems() {`);
const compEnd = content.indexOf(`  },\n  watch: {`);
if (compStart !== -1 && compEnd !== -1) {
    content = content.substring(0, compStart) + content.substring(compEnd);
}

// 6. openTransferApp method rewrite
const openAppOld = `openTransferApp() {
      this.appMode = 'transfer'; this.transferStep = 0; this.transferSubMode = null
      this.transferMonth = ''; this.issueFromStore = ''; this.issueDestStore = ''
      this.issueDate = ''; this.issueItems = []; this.issueOrderState = {}
      this.inspectDestStore = ''; this.inspectPendingList = []; this.inspectSelectedBlock = null
      this.inspectDetail = []; this.inspectChecked = {}; this.errorMessage = ''
      this.pushHistoryState()
    },`;
const openAppNew = `openTransferApp() {
      this.appMode = 'transfer'; this.transferStep = 0;
      this.issueConfirmItemsEmpty = true; this.inspectAllChecked = false; this.errorMessage = ''
      this.pushHistoryState()
    },`;
if (content.includes(openAppOld)) {
    content = content.replace(openAppOld, openAppNew);
}

// 7. Methods Replace
// We need to replace transferStoreName up to submitInspection
const methStartArr = [
    `transferStoreName(key)`,
    `issueStoreName(key)`,
    `async startIssue()`,
    `updateIssueQty(rowIndex`,
    `goToIssueConfirm()`,
    `async submitIssue()`,
    `async loadPendingRecords()`,
    `async startInspect()`,
    `addInspectFlavor()`,
    `confirmQtyChange(item)`,
    `toggleInspectCheck(rowIndex)`,
    `async submitInspection()`
];

// Instead of matching exactly, let's look for transferStoreName to submitInspection block end
const methStart = content.indexOf(`transferStoreName(key) {`);
const selectBrandPos = content.indexOf(`returnToPortal() {`); // Next method after submitInspection
if (methStart !== -1 && selectBrandPos !== -1) {
    const methodsOld = content.substring(methStart, selectBrandPos);
    const methodsNew = `goToIssueConfirm() { if (this.$refs.transferApp) this.$refs.transferApp.goToIssueConfirm() },
    submitIssue() { if (this.$refs.transferApp) this.$refs.transferApp.submitIssue() },
    submitInspection() { if (this.$refs.transferApp) this.$refs.transferApp.submitInspection() },
    `;
    content = content.replace(methodsOld, methodsNew);
}

fs.writeFileSync(appVuePath, content, 'utf8');
console.log('App.vue refactored for TransferApp successfully.');
