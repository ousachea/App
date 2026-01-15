<!-- pages/index.vue - GOLD TRACKER (WITH GRAM TO CHI CONVERTER) -->

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
          <button v-if="purchases.length > 0" @click="exportData('csv')" class="title-btn" title="Export CSV">⬇</button>
          <button v-if="apiKey && goldPrice > 0" @click="handleRefresh" :disabled="loading" class="title-refresh-btn"
            title="Refresh price from API">
            <span class="refresh-icon" :class="{ spinning: loading }">↻</span>
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="window-content">
        <main class="content">
          <!-- Hero Card - Custom Price Input -->
          <section class="hero-section">
            <div class="card hero-card">
              <div class="card-header">
                <h1 class="card-title">Gold Price</h1>
                <span class="price-source" :class="{ api: isApiPrice }">
                  {{ isApiPrice ? '📡 API' : '✋ Custom' }}
                </span>
              </div>

              <div class="card-content">
                <div class="price-display-section">
                  <div class="price-value">{{ formatCurrencyDisplay(currentPrice) }}</div>
                  <div class="price-label">per troy ounce</div>
                  <div class="price-breakdown">
                    <span class="breakdown-item">{{ formatCurrencyDisplay(currentPrice * DAMLUNG_TO_OZ) }} Damlung
                      (ដំឡឹង)</span>
                  </div>
                  <div class="price-meta">{{ lastUpdated }}</div>
                </div>

                <!-- Input Section -->
                <div class="price-input-section">
                  <div class="input-group">
                    <input v-model.number="manualPrice" type="number" step="0.01" placeholder="Enter gold price (USD)"
                      class="input price-input" inputmode="decimal" @keyup.enter="applyCustomPrice">
                    <button @click="applyCustomPrice" class="btn btn-primary">Use Price</button>
                  </div>
                  <div class="price-helper">
                    <span v-if="currentPrice > 0" class="helper-text">Current: {{ formatCurrencyDisplay(currentPrice)
                      }}</span>
                  </div>
                </div>

                <!-- API Setup -->
                <div class="api-setup-section">
                  <div v-if="!apiKey || apiKey === 'goldapi-3yrz5zhtl5zcyqg4-io'" class="setup-prompt">
                    <div class="setup-title">💡 Tip: Set up API for auto-updates</div>
                    <div class="setup-info">Try the demo key: <span class="demo-key">goldapi-3yrz5zhtl5zcyqg4-io</span>
                    </div>
                    <div class="setup-controls">
                      <button @click="toggleApiSetup" class="btn btn-secondary">Configure API</button>
                    </div>
                  </div>

                  <Transition name="expand">
                    <div v-if="showApiSetup" class="api-setup-form">
                      <div class="setup-input-group">
                        <label class="form-label">Gold API Key</label>
                        <div class="api-input-wrapper">
                          <input v-model="apiKeyInput" :type="showApiKey ? 'text' : 'password'"
                            placeholder="Get free key from goldapi.io" class="input">
                          <button @click="toggleApiKeyVisibility" class="icon-btn-small"
                            :title="showApiKey ? 'Hide' : 'Show'">
                            {{ showApiKey ? '👁️' : '👁️‍🗨️' }}
                          </button>
                        </div>
                        <div class="api-info">
                          <a href="https://www.goldapi.io" target="_blank" rel="noopener">Get free API key →</a>
                        </div>
                      </div>
                      <div class="setup-actions">
                        <button @click="saveApiKey" class="btn btn-primary">Save & Enable API</button>
                        <button @click="toggleApiSetup" class="btn btn-secondary">Cancel</button>
                      </div>
                    </div>
                  </Transition>

                  <div v-if="isApiPrice" class="api-active">
                    <div class="api-status">
                      <span class="status-dot"></span>
                      API Active • Last updated {{ lastUpdated }}
                    </div>
                    <div class="api-actions">
                      <button @click="handleRefresh" :disabled="loading" class="btn-small">
                        <span v-if="loading">Fetching...</span>
                        <span v-else>Refresh Price</span>
                      </button>
                      <button @click="removeApiKey" class="btn-small">Disable API</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Stats Grid -->
          <section v-if="purchases.length > 0" class="stats-section">
            <h2 class="section-title">Portfolio Overview</h2>
            <div class="portfolio-card">
              <div class="portfolio-row">
                <div class="portfolio-item">
                  <span class="portfolio-label">Total Invested</span>
                  <span class="portfolio-value">{{ memoizedTotalInvested }}</span>
                </div>
                <div class="portfolio-divider"></div>
                <div class="portfolio-item">
                  <span class="portfolio-label">Current Value</span>
                  <span class="portfolio-value">{{ memoizedCurrentValue }}</span>
                </div>
                <div class="portfolio-divider"></div>
                <div class="portfolio-item">
                  <span class="portfolio-label">Avg Cost/Chi</span>
                  <span class="portfolio-value">{{ memoizedAverageCostPerChi }}</span>
                </div>
              </div>
              <div class="portfolio-profit-row" :class="memoizedProfitLoss >= 0 ? 'gain' : 'loss'">
                <div class="profit-icon">{{ memoizedProfitLoss >= 0 ? '↑' : '↓' }}</div>
                <div class="profit-content">
                  <div class="profit-label">{{ memoizedProfitLoss >= 0 ? 'Gain' : 'Loss' }}</div>
                  <div class="profit-amount">{{ memoizedProfitLossDisplay }}</div>
                  <div class="profit-percent">{{ memoizedProfitChangePercent }}</div>
                </div>
              </div>
            </div>
          </section>

          <!-- Quick Calculator -->
          <section class="calculator-section">
            <h2 class="section-title">Quick Calculator</h2>
            <div class="card">
              <div class="card-content">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Amount</label>
                    <input v-model.number="calculatorAmount" type="number" min="0" step="0.1" placeholder="0"
                      class="input" inputmode="decimal">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Unit</label>
                    <select v-model="calculatorUnit" class="input">
                      <option value="chi">Chi (ជី)</option>
                      <option value="gram">Gram</option>
                      <option value="damlung">Damlung (ដំឡឹង)</option>
                      <option value="oz">Troy Ounce</option>
                    </select>
                  </div>
                  <Transition name="fade">
                    <div v-if="calculatorAmount > 0" class="result-display">
                      <div class="result-label">Equals</div>
                      <div class="result-value">{{ memoizedCalculatorResult }}</div>
                    </div>
                  </Transition>
                </div>
              </div>
            </div>
          </section>

          <!-- Gram to Chi Converter -->
          <section class="converter-section">
            <h2 class="section-title">Gram to Chi Converter</h2>
            <div class="card">
              <div class="card-content">
                <div class="converter-container">
                  <div class="converter-input-group">
                    <label class="form-label">Grams</label>
                    <input v-model.number="gramAmount" type="number" min="0" step="0.1" placeholder="0.00"
                      class="input converter-input" inputmode="decimal">
                  </div>
                  <div class="converter-arrow">→</div>
                  <div class="converter-output-group">
                    <label class="form-label">Chi (ជី)</label>
                    <div class="converter-output">{{ memoizedGramToChi }}</div>
                  </div>
                </div>
                <div class="converter-info">
                  <span class="info-label">Conversion Ratio:</span>
                  <span class="info-value">1 Chi = 3.75g</span>
                </div>
                <div class="converter-scale">
                  <div class="scale-row">
                    <span class="scale-label">3.75g</span>
                    <span class="scale-value">= 1 Chi</span>
                  </div>
                  <div class="scale-row">
                    <span class="scale-label">7.5g</span>
                    <span class="scale-value">= 2 Chi</span>
                  </div>
                  <div class="scale-row">
                    <span class="scale-label">18.75g</span>
                    <span class="scale-value">= 5 Chi</span>
                  </div>
                  <div class="scale-row">
                    <span class="scale-label">37.5g</span>
                    <span class="scale-value">= 10 Chi</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Conversions -->
          <section class="conversions-section">
            <h2 class="section-title">Price by Unit</h2>
            <div class="card">
              <div class="card-content">
                <div class="conversion-grid">
                  <div class="conversion-item">
                    <div class="conversion-label">Chi (ជី)</div>
                    <div class="conversion-value">{{ memoizedChiPrice }}</div>
                    <div class="conversion-unit">3.75g</div>
                  </div>
                  <div class="conversion-item">
                    <div class="conversion-label">Gram</div>
                    <div class="conversion-value">{{ memoizedGramPrice }}</div>
                    <div class="conversion-unit">1g</div>
                  </div>
                  <div class="conversion-item">
                    <div class="conversion-label">Damlung (ដំឡឹង)</div>
                    <div class="conversion-value">{{ memoizedDamlungPrice }}</div>
                    <div class="conversion-unit">37.5g</div>
                  </div>
                  <div class="conversion-item">
                    <div class="conversion-label">Troy Ounce</div>
                    <div class="conversion-value">{{ formatCurrencyDisplay(currentPrice) }}</div>
                    <div class="conversion-unit">31.1g</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Add Purchase -->
          <section class="purchase-section">
            <h2 class="section-title">Add Purchase</h2>
            <div class="card">
              <div class="card-content">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Amount (Chi)</label>
                    <input v-model.number="newPurchase.amount" type="number" step="0.01" min="0" placeholder="0.00"
                      class="input" inputmode="decimal">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Price (USD)</label>
                    <input v-model.number="newPurchase.totalPaid" type="number" step="0.01" min="0" placeholder="0.00"
                      class="input" inputmode="decimal">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Date</label>
                    <input v-model="newPurchase.date" type="date" class="input" :max="getCurrentDate()">
                  </div>
                </div>
                <button @click="addPurchase" :disabled="!canAddPurchase()" class="btn btn-primary">
                  Add Purchase
                </button>
              </div>
            </div>
          </section>

          <!-- Purchase History with Search & Filter -->
          <section v-if="purchases.length > 0" class="history-section">
            <div class="history-header">
              <h2 class="section-title">Purchase History</h2>
            </div>

            <!-- Search & Filter -->
            <div class="card filter-card">
              <div class="card-content">
                <div class="filter-controls">
                  <div class="filter-group">
                    <label class="form-label">Search</label>
                    <input v-model="filterText" type="text" placeholder="Search by date or amount..."
                      class="input search-input">
                  </div>

                  <div class="filter-group">
                    <label class="form-label">Date Range</label>
                    <div class="date-range">
                      <input v-model="filterDateFrom" type="date" class="input">
                      <span class="date-separator">to</span>
                      <input v-model="filterDateTo" type="date" class="input">
                    </div>
                  </div>

                  <div class="filter-group">
                    <label class="form-label">Sort</label>
                    <select v-model="sortBy" class="input">
                      <option value="date-desc">Newest First</option>
                      <option value="date-asc">Oldest First</option>
                      <option value="amount-desc">Highest Amount</option>
                      <option value="amount-asc">Lowest Amount</option>
                      <option value="profit-desc">Best Gain</option>
                      <option value="profit-asc">Worst Loss</option>
                    </select>
                  </div>

                  <button @click="clearFilters" class="btn btn-secondary" v-if="hasActiveFilters">
                    Clear Filters
                  </button>
                </div>

                <div class="filter-stats" v-if="filteredPurchases.length !== purchases.length">
                  <span class="stat-text">{{ filteredPurchases.length }} of {{ purchases.length }} purchases</span>
                </div>
              </div>
            </div>

            <!-- Purchases List -->
            <div class="purchases-list">
              <div v-if="filteredPurchases.length === 0" class="empty-state">
                <span class="empty-icon">🔍</span>
                <p class="empty-text">No purchases match your filters</p>
              </div>

              <div v-for="purchase in filteredPurchases" :key="purchase.id" class="purchase-card"
                :class="{ editing: editingId === purchase.id }">

                <!-- View Mode -->
                <template v-if="editingId !== purchase.id">
                  <div class="purchase-header">
                    <div class="purchase-date">{{ formatDate(purchase.date) }}</div>
                    <div class="purchase-amount">{{ purchase.amount }} CHI</div>
                  </div>

                  <div class="purchase-row">
                    <div class="purchase-item">
                      <span class="purchase-label">Total Paid</span>
                      <span class="purchase-value">{{ formatCurrencyDisplay(purchase.totalPaid) }}</span>
                    </div>
                    <div class="purchase-item">
                      <span class="purchase-label">Price per Chi</span>
                      <span class="purchase-value">{{ formatCurrencyDisplay(purchase.totalPaid / purchase.amount)
                        }}</span>
                    </div>
                    <div class="purchase-item">
                      <span class="purchase-label">Per Chi Today</span>
                      <span class="purchase-value">{{ getWorthTodayPerChiCached(purchase) }}</span>
                    </div>
                    <div class="purchase-item">
                      <span class="purchase-label">Worth Today</span>
                      <span class="purchase-value">{{ getWorthTodayTotalCached(purchase) }}</span>
                    </div>
                  </div>

                  <div class="purchase-footer" :class="getProfitClassCached(purchase.id)">
                    <div class="profit-info">
                      <div class="profit-label">{{ getProfitValueCached(purchase.id) >= 0 ? 'Gain' : 'Loss' }}</div>
                      <div class="profit-display">{{ getProfitDisplayCached(purchase.id) }}</div>
                      <div class="profit-percent">{{ getProfitPercentCached(purchase.id) }}</div>
                    </div>
                    <div class="purchase-actions">
                      <button @click="startEdit(purchase)" class="action-btn sm">Edit</button>
                      <button @click="deletePurchase(purchase.id)" class="action-btn sm danger">Delete</button>
                    </div>
                  </div>
                </template>

                <!-- Edit Mode -->
                <template v-else>
                  <div class="edit-mode">
                    <h3 class="edit-title">Edit Purchase</h3>
                    <div class="edit-form">
                      <div class="edit-field">
                        <label class="form-label">Date</label>
                        <input v-model="editingPurchase.date" type="date" class="input-small">
                      </div>
                      <div class="edit-field">
                        <label class="form-label">Amount (Chi)</label>
                        <input v-model.number="editingPurchase.amount" type="number" step="0.01" class="input-small">
                      </div>
                      <div class="edit-field">
                        <label class="form-label">Total Paid (USD)</label>
                        <input v-model.number="editingPurchase.totalPaid" type="number" step="0.01" class="input-small">
                      </div>
                    </div>
                    <div class="edit-actions">
                      <button @click="saveEdit(purchase.id)" class="action-btn success">Save</button>
                      <button @click="cancelEdit" class="action-btn">Cancel</button>
                    </div>
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
  name: 'GoldTrackerEnhanced',

  head() {
    return {
      title: 'Gold Tracker',
      meta: [
        { hid: 'description', name: 'description', content: 'Gold tracker with search, filters, and analytics' },
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

      // Price Management
      goldPrice: 0,
      manualPrice: null,
      isApiPrice: false,
      loading: false,
      lastUpdated: 'No price set',

      // API Config
      apiKey: '',
      apiKeyInput: '',
      showApiKey: false,
      showApiSetup: false,
      apiBaseUrl: 'https://www.goldapi.io/api',
      alternativeApiUrl: 'https://api.metals.live/v1/spot',

      // Calculator
      calculatorAmount: 1,
      calculatorUnit: 'chi',

      // Gram to Chi Converter
      gramAmount: 0,

      // Purchases
      purchases: [],
      newPurchase: {
        amount: null,
        totalPaid: null,
        date: new Date().toISOString().split('T')[0]
      },

      editingId: null,
      editingPurchase: null,

      // FILTER & SEARCH
      filterText: '',
      filterDateFrom: null,
      filterDateTo: null,
      sortBy: 'date-desc',

      // Caching
      cache: { gold: { data: null, timestamp: null } },
      fallbackPrice: 2200,
      purchaseCache: new Map(),
      formatCache: new Map(),

      // UI
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

    memoizedAverageCostPerChi() {
      if (this.purchases.length === 0) return '$0.00';
      const totalChi = this.purchases.reduce((sum, p) => sum + p.amount, 0);
      const totalInvested = this.purchases.reduce((sum, p) => sum + p.totalPaid, 0);
      if (totalChi === 0) return '$0.00';
      return this.formatCurrencyDisplay(totalInvested / totalChi);
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

    filteredPurchases() {
      let result = [...this.purchases];

      if (this.filterText.trim()) {
        const search = this.filterText.toLowerCase();
        result = result.filter(p => {
          const date = this.formatDate(p.date).toLowerCase();
          const amount = p.amount.toString();
          const paid = p.totalPaid.toString();
          return date.includes(search) || amount.includes(search) || paid.includes(search);
        });
      }

      if (this.filterDateFrom) {
        result = result.filter(p => p.date >= this.filterDateFrom);
      }
      if (this.filterDateTo) {
        result = result.filter(p => p.date <= this.filterDateTo);
      }

      result.sort((a, b) => {
        switch (this.sortBy) {
          case 'date-asc':
            return new Date(a.date) - new Date(b.date);
          case 'date-desc':
            return new Date(b.date) - new Date(a.date);
          case 'amount-asc':
            return a.amount - b.amount;
          case 'amount-desc':
            return b.amount - a.amount;
          case 'profit-desc':
            return this.getProfitValueCached(b.id) - this.getProfitValueCached(a.id);
          case 'profit-asc':
            return this.getProfitValueCached(a.id) - this.getProfitValueCached(b.id);
          default:
            return new Date(b.date) - new Date(a.date);
        }
      });

      return result;
    },

    hasActiveFilters() {
      return this.filterText || this.filterDateFrom || this.filterDateTo || this.sortBy !== 'date-desc';
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

    clearFilters() {
      this.filterText = '';
      this.filterDateFrom = null;
      this.filterDateTo = null;
      this.sortBy = 'date-desc';
      this.showToast('Filters cleared', 'info');
    },

    applyCustomPrice() {
      if (!this.manualPrice || this.manualPrice <= 0) {
        this.showToast('Enter a valid price', 'error');
        return;
      }
      this.goldPrice = this.manualPrice;
      this.isApiPrice = false;
      this.lastUpdated = 'just now (custom)';
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
      if (confirm('Disable API and use custom prices?')) {
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
          this.showToast('Failed to fetch price, use custom', 'error');
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
/* Gram to Chi Converter Styles */
.converter-section {
  padding: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.converter-container {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 16px;
}

.converter-input-group,
.converter-output-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.converter-input {
  padding: 10px 12px;
  font-size: 16px;
  font-weight: 600;
}

.converter-output {
  padding: 10px 12px;
  font-size: 18px;
  font-weight: 700;
  background: #f9f9f9;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  color: #1d1d1d;
  text-align: center;
}

.converter-arrow {
  font-size: 24px;
  color: #999;
  margin-bottom: 8px;
}

.converter-info {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #f0f7ff;
  border-radius: 6px;
  margin-bottom: 12px;
}

.info-label {
  font-size: 12px;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 14px;
  color: #1a73e8;
  font-weight: 700;
}

.converter-scale {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e5e5;
}

.scale-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 6px;
  text-align: center;
}

.scale-label {
  font-size: 12px;
  color: #999;
  font-weight: 600;
}

.scale-value {
  font-size: 14px;
  color: #1d1d1d;
  font-weight: 700;
}

/* Original Styles */
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #f5f5f5;
  color: #333;
  overflow-x: hidden;
  width: 100%;
}

body {
  position: fixed;
  height: 100vh;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

#__nuxt,
#__layout {
  width: 100%;
  height: 100%;
  display: flex;
}

.app {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 0;
  background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%);
  flex-direction: column;
}

@media (min-width: 769px) {
  body {
    position: static;
    height: auto;
  }

  .app {
    min-height: 100vh;
    padding: 20px;
    flex-direction: row;
  }
}

.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  pointer-events: none;
}

.toast {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  backdrop-filter: blur(10px);
}

.toast-success {
  background: rgba(52, 168, 83, 0.9);
}

.toast-error {
  background: rgba(255, 59, 48, 0.9);
}

.toast-icon {
  font-weight: 600;
}

.window {
  width: 100%;
  max-width: 1000px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
}

.title-bar {
  display: flex;
  align-items: center;
  height: 44px;
  background: linear-gradient(180deg, #f9f9f9 0%, #f5f5f5 100%);
  border-bottom: 1px solid #e5e5e5;
  padding: 0 16px;
  gap: 10px;
  flex-shrink: 0;
  z-index: 10;
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

.title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.title-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.title-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

.price-source {
  font-size: 11px;
  color: #999;
  padding: 4px 8px;
  border-radius: 4px;
  background: #f0f0f0;
}

.price-source.api {
  background: #d1fae5;
  color: #059669;
}

.title-refresh-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-refresh-btn:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

.title-refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon {
  display: inline-block;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.window-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
}

.content {
  padding: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.hero-section,
.stats-section,
.calculator-section,
.conversions-section,
.purchase-section,
.history-section,
.settings-section {
  padding: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1d;
  margin: 0 0 16px 0;
}

.card {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}

.card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-color: #d0d0d0;
}

.card-header {
  padding: 16px;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1d;
}

.card-content {
  padding: 16px;
}

.hero-card .card-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.price-display-section {
  text-align: center;
  padding: 16px 0;
}

.price-value {
  font-size: 48px;
  font-weight: 700;
  color: #1d1d1d;
  margin-bottom: 4px;
}

.price-label {
  font-size: 13px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.price-breakdown {
  font-size: 13px;
  color: #666;
  margin: 8px 0;
  padding: 8px;
  background: #D1E3FA;
  border-radius: 6px;
}

.breakdown-item {
  display: block;
  font-weight: 600;
}

.price-meta {
  font-size: 12px;
  color: #ccc;
  margin-top: 8px;
}

.price-input-section {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e5e5;
}

.input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.price-input {
  flex: 1;
  font-size: 16px;
  padding: 10px 12px;
}

.price-helper {
  font-size: 12px;
  color: #999;
  padding: 0 4px;
}

.api-setup-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setup-prompt {
  background: #fffbf0;
  border: 1px solid #ffe5cc;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.setup-title {
  font-size: 13px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 600;
}

.setup-info {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  padding: 8px;
  background: rgba(26, 115, 232, 0.05);
  border-radius: 4px;
  font-family: 'Monaco', 'Courier New', monospace;
}

.demo-key {
  color: #1a73e8;
  font-weight: 600;
  font-size: 11px;
}

.setup-controls {
  display: flex;
  gap: 6px;
}

.api-setup-form {
  background: #f0f7ff;
  border: 1px solid #b3e5fc;
  border-radius: 8px;
  padding: 12px;
}

.setup-input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.api-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.api-input-wrapper input {
  flex: 1;
}

.api-info {
  font-size: 11px;
  color: #666;
}

.api-info a {
  color: #1a73e8;
  text-decoration: none;
  font-weight: 600;
}

.setup-actions {
  display: flex;
  gap: 6px;
}

.setup-actions .btn {
  flex: 1;
}

.api-active {
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.api-status {
  font-size: 12px;
  color: #059669;
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.api-actions {
  display: flex;
  gap: 6px;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: #059669;
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

.filter-card {
  margin-bottom: 16px;
}

.filter-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.search-input {
  padding: 10px 12px;
  font-size: 13px;
}

.date-range {
  display: flex;
  gap: 8px;
  align-items: center;
}

.date-range input {
  flex: 1;
  padding: 8px 10px;
  font-size: 12px;
}

.date-separator {
  color: #999;
  font-size: 12px;
  white-space: nowrap;
}

.filter-stats {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e5e5;
  font-size: 12px;
  color: #999;
}

.stat-text {
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #999;
  text-transform: uppercase;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1d1d1d;
  margin-bottom: 4px;
}

.portfolio-card {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
}

.portfolio-row {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e5e5;
}

.portfolio-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.portfolio-label {
  font-size: 12px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.portfolio-value {
  font-size: 24px;
  font-weight: 700;
  color: #1d1d1d;
}

.portfolio-divider {
  width: 1px;
  height: 40px;
  background: #e5e5e5;
  margin: 0 20px;
}

.portfolio-profit-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f9f9f9;
}

.portfolio-profit-row.gain {
  background: #f0fdf4;
}

.portfolio-profit-row.loss {
  background: #fef2f2;
}

.profit-icon {
  font-size: 28px;
  font-weight: 700;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.portfolio-profit-row.gain .profit-icon {
  background: #d1fae5;
  color: #059669;
}

.portfolio-profit-row.loss .profit-icon {
  background: #fee2e2;
  color: #dc2626;
}

.profit-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profit-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.profit-amount {
  font-size: 28px;
  font-weight: 700;
}

.portfolio-profit-row.gain .profit-amount {
  color: #059669;
}

.portfolio-profit-row.loss .profit-amount {
  color: #dc2626;
}

.profit-percent {
  font-size: 13px;
  font-weight: 600;
}

.portfolio-profit-row.gain .profit-percent {
  color: #059669;
}

.portfolio-profit-row.loss .profit-percent {
  color: #dc2626;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  align-items: flex-end;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input {
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  transition: all 0.2s;
}

.input:focus {
  outline: none;
  border-color: #1a73e8;
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
}

.input-small {
  padding: 6px 10px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 12px;
  font-family: inherit;
}

.result-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: #f0f0f0;
  border-radius: 6px;
  text-align: center;
}

.result-label {
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.result-value {
  font-size: 20px;
  font-weight: 700;
  color: #1d1d1d;
}

.btn {
  padding: 8px 16px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  margin-top: 12px;
}

.btn-primary {
  background: #1a73e8;
  color: white;
  margin: 0;
}

.btn-primary:hover:not(:disabled) {
  background: #1765cc;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  border: 1px solid #e5e5e5;
}

.btn-secondary:hover {
  background: #e8e8e8;
}

.btn-small {
  padding: 4px 8px;
  background: #f0f0f0;
  color: #666;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
}

.btn-small:hover {
  background: #e8e8e8;
}

.icon-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

.icon-btn-small {
  width: 36px;
  height: 36px;
  padding: 0;
  background: #f0f0f0;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-btn-small:hover {
  background: #e8e8e8;
  border-color: #d0d0d0;
}

.button-group {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.conversion-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 16px;
}

.conversion-item {
  text-align: center;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
}

.conversion-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  font-weight: 600;
}

.conversion-value {
  font-size: 18px;
  font-weight: 700;
  color: #1d1d1d;
  margin-bottom: 4px;
}

.conversion-unit {
  font-size: 11px;
  color: #999;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.purchases-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.purchase-card {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}

.purchase-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-color: #d0d0d0;
}

.purchase-card.editing {
  background: #f0f7ff;
  border-color: #1a73e8;
}

.purchase-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e5e5;
  background: #f9f9f9;
}

.purchase-date {
  font-size: 13px;
  font-weight: 600;
  color: #666;
}

.purchase-amount {
  font-size: 14px;
  font-weight: 700;
  color: #1d1d1d;
}

.purchase-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e5e5;
}

.purchase-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.purchase-label {
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.purchase-value {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1d;
}

.purchase-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}

.profit-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.purchase-footer .profit-label {
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.profit-display {
  font-size: 16px;
  font-weight: 700;
}

.purchase-footer.profit .profit-display {
  color: #059669;
}

.purchase-footer.loss .profit-display {
  color: #dc2626;
}

.purchase-footer .profit-percent {
  font-size: 12px;
  font-weight: 600;
}

.purchase-footer.profit .profit-percent {
  color: #059669;
}

.purchase-footer.loss .profit-percent {
  color: #dc2626;
}

.purchase-actions {
  display: flex;
  gap: 6px;
}

.edit-mode {
  padding: 16px;
}

.edit-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1d;
}

.edit-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.edit-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.edit-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  padding: 6px 10px;
  background: #f0f0f0;
  color: #333;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.action-btn:hover {
  background: #e8e8e8;
  border-color: #d0d0d0;
}

.action-btn.sm {
  padding: 4px 8px;
  font-size: 10px;
}

.action-btn.danger:hover {
  background: #ffebee;
  border-color: #ef5350;
  color: #c62828;
}

.action-btn.success {
  background: #d1fae5;
  color: #059669;
  border-color: #a7f3d0;
}

.action-btn.success:hover {
  background: #a7f3d0;
  border-color: #6ee7b7;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.setting-value {
  font-size: 13px;
  color: #333;
  font-weight: 600;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}

@media (max-width: 1024px) {
  .window {
    max-width: 100%;
    border-radius: 0;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .filter-controls {
    grid-template-columns: 1fr;
  }

  .conversion-grid {
    grid-template-columns: 1fr 1fr;
  }

  .settings-grid {
    grid-template-columns: 1fr;
  }

  .converter-container {
    flex-direction: column;
    gap: 8px;
  }

  .converter-arrow {
    transform: rotate(90deg);
    margin: -4px 0;
  }
}

@media (max-width: 768px) {
  .app {
    padding: 0;
    align-items: stretch;
  }

  .window {
    border-radius: 0;
    max-width: 100%;
    height: 100vh;
    max-height: 100vh;
  }

  .window-content {
    max-height: calc(100vh - 44px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .hero-section,
  .stats-section,
  .calculator-section,
  .conversions-section,
  .purchase-section,
  .history-section,
  .settings-section,
  .converter-section {
    padding: 12px 12px;
    border-bottom: 1px solid #f0f0f0;
  }

  .section-title {
    font-size: 15px;
    font-weight: 600;
    margin: 0 0 12px 0;
  }

  .card-header {
    padding: 10px 12px;
  }

  .card-title {
    font-size: 14px;
  }

  .card-content {
    padding: 12px;
  }

  .hero-card .card-content {
    padding: 12px;
    gap: 12px;
  }

  .price-display-section {
    padding: 8px 0;
  }

  .price-value {
    font-size: 40px;
    margin-bottom: 2px;
  }

  .price-label {
    font-size: 12px;
  }

  .price-breakdown {
    font-size: 32px;
    margin: 12px 0;
    padding: 12px;
  }

  .price-meta {
    font-size: 11px;
    margin-top: 4px;
  }

  .price-input-section {
    padding: 12px;
    border: 1px solid #e5e5e5;
  }

  .input-group {
    gap: 6px;
  }

  .price-input {
    padding: 10px;
    font-size: 16px;
  }

  .price-helper {
    font-size: 11px;
  }

  .setup-prompt {
    padding: 10px;
    border-radius: 6px;
  }

  .setup-title {
    font-size: 12px;
    margin-bottom: 6px;
  }

  .api-setup-form {
    padding: 10px;
  }

  .setup-input-group {
    gap: 6px;
  }

  .api-input-wrapper {
    gap: 6px;
  }

  .setup-actions {
    gap: 4px;
    flex-direction: column;
  }

  .setup-actions .btn {
    width: 100%;
    padding: 8px 10px;
    font-size: 12px;
  }

  .api-active {
    padding: 10px;
    gap: 8px;
    flex-direction: column;
    align-items: flex-start;
  }

  .api-actions {
    width: 100%;
    display: flex;
    gap: 6px;
  }

  .api-actions .btn-small {
    flex: 1;
  }

  .portfolio-row {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
  }

  .portfolio-divider {
    display: none;
  }

  .portfolio-item {
    width: 100%;
  }

  .portfolio-label {
    font-size: 11px;
  }

  .portfolio-value {
    font-size: 20px;
  }

  .portfolio-profit-row {
    padding: 12px;
    gap: 12px;
  }

  .profit-icon {
    width: 40px;
    height: 40px;
    font-size: 24px;
  }

  .profit-amount {
    font-size: 22px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .form-group {
    gap: 4px;
  }

  .form-label {
    font-size: 11px;
    margin-bottom: 4px;
  }

  .input,
  .input-small {
    padding: 10px;
    font-size: 16px;
    border-radius: 6px;
  }

  .filter-card {
    margin-bottom: 12px;
  }

  .filter-controls {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .filter-group {
    gap: 4px;
  }

  .search-input {
    padding: 10px;
    font-size: 14px;
  }

  .date-range {
    flex-direction: column;
    gap: 6px;
  }

  .date-range input {
    width: 100%;
    padding: 10px;
    font-size: 14px;
  }

  .date-separator {
    display: none;
  }

  .filter-stats {
    margin-top: 8px;
    padding-top: 8px;
    font-size: 11px;
  }

  .result-display {
    padding: 10px;
    border-radius: 6px;
  }

  .result-label {
    font-size: 10px;
  }

  .result-value {
    font-size: 18px;
  }

  .conversion-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .conversion-item {
    padding: 10px;
  }

  .conversion-label {
    font-size: 11px;
    margin-bottom: 3px;
  }

  .conversion-value {
    font-size: 16px;
    margin-bottom: 3px;
  }

  .conversion-unit {
    font-size: 10px;
  }

  .converter-container {
    flex-direction: column;
    gap: 12px;
  }

  .converter-input-group,
  .converter-output-group {
    flex: 1;
  }

  .converter-arrow {
    transform: rotate(90deg);
    margin: -4px 0;
  }

  .converter-scale {
    grid-template-columns: 1fr 1fr;
  }

  .converter-info {
    flex-direction: column;
    text-align: center;
  }

  .btn {
    padding: 10px 12px;
    font-size: 13px;
    border-radius: 6px;
    width: 100%;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }

  .btn-small {
    padding: 6px 10px;
    font-size: 11px;
  }

  .icon-btn {
    width: 32px;
    height: 32px;
  }

  .icon-btn-small {
    width: 40px;
    height: 40px;
  }

  .button-group {
    gap: 6px;
    margin-top: 10px;
    flex-direction: column;
  }

  .button-group .btn {
    width: 100%;
  }

  .purchase-card {
    border-radius: 6px;
  }

  .purchase-header {
    padding: 10px 12px;
    gap: 8px;
  }

  .purchase-date {
    font-size: 12px;
  }

  .purchase-amount {
    font-size: 13px;
  }

  .purchase-row {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 10px 12px;
  }

  .purchase-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .purchase-label {
    font-size: 10px;
  }

  .purchase-value {
    font-size: 13px;
    text-align: right;
  }

  .purchase-footer {
    flex-direction: column;
    gap: 10px;
    padding: 10px 12px;
    align-items: flex-start;
  }

  .purchase-actions {
    width: 100%;
    gap: 4px;
  }

  .action-btn {
    flex: 1;
    padding: 8px 10px;
    font-size: 11px;
  }

  .action-btn.sm {
    padding: 8px 10px;
    flex: 1;
  }

  .edit-mode {
    padding: 12px;
  }

  .edit-title {
    font-size: 13px;
    margin-bottom: 10px;
  }

  .edit-form {
    grid-template-columns: 1fr;
    gap: 10px;
    margin-bottom: 10px;
  }

  .edit-field {
    gap: 4px;
  }

  .edit-actions {
    gap: 6px;
    width: 100%;
  }

  .edit-actions .action-btn {
    width: 100%;
  }

  .settings-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .settings-content {
    gap: 10px;
  }

  .setting-item {
    padding: 8px 0;
    flex-direction: column;
    align-items: flex-start;
  }

  .setting-value {
    margin-top: 4px;
  }

  .empty-state {
    padding: 30px 20px;
  }

  .empty-icon {
    font-size: 40px;
    margin-bottom: 10px;
  }

  .empty-text {
    font-size: 13px;
  }

  .toast-container {
    top: 10px;
    right: 10px;
    left: 10px;
  }

  .toast {
    width: 100%;
    font-size: 12px;
    padding: 10px 12px;
  }
}

@media (max-width: 480px) {
  .app {
    padding: 0;
  }

  .title-bar {
    height: 38px;
    padding: 0 10px;
    gap: 4px;
  }

  .traffic-lights {
    gap: 4px;
  }

  .light {
    width: 9px;
    height: 9px;
  }

  .title {
    font-size: 11px;
    font-weight: 600;
  }

  .title-buttons {
    gap: 4px;
  }

  .title-btn {
    width: 24px;
    height: 24px;
    font-size: 12px;
    padding: 0;
  }

  .title-refresh-btn {
    width: 24px;
    height: 24px;
    font-size: 12px;
    padding: 0;
  }

  .price-source {
    font-size: 10px;
    padding: 2px 6px;
  }

  .hero-section,
  .stats-section,
  .calculator-section,
  .conversions-section,
  .purchase-section,
  .history-section,
  .settings-section,
  .converter-section {
    padding: 10px 10px;
  }

  .section-title {
    font-size: 14px;
    margin-bottom: 10px;
  }

  .card-header {
    padding: 10px;
  }

  .card-title {
    font-size: 13px;
  }

  .card-content {
    padding: 10px;
  }

  .hero-card .card-content {
    padding: 10px;
    gap: 10px;
  }

  .price-display-section {
    padding: 6px 0;
  }

  .price-value {
    font-size: 32px;
    margin-bottom: 2px;
  }

  .price-label {
    font-size: 10px;
  }

  .price-breakdown {
    font-size: 11px;
    margin: 4px 0;
    padding: 4px;
  }

  .price-meta {
    font-size: 10px;
    margin-top: 2px;
  }

  .price-input-section {
    padding: 10px;
  }

  .input-group {
    flex-direction: column;
    gap: 6px;
  }

  .btn-primary {
    width: 100%;
  }

  .price-input {
    width: 100%;
    padding: 10px;
  }

  .price-helper {
    font-size: 10px;
  }

  .setup-prompt {
    padding: 8px;
  }

  .setup-title {
    font-size: 11px;
  }

  .setup-info {
    font-size: 10px;
    margin-bottom: 6px;
  }

  .demo-key {
    font-size: 9px;
  }

  .api-setup-form {
    padding: 8px;
  }

  .api-input-wrapper {
    gap: 4px;
  }

  .api-info {
    font-size: 10px;
  }

  .portfolio-row {
    padding: 10px;
    gap: 10px;
  }

  .portfolio-value {
    font-size: 18px;
  }

  .portfolio-profit-row {
    padding: 10px;
  }

  .profit-icon {
    width: 36px;
    height: 36px;
    font-size: 20px;
  }

  .profit-content {
    gap: 2px;
  }

  .profit-label {
    font-size: 10px;
  }

  .profit-amount {
    font-size: 18px;
  }

  .profit-percent {
    font-size: 11px;
  }

  .form-row {
    gap: 8px;
  }

  .form-label {
    font-size: 10px;
    margin-bottom: 3px;
  }

  .input {
    padding: 9px;
    font-size: 16px;
  }

  .filter-controls {
    gap: 8px;
  }

  .search-input {
    font-size: 14px;
  }

  .date-range input {
    font-size: 14px;
    padding: 9px;
  }

  .conversion-grid {
    gap: 8px;
  }

  .conversion-item {
    padding: 8px;
  }

  .conversion-value {
    font-size: 14px;
  }

  .converter-scale {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .converter-container {
    gap: 10px;
  }

  .purchase-header {
    padding: 9px 10px;
  }

  .purchase-date {
    font-size: 11px;
  }

  .purchase-amount {
    font-size: 12px;
  }

  .purchase-row {
    padding: 9px 10px;
    gap: 8px;
  }

  .purchase-label {
    font-size: 9px;
  }

  .purchase-value {
    font-size: 12px;
  }

  .purchase-footer {
    padding: 9px 10px;
    gap: 8px;
  }

  .purchase-actions {
    gap: 3px;
  }

  .action-btn {
    padding: 6px 8px;
    font-size: 10px;
  }

  .btn {
    padding: 9px 10px;
    font-size: 12px;
  }

  .btn-small {
    padding: 5px 8px;
    font-size: 10px;
  }

  .icon-btn-small {
    width: 36px;
    height: 36px;
  }

  .setting-label {
    font-size: 12px;
  }

  .setting-value {
    font-size: 12px;
  }

  .edit-form {
    gap: 8px;
  }

  .edit-mode {
    padding: 10px;
  }

  .edit-title {
    font-size: 12px;
  }

  .toast {
    font-size: 11px;
    padding: 8px 10px;
    border-radius: 6px;
  }

  .toast-icon {
    font-size: 12px;
  }
}
</style>