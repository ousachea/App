<script setup>
import { ref } from 'vue'

const qrInput = ref('')
const result = ref(null)

function parseQR(qrString) {
  let info = {
    isDynamic: null,
    amount: null,
    hasAmount: false,
    merchantName: null,
    city: null,
    country: null,
    bank: null
  }

  // Check dynamic or static (tag 01)
  const modeMatch = qrString.match(/01(\d{2})/)
  if (modeMatch) {
    info.isDynamic = modeMatch[1] === '12'
  }

  // Amount (tag 54)
  const amountMatch = qrString.match(/54(\d{2})(\d+)/)
  if (amountMatch) {
    const len = parseInt(amountMatch[1], 10)
    const val = amountMatch[2].slice(0, len)
    info.amount = parseFloat(val) / 100 // assume cents
    info.hasAmount = true
  }

  // Country (tag 58)
  const countryMatch = qrString.match(/58(\d{2})([A-Z]+)/)
  if (countryMatch) {
    info.country = countryMatch[2]
  }

  // Merchant Name (tag 59)
  const nameMatch = qrString.match(/59(\d{2})([A-Z\s]+)/)
  if (nameMatch) {
    info.merchantName = nameMatch[2].trim()
  }

  // City (tag 60)
  const cityMatch = qrString.match(/60(\d{2})([A-Za-z\s]+)/)
  if (cityMatch) {
    info.city = cityMatch[2].trim()
  }

  // Bank info (tag 29)
  const bankMatch = qrString.match(/29\d{2}([A-Za-z0-9_@]+)/)
  if (bankMatch) {
    info.bank = bankMatch[1]
  }

  result.value = info
}

function checkQR() {
  if (!qrInput.value) {
    result.value = null
    return
  }
  parseQR(qrInput.value)
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
    <div class="w-full max-w-3xl">
      <h1 class="text-4xl font-bold text-center text-gray-800 mb-6">KHQR Parser</h1>

      <!-- Input Card -->
      <div class="bg-white shadow-lg rounded-2xl p-6 mb-6">
        <label class="block text-lg font-semibold text-gray-700 mb-2">Paste KHQR String</label>
        <textarea
          v-model="qrInput"
          placeholder="Paste KHQR string here..."
          class="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        ></textarea>

        <div class="flex justify-end mt-4">
          <button
            @click="checkQR"
            class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            Parse QR
          </button>
        </div>
      </div>

      <!-- Results Card -->
      <div v-if="result" class="bg-white shadow-lg rounded-2xl p-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Results</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 border rounded-lg bg-gray-50">
            <p class="font-semibold text-gray-700">Type</p>
            <p
              :class="result.isDynamic ? 'text-green-600 font-bold' : 'text-orange-600 font-bold'"
            >
              {{ result.isDynamic ? 'Dynamic' : 'Static' }}
            </p>
          </div>

          <div class="p-4 border rounded-lg bg-gray-50">
            <p class="font-semibold text-gray-700">Amount</p>
            <p>
              <span v-if="result.hasAmount" class="text-blue-600 font-bold">
                {{ result.amount }} USD
              </span>
              <span v-else class="text-gray-500">Not specified</span>
            </p>
          </div>

          <div class="p-4 border rounded-lg bg-gray-50">
            <p class="font-semibold text-gray-700">Merchant Name</p>
            <p>{{ result.merchantName || 'Not found' }}</p>
          </div>

          <div class="p-4 border rounded-lg bg-gray-50">
            <p class="font-semibold text-gray-700">City</p>
            <p>{{ result.city || 'Not found' }}</p>
          </div>

          <div class="p-4 border rounded-lg bg-gray-50">
            <p class="font-semibold text-gray-700">Country</p>
            <p>{{ result.country || 'Not found' }}</p>
          </div>

          <div class="p-4 border rounded-lg bg-gray-50">
            <p class="font-semibold text-gray-700">Bank Info</p>
            <p>{{ result.bank || 'Not found' }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
