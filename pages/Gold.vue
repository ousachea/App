<template>
  
  <div class="page-wrapper">
        <PageSwitcher/>

    <div class="gold-wrapper">
      <h1 class="gold-glow fade-in slide-down looping-text">Live Gold Price</h1>
      <div class="last-price fade-in scale-up">
        <strong>Live Gold Price:</strong>
        <span class="gold-glow looping-text">{{ lastRequestPrice || 'Loading...' }}</span>
      </div>
      <div class="price-container">
        <div class="price fade-in">💰 Ounce: <span class="looping-text">{{ goldPrice.ounce || 'Loading...' }}</span></div>
        <div class="price fade-in">🔶 Damlung: <span class="looping-text">{{ goldPrice.damlung || 'Loading...' }}</span></div>
        <div class="price fade-in">🟡 Chi: <span class="looping-text">{{ goldPrice.chi || 'Loading...' }}</span></div>
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
      <div class="price fade-in">💲 Price for <span class="gold-glow">{{ customChiAmount }}</span> Chi:
        <span class="gold-glow looping-text">{{ customChiPrice || '--' }}</span>
      </div>
      <div class="timestamp fade-in slide-up">Last updated: {{ lastUpdated }}</div>
    </div>
  </div>
</template>

<script setup>
import PageSwitcher from '../components/PageSwitcher.vue';

import { ref, onMounted } from 'vue';

const goldPrice = ref({});
const customChiAmount = ref(1);
const customChiPrice = ref(null);
const lastUpdated = ref(null);
const pricePerChi = ref(0);
const lastRequestPrice = ref('');

const fetchGoldPrice = async (updateUI) => {
  try {
    const response = await fetch('https://www.goldapi.io/api/XAU/USD', {
      headers: { 'x-access-token': 'goldapi-vf9wd19m6tl90rg-io' },
    });
    const data = await response.json();

    const pricePerOunce = data.price;
    const pricePerGram = pricePerOunce / 31.1035;
    const pricePerDamlung = pricePerGram * 37.5;
    pricePerChi.value = pricePerDamlung / 10;

    const newPrice = {
      ounce: `$${pricePerOunce.toFixed(2)}`,
      damlung: `$${pricePerDamlung.toFixed(2)}`,
      chi: `$${pricePerChi.value.toFixed(2)}`,
    };

    localStorage.setItem('gold_price', JSON.stringify(newPrice));
    localStorage.setItem('last_updated', new Date().toISOString());

    if (updateUI) {
      goldPrice.value = newPrice;
      lastUpdated.value = new Date().toLocaleTimeString();
      calculateChiPrice();
      lastRequestPrice.value = newPrice.ounce;
    }
  } catch (error) {
    console.error('Error fetching gold price', error);
  }
};

const scheduleGoldPriceFetch = () => {
  setInterval(() => {
    fetchGoldPrice(true);
  }, 12 * 60 * 60 * 1000); // Every 12 hours
};

const calculateChiPrice = () => {
  customChiPrice.value =
    customChiAmount.value > 0
      ? `$${(pricePerChi.value * customChiAmount.value).toFixed(2)}`
      : null;
};

onMounted(() => {
  const storedPrice = JSON.parse(localStorage.getItem('gold_price'));
  if (storedPrice) {
    goldPrice.value = storedPrice;
    lastUpdated.value = new Date(localStorage.getItem('last_updated')).toLocaleTimeString();
    lastRequestPrice.value = storedPrice.ounce;
  }
  scheduleGoldPriceFetch();
  fetchGoldPrice(true);
});
</script>

<style scoped>
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
  background: linear-gradient(135deg, #fff8e1, #ffcc00, #b8860b);
  color: #000;
  transition: all 0.5s ease-in-out;
}
.big-input {
  width: 85%;
  padding: 14px;
  font-size: 20px;
  border-radius: 10px;
  text-align: center;
  background: #fff;
  color: #000;
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
  color: #000;
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
  color: #000;
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
