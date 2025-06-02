<!-- pages/index.vue -->

<template>
  <div class="app">
    <!-- Minimal Header -->
    <header class="header">
      <div class="container">
        <h1 class="title">🏆 តម្លៃមាស Gold Price</h1>
        <div class="update-status">
          <div class="status-dot" :class="statusClass"></div>
          <span class="update-time">{{ lastUpdated }}</span>
        </div>
      </div>
    </header>

    <main class="main">
      <!-- Refresh Button -->
      <div class="refresh-section">
        <button @click="fetchGoldPrice(true)" :disabled="loading" class="refresh-btn">
          <svg class="icon" :class="{ 'spin': loading }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
          </svg>
          {{ loading ? 'កំពុងបន្ទាន់...' : 'ធ្វើបច្ចុប្បន្នភាព' }}
        </button>
        
        <!-- API Usage Indicator -->
        <div class="api-usage">
          <div class="usage-bar">
            <div class="usage-fill" :style="{ width: (apiQuota.dailyCalls / apiQuota.dailyLimit * 100) + '%' }"></div>
          </div>
          <span class="usage-text">{{ apiQuota.dailyCalls }}/3 ថ្ងៃនេះ • {{ apiQuota.totalCalls }}/90 ខែនេះ</span>
        </div>
      </div>

      <!-- Compact Price Cards -->
      <div class="price-cards">
        <!-- Damlung (Primary) -->
        <div class="card primary">
          <div class="card-header">
            <span class="card-title">ដំឡឹង</span>
            <span class="card-unit">37.5g</span>
          </div>
          <div class="price-display">
            <div v-if="loading" class="skeleton"></div>
            <div v-else class="price">
              <span class="amount">${{ formatPrice(convertToUnit('damlung', goldPrice)) }}</span>
              <div v-if="priceChange.value" class="change" :class="priceChange.type">
                {{ priceChange.value }}
              </div>
            </div>
          </div>
        </div>

        <!-- Chi -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">ជី</span>
            <span class="card-unit">3.75g</span>
          </div>
          <div class="price-display">
            <div v-if="loading" class="skeleton"></div>
            <div v-else class="price">
              <span class="amount">${{ formatPrice(convertToUnit('chi', goldPrice)) }}</span>
            </div>
          </div>
        </div>

        <!-- Troy Ounce -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">អោនស៏</span>
            <span class="card-unit">Troy Oz</span>
          </div>
          <div class="price-display">
            <div v-if="loading" class="skeleton"></div>
            <div v-else class="price">
              <span class="amount">${{ formatPrice(goldPrice) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Compact Calculator -->
      <div v-if="goldPrice > 0" class="calculator">
        <h3 class="calc-title">គណនាតម្លៃ</h3>
        <div class="calc-inputs">
          <input 
            v-model.number="calculatorAmount" 
            type="number" 
            min="0" 
            step="0.1"
            class="calc-input"
            placeholder="បរិមាណ"
          >
          <select v-model="calculatorUnit" class="calc-select">
            <option value="damlung">ដំឡឹង</option>
            <option value="chi">ជី</option>
            <option value="oz">អោនស៏</option>
            <option value="gram">ក្រាម</option>
          </select>
        </div>
        <div class="calc-result">
          <span class="result-label">តម្លៃសរុប:</span>
          <span class="result-value">${{ formatPrice(calculateTotalPrice()) }}</span>
          <div v-if="calculatorUnit === 'damlung'" class="result-note">
            ដំឡឹងជាឯកតាស្តង់ដារកម្ពុជា
          </div>
        </div>
      </div>

      <!-- Market Info (Collapsible) -->
      <div v-if="priceInfo.length > 0" class="market-info">
        <button @click="showMarketInfo = !showMarketInfo" class="info-toggle">
          <span>ព័ត៌មានទីផ្សារ</span>
          <svg class="chevron" :class="{ 'rotate': showMarketInfo }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
        
        <div v-if="showMarketInfo" class="info-content">
          <div class="info-grid">
            <div v-for="(info, index) in priceInfo" :key="index" class="info-item">
              <span class="info-label">{{ info.title.split('|')[0].trim() }}</span>
              <span class="info-value">{{ info.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Compact Tips -->
      <div class="tips">
        <div class="tip">
          <span class="tip-label">ឯកតាខ្មែរ:</span>
          <span class="tip-text">ដំឡឹងគឺជាឯកតាមាសប្រពៃណីខ្មែរ = ៣៧.៥ក្រាម</span>
        </div>
        <div class="tip">
          <span class="tip-label">ការបម្លែង:</span>
          <span class="tip-text">១ដំឡឹង = ១០ជី • ១អោនស៏ = ០.៨៣ដំឡឹង</span>
        </div>
        <div class="tip">
          <span class="tip-label">ចំណាំ:</span>
          <span class="tip-text">តម្លៃជាក់ស្តែងអាចខុសពីតម្លៃដែលបង្ហាញ</span>
        </div>
      </div>
    </main>

    <!-- Minimal Footer -->
    <footer class="footer">
      <div class="container">
        <p class="footer-text">
          © {{ new Date().getFullYear() }} Gold Price Tracker • 
          <a href="https://www.goldapi.io" target="_blank" class="footer-link">Data: GoldAPI</a>
        </p>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'MinimalGoldTracker',
  data() {
    return {
      // Constants
      TROY_OUNCE_TO_GRAM: 31.1035,
      DAMLUNG_TO_GRAM: 37.5,
      CHI_TO_GRAM: 3.75,

      // API settings
      apiKey: 'goldapi-vf9wd19m6tl90rg-io',
      apiBaseUrl: 'https://www.goldapi.io/api',

      // State
      goldPrice: 0,
      previousPrice: 0,
      loading: true,
      lastUpdated: 'កំពុងទាញយក...',
      priceInfo: [],
      showMarketInfo: false,
      
      // Calculator
      calculatorAmount: 1,
      calculatorUnit: 'damlung', // Default to damlung
      
      // Enhanced Cache with localStorage fallback
      apiCache: {
        timestamp: null,
        data: null
      },
      
      // Strict API quota management (90 calls/month)
      apiQuota: {
        totalCalls: 0,
        dailyCalls: 0,
        lastCallDate: null,
        monthlyLimit: 90,
        dailyLimit: 3, // 90/30 = 3 calls per day max
        emergencyReserve: 10 // Keep 10 calls for month-end
      },
      
      // Enhanced caching for extreme conservation
      longTermCache: {
        data: null,
        timestamp: null,
        expiryHours: 8 // 8-hour default cache
      },
      
      // User interaction tracking
      userActivity: {
        lastInteraction: null,
        isActive: true,
        manualRefreshRequests: 0
      },
      
      // Alternative data sources
      fallbackPrices: {
        basePrice: 2420, // Recent baseline in USD per troy ounce
        baseDamlungPrice: 2929, // Approximate damlung price (2420 * 37.5/31.1035)
        lastKnownPrice: 0,
        priceHistory: [],
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
    }
  },
  methods: {
    formatPrice(value) {
      if (!value) return '0.00';
      return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
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

    calculateTotalPrice() {
      if (!this.calculatorAmount || !this.goldPrice) return 0;
      
      let pricePerUnit;
      switch (this.calculatorUnit) {
        case 'oz':
          pricePerUnit = this.goldPrice;
          break;
        case 'damlung':
          pricePerUnit = this.convertToUnit('damlung', this.goldPrice);
          break;
        case 'chi':
          pricePerUnit = this.convertToUnit('chi', this.goldPrice);
          break;
        case 'gram':
          pricePerUnit = this.convertToUnit('gram', this.goldPrice);
          break;
        default:
          pricePerUnit = this.goldPrice;
      }
      
      return this.calculatorAmount * pricePerUnit;
    },

    async fetchGoldPrice(forceRefresh = false) {
      // Rate limiting check
      if (!forceRefresh && this.lastApiCall && 
          (new Date() - this.lastApiCall) < this.minApiInterval) {
        console.log('API call rate limited');
        return;
      }

      this.loading = true;
      
      try {
        let goldData;
        const now = new Date();
        
        // Extended cache check - 30 minutes for automatic refresh, 5 minutes for manual
        const cacheTimeout = forceRefresh ? 300000 : 1800000; // 5min manual, 30min auto
        
        if (this.apiCache.data && 
            this.apiCache.timestamp && 
            (now - this.apiCache.timestamp) < cacheTimeout) {
          goldData = this.apiCache.data;
          console.log('Using cached data');
        } else {
          // Check if it's market hours (gold market is 24/7 but most active during business hours)
          const hour = now.getHours();
          const isMarketActive = hour >= 9 && hour <= 17; // 9 AM to 5 PM
          
          // If outside market hours and we have recent data (< 2 hours), don't call API
          if (!forceRefresh && !isMarketActive && this.apiCache.data && 
              (now - this.apiCache.timestamp) < 7200000) { // 2 hours
            goldData = this.apiCache.data;
            console.log('Using cached data - outside market hours');
          } else {
            // Make API call with retry logic
            console.log('Making API call');
            const endpoint = `${this.apiBaseUrl}/XAU/USD`;
            
            try {
              const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                  'x-access-token': this.apiKey,
                  'Content-Type': 'application/json'
                },
                // Add timeout to prevent hanging requests
                signal: AbortSignal.timeout(10000) // 10 second timeout
              });
              
              if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
              }
              
              goldData = await response.json();
              this.lastApiCall = now;
              this.refreshAttempts = 0; // Reset on success
              
              // Cache the response with timestamp
              this.apiCache = {
                data: goldData,
                timestamp: now
              };
              
              // Store in localStorage as backup (if available)
              try {
                localStorage.setItem('goldPriceCache', JSON.stringify(this.apiCache));
              } catch (e) {
                console.log('localStorage not available');
              }
              
            } catch (apiError) {
              console.error('API call failed:', apiError);
              this.refreshAttempts++;
              
              // Try localStorage backup first
              try {
                const cached = localStorage.getItem('goldPriceCache');
                if (cached) {
                  const parsedCache = JSON.parse(cached);
                  // Use localStorage cache if less than 24 hours old
                  if ((now - new Date(parsedCache.timestamp)) < 86400000) {
                    goldData = parsedCache.data;
                    console.log('Using localStorage backup');
                  }
                }
              } catch (e) {
                console.log('localStorage backup failed');
              }
              
              // If still no data, use fallback
              if (!goldData) {
                throw apiError;
              }
            }
          }
        }
        
        this.previousPrice = this.goldPrice;
        this.goldPrice = goldData.price;
        
        this.priceInfo = [
          { title: 'បើក | Open', value: `${this.formatPrice(goldData.open_price)}` },
          { title: 'ខ្ពស់ | High', value: `${this.formatPrice(goldData.high_price)}` },
          { title: 'ទាប | Low', value: `${this.formatPrice(goldData.low_price)}` },
          { title: 'មាស | Purity', value: `${goldData.metal_purity || '99.5%'}` }
        ];
        
        this.lastUpdated = new Date().toLocaleString('km-KH', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
      } catch (error) {
        console.error('Error fetching gold price:', error);
        this.lastUpdated = 'មានបញ្ហា';
        
        // Use fallback price only if we have no data at all
        if (this.goldPrice === 0) {
          this.goldPrice = 2420; // Static fallback
          this.lastUpdated = 'ទិន្នន័យបម្រុង';
        }
        
        // Disable background refresh if too many failures
        if (this.refreshAttempts >= this.maxRefreshAttempts) {
          this.backgroundRefreshEnabled = false;
          console.log('Background refresh disabled due to repeated failures');
        }
      } finally {
        this.loading = false;
      }
    },

    // Smart refresh that considers various factors
    smartRefresh() {
      const now = new Date();
      
      // Don't refresh if disabled due to failures
      if (!this.backgroundRefreshEnabled) {
        return;
      }
      
      // Don't refresh if user is not active (page not visible)
      if (document.hidden) {
        return;
      }
      
      // Don't refresh during weekend (gold market less active)
      const dayOfWeek = now.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        return;
      }
      
      // Only refresh during active hours
      const hour = now.getHours();
      if (hour < 6 || hour > 22) { // Outside 6 AM - 10 PM
        return;
      }
      
      this.fetchGoldPrice(false);
    }
  },
  mounted() {
    // Load quota tracking from localStorage
    try {
      const savedQuota = localStorage.getItem('apiQuota');
      if (savedQuota) {
        this.apiQuota = { ...this.apiQuota, ...JSON.parse(savedQuota) };
      }
      
      const longCache = localStorage.getItem('goldPriceLongCache');
      if (longCache) {
        this.longTermCache = JSON.parse(longCache);
        // Use long cache if less than 24 hours old
        const cacheAge = (new Date() - new Date(this.longTermCache.timestamp)) / (1000 * 60 * 60);
        if (cacheAge < 24) {
          this.goldPrice = this.longTermCache.data.price;
          this.lastUpdated = `${Math.floor(cacheAge)}ម៉ោងមុន (រក្សាទុក)`;
          this.loading = false;
          
          // Load additional cached data
          const savedFallback = localStorage.getItem('fallbackPrices');
          if (savedFallback) {
            this.fallbackPrices = { ...this.fallbackPrices, ...JSON.parse(savedFallback) };
          }
          
          return; // Don't make API call on startup if we have recent cache
        }
      }
    } catch (e) {
      console.log('Failed to load saved data');
    }
    
    // Only make API call on startup if no recent cache
    this.fetchGoldPrice(false);
    
    // NO automatic background refresh - user must manually refresh
    // This saves all API calls for when users actually want fresh data
    
    // Only refresh when user returns to page after long absence
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Check if data is very stale (>12 hours) before auto-refreshing
        const cacheAge = this.longTermCache.timestamp ? 
          (new Date() - this.longTermCache.timestamp) / (1000 * 60 * 60) : 999;
        
        if (cacheAge > 12) {
          const canCall = this.canMakeApiCall();
          if (canCall.allowed) {
            this.fetchGoldPrice(false);
          }
        }
      }
    });
  }
}
</script>

<style scoped>
/* Mobile-First Minimal Design */
.app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Khmer OS', sans-serif;
  background: #f8fafc;
  min-height: 100vh;
  color: #1e293b;
}

.container {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 16px;
}

/* Header */
.header {
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  padding: 16px 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #0f172a;
}

.update-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.loading {
  background: #f59e0b;
  animation: pulse 2s infinite;
}

.status-dot.success {
  background: #10b981;
}

.status-dot.error {
  background: #ef4444;
}

.update-time {
  font-size: 12px;
  color: #64748b;
}

/* Main Content */
.main {
  padding: 16px;
  max-width: 480px;
  margin: 0 auto;
}

.result-note {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
  font-style: italic;
}

/* API Usage Indicator */
.api-usage {
  margin-top: 8px;
  text-align: center;
}

.usage-bar {
  width: 100%;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.usage-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #f59e0b, #ef4444);
  transition: width 0.3s ease;
}

.usage-text {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

/* Refresh Button */
.refresh-section {
  margin-bottom: 20px;
}

.refresh-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #f59e0b ;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #fbbf24 ;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.icon {
  width: 16px;
  height: 16px;
}

.icon.spin {
  animation: spin 1s linear infinite;
}

/* Price Cards */
.price-cards {
  display: grid;
  gap: 12px;
  margin-bottom: 20px;
}

.card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
}

.card:hover {
  border-color: #cbd5e1;
}

.card.primary {
  border-color: #f59e0b ;
  background: linear-gradient(135deg, #f59e0b  0%, #fbbf24  100%);
  color: white;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.card-unit {
  font-size: 12px;
  opacity: 0.7;
}

.price-display {
  min-height: 32px;
}

.skeleton {
  height: 24px;
  background: linear-gradient(90deg, #f1f5f9, #e2e8f0, #f1f5f9);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

.price {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.amount {
  font-size: 18px;
  font-weight: 700;
}

.change {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.change.positive {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.change.negative {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

/* Calculator */
.calculator {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.calc-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.calc-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.calc-input, .calc-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.calc-input:focus, .calc-select:focus {
  outline: none;
  border-color: #f59e0b ;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.calc-result {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
}

.result-label {
  font-size: 14px;
  color: #64748b;
}

.result-value {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

/* Market Info */
.market-info {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
}

.info-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  color: #0f172a;
}

.chevron {
  width: 16px;
  height: 16px;
  transition: transform 0.2s;
}

.chevron.rotate {
  transform: rotate(180deg);
}

.info-content {
  border-top: 1px solid #e2e8f0;
}

.info-grid {
  padding: 16px;
  display: grid;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 14px;
  color: #64748b;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

/* Tips */
.tips {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.tip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.tip:last-child {
  margin-bottom: 0;
}

.tip-label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.tip-text {
  font-size: 14px;
  color: #64748b;
  line-height: 1.4;
}

/* Footer */
.footer {
  background: white;
  border-top: 1px solid #e2e8f0;
  padding: 16px 0;
  margin-top: auto;
}

.footer-text {
  font-size: 12px;
  color: #64748b;
  text-align: center;
  margin: 0;
}

.footer-link {
  color: #f59e0b;
  text-decoration: none;
}

.footer-link:hover {
  text-decoration: underline;
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Larger screens */
@media (min-width: 481px) {
  .container {
    max-width: 600px;
  }
  
  .main {
    max-width: 600px;
  }
  
  .price-cards {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
  
  .calc-inputs {
    grid-template-columns: 2fr 1fr;
  }
}

@media (min-width: 768px) {
  .container {
    max-width: 800px;
  }
  
  .main {
    max-width: 800px;
    padding: 24px;
  }
  
  .price-cards {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Focus styles */
.refresh-btn:focus,
.calc-input:focus,
.calc-select:focus,
.info-toggle:focus {
  outline: 2px solid #f59e0b ;
  outline-offset: 2px;
}
</style>