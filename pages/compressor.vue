<!-- pages/pdf-compressor.vue -->
<template>
  <div class="compressor-app">
    <header class="header">
      <h1>OUSA PDF Compressor</h1>
      <p class="subtitle">Compress PDF files while maintaining quality</p>
    </header>

    <!-- Upload Zone -->
    <section class="upload-section">
      <div
        class="drop-zone"
        :class="{ 'has-files': selectedFiles.length > 0, 'dragging': isDragging }"
        @click="triggerFileInput"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleFileDrop"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".pdf,application/pdf"
          class="hidden"
          multiple
          @change="handleFileChange"
        />
        
        <div v-if="!selectedFiles.length" class="upload-prompt">
          <div class="upload-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <p>Drag PDF files here or click to upload</p>
          <p class="file-info">Supports multiple PDF files</p>
        </div>
        
        <div v-else class="files-grid">
          <div 
            v-for="(file, index) in selectedFiles" 
            :key="file.id" 
            class="file-item pdf-item"
            :class="{ 'processed': file.processed }"
          >
            <button class="delete-btn" @click.stop="removeFile(index)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div class="file-preview pdf-preview">
              <div class="pdf-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div class="file-size">{{ formatFileSize(file.file.size) }}</div>
              <div v-if="isCompressing && !file.processed" class="progress-overlay">
                <div class="loader"></div>
              </div>
            </div>
            <div class="file-info">{{ truncateFilename(file.file.name) }}</div>
          </div>
          
          <div class="file-item add-more" @click.stop="triggerFileInput">
            <div class="add-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
          </div>
        </div>
        
        <button v-if="selectedFiles.length" class="btn btn-secondary clear-btn" @click.stop="clearFiles">
          Clear All
        </button>
      </div>
    </section>

    <!-- Controls Section -->
    <section v-if="selectedFiles.length > 0" class="controls-section">
      <div class="controls-container">
        <div class="control-group">
          <label>Compression Level: {{ compressionLevelName }}</label>
          <div class="slider-container">
            <input type="range" min="1" max="4" v-model.number="compressionLevel" class="slider" />
            <div class="quality-labels">
              <span>Maximum Compression</span>
              <span>Best Quality</span>
            </div>
          </div>
        </div>
        
        <div class="control-group">
          <label>DPI Quality: {{ dpiQuality }}</label>
          <div class="slider-container">
            <input type="range" min="72" max="300" step="24" v-model.number="dpiQuality" class="slider" />
            <div class="quality-labels">
              <span>72 DPI (Web)</span>
              <span>300 DPI (Print)</span>
            </div>
          </div>
        </div>
        
        <div class="compression-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="removeMetadata" />
            <span>Remove metadata</span>
          </label>
          
          <label class="checkbox-label">
            <input type="checkbox" v-model="optimizeImages" />
            <span>Optimize embedded images</span>
          </label>
        </div>
        
        <button 
          @click="compressAllPDFs" 
          class="btn btn-primary compress-btn"
          :disabled="isCompressing || !hasUnprocessedFiles"
        >
          <span v-if="isCompressing">
            <span class="loader-small"></span>
            Compressing {{ processedCount }}/{{ selectedFiles.length }}
          </span>
          <span v-else-if="!hasUnprocessedFiles">All Compressed</span>
          <span v-else>Compress PDFs</span>
        </button>
      </div>
    </section>

    <!-- Results Section -->
    <section v-if="compressedResults.length > 0" class="results-section">
      <div class="results-header">
        <div class="results-stats">
          <span class="stat">{{ compressedResults.length }} PDFs compressed</span>
          <span class="stat highlight">{{ totalSavingsPercent }}% saved ({{ formatFileSize(totalBytesSaved) }})</span>
        </div>
        
        <div class="results-actions">
          <button 
            class="btn btn-primary zip-btn" 
            @click="downloadAllAsZip" 
            :disabled="isGeneratingZip"
          >
            <span v-if="isGeneratingZip" class="loader-small"></span>
            <span v-else>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: -3px;">
                <path d="M4 22V4c0-1.1.9-2 2-2h12.01A1.99 1.99 0 0 1 20 4v18l-8-8l-8 8Z"/>
                <path d="m9.5 4 5 0"/>
                <path d="m9.5 8 5 0"/>
                <path d="m9.5 12 5 0"/>
              </svg>
              Download ZIP
            </span>
          </button>
          <button 
            class="btn btn-secondary download-all-btn" 
            @click="downloadAllFiles"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: -3px;">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download All
          </button>
          <button class="btn btn-secondary" @click="clearResults">
            Clear
          </button>
        </div>
      </div>
      
      <div class="results-grid">
        <div 
          v-for="result in compressedResults" 
          :key="result.id" 
          class="result-item pdf-result"
          :class="{ selected: isResultSelected(result) }"
          @click="toggleResultSelection(result)"
        >
          <div class="result-preview pdf-result-preview">
            <div class="pdf-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div class="select-indicator" v-if="isResultSelected(result)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div class="savings-badge" v-if="result.savings > 0">-{{ result.savings }}%</div>
          </div>
          
          <div class="result-details">
            <div class="result-name">{{ truncateFilename(result.filename) }}</div>
            <div class="result-size">{{ formatFileSize(result.compressedSize) }}</div>
            <button class="download-btn" @click.stop="downloadPDF(result)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="selectedResults.length > 0" class="selection-bar">
        <span>{{ selectedResults.length }} selected</span>
        <button class="btn btn-primary" @click="downloadSelectedPDFs">
          Download Selected
        </button>
      </div>
    </section>

    <footer class="footer">
      <p>© OUSA PDF Compressor - Client-side compression with no uploads</p>
    </footer>

    <!-- Toast Notifications -->
    <div class="toast-container">
      <transition-group name="toast">
        <div 
          v-for="toast in toasts" 
          :key="toast.id" 
          class="toast" 
          :class="toast.type"
        >
          {{ toast.message }}
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PDFCompressor',
  head() {
    return {
      title: 'OUSA PDF Compressor',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        {
          hid: 'description',
          name: 'description',
          content: 'Compress PDF files while maintaining quality with our client-side PDF compressor'
        }
      ],
      script: [
        {
          src: 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',
          defer: true
        }
      ]
    }
  },
  data() {
    return {
      selectedFiles: [],
      compressionLevel: 2, // 1-4 scale
      dpiQuality: 150,
      removeMetadata: true,
      optimizeImages: true,
      isCompressing: false,
      processedCount: 0,
      compressedResults: [],
      selectedResults: [],
      isGeneratingZip: false,
      fileIdCounter: 0,
      isDragging: false,
      toasts: []
    }
  },
  computed: {
    compressionLevelName() {
      const levels = {
        1: 'Maximum',
        2: 'High',
        3: 'Medium',
        4: 'Low'
      }
      return levels[this.compressionLevel] || 'Medium'
    },
    unprocessedFiles() {
      return this.selectedFiles.filter(fileObj => !fileObj.processed)
    },
    hasUnprocessedFiles() {
      return this.unprocessedFiles.length > 0
    },
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
      this.isDragging = false
      const newFiles = Array.from(event.target.files)
      this.addFiles(newFiles)
    },
    handleFileDrop(event) {
      this.isDragging = false
      const newFiles = Array.from(event.dataTransfer.files).filter(file => file.type === 'application/pdf')
      this.addFiles(newFiles)
    },
    addFiles(newFiles) {
      if (newFiles.length === 0) return

      const validFiles = newFiles.filter(file => file.type === 'application/pdf')
      
      if (validFiles.length !== newFiles.length) {
        this.showToast('Only PDF files are supported', 'error')
      }

      for (const file of validFiles) {
        this.selectedFiles.push({
          id: 'file-' + (++this.fileIdCounter),
          file: file,
          processed: false
        })
      }
      
      this.$refs.fileInput.value = ''
      
      if (validFiles.length > 0) {
        this.showToast(`Added ${validFiles.length} PDF${validFiles.length > 1 ? 's' : ''}`, 'success')
      }
    },
    removeFile(index) {
      this.selectedFiles.splice(index, 1)
    },
    clearFiles() {
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
    async compressAllPDFs() {
      if (!this.hasUnprocessedFiles || this.isCompressing) return
      
      // Check if PDF-lib is loaded
      if (typeof window.PDFLib === 'undefined') {
        this.showToast('PDF library not loaded. Please refresh the page.', 'error')
        return
      }
      
      try {
        this.isCompressing = true
        this.processedCount = 0
        
        const newResults = []
        const filesToProcess = this.unprocessedFiles
        
        for (let i = 0; i < filesToProcess.length; i++) {
          const fileObj = filesToProcess[i]
          const result = await this.compressPDF(fileObj)
          
          if (result) {
            newResults.push(result)
            this.processedCount++
            
            const index = this.selectedFiles.findIndex(f => f.id === fileObj.id)
            if (index !== -1) {
              setTimeout(() => {
                this.selectedFiles[index].processed = true
              }, 300)
            }
          }
        }
        
        this.compressedResults = [...this.compressedResults, ...newResults]
        
        if (newResults.length > 0) {
          this.showToast(`Successfully compressed ${newResults.length} PDF${newResults.length > 1 ? 's' : ''}!`, 'success')
        }
      } catch (error) {
        console.error('Error during compression:', error)
        this.showToast('Compression failed. Please try again.', 'error')
      } finally {
        this.isCompressing = false
      }
    },
    async compressPDF(fileObj) {
      try {
        const { PDFDocument, rgb } = window.PDFLib
        
        // Read the PDF file
        const arrayBuffer = await fileObj.file.arrayBuffer()
        const originalPdf = await PDFDocument.load(arrayBuffer)
        
        // Create a new PDF document for compression
        const compressedPdf = await PDFDocument.create()
        
        // Get compression settings
        const compressionSettings = this.getCompressionSettings()
        
        // Copy pages with compression
        const pageCount = originalPdf.getPageCount()
        
        for (let i = 0; i < pageCount; i++) {
          const [page] = await compressedPdf.copyPages(originalPdf, [i])
          const addedPage = compressedPdf.addPage(page)
          
          // Apply DPI-based scaling if needed
          if (this.dpiQuality < 150) {
            const { width, height } = addedPage.getSize()
            const scaleFactor = this.dpiQuality / 150
            addedPage.scaleContent(scaleFactor, scaleFactor)
            addedPage.setSize(width * scaleFactor, height * scaleFactor)
          }
        }
        
        // Set basic metadata or remove if requested
        if (this.removeMetadata) {
          // Remove metadata by not setting any
        } else {
          compressedPdf.setTitle(originalPdf.getTitle() || '')
          compressedPdf.setAuthor(originalPdf.getAuthor() || '')
          compressedPdf.setCreator('OUSA PDF Compressor')
          compressedPdf.setProducer('OUSA PDF Compressor')
        }
        
        // Save with compression options
        const pdfBytes = await compressedPdf.save({
          useObjectStreams: compressionSettings.useObjectStreams,
          addDefaultPage: false,
          objectsPerTick: compressionSettings.objectsPerTick,
          updateFieldAppearances: false
        })
        
        // Create compressed blob
        const compressedBlob = new Blob([pdfBytes], { type: 'application/pdf' })
        
        // If compression didn't reduce size significantly, try alternative method
        let finalBlob = compressedBlob
        const originalSize = fileObj.file.size
        let compressedSize = compressedBlob.size
        
        // If no significant compression achieved, try image-based compression
        if ((originalSize - compressedSize) / originalSize < 0.1) {
          try {
            const alternativeBlob = await this.compressPDFAlternative(arrayBuffer)
            if (alternativeBlob && alternativeBlob.size < compressedSize) {
              finalBlob = alternativeBlob
              compressedSize = alternativeBlob.size
            }
          } catch (altError) {
            console.warn('Alternative compression failed:', altError)
          }
        }
        
        const compressedUrl = URL.createObjectURL(finalBlob)
        
        // Calculate savings
        const savings = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
        
        // Generate filename with prefix
        const originalFilename = fileObj.file.name
        const baseName = originalFilename.replace('.pdf', '')
        const filename = `ousa-${baseName}.pdf`
        
        return {
          id: 'result-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          originalFileId: fileObj.id,
          originalFilename: fileObj.file.name,
          filename,
          originalSize,
          compressedSize,
          compressedUrl,
          compressedBlob: finalBlob,
          savings
        }
      } catch (error) {
        console.error('PDF compression failed:', error)
        this.showToast(`Failed to compress ${fileObj.file.name}`, 'error')
        return null
      }
    },
    
    async compressPDFAlternative(arrayBuffer) {
      try {
        // This method converts PDF pages to images and back to PDF for heavy compression
        const { PDFDocument } = window.PDFLib
        const originalPdf = await PDFDocument.load(arrayBuffer)
        const newPdf = await PDFDocument.create()
        
        // Load pdf.js for rendering
        if (!window.pdfjsLib) {
          await this.loadPdfJs()
        }
        
        const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer })
        const pdf = await loadingTask.promise
        
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum)
          
          // Create canvas for rendering
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          
          // Set viewport based on DPI quality
          const viewport = page.getViewport({ scale: this.dpiQuality / 150 })
          canvas.height = viewport.height
          canvas.width = viewport.width
          
          // Render page to canvas
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise
          
          // Convert canvas to image blob
          const imageBlob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/jpeg', this.compressionLevel / 4)
          })
          
          // Convert blob to array buffer
          const imageBytes = await imageBlob.arrayBuffer()
          
          // Embed image in new PDF
          const image = await newPdf.embedJpg(imageBytes)
          const pdfPage = newPdf.addPage([viewport.width, viewport.height])
          pdfPage.drawImage(image, {
            x: 0,
            y: 0,
            width: viewport.width,
            height: viewport.height
          })
        }
        
        const pdfBytes = await newPdf.save()
        return new Blob([pdfBytes], { type: 'application/pdf' })
        
      } catch (error) {
        console.error('Alternative compression failed:', error)
        return null
      }
    },
    
    async loadPdfJs() {
      return new Promise((resolve, reject) => {
        if (window.pdfjsLib) {
          resolve()
          return
        }
        
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
        script.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
          resolve()
        }
        script.onerror = reject
        document.head.appendChild(script)
      })
    },
    getCompressionSettings() {
      // Adjust compression settings based on level
      const settings = {
        1: { objectsPerTick: 50 },   // Maximum compression
        2: { objectsPerTick: 100 },  // High compression
        3: { objectsPerTick: 200 },  // Medium compression
        4: { objectsPerTick: 500 }   // Low compression
      }
      return settings[this.compressionLevel] || settings[2]
    },
    downloadAllFiles() {
      if (this.compressedResults.length === 0) return
      
      this.showToast(`Downloading ${this.compressedResults.length} files...`, 'info')
      
      this.compressedResults.forEach((result, index) => {
        setTimeout(() => {
          this.downloadPDF(result, false)
        }, index * 300)
      })
    },
    downloadPDF(result, showToast = true) {
      const link = document.createElement('a')
      link.href = result.compressedUrl
      link.download = result.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      if (showToast) {
        this.showToast('PDF downloaded!', 'success')
      }
    },
    async downloadAllAsZip() {
      if (this.compressedResults.length === 0 || this.isGeneratingZip) return
      
      this.isGeneratingZip = true
      this.showToast('Preparing ZIP file...', 'info')
      
      try {
        const JSZipModule = await import('jszip')
        const JSZip = JSZipModule.default
        const zip = new JSZip()
        
        const folder = zip.folder('ousa_compressed_pdfs')
        
        for (const result of this.compressedResults) {
          folder.file(result.filename, result.compressedBlob)
        }
        
        const content = await zip.generateAsync({ type: 'blob' })
        
        const link = document.createElement('a')
        link.href = URL.createObjectURL(content)
        link.download = 'ousa_compressed_pdfs.zip'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        URL.revokeObjectURL(link.href)
        
        this.showToast('ZIP file downloaded!', 'success')
      } catch (error) {
        console.error('Error creating ZIP:', error)
        this.showToast('Failed to create ZIP file', 'error')
      } finally {
        this.isGeneratingZip = false
      }
    },
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
    downloadSelectedPDFs() {
      if (this.selectedResults.length === 0) return
      
      this.showToast(`Downloading ${this.selectedResults.length} PDF${this.selectedResults.length > 1 ? 's' : ''}...`, 'info')
      
      this.selectedResults.forEach((result, index) => {
        setTimeout(() => {
          this.downloadPDF(result, false)
        }, index * 300)
      })
    },
    clearResults() {
      this.compressedResults.forEach(result => URL.revokeObjectURL(result.compressedUrl))
      
      this.selectedFiles.forEach(fileObj => {
        fileObj.processed = false
      })
      
      this.compressedResults = []
      this.selectedResults = []
      
      this.showToast('Results cleared', 'info')
    },
    showToast(message, type = 'info') {
      const id = Date.now()
      this.toasts.push({ id, message, type })
      
      setTimeout(() => {
        const index = this.toasts.findIndex(t => t.id === id)
        if (index !== -1) {
          this.toasts.splice(index, 1)
        }
      }, 3000)
    }
  },
  beforeDestroy() {
    this.compressedResults.forEach(result => URL.revokeObjectURL(result.compressedUrl))
  }
}
</script>

<style>
/* Import fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

/* Base styles for minimal design */
:root {
  --primary: #3b82f6;
  --primary-dark: #2563eb;
  --secondary: #64748b;
  --background: #f8fafc;
  --surface: #ffffff;
  --success: #10b981;
  --error: #ef4444;
  --info: #0ea5e9;
  --text: #1e293b;
  --text-light: #64748b;
  --border: #e2e8f0;
  --border-hover: #cbd5e1;
  --shadow: rgba(0, 0, 0, 0.1);
  --pdf-color: #dc2626;
}

*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  background-color: var(--background);
  color: var(--text);
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  line-height: 1.5;
}

.compressor-app {
  position: relative;
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
  min-height: 100vh;
}

.hidden {
  display: none;
}

/* Header */
.header {
  margin-bottom: 40px;
  text-align: center;
}

.header h1 {
  font-weight: 600;
  font-size: 28px;
  margin: 0 0 8px 0;
  color: var(--text);
}

.subtitle {
  color: var(--text-light);
  margin: 0;
  font-size: 16px;
}

/* Sections */
.upload-section,
.controls-section,
.results-section {
  margin-bottom: 40px;
  background-color: var(--surface);
  border-radius: 12px;
  box-shadow: 0 4px 6px var(--shadow);
  overflow: hidden;
}

/* Upload Zone */
.drop-zone {
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  min-height: 200px;
  border: 2px dashed var(--border);
  border-radius: 8px;
}

.drop-zone:hover {
  border-color: var(--border-hover);
}

.dragging {
  border-color: var(--primary);
  background-color: rgba(59, 130, 246, 0.05);
}

.upload-prompt {
  text-align: center;
}

.upload-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  color: var(--pdf-color);
}

.upload-prompt p {
  color: var(--text-light);
  margin: 8px 0 0;
}

.file-info {
  font-size: 14px;
  color: var(--text-light);
  margin-top: 4px;
}

/* PDF Specific Styles */
.pdf-item {
  border-color: var(--pdf-color);
}

.pdf-preview {
  background: linear-gradient(135deg, #fee2e2, #fef2f2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.pdf-icon {
  color: var(--pdf-color);
}

.file-size {
  font-size: 12px;
  color: var(--text-light);
  font-weight: 500;
}

.pdf-result-preview {
  background: linear-gradient(135deg, #fee2e2, #fef2f2);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* File Grid */
.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  width: 100%;
  margin-bottom: 16px;
}

.file-item {
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  transition: all 0.2s;
  height: 150px;
  display: flex;
  flex-direction: column;
}

.file-item:hover {
  box-shadow: 0 4px 8px var(--shadow);
}

.file-item.processed {
  border-color: var(--success);
}

.file-item.processed::after {
  content: "✓";
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: var(--success);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  z-index: 3;
  font-weight: bold;
}

.file-preview {
  height: 110px;
  position: relative;
  overflow: hidden;
}

.progress-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 3;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.2s;
}

.file-item:hover .delete-btn {
  opacity: 1;
  transform: scale(1);
}

.delete-btn:hover {
  background: var(--error);
}

/* Add More Button */
.add-more {
  border: 1px dashed var(--border);
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-more:hover {
  border-color: var(--primary);
}

.add-icon {
  color: var(--primary);
  font-size: 24px;
}

/* Controls */
.controls-container {
  padding: 32px;
}

.control-group {
  margin-bottom: 24px;
}

.control-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--text);
  font-weight: 500;
}

.slider-container {
  position: relative;
  padding: 8px 0;
}

.slider {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  background: var(--border);
  outline: none;
  border-radius: 3px;
  position: relative;
  z-index: 2;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
  box-shadow: 0 2px 4px var(--shadow);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
  box-shadow: 0 2px 4px var(--shadow);
  border: none;
}

.quality-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-light);
}

/* Compression Options */
.compression-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  background: var(--background);
  border-radius: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--primary);
}

/* Buttons */
.btn {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  border: none;
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 6px;
}

.btn-primary {
  background-color: var(--primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-dark);
}

.btn-secondary {
  background-color: var(--secondary);
  color: white;
}

.btn-secondary:hover {
  background-color: #4b5563;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.compress-btn {
  width: 100%;
  padding: 12px;
}

.clear-btn {
  margin-top: 16px;
}

/* Results Section */
.results-section {
  padding: 32px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.results-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat {
  font-size: 14px;
  color: var(--text);
}

.highlight {
  color: var(--success);
  font-weight: 500;
}

.results-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.result-item {
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  transition: all 0.2s;
  cursor: pointer;
  height: 170px;
  display: flex;
  flex-direction: column;
}

.result-item:hover {
  box-shadow: 0 4px 8px var(--shadow);
}

.result-item.selected {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary);
}

.result-preview {
  height: 110px;
  position: relative;
  overflow: hidden;
}

.select-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  z-index: 2;
}

.savings-badge {
  position: absolute;
  bottom: 0;
  left: 0;
  background: var(--success);
  color: white;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  z-index: 2;
}

.result-details {
  padding: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  background-color: var(--surface);
  flex-grow: 1;
}

.result-name {
  width: 100%;
  font-size: 14px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-size {
  font-size: 12px;
  color: var(--success);
}

.download-btn {
  width: 24px;
  height: 24px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.download-btn:hover {
  background-color: var(--primary-dark);
}

/* Selection Bar */
.download-all-btn {
  background-color: #64748b;
  color: white;
}

.download-all-btn:hover {
  background-color: #4b5563;
}

.selection-bar {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid var(--primary);
  border-radius: 6px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

/* Loaders */
.loader {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

.loader-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin-right: 8px;
  display: inline-block;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Toast Notifications */
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.toast {
  padding: 12px 16px;
  border-radius: 6px;
  box-shadow: 0 4px 6px var(--shadow);
  color: white;
  font-size: 14px;
  min-width: 200px;
  max-width: 300px;
}

.toast.success {
  background-color: var(--success);
}

.toast.error {
  background-color: var(--error);
}

.toast.info {
  background-color: var(--info);
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.3s;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(50px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

/* Footer */
.footer {
  text-align: center;
  margin-top: 40px;
  padding: 24px 0;
  color: var(--text-light);
  font-size: 14px;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .files-grid,
  .results-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }
  
  .header h1 {
    font-size: 24px;
  }
  
  .btn {
    padding: 8px 12px;
    font-size: 13px;
  }
  
  .results-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .results-actions {
    width: 100%;
  }

  .compression-options {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .compressor-app {
    padding: 16px;
  }
  
  .header h1 {
    font-size: 20px;
  }
  
  .files-grid,
  .results-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;
  }
  
  .selection-bar {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .selection-bar .btn {
    width: 100%;
  }
  
  .controls-container,
  .results-section {
    padding: 16px;
  }

  .results-actions {
    flex-direction: column;
  }

  .results-actions .btn {
    width: 100%;
    margin-bottom: 8px;
  }
}
</style>