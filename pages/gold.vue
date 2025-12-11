<!-- pages/index.vue - GOLD TRACKER WITH MacOS DESIGN -->

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
        <div class="spacer"></div>
      </div>

      <!-- Main Content -->
      <div class="window-content">
        <!-- Sidebar -->
        <aside class="sidebar">
          <nav class="nav-menu">
            <button class="nav-item" :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">
              <span class="nav-icon">◆</span>
              <span class="nav-label">Overview</span>
            </button>
            <button class="nav-item" :class="{ active: activeTab === 'convert' }" @click="activeTab = 'convert'">
              <span class="nav-icon">⇄</span>
              <span class="nav-label">Convert</span>
            </button>
            <button class="nav-item" :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">
              <span class="nav-icon">⊟</span>
              <span class="nav-label">History</span>
            </button>
            <button class="nav-item" :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">
              <span class="nav-icon">⚙</span>
              <span class="nav-label">Settings</span>
            </button>
          </nav>

          <div class="sidebar-footer">
            <button @click="handleRefresh" :disabled="loading || isRefreshDisabled" class="refresh-btn">
              <span class="refresh-icon" :class="{ spinning: loading }">↻</span>
            </button>
          </div>
        </aside>

        <!-- Content -->
        <main class="content">
          <!-- Page Header -->
          <header class="page-header">
            <h1 class="page-title">{{ getPageTitle }}</h1>
            <div class="header-actions">
              <div v-if="activeTab === 'history'" class="search-box">
                <input v-model="searchQuery" type="text" placeholder="Search..." class="search-input">
              </div>
              <div class="status-badge" :class="{ loading: loading }">
                {{ refreshButtonText }}
              </div>
            </div>
          </header>

          <!-- Content Area -->
          <div class="content-area">
            <!-- Overview Tab -->
            <section v-if="activeTab === 'overview'" class="tab-content">
              <!-- Hero Card -->
              <div class="card hero-card">
                <div class="card-header">
                  <h2 class="card-title">Current Price</h2>
                  <button @click="toggleCustomPriceMode" :class="['icon-btn', { active: isManualMode }]"
                    title="Custom price">
                    ⚙
                  </button>
                </div>

                <div class="card-content">
                  <div v-if="loading" class="loader"></div>
                  <div v-else class="price-section">
                    <div class="price-value">{{ formatCurrencyDisplay(currentPrice) }}</div>
                    <div class="price-label">per troy ounce</div>
                  </div>

                  <Transition name="expand">
                    <div v-if="isManualMode" class="custom-price-input">
                      <input v-model.number="manualPrice" type="number" step="0.01" placeholder="Enter custom price"
                        class="input">
                      <button @click="clearManualPrice" class="btn-small">Reset</button>
                    </div>
                  </Transition>
                </div>

                <div class="card-footer">{{ lastUpdated }}</div>
              </div>

              <!-- Stats Grid -->
              <div v-if="purchases.length > 0" class="stats-grid">
                <div class="stat-card">
                  <div class="stat-label">Total Invested</div>
                  <div class="stat-value">{{ memoizedTotalInvested }}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Current Value</div>
                  <div class="stat-value">{{ memoizedCurrentValue }}</div>
                </div>
                <div class="stat-card" :class="memoizedProfitLoss >= 0 ? 'profit' : 'loss'">
                  <div class="stat-label">{{ memoizedProfitLoss >= 0 ? 'Gain' : 'Loss' }}</div>
                  <div class="stat-value">{{ memoizedProfitLossDisplay }}</div>
                  <div class="stat-change">{{ memoizedProfitChangePercent }}</div>
                </div>
              </div>

              <!-- Calculator & Form -->
              <div class="cards-row">
                <div class="card">
                  <div class="card-header">
                    <h3 class="card-title">Quick Calculator</h3>
                  </div>
                  <div class="card-content">
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
                      <div v-if="calculatorAmount > 0" class="result-box">
                        {{ memoizedCalculatorResult }}
                      </div>
                    </Transition>
                  </div>
                </div>

                <div class="card">
                  <div class="card-header">
                    <h3 class="card-title">Add Purchase</h3>
                  </div>
                  <div class="card-content">
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
                    <button @click="addPurchase" :disabled="!canAddPurchase()" class="btn btn-primary">
                      Add Purchase
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <!-- Convert Tab -->
            <section v-if="activeTab === 'convert'" class="tab-content">
              <div class="card">
                <div class="card-header">
                  <h2 class="card-title">Price Conversions</h2>
                </div>
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

            <!-- History Tab -->
            <section v-if="activeTab === 'history'" class="tab-content">
              <div class="card">
                <div class="card-header">
                  <h2 class="card-title">Purchase History</h2>
                  <div class="header-buttons">
                    <button @click="exportData('csv')" class="icon-btn" title="Export CSV">⬇</button>
                  </div>
                </div>

                <div class="card-content">
                  <div v-if="purchases.length === 0" class="empty-state">
                    <p>No purchases yet. Add your first purchase to get started.</p>
                  </div>

                  <div v-else class="table-wrapper">
                    <table class="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Price/Chi</th>
                          <th>Today</th>
                          <th>Gain/Loss</th>
                          <th>%</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="purchase in filteredPurchases" :key="purchase.id"
                          :class="{ editing: editingId === purchase.id }">
                          <td v-if="editingId !== purchase.id">{{ formatDate(purchase.date) }}</td>
                          <td v-if="editingId !== purchase.id">{{ purchase.amount }} CHI</td>
                          <td v-if="editingId !== purchase.id">{{ formatCurrencyDisplay(purchase.totalPaid /
          purchase.amount) }}</td>
                          <td v-if="editingId !== purchase.id">{{ getWorthTodayPerChiCached(purchase) }}</td>
                          <td v-if="editingId !== purchase.id" :class="getProfitClassCached(purchase.id)">{{
          getProfitDisplayCached(purchase.id) }}</td>
                          <td v-if="editingId !== purchase.id" :class="getProfitClassCached(purchase.id)">{{
          getProfitPercentCached(purchase.id) }}</td>

                          <!-- Edit Mode -->
                          <td v-if="editingId === purchase.id" colspan="5">
                            <div class="edit-row">
                              <input v-model.number="editingPurchase.amount" type="number" step="0.01"
                                class="input-small">
                              <input v-model.number="editingPurchase.totalPaid" type="number" step="0.01"
                                class="input-small">
                              <input v-model="editingPurchase.date" type="date" class="input-small">
                            </div>
                          </td>

                          <!-- Actions -->
                          <td class="actions-cell">
                            <template v-if="editingId !== purchase.id">
                              <button @click="startEdit(purchase)" class="action-btn">Edit</button>
                              <button @click="deletePurchase(purchase.id)" class="action-btn danger">Delete</button>
                            </template>
                            <template v-else>
                              <button @click="saveEdit(purchase.id)" class="action-btn">Save</button>
                              <button @click="cancelEdit" class="action-btn">Cancel</button>
                            </template>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            <!-- Settings Tab -->
            <section v-if="activeTab === 'settings'" class="tab-content">
              <div class="settings-grid">
                <div class="card">
                  <div class="card-header">
                    <h3 class="card-title">Price Updates</h3>
                  </div>
                  <div class="card-content settings-content">
                    <div class="setting-item">
                      <span class="setting-label">Auto Refresh</span>
                      <span class="setting-value">Every 24 hours</span>
                    </div>
                    <div class="setting-item">
                      <span class="setting-label">Daily Limit</span>
                      <span class="setting-value">{{ apiQuota.dailyLimit }} calls</span>
                    </div>
                    <div class="setting-item">
                      <span class="setting-label">Used Today</span>
                      <span class="setting-value">{{ apiQuota.dailyCalls }} / {{ apiQuota.dailyLimit }}</span>
                    </div>
                    <button @click="handleRefresh" :disabled="loading || isRefreshDisabled" class="btn btn-primary">
                      Refresh Now
                    </button>
                  </div>
                </div>

                <div class="card">
                  <div class="card-header">
                    <h3 class="card-title">Data Management</h3>
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
                      <span class="setting-value">3.0.0</span>
                    </div>
                    <div class="setting-item">
                      <span class="setting-label">Last Updated</span>
                      <span class="setting-value">{{ lastUpdated }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GoldTrackerMacOS',

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

      activeTab: 'overview',
      searchQuery: '',
      toasts: [],
      toastId: 0
    };
  },

  computed: {
    getPageTitle() {
      const titles = {
        overview: 'Overview',
        convert: 'Conversions',
        history: 'History',
        settings: 'Settings'
      };
      return titles[this.activeTab] || 'Overview';
    },

    currentPrice() {
      if (this.isManualMode && this.manualPrice) return this.manualPrice;
      return this.goldPrice;
    },

    refreshButtonText() {
      if (this.loading) return 'Updating...';
      if (this.refreshCooldown > 0) return `${this.refreshCooldown}s`;
      if (this.isRefreshDisabled) return 'Daily Limit';
      return 'Updated';
    },

    isRefreshDisabled() {
      return this.apiQuota.dailyCalls >= this.apiQuota.dailyLimit;
    },

    filteredPurchases() {
      const sorted = [...this.purchases].sort((a, b) => new Date(b.date) - new Date(a.date));
      if (!this.searchQuery) return sorted;
      const query = this.searchQuery.toLowerCase();
      return sorted.filter(p =>
        this.formatDate(p.date).toLowerCase().includes(query) ||
        p.amount.toString().includes(query) ||
        p.totalPaid.toString().includes(query)
      );
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
      try {
        const response = await fetch(`${this.apiBaseUrl}/XAU/USD`, {
          headers: {
            'x-access-token': this.apiKey,
            'Content-Type': 'application/json'
          },
          method: 'GET'
        });

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
          } else {
            this.goldPrice = this.fallbackPrice;
            this.lastUpdated = 'Offline';
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
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #e8e8e8 0%, #f5f5f5 100%);
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
  max-width: 1200px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 90vh;
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
  text-align: center;
}

.spacer {
  width: 70px;
}

/* Main Content */
.window-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  width: 180px;
  background: #f6f6f6;
  border-right: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 12px;
}

.nav-menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  padding: 8px 12px;
  background: none;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;
  font-weight: 500;
}

.nav-item:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

.nav-item.active {
  background: white;
  color: #1a73e8;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-icon {
  font-size: 16px;
  opacity: 0.7;
}

.sidebar-footer {
  padding-top: 12px;
  border-top: 1px solid #e5e5e5;
}

.refresh-btn {
  width: 100%;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #f0f0f0;
  border-color: #d0d0d0;
}

.refresh-btn:disabled {
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

/* Content */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-header {
  padding: 24px;
  border-bottom: 1px solid #e5e5e5;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1d1d1d;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-box {
  position: relative;
}

.search-input {
  padding: 6px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 13px;
  width: 200px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #1a73e8;
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
}

.status-badge {
  padding: 4px 12px;
  background: #f0f0f0;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
}

.status-badge.loading {
  background: #e3f2fd;
  color: #1a73e8;
}

/* Content Area */
.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.card-footer {
  padding: 8px 16px;
  background: #f9f9f9;
  border-top: 1px solid #e5e5e5;
  font-size: 12px;
  color: #999;
  text-align: right;
}

/* Hero Card */
.hero-card {
  grid-column: 1 / -1;
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

.loader {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e5e5;
  border-top: 3px solid #1a73e8;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 20px auto;
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
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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

/* Cards Row */
.cards-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

/* Forms */
.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input {
  width: 100%;
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
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 12px;
  font-family: inherit;
}

.result-box {
  background: #f0f0f0;
  padding: 12px;
  border-radius: 6px;
  font-weight: 600;
  color: #1d1d1d;
  text-align: center;
  margin-top: 12px;
}

/* Buttons */
.btn {
  padding: 8px 16px;
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

/* Table */
.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table thead {
  background: #f9f9f9;
  border-bottom: 1px solid #e5e5e5;
}

.data-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid #e5e5e5;
  color: #333;
}

.data-table tbody tr:hover {
  background: #f9f9f9;
}

.data-table tr.editing {
  background: #f0f7ff;
}

.edit-row {
  display: flex;
  gap: 8px;
}

.edit-row input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 12px;
}

.actions-cell {
  display: flex;
  gap: 4px;
}

.action-btn {
  padding: 4px 8px;
  background: none;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.action-btn:hover {
  background: #f0f0f0;
  border-color: #d0d0d0;
}

.action-btn.danger:hover {
  background: #ffebee;
  border-color: #ef5350;
  color: #c62828;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}

.empty-state p {
  margin: 0;
}

/* Conversions */
.conversion-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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
  font-size: 20px;
  font-weight: 700;
  color: #1d1d1d;
  margin-bottom: 4px;
}

.conversion-unit {
  font-size: 11px;
  color: #999;
}

/* Settings */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
    max-height: 100%;
    border-radius: 0;
  }

  .window-content {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    flex-direction: row;
    border-right: none;
    border-bottom: 1px solid #e5e5e5;
    height: auto;
    padding: 8px;
    gap: 8px;
    overflow-x: auto;
  }

  .nav-menu {
    flex-direction: row;
    flex: 1;
    gap: 2px;
  }

  .nav-item {
    flex: 1;
    padding: 10px 8px;
    font-size: 12px;
    min-width: 80px;
  }

  .nav-label {
    display: inline;
  }

  .sidebar-footer {
    display: none;
  }

  .content {
    flex: 1;
  }

  .page-header {
    padding: 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .page-title {
    font-size: 24px;
  }

  .header-actions {
    width: 100%;
  }

  .search-input {
    width: 100%;
  }

  .content-area {
    padding: 16px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .cards-row {
    grid-template-columns: 1fr;
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
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }

  .title-bar {
    height: 40px;
    padding: 0 12px;
    gap: 8px;
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

  .spacer {
    width: 50px;
  }

  .window-content {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    flex-direction: row;
    border-bottom: 1px solid #e5e5e5;
    border-right: none;
    height: auto;
    padding: 4px;
    gap: 0;
  }

  .nav-menu {
    flex-direction: row;
    flex: 1;
    gap: 0;
  }

  .nav-item {
    flex: 1;
    padding: 10px 4px;
    font-size: 11px;
    gap: 4px;
    border-radius: 4px;
  }

  .nav-icon {
    font-size: 14px;
  }

  .nav-label {
    display: none;
  }

  .nav-item.active .nav-label {
    display: inline;
  }

  .page-header {
    padding: 12px;
    gap: 8px;
  }

  .page-title {
    font-size: 20px;
  }

  .header-actions {
    width: 100%;
    gap: 8px;
  }

  .search-input {
    width: 100%;
    font-size: 14px;
    padding: 8px 10px;
  }

  .status-badge {
    font-size: 10px;
    padding: 4px 8px;
    white-space: nowrap;
  }

  .content-area {
    padding: 12px;
    gap: 12px;
  }

  .tab-content {
    gap: 12px;
  }

  .card {
    border-radius: 6px;
  }

  .card-header {
    padding: 12px;
    gap: 8px;
  }

  .card-title {
    font-size: 14px;
  }

  .card-content {
    padding: 12px;
  }

  .card-footer {
    padding: 6px 12px;
    font-size: 11px;
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
    gap: 12px;
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

  .stat-change {
    font-size: 11px;
  }

  .cards-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .form-group {
    margin-bottom: 12px;
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

  .btn-primary {
    width: 100%;
  }

  .button-group {
    flex-direction: column;
    gap: 8px;
  }

  .button-group .btn {
    width: 100%;
  }

  .icon-btn {
    width: 36px;
    height: 36px;
    min-width: 36px;
  }

  .header-buttons {
    gap: 4px;
  }

  .conversion-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .conversion-item {
    padding: 16px;
  }

  .conversion-value {
    font-size: 18px;
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

  /* Table on mobile */
  .table-wrapper {
    overflow-x: auto;
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

  .data-table th:nth-child(n+4),
  .data-table td:nth-child(n+4) {
    text-align: right;
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

  .empty-state {
    padding: 24px 12px;
    font-size: 13px;
  }

  .result-box {
    padding: 10px;
    margin-top: 10px;
    font-size: 14px;
  }

  .custom-price-input {
    flex-direction: column;
    gap: 8px;
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