<!-- pages/index.vue -->

<template>
  <div class="app" :class="{ 'dark': isDarkMode }">
    <!-- Enhanced Header -->
    <header class="header">
      <div class="container">
        <div class="header-content">
          <h1 class="title">តម្លៃមាស</h1>
          <div class="header-controls">
            <button @click="toggleDarkMode" class="theme-toggle" :title="isDarkMode ? 'Light mode' : 'Dark mode'">
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
            <button @click="toggleCurrency" class="currency-toggle" :title="`Switch to ${currentCurrency === 'USD' ? 'KHR' : 'USD'}`">
              {{ currentCurrency }}
            </button>
          </div>
        </div>
        <div class="status">
          <div class="dot" :class="statusClass"></div>
          <span class="time">{{ lastUpdated }}</span>
        </div>
      </div>
    </header>

    <main class="main">
      <!-- Refresh Section -->
      <div class="refresh-section">
        <button @click="handleRefresh" :disabled="loading || isRefreshDisabled" class="refresh-btn">
          <svg class="icon" :class="{ 'spin': loading }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
          </svg>
          {{ refreshButtonText }}
        </button>
        
        <!-- Usage Bar -->
        <div class="usage">
          <div class="bar">
            <div class="fill" :style="{ width: usagePercentage + '%' }" :class="usageClass"></div>
          </div>
          <div class="usage-info">
            <span class="usage-text">{{ apiQuota.dailyCalls }}/3 today • {{ apiQuota.totalCalls }}/90 month</span>
            <span v-if="remainingCalls <= 10" class="usage-warning">{{ remainingCalls }} calls left</span>
          </div>
        </div>
      </div>

      <!-- Price History Chart -->
      <div v-if="priceHistory.length > 1" class="chart-section">
        <h3 class="section-title">Price Trend (7 days)</h3>
        <div class="chart-container">
          <svg class="price-chart" viewBox="0 0 300 100" preserveAspectRatio="none">
            <polyline
              :points="chartPoints"
              fill="none"
              stroke="#fbbf24"
              stroke-width="2"
              vector-effect="non-scaling-stroke"
            />
            <circle
              v-for="(point, index) in chartData"
              :key="index"
              :cx="point.x"
              :cy="point.y"
              r="2"
              fill="#fbbf24"
              vector-effect="non-scaling-stroke"
            />
          </svg>
          <div class="chart-labels">
            <span class="chart-label">{{ formatChartDate(priceHistory[0].date) }}</span>
            <span class="chart-label">{{ formatChartDate(priceHistory[priceHistory.length - 1].date) }}</span>
          </div>
        </div>
      </div>

      <!-- Price Cards -->
      <div class="cards">
        <!-- Damlung Primary -->
        <div class="card primary" @click="setQuickAmount('damlung', 1)">
          <div class="card-top">
            <span class="unit">ដំឡឹង</span>
            <span class="weight">37.5g</span>
          </div>
          <div class="price">
            <div v-if="loading" class="skeleton"></div>
            <div v-else>
              <span class="amount">{{ formatCurrencyDisplay(getDamlungPrice()) }}</span>
              <div v-if="priceChange.value" class="change" :class="priceChange.type">
                {{ priceChange.value }}
              </div>
            </div>
          </div>
          <div class="price-alert" v-if="alerts.damlung">
            <small>Alert: {{ formatCurrencyDisplay(alerts.damlung) }}</small>
          </div>
        </div>

        <!-- Chi -->
        <div class="card" @click="setQuickAmount('chi', 1)">
          <div class="card-top">
            <span class="unit">ជី</span>
            <span class="weight">3.75g</span>
          </div>
          <div class="price">
            <div v-if="loading" class="skeleton"></div>
            <span v-else class="amount">{{ formatCurrencyDisplay(getChiPrice()) }}</span>
          </div>
        </div>

        <!-- Troy Ounce -->
        <div class="card" @click="setQuickAmount('oz', 1)">
          <div class="card-top">
            <span class="unit">Troy Oz</span>
            <span class="weight">31.1g</span>
          </div>
          <div class="price">
            <div v-if="loading" class="skeleton"></div>
            <span v-else class="amount">{{ formatCurrencyDisplay(goldPrice) }}</span>
          </div>
        </div>
      </div>

      <!-- Enhanced Calculator -->
      <div v-if="goldPrice > 0" class="calculator">
        <div class="calc-header">
          <h3 class="calc-title">Calculator</h3>
          <button @click="saveToHistory" class="save-btn" :disabled="!calculatorAmount">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17,21 17,13 7,13 7,21"/>
              <polyline points="7,3 7,8 15,8"/>
            </svg>
          </button>
        </div>
        
        <!-- Quick Amount Buttons -->
        <div class="quick-amounts">
          <button 
            v-for="preset in quickPresets" 
            :key="preset.label"
            @click="setQuickAmount(preset.unit, preset.amount)"
            class="quick-btn"
            :class="{ active: calculatorAmount === preset.amount && calculatorUnit === preset.unit }"
          >
            {{ preset.label }}
          </button>
        </div>

        <div class="calc-row">
          <input 
            v-model.number="calculatorAmount" 
            type="number" 
            min="0" 
            step="0.1"
            class="calc-input"
            placeholder="Amount"
            @input="updateCalculatorHistory"
          >
          <select v-model="calculatorUnit" class="calc-select" @change="updateCalculatorHistory">
            <option value="damlung">ដំឡឹង</option>
            <option value="chi">ជី</option>
            <option value="oz">Troy Oz</option>
            <option value="gram">Gram</option>
          </select>
        </div>
        
        <div class="calc-result">
          <div class="result-main">
            <span>Total: {{ formatCurrencyDisplay(calculateTotalPrice()) }}</span>
            <button @click="sharePrice" class="share-btn" title="Share price">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16,6 12,2 8,6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            </button>
          </div>
          <div class="result-breakdown">
            <small>{{ formatCurrencyDisplay(getPricePerUnit()) }} per {{ getUnitLabel(calculatorUnit) }}</small>
          </div>
        </div>

        <!-- Price Alert Setup -->
        <div class="alert-setup">
          <label class="alert-label">
            <input 
              v-model.number="alertPrice" 
              type="number" 
              step="0.01" 
              placeholder="Set price alert"
              class="alert-input"
            >
            <button @click="setAlert" :disabled="!alertPrice" class="alert-btn">
              Set Alert
            </button>
          </label>
        </div>
      </div>

      <!-- Calculation History -->
      <div v-if="calculationHistory.length > 0" class="history-section">
        <div class="history-header">
          <h3 class="section-title">Recent Calculations</h3>
          <button @click="clearHistory" class="clear-btn">Clear</button>
        </div>
        <div class="history-list">
          <div v-for="(calc, index) in calculationHistory.slice(0, 5)" :key="index" class="history-item" @click="loadCalculation(calc)">
            <span class="history-calc">{{ calc.amount }} {{ getUnitLabel(calc.unit) }}</span>
            <span class="history-result">{{ formatCurrencyDisplay(calc.total) }}</span>
            <small class="history-time">{{ formatTime(calc.timestamp) }}</small>
          </div>
        </div>
      </div>

      <!-- Market Info -->
      <div v-if="priceInfo.length > 0" class="market">
        <button @click="showMarketInfo = !showMarketInfo" class="market-toggle">
          Market Info
          <svg class="chevron" :class="{ 'rotate': showMarketInfo }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
        
        <div v-if="showMarketInfo" class="market-content">
          <div v-for="(info, index) in priceInfo" :key="index" class="market-item">
            <span class="label">{{ info.title }}</span>
            <span class="value">{{ formatCurrencyDisplay(parseFloat(info.value.replace('$', ''))) }}</span>
          </div>
        </div>
      </div>

      <!-- Tips -->
      <div class="tips">
        <div class="tip">
          <strong>Units:</strong> 1 ដំឡឹង = 10 ជី = 37.5 grams
        </div>
        <div class="tip">
          <strong>Currency:</strong> Tap currency button to switch between USD and KHR
        </div>
        <div class="tip">
          <strong>Quick calc:</strong> Tap price cards to auto-fill calculator
        </div>
        <div class="tip">
          <strong>Note:</strong> Actual prices may vary from displayed rates
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <p>© {{ new Date().getFullYear() }} Gold Price Tracker • Data: <a href="https://www.goldapi.io" target="_blank">GoldAPI</a></p>
      </div>
    </footer>

    <!-- Alert Notifications -->
    <div v-if="showAlert" class="alert-notification" @click="dismissAlert">
      <div class="alert-content">
        <strong>Price Alert!</strong>
        <p>{{ alertMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EnhancedGoldTracker',
  data() {
    return {
      // Constants
      TROY_OUNCE_TO_GRAM: 31.1035,
      DAMLUNG_TO_GRAM: 37.5,
      CHI_TO_GRAM: 3.75,
      USD_TO_KHR: 4100, // Approximate exchange rate

      // API settings
      apiKey: 'goldapi-vf9wd19m6tl90rg-io',
      apiBaseUrl: 'https://www.goldapi.io/api',

      // State
      goldPrice: 0,
      previousPrice: 0,
      loading: true,
      lastUpdated: 'Loading...',
      priceInfo: [],
      showMarketInfo: false,
      
      // UI State
      isDarkMode: false,
      currentCurrency: 'USD',
      refreshCooldown: 0,
      
      // Calculator
      calculatorAmount: 1,
      calculatorUnit: 'damlung',
      
      // New Features
      priceHistory: [],
      calculationHistory: [],
      alerts: {},
      alertPrice: null,
      showAlert: false,
      alertMessage: '',
      
      // Quick presets
      quickPresets: [
        { label: '1g', unit: 'gram', amount: 1 },
        { label: '5g', unit: 'gram', amount: 5 },
        { label: '1ជី', unit: 'chi', amount: 1 },
        { label: '1ដំឡឹង', unit: 'damlung', amount: 1 }
      ],
      
      // API Management
      apiQuota: {
        totalCalls: 0,
        dailyCalls: 0,
        lastCallDate: null,
        monthlyLimit: 90,
        dailyLimit: 3,
        emergencyReserve: 10
      },
      
      longTermCache: {
        data: null,
        timestamp: null,
        expiryHours: 8
      },
      
      fallbackPrices: {
        basePrice: 2420,
        lastKnownPrice: 0,
        estimatedPrice: 0
      }
    };
  },
  
  computed: {
    statusClass() {
      if (this.loading) return 'loading';
      if (this.goldPrice > 0) return 'success';
      return 'error';
    },
    
    priceChange() {
      if (!this.previousPrice || this.previousPrice === this.goldPrice) {
        return { value: '', type: '' };
      }
      
      const change = this.goldPrice - this.previousPrice;
      const percentage = ((change / this.previousPrice) * 100).toFixed(1);
      
      return {
        value: `${change > 0 ? '+' : ''}${percentage}%`,
        type: change > 0 ? 'positive' : 'negative'
      };
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

    usagePercentage() {
      return (this.apiQuota.dailyCalls / this.apiQuota.dailyLimit) * 100;
    },

    usageClass() {
      const percentage = this.usagePercentage;
      if (percentage >= 100) return 'critical';
      if (percentage >= 66) return 'warning';
      return 'normal';
    },

    remainingCalls() {
      return this.apiQuota.monthlyLimit - this.apiQuota.totalCalls;
    },

    chartData() {
      if (this.priceHistory.length < 2) return [];
      
      const prices = this.priceHistory.map(h => h.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice || 1;
      
      return this.priceHistory.map((history, index) => ({
        x: (index / (this.priceHistory.length - 1)) * 300,
        y: 100 - ((history.price - minPrice) / priceRange) * 100
      }));
    },

    chartPoints() {
      return this.chartData.map(point => `${point.x},${point.y}`).join(' ');
    }
  },

  methods: {
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
      localStorage.setItem('darkMode', this.isDarkMode);
    },

    toggleCurrency() {
      this.currentCurrency = this.currentCurrency === 'USD' ? 'KHR' : 'USD';
      localStorage.setItem('currency', this.currentCurrency);
    },

    formatCurrencyDisplay(value) {
      if (!value) return this.currentCurrency === 'USD' ? '$0.00' : '0 ៛';
      
      if (this.currentCurrency === 'USD') {
        return `$${this.formatPrice(value)}`;
      } else {
        const khrValue = value * this.USD_TO_KHR;
        return `${Math.round(khrValue).toLocaleString()} ៛`;
      }
    },

    formatPrice(value) {
      if (!value) return '0.00';
      return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    },

    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    formatChartDate(date) {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    },

    convertToUnit(unit, price) {
      if (!price) return 0;
      
      const conversions = {
        'damlung': this.DAMLUNG_TO_GRAM,
        'chi': this.CHI_TO_GRAM,
        'gram': 1
      };
      
      return price * (conversions[unit] / this.TROY_OUNCE_TO_GRAM);
    },

    getDamlungPrice() {
      return this.convertToUnit('damlung', this.goldPrice);
    },

    getChiPrice() {
      return this.convertToUnit('chi', this.goldPrice);
    },

    getPricePerUnit() {
      switch (this.calculatorUnit) {
        case 'oz': return this.goldPrice;
        case 'damlung': return this.getDamlungPrice();
        case 'chi': return this.getChiPrice();
        case 'gram': return this.convertToUnit('gram', this.goldPrice);
        default: return this.goldPrice;
      }
    },

    calculateTotalPrice() {
      if (!this.calculatorAmount || !this.goldPrice) return 0;
      return this.calculatorAmount * this.getPricePerUnit();
    },

    getUnitLabel(unit) {
      const labels = {
        'oz': 'Troy Oz',
        'damlung': 'Damlung',
        'chi': 'Chi',
        'gram': 'Gram'
      };
      return labels[unit] || unit;
    },

    setQuickAmount(unit, amount) {
      this.calculatorUnit = unit;
      this.calculatorAmount = amount;
      this.updateCalculatorHistory();
    },

    updateCalculatorHistory() {
      if (!this.calculatorAmount || !this.goldPrice) return;
      
      const calculation = {
        amount: this.calculatorAmount,
        unit: this.calculatorUnit,
        total: this.calculateTotalPrice(),
        timestamp: Date.now()
      };
      
      // Add to history (keep last 10)
      this.calculationHistory.unshift(calculation);
      this.calculationHistory = this.calculationHistory.slice(0, 10);
      
      // Save to localStorage
      localStorage.setItem('calculationHistory', JSON.stringify(this.calculationHistory));
    },

    saveToHistory() {
      this.updateCalculatorHistory();
      // Could add visual feedback here
    },

    loadCalculation(calc) {
      this.calculatorAmount = calc.amount;
      this.calculatorUnit = calc.unit;
    },

    clearHistory() {
      this.calculationHistory = [];
      localStorage.removeItem('calculationHistory');
    },

    setAlert() {
      if (!this.alertPrice) return;
      
      this.alerts[this.calculatorUnit] = this.alertPrice;
      localStorage.setItem('priceAlerts', JSON.stringify(this.alerts));
      
      // Reset input
      this.alertPrice = null;
      
      // Show confirmation (could be a toast notification)
      console.log(`Alert set for ${this.formatCurrencyDisplay(this.alertPrice)}`);
    },

    checkAlerts() {
      Object.keys(this.alerts).forEach(unit => {
        const alertPrice = this.alerts[unit];
        const currentPrice = this.getPricePerUnit();
        
        if (currentPrice >= alertPrice) {
          this.showAlert = true;
          this.alertMessage = `${this.getUnitLabel(unit)} reached ${this.formatCurrencyDisplay(alertPrice)}!`;
          
          // Remove triggered alert
          delete this.alerts[unit];
          localStorage.setItem('priceAlerts', JSON.stringify(this.alerts));
        }
      });
    },

    dismissAlert() {
      this.showAlert = false;
    },

    sharePrice() {
      const text = `Gold Price: ${this.formatCurrencyDisplay(this.calculateTotalPrice())} for ${this.calculatorAmount} ${this.getUnitLabel(this.calculatorUnit)}`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Gold Price',
          text: text,
          url: window.location.href
        });
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(text).then(() => {
          console.log('Price copied to clipboard');
        });
      }
    },

    addToPriceHistory(price) {
      const today = new Date().toDateString();
      const existingIndex = this.priceHistory.findIndex(h => 
        new Date(h.date).toDateString() === today
      );
      
      if (existingIndex >= 0) {
        // Update today's price
        this.priceHistory[existingIndex].price = price;
      } else {
        // Add new entry
        this.priceHistory.push({
          date: new Date(),
          price: price
        });
      }
      
      // Keep last 7 days
      this.priceHistory = this.priceHistory.slice(-7);
      localStorage.setItem('priceHistory', JSON.stringify(this.priceHistory));
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
      
      try {
        await this.fetchGoldPrice(true);
        this.startRefreshCooldown();
      } catch (error) {
        console.error('Refresh failed:', error);
      }
    },

    canMakeApiCall() {
      const today = new Date().toDateString();
      
      if (this.apiQuota.lastCallDate !== today) {
        this.apiQuota.dailyCalls = 0;
        this.apiQuota.lastCallDate = today;
      }
      
      if (this.apiQuota.dailyCalls >= this.apiQuota.dailyLimit) {
        return { allowed: false, reason: 'Daily limit reached' };
      }
      
      if (this.apiQuota.totalCalls >= this.apiQuota.monthlyLimit - this.apiQuota.emergencyReserve) {
        return { allowed: false, reason: 'Monthly limit approached' };
      }
      
      return { allowed: true, reason: '' };
    },

    estimateCurrentPrice() {
      if (this.fallbackPrices.lastKnownPrice > 0) {
        const daysSinceUpdate = Math.floor((new Date() - this.longTermCache.timestamp) / (1000 * 60 * 60 * 24));
        const randomVariation = (Math.random() - 0.5) * 0.01 * daysSinceUpdate;
        this.fallbackPrices.estimatedPrice = this.fallbackPrices.lastKnownPrice * (1 + randomVariation);
        return this.fallbackPrices.estimatedPrice;
      }
      return this.fallbackPrices.basePrice;
    },

    async fetchGoldPrice(userRequested = false) {
      const canCall = this.canMakeApiCall();
      
      if (!canCall.allowed && !userRequested) {
        this.goldPrice = this.estimateCurrentPrice();
        this.lastUpdated = `Estimated (${canCall.reason})`;
        return;
      }

      const now = new Date();
      const cacheAgeHours = this.longTermCache.timestamp ? 
        (now - this.longTermCache.timestamp) / (1000 * 60 * 60) : 999;
      
      const maxCacheAge = userRequested ? 4 : 8;
      if (this.longTermCache.data && cacheAgeHours < maxCacheAge) {
        this.goldPrice = this.longTermCache.data.price;
        this.lastUpdated = `${Math.floor(cacheAgeHours)}h ago`;
        return;
      }

      this.loading = true;
      
      try {
        const endpoint = `${this.apiBaseUrl}/XAU/USD`;
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'x-access-token': this.apiKey,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(15000)
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const goldData = await response.json();
        
        // Update quota
        this.apiQuota.dailyCalls++;
        this.apiQuota.totalCalls++;
        this.apiQuota.lastCallDate = now.toDateString();
        
        localStorage.setItem('apiQuota', JSON.stringify(this.apiQuota));
        
        // Update prices
        this.previousPrice = this.goldPrice;
        this.goldPrice = goldData.price;
        this.fallbackPrices.lastKnownPrice = goldData.price;
        
        // Add to price history
        this.addToPriceHistory(goldData.price);
        
        // Check alerts
        this.checkAlerts();
        
        // Cache data
        this.longTermCache = {
          data: goldData,
          timestamp: now,
          expiryHours: 8
        };
        
        localStorage.setItem('goldPriceLongCache', JSON.stringify(this.longTermCache));
        
        this.priceInfo = [
          { title: 'Open', value: `$${this.formatPrice(goldData.open_price)}` },
          { title: 'High', value: `$${this.formatPrice(goldData.high_price)}` },
          { title: 'Low', value: `$${this.formatPrice(goldData.low_price)}` },
          { title: 'Purity', value: `${goldData.metal_purity || '99.5%'}` }
        ];
        
        this.lastUpdated = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
        
      } catch (error) {
        this.goldPrice = this.estimateCurrentPrice();
        this.lastUpdated = 'Error - estimate';
        throw error;
      } finally {
        this.loading = false;
      }
    }
  },

  mounted() {
    // Load saved preferences
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      this.isDarkMode = JSON.parse(savedDarkMode);
    }

    const savedCurrency = localStorage.getItem('currency');
    if (savedCurrency) {
      this.currentCurrency = savedCurrency;
    }

    // Load saved data
    try {
      const savedQuota = localStorage.getItem('apiQuota');
      if (savedQuota) {
        this.apiQuota = { ...this.apiQuota, ...JSON.parse(savedQuota) };
      }

      const savedHistory = localStorage.getItem('calculationHistory');
      if (savedHistory) {
        this.calculationHistory = JSON.parse(savedHistory);
      }

      const savedAlerts = localStorage.getItem('priceAlerts');
      if (savedAlerts) {
        this.alerts = JSON.parse(savedAlerts);
      }

      const savedPriceHistory = localStorage.getItem('priceHistory');
      if (savedPriceHistory) {
        this.priceHistory = JSON.parse(savedPriceHistory);
      }
      
      const longCache = localStorage.getItem('goldPriceLongCache');
      if (longCache) {
        this.longTermCache = JSON.parse(longCache);
        const cacheAge = (new Date() - new Date(this.longTermCache.timestamp)) / (1000 * 60 * 60);
        if (cacheAge < 24) {
          this.goldPrice = this.longTermCache.data.price;
          this.lastUpdated = `${Math.floor(cacheAge)}h ago`;
          this.loading = false;
          return;
        }
      }
    } catch (e) {
      console.log('Failed to load saved data');
    }
    
    this.fetchGoldPrice(false);
  }
}
</script>

<style scoped>
/* Enhanced Clean Design with Dark Mode */
.app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #fafafa;
  min-height: 100vh;
  color: #333;
  transition: all 0.3s ease;
}

.app.dark {
  background: #1a1a1a;
  color: #e5e5e5;
}

.container {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Enhanced Header */
.header {
  background: white;
  border-bottom: 1px solid #e5e5e5;
  padding: 20px 0;
  transition: all 0.3s ease;
}

.app.dark .header {
  background: #2a2a2a;
  border-bottom-color: #404040;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: inherit;
}

.header-controls {
  display: flex;
  gap: 8px;
}

.theme-toggle, .currency-toggle {
  width: 40px;
  height: 40px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 12px;
  font-weight: 600;
}

.app.dark .theme-toggle,
.app.dark .currency-toggle {
  background: #404040;
  border-color: #555;
  color: #e5e5e5;
}

.theme-toggle:hover,
.currency-toggle:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.app.dark .theme-toggle:hover,
.app.dark .currency-toggle:hover {
  background: #555;
}

.theme-toggle svg {
  width: 18px;
  height: 18px;
}

.status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dot.loading {
  background: #fbbf24;
  animation: pulse 2s infinite;
}

.dot.success {
  background: #22c55e;
}

.dot.error {
  background: #ef4444;
}

.time {
  font-size: 13px;
  color: #666;
}

.app.dark .time {
  color: #999;
}

/* Main */
.main {
  padding: 24px 20px;
  max-width: 480px;
  margin: 0 auto;
}

/* Refresh */
.refresh-section {
  margin-bottom: 32px;
}

.refresh-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #111;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.app.dark .refresh-btn {
  background: #fbbf24;
  color: #111;
}

.refresh-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon {
  width: 16px;
  height: 16px;
}

.icon.spin {
  animation: spin 1s linear infinite;
}

/* Usage */
.usage {
  margin-top: 16px;
  text-align: center;
}

.bar {
  width: 100%;
  height: 3px;
  background: #e5e5e5;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.app.dark .bar {
  background: #404040;
}

.fill {
  height: 100%;
  transition: width 0.3s;
}

.fill.normal {
  background: #22c55e;
}

.fill.warning {
  background: #fbbf24;
}

.fill.critical {
  background: #ef4444;
}

.usage-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.usage-text {
  font-size: 12px;
  color: #666;
}

.app.dark .usage-text {
  color: #999;
}

.usage-warning {
  font-size: 11px;
  color: #ef4444;
  font-weight: 600;
}

/* Chart Section */
.chart-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: inherit;
}

.chart-container {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
}

.app.dark .chart-container {
  background: #2a2a2a;
  border-color: #404040;
}

.price-chart {
  width: 100%;
  height: 80px;
  margin-bottom: 8px;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.app.dark .chart-labels {
  color: #999;
}

/* Cards */
.cards {
  display: grid;
  gap: 16px;
  margin-bottom: 32px;
}

.card {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.app.dark .card {
  background: #2a2a2a;
  border-color: #404040;
}

.card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.app.dark .card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.card.primary {
  border-color: #fbbf24;
  background: #fbbf24;
  color: white;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.unit {
  font-size: 16px;
  font-weight: 600;
}

.weight {
  font-size: 12px;
  opacity: 0.7;
}

.price {
  min-height: 32px;
}

.skeleton {
  height: 24px;
  background: #e5e5e5;
  border-radius: 4px;
  animation: shimmer 1.5s infinite;
}

.app.dark .skeleton {
  background: #404040;
}

.card.primary .skeleton {
  background: rgba(255,255,255,0.3);
}

.amount {
  font-size: 20px;
  font-weight: 700;
  color: inherit;
}

.change {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  margin-top: 4px;
  display: inline-block;
}

.change.positive {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.change.negative {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.price-alert {
  margin-top: 8px;
  padding: 4px 8px;
  background: rgba(251, 191, 36, 0.1);
  border-radius: 4px;
  font-size: 11px;
}

/* Enhanced Calculator */
.calculator {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 32px;
  transition: all 0.3s ease;
}

.app.dark .calculator {
  background: #2a2a2a;
  border-color: #404040;
}

.calc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.calc-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: inherit;
}

.save-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.app.dark .save-btn {
  background: #404040;
  border-color: #555;
  color: #e5e5e5;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-btn svg {
  width: 16px;
  height: 16px;
}

.quick-amounts {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.quick-btn {
  padding: 6px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  background: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.app.dark .quick-btn {
  background: #404040;
  border-color: #555;
  color: #e5e5e5;
}

.quick-btn:hover,
.quick-btn.active {
  background: #fbbf24;
  border-color: #fbbf24;
  color: white;
}

.calc-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.calc-input, .calc-select {
  padding: 10px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  transition: all 0.3s ease;
}

.app.dark .calc-input,
.app.dark .calc-select {
  background: #404040;
  border-color: #555;
  color: #e5e5e5;
}

.calc-input:focus, .calc-select:focus {
  outline: none;
  border-color: #fbbf24;
}

.calc-result {
  background: #f8f8f8;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.app.dark .calc-result {
  background: #404040;
}

.result-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  margin-bottom: 4px;
}

.share-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
}

.share-btn:hover {
  color: #fbbf24;
}

.share-btn svg {
  width: 16px;
  height: 16px;
}

.result-breakdown {
  font-size: 12px;
  color: #666;
  text-align: center;
}

.app.dark .result-breakdown {
  color: #999;
}

.alert-setup {
  margin-top: 16px;
}

.alert-label {
  display: flex;
  gap: 8px;
  align-items: center;
}

.alert-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 13px;
  background: white;
}

.app.dark .alert-input {
  background: #404040;
  border-color: #555;
  color: #e5e5e5;
}

.alert-btn {
  padding: 8px 16px;
  border: 1px solid #fbbf24;
  border-radius: 6px;
  background: #fbbf24;
  color: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.alert-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* History Section */
.history-section {
  margin-bottom: 32px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.clear-btn {
  padding: 4px 8px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  background: white;
  font-size: 12px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.app.dark .clear-btn {
  background: #404040;
  border-color: #555;
  color: #999;
}

.clear-btn:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.app.dark .clear-btn:hover {
  background: #555;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.app.dark .history-item {
  background: #2a2a2a;
  border-color: #404040;
}

.history-item:hover {
  background: #f8f8f8;
  border-color: #ccc;
}

.app.dark .history-item:hover {
  background: #404040;
}

.history-calc {
  font-size: 14px;
  font-weight: 500;
}

.history-result {
  font-size: 14px;
  font-weight: 600;
  color: #fbbf24;
}

.history-time {
  font-size: 11px;
  color: #666;
}

.app.dark .history-time {
  color: #999;
}

/* Market */
.market {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  margin-bottom: 32px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.app.dark .market {
  background: #2a2a2a;
  border-color: #404040;
}

.market-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  color: inherit;
}

.chevron {
  width: 16px;
  height: 16px;
  transition: transform 0.2s;
}

.chevron.rotate {
  transform: rotate(180deg);
}

.market-content {
  border-top: 1px solid #e5e5e5;
  padding: 16px 20px;
}

.app.dark .market-content {
  border-top-color: #404040;
}

.market-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.market-item:last-child {
  margin-bottom: 0;
}

.label {
  font-size: 14px;
  color: #666;
}

.app.dark .label {
  color: #999;
}

.value {
  font-size: 14px;
  font-weight: 600;
  color: inherit;
}

/* Tips */
.tips {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 32px;
  transition: all 0.3s ease;
}

.app.dark .tips {
  background: #2a2a2a;
  border-color: #404040;
}

.tip {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  line-height: 1.5;
}

.app.dark .tip {
  color: #999;
}

.tip:last-child {
  margin-bottom: 0;
}

.tip strong {
  color: inherit;
}

/* Footer */
.footer {
  background: white;
  border-top: 1px solid #e5e5e5;
  padding: 20px 0;
  margin-top: auto;
  transition: all 0.3s ease;
}

.app.dark .footer {
  background: #2a2a2a;
  border-top-color: #404040;
}

.footer p {
  font-size: 12px;
  color: #666;
  text-align: center;
  margin: 0;
}

.app.dark .footer p {
  color: #999;
}

.footer a {
  color: #fbbf24;
  text-decoration: none;
}

/* Alert Notification */
.alert-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #fbbf24;
  color: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  cursor: pointer;
  z-index: 1000;
  animation: slideIn 0.3s ease;
  max-width: 300px;
}

.alert-content strong {
  display: block;
  margin-bottom: 4px;
}

.alert-content p {
  margin: 0;
  font-size: 14px;
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

@keyframes shimmer {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive */
@media (min-width: 481px) {
  .container { max-width: 600px; }
  .main { max-width: 600px; }
  .cards { grid-template-columns: repeat(3, 1fr); }
  .quick-amounts { justify-content: center; }
}

@media (min-width: 768px) {
  .container { max-width: 800px; }
  .main { max-width: 800px; padding: 32px; }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  .app:not(.dark) {
    /* Option to auto-detect system dark mode preference */
  }
}
</style>