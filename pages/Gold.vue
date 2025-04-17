<template>
  <div class="page-wrapper">
    <PageSwitcher/>
    <div :class="['gold-wrapper', darkMode ? 'dark-mode' : 'light-mode']">
      <h1 class="gold-glow fade-in slide-down looping-text">Live Gold Price</h1>

      <!-- 🔘 Toggle Source (API or Manual) -->
      <button @click="toggleSource" class="toggle-source">
        {{ useApi ? '🔗 Using API Data' : '✍️ Using Manual Input' }}
      </button>

      <!-- 📥 Manual Input for Gold Price -->
      <div v-if="!useApi" class="manual-input">
        <label>Enter Gold Price per Ounce ($):</label>
        <input
          type="number"
          v-model.number="manualGoldPrice"
          class="big-input"
          @input="updateFromInput"
        />
      </div>

      <!-- 📊 Live Prices -->
      <div class="price-container">
        <div class="price fade-in">
          💰 Ounce:
          <span class="looping-text">{{
            goldPrice.ounce || 'Loading...'
          }}</span>
        </div>
        <div class="price fade-in">
          🔶 Damlung:
          <span class="looping-text">{{
            goldPrice.damlung || 'Loading...'
          }}</span>
        </div>
        <div class="price fade-in">
          🟡 Chi:
          <span class="looping-text">{{ goldPrice.chi || 'Loading...' }}</span>
        </div>
      </div>

      <!-- 🔢 Custom Chi Calculation -->
      <h2 class="slide-in">Custom Chi Price (ជី)</h2>
      <input
        type="number"
        step="0.01"
        v-model.number="customChiAmount"
        placeholder="Enter Chi"
        min="0"
        @input="calculateChiPrice"
        class="big-input"
      />
      <div class="price fade-in">
        💲 Price for <span class="gold-glow">{{ customChiAmount }}</span> Chi:
        <span class="gold-glow looping-text">{{ customChiPrice || '--' }}</span>
      </div>

      <!-- 📜 Price History Table -->
      <h2 class="slide-in">Last 3 Prices</h2>
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
          </tbody>
        </table>
      </div>

      <div class="timestamp fade-in slide-up">
        Last updated: {{ lastUpdated }}
      </div>

      <button @click="toggleDarkMode" class="toggle-mode">
        <span v-if="darkMode">☀️ Light Mode</span>
        <span v-else>🌙 Dark Mode</span>
      </button>
    </div>
  </div>
</template>

<script>
import PageSwitcher from '../components/PageSwitcher.vue';

export default {
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
    this.darkMode = JSON.parse(localStorage.getItem('darkMode')) || false;
    this.priceHistory = JSON.parse(localStorage.getItem('priceHistory')) || [];
    if (this.useApi) this.fetchGoldPrice(true);
    else this.restoreManualPrice();
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
      } else {
        this.fetchGoldPrice(true);
      }
    },
  },
};
</script>

<style scoped>
.page-wrapper {
  text-align: center;
  padding-top: 40px;
  position: relative;
  overflow: hidden;
  height: 100vh;
}

/* 🎆 Animated Background */
.page-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(-45deg, #ffdd44, #ffcc00, #b8860b, #8b6508);
  background-size: 400% 400%;
  animation: glowingBackground 6s ease infinite;
  z-index: -1;
}

/* 🔥 Glowing Animation */
@keyframes glowingBackground {
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

/* 📜 Glassmorphism Card */
.gold-wrapper {
  padding: 30px;
  border-radius: 20px;
  backdrop-filter: blur(15px);
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0px 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 520px;
  margin: 20px auto;
  text-align: center;
  border: 2px solid rgba(255, 215, 0, 0.5);
  transition: all 0.5s ease-in-out;
}

/* 🌑 Dark Mode */
.light-mode {
  color: #222;
}

.dark-mode {
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
}

/* 🔘 Toggle Mode Button */
.toggle-mode,
.toggle-source {
  margin: 15px 5px;
  padding: 12px 18px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
}

.toggle-mode {
  background: #222;
  color: #ffd700;
}

.toggle-mode:hover {
  background: #ffd700;
  color: #222;
}

.toggle-source {
  background: #444;
  color: #ffd700;
}

.toggle-source:hover {
  background: #ffd700;
  color: #222;
}

/* ✨ Animated Gold Glow */
.gold-glow {
  color: #b8860b;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(184, 134, 11, 0.7), 0 0 20px rgba(255, 215, 0, 0.5);
}

/* 🎭 Looping Animation */
.looping-text {
  animation: glowLoop 2s infinite alternate;
}

@keyframes glowLoop {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

/* 🔢 Input Fields */
.big-input {
  width: 85%;
  padding: 14px;
  font-size: 20px;
  border-radius: 10px;
  text-align: center;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
  color: #222;
  border: 2px solid #b8860b;
  margin: 15px 0;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.big-input:focus {
  border-color: #ffcc00;
  box-shadow: 0 5px 20px rgba(255, 215, 0, 0.5);
}

/* 💰 Gold Prices */
.price-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin: 15px 0;
}

.price {
  font-size: 20px;
  font-weight: bold;
  color: #222;
  background: rgba(255, 255, 255, 0.2);
  padding: 10px 15px;
  border-radius: 8px;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
}

/* 🕒 Timestamp */
.timestamp {
  margin-top: 15px;
  font-size: 16px;
  opacity: 0.8;
  color: #444;
}
/* 📊 Gold Price Table */
.gold-table {
  width: 100%;
  margin-top: 15px;
  border-collapse: collapse;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
}

.gold-table th,
.gold-table td {
  padding: 12px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 215, 0, 0.5);
}

.gold-table th {
  background: rgba(255, 215, 0, 0.3);
  color: #222;
  font-weight: bold;
}

.gold-table tr:hover {
  background: rgba(255, 255, 255, 0.3);
}
/* 📜 Table Container for Mobile */
.table-container {
  width: 100%;
  overflow-x: auto;
}

/* 📊 Gold Price Table */
.gold-table {
  width: 100%;
  margin-top: 15px;
  border-collapse: collapse;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
}

.gold-table th,
.gold-table td {
  padding: 12px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 215, 0, 0.5);
}

.gold-table th {
  background: rgba(255, 215, 0, 0.3);
  color: #222;
  font-weight: bold;
}

.gold-table tr:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 🌎 Responsive Design */
@media (max-width: 600px) {
  .gold-table th,
  .gold-table td {
    font-size: 14px;
    padding: 8px;
  }
  .price-container {
    flex-direction: column;
    align-items: center;
  }
  .big-input {
    width: 90%;
    font-size: 18px;
  }
}
/* 🌟 Full Page Styling */
body {
  margin: 0;
  padding: 0;
  font-family: 'Poppins', sans-serif;
  background: linear-gradient(-45deg, #ffdd44, #ffcc00, #b8860b, #8b6508);
  background-size: 400% 400%;
  animation: glowingBackground 6s ease infinite;
  color: #fff;
  text-align: center;
  overflow-x: hidden;
}

@keyframes glowingBackground {
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

/* 📜 Gold Wrapper (No Card) */
.gold-wrapper {
  padding: 30px;
  max-width: 600px;
  margin: auto;
  text-align: center;
  border-radius: 15px;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 215, 0, 0.5);
}

/* 🌑 Dark Mode */
.dark-mode {
  background: rgba(0, 0, 0, 0.8);
}

.light-mode {
  background: rgba(255, 255, 255, 0.9);
  color: #222;
}

/* ✨ Glowing Gold Effect */
.gold-glow {
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 223, 0, 0.7);
}

/* 🔘 Toggle Buttons */
.toggle-mode,
.toggle-source {
  margin: 10px;
  padding: 12px 18px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.toggle-mode {
  background: #222;
  color: #ffd700;
}

.toggle-mode:hover {
  background: #ffd700;
  color: #222;
}

.toggle-source {
  background: #444;
  color: #ffd700;
}

.toggle-source:hover {
  background: #ffd700;
  color: #222;
}

/* 🔢 Input Fields */
.big-input {
  width: 85%;
  max-width: 320px;
  padding: 14px;
  font-size: 20px;
  border-radius: 10px;
  text-align: center;
  background: rgba(255, 255, 255, 0.85);
  color: #222;
  border: 2px solid #b8860b;
  margin: 15px 0;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.big-input:focus {
  border-color: #ffcc00;
  box-shadow: 0 5px 20px rgba(255, 215, 0, 0.5);
}

/* 📊 Price Container */
.price-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.price {
  font-size: 20px;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.2);
  padding: 10px 15px;
  border-radius: 8px;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
}

/* 📜 Table Container */
.table-container {
  width: 100%;
  overflow-x: auto;
}

/* 📊 Price History Table */
.gold-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
}

.gold-table th,
.gold-table td {
  padding: 12px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 215, 0, 0.5);
}

.gold-table th {
  background: rgba(255, 215, 0, 0.3);
  color: #222;
  font-weight: bold;
}

.gold-table tr:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 🕒 Timestamp */
.timestamp {
  margin-top: 10px;
  font-size: 14px;
  opacity: 0.8;
}

/* 🎭 Looping Animation */
.looping-text {
  animation: glowLoop 2s infinite alternate;
}

@keyframes glowLoop {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0.9;
    transform: scale(1.05);
  }
}

/* 📱 Responsive Design */
@media (max-width: 600px) {
  .gold-table th,
  .gold-table td {
    font-size: 14px;
    padding: 8px;
  }
  .big-input {
    width: 90%;
    font-size: 18px;
  }
}
</style>