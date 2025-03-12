<template>
  <div class="page-wrapper">
    <div :class="['gold-wrapper', darkMode ? 'dark-mode' : 'light-mode']">
      <h1 class="gold-glow fade-in slide-down looping-text">Live Gold Price</h1>

      <!-- Toggle Between Live API or Manual Input -->
      <button @click="togglePriceSource" class="toggle-source">
        {{ useManualInput ? '🔄 Use Live Price' : '✏️ Use Custom Price' }}
      </button>

      <!-- Manual Input Field (Only Visible When Manual Mode is Active) -->
      <div v-if="useManualInput" class="input-section fade-in">
        <h2 class="slide-in">Enter Gold Price per Ounce</h2>
        <input
          type="number"
          step="0.01"
          v-model.number="customOuncePrice"
          placeholder="Enter price per ounce"
          min="0"
          @input="calculateCustomGoldPrice"
          class="big-input"
        />
      </div>

      <div class="price-container">
        <div class="price fade-in">
          💰 Ounce:
          <span class="looping-text">{{ goldPrice.ounce || '--' }}</span>
        </div>
        <div class="price fade-in">
          🔶 Damlung:
          <span class="looping-text">{{ goldPrice.damlung || '--' }}</span>
        </div>
        <div class="price fade-in">
          🟡 Chi: <span class="looping-text">{{ goldPrice.chi || '--' }}</span>
        </div>
      </div>

      <h2 class="slide-in">Custom Chi Price (ជី)</h2>
      <input
        type="number"
        step="0.01"
        v-model.number="customChiAmount"
        placeholder="Enter Chi amount"
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
      customOuncePrice: null,
      customChiAmount: 1,
      customChiPrice: null,
      lastUpdated: null,
      pricePerChi: 0,
      lastRequestPrice: '',
      darkMode: false,
      useManualInput: false, // Track whether manual input is being used
    };
  },
  mounted() {
    this.darkMode = JSON.parse(localStorage.getItem('darkMode')) || false;
    this.lastRequestPrice = localStorage.getItem('last_gold_price') || '';
    this.fetchGoldPrice(true);
  },
  methods: {
    async fetchGoldPrice(updateUI) {
      if (this.useManualInput) return; // Skip API fetch if using manual input

      try {
        const response = await fetch('https://www.goldapi.io/api/XAU/USD', {
          headers: { 'x-access-token': 'goldapi-vf9wd19m6tl90rg-io' },
        });
        const data = await response.json();
        const pricePerOunce = data.price;

        this.calculateGoldPrice(pricePerOunce, updateUI);
      } catch (error) {
        console.error('Error fetching gold price', error);
      }
    },
    calculateGoldPrice(pricePerOunce, updateUI) {
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
    },
    calculateCustomGoldPrice() {
      if (!this.customOuncePrice || this.customOuncePrice <= 0) return;

      this.calculateGoldPrice(this.customOuncePrice, true);
    },
    calculateChiPrice() {
      this.customChiPrice =
        this.customChiAmount > 0
          ? `$${(this.pricePerChi * this.customChiAmount).toFixed(2)}`
          : '--';
    },
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('darkMode', JSON.stringify(this.darkMode));
    },
    togglePriceSource() {
      this.useManualInput = !this.useManualInput;
      if (!this.useManualInput) {
        this.fetchGoldPrice(true); // Fetch API price when switching back
      }
    },
  },
};
</script>

<style>
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
</style>
