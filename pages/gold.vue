<!-- pages/index.vue - IMPROVED LAYOUT WITH EDIT FEATURE -->

<template>
  <div class="app">
    <!-- Header -->
    <header class="header">
      <div class="container">
        <h1 class="title">តម្លៃមាស</h1>
      </div>
    </header>

    <main class="main">
      <div class="container">
        
        <!-- HERO: Large Price Display -->
        <section class="hero-price">
          <div class="price-label">ដំឡឹង</div>
          <div v-if="loading" class="skeleton-hero"></div>
          <div v-else class="price-hero">{{ memoizedDamlungPrice }}</div>
          <div class="price-sublabel">37.5g • Current Market Price</div>
        </section>

        <!-- Quick Stats Grid -->
        <section class="quick-stats">
          <div class="stat-card">
            <div class="stat-label">ជី</div>
            <div v-if="loading" class="skeleton-stat"></div>
            <div v-else class="stat-value">{{ memoizedChiPrice }}</div>
            <div class="stat-sublabel">3.75g</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-label">Troy Oz</div>
            <div v-if="loading" class="skeleton-stat"></div>
            <div v-else class="stat-value">{{ formatCurrencyDisplay(currentPrice) }}</div>
            <div class="stat-sublabel">31.1g</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Gram</div>
            <div v-if="loading" class="skeleton-stat"></div>
            <div v-else class="stat-value">{{ formatCurrencyDisplay(getPricePerUnit('gram', currentPrice)) }}</div>
            <div class="stat-sublabel">1g</div>
          </div>
        </section>

        <!-- Custom Price Input -->
        <section class="custom-price-section">
          <div v-if="!isManualMode" class="custom-price-prompt" @click="enableManualMode">
            <svg class="icon-edit" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>Set Custom Price</span>
          </div>

          <div v-else class="custom-price-editor">
            <div class="editor-header">
              <span class="editor-label">Custom Price (USD)</span>
              <button @click="clearManualPrice" class="btn-close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div class="editor-input">
              <span class="currency-symbol">$</span>
              <input 
                v-model.number="manualPrice" 
                type="number" 
                step="0.01"
                min="0"
                class="price-input-large"
                placeholder="4242.00"
                @input="onManualPriceInput"
                ref="manualInput"
              >
            </div>

            <div v-if="manualPrice > 0" class="conversions-grid">
              <div class="conversion">
                <span class="conversion-label">ដំឡឹង</span>
                <span class="conversion-value">{{ formatCurrencyDisplay(getPricePerUnit('damlung', manualPrice)) }}</span>
              </div>
              <div class="conversion">
                <span class="conversion-label">ជី</span>
                <span class="conversion-value">{{ formatCurrencyDisplay(getPricePerUnit('chi', manualPrice)) }}</span>
              </div>
              <div class="conversion">
                <span class="conversion-label">Gram</span>
                <span class="conversion-value">{{ formatCurrencyDisplay(getPricePerUnit('gram', manualPrice)) }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Portfolio Summary - Prominent -->
        <section v-if="purchases.length > 0" class="portfolio-section">
          <h2 class="section-title">📊 Your Gold Portfolio</h2>
          
          <div v-if="manualGoldPrice" class="custom-price-badge">
            Using custom price: <strong>${{ manualGoldPrice.toFixed(2) }}/oz</strong>
          </div>
          
          <div class="portfolio-cards">
            <div class="portfolio-card invested">
              <div class="portfolio-label">💰 Total Invested</div>
              <div class="portfolio-value">{{ formatCurrencyDisplay(memoizedTotalInvested) }}</div>
            </div>

            <div class="portfolio-card current">
              <div class="portfolio-label">📈 Current Value</div>
              <div class="portfolio-value">{{ formatCurrencyDisplay(memoizedCurrentValue) }}</div>
            </div>

            <div class="portfolio-card" :class="memoizedProfitLossClass">
              <div class="portfolio-label">{{ memoizedProfitLoss >= 0 ? '✅ Profit' : '❌ Loss' }}</div>
              <div class="portfolio-value-large">{{ formatCurrencyDisplay(Math.abs(memoizedProfitLoss)) }}</div>
              <div class="portfolio-change">{{ memoizedProfitLoss >= 0 ? '+' : '-' }}{{ ((Math.abs(memoizedProfitLoss) / memoizedTotalInvested) * 100).toFixed(2) }}%</div>
            </div>
          </div>
        </section>

        <!-- Purchase History -->
        <section v-if="purchases.length > 0" class="history-section">
          <div class="history-header">
            <h2 class="section-title">Purchase History</h2>
            <button @click="toggleHistoryExpanded" class="btn-toggle">
              <svg v-if="!historyExpanded" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="18 15 12 9 6 15"/>
              </svg>
            </button>
          </div>

          <div v-if="historyExpanded" class="history-grid">
            <div v-for="purchase in memoizedSortedPurchases" :key="purchase.id" class="history-card" :class="{ 'editing': editingId === purchase.id }">
              
              <!-- Card Header with Edit/Delete -->
              <div class="card-header">
                <span class="card-date">📅 {{ formatDate(purchase.date) }}</span>
                <div class="card-actions">
                  <button v-if="editingId !== purchase.id" @click="startEdit(purchase)" class="btn-action btn-edit" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button @click="deletePurchase(purchase.id)" class="btn-action btn-delete" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Editable View -->
              <div v-if="editingId === purchase.id" class="card-edit-mode">
                <div class="edit-field">
                  <label class="edit-label">Amount (ជី)</label>
                  <input v-model.number="editingPurchase.amount" type="number" step="0.01" min="0" class="edit-input">
                </div>
                <div class="edit-field">
                  <label class="edit-label">Price Paid (USD)</label>
                  <input v-model.number="editingPurchase.totalPaid" type="number" step="0.01" min="0" class="edit-input">
                </div>
                <div class="edit-field">
                  <label class="edit-label">Date</label>
                  <input v-model="editingPurchase.date" type="date" class="edit-input">
                </div>
                <div class="edit-actions">
                  <button @click="saveEdit(purchase.id)" class="btn-primary btn-small">Save</button>
                  <button @click="cancelEdit" class="btn-secondary btn-small">Cancel</button>
                </div>
              </div>

              <!-- Normal View -->
              <div v-else class="card-view">
                <!-- Amount -->
                <div class="card-amount">
                  <span class="amount-label">Gold Purchased</span>
                  <span class="amount-value">{{ purchase.amount }} <strong>ជី</strong></span>
                </div>

                <!-- Prices -->
                <div class="card-prices-compare">
                  <div>
                    <div class="price-label">Bought at</div>
                    <div class="price-value">{{ formatCurrencyDisplay(purchase.totalPaid / purchase.amount) }}/ជី</div>
                  </div>
                  <div class="arrow">→</div>
                  <div>
                    <div class="price-label">Worth today</div>
                    <div class="price-value">{{ formatCurrencyDisplay(memoizedPurchaseValues[purchase.id] / purchase.amount) }}/ជី</div>
                  </div>
                </div>

                <!-- Result -->
                <div class="card-result" :class="memoizedPurchaseProfitClass[purchase.id]">
                  <span class="result-emoji">{{ memoizedPurchaseProfitValue[purchase.id] >= 0 ? '📈' : '📉' }}</span>
                  <div class="result-info">
                    <span class="result-label">{{ memoizedPurchaseProfitValue[purchase.id] >= 0 ? 'Profit' : 'Loss' }}</span>
                    <span class="result-value">{{ formatCurrencyDisplay(Math.abs(memoizedPurchaseProfitValue[purchase.id])) }}</span>
                  </div>
                  <span class="result-percent">{{ memoizedPurchaseProfitValue[purchase.id] >= 0 ? '+' : '-' }}{{ memoizedPurchaseProfitPercent[purchase.id] }}%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Add Purchase Form -->
        <section v-if="showPurchaseForm" class="add-purchase-form">
          <h2 class="form-title">Add Gold Purchase</h2>
          <button @click="closePurchaseForm" class="btn-close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <div class="form-group">
            <label class="form-label">Amount (ជី)</label>
            <input 
              v-model.number="newPurchase.amount" 
              type="number" 
              step="0.01"
              min="0"
              class="form-input"
              placeholder="e.g., 2"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Price Paid (USD)</label>
            <div class="form-input-currency">
              <span class="currency-prefix">$</span>
              <input 
                v-model.number="newPurchase.totalPaid" 
                type="number" 
                step="0.01"
                min="0"
                placeholder="e.g., 1020.00"
              >
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Purchase Date</label>
            <input 
              v-model="newPurchase.date" 
              type="date" 
              class="form-input"
              :max="getCurrentDate()"
            >
          </div>

          <div v-if="newPurchase.amount > 0 && newPurchase.totalPaid > 0" class="form-preview">
            <div class="preview-row">
              <span>Amount:</span>
              <strong>{{ newPurchase.amount }} ជី</strong>
            </div>
            <div class="preview-row">
              <span>Price per ជី:</span>
              <strong>{{ formatCurrencyDisplay(newPurchase.totalPaid / newPurchase.amount) }}</strong>
            </div>
            <div class="preview-row total">
              <span>Total:</span>
              <strong>{{ formatCurrencyDisplay(newPurchase.totalPaid) }}</strong>
            </div>
          </div>

          <button @click="addPurchase" class="btn-primary" :disabled="!canAddPurchase()">
            Save Purchase
          </button>
          <button @click="closePurchaseForm" class="btn-secondary">
            Cancel
          </button>
        </section>

        <!-- Action Buttons -->
        <section class="action-section">
          <button 
            @click="handleRefresh" 
            :disabled="loading || isRefreshDisabled" 
            class="btn-primary btn-large"
          >
            <svg class="icon" :class="{ 'spin': loading }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            </svg>
            {{ refreshButtonText }}
          </button>
          
          <button 
            v-if="purchases.length === 0 && !showPurchaseForm" 
            @click="showPurchaseForm = true" 
            class="btn-secondary btn-large"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add First Purchase
          </button>

          <button 
            v-if="purchases.length > 0 && !showPurchaseForm" 
            @click="showPurchaseForm = true" 
            class="btn-secondary btn-large"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Purchase
          </button>
        </section>

        <!-- Calculator -->
        <section class="calculator-section">
          <h3 class="section-title-small">💰 Quick Calculator</h3>
          <div class="calc-controls">
            <input 
              v-model.number="calculatorAmount" 
              type="number" 
              min="0" 
              step="0.1"
              class="calc-input"
              placeholder="Enter amount"
            >
            <select v-model="calculatorUnit" class="calc-select">
              <option value="damlung">ដំឡឹង</option>
              <option value="chi">ជី</option>
              <option value="oz">Troy Oz</option>
              <option value="gram">Gram</option>
            </select>
          </div>
          
          <div v-if="calculatorAmount > 0" class="calc-result">
            <div class="calc-label">Estimated Value</div>
            <div class="calc-value">{{ formatCurrencyDisplay(memoizedCalculatorResult) }}</div>
          </div>
        </section>

        <!-- Status Footer -->
        <section class="status-footer">
          <div class="status-info">
            <span class="status-dot" :class="statusClass"></span>
            <span class="status-text">{{ lastUpdated }}</span>
          </div>
          <div class="quota-info">
            API: {{ apiQuota.dailyCalls }}/{{ apiQuota.dailyLimit }} today • {{ apiQuota.totalCalls }}/{{ apiQuota.monthlyLimit }} month
          </div>
        </section>

        <!-- API Error -->
        <section v-if="!loading && currentPrice === 0" class="error-section">
          <div class="error-message">⚠️ Unable to fetch prices</div>
          <button @click="tryAlternativeApi" class="btn-secondary">Try Alternative API</button>
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
      title: 'តម្លៃមាស - Gold Tracker',
      meta: [
        { hid: 'description', name: 'description', content: 'Gold price tracker for Cambodia' }
      ]
    }
  },

  data() {
    return {
      TROY_OUNCE_TO_GRAM: 31.1035,
      DAMLUNG_TO_GRAM: 37.5,
      CHI_TO_GRAM: 3.75,

      apiKey: '03cc06614a49b9d29f1d4cdb2250467d',
      apiBaseUrl: 'https://www.goldapi.io/api',
      alternativeApiUrl: 'https://api.metals.live/v1/spot',

      goldPrice: 0,
      loading: true,
      lastUpdated: 'Loading...',
      refreshCooldown: 0,
      
      isManualMode: false,
      manualPrice: null,
      manualGoldPrice: null,
      
      calculatorAmount: 1,
      calculatorUnit: 'damlung',
      
      purchases: [],
      showPurchaseForm: false,
      historyExpanded: true,
      newPurchase: {
        amount: null,
        totalPaid: null,
        date: new Date().toISOString().split('T')[0]
      },

      // Edit mode
      editingId: null,
      editingPurchase: null,
      
      apiQuota: {
        dailyCalls: 0,
        totalCalls: 0,
        lastCallDate: null,
        dailyLimit: 10,
        monthlyLimit: 100
      },
      
      cache: {
        gold: { data: null, timestamp: null, maxAgeHours: 24 }
      },

      fallbackPrices: {
        gold: 4000
      },

      manualPriceUpdateTimeout: null,
      currencyFormatCache: new Map(),
      purchaseValuesCache: new Map()
    };
  },
  
  computed: {
    currentPrice() {
      if (this.isManualMode && this.manualPrice) {
        return this.manualPrice;
      }
      return this.goldPrice;
    },

    statusClass() {
      if (this.loading) return 'loading';
      if (this.currentPrice > 0) return 'success';
      return 'error';
    },

    refreshButtonText() {
      if (this.loading) return 'Loading...';
      if (this.refreshCooldown > 0) return `Wait ${this.refreshCooldown}s`;
      if (this.isRefreshDisabled) return 'Limit Reached';
      return 'Refresh Prices';
    },

    isRefreshDisabled() {
      return this.apiQuota.dailyCalls >= this.apiQuota.dailyLimit;
    },

    memoizedSortedPurchases() {
      return [...this.purchases].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
    },

    memoizedDamlungPrice() {
      return this.formatCurrencyDisplay(this.getPricePerUnit('damlung', this.currentPrice));
    },

    memoizedChiPrice() {
      return this.formatCurrencyDisplay(this.getPricePerUnit('chi', this.currentPrice));
    },

    memoizedTotalInvested() {
      return this.purchases.reduce((sum, p) => sum + p.totalPaid, 0);
    },

    memoizedCurrentValue() {
      return this.purchases.reduce((sum, p) => sum + this.getPurchaseCurrentValueCached(p), 0);
    },

    memoizedProfitLoss() {
      return this.memoizedCurrentValue - this.memoizedTotalInvested;
    },

    memoizedProfitLossClass() {
      return this.memoizedProfitLoss >= 0 ? 'profit' : 'loss';
    },

    memoizedPurchaseValues() {
      const values = {};
      for (let purchase of this.purchases) {
        values[purchase.id] = this.getPurchaseCurrentValueCached(purchase);
      }
      return values;
    },

    memoizedPurchaseProfitValue() {
      const profits = {};
      for (let purchase of this.purchases) {
        profits[purchase.id] = this.memoizedPurchaseValues[purchase.id] - purchase.totalPaid;
      }
      return profits;
    },

    memoizedPurchaseProfitPercent() {
      const percents = {};
      for (let purchase of this.purchases) {
        const profitLoss = this.memoizedPurchaseProfitValue[purchase.id];
        const percentage = (profitLoss / purchase.totalPaid) * 100;
        percents[purchase.id] = percentage.toFixed(2);
      }
      return percents;
    },

    memoizedPurchaseProfitClass() {
      const classes = {};
      for (let purchase of this.purchases) {
        classes[purchase.id] = this.memoizedPurchaseProfitValue[purchase.id] >= 0 ? 'profit' : 'loss';
      }
      return classes;
    },

    memoizedCalculatorResult() {
      if (!this.calculatorAmount || !this.currentPrice) return 0;
      return this.calculatorAmount * this.getPricePerUnit(this.calculatorUnit, this.currentPrice);
    }
  },

  methods: {
    getPricePerUnit(unit, pricePerOz) {
      if (!pricePerOz) return 0;
      
      switch (unit) {
        case 'oz':
          return pricePerOz;
        case 'damlung':
          return pricePerOz * (this.DAMLUNG_TO_GRAM / this.TROY_OUNCE_TO_GRAM);
        case 'chi':
          return pricePerOz * (this.CHI_TO_GRAM / this.TROY_OUNCE_TO_GRAM);
        case 'gram':
          return pricePerOz / this.TROY_OUNCE_TO_GRAM;
        default:
          return pricePerOz;
      }
    },

    getCachedPrice() {
      const metalCache = this.cache.gold;
      const cacheAgeHours = metalCache.timestamp ? 
        (new Date() - new Date(metalCache.timestamp)) / (1000 * 60 * 60) : 999;
      
      return metalCache.data && cacheAgeHours < 24;
    },

    startEdit(purchase) {
      this.editingId = purchase.id;
      this.editingPurchase = {
        amount: purchase.amount,
        totalPaid: purchase.totalPaid,
        date: purchase.date
      };
    },

    saveEdit(purchaseId) {
      const purchaseIndex = this.purchases.findIndex(p => p.id === purchaseId);
      if (purchaseIndex !== -1 && this.editingPurchase.amount > 0 && this.editingPurchase.totalPaid > 0) {
        this.purchases[purchaseIndex] = {
          ...this.purchases[purchaseIndex],
          ...this.editingPurchase
        };
        this.purchaseValuesCache.clear();
        this.savePurchases();
        this.editingId = null;
        this.editingPurchase = null;
      }
    },

    cancelEdit() {
      this.editingId = null;
      this.editingPurchase = null;
    },

    enableManualMode() {
      this.isManualMode = true;
      this.manualPrice = this.currentPrice || 4242;
      this.manualGoldPrice = this.manualPrice;
      
      if (process.client) {
        localStorage.setItem('isManualMode', true);
        localStorage.setItem('manualPrice', this.manualPrice);
        
        this.$nextTick(() => {
          if (this.$refs.manualInput) {
            this.$refs.manualInput.focus();
            this.$refs.manualInput.select();
          }
        });
      }
    },

    onManualPriceInput() {
      clearTimeout(this.manualPriceUpdateTimeout);
      this.manualPriceUpdateTimeout = setTimeout(() => {
        this.updateManualPrice();
      }, 500);
    },

    updateManualPrice() {
      if (this.manualPrice && this.manualPrice > 0 && process.client) {
        this.manualGoldPrice = this.manualPrice;
        localStorage.setItem('manualGoldPrice', this.manualGoldPrice);
      }
    },

    clearManualPrice() {
      this.isManualMode = false;
      this.manualPrice = null;
      this.manualGoldPrice = null;
      
      if (process.client) {
        localStorage.removeItem('manualPrice');
        localStorage.removeItem('isManualMode');
        localStorage.removeItem('manualGoldPrice');
      }

      const cached = this.getCachedPrice();
      if (!cached) {
        this.fetchMetalPrice(false);
      }
    },

    formatCurrencyDisplay(value) {
      if (!value) return '$0.00';
      
      const cacheKey = `${value.toFixed(2)}`;
      
      if (this.currencyFormatCache.has(cacheKey)) {
        return this.currencyFormatCache.get(cacheKey);
      }

      const formatted = `$${value.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;
      
      this.currencyFormatCache.set(cacheKey, formatted);
      
      if (this.currencyFormatCache.size > 100) {
        const firstKey = this.currencyFormatCache.keys().next().value;
        this.currencyFormatCache.delete(firstKey);
      }

      return formatted;
    },

    getPurchaseCurrentValueCached(purchase) {
      const cacheKey = `${purchase.id}-${this.currentPrice}`;
      
      if (this.purchaseValuesCache.has(cacheKey)) {
        return this.purchaseValuesCache.get(cacheKey);
      }

      const currentPricePerOz = this.manualGoldPrice || this.goldPrice;
      const ozEquivalent = purchase.amount * (this.CHI_TO_GRAM / this.TROY_OUNCE_TO_GRAM);
      const value = ozEquivalent * currentPricePerOz;
      
      this.purchaseValuesCache.set(cacheKey, value);

      if (this.purchaseValuesCache.size > 200) {
        const firstKey = this.purchaseValuesCache.keys().next().value;
        this.purchaseValuesCache.delete(firstKey);
      }

      return value;
    },

    startRefreshCooldown() {
      this.refreshCooldown = 3;
      const timer = setInterval(() => {
        this.refreshCooldown--;
        if (this.refreshCooldown <= 0) {
          clearInterval(timer);
        }
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
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        
        const data = await response.json();
        
        if (data && typeof data.gold === 'number') {
          this.goldPrice = data.gold;
          const now = new Date();
          this.lastUpdated = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          
          this.cache.gold = {
            data: { price: data.gold },
            timestamp: now.toISOString(),
            maxAgeHours: 24
          };
          
          if (process.client) {
            localStorage.setItem('goldPriceCache', JSON.stringify(this.cache.gold));
          }
          return true;
        }
        return false;
      } catch (error) {
        console.error('Alternative API failed:', error);
        return false;
      }
    },

    getCurrentDate() {
      return new Date().toISOString().split('T')[0];
    },

    canAddPurchase() {
      return this.newPurchase.amount > 0 && this.newPurchase.totalPaid > 0 && this.newPurchase.date;
    },

    addPurchase() {
      if (!this.canAddPurchase()) return;

      const purchase = {
        id: Date.now(),
        amount: this.newPurchase.amount,
        totalPaid: this.newPurchase.totalPaid,
        date: this.newPurchase.date
      };

      this.purchases.push(purchase);
      this.purchaseValuesCache.clear();
      this.savePurchases();
      this.closePurchaseForm();
    },

    deletePurchase(purchaseId) {
      if (confirm('Delete this purchase?')) {
        this.purchases = this.purchases.filter(p => p.id !== purchaseId);
        this.purchaseValuesCache.clear();
        this.savePurchases();
      }
    },

    closePurchaseForm() {
      this.showPurchaseForm = false;
      this.newPurchase = {
        amount: null,
        totalPaid: null,
        date: new Date().toISOString().split('T')[0]
      };
    },

    toggleHistoryExpanded() {
      this.historyExpanded = !this.historyExpanded;
      if (process.client) {
        localStorage.setItem('historyExpanded', this.historyExpanded);
      }
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    },

    savePurchases() {
      if (process.client) {
        localStorage.setItem('purchases', JSON.stringify(this.purchases));
      }
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

      const savedExpanded = localStorage.getItem('historyExpanded');
      if (savedExpanded !== null) {
        this.historyExpanded = JSON.parse(savedExpanded);
      }
    },

    async fetchMetalPrice(userRequested = false) {
      const now = new Date();
      const metalCache = this.cache.gold;
      
      const cacheAgeHours = metalCache.timestamp ? 
        (now - new Date(metalCache.timestamp)) / (1000 * 60 * 60) : 999;
      
      if (metalCache.data && cacheAgeHours < metalCache.maxAgeHours) {
        this.goldPrice = metalCache.data.price;
        const hours = Math.floor(cacheAgeHours);
        const minutes = Math.floor((cacheAgeHours - hours) * 60);
        this.lastUpdated = hours > 0 ? `${hours}h ago` : `${minutes}m ago`;
        this.loading = false;
        return;
      }

      const today = new Date().toDateString();
      if (this.apiQuota.lastCallDate !== today) {
        this.apiQuota.dailyCalls = 0;
        this.apiQuota.lastCallDate = today;
      }

      if (this.apiQuota.dailyCalls >= this.apiQuota.dailyLimit) {
        if (!userRequested) {
          if (metalCache.data) {
            this.goldPrice = metalCache.data.price;
            this.lastUpdated = 'Using cached (limit reached)';
          } else {
            this.goldPrice = this.fallbackPrices.gold;
            this.lastUpdated = 'Estimated (limit reached)';
          }
          this.loading = false;
          return;
        } else {
          this.lastUpdated = 'Daily limit reached';
          this.loading = false;
          return;
        }
      }

      this.loading = true;
      
      try {
        const endpoint = `${this.apiBaseUrl}/XAU/USD`;
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'x-access-token': this.apiKey,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        
        if (!data || typeof data.price !== 'number') {
          throw new Error('Invalid data format');
        }
        
        this.goldPrice = data.price;
        this.apiQuota.dailyCalls++;
        this.apiQuota.totalCalls++;
        
        this.cache.gold = {
          data: data,
          timestamp: now.toISOString(),
          maxAgeHours: 24
        };
        
        if (process.client) {
          localStorage.setItem('apiQuota', JSON.stringify(this.apiQuota));
          localStorage.setItem('goldPriceCache', JSON.stringify(this.cache.gold));
        }
        
        this.lastUpdated = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
      } catch (error) {
        console.error('API Error:', error);
        
        const alternativeSuccess = await this.tryAlternativeApi();
        if (alternativeSuccess) {
          this.loading = false;
          return;
        }
        
        if (metalCache.data) {
          this.goldPrice = metalCache.data.price;
          this.lastUpdated = 'Using cached (API error)';
        } else {
          this.goldPrice = this.fallbackPrices.gold;
          this.lastUpdated = 'Estimated (API error)';
        }
      } finally {
        this.loading = false;
      }
    },

    loadSavedData() {
      if (!process.client) return false;

      try {
        const savedManualMode = localStorage.getItem('isManualMode');
        if (savedManualMode !== null) {
          this.isManualMode = JSON.parse(savedManualMode);
        }

        const savedManualPrice = localStorage.getItem('manualPrice');
        if (savedManualPrice) {
          this.manualPrice = parseFloat(savedManualPrice);
        }

        const savedManualGoldPrice = localStorage.getItem('manualGoldPrice');
        if (savedManualGoldPrice) {
          this.manualGoldPrice = parseFloat(savedManualGoldPrice);
        }

        const savedQuota = localStorage.getItem('apiQuota');
        if (savedQuota) {
          this.apiQuota = { ...this.apiQuota, ...JSON.parse(savedQuota) };
        }
        
        const savedGoldCache = localStorage.getItem('goldPriceCache');
        if (savedGoldCache) {
          this.cache.gold = JSON.parse(savedGoldCache);
          const cacheAge = (new Date() - new Date(this.cache.gold.timestamp)) / (1000 * 60 * 60);
          if (cacheAge < 24) {
            this.goldPrice = this.cache.gold.data.price;
          }
        }

        this.loadPurchases();

        if (this.cache.gold.data) {
          const cacheAge = (new Date() - new Date(this.cache.gold.timestamp)) / (1000 * 60 * 60);
          if (cacheAge < 24) {
            this.lastUpdated = `${Math.floor(cacheAge)}h ago`;
            this.loading = false;
            return true;
          }
        }
      } catch (e) {
        console.log('Failed to load saved data');
      }
      
      return false;
    }
  },

  mounted() {
    const hasCache = this.loadSavedData();
    if (!hasCache) {
      this.fetchMetalPrice(false);
    }
  },

  beforeDestroy() {
    if (this.manualPriceUpdateTimeout) clearTimeout(this.manualPriceUpdateTimeout);
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  color: #1a1a1a;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px;
}

@media (min-width: 768px) {
  .container {
    padding: 0 24px;
  }
}

/* Header */
.header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 24px 0;
  sticky: top;
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header .container {
  display: flex;
  align-items: center;
}

.title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: #1a1a1a;
}

/* Main */
.main {
  padding: 32px 0;
}

/* Hero Price */
.hero-price {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 20px;
  padding: 40px 32px;
  text-align: center;
  color: white;
  margin-bottom: 32px;
  box-shadow: 0 10px 30px rgba(251, 191, 36, 0.2);
  position: relative;
  overflow: hidden;
}

.hero-price::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  z-index: 0;
}

.price-label {
  font-size: 16px;
  font-weight: 600;
  opacity: 0.9;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.price-hero {
  font-size: 56px;
  font-weight: 900;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
  letter-spacing: -1px;
}

.price-sublabel {
  font-size: 14px;
  opacity: 0.85;
  position: relative;
  z-index: 1;
}

.skeleton-hero {
  height: 60px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 12px;
  margin: 12px auto;
  max-width: 250px;
  animation: pulse 2s infinite;
}

/* Quick Stats */
.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
}

.stat-label {
  font-size: 12px;
  color: #888;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: #fbbf24;
  margin-bottom: 4px;
}

.stat-sublabel {
  font-size: 11px;
  color: #aaa;
}

.skeleton-stat {
  height: 28px;
  background: #f0f0f0;
  border-radius: 8px;
  animation: pulse 2s infinite;
  margin: 8px 0;
}

/* Custom Price Section */
.custom-price-section {
  margin-bottom: 32px;
}

.custom-price-prompt {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border: 2px solid #e5e5e5;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  color: #1a1a1a;
}

.custom-price-prompt:hover {
  border-color: #fbbf24;
  background: #fffbeb;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.1);
}

.icon-edit {
  width: 20px;
  height: 20px;
  color: #fbbf24;
  flex-shrink: 0;
}

.custom-price-editor {
  background: white;
  border: 2px solid #fbbf24;
  border-radius: 16px;
  padding: 20px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.editor-label {
  font-size: 13px;
  font-weight: 600;
  color: #666;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: #f5f5f5;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #fee;
  color: #ef4444;
}

.btn-close svg {
  width: 16px;
  height: 16px;
}

.editor-input {
  position: relative;
  margin-bottom: 16px;
}

.currency-symbol {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  font-weight: 700;
  color: #fbbf24;
  pointer-events: none;
}

.price-input-large {
  width: 100%;
  padding: 16px 16px 16px 40px;
  border: 2px solid #e5e5e5;
  border-radius: 12px;
  font-size: 28px;
  font-weight: 700;
  background: #fafafa;
  color: #1a1a1a;
  transition: all 0.2s;
  text-align: center;
}

.price-input-large:focus {
  outline: none;
  border-color: #fbbf24;
  background: white;
  box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.1);
}

.conversions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.conversion {
  text-align: center;
}

.conversion-label {
  display: block;
  font-size: 11px;
  color: #888;
  font-weight: 600;
  margin-bottom: 4px;
}

.conversion-value {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #fbbf24;
}

/* Portfolio Section */
.portfolio-section {
  background: white;
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 20px 0;
  color: #1a1a1a;
}

.section-title-small {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #1a1a1a;
}

.custom-price-badge {
  display: inline-block;
  padding: 8px 12px;
  background: #fef3cd;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  font-size: 12px;
  color: #856404;
  margin-bottom: 16px;
}

.portfolio-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

.portfolio-card {
  background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
  border: 2px solid #e5e5e5;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s;
}

.portfolio-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.portfolio-card.invested {
  border-color: #d1fae5;
  background: #f0fdf4;
}

.portfolio-card.current {
  border-color: #bfdbfe;
  background: #f0f9ff;
}

.portfolio-card.profit {
  border-color: #d1fae5;
  background: linear-gradient(135deg, #f0fdf4 0%, #dbeafe 100%);
}

.portfolio-card.loss {
  border-color: #fee2e2;
  background: linear-gradient(135deg, #fef2f2 0%, #fef2f2 100%);
}

.portfolio-label {
  font-size: 12px;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.portfolio-value {
  font-size: 24px;
  font-weight: 800;
  color: #1a1a1a;
}

.portfolio-value-large {
  font-size: 28px;
  font-weight: 900;
}

.portfolio-card.profit .portfolio-value-large {
  color: #10b981;
}

.portfolio-card.loss .portfolio-value-large {
  color: #ef4444;
}

.portfolio-change {
  font-size: 12px;
  font-weight: 600;
  margin-top: 4px;
  opacity: 0.8;
}

/* History Section */
.history-section {
  background: white;
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.btn-toggle {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #f5f5f5;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-toggle:hover {
  background: #e5e5e5;
}

.btn-toggle svg {
  width: 20px;
  height: 20px;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

@media (max-width: 768px) {
  .history-grid {
    grid-template-columns: 1fr;
  }
}

.history-card {
  background: #f9fafb;
  border: 2px solid #e5e5e5;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s;
}

.history-card:hover {
  border-color: #fbbf24;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.15);
  transform: translateY(-2px);
}

.history-card.editing {
  border-color: #10b981;
  background: #f0fdf4;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e5e5;
}

.card-date {
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.card-actions {
  display: flex;
  gap: 6px;
}

.btn-action {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #aaa;
}

.btn-action svg {
  width: 16px;
  height: 16px;
}

.btn-edit:hover {
  background: #fef3cd;
  color: #fbbf24;
}

.btn-delete:hover {
  background: #fee;
  color: #ef4444;
}

/* Edit Mode */
.card-edit-mode {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edit-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.edit-label {
  font-size: 11px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
}

.edit-input {
  padding: 8px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  color: #1a1a1a;
}

.edit-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
}

.edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.btn-small {
  flex: 1;
  padding: 8px 12px;
  font-size: 13px;
}

/* Normal View */
.card-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-amount {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-radius: 8px;
  border: 1px solid #fbbf24;
}

.amount-label {
  font-size: 11px;
  color: #856404;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.amount-value {
  font-size: 20px;
  font-weight: 800;
  color: #1a1a1a;
}

.card-prices-compare {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  font-size: 12px;
}

.card-prices-compare > div {
  text-align: center;
  flex: 1;
}

.price-label {
  font-size: 10px;
  color: #888;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.price-value {
  font-size: 13px;
  font-weight: 700;
  color: #1a1a1a;
}

.arrow {
  color: #ddd;
  font-weight: bold;
  font-size: 14px;
}

.card-result {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 8px;
  background: #f0fdf4;
  border: 2px solid #10b981;
}

.card-result.loss {
  background: #fef2f2;
  border-color: #ef4444;
}

.result-emoji {
  font-size: 20px;
  flex-shrink: 0;
}

.result-info {
  flex: 1;
}

.result-label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: #10b981;
  margin-bottom: 2px;
}

.card-result.loss .result-label {
  color: #ef4444;
}

.result-value {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #10b981;
}

.card-result.loss .result-value {
  color: #ef4444;
}

.result-percent {
  font-size: 11px;
  font-weight: 700;
  color: #10b981;
}

.card-result.loss .result-percent {
  color: #ef4444;
}

/* Add Purchase Form */
.add-purchase-form {
  background: white;
  border: 2px solid #10b981;
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 32px;
  position: relative;
}

.form-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 20px 0;
  color: #1a1a1a;
  padding-right: 40px;
}

.add-purchase-form .btn-close {
  position: absolute;
  top: 20px;
  right: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 16px;
  border: 2px solid #e5e5e5;
  border-radius: 10px;
  font-size: 16px;
  background: #fafafa;
  color: #1a1a1a;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #10b981;
  background: white;
}

.form-input-currency {
  position: relative;
}

.currency-prefix {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  font-weight: 700;
  color: #10b981;
  pointer-events: none;
}

.form-input-currency input {
  width: 100%;
  padding: 16px 16px 16px 40px;
  border: 2px solid #e5e5e5;
  border-radius: 10px;
  font-size: 16px;
  background: #fafafa;
  color: #1a1a1a;
  transition: all 0.2s;
}

.form-input-currency input:focus {
  outline: none;
  border-color: #10b981;
  background: white;
}

.form-preview {
  background: #f0fdf4;
  border: 1px solid #10b981;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 6px 0;
  color: #666;
}

.preview-row.total {
  border-top: 1px solid #10b981;
  padding-top: 8px;
  margin-top: 8px;
  font-weight: 600;
  color: #1a1a1a;
}

/* Action Section */
.action-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 32px;
}

@media (max-width: 640px) {
  .action-section {
    grid-template-columns: 1fr;
  }
}

.btn-primary,
.btn-secondary {
  padding: 16px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-primary {
  background: #1a1a1a;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #000;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-secondary {
  background: #f5f5f5;
  color: #1a1a1a;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e5e5;
  transform: translateY(-2px);
}

.btn-large {
  padding: 18px 24px;
  font-size: 16px;
  min-height: 54px;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon {
  width: 18px;
  height: 18px;
}

.icon.spin {
  animation: spin 1s linear infinite;
}

/* Calculator */
.calculator-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.calc-controls {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.calc-input,
.calc-select {
  padding: 12px;
  border: 2px solid #e5e5e5;
  border-radius: 8px;
  font-size: 14px;
  background: #fafafa;
  color: #1a1a1a;
  transition: all 0.2s;
}

.calc-input:focus,
.calc-select:focus {
  outline: none;
  border-color: #fbbf24;
  background: white;
}

.calc-result {
  text-align: center;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.calc-label {
  font-size: 12px;
  color: #888;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.calc-value {
  font-size: 28px;
  font-weight: 800;
  color: #fbbf24;
}

/* Status Footer */
.status-footer {
  background: white;
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  flex-wrap: wrap;
  gap: 12px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.loading {
  background: #fbbf24;
  animation: pulse 2s infinite;
}

.status-dot.success {
  background: #22c55e;
}

.status-dot.error {
  background: #ef4444;
}

.quota-info {
  font-size: 12px;
  color: #999;
}

/* Error Section */
.error-section {
  background: #fef3cd;
  border: 2px solid #fbbf24;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  margin-bottom: 32px;
}

.error-message {
  font-size: 16px;
  font-weight: 600;
  color: #856404;
  margin-bottom: 16px;
}

/* Animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Remove number spinners */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>