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
      <!-- Price Source Toggle -->
      <div class="price-source-toggle">
        <button @click="priceSource = 'api'" :class="['source-btn', { active: priceSource === 'api' }]">
          🌐 API Prices
        </button>
        <button @click="priceSource = 'custom'" :class="['source-btn', { active: priceSource === 'custom' }]">
          ✏️ Custom Price
        </button>
      </div>

      <div class="price-header">
        <h2>{{ t.currentPrice }}</h2>
        <button v-if="priceSource === 'api'" @click="fetchGoldPrice" :disabled="loading" class="refresh-btn">
          <span v-if="!loading">🔄 {{ t.refreshNow }}</span>
          <span v-else class="loading-spinner">⏳ {{ t.loading }}</span>
        </button>
      </div>

      <!-- Loading Progress Bar -->
      <div v-if="loading" class="loading-bar">
        <div class="loading-progress"></div>
      </div>

      <!-- Success Message -->
      <div v-if="showSuccessMessage" class="success-message">
        ✅ {{ t.pricesUpdated }}
      </div>

      <div v-if="goldPrice" class="price-cards">
        <!-- Gold Price Card -->
        <div class="price-card active">
          <div class="card-label">🥇 {{ t.gold }}</div>
          <div class="price-main">
            <span class="price-value">${{ goldPrice.toFixed(2) }}</span>
            <span class="price-unit">{{ priceSource === 'api' ? t.perTroyOz : 'per ' + (priceInputMethod === 'troyOz' ?
        t.troyOunce : priceInputMethod === 'damlung' ? t.damlung : t.chi) }}</span>
          </div>
        </div>
      </div>

      <div v-if="lastUpdated && priceSource === 'api'" class="price-meta">
        <span class="last-updated">{{ t.lastUpdated }}: {{ lastUpdated }}</span>
      </div>

      <div v-if="error" class="error-message">
        <span class="error-icon">⚠️</span>
        <div class="error-content">
          <span class="error-text">{{ error }}</span>
          <button @click="fetchGoldPrice" class="error-retry-btn">Retry</button>
        </div>
      </div>
    </div>

    <!-- Price Input Method Toggle - Only show in Custom mode -->
    <div v-if="priceSource === 'custom'" class="price-method-section">
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
        <div class="preview-header">🥇 {{ t.gold }} {{ t.priceByUnit }}</div>
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

    <!-- API Configuration - Only show in API mode -->
    <div v-if="priceSource === 'api'" class="api-configuration-section">
      <div class="api-section-header">
        <h3>{{ t.customAPIUrl }}</h3>
        <p class="api-description">{{ t.usingFreeAPI }}</p>
      </div>

      <!-- Call to Action Card -->
      <div class="api-cta-card">
        <div class="cta-icon">🔑</div>
        <div class="cta-content">
          <h4>{{ t.getAPIKey }}</h4>
          <p>Get unlimited requests with your own free API key</p>
          <a href="https://www.goldapi.io/" target="_blank" rel="noopener noreferrer" class="cta-link">
            Visit goldapi.io →
          </a>
        </div>
      </div>

      <!-- API Key Input Section -->
      <div class="api-input-section">
        <label>{{ t.enterAPIUrl }}</label>
        <div class="api-input-row">
          <input v-model="customApiUrl" type="text" :placeholder="'Paste your API key here...'" class="api-input">
          <button @click="pasteFromClipboard" class="api-action-btn paste-btn" :title="t.pasteFromClipboard">
            <span class="btn-icon">📋</span>
            <span class="btn-text">Paste</span>
          </button>
        </div>

        <!-- Status Indicator -->
        <div v-if="customApiUrl" class="api-status success">
          <span class="status-icon">✓</span>
          <span class="status-text">API key ready</span>
          <button @click="clearApiUrl" class="status-clear">Clear</button>
        </div>
        <div v-else class="api-status default">
          <span class="status-icon">○</span>
          <span class="status-text">Using free API (no key needed)</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="api-action-buttons">
        <button @click="saveCustomApi" :disabled="!customApiUrl" class="api-save-btn">
          <span v-if="!customApiUrl" class="btn-disabled">No API key to save</span>
          <span v-else>✓ Save API Key</span>
        </button>
      </div>

      <!-- Info Box -->
      <div class="api-info-box">
        <span class="info-icon">ℹ️</span>
        <p>Your API key is saved locally on your device. Free tier gives you 100+ requests per month.</p>
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
          <span class="unit-weight">{{ getConverterAmountForUnit('li') }} (0.0375g)</span>
        </div>
        <div class="unit-card">
          <span class="unit-name">{{ t.hun }}</span>
          <span class="unit-price">${{ getPriceForConverterAmount('hun') }}</span>
          <span class="unit-weight">{{ getConverterAmountForUnit('hun') }} (0.375g)</span>
        </div>
        <div class="unit-card">
          <span class="unit-name">{{ t.chi }}</span>
          <span class="unit-price">${{ getPriceForConverterAmount('chi') }}</span>
          <span class="unit-weight">{{ getConverterAmountForUnit('chi') }} (3.75g)</span>
        </div>
        <div class="unit-card">
          <span class="unit-name">{{ t.gram }}</span>
          <span class="unit-price">${{ getPriceForConverterAmount('gram') }}</span>
          <span class="unit-weight">{{ getConverterAmountForUnit('gram') }} (1g)</span>
        </div>
        <div class="unit-card">
          <span class="unit-name">{{ t.damlung }}</span>
          <span class="unit-price">${{ getPriceForConverterAmount('damlung') }}</span>
          <span class="unit-weight">{{ getConverterAmountForUnit('damlung') }} (37.5g)</span>
        </div>
        <div class="unit-card">
          <span class="unit-name">{{ t.troyOunce }}</span>
          <span class="unit-price">${{ getPriceForConverterAmount('troyOz') }}</span>
          <span class="unit-weight">{{ getConverterAmountForUnit('troyOz') }} (31.1g)</span>
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
            <label>{{ t.weight }}</label>
            <input v-model.number="newPurchase.weight" type="text" inputmode="decimal" :placeholder="t.enterWeight">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ t.unit }}</label>
            <select v-model="newPurchase.unit">
              <option value="chi">{{ t.chi }}</option>
              <option value="damlung">{{ t.damlung }}</option>
              <option value="gram">{{ t.gram }}</option>
              <option value="hun">{{ t.hun }}</option>
              <option value="li">{{ t.li }}</option>
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
                🥇 {{ purchase.weight }} {{ t[purchase.unit] }}
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
              <div class="form-group">
                <label>{{ t.weight }}</label>
                <input v-model.number="editForm.weight" type="text" inputmode="decimal">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ t.unit }}</label>
                <select v-model="editForm.unit">
                  <option value="chi">{{ t.chi }}</option>
                  <option value="damlung">{{ t.damlung }}</option>
                  <option value="gram">{{ t.gram }}</option>
                  <option value="hun">{{ t.hun }}</option>
                  <option value="li">{{ t.li }}</option>
                  <option value="troyOz">{{ t.troyOunce }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ t.pricePaid }}</label>
                <input v-model.number="editForm.price" type="text" inputmode="decimal">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ t.date }}</label>
                <input v-model="editForm.date" type="date">
              </div>
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
      lastUpdated: '',
      loading: false,
      error: null,
      showSuccessMessage: false,
      isOnline: typeof navigator !== 'undefined' && navigator.onLine !== undefined ? navigator.onLine : true,
      priceInputMethod: 'troyOz',
      customPrice: null,
      customApiUrl: '',
      priceSource: 'api',  // 'api' or 'custom'
      defaultApiKey: '',
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
        unit: 'chi',
        metal: 'gold',  // Always gold
        price: '',
        date: new Date().toISOString().split('T')[0]
      },

      // Conversion constants
      TROY_OZ_TO_GRAM: 31.1035,
      DAMLUNG_TO_GRAM: 37.5,
      CHI_TO_GRAM: 3.75,
      HUN_TO_GRAM: 0.375,
      LI_TO_GRAM: 0.0375,

      // Translations (same as original)
      translations: {
        en: {
          title: 'Gold & Silver Tracker',
          currentPrice: 'Current Prices',
          refreshNow: 'Refresh Now',
          setPrice: 'Set Price',
          loading: 'Loading...',
          pricesUpdated: 'Prices updated successfully!',
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
          paste: 'Paste',
          pasteFromClipboard: 'Paste from clipboard',
          clearAPI: 'Clear API key',
          getAPIKey: '🔑 Get Your Own Free Key',
          usingCustomAPI: 'Using custom Gold API key',
          usingFreeAPI: 'Using free API (no key needed)',
          freeAPIAvailable: 'Want More Requests? Get Free API Key',
          copy: 'Copy',
          copied: 'Copied!',
          apiInstructions: 'Copy this key and paste above, then click Save API. This gives you 100 free requests.',
          apiInstructionsNew: 'Currently using free API (works without key). For 100+ requests/month, get your own free API key from goldapi.io above.',
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
          pricesUpdated: 'បានធ្វើបច្ចុប្បន្នភាពតម្លៃដោយជោគជ័យ!',
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
          paste: 'បិទភ្ជាប់',
          pasteFromClipboard: 'បិទភ្ជាប់ពីឃ្លីបបត',
          clearAPI: 'លុបគន្លឹះ API',
          getAPIKey: '🔑 ទទួលបានគន្លឹះឥតគិតថ្លៃរបស់អ្នក',
          usingCustomAPI: 'កំពុងប្រើគន្លឹះ Gold API ផ្ទាល់ខ្លួន',
          usingFreeAPI: 'កំពុងប្រើ API ឥតគិតថ្លៃ (មិនត្រូវការគន្លឹះ)',
          freeAPIAvailable: 'ចង់បានសំណើច្រើនទៀត? ទទួលគន្លឹះ API ឥតគិតថ្លៃ',
          copy: 'ចម្លង',
          copied: 'បានចម្លង!',
          apiInstructions: 'ចម្លងគន្លឹះនេះ និងបិទភ្ជាប់ខាងលើ បន្ទាប់មកចុចរក្សាទុក API។ វាផ្តល់ឱ្យអ្នកនូវសំណើ 100 ដងឥតគិតថ្លៃ។',
          apiInstructionsNew: 'បច្ចុប្បន្នកំពុងប្រើ API ឥតគិតថ្លៃ (ដំណើរការដោយគ្មានគន្លឹះ)។ សម្រាប់សំណើ 100+ ក្នុងមួយខែ ទទួលបានគន្លឹះ API ឥតគិតថ្លៃរបស់អ្នកពី goldapi.io ខាងលើ។',
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

    currentMetalPrice() {
      return this.goldPrice
    },

    currentPricePerGram() {
      return this.pricePerGram
    },

    currentPricePerDamlung() {
      return this.pricePerDamlung
    },

    currentPricePerChi() {
      return this.pricePerChi
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
        const textToCopy = 'Get your free API key at: https://www.goldapi.io/'
        await navigator.clipboard.writeText(textToCopy)
        this.apiCopied = true
        setTimeout(() => {
          this.apiCopied = false
        }, 2000)
      } catch (err) {
        const textToCopy = 'Get your free API key at: https://www.goldapi.io/'
        const tempInput = document.createElement('textarea')
        tempInput.value = textToCopy
        document.body.appendChild(tempInput)
        tempInput.select()
        document.execCommand('copy')
        document.body.removeChild(tempInput)
        this.apiCopied = true
        setTimeout(() => {
          this.apiCopied = false
        }, 2000)
      }
    },

    async pasteFromClipboard() {
      try {
        const text = await navigator.clipboard.readText()
        if (text && text.trim()) {
          this.customApiUrl = text.trim()
          console.log('Pasted from clipboard:', text)
        } else {
          alert(this.currentLang === 'en' ? 'Clipboard is empty' : 'ឃ្លីបបតទទេ')
        }
      } catch (err) {
        console.error('Failed to read clipboard:', err)
        alert(this.currentLang === 'en'
          ? 'Unable to access clipboard. Please paste manually (Ctrl+V or Cmd+V)'
          : 'មិនអាចចូលប្រើឃ្លីបបត។ សូមបិទភ្ជាប់ដោយដៃ (Ctrl+V ឬ Cmd+V)')
      }
    },

    clearApiUrl() {
      this.customApiUrl = ''
      this.saveToLocalStorage()
      console.log('API key cleared')
    },

    setActiveMetal(metal) {
      // No longer needed - only gold exists
      console.log('Metal toggle removed - only gold available')
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

      if (this.priceInputMethod === 'troyOz') {
        this.goldPrice = this.customPrice
      } else if (this.priceInputMethod === 'damlung') {
        const pricePerGram = this.customPrice / this.DAMLUNG_TO_GRAM
        this.goldPrice = pricePerGram * this.TROY_OZ_TO_GRAM
      } else if (this.priceInputMethod === 'chi') {
        const pricePerGram = this.customPrice / this.CHI_TO_GRAM
        this.goldPrice = pricePerGram * this.TROY_OZ_TO_GRAM
      }

      this.lastUpdated = new Date().toLocaleString() + ' (custom)'
      this.saveToLocalStorage()
    },

    saveCustomApi() {
      if (!this.customApiUrl || this.customApiUrl.trim() === '') {
        alert(this.currentLang === 'en' ? 'Please enter an API key first' : 'សូមបញ្ចូលគន្លឹះ API ជាមុនសិន')
        return
      }

      this.saveToLocalStorage()
      this.fetchGoldPrice()
    },

    getConverterAmountForUnit(unit) {
      if (this.activeConverter === unit) {
        return this.converterInput || 1
      }
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

    convertUnit(value, fromUnit, toUnit) {
      let grams = 0
      switch (fromUnit) {
        case 'li': grams = value * this.LI_TO_GRAM; break
        case 'hun': grams = value * this.HUN_TO_GRAM; break
        case 'chi': grams = value * this.CHI_TO_GRAM; break
        case 'gram': grams = value; break
        case 'damlung': grams = value * this.DAMLUNG_TO_GRAM; break
        case 'troyOz': grams = value * this.TROY_OZ_TO_GRAM; break
      }

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

        let success = false

        // Try free API first (metals.live)
        if (!success) {
          console.log('Trying metals.live API...')

          try {
            const response = await fetch('https://api.metals.live/v1/spot', {
              signal: controller.signal,
              headers: headers,
              mode: 'cors'
            })

            if (response.ok) {
              const data = await response.json()
              console.log('metals.live response:', data)

              if (data && typeof data === 'object') {
                // Response might be: {gold: {...}, silver: {...}} or [{metal: 'gold', ...}]
                let goldPrice = null

                if (Array.isArray(data)) {
                  // Array format
                  const goldData = data.find(m => m.metal === 'gold')
                  goldPrice = goldData?.price
                } else if (data.gold) {
                  // Object format: {gold: {price: ...}, silver: {...}}
                  goldPrice = data.gold.price
                }

                if (goldPrice) {
                  this.goldPrice = goldPrice
                  this.lastUpdated = new Date().toLocaleString()
                  this.saveToLocalStorage()
                  success = true
                  console.log('✅ Got gold price from metals.live:', goldPrice)
                }
              }
            }
          } catch (err) {
            console.warn('metals.live failed:', err.message)
          }
        }

        // Fallback to alternative API if first fails
        if (!success) {
          console.log('Trying alternative API (goldapi)...')

          try {
            let apiUrl = 'https://www.goldapi.io/api/XAU/USD'
            let customHeaders = { ...headers }

            if (this.customApiUrl && this.customApiUrl.trim()) {
              const input = this.customApiUrl.trim()
              const match = input.match(/goldapi-([a-z0-9]+)\.io/) || input.match(/([a-z0-9]+)/)
              if (match) {
                customHeaders['x-access-token'] = input.includes('goldapi') ? input : match[1]
              }
            }

            const response = await fetch(apiUrl, {
              signal: controller.signal,
              headers: customHeaders,
              mode: 'cors'
            })

            if (response.ok) {
              const data = await response.json()
              console.log('goldapi response:', data)

              if (data.price) {
                this.goldPrice = data.price
                this.lastUpdated = new Date().toLocaleString()
                this.saveToLocalStorage()
                success = true
                console.log('✅ Got gold price from goldapi:', data.price)
              }
            }
          } catch (err) {
            console.warn('goldapi failed:', err.message)
          }
        }

        clearTimeout(timeoutId)

        if (success) {
          this.showSuccessMessage = true
          setTimeout(() => {
            this.showSuccessMessage = false
          }, 3000)
        } else {
          // No API worked, try to use cached data
          const saved = this.safeGetLocalStorage('goldTrackerData')
          if (saved) {
            try {
              const data = JSON.parse(saved)
              if (data.goldPrice) {
                this.goldPrice = data.goldPrice
                this.lastUpdated = data.lastUpdated + ' (cached)'
                this.error = null
                console.log('📦 Using cached gold price:', data.goldPrice)
                this.loading = false
                return
              }
            } catch (e) {
              console.error('Error loading cache:', e)
            }
          }

          this.error = 'Unable to fetch live prices. Please try again or use custom price mode.'
        }

      } catch (err) {
        console.error('fetchGoldPrice error:', err)

        // Try to load from cache
        const saved = this.safeGetLocalStorage('goldTrackerData')
        if (saved) {
          try {
            const data = JSON.parse(saved)
            if (data.goldPrice) {
              this.goldPrice = data.goldPrice
              this.lastUpdated = data.lastUpdated + ' (cached)'
              this.error = null
              console.log('📦 Using cached gold price:', data.goldPrice)
              this.loading = false
              return
            }
          } catch (e) {
            console.error('Error loading cache:', e)
          }
        }

        this.error = 'Connection error. Please check your internet and try again.'
      } finally {
        this.loading = false
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
        unit: 'chi',
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
      if (!this.goldPrice) return 0

      let grams = 0
      switch (purchase.unit) {
        case 'li': grams = purchase.weight * this.LI_TO_GRAM; break
        case 'hun': grams = purchase.weight * this.HUN_TO_GRAM; break
        case 'chi': grams = purchase.weight * this.CHI_TO_GRAM; break
        case 'gram': grams = purchase.weight; break
        case 'damlung': grams = purchase.weight * this.DAMLUNG_TO_GRAM; break
        case 'troyOz': grams = purchase.weight * this.TROY_OZ_TO_GRAM; break
      }

      const pricePerGram = this.goldPrice / this.TROY_OZ_TO_GRAM
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
        lastUpdated: this.lastUpdated,
        purchases: this.purchases,
        priceInputMethod: this.priceInputMethod,
        customPrice: this.customPrice,
        customApiUrl: this.customApiUrl,
        priceSource: this.priceSource
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
          this.lastUpdated = data.lastUpdated
          this.purchases = data.purchases || []
          this.priceInputMethod = data.priceInputMethod || 'troyOz'
          this.customPrice = data.customPrice || null
          this.customApiUrl = data.customApiUrl || ''
          this.priceSource = data.priceSource || 'api'
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
  -webkit-tap-highlight-color: transparent;
}

input,
select,
textarea {
  font-size: 17px !important;
  min-height: 44px;
}

button {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.gold-tracker {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  padding: env(safe-area-inset-top, 0) env(safe-area-inset-right, 0) env(safe-area-inset-bottom, 0) env(safe-area-inset-left, 0);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  overflow-x: hidden;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
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
  align-items: stretch;
}

.api-input {
  flex: 1;
  padding: 10px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 17px;
  color: #334155;
  background: white;
}

.api-input:focus {
  outline: none;
  border-color: #64748b;
}

.paste-api-btn {
  background: #06b6d4;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: 80px;
}

.paste-api-btn:hover {
  background: #0891b2;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(6, 182, 212, 0.3);
}

.paste-api-btn:active {
  transform: translateY(0);
}

.clear-api-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-api-btn:hover {
  background: #dc2626;
  transform: scale(1.05);
}

.clear-api-btn:active {
  transform: scale(0.95);
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
  min-width: 90px;
}

.save-api-btn:hover:not(:disabled) {
  background: #7c3aed;
}

.save-api-btn:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
  opacity: 0.6;
}

.api-note {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #8b5cf6;
  font-style: italic;
}

.api-note-default {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #059669;
  font-style: italic;
  font-weight: 500;
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

/* Price Source Toggle */
.price-source-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 16px;
}

.source-btn {
  flex: 1;
  padding: 12px 16px;
  background: #f1f5f9;
  color: #334155;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.source-btn:hover {
  background: #e2e8f0;
}

.source-btn.active {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-color: #1d4ed8;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.source-btn:active {
  transform: scale(0.98);
}

.api-configuration-section {
  background: white;
  margin: 20px;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.api-section-header {
  margin-bottom: 24px;
}

.api-section-header h3 {
  color: #334155;
  font-size: 20px;
  margin-bottom: 8px;
}

.api-description {
  color: #64748b;
  font-size: 13px;
  margin: 0;
}

/* CTA Card */
.api-cta-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #0ea5e9;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 24px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.cta-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.cta-content {
  flex: 1;
}

.cta-content h4 {
  color: #0369a1;
  font-size: 15px;
  margin: 0 0 4px 0;
  font-weight: 600;
}

.cta-content p {
  color: #0c4a6e;
  font-size: 13px;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.cta-link {
  display: inline-block;
  color: #0369a1;
  text-decoration: none;
  font-weight: 600;
  font-size: 12px;
  padding: 6px 12px;
  background: white;
  border-radius: 4px;
  transition: all 0.2s;
  border: 1px solid #0ea5e9;
}

.cta-link:hover {
  background: #e0f2fe;
  color: #0c4a6e;
}

/* API Input Section */
.api-input-section {
  margin-bottom: 20px;
}

.api-input-section label {
  display: block;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
}

.api-input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.api-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 17px;
  color: #334155;
  background: white;
  transition: all 0.2s;
}

.api-input:focus {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.api-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #0ea5e9;
  color: white;
  border: none;
  padding: 12px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
  white-space: nowrap;
}

.api-action-btn:hover {
  background: #0284c7;
  transform: translateY(-1px);
}

.api-action-btn:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 16px;
}

.btn-text {
  display: none;
}

@media (min-width: 480px) {
  .btn-text {
    display: inline;
  }
}

/* Status Indicator */
.api-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 16px;
}

.api-status.success {
  background: #d1fae5;
  border: 1px solid #6ee7b7;
  color: #065f46;
  justify-content: space-between;
}

.api-status.default {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  color: #6b7280;
}

.status-icon {
  font-size: 16px;
}

.status-clear {
  background: none;
  border: none;
  color: #059669;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  text-decoration: underline;
  padding: 0;
  transition: color 0.2s;
}

.status-clear:hover {
  color: #047857;
}

/* Action Buttons */
.api-action-buttons {
  margin-bottom: 16px;
}

.api-save-btn {
  width: 100%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.api-save-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.api-save-btn:active:not(:disabled) {
  transform: translateY(0);
}

.api-save-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-disabled {
  color: #6b7280;
}

/* Info Box */
.api-info-box {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  padding: 12px 14px;
  border-radius: 4px;
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #92400e;
  line-height: 1.5;
}

.info-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.api-info-box p {
  margin: 0;
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
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.refresh-btn:hover:not(:disabled) {
  background: #475569;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.loading-bar {
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin: 12px 0;
}

.loading-progress {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6);
  background-size: 200% 100%;
  animation: loading 1.5s ease-in-out infinite;
  border-radius: 2px;
}

@keyframes loading {
  0% {
    width: 0%;
    background-position: 0% 0%;
  }

  50% {
    width: 70%;
    background-position: 100% 0%;
  }

  100% {
    width: 100%;
    background-position: 0% 0%;
  }
}



.success-message {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
  padding: 16px;
  border-radius: 8px;
  margin-top: 12px;
  font-size: 14px;
  border-left: 4px solid #10b981;
  font-weight: 600;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  transition: all 0.2s;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.price-card:active {
  transform: scale(0.98);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.price-card.active {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-color: #3b82f6;
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
}

.price-card.active:active {
  transform: scale(0.98);
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
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
  padding: 12px 14px;
  border-radius: 8px;
  margin-top: 12px;
  font-size: 13px;
  border-left: 4px solid #dc2626;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.error-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.error-text {
  flex: 1;
}

.error-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.error-retry-btn {
  align-self: flex-start;
  background: #dc2626;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.error-retry-btn:hover {
  background: #b91c1c;
  transform: translateY(-1px);
}

.error-retry-btn:active {
  transform: translateY(0);
}

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
  font-size: 17px;
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
  font-size: 17px;
  color: #334155;
  background: white;
}

.converter-input:focus {
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

.unit-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (min-width: 1024px) {
  .unit-grid {
    grid-template-columns: repeat(6, 1fr);
  }
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
  font-size: 17px;
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
  font-size: 17px;
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

/* ============================================
   MOBILE OPTIMIZATION (375-430px iPhone)
   ============================================ */

@media (max-width: 430px) {

  /* PREVENT ALL HORIZONTAL OVERFLOW - CRITICAL FIX */
  * {
    box-sizing: border-box !important;
  }

  html,
  body {
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;
    margin: 0 !important;
    padding: 0 !important;
  }

  .gold-tracker {
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
  }

  /* ALL INPUTS & TEXTAREAS */
  input,
  select,
  textarea {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    padding: 10px !important;
    font-size: 16px !important;
  }

  /* HEADER */
  .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 12px;
    width: 100%;
    min-width: 0;
  }

  .header h1 {
    font-size: 16px;
    margin: 0;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .header-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
    align-items: center;
    min-width: 0;
  }
}

.lang-btn {
  padding: 6px 12px;
  font-size: 12px;
}

/* MAIN SECTIONS - FLEX LAYOUT */
.price-section,
.price-method-section,
.converter-section,
.price-by-unit,
.purchases-section,
.api-configuration-section {
  display: flex;
  flex-direction: column;
  margin: 8px;
  padding: 12px;
  border-radius: 10px;
  width: calc(100% - 16px);
  min-width: 0;
  gap: 8px;
}

.price-section h2,
.price-method-section h3,
.converter-section h2,
.price-by-unit h2,
.purchases-section h2,
.api-configuration-section h3 {
  font-size: 16px;
  margin-bottom: 12px;
}

/* PRICE SOURCE TOGGLE */
.price-source-toggle {
  display: flex;
  flex-direction: row;
  gap: 6px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  width: 100%;
  min-width: 0;
}

.source-btn {
  flex: 1;
  min-width: 0;
  padding: 8px 10px;
  font-size: 12px;
  min-height: 40px;
}

/* PRICE HEADER - Refresh button */
.price-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.price-header h2 {
  font-size: 16px;
  margin: 0;
  flex: 1;
  min-width: 0;
}

.refresh-btn {
  width: 100%;
  padding: 8px 12px;
  font-size: 12px;
  min-height: 40px;
}

/* PRICE CARDS - FLEX */
.price-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  min-width: 0;
}

.price-card {
  display: flex;
  flex-direction: column;
  padding: 12px;
  min-height: 80px;
  width: 100%;
  min-width: 0;
  gap: 6px;
}

.price-value {
  font-size: 32px;
}

.price-unit {
  font-size: 12px;
}

/* FORM ROWS & GROUPS - FLEX */
.form-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
  width: 100%;
  min-width: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  min-width: 0;
}

.form-group label {
  font-size: 12px;
  flex-shrink: 0;
}

.form-group input,
.form-group select {
  width: 100%;
  min-width: 0;
  min-height: 44px;
}

/* API INPUT ROW - FLEX */
.api-input-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.api-input {
  width: 100%;
  min-width: 0;
  min-height: 44px;
}

.paste-api-btn,
.clear-api-btn,
.save-api-btn,
.paste-btn {
  width: 100%;
  min-width: 0;
  min-height: 44px;
  font-size: 13px;
}

/* CONVERTER TABS - Scroll horizontally, prevent wrapping */
.converter-tabs {
  gap: 4px;
  margin-bottom: 16px;
}

.tab-btn {
  padding: 8px 12px;
  font-size: 12px;
  flex-shrink: 0;
}

/* CONVERTER INPUT */
.converter-input {
  font-size: 16px;
  min-height: 44px;
  padding: 10px;
  width: 100%;
  box-sizing: border-box;
}

/* UNIT GRID - FLEX 2 COLUMNS */
.unit-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.unit-card {
  flex: 1 1 calc(50% - 4px);
  min-width: 0;
  padding: 10px;
  gap: 3px;
  display: flex;
  flex-direction: column;
}

.unit-name {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unit-price {
  font-size: 16px;
}

.unit-weight {
  font-size: 10px;
}

/* PURCHASES GRID - FLEX COLUMN */
.purchases-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.purchase-card {
  display: flex;
  flex-direction: column;
  padding: 10px;
  width: 100%;
  min-width: 0;
  gap: 6px;
}

.card-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 6px;
  width: 100%;
  min-width: 0;
}

.card-weight {
  font-size: 14px;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-actions {
  display: flex;
  width: 100%;
  justify-content: flex-start;
  gap: 4px;
  flex-wrap: wrap;
}

.card-detail {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  padding: 4px 0;
  width: 100%;
  min-width: 0;
}

.icon-btn {
  font-size: 16px;
  padding: 6px;
  min-width: 40px;
  min-height: 40px;
  flex-shrink: 0;
}

/* EDIT FORM - Stack inputs vertically */
.edit-form {
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
}

.edit-form input,
.edit-form select {
  padding: 10px;
  font-size: 16px;
  min-height: 44px;
  width: 100%;
  box-sizing: border-box;
}

.edit-actions {
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  width: 100%;
  box-sizing: border-box;
}

.save-btn,
.cancel-btn {
  min-height: 44px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
}

/* PORTFOLIO SUMMARY - Stack items */
.portfolio-summary {
  padding: 16px;
}

.summary-grid {
  gap: 10px;
}

.summary-item {
  flex-direction: column;
  gap: 6px;
  padding: 10px;
}

.summary-label {
  font-size: 12px;
}

.summary-value {
  font-size: 14px;
}

/* BUTTONS - Full width & touch-friendly */
.submit-btn,
.add-btn,
.refresh-btn,
.export-btn,
.set-price-btn {
  min-height: 44px;
  font-size: 14px;
  padding: 10px 16px;
}

/* PRICE METHOD TOGGLE */
.price-method-toggle {
  gap: 6px;
}

.method-btn {
  padding: 10px;
  font-size: 12px;
  min-height: 40px;
}

/* PRICE PREVIEW */
.price-preview {
  padding: 12px;
  gap: 6px;
}

.preview-header {
  font-size: 12px;
  margin-bottom: 6px;
}

.preview-item {
  font-size: 12px;
  padding: 4px 0;
}

/* PURCHASE FORM */
.purchase-form {
  padding: 16px;
}

/* API SECTION */
.api-configuration-section {
  margin: 8px;
  padding: 16px;
}

.api-section-header h3 {
  font-size: 16px;
  margin-bottom: 6px;
}

.api-cta-card {
  padding: 12px;
  margin-bottom: 16px;
  gap: 10px;
}

.cta-icon {
  font-size: 24px;
}

.cta-content h4 {
  font-size: 14px;
  margin-bottom: 3px;
}

.cta-content p {
  font-size: 12px;
  margin-bottom: 6px;
}

.cta-link {
  font-size: 11px;
  padding: 5px 10px;
}

.api-input-section label {
  font-size: 12px;
  margin-bottom: 8px;
}

.api-input-row {
  flex-direction: column;
  gap: 8px;
}

.api-input {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  min-height: 44px;
}

.api-action-btn {
  width: 100%;
  padding: 10px;
  min-height: 40px;
  font-size: 12px;
}

.api-status {
  padding: 10px;
  font-size: 12px;
  margin-bottom: 12px;
}

.api-save-btn {
  padding: 12px;
  font-size: 14px;
  min-height: 44px;
}

.api-info-box {
  padding: 10px 12px;
  font-size: 11px;
  gap: 8px;
}

.info-icon {
  font-size: 14px;
}

/* NETWORK WARNING */
.network-warning {
  font-size: 12px;
  padding: 10px 16px;
}

/* SUCCESS & ERROR MESSAGES */
.success-message,
.error-message {
  font-size: 12px;
  padding: 12px;
  margin-top: 10px;
}

/* ACTIVE METAL INDICATOR */
.active-metal-indicator {
  font-size: 12px;
  padding: 6px 10px;
  margin-bottom: 12px;
}

/* PRICE META */
.price-meta {
  font-size: 12px;
}

/* CUSTOM PRICE INPUT */
.custom-price-input label {
  font-size: 13px;
  margin-bottom: 6px;
}

.price-input-row {
  gap: 6px;
  width: 100%;
  box-sizing: border-box;
  flex-direction: column;
}

.price-input {
  font-size: 16px;
  padding: 10px;
  min-height: 44px;
  width: 100%;
  box-sizing: border-box;
}

/* ============================================
   SMALL TABLET (430-768px)
   ============================================ */

@media (min-width: 431px) and (max-width: 768px) {
  .price-cards {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr 1fr;
  }

  .unit-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .purchases-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (min-width: 769px) {
  /* Desktop specific styles */
}
</style>