// index.vue - Single Page Application
<template>
  <div class="page-wrapper">
    <PageSwitcher/>
    <div :class="['gold-wrapper', darkMode ? 'dark-mode' : 'light-mode']">
      
      <div class="header-section">
        <h1 class="gold-glow main-title">{{ translations[currentLanguage].goldPriceTracker }}</h1>
        <div class="toggle-container">
          <button @click="toggleLanguage" class="toggle-button language-toggle">
            {{ currentLanguage === 'en' ? '🇰🇭 ខ្មែរ' : '🇺🇸 English' }}
          </button>
          <button @click="toggleDarkMode" class="toggle-button">
            <span v-if="darkMode">☀️ {{ translations[currentLanguage].light }}</span>
            <span v-else>🌙 {{ translations[currentLanguage].dark }}</span>
          </button>
        </div>
      </div>
      
      <!-- Main Navigation Tabs -->
      <div class="main-tabs">
        <button 
          v-for="tab in mainTabs" 
          :key="tab.id"
          @click="activeMainTab = tab.id"
          :class="{ 'active': activeMainTab === tab.id }"
          class="main-tab-button">
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-text">{{ translations[currentLanguage][tab.labelKey] }}</span>
        </button>
      </div>
      
      <!-- Currency Selector - Available across all tabs -->
      <CurrencySwitcher 
        v-model="selectedCurrency"
        :translations="translations"
        :currentLanguage="currentLanguage"
        @change="onCurrencyChange" 
      />
      
      <!-- PRICES TAB -->
      <div v-if="activeMainTab === 'prices'" class="tab-content">
        <!-- Source Toggle -->
        <div class="source-toggle">
          <button @click="toggleSource" class="toggle-button small-toggle">
            {{ useApi ? '🔗 ' + translations[currentLanguage].apiData : '✍️ ' + translations[currentLanguage].manual }}
          </button>
        </div>
        
        <!-- Price Chart -->
        <PriceChart 
          :priceData="priceHistory"
          :darkMode="darkMode"
          :translations="translations"
          :currentLanguage="currentLanguage"
          class="section-card"
        />
        
        <!-- Manual Input -->
        <div v-if="!useApi" class="manual-input section-card">
          <h2 class="section-title">{{ translations[currentLanguage].manualPriceInput }}</h2>
          <label for="goldPrice">{{ translations[currentLanguage].enterGoldPricePerOunce }}</label>
          <input
            id="goldPrice"
            type="number"
            v-model.number="manualGoldPrice"
            class="big-input"
            @input="updateFromInput"
          />
        </div>
        
        <!-- Live Prices -->
        <div class="prices-section section-card">
          <h2 class="section-title">{{ translations[currentLanguage].currentPrices }}</h2>
          <div class="prices-card">
            <div class="price-item">
              <div class="price-icon">💰</div>
              <div class="price-info">
                <div class="price-label">{{ translations[currentLanguage].ounce }}</div>
                <div class="price-value">{{ goldPrice.ounce || translations[currentLanguage].loading }}</div>
              </div>
            </div>
            
            <div class="price-item">
              <div class="price-icon">🔶</div>
              <div class="price-info">
                <div class="price-label">{{ translations[currentLanguage].damlung }}</div>
                <div class="price-value">{{ goldPrice.damlung || translations[currentLanguage].loading }}</div>
              </div>
            </div>
            
            <div class="price-item">
              <div class="price-icon">🟡</div>
              <div class="price-info">
                <div class="price-label">{{ translations[currentLanguage].chi }}</div>
                <div class="price-value">{{ goldPrice.chi || translations[currentLanguage].loading }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Price History -->
        <div class="history-section section-card">
          <h2 class="section-title">{{ translations[currentLanguage].recentPriceHistory }}</h2>
          <div class="table-container">
            <table class="gold-table">
              <thead>
                <tr>
                  <th>{{ translations[currentLanguage].ounce }} ({{ currencySymbol }})</th>
                  <th>{{ translations[currentLanguage].damlung }} ({{ currencySymbol }})</th>
                  <th>{{ translations[currentLanguage].chi }} ({{ currencySymbol }})</th>
                  <th>{{ translations[currentLanguage].timestamp }}</th>
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
                  <td colspan="4" class="no-data">{{ translations[currentLanguage].noPriceHistory }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- CALCULATOR TAB -->
      <div v-if="activeMainTab === 'calculator'" class="tab-content">
        <!-- Calculator Sub-Tabs -->
        <div class="calculator-tabs">
          <button 
            v-for="tab in calculatorTabs" 
            :key="tab.id"
            @click="activeCalcTab = tab.id"
            :class="{ 'active': activeCalcTab === tab.id }"
            class="tab-button">
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-label">{{ translations[currentLanguage][tab.labelKey] }}</span>
          </button>
        </div>
        
        <!-- Chi Calculator (Simple) -->
        <div v-if="activeCalcTab === 'chi'" class="calculator-section section-card">
          <h2 class="section-title">{{ translations[currentLanguage].customChiCalculator }}</h2>
          <div class="calculator-input">
            <input
              type="number"
              step="0.01"
              v-model.number="customChiAmount"
              :placeholder="translations[currentLanguage].enterChiAmount"
              min="0"
              @input="calculateChiPrice"
              class="big-input"
            />
            <div class="calculation-result">
              {{ translations[currentLanguage].priceFor }} <span class="highlight">{{ customChiAmount || 0 }}</span> {{ translations[currentLanguage].chi }}:
              <span class="gold-value">{{ customChiPrice || '--' }}</span>
            </div>
          </div>
        </div>
        
        <!-- Unit Converter -->
        <div v-if="activeCalcTab === 'units'" class="calculator-section section-card">
          <h2 class="section-title">{{ translations[currentLanguage].unitConverter }}</h2>
          
          <div class="converter-grid">
            <div class="converter-input">
              <label for="fromValue">{{ translations[currentLanguage].amount }}</label>
              <input
                id="fromValue"
                type="number"
                v-model.number="unitConverter.value"
                min="0"
                step="0.0001"
                class="big-input"
                @input="convertUnits"
              />
            </div>
            
            <div class="converter-selects">
              <div class="converter-select">
                <label for="fromUnit">{{ translations[currentLanguage].from }}</label>
                <select
                  id="fromUnit"
                  v-model="unitConverter.fromUnit"
                  class="select-input"
                  @change="convertUnits"
                >
                  <option v-for="unit in goldUnits" :key="unit.id" :value="unit.id">
                    {{ translations[currentLanguage][unit.nameKey] }} ({{ unit.symbol }})
                  </option>
                </select>
              </div>
              
              <div class="converter-arrows">
                <button @click="swapUnits" class="swap-button">↔️</button>
              </div>
              
              <div class="converter-select">
                <label for="toUnit">{{ translations[currentLanguage].to }}</label>
                <select
                  id="toUnit"
                  v-model="unitConverter.toUnit"
                  class="select-input"
                  @change="convertUnits"
                >
                  <option v-for="unit in goldUnits" :key="unit.id" :value="unit.id">
                    {{ translations[currentLanguage][unit.nameKey] }} ({{ unit.symbol }})
                  </option>
                </select>
              </div>
            </div>
            
            <div class="conversion-result">
              <label>{{ translations[currentLanguage].result }}</label>
              <div class="result-display">
                {{ unitConverter.result }}
              </div>
              <div class="conversion-formula">
                {{ unitConverter.formula }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Value Calculator -->
        <div v-if="activeCalcTab === 'value'" class="calculator-section section-card">
          <h2 class="section-title">{{ translations[currentLanguage].valueCalculator }}</h2>
          
          <div class="value-calculator">
            <div class="calculator-row">
              <div class="calculator-column">
                <label for="goldWeight">{{ translations[currentLanguage].weight }}</label>
                <input
                  id="goldWeight"
                  type="number"
                  v-model.number="valueCalculator.weight"
                  min="0"
                  step="0.01"
                  class="big-input"
                  @input="calculateValue"
                />
              </div>
              
              <div class="calculator-column">
                <label for="weightUnit">{{ translations[currentLanguage].unit }}</label>
                <select
                  id="weightUnit"
                  v-model="valueCalculator.unit"
                  class="select-input"
                  @change="calculateValue"
                >
                  <option v-for="unit in goldUnits" :key="unit.id" :value="unit.id">
                    {{ translations[currentLanguage][unit.nameKey] }} ({{ unit.symbol }})
                  </option>
                </select>
              </div>
            </div>
            
            <div class="calculator-row">
              <div class="calculator-column">
                <label for="goldPurity">{{ translations[currentLanguage].purity }}</label>
                <select
                  id="goldPurity"
                  v-model="valueCalculator.purity"
                  class="select-input"
                  @change="calculateValue"
                >
                  <option v-for="purity in goldPurities" :key="purity.id" :value="purity.value">
                    {{ purity.name }} ({{ purity.value * 100 }}%)
                  </option>
                </select>
              </div>
            </div>
            
            <div class="value-result">
              <label>{{ translations[currentLanguage].estimatedValue }}</label>
              <div class="value-display">
                {{ valueCalculator.result }}
              </div>
              <div class="value-details">
                {{ valueCalculator.details }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Purity Converter -->
        <div v-if="activeCalcTab === 'purity'" class="calculator-section section-card">
          <h2 class="section-title">{{ translations[currentLanguage].purityConverter }}</h2>
          
          <div class="purity-converter">
            <div class="purity-selector">
              <div v-for="system in puritySystems" :key="system.id" class="purity-system">
                <label>{{ translations[currentLanguage][system.nameKey] }}</label>
                <select
                  v-model="purityConverter[system.id]"
                  class="select-input"
                  @change="convertPurity(system.id)"
                >
                  <option v-for="option in system.options" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>
            </div>
            
            <div class="purity-info">
              <div class="purity-percentage">
                <div class="purity-label">{{ translations[currentLanguage].fineGoldContent }}</div>
                <div class="purity-value">{{ purityConverter.percentage }}%</div>
              </div>
              
              <div class="purity-bar-container">
                <div class="purity-bar-bg"></div>
                <div class="purity-bar-fill" :style="{ width: purityConverter.percentage + '%' }"></div>
                <div class="purity-markers">
                  <div class="purity-marker" style="left: 41.7%">10K</div>
                  <div class="purity-marker" style="left: 58.5%">14K</div>
                  <div class="purity-marker" style="left: 75%">18K</div>
                  <div class="purity-marker" style="left: 91.7%">22K</div>
                  <div class="purity-marker" style="left: 99.9%">24K</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- ALERTS TAB -->
      <div v-if="activeMainTab === 'alerts'" class="tab-content">
        <PriceAlerts
          :currentPrice="pricePerOunce"
          :translations="translations"
          :currentLanguage="currentLanguage"
          :currencySymbol="currencySymbol"
        />
      </div>
      
      <!-- SETTINGS TAB -->
      <div v-if="activeMainTab === 'settings'" class="tab-content">
        <div class="settings-grid">
          <!-- Appearance Settings -->
          <div class="settings-section section-card">
            <h2 class="section-title">{{ translations[currentLanguage].appearance }}</h2>
            
            <div class="settings-option">
              <div class="option-label">{{ translations[currentLanguage].theme }}</div>
              <div class="theme-selector">
                <button 
                  class="theme-button" 
                  :class="{ 'active': !darkMode }"
                  @click="setDarkMode(false)">
                  <span class="theme-icon">☀️</span>
                  <span>{{ translations[currentLanguage].light }}</span>
                </button>
                <button 
                  class="theme-button" 
                  :class="{ 'active': darkMode }"
                  @click="setDarkMode(true)">
                  <span class="theme-icon">🌙</span>
                  <span>{{ translations[currentLanguage].dark }}</span>
                </button>
              </div>
            </div>
            
            <div class="settings-option">
              <div class="option-label">{{ translations[currentLanguage].language }}</div>
              <div class="language-selector">
                <button 
                  class="language-button" 
                  :class="{ 'active': currentLanguage === 'en' }"
                  @click="setLanguage('en')">
                  <span class="language-flag">🇺🇸</span>
                  <span>English</span>
                </button>
                <button 
                  class="language-button" 
                  :class="{ 'active': currentLanguage === 'km' }"
                  @click="setLanguage('km')">
                  <span class="language-flag">🇰🇭</span>
                  <span>ខ្មែរ</span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Data Settings -->
          <div class="settings-section section-card">
            <h2 class="section-title">{{ translations[currentLanguage].dataSettings }}</h2>
            
            <div class="settings-option">
              <div class="option-label">{{ translations[currentLanguage].dataSource }}</div>
              <div class="toggle-switch">
                <label class="switch">
                  <input type="checkbox" v-model="useApi" @change="saveDataSource">
                  <span class="slider round"></span>
                </label>
                <span class="toggle-label">{{ useApi ? translations[currentLanguage].apiData : translations[currentLanguage].manual }}</span>
              </div>
            </div>
            
            <div class="settings-option" v-if="useApi">
              <div class="option-label">{{ translations[currentLanguage].refreshInterval }}</div>
              <select v-model="refreshRate" @change="saveRefreshRate" class="select-input">
                <option v-for="rate in refreshRates" :key="rate.value" :value="rate.value">
                  {{ translations[currentLanguage][rate.labelKey] }}
                </option>
              </select>
            </div>
            
            <div class="settings-option">
              <div class="option-label">{{ translations[currentLanguage].defaultCurrency }}</div>
              <select v-model="selectedCurrency" @change="saveDefaultCurrency" class="select-input">
                <option v-for="currency in currencies" :key="currency.code" :value="currency.code">
                  {{ currency.flag }} {{ currency.name }} ({{ currency.symbol }})
                </option>
              </select>
            </div>
          </div>
          
          <!-- Notifications -->
          <div class="settings-section section-card">
            <h2 class="section-title">{{ translations[currentLanguage].notifications }}</h2>
            
            <div class="settings-option">
              <div class="option-label">{{ translations[currentLanguage].priceAlerts }}</div>
              <div class="toggle-switch">
                <label class="switch">
                  <input type="checkbox" v-model="enableAlerts" @change="toggleNotifications">
                  <span class="slider round"></span>
                </label>
                <span class="toggle-label">{{ enableAlerts ? translations[currentLanguage].enabled : translations[currentLanguage].disabled }}</span>
              </div>
            </div>
            
            <div v-if="enableAlerts && !notificationsGranted" class="notification-permission">
              <button @click="requestNotificationPermission" class="permission-button">
                {{ translations[currentLanguage].enableNotifications }}
              </button>
              <p class="permission-note">{{ translations[currentLanguage].notificationPermissionNote }}</p>
            </div>
            
            <div v-if="enableAlerts && notificationsGranted" class="settings-option">
              <div class="option-label">{{ translations[currentLanguage].alertSound }}</div>
              <div class="toggle-switch">
                <label class="switch">
                  <input type="checkbox" v-model="alertSound" @change="saveAlertSound">
                  <span class="slider round"></span>
                </label>
                <span class="toggle-label">{{ alertSound ? translations[currentLanguage].enabled : translations[currentLanguage].disabled }}</span>
              </div>
            </div>
          </div>
          
          <!-- Application -->
          <div class="settings-section section-card">
            <h2 class="section-title">{{ translations[currentLanguage].application }}</h2>
            
            <div class="settings-option" v-if="isPwaInstallable">
              <div class="option-label">{{ translations[currentLanguage].installApp }}</div>
              <button @click="installPwa" class="action-button install-button">
                <span class="action-icon">📱</span>
                {{ translations[currentLanguage].install }}
              </button>
            </div>
            
            <div class="settings-option">
              <div class="option-label">{{ translations[currentLanguage].dataStorage }}</div>
              <div class="storage-info">
                <p>{{ translations[currentLanguage].storingLocalData }}</p>
                <button @click="clearLocalData" class="action-button warning-button">
                  {{ translations[currentLanguage].clearData }}
                </button>
              </div>
            </div>
            
            <div class="settings-option">
              <div class="option-label">{{ translations[currentLanguage].about }}</div>
              <div class="app-info">
                <p class="app-name">{{ translations[currentLanguage].goldPriceTracker }}</p>
                <p class="app-version">v1.0.0</p>
                <p class="copyright">&copy; 2025 Gold Price Tracker</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="timestamp">
        <div class="indicator-dot" :class="{ 'active': useApi }"></div>
        {{ translations[currentLanguage].lastUpdated }}: {{ lastUpdated || translations[currentLanguage].notUpdatedYet }}
      </div>
    </div>
    <div class="footer">
      &copy; 2025 {{ translations[currentLanguage].goldPriceTracker }}
    </div>
  </div>
</template>

<script>
import PageSwitcher from '../components/PageSwitcher.vue';

export default {
 
  data() {
    return {
      activeMainTab: 'prices',
      activeCalcTab: 'chi',
      goldPrice: { ounce: null, damlung: null, chi: null },
      customChiAmount: 1,
      customChiPrice: null,
      lastUpdated: null,
      pricePerOunce: 0,
      pricePerChi: 0,
      priceHistory: [],
      darkMode: false,
      useApi: true,
      manualGoldPrice: null,
      refreshInterval: null,
      currentLanguage: 'en',
      selectedCurrency: 'USD',
      currencySymbol: '$',
      currencyRate: 1,
      enableAlerts: false,
      alertSound: true,
      notificationsGranted: false,
      isPwaInstallable: false,
      deferredPrompt: null,
      refreshRate: 300000, // 5 minutes in milliseconds
      
      // Main Navigation Tabs
      mainTabs: [
        { id: 'prices', icon: '💰', labelKey: 'goldPrices' },
        { id: 'calculator', icon: '🧮', labelKey: 'calculator' },
        { id: 'alerts', icon: '🔔', labelKey: 'priceAlerts' },
        { id: 'settings', icon: '⚙️', labelKey: 'settings' }
      ],
      
      // Calculator Tabs
      calculatorTabs: [
        { id: 'chi', icon: '🟡', labelKey: 'chiCalculator' },
        { id: 'units', icon: '⚖️', labelKey: 'unitConverter' },
        { id: 'value', icon: '💵', labelKey: 'valueCalculator' },
        { id: 'purity', icon: '✨', labelKey: 'purityConverter' }
      ],
      
      refreshRates: [
        { value: 60000, labelKey: 'every1min' },
        { value: 300000, labelKey: 'every5min' },
        { value: 900000, labelKey: 'every15min' },
        { value: 1800000, labelKey: 'every30min' },
        { value: 3600000, labelKey: 'everyHour' },
        { value: 0, labelKey: 'manualOnly' }
      ],
      
      // Unit Converter
      unitConverter: {
        value: 1,
        fromUnit: 'ounce',
        toUnit: 'gram',
        result: '',
        formula: ''
      },
      
      // Value Calculator
      valueCalculator: {
        weight: 1,
        unit: 'ounce',
        purity: 0.999,
        currency: 'USD',
        result: '',
        details: ''
      },
      
      // Purity Converter
      purityConverter: {
        karat: 24,
        percentage: 99.9,
        fineness: 999,
        millesimal: 999
      },
      
      // Gold Units
      goldUnits: [
        { id: 'ounce', symbol: 'oz', nameKey: 'ounce', toGram: 31.1035 },
        { id: 'gram', symbol: 'g', nameKey: 'gram', toGram: 1 },
        { id: 'kg', symbol: 'kg', nameKey: 'kilogram', toGram: 1000 },
        { id: 'tael', symbol: 'tl', nameKey: 'tael', toGram: 37.429 },
        { id: 'tola', symbol: 't', nameKey: 'tola', toGram: 11.6638 },
        { id: 'baht', symbol: 'bt', nameKey: 'baht', toGram: 15.244 },
        { id: 'damlung', symbol: 'dl', nameKey: 'damlung', toGram: 37.5 },
        { id: 'chi', symbol: 'chi', nameKey: 'chi', toGram: 3.75 }
      ],
      
      // Gold Purities
      goldPurities: [
        { id: '24k', name: '24K', value: 0.999 },
        { id: '23k', name: '23K', value: 0.958 },
        { id: '22k', name: '22K', value: 0.916 },
        { id: '21k', name: '21K', value: 0.875 },
        { id: '18k', name: '18K', value: 0.750 },
        { id: '14k', name: '14K', value: 0.585 },
        { id: '10k', name: '10K', value: 0.417 },
        { id: '9k', name: '9K', value: 0.375 }
      ],
      
      // Purity Systems
      puritySystems: [
        { 
          id: 'karat', 
          nameKey: 'karat',
          options: [
            { label: '24K', value: 24 },
            { label: '23K', value: 23 },
            { label: '22K', value: 22 },
            { label: '21K', value: 21 },
            { label: '18K', value: 18 },
            { label: '14K', value: 14 },
            { label: '10K', value: 10 },
            { label: '9K', value: 9 }
          ]
        },
        { 
          id: 'fineness', 
          nameKey: 'fineness',
          options: [
            { label: '999', value: 999 },
            { label: '958', value: 958 },
            { label: '916', value: 916 },
            { label: '875', value: 875 },
            { label: '750', value: 750 },
            { label: '585', value: 585 },
            { label: '417', value: 417 },
            { label: '375', value: 375 }
          ]
        },
        { 
          id: 'percentage', 
          nameKey: 'percentage',
          options: [
            { label: '99.9%', value: 99.9 },
            { label: '95.8%', value: 95.8 },
            { label: '91.6%', value: 91.6 },
            { label: '87.5%', value: 87.5 },
            { label: '75.0%', value: 75.0 },
            { label: '58.5%', value: 58.5 },
            { label: '41.7%', value: 41.7 },
            { label: '37.5%', value: 37.5 }
          ]
        }
      ],
      
      // Currencies
      currencies: [
        { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', rate: 1 },
        { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', rate: 0.85 },
        { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', rate: 0.72 },
        { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', rate: 110.5 },
        { code: 'KHR', symbol: '៛', name: 'Cambodian Riel', flag: '🇰🇭', rate: 4100 },
        { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳', rate: 6.47 }
      ],
      
      // Translations
      translations: {
        en: {
          // General UI
          goldPriceTracker: 'Gold Price Tracker',
          light: 'Light',
          dark: 'Dark',
          apiData: 'API Data',
          manual: 'Manual',
          lastUpdated: 'Last updated',
          notUpdatedYet: 'Not updated yet',
          loading: 'Loading...',
          
          // Main tabs
          goldPrices: 'Prices',
          calculator: 'Calculator',
          priceAlerts: 'Alerts',
          settings: 'Settings',
          
          // Calculator tabs
          chiCalculator: 'Chi',
          unitConverter: 'Units',
          valueCalculator: 'Value',
          purityConverter: 'Purity',
          
          // Sections
          manualPriceInput: 'Manual Price Input',
          currentPrices: 'Current Prices',
          customChiCalculator: 'Custom Chi Calculator (ជី)',
          recentPriceHistory: 'Recent Price History',
          
          // Gold units
          ounce: 'Ounce',
          gram: 'Gram',
          kilogram: 'Kilogram',
          tael: 'Tael',
          tola: 'Tola',
          baht: 'Baht',
          damlung: 'Damlung',
          chi: 'Chi',
          
          // Input labels
          enterGoldPricePerOunce: 'Enter Gold Price per Ounce',
          enterChiAmount: 'Enter Chi Amount',
          
          // Calculation
          priceFor: 'Price for',
          result: 'Result',
          
          // Table
          timestamp: 'Timestamp',
          noPriceHistory: 'No price history available yet',
          
          // Chart & Data Visualization
          priceChart: 'Price Chart',
          day: '1D',
          week: '1W',
          month: '1M',
          year: '1Y',
          goldPrice: 'Gold Price',
          highPrice: 'High',
          lowPrice: 'Low',
          averagePrice: 'Average',
          
          // Price Alerts
          targetPrice: 'Target Price',
          alertType: 'Alert Type',
          above: 'Above',
          below: 'Below',
          addAlert: 'Add Alert',
          activeAlerts: 'Active Alerts',
          noAlerts: 'No active alerts. Add one above to get notified when gold reaches your target price.',
          alertAbove: 'Alert when gold price goes above',
          alertBelow: 'Alert when gold price falls below',
          triggered: 'Triggered',
          waiting: 'Waiting',
          enableNotifications: 'Enable Notifications',
          notificationsEnabled: 'Notifications Enabled',
          notificationsEnabledMessage: 'You will receive alerts when gold reaches your target price.',
          notificationsNotSupported: 'Notifications are not supported by your browser.',
          alertAboveTitle: 'Gold Price Alert ↗️',
          alertBelowTitle: 'Gold Price Alert ↘️',
          goldReached: 'Gold price has reached',
          goldFell: 'Gold price has fallen to',
          
          // Currency selector
          currency: 'Currency',
          
          // Settings page
          appearance: 'Appearance',
          theme: 'Theme',
          language: 'Language',
          dataSettings: 'Data Settings',
          dataSource: 'Data Source',
          refreshInterval: 'Refresh Interval',
          defaultCurrency: 'Default Currency',
          notifications: 'Notifications',
          enabled: 'Enabled',
          disabled: 'Disabled',
          notificationPermissionNote: 'Browser permission is required to show notifications when gold prices reach your targets.',
          alertSound: 'Alert Sound',
          application: 'Application',
          installApp: 'Install App',
          install: 'Install',
          dataStorage: 'Data Storage',
          storingLocalData: 'This app stores your preferences and price history on your device.',
          clearData: 'Clear All Data',
          clearDataConfirm: 'Are you sure? This will reset all settings and clear price history.',
          about: 'About',
          
          // Refresh Rates
          every1min: 'Every minute',
          every5min: 'Every 5 minutes',
          every15min: 'Every 15 minutes',
          every30min: 'Every 30 minutes',
          everyHour: 'Every hour',
          manualOnly: 'Manual only',
          
          // Unit Converter
          amount: 'Amount',
          from: 'From',
          to: 'To',
          
          // Value Calculator
          weight: 'Weight',
          unit: 'Unit',
          purity: 'Purity',
          estimatedValue: 'Estimated Value',
          currentGoldPrice: 'Current Gold Price',
          
          // Purity Converter
          karat: 'Karat',
          fineness: 'Fineness',
          percentage: 'Percentage',
          fineGoldContent: 'Fine Gold Content'
        },
        km: {
          // General UI
          goldPriceTracker: 'កម្មវិធីតាមដានតម្លៃមាស',
          light: 'ភ្លឺ',
          dark: 'ងងឹត',
          apiData: 'ទិន្នន័យ API',
          manual: 'ដោយដៃ',
          lastUpdated: 'បានធ្វើបច្ចុប្បន្នភាពចុងក្រោយ',
          notUpdatedYet: 'មិនទាន់បានធ្វើបច្ចុប្បន្នភាពនៅឡើយទេ',
          loading: 'កំពុងផ្ទុក...',
          
          // Main tabs
          goldPrices: 'តម្លៃ',
          calculator: 'គណនា',
          priceAlerts: 'ជូនដំណឹង',
          settings: 'ការកំណត់',
          
          // Calculator tabs
          chiCalculator: 'ជី',
          unitConverter: 'ឯកតា',
          valueCalculator: 'តម្លៃ',
          purityConverter: 'សុទ្ធភាព',
          
          // Sections
          manualPriceInput: 'បញ្ចូលតម្លៃដោយដៃ',
          currentPrices: 'តម្លៃបច្ចុប្បន្ន',
          customChiCalculator: 'ឧបករណ៍គណនាជី (ជី)',
          recentPriceHistory: 'ប្រវត្តិតម្លៃថ្មីៗ',
          
          // Gold units
          ounce: 'អោន',
          gram: 'ក្រាម',
          kilogram: 'គីឡូក្រាម',
          tael: 'តាល',
          tola: 'តូឡា',
          baht: 'បាត',
          damlung: 'ដំឡឹង',
          chi: 'ជី',
          
          // Input labels
          enterGoldPricePerOunce: 'បញ្ចូលតម្លៃមាសក្នុងមួយអោន',
          enterChiAmount: 'បញ្ចូលចំនួនជី',
          
          // Calculation
          priceFor: 'តម្លៃសម្រាប់',
          result: 'លទ្ធផល',
          
          // Table
          timestamp: 'ពេលវេលា',
          noPriceHistory: 'មិនមានប្រវត្តិតម្លៃនៅឡើយទេ',
          
          // Chart & Data Visualization
          priceChart: 'តារាងតម្លៃ',
          day: '១ថ្ងៃ',
          week: '១សប្តាហ៍',
          month: '១ខែ',
          year: '១ឆ្នាំ',
          goldPrice: 'តម្លៃមាស',
          highPrice: 'ខ្ពស់',
          lowPrice: 'ទាប',
          averagePrice: 'មធ្យម',
          
          // Price Alerts
          targetPrice: 'តម្លៃគោលដៅ',
          alertType: 'ប្រភេទជូនដំណឹង',
          above: 'លើស',
          below: 'ក្រោម',
          addAlert: 'បន្ថែមការជូនដំណឹង',
          activeAlerts: 'ការជូនដំណឹងសកម្ម',
          noAlerts: 'គ្មានការជូនដំណឹងសកម្មទេ។ បន្ថែមមួយខាងលើដើម្បីទទួលបានការជូនដំណឹងនៅពេលមាសឈានដល់តម្លៃគោលដៅរបស់អ្នក។',
          alertAbove: 'ជូនដំណឹងនៅពេលតម្លៃមាសឡើងលើស',
          alertBelow: 'ជូនដំណឹងនៅពេលតម្លៃមាសធ្លាក់ចុះក្រោម',
          triggered: 'បានកើតឡើង',
          waiting: 'កំពុងរង់ចាំ',
          enableNotifications: 'បើកការជូនដំណឹង',
          notificationsEnabled: 'បានបើកការជូនដំណឹង',
          notificationsEnabledMessage: 'អ្នកនឹងទទួលបានការជូនដំណឹងនៅពេលមាសឈានដល់តម្លៃគោលដៅរបស់អ្នក។',
          notificationsNotSupported: 'ការជូនដំណឹងមិនត្រូវបានគាំទ្រដោយកម្មវិធីរុករករបស់អ្នកទេ។',
          alertAboveTitle: 'ការជូនដំណឹងតម្លៃមាស ↗️',
          alertBelowTitle: 'ការជូនដំណឹងតម្លៃមាស ↘️',
          goldReached: 'តម្លៃមាសបានឈានដល់',
          goldFell: 'តម្លៃមាសបានធ្លាក់ចុះដល់',
          
          // Currency selector
          currency: 'រូបិយប័ណ្ណ',
          
          // Settings page
          appearance: 'រូបរាង',
          theme: 'រូបរាង',
          language: 'ភាសា',
          dataSettings: 'ការកំណត់ទិន្នន័យ',
          dataSource: 'ប្រភពទិន្នន័យ',
          refreshInterval: 'ចន្លោះពេលធ្វើឱ្យស្រស់',
          defaultCurrency: 'រូបិយប័ណ្ណលំនាំដើម',
          notifications: 'ការជូនដំណឹង',
          enabled: 'បានបើក',
          disabled: 'បានបិទ',
          notificationPermissionNote: 'ត្រូវការការអនុញ្ញាតពីកម្មវិធីរុករកដើម្បីបង្ហាញការជូនដំណឹងនៅពេលតម្លៃមាសឈានដល់គោលដៅរបស់អ្នក។',
          alertSound: 'សំឡេងជូនដំណឹង',
          application: 'កម្មវិធី',
          installApp: 'ដំឡើងកម្មវិធី',
          install: 'ដំឡើង',
          dataStorage: 'ការផ្ទុកទិន្នន័យ',
          storingLocalData: 'កម្មវិធីនេះរក្សាទុកចំណូលចិត្តរបស់អ្នក និងប្រវត្តិតម្លៃនៅលើឧបករណ៍របស់អ្នក។',
          clearData: 'លុបទិន្នន័យទាំងអស់',
          clearDataConfirm: 'តើអ្នកប្រាកដទេ? វានឹងកំណត់ឡើងវិញនូវការកំណត់ទាំងអស់ និងលុបប្រវត្តិតម្លៃ។',
          about: 'អំពី',
          
          // Refresh Rates
          every1min: 'រៀងរាល់នាទី',
          every5min: 'រាល់ ៥ នាទី',
          every15min: 'រាល់ ១៥ នាទី',
          every30min: 'រាល់ ៣០ នាទី',
          everyHour: 'រាល់ម៉ោង',
          manualOnly: 'ដោយដៃតែប៉ុណ្ណោះ',
          
          // Unit Converter
          amount: 'ចំនួន',
          from: 'ពី',
          to: 'ទៅ',
          
          // Value Calculator
          weight: 'ទម្ងន់',
          unit: 'ឯកតា',
          purity: 'ភាពបរិសុទ្ធ',
          estimatedValue: 'តម្លៃប៉ាន់ស្មាន',
          currentGoldPrice: 'តម្លៃមាសបច្ចុប្បន្ន',
          
          // Purity Converter
          karat: 'ការ៉ាត',
          fineness: 'ភាពល្អិត',
          percentage: 'ភាគរយ',
          fineGoldContent: 'មាតិកាមាសល្អ'
        }
      }
    };
  },
  mounted() {
    // Check system preference for dark mode
    if (process.client) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.darkMode = JSON.parse(localStorage.getItem('darkMode')) ?? prefersDark;
      
      // Get stored language or default to English
      this.currentLanguage = localStorage.getItem('language') || 'en';
      
      // Update HTML lang attribute
      document.documentElement.setAttribute('lang', this.currentLanguage);
      
      // Get stored currency
      this.selectedCurrency = localStorage.getItem('defaultCurrency') || 'USD';
      this.updateCurrencyDetails();
      
      this.priceHistory = JSON.parse(localStorage.getItem('priceHistory')) || [];
      this.useApi = JSON.parse(localStorage.getItem('useApi')) ?? true;
      
      // Get refresh rate
      this.refreshRate = parseInt(localStorage.getItem('refreshRate')) || 300000;
      
      // Check notification permission
      if ('Notification' in window) {
        this.notificationsGranted = Notification.permission === 'granted';
      }
      
      // Load alert settings
      this.enableAlerts = JSON.parse(localStorage.getItem('enableAlerts')) ?? false;
      this.alertSound = JSON.parse(localStorage.getItem('alertSound')) ?? true;
      
      // Check if PWA is installable
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPrompt = e;
        this.isPwaInstallable = true;
      });
      
      if (this.useApi && this.refreshRate > 0) {
        this.fetchGoldPrice(true);
        // Set up refresh interval for API data
        this.refreshInterval = setInterval(() => {
          this.fetchGoldPrice(true);
        }, this.refreshRate);
      } else {
        this.restoreManualPrice();
      }
      
      // Initialize calculations
      this.convertUnits();
      this.calculateValue();
      this.convertPurity('karat');
    }
  },
  beforeDestroy() {
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
      // Store original price in USD for reference
      this.pricePerOunce = pricePerOunce;
      
      // Convert to selected currency
      const convertedPrice = pricePerOunce * this.currencyRate;
      
      const pricePerGram = convertedPrice / 31.1035;
      const pricePerDamlung = pricePerGram * 37.5;
      this.pricePerChi = pricePerDamlung / 10;

      const newPrice = {
        ounce: `${this.currencySymbol}${convertedPrice.toFixed(2)}`,
        damlung: `${this.currencySymbol}${pricePerDamlung.toFixed(2)}`,
        chi: `${this.currencySymbol}${this.pricePerChi.toFixed(2)}`,
        timestamp: new Date().toLocaleString(),
      };

      if (updateUI) {
        this.goldPrice = newPrice;
        this.lastUpdated = newPrice.timestamp;
        this.calculateChiPrice();

        // Store last 5 price updates locally
        this.priceHistory.unshift(newPrice);
        if (this.priceHistory.length > 5) {
          this.priceHistory.pop();
        }
        localStorage.setItem('priceHistory', JSON.stringify(this.priceHistory));
      }
    },
    calculateChiPrice() {
      this.customChiPrice =
        this.customChiAmount > 0
          ? `${this.currencySymbol}${(this.pricePerChi * this.customChiAmount).toFixed(2)}`
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
        if (this.refreshRate > 0) {
          this.refreshInterval = setInterval(() => {
            this.fetchGoldPrice(true);
          }, this.refreshRate);
        }
      }
    },
    toggleLanguage() {
      // Toggle between English and Khmer
      this.currentLanguage = this.currentLanguage === 'en' ? 'km' : 'en';
      localStorage.setItem('language', this.currentLanguage);
      
      // Update HTML lang attribute
      if (process.client) {
        document.documentElement.setAttribute('lang', this.currentLanguage);
      }
    },
    setLanguage(lang) {
      this.currentLanguage = lang;
      localStorage.setItem('language', this.currentLanguage);
      document.documentElement.setAttribute('lang', this.currentLanguage);
    },
    setDarkMode(isDark) {
      this.darkMode = isDark;
      localStorage.setItem('darkMode', JSON.stringify(this.darkMode));
    },
    saveDataSource() {
      localStorage.setItem('useApi', JSON.stringify(this.useApi));
      if (this.useApi) {
        this.fetchGoldPrice(true);
        if (this.refreshRate > 0) {
          this.refreshInterval = setInterval(() => {
            this.fetchGoldPrice(true);
          }, this.refreshRate);
        }
      } else if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
        this.restoreManualPrice();
      }
    },
    saveRefreshRate() {
      localStorage.setItem('refreshRate', this.refreshRate.toString());
      
      // Reset interval with new rate
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
      }
      
      if (this.useApi && this.refreshRate > 0) {
        this.refreshInterval = setInterval(() => {
          this.fetchGoldPrice(true);
        }, this.refreshRate);
      }
    },
    onCurrencyChange(currency) {
      this.selectedCurrency = currency.code;
      this.updateCurrencyDetails();
      localStorage.setItem('defaultCurrency', currency.code);
      
      // Update prices with new currency
      if (this.pricePerOunce > 0) {
        this.updateGoldPrices(this.pricePerOunce, true);
      }
    },
    updateCurrencyDetails() {
      const currency = this.currencies.find(c => c.code === this.selectedCurrency);
      if (currency) {
        this.currencySymbol = currency.symbol;
        this.currencyRate = currency.rate;
      }
    },
    saveDefaultCurrency() {
      localStorage.setItem('defaultCurrency', this.selectedCurrency);
      this.updateCurrencyDetails();
      
      // Update prices with new currency
      if (this.pricePerOunce > 0) {
        this.updateGoldPrices(this.pricePerOunce, true);
      }
    },
    toggleNotifications() {
      localStorage.setItem('enableAlerts', JSON.stringify(this.enableAlerts));
      
      if (this.enableAlerts && !this.notificationsGranted && 'Notification' in window) {
        this.requestNotificationPermission();
      }
    },
    saveAlertSound() {
      localStorage.setItem('alertSound', JSON.stringify(this.alertSound));
    },
    requestNotificationPermission() {
      if (!('Notification' in window)) {
        alert(this.translations[this.currentLanguage].notificationsNotSupported);
        return;
      }
      
      Notification.requestPermission()
        .then(permission => {
          if (permission === 'granted') {
            this.notificationsGranted = true;
            alert(this.translations[this.currentLanguage].notificationsEnabled);
            
            // Show a test notification
            new Notification(this.translations[this.currentLanguage].notificationsEnabled, {
              body: this.translations[this.currentLanguage].notificationsEnabledMessage,
              icon: '/favicon.ico'
            });
          } else if (permission === 'denied') {
            this.notificationsGranted = false;
            alert(this.translations[this.currentLanguage].notificationsBlocked);
          }
        });
    },
    installPwa() {
      if (!this.deferredPrompt) return;
      
      // Show the install prompt
      this.deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      this.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          this.isPwaInstallable = false;
        }
        this.deferredPrompt = null;
      });
    },
    clearLocalData() {
      if (confirm(this.translations[this.currentLanguage].clearDataConfirm)) {
        // Clear all localStorage items
        localStorage.clear();
        alert(this.translations[this.currentLanguage].dataCleared);
        
        // Reload the page to reset all states
        window.location.reload();
      }
    },
    // Unit Converter Methods
    convertUnits() {
      if (!this.unitConverter.value || this.unitConverter.value < 0) {
        this.unitConverter.value = 0;
      }
      
      const fromUnit = this.goldUnits.find(u => u.id === this.unitConverter.fromUnit);
      const toUnit = this.goldUnits.find(u => u.id === this.unitConverter.toUnit);
      
      if (fromUnit && toUnit) {
        // Convert to grams first, then to target unit
        const valueInGrams = this.unitConverter.value * fromUnit.toGram;
        const result = valueInGrams / toUnit.toGram;
        
        this.unitConverter.result = `${result.toFixed(4)} ${toUnit.symbol}`;
        this.unitConverter.formula = `${this.unitConverter.value} ${fromUnit.symbol} × (${fromUnit.toGram} g/${fromUnit.symbol}) ÷ (${toUnit.toGram} g/${toUnit.symbol}) = ${result.toFixed(4)} ${toUnit.symbol}`;
      }
    },
    swapUnits() {
      const temp = this.unitConverter.fromUnit;
      this.unitConverter.fromUnit = this.unitConverter.toUnit;
      this.unitConverter.toUnit = temp;
      this.convertUnits();
    },
    // Value Calculator Methods
    calculateValue() {
      if (!this.valueCalculator.weight || this.valueCalculator.weight < 0) {
        this.valueCalculator.weight = 0;
      }
      
      const unit = this.goldUnits.find(u => u.id === this.valueCalculator.unit);
      const currency = this.currencies.find(c => c.code === this.selectedCurrency);
      
      if (unit && currency) {
        // Convert weight to ounces (gold price is typically per ounce)
        const weightInGrams = this.valueCalculator.weight * unit.toGram;
        const weightInOunces = weightInGrams / 31.1035;
        
        // Calculate value in USD first
        const valueInUSD = this.pricePerOunce * weightInOunces * this.valueCalculator.purity;
        
        // Convert to target currency
        const valueInCurrency = valueInUSD * currency.rate;
        
        this.valueCalculator.result = `${currency.symbol}${valueInCurrency.toFixed(2)} ${currency.code}`;
        
        const purityPercent = this.valueCalculator.purity * 100;
        this.valueCalculator.details = `${this.valueCalculator.weight} ${unit.symbol} × ${purityPercent}% = ${(this.valueCalculator.weight * this.valueCalculator.purity).toFixed(4)} ${unit.symbol} pure gold`;
      }
    },
    // Purity Converter Methods
    convertPurity(sourceSystem) {
      let percentage = 0;
      
      switch(sourceSystem) {
        case 'karat':
          percentage = (this.purityConverter.karat / 24) * 100;
          this.purityConverter.fineness = Math.round(percentage * 10);
          this.purityConverter.percentage = percentage;
          break;
          
        case 'fineness':
          percentage = this.purityConverter.fineness / 10;
          this.purityConverter.karat = Math.round((percentage / 100) * 24);
          this.purityConverter.percentage = percentage;
          break;
          
        case 'percentage':
          this.purityConverter.karat = Math.round((this.purityConverter.percentage / 100) * 24);
          this.purityConverter.fineness = Math.round(this.purityConverter.percentage * 10);
          break;
      }
    }
  }
};
</script>

<style scoped>
/* Import font */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Kantumruy+Pro:wght@300;400;500;600;700&display=swap');

/* Base reset and settings */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Mobile-first approach, with desktop improvements */
.page-wrapper {
  font-family: var(--font-family);
  text-align: center;
  padding: 12px;
  position: relative;
  overflow-x: hidden;
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

:root {
  --font-family: 'Poppins', sans-serif;
}

:root[lang="km"] {
  --font-family: 'Kantumruy Pro', sans-serif;
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
  padding: 25px 15px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 94%;
  max-width: 1240px; /* Increased for desktop */
  margin: 10px auto;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.4s ease;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* Tab Content */
.tab-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Main Tabs */
.main-tabs {
  display: flex;
  justify-content: space-between;
  gap: 5px;
  margin: 0 -5px 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 5px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.main-tab-button {
  flex: 1;
  padding: 10px 5px;
  border-radius: 12px;
  background: transparent;
  border: none;
  color: inherit;
  font-size: 14px;
  font-family: var(--font-family);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.main-tab-button.active {
  background: rgba(212, 175, 55, 0.2);
  font-weight: 500;
  box-shadow: 0 2px 10px rgba(212, 175, 55, 0.2);
}

.tab-icon {
  font-size: 18px;
}

.tab-text {
  font-size: 12px;
}

/* Calculator Tabs */
.calculator-tabs {
  display: flex;
  justify-content: center;
  gap: 5px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.tab-button {
  padding: 8px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 5px;
}

.tab-button.active {
  background: rgba(212, 175, 55, 0.2);
  border-color: rgba(212, 175, 55, 0.4);
  font-weight: 500;
}

.tab-label {
  font-size: 13px;
}

/* Section cards for better organization */
.section-card {
  padding: 15px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.section-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
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
  margin-bottom: 5px;
}

.main-title {
  font-size: 28px;
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

.small-toggle {
  min-height: 36px;
  min-width: auto;
  font-size: 13px;
  padding: 6px 12px;
}

.language-toggle {
  background: rgba(0, 150, 136, 0.2);
  border: 1px solid rgba(0, 150, 136, 0.4);
  font-family: 'Kantumruy Pro', 'Poppins', sans-serif;
}

.toggle-button:hover {
  background: rgba(255, 215, 0, 0.5);
  transform: translateY(-2px);
}

.toggle-button:active {
  transform: translateY(1px);
}

.source-toggle {
  display: flex;
  justify-content: center;
  margin-bottom: 5px;
}

/* 📥 Manual Input Section */
.manual-input {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
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
  font-family: var(--font-family);
  -webkit-appearance: none;
}

.big-input:focus {
  border-color: rgba(212, 175, 55, 0.9);
  box-shadow: 0 4px 20px rgba(212, 175, 55, 0.25);
  outline: none;
  transform: scale(1.02);
}

/* 💰 Price Cards Section */
.prices-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

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

/* Section title styling */
.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
  position: relative;
  display: inline-block;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, rgba(255,215,0,0), rgba(255,215,0,0.6), rgba(255,215,0,0));
  border-radius: 4px;
}

/* Table Container */
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
  padding: 12px 8px;
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

/* Unit Converter Styles */
.converter-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.converter-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.converter-selects {
  display: flex;
  gap: 10px;
  align-items: center;
}

.converter-select {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.select-input {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  border: 1px solid rgba(212, 175, 55, 0.5);
  font-family: var(--font-family);
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23d4af37' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
}

.converter-arrows {
  display: flex;
  align-items: center;
  padding: 15px 0;
}

.swap-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: inherit;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.swap-button:hover {
  background: rgba(212, 175, 55, 0.2);
  transform: scale(1.05);
}

.conversion-result {
  margin-top: 10px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.result-display {
  font-size: 20px;
  font-weight: 600;
  margin: 10px 0;
  color: #d4af37;
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
}

.conversion-formula {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 5px;
}

/* Value Calculator Styles */
.value-calculator {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.calculator-row {
  display: flex;
  gap: 10px;
}

.calculator-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.value-result {
  margin-top: 10px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.value-display {
  font-size: 24px;
  font-weight: 700;
  margin: 15px 0;
  color: #d4af37;
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
}

.value-details {
  font-size: 14px;
  opacity: 0.8;
}

/* Purity Converter Styles */
.purity-converter {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.purity-selector {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.purity-system {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.purity-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 10px;
}

.purity-percentage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.purity-label {
  font-size: 14px;
  opacity: 0.9;
}

.purity-value {
  font-size: 28px;
  font-weight: 700;
  color: #d4af37;
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
}

.purity-bar-container {
  position: relative;
  height: 25px;
  margin: 20px 0;
}

.purity-bar-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  overflow: hidden;
}

.purity-bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.7));
  border-radius: 15px;
  transition: width 0.5s ease;
}

.purity-markers {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  height: 20px;
}

.purity-marker {
  position: absolute;
  top: 5px;
  transform: translateX(-50%);
  font-size: 11px;
  opacity: 0.7;
}

/* Settings Styles */
.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-section {
  text-align: left;
}

.settings-option {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.settings-option:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.option-label {
  font-size: 16px;
  margin-bottom: 10px;
  font-weight: 500;
}

/* Theme Selector */
.theme-selector {
  display: flex;
  gap: 10px;
}

.theme-button {
  flex: 1;
  padding: 12px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: inherit;
  font-family: var(--font-family);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.theme-button.active {
  background: rgba(212, 175, 55, 0.2);
  border-color: rgba(212, 175, 55, 0.4);
  font-weight: 500;
}

.theme-icon {
  font-size: 18px;
}

/* Language Selector */
.language-selector {
  display: flex;
  gap: 10px;
}

.language-button {
  flex: 1;
  padding: 12px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: inherit;
  font-family: var(--font-family);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.language-button.active {
  background: rgba(212, 175, 55, 0.2);
  border-color: rgba(212, 175, 55, 0.4);
  font-weight: 500;
}

.language-flag {
  font-size: 18px;
}

/* Toggle Switch */
.toggle-switch {
  display: flex;
  align-items: center;
  gap: 10px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 26px;
  margin-right: 5px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.2);
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: rgba(212, 175, 55, 0.5);
}

input:focus + .slider {
  box-shadow: 0 0 1px rgba(212, 175, 55, 0.5);
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

.toggle-label {
  font-size: 14px;
}

/* Notification Permission */
.notification-permission {
  margin: 10px 0;
  padding: 15px;
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 8px;
  text-align: center;
}

.permission-button {
  padding: 10px 15px;
  border-radius: 8px;
  background: rgba(76, 175, 80, 0.2);
  border: 1px solid rgba(76, 175, 80, 0.4);
  color: inherit;
  font-family: var(--font-family);
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 10px;
}

.permission-note {
  font-size: 12px;
  opacity: 0.8;
  line-height: 1.4;
}

/* Storage Info */
.storage-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.storage-info p {
  font-size: 14px;
  opacity: 0.8;
  line-height: 1.4;
}

/* App Info */
.app-info {
  text-align: center;
  padding: 10px;
}

.app-name {
  font-size: 18px;
  font-weight: 600;
  color: #d4af37;
}

.app-version {
  font-size: 14px;
  opacity: 0.7;
  margin: 5px 0;
}

.copyright {
  font-size: 12px;
  opacity: 0.6;
  margin-top: 5px;
}

/* Action Buttons */
.action-button {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  font-family: var(--font-family);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 500;
}

.install-button {
  background: rgba(33, 150, 243, 0.2);
  border: 1px solid rgba(33, 150, 243, 0.4);
  color: inherit;
}

.warning-button {
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
  color: inherit;
}

.action-icon {
  font-size: 18px;
}

/* Animation Classes */
.gold-glow {
  color: #d4af37;
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.7);
}

/* 🌎 Responsive Design - Desktop Improvements */
@media (min-width: 768px) {
  .gold-wrapper {
    padding: 30px;
  }
  
  .main-title {
    font-size: 36px;
  }
  
  .main-tabs {
    max-width: 600px;
    margin: 0 auto 20px;
    padding: 8px;
  }
  
  .main-tab-button {
    flex-direction: row;
    gap: 8px;
    justify-content: center;
    padding: 12px;
    font-size: 16px;
  }
  
  .tab-text {
    font-size: 15px;
  }
  
  .tab-icon {
    font-size: 20px;
  }
  
  .prices-card {
    flex-direction: row;
    justify-content: space-between;
  }
  
  .price-item {
    width: calc(33.33% - 10px);
  }
  
  .calculator-tabs {
    gap: 10px;
  }
  
  .tab-button {
    padding: 10px 20px;
    font-size: 15px;
    gap: 8px;
  }
  
  .section-title {
    font-size: 22px;
  }
  
  .gold-table {
    font-size: 15px;
  }
  
  /* Settings grid on desktop */
  .settings-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 20px;
  }
  
  /* Unit converter on desktop */
  .converter-grid {
    max-width: 600px;
    margin: 0 auto;
  }
  
  /* Purity selector on desktop */
  .purity-selector {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  
  .purity-system {
    flex: 1;
  }
}

/* For larger desktop screens */
@media (min-width: 1200px) {
  .main-title {
    font-size: 42px;
  }
  
  .price-value {
    font-size: 24px;
  }
  
  .section-title {
    font-size: 24px;
  }
  
  .price-item {
    padding: 18px;
  }
}

  
</style>