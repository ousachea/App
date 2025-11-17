<!-- pages/index.vue - FIXED CALCULATIONS VERSION -->

<template>
  <div class="app" :class="{ 'dark': isDarkMode }">
    <!-- Minimal Header -->
    <header class="header">
      <div class="container">
        <h1 class="title">តម្លៃមាស & ប្រាក់</h1>
        <div class="controls">
          <button @click="toggleDarkMode" class="control-btn" :title="isDarkMode ? 'Light' : 'Dark'">
            <svg v-if="isDarkMode" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>
          <button @click="toggleCurrency" class="control-btn currency">
            {{ currentCurrency }}
          </button>
        </div>
      </div>
    </header>

    <main class="main">
      <div class="container">
        
        <!-- Metal Type Selector -->
        <div class="metal-selector">
          <button 
            @click="selectMetal('gold')" 
            class="metal-btn" 
            :class="{ 'active': selectedMetal === 'gold' }"
          >
            <span class="metal-icon gold-icon">Au</span>
            <span>Gold</span>
          </button>
          <button 
            @click="selectMetal('silver')" 
            class="metal-btn" 
            :class="{ 'active': selectedMetal === 'silver' }"
          >
            <span class="metal-icon silver-icon">Ag</span>
            <span>Silver</span>
          </button>
        </div>

        <!-- Manual Price Input -->
        <div class="manual-section" :class="{ 'expanded': isManualMode }">
          <div v-if="!isManualMode" class="manual-prompt">
            <div class="prompt-content">
              <svg class="prompt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <div>
                <div class="prompt-title">Set Custom Price</div>
                <div class="prompt-desc">Enter your own price to calculate</div>
              </div>
            </div>
            <button @click="enableManualMode" class="prompt-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>

          <div v-else class="manual-input-expanded">
            <div class="input-header">
              <label class="input-label">Troy Oz Price (USD)</label>
              <button @click="clearManualPrice" class="close-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div class="input-with-currency">
              <span class="currency-symbol">$</span>
              <input 
                v-model.number="manualPrice" 
                type="number" 
                step="0.01"
                min="0"
                class="price-input"
                :placeholder="selectedMetal === 'gold' ? '4242.00' : '28.00'"
                @input="onManualPriceInput"
                ref="manualInput"
              >
            </div>

            <div v-if="manualPrice > 0" class="quick-conversions">
              <div class="conversion-item">
                <span class="conversion-label">ដំឡឹង</span>
                <span class="conversion-value">{{ formatCurrencyDisplay(getPricePerUnit('damlung', manualPrice)) }}</span>
              </div>
              <div class="conversion-item">
                <span class="conversion-label">ជី</span>
                <span class="conversion-value">{{ formatCurrencyDisplay(getPricePerUnit('chi', manualPrice)) }}</span>
              </div>
              <div class="conversion-item">
                <span class="conversion-label">Gram</span>
                <span class="conversion-value">{{ formatCurrencyDisplay(getPricePerUnit('gram', manualPrice)) }}</span>
              </div>
            </div>

            <div class="manual-badge-notice">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              Using custom price (no API calls)
            </div>
          </div>
        </div>

        <!-- Price Display -->
        <div class="price-section">
          <div class="price-card main-card">
            <div class="label">ដំឡឹង</div>
            <div v-if="loading" class="skeleton"></div>
            <div v-else class="price">{{ memoizedDamlungPrice }}</div>
            <div class="sublabel">37.5g</div>
          </div>

          <div class="price-row">
            <div class="price-card">
              <div class="label">ជី</div>
              <div v-if="loading" class="skeleton small"></div>
              <div v-else class="price small">{{ memoizedChiPrice }}</div>
              <div class="sublabel">3.75g</div>
            </div>
            <div class="price-card">
              <div class="label">Troy Oz</div>
              <div v-if="loading" class="skeleton small"></div>
              <div v-else class="price small">{{ formatCurrencyDisplay(currentPrice) }}</div>
              <div class="sublabel">31.1g</div>
            </div>
          </div>
        </div>

        <!-- Portfolio Summary -->
        <div v-if="purchases.length > 0" class="portfolio-summary">
          <div class="summary-header">
            <h3 class="summary-title">📊 Your Portfolio</h3>
            <button @click="showPurchaseForm = true" class="add-purchase-btn-mini">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
          
          <div v-if="manualGoldPrice" class="using-custom-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>
              Using your custom price: ${{ manualGoldPrice.toFixed(2) }}/oz 
              (= ${{ (manualGoldPrice * (CHI_TO_GRAM / TROY_OUNCE_TO_GRAM)).toFixed(2) }}/ជី)
            </span>
          </div>
          
          <div class="summary-explanation">
            <div class="explanation-row">
              <span class="explanation-label">💰 You paid total:</span>
              <span class="explanation-value">{{ formatCurrencyDisplay(memoizedTotalInvested) }}</span>
            </div>
            <div class="explanation-row">
              <span class="explanation-label">📈 Today's value:</span>
              <span class="explanation-value">{{ formatCurrencyDisplay(memoizedCurrentValue) }}</span>
            </div>
            <div class="explanation-divider"></div>
            <div class="explanation-row result" :class="memoizedProfitLossClass">
              <span class="explanation-label">
                {{ memoizedProfitLoss >= 0 ? '✅ You earned:' : '❌ You lost:' }}
              </span>
              <span class="explanation-value-big">
                {{ formatCurrencyDisplay(Math.abs(memoizedProfitLoss)) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Purchase Form -->
        <div v-if="showPurchaseForm" class="purchase-form">
          <div class="form-header">
            <h3 class="form-title">Add Gold Purchase</h3>
            <button @click="closePurchaseForm" class="close-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="form-group">
            <label class="form-label">How many ជី (Chi) did you buy?</label>
            <input 
              v-model.number="newPurchase.amount" 
              type="number" 
              step="0.01"
              min="0"
              class="form-input-large"
              placeholder="2"
            >
            <div class="input-hint">Enter the amount in ជី only</div>
          </div>

          <div class="form-group">
            <label class="form-label">How much did you pay? (USD)</label>
            <div class="input-with-currency">
              <span class="currency-symbol">$</span>
              <input 
                v-model.number="newPurchase.totalPaid" 
                type="number" 
                step="0.01"
                min="0"
                class="form-input-currency-large"
                placeholder="1020.00"
              >
            </div>
            <div class="input-hint">Total amount you paid in USD</div>
          </div>

          <div class="form-group">
            <label class="form-label">When did you buy it?</label>
            <input 
              v-model="newPurchase.date" 
              type="date" 
              class="form-input"
              :max="getCurrentDate()"
            >
          </div>

          <div v-if="newPurchase.amount > 0 && newPurchase.totalPaid > 0" class="purchase-summary">
            <div class="purchase-summary-item">
              <span>You bought:</span>
              <strong>{{ newPurchase.amount }} ជី gold</strong>
            </div>
            <div class="purchase-summary-item">
              <span>Price per ជី:</span>
              <strong>{{ formatCurrencyDisplay(newPurchase.totalPaid / newPurchase.amount) }}</strong>
            </div>
            <div class="purchase-summary-item">
              <span>Total paid:</span>
              <strong>{{ formatCurrencyDisplay(newPurchase.totalPaid) }}</strong>
            </div>
          </div>

          <button @click="addPurchase" class="btn btn-primary" :disabled="!canAddPurchase()">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Save Purchase
          </button>
        </div>

        <!-- Purchase History -->
        <div v-if="purchases.length > 0" class="purchase-history">
          <div class="history-header">
            <h3 class="history-title">Purchase History</h3>
            <button @click="toggleHistoryExpanded" class="toggle-btn">
              <svg v-if="!historyExpanded" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="18 15 12 9 6 15"/>
              </svg>
            </button>
          </div>

          <div v-if="historyExpanded" class="history-list">
            <div class="history-grid">
              <div v-for="purchase in memoizedSortedPurchases" :key="purchase.id" class="purchase-card">
                
                <!-- Card Header -->
                <div class="card-header">
                  <div class="card-date">
                    <span class="date-icon">📅</span>
                    <span class="date-text">{{ formatDate(purchase.date) }}</span>
                  </div>
                  <button @click="deletePurchase(purchase.id)" class="card-delete-btn" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>

                <!-- Amount Badge -->
                <div class="card-amount">
                  <div class="metal-badge-large">
                    <span class="metal-icon-large">Au</span>
                    <span class="metal-label">Gold</span>
                  </div>
                  <div class="amount-value">
                    <span class="amount-number">{{ purchase.amount }}</span>
                    <span class="amount-unit">ជី</span>
                  </div>
                </div>

                <!-- Price Comparison -->
                <div class="card-prices">
                  <div class="price-section purchase-section">
                    <div class="price-label">Purchase Price</div>
                    <div class="price-amount">{{ formatCurrencyDisplay(purchase.totalPaid) }}</div>
                    <div class="price-per-unit">{{ formatCurrencyDisplay(purchase.totalPaid / purchase.amount) }} per ជី</div>
                  </div>

                  <div class="price-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </div>

                  <div class="price-section current-section">
                    <div class="price-label">Current Value</div>
                    <div class="price-amount">{{ formatCurrencyDisplay(memoizedPurchaseValues[purchase.id]) }}</div>
                    <div class="price-per-unit">{{ formatCurrencyDisplay(memoizedPurchaseValues[purchase.id] / purchase.amount) }} per ជី</div>
                  </div>
                </div>

                <!-- Result Badge -->
                <div class="card-result" :class="memoizedPurchaseProfitClass[purchase.id]">
                  <div class="result-icon-large">
                    {{ memoizedPurchaseProfitValue[purchase.id] >= 0 ? '📈' : '📉' }}
                  </div>
                  <div class="result-info">
                    <div class="result-label">
                      {{ memoizedPurchaseProfitValue[purchase.id] >= 0 ? 'Profit' : 'Loss' }}
                    </div>
                    <div class="result-value">
                      {{ formatCurrencyDisplay(Math.abs(memoizedPurchaseProfitValue[purchase.id])) }}
                    </div>
                    <div class="result-percentage">
                      {{ memoizedPurchaseProfitValue[purchase.id] >= 0 ? '+' : '-' }}{{ memoizedPurchaseProfitPercent[purchase.id] }}%
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        <!-- Add Purchase Button -->
        <div v-if="!showPurchaseForm" class="add-purchase-section">
          <button @click="showPurchaseForm = true" class="btn btn-secondary">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Purchase
          </button>
        </div>

        <!-- Calculator -->
        <div class="calculator">
          <div class="calc-input-group">
            <input 
              v-model.number="calculatorAmount" 
              type="number" 
              min="0" 
              step="0.1"
              class="calc-input"
              placeholder="Amount"
            >
            <select v-model="calculatorUnit" class="calc-select">
              <option value="damlung">ដំឡឹង</option>
              <option value="chi">ជី</option>
              <option value="oz">Troy Oz</option>
              <option value="gram">Gram</option>
            </select>
          </div>
          
          <div v-if="calculatorAmount > 0" class="calc-result">
            {{ formatCurrencyDisplay(memoizedCalculatorResult) }}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="actions">
          <button 
            @click="handleRefresh" 
            :disabled="loading || isRefreshDisabled" 
            class="btn btn-primary"
          >
            <svg class="icon" :class="{ 'spin': loading }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            </svg>
            {{ refreshButtonText }}
          </button>
          
          <button 
            v-if="!isManualMode" 
            @click="enableManualMode" 
            class="btn btn-secondary"
          >
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Custom Price
          </button>
        </div>

        <!-- Status -->
        <div class="status">
          <span class="status-dot" :class="statusClass"></span>
          <span class="status-text">{{ lastUpdated }}</span>
          <span class="quota-text">
            {{ apiQuota.dailyCalls }}/{{ apiQuota.dailyLimit }} today • 
            {{ apiQuota.totalCalls }}/{{ apiQuota.monthlyLimit }} month
          </span>
        </div>

        <!-- Alternative API Button -->
        <div v-if="!loading && currentPrice === 0" class="api-error-section">
          <div class="error-message">
            ⚠️ Unable to fetch prices from main API
          </div>
          <button @click="tryAlternativeApi" class="btn btn-secondary">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
            Try Alternative API
          </button>
        </div>

        <!-- Tips for Free API Usage -->
        <div class="tip-box">
          <p class="tip-title">💡 Tips for Free API</p>
          <ul class="tip-list">
            <li>Price cached for 24 hours</li>
            <li>Use "Manual Price" to avoid API calls</li>
            <li>3 refreshes per day maximum</li>
            <li>Price updates once daily is recommended</li>
          </ul>
        </div>

      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'GoldSilverTracker',
  
  head() {
    return {
      title: 'តម្លៃមាស & ប្រាក់ - Gold & Silver Tracker',
      meta: [
        { hid: 'description', name: 'description', content: 'Gold and Silver price tracker for Cambodia' }
      ]
    }
  },

  data() {
    return {
      // Constants - CORRECTED
      TROY_OUNCE_TO_GRAM: 31.1035,
      DAMLUNG_TO_GRAM: 37.5,      // 1 ដំឡឹង = 37.5g
      CHI_TO_GRAM: 3.75,           // 1 ជី = 3.75g (1/10 of damlung)
      USD_TO_KHR: 4100,

      // API
      apiKey: '03cc06614a49b9d29f1d4cdb2250467d',
      apiBaseUrl: 'https://www.goldapi.io/api',
      alternativeApiUrl: 'https://api.metals.live/v1/spot',

      // State
      selectedMetal: 'gold',
      goldPrice: 0,
      silverPrice: 0,
      loading: true,
      lastUpdated: 'Loading...',
      
      // UI
      isDarkMode: false,
      currentCurrency: 'USD',
      refreshCooldown: 0,
      
      // Manual Price
      isManualMode: false,
      manualPrice: null,
      manualGoldPrice: null,
      manualSilverPrice: null,
      
      // Calculator
      calculatorAmount: 1,
      calculatorUnit: 'damlung',
      
      // Purchase Tracking
      purchases: [],
      showPurchaseForm: false,
      historyExpanded: true,
      newPurchase: {
        metal: 'gold',
        amount: null,
        unit: 'chi',
        totalPaid: null,
        date: new Date().toISOString().split('T')[0]
      },
      
      // API Quota
      apiQuota: {
        dailyCalls: 0,
        totalCalls: 0,
        lastCallDate: null,
        dailyLimit: 10,
        monthlyLimit: 100
      },
      
      // Cache
      cache: {
        gold: { data: null, timestamp: null, maxAgeHours: 24 },
        silver: { data: null, timestamp: null, maxAgeHours: 24 }
      },

      // Fallback prices
      fallbackPrices: {
        gold: 2650,
        silver: 28
      },

      // Performance optimization
      metalSwitchTimeout: null,
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
      return this.selectedMetal === 'gold' ? this.goldPrice : this.silverPrice;
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
      return 'Refresh';
    },

    isRefreshDisabled() {
      return this.apiQuota.dailyCalls >= this.apiQuota.dailyLimit;
    },

    // OPTIMIZED: Memoized sorted purchases
    memoizedSortedPurchases() {
      return [...this.purchases].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
    },

    // FIXED: Memoized price conversions
    memoizedDamlungPrice() {
      return this.formatCurrencyDisplay(this.getPricePerUnit('damlung', this.currentPrice));
    },

    memoizedChiPrice() {
      return this.formatCurrencyDisplay(this.getPricePerUnit('chi', this.currentPrice));
    },

    // OPTIMIZED: Memoized portfolio calculations
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

    // OPTIMIZED: Pre-calculated purchase values
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

    // OPTIMIZED: Calculator result memoization
    memoizedCalculatorResult() {
      if (!this.calculatorAmount || !this.currentPrice) return 0;
      return this.calculatorAmount * this.getPricePerUnit(this.calculatorUnit, this.currentPrice);
    }
  },

  methods: {
    // FIXED: Corrected price per unit calculation
    // Returns the price of the specified unit based on troy oz price
    getPricePerUnit(unit, pricePerOz) {
      if (!pricePerOz) return 0;
      
      // Convert troy oz to the requested unit
      switch (unit) {
        case 'oz':
          return pricePerOz;
        case 'damlung':
          // 1 troy oz = 31.1035g, 1 damlung = 37.5g
          return pricePerOz * (this.DAMLUNG_TO_GRAM / this.TROY_OUNCE_TO_GRAM);
        case 'chi':
          // 1 troy oz = 31.1035g, 1 ជី = 3.75g
          return pricePerOz * (this.CHI_TO_GRAM / this.TROY_OUNCE_TO_GRAM);
        case 'gram':
          // 1 troy oz = 31.1035g, 1 gram = 1g
          return pricePerOz / this.TROY_OUNCE_TO_GRAM;
        default:
          return pricePerOz;
      }
    },

    // OPTIMIZED: Metal selection with debounce
    selectMetal(metal) {
      if (this.selectedMetal === metal) return;
      
      clearTimeout(this.metalSwitchTimeout);
      this.metalSwitchTimeout = setTimeout(() => {
        this.selectedMetal = metal;
        
        if (process.client) {
          localStorage.setItem('selectedMetal', metal);
        }

        // Clear manual mode when switching
        if (this.isManualMode) {
          this.isManualMode = false;
          this.manualPrice = null;
        }

        this.newPurchase.metal = metal;

        // Check cache before fetching
        const cached = this.getCachedPrice(metal);
        if (!cached) {
          this.fetchMetalPrice(false);
        }
      }, 100);
    },

    // OPTIMIZED: Centralized cache getter
    getCachedPrice(metal) {
      const metalCache = this.cache[metal];
      const cacheAgeHours = metalCache.timestamp ? 
        (new Date() - new Date(metalCache.timestamp)) / (1000 * 60 * 60) : 999;
      
      return metalCache.data && cacheAgeHours < 24;
    },

    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
      if (process.client) {
        localStorage.setItem('darkMode', this.isDarkMode);
      }
    },

    toggleCurrency() {
      this.currentCurrency = this.currentCurrency === 'USD' ? 'KHR' : 'USD';
      this.currencyFormatCache.clear();
      if (process.client) {
        localStorage.setItem('currency', this.currentCurrency);
      }
    },

    enableManualMode() {
      this.isManualMode = true;
      this.manualPrice = this.currentPrice || (this.selectedMetal === 'gold' ? 4242 : 28);
      
      if (this.selectedMetal === 'gold') {
        this.manualGoldPrice = this.manualPrice;
      } else {
        this.manualSilverPrice = this.manualPrice;
      }
      
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

    // OPTIMIZED: Debounced manual price input
    onManualPriceInput() {
      clearTimeout(this.manualPriceUpdateTimeout);
      this.manualPriceUpdateTimeout = setTimeout(() => {
        this.updateManualPrice();
      }, 500);
    },

    updateManualPrice() {
      if (this.manualPrice && this.manualPrice > 0 && process.client) {
        if (this.selectedMetal === 'gold') {
          this.manualGoldPrice = this.manualPrice;
          localStorage.setItem('manualGoldPrice', this.manualGoldPrice);
        } else {
          this.manualSilverPrice = this.manualPrice;
          localStorage.setItem('manualSilverPrice', this.manualSilverPrice);
        }
      }
    },

    clearManualPrice() {
      this.isManualMode = false;
      this.manualPrice = null;
      
      if (this.selectedMetal === 'gold') {
        this.manualGoldPrice = null;
        if (process.client) localStorage.removeItem('manualGoldPrice');
      } else {
        this.manualSilverPrice = null;
        if (process.client) localStorage.removeItem('manualSilverPrice');
      }
      
      if (process.client) {
        localStorage.removeItem('manualPrice');
        localStorage.removeItem('isManualMode');
      }

      // Check if cache is stale
      const cached = this.getCachedPrice(this.selectedMetal);
      if (!cached) {
        this.fetchMetalPrice(false);
      }
    },

    // OPTIMIZED: Efficient currency formatting with caching
    formatCurrencyDisplay(value) {
      if (!value) return this.currentCurrency === 'USD' ? '$0.00' : '0 ៛';
      
      const cacheKey = `${value.toFixed(2)}-${this.currentCurrency}`;
      
      if (this.currencyFormatCache.has(cacheKey)) {
        return this.currencyFormatCache.get(cacheKey);
      }

      let formatted;
      if (this.currentCurrency === 'USD') {
        formatted = `$${value.toLocaleString(undefined, { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}`;
      } else {
        const khrValue = value * this.USD_TO_KHR;
        formatted = `${Math.round(khrValue).toLocaleString()} ៛`;
      }
      
      this.currencyFormatCache.set(cacheKey, formatted);
      
      if (this.currencyFormatCache.size > 100) {
        const firstKey = this.currencyFormatCache.keys().next().value;
        this.currencyFormatCache.delete(firstKey);
      }

      return formatted;
    },

    // FIXED: Corrected purchase current value calculation
    getPurchaseCurrentValueCached(purchase) {
      const cacheKey = `${purchase.id}-${this.currentPrice}`;
      
      if (this.purchaseValuesCache.has(cacheKey)) {
        return this.purchaseValuesCache.get(cacheKey);
      }

      // Get current price per troy oz for this metal
      const currentPricePerOz = purchase.metal === 'gold' ? 
        (this.manualGoldPrice || this.goldPrice) : 
        (this.manualSilverPrice || this.silverPrice);
      
      // Purchases are stored in ជី, convert to troy oz then calculate value
      // purchase.amount is in ជី, need to convert to troy oz first, then multiply by current price
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
        console.log('🔄 Trying alternative API: metals.live');
        const response = await fetch(this.alternativeApiUrl);
        
        if (!response.ok) {
          throw new Error(`Alternative API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && typeof data.gold === 'number') {
          this.goldPrice = data.gold;
          this.silverPrice = data.silver || 28;
          
          const now = new Date();
          this.lastUpdated = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          });
          
          this.cache.gold = {
            data: { price: data.gold },
            timestamp: now.toISOString(),
            maxAgeHours: 24
          };
          
          this.cache.silver = {
            data: { price: data.silver || 28 },
            timestamp: now.toISOString(),
            maxAgeHours: 24
          };
          
          if (process.client) {
            this.batchSaveToLocalStorage({
              goldPriceCache: this.cache.gold,
              silverPriceCache: this.cache.silver
            });
          }
          
          console.log('✅ Alternative API successful');
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('❌ Alternative API failed:', error);
        return false;
      }
    },

    getCurrentDate() {
      return new Date().toISOString().split('T')[0];
    },

    canAddPurchase() {
      return this.newPurchase.amount > 0 && 
             this.newPurchase.totalPaid > 0 && 
             this.newPurchase.date;
    },

    addPurchase() {
      if (!this.canAddPurchase()) return;

      const purchase = {
        id: Date.now(),
        metal: this.newPurchase.metal,
        amount: this.newPurchase.amount,
        unit: 'chi',  // Always store in chi
        totalPaid: this.newPurchase.totalPaid,
        date: this.newPurchase.date
      };

      this.purchases.push(purchase);
      this.purchaseValuesCache.clear();
      this.savePurchases();
      this.closePurchaseForm();
    },

    deletePurchase(purchaseId) {
      if (confirm('Are you sure you want to delete this purchase?')) {
        this.purchases = this.purchases.filter(p => p.id !== purchaseId);
        this.purchaseValuesCache.clear();
        this.savePurchases();
      }
    },

    closePurchaseForm() {
      this.showPurchaseForm = false;
      this.newPurchase = {
        metal: 'gold',
        amount: null,
        unit: 'chi',
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
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    },

    batchSaveToLocalStorage(items) {
      if (!process.client) return;
      Object.entries(items).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });
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
      const metalSymbol = this.selectedMetal === 'gold' ? 'XAU' : 'XAG';
      const metalCache = this.cache[this.selectedMetal];
      
      // Check cache first
      const cacheAgeHours = metalCache.timestamp ? 
        (now - new Date(metalCache.timestamp)) / (1000 * 60 * 60) : 999;
      
      if (metalCache.data && cacheAgeHours < metalCache.maxAgeHours) {
        if (this.selectedMetal === 'gold') {
          this.goldPrice = metalCache.data.price;
        } else {
          this.silverPrice = metalCache.data.price;
        }
        const hours = Math.floor(cacheAgeHours);
        const minutes = Math.floor((cacheAgeHours - hours) * 60);
        this.lastUpdated = hours > 0 ? `${hours}h ago` : `${minutes}m ago`;
        this.loading = false;
        return;
      }

      // Check daily quota
      const today = new Date().toDateString();
      if (this.apiQuota.lastCallDate !== today) {
        this.apiQuota.dailyCalls = 0;
        this.apiQuota.lastCallDate = today;
      }

      // Check limits
      if (this.apiQuota.dailyCalls >= this.apiQuota.dailyLimit) {
        if (!userRequested) {
          if (metalCache.data) {
            if (this.selectedMetal === 'gold') {
              this.goldPrice = metalCache.data.price;
            } else {
              this.silverPrice = metalCache.data.price;
            }
            this.lastUpdated = 'Using cached (limit reached)';
          } else {
            const fallback = this.fallbackPrices[this.selectedMetal];
            if (this.selectedMetal === 'gold') {
              this.goldPrice = fallback;
            } else {
              this.silverPrice = fallback;
            }
            this.lastUpdated = 'Estimated (limit reached)';
          }
          this.loading = false;
          return;
        } else {
          this.lastUpdated = 'Daily limit reached (3/3)';
          this.loading = false;
          return;
        }
      }

      this.loading = true;
      
      try {
        const endpoint = `${this.apiBaseUrl}/${metalSymbol}/USD`;
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'x-access-token': this.apiKey,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data || typeof data.price !== 'number') {
          throw new Error('Invalid data format from API');
        }
        
        if (this.selectedMetal === 'gold') {
          this.goldPrice = data.price;
        } else {
          this.silverPrice = data.price;
        }
        this.apiQuota.dailyCalls++;
        this.apiQuota.totalCalls++;
        this.apiQuota.lastCallDate = today;
        
        this.cache[this.selectedMetal] = {
          data: data,
          timestamp: now.toISOString(),
          maxAgeHours: 24
        };
        
        if (process.client) {
          this.batchSaveToLocalStorage({
            apiQuota: this.apiQuota,
            [`${this.selectedMetal}PriceCache`]: this.cache[this.selectedMetal]
          });
        }
        
        this.lastUpdated = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
        
      } catch (error) {
        console.error('❌ API Error:', error);
        
        const alternativeSuccess = await this.tryAlternativeApi();
        if (alternativeSuccess) {
          this.loading = false;
          return;
        }
        
        if (metalCache.data) {
          if (this.selectedMetal === 'gold') {
            this.goldPrice = metalCache.data.price;
          } else {
            this.silverPrice = metalCache.data.price;
          }
          this.lastUpdated = 'Using cached (API error)';
        } else {
          const fallback = this.fallbackPrices[this.selectedMetal];
          if (this.selectedMetal === 'gold') {
            this.goldPrice = fallback;
          } else {
            this.silverPrice = fallback;
          }
          this.lastUpdated = 'Estimated (API error)';
        }
      } finally {
        this.loading = false;
      }
    },

    loadSavedData() {
      if (!process.client) return false;

      try {
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode !== null) {
          this.isDarkMode = JSON.parse(savedDarkMode);
        }

        const savedCurrency = localStorage.getItem('currency');
        if (savedCurrency) {
          this.currentCurrency = savedCurrency;
        }

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

        const savedManualSilverPrice = localStorage.getItem('manualSilverPrice');
        if (savedManualSilverPrice) {
          this.manualSilverPrice = parseFloat(savedManualSilverPrice);
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

        const savedSilverCache = localStorage.getItem('silverPriceCache');
        if (savedSilverCache) {
          this.cache.silver = JSON.parse(savedSilverCache);
          const cacheAge = (new Date() - new Date(this.cache.silver.timestamp)) / (1000 * 60 * 60);
          if (cacheAge < 24) {
            this.silverPrice = this.cache.silver.data.price;
          }
        }

        this.loadPurchases();

        const currentMetalCache = this.cache[this.selectedMetal];
        if (currentMetalCache.data) {
          const cacheAge = (new Date() - new Date(currentMetalCache.timestamp)) / (1000 * 60 * 60);
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
    const savedMetal = process.client ? localStorage.getItem('selectedMetal') : null;
    if (savedMetal) {
      this.selectedMetal = savedMetal;
    }

    const hasCache = this.loadSavedData();
    if (!hasCache) {
      this.fetchMetalPrice(false);
    }

    this.newPurchase.metal = this.selectedMetal;
  },

  beforeDestroy() {
    if (this.metalSwitchTimeout) clearTimeout(this.metalSwitchTimeout);
    if (this.manualPriceUpdateTimeout) clearTimeout(this.manualPriceUpdateTimeout);
  }
}
</script>

<style scoped>
/* Base */
.app {
  min-height: 100vh;
  background: #fafafa;
  color: #1a1a1a;
  transition: all 0.3s ease;
}

.app.dark {
  background: #0a0a0a;
  color: #e5e5e5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

@media (min-width: 768px) {
  .container {
    padding: 0 32px;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 0 40px;
  }
}

/* Header */
.header {
  background: white;
  border-bottom: 1px solid #e5e5e5;
  padding: 20px 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.app.dark .header {
  background: #1a1a1a;
  border-bottom-color: #2a2a2a;
}

.header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.controls {
  display: flex;
  gap: 8px;
}

.control-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: #f5f5f5;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.app.dark .control-btn {
  background: #2a2a2a;
}

.control-btn:hover {
  background: #e5e5e5;
}

.app.dark .control-btn:hover {
  background: #333;
}

.control-btn svg {
  width: 18px;
  height: 18px;
}

.control-btn.currency {
  font-size: 11px;
  font-weight: 600;
}

/* Metal Selector */
.metal-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}

.metal-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border: 2px solid #e5e5e5;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
}

.app.dark .metal-btn {
  background: #1a1a1a;
  border-color: #2a2a2a;
  color: #e5e5e5;
}

.metal-btn.active {
  border-color: #fbbf24;
  background: #fffbeb;
}

.app.dark .metal-btn.active {
  background: #1f1a0f;
  border-color: #fbbf24;
  color: #fbbf24;
}

.metal-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: white;
}

.metal-icon.small {
  width: 22px;
  height: 22px;
  font-size: 10px;
}

.gold-icon {
  background: #fbbf24;
}

.silver-icon {
  background: #9ca3af;
}

/* Main */
.main {
  padding: 32px 0;
  min-height: calc(100vh - 80px);
}

/* Manual Section */
.manual-section {
  margin-bottom: 24px;
  transition: all 0.3s ease;
}

.manual-section.expanded {
  margin-bottom: 32px;
}

/* Manual Prompt */
.manual-prompt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: white;
  border: 2px dashed #e5e5e5;
  border-radius: 12px;
  transition: all 0.2s;
}

.app.dark .manual-prompt {
  background: #1a1a1a;
  border-color: #2a2a2a;
}

.manual-prompt:hover {
  border-color: #fbbf24;
  background: #fefcf5;
}

.app.dark .manual-prompt:hover {
  background: #1f1a0f;
}

.prompt-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.prompt-icon {
  width: 24px;
  height: 24px;
  color: #fbbf24;
  flex-shrink: 0;
}

.prompt-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 2px;
}

.app.dark .prompt-title {
  color: #e5e5e5;
}

.prompt-desc {
  font-size: 12px;
  color: #666;
}

.app.dark .prompt-desc {
  color: #999;
}

.prompt-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: #fbbf24;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.prompt-btn:hover {
  background: #f59e0b;
  transform: scale(1.05);
}

.prompt-btn svg {
  width: 16px;
  height: 16px;
}

/* Manual Input */
.manual-input-expanded {
  background: white;
  border: 2px solid #fbbf24;
  border-radius: 16px;
  padding: 20px;
  animation: expandIn 0.3s ease;
}

.app.dark .manual-input-expanded {
  background: #1a1a1a;
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.input-label {
  font-size: 13px;
  font-weight: 600;
  color: #666;
}

.app.dark .input-label {
  color: #999;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: #f5f5f5;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.app.dark .close-btn {
  background: #2a2a2a;
}

.close-btn:hover {
  background: #fee;
  color: #ef4444;
}

.close-btn svg {
  width: 14px;
  height: 14px;
}

.input-with-currency {
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

.price-input {
  width: 100%;
  padding: 16px 16px 16px 40px;
  border: 2px solid #e5e5e5;
  border-radius: 12px;
  font-size: 24px;
  font-weight: 700;
  background: #fafafa;
  color: #1a1a1a;
  transition: all 0.2s;
}

.app.dark .price-input {
  background: #0a0a0a;
  border-color: #2a2a2a;
  color: #e5e5e5;
}

.price-input:focus {
  outline: none;
  border-color: #fbbf24;
  background: white;
  box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.1);
}

.app.dark .price-input:focus {
  background: #1a1a1a;
}

.price-input::placeholder {
  color: #ccc;
}

/* Quick Conversions */
.quick-conversions {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.app.dark .quick-conversions {
  background: #0a0a0a;
}

.conversion-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.conversion-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.app.dark .conversion-label {
  color: #999;
}

.conversion-value {
  font-size: 14px;
  font-weight: 700;
  color: #fbbf24;
}

/* Manual Badge Notice */
.manual-badge-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: #fef3cd;
  border-radius: 8px;
  font-size: 12px;
  color: #856404;
  font-weight: 500;
}

.app.dark .manual-badge-notice {
  background: #2a2410;
  color: #fbbf24;
}

.manual-badge-notice svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Price Section */
.price-section {
  margin-bottom: 32px;
}

.price-card {
  background: white;
  border-radius: 16px;
  padding: 28px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.price-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.app.dark .price-card {
  background: #1a1a1a;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.app.dark .price-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.main-card {
  margin-bottom: 16px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(251, 191, 36, 0.3);
}

.main-card:hover {
  box-shadow: 0 8px 24px rgba(251, 191, 36, 0.4);
}

.label {
  font-size: 14px;
  font-weight: 500;
  opacity: 0.8;
  margin-bottom: 8px;
}

.price {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 4px;
}

.price.small {
  font-size: 20px;
}

.sublabel {
  font-size: 12px;
  opacity: 0.6;
}

.skeleton {
  height: 38px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  animation: pulse 1.5s infinite;
}

.skeleton.small {
  height: 24px;
}

.app.dark .price-card .skeleton {
  background: #2a2a2a;
}

.price-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* Portfolio Summary */
.portfolio-summary {
  background: white;
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 24px;
  border: 2px solid #10b981;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.1);
}

.app.dark .portfolio-summary {
  background: #1a1a1a;
  border-color: #10b981;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.2);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.summary-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.add-purchase-btn-mini {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: #10b981;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.add-purchase-btn-mini:hover {
  background: #059669;
  transform: scale(1.05);
}

.add-purchase-btn-mini svg {
  width: 16px;
  height: 16px;
}

.using-custom-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #fef3cd;
  border-radius: 8px;
  font-size: 12px;
  color: #856404;
  font-weight: 500;
  margin-bottom: 16px;
  border: 1px solid #fbbf24;
}

.app.dark .using-custom-notice {
  background: #2a2410;
  color: #fbbf24;
  border-color: #fbbf24;
}

.using-custom-notice svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.summary-explanation {
  background: #fafafa;
  padding: 20px;
  border-radius: 12px;
}

.app.dark .summary-explanation {
  background: #0a0a0a;
}

.explanation-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 15px;
}

.explanation-row:last-child {
  margin-bottom: 0;
}

.explanation-label {
  color: #666;
  font-weight: 500;
}

.app.dark .explanation-label {
  color: #999;
}

.explanation-value {
  font-weight: 700;
  color: #1a1a1a;
  font-size: 16px;
}

.app.dark .explanation-value {
  color: #e5e5e5;
}

.explanation-divider {
  height: 2px;
  background: #e5e5e5;
  margin: 16px 0;
}

.app.dark .explanation-divider {
  background: #2a2a2a;
}

.explanation-row.result {
  margin-top: 8px;
  padding: 16px;
  border-radius: 10px;
  background: white;
}

.app.dark .explanation-row.result {
  background: #1a1a1a;
}

.explanation-row.result.profit {
  background: #d1fae5;
  border: 2px solid #10b981;
}

.app.dark .explanation-row.result.profit {
  background: #064e3b;
}

.explanation-row.result.loss {
  background: #fee2e2;
  border: 2px solid #ef4444;
}

.app.dark .explanation-row.result.loss {
  background: #7f1d1d;
}

.explanation-row.result .explanation-label {
  color: #1a1a1a;
  font-weight: 600;
  font-size: 16px;
}

.app.dark .explanation-row.result .explanation-label {
  color: #e5e5e5;
}

.explanation-value-big {
  font-weight: 900;
  font-size: 24px;
}

.explanation-row.result.profit .explanation-value-big {
  color: #10b981;
}

.explanation-row.result.loss .explanation-value-big {
  color: #ef4444;
}

/* Purchase Form */
.purchase-form {
  background: white;
  border: 2px solid #10b981;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  animation: expandIn 0.3s ease;
}

.app.dark .purchase-form {
  background: #1a1a1a;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.form-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}

.app.dark .form-label {
  color: #999;
}

.form-input,
.form-select {
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e5e5;
  border-radius: 10px;
  font-size: 14px;
  background: #fafafa;
  color: #1a1a1a;
  transition: all 0.2s;
}

.app.dark .form-input,
.app.dark .form-select {
  background: #0a0a0a;
  border-color: #2a2a2a;
  color: #e5e5e5;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #10b981;
  background: white;
}

.app.dark .form-input:focus,
.app.dark .form-select:focus {
  background: #1a1a1a;
}

.form-input-large {
  width: 100%;
  padding: 16px;
  border: 2px solid #e5e5e5;
  border-radius: 12px;
  font-size: 24px;
  font-weight: 700;
  background: #fafafa;
  color: #1a1a1a;
  transition: all 0.2s;
  text-align: center;
}

.app.dark .form-input-large {
  background: #0a0a0a;
  border-color: #2a2a2a;
  color: #e5e5e5;
}

.form-input-large:focus {
  outline: none;
  border-color: #10b981;
  background: white;
}

.app.dark .form-input-large:focus {
  background: #1a1a1a;
}

.form-input-currency-large {
  width: 100%;
  padding: 16px 16px 16px 44px;
  border: 2px solid #e5e5e5;
  border-radius: 12px;
  font-size: 24px;
  font-weight: 700;
  background: #fafafa;
  color: #1a1a1a;
  transition: all 0.2s;
}

.app.dark .form-input-currency-large {
  background: #0a0a0a;
  border-color: #2a2a2a;
  color: #e5e5e5;
}

.form-input-currency-large:focus {
  outline: none;
  border-color: #10b981;
  background: white;
}

.app.dark .form-input-currency-large:focus {
  background: #1a1a1a;
}

.input-hint {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
  font-style: italic;
}

.app.dark .input-hint {
  color: #666;
}

.purchase-summary {
  background: #f0fdf4;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  border-left: 3px solid #10b981;
}

.app.dark .purchase-summary {
  background: #064e3b;
}

.purchase-summary-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.app.dark .purchase-summary-item {
  color: #999;
}

.purchase-summary-item:last-child {
  margin-bottom: 0;
}

.purchase-summary-item strong {
  color: #10b981;
  font-weight: 700;
}

/* Purchase History */
.purchase-history {
  background: white;
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 24px;
  width: 100%;
  max-width: 100%;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.app.dark .purchase-history {
  background: #1a1a1a;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.toggle-btn {
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

.app.dark .toggle-btn {
  background: #2a2a2a;
}

.toggle-btn:hover {
  background: #e5e5e5;
}

.app.dark .toggle-btn:hover {
  background: #333;
}

.toggle-btn svg {
  width: 18px;
  height: 18px;
}

.history-list {
  overflow: visible;
  width: 100%;
}

/* Card Grid Layout */
.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  width: 100%;
}

@media (max-width: 768px) {
  .history-grid {
    grid-template-columns: 1fr;
  }
}

/* Purchase Card */
.purchase-card {
  background: white;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.app.dark .purchase-card {
  background: #1a1a1a;
  border-color: #2a2a2a;
}

.purchase-card:hover {
  border-color: #fbbf24;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(251, 191, 36, 0.2);
}

.app.dark .purchase-card:hover {
  box-shadow: 0 4px 16px rgba(251, 191, 36, 0.3);
}

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.app.dark .card-header {
  border-bottom-color: #2a2a2a;
}

.card-date {
  display: flex;
  align-items: center;
  gap: 6px;
}

.date-icon {
  font-size: 14px;
}

.date-text {
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.app.dark .date-text {
  color: #999;
}

.card-delete-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: #f5f5f5;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.app.dark .card-delete-btn {
  background: #2a2a2a;
}

.card-delete-btn:hover {
  background: #fee;
  color: #ef4444;
  transform: rotate(10deg) scale(1.1);
}

.card-delete-btn svg {
  width: 14px;
  height: 14px;
}

/* Card Amount */
.card-amount {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 10px;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-radius: 8px;
  border: 1px solid #fbbf24;
}

.app.dark .card-amount {
  background: linear-gradient(135deg, #2a2410 0%, #1f1a0f 100%);
}

.metal-badge-large {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 6px;
}

.metal-icon-large {
  font-size: 12px;
  font-weight: 900;
  color: white;
}

.metal-label {
  font-size: 11px;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
}

.amount-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.amount-number {
  font-size: 24px;
  font-weight: 900;
  color: #1a1a1a;
}

.app.dark .amount-number {
  color: #fbbf24;
}

.amount-unit {
  font-size: 16px;
  font-weight: 700;
  color: #666;
}

.app.dark .amount-unit {
  color: #999;
}

/* Card Prices */
.card-prices {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.app.dark .card-prices {
  background: #0a0a0a;
}

.price-section {
  text-align: center;
}

.price-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #999;
  margin-bottom: 4px;
}

.app.dark .price-label {
  color: #666;
}

.price-amount {
  font-size: 14px;
  font-weight: 900;
  color: #1a1a1a;
  margin-bottom: 2px;
}

.app.dark .price-amount {
  color: #e5e5e5;
}

.price-per-unit {
  font-size: 10px;
  color: #666;
  font-weight: 500;
}

.app.dark .price-per-unit {
  color: #999;
}

.price-arrow {
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.price-arrow svg {
  width: 16px;
  height: 16px;
}

/* Card Result */
.card-result {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.card-result::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.1;
  z-index: 0;
}

.card-result.profit {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 2px solid #10b981;
}

.card-result.profit::before {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.app.dark .card-result.profit {
  background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
}

.card-result.loss {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 2px solid #ef4444;
}

.card-result.loss::before {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.app.dark .card-result.loss {
  background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
}

.result-icon-large {
  font-size: 32px;
  flex-shrink: 0;
  z-index: 1;
}

.result-info {
  flex: 1;
  z-index: 1;
}

.card-result .result-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.card-result.profit .result-label {
  color: #065f46;
}

.app.dark .card-result.profit .result-label {
  color: #6ee7b7;
}

.card-result.loss .result-label {
  color: #991b1b;
}

.app.dark .card-result.loss .result-label {
  color: #fca5a5;
}

.card-result .result-value {
  font-size: 18px;
  font-weight: 900;
  margin-bottom: 2px;
}

.card-result.profit .result-value {
  color: #10b981;
}

.app.dark .card-result.profit .result-value {
  color: #10b981;
}

.card-result.loss .result-value {
  color: #ef4444;
}

.app.dark .card-result.loss .result-value {
  color: #ef4444;
}

.result-percentage {
  font-size: 11px;
  font-weight: 700;
  opacity: 0.8;
}

.card-result.profit .result-percentage {
  color: #065f46;
}

.app.dark .card-result.profit .result-percentage {
  color: #6ee7b7;
}

.card-result.loss .result-percentage {
  color: #991b1b;
}

.app.dark .card-result.loss .result-percentage {
  color: #fca5a5;
}

/* Add Purchase Section */
.add-purchase-section {
  margin-bottom: 24px;
}

/* Calculator */
.calculator {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.calculator:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.app.dark .calculator {
  background: #1a1a1a;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.app.dark .calculator:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.calc-input-group {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.calc-input,
.calc-select {
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 14px;
  background: #fafafa;
}

.app.dark .calc-input,
.app.dark .calc-select {
  background: #0a0a0a;
  border-color: #2a2a2a;
  color: #e5e5e5;
}

.calc-input:focus,
.calc-select:focus {
  outline: none;
  border-color: #fbbf24;
}

.calc-result {
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  color: #fbbf24;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.app.dark .calc-result {
  background: #0a0a0a;
}

/* Actions */
.actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
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

.app.dark .btn-primary {
  background: #fbbf24;
  color: #1a1a1a;
}

.btn-secondary {
  background: #f5f5f5;
  color: #1a1a1a;
}

.app.dark .btn-secondary {
  background: #2a2a2a;
  color: #e5e5e5;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn:not(:disabled):hover {
  transform: translateY(-2px);
}

.icon {
  width: 16px;
  height: 16px;
}

.icon.spin {
  animation: spin 1s linear infinite;
}

/* Status */
.status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 13px;
  color: #666;
  margin-bottom: 16px;
}

.app.dark .status {
  color: #999;
}

.status-dot {
  width: 6px;
  height: 6px;
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

.status-text {
  flex-shrink: 0;
}

.quota-text {
  color: #999;
  font-size: 11px;
}

/* API Error Section */
.api-error-section {
  background: #fef3cd;
  border: 2px solid #fbbf24;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  text-align: center;
}

.app.dark .api-error-section {
  background: #2a2410;
  border-color: #fbbf24;
}

.error-message {
  font-size: 14px;
  font-weight: 600;
  color: #856404;
  margin-bottom: 16px;
}

.app.dark .error-message {
  color: #fbbf24;
}

/* Tips Box */
.tip-box {
  margin-top: 32px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 3px solid #fbbf24;
}

.app.dark .tip-box {
  background: #1a1a1a;
}

.tip-title {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1a1a1a;
}

.app.dark .tip-title {
  color: #e5e5e5;
}
.tip-list {
  margin: 0;
  padding-left: 20px;
  font-size: 12px;
  color: #666;
  line-height: 1.6;
}

.app.dark .tip-list {
  color: #999;
}

.tip-list li {
  margin-bottom: 4px;
}

.tip-list li:last-child {
  margin-bottom: 0;
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

@keyframes expandIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Responsive */
@media (min-width: 640px) {
  .container {
    max-width: 600px;
  }
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