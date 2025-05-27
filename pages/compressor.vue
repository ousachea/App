<template>
  <div class="app-container">
    <div class="container">
      <!-- Header -->
      <header class="header">
        <h1 class="title">File Compressor</h1>
        <p class="subtitle">Reduce file sizes while maintaining quality</p>
      </header>

      <!-- Upload Area -->
      <section class="upload-section">
        <div 
          @drop="handleDrop"
          @dragover.prevent
          @dragenter.prevent
          @dragleave="handleDragLeave"
          class="upload-zone"
          :class="{ 'upload-zone--active': isDragging }"
        >
          <div class="upload-content">
            <div class="upload-icon-wrapper">
              <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l3 3m0 0l3-3m-3 3V9"/>
              </svg>
            </div>
            <h3 class="upload-title">Drop your files here</h3>
            <p class="upload-description">or click the button below to browse</p>
            <div class="format-list">
              <span class="format-badge">Images</span>
              <span class="format-badge">PDFs</span>
            </div>
          </div>
          <input
            ref="fileInput"
            type="file"
            multiple
            accept="image/*,.pdf"
            @change="handleFileSelect"
            class="file-input"
          >
          <button
            @click="$refs.fileInput.click()"
            class="upload-button"
            type="button"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Choose Files
          </button>
        </div>

        <!-- Quick Tips -->
        <div v-if="!files.length" class="tips-section">
          <div class="tip-item">
            <svg class="tip-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Drag & drop multiple files at once</span>
          </div>
          <div class="tip-item">
            <svg class="tip-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Supports JPG, PNG, WebP, and PDF files</span>
          </div>
          <div class="tip-item">
            <svg class="tip-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <span>Your files are processed locally and securely</span>
          </div>
        </div>
      </section>

      <!-- File List -->
      <section v-if="files.length > 0" class="files-section">
        <div class="section-header">
          <h2 class="section-title">
            {{ files.length }} {{ files.length === 1 ? 'File' : 'Files' }} Selected
          </h2>
          <button @click="clearFiles" class="button button--ghost button--small">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            Clear All
          </button>
        </div>

        <div class="files-list">
          <div
            v-for="(file, index) in files"
            :key="index"
            class="file-item"
            :class="{ 'file-item--compressed': processedFiles[index] }"
          >
            <div class="file-info">
              <div class="file-icon">
                <svg v-if="file.type.startsWith('image/')" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <div class="file-details">
                <p class="file-name">{{ file.name }}</p>
                <div class="file-size-info">
                  <span class="file-size original">{{ formatFileSize(file.size) }}</span>
                  <span v-if="processedFiles[index]" class="file-size compressed">
                    → {{ formatFileSize(processedFiles[index].size) }}
                    <span class="savings">({{ calculateSavings(file.size, processedFiles[index].size) }}% saved)</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div class="file-actions">
              <div v-if="processedFiles[index]" class="compression-status">
                <svg class="status-icon success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>Compressed</span>
              </div>
              <button
                @click="removeFile(index)"
                class="button button--icon button--danger"
                :title="`Remove ${file.name}`"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Add More Files -->
        <div class="add-more-section">
          <button
            @click="$refs.fileInput.click()"
            class="button button--ghost"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Add More Files
          </button>
        </div>
      </section>

      <!-- Settings -->
      <section v-if="files.length > 0" class="settings-section">
        <div class="section-header">
          <h2 class="section-title">Compression Settings</h2>
          <button 
            @click="resetSettings" 
            class="button button--ghost button--small"
            title="Reset to recommended settings"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Reset
          </button>
        </div>
        
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-label">
              Output Format
              <span class="setting-help" title="Choose the output format for compressed images">ⓘ</span>
            </label>
            <select v-model="outputFormat" class="select">
              <option value="jpeg">JPEG (Best compression)</option>
              <option value="png">PNG (Lossless)</option>
              <option value="webp">WebP (Modern format)</option>
            </select>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              Quality: {{ quality }}%
              <span class="quality-indicator" :class="getQualityClass(quality)">
                {{ getQualityLabel(quality) }}
              </span>
            </label>
            <input
              v-model="quality"
              type="range"
              min="10"
              max="100"
              step="5"
              class="slider"
            >
            <div class="slider-labels">
              <span>Smaller file</span>
              <span>Better quality</span>
            </div>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              Max Width (pixels)
              <span class="setting-help" title="Images wider than this will be resized">ⓘ</span>
            </label>
            <div class="input-group">
              <input
                v-model.number="maxWidth"
                type="number"
                min="100"
                max="4000"
                step="100"
                class="input"
              >
              <div class="preset-buttons">
                <button @click="maxWidth = 1920" class="preset-btn" :class="{ active: maxWidth === 1920 }">1920</button>
                <button @click="maxWidth = 1280" class="preset-btn" :class="{ active: maxWidth === 1280 }">1280</button>
                <button @click="maxWidth = 800" class="preset-btn" :class="{ active: maxWidth === 800 }">800</button>
              </div>
            </div>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              Max Height (pixels)
              <span class="setting-help" title="Images taller than this will be resized">ⓘ</span>
            </label>
            <div class="input-group">
              <input
                v-model.number="maxHeight"
                type="number"
                min="100"
                max="4000"
                step="100"
                class="input"
              >
              <div class="preset-buttons">
                <button @click="maxHeight = 1080" class="preset-btn" :class="{ active: maxHeight === 1080 }">1080</button>
                <button @click="maxHeight = 720" class="preset-btn" :class="{ active: maxHeight === 720 }">720</button>
                <button @click="maxHeight = 600" class="preset-btn" :class="{ active: maxHeight === 600 }">600</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Compression Preview -->
        <div v-if="!isProcessing && !processedFiles.length" class="preview-section">
          <div class="preview-info">
            <div class="preview-item">
              <span class="preview-label">Estimated compression:</span>
              <span class="preview-value">{{ estimatedCompression }}%</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">Total original size:</span>
              <span class="preview-value">{{ formatFileSize(totalOriginalSize) }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">Estimated final size:</span>
              <span class="preview-value">{{ formatFileSize(estimatedFinalSize) }}</span>
            </div>
          </div>
        </div>

        <!-- Compress Button -->
        <div class="compress-section">
          <button
            @click="compressFiles"
            :disabled="isProcessing"
            class="button button--primary button--large button--compress"
          >
            <svg v-if="isProcessing" class="spinner" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            {{ isProcessing ? `Processing ${currentFileIndex} of ${files.length}...` : 'Compress Files' }}
          </button>

          <!-- Progress -->
          <div v-if="isProcessing" class="progress-section">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${processingProgress}%` }"></div>
            </div>
            <p class="progress-text">
              {{ Math.round(processingProgress) }}% complete
            </p>
          </div>
        </div>
      </section>

      <!-- Results Summary -->
      <section v-if="processedFiles.length > 0" class="results-section">
        <div class="results-header">
          <div class="results-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
            </svg>
          </div>
          <div class="results-info">
            <h3 class="results-title">Compression Complete!</h3>
            <p class="results-summary">
              Saved {{ formatFileSize(totalOriginalSize - totalCompressedSize) }} 
              ({{ Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100) }}% reduction)
            </p>
          </div>
        </div>

        <!-- Download Actions -->
        <div class="download-section">
          <button
            @click="downloadAll"
            class="button button--success button--large"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Download All Files
          </button>

          <button
            @click="downloadAsZip"
            class="button button--secondary button--large"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            Download as ZIP
          </button>

          <button
            @click="startOver"
            class="button button--ghost"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Start Over
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Reactive data
const files = ref([])
const processedFiles = ref([])
const isDragging = ref(false)
const isProcessing = ref(false)
const processingProgress = ref(0)
const currentFileIndex = ref(0)

// Settings with better defaults
const outputFormat = ref('jpeg')
const quality = ref(80)
const maxWidth = ref(1920)
const maxHeight = ref(1080)

// File input ref
const fileInput = ref(null)

// Computed properties for better UX
const totalOriginalSize = computed(() => {
  return files.value.reduce((total, file) => total + file.size, 0)
})

const totalCompressedSize = computed(() => {
  return processedFiles.value.reduce((total, file) => total + file.size, 0)
})

const estimatedCompression = computed(() => {
  const qualityFactor = quality.value / 100
  return Math.round((1 - qualityFactor * 0.8) * 100)
})

const estimatedFinalSize = computed(() => {
  const compressionRatio = estimatedCompression.value / 100
  return Math.round(totalOriginalSize.value * (1 - compressionRatio))
})

// Helper functions
const calculateSavings = (originalSize, compressedSize) => {
  if (originalSize === 0) return 0
  return Math.round(((originalSize - compressedSize) / originalSize) * 100)
}

const getQualityClass = (quality) => {
  if (quality >= 80) return 'high'
  if (quality >= 60) return 'medium'
  return 'low'
}

const getQualityLabel = (quality) => {
  if (quality >= 80) return 'High Quality'
  if (quality >= 60) return 'Balanced'
  return 'High Compression'
}

const resetSettings = () => {
  outputFormat.value = 'jpeg'
  quality.value = 80
  maxWidth.value = 1920
  maxHeight.value = 1080
}

const startOver = () => {
  files.value = []
  processedFiles.value = []
  resetSettings()
}

// Handle file drop with improved feedback
const handleDrop = (e) => {
  e.preventDefault()
  isDragging.value = false
  const droppedFiles = Array.from(e.dataTransfer.files)
  addFiles(droppedFiles)
}

const handleDragLeave = (e) => {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    isDragging.value = false
  }
}

// Handle file selection
const handleFileSelect = (e) => {
  const selectedFiles = Array.from(e.target.files)
  addFiles(selectedFiles)
  e.target.value = '' // Reset input for re-selection
}

// Add files with validation and feedback
const addFiles = (newFiles) => {
  const validFiles = newFiles.filter(file => {
    const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf'
    const isValidSize = file.size <= 50 * 1024 * 1024 // 50MB limit
    return isValidType && isValidSize
  })
  
  // Avoid duplicates
  const uniqueFiles = validFiles.filter(newFile => 
    !files.value.some(existingFile => 
      existingFile.name === newFile.name && existingFile.size === newFile.size
    )
  )
  
  files.value.push(...uniqueFiles)
  
  // Show feedback for invalid files
  const invalidFiles = newFiles.length - validFiles.length
  const duplicateFiles = validFiles.length - uniqueFiles.length
  
  if (invalidFiles > 0) {
    console.log(`${invalidFiles} files were skipped (unsupported format or too large)`)
  }
  if (duplicateFiles > 0) {
    console.log(`${duplicateFiles} duplicate files were skipped`)
  }
}

// Remove file
const removeFile = (index) => {
  files.value.splice(index, 1)
  if (processedFiles.value[index]) {
    processedFiles.value.splice(index, 1)
  }
}

// Clear all files
const clearFiles = () => {
  files.value = []
  processedFiles.value = []
}

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Compress image with improved quality
const compressImage = (file) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img
      const aspectRatio = width / height
      
      if (width > maxWidth.value) {
        width = maxWidth.value
        height = width / aspectRatio
      }
      
      if (height > maxHeight.value) {
        height = maxHeight.value
        width = height * aspectRatio
      }
      
      canvas.width = width
      canvas.height = height
      
      // Use better quality settings
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          const compressedFile = new File([blob], 
            file.name.replace(/\.[^/.]+$/, `.${outputFormat.value}`),
            { type: `image/${outputFormat.value}` }
          )
          resolve(compressedFile)
        },
        `image/${outputFormat.value}`,
        quality.value / 100
      )
    }
    
    img.src = URL.createObjectURL(file)
  })
}

// Compress PDF (placeholder - would need PDF-lib in real implementation)
const compressPDF = async (file) => {
  // For now, return the original PDF
  // In a real app, you'd use PDF-lib or similar
  return new File([file], file.name, { type: file.type })
}

// Compress all files with better progress tracking
const compressFiles = async () => {
  isProcessing.value = true
  processedFiles.value = []
  processingProgress.value = 0
  currentFileIndex.value = 0
  
  for (let i = 0; i < files.value.length; i++) {
    currentFileIndex.value = i + 1
    const file = files.value[i]
    
    let compressedFile
    if (file.type.startsWith('image/')) {
      compressedFile = await compressImage(file)
    } else if (file.type === 'application/pdf') {
      compressedFile = await compressPDF(file)
    }
    
    processedFiles.value.push(compressedFile)
    processingProgress.value = ((i + 1) / files.value.length) * 100
    
    // Small delay for smooth UX
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  isProcessing.value = false
}

// Download individual files
const downloadAll = () => {
  processedFiles.value.forEach((file, index) => {
    setTimeout(() => {
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, index * 100) // Stagger downloads
  })
}

// Download as ZIP
const downloadAsZip = async () => {
  try {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    
    // Add files to zip
    processedFiles.value.forEach((file, index) => {
      zip.file(file.name, file)
    })
    
    // Generate and download zip
    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)
    const a = document.createElement('a')
    a.href = url
    a.download = `compressed-files-${Date.now()}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error creating ZIP file:', error)
  }
}

// Drag and drop handlers
const handleDragEnter = (e) => {
  e.preventDefault()
  isDragging.value = true
}
</script>

<style scoped>
/* Reset and Base */
* {
  box-sizing: border-box;
}

.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  color: #2d3748;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* Header */
.header {
  text-align: center;
  margin-bottom: 3rem;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.1rem;
  color: #718096;
  margin: 0;
  font-weight: 400;
}

/* Upload Zone */
.upload-zone:hover,
.upload-zone--active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.15);
}

.upload-content {
  pointer-events: none;
}

.upload-icon-wrapper {
  display: inline-flex;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  margin-bottom: 1.5rem;
}

.upload-icon {
  width: 2rem;
  height: 2rem;
  color: white;
}

.upload-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 0.5rem 0;
}

.upload-description {
  color: #718096;
  margin: 0 0 1.5rem 0;
  font-size: 1rem;
}

.format-list {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.format-badge {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.upload-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

/* Tips Section */
.tips-section {
  margin-top: 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.tip-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #667eea;
  flex-shrink: 0;
}

/* Sections */
.files-section,
.settings-section,
.results-section {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

/* File List */
.files-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  background: #f7fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.file-item:hover {
  background: #edf2f7;
  border-color: #cbd5e0;
  transform: translateY(-1px);
}

.file-item--compressed {
  background: linear-gradient(135deg, #f0fff4, #e6fffa);
  border-color: #9ae6b4;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.file-icon {
  width: 2rem;
  height: 2rem;
  color: #667eea;
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-name {
  font-weight: 600;
  color: #2d3748;
  margin: 0;
  font-size: 0.95rem;
}

.file-size-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.file-size {
  font-size: 0.8rem;
  color: #718096;
}

.file-size.compressed {
  color: #38a169;
  font-weight: 500;
}

.savings {
  color: #38a169;
  font-weight: 600;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.compression-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #38a169;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.status-icon.success {
  color: #38a169;
}

.add-more-section {
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

/* Settings */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.setting-item {
  display: flex;
  flex-direction: column;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 0.75rem;
}

.setting-help {
  cursor: help;
  color: #a0aec0;
  font-size: 0.875rem;
}

.quality-indicator {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.quality-indicator.high {
  background: #c6f6d5;
  color: #22543d;
}

.quality-indicator.medium {
  background: #fef5e7;
  color: #c05621;
}

.quality-indicator.low {
  background: #fed7d7;
  color: #c53030;
}

.input,
.select {
  padding: 0.875rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.input:focus,
.select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.preset-buttons {
  display: flex;
  gap: 0.5rem;
}

.preset-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-btn:hover {
  border-color: #667eea;
  background: #f7faff;
}

.preset-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: #e2e8f0;
  appearance: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #718096;
  margin-top: 0.5rem;
}

/* Preview Section */
.preview-section {
  background: linear-gradient(135deg, #f7faff, #edf2f7);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
}

.preview-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-label {
  font-size: 0.9rem;
  color: #4a5568;
}

.preview-value {
  font-weight: 600;
  color: #2d3748;
}

/* Compress Section */
.compress-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

/* Results Section */
.results-section {
  background: linear-gradient(135deg, #f0fff4, #e6fffa);
  border: 1px solid #9ae6b4;
}

.results-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.results-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, #38a169, #2f855a);
  border-radius: 50%;
  color: white;
}

.results-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #22543d;
  margin: 0;
}

.results-summary {
  color: #2f855a;
  font-size: 1rem;
  margin: 0;
}

.download-section {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}

/* Buttons */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  white-space: nowrap;
}

.button svg {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.button--primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.button--primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.button--primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.button--success {
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
  box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
}

.button--success:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(72, 187, 120, 0.4);
}

.button--secondary {
  background: white;
  color: #4a5568;
  border: 2px solid #e2e8f0;
}

.button--secondary:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
  transform: translateY(-1px);
}

.button--ghost {
  background: transparent;
  color: #718096;
  border: 1px solid transparent;
}

.button--ghost:hover {
  background: #f7fafc;
  color: #4a5568;
  border-color: #e2e8f0;
}

.button--danger {
  background: transparent;
  color: #e53e3e;
  border: 1px solid transparent;
}

.button--danger:hover {
  background: #fed7d7;
  border-color: #feb2b2;
}

.button--icon {
  padding: 0.5rem;
  border-radius: 8px;
  width: 2.5rem;
  height: 2.5rem;
}

.button--small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.button--large {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

.button--compress {
  min-width: 200px;
  font-size: 1.1rem;
}

/* Progress */
.progress-section {
  width: 100%;
  max-width: 400px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 0.9rem;
  color: #4a5568;
  font-weight: 500;
  margin: 0;
}

/* Spinner */
.spinner {
  width: 1.25rem;
  height: 1.25rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: 1rem 0.75rem;
  }
  
  .title {
    font-size: 2rem;
  }
  
  .upload-zone {
    padding: 2rem 1rem;
  }
  
  .settings-grid {
    grid-template-columns: 1fr;
  }
  
  .download-section {
    flex-direction: column;
  }
  
  .file-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .file-actions {
    align-self: flex-end;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .results-header {
    flex-direction: column;
    text-align: center;
  }
  
  .tips-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .format-list {
    flex-direction: column;
    align-items: center;
  }
  
  .preset-buttons {
    justify-content: center;
  }
  
  .file-size-info {
    flex-direction: column;
    align-items: flex-start;
  }
}
d-section {
  margin-bottom: 2rem;
}

.upload-zone {
  border: 2px dashed #cbd5e0;
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  position: relative;
  cursor: pointer;
}

.upload-zone {
  border: 2px dashed #cbd5e0;
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  position: relative;
  cursor: pointer;
}
</style>