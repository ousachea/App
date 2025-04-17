<template>
  <div class="container" :style="{ backgroundImage: backgroundGradient }">
    <PageSwitcher/>

    <div class="card" :class="{ 'error-state': invalidInput }">
      <h2 class="title">Cambodia Carrier Checker</h2>
      <p class="subtitle">Enter the first two digits of any Cambodian number</p>
      
      <div class="phone-card">
        <div class="input-container">
          <div class="input-prefix">0</div>
          <input
            v-model="phoneNumber"
            placeholder="00"
            @input="formatAndDetectCarrier"
            class="input"
            :class="{ shakeLoop: invalidInput, matched: matchedPrefix }"
            :style="{ borderColor: inputBorderColor, boxShadow: inputShadow }"
            maxlength="2"
            type="text"
            inputmode="numeric"
          />
          <button 
            v-if="phoneNumber" 
            @click="clearInput" 
            class="clear-button"
            aria-label="Clear input"
          >
            ×
          </button>
          <div class="icon-container" v-if="carrier !== 'Unknown Carrier'">
            <span class="check-icon">✓</span>
          </div>
        </div>
      </div>

      <transition name="fade-pop">
        <div class="carrier-info" v-if="carrier !== 'Unknown Carrier'">
          <p class="carrier">
            Your carrier is <span :style="{ color: carriers[carrier]?.color }">{{ carrier }}</span>
          </p>
        </div>
      </transition>

      <div class="prefix-list">
        <h3 class="section-title">Available Carriers</h3>
        <div class="carrier-list">
          <div
            v-for="(carrierData, name) in carriers"
            :key="name"
            class="carrier-card"
            :class="{ 
              faded: carrier && carrier !== name,
              active: carrier === name 
            }"
            :style="{ borderColor: carrier === name ? carrierData.color : 'transparent' }"
          >
            <div class="carrier-header" :style="{ backgroundColor: carrierData.color + '15' }">
              <h4 :style="{ color: carrierData.color }">{{ name }}</h4>
            </div>
            <div class="prefixes">
              <span
                v-for="prefix in carrierData.prefixes"
                :key="prefix"
                class="prefix-badge"
                :style="{ 
                  backgroundColor: matchedPrefix === prefix ? carrierData.color : carrierData.color + '20',
                  color: matchedPrefix === prefix ? '#fff' : carrierData.color
                }"
                :class="{
                  pulse: matchedPrefix === prefix,
                  highlighted: matchedPrefix === prefix,
                }"
              >
                0{{ prefix }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import PageSwitcher from '../components/PageSwitcher.vue';
import { ref, computed, watch } from 'vue';

const phoneNumber = ref('');
const matchedPrefix = ref(null);
const invalidInput = ref(false);
const carrier = ref('Unknown Carrier');

// Create a set of all valid prefixes for quick lookup
const validPrefixes = new Set();
const carriers = {
  Cellcard: {
    color: '#FF9800',
    prefixes: [
      '11', '12', '17', '61', '76', 
      '77', '78', '79', '85', '89', 
      '92', '95', '99',
    ],
  },
  Smart: {
    color: '#00A859',
    prefixes: [
      '10', '15', '16', '69', '70', 
      '81', '86', '87', '93', '96', '98',
    ],
  },
  Metfone: { 
    color: '#E60012', 
    prefixes: ['88', '97'] 
  },
};

// Fill the validPrefixes set
Object.values(carriers).forEach(carrierData => {
  carrierData.prefixes.forEach(prefix => validPrefixes.add(prefix));
});

const inputBorderColor = computed(() => {
  if (invalidInput.value) return '#ff3333';
  return carrier.value !== 'Unknown Carrier'
    ? carriers[carrier.value]?.color || '#ddd'
    : '#ddd';
});

const inputShadow = computed(() => {
  if (invalidInput.value) return '0 0 10px rgba(255, 51, 51, 0.4)';
  return carrier.value !== 'Unknown Carrier'
    ? `0 0 10px ${carriers[carrier.value]?.color}50` 
    : 'none';
});

const backgroundGradient = computed(() => {
  if (invalidInput.value) {
    return 'linear-gradient(135deg, #ff333320, #ff333340)';
  }
  if (carrier.value !== 'Unknown Carrier') {
    const color = carriers[carrier.value]?.color;
    return `linear-gradient(135deg, ${color}10, ${color}30)`;
  }
  return 'linear-gradient(135deg, #f8f9fa, #e9ecef)';
});

watch(phoneNumber, (newValue) => {
  if (newValue && !/^[0-9]{1,2}$/.test(newValue)) {
    phoneNumber.value = phoneNumber.value.replace(/[^0-9]/g, '');
    showError();
  }
});

const showError = () => {
  // Reset the animation if it's already running
  invalidInput.value = false;
  setTimeout(() => {
    invalidInput.value = true;
  }, 10);
  // Don't clear the error state - we'll keep shaking as long as input is invalid
};

const clearInput = () => {
  phoneNumber.value = '';
  carrier.value = 'Unknown Carrier';
  matchedPrefix.value = null;
  invalidInput.value = false;
};

const formatAndDetectCarrier = () => {
  if (!phoneNumber.value) {
    carrier.value = 'Unknown Carrier';
    matchedPrefix.value = null;
    return;
  }
  
  const input = phoneNumber.value.padStart(2, '0').slice(0, 2);
  
  // Reset state
  matchedPrefix.value = null;
  carrier.value = 'Unknown Carrier';

  // If we have 2 digits and it's not a valid prefix, show error
  if (phoneNumber.value.length === 2 && !validPrefixes.has(input)) {
    showError();
    return;
  }

  // Check for a match
  for (const [key, carrierData] of Object.entries(carriers)) {
    if (carrierData.prefixes.includes(input)) {
      carrier.value = key;
      matchedPrefix.value = input;
      return;
    }
  }
};
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f5f5;
  transition: all 0.5s ease-in-out;
  font-family: 'Poppins', sans-serif;
}

.card {
  background: white;
  padding: 30px;
  border-radius: 24px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.08);
  text-align: center;
  width: 100%;
  max-width: 550px;
  transition: all 0.3s ease;
}

.card.error-state {
  box-shadow: 0 12px 36px rgba(255, 51, 51, 0.15);
}

.title {
  font-size: 28px;
  color: #333;
  margin-bottom: 6px;
  font-weight: 700;
}

.subtitle {
  font-size: 16px;
  color: #666;
  margin-bottom: 24px;
}

.section-title {
  font-size: 20px;
  color: #444;
  margin: 36px 0 16px;
  font-weight: 600;
}

.phone-card {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
  width: 100%;
}

.input-container {
  position: relative;
  width: 100%;
  max-width: 300px;
  display: flex;
  align-items: center;
}

.input-prefix {
  position: absolute;
  left: 16px;
  font-size: 22px;
  font-weight: 600;
  color: #333;
  z-index: 1;
}

.input {
  width: 100%;
  padding: 16px 40px 16px 30px;
  font-size: 22px;
  font-weight: 600;
  border-radius: 16px;
  border: 2px solid #e1e1e1;
  text-align: left;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  background-color: white;
}

.input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
}

.input.matched {
  background-color: #f8f8f8;
}

.clear-button {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #999;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  width: 30px;
  border-radius: 50%;
  transition: all 0.2s ease;
  padding: 0;
  line-height: 1;
}

.clear-button:hover {
  background-color: #f0f0f0;
  color: #666;
}

.icon-container {
  position: absolute;
  right: -10px;
  top: -10px;
  background-color: #4CAF50;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  animation: popIn 0.3s forwards;
}

@keyframes popIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  80% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.carrier-info {
  margin: 24px 0;
  padding: 16px;
  border-radius: 12px;
  background-color: #f8f9fa;
}

.carrier {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.carrier span {
  font-weight: 700;
}

.carrier-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.carrier-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.carrier-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.carrier-card.active {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.carrier-card.faded {
  opacity: 0.6;
}

.carrier-header {
  padding: 12px;
  transition: all 0.3s ease;
}

.carrier-header h4 {
  margin: 0;
  font-weight: 600;
  font-size: 18px;
}

.prefixes {
  padding: 12px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.prefix-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.prefix-badge.highlighted {
  transform: scale(1.1);
  font-weight: 600;
}

.pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.2);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(0, 0, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
  }
}

.input.shakeLoop {
  animation: shakeLoop 0.5s ease-in-out infinite;
}

@keyframes shakeLoop {
  0% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-8px);
  }
  40% {
    transform: translateX(8px);
  }
  60% {
    transform: translateX(-8px);
  }
  80% {
    transform: translateX(8px);
  }
  100% {
    transform: translateX(0);
  }
}

.fade-pop-enter-active,
.fade-pop-leave-active {
  transition: all 0.3s ease;
}

.fade-pop-enter-from,
.fade-pop-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>