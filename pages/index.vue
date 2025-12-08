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

      <div v-if="qrResult && activeTab === 'decode'" class="result-section">
        <div class="result-header">
          <h2>Result</h2>
          <button @click="copyToClipboard" class="copy-btn">
            📋 {{ copyText }}
          </button>
        </div>

        <!-- Format Information -->
        <div class="header-info">
          <h3 class="data-label">Format Information</h3>
          <div class="format-grid">
            <div class="format-card" v-if="headerInfo.payloadIndicator">
              <div class="format-label">Payload Format Indicator</div>
              <div class="format-code">{{ headerInfo.payloadIndicator.code }}</div>
              <div class="format-desc">= {{ headerInfo.payloadIndicator.fullDescription }}</div>
            </div>
            <div class="format-card" v-if="headerInfo.initiationMethod">
              <div class="format-label">Point Of Initiation Method</div>
              <div class="format-code">{{ headerInfo.initiationMethod.code }}</div>
              <div class="format-desc">= {{ headerInfo.initiationMethod.type }} ({{
                headerInfo.initiationMethod.fullDescription }})</div>
            </div>
            <div class="format-card" v-if="headerInfo.merchantType">
              <div class="format-label">Merchant Type</div>
              <div class="format-code">{{ headerInfo.merchantType.code }}</div>
              <div class="format-desc">= {{ headerInfo.merchantType.fullDescription }}</div>
            </div>
          </div>

          <!-- TLV Information -->
          <div class="tlv-section">
            <h3 class="data-label" style="margin-top: 1.5rem;">TLV Information</h3>
            <div class="format-grid">
              <!-- Tag 51: Bank Info -->
              <div class="format-card format-card-nested" v-if="headerInfo.bankInfoTag">
                <div class="tag-header">
                  <span class="tag-number">51</span>
                  <span class="tag-subtitle">Bank Info</span>
                </div>

                <!-- Nested sub-tags for Tag 51 -->
                <div class="nested-tags" v-if="headerInfo.bankInfoNested">
                  <div class="sub-tag" v-if="headerInfo.bankInfoNested['00']">
                    <div class="sub-tag-header">
                      <span class="sub-tag-number">00</span>
                      <span class="sub-tag-label">Bakong ID</span>
                    </div>
                    <div class="sub-tag-value">{{ headerInfo.bankInfoNested['00'].value }}</div>
                  </div>

                  <div class="sub-tag" v-if="headerInfo.bankInfoNested['01']">
                    <div class="sub-tag-header">
                      <span class="sub-tag-number">01</span>
                      <span class="sub-tag-label">Merchant ID</span>
                    </div>
                    <div class="sub-tag-value">{{ headerInfo.bankInfoNested['01'].value }}</div>
                  </div>

                  <div class="sub-tag" v-if="headerInfo.bankInfoNested['02']">
                    <div class="sub-tag-header">
                      <span class="sub-tag-number">02</span>
                      <span class="sub-tag-label">Bank Name</span>
                    </div>
                    <div class="sub-tag-value">{{ headerInfo.bankInfoNested['02'].value }}</div>
                  </div>
                </div>
              </div>

              <!-- Tag 52: Merchant Category Code -->
              <div class="format-card" v-if="headerInfo.merchantCategoryTag">
                <div class="tag-header">
                  <span class="tag-number">52</span>
                  <span class="tag-subtitle">Merchant Category Code</span>
                </div>
                <div class="tag-meta">
                  <div class="meta-item">
                    <span class="meta-label">Val</span>
                    <span class="meta-value">{{ headerInfo.merchantCategoryTag.value }}</span>
                  </div>
                </div>
                <div class="tag-description">
                  {{ getMerchantCategoryDescription(headerInfo.merchantCategoryTag.value) }}
                </div>
              </div>

              <!-- Tag 53: Transaction Currency -->
              <div class="format-card" v-if="headerInfo.currencyTag">
                <div class="tag-header">
                  <span class="tag-number">53</span>
                  <span class="tag-subtitle">Transaction Currency</span>
                </div>
                <div class="tag-meta">
                  <div class="meta-item">
                    <span class="meta-label">Val</span>
                    <span class="meta-value">{{ headerInfo.currencyTag.value }}</span>
                  </div>
                  <div class="tag-description">
                    {{ getCurrencyDescription(headerInfo.currencyTag.value) }}
                  </div>
                </div>

                <!-- Tag 54: Transaction Amount -->
                <div class="format-card" v-if="headerInfo.amountTag">
                  <div class="tag-header">
                    <span class="tag-number">54</span>
                    <span class="tag-subtitle">Transaction Amount</span>
                  </div>
                  <div class="tag-meta">
                    <div class="meta-item">
                      <span class="meta-label">Val</span>
                      <span class="meta-value">{{ headerInfo.amountTag.value }}</span>
                    </div>
                  </div>
                </div>

                <!-- Tag 58: Country Code -->
                <div class="format-card" v-if="headerInfo.countryTag">
                  <div class="tag-header">
                    <span class="tag-number">58</span>
                    <span class="tag-subtitle">Country Code</span>
                  </div>
                  <div class="tag-meta">
                    <div class="meta-item">
                      <span class="meta-label">Val</span>
                      <span class="meta-value">{{ headerInfo.countryTag.value }}</span>
                    </div>
                  </div>
                  <div class="tag-description">
                    {{ getCountryDescription(headerInfo.countryTag.value) }}
                  </div>
                </div>

                <!-- Tag 59: Merchant Name -->
                <div class="format-card" v-if="headerInfo.merchantNameTag">
                  <div class="tag-header">
                    <span class="tag-number">59</span>
                    <span class="tag-subtitle">Merchant Name</span>
                  </div>
                  <div class="tag-meta">
                    <div class="meta-item">
                      <span class="meta-label">Val</span>
                      <span class="meta-value">{{ headerInfo.merchantNameTag.value }}</span>
                    </div>
                  </div>
                  <div class="tag-description">Merchant Name</div>
                </div>

                <!-- Tag 60: Merchant City -->
                <div class="format-card" v-if="headerInfo.merchantCityTag">
                  <div class="tag-header">
                    <span class="tag-number">60</span>
                    <span class="tag-subtitle">Merchant City</span>
                  </div>
                  <div class="tag-meta">
                    <div class="meta-item">
                      <span class="meta-label">Val</span>
                      <span class="meta-value">{{ headerInfo.merchantCityTag.value }}</span>
                    </div>
                  </div>
                </div>

                <!-- Tag 63: Encryption -->
                <div class="format-card" v-if="headerInfo.encryptionTag">
                  <div class="tag-header">
                    <span class="tag-number">63</span>
                    <span class="tag-subtitle">Encryption</span>
                  </div>
                  <div class="tag-meta">
                    <div class="meta-item">
                      <span class="meta-label">Val</span>
                      <span class="meta-value">{{ headerInfo.encryptionTag.value }}</span>
                    </div>
                  </div>
                  <div class="tag-description">
                    {{ getEncryptionDescription(headerInfo.encryptionTag.value) }}
                  </div>
                </div>

                <!-- Tag 99: Timestamp -->
                <div class="format-card format-card-nested" v-if="headerInfo.timestampTag">
                  <div class="tag-header">
                    <span class="tag-number">99</span>
                    <span class="tag-subtitle">Timestamp</span>
                  </div>
                  <div class="tag-meta">
                    <div class="meta-item">
                      <span class="meta-label">Len</span>
                      <span class="meta-value">{{ headerInfo.timestampTag.length }}</span>
                    </div>
                  </div>

                  <div class="nested-tags" v-if="headerInfo.timestampNested">
                    <div class="sub-tag" v-if="headerInfo.timestampNested['00']">
                      <div class="sub-tag-header">
                        <span class="sub-tag-number">00</span>
                        <span class="sub-tag-label">Create Time</span>
                      </div>
                      <div class="sub-tag-value">{{ headerInfo.timestampNested['00'].value }}</div>
                      <div class="sub-tag-converted">{{ getTimestampReadable(headerInfo.timestampNested['00'].value) }}
                      </div>
                      <div class="sub-tag-note">13 digits (UNIX timestamp ms)</div>
                    </div>

                    <div class="sub-tag" v-if="headerInfo.timestampNested['01']">
                      <div class="sub-tag-header">
                        <span class="sub-tag-number">01</span>
                        <span class="sub-tag-label">Expiry Time</span>
                      </div>
                      <div class="sub-tag-value">{{ headerInfo.timestampNested['01'].value }}</div>
                      <div class="sub-tag-converted">{{ getTimestampReadable(headerInfo.timestampNested['01'].value) }}
                      </div>
                      <div class="sub-tag-note">13 digits (UNIX timestamp ms)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="raw-data" v-if="qrResult && activeTab === 'decode'">
          <h3 class="data-label">Raw Data</h3>
          <pre class="data-content">{{ qrResult }}</pre>
        </div>

        <!-- Generate Tab -->
        <div v-show="activeTab === 'generate'" class="tab-content">
          <div class="input-area">
            <textarea v-model="qrDataToGenerate" placeholder="Enter KHQR data to generate QR code..."
              class="input-field" style="height: 150px;"></textarea>

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
              <h4 class="data-label" style="margin-top: 1.5rem;">Data</h4>
              <pre class="data-content">{{ qrDataToGenerate }}</pre>
            </div>
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
      headerInfo: {},
      manualQRInput: '00020101021230510016abaakhppxxx@abaa01151211209110909710208ABA Bank52047392530384054041.895802KH5919Ousa Chea by O.CHEA6010PHNOM PENH626368590010PAYWAY@ABA01061894950208031956110619408730268109455322Q993400131764302681094011317643029810946304D962',
      copyText: 'Copy',
      activeTab: 'decode',
      generatedQRImage: null,
      qrDataToGenerate: '',
      versionMap: {
        '000201': 'KHQR Version 1',
        '000202': 'KHQR Version 2',
      },
      initiationMap: {
        '010211': 'Static QR',
        '010212': 'Dynamic QR',
      },
      merchantTypeMap: {
        '29': 'Remittance',
        '30': 'Merchant',
      },
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
      encryptionCodeMap: {
        '098B': 'AES Encryption',
        '0001': 'No Encryption',
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
    // Auto-decode sample data on load
    if (this.manualQRInput.trim()) {
      this.$nextTick(() => {
        this.decodeManualQR();
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

      // Parse the entire TLV structure
      const tlvData = this.parseTLVStructure(qrString);

      // Extract header info from first tags
      this.headerInfo = this.extractHeaderInfo(tlvData);

      // Extract specific tags for display
      if (tlvData['51']) {
        this.headerInfo.bankInfoTag = tlvData['51'];
        this.headerInfo.bankInfoNested = this.parseTLVStructure(tlvData['51'].value);
      }
      if (tlvData['52']) this.headerInfo.merchantCategoryTag = tlvData['52'];
      if (tlvData['53']) this.headerInfo.currencyTag = tlvData['53'];
      if (tlvData['54']) this.headerInfo.amountTag = tlvData['54'];
      if (tlvData['58']) this.headerInfo.countryTag = tlvData['58'];
      if (tlvData['59']) this.headerInfo.merchantNameTag = tlvData['59'];
      if (tlvData['60']) this.headerInfo.merchantCityTag = tlvData['60'];
      if (tlvData['63']) this.headerInfo.encryptionTag = tlvData['63'];
      if (tlvData['99']) {
        this.headerInfo.timestampTag = tlvData['99'];
        this.headerInfo.timestampNested = this.parseTLVStructure(tlvData['99'].value);
      }
    },

    parseTLVStructure(dataString) {
      const result = {};
      let position = 0;

      while (position < dataString.length - 1) {
        // Read tag (2 characters)
        if (position + 2 > dataString.length) break;
        const tag = dataString.substring(position, position + 2);
        position += 2;

        // Read length (2 characters)
        if (position + 2 > dataString.length) break;
        const lengthStr = dataString.substring(position, position + 2);
        const length = parseInt(lengthStr, 10);
        position += 2;

        // Validate length
        if (isNaN(length) || length < 0 || position + length > dataString.length) {
          break;
        }

        // Read value
        const value = dataString.substring(position, position + length);
        position += length;

        // Store in result
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

      // Get payload indicator from tag 00
      if (tlvData['00']) {
        const raw = tlvData['00'].value;
        const versionKey = raw.substring(0, 6);
        const description = this.versionMap[versionKey] || 'Unknown Version';
        info.payloadIndicator = {
          raw,
          code: versionKey,
          description: `${versionKey} = ${description}`,
          fullDescription: description,
        };
      }

      // Get initiation method from tag 01
      if (tlvData['01']) {
        const raw = tlvData['01'].value;
        const initiationKey = raw.substring(0, 6);
        const initiationType = initiationKey === '010211' ? 'Static' : initiationKey === '010212' ? 'Dynamic' : 'Unknown';
        const description = this.initiationMap[initiationKey] || 'Unknown Type';
        info.initiationMethod = {
          raw,
          code: initiationKey,
          type: initiationType,
          description: `${initiationKey} = ${initiationType} (${description})`,
          fullDescription: description,
        };
      }

      // Get merchant type from tag 30
      if (tlvData['30']) {
        const raw = tlvData['30'].value;
        const merchantTypeKey = raw.substring(0, 2);
        const merchantDesc = this.merchantTypeMap[merchantTypeKey] || 'Unknown Type';
        info.merchantType = {
          raw,
          code: merchantTypeKey,
          description: `${merchantTypeKey} = ${merchantDesc}`,
          fullDescription: merchantDesc,
        };
      }

      return info;
    },

    clearData() {
      this.qrResult = '';
      this.headerInfo = {};
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

    getCurrencyDescription(code) {
      const codeStr = String(code).padStart(3, '0');
      return this.currencyCodeMap[codeStr] || `Currency Code: ${code}`;
    },

    getEncryptionDescription(code) {
      return this.encryptionCodeMap[code] || `Encryption: ${code}`;
    },

    getCountryDescription(code) {
      return this.countryCodeMap[code] || `Country: ${code}`;
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

    formatTimestamp(timestamp) {
      if (!timestamp) return 'Invalid timestamp';

      // Handle 13-digit millisecond timestamps
      let ms = parseInt(timestamp, 10);
      if (isNaN(ms)) return 'Invalid timestamp';

      try {
        const date = new Date(ms);
        return date.toISOString().replace('T', ' ').slice(0, 19);
      } catch {
        return 'Invalid timestamp';
      }
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
          timeZone: 'UTC'
        };
        return date.toLocaleString('en-US', options) + ' UTC';
      } catch {
        return '';
      }
    },

    getTagDescription(tagNumber) {
      const descriptions = {
        '51': 'Bank Info',
        '52': 'Merchant Category Code',
        '53': 'Transaction Currency',
        '54': 'Transaction Amount',
        '58': 'Country Code',
        '59': 'Merchant Name',
        '60': 'Merchant City',
        '63': 'Encryption',
        '99': 'Timestamp',
      };
      return descriptions[tagNumber] || `Tag ${tagNumber}`;
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
  transition: all 0.3s ease;
  letter-spacing: 0px;
}

.tab-button:hover {
  color: #000000;
}

.tab-button.active {
  color: #000000;
  border-bottom-color: #000000;
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
  font-size: 0.85rem;
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
  transition: all 0.3s ease;
  background: white;
  color: #000000;
  letter-spacing: 0px;
}

.btn-primary {
  background: #000000;
  color: white;
  box-shadow: none;
}

.btn-primary:hover {
  background: #333333;
}

.btn-secondary {
  background: #ffffff;
  color: #000000;
  border: 1px solid #000000;
}

.btn-secondary:hover {
  background: #f5f5f5;
}

.result-section {
  padding: 1.25rem 1.5rem;
  border-top: none;
  overflow-y: auto;
  background: white;
}

.header-info {
  margin-bottom: 1.25rem;
}

.format-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 1rem 0 0 0;
}

.format-card {
  border: 1px solid #000000;
  padding: 1rem;
  border-radius: 0px;
  background: white;
  transition: all 0.3s ease;
}

.format-card:hover {
  border-color: #000000;
  background: #f5f5f5;
}

.tag-header {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #000000;
}

.tag-number {
  font-size: 1.2rem;
  font-weight: 700;
  color: #000000;
  font-family: 'Monaco', 'Courier New', monospace;
  line-height: 1;
}

.tag-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.meta-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #666666;
  letter-spacing: 0.4px;
}

.meta-value {
  font-size: 0.8rem;
  font-weight: 600;
  color: #000000;
  font-family: 'Monaco', 'Courier New', monospace;
  background: white;
  padding: 0.35rem 0.5rem;
  border-radius: 0px;
  border-left: 2px solid #000000;
}

.tag-description {
  font-size: 0.75rem;
  color: #333333;
  font-weight: 500;
  line-height: 1.4;
  margin-top: 0.5rem;
}

.tlv-section {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid #000000;
}

.format-card-nested {
  grid-column: span 3;
}

.tag-subtitle {
  font-size: 0.65rem;
  color: #666666;
  font-weight: 600;
  margin-left: 0.4rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.nested-tags {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #000000;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.sub-tag {
  background: white;
  border: 1px solid #000000;
  border-radius: 0px;
  padding: 0.75rem;
  transition: all 0.3s ease;
}

.sub-tag:hover {
  border-color: #000000;
  background: #f5f5f5;
}

.sub-tag-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}

.sub-tag-number {
  font-size: 0.75rem;
  font-weight: 700;
  color: #ffffff;
  font-family: 'Monaco', 'Courier New', monospace;
  background: #000000;
  padding: 0.25rem 0.4rem;
  border-radius: 0px;
  min-width: 1.8rem;
  text-align: center;
}

.sub-tag-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: #000000;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.sub-tag-value {
  font-size: 0.8rem;
  font-weight: 600;
  color: #000000;
  font-family: 'Monaco', 'Courier New', monospace;
  word-break: break-all;
  margin-bottom: 0.3rem;
  background: white;
  padding: 0.35rem;
  border-radius: 0px;
  border-left: 2px solid #000000;
}

.sub-tag-converted {
  font-size: 0.75rem;
  font-weight: 600;
  color: #000000;
  background: #f5f5f5;
  padding: 0.4rem 0.35rem;
  border-radius: 0px;
  border-left: 2px solid #000000;
  margin-bottom: 0.3rem;
  word-break: break-all;
}

.sub-tag-note {
  font-size: 0.65rem;
  color: #666666;
  font-style: italic;
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

.raw-data {
  margin-bottom: 1rem;
  padding: 0 1.5rem;
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
  max-height: 250px;
}

.format-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #666666;
  letter-spacing: 0.4px;
  margin-bottom: 0.4rem;
}

.format-code {
  font-size: 0.9rem;
  font-weight: 700;
  color: #000000;
  font-family: 'Monaco', 'Courier New', monospace;
  margin-bottom: 0.4rem;
}

.format-desc {
  font-size: 0.75rem;
  color: #333333;
  line-height: 1.3;
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

@media (max-width: 1200px) {
  .format-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .format-card-nested {
    grid-column: span 2;
  }

  .nested-tags {
    grid-template-columns: 1fr;
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

  .upload-zone {
    padding: 1rem;
  }

  .upload-icon {
    font-size: 1.5rem;
  }

  .upload-text {
    font-size: 0.75rem;
  }

  .result-section {
    padding: 1rem 1rem;
  }

  .format-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .format-card-nested {
    grid-column: span 1;
  }

  .nested-tags {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .btn {
    padding: 0.55rem 0.8rem;
    font-size: 0.75rem;
  }

  .generate-result {
    padding: 1rem 1rem;
  }
}
</style>