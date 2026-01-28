<!-- pages/index.vue - GOLD TRACKER (IMPROVED UI) -->

<template>
  <div class="app">
    <!-- Toast Notifications -->
    <div class="toast-container">
      <Transition-group name="toast">
        <div v-for="toast in toasts" :key="toast.id" :class="['toast', `toast-${toast.type}`]">
          <span class="toast-icon">{{ toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ' }}</span>
          {{ toast.message }}
        </div>
      </Transition-group>
    </div>

    <!-- macOS Style Window -->
    <div class="window">
      <!-- Title Bar -->
      <div class="title-bar">
        <div class="traffic-lights">
          <div class="light red"></div>
          <div class="light yellow"></div>
          <div class="light green"></div>
        </div>
        <div class="title">Gold Tracker</div>
        <div class="title-buttons">
          <button v-if="purchases.length > 0" @click="exportData('csv')" class="title-btn" title="Export CSV">
            <span class="btn-text">Export</span>
            <span class="btn-icon">⬇</span>
          </button>
          <button v-if="apiKey && goldPrice > 0" @click="handleRefresh" :disabled="loading" class="title-btn"
            title="Refresh price">
            <span class="btn-text">Refresh</span>
            <span class="refresh-icon" :class="{ spinning: loading }">↻</span>
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="window-content">
        <main class="content">
          <!-- Hero Card - Price Display -->
          <section class="hero-section">
            <div class="hero-card">
              <div class="price-header">
                <h1>Current Gold Price</h1>
                <span class="price-source" :class="{ api: isApiPrice }">
                  {{ isApiPrice ? '📡 Live' : '✋ Manual' }}
                </span>
              </div>

              <!-- Main Price Display -->
              <div class="price-display">
                <div class="price-main">
                  <div class="price-value">{{ formatCurrencyDisplay(currentPrice) }}</div>
                  <div class="price-unit">per troy ounce</div>
                </div>

                <div class="price-damlung">
                  <span class="damlung-value">{{ formatCurrencyDisplay(currentPrice * DAMLUNG_TO_OZ) }}</span>
                  <span class="damlung-label">per Damlung (ដំឡឹង)</span>
                </div>

                <div class="price-timestamp">{{ lastUpdated }}</div>
              </div>

              <!-- Manual Price Input -->
              <div class="price-input-card">
                <label class="input-label">Set Custom Price</label>
                <div class="input-row">
                  <input v-model.number="manualPrice" type="number" step="0.01" placeholder="Enter price in USD"
                    class="price-input" inputmode="decimal" @keyup.enter="applyCustomPrice">
                  <button @click="applyCustomPrice" class="btn-apply">Apply</button>
                </div>
              </div>

              <!-- API Configuration -->
              <div class="api-section">
                <div v-if="!apiKey || apiKey === 'goldapi-3yrz5zhtl5zcyqg4-io'" class="api-prompt">
                  <div class="prompt-icon">💡</div>
                  <div class="prompt-content">
                    <div class="prompt-title">Enable Live Updates</div>
                    <div class="prompt-text">Connect to Gold API for automatic price updates</div>
                  </div>
                  <div class="prompt-actions">
                    <button @click="useDemoApi" class="btn-demo">Use Demo</button>
                    <button @click="toggleApiSetup" class="btn-setup">Setup</button>
                  </div>
                </div>

                <Transition name="expand">
                  <div v-if="showApiSetup" class="api-config">
                    <label class="input-label">API Key</label>
                    <div class="input-row">
                      <input v-model="apiKeyInput" :type="showApiKey ? 'text' : 'password'"
                        placeholder="Enter your API key" class="api-input">
                      <button @click="toggleApiKeyVisibility" class="btn-toggle">
                        {{ showApiKey ? '👁️' : '👁️‍🗨️' }}
                      </button>
                    </div>
                    <div class="api-help">
                      Get a free key at <a href="https://www.goldapi.io" target="_blank">goldapi.io</a>
                    </div>
                    <div class="button-row">
                      <button @click="saveApiKey" class="btn-primary">Save & Connect</button>
                      <button @click="toggleApiSetup" class="btn-secondary">Cancel</button>
                    </div>
                  </div>
                </Transition>

                <div v-if="isApiPrice" class="api-active">
                  <div class="active-indicator">
                    <span class="status-dot"></span>
                    <span class="status-text">Live updates active</span>
                  </div>
                  <div class="button-row-small">
                    <button @click="handleRefresh" :disabled="loading" class="btn-small">
                      {{ loading ? 'Updating...' : 'Refresh Now' }}
                    </button>
                    <button @click="removeApiKey" class="btn-small-outline">Disconnect</button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Portfolio Stats -->
          <section v-if="purchases.length > 0" class="stats-section">
            <h2 class="section-title">Your Portfolio</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Total Invested</div>
                <div class="stat-value">{{ memoizedTotalInvested }}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Current Worth</div>
                <div class="stat-value">{{ memoizedCurrentValue }}</div>
              </div>
            </div>

            <div class="profit-card" :class="memoizedProfitLoss >= 0 ? 'gain' : 'loss'">
              <div class="profit-icon">{{ memoizedProfitLoss >= 0 ? '📈' : '📉' }}</div>
              <div class="profit-content">
                <div class="profit-label">{{ memoizedProfitLoss >= 0 ? 'Total Gain' : 'Total Loss' }}</div>
                <div class="profit-amount">{{ memoizedProfitLossDisplay }}</div>
                <div class="profit-percent">{{ memoizedProfitChangePercent }}</div>
              </div>
            </div>
          </section>

          <!-- Quick Calculator -->
          <section class="calculator-section">
            <h2 class="section-title">Quick Calculator</h2>
            <div class="calculator-card">
              <div class="calc-inputs">
                <div class="calc-group">
                  <label class="input-label">Amount</label>
                  <input v-model.number="calculatorAmount" type="number" min="0" step="0.1" placeholder="0"
                    class="calc-input" inputmode="decimal">
                </div>
                <div class="calc-group">
                  <label class="input-label">Unit</label>
                  <select v-model="calculatorUnit" class="calc-select">
                    <option value="chi">Chi (ជី)</option>
                    <option value="gram">Gram</option>
                    <option value="damlung">Damlung (ដំឡឹង)</option>
                    <option value="oz">Troy Ounce</option>
                  </select>
                </div>
              </div>

              <Transition name="fade">
                <div v-if="calculatorAmount > 0" class="calc-result">
                  <div class="result-label">Value</div>
                  <div class="result-value">{{ memoizedCalculatorResult }}</div>
                </div>
              </Transition>
            </div>
          </section>

          <!-- Gram to Chi Converter -->
          <section class="converter-section">
            <h2 class="section-title">Gram ↔ Chi Converter</h2>
            <div class="converter-card">
              <div class="converter-row">
                <div class="converter-input">
                  <label class="input-label">Grams</label>
                  <input v-model.number="gramAmount" type="number" min="0" step="0.1" placeholder="0.00"
                    class="converter-field" inputmode="decimal">
                </div>
                <div class="converter-arrow">→</div>
                <div class="converter-output">
                  <label class="input-label">Chi (ជី)</label>
                  <div class="converter-result">{{ memoizedGramToChi }}</div>
                </div>
              </div>

              <div class="converter-info">
                <span class="info-badge">1 Chi = 3.75g</span>
              </div>

              <div class="quick-ref">
                <div class="ref-item">
                  <span class="ref-gram">3.75g</span>
                  <span class="ref-equal">=</span>
                  <span class="ref-chi">1 Chi</span>
                </div>
                <div class="ref-item">
                  <span class="ref-gram">7.5g</span>
                  <span class="ref-equal">=</span>
                  <span class="ref-chi">2 Chi</span>
                </div>
                <div class="ref-item">
                  <span class="ref-gram">18.75g</span>
                  <span class="ref-equal">=</span>
                  <span class="ref-chi">5 Chi</span>
                </div>
                <div class="ref-item">
                  <span class="ref-gram">37.5g</span>
                  <span class="ref-equal">=</span>
                  <span class="ref-chi">10 Chi</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Price by Unit -->
          <section class="units-section">
            <h2 class="section-title">Price by Unit</h2>
            <div class="units-grid">
              <div class="unit-card">
                <div class="unit-name">Chi (ជី)</div>
                <div class="unit-price">{{ memoizedChiPrice }}</div>
                <div class="unit-weight">3.75 grams</div>
              </div>
              <div class="unit-card">
                <div class="unit-name">Gram</div>
                <div class="unit-price">{{ memoizedGramPrice }}</div>
                <div class="unit-weight">1 gram</div>
              </div>
              <div class="unit-card">
                <div class="unit-name">Damlung</div>
                <div class="unit-price">{{ memoizedDamlungPrice }}</div>
                <div class="unit-weight">37.5 grams</div>
              </div>
              <div class="unit-card">
                <div class="unit-name">Troy Oz</div>
                <div class="unit-price">{{ formatCurrencyDisplay(currentPrice) }}</div>
                <div class="unit-weight">31.1 grams</div>
              </div>
            </div>
          </section>

          <!-- Add Purchase -->
          <section class="purchase-section">
            <h2 class="section-title">Add New Purchase</h2>
            <div class="purchase-card">
              <div class="purchase-form">
                <div class="form-field">
                  <label class="input-label">Amount (Chi)</label>
                  <input v-model.number="newPurchase.amount" type="number" step="0.01" min="0" placeholder="0.00"
                    class="form-input" inputmode="decimal">
                </div>
                <div class="form-field">
                  <label class="input-label">Price Paid (USD)</label>
                  <input v-model.number="newPurchase.totalPaid" type="number" step="0.01" min="0" placeholder="0.00"
                    class="form-input" inputmode="decimal">
                </div>
                <div class="form-field">
                  <label class="input-label">Date</label>
                  <input v-model="newPurchase.date" type="date" class="form-input" :max="getCurrentDate()">
                </div>
              </div>
              <button @click="addPurchase" :disabled="!canAddPurchase()" class="btn-add">
                Add Purchase
              </button>
            </div>
          </section>

          <!-- My Purchases -->
          <section v-if="purchases.length > 0" class="purchases-section">
            <div class="purchases-header">
              <h2 class="section-title">My Purchases</h2>
              <div class="sort-control">
                <label class="sort-label">Sort by</label>
                <select v-model="purchaseSortBy" class="sort-select">
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="amount-desc">Highest Amount</option>
                  <option value="amount-asc">Lowest Amount</option>
                  <option value="profit-desc">Highest Profit</option>
                  <option value="profit-asc">Lowest Profit</option>
                </select>
              </div>
            </div>

            <div class="purchases-list">
              <div v-for="purchase in sortedPurchases" :key="purchase.id" class="purchase-item"
                :class="{ editing: editingId === purchase.id }">

                <!-- View Mode -->
                <template v-if="editingId !== purchase.id">
                  <div class="purchase-header">
                    <div class="purchase-date">{{ formatDate(purchase.date) }}</div>
                    <div class="purchase-amount">{{ purchase.amount }} Chi</div>
                  </div>

                  <div class="purchase-details">
                    <div class="detail-row">
                      <span class="detail-label">Paid</span>
                      <span class="detail-value">{{ formatCurrencyDisplay(purchase.totalPaid) }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Worth Now</span>
                      <span class="detail-value">{{ getWorthTodayTotalCached(purchase) }}</span>
                    </div>
                  </div>

                  <div class="purchase-profit" :class="getProfitClassCached(purchase.id)">
                    <div class="profit-info">
                      <span class="profit-label">{{ getProfitValueCached(purchase.id) >= 0 ? 'Gain' : 'Loss' }}</span>
                      <span class="profit-amount">{{ getProfitDisplayCached(purchase.id) }}</span>
                      <span class="profit-percent">{{ getProfitPercentCached(purchase.id) }}</span>
                    </div>
                    <div class="purchase-actions">
                      <button @click="startEdit(purchase)" class="btn-edit">Edit</button>
                      <button @click="deletePurchase(purchase.id)" class="btn-delete">Delete</button>
                    </div>
                  </div>
                </template>

                <!-- Edit Mode -->
                <template v-else>
                  <div class="edit-header">
                    <h3>Edit Purchase</h3>
                    <button @click="cancelEdit" class="btn-close">×</button>
                  </div>
                  <div class="edit-form">
                    <div class="edit-field">
                      <label class="input-label">Date</label>
                      <input v-model="editingPurchase.date" type="date" class="edit-input">
                    </div>
                    <div class="edit-field">
                      <label class="input-label">Amount (Chi)</label>
                      <input v-model.number="editingPurchase.amount" type="number" step="0.01" class="edit-input"
                        inputmode="decimal">
                    </div>
                    <div class="edit-field">
                      <label class="input-label">Price Paid (USD)</label>
                      <input v-model.number="editingPurchase.totalPaid" type="number" step="0.01" class="edit-input"
                        inputmode="decimal">
                    </div>
                  </div>
                  <div class="edit-actions">
                    <button @click="saveEdit(purchase.id)" class="btn-save">Save Changes</button>
                    <button @click="cancelEdit" class="btn-cancel">Cancel</button>
                  </div>
                </template>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GoldTrackerImproved',

  head() {
    return {
      title: 'Gold Tracker',
      meta: [
        { hid: 'description', name: 'description', content: 'Track your gold investments with ease' },
        { hid: 'viewport', name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover' },
        { hid: 'apple-mobile-web-app-capable', name: 'apple-mobile-web-app-capable', content: 'yes' },
        { hid: 'apple-mobile-web-app-status-bar-style', name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { hid: 'theme-color', name: 'theme-color', content: '#ffffff' }
      ]
    }
  },

  data() {
    return {
      TROY_OUNCE_TO_GRAM: 31.1035,
      CHI_TO_OZ: 3.75 / 31.1035,
      CHI_TO_GRAM: 3.75,
      GRAM_TO_OZ: 1 / 31.1035,
      DAMLUNG_TO_OZ: 37.5 / 31.1035,

      goldPrice: 0,
      manualPrice: null,
      isApiPrice: false,
      loading: false,
      lastUpdated: 'No price set',

      apiKey: '',
      apiKeyInput: '',
      showApiKey: false,
      showApiSetup: false,
      apiBaseUrl: 'https://www.goldapi.io/api',
      alternativeApiUrl: 'https://api.metals.live/v1/spot',

      calculatorAmount: 1,
      calculatorUnit: 'chi',
      gramAmount: 0,

      purchases: [],
      newPurchase: {
        amount: null,
        totalPaid: null,
        date: new Date().toISOString().split('T')[0]
      },

      editingId: null,
      editingPurchase: null,

      purchaseSortBy: 'date-desc',

      cache: { gold: { data: null, timestamp: null } },
      fallbackPrice: 2200,
      purchaseCache: new Map(),
      formatCache: new Map(),

      toasts: [],
      toastId: 0
    };
  },

  computed: {
    currentPrice() {
      return this.goldPrice > 0 ? this.goldPrice : 0;
    },

    memoizedGramToChi() {
      if (!this.gramAmount || this.gramAmount <= 0) return '0.00';
      const chi = this.gramAmount / this.CHI_TO_GRAM;
      return chi.toFixed(2);
    },

    memoizedChiPrice() {
      return this.formatCurrencyDisplay(this.currentPrice * this.CHI_TO_OZ);
    },

    memoizedGramPrice() {
      return this.formatCurrencyDisplay(this.currentPrice * this.GRAM_TO_OZ);
    },

    memoizedDamlungPrice() {
      return this.formatCurrencyDisplay(this.currentPrice * this.DAMLUNG_TO_OZ);
    },

    memoizedTotalInvested() {
      const total = this.purchases.reduce((sum, p) => sum + p.totalPaid, 0);
      return this.formatCurrencyDisplay(total);
    },

    memoizedCurrentValue() {
      let sum = 0;
      for (let p of this.purchases) {
        sum += p.amount * this.CHI_TO_OZ * this.currentPrice;
      }
      return this.formatCurrencyDisplay(sum);
    },

    memoizedProfitLoss() {
      let current = 0;
      for (let p of this.purchases) {
        current += p.amount * this.CHI_TO_OZ * this.currentPrice;
      }
      const invested = this.purchases.reduce((sum, p) => sum + p.totalPaid, 0);
      return current - invested;
    },

    memoizedProfitLossDisplay() {
      return this.formatCurrencyDisplay(Math.abs(this.memoizedProfitLoss));
    },

    memoizedProfitChangePercent() {
      const invested = this.purchases.reduce((sum, p) => sum + p.totalPaid, 0);
      if (invested === 0) return '0.00%';
      const percent = (Math.abs(this.memoizedProfitLoss) / invested) * 100;
      const sign = this.memoizedProfitLoss >= 0 ? '+' : '-';
      return `${sign}${percent.toFixed(2)}%`;
    },

    memoizedCalculatorResult() {
      if (!this.calculatorAmount || !this.currentPrice) return '$0.00';
      let ozAmount;
      switch (this.calculatorUnit) {
        case 'chi': ozAmount = this.calculatorAmount * this.CHI_TO_OZ; break;
        case 'gram': ozAmount = this.calculatorAmount * this.GRAM_TO_OZ; break;
        case 'damlung': ozAmount = this.calculatorAmount * this.DAMLUNG_TO_OZ; break;
        default: ozAmount = this.calculatorAmount;
      }
      return this.formatCurrencyDisplay(ozAmount * this.currentPrice);
    },

    sortedPurchases() {
      const sorted = [...this.purchases];

      switch (this.purchaseSortBy) {
        case 'date-asc':
          return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
        case 'date-desc':
          return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
        case 'amount-asc':
          return sorted.sort((a, b) => a.amount - b.amount);
        case 'amount-desc':
          return sorted.sort((a, b) => b.amount - a.amount);
        case 'profit-asc':
          return sorted.sort((a, b) => this.getProfitValueCached(a.id) - this.getProfitValueCached(b.id));
        case 'profit-desc':
          return sorted.sort((a, b) => this.getProfitValueCached(b.id) - this.getProfitValueCached(a.id));
        default:
          return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
    }
  },

  methods: {
    showToast(message, type = 'info') {
      const id = this.toastId++;
      this.toasts.push({ id, message, type });
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id);
      }, 3000);
    },

    formatCurrencyDisplay(value) {
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

    applyCustomPrice() {
      if (!this.manualPrice || this.manualPrice <= 0) {
        this.showToast('Enter a valid price', 'error');
        return;
      }
      this.goldPrice = this.manualPrice;
      this.isApiPrice = false;
      this.lastUpdated = 'just now (manual)';
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
      if (process.client) localStorage.setItem('apiKey', this.apiKey);
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
      if (process.client) localStorage.setItem('apiKey', this.apiKey);
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
        if (process.client) localStorage.removeItem('apiKey');
        this.showToast('API disabled', 'info');
      }
    },

    getWorthTodayPerChiCached(purchase) {
      const key = `worth-${purchase.id}-${this.currentPrice}`;
      if (this.purchaseCache.has(key)) return this.purchaseCache.get(key);
      const ozEquivalent = purchase.amount * this.CHI_TO_OZ;
      const currentValue = ozEquivalent * this.currentPrice;
      const pricePerChi = currentValue / purchase.amount;
      const result = this.formatCurrencyDisplay(pricePerChi);
      this.purchaseCache.set(key, result);
      return result;
    },

    getProfitValueCached(purchaseId) {
      const purchase = this.purchases.find(p => p.id === purchaseId);
      if (!purchase) return 0;
      const ozEquivalent = purchase.amount * this.CHI_TO_OZ;
      const currentValue = ozEquivalent * this.currentPrice;
      return currentValue - purchase.totalPaid;
    },

    getProfitDisplayCached(purchaseId) {
      return this.formatCurrencyDisplay(Math.abs(this.getProfitValueCached(purchaseId)));
    },

    getProfitPercentCached(purchaseId) {
      const purchase = this.purchases.find(p => p.id === purchaseId);
      if (!purchase) return '0.00%';
      const profit = this.getProfitValueCached(purchaseId);
      const percentage = (profit / purchase.totalPaid) * 100;
      const sign = profit >= 0 ? '+' : '-';
      return `${sign}${Math.abs(percentage).toFixed(2)}%`;
    },

    getProfitClassCached(purchaseId) {
      return this.getProfitValueCached(purchaseId) >= 0 ? 'profit' : 'loss';
    },

    getWorthTodayTotalCached(purchase) {
      const ozEquivalent = purchase.amount * this.CHI_TO_OZ;
      const currentValue = ozEquivalent * this.currentPrice;
      return this.formatCurrencyDisplay(currentValue);
    },

    startEdit(purchase) {
      this.editingId = purchase.id;
      this.editingPurchase = { ...purchase };
    },

    saveEdit(purchaseId) {
      const index = this.purchases.findIndex(p => p.id === purchaseId);
      if (index !== -1 && this.editingPurchase.amount > 0 && this.editingPurchase.totalPaid > 0) {
        this.purchases[index] = { ...this.purchases[index], ...this.editingPurchase };
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

    getCurrentDate() {
      return new Date().toISOString().split('T')[0];
    },

    canAddPurchase() {
      return this.newPurchase.amount > 0 && this.newPurchase.totalPaid > 0 && this.newPurchase.date;
    },

    addPurchase() {
      if (!this.canAddPurchase()) return;
      this.purchases.push({
        id: Date.now(),
        amount: this.newPurchase.amount,
        totalPaid: this.newPurchase.totalPaid,
        date: this.newPurchase.date
      });
      this.savePurchases();
      this.purchaseCache.clear();
      this.newPurchase = { amount: null, totalPaid: null, date: new Date().toISOString().split('T')[0] };
      this.showToast('Purchase added', 'success');
    },

    deletePurchase(purchaseId) {
      if (confirm('Delete this purchase?')) {
        this.purchases = this.purchases.filter(p => p.id !== purchaseId);
        this.savePurchases();
        this.purchaseCache.clear();
        this.showToast('Purchase deleted', 'info');
      }
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    savePrice() {
      if (process.client) {
        localStorage.setItem('goldPrice', this.goldPrice);
        localStorage.setItem('isApiPrice', this.isApiPrice);
      }
    },

    savePurchases() {
      if (process.client) localStorage.setItem('purchases', JSON.stringify(this.purchases));
    },

    loadPurchases() {
      if (!process.client) return;
      const saved = localStorage.getItem('purchases');
      if (saved) {
        try {
          this.purchases = JSON.parse(saved);
        } catch (e) {
          console.error('Failed to load purchases');
        }
      }
    },

    exportData(format) {
      try {
        let content, filename, type;

        if (format === 'json') {
          content = JSON.stringify(this.purchases, null, 2);
          filename = `gold-tracker-${new Date().toISOString().split('T')[0]}.json`;
          type = 'application/json';
        } else if (format === 'csv') {
          const headers = ['Date', 'Amount (Chi)', 'Price Per Chi', 'Total Paid', 'Current Value', 'Gain/Loss', 'Change %'];
          const rows = this.purchases.map(p => [
            this.formatDate(p.date),
            p.amount,
            this.formatCurrencyDisplay(p.totalPaid / p.amount),
            this.formatCurrencyDisplay(p.totalPaid),
            this.formatCurrencyDisplay(p.amount * this.CHI_TO_OZ * this.currentPrice),
            this.formatCurrencyDisplay(Math.abs(this.getProfitValueCached(p.id))),
            this.getProfitPercentCached(p.id)
          ]);
          content = [headers, ...rows].map(row => row.join(',')).join('\n');
          filename = `gold-tracker-${new Date().toISOString().split('T')[0]}.csv`;
          type = 'text/csv';
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

    async handleRefresh() {
      if (!this.apiKey) return;
      await this.fetchMetalPrice(true);
    },

    async tryAlternativeApi() {
      try {
        const response = await fetch(this.alternativeApiUrl);
        if (!response.ok) throw new Error('Failed');
        const data = await response.json();
        if (data && typeof data.gold === 'number') {
          this.goldPrice = data.gold;
          this.isApiPrice = true;
          this.lastUpdated = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          this.savePrice();
          return true;
        }
      } catch (e) {
        console.error('Alternative API failed');
      }
      return false;
    },

    async fetchMetalPrice(userRequested = false) {
      if (!this.apiKey) {
        this.showToast('API key not configured', 'info');
        return;
      }

      const now = new Date();
      const cached = this.cache.gold;
      const cacheAge = cached.timestamp ? (now - new Date(cached.timestamp)) / (1000 * 60 * 60) : 999;

      if (cached.data && cacheAge < 24 && !userRequested) {
        this.goldPrice = cached.data.price;
        this.isApiPrice = true;
        this.lastUpdated = cacheAge > 1 ? `${Math.floor(cacheAge)}h ago` : 'just now';
        this.savePrice();
        return;
      }

      this.loading = true;

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 8000);
      });

      try {
        const fetchPromise = fetch(`${this.apiBaseUrl}/XAU/USD`, {
          headers: {
            'x-access-token': this.apiKey,
            'Content-Type': 'application/json'
          },
          method: 'GET'
        });

        const response = await Promise.race([fetchPromise, timeoutPromise]);

        if (response.ok) {
          const data = await response.json();
          if (data && typeof data.price === 'number') {
            this.goldPrice = data.price;
            this.isApiPrice = true;
            this.cache.gold = { data, timestamp: now.toISOString() };
            this.lastUpdated = 'just now';
            this.savePrice();
            this.purchaseCache.clear();
            this.showToast('Price updated from API', 'success');
            this.loading = false;
            return;
          }
        }
        throw new Error(`API error: ${response.status}`);
      } catch (error) {
        console.error('API Error:', error);
        const altSuccess = await this.tryAlternativeApi();
        if (!altSuccess && cached.data) {
          this.goldPrice = cached.data.price;
          this.isApiPrice = true;
          this.lastUpdated = 'Cached';
          this.showToast('Using cached price', 'info');
        } else if (!altSuccess) {
          this.showToast('Failed to fetch price', 'error');
        }
        this.loading = false;
      }
    },

    loadSavedData() {
      if (!process.client) return;
      try {
        const saved = localStorage.getItem('goldPrice');
        if (saved) {
          this.goldPrice = parseFloat(saved);
          const wasApi = localStorage.getItem('isApiPrice') === 'true';
          this.isApiPrice = wasApi;
        }

        const savedApiKey = localStorage.getItem('apiKey');
        if (savedApiKey) {
          this.apiKey = savedApiKey;
        }

        this.loadPurchases();
      } catch (e) {
        console.error('Error loading saved data');
      }
    }
  },

  mounted() {
    this.loadSavedData();
  }
}
</script>

<style scoped>
/* ============================================
   BASE & RESET
   ============================================ */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f7;
  color: #1d1d1f;
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  overflow-x: hidden;
}

/* ============================================
   APP LAYOUT
   ============================================ */
.app {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.window {
  width: 100%;
  max-width: 900px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 95vh;
}

/* ============================================
   TITLE BAR
   ============================================ */
.title-bar {
  height: 52px;
  background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%);
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 16px;
  flex-shrink: 0;
}

.traffic-lights {
  display: flex;
  gap: 8px;
}

.light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.light.red {
  background: #ff5f57;
}

.light.yellow {
  background: #febc2e;
}

.light.green {
  background: #28c940;
}

.light:hover {
  opacity: 0.8;
}

.title {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1f;
  letter-spacing: -0.01em;
}

.title-buttons {
  display: flex;
  gap: 8px;
}

.title-btn {
  height: 32px;
  padding: 0 12px;
  background: rgba(0, 0, 0, 0.04);
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #1d1d1f;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.title-btn:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.08);
}

.title-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-text {
  display: none;
}

.btn-icon {
  font-size: 14px;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ============================================
   MAIN CONTENT
   ============================================ */
.window-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.content {
  display: flex;
  flex-direction: column;
}

section {
  padding: 32px 28px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 20px;
  letter-spacing: -0.02em;
}

/* ============================================
   HERO SECTION - PRICE DISPLAY
   ============================================ */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.hero-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.price-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.price-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1d1d1f;
  margin: 0;
  letter-spacing: -0.02em;
}

.price-source {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  background: #f5f5f7;
  color: #86868b;
}

.price-source.api {
  background: #d1fae5;
  color: #047857;
}

.price-display {
  text-align: center;
  padding: 24px 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 24px;
}

.price-main {
  margin-bottom: 16px;
}

.price-value {
  font-size: 56px;
  font-weight: 800;
  color: #1d1d1f;
  line-height: 1;
  margin-bottom: 8px;
  letter-spacing: -0.03em;
}

.price-unit {
  font-size: 15px;
  color: #86868b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.price-damlung {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  background: #f0f7ff;
  border-radius: 12px;
  margin-bottom: 12px;
}

.damlung-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a73e8;
}

.damlung-label {
  font-size: 13px;
  color: #5f6368;
  font-weight: 500;
}

.price-timestamp {
  font-size: 13px;
  color: #86868b;
  font-weight: 500;
}

/* ============================================
   INPUT COMPONENTS
   ============================================ */
.input-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.price-input-card,
.api-section {
  margin-bottom: 20px;
}

.price-input-card {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e5e5e5;
}

.input-row {
  display: flex;
  gap: 10px;
}

.price-input,
.api-input {
  flex: 1;
  height: 48px;
  padding: 0 16px;
  font-size: 17px;
  border: 2px solid #e5e5e5;
  border-radius: 10px;
  background: white;
  color: #1d1d1f;
  transition: all 0.2s;
  font-weight: 500;
}

.price-input:focus,
.api-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.btn-apply,
.btn-toggle {
  height: 48px;
  padding: 0 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-apply:hover,
.btn-toggle:hover {
  background: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-toggle {
  width: 48px;
  padding: 0;
  font-size: 18px;
}

/* ============================================
   API SECTION
   ============================================ */
.api-section {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e5e5e5;
}

.api-prompt {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #fffbf0;
  border: 2px solid #ffd66b;
  border-radius: 12px;
}

.prompt-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.prompt-content {
  flex: 1;
}

.prompt-title {
  font-size: 15px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 4px;
}

.prompt-text {
  font-size: 13px;
  color: #5f6368;
}

.prompt-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-demo,
.btn-setup {
  height: 40px;
  padding: 0 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-demo {
  background: #10b981;
  color: white;
}

.btn-demo:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-setup {
  background: #667eea;
  color: white;
}

.btn-setup:hover {
  background: #5568d3;
}

.api-config {
  background: #f0f7ff;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #b3d9ff;
}

.api-help {
  font-size: 13px;
  color: #5f6368;
  margin-top: 8px;
  margin-bottom: 16px;
}

.api-help a {
  color: #1a73e8;
  text-decoration: none;
  font-weight: 600;
}

.button-row {
  display: flex;
  gap: 10px;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  height: 48px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #f5f5f7;
  color: #1d1d1f;
}

.btn-secondary:hover {
  background: #e8e8ea;
}

.api-active {
  background: #ecfdf5;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #6ee7b7;
}

.active-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.status-dot {
  width: 10px;
  height: 10px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.status-text {
  font-size: 15px;
  font-weight: 600;
  color: #047857;
}

.button-row-small {
  display: flex;
  gap: 8px;
}

.btn-small,
.btn-small-outline {
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-small {
  background: #10b981;
  color: white;
  border: none;
}

.btn-small:hover:not(:disabled) {
  background: #059669;
}

.btn-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-small-outline {
  background: transparent;
  color: #047857;
  border: 2px solid #6ee7b7;
}

.btn-small-outline:hover {
  background: #d1fae5;
}

/* ============================================
   STATS SECTION
   ============================================ */
.stats-section {
  background: #f9f9f9;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e5e5e5;
  text-align: center;
}

.stat-label {
  font-size: 13px;
  font-weight: 600;
  color: #86868b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: 800;
  color: #1d1d1f;
  letter-spacing: -0.02em;
}

.profit-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 2px solid #e5e5e5;
  display: flex;
  align-items: center;
  gap: 20px;
}

.profit-card.gain {
  background: #ecfdf5;
  border-color: #6ee7b7;
}

.profit-card.loss {
  background: #fef2f2;
  border-color: #fca5a5;
}

.profit-icon {
  font-size: 48px;
  flex-shrink: 0;
}

.profit-content {
  flex: 1;
}

.profit-label {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.profit-amount {
  font-size: 40px;
  font-weight: 800;
  margin-bottom: 4px;
  letter-spacing: -0.02em;
}

.profit-card.gain .profit-amount {
  color: #059669;
}

.profit-card.loss .profit-amount {
  color: #dc2626;
}

.profit-percent {
  font-size: 18px;
  font-weight: 700;
}

.profit-card.gain .profit-percent {
  color: #047857;
}

.profit-card.loss .profit-percent {
  color: #b91c1c;
}

/* ============================================
   CALCULATOR & CONVERTER
   ============================================ */
.calculator-card,
.converter-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e5e5;
}

.calc-inputs,
.converter-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.calc-group,
.converter-input,
.converter-output {
  flex: 1;
}

.calc-input,
.calc-select,
.converter-field {
  width: 100%;
  height: 52px;
  padding: 0 16px;
  font-size: 18px;
  font-weight: 600;
  border: 2px solid #e5e5e5;
  border-radius: 10px;
  background: white;
  color: #1d1d1f;
  transition: all 0.2s;
}

.calc-input:focus,
.calc-select:focus,
.converter-field:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.calc-result,
.converter-result {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.result-label {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  opacity: 0.9;
}

.result-value {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.converter-arrow {
  font-size: 32px;
  color: #86868b;
  display: flex;
  align-items: center;
  justify-content: center;
}

.converter-result {
  width: 100%;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  background: #f9f9f9;
  border: 2px solid #e5e5e5;
  border-radius: 10px;
  color: #1d1d1f;
}

.converter-info {
  text-align: center;
  margin: 16px 0;
}

.info-badge {
  display: inline-block;
  padding: 8px 16px;
  background: #f0f7ff;
  color: #1a73e8;
  font-size: 14px;
  font-weight: 700;
  border-radius: 20px;
}

.quick-ref {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.ref-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  font-size: 14px;
}

.ref-gram {
  font-weight: 600;
  color: #6b7280;
}

.ref-equal {
  color: #d1d5db;
}

.ref-chi {
  font-weight: 700;
  color: #1d1d1f;
}

/* ============================================
   UNITS GRID
   ============================================ */
.units-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.unit-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e5e5e5;
  text-align: center;
  transition: all 0.2s;
}

.unit-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.unit-name {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.unit-price {
  font-size: 28px;
  font-weight: 800;
  color: #1d1d1f;
  margin-bottom: 4px;
  letter-spacing: -0.02em;
}

.unit-weight {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
}

/* ============================================
   PURCHASE FORM
   ============================================ */
.purchase-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e5e5;
}

.purchase-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.form-field {
  display: flex;
  flex-direction: column;
}

.form-input {
  height: 52px;
  padding: 0 16px;
  font-size: 18px;
  font-weight: 600;
  border: 2px solid #e5e5e5;
  border-radius: 10px;
  background: white;
  color: #1d1d1f;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.btn-add {
  width: 100%;
  height: 52px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================
   MY PURCHASES LIST
   ============================================ */
.purchases-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}

.purchases-header .section-title {
  margin: 0;
}

.sort-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sort-label {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  white-space: nowrap;
}

.sort-select {
  height: 44px;
  padding: 0 16px;
  font-size: 15px;
  font-weight: 600;
  border: 2px solid #e5e5e5;
  border-radius: 10px;
  background: white;
  color: #1d1d1f;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 180px;
}

.sort-select:hover {
  border-color: #667eea;
}

.sort-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.purchases-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.purchase-item {
  background: white;
  border-radius: 12px;
  border: 2px solid #e5e5e5;
  overflow: hidden;
  transition: all 0.2s;
}

.purchase-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.purchase-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f9f9f9;
  border-bottom: 1px solid #e5e5e5;
}

.purchase-date {
  font-size: 15px;
  font-weight: 600;
  color: #6b7280;
}

.purchase-amount {
  font-size: 20px;
  font-weight: 800;
  color: #1d1d1f;
}

.purchase-details {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-bottom: 1px solid #e5e5e5;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.detail-value {
  font-size: 20px;
  font-weight: 700;
  color: #1d1d1f;
}

.purchase-profit {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.purchase-profit.profit {
  background: #ecfdf5;
}

.purchase-profit.loss {
  background: #fef2f2;
}

.profit-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.profit-label {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.profit-amount {
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
}

.purchase-profit.profit .profit-amount {
  color: #059669;
}

.purchase-profit.loss .profit-amount {
  color: #dc2626;
}

.profit-percent {
  font-size: 16px;
  font-weight: 700;
}

.purchase-profit.profit .profit-percent {
  color: #047857;
}

.purchase-profit.loss .profit-percent {
  color: #b91c1c;
}

.purchase-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-edit,
.btn-delete {
  height: 48px;
  padding: 0 20px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-edit {
  background: #667eea;
  color: white;
}

.btn-edit:hover {
  background: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-delete {
  background: #fef2f2;
  color: #dc2626;
  border: 2px solid #fca5a5;
}

.btn-delete:hover {
  background: #fee2e2;
  border-color: #f87171;
}

/* Edit Mode */
.purchase-item.editing {
  border-color: #667eea;
  background: #f9fafb;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f0f7ff;
  border-bottom: 2px solid #667eea;
}

.edit-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1d1d1f;
  margin: 0;
}

.btn-close {
  width: 36px;
  height: 36px;
  padding: 0;
  background: none;
  border: none;
  font-size: 32px;
  color: #6b7280;
  cursor: pointer;
  line-height: 1;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  color: #1d1d1f;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
}

.edit-form {
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  border-bottom: 1px solid #e5e5e5;
}

.edit-field {
  display: flex;
  flex-direction: column;
}

.edit-input {
  height: 52px;
  padding: 0 16px;
  font-size: 18px;
  font-weight: 600;
  border: 2px solid #e5e5e5;
  border-radius: 10px;
  background: white;
  color: #1d1d1f;
  transition: all 0.2s;
}

.edit-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.edit-actions {
  padding: 20px;
  display: flex;
  gap: 12px;
}

.btn-save,
.btn-cancel {
  flex: 1;
  height: 52px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save {
  background: #10b981;
  color: white;
}

.btn-save:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-cancel {
  background: #f5f5f7;
  color: #1d1d1f;
}

.btn-cancel:hover {
  background: #e8e8ea;
}

/* ============================================
   TOAST NOTIFICATIONS
   ============================================ */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.toast {
  background: rgba(29, 29, 31, 0.95);
  color: white;
  padding: 16px 20px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(20px);
  pointer-events: auto;
  min-width: 250px;
}

.toast-success {
  background: rgba(16, 185, 129, 0.95);
}

.toast-error {
  background: rgba(220, 38, 38, 0.95);
}

.toast-icon {
  font-size: 20px;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
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
   SCROLLBAR
   ============================================ */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* ============================================
   RESPONSIVE - TABLET
   ============================================ */
@media (max-width: 768px) {
  .app {
    padding: 0;
    align-items: stretch;
  }

  .window {
    max-width: 100%;
    border-radius: 0;
    max-height: 100vh;
  }

  .title-bar {
    height: 48px;
    padding: 0 16px;
  }

  .btn-text {
    display: inline;
  }

  section {
    padding: 24px 20px;
  }

  .section-title {
    font-size: 20px;
    margin-bottom: 16px;
  }

  .api-prompt {
    flex-wrap: wrap;
  }

  .prompt-actions {
    width: 100%;
    margin-top: 8px;
  }

  .btn-demo,
  .btn-setup {
    flex: 1;
  }

  .price-value {
    font-size: 48px;
  }

  .damlung-value {
    font-size: 24px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .profit-card {
    flex-direction: column;
    text-align: center;
  }

  .purchase-form {
    grid-template-columns: 1fr;
  }

  .filter-row,
  .date-filters {
    grid-template-columns: 1fr;
  }

  .calc-inputs,
  .converter-row {
    flex-direction: column;
  }

  .converter-arrow {
    transform: rotate(90deg);
  }

  .units-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .purchase-profit {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .purchase-actions {
    width: 100%;
  }

  .btn-edit,
  .btn-delete {
    flex: 1;
    height: 44px;
  }

  .edit-form {
    grid-template-columns: 1fr;
  }

  .edit-input {
    height: 48px;
    font-size: 16px;
  }

  .edit-actions {
    flex-direction: column;
  }

  .btn-save,
  .btn-cancel {
    height: 48px;
  }

  .purchases-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .sort-control {
    width: 100%;
  }

  .sort-select {
    flex: 1;
    min-width: 0;
  }
}

/* ============================================
   RESPONSIVE - MOBILE
   ============================================ */
@media (max-width: 480px) {
  .title-bar {
    height: 44px;
    padding: 0 12px;
    gap: 8px;
  }

  .title {
    font-size: 14px;
  }

  .btn-text {
    display: none;
  }

  .btn-icon {
    font-size: 16px;
  }

  section {
    padding: 20px 16px;
  }

  .section-title {
    font-size: 18px;
    margin-bottom: 14px;
  }

  .api-prompt {
    flex-direction: column;
    align-items: stretch;
    padding: 14px;
  }

  .prompt-icon {
    font-size: 28px;
    align-self: center;
  }

  .prompt-content {
    text-align: center;
  }

  .prompt-title {
    font-size: 14px;
  }

  .prompt-text {
    font-size: 12px;
  }

  .prompt-actions {
    width: 100%;
    margin-top: 12px;
  }

  .btn-demo,
  .btn-setup {
    flex: 1;
    height: 44px;
    font-size: 13px;
  }

  .hero-card {
    padding: 20px;
  }

  .price-header h1 {
    font-size: 20px;
  }

  .price-value {
    font-size: 40px;
  }

  .damlung-value {
    font-size: 20px;
  }

  .stat-value {
    font-size: 28px;
  }

  .profit-amount {
    font-size: 32px;
  }

  .result-value {
    font-size: 28px;
  }

  .unit-price {
    font-size: 24px;
  }

  .detail-value {
    font-size: 16px;
  }

  .item-profit .profit-value {
    font-size: 20px;
  }

  .units-grid {
    grid-template-columns: 1fr;
  }

  .quick-ref {
    grid-template-columns: 1fr;
  }

  .purchase-header {
    padding: 14px 16px;
  }

  .purchase-date {
    font-size: 14px;
  }

  .purchase-amount {
    font-size: 18px;
  }

  .purchase-details {
    padding: 16px;
    gap: 10px;
  }

  .detail-value {
    font-size: 18px;
  }

  .purchase-profit {
    padding: 16px;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .purchase-actions {
    width: 100%;
  }

  .btn-edit,
  .btn-delete {
    flex: 1;
    height: 44px;
    font-size: 14px;
  }

  .edit-header {
    padding: 14px 16px;
  }

  .edit-header h3 {
    font-size: 16px;
  }

  .btn-close {
    width: 32px;
    height: 32px;
    font-size: 28px;
  }

  .edit-form {
    padding: 16px;
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .edit-input {
    height: 48px;
    font-size: 16px;
  }

  .edit-actions {
    padding: 16px;
    flex-direction: column;
    gap: 10px;
  }

  .btn-save,
  .btn-cancel {
    height: 48px;
    font-size: 15px;
  }

  .purchases-header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    margin-bottom: 16px;
  }

  .sort-control {
    width: 100%;
  }

  .sort-label {
    font-size: 13px;
  }

  .sort-select {
    flex: 1;
    min-width: 0;
    height: 44px;
    font-size: 14px;
  }

  .toast-container {
    left: 12px;
    right: 12px;
    top: 12px;
  }

  .toast {
    min-width: auto;
    width: 100%;
    font-size: 14px;
    padding: 14px 16px;
  }
}
</style>