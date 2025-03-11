<template>
  <div class="page-wrapper">
    <div :class="['gold-wrapper', darkMode ? 'dark-mode' : 'light-mode']">
      <h1 class="gold-glow fade-in slide-down looping-text">Live Gold Price</h1>

      <div class="last-price fade-in scale-up">
        <strong>Live Gold Price:</strong>
        <span class="gold-glow looping-text">{{
          lastRequestPrice || 'Loading...'
        }}</span>
      </div>

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
export default {
  data() {
    return {
      goldPrice: {},
      customChiAmount: 1,
      customChiPrice: null,
      lastUpdated: null,
      pricePerChi: 0,
      lastRequestPrice: '',
      darkMode: false,
    };
  },
  mounted() {
    this.darkMode = JSON.parse(localStorage.getItem('darkMode')) || false;
    this.lastRequestPrice = localStorage.getItem('last_gold_price') || '';
    this.fetchGoldPrice(true);
  },
  methods: {
    async fetchGoldPrice(updateUI) {
      try {
        const response = await fetch('https://www.goldapi.io/api/XAU/USD', {
          headers: { 'x-access-token': 'goldapi-vf9wd19m6tl90rg-io' },
        });
        const data = await response.json();

        const pricePerOunce = data.price;
        const pricePerGram = pricePerOunce / 31.1035;
        const pricePerDamlung = pricePerGram * 37.5;
        this.pricePerChi = pricePerDamlung / 10;

        const newPrice = {
          ounce: `$${pricePerOunce.toFixed(2)}`,
          damlung: `$${pricePerDamlung.toFixed(2)}`,
          chi: `$${this.pricePerChi.toFixed(2)}`,
        };

        if (updateUI) {
          this.goldPrice = newPrice;
          this.lastUpdated = new Date().toLocaleTimeString();
          this.calculateChiPrice();
          this.lastRequestPrice = newPrice.ounce;
        }
      } catch (error) {
        console.error('Error fetching gold price', error);
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
  },
};
</script>

<style>
.page-wrapper {
  text-align: center;
  padding-top: 40px;
}
.gold-wrapper {
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0px 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 520px;
  margin: 20px auto;
  text-align: center;
  transition: all 0.5s ease-in-out;
}
.light-mode {
  background: linear-gradient(135deg, #fff8e1, #ffcc00, #b8860b);
  color: #222;
}
.dark-mode {
  background: linear-gradient(135deg, #222, #444, #111);
  color: #fff;
}
.toggle-mode {
  margin-top: 20px;
  padding: 14px 20px;
  font-size: 18px;
  font-weight: bold;
  border-radius: 10px;
  background: #222;
  color: #ffd700;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
}
.toggle-mode:hover {
  background: #ffd700;
  color: #222;
}
.big-input {
  width: 85%;
  padding: 14px;
  font-size: 20px;
  border-radius: 10px;
  text-align: center;
  transition: all 0.3s ease;
  background: #fff;
  color: #222;
  border: 2px solid #b8860b;
  margin: 15px 0;
}
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
}
.gold-glow {
  color: #b8860b;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(184, 134, 11, 0.7);
}
.timestamp {
  margin-top: 15px;
  font-size: 16px;
  opacity: 0.8;
  color: #444;
}
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
</style>
