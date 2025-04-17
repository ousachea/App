<template>
  <div class="converter-container">
    <PageSwitcher/>
    <div class="converter-card">
      <h2 class="converter-title">Fuel Efficiency Converter</h2>
      <p class="converter-description">Convert your vehicle's MPG to liters per 100 kilometers</p>
      
      <div class="input-container">
        <label for="mpg-input" class="input-label">Miles Per Gallon</label>
        <div class="input-field">
          <input
            id="mpg-input"
            type="number"
            v-model="mpg"
            min="1"
            max="100000"
            @input="validateInput"
            placeholder="Enter MPG"
            class="mpg-input"
          />
          <span class="input-unit">MPG</span>
        </div>
      </div>

      <div class="divider"></div>
  
      <div class="result-container">
        <div class="efficiency-badge" :class="efficiencyClass">
          {{ efficiencyText }}
        </div>
        <div class="result-value">
          <span class="value">{{ mpgConvert() }}</span>
          <span class="unit">L/100km</span>
        </div>
        <p class="info-text">
          <span class="info-icon">ℹ️</span>
          Lower L/100km values indicate better fuel efficiency
        </p>
      </div>
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
      mpg: 25,
    };
  },
  computed: {
    efficiencyText() {
      const value = this.mpgConvert();
      if (value === "-") return "Enter MPG";
      if (value <= 5) return "Excellent";
      if (value <= 7) return "Great";
      if (value <= 9) return "Good";
      return "Poor";
    },
    efficiencyClass() {
      const value = this.mpgConvert();
      if (value === "-") return "neutral";
      if (value <= 5) return "excellent";
      if (value <= 7) return "great";
      if (value <= 9) return "good";
      return "poor";
    }
  },
  methods: {
    mpgConvert() {
      let mpgValue = parseFloat(this.mpg);
      if (isNaN(mpgValue) || mpgValue < 1 || mpgValue > 100000) return "-";
      return parseFloat(235.215 / mpgValue).toFixed(1);
    },
    validateInput(event) {
      let value = event.target.value.replace(/[^0-9]/g, '');
      value = value ? Math.min(Math.max(parseInt(value, 10), 1), 100000) : "";
      this.mpg = value;
    },
  },
};
</script>
  
<style scoped>
.converter-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.converter-card {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  padding: 28px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.converter-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.12);
}

.converter-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  text-align: center;
}

.converter-description {
  font-size: 15px;
  color: #666;
  text-align: center;
  margin: 0 0 32px 0;
}

.input-container {
  margin-bottom: 28px;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #555;
  margin-bottom: 8px;
}

.input-field {
  position: relative;
  display: flex;
  align-items: center;
}

.mpg-input {
  width: 100%;
  font-size: 18px;
  padding: 14px 60px 14px 16px;
  border: 2px solid #d0d0d0;
  border-radius: 12px;
  transition: all 0.2s ease;
  background-color: #f9f9f9;
  color: #333;
  font-weight: 500;
  -webkit-appearance: none;
}

.mpg-input:focus {
  border-color: #007aff;
  background-color: white;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.25);
  outline: none;
  color: #000;
}

.input-unit {
  position: absolute;
  right: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #888;
  pointer-events: none;
}

.divider {
  height: 1px;
  background: linear-gradient(to right, transparent, #e0e0e0, transparent);
  margin: 24px 0;
}

.result-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.efficiency-badge {
  font-size: 14px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 20px;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.efficiency-badge.excellent {
  background-color: #d4edda;
  color: #155724;
}

.efficiency-badge.great {
  background-color: #d1ecf1;
  color: #0c5460;
}

.efficiency-badge.good {
  background-color: #fff3cd;
  color: #856404;
}

.efficiency-badge.poor {
  background-color: #f8d7da;
  color: #721c24;
}

.efficiency-badge.neutral {
  background-color: #e9ecef;
  color: #495057;
}

.result-value {
  display: flex;
  align-items: baseline;
  margin-bottom: 16px;
  animation: gentle-pulse 2s infinite alternate;
}

.result-value .value {
  font-size: 42px;
  font-weight: 700;
  color: #007aff;
}

.result-value .unit {
  font-size: 16px;
  color: #888;
  margin-left: 8px;
}

.info-text {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #777;
}

.info-icon {
  margin-right: 6px;
  font-size: 14px;
}

@keyframes gentle-pulse {
  0% { transform: scale(1); }
  100% { transform: scale(1.03); }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .converter-card {
    background: #1c1c1e;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }
  
  .converter-title {
    color: #f2f2f7;
  }
  
  .converter-description {
    color: #98989d;
  }
  
  .input-label {
    color: #98989d;
  }
  
  .mpg-input {
    background-color: #2c2c2e;
    border-color: #4a4a4c;
    color: #f2f2f7;
  }
  
  .mpg-input:focus {
    border-color: #0a84ff;
    background-color: #3a3a3c;
    box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.35);
    color: #ffffff;
  }
  
  .input-unit {
    color: #98989d;
  }
  
  .divider {
    background: linear-gradient(to right, transparent, #3a3a3c, transparent);
  }
  
  .result-value .value {
    color: #0a84ff;
  }
  
  .result-value .unit {
    color: #98989d;
  }
  
  .info-text {
    color: #98989d;
  }
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .converter-card {
    padding: 20px;
  }
  
  .converter-title {
    font-size: 22px;
  }
  
  .converter-description {
    font-size: 14px;
    margin-bottom: 24px;
  }
  
  .mpg-input {
    font-size: 16px;
    padding: 12px 50px 12px 14px;
  }
  
  .result-value .value {
    font-size: 36px;
  }
}
</style>