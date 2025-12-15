<!-- pages/index.vue - GOLD TRACKER SINGLE PAGE (NO TABS) -->

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
        <button @click="handleRefresh" :disabled="loading || isRefreshDisabled" class="title-refresh-btn">
          <span class="refresh-icon" :class="{ spinning: loading }">↻</span>
        </button>
      </div>

      <!-- Main Content (No Sidebar) -->
      <div class="window-content">
        <main class="content">
          <!-- Hero Card -->
          <section class="hero-section">
            <div class="card hero-card">
              <div class="card-header">
                <h1 class="card-title">Current Gold Price</h1>
                <button @click="toggleCustomPriceMode" :class="['icon-btn', { active: isManualMode }]"
                  title="Custom price">
                  ⚙
                </button>
              </div>

              <div class="card-content">
                <div v-if="loading" class="loader-section">
                  <div class="loader"></div>
                  <div class="loader-text">Updating price...</div>
                </div>
                <div v-else class="price-section">
                  <div class="price-value">{{ formatCurrencyDisplay(currentPrice) }}</div>
                  <div class="price-label">per troy ounce</div>
                  <div class="price-meta">{{ lastUpdated }}</div>
                </div>

                <Transition name="expand">
                  <div v-if="isManualMode" class="custom-price-input">
                    <input v-model.number="manualPrice" type="number" step="0.01" placeholder="Enter custom price"
                      class="input">
                    <button @click="clearManualPrice" class="btn-small">Reset</button>
                  </div>
                </Transition>
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

          <!-- Purchase History -->
          <section v-if="purchases.length > 0" class="history-section">
            <div class="history-header">
              <h2 class="section-title">Purchase History</h2>
              <button @click="exportData('csv')" class="icon-btn" title="Export CSV">⬇</button>
            </div>
            <div class="purchases-list">
              <div v-for="purchase in purchases" :key="purchase.id" class="purchase-card"
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

          <!-- Settings -->
          <section class="settings-section">
            <h2 class="section-title">Settings</h2>
            <div class="settings-grid">
              <div class="card">
                <div class="card-header">
                  <h3 class="card-title">API Configuration</h3>
                </div>
                <div class="card-content settings-content">
                  <div class="setting-group">
                    <label class="form-label">Gold API Key</label>
                    <div class="api-input-wrapper">
                      <input v-model="apiKeyInput" type="password" placeholder="Enter your API key..."
                        class="input api-input">
                      <button @click="toggleApiKeyVisibility" class="icon-btn-small"
                        :title="showApiKey ? 'Hide' : 'Show'">
                        {{ showApiKey ? '👁️' : '👁️‍🗨️' }}
                      </button>
                    </div>
                    <div class="api-info">
                      <div class="info-text">Get your free API key from <a href="https://www.goldapi.io" target="_blank"
                          rel="noopener">goldapi.io</a></div>
                    </div>
                    <button @click="saveApiKey" class="btn btn-secondary">Update API Key</button>
                  </div>
                </div>
              </div>

              <div class="card">
                <div class="card-header">
                  <h3 class="card-title">API Status</h3>
                </div>
                <div class="card-content settings-content">
                  <div class="setting-item">
                    <span class="setting-label">Daily Limit</span>
                    <span class="setting-value">{{ apiQuota.dailyLimit }} calls</span>
                  </div>
                  <div class="setting-item">
                    <span class="setting-label">Used Today</span>
                    <span class="setting-value">{{ apiQuota.dailyCalls }} / {{ apiQuota.dailyLimit }}</span>
                  </div>
                </div>
              </div>

              <div class="card">
                <div class="card-header">
                  <h3 class="card-title">Data</h3>
                </div>
                <div class="card-content settings-content">
                  <div class="setting-item">
                    <span class="setting-label">Total Purchases</span>
                    <span class="setting-value">{{ purchases.length }}</span>
                  </div>
                  <div class="setting-item">
                    <span class="setting-label">Storage Used</span>
                    <span class="setting-value">{{ (JSON.stringify(purchases).length / 1024).toFixed(2) }} KB</span>
                  </div>
                  <div class="button-group">
                    <button @click="exportData('csv')" class="btn btn-secondary">Export CSV</button>
                    <button @click="exportData('json')" class="btn btn-secondary">Export JSON</button>
                  </div>
                </div>
              </div>

              <div class="card">
                <div class="card-header">
                  <h3 class="card-title">About</h3>
                </div>
                <div class="card-content settings-content">
                  <div class="setting-item">
                    <span class="setting-label">Version</span>
                    <span class="setting-value">3.2.0</span>
                  </div>
                  <div class="setting-item">
                    <span class="setting-label">Updated</span>
                    <span class="setting-value">{{ lastUpdated }}</span>
                  </div>
                </div>
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
  name: 'GoldTrackerSinglePage',

  head() {
    return {
      title: 'Gold Tracker',
      meta: [
        { hid: 'description', name: 'description', content: 'macOS-style gold tracker' },
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
      GRAM_TO_OZ: 1 / 31.1035,
      DAMLUNG_TO_OZ: 37.5 / 31.1035,

      apiKey: 'goldapi-3yrz5zhtl5zcyqg4-io',
      apiKeyInput: '',
      showApiKey: false,
      apiBaseUrl: 'https://www.goldapi.io/api',
      alternativeApiUrl: 'https://api.metals.live/v1/spot',

      goldPrice: 0,
      loading: true,
      lastUpdated: 'Loading...',
      refreshCooldown: 0,
      isManualMode: false,
      manualPrice: null,

      calculatorAmount: 1,
      calculatorUnit: 'chi',

      purchases: [],
      newPurchase: {
        amount: null,
        totalPaid: null,
        date: new Date().toISOString().split('T')[0]
      },

      editingId: null,
      editingPurchase: null,

      apiQuota: {
        dailyCalls: 0,
        lastCallDate: null,
        dailyLimit: 10
      },

      cache: { gold: { data: null, timestamp: null } },
      fallbackPrice: 4000,

      lastCalculatedPrice: null,
      portfolioCache: { invested: null, current: null, profit: null },
      purchaseCache: new Map(),
      formatCache: new Map(),

      toasts: [],
      toastId: 0
    };
  },

  computed: {
    currentPrice() {
      if (this.isManualMode && this.manualPrice) return this.manualPrice;
      return this.goldPrice;
    },

    isRefreshDisabled() {
      return this.apiQuota.dailyCalls >= this.apiQuota.dailyLimit;
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
      this.showToast('API key updated successfully', 'success');
    },

    toggleCustomPriceMode() {
      this.isManualMode ? this.clearManualPrice() : this.enableManualMode();
    },

    enableManualMode() {
      this.isManualMode = true;
      this.manualPrice = this.currentPrice || 4242;
    },

    clearManualPrice() {
      this.isManualMode = false;
      this.manualPrice = null;
      if (process.client) localStorage.removeItem('manualPrice');
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
      this.portfolioCache = { invested: null, current: null, profit: null };
      this.purchaseCache.clear();
      this.newPurchase = { amount: null, totalPaid: null, date: new Date().toISOString().split('T')[0] };
      this.showToast('Purchase added', 'success');
    },

    deletePurchase(purchaseId) {
      if (confirm('Delete this purchase?')) {
        this.purchases = this.purchases.filter(p => p.id !== purchaseId);
        this.savePurchases();
        this.portfolioCache = { invested: null, current: null, profit: null };
        this.purchaseCache.clear();
        this.showToast('Purchase deleted', 'info');
      }
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

    startRefreshCooldown() {
      this.refreshCooldown = 3;
      const timer = setInterval(() => {
        this.refreshCooldown--;
        if (this.refreshCooldown <= 0) clearInterval(timer);
      }, 1000);
    },

    async handleRefresh() {
      if (this.isRefreshDisabled || this.refreshCooldown > 0) return;
      await this.fetchMetalPrice(true);
      this.startRefreshCooldown();
    },

    async tryAlternativeApi() {
      try {
        const response = await fetch(this.alternativeApiUrl);
        if (!response.ok) throw new Error('Failed');
        const data = await response.json();
        if (data && typeof data.gold === 'number') {
          this.goldPrice = data.gold;
          this.lastUpdated = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          if (process.client) localStorage.setItem('goldPrice', this.goldPrice);
          return true;
        }
      } catch (e) {
        console.error('Alternative API failed');
      }
      return false;
    },

    async fetchMetalPrice(userRequested = false) {
      const now = new Date();
      const cached = this.cache.gold;
      const cacheAge = cached.timestamp ? (now - new Date(cached.timestamp)) / (1000 * 60 * 60) : 999;

      if (cached.data && cacheAge < 24) {
        this.goldPrice = cached.data.price;
        this.lastUpdated = cacheAge > 1 ? `${Math.floor(cacheAge)}h ago` : 'just now';
        this.loading = false;
        return;
      }

      const today = new Date().toDateString();
      if (this.apiQuota.lastCallDate !== today) {
        this.apiQuota.dailyCalls = 0;
        this.apiQuota.lastCallDate = today;
      }

      if (this.apiQuota.dailyCalls >= this.apiQuota.dailyLimit) {
        if (!userRequested && cached.data) {
          this.goldPrice = cached.data.price;
          this.lastUpdated = 'Cached';
        } else if (!userRequested) {
          this.goldPrice = this.fallbackPrice;
          this.lastUpdated = 'Offline';
        }
        this.loading = false;
        return;
      }

      this.loading = true;

      // Create a timeout promise
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
            this.apiQuota.dailyCalls++;
            this.cache.gold = { data, timestamp: now.toISOString() };
            this.lastUpdated = 'just now';
            if (process.client) localStorage.setItem('goldPrice', this.goldPrice);
            this.portfolioCache = { invested: null, current: null, profit: null };
            this.loading = false;
            this.showToast('Price updated', 'success');
            return;
          }
        }
        throw new Error(`API error: ${response.status}`);
      } catch (error) {
        console.error('Primary API Error:', error);
        const altSuccess = await this.tryAlternativeApi();
        if (!altSuccess) {
          if (cached.data) {
            this.goldPrice = cached.data.price;
            this.lastUpdated = 'Cached';
            this.showToast('Using cached price', 'info');
          } else {
            this.goldPrice = this.fallbackPrice;
            this.lastUpdated = 'Offline';
            this.showToast('Using offline price', 'info');
          }
        }
        this.loading = false;
      }
    },

    loadSavedData() {
      if (!process.client) return false;
      try {
        const saved = localStorage.getItem('goldPrice');
        if (saved) this.goldPrice = parseFloat(saved);

        const savedManual = localStorage.getItem('manualPrice');
        if (savedManual) {
          this.isManualMode = true;
          this.manualPrice = parseFloat(savedManual);
        }

        const savedApiKey = localStorage.getItem('apiKey');
        if (savedApiKey) {
          this.apiKey = savedApiKey;
        }

        this.loadPurchases();
        return !!saved;
      } catch (e) {
        return false;
      }
    }
  },

  mounted() {
    const hasData = this.loadSavedData();
    if (!hasData) {
      this.fetchMetalPrice(false);
    }
  }
}
</script>

<style scoped>
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
}

#__nuxt,
#__layout {
  width: 100%;
  height: 100%;
}

/* App */
.app {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%);
}

/* Toast Notifications */
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

/* macOS Window */
.window {
  width: 100%;
  max-width: 1000px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Title Bar */
.title-bar {
  display: flex;
  align-items: center;
  height: 44px;
  background: linear-gradient(180deg, #f9f9f9 0%, #f5f5f5 100%);
  border-bottom: 1px solid #e5e5e5;
  padding: 0 16px;
  gap: 10px;
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

/* Main Content */
.window-content {
  flex: 1;
  overflow-y: auto;
}

.content {
  padding: 0;
  display: flex;
  flex-direction: column;
}

/* Sections */
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

.hero-section {
  background: white;
}

.stats-section {
  background: white;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1d;
  margin: 0 0 16px 0;
}

/* Cards */
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

/* Hero Card */
.hero-card .card-content {
  padding: 24px;
}

.price-section {
  text-align: center;
  padding: 20px 0;
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

.price-meta {
  font-size: 12px;
  color: #ccc;
  margin-top: 8px;
}

.loader {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e5e5;
  border-top: 3px solid #1a73e8;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 20px auto;
}

.loader-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
}

.loader-text {
  font-size: 13px;
  color: #666;
  margin-top: 12px;
  font-weight: 500;
}

.custom-price-input {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.custom-price-input input {
  flex: 1;
}

/* Stats Grid */
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

.stat-card.profit .stat-value {
  color: #34a853;
}

.stat-card.loss .stat-value {
  color: #ea4335;
}

.stat-change {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

/* Portfolio Card */
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

/* Forms */
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

/* Buttons */
.btn {
  padding: 8px 16px;
  margin: 12px 0 0 0;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-primary {
  background: #1a73e8;
  color: white;
  width: 100%;
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
  flex: 1;
}

.btn-secondary:hover {
  background: #e8e8e8;
}

.btn-small {
  padding: 6px 12px;
  background: #f0f0f0;
  color: #333;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 11px;
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

.icon-btn.active {
  background: #e3f2fd;
  color: #1a73e8;
}

.button-group {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.header-buttons {
  display: flex;
  gap: 8px;
}

/* Search */
.search-box {
  position: relative;
  flex: 1;
}

/* Conversions */
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

/* Purchase History */
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

/* Edit Mode */
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

/* Old Table Styles (kept for reference, can be removed) */

/* Settings */
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

.api-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.api-input {
  flex: 1;
}

.icon-btn-small {
  width: 36px;
  height: 36px;
  padding: 0;
  background: #f0f0f0;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
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

.api-info {
  background: #f9f9f9;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #e5e5e5;
}

.info-text {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.info-text a {
  color: #1a73e8;
  text-decoration: none;
  font-weight: 600;
}

.info-text a:hover {
  text-decoration: underline;
}

/* Transitions */
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

/* Scrollbar */
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

/* Responsive */
@media (max-width: 1024px) {
  .window {
    max-width: 100%;
    border-radius: 0;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .result-display {
    margin-top: 8px;
  }

  .conversion-grid {
    grid-template-columns: 1fr 1fr;
  }

  .settings-grid {
    grid-template-columns: 1fr;
  }

  .data-table {
    font-size: 12px;
  }

  .data-table th,
  .data-table td {
    padding: 10px 8px;
  }
}

@media (max-width: 640px) {
  .app {
    padding: 0;
  }

  .window {
    max-height: 100vh;
    border-radius: 0;
  }

  .title-bar {
    height: 40px;
    padding: 0 12px;
  }

  .traffic-lights {
    gap: 6px;
  }

  .light {
    width: 10px;
    height: 10px;
  }

  .title {
    font-size: 12px;
  }

  .title-refresh-btn {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }

  .hero-section,
  .stats-section,
  .calculator-section,
  .conversions-section,
  .purchase-section,
  .history-section,
  .settings-section {
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
  }

  .section-title {
    font-size: 14px;
    margin-bottom: 12px;
  }

  .card-header {
    padding: 12px;
  }

  .card-title {
    font-size: 14px;
  }

  .card-content {
    padding: 12px;
  }

  .hero-card .card-content {
    padding: 12px;
  }

  .price-value {
    font-size: 36px;
  }

  .price-label {
    font-size: 11px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 12px;
  }

  .stat-label {
    font-size: 11px;
  }

  .stat-value {
    font-size: 24px;
  }

  .portfolio-row {
    flex-direction: column;
    gap: 12px;
    padding: 16px;
  }

  .portfolio-divider {
    width: 100%;
    height: 1px;
    margin: 0;
  }

  .portfolio-item {
    width: 100%;
  }

  .portfolio-value {
    font-size: 20px;
  }

  .portfolio-profit-row {
    padding: 16px;
  }

  .profit-icon {
    width: 40px;
    height: 40px;
    font-size: 24px;
  }

  .profit-amount {
    font-size: 24px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .form-label {
    font-size: 11px;
    margin-bottom: 4px;
  }

  .input {
    padding: 10px;
    font-size: 14px;
    border-radius: 6px;
  }

  .btn {
    padding: 10px 14px;
    font-size: 13px;
    border-radius: 6px;
  }

  .result-display {
    padding: 10px;
    margin-top: 8px;
  }

  .result-value {
    font-size: 18px;
  }

  .conversion-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .conversion-item {
    padding: 16px;
  }

  .conversion-value {
    font-size: 16px;
  }

  .settings-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .settings-content {
    gap: 12px;
  }

  .setting-item {
    padding: 10px 0;
    flex-direction: column;
    align-items: flex-start;
  }

  .setting-value {
    margin-top: 4px;
  }

  .api-input-wrapper {
    width: 100%;
  }

  .api-input {
    width: 100%;
  }

  .icon-btn-small {
    width: 40px;
    height: 40px;
  }

  /* Table on mobile */
  .table-wrapper {
    border-radius: 6px;
    border: 1px solid #e5e5e5;
  }

  .data-table {
    font-size: 12px;
    width: 100%;
  }

  .data-table th {
    padding: 10px 8px;
    font-size: 10px;
  }

  .data-table td {
    padding: 10px 8px;
    font-size: 12px;
  }

  .edit-row {
    flex-direction: column;
    gap: 6px;
  }

  .edit-row input {
    padding: 8px 10px;
    font-size: 13px;
  }

  .actions-cell {
    gap: 3px;
  }

  .action-btn {
    padding: 6px 8px;
    font-size: 10px;
    white-space: nowrap;
  }

  .history-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 12px;
  }

  .purchases-list {
    gap: 10px;
  }

  .purchase-card {
    border-radius: 6px;
  }

  .purchase-header {
    padding: 10px 12px;
  }

  .purchase-date {
    font-size: 12px;
  }

  .purchase-amount {
    font-size: 13px;
  }

  .purchase-row {
    flex-direction: column;
    gap: 12px;
    padding: 10px 12px;
  }

  .purchase-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .purchase-label {
    font-size: 11px;
  }

  .purchase-value {
    font-size: 13px;
    text-align: right;
  }

  .purchase-footer {
    flex-direction: column;
    gap: 10px;
    padding: 10px 12px;
  }

  .purchase-actions {
    width: 100%;
  }

  .action-btn.sm {
    flex: 1;
    padding: 6px 8px;
  }

  .edit-mode {
    padding: 12px;
  }

  .edit-form {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .edit-actions {
    gap: 6px;
  }

  .edit-actions .action-btn {
    flex: 1;
  }

  .custom-price-input {
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
  }

  .custom-price-input input {
    width: 100%;
  }

  .custom-price-input button {
    width: 100%;
  }

  .loader {
    width: 32px;
    height: 32px;
  }

  /* Toast on mobile */
  .toast-container {
    top: 12px;
    right: 12px;
    left: 12px;
  }

  .toast {
    width: 100%;
    font-size: 12px;
  }
}
</style>