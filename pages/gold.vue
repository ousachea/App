<template>
  <div class="gold-tracker">
    <!-- Header -->
    <div class="header">
      <h1>{{ t.title }}</h1>
      <div class="header-actions">
        <button @click="toggleLanguage" class="lang-btn">
          {{ currentLang === 'en' ? 'ខ្មែរ' : 'EN' }}
        </button>
      </div>
    </div>

    <!-- Network Status Warning -->
    <div v-if="!isOnline" class="network-warning">
      {{ t.offlineWarning }}
    </div>

    <!-- Current Gold & Silver Prices -->
    <div class="price-section">
      <div class="price-header">
        <h2>{{ t.currentPrice }}</h2>
        <button @click="fetchGoldPrice" :disabled="loading" class="refresh-btn">
          <span v-if="!loading">{{ t.refreshNow }}</span>
          <span v-else>{{ t.loading }}</span>
        </button>
      </div>

      <!-- Metal Toggle -->
      <div class="metal-toggle">
        <button @click="activeMetal = 'gold'" :class="['metal-btn', { active: activeMetal === 'gold' }]">
          🥇 {{ t.gold }}
        </button>
        <button @click="activeMetal = 'silver'" :class="['metal-btn', { active: activeMetal === 'silver' }]">
          🥈 {{ t.silver }}
        </button>
      </div>

      <div v-if="goldPrice || silverPrice" class="price-cards">
        <!-- Gold Price Card -->
        <div v-if="goldPrice" :class="['price-card', { active: activeMetal === 'gold' }]" @click="activeMetal = 'gold'">
          <div class="card-label">🥇 {{ t.gold }}</div>
          <div class="price-main">
            <span class="price-value">${{ goldPrice.toFixed(2) }}</span>
            <span class="price-unit">{{ t.perTroyOz }}</span>
          </div>
        </div>

        <!-- Silver Price Card -->
        <div v-if="silverPrice" :class="['price-card', { active: activeMetal === 'silver' }]" @click="activeMetal = 'silver'">
          <div class="card-label">🥈 {{ t.silver }}</div>
          <div class="price-main">
            <span class="price-value">${{ silverPrice.toFixed(2) }}</span>
            <span class="price-unit">{{ t.perTroyOz }}</span>
          </div>
        </div>
      </div>

      <div v-if="lastUpdated" class="price-meta">
        <span class="last-updated">{{ t.lastUpdated }}: {{ lastUpdated }}</span>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- Custom API URL -->
      <div class="custom-api-section">
        <div class="api-header">
          <label>{{ t.customAPIUrl }}</label>
          <a href="https://www.goldapi.io/" target="_blank" rel="noopener noreferrer" class="api-link">
            {{ t.getAPIKey }}
          </a>
        </div>
        
        <!-- Default API Key Info Box -->
        <div v-if="!customApiUrl" class="default-api-info">
          <div class="info-header">
            <span>📋 {{ t.freeAPIAvailable }}</span>
          </div>
          <div class="api-copy-box">
            <input 
              ref="defaultApiInput"
              type="text" 
              readonly 
              :value="defaultApiKey" 
              class="api-copy-input"
              @click="selectApiKey"
            >
            <button @click="copyDefaultApi" class="copy-api-btn">
              {{ apiCopied ? '✓ ' + t.copied : '📋 ' + t.copy }}
            </button>
          </div>
          <div class="api-instructions">
            {{ t.apiInstructions }}
          </div>
        </div>

        <div class="api-input-row">
          <input v-model="customApiUrl" type="text" :placeholder="t.enterAPIUrl" class="api-input">
          <button @click="saveCustomApi" class="save-api-btn">
            {{ t.saveAPI }}
          </button>
        </div>
        <small v-if="customApiUrl" class="api-note">{{ t.usingCustomAPI }}</small>
        <small v-else class="api-note-default">{{ t.usingFreeAPI }}</small>
      </div>
    </div>

    <!-- Price Input Method Toggle -->
    <div class="price-method-section">
      <h3>{{ t.setPriceBy }}</h3>
      <div class="price-method-toggle">
        <button @click="priceInputMethod = 'troyOz'" :class="['method-btn', { active: priceInputMethod === 'troyOz' }]">
          {{ t.troyOunce }}
        </button>
        <button @click="priceInputMethod = 'damlung'"
          :class="['method-btn', { active: priceInputMethod === 'damlung' }]">
          {{ t.damlung }}
        </button>
        <button @click="priceInputMethod = 'chi'" :class="['method-btn', { active: priceInputMethod === 'chi' }]">
          {{ t.chi }}
        </button>
      </div>

      <!-- Custom Price Input -->
      <div class="custom-price-input">
        <label>{{ t.customPrice }} ({{ priceInputMethod === 'troyOz' ? t.troyOunce : priceInputMethod === 'damlung' ?
        t.damlung : t.chi }}):</label>
        <div class="price-input-row">
          <input v-model.number="customPrice" type="text" inputmode="decimal" :placeholder="t.enterCustomPrice"
            class="price-input">
          <button @click="updateGoldPriceFromCustom" class="set-price-btn">
            {{ t.setPrice }}
          </button>
        </div>
      </div>

      <!-- Price Conversion Preview -->
      <div v-if="currentMetalPrice" class="price-preview">
        <div class="preview-header">{{ activeMetal === 'gold' ? '🥇 ' + t.gold : '🥈 ' + t.silver }} {{ t.priceByUnit }}</div>
        <div class="preview-item">
          <span class="preview-label">{{ t.troyOunce }}:</span>
          <span class="preview-value">${{ currentMetalPrice ? currentMetalPrice.toFixed(2) : '0.00' }}</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">{{ t.damlung }}:</span>
          <span class="preview-value">${{ currentMetalPrice ? currentPricePerDamlung.toFixed(2) : '0.00' }}</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">{{ t.chi }}:</span>
          <span class="preview-value">${{ currentMetalPrice ? currentPricePerChi.toFixed(2) : '0.00' }}</span>
        </div>
      </div>
    </div>

    <!-- Combined Unit Converter -->
    <div class="converter-section">
      <h2>{{ t.unitConverter }}</h2>

      <div class="converter-tabs">
        <button v-for="unit in converterUnits" :key="unit" @click="activeConverter = unit"
          :class="['tab-btn', { active: activeConverter === unit }]">
          {{ t[unit] || unit }}
        </button>
      </div>

      <div class="converter-content">
        <!-- From Input -->
        <div class="converter-input-group">
          <label>{{ t.from }}</label>
          <input v-model.number="converterInput" type="text" inputmode="decimal"
            :placeholder="'Enter ' + (t[activeConverter] || activeConverter)" class="converter-input">
        </div>

        <!-- Conversion Results -->
        <div class="conversion-results">
          <div v-for="unit in converterUnits.filter(u => u !== activeConverter)" :key="unit" class="result-row">
            <span class="result-label">{{ t[unit] }}:</span>
            <span class="result-value">{{ convertUnit(converterInput, activeConverter, unit) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Price by Unit -->
    <div class="price-by-unit">
      <h2>{{ t.priceByUnit }}</h2>
      <div v-if="goldPrice" class="unit-grid">
        <div class="unit-card">
          <span class="unit-name">{{ t.li }}</span>
          <span class="unit-price">${{ getPriceForConverterAmount('li') }}</span>
          <span class="unit-weight">{{ getConverterAmountForUnit('li') }} (0.0375g each)</span>
        </div>
        <div class="unit-card">
          <span class="unit-name">{{ t.hun }}</span>
          <span class="unit-price">${{ getPriceForConverterAmount('hun') }}</span>
          <span class="unit-weight">{{ getConverterAmountForUnit('hun') }} (0.375g each)</span>
        </div>
        <div class="unit-card">
          <span class="unit-name">{{ t.chi }}</span>
          <span class="unit-price">${{ getPriceForConverterAmount('chi') }}</span>
          <span class="unit-weight">{{ getConverterAmountForUnit('chi') }} (3.75g each)</span>
        </div>
        <div class="unit-card">
          <span class="unit-name">{{ t.gram }}</span>
          <span class="unit-price">${{ getPriceForConverterAmount('gram') }}</span>
          <span class="unit-weight">{{ getConverterAmountForUnit('gram') }} (1g each)</span>
        </div>
        <div class="unit-card">
          <span class="unit-name">{{ t.damlung }}</span>
          <span class="unit-price">${{ getPriceForConverterAmount('damlung') }}</span>
          <span class="unit-weight">{{ getConverterAmountForUnit('damlung') }} (37.5g each)</span>
        </div>
        <div class="unit-card">
          <span class="unit-name">{{ t.troyOunce }}</span>
          <span class="unit-price">${{ getPriceForConverterAmount('troyOz') }}</span>
          <span class="unit-weight">{{ getConverterAmountForUnit('troyOz') }} (31.1035g each)</span>
        </div>
      </div>
      <div v-else class="no-price-message">
        {{ t.fetchPriceFirst }}
      </div>
    </div>

    <!-- My Purchases -->
    <div class="purchases-section">
      <div class="purchases-header">
        <h2>{{ t.myPurchases }}</h2>
        <button @click="showAddForm = !showAddForm" class="add-btn">
          {{ showAddForm ? t.cancel : t.addPurchase }}
        </button>
      </div>

      <!-- Add Purchase Form -->
      <div v-if="showAddForm" class="purchase-form">
        <div class="form-row">
          <div class="form-group">
            <label>{{ t.metal }}</label>
            <select v-model="newPurchase.metal">
              <option value="gold">🥇 {{ t.gold }}</option>
              <option value="silver">🥈 {{ t.silver }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ t.weight }}</label>
            <input v-model.number="newPurchase.weight" type="text" inputmode="decimal" :placeholder="t.enterWeight">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ t.unit }}</label>
            <select v-model="newPurchase.unit">
              <option value="gram">{{ t.gram }}</option>
              <option value="li">{{ t.li }}</option>
              <option value="hun">{{ t.hun }}</option>
              <option value="chi">{{ t.chi }}</option>
              <option value="damlung">{{ t.damlung }}</option>
              <option value="troyOz">{{ t.troyOunce }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ t.pricePaid }}</label>
            <input v-model.number="newPurchase.price" type="text" inputmode="decimal" :placeholder="t.enterPrice">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ t.date }}</label>
            <input v-model="newPurchase.date" type="date">
          </div>
        </div>

        <button @click="addPurchase" class="submit-btn">
          {{ t.save }}
        </button>
      </div>

      <!-- Purchase Cards Grid -->
      <div v-if="purchases.length > 0" class="purchases-grid">
        <div v-for="(purchase, index) in purchases" :key="index" class="purchase-card">
          <div v-if="editingIndex !== index">
            <div class="card-header">
              <span class="card-weight">
                {{ purchase.metal === 'silver' ? '🥈' : '🥇' }} 
                {{ purchase.weight }} {{ t[purchase.unit] }}
              </span>
              <div class="card-actions">
                <button @click="editPurchase(index)" class="icon-btn">✏️</button>
                <button @click="deletePurchase(index)" class="icon-btn">🗑️</button>
              </div>
            </div>
            <div class="card-detail">
              <span class="detail-label">{{ t.paid }}:</span>
              <span class="detail-value">${{ purchase.price.toFixed(2) }}</span>
            </div>
            <div class="card-detail">
              <span class="detail-label">{{ t.current }}:</span>
              <span class="detail-value">${{ calculateCurrentValue(purchase).toFixed(2) }}</span>
            </div>
            <div class="card-detail">
              <span class="detail-label">{{ t.gainLoss }}:</span>
              <span :class="['detail-value', getGainLossClass(purchase)]">
                ${{ calculateGainLoss(purchase).toFixed(2) }}
              </span>
            </div>
            <div class="card-date">{{ formatDate(purchase.date) }}</div>
          </div>

          <!-- Edit Mode -->
          <div v-else class="edit-form">
            <div class="form-row">
              <select v-model="editForm.metal">
                <option value="gold">🥇 {{ t.gold }}</option>
                <option value="silver">🥈 {{ t.silver }}</option>
              </select>
              <input v-model.number="editForm.weight" type="text" inputmode="decimal" :placeholder="t.weight">
              <select v-model="editForm.unit">
                <option value="gram">{{ t.gram }}</option>
                <option value="li">{{ t.li }}</option>
                <option value="hun">{{ t.hun }}</option>
                <option value="chi">{{ t.chi }}</option>
                <option value="damlung">{{ t.damlung }}</option>
                <option value="troyOz">{{ t.troyOunce }}</option>
              </select>
            </div>
            <div class="form-row">
              <input v-model.number="editForm.price" type="text" inputmode="decimal" :placeholder="t.pricePaid">
              <input v-model="editForm.date" type="date">
            </div>
            <div class="edit-actions">
              <button @click="saveEdit" class="save-btn">{{ t.save }}</button>
              <button @click="cancelEdit" class="cancel-btn">{{ t.cancel }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Portfolio Summary -->
      <div v-if="purchases.length > 0" class="portfolio-summary">
        <h3>{{ t.portfolioSummary }}</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">{{ t.totalInvested }}:</span>
            <span class="summary-value">${{ totalInvested.toFixed(2) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">{{ t.currentValue }}:</span>
            <span class="summary-value">${{ totalCurrentValue.toFixed(2) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">{{ t.totalGainLoss }}:</span>
            <span :class="['summary-value', totalGainLoss >= 0 ? 'gain' : 'loss']">
              ${{ totalGainLoss.toFixed(2) }}
            </span>
          </div>
        </div>
        <button @click="exportToCSV" class="export-btn">
          {{ t.exportCSV }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      currentLang: 'en',
      goldPrice: null,
      silverPrice: null,
      lastUpdated: '',
      loading: false,
      error: null,
      isOnline: typeof navigator !== 'undefined' && navigator.onLine !== undefined ? navigator.onLine : true,
      priceInputMethod: 'troyOz',
      customPrice: null,
      customApiUrl: '',
      activeMetal: 'gold', // 'gold' or 'silver'
      defaultApiKey: 'goldapi-mrhsckltl63qs2h5-io', // Working demo key
      apiCopied: false,

      // Converter state
      activeConverter: 'gram',
      converterInput: 1,
      converterUnits: ['li', 'hun', 'chi', 'gram', 'damlung', 'troyOz'],

      // Purchases
      showAddForm: false,
      purchases: [],
      editingIndex: null,
      editForm: {},
      newPurchase: {
        weight: '',
        unit: 'gram',
        metal: 'gold',
        price: '',
        date: new Date().toISOString().split('T')[0]
      },

      // Conversion constants
      TROY_OZ_TO_GRAM: 31.1035,
      DAMLUNG_TO_GRAM: 37.5,
      CHI_TO_GRAM: 3.75,
      HUN_TO_GRAM: 0.375,
      LI_TO_GRAM: 0.0375,

      // Translations
      translations: {
        en: {
          title: 'Gold & Silver Tracker',
          currentPrice: 'Current Prices',
          refreshNow: 'Refresh Now',
          setPrice: 'Set Price',
          loading: 'Loading...',
          perTroyOz: 'per Troy Oz',
          lastUpdated: 'Last updated',
          priceByUnit: 'Price by Unit',
          unitConverter: 'Unit Converter',
          from: 'From',
          myPurchases: 'My Purchases',
          addPurchase: '+ Add Purchase',
          cancel: 'Cancel',
          weight: 'Weight',
          unit: 'Unit',
          metal: 'Metal',
          pricePaid: 'Price Paid',
          date: 'Date',
          accountNumber: 'Account Number',
          referenceNumber: 'Reference Number',
          save: 'Save',
          paid: 'Paid',
          current: 'Current',
          gainLoss: 'Gain/Loss',
          portfolioSummary: 'Portfolio Summary',
          totalInvested: 'Total Invested',
          currentValue: 'Current Value',
          totalGainLoss: 'Total Gain/Loss',
          exportCSV: 'Export to CSV',
          enterWeight: 'Enter weight',
          enterPrice: 'Enter price',
          enterAccountNumber: 'Optional',
          enterReferenceNumber: 'Optional',
          gram: 'Gram',
          li: 'Li',
          hun: 'Hun',
          chi: 'Chi',
          damlung: 'Damlung',
          troyOunce: 'Troy Oz',
          troyOz: 'Troy Oz',
          setPriceBy: 'Set Price By',
          customPrice: 'Custom Price',
          enterCustomPrice: 'Enter price',
          customAPIUrl: 'Custom API Key (Optional)',
          enterAPIUrl: 'Paste your API key here (optional)',
          saveAPI: 'Save API',
          getAPIKey: '🔑 Get Your Own Free Key',
          usingCustomAPI: 'Using custom Gold API key',
          usingFreeAPI: 'Using free community API (limited rates)',
          freeAPIAvailable: 'Free Demo API Key Available',
          copy: 'Copy',
          copied: 'Copied!',
          apiInstructions: 'Copy this key and paste above, then click Save API. This gives you 100 free requests.',
          offlineWarning: '⚠️ You are offline. Data may be outdated.',
          fetchPriceFirst: 'Please fetch prices first',
          gold: 'Gold',
          silver: 'Silver',
        },
        km: {
          title: 'តាមដានតម្លៃមាស និងប្រាក់',
          currentPrice: 'តម្លៃបច្ចុប្បន្ន',
          refreshNow: 'តម្លៃឥឡូវនេះ',
          setPrice: 'កំណត់តម្លៃ',
          loading: 'កំពុងផ្ទុក...',
          perTroyOz: 'ក្នុងមួយត្រយ អោន',
          lastUpdated: 'បានធ្វើបច្ចុប្បន្នភាពចុងក្រោយ',
          priceByUnit: 'តម្លៃតាមឯកតា',
          unitConverter: 'បម្លែងឯកតា',
          from: 'ពី',
          myPurchases: 'ការទិញរបស់ខ្ញុំ',
          addPurchase: '+ បន្ថែមការទិញ',
          cancel: 'បោះបង់',
          weight: 'ទម្ងន់',
          unit: 'ឯកតា',
          metal: 'លោហៈ',
          pricePaid: 'តម្លៃបានបង់',
          date: 'កាលបរិច្ឆេទ',
          accountNumber: 'លេខគណនី',
          referenceNumber: 'លេខយោង',
          save: 'រក្សាទុក',
          paid: 'បានបង់',
          current: 'បច្ចុប្បន្ន',
          gainLoss: 'ប្រាក់ចំណេញ/ខាត',
          portfolioSummary: 'សង្ខេបផលវិនិយោគ',
          totalInvested: 'សរុបវិនិយោគ',
          currentValue: 'តម្លៃបច្ចុប្បន្ន',
          totalGainLoss: 'សរុបចំណេញ/ខាត',
          exportCSV: 'នាំចេញជា CSV',
          enterWeight: 'បញ្ចូលទម្ងន់',
          enterPrice: 'បញ្ចូលតម្លៃ',
          enterAccountNumber: 'ស្រេចចិត្ត',
          enterReferenceNumber: 'ស្រេចចិត្ត',
          gram: 'ក្រាម',
          li: 'លី',
          hun: 'ហុន',
          chi: 'ជី',
          damlung: 'ដំឡឹង',
          troyOunce: 'ត្រយ អោន',
          troyOz: 'ត្រយ អោន',
          setPriceBy: 'កំណត់តម្លៃតាម',
          customPrice: 'តម្លៃផ្ទាល់ខ្លួន',
          enterCustomPrice: 'បញ្ចូលតម្លៃ',
          customAPIUrl: 'គន្លឹះ API ផ្ទាល់ខ្លួន (ស្រេចចិត្ត)',
          enterAPIUrl: 'បិទភ្ជាប់គន្លឹះ API របស់អ្នកនៅទីនេះ (ស្រេចចិត្ត)',
          saveAPI: 'រក្សាទុក API',
          getAPIKey: '🔑 ទទួលបានគន្លឹះឥតគិតថ្លៃរបស់អ្នក',
          usingCustomAPI: 'កំពុងប្រើគន្លឹះ Gold API ផ្ទាល់ខ្លួន',
          usingFreeAPI: 'កំពុងប្រើ API សហគមន៍ឥតគិតថ្លៃ (អត្រាកំណត់)',
          freeAPIAvailable: 'មានគន្លឹះ API ដេមូឥតគិតថ្លៃ',
          copy: 'ចម្លង',
          copied: 'បានចម្លង!',
          apiInstructions: 'ចម្លងគន្លឹះនេះ និងបិទភ្ជាប់ខាងលើ បន្ទាប់មកចុចរក្សាទុក API។ វាផ្តល់ឱ្យអ្នកនូវសំណើ 100 ដងឥតគិតថ្លៃ។',
          offlineWarning: '⚠️ អ្នកស្ថិតក្រៅបណ្តាញ។ ទិន្នន័យអាចចាស់។',
          fetchPriceFirst: 'សូមទាញយកតម្លៃជាមុនសិន',
          gold: 'មាស',
          silver: 'ប្រាក់',
        }
      }
    }
  },

  computed: {
    t() {
      return this.translations[this.currentLang]
    },

    pricePerGram() {
      if (!this.goldPrice) return 0
      return this.goldPrice / this.TROY_OZ_TO_GRAM
    },

    pricePerDamlung() {
      return this.pricePerGram * this.DAMLUNG_TO_GRAM
    },

    pricePerChi() {
      return this.pricePerGram * this.CHI_TO_GRAM
    },

    pricePerHun() {
      return this.pricePerGram * this.HUN_TO_GRAM
    },

    pricePerLi() {
      return this.pricePerGram * this.LI_TO_GRAM
    },

    // Silver prices per unit
    silverPricePerGram() {
      if (!this.silverPrice) return 0
      return this.silverPrice / this.TROY_OZ_TO_GRAM
    },

    silverPricePerDamlung() {
      return this.silverPricePerGram * this.DAMLUNG_TO_GRAM
    },

    silverPricePerChi() {
      return this.silverPricePerGram * this.CHI_TO_GRAM
    },

    silverPricePerHun() {
      return this.silverPricePerGram * this.HUN_TO_GRAM
    },

    silverPricePerLi() {
      return this.silverPricePerGram * this.LI_TO_GRAM
    },

    // Current metal price based on active selection
    currentMetalPrice() {
      return this.activeMetal === 'gold' ? this.goldPrice : this.silverPrice
    },

    currentPricePerGram() {
      return this.activeMetal === 'gold' ? this.pricePerGram : this.silverPricePerGram
    },

    currentPricePerDamlung() {
      return this.activeMetal === 'gold' ? this.pricePerDamlung : this.silverPricePerDamlung
    },

    currentPricePerChi() {
      return this.activeMetal === 'gold' ? this.pricePerChi : this.silverPricePerChi
    },

    totalInvested() {
      return this.purchases.reduce((sum, p) => sum + p.price, 0)
    },

    totalCurrentValue() {
      return this.purchases.reduce((sum, p) => sum + this.calculateCurrentValue(p), 0)
    },

    totalGainLoss() {
      return this.totalCurrentValue - this.totalInvested
    }
  },

  mounted() {
    this.loadFromLocalStorage()
    this.fetchGoldPrice()
    this.setupNetworkListeners()
  },

  beforeDestroy() {
    this.removeNetworkListeners()
  },

  methods: {
    selectApiKey() {
      if (this.$refs.defaultApiInput) {
        this.$refs.defaultApiInput.select()
      }
    },

    async copyDefaultApi() {
      try {
        await navigator.clipboard.writeText(this.defaultApiKey)
        this.apiCopied = true
        setTimeout(() => {
          this.apiCopied = false
        }, 2000)
      } catch (err) {
        // Fallback for older browsers
        if (this.$refs.defaultApiInput) {
          this.$refs.defaultApiInput.select()
          document.execCommand('copy')
          this.apiCopied = true
          setTimeout(() => {
            this.apiCopied = false
          }, 2000)
        }
      }
    },

    useDefaultApi() {
      this.customApiUrl = this.defaultApiKey
      this.saveCustomApi()
    },

    setupNetworkListeners() {
      if (typeof window === 'undefined') return
      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)
    },

    removeNetworkListeners() {
      if (typeof window === 'undefined') return
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
    },

    handleOnline() {
      this.isOnline = true
      this.fetchGoldPrice()
    },

    handleOffline() {
      this.isOnline = false
    },

    toggleLanguage() {
      this.currentLang = this.currentLang === 'en' ? 'km' : 'en'
      this.saveToLocalStorage()
    },

    updateGoldPriceFromCustom() {
      if (!this.customPrice || this.customPrice <= 0) {
        alert(this.currentLang === 'en' ? 'Please enter a valid price' : 'សូមបញ្ចូលតម្លៃត្រឹមត្រូវ')
        return
      }

      // Convert custom price to Troy Oz price based on selected method
      if (this.priceInputMethod === 'troyOz') {
        this.goldPrice = this.customPrice
      } else if (this.priceInputMethod === 'damlung') {
        // Convert Damlung price to Troy Oz
        const pricePerGram = this.customPrice / this.DAMLUNG_TO_GRAM
        this.goldPrice = pricePerGram * this.TROY_OZ_TO_GRAM
      } else if (this.priceInputMethod === 'chi') {
        // Convert Chi price to Troy Oz
        const pricePerGram = this.customPrice / this.CHI_TO_GRAM
        this.goldPrice = pricePerGram * this.TROY_OZ_TO_GRAM
      }

      this.lastUpdated = new Date().toLocaleString() + ' (custom)'
      this.saveToLocalStorage()
    },

    saveCustomApi() {
      if (!this.customApiUrl || this.customApiUrl.trim() === '') {
        alert(this.currentLang === 'en' ? 'Please enter a valid API key' : 'សូមបញ្ចូលគន្លឹះ API ត្រឹមត្រូវ')
        return
      }

      this.saveToLocalStorage()
      alert(this.currentLang === 'en' ? 'API key saved! Click "Refresh Now" to fetch data with your key.' : 'រក្សាទុកគន្លឹះ API ហើយ! ចុច "តម្លៃឥឡូវនេះ" ដើម្បីទាញយកទិន្នន័យជាមួយគន្លឹះរបស់អ្នក។')
      
      // Automatically fetch prices with new key
      this.fetchGoldPrice()
    },

    getConverterAmountForUnit(unit) {
      // If converter is set to this unit, return the input value
      if (this.activeConverter === unit) {
        return this.converterInput || 1
      }
      // Otherwise convert from active converter to this unit
      return this.convertUnit(this.converterInput || 1, this.activeConverter, unit)
    },

    getPriceForConverterAmount(unit) {
      if (!this.goldPrice) return '0.00'

      const amount = parseFloat(this.getConverterAmountForUnit(unit))
      let pricePerUnit = 0

      switch (unit) {
        case 'li': pricePerUnit = this.pricePerLi; break
        case 'hun': pricePerUnit = this.pricePerHun; break
        case 'chi': pricePerUnit = this.pricePerChi; break
        case 'gram': pricePerUnit = this.pricePerGram; break
        case 'damlung': pricePerUnit = this.pricePerDamlung; break
        case 'troyOz': pricePerUnit = this.goldPrice; break
      }

      return (pricePerUnit * amount).toFixed(2)
    },

    getConverterOptions(unit) {
      const options = {
        li: [0.1, 0.5, 1, 2, 5, 10, 20, 50, 100],
        hun: [0.1, 0.5, 1, 2, 5, 10, 20, 50],
        chi: [0.1, 0.5, 1, 2, 5, 10, 20],
        gram: [1, 5, 10, 20, 50, 100, 200, 500],
        damlung: [0.5, 1, 2, 5, 10, 20, 50],
        troyOz: [0.5, 1, 2, 5, 10, 20, 50]
      }
      return options[unit] || [1]
    },

    convertUnit(value, fromUnit, toUnit) {
      // Convert to grams first
      let grams = 0
      switch (fromUnit) {
        case 'li': grams = value * this.LI_TO_GRAM; break
        case 'hun': grams = value * this.HUN_TO_GRAM; break
        case 'chi': grams = value * this.CHI_TO_GRAM; break
        case 'gram': grams = value; break
        case 'damlung': grams = value * this.DAMLUNG_TO_GRAM; break
        case 'troyOz': grams = value * this.TROY_OZ_TO_GRAM; break
      }

      // Convert from grams to target unit
      let result = 0
      switch (toUnit) {
        case 'li': result = grams / this.LI_TO_GRAM; break
        case 'hun': result = grams / this.HUN_TO_GRAM; break
        case 'chi': result = grams / this.CHI_TO_GRAM; break
        case 'gram': result = grams; break
        case 'damlung': result = grams / this.DAMLUNG_TO_GRAM; break
        case 'troyOz': result = grams / this.TROY_OZ_TO_GRAM; break
      }

      return result.toFixed(4)
    },

    async fetchGoldPrice() {
      this.loading = true
      this.error = null

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)

        let headers = {
          'Accept': 'application/json'
        }

        // Use custom API key OR default API key OR free API
        if (this.customApiUrl && this.customApiUrl.trim() !== '') {
          // Custom Gold API with user's key
          const input = this.customApiUrl.trim()
          let apiKey = input
          
          if (input.startsWith('http')) {
            const match = input.match(/goldapi-([a-z0-9]+)\.io/)
            if (match) {
              apiKey = `goldapi-${match[1]}-io`
            }
          }
          
          headers['x-access-token'] = apiKey
          
          // Fetch both gold and silver from Gold API
          await Promise.all([
            this.fetchMetalPrice('https://www.goldapi.io/api/XAU/USD', headers, 'gold'),
            this.fetchMetalPrice('https://www.goldapi.io/api/XAG/USD', headers, 'silver')
          ])
        } else if (this.defaultApiKey) {
          // Use default API key for first-time users
          headers['x-access-token'] = this.defaultApiKey
          
          console.log('Using default API key for new users')
          
          // Fetch both gold and silver from Gold API
          await Promise.all([
            this.fetchMetalPrice('https://www.goldapi.io/api/XAU/USD', headers, 'gold'),
            this.fetchMetalPrice('https://www.goldapi.io/api/XAG/USD', headers, 'silver')
          ])
        } else {
          // Try free alternative APIs (no auth required)
          const apiUrl = 'https://api.metals.live/v1/spot'

          console.log('Fetching from:', apiUrl)

          const response = await fetch(apiUrl, {
            signal: controller.signal,
            headers: headers
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            console.log('Primary API failed, trying fallback...')
            return await this.fetchFromFallbackAPI(controller)
          }

          const data = await response.json()
          console.log('API Response:', data)

          // metals.live returns array of metals
          if (Array.isArray(data)) {
            const gold = data.find(m => m.metal === 'gold')
            const silver = data.find(m => m.metal === 'silver')
            
            if (gold && gold.price) {
              this.goldPrice = gold.price
            }
            if (silver && silver.price) {
              this.silverPrice = silver.price
            }
            
            if (this.goldPrice || this.silverPrice) {
              this.lastUpdated = new Date().toLocaleString()
              this.saveToLocalStorage()
              this.error = null
            } else {
              throw new Error('Unable to parse prices from API response')
            }
          } else {
            throw new Error('Unexpected API response format')
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          this.error = 'Request timeout. Please try again.'
        } else {
          this.error = `Failed to fetch: ${err.message}`
          console.error('API Error:', err)
        }

        // Try to load from localStorage as fallback
        const saved = this.safeGetLocalStorage('goldTrackerData')
        if (saved) {
          try {
            const data = JSON.parse(saved)
            if (data.goldPrice) {
              this.goldPrice = data.goldPrice
            }
            if (data.silverPrice) {
              this.silverPrice = data.silverPrice
            }
            if (this.goldPrice || this.silverPrice) {
              this.lastUpdated = data.lastUpdated + ' (cached)'
              if (!this.error.includes('cached')) {
                this.error += ' - Using cached data'
              }
            }
          } catch (e) {
            console.error('Error loading cache:', e)
          }
        }
      } finally {
        this.loading = false
      }
    },

    async fetchMetalPrice(url, headers, metalType) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        
        console.log(`Fetching ${metalType} from:`, url)
        
        const response = await fetch(url, {
          signal: controller.signal,
          headers: headers
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const data = await response.json()
          console.log(`${metalType} API Response:`, data)
          
          if (data && data.price) {
            if (metalType === 'gold') {
              this.goldPrice = data.price
            } else if (metalType === 'silver') {
              this.silverPrice = data.price
            }
            this.lastUpdated = new Date().toLocaleString()
            this.saveToLocalStorage()
          }
        }
      } catch (err) {
        console.error(`Error fetching ${metalType}:`, err)
      }
    },

    async fetchFromFallbackAPI(controller) {
      try {
        // Try alternative free API - gold-api.com (different from goldapi.io)
        const fallbackUrl = 'https://www.goldapi.io/api/XAU/USD/20250101' // Historical endpoint that's free
        
        console.log('Trying fallback API...')
        
        const response = await fetch(fallbackUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Fallback API Response:', data)
          
          if (data.price) {
            this.goldPrice = data.price
            this.lastUpdated = new Date().toLocaleString() + ' (free API)'
            this.saveToLocalStorage()
            return
          }
        }
        
        throw new Error('All APIs failed')
      } catch (err) {
        throw new Error('Unable to fetch from any API')
      }
    },

    addPurchase() {
      if (!this.newPurchase.weight || !this.newPurchase.price) {
        alert(this.currentLang === 'en' ? 'Please fill in weight and price' : 'សូមបំពេញទម្ងន់ និងតម្លៃ')
        return
      }

      this.purchases.push({
        ...this.newPurchase,
        id: Date.now()
      })

      this.newPurchase = {
        weight: '',
        unit: 'gram',
        metal: 'gold',
        price: '',
        date: new Date().toISOString().split('T')[0]
      }

      this.showAddForm = false
      this.saveToLocalStorage()
    },

    editPurchase(index) {
      this.editingIndex = index
      this.editForm = { ...this.purchases[index] }
    },

    saveEdit() {
      if (!this.editForm.weight || !this.editForm.price) {
        alert(this.currentLang === 'en' ? 'Please fill in weight and price' : 'សូមបំពេញទម្ងន់ និងតម្លៃ')
        return
      }

      this.purchases[this.editingIndex] = { ...this.editForm }
      this.editingIndex = null
      this.editForm = {}
      this.saveToLocalStorage()
    },

    cancelEdit() {
      this.editingIndex = null
      this.editForm = {}
    },

    deletePurchase(index) {
      if (confirm(this.currentLang === 'en' ? 'Delete this purchase?' : 'លុបការទិញនេះ?')) {
        this.purchases.splice(index, 1)
        this.saveToLocalStorage()
      }
    },

    calculateCurrentValue(purchase) {
      const metal = purchase.metal || 'gold' // Default to gold for old purchases
      const currentPrice = metal === 'gold' ? this.goldPrice : this.silverPrice
      
      if (!currentPrice) return 0

      let grams = 0
      switch (purchase.unit) {
        case 'li': grams = purchase.weight * this.LI_TO_GRAM; break
        case 'hun': grams = purchase.weight * this.HUN_TO_GRAM; break
        case 'chi': grams = purchase.weight * this.CHI_TO_GRAM; break
        case 'gram': grams = purchase.weight; break
        case 'damlung': grams = purchase.weight * this.DAMLUNG_TO_GRAM; break
        case 'troyOz': grams = purchase.weight * this.TROY_OZ_TO_GRAM; break
      }

      const pricePerGram = currentPrice / this.TROY_OZ_TO_GRAM
      return pricePerGram * grams
    },

    calculateGainLoss(purchase) {
      return this.calculateCurrentValue(purchase) - purchase.price
    },

    getGainLossClass(purchase) {
      const gainLoss = this.calculateGainLoss(purchase)
      return gainLoss >= 0 ? 'gain' : 'loss'
    },

    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    },

    exportToCSV() {
      const headers = [
        this.t.date,
        this.t.weight,
        this.t.unit,
        this.t.pricePaid,
        this.t.currentValue,
        this.t.gainLoss,
        'Status'
      ]

      const rows = this.purchases.map(p => {
        const currentValue = this.calculateCurrentValue(p)
        const gainLoss = currentValue - p.price
        const status = gainLoss >= 0 ? 'GAIN' : 'LOSS'

        return [
          p.date,
          p.weight,
          this.t[p.unit] || p.unit,
          p.price.toFixed(2),
          currentValue.toFixed(2),
          gainLoss.toFixed(2),
          status
        ].map(cell => {
          const str = String(cell)
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
        })
      })

      const summary = [
        '',
        '',
        '',
        this.totalInvested.toFixed(2),
        this.totalCurrentValue.toFixed(2),
        this.totalGainLoss.toFixed(2),
        this.totalGainLoss >= 0 ? 'GAIN' : 'LOSS'
      ]

      const csv = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
        '',
        ['TOTALS', '', '', ...summary.slice(3)].join(',')
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `gold-tracker-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    },

    safeGetLocalStorage(key) {
      try {
        return localStorage.getItem(key)
      } catch (e) {
        console.warn('localStorage not available:', e)
        return null
      }
    },

    safeSetLocalStorage(key, value) {
      try {
        localStorage.setItem(key, value)
      } catch (e) {
        console.warn('localStorage not available:', e)
      }
    },

    saveToLocalStorage() {
      const data = {
        currentLang: this.currentLang,
        goldPrice: this.goldPrice,
        silverPrice: this.silverPrice,
        lastUpdated: this.lastUpdated,
        purchases: this.purchases,
        priceInputMethod: this.priceInputMethod,
        customPrice: this.customPrice,
        customApiUrl: this.customApiUrl,
        activeMetal: this.activeMetal
      }
      this.safeSetLocalStorage('goldTrackerData', JSON.stringify(data))
    },

    loadFromLocalStorage() {
      const saved = this.safeGetLocalStorage('goldTrackerData')
      if (saved) {
        try {
          const data = JSON.parse(saved)
          this.currentLang = data.currentLang || 'en'
          this.goldPrice = data.goldPrice
          this.silverPrice = data.silverPrice
          this.lastUpdated = data.lastUpdated
          this.purchases = data.purchases || []
          this.priceInputMethod = data.priceInputMethod || 'troyOz'
          this.customPrice = data.customPrice || null
          this.customApiUrl = data.customApiUrl || ''
          this.activeMetal = data.activeMetal || 'gold'
        } catch (e) {
          console.error('Error loading from localStorage:', e)
        }
      }
    }
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.gold-tracker {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  padding: env(safe-area-inset-top, 0) env(safe-area-inset-right, 0) env(safe-area-inset-bottom, 0) env(safe-area-inset-left, 0);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 3px solid #64748b;
}

.header h1 {
  font-size: 24px;
  color: #334155;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.lang-btn {
  background: #64748b;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.lang-btn:hover {
  background: #475569;
  transform: scale(1.05);
}

.network-warning {
  background: #fef3c7;
  color: #78350f;
  padding: 12px 20px;
  text-align: center;
  font-size: 14px;
  border-bottom: 2px solid #fde68a;
}

.custom-api-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #e2e8f0;
}

.default-api-info {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 2px solid #3b82f6;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.info-header {
  font-size: 14px;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.api-copy-box {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.api-copy-input {
  flex: 1;
  padding: 10px;
  border: 2px solid #3b82f6;
  border-radius: 6px;
  font-size: 13px;
  font-family: 'Courier New', monospace;
  color: #1e40af;
  background: white;
  font-weight: 600;
  cursor: pointer;
}

.api-copy-input:focus {
  outline: none;
  border-color: #2563eb;
  background: #eff6ff;
}

.copy-api-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: 90px;
}

.copy-api-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.copy-api-btn:active {
  transform: translateY(0);
}

.api-instructions {
  font-size: 12px;
  color: #1e40af;
  line-height: 1.5;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 4px;
}

.api-note-default {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #059669;
  font-style: italic;
}

.custom-api-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #e2e8f0;
}

.api-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.custom-api-section label {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin: 0;
}

.api-link {
  color: #8b5cf6;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  padding: 4px 10px;
  border-radius: 4px;
  background: #f3e8ff;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.api-link:hover {
  background: #e9d5ff;
  color: #7c3aed;
}

.api-input-row {
  display: flex;
  gap: 8px;
}

.api-input {
  flex: 1;
  padding: 10px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #334155;
  background: white;
}

.api-input:focus {
  outline: none;
  border-color: #64748b;
}

.save-api-btn {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.save-api-btn:hover {
  background: #7c3aed;
}

.api-note {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #8b5cf6;
  font-style: italic;
}

.price-section,
.price-method-section,
.converter-section,
.price-by-unit,
.purchases-section {
  background: white;
  margin: 20px;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.price-section h2,
.price-method-section h3,
.converter-section h2,
.price-by-unit h2,
.purchases-section h2 {
  color: #334155;
  margin-bottom: 16px;
  font-size: 20px;
}

.price-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.refresh-btn {
  background: #64748b;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #475569;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.price-display {
  text-align: center;
}

.metal-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.metal-btn {
  flex: 1;
  padding: 12px;
  background: #f1f5f9;
  color: #334155;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.metal-btn:hover {
  background: #e2e8f0;
  transform: translateY(-2px);
}

.metal-btn.active {
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
  color: white;
  border-color: #475569;
  box-shadow: 0 4px 12px rgba(100, 116, 139, 0.3);
}

.price-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.price-card {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.3s;
}

.price-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.price-card.active {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-color: #3b82f6;
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
}

.card-label {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}

.price-card.active .card-label {
  color: #1e40af;
}

.price-display {
  text-align: center;
}

.price-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.price-value {
  font-size: 48px;
  font-weight: 700;
  color: #334155;
}

.price-unit {
  font-size: 16px;
  color: #475569;
}

.price-meta {
  color: #64748b;
  font-size: 14px;
}

.error-message {
  background: #fee2e2;
  color: #991b1b;
  padding: 12px;
  border-radius: 6px;
  margin-top: 12px;
  font-size: 14px;
}

/* Price Method Toggle */
.price-method-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.custom-price-input {
  margin-bottom: 16px;
}

.custom-price-input label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}

.price-input-row {
  display: flex;
  gap: 8px;
}

.price-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 16px;
  color: #334155;
  background: white;
}

.price-input:focus {
  outline: none;
  border-color: #64748b;
}

.set-price-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.set-price-btn:hover {
  background: #059669;
}

.method-btn {
  flex: 1;
  padding: 12px;
  background: #f1f5f9;
  color: #334155;
  border: 2px solid transparent;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.method-btn:hover {
  background: #e2e8f0;
}

.method-btn.active {
  background: #64748b;
  color: white;
  border-color: #475569;
}

.price-preview {
  background: #f8fafc;
  padding: 16px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-header {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.preview-label {
  color: #64748b;
  font-weight: 600;
}

.preview-value {
  color: #334155;
  font-weight: 700;
}

/* Combined Converter */
.converter-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 20px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-btn {
  padding: 8px 16px;
  background: #f1f5f9;
  color: #334155;
  border: 2px solid transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: #e2e8f0;
}

.tab-btn.active {
  background: #64748b;
  color: white;
  border-color: #475569;
}

.converter-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.converter-input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.converter-input-group label {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
}

.converter-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 16px;
  color: #334155;
  background: white;
}

.converter-input:focus {
  outline: none;
  border-color: #64748b;
}

.converter-select {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 16px;
  color: #334155;
  background: white;
  -webkit-appearance: none;
  appearance: none;
}

.converter-select:focus {
  outline: none;
  border-color: #64748b;
}

.conversion-results {
  background: #f8fafc;
  padding: 16px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e2e8f0;
}

.result-row:last-child {
  border-bottom: none;
}

.result-label {
  color: #64748b;
  font-weight: 600;
  font-size: 14px;
}

.result-value {
  color: #334155;
  font-weight: 700;
  font-size: 14px;
}

/* Price by Unit */
.unit-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.unit-card {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 16px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 2px solid #e2e8f0;
}

.no-price-message {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
  font-size: 16px;
  background: #f1f5f9;
  border-radius: 8px;
}

.unit-name {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
}

.unit-price {
  font-size: 20px;
  font-weight: 700;
  color: #334155;
}

.unit-weight {
  font-size: 12px;
  color: #94a3b8;
}

/* Purchases */
.purchases-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.add-btn {
  background: #64748b;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  background: #475569;
}

.purchase-form {
  background: #f8fafc;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}

.form-group input,
.form-group select {
  padding: 10px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 16px;
  color: #334155;
  background: white;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #64748b;
}

.submit-btn {
  width: 100%;
  background: #64748b;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover {
  background: #475569;
}

.purchases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.purchase-card {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 16px;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-weight {
  font-size: 16px;
  font-weight: 700;
  color: #334155;
}

.card-actions {
  display: flex;
  gap: 6px;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  transition: transform 0.2s;
}

.icon-btn:hover {
  transform: scale(1.2);
}

.card-detail {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
}

.detail-label {
  color: #64748b;
  font-weight: 600;
}

.detail-value {
  color: #334155;
  font-weight: 700;
}

.detail-value.gain {
  color: #16a34a;
}

.detail-value.loss {
  color: #dc2626;
}

.card-reference {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
  font-size: 12px;
}

.ref-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.ref-label {
  color: #94a3b8;
  font-weight: 600;
}

.ref-value {
  color: #64748b;
}

.card-date {
  margin-top: 8px;
  font-size: 11px;
  color: #94a3b8;
  text-align: right;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-form input,
.edit-form select {
  padding: 8px;
  border: 2px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
}

.edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.save-btn,
.cancel-btn {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.save-btn {
  background: #16a34a;
  color: white;
}

.cancel-btn {
  background: #dc2626;
  color: white;
}

.portfolio-summary {
  background: #f8fafc;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
}

.portfolio-summary h3 {
  color: #334155;
  margin-bottom: 16px;
  font-size: 18px;
}

.summary-grid {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 2px solid #e2e8f0;
}

.summary-label {
  color: #64748b;
  font-weight: 600;
  font-size: 14px;
}

.summary-value {
  color: #334155;
  font-weight: 700;
  font-size: 16px;
}

.summary-value.gain {
  color: #16a34a;
}

.summary-value.loss {
  color: #dc2626;
}

.export-btn {
  width: 100%;
  background: #64748b;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.export-btn:hover {
  background: #475569;
}

/* Mobile Optimization */
@media (max-width: 768px) {

  .price-section,
  .price-method-section,
  .converter-section,
  .price-by-unit,
  .purchases-section {
    margin: 12px 0;
    padding: 16px;
    border-radius: 0;
  }

  .header {
    padding: 16px;
  }

  .header h1 {
    font-size: 20px;
  }

  .price-value {
    font-size: 36px;
  }

  .unit-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .purchases-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .purchase-card {
    padding: 12px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 769px) {
  .unit-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .purchases-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (min-width: 1024px) {
  .gold-tracker {
    padding: 20px;
  }

  .price-section,
  .price-method-section,
  .converter-section,
  .price-by-unit,
  .purchases-section {
    max-width: 1200px;
    margin: 20px auto;
  }

  .unit-grid {
    grid-template-columns: repeat(6, 1fr);
  }

  .purchases-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}
</style>