<template>
  <div class="page-container">
    <div class="app-header">
      <h1 class="title"><span class="title-decoration">⟦</span> TEXT CASE CONVERTER <span class="title-decoration">⟧</span></h1>
      <div class="retro-line"></div>
    </div>

    <div class="terminal-container">
      <div class="terminal-header">
        <div class="terminal-button"></div>
        <div class="terminal-button"></div>
        <div class="terminal-button"></div>
        <span class="terminal-title">INPUT.TXT</span>
      </div>
      <textarea
        v-model="inputText"
        placeholder="Paste your text here..."
        class="terminal-input"
        ref="inputArea"
        @input="removeTrailingSpace"
      ></textarea>
      <div class="terminal-footer">
        <span class="character-count">{{ characterCount }}</span>
        <button v-if="inputText" @click="clearInput" class="terminal-action">CLEAR</button>
      </div>
    </div>

    <div class="control-panel">
      <div class="control-panel-header">
        <span class="panel-label">CONVERT TO:</span>
        <div class="control-panel-line"></div>
      </div>
      
      <div class="button-grid">
        <button
          v-for="(fn, label, index) in converters"
          :key="index"
          @click="convert(fn, label)"
          :class="['convert-button', { active: activeConverter === label }]"
        >
          <span class="button-icon">❯</span>
          <span class="button-label">{{ label }}</span>
        </button>
      </div>
    </div>

    <div v-if="outputText" class="output-container">
      <div class="output-header">
        <span class="panel-label">OUTPUT</span>
        <div class="control-panel-line"></div>
        <button @click="copyToClipboard" class="copy-button">
          {{ copySuccess ? '✓ COPIED' : 'COPY' }}
        </button>
      </div>
      <div class="output-box">
        <pre>{{ outputText }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const inputText = ref('')
const outputText = ref('')
const activeConverter = ref('')
const copySuccess = ref(false)
const inputArea = ref(null)

const characterCount = computed(() => {
  return inputText.value ? `CHARS: ${inputText.value.length}` : 'CHARS: 0'
})

onMounted(() => {
  inputArea.value.focus()
})

// Removes any trailing spaces from the input text
const removeTrailingSpace = () => {
  inputText.value = inputText.value.trimEnd()
}

const clearInput = () => {
  inputText.value = ''
  outputText.value = ''
  activeConverter.value = ''
  inputArea.value.focus()
}

const convert = (fn, label) => {
  if (inputText.value) {
    outputText.value = fn(inputText.value)
    activeConverter.value = label
    
    // Scroll to output section after conversion
    setTimeout(() => {
      const outputSection = document.querySelector('.output-container')
      if (outputSection) {
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }, 100)
  }
}

const copyToClipboard = () => {
  if (outputText.value) {
    navigator.clipboard.writeText(outputText.value)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  }
}

// Text conversion functions
const toSentenceCase = (text) => {
  return text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase())
}

const toLowerCase = (text) => text.toLowerCase()

const toUpperCase = (text) => text.toUpperCase()

const toCapitalizedCase = (text) =>
  text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())

const toAlternatingCase = (text) =>
  [...text].map((char, i) => i % 2 === 0 ? char.toLowerCase() : char.toUpperCase()).join('')

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
  [...text].map((char) => char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()).join('')

// Grouped converters by category
const converters = {
  'Sentence case': toSentenceCase,
  'Title Case': toTitleCase,
  'Capitalized Case': toCapitalizedCase,
  'lower case': toLowerCase,
  'UPPER CASE': toUpperCase,
  'aLtErNaTiNg cAsE': toAlternatingCase,
  'InVeRsE CaSe': toInverseCase,
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

:root {
  --bg-main: #0c0c14;
  --bg-terminal: #151520;
  --bg-input: #060611;
  --text-primary: #33ff99;
  --text-secondary: #c586c0;
  --accent: #fc5185;
  --border: #364156;
  --glow: rgba(51, 255, 153, 0.4);
  --button-bg: #1e1e28;
  --button-active: #33ff99;
  --button-hover: #242436;
}

* {
  box-sizing: border-box;
}

.page-container {
  min-height: 100vh;
  background-color: var(--bg-main);
  background-image: 
    radial-gradient(rgba(51, 255, 153, 0.03) 2px, transparent 2px),
    radial-gradient(rgba(51, 255, 153, 0.02) 2px, transparent 2px);
  background-size: 50px 50px;
  background-position: 0 0, 25px 25px;
  color: var(--text-primary);
  font-family: 'VT323', monospace;
  padding: 2rem 1rem;
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.app-header {
  text-align: center;
  margin-bottom: 1rem;
}

.title {
  font-family: 'Press Start 2P', cursive;
  font-size: 1.75rem;
  letter-spacing: -1px;
  color: var(--text-primary);
  margin: 0;
  padding: 0.5rem 0;
  text-shadow: 0 0 10px var(--glow);
  line-height: 1.5;
}

.title-decoration {
  color: var(--accent);
}

.retro-line {
  height: 4px;
  background: linear-gradient(90deg, transparent, var(--text-primary), transparent);
  margin: 1rem auto;
  width: 80%;
  box-shadow: 0 0 10px var(--glow);
}

.terminal-container {
  border: 2px solid var(--text-primary);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 15px var(--glow);
}

.terminal-header {
  background-color: var(--bg-terminal);
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  border-bottom: 2px solid var(--text-primary);
}

.terminal-button {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: var(--accent);
  margin-right: 8px;
  box-shadow: 0 0 5px rgba(252, 81, 133, 0.5);
}

.terminal-button:nth-child(2) {
  background-color: #ffdd59;
  box-shadow: 0 0 5px rgba(255, 221, 89, 0.5);
}

.terminal-button:nth-child(3) {
  background-color: var(--text-primary);
  box-shadow: 0 0 5px var(--glow);
}

.terminal-title {
  margin-left: 1rem;
  font-size: 1.1rem;
  font-weight: bold;
  letter-spacing: 1px;
}

.terminal-input {
  width: 100%;
  height: 150px;
  background-color: var(--bg-input);
  color: var(--text-primary);
  border: 2px solid navajowhite;
  padding: 1rem;
  font-family: 'VT323', monospace;
  font-size: 1.3rem;
  resize: vertical;
  outline: none;
}

.terminal-input::placeholder {
  color: rgba(51, 255, 153, 0.5);
}

.terminal-footer {
  background-color: var(--bg-terminal);
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border);
}

.character-count {
  font-size: 0.9rem;
  letter-spacing: 1px;
}

.terminal-action {
  background: none;
  border: 1px solid var(--accent);
  color: var(--accent);
  padding: 0.25rem 0.75rem;
  font-family: 'VT323', monospace;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.terminal-action:hover {
  background-color: var(--accent);
  color: var(--bg-main);
  box-shadow: 0 0 8px rgba(252, 81, 133, 0.7);
}

.control-panel {
  background-color: var(--bg-terminal);
  border: 2px solid var(--text-primary);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 0 15px var(--glow);
}

.control-panel-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.panel-label {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--text-secondary);
  margin-right: 1rem;
  white-space: nowrap;
}

.control-panel-line {
  flex-grow: 1;
  height: 2px;
  background: linear-gradient(90deg, var(--text-secondary), transparent);
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.convert-button {
  background-color: var(--button-bg);
  color: var(--text-primary);
  border: 1px solid green;
  padding: 0.75rem 1rem;
  font-family: 'VT323', monospace;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.convert-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background-color: var(--text-secondary);
  transform: scaleY(0);
  transition: transform 0.2s ease;
}

.convert-button:hover {
  background-color: var(--button-hover);
}

.convert-button:hover::before {
  transform: scaleY(1);
}

.convert-button.active {
  background-color: green;
  border-color: var(--button-active);
  box-shadow: 0 0 10px rgba(51, 255, 153, 0.3);
}

.convert-button.active::before {
  transform: scaleY(1);
  background-color: var(--button-active);
}

.button-icon {
  margin-right: 0.75rem;
  color: var(--text-secondary);
}

.active .button-icon {
  color: var(--button-active);
}

.output-container {
  background-color: var(--bg-terminal);
  border: 2px solid var(--text-primary);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 0 15px var(--glow);
  animation: fadeIn 0.3s ease-out;
}

.output-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.copy-button {
  background-color: var(--bg-input);
  color: var(--text-secondary);
  border: 1px solid var(--text-secondary);
  padding: 0.25rem 0.75rem;
  font-family: 'VT323', monospace;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 1rem;
  white-space: nowrap;
}

.copy-button:hover {
  background-color: var(--text-secondary);
  color: var(--bg-input);
  box-shadow: 0 0 8px rgba(197, 134, 192, 0.7);
}

.output-box {
  background-color: var(--bg-input);
  border: 1px solid red;
  border-radius: 4px;
  padding: 1rem;
  min-height: 120px;
  color: var(--text-primary);
  font-size: 1.2rem;
  line-height: 1.5;
}

.output-box pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  font-family: 'VT323', monospace;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .title {
    font-size: 1.2rem;
  }
  
  .button-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.75rem;
  }
  
  .convert-button {
    font-size: 1rem;
    padding: 0.5rem 0.75rem;
  }
}

@media (max-width: 480px) {
  .page-container {
    padding: 1rem 0.5rem;
    gap: 1.5rem;
  }
  
  .title {
    font-size: 0.9rem;
    padding: 0 0.5rem;
  }
  
  .button-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  
  .terminal-input {
    font-size: 1.1rem;
  }
  
  .button-icon {
    margin-right: 0.5rem;
  }
}
</style>