<!-- pages/index.vue - FULL SCREEN MOBILE RESPONSIVE ALL-IN-ONE PAGE -->
<template>
  <div class="app">
    <!-- Header -->
    <header class="header">
      <div class="container">
        <h1 class="title">Gold Tracker</h1>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main">
      <div class="container">
        
        <!-- CUSTOM PRICE ALERT BANNER (Always Visible) -->
        <div v-if="isManualMode" class="custom-price-banner">
          <span class="banner-icon">⚡</span>
          <span class="banner-text">Using custom price: <strong>${{ manualPrice.toFixed(2) }}/oz</strong></span>
          <button @click="clearManualPrice" class="banner-btn">Reset</button>
        </div>

        <!-- Current Price Card with Toggle Button -->
        <section class="price-card">
          <div class="price-card-header">
            <div class="price-card-content">
              <div class="price-label">Current Price (Troy Oz)</div>
              <div v-if="loading" class="price-skeleton"></div>
              <div v-else class="price-display">{{ formatCurrencyDisplay(currentPrice) }}</div>
              <div class="price-time">{{ lastUpdated }}</div>
            </div>
            <button 
              @click="toggleCustomPriceMode"
              :class="['price-toggle-btn', { active: isManualMode }]"
              title="Toggle custom price"
            >
              ⚙️
            </button>
          </div>

          <!-- Custom Price Input - Expanded Below Card -->
          <div v-if="isManualMode" class="custom-price-expanded">
            <div class="custom-price-title">Set Custom Price</div>
            <div class="custom-price-input-group">
              <span class="currency-symbol">$</span>
              <input 
                v-model.number="manualPrice" 
                type="number" 
                step="0.01"
                min="0"
                class="custom-price-input"
                placeholder="Enter price"
                inputmode="decimal"
              >
              <span class="unit-label">/oz</span>
            </div>
            <button @click="clearManualPrice" class="btn btn-secondary btn-full">
              Reset to Live Price
            </button>
          </div>
        </section>

        <!-- Refresh Button -->
        <button 
          @click="handleRefresh" 
          :disabled="loading || isRefreshDisabled" 
          class="btn btn-primary btn-block"
        >
          {{ refreshButtonText }}
        </button>

        <!-- Price Conversions Section -->
        <section class="content-section">
          <div class="section-header">
            <h2>Price Conversions</h2>
          </div>

          <div class="price-grid">
            <div class="price-item">
              <span class="price-name">Chi (ជី)</span>
              <span class="price-value">{{ memoizedChiPrice }}</span>
              <span class="price-unit">3.75g</span>
            </div>
            
            <div class="price-item">
              <span class="price-name">Gram</span>
              <span class="price-value">{{ memoizedGramPrice }}</span>
              <span class="price-unit">1g</span>
            </div>

            <div class="price-item">
              <span class="price-name">Damlung (ដំឡឹង)</span>
              <span class="price-value">{{ memoizedDamlungPrice }}</span>
              <span class="price-unit">37.5g</span>
            </div>
          </div>
        </section>

        <!-- Quick Calculator Section -->
        <section class="content-section">
          <div class="section-header">
            <h2>Quick Calculator</h2>
          </div>

          <div class="card">
            <div class="form-row">
              <input 
                v-model.number="calculatorAmount" 
                type="number" 
                min="0" 
                step="0.1"
                placeholder="Amount"
                class="input"
                inputmode="decimal"
              >
              <select v-model="calculatorUnit" class="select">
                <option value="chi">Chi</option>
                <option value="gram">Gram</option>
                <option value="damlung">Damlung</option>
                <option value="oz">Troy Oz</option>
              </select>
            </div>
            <div v-if="calculatorAmount > 0" class="result">
              Value: <strong>{{ memoizedCalculatorResult }}</strong>
            </div>
          </div>
        </section>

        <!-- Portfolio Summary Section -->
        <section class="content-section">
          <div class="section-header">
            <h2>Portfolio Summary</h2>
          </div>

          <div v-if="purchases.length > 0" class="stats-grid">
            <div class="stat-box">
              <span class="stat-label">Total Invested</span>
              <span class="stat-amount">{{ memoizedTotalInvested }}</span>
            </div>

            <div class="stat-box">
              <span class="stat-label">Current Value</span>
              <span class="stat-amount">{{ memoizedCurrentValue }}</span>
            </div>

            <div class="stat-box" :class="memoizedProfitLoss >= 0 ? 'positive' : 'negative'">
              <span class="stat-label">{{ memoizedProfitLoss >= 0 ? 'Profit' : 'Loss' }}</span>
              <span class="stat-amount">{{ memoizedProfitLossDisplay }}</span>
              <span class="stat-percent">{{ memoizedProfitChangePercent }}</span>
            </div>
          </div>

          <div v-else class="empty-message">
            <p>No purchases yet. Add your first purchase to get started.</p>
          </div>
        </section>

        <!-- Add Purchase Section -->
        <section class="content-section">
          <div class="section-header">
            <h2>Add Purchase</h2>
          </div>

          <div class="card">
            <div class="form-group">
              <label class="label">Amount (Chi)</label>
              <input 
                v-model.number="newPurchase.amount" 
                type="number" 
                step="0.01"
                min="0"
                class="input"
                placeholder="e.g., 2"
                inputmode="decimal"
              >
            </div>

            <div class="form-group">
              <label class="label">Price Paid (USD)</label>
              <input 
                v-model.number="newPurchase.totalPaid" 
                type="number" 
                step="0.01"
                min="0"
                class="input"
                placeholder="e.g., 1020.00"
                inputmode="decimal"
              >
            </div>

            <div class="form-group">
              <label class="label">Date</label>
              <input 
                v-model="newPurchase.date" 
                type="date" 
                class="input"
                :max="getCurrentDate()"
              >
            </div>

            <div v-if="newPurchase.amount > 0 && newPurchase.totalPaid > 0" class="preview">
              <div class="preview-row">
                <span>Price per Chi:</span>
                <strong>{{ formatCurrencyDisplay(newPurchase.totalPaid / newPurchase.amount) }}</strong>
              </div>
              <div class="preview-row">
                <span>Total:</span>
                <strong>{{ formatCurrencyDisplay(newPurchase.totalPaid) }}</strong>
              </div>
            </div>

            <button 
              @click="addPurchase" 
              :disabled="!canAddPurchase()"
              class="btn btn-primary btn-block"
            >
              Save Purchase
            </button>
          </div>
        </section>

        <!-- Purchase History Section -->
        <section class="content-section">
          <div class="section-header">
            <h2>Purchase History</h2>
            <button @click="historyExpanded = !historyExpanded" class="btn-icon">
              {{ historyExpanded ? '▼' : '▶' }}
            </button>
          </div>

          <div v-if="historyExpanded" class="history-list">
            <div v-if="purchases.length === 0" class="empty-message">
              <p>No purchases recorded.</p>
            </div>

            <div 
              v-for="purchase in memoizedSortedPurchases" 
              :key="purchase.id" 
              class="history-item"
              :class="{ editing: editingId === purchase.id }"
            >
              <!-- View Mode -->
              <div v-if="editingId !== purchase.id" class="item-content">
                <div class="item-main">
                  <span class="item-date">{{ formatDate(purchase.date) }}</span>
                  <span class="item-amount">{{ purchase.amount }} Chi</span>
                </div>
                <div class="item-price">
                  <span class="label">Bought:</span>
                  <span>{{ formatCurrencyDisplay(purchase.totalPaid / purchase.amount) }}/Chi</span>
                </div>
                <div class="item-current">
                  <span class="label">Today:</span>
                  <span>{{ getWorthTodayPerChiCached(purchase) }}/Chi</span>
                </div>
                <div class="item-profit" :class="getProfitClassCached(purchase.id)">
                  {{ getProfitValueCached(purchase.id) >= 0 ? '+' : '' }}{{ getProfitDisplayCached(purchase.id) }}
                  <span class="percent">({{ getProfitPercentCached(purchase.id) }})</span>
                </div>
              </div>

              <!-- Edit Mode -->
              <div v-else class="item-edit">
                <input 
                  v-model.number="editingPurchase.amount" 
                  type="number" 
                  step="0.01" 
                  class="input"
                  placeholder="Amount"
                >
                <input 
                  v-model.number="editingPurchase.totalPaid" 
                  type="number" 
                  step="0.01" 
                  class="input"
                  placeholder="Price Paid"
                >
                <input 
                  v-model="editingPurchase.date" 
                  type="date" 
                  class="input"
                >
                <div class="edit-actions">
                  <button @click="saveEdit(purchase.id)" class="btn btn-small btn-primary">Save</button>
                  <button @click="cancelEdit" class="btn btn-small btn-secondary">Cancel</button>
                </div>
              </div>

              <!-- Item Actions -->
              <div v-if="editingId !== purchase.id" class="item-actions">
                <button @click="startEdit(purchase)" class="btn-action">✎</button>
                <button @click="deletePurchase(purchase.id)" class="btn-action btn-danger">✕</button>
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'GoldTracker',
  
  head() {
    return {
      title: 'Gold Tracker',
      meta: [
        { hid: 'description', name: 'description', content: 'Simple gold price tracker' },
        { hid: 'viewport', name: 'viewport', content: 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no' }
      ]
    }
  },

  data() {
    return {
      // Constants
      TROY_OUNCE_TO_GRAM: 31.1035,
      CHI_TO_OZ: 3.75 / 31.1035,
      GRAM_TO_OZ: 1 / 31.1035,
      DAMLUNG_TO_OZ: 37.5 / 31.1035,

      // API
      apiKey: 'goldapi-3yrz5zhtl5zcyqg4-io',
      apiBaseUrl: 'https://www.goldapi.io/api',
      alternativeApiUrl: 'https://api.metals.live/v1/spot',

      // Price state
      goldPrice: 0,
      loading: true,
      lastUpdated: 'Loading...',
      refreshCooldown: 0,
      isManualMode: false,
      manualPrice: null,
      
      // Calculator
      calculatorAmount: 1,
      calculatorUnit: 'chi',
      
      // Purchases
      purchases: [],
      historyExpanded: true,
      newPurchase: {
        amount: null,
        totalPaid: null,
        date: new Date().toISOString().split('T')[0]
      },

      // Edit mode
      editingId: null,
      editingPurchase: null,
      
      // API quota
      apiQuota: {
        dailyCalls: 0,
        lastCallDate: null,
        dailyLimit: 10
      },
      
      // Cache
      cache: { gold: { data: null, timestamp: null } },
      fallbackPrice: 4000,

      // Performance
      lastCalculatedPrice: null,
      portfolioCache: { invested: null, current: null, profit: null },
      purchaseCache: new Map(),
      formatCache: new Map()
    };
  },
  
  computed: {
    currentPrice() {
      if (this.isManualMode && this.manualPrice) return this.manualPrice;
      return this.goldPrice;
    },

    refreshButtonText() {
      if (this.loading) return 'Loading...';
      if (this.refreshCooldown > 0) return `Wait ${this.refreshCooldown}s`;
      if (this.isRefreshDisabled) return 'Daily Limit';
      return 'Refresh Price';
    },

    isRefreshDisabled() {
      return this.apiQuota.dailyCalls >= this.apiQuota.dailyLimit;
    },

    memoizedSortedPurchases() {
      return [...this.purchases].sort((a, b) => new Date(b.date) - new Date(a.date));
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
      if (this.portfolioCache.invested !== null && this.lastCalculatedPrice === this.currentPrice) {
        return this.portfolioCache.invested;
      }
      const total = this.purchases.reduce((sum, p) => sum + p.totalPaid, 0);
      this.portfolioCache.invested = this.formatCurrencyDisplay(total);
      this.lastCalculatedPrice = this.currentPrice;
      return this.portfolioCache.invested;
    },

    memoizedCurrentValue() {
      if (this.portfolioCache.current !== null && this.lastCalculatedPrice === this.currentPrice) {
        return this.portfolioCache.current;
      }
      let sum = 0;
      for (let p of this.purchases) {
        sum += p.amount * this.CHI_TO_OZ * this.currentPrice;
      }
      this.portfolioCache.current = this.formatCurrencyDisplay(sum);
      return this.portfolioCache.current;
    },

    memoizedProfitLoss() {
      if (this.portfolioCache.profit !== null && this.lastCalculatedPrice === this.currentPrice) {
        return this.portfolioCache.profit;
      }
      let current = 0;
      for (let p of this.purchases) {
        current += p.amount * this.CHI_TO_OZ * this.currentPrice;
      }
      const invested = this.purchases.reduce((sum, p) => sum + p.totalPaid, 0);
      this.portfolioCache.profit = current - invested;
      return this.portfolioCache.profit;
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
    toggleCustomPriceMode() {
      if (this.isManualMode) {
        this.clearManualPrice();
      } else {
        this.enableManualMode();
      }
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

    getPricePerChiCached(purchase) {
      const key = `price-${purchase.id}`;
      if (this.purchaseCache.has(key)) return this.purchaseCache.get(key);
      const result = this.formatCurrencyDisplay(purchase.totalPaid / purchase.amount);
      this.purchaseCache.set(key, result);
      return result;
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
      return this.getProfitValueCached(purchaseId) >= 0 ? 'positive' : 'negative';
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
        this.clearCaches();
        this.editingId = null;
      }
    },

    cancelEdit() {
      this.editingId = null;
      this.editingPurchase = null;
    },

    enableManualMode() {
      this.isManualMode = true;
      this.manualPrice = this.currentPrice || 4242;
    },

    clearManualPrice() {
      this.isManualMode = false;
      this.manualPrice = null;
      if (process.client) localStorage.removeItem('manualPrice');
      this.clearCaches();
    },

    clearCaches() {
      this.portfolioCache = { invested: null, current: null, profit: null };
      this.purchaseCache.clear();
      this.lastCalculatedPrice = null;
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
      this.clearCaches();
      this.newPurchase = { amount: null, totalPaid: null, date: new Date().toISOString().split('T')[0] };
    },

    deletePurchase(purchaseId) {
      if (confirm('Delete this purchase?')) {
        this.purchases = this.purchases.filter(p => p.id !== purchaseId);
        this.savePurchases();
        this.clearCaches();
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

    async fetchMetalPrice(userRequested = false) {
      const now = new Date();
      const cached = this.cache.gold;
      const cacheAge = cached.timestamp ? (now - new Date(cached.timestamp)) / (1000 * 60 * 60) : 999;
      
      if (cached.data && cacheAge < 24) {
        this.goldPrice = cached.data.price;
        this.lastUpdated = cacheAge > 1 ? `${Math.floor(cacheAge)}h ago` : 'now';
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
        // Try primary API first
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
            this.lastUpdated = 'now';
            if (process.client) localStorage.setItem('goldPrice', this.goldPrice);
            this.clearCaches();
            this.loading = false;
            return;
          }
        }
        throw new Error(`API error: ${response.status}`);
      } catch (error) {
        console.error('Primary API Error:', error);
        // Try alternative API
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

/* Reset */
html, body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  width: 100%;
  height: 100%;
  -webkit-user-select: none;
  user-select: none;
}

#__nuxt, #__layout {
  width: 100%;
  height: 100%;
}

.app {
  background: #fafafa;
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  color: #333;
}

/* Container */
.container {
  width: 100%;
  padding: 0 12px;
}

@media (min-width: 480px) {
  .container {
    padding: 0 16px;
  }
}

@media (min-width: 768px) {
  .container {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 20px;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
  }
}

/* Header */
.header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 12px 0;
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

@media (min-width: 480px) {
  .title {
    font-size: 24px;
  }
}

@media (min-width: 768px) {
  .title {
    font-size: 28px;
  }
}

/* Main */
.main {
  flex: 1;
  padding: 12px 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

@media (min-width: 480px) {
  .main {
    padding: 16px 0;
  }
}

/* Custom Price Banner */
.custom-price-banner {
  background: linear-gradient(135deg, #fff3cd 0%, #fffbf0 100%);
  border: 2px solid #ffc107;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: slideDown 0.3s ease-out;
  flex-wrap: wrap;
}

@media (min-width: 480px) {
  .custom-price-banner {
    padding: 14px 16px;
    margin-bottom: 16px;
    border-radius: 10px;
    gap: 12px;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.banner-icon {
  font-size: 18px;
  flex-shrink: 0;
}

@media (min-width: 480px) {
  .banner-icon {
    font-size: 20px;
  }
}

.banner-text {
  flex: 1;
  font-size: 12px;
  color: #333;
  font-weight: 500;
  min-width: 150px;
}

@media (min-width: 480px) {
  .banner-text {
    font-size: 13px;
  }
}

.banner-text strong {
  color: #d39e00;
  font-weight: 700;
}

.banner-btn {
  padding: 6px 10px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  flex-shrink: 0;
}

@media (min-width: 480px) {
  .banner-btn {
    padding: 6px 12px;
    font-size: 12px;
  }
}

.banner-btn:hover {
  background: #c82333;
  transform: scale(0.98);
}

/* Price Card */
.price-card {
  background: white;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #e0e0e0;
}

@media (min-width: 480px) {
  .price-card {
    padding: 20px;
    margin-bottom: 16px;
    border-radius: 12px;
  }
}

.price-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  text-align: center;
}

.price-card-content {
  flex: 1;
}

.price-label {
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 6px;
  display: block;
}

@media (min-width: 480px) {
  .price-label {
    font-size: 12px;
    margin-bottom: 8px;
    letter-spacing: 0.5px;
  }
}

.price-skeleton {
  height: 40px;
  background: #f0f0f0;
  border-radius: 8px;
  animation: pulse 2s infinite;
  margin: 6px 0;
}

@media (min-width: 480px) {
  .price-skeleton {
    height: 48px;
    margin: 8px 0;
  }
}

.price-display {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  margin: 6px 0;
}

@media (min-width: 480px) {
  .price-display {
    font-size: 42px;
    margin: 8px 0;
  }
}

@media (min-width: 768px) {
  .price-display {
    font-size: 48px;
  }
}

.price-time {
  font-size: 11px;
  color: #888;
  margin-top: 4px;
}

@media (min-width: 480px) {
  .price-time {
    font-size: 12px;
    margin-top: 8px;
  }
}

.price-toggle-btn {
  width: 40px;
  height: 40px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

@media (min-width: 480px) {
  .price-toggle-btn {
    width: 44px;
    height: 44px;
    font-size: 20px;
  }
}

.price-toggle-btn:hover {
  border-color: #ffc107;
  background: #fffbf0;
}

.price-toggle-btn.active {
  border-color: #ffc107;
  background: #ffc107;
  opacity: 0.8;
}

/* Custom Price Input */
.custom-price-expanded {
  background: #fffbf0;
  border-top: 2px solid #ffc107;
  padding: 12px;
  margin-top: 12px;
  border-radius: 0 0 10px 10px;
}

@media (min-width: 480px) {
  .custom-price-expanded {
    padding: 16px;
    margin-top: 16px;
    border-radius: 0 0 12px 12px;
  }
}

.custom-price-title {
  font-size: 12px;
  font-weight: 600;
  color: #d39e00;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 10px;
}

@media (min-width: 480px) {
  .custom-price-title {
    font-size: 13px;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
  }
}

.custom-price-input-group {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

@media (min-width: 480px) {
  .custom-price-input-group {
    gap: 8px;
    margin-bottom: 12px;
  }
}

.currency-symbol {
  font-size: 16px;
  font-weight: 700;
  color: #ffc107;
}

@media (min-width: 480px) {
  .currency-symbol {
    font-size: 18px;
  }
}

.custom-price-input {
  flex: 1;
  padding: 10px;
  border: 2px solid #ffc107;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  color: #333;
  min-height: 40px;
}

@media (min-width: 480px) {
  .custom-price-input {
    padding: 12px;
    font-size: 18px;
    border-radius: 8px;
    min-height: 44px;
  }
}

.custom-price-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.2);
}

.unit-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  white-space: nowrap;
}

@media (min-width: 480px) {
  .unit-label {
    font-size: 14px;
  }
}

/* Content Sections */
.content-section {
  margin-bottom: 16px;
}

@media (min-width: 480px) {
  .content-section {
    margin-bottom: 20px;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

@media (min-width: 480px) {
  .section-header {
    margin-bottom: 16px;
  }
}

.section-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

@media (min-width: 480px) {
  .section-header h2 {
    font-size: 18px;
  }
}

.btn-icon {
  background: none;
  border: none;
  font-size: 12px;
  color: #888;
  cursor: pointer;
  padding: 4px 8px;
}

/* Cards */
.card {
  background: white;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #e0e0e0;
}

@media (min-width: 480px) {
  .card {
    padding: 16px;
    margin-bottom: 16px;
    border-radius: 8px;
  }
}

/* Price Grid */
.price-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

@media (min-width: 480px) {
  .price-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 16px;
  }
}

.price-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

@media (min-width: 480px) {
  .price-item {
    padding: 12px;
  }
}

.price-name {
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

@media (min-width: 480px) {
  .price-name {
    font-size: 12px;
    letter-spacing: 0.5px;
  }
}

.price-value {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

@media (min-width: 480px) {
  .price-value {
    font-size: 18px;
  }
}

@media (min-width: 768px) {
  .price-value {
    font-size: 20px;
  }
}

.price-unit {
  font-size: 10px;
  color: #aaa;
}

@media (min-width: 480px) {
  .price-unit {
    font-size: 11px;
  }
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

@media (min-width: 480px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 16px;
  }
}

.stat-box {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

@media (min-width: 480px) {
  .stat-box {
    padding: 16px;
  }
}

.stat-box.positive {
  border-color: #d4edda;
  background: #f8fff9;
}

.stat-box.negative {
  border-color: #f5c6cb;
  background: #fff8f8;
}

.stat-label {
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

@media (min-width: 480px) {
  .stat-label {
    font-size: 12px;
    letter-spacing: 0.5px;
  }
}

.stat-amount {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

@media (min-width: 480px) {
  .stat-amount {
    font-size: 22px;
  }
}

.stat-box.positive .stat-amount {
  color: #28a745;
}

.stat-box.negative .stat-amount {
  color: #dc3545;
}

.stat-percent {
  font-size: 11px;
  font-weight: 600;
  color: #888;
}

@media (min-width: 480px) {
  .stat-percent {
    font-size: 12px;
  }
}

/* Forms */
.form-group {
  margin-bottom: 10px;
}

@media (min-width: 480px) {
  .form-group {
    margin-bottom: 12px;
  }
}

.label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

@media (min-width: 480px) {
  .label {
    font-size: 12px;
    margin-bottom: 6px;
  }
}

.input,
.select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  min-height: 36px;
  color: #333;
}

@media (min-width: 480px) {
  .input,
  .select {
    padding: 10px;
    font-size: 14px;
    min-height: 40px;
  }
}

@media (min-width: 768px) {
  .input,
  .select {
    padding: 12px;
    font-size: 14px;
    min-height: 44px;
  }
}

.input:focus,
.select:focus {
  outline: none;
  border-color: #333;
  box-shadow: 0 0 0 3px rgba(51, 51, 51, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

@media (min-width: 480px) {
  .form-row {
    gap: 8px;
  }
}

.form-row .input,
.form-row .select {
  margin-bottom: 0;
}

/* Result & Preview */
.result {
  background: #f8fff9;
  border: 1px solid #d4edda;
  border-radius: 6px;
  padding: 10px;
  font-size: 13px;
  color: #28a745;
  margin-top: 10px;
}

@media (min-width: 480px) {
  .result {
    padding: 12px;
    font-size: 14px;
    margin-top: 12px;
  }
}

.result strong {
  color: #1e7e34;
}

.preview {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 10px;
  margin: 10px 0;
  font-size: 12px;
}

@media (min-width: 480px) {
  .preview {
    padding: 12px;
    margin: 12px 0;
    font-size: 13px;
  }
}

.preview-row {
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
}

@media (min-width: 480px) {
  .preview-row {
    padding: 4px 0;
  }
}

.preview-row strong {
  color: #333;
}

/* History */
.history-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.history-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

@media (min-width: 480px) {
  .history-item {
    padding: 4px;
  }
  .history-list {
  display: flex;
  flex-direction:column;
  gap: 8px;
}
}
.history-item.editing {
  border-color: #333;
  background: #f8f8f8;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-main {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
  gap: 8px;
}

@media (min-width: 480px) {
  .item-main {
    margin-bottom: 6px;
    font-size: 13px;
  }
}

.item-date {
  color: #888;
  font-size: 10px;
  flex-shrink: 0;
}

@media (min-width: 480px) {
  .item-date {
    font-size: 11px;
  }
}

.item-amount {
  font-weight: 600;
  color: #333;
  flex-shrink: 0;
}

.item-price,
.item-current {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  margin-bottom: 3px;
  gap: 8px;
}

@media (min-width: 480px) {
  .item-price,
  .item-current {
    font-size: 12px;
    margin-bottom: 4px;
  }
}

.item-price .label,
.item-current .label {
  color: #888;
  flex-shrink: 0;
}

.item-profit {
  font-size: 18px;
  font-weight: 600;
  color: #28a745;
  margin-top: 4px;
  text-align: center;
}

@media (min-width: 480px) {
  .item-profit {
    font-size: 16px;
    margin-top: 6px;
  }
}

.item-profit.negative {
  color: #dc3545;
}

.percent {
  font-size: 10px;
  color: #888;
  font-weight: 400;
  margin-left: 4px;
}

@media (min-width: 480px) {
  .percent {
    font-size: 11px;
  }
}

.item-edit {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

@media (min-width: 480px) {
  .item-edit {
    gap: 8px;
  }
}

.item-edit .input {
  margin-bottom: 0;
}

.edit-actions {
  display: flex;
  gap: 4px;
}

@media (min-width: 480px) {
  .edit-actions {
    gap: 6px;
  }
}

.item-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.btn-action {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  min-height: 36px;
  min-width: 36px;
}

@media (min-width: 480px) {
  .btn-action {
    width: 36px;
    height: 36px;
    font-size: 14px;
    min-height: 40px;
    min-width: 40px;
  }
}

.btn-action:hover {
  background: #e0e0e0;
}

.btn-action.btn-danger:hover {
  background: #ffebee;
  color: #dc3545;
}

/* Buttons */
.btn {
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-block;
  text-align: center;
  min-height: 36px;
  touch-action: manipulation;
}

@media (min-width: 480px) {
  .btn {
    padding: 10px 16px;
    font-size: 14px;
    min-height: 40px;
  }
}

@media (min-width: 768px) {
  .btn {
    padding: 12px 20px;
    font-size: 14px;
    min-height: 44px;
  }
}

.btn:active {
  transform: scale(0.98);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #333;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1a1a1a;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-danger {
  color: #dc3545;
}

.btn-danger:hover {
  background: #ffebee;
}

.btn-small {
  padding: 6px 10px;
  font-size: 11px;
  min-height: 32px;
}

@media (min-width: 480px) {
  .btn-small {
    padding: 8px 12px;
    font-size: 12px;
    min-height: 34px;
  }
}

.btn-block {
  display: block;
  width: 100%;
  margin-bottom: 12px;
}

@media (min-width: 480px) {
  .btn-block {
    margin-bottom: 16px;
  }
}

.btn-full {
  width: 100%;
}

/* Empty State */
.empty-message {
  text-align: center;
  padding: 16px 12px;
  color: #888;
}

@media (min-width: 480px) {
  .empty-message {
    padding: 24px 16px;
  }
}

.empty-message p {
  margin: 0;
  font-size: 13px;
}

@media (min-width: 480px) {
  .empty-message p {
    font-size: 14px;
  }
}

/* Animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Input fixes */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

/* iOS */
@supports (padding: max(0px)) {
  .main {
    padding-bottom: max(12px, env(safe-area-inset-bottom));
  }

  @media (min-width: 480px) {
    .main {
      padding-bottom: max(16px, env(safe-area-inset-bottom));
    }
  }
}
</style>