<!-- pages/index.vue - GOLD TRACKER (MINIMAL DESIGN) -->
<template>
  <div class="app">
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
        <h1 class="app-title">Gold Tracker</h1>
        <div class="header-actions">
          <button v-if="purchases.length > 0" @click="exportData('csv')" class="btn-ghost">
            Export CSV
          </button>
          <button v-if="apiKey && currentPrice > 0" @click="handleRefresh" :disabled="isLoading" class="btn-ghost">
            {{ isLoading ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <main class="main">
        <!-- Current Price Section -->
        <section class="section">
          <div class="card card-primary">
            <div class="price-header">
              <h2 class="section-title">Current Gold Price</h2>
              <span class="badge" :class="{ 'badge-live': isApiPrice }">
                {{ isApiPrice ? 'Live' : 'Manual' }}
              </span>
            </div>

            <div class="price-display">
              <div class="price-main">{{ formatCurrency(currentPrice) }}</div>
              <div class="price-sub">per troy ounce</div>
            </div>

            <div class="price-damlung">
              <div class="damlung-value">{{ formatCurrency(currentPrice * DAMLUNG_TO_OZ) }}</div>
              <div class="damlung-label">per Damlung (ដំឡឹង)</div>
            </div>

            <div class="price-time">{{ lastUpdated }}</div>

            <!-- Manual Price Input -->
            <div class="input-group">
              <label class="label">Set Custom Price</label>
              <div class="input-row">
                <input v-model.number="manualPrice" type="number" step="0.01" placeholder="Enter price in USD"
                  class="input" inputmode="decimal" @keyup.enter="applyCustomPrice" />
                <button @click="applyCustomPrice" class="btn-primary">Apply</button>
              </div>
            </div>

            <!-- API Section -->
            <div class="api-section">
              <div v-if="!apiKey || apiKey === 'goldapi-3yrz5zhtl5zcyqg4-io'" class="api-prompt">
                <div class="prompt-content">
                  <div class="prompt-title">Enable Live Updates</div>
                  <div class="prompt-text">Connect to Gold API for automatic price updates</div>
                </div>
                <div class="prompt-actions">
                  <button @click="useDemoApi" class="btn-secondary">Use Demo</button>
                  <button @click="toggleApiSetup" class="btn-primary">Setup API</button>
                </div>
              </div>

              <transition name="expand">
                <div v-if="showApiSetup" class="api-config">
                  <label class="label">API Key</label>
                  <div class="input-row">
                    <input v-model="apiKeyInput" :type="showApiKey ? 'text' : 'password'"
                      placeholder="Enter your API key" class="input" />
                    <button @click="toggleApiKeyVisibility" class="btn-ghost">
                      {{ showApiKey ? '👁️' : '👁️‍🗨️' }}
                    </button>
                  </div>
                  <div class="help-text">
                    Get a free key at <a href="https://www.goldapi.io" target="_blank">goldapi.io</a>
                  </div>
                  <div class="button-row">
                    <button @click="saveApiKey" class="btn-primary">Save & Connect</button>
                    <button @click="toggleApiSetup" class="btn-ghost">Cancel</button>
                  </div>
                </div>
              </transition>

              <div v-if="isApiPrice" class="api-active">
                <div class="status-row">
                  <span class="status-dot"></span>
                  <span class="status-text">Live updates active</span>
                </div>
                <div class="button-row">
                  <button @click="handleRefresh" :disabled="isLoading" class="btn-secondary">
                    {{ isLoading ? 'Updating...' : 'Refresh Now' }}
                  </button>
                  <button @click="removeApiKey" class="btn-ghost">Disconnect</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Portfolio Stats -->
        <section v-if="purchases.length > 0" class="section">
          <h2 class="section-title">Portfolio Summary</h2>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total Invested</div>
              <div class="stat-value">{{ formatCurrency(totals.invested) }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Current Worth</div>
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
          <h2 class="section-title">Quick Calculator</h2>
          <div class="card">
            <div class="calc-inputs">
              <div class="input-group">
                <label class="label">Amount</label>
                <input v-model.number="calculatorAmount" type="number" min="0" step="0.1" placeholder="0" class="input"
                  inputmode="decimal" />
              </div>
              <div class="input-group">
                <label class="label">Unit</label>
                <select v-model="calculatorUnit" class="input">
                  <option value="li">Li (លី)</option>
                  <option value="hun">Hun (ហុន)</option>
                  <option value="chi">Chi (ជី)</option>
                  <option value="gram">Gram</option>
                  <option value="damlung">Damlung (ដំឡឹង)</option>
                  <option value="oz">Troy Ounce</option>
                </select>
              </div>
            </div>

            <transition name="fade">
              <div v-if="calculatorAmount > 0" class="calc-result">
                <div class="result-label">Estimated Value</div>
                <div class="result-value">{{ formatCurrency(calculateValue(calculatorAmount, calculatorUnit,
          currentPrice)) }}</div>
              </div>
            </transition>
          </div>
        </section>

        <!-- Gram to Chi Converter -->
        <section class="section">
          <h2 class="section-title">Gram ↔ Chi Converter</h2>
          <div class="card">
            <div class="converter-row">
              <div class="input-group">
                <label class="label">Grams</label>
                <input v-model.number="gramAmount" type="number" min="0" step="0.1" placeholder="0.00" class="input"
                  inputmode="decimal" />
              </div>
              <div class="converter-equals">=</div>
              <div class="input-group">
                <label class="label">Chi (ជី)</label>
                <div class="converter-result">{{ gramToChi(gramAmount).toFixed(2) }}</div>
              </div>
            </div>

            <div class="converter-info">1 Chi = 3.75 grams</div>

            <div class="quick-ref">
              <div class="ref-item" v-for="n in 10" :key="n">
                <span class="ref-gram">{{ (n * 3.75).toFixed(2) }}g</span>
                <span class="ref-chi">{{ n }} Chi</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Li/Hun/Chi Converter -->
        <section class="section">
          <h2 class="section-title">Li ↔ Hun ↔ Chi Converter</h2>
          <div class="card">
            <div class="converter-grid">
              <div class="input-group">
                <label class="label">Li (លី)</label>
                <input v-model.number="liAmount" type="number" min="0" step="1" placeholder="0" class="input"
                  inputmode="decimal" />
              </div>
              <div class="input-group">
                <label class="label">Hun (ហុន)</label>
                <div class="converter-result">{{ liToHun(liAmount).toFixed(1) }}</div>
              </div>
              <div class="input-group">
                <label class="label">Chi (ជី)</label>
                <div class="converter-result">{{ liToChi(liAmount).toFixed(2) }}</div>
              </div>
            </div>

            <div class="converter-info">10 Li = 1 Hun • 10 Hun = 1 Chi • 100 Li = 1 Chi</div>

            <div class="quick-ref">
              <div class="ref-item">
                <span class="ref-gram">10 Li</span>
                <span class="ref-chi">1 Hun</span>
              </div>
              <div class="ref-item">
                <span class="ref-gram">20 Li</span>
                <span class="ref-chi">2 Hun</span>
              </div>
              <div class="ref-item">
                <span class="ref-gram">50 Li</span>
                <span class="ref-chi">5 Hun</span>
              </div>
              <div class="ref-item">
                <span class="ref-gram">100 Li</span>
                <span class="ref-chi">1 Chi</span>
              </div>
              <div class="ref-item">
                <span class="ref-gram">10 Hun</span>
                <span class="ref-chi">1 Chi</span>
              </div>
              <div class="ref-item">
                <span class="ref-gram">20 Hun</span>
                <span class="ref-chi">2 Chi</span>
              </div>
              <div class="ref-item">
                <span class="ref-gram">50 Hun</span>
                <span class="ref-chi">5 Chi</span>
              </div>
              <div class="ref-item">
                <span class="ref-gram">100 Hun</span>
                <span class="ref-chi">10 Chi</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Price by Unit -->
        <section class="section">
          <h2 class="section-title">Price by Unit</h2>
          <div class="units-grid">
            <div class="unit-card">
              <div class="unit-name">Li (លី)</div>
              <div class="unit-price">{{ formatCurrency(currentPrice * LI_TO_OZ) }}</div>
              <div class="unit-weight">0.0375 grams</div>
            </div>
            <div class="unit-card">
              <div class="unit-name">Hun (ហុន)</div>
              <div class="unit-price">{{ formatCurrency(currentPrice * HUN_TO_OZ) }}</div>
              <div class="unit-weight">0.375 grams</div>
            </div>
            <div class="unit-card">
              <div class="unit-name">Chi (ជី)</div>
              <div class="unit-price">{{ formatCurrency(currentPrice * CHI_TO_OZ) }}</div>
              <div class="unit-weight">3.75 grams</div>
            </div>
            <div class="unit-card">
              <div class="unit-name">Gram</div>
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
          <h2 class="section-title">Add New Purchase</h2>
          <div class="card">
            <div class="purchase-form">
              <div class="input-group">
                <label class="label">Amount (Chi)</label>
                <input v-model.number="newPurchase.amount" type="number" step="0.01" min="0" placeholder="0.00"
                  class="input" inputmode="decimal" />
              </div>
              <div class="input-group">
                <label class="label">Price Paid (USD)</label>
                <input v-model.number="newPurchase.totalPaid" type="number" step="0.01" min="0" placeholder="0.00"
                  class="input" inputmode="decimal" />
              </div>
              <div class="input-group">
                <label class="label">Date</label>
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
            <h2 class="section-title">My Purchases</h2>
            <div class="sort-control">
              <label class="label-inline">Sort by</label>
              <select v-model="purchaseSortBy" class="input input-sm">
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
                    <span class="detail-label">Paid</span>
                    <span class="detail-value">{{ formatCurrency(purchase.totalPaid) }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Current Worth</span>
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
                  <button @click="startEdit(purchase)" class="btn-ghost">Edit</button>
                  <button @click="deletePurchase(purchase.id)" class="btn-ghost btn-danger">Delete</button>
                </div>
              </template>

              <!-- Edit Mode -->
              <template v-else>
                <div class="edit-header">
                  <h3>Edit Purchase</h3>
                  <button @click="cancelEdit" class="btn-ghost btn-sm">×</button>
                </div>
                <div class="edit-form">
                  <div class="input-group">
                    <label class="label">Date</label>
                    <input v-model="editingPurchase.date" type="date" class="input" />
                  </div>
                  <div class="input-group">
                    <label class="label">Amount (Chi)</label>
                    <input v-model.number="editingPurchase.amount" type="number" step="0.01" class="input"
                      inputmode="decimal" />
                  </div>
                  <div class="input-group">
                    <label class="label">Price Paid (USD)</label>
                    <input v-model.number="editingPurchase.totalPaid" type="number" step="0.01" class="input"
                      inputmode="decimal" />
                  </div>
                </div>
                <div class="edit-actions">
                  <button @click="saveEdit(purchase.id)" class="btn-primary">Save Changes</button>
                  <button @click="cancelEdit" class="btn-ghost">Cancel</button>
                </div>
              </template>
            </div>
          </div>
        </section>
      </main>

      <!-- Footer -->
      <footer class="footer">
        <p>Gold Tracker © 2024</p>
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
      // Cambodian units: 10 li = 1 hun, 10 hun = 1 chi
      LI_TO_GRAM: 3.75 / 100, // 1 chi = 100 li
      HUN_TO_GRAM: 3.75 / 10, // 1 chi = 10 hun
      LI_TO_OZ: (3.75 / 100) / 31.1035,
      HUN_TO_OZ: (3.75 / 10) / 31.1035,

      // Price state
      currentPrice: 0,
      manualPrice: null,
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
      calculatorAmount: 1,
      calculatorUnit: 'chi',
      gramAmount: 0,

      // Li/Hun/Chi converter state
      liAmount: 0,
      hunAmount: 0,
      chiAmount: 0,

      // Purchases state
      purchases: [],
      newPurchase: {
        amount: null,
        totalPaid: null,
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
    };
  },

  computed: {
    totals() {
      const invested = this.purchases.reduce((sum, p) => sum + p.totalPaid, 0);
      let currentValue = 0;
      for (let p of this.purchases) {
        currentValue += p.amount * this.CHI_TO_OZ * this.currentPrice;
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
          return sorted.sort((a, b) => a.amount - b.amount);
        case 'amount-desc':
          return sorted.sort((a, b) => b.amount - a.amount);
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
    // Utility methods
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

    // Conversion methods
    gramToChi(grams) {
      if (!grams || grams <= 0) return 0;
      return grams / this.CHI_TO_GRAM;
    },

    // Li/Hun/Chi conversions
    liToHun(li) {
      if (!li || li <= 0) return 0;
      return li / 10;
    },

    liToChi(li) {
      if (!li || li <= 0) return 0;
      return li / 100;
    },

    hunToLi(hun) {
      if (!hun || hun <= 0) return 0;
      return hun * 10;
    },

    hunToChi(hun) {
      if (!hun || hun <= 0) return 0;
      return hun / 10;
    },

    chiToLi(chi) {
      if (!chi || chi <= 0) return 0;
      return chi * 100;
    },

    chiToHun(chi) {
      if (!chi || chi <= 0) return 0;
      return chi * 10;
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

    // Price methods
    applyCustomPrice() {
      if (!this.manualPrice || this.manualPrice <= 0) {
        this.showToast('Enter a valid price', 'error');
        return;
      }
      this.currentPrice = this.manualPrice;
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

    // Purchase calculation methods
    getProfitValue(purchaseId) {
      const purchase = this.purchases.find((p) => p.id === purchaseId);
      if (!purchase) return 0;
      const ozEquivalent = purchase.amount * this.CHI_TO_OZ;
      const currentValue = ozEquivalent * this.currentPrice;
      return currentValue - purchase.totalPaid;
    },

    getProfitPercent(purchaseId) {
      const purchase = this.purchases.find((p) => p.id === purchaseId);
      if (!purchase) return '0.00%';
      const profit = this.getProfitValue(purchaseId);
      const percentage = (profit / purchase.totalPaid) * 100;
      const sign = profit >= 0 ? '+' : '-';
      return `${sign}${Math.abs(percentage).toFixed(2)}%`;
    },

    // Purchase CRUD methods
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
        date: this.newPurchase.date,
      });
      this.savePurchases();
      this.purchaseCache.clear();
      this.newPurchase = { amount: null, totalPaid: null, date: this.getCurrentDate() };
      this.showToast('Purchase added', 'success');
    },

    startEdit(purchase) {
      this.editingId = purchase.id;
      this.editingPurchase = { ...purchase };
    },

    saveEdit(purchaseId) {
      const index = this.purchases.findIndex((p) => p.id === purchaseId);
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

    deletePurchase(purchaseId) {
      if (confirm('Delete this purchase?')) {
        this.purchases = this.purchases.filter((p) => p.id !== purchaseId);
        this.savePurchases();
        this.purchaseCache.clear();
        this.showToast('Purchase deleted', 'info');
      }
    },

    // Storage methods
    savePrice() {
      if (process.client) {
        localStorage.setItem('goldPrice', this.currentPrice);
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

    loadSavedData() {
      if (!process.client) return;
      try {
        const saved = localStorage.getItem('goldPrice');
        if (saved) {
          this.currentPrice = parseFloat(saved);
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
    },

    // Export methods
    exportData(format) {
      try {
        let content, filename, type;

        if (format === 'json') {
          content = JSON.stringify(this.purchases, null, 2);
          filename = `gold-tracker-${new Date().toISOString().split('T')[0]}.json`;
          type = 'application/json';
        } else if (format === 'csv') {
          // Create properly formatted table
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

          // Add summary row
          const summaryRow = [
            'TOTAL',
            this.purchases.reduce((sum, p) => sum + p.amount, 0).toFixed(2),
            '-',
            this.formatCurrency(this.totals.invested),
            this.formatCurrency(this.totals.currentValue),
            this.formatCurrency(Math.abs(this.totals.profit)),
            `${(this.totals.profit >= 0 ? '+' : '-')}${Math.abs(this.totals.profitPercent).toFixed(2)}%`,
            this.totals.profit >= 0 ? 'GAIN' : 'LOSS'
          ];

          // Helper function to escape CSV fields
          const escapeCSV = (field) => {
            if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
              return `"${field.replace(/"/g, '""')}"`;
            }
            return field;
          };

          // Create CSV content with proper table formatting
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

    // API methods
    handleRefresh() {
      if (!this.apiKey) return;
      this.fetchMetalPrice(true);
    },

    async fetchMetalPrice(userRequested = false) {
      if (!this.apiKey) {
        this.showToast('API key not configured', 'info');
        return;
      }

      this.isLoading = true;

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 8000);
      });

      try {
        const fetchPromise = fetch(`${this.apiBaseUrl}/XAU/USD`, {
          headers: {
            'x-access-token': this.apiKey,
            'Content-Type': 'application/json',
          },
          method: 'GET',
        });

        const response = await Promise.race([fetchPromise, timeoutPromise]);

        if (response.ok) {
          const data = await response.json();
          if (data && typeof data.price === 'number') {
            this.currentPrice = data.price;
            this.isApiPrice = true;
            this.lastUpdated = 'just now';
            this.savePrice();
            this.purchaseCache.clear();
            this.showToast('Price updated from API', 'success');
            this.isLoading = false;
            return;
          }
        }
        throw new Error(`API error: ${response.status}`);
      } catch (error) {
        console.error('API Error:', error);
        this.showToast('Failed to fetch price', 'error');
        this.isLoading = false;
      }
    },
  },

  mounted() {
    if (process.client) {
      this.loadSavedData();
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
  background: #fafafa;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0;
}

@media (max-width: 768px) {
  .container {
    max-width: 100%;
  }
}

.header {
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
  padding: 24px 32px;
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
  padding: 48px 32px;
}

.footer {
  background: #fff;
  border-top: 1px solid #e5e5e5;
  padding: 32px;
  text-align: center;
  color: #737373;
  font-size: 14px;
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

.input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  font-size: 15px;
  font-weight: 500;
  border: 1px solid #d4d4d4;
  border-radius: 6px;
  background: #fff;
  color: #1a1a1a;
  transition: all 0.2s;
}

.input:focus {
  outline: none;
  border-color: #1a1a1a;
}

.input::placeholder {
  color: #a3a3a3;
}

.input-sm {
  height: 36px;
  font-size: 14px;
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

.btn-ghost {
  background: transparent;
  color: #1a1a1a;
  border: 1px solid #e5e5e5;
}

.btn-ghost:hover:not(:disabled) {
  background: #fafafa;
  border-color: #d4d4d4;
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
  height: 32px;
  padding: 0;
  width: 32px;
  font-size: 18px;
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
  margin-bottom: 16px;
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

.quick-ref {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.ref-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 4px;
  font-size: 13px;
}

.ref-gram {
  font-weight: 500;
  color: #737373;
}

.ref-chi {
  font-weight: 600;
  color: #1a1a1a;
}

/* ============================================
   UNITS GRID
   ============================================ */
.units-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
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

/* ============================================
   PURCHASES LIST
   ============================================ */
.purchases-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 24px;
}

.sort-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.purchases-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.purchase-card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
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
  padding: 20px 24px;
  background: #fafafa;
  border-bottom: 1px solid #e5e5e5;
}

.purchase-date {
  font-size: 13px;
  font-weight: 500;
  color: #737373;
}

.purchase-amount {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.purchase-details {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 13px;
  font-weight: 500;
  color: #737373;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.detail-profit {
  padding-top: 16px;
  border-top: 1px solid #f5f5f5;
}

.detail-percent {
  font-size: 14px;
  font-weight: 600;
  text-align: right;
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
  padding: 20px 24px;
  display: flex;
  gap: 12px;
}

/* Edit Mode */
.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: #fafafa;
  border-bottom: 1px solid #e5e5e5;
}

.edit-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.edit-form {
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.edit-actions {
  padding: 20px 24px;
  display: flex;
  gap: 12px;
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
    flex-wrap: wrap;
    border-radius: 0;
  }

  .app-title {
    font-size: 18px;
  }

  .header-actions {
    justify-content: flex-end;
  }

  .main {
    padding: 32px 24px;
  }

  .section {
    margin-bottom: 48px;
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

  .quick-ref {
    grid-template-columns: 1fr;
  }

  .purchases-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .sort-control {
    width: 100%;
  }

  .purchase-card {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  .purchase-actions,
  .edit-actions {
    flex-direction: column;
  }

  .toast-container {
    left: 20px;
    right: 20px;
  }

  .toast {
    min-width: auto;
  }

  .footer {
    border-radius: 0;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 16px 20px;
    border-radius: 0;
  }

  .main {
    padding: 24px 20px;
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

  .footer {
    border-radius: 0;
  }
}
</style>