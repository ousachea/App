<template>
  <div class="p-8 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">Text Case Converter</h1>

    <textarea
      v-model="inputText"
      placeholder="Paste your text here..."
      class="w-full h-40 p-4 border rounded-md mb-6"
    />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button
        v-for="(fn, label) in converters"
        :key="label"
        @click="convert(fn)"
        class="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
      >
        {{ label }}
      </button>
    </div>

    <div v-if="outputText" class="mt-8">
      <h2 class="text-xl font-semibold mb-2">Converted Text</h2>
      <div class="bg-gray-100 p-4 rounded whitespace-pre-wrap">{{ outputText }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const inputText = ref('')
const outputText = ref('')

const convert = (fn) => {
  outputText.value = fn(inputText.value)
}

const toSentenceCase = (text) => {
  return text
    .toLowerCase()
    .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase())
}

const toLowerCase = (text) => text.toLowerCase()

const toUpperCase = (text) => text.toUpperCase()

const toCapitalizedCase = (text) =>
  text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())

const toAlternatingCase = (text) =>
  [...text]
    .map((char, i) =>
      i % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
    )
    .join('')

const toTitleCase = (text) =>
  text
    .toLowerCase()
    .replace(/\b\w+/g, (word) =>
      word.charAt(0).toUpperCase() + word.slice(1)
    )

const toInverseCase = (text) =>
  [...text]
    .map((char) =>
      char === char.toUpperCase()
        ? char.toLowerCase()
        : char.toUpperCase()
    )
    .join('')

const converters = {
  'Sentence case': toSentenceCase,
  'lower case': toLowerCase,
  'UPPER CASE': toUpperCase,
  'Capitalized Case': toCapitalizedCase,
  'aLtErNaTiNg cAsE': toAlternatingCase,
  'Title Case': toTitleCase,
  'InVeRsE CaSe': toInverseCase,
}
</script>
