<template>
  <div class="terminal-container">
    <!-- Header -->
    <h1 class="terminal-header">[ TEXT CASE CONVERTER ]</h1>

    <div class="content-wrapper">
      <div class="input-container">
        <!-- Window Controls -->
        <div class="window-header">
          <div class="window-control close"></div>
          <div class="window-control minimize"></div>
          <div class="window-control maximize"></div>
          <div class="window-title">INPUT.TXT</div>
        </div>

        <!-- Text Area -->
        <div class="textarea-wrapper">
          <textarea v-model="inputText" class="terminal-textarea" placeholder="Paste your text here..."></textarea>
        </div>

        <!-- Character Count and Clear Button -->
        <div class="status-bar">
          <div class="char-count">CHARS: {{ inputText.length }}</div>
          <button @click="clearText" class="terminal-button">CLEAR</button>
        </div>
      </div>

      <!-- Convert Options -->
      <div class="convert-section">
        <div class="section-header">
          <span>CONVERT TO:</span>
        </div>

        <div class="button-grid">
          <button @click="convertTo('sentence')" class="option-button">&gt; Sentence case</button>

          <button @click="convertTo('title')" class="option-button">&gt; Title Case</button>

          <button @click="convertTo('capitalized')" class="option-button">&gt; Capitalized Case</button>

          <button @click="convertTo('lower')" class="option-button">&gt; lower case</button>
        </div>

        <div class="button-grid">
          <button @click="convertTo('upper')" class="option-button">&gt; UPPER CASE</button>

          <button @click="convertTo('alternating')" class="option-button">altErNaTiNg caSe</button>
        </div>

        <div class="inverse-button-container">
          <button @click="convertTo('inverse')" class="option-button inverse-button">&gt; InVeRsE CaSe</button>
        </div>
      </div>

      <!-- Output Area -->
      <div class="output-header">
        <span>OUTPUT</span>
        <button @click="copyToClipboard" class="terminal-button">COPY</button>
      </div>

      <div class="output-container" ref="outputContainer">
        <div v-if="showCopyAlert" class="copy-alert">Text copied to clipboard!</div>
        <pre v-if="outputText" class="output-text"
          :class="{ 'matrix-effect': matrixEffectActive }">{{ outputText }}</pre>
        <div v-else class="matrix-rain" ref="matrixRain"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import PageSwitcher from '../components/PageSwitcher.vue';

import { ref, onMounted, watch, onUnmounted } from 'vue';

const inputText = ref('');
const outputText = ref('');
const showCopyAlert = ref(false);
const matrixEffectActive = ref(false);
const outputContainer = ref(null);
const matrixRain = ref(null);
let matrixInterval = null;

const clearText = () => {
  inputText.value = '';
  outputText.value = '';
};

const convertTo = (caseType) => {
  if (!inputText.value) return;

  matrixEffectActive.value = true;

  setTimeout(() => {
    switch (caseType) {
      case 'sentence':
        outputText.value = inputText.value.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
        break;
      case 'title':
        outputText.value = inputText.value.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        break;
      case 'capitalized':
        outputText.value = inputText.value.split(' ').map(word => {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join(' ');
        break;
      case 'lower':
        outputText.value = inputText.value.toLowerCase();
        break;
      case 'upper':
        outputText.value = inputText.value.toUpperCase();
        break;
      case 'alternating':
        outputText.value = inputText.value.split('').map((char, index) =>
          index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
        ).join('');
        break;
      case 'inverse':
        outputText.value = inputText.value.split('').map(char => {
          if (char === char.toUpperCase()) return char.toLowerCase();
          return char.toUpperCase();
        }).join('');
        break;
    }

    // Turn off matrix effect after conversion
    setTimeout(() => {
      matrixEffectActive.value = false;
    }, 1000);
  }, 600); // Delay for matrix effect to show
};

const copyToClipboard = () => {
  if (!outputText.value) return;

  navigator.clipboard.writeText(outputText.value)
    .then(() => {
      showCopyAlert.value = true;
      setTimeout(() => {
        showCopyAlert.value = false;
      }, 2000);
    })
    .catch(err => {
      console.error('Failed to copy: ', err);
    });
};

// Matrix rain animation
const setupMatrixRain = () => {
  if (!matrixRain.value) return;

  const canvas = document.createElement('canvas');
  matrixRain.value.innerHTML = '';
  matrixRain.value.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = matrixRain.value.offsetWidth;
  canvas.height = matrixRain.value.offsetHeight;

  const characters = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const columns = Math.floor(canvas.width / 20);
  const drops = [];

  for (let i = 0; i < columns; i++) {
    drops[i] = Math.floor(Math.random() * canvas.height);
  }

  const draw = () => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#39ff14';
    ctx.font = '20px monospace';

    for (let i = 0; i < drops.length; i++) {
      const text = characters[Math.floor(Math.random() * characters.length)];
      ctx.fillText(text, i * 20, drops[i] * 20);

      if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }

      drops[i]++;
    }
  };

  matrixInterval = setInterval(draw, 50);
};

// Handle window resize for matrix rain
const handleResize = () => {
  if (matrixRain.value && !outputText.value) {
    clearInterval(matrixInterval);
    setupMatrixRain();
  }
};

onMounted(() => {
  setupMatrixRain();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  clearInterval(matrixInterval);
  window.removeEventListener('resize', handleResize);
});

// Watch for output text changes to adjust matrix rain
watch(outputText, (newValue) => {
  if (!newValue && matrixRain.value) {
    setupMatrixRain();
  } else if (newValue) {
    clearInterval(matrixInterval);
  }
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

.terminal-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: black;
  padding: 1rem;
  color: #39ff14;
  font-family: 'VT323', monospace;
  text-shadow: 0 0 5px rgba(57, 255, 20, 0.7);
  position: relative;
}

.terminal-container::after {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(0deg,
      rgba(0, 0, 0, 0.15),
      rgba(0, 0, 0, 0.15) 1px,
      transparent 1px,
      transparent 2px);
  pointer-events: none;
  z-index: 10;
}

.terminal-header {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  letter-spacing: 0.2em;
}

.content-wrapper {
  width: 100%;
  max-width: 64rem;
  margin: 0 auto;
}

/* Updated: Changed solid borders to dashed */
.input-container {
  border: 2px dashed #39ff14;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}

.window-header {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-bottom: 1px dashed #39ff14;
}

.window-control {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.close {
  background-color: #ff9f40;
}

.minimize,
.maximize {
  background-color: #39ff14;
}

.window-title {
  flex: 1;
  text-align: center;
  letter-spacing: 0.1em;
}

.textarea-wrapper {
  padding: 0.5rem;
}

.terminal-textarea {
  width: 100%;
  height: 8rem;
  background-color: black;
  color: #39ff14;
  border: none;
  resize: none;
  font-family: 'VT323', monospace;
}

.terminal-textarea:focus {
  outline: none;
}

.terminal-textarea::placeholder {
  color: rgba(57, 255, 20, 0.5);
}

.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  border-top: 1px dashed #39ff14;
}

.terminal-button {
  background: none;
  border: none;
  color: #39ff14;
  cursor: pointer;
  font-family: 'VT323', monospace;
  letter-spacing: 0.1em;
  transition: all 0.2s ease;
}

.terminal-button:hover {
  text-shadow: 0 0 10px rgba(57, 255, 20, 1);
}

.convert-section {
  text-align: center;
  margin-bottom: 1.5rem;
}

/* Updated: Changed solid borders to dashed */
.section-header {
  border-top: 1px dashed #39ff14;
  border-bottom: 1px dashed #39ff14;
  padding: 0.5rem 0;
  margin-bottom: 1rem;
  letter-spacing: 0.1em;
}

.button-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  justify-content: center;
}

.button-grid .option-button {
  flex: 1 1 calc(50% - 1rem);
  max-width: calc(50% - 1rem);
  min-width: 140px;
}

/* Updated: Changed solid borders to dashed */
.option-button {
  border: 2px dashed #39ff14;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  background: none;
  color: #39ff14;
  cursor: pointer;
  font-family: 'VT323', monospace;
  transition: all 0.2s ease;
}

.option-button:hover {
  background-color: rgba(57, 255, 20, 0.1);
  text-shadow: 0 0 10px rgba(57, 255, 20, 1);
}

.inverse-button-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.inverse-button {
  width: 16rem;
}

/* Updated: Changed solid borders to dashed */
.output-header {
  display: flex;
  justify-content: space-between;
  border-top: 1px dashed #39ff14;
  border-bottom: 1px dashed #39ff14;
  padding: 0.5rem 0;
  margin-bottom: 1rem;
  letter-spacing: 0.1em;
}

/* Updated: Changed solid borders to dashed */
.output-container {
  border: 2px dashed #39ff14;
  border-radius: 0.5rem;
  padding: 1rem;
  height: 8rem;
  overflow: hidden;
  position: relative;
}

.output-text {
  white-space: pre-wrap;
  margin: 0;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.matrix-effect {
  animation: matrixFlicker 0.5s linear;
}

@keyframes matrixFlicker {
  0% {
    opacity: 0;
  }

  25% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }

  75% {
    opacity: 1;
  }

  100% {
    opacity: 1;
  }
}

.matrix-rain {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.matrix-rain canvas {
  display: block;
}

/* Updated: Changed solid border to dashed for copy alert */
.copy-alert {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.8);
  border: 2px dashed #39ff14;
  color: #39ff14;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  z-index: 20;
  animation: fadeIn 0.3s ease-in-out, fadeOut 0.3s ease-in-out 1.7s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .button-grid .option-button {
    flex: 1 1 100%;
    max-width: 100%;
  }

  .terminal-header {
    font-size: 1.5rem;
  }
}

/* Add dotted connections between elements */
.terminal-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(#39ff14 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0.05;
  pointer-events: none;
}
</style>