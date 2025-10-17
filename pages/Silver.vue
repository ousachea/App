<!-- pages/index.vue -->

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
            @click="selectedMetal = 'gold'" 
            class="metal-btn" 
            :class="{ 'active': selectedMetal === 'gold' }"
          >
            <span class="metal-icon gold-icon">Au</span>
            <span>Gold</span>
          </button>
          <button 
            @click="selectedMetal = 'silver'" 
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
                @input="updateManualPrice"
                ref="manualInput"
              >
            </div>

            <div v-if="manualPrice > 0" class="quick-conversions">
              <div class="conversion-item">
                <span class="conversion-label">ដំឡឹង</span>
                <span class="conversion-value">{{ formatCurrencyDisplay(convertToUnit('damlung', manualPrice)) }}</span>
              </div>
              <div class="conversion-item">
                <span class="conversion-label">ជី</span>
                <span class="conversion-value">{{ formatCurrencyDisplay(convertToUnit('chi', manualPrice)) }}</span>
              </div>
              <div class="conversion-item">
                <span class="conversion-label">Gram</span>
                <span class="conversion-value">{{ formatCurrencyDisplay(convertToUnit('gram', manualPrice)) }}</span>
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
              <div v-else class="price small">{{ formatCurrencyDisplay(currentPrice) }}</div>
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
      // Constants
      TROY_OUNCE_TO_GRAM: 31.1035,
      DAMLUNG_TO_GRAM: 37.5,
      CHI_TO_GRAM: 3.75,
      USD_TO_KHR: 4100,

      // API
      apiKey: '03cc06614a49b9d29f1d4cdb2250467d',
      apiBaseUrl: 'https://www.goldapi.io/api',

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
      
      // Calculator
      calculatorAmount: 1,
      calculatorUnit: 'damlung',
      
      // API Quota
      apiQuota: {
        dailyCalls: 0,
        totalCalls: 0,
        lastCallDate: null,
        dailyLimit: 10,
        monthlyLimit: 100
      },
      
      // Extended Cache - 24 hour cache
      cache: {
        gold: {
          data: null,
          timestamp: null,
          maxAgeHours: 24
        },
        silver: {
          data: null,
          timestamp: null,
          maxAgeHours: 24
        }
      },

      // Fallback prices
      fallbackPrices: {
        gold: 2650,
        silver: 28
      }
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
      this.manualPrice = this.currentPrice || (this.selectedMetal === 'gold' ? 4242 : 28);
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
      
      const metalCache = this.cache[this.selectedMetal];
      const cacheAgeHours = metalCache.timestamp ? 
        (new Date() - new Date(metalCache.timestamp)) / (1000 * 60 * 60) : 999;
      
      if (cacheAgeHours > 24) {
        this.fetchMetalPrice(false);
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
      return this.convertToUnit('damlung', this.currentPrice);
    },

    getChiPrice() {
      return this.convertToUnit('chi', this.currentPrice);
    },

    getPricePerUnit() {
      switch (this.calculatorUnit) {
        case 'oz': return this.currentPrice;
        case 'damlung': return this.convertToUnit('damlung', this.currentPrice);
        case 'chi': return this.convertToUnit('chi', this.currentPrice);
        case 'gram': return this.convertToUnit('gram', this.currentPrice);
        default: return this.currentPrice;
      }
    },

    calculateTotalPrice() {
      if (!this.calculatorAmount || !this.currentPrice) return 0;
      return this.calculatorAmount * this.getPricePerUnit();
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

    async fetchMetalPrice(userRequested = false) {
      const now = new Date();
      const metalSymbol = this.selectedMetal === 'gold' ? 'XAU' : 'XAG';
      const metalCache = this.cache[this.selectedMetal];
      
      // 1. Check cache first (24 hour cache)
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

      // 2. Check daily quota
      const today = new Date().toDateString();
      if (this.apiQuota.lastCallDate !== today) {
        this.apiQuota.dailyCalls = 0;
        this.apiQuota.lastCallDate = today;
      }

      // 3. Prevent unnecessary API calls
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

      // 4. Check monthly quota (safety check)
      if (this.apiQuota.totalCalls >= this.apiQuota.monthlyLimit - 5) {
        if (!userRequested) {
          const fallback = metalCache.data?.price || this.fallbackPrices[this.selectedMetal];
          if (this.selectedMetal === 'gold') {
            this.goldPrice = fallback;
          } else {
            this.silverPrice = fallback;
          }
          this.lastUpdated = 'Near monthly limit';
          this.loading = false;
          return;
        }
      }

      // 5. Make API call
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
        
        // Update price and quota
        if (this.selectedMetal === 'gold') {
          this.goldPrice = data.price;
        } else {
          this.silverPrice = data.price;
        }
        this.apiQuota.dailyCalls++;
        this.apiQuota.totalCalls++;
        this.apiQuota.lastCallDate = today;
        
        // Cache the response for 24 hours
        this.cache[this.selectedMetal] = {
          data: data,
          timestamp: now.toISOString(),
          maxAgeHours: 24
        };
        
        if (process.client) {
          localStorage.setItem('apiQuota', JSON.stringify(this.apiQuota));
          localStorage.setItem(`${this.selectedMetal}PriceCache`, JSON.stringify(this.cache[this.selectedMetal]));
        }
        
        this.lastUpdated = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        console.log(`✅ API call successful for ${this.selectedMetal} (${this.apiQuota.dailyCalls}/10 today)`);
        
      } catch (error) {
        console.error('❌ API Error:', error);
        
        // Fallback strategy
        if (metalCache.data) {
          if (this.selectedMetal === 'gold') {
            this.goldPrice = metalCache.data.price;
          } else {
            this.silverPrice = metalCache.data.price;
          }
          this.lastUpdated = 'Using cached (API error)';
          console.log('Using cached price from', metalCache.timestamp);
        } else {
          const fallback = this.fallbackPrices[this.selectedMetal];
          if (this.selectedMetal === 'gold') {
            this.goldPrice = fallback;
          } else {
            this.silverPrice = fallback;
          }
          this.lastUpdated = 'Estimated (API error)';
          console.log('Using fallback price:', fallback);
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
        
        // Load gold cache
        const savedGoldCache = localStorage.getItem('goldPriceCache');
        if (savedGoldCache) {
          this.cache.gold = JSON.parse(savedGoldCache);
          const cacheAge = (new Date() - new Date(this.cache.gold.timestamp)) / (1000 * 60 * 60);
          if (cacheAge < 24) {
            this.goldPrice = this.cache.gold.data.price;
          }
        }

        // Load silver cache
        const savedSilverCache = localStorage.getItem('silverPriceCache');
        if (savedSilverCache) {
          this.cache.silver = JSON.parse(savedSilverCache);
          const cacheAge = (new Date() - new Date(this.cache.silver.timestamp)) / (1000 * 60 * 60);
          if (cacheAge < 24) {
            this.silverPrice = this.cache.silver.data.price;
          }
        }

        // Return true if we have valid cache for current metal
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

  watch: {
    selectedMetal(newMetal) {
      if (process.client) {
        localStorage.setItem('selectedMetal', newMetal);
      }
      
      // Clear manual mode when switching metals
      if (this.isManualMode) {
        this.isManualMode = false;
        this.manualPrice = null;
      }

      // Fetch price for new metal if not cached
      const metalCache = this.cache[newMetal];
      const cacheAgeHours = metalCache.timestamp ? 
        (new Date() - new Date(metalCache.timestamp)) / (1000 * 60 * 60) : 999;
      
      if (!metalCache.data || cacheAgeHours >= 24) {
        this.fetchMetalPrice(false);
      } else {
        this.loading = false;
        const newPrice = newMetal === 'gold' ? this.goldPrice : this.silverPrice;
        if (newPrice === 0) {
          this.fetchMetalPrice(false);
        }
      }
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

.gold-icon {
  background: #fbbf24;
}

.silver-icon {
  background: #9ca3af;
}

/* Main */
.main {
  padding: 32px 0;
}

/* Manual Section */
.manual-section {
  margin-bottom: 24px;
  transition: all 0.3s ease;
}

.manual-section.expanded {
  margin-bottom: 32px;
}

/* Manual Prompt (Collapsed State) */
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

/* Manual Input (Expanded State) */
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