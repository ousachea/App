<template>
  <div class="container">
    <PageSwitcher />
    <div class="scanner-card">
      <div class="header">
        <h1 class="title">KHQR Scanner</h1>
        <p class="subtitle">Decode and analyze QR codes</p>
      </div>

      <div class="tab-navigation">
        <button @click="activeTab = 'decode'" :class="['tab-button', { active: activeTab === 'decode' }]">
          🔍 Decode
        </button>
        <button @click="activeTab = 'generate'" :class="['tab-button', { active: activeTab === 'generate' }]">
          ✨ Generate
        </button>
      </div>

      <!-- Decode Tab -->
      <div v-show="activeTab === 'decode'" class="tab-content">
        <div class="input-area">
          <label class="upload-zone">
            <input type="file" @change="decodeQR" accept="image/*" class="file-input" />
            <div class="upload-content">
              <span class="upload-icon">📷</span>
              <span class="upload-text">Upload image</span>
              <span class="upload-hint">PNG, JPG, GIF</span>
            </div>
          </label>

          <div class="divider">
            <span>or paste</span>
          </div>

          <textarea v-model="manualQRInput" placeholder="Paste QR code data..." class="input-field"></textarea>

          <div class="action-buttons">
            <button @click="decodeManualQR" class="btn btn-primary">
              Decode
            </button>
            <button @click="clearData" class="btn btn-secondary">
              Clear
            </button>
          </div>
        </div>
      </div>

      <!-- Results - TLV Tree Structure -->
      <div v-if="qrResult && activeTab === 'decode'" class="result-section">
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
          <button @click="updateMerchantData" class="btn btn-primary" style="margin-top: 1rem;">
            ✅ Update & Regenerate QR
          </button>
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

          <!-- Tag 62: Additional Data -->
          <div class="tree-item" v-if="parsedTLV['62']">
            <span class="tree-tag">62</span>
            <span class="tree-length">{{ formatLength(parsedTLV['62'].length) }}</span>
            <span class="tree-data-long">{{ parsedTLV['62'].value }}</span>
            <span class="tree-meaning">= Additional Data</span>
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
              <div class="tree-subitem-conversion" v-if="headerInfo.timestampNested['00']">
                <span class="tree-meaning">→ {{ getTimestampReadable(headerInfo.timestampNested['00'].value) }}</span>
              </div>

              <div class="tree-subitem-line" v-if="headerInfo.timestampNested['01']">
                <span class="tree-tag">01</span>
                <span class="tree-length">{{ formatLength(headerInfo.timestampNested['01'].length) }}</span>
                <span class="tree-data">{{ headerInfo.timestampNested['01'].value }}</span>
                <span class="tree-meaning">= Expiry Time</span>
              </div>
              <div class="tree-subitem-conversion" v-if="headerInfo.timestampNested['01']">
                <span class="tree-meaning">→ {{ getTimestampReadable(headerInfo.timestampNested['01'].value) }}</span>
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
          </div>
        </div>
      </div>

      <!-- Generate Tab -->
      <div v-show="activeTab === 'generate'" class="tab-content">
        <div class="input-area">
          <textarea v-model="qrDataToGenerate" placeholder="Enter KHQR data to generate QR code..." class="input-field"
            style="height: 150px;"></textarea>

          <div class="action-buttons">
            <button @click="generateQRCode" class="btn btn-primary">
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
          <div class="qr-data-display">
            <h4 class="data-label" style="margin-top: 1rem;">Data</h4>
            <pre class="data-content">{{ qrDataToGenerate }}</pre>
          </div>
        </div>
      </div>

      <div class="raw-data" v-if="qrResult && activeTab === 'decode'">
        <h3 class="data-label">Raw Data</h3>
        <pre class="data-content">{{ qrResult }}</pre>
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
      cambodianBanks: [
        'ABA Bank',
        'Canadia Bank',
        'Chip Mong Bank',
        'ACLEDA Bank',
        'Phnom Penh Commercial Bank',
        'CPB Bank',
        'Maybank',
        'Vattanac Bank',
        'Hattha Bank',
        'Cambodia Post Bank',
        'KBC Bank',
        'Kambodian Bank for Development',
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
  },
  methods: {
    async decodeQR(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = await QrScanner.scanImage(e.target.result);
          this.processQRResult(result);
        } catch {
          this.qrResult = 'Could not decode QR code';
          this.headerInfo = {};
          this.parsedTLV = {};
        }
      };
      reader.readAsDataURL(file);
    },

    decodeManualQR() {
      if (this.manualQRInput.trim()) {
        this.processQRResult(this.manualQRInput.trim());
      }
    },

    processQRResult(qrString) {
      this.qrResult = qrString;
      this.parsedTLV = this.parseTLVStructure(qrString);
      this.headerInfo = this.extractHeaderInfo(this.parsedTLV);

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

        if (isNaN(length) || length < 0 || position + length > dataString.length) break;

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

      // Calculate and add new checksum
      const newChecksum = this.calculateCRC16(updatedResult);
      updatedResult = updatedResult + '63' + '04' + newChecksum;

      this.manualQRInput = updatedResult;
      this.processQRResult(updatedResult);
      this.editMode = false;
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
      link.href = this.generatedQRImage;
      link.download = `khqr-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
  background: #ffffff;
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
  box-shadow: none;
  margin: 0;
}

.header {
  background: #000000;
  border-bottom: none;
  padding: 1rem 1.5rem;
  text-align: left;
  position: sticky;
  top: 0;
  z-index: 10;
}

.title {
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0 0 0.1rem 0;
  color: #ffffff;
  letter-spacing: 0px;
}

.subtitle {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-weight: 400;
}

.tab-navigation {
  display: flex;
  gap: 0.5rem;
  padding: 0 1.5rem;
  background: white;
  border-bottom: 1px solid #000000;
  position: sticky;
  top: 3.5rem;
  z-index: 9;
}

.tab-button {
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: #666666;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0px;
}

.tab-button:hover {
  color: #000000;
}

.tab-button.active {
  color: #000000;
  border-bottom-color: #000000;
  animation: slideInDown 0.3s ease;
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
  padding: 1.25rem 1.5rem;
  flex-shrink: 0;
  background: white;
}

.upload-zone {
  display: block;
  border: 1px solid #000000;
  border-radius: 0px;
  padding: 1.25rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #ffffff;
}

.upload-zone:hover {
  border-color: #000000;
  background: #f5f5f5;
}

.file-input {
  display: none;
}

.upload-content {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.upload-icon {
  font-size: 2rem;
  line-height: 1;
}

.upload-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: #000000;
  letter-spacing: 0px;
}

.upload-hint {
  font-size: 0.7rem;
  color: #666666;
  font-weight: 400;
}

.divider {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  margin: 1rem 0;
  color: #999999;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #000000;
}

.input-field {
  width: 100%;
  height: 80px;
  padding: 0.75rem;
  border: 1px solid #000000;
  border-radius: 0px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 16px;
  resize: vertical;
  transition: all 0.3s ease;
  color: #000000;
  background: white;
}

.input-field:focus {
  outline: none;
  border-color: #000000;
  box-shadow: none;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn {
  flex: 1;
  padding: 0.65rem 1rem;
  border: none;
  border-radius: 0px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  color: #000000;
  letter-spacing: 0px;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(0);
}

.btn-primary {
  background: #000000;
  color: white;
  box-shadow: none;
}

.btn-primary:hover {
  background: #333333;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #ffffff;
  color: #000000;
  border: 1px solid #000000;
}

.btn-secondary:hover {
  background: #f5f5f5;
  border-color: #333333;
}

.result-section {
  padding: 1.25rem 1.5rem;
  padding-bottom: 170px;
  border-top: none;
  overflow-y: auto;
  background: white;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #000000;
}

.result-header h2 {
  font-size: 1rem;
  margin: 0;
  color: #000000;
  font-weight: 700;
  letter-spacing: 0px;
}

.header-buttons {
  display: flex;
  gap: 0.5rem;
}

.edit-panel {
  background: #f5f5f5;
  border: 2px solid #000000;
  border-radius: 0px;
  padding: 1rem;
  margin-bottom: 1rem;
  animation: slideDown 0.3s ease;
}

.edit-field {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.edit-field label {
  font-weight: 600;
  font-size: 0.85rem;
  color: #000000;
}

.edit-input,
.edit-select {
  padding: 0.6rem;
  border: 1px solid #000000;
  border-radius: 0px;
  font-size: 16px;
  font-family: inherit;
  color: #000000;
  background: white;
  transition: all 0.2s ease;
}

.edit-input:focus,
.edit-select:focus {
  outline: none;
  border-color: #000000;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.edit-input::placeholder {
  color: #999999;
}

.edit-active {
  background: #ff6b6b !important;
  color: white !important;
}

.checksum-valid {
  background: #f0fdf4;
  border-left-color: #22c55e !important;
}

.copy-btn {
  background: white;
  color: #000000;
  border: 1px solid #000000;
  padding: 0.5rem 0.8rem;
  border-radius: 0px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0px;
}

.copy-btn:hover {
  background: #000000;
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
  padding: 0.4rem 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  align-items: center;
  border-left: 2px solid transparent;
  padding-left: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 2px;
  cursor: pointer;
}

.tree-item:hover {
  background-color: #f0f0f0;
  border-left-color: #ff6b6b;
  padding-left: 1.2rem;
  transform: translateX(2px);
}

.tree-tag {
  background: #e8e8e8;
  color: #000000;
  padding: 0.25rem 0.4rem;
  border: 1px solid #000000;
  font-weight: 700;
  border-radius: 2px;
  transition: all 0.2s ease;
}

.tree-item:hover .tree-tag {
  background: #d0d0d0;
  transform: scale(1.05);
}

.tree-length {
  background: #d0d0d0;
  color: #000000;
  padding: 0.25rem 0.4rem;
  border: 1px solid #000000;
  font-weight: 700;
  border-radius: 2px;
  transition: all 0.2s ease;
}

.tree-item:hover .tree-length {
  background: #b8b8b8;
  transform: scale(1.05);
}

.tree-data {
  background: #b8b8b8;
  color: #ffffff;
  padding: 0.25rem 0.4rem;
  border: 1px solid #000000;
  font-weight: 600;
  border-radius: 2px;
  word-break: break-all;
  transition: all 0.2s ease;
}

.tree-item:hover .tree-data {
  background: #9a9a9a;
  transform: scale(1.02);
}

.tree-meaning {
  color: #333333;
  font-size: 0.75rem;
  font-weight: 500;
  font-style: italic;
  margin-left: 0.5rem;
}

.tree-timestamp {
  padding: 0.3rem 0;
  padding-left: 3rem;
  display: flex;
  gap: 0.3rem;
}

.tree-timestamp .tree-meaning {
  color: #0066cc;
  font-style: normal;
  font-weight: 600;
  margin-left: 0;
}

.tree-sublayer {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-top: 0.8rem;
  padding: 0.75rem;
  background: #f5f5f5;
  border: 2px solid #000000;
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

.qr-data-display {
  margin-top: 1rem;
}

.raw-data {
  margin-bottom: 1rem;
  padding: 0 1.5rem;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 2px solid #000000;
  z-index: 50;
  max-height: 150px;
  overflow-y: auto;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
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

@media (max-width: 768px) {
  .header {
    padding: 0.8rem 1rem;
  }

  .title {
    font-size: 1.1rem;
    margin-bottom: 0.05rem;
  }

  .subtitle {
    font-size: 0.7rem;
  }

  .tab-navigation {
    padding: 0 1rem;
    top: 3rem;
  }

  .tab-button {
    padding: 0.4rem 0.8rem;
    font-size: 0.75rem;
  }

  .input-area {
    padding: 1rem 1rem;
  }

  .result-section {
    padding: 1rem 1rem;
  }

  .tlv-tree {
    font-size: 0.7rem;
    line-height: 1.5;
  }

  .tree-item {
    padding: 0.35rem 0;
    padding-left: 0.75rem;
  }

  .tree-children {
    margin-left: 1.5rem;
    padding-left: 0.75rem;
  }

  .tree-code {
    padding: 0.15rem 0.4rem;
    font-size: 0.7rem;
  }
}
</style>