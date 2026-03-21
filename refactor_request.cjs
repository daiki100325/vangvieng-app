const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'App.vue');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Template replacement
// We remove from <main v-if="appMode === 'request'" to the end of the <main> block which is at line 630.
// Also remove the "Request Review Modal" block which is: <!-- Request Review Modal --> to </div>...
const templateRegex = /<main v-if="appMode === 'request'"[\s\S]*?<\/main>\r?\n\r?\n\s*<!-- Request Review Modal -->[\s\S]*?<\/div>\r?\n\s*<\/div>\r?\n\s*<\/div>/;

const newTemplate = `<main v-if="appMode === 'request'" class="container mx-auto px-4 py-6 max-w-lg md:max-w-7xl transition-all duration-300 flex-grow">
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
        </main>`;

content = content.replace(templateRegex, newTemplate);

// 2. Import component
if (!content.includes("import RequestApp")) {
    content = content.replace(
        "import InventoryApp from './components/apps/InventoryApp.vue'",
        "import InventoryApp from './components/apps/InventoryApp.vue'\nimport RequestApp from './components/apps/RequestApp.vue'"
    );
}

// 3. Register component
if (!content.includes("RequestApp,")) {
    content = content.replace("components: { StockApp, InventoryApp, BrandFilterSheet,", "components: { StockApp, InventoryApp, RequestApp, BrandFilterSheet,");
}

// 4. Remove `openRequestReviewModal` from App.vue methods and replace with ref forwarding
content = content.replace(
    /openRequestReviewModal\(\)\s*\{[\s\S]*?this\.showRequestModal = true\r?\n    \},/,
    `openRequestReviewModal() { if (this.$refs.requestApp) this.$refs.requestApp.openRequestReviewModal() },`
);

// 5. Remove unused properties from data
content = content.replace(/requestStoreKey: '',\r?\n\s*requestMonth: '',\r?\n\s*requestMonths: Array\.from\([\s\S]*?\)\),\r?\n\s*requestItems: \[\],\r?\n\s*requestOrderState: \{\},\r?\n\s*requestHideZero: false,\r?\n\s*showRequestModal: false,\r?\n\s*requestGeneratedSections: \[\],\r?\n\s*toastVisible: false,\r?\n\s*copiedSection: null,\r?\n\s*requestDisplayLimit: 20,\r?\n\s*/, '');

// Keep `requestBrands` because BrandFilterSheet uses it.
// Add `requestTotalQty` to data since we need it for AppFooter.
if (!content.includes('requestTotalQty: 0,')) {
    content = content.replace(/requestBrands: \[\],/, 'requestBrands: [],\n      requestTotalQty: 0,');
}

// 6. Remove computed properties
content = content.replace(/requestTargetStores\(\)\s*\{[\s\S]*?\},/, '');
content = content.replace(/requestFilteredItems\(\)\s*\{[\s\S]*?\},/, '');
content = content.replace(/requestDisplayedItems\(\)\s*\{[\s\S]*?\},/, '');
content = content.replace(/requestTotalQty\(\)\s*\{[\s\S]*?\},/, '');

// 7. Remove methods
content = content.replace(/async startRequest\(\)\s*\{[\s\S]*?\}\s*finally\s*\{\s*this\.loading = false\s*\}\r?\n\s*\},\r?\n/, '');
content = content.replace(/requestStoreLabel\(key\)\s*\{[\s\S]*?\},/, '');
content = content.replace(/getStockColorClass\(val\)\s*\{[\s\S]*?\},/, '');
content = content.replace(/getOtherStockStyle\(item, storeCode\)\s*\{[\s\S]*?\},/, '');
content = content.replace(/getOrderAmount\(id\)\s*\{[\s\S]*?\},/, '');
content = content.replace(/updateOrderAmount\(id, val\)\s*\{[\s\S]*?\},/, '');
content = content.replace(/isOrderTargetChecked\(id, key\)\s*\{[\s\S]*?\},/, '');
content = content.replace(/handleRequestSourceToggle\(id, key, checked\)\s*\{[\s\S]*?\},/, '');
content = content.replace(/isOrderExceedingStock\(id\)\s*\{[\s\S]*?\},/, '');
content = content.replace(/async copyRequestText\(text, title\)\s*\{[\s\S]*?\},/, '');
content = content.replace(/loadMoreRequestItems\(\)\s*\{[\s\S]*?\},/, '');

fs.writeFileSync(targetFile, content, 'utf8');
console.log('App.vue refactored for RequestApp');
