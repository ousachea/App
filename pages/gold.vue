// pages/index.vue

<template>
  <div>
    <header>
      <div class="container">
        <h1 class="header-title">តម្លៃមាស | Gold Price Checker</h1>
        <p class="header-subtitle">តាមដានតម្លៃមាសប្រចាំថ្ងៃសម្រាប់ប្រជាជនកម្ពុជា</p>
      </div>
    </header>

    <main class="container">
      <!-- Controls -->
      <div class="controls">
        <div class="controls-row">
          <button @click="fetchGoldPrice" :disabled="loading" class="refresh-button">
            <span>{{ loading ? 'កំពុងបន្ទាន់សម័យ...' : 'ធ្វើបច្ចុប្បន្នភាព | Refresh' }}</span>
          </button>
        </div>
        
        <div class="update-time">
          <span>បានធ្វើបច្ចុប្បន្នភាពចុងក្រោយ: {{ lastUpdated }}</span>
        </div>
      </div>

      <!-- Gold Price Cards -->
      <div class="cards-grid">
        <!-- Ounce (standard gold price) -->
        <div class="price-card">
          <h3 class="price-card-title">អោនស៏ (Oz)</h3>
          <p class="price-card-description">តម្លៃមាសអន្តរជាតិ</p>
          
          <div v-if="loading" class="loading-placeholder"></div>
          <div v-else>
            <p class="price-value">{{ formatCurrency(goldPrice) }}</p>
            <p class="price-unit">$ ក្នុងមួយអោនស៏</p>
          </div>
        </div>
        
        <!-- Damlung -->
        <div class="price-card">
          <h3 class="price-card-title">ដំឡឹង (Damlung)</h3>
          <p class="price-card-description">ឯកតាប្រពៃណីខ្មែរ (37.5 ក្រាម)</p>
          
          <div v-if="loading" class="loading-placeholder"></div>
          <div v-else>
            <p class="price-value">{{ formatCurrency(convertToUnit('damlung', goldPrice)) }}</p>
            <p class="price-unit">$ ក្នុងមួយដំឡឹង</p>
          </div>
        </div>
        
        <!-- Chi -->
        <div class="price-card">
          <h3 class="price-card-title">ជី (Chi)</h3>
          <p class="price-card-description">១ ដំឡឹង = ១០ ជី (៣.៧៥ ក្រាម)</p>
          
          <div v-if="loading" class="loading-placeholder"></div>
          <div v-else>
            <p class="price-value">{{ formatCurrency(convertToUnit('chi', goldPrice)) }}</p>
            <p class="price-unit">$ ក្នុងមួយជី</p>
          </div>
        </div>
      </div>
      
      <!-- Price History and Info -->
      <div v-if="priceInfo.length > 0" class="price-info">
        <h2 class="info-title">ព័ត៌មានតម្លៃមាស | Gold Price Information</h2>
        
        <div class="info-grid">
          <div class="info-card" v-for="(info, index) in priceInfo" :key="index">
            <h3 class="info-card-title">{{ info.title }}</h3>
            <p class="info-card-value">{{ info.value }}</p>
          </div>
        </div>
      </div>
    </main>

    <footer>
      <div class="container">
        <p>&copy; {{ new Date().getFullYear() }} Gold Price Checker Cambodia</p>
        <p>តម្លៃដែលបង្ហាញគឺសម្រាប់ព័ត៌មានតែប៉ុណ្ណោះ។ តម្លៃជាក់ស្តែងអាចមានការប្រែប្រួល។</p>
        <p>Gold price data provided by <a href="https://www.goldapi.io" target="_blank" rel="noopener noreferrer">GoldAPI.io</a></p>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'GoldPriceChecker',
  data() {
    return {
      // Unit conversion constants 
      TROY_OUNCE_TO_GRAM: 31.1035,  // 1 troy ounce = 31.1035 grams
      DAMLUNG_TO_GRAM: 37.5,   // 1 damlung = 37.5 grams (Cambodian unit)
      CHI_TO_GRAM: 3.75,       // 1 chi = 3.75 grams (1/10 of damlung)

      // API settings
      apiKey: 'goldapi-vf9wd19m6tl90rg-io',
      apiBaseUrl: 'https://www.goldapi.io/api',

      // Price state
      goldPrice: 0,
      loading: true,
      lastUpdated: '-',
      priceInfo: [], // Additional price information from API
      
      // Available gold units
      units: {},
      
      // Cache for API response
      apiCache: {
        timestamp: null,
        data: null
      }
    };
  },
  methods: {
    // Format currency values
    formatCurrency(value) {
      return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    },

    // Convert gold price to different units
    convertToUnit(unit, price) {
      if (!price) return 0;
      
      const toUnitInfo = this.units[unit];
      return price * (toUnitInfo.toGrams / this.TROY_OUNCE_TO_GRAM);
    },

    // Fetch gold price using GoldAPI.io
    async fetchGoldPrice() {
      this.loading = true;
      this.priceInfo = [];
      
      try {
        let goldData;
        
        // Check cache first (1 hour cache)
        if (this.apiCache.data && 
            this.apiCache.timestamp && 
            (new Date() - this.apiCache.timestamp) < 3600000) {
          goldData = this.apiCache.data;
        } else {
          // Make API request if no recent cache
          const endpoint = `${this.apiBaseUrl}/XAU/USD`;
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
          
          goldData = await response.json();
          
          // Cache the response
          this.apiCache = {
            data: goldData,
            timestamp: new Date()
          };
        }
        
        // Set gold price from API data
        this.goldPrice = goldData.price;
        
        // Add additional info
        this.priceInfo = [
          { title: 'តម្លៃបើកទីផ្សារ | Open Price', value: `$${this.formatCurrency(goldData.open_price)}` },
          { title: 'តម្លៃខ្ពស់បំផុត | High Price', value: `$${this.formatCurrency(goldData.high_price)}` },
          { title: 'តម្លៃទាបបំផុត | Low Price', value: `$${this.formatCurrency(goldData.low_price)}` },
          { title: 'ប្រភេទមាស | Gold Purity', value: `${goldData.metal_name} (${goldData.metal_purity})` }
        ];
        
        this.lastUpdated = new Date().toLocaleString();
      } catch (error) {
        console.error('Error fetching gold price:', error);
        this.lastUpdated = 'មានបញ្ហាក្នុងការទាញយកទិន្នន័យ';
        // Fallback to simulated data if API fails
        this.goldPrice = 2400; // Updated base price as fallback to be closer to current market
      } finally {
        this.loading = false;
      }
    }
  },
  created() {
    // Initialize units object with Cambodian gold units
    this.units = {
      'damlung': { label: 'ដំឡឹង (Damlung)', suffix: 'ដំឡឹង', toGrams: this.DAMLUNG_TO_GRAM },
      'chi': { label: 'ជី (Chi)', suffix: 'ជី', toGrams: this.CHI_TO_GRAM }
    };
  },
  mounted() {
    // Fetch initial data
    this.fetchGoldPrice();
  }
}
</script>

<style>
/* Basic styles */
body {
  font-family: Arial, 'Khmer OS', sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
  color: #333;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 15px;
}

/* Header */
header {
  background-color: #ffd700;
  color: #5a3400;
  padding: 15px 0;
  text-align: center;
}

.header-title {
  margin: 0;
  font-size: 24px;
}

.header-subtitle {
  margin: 5px 0 0;
  font-size: 14px;
}

/* Controls */
.controls {
  background-color: white;
  padding: 15px;
  margin: 20px 0;
  border-radius: 5px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.refresh-button {
  padding: 8px 16px;
  background-color: #ffd700;
  color: #5a3400;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.refresh-button:hover {
  background-color: #e6c200;
}

.refresh-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.update-time {
  font-size: 12px;
  color: #666;
}

/* Price cards */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.price-card {
  background-color: white;
  padding: 15px;
  border-radius: 5px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.price-card-title {
  font-size: 18px;
  margin: 0 0 5px 0;
  color: #5a3400;
}

.price-card-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 15px;
}

.loading-placeholder {
  height: 24px;
  background-color: #eee;
  margin-bottom: 5px;
  border-radius: 4px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.price-value {
  font-size: 24px;
  font-weight: bold;
  color: #e6b012;
  margin: 0;
}

.price-unit {
  font-size: 14px;
  color: #666;
}

/* Price Info */
.price-info {
  background-color: white;
  padding: 15px;
  margin: 20px 0;
  border-radius: 5px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.info-title {
  margin-top: 0;
  font-size: 18px;
  color: #5a3400;
  margin-bottom: 15px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.info-card {
  padding: 10px;
  background-color: #fff9e6;
  border-radius: 4px;
  border-left: 3px solid #ffd700;
}

.info-card-title {
  font-size: 14px;
  color: #666;
  margin: 0 0 5px 0;
}

.info-card-value {
  font-size: 16px;
  font-weight: bold;
  color: #5a3400;
  margin: 0;
}

/* Footer */
footer {
  background-color: #333;
  color: white;
  padding: 20px 0;
  text-align: center;
  margin-top: 30px;
  font-size: 14px;
}

footer a {
  color: #ffd700;
  text-decoration: none;
}

footer a:hover {
  text-decoration: underline;
}
</style>