<!-- pages/compress.vue -->
<template>
  <div class="compressor">
    <div class="header">
      <h1 class="title">OUSA Images Compressor</h1>
      <p class="description">Compress multiple images at once without losing quality</p>
    </div>

    <!-- Upload Area -->
    <div 
      class="upload-area" 
      :class="{ 'has-files': selectedFiles.length > 0 }"
      @click="triggerFileInput"
      @dragover.prevent
      @drop.prevent="handleFileDrop"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden-input"
        multiple
        @change="handleFileChange"
      />
      
      <template v-if="selectedFiles.length === 0">
        <div class="upload-icon">📁</div>
        <p class="upload-text">Drag images here or click to browse</p>
        <p class="upload-hint">Supports multiple files: JPG, PNG, and WebP</p>
      </template>
      
      <template v-else>
        <div class="selected-files">
          <div 
            v-for="(file, index) in selectedFiles" 
            :key="index" 
            class="file-item"
          >
            <img 
              :src="previewUrls[index]" 
              alt="Preview" 
              class="file-preview" 
            />
            <div class="file-details">
              <p class="file-name">{{ truncateFilename(file.name) }}</p>
              <p class="file-size">{{ formatFileSize(file.size) }}</p>
            </div>
            <button 
              @click.stop="removeFile(index)" 
              class="remove-file-button"
              aria-label="Remove file"
            >
              ✕
            </button>
          </div>
        </div>
        <div class="file-actions">
          <button 
            @click.stop="triggerFileInput" 
            class="add-more-button"
          >
            Add More Images
          </button>
          <button 
            @click.stop="clearFiles" 
            class="clear-button"
          >
            Clear All
          </button>
        </div>
      </template>
    </div>

    <!-- Compression Controls -->
    <div v-if="selectedFiles.length > 0" class="controls">
      <div class="control-group">
        <label>
          <span class="control-label">Quality: {{ quality }}%</span>
          <input 
            type="range" 
            min="1" 
            max="100" 
            v-model.number="quality"
            class="slider"
          />
          <div class="range-labels">
            <span>Lower size</span>
            <span>Higher quality</span>
          </div>
        </label>
      </div>
      
      <div class="control-group">
        <label>
          <span class="control-label">Max Width: {{ maxWidth }}px</span>
          <input 
            type="range" 
            min="100" 
            max="4000" 
            step="100"
            v-model.number="maxWidth"
            class="slider"
          />
        </label>
      </div>
      
      <div class="control-group">
        <label class="control-label">Output Format</label>
        <div class="format-options">
          <label class="format-option">
            <input 
              type="radio" 
              v-model="outputFormat" 
              value="jpeg" 
            />
            <span>JPEG</span>
          </label>
          <label class="format-option">
            <input 
              type="radio" 
              v-model="outputFormat" 
              value="png" 
            />
            <span>PNG</span>
          </label>
          <label class="format-option">
            <input 
              type="radio" 
              v-model="outputFormat" 
              value="webp" 
            />
            <span>WebP</span>
          </label>
        </div>
      </div>

      <div class="control-group">
        <label class="control-label">File Prefix (optional)</label>
        <input 
          type="text" 
          v-model="filePrefix" 
          placeholder="E.g., ousa-compressed-" 
          class="text-input"
        />
      </div>
      
      <div class="control-group">
        <label class="control-label">Download Options</label>
        <div class="download-options">
          <label class="radio-option">
            <input 
              type="radio" 
              v-model="downloadOption" 
              value="none" 
            />
            <span>Manual download</span>
          </label>
          <label class="radio-option">
            <input 
              type="radio" 
              v-model="downloadOption" 
              value="single" 
            />
            <span>Download each image</span>
          </label>
          <label class="radio-option">
            <input 
              type="radio" 
              v-model="downloadOption" 
              value="multiple" 
            />
            <span>Download all as separate files</span>
          </label>
          <label class="radio-option">
            <input 
              type="radio" 
              v-model="downloadOption" 
              value="zip" 
            />
            <span>Download all as ZIP</span>
          </label>
        </div>
      </div>
      
      <button 
        @click="compressAllImages" 
        class="compress-button"
        :disabled="isCompressing"
      >
        <span v-if="isCompressing">
          <span class="processing-spinner"></span>
          Compressing ({{ processedCount }}/{{ selectedFiles.length }})...
        </span>
        <span v-else>Compress All Images</span>
      </button>
    </div>

    <!-- Results -->
    <div v-if="compressedResults.length > 0" class="results">
      <div class="results-header">
        <h2 class="results-title">Compressed Images</h2>
        <div class="results-summary">
          <p class="summary-text">
            {{ compressedResults.length }} images compressed, 
            saving {{ totalSavingsPercent }}% ({{ formatFileSize(totalBytesSaved) }})
          </p>
          <div class="results-actions">
            <div class="select-actions">
              <button 
                @click="selectAllResults" 
                class="select-button"
                v-if="selectedResults.length < compressedResults.length"
              >
                Select All
              </button>
              <button 
                @click="deselectAllResults" 
                class="select-button"
                v-else
              >
                Deselect All
              </button>
            </div>
            <div class="multi-download-actions" v-if="selectedResults.length > 0">
              <button 
                @click="downloadSelectedImages" 
                class="multi-download-button"
              >
                <span class="download-icon">↓</span>
                Download {{ selectedResults.length }} Selected
              </button>
              <button 
                @click="downloadSelectedAsZip" 
                class="multi-download-button zip-button"
                :disabled="isGeneratingZip"
              >
                <span v-if="isGeneratingZip">
                  <span class="processing-spinner"></span>
                  Preparing...
                </span>
                <span v-else>
                  <span class="download-icon">↓</span>
                  Download Selected as ZIP
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="results-list">
        <div 
          v-for="(result, index) in compressedResults" 
          :key="index" 
          class="result-item"
          :class="{ 'selected': isResultSelected(result) }"
          @click="toggleResultSelection(result)"
        >
          <div class="result-checkbox">
            <input 
              type="checkbox" 
              :checked="isResultSelected(result)" 
              @click.stop
              @change="toggleResultSelection(result)"
            />
          </div>
          
          <div class="result-preview">
            <img :src="result.compressedUrl" alt="Compressed preview" />
          </div>
          
          <div class="result-details">
            <div class="result-info">
              <p class="result-filename">{{ truncateFilename(result.filename) }}</p>
              <div class="result-stats">
                <p class="result-sizes">
                  Original: {{ formatFileSize(result.originalSize) }} → 
                  Compressed: {{ formatFileSize(result.compressedSize) }}
                </p>
                <p class="result-savings" v-if="result.savings > 0">
                  Saved {{ result.savings }}% ({{ formatFileSize(result.originalSize - result.compressedSize) }})
                </p>
              </div>
            </div>
            <div class="result-actions">
              <button 
                @click.stop="downloadImage(result)" 
                class="download-button"
              >
                <span class="download-icon">↓</span>
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="batch-actions">
        <button 
          @click="downloadAllAsZip" 
          class="download-all-button"
          :disabled="isGeneratingZip"
        >
          <span v-if="isGeneratingZip">
            <span class="processing-spinner"></span>
            Preparing ZIP...
          </span>
          <span v-else>
            <span class="download-icon">↓</span>
            Download All as ZIP
          </span>
        </button>
        
        <button 
          @click="downloadAllImages" 
          class="download-all-button all-files-button"
        >
          <span class="download-icon">↓</span>
          Download All as Files
        </button>
        
        <button 
          @click="clearResults" 
          class="clear-results-button"
        >
          Clear Results
        </button>
      </div>
    </div>

    <div class="footer">
      <p>© 2025 OUSA Images Compressor - Compress images in browser with no data uploaded to servers</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'OusaImagesCompressor',
  head() {
    return {
      title: 'OUSA Images Compressor',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Compress multiple images at once without losing quality - OUSA Images Compressor'
        }
      ]
    }
  },
  data() {
    return {
      selectedFiles: [],
      previewUrls: [],
      quality: 75,
      maxWidth: 1200,
      outputFormat: 'jpeg',
      filePrefix: 'ousa-',
      downloadOption: 'none', // none, single, multiple, zip
      isCompressing: false,
      processedCount: 0,
      compressedResults: [],
      selectedResults: [],
      isGeneratingZip: false
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

      // Add new files to our array
      for (const file of newFiles) {
        if (file.type.startsWith('image/')) {
          this.selectedFiles.push(file)
          this.previewUrls.push(URL.createObjectURL(file))
        }
      }
      
      // Reset form input to allow selecting the same file again
      this.$refs.fileInput.value = ''
    },
    removeFile(index) {
      // Revoke the object URL to prevent memory leaks
      URL.revokeObjectURL(this.previewUrls[index])
      
      // Remove the file from arrays
      this.selectedFiles.splice(index, 1)
      this.previewUrls.splice(index, 1)
    },
    clearFiles() {
      // Revoke all object URLs
      this.previewUrls.forEach(url => URL.revokeObjectURL(url))
      
      // Clear arrays
      this.selectedFiles = []
      this.previewUrls = []
    },
    truncateFilename(filename) {
      if (filename.length <= 20) return filename
      const extension = filename.split('.').pop()
      const name = filename.substring(0, filename.length - extension.length - 1)
      return name.substring(0, 16) + '...' + extension
    },
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    async compressAllImages() {
      if (this.selectedFiles.length === 0 || this.isCompressing) return
      
      this.isCompressing = true
      this.processedCount = 0
      
      // Clear previous results if any
      this.compressedResults.forEach(result => URL.revokeObjectURL(result.compressedUrl))
      this.compressedResults = []
      this.selectedResults = []
      
      const newResults = []
      
      for (let i = 0; i < this.selectedFiles.length; i++) {
        const result = await this.compressImage(this.selectedFiles[i], i)
        if (result) {
          newResults.push(result)
          this.processedCount++
          
          // Handle download options for individual images
          if (this.downloadOption === 'single') {
            this.downloadImage(result)
          }
        }
      }
      
      // Update results
      this.compressedResults = newResults
      
      // Handle download options for multiple images
      if (this.downloadOption === 'multiple') {
        this.downloadAllImages()
      } else if (this.downloadOption === 'zip') {
        this.downloadAllAsZip()
      }
      
      this.isCompressing = false
    },
    compressImage(file, index) {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        
        img.onload = () => {
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
            // Create URL for the compressed image
            const compressedUrl = URL.createObjectURL(blob)
            
            // Calculate savings
            const originalSize = file.size
            const compressedSize = blob.size
            const savings = Math.round(((originalSize - compressedSize) / originalSize) * 100)
            
            // Generate filename with prefix if provided
            const originalFilename = file.name
            const extension = this.outputFormat.toLowerCase()
            let filename
            
            // Extract base name without extension
            const lastDotIndex = originalFilename.lastIndexOf('.')
            const baseName = originalFilename.substring(0, lastDotIndex > 0 ? lastDotIndex : originalFilename.length)
            
            // Apply prefix if provided
            filename = this.filePrefix ? `${this.filePrefix}${baseName}.${extension}` : `${baseName}.${extension}`
            
            // Create result object
            const result = {
              id: Date.now() + '-' + index, // Unique ID for selection
              originalFilename: file.name,
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
        }
        
        img.onerror = () => {
          console.error('Error loading image:', file.name)
          resolve(null)
        }
        
        img.src = this.previewUrls[index]
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
      }
      
      this.isGeneratingZip = false
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
    selectAllResults() {
      this.selectedResults = [...this.compressedResults]
    },
    deselectAllResults() {
      this.selectedResults = []
    },
    async downloadSelectedAsZip() {
      if (this.selectedResults.length === 0 || this.isGeneratingZip) return
      
      this.isGeneratingZip = true
      
      try {
        // Dynamically import JSZip
        const JSZipModule = await import('jszip')
        const JSZip = JSZipModule.default
        const zip = new JSZip()
        
        // Create a folder and add selected compressed images
        const folder = zip.folder('ousa_selected_images')
        
        // Process each image
        for (const result of this.selectedResults) {
          folder.file(result.filename, result.compressedBlob)
        }
        
        // Generate the ZIP file
        const content = await zip.generateAsync({ type: 'blob' })
        
        // Create download link
        const link = document.createElement('a')
        link.href = URL.createObjectURL(content)
        link.download = 'ousa_selected_images.zip'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Clean up
        URL.revokeObjectURL(link.href)
      } catch (error) {
        console.error('Error creating ZIP:', error)
        alert('Failed to create ZIP file. Please try downloading images individually.')
      }
      
      this.isGeneratingZip = false
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
      
      // Clear results
      this.compressedResults = []
      this.selectedResults = []
    }
  },
  beforeDestroy() {
    // Clean up all object URLs when component is destroyed
    this.previewUrls.forEach(url => URL.revokeObjectURL(url))
    this.compressedResults.forEach(result => URL.revokeObjectURL(result.compressedUrl))
  }
}
</script>

<style scoped>
.compressor {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #333;
}

.header {
  text-align: center;
  padding: 20px 0 30px;
  border-bottom: 1px solid #eaeaea;
  margin-bottom: 30px;
}

.title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 10px;
  color: #0496FF;
}

.description {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.hidden-input {
  display: none;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 30px;
  background-color: #f9f9f9;
}

.upload-area:hover {
  border-color: #0496FF;
  background-color: #f5f8ff;
}

.upload-area.has-files {
  border-style: solid;
  background-color: #f5f8ff;
  border-color: #0496FF;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #666;
}

.upload-text {
  font-size: 18px;
  margin-bottom: 8px;
  color: #333;
}

.upload-hint {
  font-size: 14px;
  color: #666;
}

.selected-files {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.file-item {
  position: relative;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.file-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.file-preview {
  width: 100%;
  height: 120px;
  object-fit: cover;
  object-position: center;
  background-color: #f0f0f0;
}

.file-details {
  padding: 8px 12px;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 4px;
  color: #333;
  word-break: break-word;
}

.file-size {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.remove-file-button {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.remove-file-button:hover {
  background-color: rgba(255, 0, 0, 0.7);
}

.file-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.add-more-button {
  background-color: #0496FF;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-more-button:hover {
  background-color: #0077CC;
}

.clear-button {
  background-color: transparent;
  color: #ff4a4a;
  border: 1px solid #ff4a4a;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-button:hover {
  background-color: #ff4a4a;
  color: white;
}

.controls {
  background-color: #f9f9f9;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.control-group {
  margin-bottom: 20px;
}

.control-group:last-child {
  margin-bottom: 0;
}

.control-label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.slider {
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  background: #e0e0e0;
  outline: none;
  border-radius: 4px;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #0496FF;
  cursor: pointer;
  border: none;
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #0496FF;
  cursor: pointer;
  border: none;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.format-options {
  display: flex;
  gap: 16px;
}

.format-option, .radio-option {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.format-option input, .radio-option input {
  margin-right: 6px;
}

.download-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 600px) {
  .download-options {
    grid-template-columns: 1fr;
  }
}

.text-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
}

.text-input:focus {
  border-color: #0496FF;
  outline: none;
}

.compress-button {
  width: 100%;
  background-color: #0496FF;
  color: white;
  border: none;
  padding: 12px 0;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
}

.compress-button:hover {
  background-color: #0077CC;
}

.compress-button:disabled {
  background-color: #b3d9ff;
  cursor: not-allowed;
}

.processing-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.results {
  margin-top: 40px;
}

.results-header {
  margin-bottom: 20px;
}

.results-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 12px;
  color: #333;
}

.results-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (min-width: 768px) {
  .results-summary {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.summary-text {
  margin: 0;
  color: #666;
}

.results-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.select-button {
  background-color: transparent;
  color: #0496FF;
  border: 1px solid #0496FF;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.select-button:hover {
  background-color: #e6f4ff;
}

.multi-download-actions {
  display: flex;
  gap: 8px;
}

.multi-download-button {
  background-color: #0496FF;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
}

.multi-download-button:hover {
  background-color: #0077CC;
}

.zip-button {
  background-color: #7d3c98;
}

.zip-button:hover {
  background-color: #6d2c88;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.result-item {
  display: flex;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  cursor: pointer;
}

.result-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.result-item.selected {
  background-color: #f0f7ff;
  border: 1px solid #0496FF;
}

.result-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
}

.result-checkbox input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

@media (max-width: 600px) {
  .result-item {
    flex-direction: column;
  }
  
  .result-checkbox {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 1;
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 4px;
    padding: 4px;
  }
  
  .result-details {
    flex-direction: column;
  }
  
  .result-actions {
    margin-top: 12px;
  }
}

.result-preview {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  position: relative;
}

@media (max-width: 600px) {
  .result-preview {
    width: 100%;
    height: 160px;
  }
}

.result-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.result-details {
  padding: 16px;
  flex-grow: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-info {
  flex-grow: 1;
}

.result-filename {
  font-weight: 600;
  font-size: 16px;
  margin: 0 0 8px;
  color: #333;
}

.result-stats {
  margin-bottom: 0;
}

.result-sizes {
  font-size: 14px;
  color: #666;
  margin: 0 0 4px;
}

.result-savings {
  font-size: 14px;
  color: #00a854;
  font-weight: 500;
  margin: 0;
}

.download-button {
  background-color: #0496FF;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
}

.download-button:hover {
  background-color: #0077CC;
}

.download-icon {
  margin-right: 6px;
  font-weight: bold;
}

.batch-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 40px;
}

.batch-actions .download-all-button:first-child {
  grid-column: 1 / 3;
}

@media (max-width: 500px) {
  .batch-actions {
    grid-template-columns: 1fr;
  }
  
  .batch-actions .download-all-button:first-child {
    grid-column: auto;
  }
}

.download-all-button {
  background-color: #00a854;
  color: white;
  border: none;
  padding: 14px 0;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
}

.download-all-button:hover {
  background-color: #008c46;
}

.download-all-button:disabled {
  background-color: #7fd4a4;
  cursor: not-allowed;
}

.all-files-button {
  background-color: #0496FF;
}

.all-files-button:hover {
  background-color: #0077CC;
}

.clear-results-button {
  background-color: transparent;
  color: #666;
  border: 1px solid #ccc;
  padding: 14px 0;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-results-button:hover {
  background-color: #f0f0f0;
}

.footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #eaeaea;
  text-align: center;
  color: #888;
  font-size: 12px;
}
</style>