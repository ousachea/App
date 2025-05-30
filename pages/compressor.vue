<template>
  <div class="compressor-container">
    <div class="header">
      <h1>✨ Smart Compress</h1>
      <p>Reduce image file sizes instantly</p>
    </div>

    <!-- File Type Selector -->
    <div class="type-selector">
      <button 
        class="type-btn active"
        @click="currentType = 'image'"
      >
        <span>🖼️</span>
        <span>Images</span>
      </button>
    </div>

    <!-- Main Content Grid -->
    <div class="main-content">
      <!-- Left Panel -->
      <div class="left-panel">
        <!-- Upload Section -->
        <div class="upload-section">
          <div 
            class="drop-zone"
            :class="{ dragover: isDragOver }"
            @click="$refs.fileInput.click()"
            @dragover.prevent="isDragOver = true"
            @dragleave="isDragOver = false"
            @drop.prevent="handleDrop"
          >
            <div class="drop-icon">📸</div>
            <div class="drop-text">Drop your images here</div>
            <div class="drop-subtext">JPG, PNG, WebP • Up to 10MB</div>
            
            <div class="upload-actions">
              <button class="btn btn-primary" @click="$refs.fileInput.click()">
                <span>📁</span>
                <span>Browse Files</span>
              </button>
            </div>
          </div>
          <input 
            ref="fileInput"
            type="file" 
            class="file-input" 
            accept="image/*"
            multiple
            @change="handleFileSelect"
          >
        </div>

        <!-- Settings Panel -->
        <div class="settings-panel">
          <div class="settings-title">Compression Settings</div>
          <div class="setting-item">
            <div class="setting-label">
              <span>Quality</span>
              <span class="tooltip" data-tooltip="Higher = better quality, larger size">ℹ️</span>
            </div>
            <div class="setting-control">
              <input 
                type="range" 
                class="quality-slider"
                min="10"
                max="100"
                v-model="quality"
              >
              <div class="quality-value">{{ quality }}%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel -->
      <div class="right-panel">
        <!-- File List -->
        <div v-if="sortedFiles.length > 0" class="file-list show">
          <div class="file-list-header">
            <div class="file-list-title">Selected Images</div>
            <div class="file-count">{{ sortedFiles.length }} file{{ sortedFiles.length !== 1 ? 's' : '' }}</div>
          </div>
          <div class="file-items-container">
            <div 
              v-for="(file, index) in sortedFiles" 
              :key="index"
              class="file-item"
              :class="file.status"
            >
              <div class="file-preview" @click="openPreviewModal(file)">
                <img 
                  v-if="file.previewUrl" 
                  :src="file.previewUrl" 
                  :alt="file.name"
                  class="preview-image"
                />
                <span v-else>🖼️</span>
              </div>
              <div class="file-info">
                <div class="file-name" :title="file.name">{{ truncateFileName(file.name) }}</div>
                <div class="file-meta">
                  <span>{{ formatSize(file.size) }}</span>
                  <span v-if="file.compressedSize">→ {{ formatSize(file.compressedSize) }}</span>
                  <div v-if="file.dimensions" class="file-dimensions">
                    {{ file.dimensions.width }}×{{ file.dimensions.height }}
                  </div>
                </div>
              </div>
              <div class="file-actions">
                <button 
                  v-if="file.status === 'compressed'"
                  class="btn btn-secondary" 
                  @click="downloadFile(file)"
                >
                  <span>⬇️</span>
                </button>
                <button 
                  v-else
                  class="btn btn-secondary" 
                  @click="removeFile(sortedFiles.findIndex(f => f === file))"
                >
                  <span>🗑️</span>
                </button>
              </div>
              <div class="file-status" :class="file.status">
                {{ getStatusText(file.status) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Download Options -->
        <div v-if="compressedCount > 0" class="download-options show">
          <div class="download-header">
            <div class="download-title">🎉 Ready!</div>
            <div class="download-summary">{{ compressedCount }} files compressed</div>
          </div>
          <div class="download-actions-grid">
            <div class="download-option" @click="downloadAsZip">
              <div class="download-option-icon">📦</div>
              <div class="download-option-title">Download ZIP</div>
              <div class="download-option-desc">All files in one archive</div>
            </div>
            <div class="download-option" @click="downloadAll">
              <div class="download-option-icon">📄</div>
              <div class="download-option-title">Download All</div>
              <div class="download-option-desc">Individual files</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Bar -->
    <div class="action-bar">
      <button 
        class="main-action" 
        :disabled="files.length === 0 || isProcessing"
        @click="compressAll"
      >
        <span>⚡</span>
        <span>{{ isProcessing ? 'Compressing...' : 'Compress Images' }}</span>
      </button>
    </div>

    <!-- Global Progress -->
    <div class="global-progress">
      <div class="global-progress-fill" :style="{ width: progress + '%' }"></div>
    </div>

    <!-- Stats Footer -->
    <div class="stats-footer">
      <div class="stat-item">
        <div class="stat-label">Files Processed</div>
        <div class="stat-number">{{ totalProcessed }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Space Saved</div>
        <div class="stat-number">{{ formatSize(totalSaved) }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Avg Reduction</div>
        <div class="stat-number">{{ avgReduction }}%</div>
      </div>
    </div>

    <!-- Preview Modal -->
    <div v-if="previewModal.show" class="preview-modal" @click="closePreviewModal">
      <div class="preview-modal-content" @click.stop>
        <div class="preview-modal-header">
          <h3>{{ previewModal.file?.name }}</h3>
          <button class="preview-modal-close" @click="closePreviewModal">×</button>
        </div>
        <div class="preview-modal-body">
          <div class="preview-comparison" v-if="previewModal.file">
            <!-- Original Image -->
            <div class="preview-column">
              <div class="preview-column-header">
                <h4>Original</h4>
                <div class="preview-info">
                  <span>{{ formatSize(previewModal.file.size) }}</span>
                  <span v-if="previewModal.file.dimensions">
                    {{ previewModal.file.dimensions.width }}×{{ previewModal.file.dimensions.height }}
                  </span>
                </div>
              </div>
              <div class="preview-image-container">
                <img 
                  v-if="previewModal.file.previewUrl" 
                  :src="previewModal.file.previewUrl" 
                  :alt="previewModal.file.name"
                  class="preview-modal-image"
                />
              </div>
            </div>

            <!-- Compressed Image (if available) -->
            <div v-if="previewModal.file.compressedUrl" class="preview-column">
              <div class="preview-column-header">
                <h4>Compressed</h4>
                <div class="preview-info">
                  <span>{{ formatSize(previewModal.file.compressedSize) }}</span>
                  <span class="compression-ratio">
                    -{{ Math.round(((previewModal.file.size - previewModal.file.compressedSize) / previewModal.file.size) * 100) }}%
                  </span>
                </div>
              </div>
              <div class="preview-image-container">
                <img 
                  :src="previewModal.file.compressedUrl" 
                  :alt="previewModal.file.name + ' (compressed)'"
                  class="preview-modal-image"
                />
              </div>
            </div>
          </div>
        </div>
        <div class="preview-modal-footer">
          <button 
            v-if="previewModal.file?.status === 'compressed'" 
            class="btn btn-primary"
            @click="downloadFile(previewModal.file)"
          >
            <span>⬇️</span>
            <span>Download</span>
          </button>
          <button 
            v-else-if="previewModal.file?.status === 'ready'"
            class="btn btn-primary"
            @click="compressSingle(previewModal.file)"
          >
            <span>⚡</span>
            <span>Compress This Image</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Error Messages -->
    <div v-if="error" class="error-message show">
      <div class="error-title">{{ error.title }}</div>
      <div class="error-desc">{{ error.message }}</div>
      <div class="error-actions">
        <button class="btn btn-secondary" @click="error = null">Dismiss</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

// State variables
const currentType = ref('image')
const files = ref([])
const isDragOver = ref(false)
const isProcessing = ref(false)
const quality = ref(80)
const progress = ref(0)
const error = ref(null)

// Preview modal state
const previewModal = ref({
  show: false,
  file: null
})

// Stats
const totalProcessed = ref(0)
const totalSaved = ref(0)

// Computed properties
const isMobile = computed(() => {
  if (process.client) {
    return window.innerWidth <= 768
  }
  return false
})

const compressedCount = computed(() => 
  files.value.filter(f => f.status === 'compressed').length
)

const sortedFiles = computed(() => {
  return files.value
})

const avgReduction = computed(() => {
  const compressed = files.value.filter(f => f.status === 'compressed')
  if (compressed.length === 0) return 0
  
  const totalOriginal = compressed.reduce((sum, f) => sum + f.size, 0)
  const totalCompressed = compressed.reduce((sum, f) => sum + (f.compressedSize || f.size), 0)
  
  if (totalOriginal === 0) return 0
  return Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100)
})

// Utility functions
const truncateFileName = (fileName, maxLength = 25) => {
  const mobileMaxLength = process.client && window.innerWidth <= 768 ? 20 : maxLength
  
  if (fileName.length <= mobileMaxLength) return fileName
  
  const extension = fileName.split('.').pop()
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'))
  const truncatedName = nameWithoutExt.substring(0, mobileMaxLength - extension.length - 4) + '...'
  
  return truncatedName + '.' + extension
}

const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 10) / 10 + ' ' + sizes[i]
}

const getStatusText = (status) => {
  const statusMap = {
    ready: 'Ready',
    processing: 'Processing...',
    compressed: 'Compressed',
    error: 'Failed'
  }
  return statusMap[status] || 'Ready'
}

// Image preview generation
const generatePreview = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Create canvas for thumbnail
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Calculate thumbnail size (max 200px)
        const maxSize = 200
        let { width, height } = img
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width
            width = maxSize
          } else {
            width = (width * maxSize) / height
            height = maxSize
          }
        }
        
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        
        resolve({
          url: canvas.toDataURL('image/jpeg', 0.8),
          dimensions: { width: img.naturalWidth, height: img.naturalHeight }
        })
      }
      img.onerror = () => resolve({ url: null, dimensions: null })
      img.src = e.target.result
    }
    reader.onerror = () => resolve({ url: null, dimensions: null })
    reader.readAsDataURL(file)
  })
}

// File handling
const handleDrop = (e) => {
  isDragOver.value = false
  const droppedFiles = Array.from(e.dataTransfer.files)
  addFiles(droppedFiles)
}

const handleFileSelect = (e) => {
  const selectedFiles = Array.from(e.target.files)
  addFiles(selectedFiles)
  e.target.value = ''
}

const addFiles = async (newFiles) => {
  const imageFiles = newFiles.filter(file => {
    if (!file.type.startsWith('image/')) {
      showError('Invalid file type', `${file.name} is not an image file`)
      return false
    }
    if (file.size > 10 * 1024 * 1024) {
      showError('File too large', `${file.name} is larger than 10MB`)
      return false
    }
    return true
  })

  for (const file of imageFiles) {
    const preview = await generatePreview(file)
    
    const newFileObject = {
      name: file.name,
      size: file.size,
      file: file,
      status: 'ready',
      compressedSize: null,
      compressedBlob: null,
      compressedUrl: null,
      previewUrl: preview.url,
      dimensions: preview.dimensions,
      uploadTime: Date.now()
    }

    files.value.unshift(newFileObject)
  }
}

const removeFile = (index) => {
  const file = files.value[index]
  
  // Clean up URLs to prevent memory leaks
  if (file.previewUrl && file.previewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(file.previewUrl)
  }
  if (file.compressedUrl && file.compressedUrl.startsWith('blob:')) {
    URL.revokeObjectURL(file.compressedUrl)
  }
  
  files.value.splice(index, 1)
}

// Preview modal functions
const openPreviewModal = (file) => {
  previewModal.value = {
    show: true,
    file: file
  }
}

const closePreviewModal = () => {
  previewModal.value = {
    show: false,
    file: null
  }
}

// Compression functions
const compressImage = (file, quality) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      let { width, height } = img
      const maxSize = 1200
      
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height * maxSize) / width
          width = maxSize
        } else {
          width = (width * maxSize) / height
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob((blob) => {
        resolve(blob || file)
      }, 'image/jpeg', quality / 100)
    }

    img.onerror = () => resolve(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      img.src = e.target.result
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file.file)
  })
}

const compressSingle = async (fileObj) => {
  if (!fileObj || fileObj.status === 'compressed') return

  try {
    fileObj.status = 'processing'
    
    const compressedBlob = await compressImage(fileObj, quality.value)
    
    if (compressedBlob && compressedBlob.size > 0) {
      fileObj.compressedBlob = compressedBlob
      fileObj.compressedSize = compressedBlob.size
      fileObj.compressedUrl = URL.createObjectURL(compressedBlob)
      fileObj.status = 'compressed'
      
      totalProcessed.value++
      totalSaved.value += (fileObj.size - compressedBlob.size)
    } else {
      fileObj.status = 'error'
    }
  } catch (error) {
    console.error('Compression error:', error)
    fileObj.status = 'error'
  }
}

const compressAll = async () => {
  if (files.value.length === 0) return

  isProcessing.value = true
  progress.value = 0

  for (let i = 0; i < files.value.length; i++) {
    const file = files.value[i]
    
    if (file.status === 'compressed') {
      progress.value = ((i + 1) / files.value.length) * 100
      continue
    }

    await compressSingle(file)
    progress.value = ((i + 1) / files.value.length) * 100
  }

  isProcessing.value = false
}

// Download functions
const downloadFile = (file) => {
  if (!file.compressedBlob) return

  const url = URL.createObjectURL(file.compressedBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name.replace(/\.[^/.]+$/, '_compressed.jpg')
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const downloadAll = () => {
  const compressedFiles = files.value.filter(f => f.status === 'compressed')
  
  if (compressedFiles.length === 0) {
    showError('No files to download', 'Please compress some files first')
    return
  }
  
  compressedFiles.forEach((file, index) => {
    setTimeout(() => {
      downloadFile(file)
    }, index * 500)
  })
}

const downloadAsZip = async () => {
  const compressedFiles = files.value.filter(f => f.status === 'compressed')
  
  if (compressedFiles.length === 0) {
    showError('No files to download', 'Please compress some files first')
    return
  }

  try {
    const JSZip = await import('jszip')
    const zip = new JSZip.default()
    
    compressedFiles.forEach(file => {
      if (file.compressedBlob) {
        const fileName = file.name.replace(/\.[^/.]+$/, '_compressed.jpg')
        zip.file(fileName, file.compressedBlob)
      }
    })
    
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `compressed_images_${new Date().toISOString().split('T')[0]}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('Download error:', error)
    showError('Download failed', 'Could not create ZIP file. Try downloading files individually.')
  }
}

// Error handling
const showError = (title, message) => {
  error.value = { title, message }
  setTimeout(() => {
    error.value = null
  }, 5000)
}

// Cleanup on unmount
onUnmounted(() => {
  files.value.forEach(file => {
    if (file.previewUrl && file.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(file.previewUrl)
    }
    if (file.compressedUrl && file.compressedUrl.startsWith('blob:')) {
      URL.revokeObjectURL(file.compressedUrl)
    }
  })
})
</script>

<style scoped>
.compressor-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f8f9fa;
  color: #1a1a1a;
  line-height: 1.5;
  height: 100vh;
  overflow: hidden;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.header {
  text-align: center;
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.25rem;
}

.header p {
  color: #666;
  font-size: 0.9rem;
}

.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  min-height: 0;
  overflow: hidden;
}

.left-panel, .right-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
}

.type-selector {
  display: flex;
  gap: 0;
  margin-bottom: 1rem;
  background: #f0f0f0;
  border-radius: 12px;
  padding: 4px;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
  flex-shrink: 0;
}

.type-btn {
  padding: 8px 20px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  color: #666;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.type-btn.active {
  background: white;
  color: #007aff;
}

.upload-section {
  background: white;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.drop-zone {
  padding: 2rem 1rem;
  text-align: center;
  border: 2px dashed #e0e0e0;
  margin: 1rem;
  border-radius: 8px;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 200px;
}

.drop-zone:hover, .drop-zone.dragover {
  border-color: #007aff;
  background: #f0f8ff;
}

.drop-icon {
  font-size: 2rem;
  margin-bottom: 0.75rem;
  opacity: 0.6;
}

.drop-text {
  font-size: 1rem;
  color: #1a1a1a;
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.drop-subtext {
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 1rem;
}

.upload-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.file-input {
  display: none;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #007aff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #f5f5f5;
  color: #1a1a1a;
  border: 1px solid #e0e0e0;
}

.btn-secondary:hover {
  background: #ebebeb;
}

.btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.settings-panel {
  background: white;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  padding: 1rem;
  flex-shrink: 0;
}

.settings-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.75rem;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.setting-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.quality-slider {
  width: 100px;
  height: 4px;
  border-radius: 2px;
  background: #e0e0e0;
  outline: none;
  -webkit-appearance: none;
}

.quality-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #007aff;
  cursor: pointer;
}

.quality-value {
  font-size: 0.75rem;
  color: #666;
  min-width: 45px;
  text-align: right;
  font-weight: 500;
}

.tooltip {
  position: relative;
  cursor: help;
}

.tooltip::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.65rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  z-index: 100;
}

.tooltip:hover::after {
  opacity: 1;
}

.file-list {
  background: white;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  display: none;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.file-list.show {
  display: flex;
  flex-direction: column;
}

.file-list-header {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.file-list-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1a1a;
}

.file-count {
  font-size: 0.75rem;
  color: #666;
  background: #f0f0f0;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
}

.file-items-container {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.file-item {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s ease;
  min-height: 60px;
}

.file-item:hover {
  background: #fafafa;
}

.file-item.processing {
  background: #fff8e1;
}

.file-item.compressed {
  background: #f0f9f0;
}

.file-item.error {
  background: #fff5f5;
}

.file-preview {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.2s ease;
}

.file-preview:hover {
  transform: scale(1.05);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 0.75rem;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 0.125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: help;
}

.file-meta {
  font-size: 0.65rem;
  color: #666;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.file-dimensions {
  color: #888;
  font-size: 0.6rem;
}

.file-actions {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.file-actions .btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.65rem;
  min-width: auto;
}

.file-status {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-weight: 500;
  white-space: nowrap;
}

.file-status.ready {
  background: #f0f0f0;
  color: #666;
}

.file-status.processing {
  background: #fff3cd;
  color: #856404;
}

.file-status.compressed {
  background: #d1eddb;
  color: #155724;
}

.file-status.error {
  background: #f8d7da;
  color: #721c24;
}

.download-options {
  background: white;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  display: none;
  flex-shrink: 0;
}

.download-options.show {
  display: block;
}

.download-header {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  text-align: center;
}

.download-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.25rem;
}

.download-summary {
  font-size: 0.75rem;
  color: #666;
}

.download-actions-grid {
  padding: 1rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.download-option {
  padding: 1rem;
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.download-option:hover {
  border-color: #007aff;
}

.download-option-icon {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.download-option-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.125rem;
}

.download-option-desc {
  font-size: 0.65rem;
  color: #666;
}

.action-bar {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  padding: 1rem 0;
  flex-shrink: 0;
}

.main-action {
  flex: 1;
  max-width: 200px;
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.main-action:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.main-action:not(:disabled):hover {
  background: #0056b3;
}

.global-progress {
  height: 3px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
  margin: 0.5rem 0;
  flex-shrink: 0;
}

.global-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007aff, #0056b3);
  width: 0%;
  transition: width 0.3s ease;
}

.stats-footer {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: white;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  padding: 1rem;
  margin-top: 1rem;
  flex-shrink: 0;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: #007aff;
  margin-bottom: 0.125rem;
}

.stat-label {
  font-size: 0.65rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

/* Preview Modal Styles */
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.preview-modal-content {
  background: white;
  border-radius: 12px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-modal-header {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-modal-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  color: #666;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.preview-modal-close:hover {
  background: #f0f0f0;
}

.preview-modal-body {
  flex: 1;
  overflow: auto;
  min-height: 0;
}

.preview-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
}

.preview-column {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.preview-column-header {
  margin-bottom: 1rem;
}

.preview-column-header h4 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 0.5rem 0;
}

.preview-info {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #666;
}

.compression-ratio {
  color: #28a745;
  font-weight: 600;
}

.preview-image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
  min-height: 200px;
}

.preview-modal-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.preview-modal-footer {
  padding: 1rem;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.error-message {
  position: fixed;
  top: 1rem;
  left: 1rem;
  right: 1rem;
  z-index: 100;
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 8px;
  padding: 1rem;
  display: none;
}

.error-message.show {
  display: block;
}

.error-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #c53030;
  margin-bottom: 0.5rem;
}

.error-desc {
  font-size: 0.875rem;
  color: #721c24;
  margin-bottom: 1rem;
}

.error-actions {
  display: flex;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .compressor-container {
    padding: 0.5rem;
    height: auto;
    min-height: 100vh;
    overflow: auto;
  }

  .main-content {
    grid-template-columns: 1fr;
    gap: 1rem;
    height: auto;
    overflow: visible;
  }

  .left-panel, .right-panel {
    min-height: auto;
    overflow: visible;
  }

  .header h1 {
    font-size: 1.5rem;
  }

  .header p {
    font-size: 0.8rem;
  }

  .drop-zone {
    padding: 1.5rem 1rem;
    min-height: 120px;
    margin: 0.75rem;
  }

  .drop-icon {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .drop-text {
    font-size: 0.9rem;
  }

  .drop-subtext {
    font-size: 0.7rem;
  }

  .upload-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .upload-actions .btn {
    width: 100%;
    justify-content: center;
    padding: 0.75rem;
    font-size: 0.9rem;
  }

  .type-selector {
    width: 100%;
    margin: 0 0 1rem 0;
  }

  .type-btn {
    flex: 1;
    justify-content: center;
    padding: 12px 16px;
    font-size: 0.85rem;
  }

  .settings-panel {
    order: 3;
    margin-top: 1rem;
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .setting-control {
    width: 100%;
    justify-content: space-between;
  }

  .quality-slider {
    flex: 1;
    width: auto;
    margin-right: 1rem;
  }

  .file-list {
    order: 2;
    max-height: 50vh;
    overflow-y: auto;
  }

  .file-items-container {
    max-height: 40vh;
    overflow-y: auto;
  }

  .file-item {
    padding: 1rem;
    flex-wrap: wrap;
    min-height: auto;
  }

  .file-preview {
    width: 40px;
    height: 40px;
    font-size: 0.9rem;
  }

  .file-info {
    flex: 1;
    min-width: 150px;
  }

  .file-name {
    font-size: 0.8rem;
  }

  .file-meta {
    font-size: 0.7rem;
    flex-direction: column;
    gap: 0.125rem;
  }

  .file-actions {
    width: 100%;
    justify-content: center;
    margin-top: 0.5rem;
  }

  .file-status {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    font-size: 0.65rem;
    padding: 0.25rem 0.5rem;
  }

  .download-options {
    order: 4;
    margin-top: 1rem;
  }

  .download-actions-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .download-option {
    padding: 1.25rem;
  }

  .download-option-icon {
    font-size: 1.75rem;
  }

  .download-option-title {
    font-size: 0.85rem;
  }

  .download-option-desc {
    font-size: 0.75rem;
  }

  .action-bar {
    padding: 1rem 0 0.5rem 0;
    position: sticky;
    bottom: 0;
    background: #f8f9fa;
    z-index: 10;
  }

  .main-action {
    max-width: none;
    width: 100%;
    padding: 1rem;
    font-size: 1rem;
  }

  .global-progress {
    margin: 0.5rem 0;
    height: 4px;
  }

  .stats-footer {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    margin-top: 1rem;
    position: relative;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .stat-item:last-child {
    border-bottom: none;
  }

  .stat-number {
    font-size: 1.1rem;
    order: 2;
  }

  .stat-label {
    font-size: 0.75rem;
    order: 1;
    text-transform: none;
    font-weight: 600;
  }

  /* Mobile Preview Modal */
  .preview-modal {
    padding: 0.5rem;
  }

  .preview-modal-content {
    max-width: 95vw;
    max-height: 95vh;
  }

  .preview-comparison {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 1rem;
  }

  .preview-modal-header h3 {
    max-width: 250px;
    font-size: 0.9rem;
  }

  .preview-modal-footer {
    flex-direction: column;
    gap: 0.5rem;
  }

  .preview-modal-footer .btn {
    width: 100%;
    justify-content: center;
  }

  .error-message {
    position: fixed;
    top: 1rem;
    left: 0.5rem;
    right: 0.5rem;
    z-index: 1000;
    padding: 1rem;
    border-radius: 8px;
  }

  .error-title {
    font-size: 0.9rem;
  }

  .error-desc {
    font-size: 0.8rem;
    margin-bottom: 1rem;
  }

  .error-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .error-actions .btn {
    width: 100%;
    justify-content: center;
  }

  .tooltip::after {
    display: none;
  }

  * {
    max-width: 100%;
    box-sizing: border-box;
  }

  .file-items-container {
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
  }

  .btn, .download-option, .file-actions .btn {
    min-height: 44px;
    touch-action: manipulation;
  }
}
</style>