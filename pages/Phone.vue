<template>
  <div class="container" :style="{ backgroundColor: backgroundColor }">
    <PageSwitcher/>

    <div class="card">
      <h2>Check Your Carrier</h2>
      <div class="phone-card">
        <input
          v-model="phoneNumber"
          placeholder="Enter two digits"
          @input="formatAndDetectCarrier"
          class="input"
          :class="{ shakeLoop: invalidInput, matched: matchedPrefix }"
          :style="{ borderColor: inputBorderColor }"
          maxlength="2"
        />
      </div>

      <transition name="fade-pop">
        <div class="carrier-info" v-if="carrier !== 'Unknown Carrier'">
          <p class="carrier">
            Carrier: <span>{{ carrier }}</span>
          </p>
        </div>
      </transition>

      <div class="prefix-list">
        <h3>Valid Phone Prefixes</h3>
        <div class="carrier-list">
          <div
            v-for="(carrierData, name) in carriers"
            :key="name"
            class="carrier-card"
            :class="{ faded: carrier && carrier !== name }"
          >
            <h4 :style="{ color: carrierData.color }">{{ name }}</h4>
            <div class="prefixes">
              <span
                v-for="prefix in carrierData.prefixes"
                :key="prefix"
                class="prefix-badge"
                :style="{ backgroundColor: carrierData.color }"
                :class="{
                  pulse: matchedPrefix === prefix,
                  highlighted: matchedPrefix === prefix,
                }"
              >
                {{ prefix }}
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

const carriers = {
  Cellcard: {
    color: '#FF9800',
    prefixes: [
      '11',
      '12',
      '17',
      '61',
      '76',
      '77',
      '78',
      '79',
      '85',
      '89',
      '92',
      '95',
      '99',
    ],
  },
  Smart: {
    color: '#00A859',
    prefixes: [
      '10',
      '15',
      '16',
      '69',
      '70',
      '81',
      '86',
      '87',
      '93',
      '96',
      '98',
    ],
  },
  Metfone: { color: '#E60012', prefixes: ['88', '97'] },
};

const inputBorderColor = computed(() => {
  return carrier.value !== 'Unknown Carrier'
    ? carriers[carrier.value]?.color || '#ddd'
    : '#ddd';
});

const backgroundColor = computed(() => {
  return carrier.value !== 'Unknown Carrier'
    ? `${carriers[carrier.value]?.color}20`
    : '#f5f5f5';
});

watch(phoneNumber, (newValue) => {
  if (!/^[0-9]{1,2}$/.test(newValue)) {
    invalidInput.value = true;
    setTimeout(() => (invalidInput.value = false), 500);
  } else {
    invalidInput.value = false;
  }
});

const formatAndDetectCarrier = () => {
  if (!phoneNumber.value) return;
  const input = phoneNumber.value.padStart(2, '0').slice(0, 2);
  matchedPrefix.value = null;
  carrier.value = 'Unknown Carrier';

  for (const [key, carrierData] of Object.entries(carriers)) {
    if (carrierData.prefixes.includes(input)) {
      carrier.value = key;
      matchedPrefix.value = input;
      return;
    }
  }

  invalidInput.value = true;
  setTimeout(() => (invalidInput.value = false), 500);
};
</script>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #2193b0, #6dd5ed);
  transition: background-color 0.5s ease-in-out;
  font-family: 'Poppins', sans-serif;
}

.card {
  background: white;
  padding: 50px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  text-align: center;
  width: 100%;
  max-width: 500px;
  transition: transform 0.3s ease;
}

.card:hover {
  transform: translateY(-8px);
}

.title {
  font-size: 26px;
  color: #333;
  margin-bottom: 20px;
}

.phone-card {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.input {
  width: 100px;
  padding: 15px;
  font-size: 20px;
  border-radius: 10px;
  border: 2px solid #ccc;
  text-align: center;
  transition: all 0.3s ease;
}

.input:focus {
  border-color: #007bff;
  box-shadow: 0 0 10px rgba(0, 123, 255, 0.5);
}

.input.shakeLoop {
  animation: shakeLoop 0.5s ease-in-out;
}

.carrier-info {
  margin-top: 15px;
  font-size: 18px;
  font-weight: bold;
  color: #444;
}

.carrier span {
  color: #007bff;
}

.prefix-list {
  margin-top: 30px;
}

.sub-title {
  font-size: 20px;
  color: #444;
  margin-bottom: 15px;
}

.carrier-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
}

.carrier-card {
  background: white;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.3s ease;
}

.carrier-card:hover {
  transform: scale(1.05);
}

.prefix-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  color: white;
  margin: 5px;
  transition: all 0.3s ease;
}

.pulse {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
}

@keyframes shakeLoop {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  50% {
    transform: translateX(5px);
  }
  75% {
    transform: translateX(-5px);
  }
}
</style>
