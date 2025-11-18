<template>
  <div class="container">
    <PageSwitcher/>

    <div class="card">
      <h1 class="title">Cambodia Carrier Checker</h1>
      
      <div class="input-section">
        <input
          v-model="phoneNumber"
          placeholder="Enter prefix"
          @input="formatAndDetectCarrier"
          class="input"
          :class="{ error: invalidInput }"
          maxlength="3"
          type="text"
          inputmode="numeric"
        />
        <button 
          v-if="phoneNumber" 
          @click="clearInput" 
          class="clear-btn"
        >
          Clear
        </button>
      </div>

      <transition name="fade">
        <div v-if="carrier !== 'Unknown Carrier'" class="result">
          <p class="result-text">{{ carrier }}</p>
        </div>
      </transition>

      <div class="carriers">
        <div v-for="(carrierData, name) in carriers" :key="name" class="carrier">
          <h3 class="carrier-name">{{ name }}</h3>
          <div class="prefixes">
            <button
              v-for="prefix in carrierData.prefixes"
              :key="prefix"
              @click="selectPrefix(prefix)"
              class="prefix-btn"
              :class="{ active: matchedPrefix === prefix }"
            >
              0{{ prefix }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import PageSwitcher from '../components/PageSwitcher.vue';
import { ref } from 'vue';

const phoneNumber = ref('');
const matchedPrefix = ref(null);
const invalidInput = ref(false);
const carrier = ref('Unknown Carrier');

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

Object.values(carriers).forEach(carrierData => {
  carrierData.prefixes.forEach(prefix => validPrefixes.add(prefix));
});

const clearInput = () => {
  phoneNumber.value = '';
  carrier.value = 'Unknown Carrier';
  matchedPrefix.value = null;
  invalidInput.value = false;
};

const selectPrefix = (prefix) => {
  phoneNumber.value = prefix;
  formatAndDetectCarrier();
};

const formatAndDetectCarrier = () => {
  if (!phoneNumber.value) {
    carrier.value = 'Unknown Carrier';
    matchedPrefix.value = null;
    invalidInput.value = false;
    return;
  }
  
  // Only use first 2 digits for carrier detection
  const input = phoneNumber.value.slice(0, 2).padStart(2, '0');
  
  matchedPrefix.value = null;
  carrier.value = 'Unknown Carrier';
  invalidInput.value = false;

  if (phoneNumber.value.length === 2 && !validPrefixes.has(input)) {
    invalidInput.value = true;
    return;
  }

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
* {
  box-sizing: border-box;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #fafafa;
}

.card {
  width: 100%;
  max-width: 500px;
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 32px 0;
  color: #333;
  text-align: center;
}

.input-section {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
  align-items: flex-end;
}

.input {
  flex: 1;
  font-size: 18px;
  font-weight: 500;
  border: 1px solid #ddd;
  outline: none;
  padding: 10px 12px;
  background: transparent;
  color: #333;
  border-radius: 6px;
  transition: border-color 0.2s;
}

.input:focus {
  border-color: #333;
}

.input::placeholder {
  color: #ccc;
}

.input.error {
  color: #e74c3c;
  border-color: #e74c3c;
}

.clear-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.clear-btn:hover {
  border-color: #333;
  color: #333;
}

.result {
  text-align: center;
  margin-bottom: 32px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  animation: fadeIn 0.3s ease;
}

.result-text {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.carriers {
  display: grid;
  gap: 24px;
}

.carrier {
  padding-bottom: 24px;
  border-bottom: 1px solid #eee;
}

.carrier:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.carrier-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.prefixes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.prefix-btn {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.prefix-btn:hover {
  border-color: #333;
  color: #333;
}

.prefix-btn.active {
  background: #333;
  color: white;
  border-color: #333;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 640px) {
  .card {
    padding: 32px 20px;
  }

  .title {
    font-size: 20px;
    margin-bottom: 28px;
  }

  .input-section {
    margin-bottom: 28px;
  }

  .input {
    font-size: 18px;
  }

  .carriers {
    gap: 20px;
  }

  .carrier {
    padding-bottom: 20px;
  }

  .prefix-btn {
    font-size: 12px;
    padding: 7px 11px;
  }
}
</style>