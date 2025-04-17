<template>
  <div class="page-wrapper">
    <PageSwitcher/>
    <div :class="['gold-wrapper', darkMode ? 'dark-mode' : 'light-mode']">
      <div class="header-section">
        <h1 class="gold-glow main-title">Live Gold Price</h1>
        <div class="toggle-container">
          <button @click="toggleDarkMode" class="toggle-button">
            <span v-if="darkMode">☀️ Light</span>
            <span v-else>🌙 Dark</span>
          </button>
          <button @click="toggleSource" class="toggle-button">
            {{ useApi ? '🔗 API Data' : '✍️ Manual' }}
          </button>
        </div>
      </div>

      <!-- 📥 Manual Input for Gold Price -->
      <div v-if="!useApi" class="manual-input">
        <label for="goldPrice">Enter Gold Price per Ounce ($)</label>
        <input
          id="goldPrice"
          type="number"
          v-model.number="manualGoldPrice"
          class="big-input"
          @input="updateFromInput"
        />
      </div>

      <!-- 📊 Live Prices -->
      <div class="prices-card">
        <div class="price-item">
          <div class="price-icon">💰</div>
          <div class="price-info">
            <div class="price-label">Ounce</div>
            <div class="price-value">{{ goldPrice.ounce || 'Loading...' }}</div>
          </div>
        </div>
        
        <div class="price-item">
          <div class="price-icon">🔶</div>
          <div class="price-info">
            <div class="price-label">Damlung</div>
            <div class="price-value">{{ goldPrice.damlung || 'Loading...' }}</div>
          </div>
        </div>
        
        <div class="price-item">
          <div class="price-icon">🟡</div>
          <div class="price-info">
            <div class="price-label">Chi</div>
            <div class="price-value">{{ goldPrice.chi || 'Loading...' }}</div>
          </div>
        </div>
      </div>

      <!-- 🔢 Custom Chi Calculation -->
      <div class="calculator-section">
        <h2 class="section-title">Custom Chi Calculator (ជី)</h2>
        <div class="calculator-input">
          <input
            type="number"
            step="0.01"
            v-model.number="customChiAmount"
            placeholder="Enter Chi Amount"
            min="0"
            @input="calculateChiPrice"
            class="big-input"
          />
          <div class="calculation-result">
            Price for <span class="highlight">{{ customChiAmount || 0 }}</span> Chi:
            <span class="gold-value">{{ customChiPrice || '--' }}</span>
          </div>
        </div>
      </div>

      <!-- 📜 Price History Table -->
      <div class="history-section">
        <h2 class="section-title">Recent Price History</h2>
        <div class="table-container">
          <table class="gold-table">
            <thead>
              <tr>
                <th>Ounce ($)</th>
                <th>Damlung ($)</th>
                <th>Chi ($)</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(record, index) in priceHistory" :key="index">
                <td>{{ record.ounce }}</td>
                <td>{{ record.damlung }}</td>
                <td>{{ record.chi }}</td>
                <td>{{ record.timestamp }}</td>
              </tr>
              <tr v-if="priceHistory.length === 0">
                <td colspan="4" class="no-data">No price history available yet</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="timestamp">
        <div class="indicator-dot" :class="{ 'active': useApi }"></div>
        Last updated: {{ lastUpdated || 'Not updated yet' }}
      </div>
    </div>
    <div class="footer">
      &copy; 2025 Gold Price Tracker
    </div>
  </div>
</template>

<script>
import PageSwitcher from '../components/PageSwitcher.vue';

export default {
  components: {
    PageSwitcher
  },
  data() {
    return {
      goldPrice: { ounce: null, damlung: null, chi: null },
      customChiAmount: 1,
      customChiPrice: null,
      lastUpdated: null,
      pricePerChi: 0,
      priceHistory: [],
      darkMode: false,
      useApi: true,
      manualGoldPrice: null,
    };
  },
  mounted() {
    // Check system preference for dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.darkMode = JSON.parse(localStorage.getItem('darkMode')) ?? prefersDark;
    
    this.priceHistory = JSON.parse(localStorage.getItem('priceHistory')) || [];
    this.useApi = JSON.parse(localStorage.getItem('useApi')) ?? true;
    
    if (this.useApi) {
      this.fetchGoldPrice(true);
      // Set up refresh interval for API data - every 5 minutes
      this.refreshInterval = setInterval(() => {
        this.fetchGoldPrice(true);
      }, 300000);
    } else {
      this.restoreManualPrice();
    }
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },
  methods: {
    async fetchGoldPrice(updateUI) {
      if (!this.useApi) return;
      try {
        const response = await fetch('https://www.goldapi.io/api/XAU/USD', {
          headers: { 'x-access-token': 'goldapi-vf9wd19m6tl90rg-io' },
        });
        const data = await response.json();
        this.updateGoldPrices(data.price, updateUI);
      } catch (error) {
        console.error('Error fetching gold price', error);
      }
    },
    updateFromInput() {
      if (this.manualGoldPrice > 0) {
        this.updateGoldPrices(this.manualGoldPrice, true);
        localStorage.setItem('manualGoldPrice', this.manualGoldPrice);
      }
    },
    restoreManualPrice() {
      const storedPrice = localStorage.getItem('manualGoldPrice');
      if (storedPrice) {
        this.manualGoldPrice = parseFloat(storedPrice);
        this.updateGoldPrices(this.manualGoldPrice, true);
      }
    },
    updateGoldPrices(pricePerOunce, updateUI) {
      const pricePerGram = pricePerOunce / 31.1035;
      const pricePerDamlung = pricePerGram * 37.5;
      this.pricePerChi = pricePerDamlung / 10;

      const newPrice = {
        ounce: `$${pricePerOunce.toFixed(2)}`,
        damlung: `$${pricePerDamlung.toFixed(2)}`,
        chi: `$${this.pricePerChi.toFixed(2)}`,
        timestamp: new Date().toLocaleString(),
      };

      if (updateUI) {
        this.goldPrice = newPrice;
        this.lastUpdated = newPrice.timestamp;
        this.calculateChiPrice();

        // Store last 3 price updates locally
        this.priceHistory.unshift(newPrice);
        if (this.priceHistory.length > 3) {
          this.priceHistory.pop();
        }
        localStorage.setItem('priceHistory', JSON.stringify(this.priceHistory));
      }
    },
    calculateChiPrice() {
      this.customChiPrice =
        this.customChiAmount > 0
          ? `$${(this.pricePerChi * this.customChiAmount).toFixed(2)}`
          : null;
    },
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('darkMode', JSON.stringify(this.darkMode));
    },
    toggleSource() {
      this.useApi = !this.useApi;
      localStorage.setItem('useApi', JSON.stringify(this.useApi));
      if (!this.useApi) {
        this.restoreManualPrice();
        if (this.refreshInterval) {
          clearInterval(this.refreshInterval);
          this.refreshInterval = null;
        }
      } else {
        this.fetchGoldPrice(true);
        this.refreshInterval = setInterval(() => {
          this.fetchGoldPrice(true);
        }, 300000);
      }
    },
  },
};
</script>

<style scoped>
/* Import font */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

/* Base reset and settings */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Mobile-first approach */
.page-wrapper {
  font-family: 'Poppins', sans-serif;
  text-align: center;
  padding: 12px;
  position: relative;
  overflow-x: hidden;
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* 🎆 Animated Background with gradient mesh */
.page-wrapper::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(-45deg, #f5d742, #ffc83d, #d4af37, #a67c00);
  background-size: 400% 400%;
  animation: gradientBG 12s ease infinite;
  z-index: -1;
}

@keyframes gradientBG {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Main content wrapper with neumorphic design */
.gold-wrapper {
  flex: 1;
  padding: 25px 20px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 94%;
  max-width: 540px;
  margin: 10px auto;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.4s ease;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 🌓 Theme Modes */
.light-mode {
  color: #333;
  background: rgba(255, 255, 255, 0.85);
}

.dark-mode {
  background: rgba(20, 20, 35, 0.85);
  color: #f0f0f0;
}

/* 📱 Header Section */
.header-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
}

.main-title {
  font-size: 30px;
  font-weight: 700;
  margin-bottom: 15px;
  letter-spacing: 0.5px;
  position: relative;
}

.main-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 3px;
  background: linear-gradient(90deg, rgba(255,215,0,0.2), rgba(255,215,0,0.8), rgba(255,215,0,0.2));
  border-radius: 4px;
}

.toggle-container {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.toggle-button {
  background: rgba(255, 215, 0, 0.2);
  border: 1px solid rgba(255, 215, 0, 0.4);
  color: inherit;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 50px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 44px;
  min-width: 120px;
  backdrop-filter: blur(5px);
}

.toggle-button:hover {
  background: rgba(255, 215, 0, 0.5);
  transform: translateY(-2px);
}

.toggle-button:active {
  transform: translateY(1px);
}

/* 📥 Manual Input Section */
.manual-input {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.manual-input label {
  font-size: 15px;
  font-weight: 500;
}

/* 🔢 Input fields with modern styling */
.big-input {
  width: 92%;
  padding: 14px;
  font-size: 18px;
  border-radius: 12px;
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  border: 1px solid rgba(212, 175, 55, 0.5);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  font-family: 'Poppins', sans-serif;
  -webkit-appearance: none;
}

.big-input:focus {
  border-color: rgba(212, 175, 55, 0.9);
  box-shadow: 0 4px 20px rgba(212, 175, 55, 0.25);
  outline: none;
  transform: scale(1.02);
}

/* 💰 Price Cards Section */
.prices-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.price-item {
  display: flex;
  align-items: center;
  padding: 14px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.price-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

.price-icon {
  font-size: 24px;
  margin-right: 15px;
  min-width: 40px;
}

.price-info {
  flex: 1;
  text-align: left;
}

.price-label {
  font-size: 14px;
  opacity: 0.8;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.price-value {
  font-size: 20px;
  font-weight: 600;
  color: #d4af37;
  text-shadow: 0 0 8px rgba(212, 175, 55, 0.3);
}

/* 🧮 Calculator Section */
.calculator-section {
  padding: 15px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 15px;
  position: relative;
  display: inline-block;
}

.calculator-input {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.calculation-result {
  font-size: 18px;
  font-weight: 500;
  margin-top: 10px;
}

.highlight {
  color: #d4af37;
  font-weight: 600;
}

.gold-value {
  font-size: 22px;
  font-weight: 700;
  color: #d4af37;
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.4);
  display: block;
  margin-top: 5px;
}

/* 📜 History Section */
.history-section {
  padding: 15px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Table Container for Mobile */
.table-container {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 0 auto;
  scrollbar-width: thin;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
}

/* Custom Scrollbar */
.table-container::-webkit-scrollbar {
  height: 4px;
}

.table-container::-webkit-scrollbar-track {
  background: rgba(255, 215, 0, 0.1);
}

.table-container::-webkit-scrollbar-thumb {
  background: rgba(212, 175, 55, 0.6);
  border-radius: 4px;
}

/* Modern Table Design */
.gold-table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
  font-size: 14px;
}

.gold-table th,
.gold-table td {
  padding: 12px 10px;
  text-align: center;
  border-bottom: 1px solid rgba(212, 175, 55, 0.3);
}

.gold-table th {
  background: rgba(212, 175, 55, 0.2);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 12px;
}

.gold-table tr:hover {
  background: rgba(255, 255, 255, 0.1);
}

.no-data {
  font-style: italic;
  opacity: 0.7;
  padding: 20px 0;
}

/* 🕒 Timestamp with live indicator */
.timestamp {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 13px;
  opacity: 0.8;
  margin-top: 10px;
}

.indicator-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #aaa;
  transition: all 0.5s ease;
}

.indicator-dot.active {
  background: #4CAF50;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.6);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.6);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 5px rgba(76, 175, 80, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
}

/* 👣 Footer */
.footer {
  text-align: center;
  padding: 15px;
  font-size: 12px;
  opacity: 0.7;
  color: #333;
}

/* 🌎 Responsive Design */
@media (min-width: 600px) {
  .gold-wrapper {
    padding: 30px;
  }
  
  .main-title {
    font-size: 36px;
  }
  
  .section-title {
    font-size: 24px;
  }
  
  .prices-card {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
  }
  
  .price-item {
    width: calc(33.33% - 10px);
  }
  
  .toggle-button {
    min-width: 140px;
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 24px;
  }
  
  .price-value {
    font-size: 18px;
  }
  
  .gold-table th,
  .gold-table td {
    padding: 10px 5px;
    font-size: 12px;
  }
  
  .section-title {
    font-size: 18px;
  }
  
  .price-item {
    padding: 12px 10px;
  }
}

/* Animation Classes */
.gold-glow {
  color: #d4af37;
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.7);
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slide-down {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.fade-in {
  animation: fade-in 0.8s ease-out forwards;
}

.slide-up {
  animation: slide-up 0.8s ease-out forwards;
}

.slide-down {
  animation: slide-down 0.8s ease-out forwards;
}
</style>