<!-- pages/index.vue - GOLD TRACKER (iOS FIXED VERSION) -->
<template>
  <div class="app">
    <!-- Offline Banner -->
    <div v-if="!isOnline" class="offline-banner">
      ⚠️ No internet connection - Using cached data
    </div>

    <!-- Toast Notifications -->
    <div class="toast-container">
      <transition-group name="toast">
        <div v-for="toast in toasts" :key="toast.id" :class="['toast', `toast-${toast.type}`]">
          <span class="toast-icon">{{ toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ' }}</span>
          {{ toast.message }}
        </div>
      </transition-group>
    </div>

    <!-- Main Container -->
    <div class="container">
      <!-- Header -->
      <header class="header">
        <h1 class="app-title">{{ t.appTitle }}</h1>
        <div class="header-actions">
          <button @click="toggleLanguage" class="btn-ghost btn-lang">
            {{ language === 'en' ? 'ខ្មែរ' : 'EN' }}
          </button>
          <button v-if="purchases.length > 0" @click="exportData('csv')" class="btn-ghost">
            {{ t.exportCSV }}
          </button>
          <button v-if="apiKey && currentPrice > 0" @click="handleRefresh" :disabled="isLoading || !isOnline"
            class="btn-ghost">
            {{ isLoading ? t.refreshing : !isOnline ? 'Offline' : t.refresh }}
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <main class="main">
        <!-- Current Price Section -->
        <section class="section">
          <div class="card card-primary">
            <div class="price-header">
              <h2 class="section-title">{{ t.currentGoldPrice }}</h2>
              <span class="badge" :class="{ 'badge-live': isApiPrice }">
                {{ isApiPrice ? 'Live' : 'Manual' }}
              </span>
            </div>

            <div class="price-display">
              <div class="price-main">{{ formatCurrency(currentPrice) }}</div>
              <div class="price-sub">{{ t.perTroyOunce }}</div>
            </div>

            <div class="price-damlung">
              <div class="damlung-value">{{ formatCurrency(currentPrice * DAMLUNG_TO_OZ) }}</div>
              <div class="damlung-label">{{ t.perDamlung }}</div>
            </div>

            <div class="price-time">{{ lastUpdated }}</div>

            <!-- Manual Price Input -->
            <div class="input-group">
              <label class="label">{{ t.setCustomPrice }}</label>

              <!-- Unit Toggle -->
              <div class="price-unit-toggle">
                <button @click="priceUnit = 'oz'" :class="['unit-btn', { active: priceUnit === 'oz' }]">
                  Troy Oz
                </button>
                <button @click="priceUnit = 'damlung'" :class="['unit-btn', { active: priceUnit === 'damlung' }]">
                  Damlung
                </button>
                <button @click="priceUnit = 'chi'" :class="['unit-btn', { active: priceUnit === 'chi' }]">
                  Chi
                </button>
              </div>

              <!-- Price Input -->
              <div class="input-row">
                <input v-model="manualPrice" type="text" inputmode="decimal" pattern="[0-9]*\.?[0-9]*"
                  :placeholder="priceUnit === 'oz' ? t.enterPriceOz : priceUnit === 'damlung' ? t.enterPriceDamlung : t.enterPriceChi"
                  class="input" @keyup.enter="applyCustomPrice" />
                <button @click="applyCustomPrice" class="btn-primary">{{ t.apply }}</button>
              </div>

              <!-- Conversion Preview -->
              <div v-if="manualPrice && parseFloat(manualPrice) > 0" class="price-preview">
                <div class="preview-item">
                  <span class="preview-label">Troy Oz:</span>
                  <span class="preview-value">
                    {{ priceUnit === 'oz'
      ? formatCurrency(parseFloat(manualPrice))
      : priceUnit === 'damlung'
        ? formatCurrency(parseFloat(manualPrice) / DAMLUNG_TO_OZ)
        : formatCurrency(parseFloat(manualPrice) / CHI_TO_OZ)
                    }}
                  </span>
                </div>
                <div class="preview-item">
                  <span class="preview-label">Damlung:</span>
                  <span class="preview-value">
                    {{ priceUnit === 'oz'
      ? formatCurrency(parseFloat(manualPrice) * DAMLUNG_TO_OZ)
      : priceUnit === 'damlung'
        ? formatCurrency(parseFloat(manualPrice))
        : formatCurrency((parseFloat(manualPrice) / CHI_TO_OZ) * DAMLUNG_TO_OZ)
                    }}
                  </span>
                </div>
                <div class="preview-item">
                  <span class="preview-label">Chi:</span>
                  <span class="preview-value">
                    {{ priceUnit === 'oz'
      ? formatCurrency(parseFloat(manualPrice) * CHI_TO_OZ)
      : priceUnit === 'damlung'
        ? formatCurrency((parseFloat(manualPrice) / DAMLUNG_TO_OZ) * CHI_TO_OZ)
        : formatCurrency(parseFloat(manualPrice))
                    }}
                  </span>
                </div>
              </div>
            </div>

            <!-- API Section -->
            <div class="api-section">
              <div v-if="!apiKey || apiKey === 'goldapi-3yrz5zhtl5zcyqg4-io'" class="api-prompt">
                <div class="prompt-content">
                  <div class="prompt-title">{{ t.enableLiveUpdates }}</div>
                  <div class="prompt-text">{{ t.connectToAPI }}</div>
                </div>
                <div class="prompt-actions">
                  <button @click="useDemoApi" class="btn-secondary">{{ t.useDemo }}</button>
                  <button @click="toggleApiSetup" class="btn-primary">{{ t.setupAPI }}</button>
                </div>
              </div>

              <transition name="expand">
                <div v-if="showApiSetup" class="api-config">
                  <label class="label">{{ t.apiKey }}</label>
                  <div class="input-row">
                    <input v-model="apiKeyInput" :type="showApiKey ? 'text' : 'password'" :placeholder="t.enterAPIKey"
                      class="input" />
                    <button @click="toggleApiKeyVisibility" class="btn-ghost">
                      {{ showApiKey ? '👁️' : '👁️‍🗨️' }}
                    </button>
                  </div>
                  <div class="help-text">
                    Get a free key at <a href="https://www.goldapi.io" target="_blank">goldapi.io</a>
                  </div>
                  <div class="button-row">
                    <button @click="saveApiKey" class="btn-primary">{{ t.saveConnect }}</button>
                    <button @click="toggleApiSetup" class="btn-ghost">{{ t.cancel }}</button>
                  </div>
                </div>
              </transition>

              <div v-if="isApiPrice" class="api-active">
                <div class="status-row">
                  <span class="status-dot"></span>
                  <span class="status-text">{{ t.liveUpdatesActive }}</span>
                </div>
                <div class="button-row">
                  <button @click="handleRefresh" :disabled="isLoading || !isOnline" class="btn-secondary">
                    {{ isLoading ? 'Updating...' : !isOnline ? 'Offline' : 'Refresh Now' }}
                  </button>
                  <button @click="removeApiKey" class="btn-ghost">{{ t.disconnect }}</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Portfolio Stats -->
        <section v-if="purchases.length > 0" class="section">
          <h2 class="section-title">{{ t.portfolioSummary }}</h2>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">{{ t.totalInvested }}</div>
              <div class="stat-value">{{ formatCurrency(totals.invested) }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">{{ t.currentWorth }}</div>
              <div class="stat-value">{{ formatCurrency(totals.currentValue) }}</div>
            </div>
            <div class="stat-card" :class="totals.profit >= 0 ? 'stat-gain' : 'stat-loss'">
              <div class="stat-label">{{ totals.profit >= 0 ? 'Total Gain' : 'Total Loss' }}</div>
              <div class="stat-value">{{ formatCurrency(Math.abs(totals.profit)) }}</div>
              <div class="stat-percent">{{ (totals.profit >= 0 ? '+' : '-') }}{{
      Math.abs(totals.profitPercent).toFixed(2) }}%</div>
            </div>
          </div>
        </section>

        <!-- Quick Calculator -->
        <section class="section">
          <h2 class="section-title">{{ t.quickCalculator }}</h2>
          <div class="card">
            <div class="calc-inputs">
              <div class="input-group">
                <label class="label">{{ t.amount }}</label>
                <input v-model="calculatorAmount" type="text" inputmode="decimal" pattern="[0-9]*\.?[0-9]*"
                  placeholder="0" class="input" />
              </div>
              <div class="input-group">
                <label class="label">{{ t.unit }}</label>
                <select v-model="calculatorUnit" class="input">
                  <option value="li">{{ t.li }}</option>
                  <option value="hun">{{ t.hun }}</option>
                  <option value="chi">{{ t.chi }}</option>
                  <option value="gram">{{ t.gram }}</option>
                  <option value="damlung">{{ t.damlung }}</option>
                  <option value="oz">{{ t.troyOz }}</option>
                </select>
              </div>
            </div>

            <transition name="fade">
              <div v-if="parseFloat(calculatorAmount) > 0" class="calc-result">
                <div class="result-label">{{ t.estimatedValue }}</div>
                <div class="result-value">{{ formatCurrency(calculateValue(parseFloat(calculatorAmount), calculatorUnit,
      currentPrice)) }}</div>
              </div>
            </transition>
          </div>
        </section>

        <!-- Gram to Chi Converter -->
        <section class="section">
          <h2 class="section-title">{{ t.gramChiConverter }}</h2>
          <div class="card">
            <div class="converter-row">
              <div class="input-group">
                <label class="label">{{ t.grams }}</label>
                <select v-model="gramAmount" class="input">
                  <option value="0">Select grams</option>
                  <option value="3.75">3.75g (1 Chi)</option>
                  <option value="7.5">7.50g (2 Chi)</option>
                  <option value="11.25">11.25g (3 Chi)</option>
                  <option value="15">15.00g (4 Chi)</option>
                  <option value="18.75">18.75g (5 Chi)</option>
                  <option value="22.5">22.50g (6 Chi)</option>
                  <option value="26.25">26.25g (7 Chi)</option>
                  <option value="30">30.00g (8 Chi)</option>
                  <option value="33.75">33.75g (9 Chi)</option>
                  <option value="37.5">37.50g (10 Chi)</option>
                  <option value="50">50.00g</option>
                  <option value="75">75.00g</option>
                  <option value="100">100.00g</option>
                </select>
              </div>
              <div class="converter-equals">=</div>
              <div class="input-group">
                <label class="label">{{ t.chi }}</label>
                <div class="converter-result">{{ gramToChi(parseFloat(gramAmount)).toFixed(2) }}</div>
              </div>
            </div>

            <div class="converter-info">{{ t.chiConverterInfo }}</div>
          </div>
        </section>

        <!-- Li/Hun/Chi Converter -->
        <section class="section">
          <h2 class="section-title">{{ t.liHunChiConverter }}</h2>
          <div class="card">
            <div class="converter-grid">
              <div class="input-group">
                <label class="label">{{ t.li }}</label>
                <select v-model="liAmount" class="input">
                  <option value="0">Select Li</option>
                  <option value="10">10 Li (1 Hun)</option>
                  <option value="20">20 Li (2 Hun)</option>
                  <option value="30">30 Li (3 Hun)</option>
                  <option value="40">40 Li (4 Hun)</option>
                  <option value="50">50 Li (5 Hun)</option>
                  <option value="60">60 Li (6 Hun)</option>
                  <option value="70">70 Li (7 Hun)</option>
                  <option value="80">80 Li (8 Hun)</option>
                  <option value="90">90 Li (9 Hun)</option>
                  <option value="100">100 Li (1 Chi)</option>
                  <option value="200">200 Li (2 Chi)</option>
                  <option value="300">300 Li (3 Chi)</option>
                  <option value="400">400 Li (4 Chi)</option>
                  <option value="500">500 Li (5 Chi)</option>
                  <option value="1000">1000 Li (10 Chi)</option>
                </select>
              </div>
              <div class="input-group">
                <label class="label">{{ t.hun }}</label>
                <div class="converter-result">{{ liToHun(parseFloat(liAmount)).toFixed(1) }}</div>
              </div>
              <div class="input-group">
                <label class="label">{{ t.chi }}</label>
                <div class="converter-result">{{ liToChi(parseFloat(liAmount)).toFixed(2) }}</div>
              </div>
            </div>

            <div class="converter-info">{{ t.liHunChiInfo }}</div>
          </div>
        </section>

        <!-- Price by Unit -->
        <section class="section">
          <h2 class="section-title">{{ t.priceByUnit }}</h2>
          <div class="units-grid">
            <div class="unit-card">
              <div class="unit-name">{{ t.li }}</div>
              <div class="unit-price">{{ formatCurrency(currentPrice * LI_TO_OZ) }}</div>
              <div class="unit-weight">0.0375 grams</div>
            </div>
            <div class="unit-card">
              <div class="unit-name">{{ t.hun }}</div>
              <div class="unit-price">{{ formatCurrency(currentPrice * HUN_TO_OZ) }}</div>
              <div class="unit-weight">0.375 grams</div>
            </div>
            <div class="unit-card">
              <div class="unit-name">{{ t.chi }}</div>
              <div class="unit-price">{{ formatCurrency(currentPrice * CHI_TO_OZ) }}</div>
              <div class="unit-weight">3.75 grams</div>
            </div>
            <div class="unit-card">
              <div class="unit-name">{{ t.gram }}</div>
              <div class="unit-price">{{ formatCurrency(currentPrice * GRAM_TO_OZ) }}</div>
              <div class="unit-weight">1 gram</div>
            </div>
            <div class="unit-card">
              <div class="unit-name">Damlung</div>
              <div class="unit-price">{{ formatCurrency(currentPrice * DAMLUNG_TO_OZ) }}</div>
              <div class="unit-weight">37.5 grams</div>
            </div>
            <div class="unit-card">
              <div class="unit-name">Troy Oz</div>
              <div class="unit-price">{{ formatCurrency(currentPrice) }}</div>
              <div class="unit-weight">31.1 grams</div>
            </div>
          </div>
        </section>

        <!-- Add Purchase -->
        <section class="section">
          <h2 class="section-title">{{ t.addNewPurchase }}</h2>
          <div class="card">
            <div class="purchase-form">
              <div class="input-group">
                <label class="label">{{ t.amountChi }}</label>
                <input v-model="newPurchase.amount" type="text" inputmode="decimal" pattern="[0-9]*\.?[0-9]*"
                  placeholder="0.00" class="input" />
              </div>
              <div class="input-group">
                <label class="label">{{ t.pricePaid }}</label>
                <input v-model="newPurchase.totalPaid" type="text" inputmode="decimal" pattern="[0-9]*\.?[0-9]*"
                  placeholder="0.00" class="input" />
              </div>
              <div class="input-group">
                <label class="label">{{ t.date }}</label>
                <input v-model="newPurchase.date" type="date" class="input" :max="getCurrentDate()" />
              </div>
            </div>
            <button @click="addPurchase" :disabled="!canAddPurchase()" class="btn-primary btn-full">
              Add Purchase
            </button>
          </div>
        </section>

        <!-- My Purchases -->
        <section v-if="purchases.length > 0" class="section">
          <div class="purchases-header">
            <h2 class="section-title" style="margin-bottom: 0;">{{ t.myPurchases }}</h2>
            <div class="sort-control">
              <label class="label-inline">{{ t.sortBy }}</label>
              <select v-model="purchaseSortBy" class="input input-sm">
                <option value="date-desc">{{ t.newestFirst }}</option>
                <option value="date-asc">{{ t.oldestFirst }}</option>
                <option value="amount-desc">{{ t.highestAmount }}</option>
                <option value="amount-asc">{{ t.lowestAmount }}</option>
                <option value="profit-desc">{{ t.highestProfit }}</option>
                <option value="profit-asc">{{ t.lowestProfit }}</option>
              </select>
            </div>
          </div>

          <div class="purchases-list">
            <div v-for="purchase in sortedPurchases" :key="purchase.id" class="purchase-card"
              :class="{ editing: editingId === purchase.id }">
              <!-- View Mode -->
              <template v-if="editingId !== purchase.id">
                <div class="purchase-header">
                  <div class="purchase-date">{{ formatDate(purchase.date) }}</div>
                  <div class="purchase-amount">{{ purchase.amount }} Chi</div>
                </div>

                <div class="purchase-details">
                  <div class="detail-row">
                    <span class="detail-label">{{ t.paid }}</span>
                    <span class="detail-value">{{ formatCurrency(purchase.totalPaid) }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">{{ t.currentWorth }}</span>
                    <span class="detail-value">{{ formatCurrency(purchase.amount * CHI_TO_OZ * currentPrice) }}</span>
                  </div>
                  <div class="detail-row detail-profit"
                    :class="getProfitValue(purchase.id) >= 0 ? 'profit-positive' : 'profit-negative'">
                    <span class="detail-label">{{ getProfitValue(purchase.id) >= 0 ? 'Gain' : 'Loss' }}</span>
                    <span class="detail-value">{{ formatCurrency(Math.abs(getProfitValue(purchase.id))) }}</span>
                  </div>
                  <div class="detail-percent"
                    :class="getProfitValue(purchase.id) >= 0 ? 'profit-positive' : 'profit-negative'">
                    {{ getProfitPercent(purchase.id) }}
                  </div>
                </div>

                <div class="purchase-actions">
                  <button @click="startEdit(purchase)" class="btn-ghost">{{ t.edit }}</button>
                  <button @click="deletePurchase(purchase.id)" class="btn-ghost btn-danger">{{ t.delete }}</button>
                </div>
              </template>

              <!-- Edit Mode -->
              <template v-else>
                <div class="edit-header">
                  <h3>{{ t.editPurchase }}</h3>
                  <button @click="cancelEdit" class="btn-ghost btn-sm">×</button>
                </div>
                <div class="edit-form">
                  <div class="input-group">
                    <label class="label">{{ t.date }}</label>
                    <input v-model="editingPurchase.date" type="date" class="input" />
                  </div>
                  <div class="input-group">
                    <label class="label">{{ t.amountChi }}</label>
                    <input v-model="editingPurchase.amount" type="text" inputmode="decimal" pattern="[0-9]*\.?[0-9]*"
                      class="input" />
                  </div>
                  <div class="input-group">
                    <label class="label">{{ t.pricePaid }}</label>
                    <input v-model="editingPurchase.totalPaid" type="text" inputmode="decimal" pattern="[0-9]*\.?[0-9]*"
                      class="input" />
                  </div>
                </div>
                <div class="edit-actions">
                  <button @click="saveEdit(purchase.id)" class="btn-primary">{{ t.saveChanges }}</button>
                  <button @click="cancelEdit" class="btn-ghost">{{ t.cancel }}</button>
                </div>
              </template>
            </div>
          </div>
        </section>
      </main>

      <!-- Footer -->
      <footer class="footer">
        <p>{{ t.footer }}</p>
      </footer>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GoldTracker',

  head() {
    return {
      title: 'Gold Tracker',
      meta: [
        { hid: 'description', name: 'description', content: 'Track your gold investments with ease' },
        { hid: 'viewport', name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover' },
      ],
    };
  },

  data() {
    return {
      // Constants
      TROY_OUNCE_TO_GRAM: 31.1035,
      CHI_TO_OZ: 3.75 / 31.1035,
      CHI_TO_GRAM: 3.75,
      GRAM_TO_OZ: 1 / 31.1035,
      DAMLUNG_TO_OZ: 37.5 / 31.1035,
      LI_TO_GRAM: 3.75 / 100,
      HUN_TO_GRAM: 3.75 / 10,
      LI_TO_OZ: (3.75 / 100) / 31.1035,
      HUN_TO_OZ: (3.75 / 10) / 31.1035,

      // Price state
      currentPrice: 0,
      manualPrice: '',
      priceUnit: 'oz', // 'oz', 'damlung', or 'chi'
      isApiPrice: false,
      isLoading: false,
      lastUpdated: 'No price set',

      // API state
      apiKey: '',
      apiKeyInput: '',
      showApiKey: false,
      showApiSetup: false,
      apiBaseUrl: 'https://www.goldapi.io/api',

      // Calculator state
      calculatorAmount: '1',
      calculatorUnit: 'chi',
      gramAmount: '0',
      liAmount: '0',

      // Purchases state
      purchases: [],
      newPurchase: {
        amount: '',
        totalPaid: '',
        date: new Date().toISOString().split('T')[0],
      },
      editingId: null,
      editingPurchase: null,
      purchaseSortBy: 'date-desc',

      // Cache
      formatCache: new Map(),
      purchaseCache: new Map(),

      // UI state
      toasts: [],
      toastId: 0,
      language: 'en',

      // iOS/Network state
      isOnline: true,
    };
  },

  computed: {
    t() {
      const translations = {
        en: {
          appTitle: 'Gold Tracker',
          exportCSV: 'Export CSV',
          refresh: 'Refresh',
          refreshing: 'Refreshing...',
          currentGoldPrice: 'Current Gold Price',
          live: 'Live',
          manual: 'Manual',
          perTroyOunce: 'per troy ounce',
          perDamlung: 'per Damlung (ដំឡឹង)',
          setCustomPrice: 'Set Custom Price',
          enterPrice: 'Enter price in USD',
          enterPriceOz: 'Enter price per troy ounce',
          enterPriceDamlung: 'Enter price per Damlung',
          enterPriceChi: 'Enter price per Chi',
          equivalent: 'Equivalent',
          apply: 'Apply',
          enableLiveUpdates: 'Enable Live Updates',
          connectToAPI: 'Connect to Gold API for automatic price updates',
          useDemo: 'Use Demo',
          setupAPI: 'Setup API',
          apiKey: 'API Key',
          enterAPIKey: 'Enter your API key',
          getFreeKey: 'Get a free key at',
          saveConnect: 'Save & Connect',
          cancel: 'Cancel',
          liveUpdatesActive: 'Live updates active',
          refreshNow: 'Refresh Now',
          updating: 'Updating...',
          disconnect: 'Disconnect',
          portfolioSummary: 'Portfolio Summary',
          totalInvested: 'Total Invested',
          currentWorth: 'Current Worth',
          totalGain: 'Total Gain',
          totalLoss: 'Total Loss',
          quickCalculator: 'Quick Calculator',
          amount: 'Amount',
          unit: 'Unit',
          estimatedValue: 'Estimated Value',
          gramChiConverter: 'Gram ↔ Chi Converter',
          grams: 'Grams',
          chiConverterInfo: '1 Chi = 3.75 grams',
          liHunChiConverter: 'Li ↔ Hun ↔ Chi Converter',
          liHunChiInfo: '10 Li = 1 Hun • 10 Hun = 1 Chi • 100 Li = 1 Chi',
          priceByUnit: 'Price by Unit',
          addNewPurchase: 'Add New Purchase',
          amountChi: 'Amount (Chi)',
          pricePaid: 'Price Paid (USD)',
          date: 'Date',
          addPurchase: 'Add Purchase',
          myPurchases: 'My Purchases',
          sortBy: 'Sort by',
          newestFirst: 'Newest First',
          oldestFirst: 'Oldest First',
          highestAmount: 'Highest Amount',
          lowestAmount: 'Lowest Amount',
          highestProfit: 'Highest Profit',
          lowestProfit: 'Lowest Profit',
          paid: 'Paid',
          currentWorthLabel: 'Current Worth',
          gain: 'Gain',
          loss: 'Loss',
          edit: 'Edit',
          delete: 'Delete',
          editPurchase: 'Edit Purchase',
          saveChanges: 'Save Changes',
          footer: 'Gold Tracker © 2024',
          li: 'Li (លី)',
          hun: 'Hun (ហុន)',
          chi: 'ជី',
          gram: 'Gram',
          damlung: 'Damlung (ដំឡឹង)',
          troyOz: 'Troy Ounce',
        },
        km: {
          appTitle: 'តាមដានមាស',
          exportCSV: 'នាំចេញ CSV',
          refresh: 'ធ្វើបច្ចុប្បន្នភាព',
          refreshing: 'កំពុងធ្វើបច្ចុប្បន្នភាព...',
          currentGoldPrice: 'តម្លៃមាសបច្ចុប្បន្ន',
          live: 'បន្តផ្ទាល់',
          manual: 'ដោយដៃ',
          perTroyOunce: 'ក្នុងមួយ troy ounce',
          perDamlung: 'ក្នុងមួយដំឡឹង',
          setCustomPrice: 'កំណត់តម្លៃផ្ទាល់ខ្លួន',
          enterPrice: 'បញ្ចូលតម្លៃជាដុល្លារ',
          enterPriceOz: 'បញ្ចូលតម្លៃក្នុងមួយ troy ounce',
          enterPriceDamlung: 'បញ្ចូលតម្លៃក្នុងមួយដំឡឹង',
          enterPriceChi: 'បញ្ចូលតម្លៃក្នុងមួយជី',
          equivalent: 'ស្មើនឹង',
          apply: 'អនុវត្ត',
          enableLiveUpdates: 'បើកការធ្វើបច្ចុប្បន្នភាពផ្ទាល់',
          connectToAPI: 'ភ្ជាប់ទៅ Gold API សម្រាប់ការធ្វើបច្ចុប្បន្នភាពស្វ័យប្រវត្តិ',
          useDemo: 'ប្រើសាកល្បង',
          setupAPI: 'រៀបចំ API',
          apiKey: 'API Key',
          enterAPIKey: 'បញ្ចូល API key របស់អ្នក',
          getFreeKey: 'ទទួលបានកូនសោឥតគិតថ្លៃនៅ',
          saveConnect: 'រក្សាទុក និងភ្ជាប់',
          cancel: 'បោះបង់',
          liveUpdatesActive: 'ការធ្វើបច្ចុប្បន្នភាពផ្ទាល់កំពុងដំណើរការ',
          refreshNow: 'តម្លៃឥឡូវនេះ',
          updating: 'កំពុងធ្វើបច្ចុប្បន្នភាព...',
          disconnect: 'ផ្តាច់',
          portfolioSummary: 'សង្ខេបវិនិយោគ',
          totalInvested: 'វិនិយោគសរុប',
          currentWorth: 'តម្លៃបច្ចុប្បន្ន',
          totalGain: 'ប្រាក់ចំណេញសរុប',
          totalLoss: 'ខាតសរុប',
          quickCalculator: 'ម៉ាស៊ីនគណនារហ័ស',
          amount: 'ចំនួន',
          unit: 'ឯកតា',
          estimatedValue: 'តម្លៃប៉ាន់ស្មាន',
          gramChiConverter: 'ក្រាម ↔ ជី ប្តូរ',
          grams: 'ក្រាម',
          chiConverterInfo: '១ ជី = ៣.៧៥ ក្រាម',
          liHunChiConverter: 'លី ↔ ហុន ↔ ជី ប្តូរ',
          liHunChiInfo: '១០ លី = ១ ហុន • ១០ ហុន = ១ ជី • ១០០ លី = ១ ជី',
          priceByUnit: 'តម្លៃតាមឯកតា',
          addNewPurchase: 'បន្ថែមការទិញថ្មី',
          amountChi: 'ចំនួន (ជី)',
          pricePaid: 'តម្លៃបានបង់ (USD)',
          date: 'កាលបរិច្ឆេទ',
          addPurchase: 'បន្ថែមការទិញ',
          myPurchases: 'ការទិញរបស់ខ្ញុំ',
          sortBy: 'តម្រៀបតាម',
          newestFirst: 'ថ្មីបំផុតមុន',
          oldestFirst: 'ចាស់បំផុតមុន',
          highestAmount: 'ចំនួនខ្ពស់បំផុត',
          lowestAmount: 'ចំនួនទាបបំផុត',
          highestProfit: 'ប្រាក់ចំណេញខ្ពស់បំផុត',
          lowestProfit: 'ប្រាក់ចំណេញទាបបំផុត',
          paid: 'បានបង់',
          currentWorthLabel: 'តម្លៃបច្ចុប្បន្ន',
          gain: 'ប្រាក់ចំណេញ',
          loss: 'ខាត',
          edit: 'កែសម្រួល',
          delete: 'លុប',
          editPurchase: 'កែសម្រួលការទិញ',
          saveChanges: 'រក្សាទុកការផ្លាស់ប្តូរ',
          footer: 'តាមដានមាស © ២០២៤',
          li: 'លី',
          hun: 'ហុន',
          chi: 'ជី',
          gram: 'ក្រាម',
          damlung: 'ដំឡឹង',
          troyOz: 'Troy Ounce',
        },
      };
      return translations[this.language];
    },

    totals() {
      const invested = this.purchases.reduce((sum, p) => sum + parseFloat(p.totalPaid), 0);
      let currentValue = 0;
      for (let p of this.purchases) {
        currentValue += parseFloat(p.amount) * this.CHI_TO_OZ * this.currentPrice;
      }
      const profit = currentValue - invested;
      return {
        invested,
        currentValue,
        profit,
        profitPercent: invested > 0 ? (profit / invested) * 100 : 0,
      };
    },

    sortedPurchases() {
      const sorted = [...this.purchases];

      switch (this.purchaseSortBy) {
        case 'date-asc':
          return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
        case 'date-desc':
          return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
        case 'amount-asc':
          return sorted.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
        case 'amount-desc':
          return sorted.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
        case 'profit-asc':
          return sorted.sort((a, b) => this.getProfitValue(a.id) - this.getProfitValue(b.id));
        case 'profit-desc':
          return sorted.sort((a, b) => this.getProfitValue(b.id) - this.getProfitValue(a.id));
        default:
          return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
    },
  },

  methods: {
    // ==================== UTILITY METHODS ====================
    showToast(message, type = 'info') {
      const id = this.toastId++;
      this.toasts.push({ id, message, type });
      setTimeout(() => {
        this.toasts = this.toasts.filter((t) => t.id !== id);
      }, 3000);
    },

    formatCurrency(value) {
      if (!value) return '$0.00';
      const rounded = Math.round(value * 100) / 100;
      const key = rounded.toFixed(2);
      if (this.formatCache.has(key)) return this.formatCache.get(key);
      const formatted = `$${rounded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      this.formatCache.set(key, formatted);
      if (this.formatCache.size > 100) {
        const first = this.formatCache.keys().next().value;
        this.formatCache.delete(first);
      }
      return formatted;
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    // ==================== SAFE LOCALSTORAGE ====================
    safeLocalStorage(action, key, value = null) {
      if (!process.client) return null;
      try {
        if (action === 'get') {
          return localStorage.getItem(key);
        } else if (action === 'set') {
          localStorage.setItem(key, value);
          return true;
        } else if (action === 'remove') {
          localStorage.removeItem(key);
          return true;
        }
      } catch (e) {
        console.warn(`localStorage ${action} failed:`, e);
        if (action === 'set' && e.name === 'QuotaExceededError') {
          this.showToast('Storage full', 'error');
        }
        return null;
      }
    },

    // ==================== CONVERSION METHODS ====================
    gramToChi(grams) {
      if (!grams || grams <= 0) return 0;
      return grams / this.CHI_TO_GRAM;
    },

    liToHun(li) {
      if (!li || li <= 0) return 0;
      return li / 10;
    },

    liToChi(li) {
      if (!li || li <= 0) return 0;
      return li / 100;
    },

    calculateValue(amount, unit, price) {
      if (!amount || amount <= 0 || !price) return 0;
      let ozAmount;
      switch (unit) {
        case 'li':
          ozAmount = amount * this.LI_TO_OZ;
          break;
        case 'hun':
          ozAmount = amount * this.HUN_TO_OZ;
          break;
        case 'chi':
          ozAmount = amount * this.CHI_TO_OZ;
          break;
        case 'gram':
          ozAmount = amount * this.GRAM_TO_OZ;
          break;
        case 'damlung':
          ozAmount = amount * this.DAMLUNG_TO_OZ;
          break;
        default:
          ozAmount = amount;
      }
      return ozAmount * price;
    },

    // ==================== PRICE METHODS ====================
    applyCustomPrice() {
      const price = parseFloat(this.manualPrice);
      if (!price || price <= 0 || isNaN(price)) {
        this.showToast('Enter a valid price', 'error');
        return;
      }

      // Convert to troy ounce price (our base unit)
      if (this.priceUnit === 'damlung') {
        this.currentPrice = price / this.DAMLUNG_TO_OZ;
      } else if (this.priceUnit === 'chi') {
        this.currentPrice = price / this.CHI_TO_OZ;
      } else {
        this.currentPrice = price;
      }

      this.isApiPrice = false;
      const unitLabel = this.priceUnit === 'oz' ? 'per oz' : this.priceUnit === 'damlung' ? 'per damlung' : 'per chi';
      this.lastUpdated = `just now (manual - ${unitLabel})`;
      this.savePrice();
      this.purchaseCache.clear();
      this.showToast('Price updated', 'success');
    },

    toggleApiSetup() {
      this.showApiSetup = !this.showApiSetup;
      if (!this.showApiSetup) {
        this.apiKeyInput = '';
      }
    },

    useDemoApi() {
      this.apiKey = 'goldapi-3yrz5zhtl5zcyqg4-io';
      this.safeLocalStorage('set', 'apiKey', this.apiKey);
      this.showToast('Demo API key activated', 'success');
      this.fetchMetalPrice(true);
    },

    toggleApiKeyVisibility() {
      this.showApiKey = !this.showApiKey;
    },

    saveApiKey() {
      if (!this.apiKeyInput.trim()) {
        this.showToast('API key cannot be empty', 'error');
        return;
      }
      this.apiKey = this.apiKeyInput.trim();
      this.safeLocalStorage('set', 'apiKey', this.apiKey);
      this.apiKeyInput = '';
      this.showApiKey = false;
      this.showApiSetup = false;
      this.showToast('API key saved', 'success');
      this.fetchMetalPrice(true);
    },

    removeApiKey() {
      if (confirm('Disable API and use manual prices?')) {
        this.apiKey = '';
        this.isApiPrice = false;
        this.safeLocalStorage('remove', 'apiKey');
        this.showToast('API disabled', 'info');
      }
    },

    // ==================== PURCHASE METHODS ====================
    getProfitValue(purchaseId) {
      const purchase = this.purchases.find((p) => p.id === purchaseId);
      if (!purchase) return 0;
      const ozEquivalent = parseFloat(purchase.amount) * this.CHI_TO_OZ;
      const currentValue = ozEquivalent * this.currentPrice;
      return currentValue - parseFloat(purchase.totalPaid);
    },

    getProfitPercent(purchaseId) {
      const purchase = this.purchases.find((p) => p.id === purchaseId);
      if (!purchase) return '0.00%';
      const profit = this.getProfitValue(purchaseId);
      const percentage = (profit / parseFloat(purchase.totalPaid)) * 100;
      const sign = profit >= 0 ? '+' : '-';
      return `${sign}${Math.abs(percentage).toFixed(2)}%`;
    },

    getCurrentDate() {
      return new Date().toISOString().split('T')[0];
    },

    canAddPurchase() {
      const amount = parseFloat(this.newPurchase.amount);
      const totalPaid = parseFloat(this.newPurchase.totalPaid);
      return amount > 0 && totalPaid > 0 && this.newPurchase.date;
    },

    addPurchase() {
      if (!this.canAddPurchase()) return;
      this.purchases.push({
        id: Date.now(),
        amount: parseFloat(this.newPurchase.amount),
        totalPaid: parseFloat(this.newPurchase.totalPaid),
        date: this.newPurchase.date,
      });
      this.savePurchases();
      this.purchaseCache.clear();
      this.newPurchase = { amount: '', totalPaid: '', date: this.getCurrentDate() };
      this.showToast('Purchase added', 'success');
    },

    startEdit(purchase) {
      this.editingId = purchase.id;
      this.editingPurchase = { ...purchase };
    },

    saveEdit(purchaseId) {
      const index = this.purchases.findIndex((p) => p.id === purchaseId);
      const amount = parseFloat(this.editingPurchase.amount);
      const totalPaid = parseFloat(this.editingPurchase.totalPaid);

      if (index !== -1 && amount > 0 && totalPaid > 0) {
        this.purchases[index] = {
          ...this.purchases[index],
          amount: amount,
          totalPaid: totalPaid,
          date: this.editingPurchase.date
        };
        this.savePurchases();
        this.purchaseCache.clear();
        this.editingId = null;
        this.showToast('Purchase updated', 'success');
      }
    },

    cancelEdit() {
      this.editingId = null;
      this.editingPurchase = null;
    },

    deletePurchase(purchaseId) {
      if (confirm('Delete this purchase?')) {
        this.purchases = this.purchases.filter((p) => p.id !== purchaseId);
        this.savePurchases();
        this.purchaseCache.clear();
        this.showToast('Purchase deleted', 'info');
      }
    },

    // ==================== STORAGE METHODS ====================
    savePrice() {
      this.safeLocalStorage('set', 'goldPrice', this.currentPrice);
      this.safeLocalStorage('set', 'isApiPrice', this.isApiPrice);
    },

    savePurchases() {
      this.safeLocalStorage('set', 'purchases', JSON.stringify(this.purchases));
    },

    loadPurchases() {
      if (!process.client) return;
      const saved = this.safeLocalStorage('get', 'purchases');
      if (saved) {
        try {
          this.purchases = JSON.parse(saved);
        } catch (e) {
          console.error('Failed to load purchases');
        }
      }
    },

    loadSavedData() {
      if (!process.client) return;
      try {
        const saved = this.safeLocalStorage('get', 'goldPrice');
        if (saved) {
          this.currentPrice = parseFloat(saved);
          const wasApi = this.safeLocalStorage('get', 'isApiPrice') === 'true';
          this.isApiPrice = wasApi;
        }

        const savedApiKey = this.safeLocalStorage('get', 'apiKey');
        if (savedApiKey) {
          this.apiKey = savedApiKey;
        }

        this.loadPurchases();
      } catch (e) {
        console.error('Error loading saved data');
      }
    },

    // ==================== EXPORT METHODS ====================
    exportData(format) {
      try {
        let content, filename, type;

        if (format === 'json') {
          content = JSON.stringify(this.purchases, null, 2);
          filename = `gold-tracker-${new Date().toISOString().split('T')[0]}.json`;
          type = 'application/json';
        } else if (format === 'csv') {
          const headers = ['Date', 'Amount (Chi)', 'Price Per Chi', 'Total Paid', 'Current Value', 'Gain/Loss', 'Change %', 'Status'];

          const rows = this.purchases.map((p) => {
            const profit = this.getProfitValue(p.id);
            const status = profit >= 0 ? 'GAIN' : 'LOSS';

            return [
              this.formatDate(p.date),
              p.amount.toFixed(2),
              this.formatCurrency(p.totalPaid / p.amount),
              this.formatCurrency(p.totalPaid),
              this.formatCurrency(p.amount * this.CHI_TO_OZ * this.currentPrice),
              this.formatCurrency(Math.abs(profit)),
              this.getProfitPercent(p.id),
              status
            ];
          });

          const summaryRow = [
            'TOTAL',
            this.purchases.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2),
            '-',
            this.formatCurrency(this.totals.invested),
            this.formatCurrency(this.totals.currentValue),
            this.formatCurrency(Math.abs(this.totals.profit)),
            `${(this.totals.profit >= 0 ? '+' : '-')}${Math.abs(this.totals.profitPercent).toFixed(2)}%`,
            this.totals.profit >= 0 ? 'GAIN' : 'LOSS'
          ];

          const escapeCSV = (field) => {
            if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
              return `"${field.replace(/"/g, '""')}"`;
            }
            return field;
          };

          const headerRow = headers.map(escapeCSV).join(',');
          const dataRows = rows.map(row => row.map(escapeCSV).join(',')).join('\n');
          const summary = summaryRow.map(escapeCSV).join(',');

          content = `${headerRow}\n${dataRows}\n\n${summary}`;
          filename = `gold-tracker-${new Date().toISOString().split('T')[0]}.csv`;
          type = 'text/csv;charset=utf-8';
        }

        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showToast(`Exported ${format.toUpperCase()}`, 'success');
      } catch (error) {
        this.showToast('Export failed', 'error');
      }
    },

    // ==================== API METHODS ====================
    handleRefresh() {
      if (!this.isOnline) {
        this.showToast('No internet connection', 'error');
        return;
      }

      if (!this.apiKey) {
        this.showToast('API key not configured', 'info');
        return;
      }

      this.fetchMetalPrice(true);
    },

    async fetchMetalPrice(userRequested = false, retryCount = 0) {
      if (!this.apiKey) {
        this.showToast('API key not configured', 'info');
        return;
      }

      if (!this.isOnline) {
        this.showToast('No internet connection', 'error');
        return;
      }

      this.isLoading = true;
      const maxRetries = 2;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(`${this.apiBaseUrl}/XAU/USD`, {
          method: 'GET',
          headers: {
            'x-access-token': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          mode: 'cors',
          cache: 'no-cache',
          credentials: 'omit',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid content type');
        }

        const data = await response.json();

        if (data && typeof data.price === 'number' && data.price > 0) {
          this.currentPrice = data.price;
          this.isApiPrice = true;
          this.lastUpdated = 'just now';
          this.savePrice();
          this.purchaseCache.clear();
          this.showToast('Price updated from API', 'success');
        } else {
          throw new Error('Invalid price data');
        }
      } catch (error) {
        clearTimeout(timeoutId);

        // Retry logic for iOS
        if (retryCount < maxRetries && error.name !== 'AbortError') {
          console.log(`Retrying API call (${retryCount + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.fetchMetalPrice(userRequested, retryCount + 1);
        }

        let errorMessage = 'Failed to fetch price';

        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
          errorMessage = 'Network error - check connection';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'API blocked by browser';
        } else if (error.message.includes('HTTP')) {
          errorMessage = `API error: ${error.message}`;
        }

        console.error('API Error:', {
          error: error,
          message: error.message,
          name: error.name,
          retries: retryCount,
          userAgent: navigator.userAgent,
        });

        this.showToast(errorMessage, 'error');
      } finally {
        this.isLoading = false;
      }
    },

    // ==================== LANGUAGE ====================
    toggleLanguage() {
      this.language = this.language === 'en' ? 'km' : 'en';
      if (process.client) {
        this.safeLocalStorage('set', 'language', this.language);
      }
    },

    // ==================== NETWORK HANDLERS ====================
    handleOnline() {
      this.isOnline = true;
      this.showToast('Connection restored', 'success');
      if (this.apiKey && this.isApiPrice) {
        setTimeout(() => this.fetchMetalPrice(false), 1000);
      }
    },

    handleOffline() {
      this.isOnline = false;
      this.showToast('No internet connection', 'error');
    },

    // ==================== iOS COMPATIBILITY ====================
    checkiOSCompatibility() {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      if (isIOS || isSafari) {
        console.log('iOS/Safari detected - using enhanced compatibility mode');

        // Check if in Private Browsing
        try {
          localStorage.setItem('test', 'test');
          localStorage.removeItem('test');
        } catch (e) {
          this.showToast('Private mode detected - some features limited', 'info');
        }
      }
    },
  },

  mounted() {
    if (process.client) {
      // Load saved language
      const savedLanguage = this.safeLocalStorage('get', 'language');
      if (savedLanguage) {
        this.language = savedLanguage;
      }

      this.loadSavedData();
      this.checkiOSCompatibility();

      // Network status monitoring
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      this.isOnline = navigator.onLine;
    }
  },

  beforeDestroy() {
    if (process.client) {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
  },
};
</script>

<style scoped>
/* ============================================
   RESET & BASE
   ============================================ */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  height: -webkit-fill-available;
}

html,
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro', 'Segoe UI', system-ui, sans-serif;
  background: #fafafa;
  color: #1a1a1a;
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ============================================
   LAYOUT
   ============================================ */
.app {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background: #fafafa;
}

.container {
  max-width: 100%;
  margin: 0 auto;
  padding: 0;
}

/* iOS Safe Areas */
.header {
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
  padding: 24px 64px;
  padding-top: max(24px, env(safe-area-inset-top));
  padding-left: max(64px, env(safe-area-inset-left));
  padding-right: max(64px, env(safe-area-inset-right));
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: -0.01em;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.main {
  padding: 48px 64px;
  padding-left: max(64px, env(safe-area-inset-left));
  padding-right: max(64px, env(safe-area-inset-right));
  max-width: 1400px;
  margin: 0 auto;
  -webkit-overflow-scrolling: touch;
}

.footer {
  background: #fff;
  border-top: 1px solid #e5e5e5;
  padding: 32px 64px;
  padding-bottom: max(32px, env(safe-area-inset-bottom));
  padding-left: max(64px, env(safe-area-inset-left));
  padding-right: max(64px, env(safe-area-inset-right));
  text-align: center;
  color: #737373;
  font-size: 14px;
}

/* ============================================
   OFFLINE BANNER
   ============================================ */
.offline-banner {
  background: #fef3c7;
  color: #92400e;
  padding: 12px 16px;
  padding-left: max(16px, env(safe-area-inset-left));
  padding-right: max(16px, env(safe-area-inset-right));
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 1px solid #fde68a;
  position: sticky;
  top: 0;
  z-index: 99;
}

/* ============================================
   SECTIONS
   ============================================ */
.section {
  margin-bottom: 64px;
}

.section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 24px;
  letter-spacing: -0.01em;
}

/* ============================================
   CARDS
   ============================================ */
.card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 32px;
}

.card-primary {
  border: 1px solid #d4d4d4;
}

/* ============================================
   PRICE DISPLAY
   ============================================ */
.price-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: #f5f5f5;
  color: #737373;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-live {
  background: #1a1a1a;
  color: #fff;
}

.price-display {
  text-align: center;
  padding: 32px 0;
  border-bottom: 1px solid #f5f5f5;
  margin-bottom: 32px;
}

.price-main {
  font-size: 48px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.02em;
  margin-bottom: 8px;
}

.price-sub {
  font-size: 14px;
  color: #737373;
  font-weight: 500;
}

.price-damlung {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 20px;
  background: #fafafa;
  border-radius: 6px;
  margin-bottom: 24px;
  text-align: center;
}

.damlung-value {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
}

.damlung-label {
  font-size: 13px;
  color: #737373;
  font-weight: 500;
}

.price-time {
  font-size: 13px;
  color: #a3a3a3;
  text-align: center;
  margin-bottom: 32px;
}

/* ============================================
   FORMS & INPUTS
   ============================================ */
.input-group {
  margin-bottom: 24px;
}

.input-group:last-child {
  margin-bottom: 0;
}

.label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #525252;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.label-inline {
  font-size: 13px;
  font-weight: 500;
  color: #525252;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Price Unit Toggle */
.price-unit-toggle {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  background: #f5f5f5;
  padding: 4px;
  border-radius: 6px;
  margin-bottom: 12px;
}

.unit-btn {
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #737373;
  cursor: pointer;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
}

.unit-btn.active {
  background: #fff;
  color: #1a1a1a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.unit-btn:hover:not(.active) {
  color: #1a1a1a;
}

/* Price Preview */
.price-preview {
  margin-top: 12px;
  padding: 16px;
  background: #fafafa;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.preview-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: center;
  padding: 8px;
  background: #fff;
  border-radius: 4px;
}

.preview-label {
  color: #737373;
  font-weight: 500;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.preview-value {
  color: #1a1a1a;
  font-weight: 700;
  font-size: 14px;
}

.input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  font-size: 16px;
  /* iOS zoom prevention */
  font-weight: 500;
  border: 1px solid #d4d4d4;
  border-radius: 6px;
  background: #fff;
  color: #1a1a1a;
  transition: all 0.2s;
  -webkit-appearance: none;
}

.input:focus {
  outline: none;
  border-color: #1a1a1a;
}

.input::placeholder {
  color: #a3a3a3;
}

select.input {
  background-color: #fff;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23525252' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  padding-right: 40px;
  cursor: pointer;
  border: 2px solid #d4d4d4;
}

select.input:focus {
  border-color: #1a1a1a;
  outline: none;
}

select.input option {
  padding: 12px;
  background: #fff;
  color: #1a1a1a;
}

.input-sm {
  height: 36px;
  font-size: 16px;
  /* iOS zoom prevention */
}

select.input-sm {
  background-position: right 12px center;
  padding-right: 36px;
}

.input-row {
  display: flex;
  gap: 12px;
}

/* ============================================
   BUTTONS
   ============================================ */
.btn-primary,
.btn-secondary,
.btn-ghost {
  height: 44px;
  padding: 0 24px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  white-space: nowrap;
  -webkit-appearance: none;
  -webkit-tap-highlight-color: transparent;
}

.btn-primary {
  background: #1a1a1a;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #404040;
}

.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f5f5f5;
  color: #1a1a1a;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e5e5;
}

.btn-secondary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-ghost {
  background: transparent;
  color: #1a1a1a;
  border: 1px solid #e5e5e5;
}

.btn-ghost:hover:not(:disabled) {
  background: #fafafa;
  border-color: #d4d4d4;
}

.btn-ghost:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-danger {
  color: #dc2626;
  border-color: #fecaca;
}

.btn-danger:hover {
  background: #fef2f2;
  border-color: #fca5a5;
}

.btn-full {
  width: 100%;
  margin-top: 24px;
}

.btn-sm {
  height: 28px;
  padding: 0;
  width: 28px;
  font-size: 16px;
}

.btn-lang {
  font-size: 13px;
  font-weight: 600;
  padding: 0 16px;
  min-width: 50px;
}

.button-row {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

/* ============================================
   API SECTION
   ============================================ */
.api-section {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid #f5f5f5;
}

.api-prompt {
  background: #fafafa;
  padding: 24px;
  border-radius: 6px;
  border: 1px solid #e5e5e5;
  margin-bottom: 16px;
}

.prompt-content {
  margin-bottom: 20px;
}

.prompt-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.prompt-text {
  font-size: 13px;
  color: #737373;
}

.prompt-actions {
  display: flex;
  gap: 12px;
}

.api-config {
  background: #fafafa;
  padding: 24px;
  border-radius: 6px;
  border: 1px solid #e5e5e5;
}

.help-text {
  font-size: 13px;
  color: #737373;
  margin-top: 8px;
}

.help-text a {
  color: #1a1a1a;
  text-decoration: none;
  font-weight: 500;
}

.help-text a:hover {
  text-decoration: underline;
}

.api-active {
  background: #fafafa;
  padding: 24px;
  border-radius: 6px;
  border: 1px solid #e5e5e5;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #1a1a1a;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }
}

.status-text {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
}

/* ============================================
   STATS
   ============================================ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

@media (min-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
}

.stat-card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  font-weight: 500;
  color: #737373;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.02em;
}

.stat-percent {
  font-size: 14px;
  font-weight: 600;
  margin-top: 8px;
}

.stat-gain {
  border-color: #16a34a;
  background: #f0fdf4;
}

.stat-gain .stat-value,
.stat-gain .stat-percent {
  color: #16a34a;
}

.stat-loss {
  border-color: #dc2626;
  background: #fef2f2;
}

.stat-loss .stat-value,
.stat-loss .stat-percent {
  color: #dc2626;
}

/* ============================================
   CALCULATOR
   ============================================ */
.calc-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.calc-result {
  text-align: center;
  padding: 32px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #e5e5e5;
}

.result-label {
  font-size: 12px;
  font-weight: 500;
  color: #737373;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.result-value {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.02em;
}

/* ============================================
   CONVERTER
   ============================================ */
.converter-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: end;
  margin-bottom: 24px;
}

.converter-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.converter-equals {
  font-size: 20px;
  color: #a3a3a3;
  padding-bottom: 10px;
}

.converter-result {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  background: #fafafa;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  color: #1a1a1a;
}

.converter-info {
  text-align: center;
  font-size: 13px;
  color: #737373;
  margin-bottom: 24px;
  font-weight: 500;
}

/* ============================================
   UNITS GRID
   ============================================ */
.units-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

@media (min-width: 1024px) {
  .units-grid {
    grid-template-columns: repeat(6, 1fr);
    gap: 20px;
  }
}

.unit-card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: all 0.2s;
}

.unit-card:hover {
  border-color: #1a1a1a;
}

.unit-name {
  font-size: 12px;
  font-weight: 500;
  color: #737373;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.unit-price {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 4px;
  letter-spacing: -0.01em;
}

.unit-weight {
  font-size: 12px;
  color: #a3a3a3;
}

/* ============================================
   PURCHASE FORM
   ============================================ */
.purchase-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

@media (min-width: 1024px) {
  .purchase-form {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
}

/* ============================================
   PURCHASES LIST
   ============================================ */
.purchases-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
}

.sort-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.purchases-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  -webkit-overflow-scrolling: touch;
}

@media (min-width: 768px) {
  .purchases-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

@media (min-width: 1024px) {
  .purchases-list {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
}

@media (min-width: 1400px) {
  .purchases-list {
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
}

.purchase-card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.purchase-card:hover {
  border-color: #d4d4d4;
}

.purchase-card.editing {
  border-color: #1a1a1a;
}

.purchase-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e5e5e5;
}

.purchase-date {
  font-size: 12px;
  font-weight: 500;
  color: #737373;
}

.purchase-amount {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.purchase-details {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-bottom: 1px solid #f5f5f5;
  flex-grow: 1;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 11px;
  font-weight: 500;
  color: #737373;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.detail-profit {
  padding-top: 10px;
  border-top: 1px solid #f5f5f5;
}

.detail-percent {
  font-size: 12px;
  font-weight: 600;
  text-align: right;
  margin-top: 2px;
}

.profit-positive .detail-value,
.profit-positive.detail-percent {
  color: #16a34a;
  font-weight: 700;
}

.profit-negative .detail-value,
.profit-negative.detail-percent {
  color: #dc2626;
  font-weight: 700;
}

.purchase-actions {
  padding: 12px 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.purchase-actions .btn-ghost {
  height: 36px;
  padding: 0 16px;
  font-size: 13px;
  flex: 1;
  min-width: 80px;
}

/* Edit Mode */
.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e5e5e5;
}

.edit-header h3 {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
}

.edit-form {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  border-bottom: 1px solid #f5f5f5;
}

.edit-actions {
  padding: 12px 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.edit-actions .btn-primary,
.edit-actions .btn-ghost {
  height: 36px;
  padding: 0 16px;
  font-size: 13px;
  flex: 1;
  min-width: 100px;
}

/* ============================================
   TOAST NOTIFICATIONS
   ============================================ */
.toast-container {
  position: fixed;
  top: max(20px, env(safe-area-inset-top));
  right: max(20px, env(safe-area-inset-right));
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toast {
  background: #1a1a1a;
  color: #fff;
  padding: 16px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 250px;
}

.toast-success {
  background: #1a1a1a;
}

.toast-error {
  background: #525252;
}

.toast-icon {
  font-size: 16px;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ============================================
   TRANSITIONS
   ============================================ */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ============================================
   RESPONSIVE - MOBILE
   ============================================ */
@media (max-width: 768px) {
  .app {
    background: #fff;
  }

  .header {
    padding: 20px 24px;
    padding-top: max(20px, env(safe-area-inset-top));
    padding-left: max(24px, env(safe-area-inset-left));
    padding-right: max(24px, env(safe-area-inset-right));
    flex-wrap: wrap;
    border-radius: 0;
  }

  .app-title {
    font-size: 18px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .main {
    padding: 32px 24px;
    padding-left: max(24px, env(safe-area-inset-left));
    padding-right: max(24px, env(safe-area-inset-right));
  }

  .section {
    margin-bottom: 48px;
  }

  .section:has(.purchases-list) {
    margin-bottom: 32px;
  }

  .section-title {
    font-size: 14px;
    margin-bottom: 16px;
  }

  .card {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  .card-primary {
    border-left: none;
    border-right: none;
  }

  .price-main {
    font-size: 40px;
  }

  .damlung-value {
    font-size: 20px;
  }

  .price-unit-toggle {
    gap: 4px;
  }

  .unit-btn {
    font-size: 11px;
    padding: 8px 8px;
  }

  .price-preview {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .preview-item {
    flex-direction: row;
    justify-content: space-between;
    text-align: left;
  }

  .preview-label {
    font-size: 12px;
  }

  .preview-value {
    font-size: 13px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stat-card {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  .calc-inputs,
  .purchase-form,
  .edit-form {
    grid-template-columns: 1fr;
  }

  .converter-row,
  .converter-grid {
    grid-template-columns: 1fr;
  }

  .converter-equals {
    text-align: center;
    padding: 8px 0;
  }

  .units-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .unit-card {
    border-radius: 0;
  }

  .purchases-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    margin-bottom: 12px;
  }

  .sort-control {
    width: 100%;
  }

  .purchases-list {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .purchase-card {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  .purchase-header {
    padding: 8px 12px;
  }

  .purchase-date {
    font-size: 11px;
  }

  .purchase-amount {
    font-size: 13px;
  }

  .purchase-details {
    padding: 10px 12px;
    gap: 6px;
  }

  .detail-label {
    font-size: 10px;
  }

  .detail-value {
    font-size: 13px;
  }

  .detail-profit {
    padding-top: 6px;
  }

  .detail-percent {
    font-size: 11px;
    margin-top: 0;
  }

  .edit-form {
    grid-template-columns: 1fr;
    padding: 10px 12px;
    gap: 10px;
  }

  .edit-form .input-group {
    margin-bottom: 0;
  }

  .purchase-actions,
  .edit-actions {
    flex-direction: column;
    padding: 8px 12px;
    gap: 6px;
  }

  .purchase-actions .btn-ghost,
  .edit-actions .btn-primary,
  .edit-actions .btn-ghost {
    width: 100%;
    flex: none;
    height: 32px;
    font-size: 12px;
  }

  .toast-container {
    left: max(20px, env(safe-area-inset-left));
    right: max(20px, env(safe-area-inset-right));
  }

  .toast {
    min-width: auto;
  }

  .footer {
    border-radius: 0;
    padding-left: max(24px, env(safe-area-inset-left));
    padding-right: max(24px, env(safe-area-inset-right));
  }
}

@media (max-width: 480px) {
  .header {
    padding: 16px 20px;
    padding-top: max(16px, env(safe-area-inset-top));
    padding-left: max(20px, env(safe-area-inset-left));
    padding-right: max(20px, env(safe-area-inset-right));
    border-radius: 0;
  }

  .main {
    padding: 24px 20px;
    padding-left: max(20px, env(safe-area-inset-left));
    padding-right: max(20px, env(safe-area-inset-right));
  }

  .card {
    padding: 24px;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  .price-main {
    font-size: 36px;
  }

  .units-grid {
    grid-template-columns: 1fr;
  }

  /* Extra compact purchase cards */
  .purchase-header {
    padding: 6px 12px;
  }

  .purchase-date {
    font-size: 10px;
  }

  .purchase-amount {
    font-size: 12px;
  }

  .purchase-details {
    padding: 8px 12px;
    gap: 5px;
  }

  .detail-label {
    font-size: 9px;
  }

  .detail-value {
    font-size: 12px;
  }

  .detail-percent {
    font-size: 10px;
  }

  .detail-profit {
    padding-top: 5px;
  }

  .purchase-actions,
  .edit-actions {
    padding: 6px 12px;
    gap: 5px;
  }

  .purchase-actions .btn-ghost,
  .edit-actions .btn-primary,
  .edit-actions .btn-ghost {
    height: 30px;
    font-size: 11px;
  }

  .edit-header {
    padding: 6px 12px;
  }

  .edit-header h3 {
    font-size: 12px;
  }

  .edit-form {
    padding: 8px 12px;
    gap: 8px;
  }

  .footer {
    border-radius: 0;
    padding-left: max(20px, env(safe-area-inset-left));
    padding-right: max(20px, env(safe-area-inset-right));
  }
}
</style>