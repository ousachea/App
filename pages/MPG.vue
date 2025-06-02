<template>
  <div class="converter-container">
    <PageSwitcher/>
    <div class="converter-card">
      <h2 class="converter-title">Fuel Efficiency Converter</h2>
      <p class="converter-description">Convert between MPG and L/100km with smart insights</p>
      
      <!-- Conversion Mode Toggle -->
      <div class="mode-toggle">
        <button 
          @click="conversionMode = 'mpg-to-l100km'" 
          :class="{ active: conversionMode === 'mpg-to-l100km' }"
          class="toggle-btn"
        >
          MPG → L/100km
        </button>
        <button 
          @click="conversionMode = 'l100km-to-mpg'" 
          :class="{ active: conversionMode === 'l100km-to-mpg' }"
          class="toggle-btn"
        >
          L/100km → MPG
        </button>
      </div>

      <!-- Vehicle Type Presets -->
      <div class="presets-container">
        <p class="presets-label">Quick Select:</p>
        <div class="preset-buttons">
          <button 
            v-for="preset in vehiclePresets" 
            :key="preset.name"
            @click="applyPreset(preset)"
            class="preset-btn"
            :title="preset.description"
          >
            {{ preset.icon }} {{ preset.name }}
          </button>
        </div>
      </div>
      
      <div class="input-container">
        <label :for="inputId" class="input-label">
          {{ conversionMode === 'mpg-to-l100km' ? 'Miles Per Gallon' : 'Liters per 100 kilometers' }}
        </label>
        <div class="input-field">
          <input
            :id="inputId"
            type="number"
            v-model="inputValue"
            :min="inputLimits.min"
            :max="inputLimits.max"
            :step="inputStep"
            @input="debouncedValidateInput"
            :placeholder="inputPlaceholder"
            class="efficiency-input"
            :class="{ 'warning': showWarning, 'error': showError }"
            :aria-describedby="inputHelpId"
          />
          <span class="input-unit">{{ inputUnit }}</span>
        </div>
        
        <!-- Input feedback -->
        <div v-if="showWarning || showError" class="input-feedback">
          <span class="feedback-icon">{{ showError ? '⚠️' : '💡' }}</span>
          <span class="feedback-text">{{ feedbackMessage }}</span>
        </div>
        
        <!-- Help text -->
        <p :id="inputHelpId" class="input-help">
          {{ inputHelpText }}
        </p>
      </div>

      <div class="divider"></div>
  
      <div class="result-container">
        <div 
          class="efficiency-badge" 
          :class="efficiencyClass"
          role="status"
          :aria-label="`Efficiency rating: ${efficiencyText}`"
        >
          {{ efficiencyText }}
        </div>
        
        <div class="result-value" :class="{ 'calculating': isCalculating }">
          <span class="value" :aria-label="`Result: ${displayResult}`">{{ displayResult }}</span>
          <span class="unit">{{ outputUnit }}</span>
        </div>
        
        <!-- Additional conversions -->
        <div v-if="showAdditionalConversions" class="additional-conversions">
          <div class="conversion-item">
            <span class="conversion-label">km/L:</span>
            <span class="conversion-value">{{ kmPerLiter }}</span>
          </div>
        </div>
        
        <!-- Vehicle comparison -->
        <div v-if="showComparison" class="comparison-section">
          <h4 class="comparison-title">Vehicle Comparison</h4>
          <div class="comparison-item">
            <span class="comparison-icon">🚗</span>
            <span class="comparison-text">{{ comparisonText }}</span>
          </div>
        </div>
        
        <div class="info-section">
          <p class="info-text">
            <span class="info-icon">ℹ️</span>
            {{ infoText }}
          </p>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="action-buttons">
        <button @click="shareResult" class="action-btn share-btn" :disabled="!hasValidResult">
          📤 Share
        </button>
        <button @click="saveToHistory" class="action-btn save-btn" :disabled="!hasValidResult">
          💾 Save
        </button>
        <button @click="clearInput" class="action-btn clear-btn">
          🗑️ Clear
        </button>
      </div>

      <!-- History section -->
      <div v-if="calculationHistory.length > 0" class="history-section">
        <h4 class="history-title">Recent Calculations</h4>
        <div class="history-list">
          <div 
            v-for="(item, index) in calculationHistory.slice(0, 3)" 
            :key="index"
            class="history-item"
            @click="loadFromHistory(item)"
          >
            <span class="history-input">{{ item.input }} {{ item.inputUnit }}</span>
            <span class="history-arrow">→</span>
            <span class="history-result">{{ item.result }} {{ item.outputUnit }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script>
import PageSwitcher from '../components/PageSwitcher.vue';

// Constants
const CONVERSION_FACTOR = 235.215;
const MPG_LIMITS = { min: 1, max: 150 };
const L100KM_LIMITS = { min: 1.5, max: 50 };

// Vehicle presets with realistic efficiency ranges
const VEHICLE_PRESETS = [
  { name: 'Compact', icon: '🚗', mpg: 32, l100km: 7.4, description: 'Small efficient car' },
  { name: 'Sedan', icon: '🚙', mpg: 28, l100km: 8.4, description: 'Mid-size sedan' },
  { name: 'SUV', icon: '🚐', mpg: 22, l100km: 10.7, description: 'Sport utility vehicle' },
  { name: 'Sport Car', icon: '🏎️', mpg: 20, l100km: 11.8, description: 'High-performance sports car' },
  { name: 'Truck', icon: '🛻', mpg: 18, l100km: 13.1, description: 'Pickup truck' },
  { name: 'Hybrid', icon: '🔋', mpg: 45, l100km: 5.2, description: 'Hybrid vehicle' },
];

export default {
  components: {
    PageSwitcher
  },
  data() {
    return {
      conversionMode: 'mpg-to-l100km',
      inputValue: 25,
      isCalculating: false,
      calculationHistory: [],
      debounceTimer: null,
    };
  },
  computed: {
    vehiclePresets() {
      return VEHICLE_PRESETS;
    },
    
    inputId() {
      return `${this.conversionMode}-input`;
    },
    
    inputHelpId() {
      return `${this.conversionMode}-help`;
    },
    
    inputLimits() {
      return this.conversionMode === 'mpg-to-l100km' ? MPG_LIMITS : L100KM_LIMITS;
    },
    
    inputStep() {
      return this.conversionMode === 'mpg-to-l100km' ? '1' : '0.1';
    },
    
    inputUnit() {
      return this.conversionMode === 'mpg-to-l100km' ? 'MPG' : 'L/100km';
    },
    
    outputUnit() {
      return this.conversionMode === 'mpg-to-l100km' ? 'L/100km' : 'MPG';
    },
    
    inputPlaceholder() {
      return this.conversionMode === 'mpg-to-l100km' ? 'Enter MPG (e.g., 25)' : 'Enter L/100km (e.g., 8.5)';
    },
    
    inputHelpText() {
      const range = this.conversionMode === 'mpg-to-l100km' 
        ? 'Typical range: 15-50 MPG' 
        : 'Typical range: 4-15 L/100km';
      return `${range} • Lower L/100km = better efficiency`;
    },
    
    infoText() {
      return this.conversionMode === 'mpg-to-l100km'
        ? 'Lower L/100km values indicate better fuel efficiency'
        : 'Higher MPG values indicate better fuel efficiency';
    },
    
    showWarning() {
      const value = parseFloat(this.inputValue);
      if (isNaN(value)) return false;
      
      if (this.conversionMode === 'mpg-to-l100km') {
        return value > 60 || value < 10;
      } else {
        return value > 20 || value < 3;
      }
    },
    
    showError() {
      const value = parseFloat(this.inputValue);
      if (isNaN(value)) return true;
      return value < this.inputLimits.min || value > this.inputLimits.max;
    },
    
    feedbackMessage() {
      if (this.showError) {
        return `Value must be between ${this.inputLimits.min} and ${this.inputLimits.max}`;
      }
      if (this.showWarning) {
        return this.conversionMode === 'mpg-to-l100km' 
          ? 'This is unusually high/low for typical vehicles'
          : 'This represents unusually high/low fuel consumption';
      }
      return '';
    },
    
    hasValidResult() {
      const value = parseFloat(this.inputValue);
      return !isNaN(value) && value >= this.inputLimits.min && value <= this.inputLimits.max;
    },
    
    displayResult() {
      if (!this.hasValidResult) return "-";
      
      const inputVal = parseFloat(this.inputValue);
      let result;
      
      if (this.conversionMode === 'mpg-to-l100km') {
        result = CONVERSION_FACTOR / inputVal;
      } else {
        result = CONVERSION_FACTOR / inputVal;
      }
      
      return result < 10 ? result.toFixed(1) : result.toFixed(0);
    },
    
    kmPerLiter() {
      if (!this.hasValidResult) return "-";
      
      const inputVal = parseFloat(this.inputValue);
      let l100km;
      
      if (this.conversionMode === 'mpg-to-l100km') {
        l100km = CONVERSION_FACTOR / inputVal;
      } else {
        l100km = inputVal;
      }
      
      const kmL = 100 / l100km;
      return kmL.toFixed(1);
    },
    
    showAdditionalConversions() {
      return this.hasValidResult;
    },
    
    showComparison() {
      return this.hasValidResult;
    },
    
    comparisonText() {
      if (!this.hasValidResult) return "";
      
      const inputVal = parseFloat(this.inputValue);
      let l100km = this.conversionMode === 'mpg-to-l100km' ? CONVERSION_FACTOR / inputVal : inputVal;
      
      if (l100km <= 4) return "Excellent - Better than most hybrids";
      if (l100km <= 6) return "Great - Hybrid vehicle range";
      if (l100km <= 8) return "Good - Compact car range";
      if (l100km <= 12) return "Average - Mid-size vehicle range";
      return "High consumption - Large vehicle/truck range";
    },
    
    efficiencyText() {
      if (!this.hasValidResult) return "Enter value";
      
      const inputVal = parseFloat(this.inputValue);
      let l100km = this.conversionMode === 'mpg-to-l100km' ? CONVERSION_FACTOR / inputVal : inputVal;
      
      if (l100km <= 4) return "Excellent";
      if (l100km <= 6) return "Great";
      if (l100km <= 8) return "Good";
      if (l100km <= 12) return "Average";
      return "Poor";
    },
    
    efficiencyClass() {
      if (!this.hasValidResult) return "neutral";
      
      const inputVal = parseFloat(this.inputValue);
      let l100km = this.conversionMode === 'mpg-to-l100km' ? CONVERSION_FACTOR / inputVal : inputVal;
      
      if (l100km <= 4) return "excellent";
      if (l100km <= 6) return "great";
      if (l100km <= 8) return "good";
      if (l100km <= 12) return "average";
      return "poor";
    }
  },
  methods: {
    applyPreset(preset) {
      if (this.conversionMode === 'mpg-to-l100km') {
        this.inputValue = preset.mpg;
      } else {
        this.inputValue = preset.l100km;
      }
      this.validateInput();
    },
    
    debouncedValidateInput() {
      this.isCalculating = true;
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.validateInput();
        this.isCalculating = false;
      }, 300);
    },
    
    validateInput() {
      const value = parseFloat(this.inputValue);
      
      if (isNaN(value)) {
        return;
      }
      
      // Clamp to limits
      if (value < this.inputLimits.min) {
        this.inputValue = this.inputLimits.min;
      } else if (value > this.inputLimits.max) {
        this.inputValue = this.inputLimits.max;
      }
    },
    
    shareResult() {
      if (!this.hasValidResult) return;
      
      const shareText = `🚗 Fuel Efficiency: ${this.inputValue} ${this.inputUnit} = ${this.displayResult} ${this.outputUnit}`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Fuel Efficiency Conversion',
          text: shareText,
          url: window.location.href
        });
      } else {
        navigator.clipboard.writeText(shareText).then(() => {
          alert('Result copied to clipboard!');
        });
      }
    },
    
    saveToHistory() {
      if (!this.hasValidResult) return;
      
      const historyItem = {
        input: this.inputValue,
        inputUnit: this.inputUnit,
        result: this.displayResult,
        outputUnit: this.outputUnit,
        mode: this.conversionMode,
        timestamp: new Date().toLocaleTimeString()
      };
      
      // Remove duplicates and limit to 10 items
      this.calculationHistory = this.calculationHistory.filter(item => 
        !(item.input === historyItem.input && item.mode === historyItem.mode)
      );
      this.calculationHistory.unshift(historyItem);
      this.calculationHistory = this.calculationHistory.slice(0, 10);
      
      // Save to localStorage
      try {
        localStorage.setItem('fuelConverterHistory', JSON.stringify(this.calculationHistory));
      } catch (e) {
        console.warn('Could not save to localStorage:', e);
      }
    },
    
    loadFromHistory(item) {
      this.conversionMode = item.mode;
      this.inputValue = item.input;
    },
    
    clearInput() {
      this.inputValue = '';
    },
    
    loadHistory() {
      try {
        const saved = localStorage.getItem('fuelConverterHistory');
        if (saved) {
          this.calculationHistory = JSON.parse(saved);
        }
      } catch (e) {
        console.warn('Could not load from localStorage:', e);
      }
    }
  },
  
  mounted() {
    this.loadHistory();
  },
  
  beforeUnmount() {
    clearTimeout(this.debounceTimer);
  }
};
</script>
  
<style scoped>
.converter-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh; /* Dynamic viewport height for mobile */
  width: 100vw;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  overflow-x: hidden;
}

.converter-card {
  flex: 1;
  width: 100%;
  max-width: none;
  background: white;
  border-radius: 0;
  box-shadow: none;
  padding: 20px;
  margin: 0;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  transition: none;
}

.converter-card:hover {
  transform: none;
  box-shadow: none;
}

.converter-title {
  font-size: 32px;
  font-weight: 800;
  color: #1a1a1a;
  margin: 20px 0 8px 0;
  text-align: center;
}

.converter-description {
  font-size: 18px;
  color: #666;
  text-align: center;
  margin: 0 0 32px 0;
}

/* Mode Toggle */
.mode-toggle {
  display: flex;
  background: #f1f1f1;
  border-radius: 16px;
  padding: 6px;
  margin-bottom: 32px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.toggle-btn {
  flex: 1;
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  background: transparent;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn.active {
  background: white;
  color: #007aff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Presets */
.presets-container {
  margin-bottom: 32px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.presets-label {
  font-size: 16px;
  font-weight: 600;
  color: #555;
  margin: 0 0 16px 0;
  text-align: center;
}

.preset-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
}

.preset-btn {
  padding: 16px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.preset-btn:hover {
  border-color: #007aff;
  background: #f0f8ff;
}

/* Input */
.input-container {
  margin-bottom: 40px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.input-label {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #555;
  margin-bottom: 12px;
  text-align: center;
}

.input-field {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.efficiency-input {
  width: 100%;
  font-size: 24px;
  padding: 20px 80px 20px 20px;
  border: 3px solid #d0d0d0;
  border-radius: 16px;
  transition: all 0.2s ease;
  background-color: #f9f9f9;
  color: #333;
  font-weight: 600;
  text-align: center;
}

.efficiency-input:focus {
  border-color: #007aff;
  background-color: white;
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.25);
  outline: none;
  color: #000;
}

.efficiency-input.warning {
  border-color: #ff9500;
  background-color: #fff8f0;
}

.efficiency-input.error {
  border-color: #ff3b30;
  background-color: #fff5f5;
}

.efficiency-input.calculating {
  opacity: 0.7;
}

.input-unit {
  position: absolute;
  right: 20px;
  font-size: 18px;
  font-weight: 600;
  color: #888;
  pointer-events: none;
}

.input-feedback {
  display: flex;
  align-items: center;
  margin-top: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 13px;
}

.feedback-icon {
  margin-right: 6px;
}

.feedback-text {
  color: #666;
}

.input-help {
  font-size: 12px;
  color: #888;
  margin: 8px 0 0 0;
}

.divider {
  height: 1px;
  background: linear-gradient(to right, transparent, #e0e0e0, transparent);
  margin: 24px 0;
}

/* Results */
.result-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
  justify-content: center;
  max-width: 600px;
  margin: 0 auto;
}

.efficiency-badge {
  font-size: 18px;
  font-weight: 700;
  padding: 12px 24px;
  border-radius: 30px;
  margin-bottom: 24px;
  text-transform: uppercase;
  letter-spacing: 1px;
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

.efficiency-badge.average {
  background-color: #e2e3e5;
  color: #495057;
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
  margin-bottom: 24px;
  transition: all 0.3s ease;
  justify-content: center;
}

.result-value.calculating {
  opacity: 0.5;
}

.result-value .value {
  font-size: 72px;
  font-weight: 800;
  color: #007aff;
  line-height: 1;
}

.result-value .unit {
  font-size: 24px;
  color: #888;
  margin-left: 12px;
  font-weight: 600;
}

/* Additional conversions */
.additional-conversions {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: #f8f9fa;
  border-radius: 12px;
  justify-content: center;
}

.conversion-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
}

.conversion-label {
  color: #666;
  font-weight: 500;
}

.conversion-value {
  color: #333;
  font-weight: 700;
}

/* Comparison */
.comparison-section {
  margin-bottom: 20px;
  padding: 16px 20px;
  background: #f0f8ff;
  border-radius: 12px;
  border-left: 6px solid #007aff;
}

.comparison-title {
  font-size: 16px;
  font-weight: 600;
  color: #007aff;
  margin: 0 0 10px 0;
}

.comparison-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.comparison-icon {
  font-size: 20px;
}

.comparison-text {
  font-size: 16px;
  color: #333;
}

.info-section {
  margin-bottom: 32px;
}

.info-text {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: #777;
  margin: 0;
}

.info-icon {
  margin-right: 8px;
  font-size: 16px;
}

/* Action buttons */
.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 32px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.action-btn {
  padding: 14px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  border-color: #007aff;
  background: #f0f8ff;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.share-btn:hover:not(:disabled) {
  border-color: #34c759;
  background: #f0fff4;
}

.save-btn:hover:not(:disabled) {
  border-color: #ff9500;
  background: #fff8f0;
}

.clear-btn:hover:not(:disabled) {
  border-color: #ff3b30;
  background: #fff5f5;
}

/* History */
.history-section {
  border-top: 1px solid #e0e0e0;
  padding-top: 20px;
}

.history-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 13px;
}

.history-item:hover {
  background: #e9ecef;
}

.history-arrow {
  color: #888;
  margin: 0 8px;
}

.history-result {
  font-weight: 600;
  color: #007aff;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .converter-container {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  }
  
  .converter-card {
    background: #000000;
    color: #ffffff;
  }
  
  .converter-title {
    color: #f2f2f7;
  }
  
  .converter-description {
    color: #98989d;
  }
  
  .mode-toggle {
    background: #1c1c1e;
  }
  
  .toggle-btn {
    color: #98989d;
  }
  
  .toggle-btn.active {
    background: #2c2c2e;
    color: #0a84ff;
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
  }
  
  .preset-btn {
    background: #1c1c1e;
    border-color: #4a4a4c;
    color: #f2f2f7;
  }
  
  .preset-btn:hover {
    border-color: #0a84ff;
    background: #1a2332;
  }
  
  .input-label {
    color: #98989d;
  }
  
  .efficiency-input {
    background-color: #1c1c1e;
    border-color: #4a4a4c;
    color: #f2f2f7;
  }
  
  .efficiency-input:focus {
    border-color: #0a84ff;
    background-color: #2c2c2e;
    box-shadow: 0 0 0 4px rgba(10, 132, 255, 0.35);
    color: #ffffff;
  }
  
  .input-unit {
    color: #98989d;
  }
  
  .input-feedback {
    background: #1c1c1e;
  }
  
  .feedback-text {
    color: #98989d;
  }
  
  .input-help {
    color: #98989d;
  }
  
  .divider {
    background: linear-gradient(to right, transparent, #4a4a4c, transparent);
  }
  
  .result-value .value {
    color: #0a84ff;
  }
  
  .result-value .unit {
    color: #98989d;
  }
  
  .additional-conversions {
    background: #1c1c1e;
  }
  
  .conversion-label {
    color: #98989d;
  }
  
  .conversion-value {
    color: #f2f2f7;
  }
  
  .comparison-section {
    background: #0d1421;
    border-left-color: #0a84ff;
  }
  
  .comparison-title {
    color: #0a84ff;
  }
  
  .comparison-text {
    color: #f2f2f7;
  }
  
  .info-text {
    color: #98989d;
  }
  
  .action-btn {
    background: #1c1c1e;
    border-color: #4a4a4c;
    color: #f2f2f7;
  }
  
  .action-btn:hover:not(:disabled) {
    border-color: #0a84ff;
    background: #1a2332;
  }
  
  .history-section {
    border-top-color: #4a4a4c;
  }
  
  .history-title {
    color: #f2f2f7;
  }
  
  .history-item {
    background: #1c1c1e;
    color: #f2f2f7;
  }
  
  .history-item:hover {
    background: #2c2c2e;
  }
  
  .history-arrow {
    color: #98989d;
  }
  
  .history-result {
    color: #0a84ff;
  }
}


/* Responsive adjustments */
@media (max-width: 768px) {
  .converter-card {
    padding: 16px;
  }
  
  .converter-title {
    font-size: 28px;
    margin: 16px 0 8px 0;
  }
  
  .converter-description {
    font-size: 16px;
    margin-bottom: 24px;
  }
  
  .mode-toggle {
    margin-bottom: 24px;
    padding: 4px;
  }
  
  .toggle-btn {
    padding: 12px 16px;
    font-size: 14px;
  }
  
  .presets-container {
    margin-bottom: 24px;
  }
  
  .presets-label {
    font-size: 14px;
    margin-bottom: 12px;
  }
  
  .preset-buttons {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  
  .preset-btn {
    padding: 12px 8px;
    font-size: 12px;
  }
  
  .input-container {
    margin-bottom: 32px;
  }
  
  .input-label {
    font-size: 16px;
    margin-bottom: 10px;
  }
  
  .efficiency-input {
    font-size: 20px;
    padding: 16px 60px 16px 16px;
  }
  
  .input-unit {
    right: 16px;
    font-size: 16px;
  }
  
  .result-value .value {
    font-size: 56px;
  }
  
  .result-value .unit {
    font-size: 20px;
    margin-left: 8px;
  }
  
  .efficiency-badge {
    font-size: 16px;
    padding: 10px 20px;
    margin-bottom: 20px;
  }
  
  .action-buttons {
    grid-template-columns: 1fr;
    gap: 10px;
    margin-bottom: 24px;
  }
  
  .additional-conversions {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
  
  .conversion-item {
    font-size: 14px;
    justify-content: center;
  }
  
  .comparison-section {
    padding: 12px 16px;
    margin-bottom: 16px;
  }
  
  .comparison-title {
    font-size: 14px;
  }
  
  .comparison-text {
    font-size: 14px;
  }
  
  .info-text {
    font-size: 14px;
  }
  
  .history-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding: 12px;
  }
  
  .history-arrow {
    display: none;
  }
}

@media (min-width: 769px) {
  .converter-card {
    padding: 40px;
  }
  
  .result-container {
    min-height: 40vh;
  }
  
  .preset-buttons {
    grid-template-columns: repeat(6, 1fr);
  }
  
  .action-buttons {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Animations */
@keyframes gentle-pulse {
  0% { transform: scale(1); }
  100% { transform: scale(1.02); }
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-value {
  animation: gentle-pulse 2s infinite alternate;
}

.efficiency-badge {
  animation: slide-in 0.3s ease-out;
}

.comparison-section,
.additional-conversions {
  animation: slide-in 0.4s ease-out;
}

.history-item {
  animation: slide-in 0.2s ease-out;
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}

/* Focus styles for better accessibility */
.toggle-btn:focus,
.preset-btn:focus,
.action-btn:focus {
  outline: 2px solid #007aff;
  outline-offset: 2px;
}

.efficiency-input:focus {
  outline: none; /* Already has custom focus styling */
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .converter-card {
    border: 2px solid;
  }
  
  .efficiency-input {
    border-width: 3px;
  }
  
  .toggle-btn,
  .preset-btn,
  .action-btn {
    border-width: 3px;
  }
}

/* Print styles */
@media print {
  .converter-container {
    padding: 0;
  }
  
  .converter-card {
    box-shadow: none;
    border: 1px solid #ccc;
  }
  
  .action-buttons,
  .history-section {
    display: none;
  }
}</style>