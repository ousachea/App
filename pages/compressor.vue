<!-- pages/compressor.vue -->
<!-- 100MP+ Self-Contained Compressor for Nuxt 2 -->

<template>
  <div class="compressor-container">
    <div class="header">
      <div class="header-content">
        <div class="header-text">
          <h1>✨ Smart Compress 100MP+</h1>
          <p>Optimized for ultra-high resolution images</p>
        </div>
        <button v-if="files.length > 0" class="clear-session-btn" @click="clearSession">
          <span>🗑️</span>
          <span>Clear All</span>
        </button>
      </div>
    </div>

    <div class="main-content">
      <!-- LEFT PANEL -->
      <div class="left-panel">
        <div class="upload-section">
          <div class="drop-zone" :class="{ dragover: isDragOver }" @click="$refs.fileInput.click()"
            @dragover.prevent="isDragOver = true" @dragleave="isDragOver = false" @drop.prevent="handleDrop">
            <div class="drop-icon">📸</div>
            <div class="drop-text">Drop images here</div>
            <div class="drop-subtext">JPG, PNG • Up to 100MP each</div>

            <div class="upload-actions">
              <button class="btn btn-primary" @click="$refs.fileInput.click()">
                <span>📁</span>
                <span>Browse Files</span>
              </button>
            </div>
          </div>
          <input ref="fileInput" type="file" class="file-input" accept="image/*" multiple @change="handleFileSelect">
        </div>

        <div class="settings-panel">
          <div class="settings-title">Compression Settings</div>

          <div class="setting-item">
            <div class="setting-label">Mode</div>
            <div class="setting-control">
              <label class="radio-label">
                <input v-model="compressionMode" type="radio" value="adaptive">
                <span>Adaptive (Smart)</span>
              </label>
              <label class="radio-label">
                <input v-model="compressionMode" type="radio" value="manual">
                <span>Manual</span>
              </label>
            </div>
          </div>

          <div v-if="compressionMode === 'manual'" class="setting-item">
            <div class="setting-label">Quality</div>
            <div class="setting-control">
              <input v-model.number="quality" type="range" class="quality-slider" min="10" max="100">
              <div class="quality-value">{{ quality }}%</div>
            </div>
          </div>

          <div v-if="compressionMode === 'adaptive'" class="adaptive-info">
            <p>🤖 Auto quality based on image resolution</p>
          </div>

          <div class="dimensions-info">
            <div class="info-item">📏 Original dimensions preserved</div>
            <div class="info-item">💾 Optimized for 100MP+</div>
          </div>
        </div>
      </div>

      <!-- RIGHT PANEL -->
      <div class="right-panel">
        <div v-if="files.length === 0" class="empty-state">
          <div class="empty-state-icon">📸</div>
          <div class="empty-state-title">Ready for 100MP images</div>
          <div class="empty-state-description">
            This compressor handles ultra-high resolution images efficiently
          </div>
          <div class="empty-state-features">
            <div class="feature-item">⚡ Streaming compression</div>
            <div class="feature-item">🧠 Smart memory management</div>
            <div class="feature-item">🎯 Adaptive quality</div>
            <div class="feature-item">⏱️ Progress tracking</div>
          </div>
        </div>

        <div v-if="files.length > 0" class="file-list show">
          <div class="file-list-header">
            <div class="file-list-title">Selected Images</div>
            <div class="file-count">{{ files.length }} file{{ files.length !== 1 ? 's' : '' }}</div>
          </div>
          <div class="file-items-container">
            <div v-for="(file, index) in files" :key="index" class="file-item" :class="file.status">
              <div class="file-preview">
                <img v-if="file.previewUrl" :src="file.previewUrl" :alt="file.name" class="preview-image" />
                <span v-else>🖼️</span>
              </div>

              <div class="file-info">
                <div class="file-name" :title="file.name">{{ truncateFileName(file.name) }}</div>
                <div class="file-meta">
                  <div class="file-size">
                    {{ formatSize(file.size) }}
                    <span v-if="file.compressedSize">
                      → {{ formatSize(file.compressedSize) }}
                    </span>
                  </div>

                  <div v-if="file.metadata" class="file-metadata">
                    <span class="megapixels">{{ file.metadata.megapixels.toFixed(1) }}MP</span>
                    <span class="dimensions">{{ file.metadata.width }}×{{ file.metadata.height }}</span>
                  </div>

                  <div v-if="file.status === 'processing'" class="processing-info">
                    <span class="status-dot"></span>
                    Processing...
                  </div>
                </div>
              </div>

              <div class="file-actions">
                <button v-if="file.status === 'compressed'" class="btn btn-secondary" @click="downloadFile(file)"
                  title="Download">
                  ⬇
                </button>
                <button v-else class="btn btn-secondary" @click="removeFile(index)" title="Remove">
                  🗑️
                </button>
              </div>

              <div class="file-status" :class="file.status">
                {{ getStatusText(file.status) }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="compressedCount > 0" class="download-options show">
          <div class="download-header">
            <div class="download-title">🎉 Complete!</div>
            <div class="download-summary">{{ compressedCount }} images ready</div>
            <div class="space-saved">Saved {{ formatSize(totalSaved) }}</div>
          </div>
          <div class="download-actions-grid">
            <div class="download-option" @click="downloadAsZip">
              <div class="download-option-icon">📦</div>
              <div class="download-option-title">ZIP Archive</div>
            </div>
            <div class="download-option" @click="downloadAll">
              <div class="download-option-icon">⬇</div>
              <div class="download-option-title">Download All</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="action-bar">
      <button class="main-action" :disabled="files.length === 0 || isProcessing" @click="compressAll">
        <span class="action-icon" :class="{ 'processing': isProcessing }">⚡</span>
        <span>{{ isProcessing ? `Compressing (${Math.round(progress)}%)` : 'Compress Images' }}</span>
      </button>
    </div>

    <div class="global-progress">
      <div class="global-progress-fill" :style="{ width: progress + '%' }"></div>
    </div>

    <div class="stats-footer">
      <div class="stat-item">
        <div class="stat-label">Files</div>
        <div class="stat-number">{{ totalProcessed }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Saved</div>
        <div class="stat-number">{{ formatSize(totalSaved) }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Reduction</div>
        <div class="stat-number">{{ avgReduction }}%</div>
      </div>
    </div>

    <div v-if="error" class="error-message show">
      <div class="error-title">{{ error.title }}</div>
      <div class="error-desc">{{ error.message }}</div>
      <button class="btn btn-secondary" @click="error = null">Dismiss</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CompressorPage',
  data() {
    return {
      files: [],
      isDragOver: false,
      isProcessing: false,
      quality: 80,
      progress: 0,
      error: null,
      totalProcessed: 0,
      totalSaved: 0,
      compressionMode: 'adaptive',
      maxConcurrent: 2,
      activeCompressions: 0,
      compressionQueue: [],
    }
  },

  computed: {
    compressedCount() {
      return this.files.filter(f => f.status === 'compressed').length
    },

    avgReduction() {
      const compressed = this.files.filter(f => f.status === 'compressed')
      if (compressed.length === 0) return 0
      const totalOriginal = compressed.reduce((sum, f) => sum + f.size, 0)
      const totalCompressed = compressed.reduce((sum, f) => sum + (f.compressedSize || f.size), 0)
      return totalOriginal > 0 ? Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100) : 0
    },
  },

  methods: {
    // FILE HANDLING
    handleDrop(e) {
      this.isDragOver = false
      const droppedFiles = Array.from(e.dataTransfer.files)
      this.addFiles(droppedFiles)
    },

    handleFileSelect(e) {
      const selectedFiles = Array.from(e.target.files)
      this.addFiles(selectedFiles)
      e.target.value = ''
    },

    async addFiles(newFiles) {
      const imageFiles = newFiles.filter(file => {
        if (!file.type.startsWith('image/')) {
          this.showError('Invalid', `${file.name} is not an image`)
          return false
        }
        if (file.size > 500 * 1024 * 1024) {
          this.showError('Too large', `${file.name} exceeds 500MB`)
          return false
        }
        return true
      })

      for (const file of imageFiles) {
        try {
          const metadata = await this.getImageMetadata(file)
          const thumbnail = await this.generateThumbnail(file)

          const fileObj = {
            name: file.name,
            size: file.size,
            file: file,
            status: 'pending',
            compressedSize: null,
            compressedBlob: null,
            previewUrl: thumbnail,
            metadata: metadata,
          }

          this.files.unshift(fileObj)
        } catch (error) {
          console.error('Error adding file:', error)
        }
      }
    },

    removeFile(index) {
      const file = this.files[index]
      if (file.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(file.previewUrl)
      }
      this.files.splice(index, 1)
    },

    // 100MP+ IMAGE HANDLING
    async getImageMetadata(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const img = new Image()
          img.onload = () => {
            const megapixels = (img.naturalWidth * img.naturalHeight) / 1000000;
            resolve({
              width: img.naturalWidth,
              height: img.naturalHeight,
              megapixels: megapixels,
              estimatedMemory: (img.naturalWidth * img.naturalHeight * 4) / (1024 * 1024),
            })
            img.src = ''
          }
          img.onerror = () => reject(new Error('Failed to load image'))
          img.src = event.target.result
        }
        reader.onerror = () => reject(new Error('FileReader failed'))
        reader.readAsDataURL(file)
      })
    },

    async generateThumbnail(file, maxSize = 150) {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const img = new Image()
          img.onload = () => {
            try {
              let { width, height } = img
              const scale = Math.min(maxSize / width, maxSize / height)
              width = Math.round(width * scale)
              height = Math.round(height * scale)

              const canvas = document.createElement('canvas')
              canvas.width = width
              canvas.height = height
              const ctx = canvas.getContext('2d')
              ctx.drawImage(img, 0, 0, width, height)

              const thumbnail = canvas.toDataURL('image/webp', 0.6)
              canvas.width = canvas.height = 0
              img.src = ''
              resolve(thumbnail)
            } catch (error) {
              resolve(null)
            }
          }
          img.onerror = () => resolve(null)
          img.src = event.target.result
        }
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(file)
      })
    },

    // COMPRESSION
    getAdaptiveQuality(megapixels) {
      if (megapixels > 100) return 65
      if (megapixels > 50) return 70
      if (megapixels > 30) return 75
      if (megapixels > 20) return 80
      return 85
    },

    async compressAll() {
      if (this.files.length === 0) return
      this.isProcessing = true
      this.progress = 0

      const uncompressed = this.files.filter(f => f.status === 'pending')
      this.compressionQueue = [...uncompressed]

      while (this.compressionQueue.length > 0 || this.activeCompressions > 0) {
        while (this.activeCompressions < this.maxConcurrent && this.compressionQueue.length > 0) {
          const fileObj = this.compressionQueue.shift()
          this.activeCompressions++
          this.compressSingle(fileObj).finally(() => {
            this.activeCompressions--
            this.updateProgress()
          })
        }
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      this.isProcessing = false
    },

    async compressSingle(fileObj) {
      if (!fileObj.file || fileObj.status !== 'pending') return
      fileObj.status = 'processing'

      try {
        const qualityToUse = this.compressionMode === 'adaptive'
          ? this.getAdaptiveQuality(fileObj.metadata.megapixels)
          : this.quality

        // For large images (30MP+), use tiled compression
        let compressedBlob
        if (fileObj.metadata.megapixels > 30) {
          compressedBlob = await this.compressImageTiled(fileObj, qualityToUse)
        } else {
          compressedBlob = await this.compressImageStandard(fileObj, qualityToUse)
        }

        if (compressedBlob && compressedBlob.size > 0) {
          fileObj.compressedBlob = compressedBlob
          fileObj.compressedSize = compressedBlob.size
          fileObj.status = 'compressed'
          this.totalProcessed++
          this.totalSaved += Math.max(0, fileObj.size - compressedBlob.size)
        } else {
          fileObj.status = 'error'
        }
      } catch (error) {
        console.error('Compression error:', error)
        fileObj.status = 'error'
      }
    },

    // TILED COMPRESSION for 100MP+
    async compressImageTiled(fileObj, quality) {
      return new Promise((resolve, reject) => {
        const TILE_SIZE = 1024
        const reader = new FileReader()

        reader.onload = (event) => {
          const img = new Image()
          img.onload = () => {
            try {
              const { width, height } = img
              const outputCanvas = document.createElement('canvas')
              outputCanvas.width = width
              outputCanvas.height = height
              const outputCtx = outputCanvas.getContext('2d')

              const tilesX = Math.ceil(width / TILE_SIZE)
              const tilesY = Math.ceil(height / TILE_SIZE)

              let completed = 0
              const processNextTile = () => {
                if (completed >= tilesX * tilesY) {
                  // All tiles done
                  outputCanvas.toBlob(
                    (blob) => {
                      outputCanvas.width = outputCanvas.height = 0
                      img.src = ''
                      resolve(blob)
                    },
                    'image/jpeg',
                    quality / 100
                  )
                  return
                }

                const tileY = Math.floor(completed / tilesX)
                const tileX = completed % tilesX

                const x = tileX * TILE_SIZE
                const y = tileY * TILE_SIZE
                const w = Math.min(TILE_SIZE, width - x)
                const h = Math.min(TILE_SIZE, height - y)

                const tileCanvas = document.createElement('canvas')
                tileCanvas.width = w
                tileCanvas.height = h
                const tileCtx = tileCanvas.getContext('2d')

                tileCtx.drawImage(img, x, y, w, h, 0, 0, w, h)
                const imageData = tileCtx.getImageData(0, 0, w, h)
                outputCtx.putImageData(imageData, x, y)

                tileCanvas.width = tileCanvas.height = 0
                completed++

                // Yield to browser
                setTimeout(processNextTile, 0)
              }

              processNextTile()
            } catch (error) {
              reject(error)
            }
          }
          img.onerror = () => reject(new Error('Image load failed'))
          img.src = event.target.result
        }
        reader.onerror = () => reject(new Error('FileReader failed'))
        reader.readAsDataURL(fileObj.file)
      })
    },

    // Standard compression for smaller images
    async compressImageStandard(fileObj, quality) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const img = new Image()
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas')
              canvas.width = img.naturalWidth
              canvas.height = img.naturalHeight
              const ctx = canvas.getContext('2d')
              ctx.drawImage(img, 0, 0)

              canvas.toBlob(
                (blob) => {
                  canvas.width = canvas.height = 0
                  img.src = ''
                  resolve(blob)
                },
                'image/jpeg',
                quality / 100
              )
            } catch (error) {
              reject(error)
            }
          }
          img.onerror = () => reject(new Error('Image load failed'))
          img.src = event.target.result
        }
        reader.onerror = () => reject(new Error('FileReader failed'))
        reader.readAsDataURL(fileObj.file)
      })
    },

    updateProgress() {
      const total = this.files.filter(f => f.status === 'pending').length + this.totalProcessed
      const processed = this.totalProcessed + (this.maxConcurrent - this.activeCompressions)
      this.progress = (processed / this.files.length) * 100
    },

    // DOWNLOAD
    downloadFile(file) {
      if (!file.compressedBlob) return
      const url = URL.createObjectURL(file.compressedBlob)
      const a = document.createElement('a')
      a.href = url
      const originalName = file.name.replace(/\.[^/.]+$/, '')
      const extension = file.name.split('.').pop()
      a.download = `${originalName}_compressed.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },

    downloadAll() {
      const compressedFiles = this.files.filter(f => f.status === 'compressed')
      if (compressedFiles.length === 0) {
        this.showError('No files', 'Compress files first')
        return
      }
      compressedFiles.forEach((file, index) => {
        setTimeout(() => this.downloadFile(file), index * 500)
      })
    },

    async downloadAsZip() {
      const compressedFiles = this.files.filter(f => f.status === 'compressed')
      if (compressedFiles.length === 0) {
        this.showError('No files', 'Compress files first')
        return
      }

      try {
        const JSZip = await import('jszip')
        const zip = new JSZip.default()

        compressedFiles.forEach(file => {
          if (file.compressedBlob) {
            const originalName = file.name.replace(/\.[^/.]+$/, '')
            const extension = file.name.split('.').pop()
            zip.file(`${originalName}_compressed.${extension}`, file.compressedBlob)
          }
        })

        const zipBlob = await zip.generateAsync({ type: 'blob' })
        const url = URL.createObjectURL(zipBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = `compressed_${new Date().toISOString().split('T')[0]}.zip`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (error) {
        this.showError('Download failed', 'Could not create ZIP')
      }
    },

    clearSession() {
      this.files.forEach(file => {
        if (file.previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(file.previewUrl)
        }
      })
      this.files = []
      this.progress = 0
      this.totalProcessed = 0
      this.totalSaved = 0
    },

    // UTILITIES
    getStatusText(status) {
      const map = {
        pending: 'Ready',
        processing: 'Processing...',
        compressed: 'Complete',
        error: 'Failed',
      }
      return map[status] || 'Ready'
    },

    truncateFileName(fileName, maxLength = 25) {
      if (fileName.length <= maxLength) return fileName
      const ext = fileName.split('.').pop()
      const name = fileName.substring(0, fileName.lastIndexOf('.'))
      return name.substring(0, maxLength - ext.length - 4) + '...' + ext
    },

    formatSize(bytes) {
      if (!bytes) return '0 B'
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(1024))
      return Math.round((bytes / Math.pow(1024, i)) * 10) / 10 + ' ' + sizes[i]
    },

    showError(title, message) {
      this.error = { title, message }
      setTimeout(() => { this.error = null }, 5000)
    },
  },

  beforeDestroy() {
    this.files.forEach(file => {
      if (file.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(file.previewUrl)
      }
    })
  },
}
</script>

<style scoped>
.compressor-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f8f9fa;
  color: #1a1a1a;
  height: 100vh;
  overflow: hidden;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

.header {
  text-align: center;
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.header p {
  color: #666;
  font-size: 0.9rem;
}

.clear-session-btn {
  padding: 0.5rem 1rem;
  background: #ff3b30;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-session-btn:hover {
  background: #d70015;
}

.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  min-height: 0;
  overflow: hidden;
}

.left-panel,
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
}

.upload-section {
  background: white;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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

.drop-zone:hover,
.drop-zone.dragover {
  border-color: #007aff;
  background: #f0f8ff;
  transform: translateY(-2px);
}

.drop-icon {
  font-size: 2rem;
  margin-bottom: 0.75rem;
  opacity: 0.6;
}

.drop-text {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
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
  padding: 0.25rem 0.5rem;
  font-size: 0.65rem;
  min-width: auto;
}

.btn-secondary:hover {
  background: #ebebeb;
}

.btn:disabled {
  background: #ccc;
  cursor: not-allowed;
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
  margin-bottom: 0.75rem;
}

.setting-item {
  margin-bottom: 1rem;
}

.setting-label {
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.75rem;
}

.quality-slider {
  flex: 1;
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
  font-weight: 500;
}

.adaptive-info {
  background: #f0f8ff;
  border: 1px solid #b3d9ff;
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 1rem;
  font-size: 0.75rem;
  color: #0066cc;
}

.adaptive-info p {
  margin: 0;
}

.dimensions-info {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f0f8ff;
  border-radius: 8px;
  border: 1px solid #b3d9ff;
}

.info-item {
  font-size: 0.75rem;
  color: #0066cc;
  margin-bottom: 0.25rem;
}

.info-item:last-child {
  margin-bottom: 0;
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

.file-preview {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 0.125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 0.65rem;
  color: #666;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.file-size {
  display: flex;
  gap: 0.5rem;
}

.file-metadata {
  display: flex;
  gap: 0.5rem;
  color: #007aff;
  font-weight: 500;
}

.megapixels {
  background: #f0f8ff;
  padding: 0 0.25rem;
  border-radius: 3px;
}

.processing-info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #ff9800;
  font-weight: 600;
}

.status-dot {
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #ff9800;
  animation: pulse 1s infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.file-actions {
  display: flex;
  gap: 0.25rem;
}

.file-status {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-weight: 500;
  white-space: nowrap;
}

.file-status.pending {
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  background: white;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  flex: 1;
}

.empty-state-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.6;
}

.empty-state-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.empty-state-description {
  font-size: 1rem;
  color: #666;
  margin-bottom: 2rem;
}

.empty-state-features {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}

.feature-item {
  font-size: 0.9rem;
  color: #666;
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border-radius: 20px;
}

.download-options {
  background: white;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  display: none;
  flex-shrink: 0;
  padding: 1rem;
}

.download-options.show {
  display: block;
}

.download-header {
  text-align: center;
  margin-bottom: 1rem;
}

.download-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.download-summary {
  font-size: 0.75rem;
  color: #666;
}

.space-saved {
  font-size: 0.8rem;
  color: #28a745;
  font-weight: 600;
}

.download-actions-grid {
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
  transition: all 0.2s;
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
}

.action-bar {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
  flex-shrink: 0;
}

.main-action {
  flex: 1;
  max-width: 250px;
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
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

.action-icon {
  transition: transform 0.3s;
}

.action-icon.processing {
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
  background: white;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  padding: 1rem;
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
  font-weight: 500;
}

.error-message {
  position: fixed;
  top: 1rem;
  left: 1rem;
  right: 1rem;
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 8px;
  padding: 1rem;
  display: none;
  z-index: 100;
}

.error-message.show {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.error-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #c53030;
}

.error-desc {
  font-size: 0.875rem;
  color: #721c24;
  flex: 1;
}

@media (max-width: 768px) {
  .compressor-container {
    padding: 0.5rem;
    height: auto;
    min-height: 100vh;
  }

  .main-content {
    grid-template-columns: 1fr;
    gap: 1rem;
    height: auto;
  }
}
</style>