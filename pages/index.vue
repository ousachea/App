<template>
  <div class="container">
    <PageSwitcher />
    <div class="scanner-card">
      <div class="header">
        <div class="header-content">
          <h1 class="title">🇰🇭 KHQR Scanner</h1>
          <p class="subtitle">Decode and generate Cambodian payment QR codes</p>
        </div>
      </div>

      <div class="tab-navigation">
        <button @click="activeTab = 'decode'" :class="['tab-button', { active: activeTab === 'decode' }]">
          <span class="tab-icon">🔍</span>
          <span class="tab-text">Decode</span>
        </button>
        <button @click="activeTab = 'generate'" :class="['tab-button', { active: activeTab === 'generate' }]">
          <span class="tab-icon">✨</span>
          <span class="tab-text">Generate</span>
        </button>
      </div>

      <!-- Decode Tab -->
      <div v-show="activeTab === 'decode'" class="tab-content">
        <div class="input-area">
          <div class="sample-selector">
            <label class="sample-label">📋 Sample Data:</label>
            <select @change="loadSampleData" class="sample-select">
              <option value="">-- Select Sample --</option>
              <option v-for="sample in sampleDataOptions" :key="sample.name" :value="sample.data">
                {{ sample.name }}
              </option>
            </select>
          </div>

          <textarea v-model="manualQRInput" @paste="handlePaste" placeholder="Paste QR code data..."
            class="input-field"></textarea>

          <div class="action-buttons">
            <button @click="pasteFromClipboard" class="btn btn-primary paste-btn">
              📋 Paste from Clipboard
            </button>
            <button @click="clearData" class="btn btn-secondary">
              Clear
            </button>
          </div>
        </div>
      </div>

      <!-- Results - TLV Tree Structure -->
      <div v-if="qrResult && activeTab === 'decode'" class="result-section">
        <!-- Data Summary Card -->
        <div class="summary-card">
          <div class="summary-item">
            <span class="summary-label">Merchant:</span>
            <span class="summary-value">{{ headerInfo.merchantNameTag?.value || 'N/A' }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Amount:</span>
            <span class="summary-value">{{ headerInfo.amountTag?.value ? headerInfo.amountTag.value + ' ' +
          (headerInfo.currencyTag?.value === '840' ? 'USD' : 'KHR') : 'N/A' }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Data:</span>
            <span class="summary-value">{{ qrResult.length }} bytes / {{ Object.keys(parsedTLV).length }} tags</span>
          </div>
        </div>

        <div class="result-header">
          <h2>TLV Structure</h2>
          <div class="header-buttons">
            <button @click="toggleEditMode" class="copy-btn" :class="{ 'edit-active': editMode }">
              {{ editMode ? '❌ Cancel' : '✏️ Edit' }}
            </button>
            <button @click="copyToClipboard" class="copy-btn">
              📋 {{ copyText }}
            </button>
          </div>
        </div>

        <!-- Edit Panel -->
        <div class="edit-panel" v-if="editMode">
          <div class="edit-field">
            <label>Merchant ID:</label>
            <input v-model="editMerchantID" type="text" class="edit-input" placeholder="Enter merchant ID">
          </div>
          <div class="edit-field">
            <label>Currency:</label>
            <select v-model="editCurrency" class="edit-select">
              <option value="KHR">KHR (Cambodian Riel)</option>
              <option value="USD">USD (US Dollar)</option>
            </select>
          </div>
          <div class="edit-field">
            <label>Amount:</label>
            <input v-model="editAmount" type="text" class="edit-input" placeholder="Enter amount">
          </div>
          <div class="edit-field">
            <label>Merchant Name:</label>
            <input v-model="editMerchantName" type="text" class="edit-input" placeholder="Enter merchant name">
          </div>
          <div class="edit-field">
            <label>Bank Name:</label>
            <select v-model="editBankName" class="edit-select">
              <option value="">-- Select Bank --</option>
              <option v-for="bank in cambodianBanks" :key="bank" :value="bank">{{ bank }}</option>
            </select>
          </div>
          <div class="edit-actions">
            <button @click="updateMerchantData" class="btn btn-primary edit-update-btn">
              🔐 Update & Encrypt Checksum (CRC-16/IBM-3740)
            </button>
            <button @click="toggleEditMode" class="btn btn-secondary edit-cancel-btn">
              ❌ Cancel
            </button>
          </div>
        </div>

        <div class="tlv-tree">
          <!-- Root tags -->
          <div class="tree-item" v-if="parsedTLV['00']">
            <span class="tree-tag">{{ parsedTLV['00'].tag }}</span>
            <span class="tree-length">{{ String(parsedTLV['00'].length).padStart(2, '0') }}</span>
            <span class="tree-data">{{ parsedTLV['00'].value }}</span>
            <span class="tree-meaning">= Version</span>
          </div>

          <div class="tree-item" v-if="parsedTLV['01']">
            <span class="tree-tag">{{ parsedTLV['01'].tag }}</span>
            <span class="tree-length">{{ String(parsedTLV['01'].length).padStart(2, '0') }}</span>
            <span class="tree-data">{{ parsedTLV['01'].value }}</span>
            <span class="tree-meaning">= {{ getInitiationMethodDescription(parsedTLV['01'].value) }}</span>
          </div>

          <!-- Tag 29: Remittance (nested) -->
          <div class="tree-item tree-parent" v-if="headerInfo.tag29">
            <span class="tree-tag">29</span>
            <span class="tree-length">{{ formatLength(headerInfo.tag29.length) }}</span>
            <span class="tree-meaning">= Remittance</span>

            <!-- Sub-layer for Tag 29 -->
            <div class="tree-sublayer" v-if="Object.keys(headerInfo.tag29Nested).length > 0">
              <div class="tree-subitem-line" v-if="headerInfo.tag29Nested['00']">
                <span class="tree-tag">00</span>
                <span class="tree-length">{{ formatLength(headerInfo.tag29Nested['00'].length) }}</span>
                <span class="tree-data">{{ headerInfo.tag29Nested['00'].value }}</span>
                <span class="tree-meaning">= Bakong ID</span>
              </div>
              <div class="tree-subitem-line" v-if="headerInfo.tag29Nested['01']">
                <span class="tree-tag">01</span>
                <span class="tree-length">{{ formatLength(headerInfo.tag29Nested['01'].length) }}</span>
                <span class="tree-data">{{ headerInfo.tag29Nested['01'].value }}</span>
                <span class="tree-meaning">= Merchant ID</span>
              </div>
              <div class="tree-subitem-line" v-if="headerInfo.tag29Nested['02']">
                <span class="tree-tag">02</span>
                <span class="tree-length">{{ formatLength(headerInfo.tag29Nested['02'].length) }}</span>
                <span class="tree-data">{{ headerInfo.tag29Nested['02'].value }}</span>
                <span class="tree-meaning">= Bank Name</span>
              </div>
              <div class="tree-subitem-line" v-if="headerInfo.tag29Nested['10']">
                <span class="tree-tag">10</span>
                <span class="tree-length">{{ formatLength(headerInfo.tag29Nested['10'].length) }}</span>
                <span class="tree-data">{{ headerInfo.tag29Nested['10'].value }}</span>
                <span class="tree-meaning">= Account Number</span>
              </div>
              <div class="tree-subitem-line" v-if="headerInfo.tag29Nested['11']">
                <span class="tree-tag">11</span>
                <span class="tree-length">{{ formatLength(headerInfo.tag29Nested['11'].length) }}</span>
                <span class="tree-data">{{ headerInfo.tag29Nested['11'].value }}</span>
                <span class="tree-meaning">= Reference Number</span>
              </div>
            </div>
          </div>

          <!-- Tag 30: Merchant Info (nested) -->
          <div class="tree-item tree-parent" v-if="headerInfo.tag30">
            <span class="tree-tag">30</span>
            <span class="tree-length">{{ formatLength(headerInfo.tag30.length) }}</span>
            <span class="tree-meaning">= Merchant Info</span>

            <!-- Sub-layer for Tag 30 -->
            <div class="tree-sublayer" v-if="Object.keys(headerInfo.tag30Nested).length > 0">
              <div class="tree-subitem-line" v-if="headerInfo.tag30Nested['00']">
                <span class="tree-tag">00</span>
                <span class="tree-length">{{ formatLength(headerInfo.tag30Nested['00'].length) }}</span>
                <span class="tree-data">{{ headerInfo.tag30Nested['00'].value }}</span>
                <span class="tree-meaning">= Bakong ID</span>
              </div>
              <div class="tree-subitem-line" v-if="headerInfo.tag30Nested['01']">
                <span class="tree-tag">01</span>
                <span class="tree-length">{{ formatLength(headerInfo.tag30Nested['01'].length) }}</span>
                <span class="tree-data">{{ headerInfo.tag30Nested['01'].value }}</span>
                <span class="tree-meaning">= Merchant ID</span>
              </div>
              <div class="tree-subitem-line" v-if="headerInfo.tag30Nested['02']">
                <span class="tree-tag">02</span>
                <span class="tree-length">{{ formatLength(headerInfo.tag30Nested['02'].length) }}</span>
                <span class="tree-data">{{ headerInfo.tag30Nested['02'].value }}</span>
                <span class="tree-meaning">= Bank Name</span>
              </div>
              <div class="tree-subitem-line" v-if="headerInfo.tag30Nested['10']">
                <span class="tree-tag">10</span>
                <span class="tree-length">{{ formatLength(headerInfo.tag30Nested['10'].length) }}</span>
                <span class="tree-data">{{ headerInfo.tag30Nested['10'].value }}</span>
                <span class="tree-meaning">= Account Number</span>
              </div>
              <div class="tree-subitem-line" v-if="headerInfo.tag30Nested['11']">
                <span class="tree-tag">11</span>
                <span class="tree-length">{{ formatLength(headerInfo.tag30Nested['11'].length) }}</span>
                <span class="tree-data">{{ headerInfo.tag30Nested['11'].value }}</span>
                <span class="tree-meaning">= Reference Number</span>
              </div>
            </div>
          </div>

          <!-- Tag 51: Bank Info (nested) -->
          <div class="tree-item tree-parent" v-if="headerInfo.bankInfoTag">
            <span class="tree-tag">51</span>
            <span class="tree-length">{{ formatLength(headerInfo.bankInfoTag.length) }}</span>
            <span class="tree-meaning">= Bank Info</span>

            <!-- Sub-layer for Tag 51 -->
            <div class="tree-sublayer" v-if="Object.keys(headerInfo.bankInfoNested).length > 0">
              <div class="tree-subitem-line" v-if="headerInfo.bankInfoNested['00']">
                <span class="tree-tag">00</span>
                <span class="tree-length">{{ formatLength(headerInfo.bankInfoNested['00'].length) }}</span>
                <span class="tree-data">{{ headerInfo.bankInfoNested['00'].value }}</span>
                <span class="tree-meaning">= Bakong ID</span>
              </div>
              <div class="tree-subitem-line" v-if="headerInfo.bankInfoNested['01']">
                <span class="tree-tag">01</span>
                <span class="tree-length">{{ formatLength(headerInfo.bankInfoNested['01'].length) }}</span>
                <span class="tree-data">{{ headerInfo.bankInfoNested['01'].value }}</span>
                <span class="tree-meaning">= Merchant ID</span>
              </div>
              <div class="tree-subitem-line" v-if="headerInfo.bankInfoNested['02']">
                <span class="tree-tag">02</span>
                <span class="tree-length">{{ formatLength(headerInfo.bankInfoNested['02'].length) }}</span>
                <span class="tree-data">{{ headerInfo.bankInfoNested['02'].value }}</span>
                <span class="tree-meaning">= Bank Name</span>
              </div>
              <div class="tree-subitem-line" v-if="headerInfo.bankInfoNested['10']">
                <span class="tree-tag">10</span>
                <span class="tree-length">{{ formatLength(headerInfo.bankInfoNested['10'].length) }}</span>
                <span class="tree-data">{{ headerInfo.bankInfoNested['10'].value }}</span>
                <span class="tree-meaning">= Account Number</span>
              </div>
              <div class="tree-subitem-line" v-if="headerInfo.bankInfoNested['11']">
                <span class="tree-tag">11</span>
                <span class="tree-length">{{ formatLength(headerInfo.bankInfoNested['11'].length) }}</span>
                <span class="tree-data">{{ headerInfo.bankInfoNested['11'].value }}</span>
                <span class="tree-meaning">= Reference Number</span>
              </div>
            </div>
          </div>

          <!-- Tag 52: Merchant Category -->
          <div class="tree-item" v-if="headerInfo.merchantCategoryTag">
            <span class="tree-tag">52</span>
            <span class="tree-length">{{ formatLength(headerInfo.merchantCategoryTag.length) }}</span>
            <span class="tree-data">{{ headerInfo.merchantCategoryTag.value }}</span>
            <span class="tree-meaning">= {{ getMerchantCategoryDescription(headerInfo.merchantCategoryTag.value)
              }}</span>
          </div>

          <!-- Tag 53: Currency -->
          <div class="tree-item" v-if="headerInfo.currencyTag">
            <span class="tree-tag">53</span>
            <span class="tree-length">{{ formatLength(headerInfo.currencyTag.length) }}</span>
            <span class="tree-data">{{ headerInfo.currencyTag.value }}</span>
            <span class="tree-meaning">= {{ getCurrencyDescription(headerInfo.currencyTag.value) }}</span>
          </div>

          <!-- Tag 54: Amount -->
          <div class="tree-item" v-if="headerInfo.amountTag">
            <span class="tree-tag">54</span>
            <span class="tree-length">{{ formatLength(headerInfo.amountTag.length) }}</span>
            <span class="tree-data">{{ headerInfo.amountTag.value }}</span>
            <span class="tree-meaning">= Amount</span>
          </div>

          <!-- Tag 58: Country -->
          <div class="tree-item" v-if="headerInfo.countryTag">
            <span class="tree-tag">58</span>
            <span class="tree-length">{{ formatLength(headerInfo.countryTag.length) }}</span>
            <span class="tree-data">{{ headerInfo.countryTag.value }}</span>
            <span class="tree-meaning">= {{ getCountryDescription(headerInfo.countryTag.value) }}</span>
          </div>

          <!-- Tag 59: Merchant Name -->
          <div class="tree-item" v-if="headerInfo.merchantNameTag">
            <span class="tree-tag">59</span>
            <span class="tree-length">{{ formatLength(headerInfo.merchantNameTag.length) }}</span>
            <span class="tree-data">{{ headerInfo.merchantNameTag.value }}</span>
            <span class="tree-meaning">= Merchant Name</span>
          </div>

          <!-- Tag 60: Merchant City -->
          <div class="tree-item" v-if="headerInfo.merchantCityTag">
            <span class="tree-tag">60</span>
            <span class="tree-length">{{ formatLength(headerInfo.merchantCityTag.length) }}</span>
            <span class="tree-data">{{ headerInfo.merchantCityTag.value }}</span>
            <span class="tree-meaning">= Merchant City</span>
          </div>

          <!-- Tag 62: Additional Data (nested) -->
          <div class="tree-item tree-parent" v-if="parsedTLV['62']">
            <span class="tree-tag">62</span>
            <span class="tree-length">{{ formatLength(parsedTLV['62'].length) }}</span>
            <span class="tree-meaning">= Additional Data</span>

            <!-- Sub-layer for Tag 62 -->
            <div class="tree-sublayer" v-if="Object.keys(headerInfo.tag62Nested).length > 0">
              <div class="tree-subitem-line" v-if="headerInfo.tag62Nested['01']">
                <span class="tree-tag">01</span>
                <span class="tree-length">{{ formatLength(headerInfo.tag62Nested['01'].length) }}</span>
                <span class="tree-data">{{ headerInfo.tag62Nested['01'].value }}</span>
                <span class="tree-meaning">= Bill Number</span>
              </div>

              <div class="tree-subitem-line" v-if="headerInfo.tag62Nested['02']">
                <span class="tree-tag">02</span>
                <span class="tree-length">{{ formatLength(headerInfo.tag62Nested['02'].length) }}</span>
                <span class="tree-data">{{ headerInfo.tag62Nested['02'].value }}</span>
                <span class="tree-meaning">= Mobile Number</span>
              </div>

              <div class="tree-subitem-line" v-if="headerInfo.tag62Nested['03']">
                <span class="tree-tag">03</span>
                <span class="tree-length">{{ formatLength(headerInfo.tag62Nested['03'].length) }}</span>
                <span class="tree-data">{{ headerInfo.tag62Nested['03'].value }}</span>
                <span class="tree-meaning">= Store Label</span>
              </div>

              <div class="tree-subitem-line" v-if="headerInfo.tag62Nested['07']">
                <span class="tree-tag">07</span>
                <span class="tree-length">{{ formatLength(headerInfo.tag62Nested['07'].length) }}</span>
                <span class="tree-data">{{ headerInfo.tag62Nested['07'].value }}</span>
                <span class="tree-meaning">= Terminal Number</span>
              </div>

              <!-- Display any other subtags not covered above -->
              <div class="tree-subitem-line" v-for="(subtagData, subtag) in headerInfo.tag62Nested"
                :key="'tag62-' + subtag" v-if="!['01', '02', '03', '07'].includes(subtag)">
                <span class="tree-tag">{{ subtag }}</span>
                <span class="tree-length">{{ formatLength(subtagData.length) }}</span>
                <span class="tree-data">{{ subtagData.value }}</span>
                <span class="tree-meaning">= Additional Info</span>
              </div>
            </div>
          </div>

          <!-- Tag 99: Timestamp (nested) -->
          <div class="tree-item tree-parent" v-if="headerInfo.timestampTag">
            <span class="tree-tag">99</span>
            <span class="tree-length">{{ formatLength(headerInfo.timestampTag.length) }}</span>
            <span class="tree-meaning">= Timestamp</span>

            <!-- Sub-layer for Tag 99 -->
            <div class="tree-sublayer" v-if="Object.keys(headerInfo.timestampNested).length > 0">
              <div class="tree-subitem-line" v-if="headerInfo.timestampNested['00']">
                <span class="tree-tag">00</span>
                <span class="tree-length">{{ formatLength(headerInfo.timestampNested['00'].length) }}</span>
                <span class="tree-data">{{ headerInfo.timestampNested['00'].value }}</span>
                <span class="tree-meaning">= Create Time</span>
              </div>
              <div class="tree-subitem-conversion" v-if="headerInfo.timestampNested['00']"
                :class="{ 'timestamp-expired': isTimestampExpired(headerInfo.timestampNested['00'].value) }">
                <span class="tree-meaning">→ {{
          getTimestampReadableWithoutExpired(headerInfo.timestampNested['00'].value) }}</span>
              </div>

              <div class="tree-subitem-line" v-if="headerInfo.timestampNested['01']">
                <span class="tree-tag">01</span>
                <span class="tree-length">{{ formatLength(headerInfo.timestampNested['01'].length) }}</span>
                <span class="tree-data">{{ headerInfo.timestampNested['01'].value }}</span>
                <span class="tree-meaning">= Expiry Time</span>
              </div>
              <div class="tree-subitem-conversion" v-if="headerInfo.timestampNested['01']"
                :class="{ 'timestamp-expired': isTimestampExpired(headerInfo.timestampNested['01'].value) }">
                <span class="tree-meaning">→ {{
          getTimestampReadableWithoutExpired(headerInfo.timestampNested['01'].value) }}</span>
              </div>
            </div>
          </div>

          <!-- Tag 63: Checksum -->
          <div class="tree-item" v-if="parsedTLV['63']"
            :class="{ 'checksum-valid': validateChecksum(qrResult) === true }">
            <span class="tree-tag">{{ parsedTLV['63'].tag }}</span>
            <span class="tree-length">{{ formatLength(parsedTLV['63'].length) }}</span>
            <span class="tree-data">{{ parsedTLV['63'].value }}</span>
            <span class="tree-meaning">= Checksum (CRC-16/IBM-3740)</span>
            <a v-if="editMode" :href="getCRCCalculatorLink()" target="_blank" class="crc-link">
              🔗 Verify CRC
            </a>
          </div>
        </div>
      </div>

      <!-- Generate Tab -->
      <div v-show="activeTab === 'generate'" class="tab-content">
        <div class="input-area">
          <div class="live-preview-toggle">
            <label class="toggle-label">
              <input type="checkbox" v-model="livePreview" class="toggle-checkbox">
              <span class="toggle-switch"></span>
              <span class="toggle-text">Live Preview</span>
            </label>
          </div>

          <textarea v-model="qrDataToGenerate" placeholder="Enter KHQR data to generate QR code..." class="input-field"
            style="height: 150px;"></textarea>

          <div class="action-buttons">
            <button @click="generateQRCode" class="btn btn-primary" v-if="!livePreview">
              ✨ Generate QR
            </button>
            <button @click="downloadQRCode" v-if="generatedQRImage" class="btn btn-primary">
              ⬇️ Download
            </button>
            <button @click="clearGenerate" class="btn btn-secondary">
              Clear
            </button>
          </div>
        </div>

        <div v-if="generatedQRImage" class="generate-result">
          <h3 class="data-label">Generated QR Code</h3>
          <div class="qr-display-container">
            <img :src="generatedQRImage" alt="Generated QR Code" class="qr-image" />
          </div>

          <div class="download-options">
            <label class="download-label">Download Format:</label>
            <select v-model="downloadFormat" class="download-select">
              <option value="svg">🌐 SVG (Recommended)</option>
              <option value="png">🖼️ PNG</option>
              <option value="jpg">📷 JPG</option>
            </select>
            <button @click="downloadQRCode" class="btn btn-primary">
              ⬇️ Download
            </button>
          </div>

          <div class="qr-data-display">
            <h4 class="data-label" style="margin-top: 1rem;">Data</h4>
            <pre class="data-content">{{ qrDataToGenerate }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PageSwitcher from '../components/PageSwitcher.vue';
import QrScanner from 'qr-scanner';
import QRCode from 'qrcode';

export default {
  components: {
    PageSwitcher,
  },
  data() {
    return {
      qrResult: '',
      headerInfo: {
        bankInfoNested: {},
        timestampNested: {},
        tag29Nested: {},
        tag30Nested: {},
        tag62Nested: {},
      },
      parsedTLV: {},
      manualQRInput: '00020101021229530016cadikhppxxx@cadi011300100053357230212Canadia Bank52040000530384054031.05802KH5911SAT SOVANDY6010Phnom Penh993400131765174265143011317652606651436304F3F6',
      copyText: 'Copy',
      activeTab: 'decode',
      generatedQRImage: null,
      qrDataToGenerate: '00020101021229530016cadikhppxxx@cadi011300100053357230212Canadia Bank52040000530384054031.05802KH5911SAT SOVANDY6010Phnom Penh993400131765174265143011317652606651436304F3F6',
      editMode: false,
      editMerchantID: '',
      editCurrency: 'KHR',
      editAmount: '',
      editMerchantName: '',
      editBankName: '',
      downloadFormat: 'svg',
      cambodianBanks: [
        'ABA Bank',
        'Canadia Bank',
        'ACLEDA Bank',
        'Chip Mong Bank',
        'Phnom Penh Commercial Bank',
      ],
      copiedItemId: null,
      livePreview: true,
      sampleDataOptions: [
        {
          name: 'Static Merchant',
          data: '00020101021130510016abaakhppxxx@abaa01151211209110909710208ABA Bank5204739253031165802KH5919Ousa Chea by O.CHEA6010PHNOM PENH624068360010PAYWAY@ABA01061894950208031956116304098B',
        },
        {
          name: 'Dynamic Merchant',
          data: '00020101021230510016abaakhppxxx@abaa01151211209110909710208ABA Bank52047392530384054049.995802KH5919Ousa Chea by O.CHEA6010PHNOM PENH626368590010PAYWAY@ABA01061894950208031956110619BD2F18438007825964Z9934001317651843800780113176518468007863046CBB',
        },
        {
          name: 'Static Remittance',
          data: '00020101021129810016cadikhppxxx@cadi010712814460212Canadia Bank10130010007018873111300100070281515204000053031165802KH5909Sok Sabay6010Phnom Penh62200816Pay to my friend6304290E',
        },
        {
          name: 'Dynamic Remittance',
          data: '00020101021229530016cadikhppxxx@cadi011300100053357230212Canadia Bank52040000530384054031.05802KH5911SAT SOVANDY6010Phnom Penh993400131765174265143011317652606651436304F3F6',
        },
      ],
      currencyCodeMap: {
        '840': 'US Dollar (USD)',
        '116': 'Cambodian Riel (KHR)',
        '978': 'Euro (EUR)',
        '036': 'Australian Dollar (AUD)',
        '826': 'British Pound (GBP)',
        '392': 'Japanese Yen (JPY)',
        '156': 'Chinese Yuan (CNY)',
        '360': 'Indonesian Rupiah (IDR)',
        '458': 'Malaysian Ringgit (MYR)',
        '608': 'Philippine Peso (PHP)',
        '702': 'Singapore Dollar (SGD)',
        '764': 'Thai Baht (THB)',
        '704': 'Vietnamese Dong (VND)',
      },
      merchantCategoryMap: {
        '7392': 'Money Transfer / Remittance',
        '5411': 'Supermarkets and Grocery Stores',
        '5812': 'Eating Places and Restaurants',
        '5942': 'Bookstores',
        '5999': 'Other Retail Stores',
        '6211': 'Securities Brokers and Dealers',
        '6301': 'Insurance Agents and Brokers',
        '7011': 'Lodging and Hotels',
        '7999': 'Entertainment and Recreation',
        '8211': 'Elementary and Secondary Schools',
        '8220': 'Colleges, Universities, Professional Schools',
      },
      countryCodeMap: {
        'KH': 'Cambodia',
        'US': 'United States',
        'GB': 'United Kingdom',
        'CN': 'China',
        'ID': 'Indonesia',
        'MY': 'Malaysia',
        'PH': 'Philippines',
        'SG': 'Singapore',
        'TH': 'Thailand',
        'VN': 'Vietnam',
        'JP': 'Japan',
        'KR': 'South Korea',
        'AU': 'Australia',
      },
    };
  },
  mounted() {
    if (this.manualQRInput.trim()) {
      this.$nextTick(() => {
        this.decodeManualQR();
      });
    }
    // Auto-generate QR code
    if (this.qrDataToGenerate.trim()) {
      this.$nextTick(() => {
        this.generateQRCode();
      });
    }

    // Add global paste listener for Ctrl+V / Cmd+V
    document.addEventListener('paste', this.handleGlobalPaste);
  },

  beforeDestroy() {
    document.removeEventListener('paste', this.handleGlobalPaste);
  },

  watch: {
    manualQRInput(newValue) {
      if (newValue.trim()) {
        this.decodeManualQR();
      }
    },

    qrDataToGenerate(newValue) {
      if (newValue.trim()) {
        if (this.livePreview) {
          this.generateQRPreview();
        }
      }
    },
  },
  methods: {
    decodeManualQR() {
      if (this.manualQRInput.trim()) {
        this.processQRResult(this.manualQRInput.trim());
      }
    },

    handlePaste(event) {
      // Allow the paste to complete
      this.$nextTick(() => {
        // Automatically process the pasted data
        if (this.manualQRInput.trim()) {
          const pastedData = this.manualQRInput.trim();
          this.processQRResult(pastedData);
          this.showNotification('✅ QR data pasted and decoded!', 'success');
        }
      });
    },

    async pasteFromClipboard() {
      try {
        // Modern Clipboard API
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          if (text && text.trim()) {
            this.manualQRInput = text.trim();
            this.$nextTick(() => {
              this.processQRResult(text.trim());
              this.showNotification('✅ QR data pasted from clipboard!', 'success');
            });
          } else {
            this.showNotification('❌ Clipboard is empty', 'error');
          }
        } else {
          // Fallback for older browsers
          this.showNotification('❌ Clipboard access not available', 'error');
        }
      } catch (error) {
        console.error('Clipboard error:', error);
        this.showNotification('❌ Failed to read clipboard. Please paste manually.', 'error');
      }
    },

    handleGlobalPaste(event) {
      // Handle Ctrl+V / Cmd+V anywhere on the page
      try {
        const clipboardData = event.clipboardData || window.clipboardData;
        const pastedText = clipboardData.getData('text');

        if (pastedText && pastedText.trim()) {
          // Check if it looks like KHQR data
          if (pastedText.includes('00') && (pastedText.includes('29') || pastedText.includes('30') || pastedText.includes('51'))) {
            this.manualQRInput = pastedText.trim();
            this.$nextTick(() => {
              this.processQRResult(pastedText.trim());
              this.showNotification('✅ QR data pasted and decoded!', 'success');
            });
          }
        }
      } catch (error) {
        console.log('Paste error:', error);
      }
    },

    loadSampleData(event) {
      const data = event.target.value;
      if (data) {
        this.manualQRInput = data;
        this.$nextTick(() => {
          event.target.value = ''; // Reset selector
        });
      }
    },

    processQRResult(qrString) {
      this.qrResult = qrString;
      this.parsedTLV = this.parseTLVStructure(qrString);

      // Reset nested objects
      this.headerInfo.tag29Nested = {};
      this.headerInfo.tag30Nested = {};
      this.headerInfo.bankInfoNested = {};
      this.headerInfo.tag62Nested = {};
      this.headerInfo.timestampNested = {};

      const baseInfo = this.extractHeaderInfo(this.parsedTLV);
      this.headerInfo = { ...this.headerInfo, ...baseInfo };

      // Extract tag 29 (Merchant Type with nested info)
      if (this.parsedTLV['29']) {
        this.headerInfo.tag29 = this.parsedTLV['29'];
        this.headerInfo.tag29Nested = this.parseTLVStructure(this.parsedTLV['29'].value);
      }

      // Extract tag 30 (Merchant Info with nested data)
      if (this.parsedTLV['30']) {
        this.headerInfo.tag30 = this.parsedTLV['30'];
        this.headerInfo.tag30Nested = this.parseTLVStructure(this.parsedTLV['30'].value);
      }

      // Extract bank info (Tag 51)
      if (this.parsedTLV['51']) {
        this.headerInfo.bankInfoTag = this.parsedTLV['51'];
        this.headerInfo.bankInfoNested = this.parseTLVStructure(this.parsedTLV['51'].value);
      }

      // Extract other tags
      if (this.parsedTLV['52']) this.headerInfo.merchantCategoryTag = this.parsedTLV['52'];
      if (this.parsedTLV['53']) this.headerInfo.currencyTag = this.parsedTLV['53'];
      if (this.parsedTLV['54']) this.headerInfo.amountTag = this.parsedTLV['54'];
      if (this.parsedTLV['58']) this.headerInfo.countryTag = this.parsedTLV['58'];
      if (this.parsedTLV['59']) this.headerInfo.merchantNameTag = this.parsedTLV['59'];
      if (this.parsedTLV['60']) this.headerInfo.merchantCityTag = this.parsedTLV['60'];
      if (this.parsedTLV['62']) {
        this.headerInfo.additionalDataTag = this.parsedTLV['62'];
        this.headerInfo.tag62Nested = this.parseTLVStructure(this.parsedTLV['62'].value);
      }
      if (this.parsedTLV['63']) this.headerInfo.encryptionTag = this.parsedTLV['63'];

      // Extract timestamp
      if (this.parsedTLV['99']) {
        this.headerInfo.timestampTag = this.parsedTLV['99'];
        this.headerInfo.timestampNested = this.parseTLVStructure(this.parsedTLV['99'].value);
      }
    },

    parseTLVStructure(dataString) {
      const result = {};
      let position = 0;

      while (position < dataString.length - 1) {
        if (position + 2 > dataString.length) break;
        const tag = dataString.substring(position, position + 2);
        position += 2;

        if (position + 2 > dataString.length) break;
        const lengthStr = dataString.substring(position, position + 2);
        const length = parseInt(lengthStr, 10);
        position += 2;

        if (isNaN(length) || length < 0) break;

        // If length exceeds remaining data, try to find next tag
        if (position + length > dataString.length) {
          // Look for next potential tag by scanning ahead
          let found = false;
          for (let i = position; i < Math.min(position + length + 10, dataString.length - 4); i++) {
            const nextTag = dataString.substring(i, i + 2);
            const nextLenStr = dataString.substring(i + 2, i + 4);
            const nextLen = parseInt(nextLenStr, 10);

            // Check if this looks like a valid tag/length pair
            if (/^\d{2}$/.test(nextTag) && !isNaN(nextLen) && nextLen > 0 && nextLen < 255 &&
              i + 4 + nextLen <= dataString.length) {
              // Looks like a valid tag, use current position + truncated length
              const truncatedLength = i - position;
              if (truncatedLength > 0) {
                const value = dataString.substring(position, position + truncatedLength);
                result[tag] = { tag, length, value };
              }
              position = i;
              found = true;
              break;
            }
          }
          if (!found) break;
          continue;
        }

        const value = dataString.substring(position, position + length);
        position += length;

        result[tag] = {
          tag,
          length,
          value,
        };
      }

      return result;
    },

    extractHeaderInfo(tlvData) {
      const info = {};

      if (tlvData['00']) {
        info.payloadIndicator = tlvData['00'];
      }

      if (tlvData['01']) {
        info.initiationMethod = tlvData['01'];
      }

      if (tlvData['30']) {
        info.merchantType = tlvData['30'];
      }

      return info;
    },

    clearData() {
      this.qrResult = '';
      this.headerInfo = {};
      this.parsedTLV = {};
      this.manualQRInput = '';
      this.copyText = 'Copy';
    },

    copyToClipboard() {
      navigator.clipboard.writeText(this.qrResult).then(() => {
        this.copyText = 'Copied!';
        setTimeout(() => {
          this.copyText = 'Copy';
        }, 2000);
      });
    },

    copyItemValue(value, itemId) {
      navigator.clipboard.writeText(value).then(() => {
        this.copiedItemId = itemId;
        setTimeout(() => {
          this.copiedItemId = null;
        }, 1500);
      });
    },

    generateQRPreview() {
      if (this.livePreview && this.qrDataToGenerate.trim()) {
        this.generateQRCode();
      }
    },

    getMerchantCategoryDescription(code) {
      return this.merchantCategoryMap[code] || `Category: ${code}`;
    },

    getInitiationMethodDescription(code) {
      const methodMap = {
        '11': 'Static QR Code',
        '12': 'Dynamic QR Code',
      };
      return methodMap[code] || `Initiation Method: ${code}`;
    },

    toggleEditMode() {
      this.editMode = !this.editMode;
      if (this.editMode) {
        // Extract current values from parsed TLV
        this.editMerchantID = this.headerInfo.tag29Nested?.['01']?.value || this.headerInfo.tag30Nested?.['01']?.value || this.headerInfo.bankInfoNested?.['01']?.value || '';
        this.editCurrency = this.headerInfo.currencyTag?.value === '840' ? 'USD' : 'KHR';
        this.editAmount = this.headerInfo.amountTag?.value || '';
        this.editMerchantName = this.headerInfo.merchantNameTag?.value || '';
        this.editBankName = this.headerInfo.tag29Nested?.['02']?.value || this.headerInfo.tag30Nested?.['02']?.value || this.headerInfo.bankInfoNested?.['02']?.value || '';
      }
    },

    updateMerchantData() {
      if (!this.qrResult) return;

      let updatedResult = this.qrResult;

      // Update Merchant ID in Tag 29/30/51
      if (this.editMerchantID) {
        // Try tag 29 first
        if (this.headerInfo.tag29Nested?.['01']) {
          const oldTag = '01' + String(this.headerInfo.tag29Nested['01'].length).padStart(2, '0') + this.headerInfo.tag29Nested['01'].value;
          const newTag = '01' + String(this.editMerchantID.length).padStart(2, '0') + this.editMerchantID;
          updatedResult = updatedResult.replace(oldTag, newTag);
        } else if (this.headerInfo.tag30Nested?.['01']) {
          const oldTag = '01' + String(this.headerInfo.tag30Nested['01'].length).padStart(2, '0') + this.headerInfo.tag30Nested['01'].value;
          const newTag = '01' + String(this.editMerchantID.length).padStart(2, '0') + this.editMerchantID;
          updatedResult = updatedResult.replace(oldTag, newTag);
        } else if (this.headerInfo.bankInfoNested?.['01']) {
          const oldTag = '01' + String(this.headerInfo.bankInfoNested['01'].length).padStart(2, '0') + this.headerInfo.bankInfoNested['01'].value;
          const newTag = '01' + String(this.editMerchantID.length).padStart(2, '0') + this.editMerchantID;
          updatedResult = updatedResult.replace(oldTag, newTag);
        }
      }

      // Update Currency (Tag 53)
      if (this.headerInfo.currencyTag) {
        const newCurrency = this.editCurrency === 'USD' ? '840' : '116';
        const oldTag53 = '53' + String(this.headerInfo.currencyTag.length).padStart(2, '0') + this.headerInfo.currencyTag.value;
        const newTag53 = '53' + '03' + newCurrency;
        updatedResult = updatedResult.replace(oldTag53, newTag53);
      }

      // Update Amount (Tag 54)
      if (this.editAmount && this.headerInfo.amountTag) {
        const oldTag54 = '54' + String(this.headerInfo.amountTag.length).padStart(2, '0') + this.headerInfo.amountTag.value;
        const newLength = String(this.editAmount.length).padStart(2, '0');
        const newTag54 = '54' + newLength + this.editAmount;
        updatedResult = updatedResult.replace(oldTag54, newTag54);
      }

      // Update Merchant Name (Tag 59)
      if (this.editMerchantName && this.headerInfo.merchantNameTag) {
        const oldTag59 = '59' + String(this.headerInfo.merchantNameTag.length).padStart(2, '0') + this.headerInfo.merchantNameTag.value;
        const newLength = String(this.editMerchantName.length).padStart(2, '0');
        const newTag59 = '59' + newLength + this.editMerchantName;
        updatedResult = updatedResult.replace(oldTag59, newTag59);
      }

      // Update Bank Name in Tag 29/30/51
      if (this.editBankName) {
        if (this.headerInfo.tag29Nested?.['02']) {
          const oldTag = '02' + String(this.headerInfo.tag29Nested['02'].length).padStart(2, '0') + this.headerInfo.tag29Nested['02'].value;
          const newTag = '02' + String(this.editBankName.length).padStart(2, '0') + this.editBankName;
          updatedResult = updatedResult.replace(oldTag, newTag);
        } else if (this.headerInfo.tag30Nested?.['02']) {
          const oldTag = '02' + String(this.headerInfo.tag30Nested['02'].length).padStart(2, '0') + this.headerInfo.tag30Nested['02'].value;
          const newTag = '02' + String(this.editBankName.length).padStart(2, '0') + this.editBankName;
          updatedResult = updatedResult.replace(oldTag, newTag);
        } else if (this.headerInfo.bankInfoNested?.['02']) {
          const oldTag = '02' + String(this.headerInfo.bankInfoNested['02'].length).padStart(2, '0') + this.headerInfo.bankInfoNested['02'].value;
          const newTag = '02' + String(this.editBankName.length).padStart(2, '0') + this.editBankName;
          updatedResult = updatedResult.replace(oldTag, newTag);
        }
      }

      // Remove old checksum (Tag 63)
      updatedResult = updatedResult.replace(/63\d{2}[A-F0-9a-f]{4}$/, '');

      // Calculate and add new checksum using CRC-16/IBM-3740
      const newChecksum = this.calculateCRC16(updatedResult);
      updatedResult = updatedResult + '63' + '04' + newChecksum;

      this.manualQRInput = updatedResult;
      this.processQRResult(updatedResult);
      this.editMode = false;

      // Show success notification
      this.showNotification('✅ Data updated! Checksum encrypted with CRC-16/IBM-3740', 'success');
    },

    showNotification(message, type = 'info') {
      // Create and show notification (can be enhanced with a proper toast library)
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.textContent = message;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    },

    getMerchantTypeDescription(code) {
      const typeMap = {
        '29': 'Remittance',
        '30': 'Merchant',
      };
      return typeMap[code] || `Merchant Type: ${code}`;
    },

    getCurrencyDescription(code) {
      const codeStr = String(code).padStart(3, '0');
      return this.currencyCodeMap[codeStr] || `Currency Code: ${code}`;
    },

    getCountryDescription(code) {
      return this.countryCodeMap[code] || `Country: ${code}`;
    },

    getTimestampReadable(timestamp) {
      if (!timestamp) return '';

      let ms = parseInt(timestamp, 10);
      if (isNaN(ms)) return '';

      try {
        const date = new Date(ms);
        const now = new Date();
        const isExpired = date < now;

        const options = {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Bangkok' // Cambodia uses Bangkok timezone (UTC+7)
        };
        const dateStr = date.toLocaleString('en-US', options) + ' ICT';

        if (isExpired) {
          return dateStr + ' ❌ Expired';
        }
        return dateStr;
      } catch {
        return '';
      }
    },

    getTimestampReadableWithoutExpired(timestamp) {
      if (!timestamp) return '';

      let ms = parseInt(timestamp, 10);
      if (isNaN(ms)) return '';

      try {
        const date = new Date(ms);
        const options = {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Bangkok' // Cambodia uses Bangkok timezone (UTC+7)
        };
        return date.toLocaleString('en-US', options) + ' ICT';
      } catch {
        return '';
      }
    },

    isTimestampExpired(timestamp) {
      if (!timestamp) return false;

      let ms = parseInt(timestamp, 10);
      if (isNaN(ms)) return false;

      try {
        const date = new Date(ms);
        const now = new Date();
        return date < now;
      } catch {
        return false;
      }
    },

    formatLength(length) {
      return String(length).padStart(2, '0');
    },

    calculateCRC16(data) {
      let crc = 0x0000;

      for (let i = 0; i < data.length; i++) {
        const byte = data.charCodeAt(i);
        crc ^= (byte << 8);

        for (let j = 0; j < 8; j++) {
          crc <<= 1;
          if (crc & 0x10000) {
            crc ^= 0x1021;
          }
          crc &= 0xFFFF;
        }
      }

      return crc.toString(16).toUpperCase().padStart(4, '0');
    },

    validateChecksum(qrData) {
      // Extract checksum tag
      const checksumMatch = qrData.match(/63\d{2}([A-Fa-f0-9]{4})$/);
      if (!checksumMatch) return null;

      const providedChecksum = checksumMatch[1].toUpperCase();
      const dataWithoutChecksum = qrData.replace(/63\d{2}[A-Fa-f0-9]{4}$/, '');
      const calculatedChecksum = this.calculateCRC16(dataWithoutChecksum);

      return providedChecksum === calculatedChecksum;
    },

    getCRCCalculatorLink() {
      // Get QR data without the last 4 digits (checksum value)
      let qrWithoutChecksum = this.qrResult;

      // Remove tag 63 entirely (6304 + 4 digits = 8 characters)
      qrWithoutChecksum = qrWithoutChecksum.replace(/63\d{2}[A-Fa-f0-9]{4}$/, '');

      // Encode for URL
      const encodedData = encodeURIComponent(qrWithoutChecksum);

      return `https://crccalc.com/?crc=${encodedData}&method=CRC-16/IBM-3740&datatype=ascii&outtype=hex`;
    },

    async generateQRCode() {
      if (!this.qrDataToGenerate.trim()) {
        alert('Please enter KHQR data to generate a QR code');
        return;
      }

      try {
        this.generatedQRImage = await QRCode.toDataURL(this.qrDataToGenerate.trim(), {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          quality: 0.95,
          margin: 1,
          width: 300,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
      } catch (error) {
        console.error('Error generating QR code:', error);
        alert('Failed to generate QR code. Please check the data format.');
      }
    },

    downloadQRCode() {
      if (!this.generatedQRImage) return;

      const link = document.createElement('a');

      if (this.downloadFormat === 'svg') {
        // Generate SVG format
        QRCode.toString(this.qrDataToGenerate.trim(), {
          errorCorrectionLevel: 'H',
          type: 'image/svg+xml',
          quality: 0.95,
          margin: 1,
          width: 300,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        }, (err, url) => {
          if (err) {
            console.error('Error generating SVG:', err);
            return;
          }
          link.href = url;
          link.download = `khqr-${Date.now()}.svg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
      } else if (this.downloadFormat === 'jpg') {
        // Generate JPG from PNG
        link.href = this.generatedQRImage;
        link.download = `khqr-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // PNG (default)
        link.href = this.generatedQRImage;
        link.download = `khqr-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },

    clearGenerate() {
      this.qrDataToGenerate = '';
      this.generatedQRImage = null;
    },
  },
};
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.container {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%);
  width: 100vw;
  margin: 0;
  padding: 0;
}

.scanner-card {
  background: white;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 0;
  box-shadow: 0 4px 16px rgba(14, 165, 233, 0.1);
  margin: 0;
}

.header-top {
  display: none;
}

.header-controls {
  display: none;
}

.control-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.4);
  color: white;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.6);
  transform: scale(1.05);
}

.summary-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.3rem;
  padding: 1.8rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #7dd3fc;
  border-radius: 14px;
  margin-bottom: 2rem;
  box-shadow: 0 6px 16px rgba(14, 165, 233, 0.18);
  animation: slideUpIn 0.5s ease;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.summary-label {
  font-size: 0.85rem;
  font-weight: 900;
  color: #0c4a6e;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.summary-value {
  font-size: 1rem;
  font-weight: 800;
  color: #0284c7;
  word-break: break-word;
}

.live-preview-toggle {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.4rem;
  background: linear-gradient(135deg, #ecf0ff 0%, #e0f2fe 100%);
  border: 2px solid #7dd3fc;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.12);
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
}

.toggle-checkbox {
  display: none;
}

.toggle-switch {
  position: relative;
  width: 52px;
  height: 28px;
  background: #d0d0d0;
  border-radius: 14px;
  transition: background-color 0.3s ease;
  border: 2px solid #7dd3fc;
}

.toggle-checkbox:checked+.toggle-switch {
  background: #06b6d4;
  border-color: #0284c7;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
  top: 1px;
  left: 1px;
  transition: left 0.3s ease;
}

.toggle-checkbox:checked+.toggle-switch::after {
  left: 25px;
}

.toggle-text {
  font-weight: 800;
  color: #0c4a6e;
  font-size: 0.95rem;
}

.header {
  background: linear-gradient(135deg, #1e40af 0%, #0ea5e9 100%);
  border-bottom: 4px solid #0284c7;
  padding: 3rem 2.5rem;
  text-align: left;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 8px 24px rgba(30, 64, 175, 0.3);
}

.header-content {
  max-width: 100%;
}

.title {
  font-size: 2.2rem;
  font-weight: 900;
  margin: 0;
  color: #ffffff;
  letter-spacing: -1px;
  text-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
}

.subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0.8rem 0 0 0;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.tab-navigation {
  display: flex;
  gap: 0;
  padding: 0 2.5rem;
  background: linear-gradient(to right, #ffffff, #f8fafc);
  border-bottom: 3px solid #dbeafe;
  position: sticky;
  top: 6.2rem;
  z-index: 9;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1.5rem 2.2rem;
  background: none;
  border: none;
  border-bottom: 4px solid transparent;
  color: #64748b;
  font-weight: 800;
  font-size: 1.05rem;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.3px;
}

.tab-button:hover {
  color: #1e40af;
  background: rgba(30, 64, 175, 0.04);
}

.tab-button.active {
  color: #0ea5e9;
  border-bottom-color: #0ea5e9;
  background: rgba(14, 165, 233, 0.06);
}

.tab-icon {
  font-size: 1.1rem;
}

.tab-text {
  font-weight: 700;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tab-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.input-area {
  padding: 2.8rem 2.5rem;
  flex-shrink: 0;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-bottom: 3px solid #bae6fd;
}

.sample-selector {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2.2rem;
  padding: 1.8rem;
  background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
  border: 2px solid #7dd3fc;
  border-radius: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
}

.sample-selector:hover {
  border-color: #0284c7;
  background: linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%);
  box-shadow: 0 8px 20px rgba(14, 165, 233, 0.3);
  transform: translateY(-2px);
}

.sample-label {
  font-size: 0.95rem;
  font-weight: 900;
  color: #0c4a6e;
  white-space: nowrap;
  letter-spacing: 0.3px;
}

.sample-select {
  flex: 1;
  padding: 1.1rem;
  border: 2px solid #7dd3fc;
  border-radius: 10px;
  font-size: 15px;
  font-family: inherit;
  color: #0c4a6e;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 800;
}

.sample-select:hover,
.sample-select:focus {
  border-color: #0284c7;
  outline: none;
  background: #f0f9ff;
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.15);
}

.sample-select:focus {
  outline: none;
  border-color: #000000;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.input-field {
  width: 100%;
  height: 120px;
  padding: 1.2rem;
  border: 2px solid #7dd3fc;
  border-radius: 12px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  resize: vertical;
  transition: all 0.3s ease;
  color: #0c4a6e;
  background: linear-gradient(to bottom, #ffffff, #f0f9ff);
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.input-field:hover {
  border-color: #06b6d4;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.15);
}

.input-field:focus {
  outline: none;
  border-color: #0284c7;
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.18);
}

.input-field::placeholder {
  color: #7dd3fc;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 1.2rem;
  margin-top: 1.5rem;
  width: 100%;
}

.action-buttons .btn {
  flex: 1;
}

.btn {
  padding: 1rem 2.2rem;
  border: none;
  border-radius: 12px;
  font-weight: 800;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  color: #0c4a6e;
  letter-spacing: 0px;
}

.btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(14, 165, 233, 0.25);
}

.btn:active {
  transform: translateY(0);
}

.btn-primary {
  background: linear-gradient(135deg, #0284c7 0%, #06b6d4 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
  font-weight: 800;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #0369a1 0%, #0891b2 100%);
  transform: translateY(-3px);
  box-shadow: 0 12px 20px rgba(14, 165, 233, 0.4);
}

.btn-secondary {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  color: #0284c7;
  border: 2px solid #7dd3fc;
  font-weight: 800;
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #e0f2fe 0%, #cffafe 100%);
  border-color: #0284c7;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
}

.paste-btn {
  background: linear-gradient(135deg, #0284c7 0%, #06b6d4 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
  font-weight: 900;
  transition: all 0.3s ease;
}

.paste-btn:hover {
  background: linear-gradient(135deg, #0369a1 0%, #0891b2 100%);
  box-shadow: 0 8px 16px rgba(14, 165, 233, 0.4);
  transform: translateY(-2px);
}

.paste-btn:active {
  transform: translateY(0);
}

.result-section {
  padding: 2.8rem 2.5rem;
  padding-bottom: 220px;
  border-top: 3px solid #bae6fd;
  overflow-y: auto;
  background: linear-gradient(to bottom, #f0f9ff, #ffffff);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.2rem;
  padding-bottom: 1.4rem;
  border-bottom: 3px solid #7dd3fc;
}

.result-header h2 {
  font-size: 1.5rem;
  margin: 0;
  color: #0c4a6e;
  font-weight: 900;
  letter-spacing: -0.6px;
}

.header-buttons {
  display: flex;
  gap: 1rem;
}

.edit-panel {
  background: linear-gradient(135deg, #ecf0ff 0%, #e0f2fe 100%);
  border: 2px solid #7dd3fc;
  border-radius: 16px;
  padding: 2.4rem;
  margin-bottom: 2.2rem;
  animation: slideDown 0.4s ease;
  box-shadow: 0 8px 20px rgba(14, 165, 233, 0.2);
}

.edit-field {
  margin-bottom: 1.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.edit-field label {
  font-weight: 900;
  font-size: 0.9rem;
  color: #0c4a6e;
  letter-spacing: 0.2px;
}

.edit-input,
.edit-select {
  padding: 1rem;
  border: 2px solid #7dd3fc;
  border-radius: 10px;
  font-size: 15px;
  font-family: inherit;
  color: #0c4a6e;
  background: white;
  transition: all 0.3s ease;
  font-weight: 700;
}

.edit-input:hover,
.edit-select:hover {
  border-color: #06b6d4;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.15);
}

.edit-input:focus,
.edit-select:focus {
  outline: none;
  border-color: #0284c7;
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.2);
}

.edit-input::placeholder {
  color: #7dd3fc;
}

.edit-actions {
  display: flex;
  gap: 1.2rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid rgba(14, 165, 233, 0.2);
}

.edit-update-btn {
  flex: 1;
  background: linear-gradient(135deg, #0284c7 0%, #06b6d4 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
  font-weight: 900;
  font-size: 0.95rem;
  padding: 1.1rem 2.2rem;
}

.edit-update-btn:hover {
  background: linear-gradient(135deg, #0369a1 0%, #0891b2 100%);
  box-shadow: 0 8px 20px rgba(14, 165, 233, 0.4);
  transform: translateY(-3px);
}

.edit-cancel-btn {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  color: #0284c7;
  border: 2px solid #7dd3fc;
  font-weight: 900;
}

.edit-cancel-btn:hover {
  background: linear-gradient(135deg, #e0f2fe 0%, #cffafe 100%);
  border-color: #0284c7;
}

.edit-active {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
  color: white !important;
  border-color: #dc2626 !important;
}

.checksum-valid {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  border-left-color: #22c55e !important;
}

.copy-btn {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  color: #0284c7;
  border: 2px solid #7dd3fc;
  padding: 0.75rem 1.2rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0px;
  box-shadow: 0 2px 6px rgba(14, 165, 233, 0.15);
}

.copy-btn:hover {
  background: linear-gradient(135deg, #0284c7 0%, #06b6d4 100%);
  color: white;
  border-color: #0284c7;
  box-shadow: 0 6px 12px rgba(14, 165, 233, 0.3);
  transform: translateY(-2px);
}

.crc-link {
  margin-left: auto;
  color: #0066cc;
  text-decoration: none;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.4rem 0.6rem;
  border: 1px solid #0066cc;
  border-radius: 2px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.crc-link:hover {
  background: #0066cc;
  color: white;
}

/* TLV Tree Structure */
.tlv-tree {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.8rem;
  line-height: 1.8;
  background: white;
  color: #000000;
}

.tree-item {
  padding: 0.6rem 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  border-left: 3px solid transparent;
  padding-left: 1rem;
  transition: all 0.3s ease;
  border-radius: 4px;
  cursor: pointer;
}

.tree-item:hover {
  background-color: #f0f9ff;
  border-left-color: #06b6d4;
  padding-left: 1.2rem;
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(6, 182, 212, 0.1);
}

.tree-tag {
  background: linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%);
  color: #0c4a6e;
  padding: 0.35rem 0.6rem;
  border: 2px solid #06b6d4;
  font-weight: 800;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 0.8rem;
}

.tree-item:hover .tree-tag {
  background: linear-gradient(135deg, #7dd3fc 0%, #06b6d4 100%);
  color: white;
  transform: scale(1.08);
  box-shadow: 0 2px 8px rgba(6, 182, 212, 0.3);
}

.copy-item-btn {
  margin-left: auto;
  background: transparent;
  border: none;
  color: #06b6d4;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  opacity: 0;
}

.tree-item:hover .copy-item-btn {
  opacity: 1;
}

.copy-item-btn:hover {
  background: #e0f2fe;
  color: #0284c7;
}

.copy-item-btn.copied {
  color: #16a34a;
}

.tree-length {
  background: linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%);
  color: #0c4a6e;
  padding: 0.35rem 0.6rem;
  border: 2px solid #3b82f6;
  font-weight: 800;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 0.8rem;
}

.tree-item:hover .tree-length {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  color: white;
  transform: scale(1.08);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.tree-data {
  background: linear-gradient(135deg, #86efac 0%, #4ade80 100%);
  color: #ffffff;
  padding: 0.35rem 0.6rem;
  border: 2px solid #22c55e;
  font-weight: 700;
  border-radius: 4px;
  word-break: break-all;
  transition: all 0.2s ease;
  font-size: 0.8rem;
}

.tree-item:hover .tree-data {
  background: linear-gradient(135deg, #4ade80 0%, #16a34a 100%);
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
}

.tree-meaning {
  color: #0284c7;
  font-size: 0.8rem;
  font-weight: 700;
  font-style: italic;
  margin-left: 0.8rem;
}

.tree-timestamp {
  padding: 0.5rem 0;
  padding-left: 3rem;
  display: flex;
  gap: 0.5rem;
}

.tree-timestamp .tree-meaning {
  color: #06b6d4;
  font-style: normal;
  font-weight: 800;
  margin-left: 0;
}

.tree-sublayer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.8rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #7dd3fc;
  border-radius: 0px;
  width: 100%;
  margin-left: 0.5rem;
  animation: slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-15px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tree-subitem-line {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  align-items: center;
  padding: 0.5rem;
  background: white;
  border: 1px solid #000000;
  border-radius: 0px;
  width: 100%;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInUp 0.3s ease forwards;
}

.tree-sublayer>.tree-subitem-line:nth-child(1) {
  animation-delay: 0.1s;
}

.tree-sublayer>.tree-subitem-line:nth-child(3) {
  animation-delay: 0.2s;
}

.tree-sublayer>.tree-subitem-line:nth-child(5) {
  animation-delay: 0.3s;
}

.tree-subitem-line:hover {
  background: #f9f9f9;
  transform: translateX(3px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tree-subitem-timestamp {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.3rem 0.4rem;
  font-size: 0.7rem;
}

.tree-subitem-conversion {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.4rem 0.5rem;
  font-size: 0.7rem;
  padding-left: 2.5rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 0px;
}

.tree-subitem-timestamp .tree-meaning {
  color: #0066cc;
  font-style: normal;
  font-weight: 600;
  margin-left: 0;
}

.tree-subitem-conversion .tree-meaning {
  color: #0066cc;
  font-style: normal;
  font-weight: 600;
  margin-left: 0;
}

.timestamp-expired {
  background: #fef2f2 !important;
  border-color: #ef4444 !important;
}

.timestamp-expired .tree-meaning {
  color: #ef4444 !important;
}

.tree-data-long {
  background: #b8b8b8;
  color: #ffffff;
  padding: 0.25rem 0.4rem;
  border: 1px solid #000000;
  font-weight: 600;
  border-radius: 2px;
  word-break: break-all;
  max-width: 100%;
}

.generate-result {
  padding: 1.25rem 1.5rem;
  background: white;
  overflow-y: auto;
}

.qr-display-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.25rem;
  background: white;
  border: 1px solid #000000;
  border-radius: 0px;
  margin: 1rem 0;
}

.qr-image {
  max-width: 100%;
  height: auto;
  border-radius: 0px;
  box-shadow: none;
}

.download-options {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #f5f5f5;
  border: 1px solid #000000;
  border-radius: 0px;
  margin-bottom: 1rem;
}

.download-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #000000;
  white-space: nowrap;
}

.download-select {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #000000;
  border-radius: 0px;
  font-size: 14px;
  font-family: inherit;
  color: #000000;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.download-select:hover {
  border-color: #000000;
}

.download-select:focus {
  outline: none;
  border-color: #000000;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.qr-data-display {
  margin-top: 1rem;
}

.data-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: #000000;
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.data-content {
  background: white;
  border: 1px solid #000000;
  border-radius: 0px;
  padding: 0.75rem;
  margin: 0;
  font-size: 0.75rem;
  overflow-x: auto;
  word-break: break-all;
  color: #000000;
  font-family: 'Monaco', 'Courier New', monospace;
  line-height: 1.4;
  max-height: 200px;
  transition: background-color 0.2s ease;
}

@media (max-width: 1200px) {
  .tlv-tree {
    font-size: 0.75rem;
  }
}

/* Mobile Responsive - Tablet and Below */
@media (max-width: 768px) {
  * {
    touch-action: manipulation;
  }

  .header {
    padding: 1.5rem 1.2rem;
    border-bottom: 3px solid #0284c7;
  }

  .title {
    font-size: 1.6rem;
    font-weight: 900;
    letter-spacing: -0.5px;
  }

  .subtitle {
    font-size: 0.8rem;
    margin-top: 0.4rem;
  }

  .tab-navigation {
    padding: 0 0.8rem;
    gap: 0;
    top: 5rem;
  }

  .tab-button {
    padding: 1rem 1rem;
    font-size: 0.85rem;
    gap: 0.4rem;
    flex: 1;
    justify-content: center;
  }

  .tab-icon {
    font-size: 1rem;
  }

  .input-area {
    padding: 1.5rem 1.2rem;
    gap: 1.2rem;
  }

  .sample-selector {
    flex-direction: column;
    padding: 1.2rem;
    margin-bottom: 1.5rem;
  }

  .sample-label {
    font-size: 0.9rem;
    width: 100%;
  }

  .sample-select {
    width: 100%;
    padding: 0.9rem;
    font-size: 15px;
  }

  .input-field {
    height: 120px;
    padding: 1rem;
    font-size: 16px;
    margin-bottom: 1rem;
    border-radius: 10px;
  }

  .input-field::placeholder {
    font-size: 14px;
  }

  .action-buttons {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .action-buttons .btn {
    flex: 1;
    padding: 0.9rem 1.2rem;
    font-size: 0.9rem;
    border-radius: 10px;
  }

  .btn {
    width: auto;
    padding: 0.9rem 1.2rem;
    font-size: 0.9rem;
    border-radius: 10px;
  }

  .btn-secondary {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    color: #0284c7;
    border: 2px solid #7dd3fc;
  }

  .summary-card {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1.2rem;
    margin-bottom: 1.5rem;
    border-radius: 12px;
  }

  .summary-item {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 0.8rem 0;
    border-bottom: 1px solid rgba(14, 165, 233, 0.1);
  }

  .summary-item:last-child {
    border-bottom: none;
  }

  .summary-label {
    font-size: 0.8rem;
    font-weight: 900;
  }

  .summary-value {
    font-size: 0.95rem;
    font-weight: 700;
  }

  .live-preview-toggle {
    padding: 1.2rem;
    margin-bottom: 1.5rem;
    border-radius: 10px;
  }

  .toggle-text {
    font-size: 0.9rem;
  }

  .result-section {
    padding: 1.5rem 1.2rem;
    padding-bottom: 200px;
  }

  .result-header {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    flex-direction: column;
    gap: 1rem;
  }

  .result-header h2 {
    font-size: 1.3rem;
    width: 100%;
  }

  .header-buttons {
    width: 100%;
    display: flex;
    gap: 0.8rem;
  }

  .copy-btn {
    padding: 0.8rem 1rem;
    font-size: 0.8rem;
    border-radius: 8px;
    flex: 1;
  }

  .edit-panel {
    padding: 1.5rem 1.2rem;
    margin-bottom: 1.5rem;
    border-radius: 12px;
  }

  .edit-field {
    margin-bottom: 1.5rem;
    gap: 0.6rem;
  }

  .edit-field label {
    font-size: 0.9rem;
    font-weight: 900;
  }

  .edit-input,
  .edit-select {
    padding: 0.9rem;
    font-size: 16px;
    border-radius: 8px;
  }

  .edit-actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1.5rem;
    padding-top: 1.2rem;
  }

  .edit-update-btn,
  .edit-cancel-btn {
    width: 100%;
    padding: 1rem 1.2rem;
  }

  .tree-item {
    padding: 0.7rem 0;
    gap: 0.4rem;
  }

  .tree-item:hover {
    padding-left: 1rem;
  }

  .tree-tag,
  .tree-length,
  .tree-data {
    font-size: 0.75rem;
    padding: 0.3rem 0.5rem;
  }

  .tree-meaning {
    font-size: 0.7rem;
    margin-left: 0.4rem;
  }

  .copy-item-btn {
    opacity: 1;
    padding: 0.4rem 0.5rem;
    font-size: 0.75rem;
  }

  .tlv-tree {
    font-size: 0.8rem;
  }

  .live-preview-toggle {
    flex-direction: column;
    padding: 1.2rem;
  }

  .toggle-label {
    width: 100%;
    justify-content: space-between;
  }

  .notification {
    right: 15px;
    top: 20px;
    padding: 1rem 1.2rem;
    font-size: 0.85rem;
    border-radius: 10px;
  }
}

/* Extra Small Phones - Below 480px */
@media (max-width: 480px) {
  .header {
    padding: 1.2rem 1rem;
  }

  .title {
    font-size: 1.4rem;
  }

  .subtitle {
    font-size: 0.75rem;
  }

  .tab-navigation {
    padding: 0 0.5rem;
  }

  .tab-button {
    padding: 0.85rem 0.5rem;
    font-size: 0.75rem;
  }

  .input-area {
    padding: 1.2rem 1rem;
  }

  .sample-selector {
    padding: 1rem;
  }

  .input-field {
    height: 100px;
    padding: 0.9rem;
  }

  .btn {
    padding: 0.85rem 1rem;
    font-size: 0.85rem;
    border-radius: 8px;
  }

  .summary-card {
    padding: 1rem;
    gap: 0.8rem;
  }

  .summary-label {
    font-size: 0.75rem;
  }

  .summary-value {
    font-size: 0.9rem;
  }

  .result-section {
    padding: 1.2rem 1rem;
  }

  .result-header h2 {
    font-size: 1.2rem;
  }

  .edit-panel {
    padding: 1.2rem 1rem;
  }

  .edit-input,
  .edit-select {
    padding: 0.8rem;
    font-size: 16px;
  }

  .tree-tag,
  .tree-length,
  .tree-data {
    font-size: 0.7rem;
  }

  .tree-meaning {
    font-size: 0.65rem;
  }

  .notification {
    right: 10px;
    top: 15px;
    padding: 0.9rem 1rem;
    font-size: 0.8rem;
  }

  .copy-item-btn {
    padding: 0.3rem 0.4rem;
    font-size: 0.7rem;
  }
}

.notification {
  position: fixed;
  top: 30px;
  right: 30px;
  padding: 1.2rem 1.8rem;
  border-radius: 12px;
  font-weight: 800;
  font-size: 0.95rem;
  z-index: 9999;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.notification-success {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #166534;
  border: 2px solid #22c55e;
}

.notification-info {
  background: linear-gradient(135deg, #e0f2fe 0%, #cffafe 100%);
  color: #0c4a6e;
  border: 2px solid #06b6d4;
}

.notification-error {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
  border: 2px solid #ef4444;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Smooth, Non-Glitchy Animations */
@keyframes slideUpIn {
  from {
    transform: translateY(20px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fadeInScale {
  from {
    transform: scale(0.98);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes glowPulse {

  0%,
  100% {
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
  }

  50% {
    box-shadow: 0 6px 16px rgba(14, 165, 233, 0.25);
  }
}

@keyframes bobbing {

  0%,
  100% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(-6px);
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>