<!-- pages/index.vue -->

<template>
  <div class="app" :class="{ 'dark': isDarkMode }">
    <!-- Minimal Header -->
    <header class="header">
      <div class="container">
        <h1 class="title">តម្លៃមាស</h1>
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
        
        <!-- Manual Price Input -->
        <div v-if="isManualMode" class="manual-input">
          <input 
            v-model.number="manualPrice" 
            type="number" 
            step="0.01"
            min="0"
            class="price-input"
            placeholder="Enter Troy Oz price"
            @input="updateManualPrice"
          >
          <button @click="clearManualPrice" class="link-btn">Use API</button>
        </div>

        <!-- Price Display -->
        <div class="price-section">
          <div class="price-card main-card">
            <div class="label">ដំឡឹង</div>
            <div v-if="loading" class="skeleton"></div>
            <div v-else class="price">{{ formatCurrencyDisplay(getDamlungPrice()) }}</div>
            <div class="sublabel">37.5g</div>
          </div>

          <div class="price-row">
            <div class="price-card">
              <div class="label">ជី</div>
              <div v-if="loading" class="skeleton small"></div>
              <div v-else class="price small">{{ formatCurrencyDisplay(getChiPrice()) }}</div>
              <div class="sublabel">3.75g</div>
            </div>
            <div class="price-card">
              <div class="label">Troy Oz</div>
              <div v-if="loading" class="skeleton small"></div>
              <div v-else class="price small">{{ formatCurrencyDisplay(currentGoldPrice) }}</div>
              <div class="sublabel">31.1g</div>
            </div>
          </div>
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
            {{ formatCurrencyDisplay(calculateTotalPrice()) }}
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
            Manual Price
          </button>
        </div>

        <!-- Status -->
        <div class="status">
          <span class="status-dot" :class="statusClass"></span>
          <span class="status-text">{{ lastUpdated }}</span>
          <span class="quota-text">{{ apiQuota.dailyCalls }}/3 calls today</span>
        </div>

      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'GoldPriceTracker',
  
  head() {
    return {
      title: 'តម្លៃមាស - Gold Price Tracker',
      meta: [
        { hid: 'description', name: 'description', content: 'Simple gold price tracker for Cambodia' }
      ]
    }
  },

  data() {
    return {
      // Constants
      TROY_OUNCE_TO_GRAM: 31.1035,
      DAMLUNG_TO_GRAM: 37.5,
      CHI_TO_GRAM: 3.75,
      USD_TO_KHR: 4100,

      // API
      apiKey: process.env.NUXT_ENV_GOLD_API_KEY || 'goldapi-vf9wd19m6tl90rg-io',
      apiBaseUrl: 'https://www.goldapi.io/api',

      // State
      goldPrice: 0,
      loading: true,
      lastUpdated: 'Loading...',
      
      // UI
      isDarkMode: false,
      currentCurrency: 'USD',
      refreshCooldown: 0,
      
      // Manual Price
      isManualMode: false,
      manualPrice: null,
      
      // Calculator
      calculatorAmount: 1,
      calculatorUnit: 'damlung',
      
      // API Quota
      apiQuota: {
        dailyCalls: 0,
        totalCalls: 0,
        lastCallDate: null,
        dailyLimit: 3
      },
      
      // Cache
      cache: {
        data: null,
        timestamp: null
      }
    };
  },
  
  computed: {
    currentGoldPrice() {
      return this.isManualMode && this.manualPrice ? this.manualPrice : this.goldPrice;
    },

    statusClass() {
      if (this.loading) return 'loading';
      if (this.goldPrice > 0) return 'success';
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
    }
  },

  methods: {
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
      if (process.client) {
        localStorage.setItem('darkMode', this.isDarkMode);
      }
    },

    toggleCurrency() {
      this.currentCurrency = this.currentCurrency === 'USD' ? 'KHR' : 'USD';
      if (process.client) {
        localStorage.setItem('currency', this.currentCurrency);
      }
    },

    enableManualMode() {
      this.isManualMode = true;
      this.manualPrice = this.goldPrice;
      if (process.client) {
        localStorage.setItem('isManualMode', true);
        localStorage.setItem('manualPrice', this.manualPrice);
      }
    },

    updateManualPrice() {
      if (this.manualPrice && this.manualPrice > 0 && process.client) {
        localStorage.setItem('manualPrice', this.manualPrice);
      }
    },

    clearManualPrice() {
      this.isManualMode = false;
      this.manualPrice = null;
      if (process.client) {
        localStorage.removeItem('manualPrice');
        localStorage.removeItem('isManualMode');
      }
    },

    formatCurrencyDisplay(value) {
      if (!value) return this.currentCurrency === 'USD' ? '$0.00' : '0 ៛';
      
      if (this.currentCurrency === 'USD') {
        return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      } else {
        const khrValue = value * this.USD_TO_KHR;
        return `${Math.round(khrValue).toLocaleString()} ៛`;
      }
    },

    convertToUnit(unit, price) {
      if (!price) return 0;
      const basePrice = this.isManualMode && this.manualPrice ? this.manualPrice : price;
      const conversions = {
        'damlung': this.DAMLUNG_TO_GRAM,
        'chi': this.CHI_TO_GRAM,
        'gram': 1
      };
      return basePrice * (conversions[unit] / this.TROY_OUNCE_TO_GRAM);
    },

    getDamlungPrice() {
      return this.convertToUnit('damlung', this.currentGoldPrice);
    },

    getChiPrice() {
      return this.convertToUnit('chi', this.currentGoldPrice);
    },

    getPricePerUnit() {
      switch (this.calculatorUnit) {
        case 'oz': return this.currentGoldPrice;
        case 'damlung': return this.convertToUnit('damlung', this.currentGoldPrice);
        case 'chi': return this.convertToUnit('chi', this.currentGoldPrice);
        case 'gram': return this.convertToUnit('gram', this.currentGoldPrice);
        default: return this.currentGoldPrice;
      }
    },

    calculateTotalPrice() {
      if (!this.calculatorAmount || !this.currentGoldPrice) return 0;
      return this.calculatorAmount * this.getPricePerUnit();
    },

    startRefreshCooldown() {
      this.refreshCooldown = 30;
      const timer = setInterval(() => {
        this.refreshCooldown--;
        if (this.refreshCooldown <= 0) {
          clearInterval(timer);
        }
      }, 1000);
    },

    async handleRefresh() {
      if (this.isRefreshDisabled || this.refreshCooldown > 0) return;
      await this.fetchGoldPrice(true);
      this.startRefreshCooldown();
    },

    async fetchGoldPrice(userRequested = false) {
      // Check cache
      const now = new Date();
      const cacheAgeHours = this.cache.timestamp ? 
        (now - new Date(this.cache.timestamp)) / (1000 * 60 * 60) : 999;
      
      if (this.cache.data && cacheAgeHours < 8 && !userRequested) {
        this.goldPrice = this.cache.data.price;
        this.lastUpdated = `${Math.floor(cacheAgeHours)}h ago`;
        this.loading = false;
        return;
      }

      // Check quota
      const today = new Date().toDateString();
      if (this.apiQuota.lastCallDate !== today) {
        this.apiQuota.dailyCalls = 0;
        this.apiQuota.lastCallDate = today;
      }

      if (this.apiQuota.dailyCalls >= this.apiQuota.dailyLimit && !userRequested) {
        this.loading = false;
        return;
      }

      this.loading = true;
      
      try {
        const endpoint = `${this.apiBaseUrl}/XAU/USD`;
        
        // Use native fetch instead of axios
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
        
        this.goldPrice = data.price;
        this.apiQuota.dailyCalls++;
        this.apiQuota.totalCalls++;
        this.apiQuota.lastCallDate = today;
        
        this.cache = {
          data: data,
          timestamp: now.toISOString()
        };
        
        if (process.client) {
          localStorage.setItem('apiQuota', JSON.stringify(this.apiQuota));
          localStorage.setItem('goldPriceCache', JSON.stringify(this.cache));
        }
        
        this.lastUpdated = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
        
      } catch (error) {
        console.error('API Error:', error);
        this.lastUpdated = 'Error - check console';
        
        // Use cached data if available
        if (this.cache.data) {
          this.goldPrice = this.cache.data.price;
          this.lastUpdated = 'Using cached data';
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

        const savedQuota = localStorage.getItem('apiQuota');
        if (savedQuota) {
          this.apiQuota = { ...this.apiQuota, ...JSON.parse(savedQuota) };
        }
        
        const savedCache = localStorage.getItem('goldPriceCache');
        if (savedCache) {
          this.cache = JSON.parse(savedCache);
          const cacheAge = (new Date() - new Date(this.cache.timestamp)) / (1000 * 60 * 60);
          if (cacheAge < 24) {
            this.goldPrice = this.cache.data.price;
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
      this.fetchGoldPrice(false);
    }
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
  max-width: 480px;
  margin: 0 auto;
  padding: 0 20px;
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

/* Main */
.main {
  padding: 32px 0;
}

/* Manual Input */
.manual-input {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 24px;
}

.price-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #fbbf24;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  background: white;
  color: #1a1a1a;
}

.app.dark .price-input {
  background: #1a1a1a;
  color: #e5e5e5;
}

.price-input:focus {
  outline: none;
  border-color: #f59e0b;
}

.link-btn {
  padding: 0;
  border: none;
  background: none;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  text-decoration: underline;
}

.app.dark .link-btn {
  color: #999;
}

.link-btn:hover {
  color: #fbbf24;
}

/* Price Section */
.price-section {
  margin-bottom: 32px;
}

.price-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
}

.app.dark .price-card {
  background: #1a1a1a;
}

.main-card {
  margin-bottom: 16px;
  background: #fbbf24;
  color: white;
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

/* Calculator */
.calculator {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}

.app.dark .calculator {
  background: #1a1a1a;
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

/* Animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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