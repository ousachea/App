<template>
  <div class="container">
    <div class="scanner-box">
      <h1 class="title">KHQR Code Scanner</h1>
      <div class="input-section">
        <label class="upload-button">
          📷 Upload QR Code
          <input
            type="file"
            @change="decodeQR"
            accept="image/*"
            class="file-input"
          />
        </label>
        <textarea
          v-model="manualQRInput"
          placeholder="Paste QR Code data here"
          class="text-input"
        ></textarea>
        <div class="button-group">
          <button @click="decodeManualQR" class="decode-button">Decode</button>
          <button @click="clearData" class="clear-button">Clear</button>
        </div>
      </div>
      <div v-if="qrResult" class="result-box">
        <h2 class="result-title">Decoded QR Code</h2>
        <pre class="result-content">{{ formattedQR }}</pre>
        <h2 class="result-title">Parsed Details</h2>
        <ul class="details-list">
          <li v-for="(value, key) in parsedQR" :key="key" class="detail-item">
            <strong>{{ key }}:</strong> {{ value }}
            <span v-if="key === 'Transaction Currency'">
              ({{ currencySymbols[value] || 'Unknown Currency' }})
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import QrScanner from 'qr-scanner';

export default {
  data() {
    return {
      qrResult: '',
      parsedQR: {},
      manualQRInput: '',
      currencySymbols: {
        840: 'USD',
        116: 'KHR',
        978: 'EUR',
        '036': 'AUD',
        826: 'GBP',
        392: 'JPY',
      },
    };
  },
  computed: {
    formattedQR() {
      return this.qrResult || 'No QR code detected';
    },
  },
  methods: {
    async decodeQR(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = await QrScanner.scanImage(e.target.result).catch(
          () => 'Could not decode QR code'
        );
        this.qrResult = result;
        this.parsedQR = this.parseKHQR(result);
      };
      reader.readAsDataURL(file);
    },
    decodeManualQR() {
      if (this.manualQRInput.trim()) {
        this.qrResult = this.manualQRInput.trim();
        this.parsedQR = this.parseKHQR(this.manualQRInput.trim());
      }
    },
    clearData() {
      this.qrResult = '';
      this.parsedQR = {};
      this.manualQRInput = '';
    },
    parseKHQR(qrString) {
      const parsedData = {};
      let index = 0;
      while (index < qrString.length) {
        const tag = qrString.substring(index, index + 2);
        if (!/\d{2}/.test(tag)) break;
        const length = parseInt(qrString.substring(index + 2, index + 4), 10);
        if (isNaN(length) || length < 0 || index + 4 + length > qrString.length)
          break;
        const value = qrString.substring(index + 4, index + 4 + length);
        parsedData[this.getTagName(tag)] = value.trim();
        index += 4 + length;
      }
      return {
        merchantType: parsedData['Merchant Type'] || null,
        bakongAccountID: parsedData['Bakong Account ID'] || null,
        accountInformation: null,
        merchantID: parsedData['Merchant ID'] || null,
        acquiringBank: parsedData['Acquiring Bank'] || null,
        billNumber: parsedData['Bill Number'] || null,
        mobileNumber: parsedData['Mobile Number'] || null,
        storeLabel: parsedData['Store Label'] || null,
        terminalLabel: parsedData['Terminal Label'] || null,
        purposeOfTransaction: parsedData['Purpose of Transaction'] || null,
        languagePreference: parsedData['Language Preference'] || null,
        merchantNameAlternateLanguage:
          parsedData['Merchant Name (Alt Language)'] || null,
        merchantCityAlternateLanguage:
          parsedData['Merchant City (Alt Language)'] || null,
        payloadFormatIndicator: parsedData['Payload Format Indicator'] || null,
        pointofInitiationMethod:
          parsedData['Point of Initiation Method'] || null,
        unionPayMerchant: parsedData['UnionPay Merchant'] || null,
        merchantCategoryCode: parsedData['Merchant Category Code'] || null,
        transactionCurrency: parsedData['Transaction Currency'] || null,
        transactionAmount: parsedData['Transaction Amount'] || null,
        countryCode: parsedData['Country Code'] || null,
        merchantName: parsedData['Merchant Name'] || null,
        merchantCity: parsedData['Merchant City'] || null,
        timestamp: parsedData['Timestamp'] || null,
        crc: parsedData['CRC (Check Code)'] || null,
      };
    },
    getTagName(tag) {
      const tagMapping = {
        '00': 'Payload Format Indicator',
        '01': 'Point of Initiation Method',
        30: 'Merchant Type',
        29: 'Bakong Account ID',
        31: 'Merchant ID',
        32: 'Acquiring Bank',
        33: 'Bill Number',
        34: 'Mobile Number',
        35: 'Store Label',
        36: 'Terminal Label',
        37: 'Purpose of Transaction',
        38: 'Language Preference',
        39: 'Merchant Name (Alt Language)',
        40: 'Merchant City (Alt Language)',
        41: 'UnionPay Merchant',
        42: 'Merchant Category Code',
        53: 'Transaction Currency',
        54: 'Transaction Amount',
        58: 'Country Code',
        59: 'Merchant Name',
        60: 'Merchant City',
        61: 'Timestamp',
        63: 'CRC (Check Code)',
      };
      return tagMapping[tag] || `Unknown Tag ${tag}`;
    },
  },
};
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  background: linear-gradient(to bottom right, #3b82f6, #1e3a8a);
  min-height: 100vh;
}
.scanner-box {
  background-color: #ffffff;
  box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.3);
  border-radius: 1rem;
  padding: 2rem;
  max-width: 32rem;
  text-align: center;
}
.title {
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 1.5rem;
}
.input-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.upload-button {
  cursor: pointer;
  background-color: #2563eb;
  color: white;
  padding: 0.75rem;
  border-radius: 0.5rem;
  transition: background 0.2s;
}
.upload-button:hover {
  background-color: #1e40af;
}
.text-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}
.button-group {
  display: flex;
  gap: 0.5rem;
}
.decode-button,
.clear-button {
  flex: 1;
  padding: 0.75rem;
  border-radius: 0.5rem;
  color: white;
  transition: background 0.2s;
}
.decode-button {
  background-color: #059669;
}
.decode-button:hover {
  background-color: #047857;
}
.clear-button {
  background-color: #dc2626;
}
.clear-button:hover {
  background-color: #b91c1c;
}
.result-box {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: left;
  width: 100%;
}
.result-title {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 0.75rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}
.result-content {
  background-color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow: auto;
}
.details-list {
  margin-top: 1rem;
}
.detail-item {
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #d1d5db;
  background-color: #f3f4f6;
}
</style>
