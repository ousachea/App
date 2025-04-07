<template>
  <div class="page-container">
    <h1 class="title">✨ Text Case Converter ✨</h1>

    <textarea
      v-model="inputText"
      placeholder="Paste your text here..."
      class="input-area animate-fade"
    />

    <div class="button-grid">
      <button
        v-for="(fn, label) in converters"
        :key="label"
        @click="convert(fn)"
        class="convert-button animate-pop"
      >
        {{ label }}
      </button>
    </div>

    <div v-if="outputText" class="output-section">
      <h2 class="output-title">Converted Text</h2>
      <div class="output-box animate-fade">
        {{ outputText }}
      </div>
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

const toTitleCase = (text) => {
  const minorWords = ['a', 'an', 'the', 'and', 'or', 'but', 'nor', 'to', 'for', 'on', 'at', 'by', 'with', 'of', 'in']
  return text
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (minorWords.includes(word) && index !== 0) {
        return word
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

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

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #f4f1ea;
  color: #2a1f14;
  font-family: 'Courier New', Courier, monospace;
  padding: 3rem 1rem;
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.title {
  font-size: 2.5rem;
  font-weight: 800;
  text-align: center;
  letter-spacing: 0.05em;
  color: #c44536;
  text-shadow: 1px 1px #fffdf6;
}

.input-area {
  width: 100%;
  height: 12rem;
  padding: 1.5rem;
  font-size: 1.125rem;
  border: 3px dashed #c44536;
  border-radius: 0.75rem;
  background-color: #fffdf6;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.08);
  resize: vertical;
  transition: box-shadow 0.3s ease-in-out;
}

.input-area:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(196, 69, 54, 0.4);
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem 1.25rem;
  justify-content: center;
  padding: 0 1rem;
}

.convert-button {
  background-color: #2a1f14;
  color: #f4f1ea;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.convert-button:hover {
  background-color: #c44536;
  transform: translateY(-2px);
  color: #fff;
}

.output-section {
  animation: fadeIn 0.3s ease;
  padding: 0 1rem;
}

.output-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #c44536;
  text-decoration: underline;
}

.output-box {
  background-color: #fffdf6;
  border: 1px solid #2a1f14;
  padding: 1.5rem;
  border-radius: 0.75rem;
  font-size: 1.125rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  white-space: pre-wrap;
  transition: all 0.3s ease;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade {
  animation: fadeIn 0.4s ease forwards;
}

@keyframes pop {
  0% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

.animate-pop {
  animation: pop 0.3s ease-out;
}

/* Responsive */
@media (max-width: 600px) {
  .title {
    font-size: 2rem;
  }

  .input-area {
    font-size: 1rem;
    padding: 1rem;
  }

  .convert-button {
    font-size: 0.95rem;
    padding: 0.6rem 1rem;
  }

  .output-title {
    font-size: 1.25rem;
  }

  .output-box {
    font-size: 1rem;
  }
}
</style>
