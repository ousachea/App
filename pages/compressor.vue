<!-- pages/compressor.vue -->
<template>
  <div class="app">
    <header>
      <h1>OUSA Images Compressor</h1>
    </header>

    <!-- Upload Area -->
    <section class="upload-area" @click="triggerFileInput" @dragover.prevent @drop.prevent="handleFileDrop">
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        multiple
        @change="handleFileChange"
      />
      
      <div v-if="!selectedFiles.length" class="upload-prompt">
        <div class="upload-icon">+</div>
        <p>Drag images here or click to upload</p>
      </div>
      
      <div v-else class="selected-preview">
        <div class="files-grid">
          <div v-for="(file, index) in selectedFiles" :key="file.id" class="file-item">
            <button class="remove-btn" @click.stop="removeFile(index)">×</button>
            <img :src="file.previewUrl" alt="Preview" />
            <div class="file-info">{{ truncateFilename(file.file.name) }}</div>
          </div>
          
          <div class="add-more" @click.stop="triggerFileInput">
            <div class="add-icon">+</div>
          </div>
        </div>
        
        <div class="actions-bar">
          <button class="secondary-btn" @click.stop="clearFiles">Clear All</button>
        </div>
      </div>
    </section>

    <!-- Compression Controls -->
    <section v-if="selectedFiles.length > 0" class="controls">
      <div class="control-group">
        <label>Quality: {{ quality }}%</label>
        <input type="range" min="1" max="100" v-model.number="quality" />
      </div>
      
      <div class="control-group">
        <label>Max Width: {{ maxWidth }}px</label>
        <input type="range" min="100" max="4000" step="100" v-model.number="maxWidth" />
      </div>
      
      <div class="control-group format-control">
        <label class="format-option" :class="{ active: outputFormat === 'jpeg' }">
          <input type="radio" v-model="outputFormat" value="jpeg" class="hidden" />
          <span>JPEG</span>
        </label>
        <label class="format-option" :class="{ active: outputFormat === 'png' }">
          <input type="radio" v-model="outputFormat" value="png" class="hidden" />
          <span>PNG</span>
        </label>
        <label class="format-option" :class="{ active: outputFormat === 'webp' }">
          <input type="radio" v-model="outputFormat" value="webp" class="hidden" />
          <span>WebP</span>
        </label>
      </div>
      
      <button 
        @click="compressAllImages" 
        class="primary-btn"
        :disabled="isCompressing"
      >
        <template v-if="isCompressing">
          <span class="spinner"></span>
          <span>{{ processedCount }}/{{ selectedFiles.length }}</span>
        </template>
        <template v-else>Compress</template>
      </button>
    </section>

    <!-- Results -->
    <section v-if="compressedResults.length > 0" class="results">
      <div class="results-header">
        <div class="results-info">
          <span>{{ compressedResults.length }} images compressed</span>
          <span>{{ totalSavingsPercent }}% saved ({{ formatFileSize(totalBytesSaved) }})</span>
        </div>
        
        <div class="results-actions">
          <button 
            class="action-btn zip-btn" 
            @click="downloadAllAsZip" 
            :disabled="isGeneratingZip"
          >
            <span v-if="isGeneratingZip" class="spinner"></span>
            <span v-else>Download ZIP</span>
          </button>
          <button class="action-btn" @click="clearResults">Clear</button>
        </div>
      </div>
      
      <div class="results-grid">
        <div 
          v-for="(result, index) in compressedResults" 
          :key="result.id" 
          class="result-card"
          :class="{ selected: isResultSelected(result) }"
          @click="toggleResultSelection(result)"
        >
          <div class="result-preview">
            <img :src="result.compressedUrl" alt="Compressed image" />
            <div class="check-mark" v-if="isResultSelected(result)">✓</div>
          </div>
          
          <div class="result-details">
            <div class="result-name">{{ truncateFilename(result.filename) }}</div>
            <div class="result-stats">
              <span>{{ formatFileSize(result.compressedSize) }}</span>
              <span class="savings">-{{ result.savings }}%</span>
            </div>
            <button class="download-btn" @click.stop="downloadImage(result)">↓</button>
          </div>
        </div>
      </div>
      
      <div v-if="selectedResults.length > 0" class="selection-bar">
        <span>{{ selectedResults.length }} selected</span>
        <button class="action-btn" @click="downloadSelectedImages">Download Selected</button>
      </div>
    </section>

    <footer>
      <p>© OUSA Images Compressor - Client-side compression with no uploads</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'OusaImagesCompressor',
  head() {
    return {
      title: 'OUSA Images Compressor',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' },
        {
          hid: 'description',
          name: 'description',
          content: 'Compress multiple images without losing quality'
        }
      ]
    }
  },
  data() {
    return {
      selectedFiles: [],
      quality: 75,
      maxWidth: 1200,
      outputFormat: 'jpeg',
      isCompressing: false,
      processedCount: 0,
      compressedResults: [],
      selectedResults: [],
      isGeneratingZip: false,
      fileIdCounter: 0
    }
  },
  computed: {
    totalOriginalSize() {
      return this.compressedResults.reduce((sum, result) => sum + result.originalSize, 0)
    },
    totalCompressedSize() {
      return this.compressedResults.reduce((sum, result) => sum + result.compressedSize, 0)
    },
    totalBytesSaved() {
      return this.totalOriginalSize - this.totalCompressedSize
    },
    totalSavingsPercent() {
      if (this.totalOriginalSize === 0) return 0
      const savings = (this.totalBytesSaved / this.totalOriginalSize) * 100
      return Math.round(savings)
    }
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    handleFileChange(event) {
      const newFiles = Array.from(event.target.files)
      this.addFiles(newFiles)
    },
    handleFileDrop(event) {
      const newFiles = Array.from(event.dataTransfer.files).filter(file => file.type.startsWith('image/'))
      this.addFiles(newFiles)
    },
    addFiles(newFiles) {
      if (newFiles.length === 0) return

      // Add new files to our array in a structured way
      for (const file of newFiles) {
        if (file.type.startsWith('image/')) {
          const previewUrl = URL.createObjectURL(file)
          this.selectedFiles.push({
            id: 'file-' + (++this.fileIdCounter),
            file: file,
            previewUrl: previewUrl,
            processed: false
          })
        }
      }
      
      // Reset form input to allow selecting the same file again
      this.$refs.fileInput.value = ''
    },
    removeFile(index) {
      // Revoke the object URL to prevent memory leaks
      URL.revokeObjectURL(this.selectedFiles[index].previewUrl)
      
      // Remove the file from array
      this.selectedFiles.splice(index, 1)
    },
    clearFiles() {
      // Revoke all object URLs
      this.selectedFiles.forEach(fileObj => URL.revokeObjectURL(fileObj.previewUrl))
      
      // Clear array
      this.selectedFiles = []
    },
    truncateFilename(filename) {
      if (filename.length <= 20) return filename
      const extension = filename.split('.').pop()
      const name = filename.substring(0, filename.length - extension.length - 1)
      return name.substring(0, 16) + '...' + extension
    },
    formatFileSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    },
    async compressAllImages() {
      if (this.selectedFiles.length === 0 || this.isCompressing) return
      
      try {
        this.isCompressing = true
        this.processedCount = 0
        
        const newResults = []
        
        // Process only unprocessed files
        const unprocessedFiles = this.selectedFiles.filter(fileObj => !fileObj.processed)
        
        for (let i = 0; i < unprocessedFiles.length; i++) {
          const fileObj = unprocessedFiles[i]
          const result = await this.compressImage(fileObj)
          
          if (result) {
            newResults.push(result)
            this.processedCount++
            
            // Mark as processed
            const index = this.selectedFiles.findIndex(f => f.id === fileObj.id)
            if (index !== -1) {
              this.selectedFiles[index].processed = true
            }
          }
        }
        
        // Add new results to existing ones
        this.compressedResults = [...this.compressedResults, ...newResults]
      } catch (error) {
        console.error('Error during compression:', error)
      } finally {
        this.isCompressing = false
      }
    },
    compressImage(fileObj) {
      return new Promise((resolve, reject) => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          const img = new Image()
          
          // Set up proper error handling
          img.onerror = () => {
            console.error('Error loading image:', fileObj.file.name)
            resolve(null)
          }
          
          img.onload = () => {
            try {
              // Calculate new dimensions while maintaining aspect ratio
              let width = img.width
              let height = img.height
              
              if (width > this.maxWidth) {
                const ratio = this.maxWidth / width
                width = this.maxWidth
                height = height * ratio
              }
              
              // Set canvas dimensions
              canvas.width = width
              canvas.height = height
              
              // Draw image on canvas
              ctx.drawImage(img, 0, 0, width, height)
              
              // Convert to desired format with quality setting
              const mimeType = `image/${this.outputFormat}`
              const quality = this.quality / 100
              
              canvas.toBlob((blob) => {
                if (!blob) {
                  console.error('Blob creation failed')
                  resolve(null)
                  return
                }
                
                // Create URL for the compressed image
                const compressedUrl = URL.createObjectURL(blob)
                
                // Calculate savings
                const originalSize = fileObj.file.size
                const compressedSize = blob.size
                const savings = Math.round(((originalSize - compressedSize) / originalSize) * 100)
                
                // Generate filename with prefix
                const originalFilename = fileObj.file.name
                const extension = this.outputFormat.toLowerCase()
                
                // Extract base name without extension
                const lastDotIndex = originalFilename.lastIndexOf('.')
                const baseName = originalFilename.substring(0, lastDotIndex > 0 ? lastDotIndex : originalFilename.length)
                
                // Always apply "ousa-" prefix (hardcoded)
                const filename = `ousa-${baseName}.${extension}`
                
                // Create result object
                const result = {
                  id: 'result-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                  originalFileId: fileObj.id,
                  originalFilename: fileObj.file.name,
                  filename,
                  originalSize,
                  compressedSize,
                  compressedUrl,
                  compressedBlob: blob,
                  savings
                }
                
                // Clean up
                URL.revokeObjectURL(img.src)
                resolve(result)
              }, mimeType, quality)
            } catch (error) {
              console.error('Error processing image:', error)
              resolve(null)
            }
          }
          
          // Start loading the image
          img.src = fileObj.previewUrl
        } catch (error) {
          console.error('Compression failed:', error)
          reject(error)
        }
      })
    },
    downloadImage(result) {
      const link = document.createElement('a')
      link.href = result.compressedUrl
      link.download = result.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    downloadAllImages() {
      // Create a small delay between downloads to avoid browser limitations
      this.compressedResults.forEach((result, index) => {
        setTimeout(() => {
          this.downloadImage(result)
        }, index * 100) // 100ms delay between downloads
      })
    },
    async downloadAllAsZip() {
      if (this.compressedResults.length === 0 || this.isGeneratingZip) return
      
      this.isGeneratingZip = true
      
      try {
        // Dynamically import JSZip
        const JSZipModule = await import('jszip')
        const JSZip = JSZipModule.default
        const zip = new JSZip()
        
        // Create a folder and add all compressed images
        const folder = zip.folder('ousa_compressed_images')
        
        // Process each image
        for (const result of this.compressedResults) {
          folder.file(result.filename, result.compressedBlob)
        }
        
        // Generate the ZIP file
        const content = await zip.generateAsync({ type: 'blob' })
        
        // Create download link
        const link = document.createElement('a')
        link.href = URL.createObjectURL(content)
        link.download = 'ousa_compressed_images.zip'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Clean up
        URL.revokeObjectURL(link.href)
      } catch (error) {
        console.error('Error creating ZIP:', error)
        alert('Failed to create ZIP file. Please try downloading images individually.')
      } finally {
        this.isGeneratingZip = false
      }
    },
    // Selection methods
    toggleResultSelection(result) {
      const index = this.selectedResults.findIndex(r => r.id === result.id)
      if (index === -1) {
        this.selectedResults.push(result)
      } else {
        this.selectedResults.splice(index, 1)
      }
    },
    isResultSelected(result) {
      return this.selectedResults.some(r => r.id === result.id)
    },
    downloadSelectedImages() {
      // Create a small delay between downloads to avoid browser limitations
      this.selectedResults.forEach((result, index) => {
        setTimeout(() => {
          this.downloadImage(result)
        }, index * 100) // 100ms delay between downloads
      })
    },
    clearResults() {
      // Revoke all object URLs
      this.compressedResults.forEach(result => URL.revokeObjectURL(result.compressedUrl))
      
      // Reset processed status for all files
      this.selectedFiles.forEach(fileObj => {
        fileObj.processed = false
      })
      
      // Clear results
      this.compressedResults = []
      this.selectedResults = []
    }
  },
  beforeDestroy() {
    // Clean up all object URLs when component is destroyed
    this.selectedFiles.forEach(fileObj => URL.revokeObjectURL(fileObj.previewUrl))
    this.compressedResults.forEach(result => URL.revokeObjectURL(result.compressedUrl))
  }
}
</script>

<style scoped>
/* Base Styles & Reset */
*, *::before, *::after {
  box-sizing: border-box;
}

.app {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  color: #333;
  line-height: 1.4;
}

.hidden {
  display: none;
}

button {
  cursor: pointer;
  font-family: inherit;
}

/* Typography */
h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 30px;
  color: #333;
  text-align: center;
}

/* Section Styles */
section {
  margin-bottom: 30px;
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

/* Upload Area */
.upload-area {
  padding: 0;
  cursor: pointer;
  border: 2px dashed #ddd;
  background-color: #fafafa;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.upload-area:hover {
  border-color: #0066FF;
  background-color: #f7f9ff;
}

.upload-prompt {
  padding: 40px 20px;
  text-align: center;
}

.upload-icon {
  font-size: 36px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
  color: #888;
}

.selected-preview {
  width: 100%;
  padding: 20px;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.file-item {
  position: relative;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  padding-bottom: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.file-item img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  display: block;
}

.file-info {
  font-size: 12px;
  padding: 5px 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.remove-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
  padding: 0;
  z-index: 1;
}

.add-more {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border-radius: 8px;
  height: 120px;
  cursor: pointer;
}

.add-icon {
  font-size: 24px;
  color: #888;
}

.actions-bar {
  display: flex;
  justify-content: flex-end;
}

/* Controls Section */
.controls {
  padding: 20px;
}

.control-group {
  margin-bottom: 15px;
}

.control-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
}

.control-group input[type="range"] {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #eee;
  outline: none;
  border-radius: 3px;
}

.control-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #0066FF;
  cursor: pointer;
}

.format-control {
  display: flex;
  gap: 10px;
}

.format-option {
  flex: 1;
  text-align: center;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s;
}

.format-option.active {
  background-color: #0066FF;
  border-color: #0066FF;
  color: white;
}

/* Buttons */
.primary-btn {
  width: 100%;
  background: #0066FF;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 5px;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.primary-btn:hover {
  background: #0055DD;
}

.primary-btn:disabled {
  background: #99BBFF;
  cursor: not-allowed;
}

.secondary-btn {
  background: transparent;
  color: #666;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 5px;
  font-size: 14px;
  transition: all 0.2s;
}

.secondary-btn:hover {
  background: #f5f5f5;
}

.action-btn {
  background: #f0f0f0;
  color: #333;
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  font-size: 14px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #e0e0e0;
}

.zip-btn {
  background: #0066FF;
  color: white;
}

.zip-btn:hover {
  background: #0055DD;
}

.zip-btn:disabled {
  background: #99BBFF;
  cursor: not-allowed;
}

.download-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #0066FF;
  color: white;
  border: none;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.download-btn:hover {
  background: #0055DD;
}

/* Results Section */
.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  flex-wrap: wrap;
  gap: 10px;
}

.results-info {
  display: flex;
  flex-direction: column;
  font-size: 14px;
  color: #666;
}

.results-actions {
  display: flex;
  gap: 10px;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 15px;
  padding: 20px;
}

.result-card {
  position: relative;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  transition: all 0.2s;
  cursor: pointer;
}

.result-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.result-card.selected {
  border: 2px solid #0066FF;
}

.result-preview {
  position: relative;
  height: 100px;
}

.result-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.check-mark {
  position: absolute;
  top: 0;
  right: 0;
  background: #0066FF;
  color: white;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.result-details {
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.result-name {
  width: 100%;
  font-weight: 500;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-stats {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.savings {
  color: #00aa55;
  font-weight: 500;
}

.selection-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #f0f7ff;
  font-size: 14px;
  border-top: 1px solid #eee;
}

/* Loading Spinner */
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  margin-right: 6px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Footer */
footer {
  text-align: center;
  color: #999;
  font-size: 12px;
  margin-top: 40px;
}

/* Responsive Adjustments */
@media (max-width: 480px) {
  .app {
    padding: 15px;
  }
  
  .results-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
  
  .results-header {
    padding: 12px 15px;
  }
  
  .format-control {
    flex-direction: column;
    gap: 5px;
  }
  
  .selection-bar {
    flex-direction: column;
    gap: 10px;
  }
  
  .selection-bar .action-btn {
    width: 100%;
  }
}
</style>