<template>
  <div class="container">
    <PageSwitcher />
    <div class="scanner-card">
      <div class="header">
        <h1 class="title">KHQR Scanner</h1>
        <p class="subtitle">Decode and analyze QR codes</p>
      </div>

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
      <div v-if="qrResult" class="result-section">
        <div class="result-header">
          <h2>Result</h2>
          <button @click="copyToClipboard" class="copy-btn">
            📋 {{ copyText }}
          </button>
        </div>

        <div class="header-info">
          <h3 class="data-label">Format Information</h3>
          <div class="format-grid">
            <div class="format-card" v-if="headerInfo.payloadIndicator">
              <div class="format-label">Payload</div>
              <div class="format-code">{{ headerInfo.payloadIndicator.raw }}</div>
              <div class="format-desc">{{ headerInfo.payloadIndicator.description }}</div>
            </div>
            <div class="format-card" v-if="headerInfo.initiationMethod">
              <div class="format-label">Initiation</div>
              <div class="format-code">{{ headerInfo.initiationMethod.raw }}</div>
              <div class="format-desc">{{ headerInfo.initiationMethod.description }}</div>
            </div>
            <div class="format-card" v-if="headerInfo.merchantType">
              <div class="format-label">Type</div>
              <div class="format-code">{{ headerInfo.merchantType.raw }}</div>
              <div class="format-desc">{{ headerInfo.merchantType.description }}</div>
            </div>
          </div>

          <!-- TLV Information -->
          <div class="tlv-section">
            <h3 class="data-label" style="margin-top: 1.5rem;">TLV Information</h3>
            <div class="format-grid">
              <!-- Tag 51: Bank Info (with nested sub-tags) -->
              <div class="format-card format-card-nested" v-if="headerInfo.bankInfoTag">
                <div class="tag-header">
                  <span class="tag-number">51</span>
                  <span class="tag-subtitle">Bank Info</span>
                </div>
                <div class="tag-meta">
                  <div class="meta-item">
                    <span class="meta-label">Len</span>
                    <span class="meta-value">{{ headerInfo.bankInfoTag.length }}</span>
                  </div>
                </div>

                <!-- Nested sub-tags for Tag 51 -->
                <div class="nested-tags" v-if="headerInfo.bankInfoNested">
                  <!-- Sub-tag 00: Bakong ID -->
                  <div class="sub-tag" v-if="headerInfo.bankInfoNested['00']">
                    <div class="sub-tag-header">
                      <span class="sub-tag-number">00</span>
                      <span class="sub-tag-label">Bakong ID</span>
                    </div>
                    <div class="sub-tag-value">{{ headerInfo.bankInfoNested['00'].value }}</div>
                  </div>

                  <!-- Sub-tag 01: Account Number -->
                  <div class="sub-tag" v-if="headerInfo.bankInfoNested['01']">
                    <div class="sub-tag-header">
                      <span class="sub-tag-number">01</span>
                      <span class="sub-tag-label">Account Number</span>
                    </div>
                    <div class="sub-tag-value">{{ headerInfo.bankInfoNested['01'].value }}</div>
                  </div>

                  <!-- Sub-tag 02: Bank Name -->
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
                </div>
                <div class="tag-meta">
                  <div class="meta-item">
                    <span class="meta-label">Len</span>
                    <span class="meta-value">{{ headerInfo.merchantCategoryTag.length }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Val</span>
                    <span class="meta-value">{{ headerInfo.merchantCategoryTag.value }}</span>
                  </div>
                </div>
                <div class="tag-description">
                  {{ getMerchantCategoryDescription(headerInfo.merchantCategoryTag.value) }}
                </div>
              </div>
              <div class="tag-header">
                <span class="tag-number">52</span>
              </div>
              <div class="tag-meta">
                <div class="meta-item">
                  <span class="meta-label">Len</span>
                  <span class="meta-value">{{ headerInfo.merchantCategoryTag.length }}</span>
                </div>
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
              </div>
              <div class="tag-meta">
                <div class="meta-item">
                  <span class="meta-label">Len</span>
                  <span class="meta-value">{{ headerInfo.currencyTag.length }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Val</span>
                  <span class="meta-value">{{ headerInfo.currencyTag.value }}</span>
                </div>
              </div>
              <div class="tag-description">
                {{ getCurrencyDescription(headerInfo.currencyTag.value) }}
              </div>
            </div>

            <!-- Tag 54: Transaction Amount -->
            <div class="format-card" v-if="headerInfo.amountTag">
              <div class="tag-header">
                <span class="tag-number">54</span>
              </div>
              <div class="tag-meta">
                <div class="meta-item">
                  <span class="meta-label">Len</span>
                  <span class="meta-value">{{ headerInfo.amountTag.length }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Val</span>
                  <span class="meta-value">{{ headerInfo.amountTag.value }}</span>
                </div>
              </div>
              <div class="tag-description">Amount</div>
            </div>

            <!-- Tag 58: Country Code -->
            <div class="format-card" v-if="headerInfo.countryTag">
              <div class="tag-header">
                <span class="tag-number">58</span>
              </div>
              <div class="tag-meta">
                <div class="meta-item">
                  <span class="meta-label">Len</span>
                  <span class="meta-value">{{ headerInfo.countryTag.length }}</span>
                </div>
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
              </div>
              <div class="tag-meta">
                <div class="meta-item">
                  <span class="meta-label">Len</span>
                  <span class="meta-value">{{ headerInfo.merchantNameTag.length }}</span>
                </div>
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
              </div>
              <div class="tag-meta">
                <div class="meta-item">
                  <span class="meta-label">Len</span>
                  <span class="meta-value">{{ headerInfo.merchantCityTag.length }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Val</span>
                  <span class="meta-value">{{ headerInfo.merchantCityTag.value }}</span>
                </div>
              </div>
              <div class="tag-description">Merchant City</div>
            </div>

            <!-- Tag 63: Encryption -->
            <div class="format-card" v-if="headerInfo.encryptionTag">
              <div class="tag-header">
                <span class="tag-number">63</span>
              </div>
              <div class="tag-meta">
                <div class="meta-item">
                  <span class="meta-label">Len</span>
                  <span class="meta-value">{{ headerInfo.encryptionTag.length }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Val</span>
                  <span class="meta-value">{{ headerInfo.encryptionTag.value }}</span>
                </div>
              </div>
              <div class="tag-description">
                {{ getEncryptionDescription(headerInfo.encryptionTag.value) }}
              </div>
            </div>

            <!-- Tag 99: Timestamp (with nested sub-tags) -->
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

              <!-- Nested sub-tags for Tag 99 -->
              <div class="nested-tags" v-if="headerInfo.timestampNested">
                <!-- Sub-tag 00: Create Time (13 digits) -->
                <div class="sub-tag" v-if="headerInfo.timestampNested['00']">
                  <div class="sub-tag-header">
                    <span class="sub-tag-number">00</span>
                    <span class="sub-tag-label">Create Time</span>
                  </div>
                  <div class="sub-tag-value">{{ headerInfo.timestampNested['00'].value }}</div>
                  <div class="sub-tag-note">13 digits (UNIX timestamp ms)</div>
                </div>

                <!-- Sub-tag 01: Expiry Time (13 digits) -->
                <div class="sub-tag" v-if="headerInfo.timestampNested['01']">
                  <div class="sub-tag-header">
                    <span class="sub-tag-number">01</span>
                    <span class="sub-tag-label">Expiry Time</span>
                  </div>
                  <div class="sub-tag-value">{{ headerInfo.timestampNested['01'].value }}</div>
                  <div class="sub-tag-note">13 digits (UNIX timestamp ms)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="raw-data" v-if="qrResult">
        <h3 class="data-label">Raw Data</h3>
        <pre class="data-content">{{ qrResult }}</pre>
      </div>
    </div>
    </transition>
  </div>
  </div>
</template>

<script>
import PageSwitcher from '../components/PageSwitcher.vue';
import QrScanner from 'qr-scanner';

export default {
  components: {
    PageSwitcher,
  },
  data() {
    return {
      qrResult: '',
      parsedQR: {},
      headerInfo: {},
      manualQRInput: '',
      copyText: 'Copy',
      copyHint: 'Copy to clipboard',
      versionMap: {
        '000201': 'KHQR Version 1',
        '000202': 'KHQR Version 2',
      },
      initiationMap: {
        '010211': 'Static QR',
        '010212': 'Dynamic QR',
        '0102112': 'Static QR',      // Also support alternative format
        '0102121': 'Dynamic QR',     // Also support alternative format
      },
      merchantTypeMap: {
        '29': 'Remittance',
        '30': 'Merchant',
      },
      currencySymbols: {
        840: 'USD',
        116: 'KHR',
        978: 'EUR',
        '036': 'AUD',
        826: 'GBP',
        392: 'JPY',
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
        '5411': 'Supermarkets',
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
  computed: {
    displayedDetails() {
      return Object.fromEntries(
        Object.entries(this.parsedQR).filter(([, v]) => v && v !== 'null')
      );
    },
  },
  methods: {
    async decodeQR(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = await QrScanner.scanImage(e.target.result);
          this.qrResult = result;
          this.headerInfo = this.extractHeaderInfo(result);

          // Extract TLV tags
          const tag51 = this.extractTLVTag(result, '51'); // Bank Info
          const tag52 = this.extractTLVTag(result, '52'); // Merchant Category Code
          const tag53 = this.extractTLVTag(result, '53'); // Transaction Currency
          const tag54 = this.extractTLVTag(result, '54'); // Transaction Amount
          const tag58 = this.extractTLVTag(result, '58'); // Country Code
          const tag59 = this.extractTLVTag(result, '59'); // Merchant Name
          const tag60 = this.extractTLVTag(result, '60'); // Merchant City
          const tag63 = this.extractTLVTag(result, '63'); // Encryption
          const tag99 = this.extractTLVTag(result, '99'); // Timestamp

          // Store in headerInfo
          if (tag51) {
            this.headerInfo.bankInfoTag = tag51;
            this.headerInfo.bankInfoNested = this.extractNestedTLV(tag51.value);
          }
          if (tag52) this.headerInfo.merchantCategoryTag = tag52;
          if (tag53) this.headerInfo.currencyTag = tag53;
          if (tag54) this.headerInfo.amountTag = tag54;
          if (tag58) this.headerInfo.countryTag = tag58;
          if (tag59) this.headerInfo.merchantNameTag = tag59;
          if (tag60) this.headerInfo.merchantCityTag = tag60;
          if (tag63) this.headerInfo.encryptionTag = tag63;
          if (tag99) {
            this.headerInfo.timestampTag = tag99;
            this.headerInfo.timestampNested = this.extractNestedTLV(tag99.value);
          }

          this.parsedQR = this.parseKHQR(result);
        } catch {
          this.qrResult = 'Could not decode QR code';
          this.headerInfo = {};
          this.parsedQR = {};
        }
      };
      reader.readAsDataURL(file);
    },
    decodeManualQR() {
      if (this.manualQRInput.trim()) {
        this.qrResult = this.manualQRInput.trim();
        this.headerInfo = this.extractHeaderInfo(this.manualQRInput.trim());

        // Extract TLV tags
        const tag51 = this.extractTLVTag(this.manualQRInput.trim(), '51');
        const tag52 = this.extractTLVTag(this.manualQRInput.trim(), '52');
        const tag53 = this.extractTLVTag(this.manualQRInput.trim(), '53');
        const tag54 = this.extractTLVTag(this.manualQRInput.trim(), '54');
        const tag58 = this.extractTLVTag(this.manualQRInput.trim(), '58');
        const tag59 = this.extractTLVTag(this.manualQRInput.trim(), '59');
        const tag60 = this.extractTLVTag(this.manualQRInput.trim(), '60');
        const tag63 = this.extractTLVTag(this.manualQRInput.trim(), '63');
        const tag99 = this.extractTLVTag(this.manualQRInput.trim(), '99');

        // Store in headerInfo
        if (tag51) {
          this.headerInfo.bankInfoTag = tag51;
          this.headerInfo.bankInfoNested = this.extractNestedTLV(tag51.value);
        }
        if (tag52) this.headerInfo.merchantCategoryTag = tag52;
        if (tag53) this.headerInfo.currencyTag = tag53;
        if (tag54) this.headerInfo.amountTag = tag54;
        if (tag58) this.headerInfo.countryTag = tag58;
        if (tag59) this.headerInfo.merchantNameTag = tag59;
        if (tag60) this.headerInfo.merchantCityTag = tag60;
        if (tag63) this.headerInfo.encryptionTag = tag63;
        if (tag99) {
          this.headerInfo.timestampTag = tag99;
          this.headerInfo.timestampNested = this.extractNestedTLV(tag99.value);
        }

        this.parsedQR = this.parseKHQR(this.manualQRInput.trim());
      }
    },
    clearData() {
      this.qrResult = '';
      this.headerInfo = {};
      this.parsedQR = {};
      this.manualQRInput = '';
      this.copyText = 'Copy';
    },
    extractHeaderInfo(qrString) {
      if (!qrString || qrString.length < 14) {
        return {};
      }

      // Extract based on absolute positions (1-indexed converted to 0-indexed)
      // Position 1-6: Payload Format Indicator
      const payloadPattern = /^(.{6})/;
      // Position 7-12: Point of Initiation Method (6 characters)
      const initiationPattern = /^.{6}(.{6})/;
      // Position 13-14: Merchant Type (2 characters)
      const merchantTypePattern = /^.{12}(.{2})/;

      const payloadMatch = qrString.match(payloadPattern);
      const initiationMatch = qrString.match(initiationPattern);
      const merchantMatch = qrString.match(merchantTypePattern);

      return {
        payloadIndicator: payloadMatch
          ? {
            raw: payloadMatch[1],
            description: this.versionMap[payloadMatch[1]] || 'Unknown Version',
          }
          : null,
        initiationMethod: initiationMatch
          ? {
            raw: initiationMatch[1],
            description: this.initiationMap[initiationMatch[1]] || 'Unknown Type',
          }
          : null,
        merchantType: merchantMatch
          ? {
            raw: merchantMatch[1],
            description: this.merchantTypeMap[merchantMatch[1]] || 'Unknown Type',
          }
          : null,
      };
    },
    copyToClipboard() {
      navigator.clipboard.writeText(this.qrResult).then(() => {
        this.copyText = 'Copied!';
        setTimeout(() => {
          this.copyText = 'Copy';
        }, 2000);
      });
    },
    formatLabel(key) {
      // Use regex to add spaces before capitals and capitalize first letter
      return key
        .replace(/([A-Z])/g, ' $1') // Add space before uppercase letters
        .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
        .trim();
    },
    getMerchantTypeDescription(code) {
      return this.merchantTypeMap[code] || 'Unknown Type';
    },
    getCurrencyDescription(code) {
      // Handle both numeric and string codes
      const codeStr = String(code);
      return this.currencyCodeMap[codeStr] || `Currency Code: ${code}`;
    },
    getEncryptionDescription(code) {
      return this.encryptionCodeMap[code] || `Encryption: ${code}`;
    },
    getMerchantCategoryDescription(code) {
      return this.merchantCategoryMap[code] || `Category: ${code}`;
    },
    getCountryDescription(code) {
      return this.countryCodeMap[code] || `Country: ${code}`;
    },
    extractTLVTag(qrString, targetTag) {
      // Find specific tag in TLV data
      const tlvPattern = /(\d{2})(\d{2})/g;
      let match;

      while ((match = tlvPattern.exec(qrString)) !== null) {
        const tag = match[1];
        const length = parseInt(match[2], 10);

        if (tag === targetTag && !isNaN(length) && length > 0) {
          const valueStartIndex = match.index + 4;
          const valueEndIndex = valueStartIndex + length;

          // Extract value using regex
          const valueExtractionRegex = new RegExp(
            `^.{${valueStartIndex}}(.{${length}})`
          );
          const valueMatch = qrString.match(valueExtractionRegex);

          if (valueMatch && valueMatch[1]) {
            return {
              tag: tag,
              length: length,
              value: valueMatch[1].trim(),
            };
          }
        }
      }

      return null;
    },
    extractNestedTLV(valueString) {
      // Extract nested TLV sub-tags from a value string
      const results = {};
      const tlvPattern = /(\d{2})(\d{2})/g;
      let match;

      while ((match = tlvPattern.exec(valueString)) !== null) {
        const subTag = match[1];
        const length = parseInt(match[2], 10);

        if (!isNaN(length) && length > 0) {
          const valueStartIndex = match.index + 4;
          const valueExtractionRegex = new RegExp(
            `^.{${valueStartIndex}}(.{${length}})`
          );
          const valueMatch = valueString.match(valueExtractionRegex);

          if (valueMatch && valueMatch[1]) {
            results[subTag] = {
              tag: subTag,
              length: length,
              value: valueMatch[1].trim(),
            };
          }
        }
      }

      return results;
    },
    parseKHQR(qrString) {
      const results = {};

      // Regex to find all tag-length pairs and extract values
      const tlvHeaderPattern = /(\d{2})(\d{2})/g;
      let match;

      while ((match = tlvHeaderPattern.exec(qrString)) !== null) {
        const tag = match[1];
        const length = parseInt(match[2], 10);

        if (isNaN(length) || length < 0) continue;

        const valueStartIndex = match.index + 4;
        const valueEndIndex = valueStartIndex + length;

        // Pure regex extraction: capture exact length of characters at position
        const valueExtractionRegex = new RegExp(`^.{${valueStartIndex}}(.{${length}})`);
        const valueMatch = qrString.match(valueExtractionRegex);

        if (valueMatch && valueMatch[1]) {
          const tagName = this.getTagName(tag);
          results[tagName] = valueMatch[1].trim();
        }

        // Move position past current value for next iteration
        tlvHeaderPattern.lastIndex = valueEndIndex;
      }

      return {
        merchantType: results['Merchant Type'] || null,
        bakongAccountID: results['Bakong Account ID'] || null,
        merchantID: results['Merchant ID'] || null,
        acquiringBank: results['Acquiring Bank'] || null,
        billNumber: results['Bill Number'] || null,
        mobileNumber: results['Mobile Number'] || null,
        storeLabel: results['Store Label'] || null,
        terminalLabel: results['Terminal Label'] || null,
        purposeOfTransaction: results['Purpose of Transaction'] || null,
        languagePreference: results['Language Preference'] || null,
        merchantNameAlternateLanguage: results['Merchant Name (Alt Language)'] || null,
        merchantCityAlternateLanguage: results['Merchant City (Alt Language)'] || null,
        payloadFormatIndicator: results['Payload Format Indicator'] || null,
        pointofInitiationMethod: results['Point of Initiation Method'] || null,
        unionPayMerchant: results['UnionPay Merchant'] || null,
        merchantCategoryCode: results['Merchant Category Code'] || null,
        transactionCurrency: results['Transaction Currency'] || null,
        transactionAmount: results['Transaction Amount'] || null,
        countryCode: results['Country Code'] || null,
        merchantName: results['Merchant Name'] || null,
        merchantCity: results['Merchant City'] || null,
        timestamp: results['Timestamp'] || null,
        crc: results['CRC (Check Code)'] || null,
      };
    },
    getTagName(tag) {
      // Validate tag format using regex
      if (!/^\d{2}$/.test(tag)) {
        return 'Invalid Tag';
      }

      const tagMapping = {
        '00': 'Payload Format Indicator',
        '01': 'Point of Initiation Method',
        '29': 'Bakong Account ID',
        '30': 'Merchant Type',
        '31': 'Merchant ID',
        '32': 'Acquiring Bank',
        '33': 'Bill Number',
        '34': 'Mobile Number',
        '35': 'Store Label',
        '36': 'Terminal Label',
        '37': 'Purpose of Transaction',
        '38': 'Language Preference',
        '39': 'Merchant Name (Alt Language)',
        '40': 'Merchant City (Alt Language)',
        '41': 'UnionPay Merchant',
        '42': 'Merchant Category Code',
        '53': 'Transaction Currency',
        '54': 'Transaction Amount',
        '58': 'Country Code',
        '59': 'Merchant Name',
        '60': 'Merchant City',
        '61': 'Timestamp',
        '63': 'CRC (Check Code)',
      };

      return tagMapping[tag] || `Unknown Tag ${tag}`;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: none;
  padding: 2.5rem 2rem;
  text-align: left;
  position: sticky;
  top: 0;
  z-index: 10;
}

.title {
  font-size: 2.2rem;
  font-weight: 800;
  margin: 0 0 0.3rem 0;
  color: #ffffff;
  letter-spacing: -0.8px;
}

.subtitle {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  font-weight: 400;
}

.input-area {
  padding: 2.5rem 2rem;
  flex-shrink: 0;
  background: white;
}

.upload-zone {
  display: block;
  border: 2px dashed #e0e0e0;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #f8f9ff 0%, #f3f4f8 100%);
}

.upload-zone:hover {
  border-color: #667eea;
  background: linear-gradient(135deg, #f0f2ff 0%, #e8ebf8 100%);
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(102, 126, 234, 0.15);
}

.file-input {
  display: none;
}

.upload-content {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.upload-icon {
  font-size: 3rem;
  line-height: 1;
}

.upload-text {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: -0.3px;
}

.upload-hint {
  font-size: 0.85rem;
  color: #999999;
  font-weight: 500;
}

.divider {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  margin: 2.5rem 0;
  color: #cccccc;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

.input-field {
  width: 100%;
  height: 120px;
  padding: 1rem;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.9rem;
  resize: vertical;
  transition: all 0.3s ease;
  color: #1a1a2e;
  background: white;
}

.input-field:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn {
  flex: 1;
  padding: 0.95rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  color: #1a1a2e;
  letter-spacing: 0.3px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #f3f4f8;
  color: #1a1a2e;
  border: 1.5px solid #e0e0e0;
}

.btn-secondary:hover {
  background: #e8ebf8;
  border-color: #667eea;
  color: #667eea;
}

.result-section {
  padding: 2.5rem 2rem;
  border-top: none;
  overflow-y: auto;
  flex: 1;
  background: white;
}

.header-info {
  margin-bottom: 2.5rem;
}

.format-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin: 1.5rem 0 0 0;
}

.format-card {
  border: 1px solid #e8ebf8;
  padding: 1.5rem;
  border-radius: 10px;
  background: linear-gradient(135deg, #f8f9ff 0%, #f3f4f8 100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.format-card:hover {
  border-color: #667eea;
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
  transform: translateY(-4px);
}

.tag-header {
  display: flex;
  align-items: baseline;
  gap: 0.8rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e8ebf8;
}

.tag-number {
  font-size: 2.2rem;
  font-weight: 900;
  color: #667eea;
  font-family: 'Monaco', 'Courier New', monospace;
  line-height: 1;
}

.tag-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.meta-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #999999;
  letter-spacing: 0.8px;
}

.meta-value {
  font-size: 1rem;
  font-weight: 700;
  color: #667eea;
  font-family: 'Monaco', 'Courier New', monospace;
  background: #f8f9ff;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  border-left: 3px solid #667eea;
}

.tag-description {
  font-size: 0.9rem;
  color: #555555;
  font-weight: 500;
  line-height: 1.5;
  margin-top: 0.75rem;
}

.tlv-section {
  margin-top: 2.5rem;
  padding-top: 2.5rem;
  border-top: 2px solid #e8ebf8;
}

.format-card-nested {
  grid-column: span 3;
}

.tag-subtitle {
  font-size: 0.75rem;
  color: #999999;
  font-weight: 600;
  margin-left: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nested-tags {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e8ebf8;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.sub-tag {
  background: #f8f9ff;
  border: 1px solid #e8ebf8;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s ease;
}

.sub-tag:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.sub-tag-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}

.sub-tag-number {
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
  font-family: 'Monaco', 'Courier New', monospace;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0.35rem 0.6rem;
  border-radius: 5px;
  min-width: 2.2rem;
  text-align: center;
}

.sub-tag-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #667eea;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.sub-tag-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1a2e;
  font-family: 'Monaco', 'Courier New', monospace;
  word-break: break-all;
  margin-bottom: 0.4rem;
  background: white;
  padding: 0.5rem;
  border-radius: 5px;
  border-left: 2px solid #667eea;
}

.sub-tag-note {
  font-size: 0.75rem;
  color: #999999;
  font-style: italic;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #e8ebf8;
}

.result-header h2 {
  font-size: 1.4rem;
  margin: 0;
  color: #1a1a2e;
  font-weight: 800;
  letter-spacing: -0.4px;
}

.copy-btn {
  background: white;
  color: #667eea;
  border: 1.5px solid #667eea;
  padding: 0.65rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.3px;
}

.copy-btn:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transform: translateY(-2px);
}

.raw-data {
  margin-bottom: 2.5rem;
}

.data-label {
  font-size: 0.85rem;
  font-weight: 800;
  color: #1a1a2e;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.data-content {
  background: #f8f9ff;
  border: 1.5px solid #e8ebf8;
  border-radius: 10px;
  padding: 1.25rem;
  margin: 0;
  font-size: 0.85rem;
  overflow-x: auto;
  word-break: break-all;
  color: #333333;
  font-family: 'Monaco', 'Courier New', monospace;
  line-height: 1.6;
  max-height: 300px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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
    padding: 1.5rem;
  }

  .title {
    font-size: 1.8rem;
  }

  .input-area {
    padding: 1.5rem;
  }

  .result-section {
    padding: 1.5rem;
  }

  .format-grid {
    grid-template-columns: 1fr;
  }

  .format-card-nested {
    grid-column: span 1;
  }

  .nested-tags {
    grid-template-columns: 1fr;
  }
}
</style>