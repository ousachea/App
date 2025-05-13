<!-- pages/minimal-compressor.vue -->
<template>
  <div class="compressor-app">
    <header class="header">
      <h1>OUSA Images Compressor</h1>
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
          accept="image/*"
          class="hidden"
          multiple
          @change="handleFileChange"
        />
        
        <div v-if="!selectedFiles.length" class="upload-prompt">
          <div class="upload-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p>Drag files here or click to upload</p>
        </div>
        
        <div v-else class="files-grid">
          <div 
            v-for="(file, index) in selectedFiles" 
            :key="file.id" 
            class="file-item"
            :class="{ 'processed': file.processed }"
          >
            <button class="delete-btn" @click.stop="removeFile(index)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div class="file-preview">
              <img :src="file.previewUrl" alt="Preview" />
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
          <label>Quality: {{ quality }}%</label>
          <div class="slider-container">
            <input type="range" min="1" max="100" v-model.number="quality" class="slider" />
            <div class="quality-labels">
              <span>Small File</span>
              <span>High Quality</span>
            </div>
          </div>
        </div>
        
        <div class="control-group">
          <label>Max Width: {{ maxWidth }}px</label>
          <div class="slider-container">
            <input type="range" min="100" max="4000" step="100" v-model.number="maxWidth" class="slider" />
          </div>
        </div>
        
        <div class="format-controls">
          <button 
            v-for="format in ['jpeg', 'png', 'webp']" 
            :key="format"
            class="format-btn" 
            :class="{ active: outputFormat === format }"
            @click="outputFormat = format"
          >
            {{ format.toUpperCase() }}
          </button>
        </div>
        
        <button 
          @click="compressAllImages" 
          class="btn btn-primary compress-btn"
          :disabled="isCompressing || !hasUnprocessedFiles"
        >
          <span v-if="isCompressing">
            <span class="loader-small"></span>
            {{ processedCount }}/{{ selectedFiles.length }}
          </span>
          <span v-else-if="!hasUnprocessedFiles">All Compressed</span>
          <span v-else>Compress</span>
        </button>
      </div>
    </section>

    <!-- Results Section -->
    <section v-if="compressedResults.length > 0" class="results-section">
      <div class="results-header">
        <div class="results-stats">
          <span class="stat">{{ compressedResults.length }} images compressed</span>
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
            Download Files
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
          class="result-item"
          :class="{ selected: isResultSelected(result) }"
          @click="toggleResultSelection(result)"
        >
          <div class="result-preview">
            <img :src="result.compressedUrl" alt="Compressed image" />
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
            <button class="download-btn" @click.stop="downloadImage(result)">
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
        <button class="btn btn-primary" @click="downloadSelectedImages">
          Download Selected
        </button>
      </div>
    </section>

    <footer class="footer">
      <p>© OUSA Images Compressor - Client-side compression with no uploads</p>
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
  name: 'MinimalImageCompressor',
  head() {
    return {
      title: 'OUSA Minimal Images Compressor',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        {
          hid: 'description',
          name: 'description',
          content: 'Compress your images with a clean, minimal design'
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
      fileIdCounter: 0,
      isDragging: false,
      toasts: []
    }
  },
  computed: {
    unprocessedFiles() {
      return this.selectedFiles.filter(fileObj => !fileObj.processed);
    },
    hasUnprocessedFiles() {
      return this.unprocessedFiles.length > 0;
    },
    totalOriginalSize() {
      return this.compressedResults.reduce((sum, result) => sum + result.originalSize, 0);
    },
    totalCompressedSize() {
      return this.compressedResults.reduce((sum, result) => sum + result.compressedSize, 0);
    },
    totalBytesSaved() {
      return this.totalOriginalSize - this.totalCompressedSize;
    },
    totalSavingsPercent() {
      if (this.totalOriginalSize === 0) return 0;
      const savings = (this.totalBytesSaved / this.totalOriginalSize) * 100;
      return Math.round(savings);
    }
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    handleFileChange(event) {
      this.isDragging = false;
      const newFiles = Array.from(event.target.files);
      this.addFiles(newFiles);
    },
    handleFileDrop(event) {
      this.isDragging = false;
      const newFiles = Array.from(event.dataTransfer.files).filter(file => file.type.startsWith('image/'));
      this.addFiles(newFiles);
    },
    addFiles(newFiles) {
      if (newFiles.length === 0) return;

      // Add new files to our array in a structured way
      for (const file of newFiles) {
        if (file.type.startsWith('image/')) {
          const previewUrl = URL.createObjectURL(file);
          this.selectedFiles.push({
            id: 'file-' + (++this.fileIdCounter),
            file: file,
            previewUrl: previewUrl,
            processed: false
          });
        }
      }
      
      // Reset form input to allow selecting the same file again
      this.$refs.fileInput.value = '';
      
      if (newFiles.length > 0) {
        this.showToast(`Added ${newFiles.length} image${newFiles.length > 1 ? 's' : ''}`, 'success');
      }
    },
    removeFile(index) {
      // Revoke the object URL to prevent memory leaks
      URL.revokeObjectURL(this.selectedFiles[index].previewUrl);
      
      // Remove the file from array
      this.selectedFiles.splice(index, 1);
    },
    clearFiles() {
      // Revoke all object URLs
      this.selectedFiles.forEach(fileObj => URL.revokeObjectURL(fileObj.previewUrl));
      
      // Clear array
      this.selectedFiles = [];
    },
    truncateFilename(filename) {
      if (filename.length <= 20) return filename;
      const extension = filename.split('.').pop();
      const name = filename.substring(0, filename.length - extension.length - 1);
      return name.substring(0, 16) + '...' + extension;
    },
    formatFileSize(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    },
    async compressAllImages() {
      if (!this.hasUnprocessedFiles || this.isCompressing) return;
      
      try {
        this.isCompressing = true;
        this.processedCount = 0;
        
        const newResults = [];
        const filesToProcess = this.unprocessedFiles;
        
        for (let i = 0; i < filesToProcess.length; i++) {
          const fileObj = filesToProcess[i];
          const result = await this.compressImage(fileObj);
          
          if (result) {
            newResults.push(result);
            this.processedCount++;
            
            // Mark as processed with animation delay
            const index = this.selectedFiles.findIndex(f => f.id === fileObj.id);
            if (index !== -1) {
              setTimeout(() => {
                this.selectedFiles[index].processed = true;
              }, 300); // Slight delay for visual effect
            }
          }
        }
        
        // Add new results to existing ones
        this.compressedResults = [...this.compressedResults, ...newResults];
        
        if (newResults.length > 0) {
          this.showToast(`Successfully compressed ${newResults.length} image${newResults.length > 1 ? 's' : ''}!`, 'success');
        }
      } catch (error) {
        console.error('Error during compression:', error);
        this.showToast('Compression failed. Please try again.', 'error');
      } finally {
        this.isCompressing = false;
      }
    },
    compressImage(fileObj) {
      return new Promise((resolve, reject) => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          // Set up proper error handling
          img.onerror = () => {
            console.error('Error loading image:', fileObj.file.name);
            resolve(null);
          };
          
          img.onload = () => {
            try {
              // Calculate new dimensions while maintaining aspect ratio
              let width = img.width;
              let height = img.height;
              
              if (width > this.maxWidth) {
                const ratio = this.maxWidth / width;
                width = this.maxWidth;
                height = height * ratio;
              }
              
              // Set canvas dimensions
              canvas.width = width;
              canvas.height = height;
              
              // Draw image on canvas
              ctx.drawImage(img, 0, 0, width, height);
              
              // Convert to desired format with quality setting
              const mimeType = `image/${this.outputFormat}`;
              const quality = this.quality / 100;
              
              canvas.toBlob((blob) => {
                if (!blob) {
                  console.error('Blob creation failed');
                  resolve(null);
                  return;
                }
                
                // Create URL for the compressed image
                const compressedUrl = URL.createObjectURL(blob);
                
                // Calculate savings
                const originalSize = fileObj.file.size;
                const compressedSize = blob.size;
                const savings = Math.round(((originalSize - compressedSize) / originalSize) * 100);
                
                // Generate filename with prefix
                const originalFilename = fileObj.file.name;
                const extension = this.outputFormat.toLowerCase();
                
                // Extract base name without extension
                const lastDotIndex = originalFilename.lastIndexOf('.');
                const baseName = originalFilename.substring(0, lastDotIndex > 0 ? lastDotIndex : originalFilename.length);
                
                // Always apply "ousa-" prefix (hardcoded)
                const filename = `ousa-${baseName}.${extension}`;
                
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
                };
                
                // Clean up
                URL.revokeObjectURL(img.src);
                resolve(result);
              }, mimeType, quality);
            } catch (error) {
              console.error('Error processing image:', error);
              resolve(null);
            }
          };
          
          // Start loading the image
          img.src = fileObj.previewUrl;
        } catch (error) {
          console.error('Compression failed:', error);
          reject(error);
        }
      });
    },
    downloadAllFiles() {
      if (this.compressedResults.length === 0) return;
      
      this.showToast(`Downloading ${this.compressedResults.length} files...`, 'info');
      
      // We'll use a staggered approach to avoid browser limitations
      this.compressedResults.forEach((result, index) => {
        setTimeout(() => {
          this.downloadImage(result, false); // Pass false to prevent individual toasts
        }, index * 300); // 300ms delay between downloads to avoid browser throttling
      });
    },
    downloadImage(result, showToast = true) {
      const link = document.createElement('a');
      link.href = result.compressedUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (showToast) {
        this.showToast('Image downloaded!', 'success');
      }
    },
    downloadAllImages() {
      // Create a small delay between downloads to avoid browser limitations
      this.compressedResults.forEach((result, index) => {
        setTimeout(() => {
          this.downloadImage(result);
        }, index * 100); // 100ms delay between downloads
      });
    },
    async downloadAllAsZip() {
      if (this.compressedResults.length === 0 || this.isGeneratingZip) return;
      
      this.isGeneratingZip = true;
      this.showToast('Preparing ZIP file...', 'info');
      
      try {
        // Dynamically import JSZip
        const JSZipModule = await import('jszip');
        const JSZip = JSZipModule.default;
        const zip = new JSZip();
        
        // Create a folder and add all compressed images
        const folder = zip.folder('ousa_compressed_images');
        
        // Process each image
        for (const result of this.compressedResults) {
          folder.file(result.filename, result.compressedBlob);
        }
        
        // Generate the ZIP file
        const content = await zip.generateAsync({ type: 'blob' });
        
        // Create download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'ousa_compressed_images.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(link.href);
        
        this.showToast('ZIP file downloaded!', 'success');
      } catch (error) {
        console.error('Error creating ZIP:', error);
        this.showToast('Failed to create ZIP file', 'error');
      } finally {
        this.isGeneratingZip = false;
      }
    },
    // Selection methods
    toggleResultSelection(result) {
      const index = this.selectedResults.findIndex(r => r.id === result.id);
      if (index === -1) {
        this.selectedResults.push(result);
      } else {
        this.selectedResults.splice(index, 1);
      }
    },
    isResultSelected(result) {
      return this.selectedResults.some(r => r.id === result.id);
    },
    downloadSelectedImages() {
      if (this.selectedResults.length === 0) return;
      
      this.showToast(`Downloading ${this.selectedResults.length} image${this.selectedResults.length > 1 ? 's' : ''}...`, 'info');
      
      // Create a small delay between downloads to avoid browser limitations
      this.selectedResults.forEach((result, index) => {
        setTimeout(() => {
          this.downloadImage(result, false); // Pass false to prevent individual toasts
        }, index * 300); // 300ms delay between downloads
      });
    },
    clearResults() {
      // Revoke all object URLs
      this.compressedResults.forEach(result => URL.revokeObjectURL(result.compressedUrl));
      
      // Reset processed status for all files
      this.selectedFiles.forEach(fileObj => {
        fileObj.processed = false;
      });
      
      // Clear results
      this.compressedResults = [];
      this.selectedResults = [];
      
      this.showToast('Results cleared', 'info');
    },
    showToast(message, type = 'info') {
      const id = Date.now();
      this.toasts.push({ id, message, type });
      
      setTimeout(() => {
        const index = this.toasts.findIndex(t => t.id === id);
        if (index !== -1) {
          this.toasts.splice(index, 1);
        }
      }, 3000);
    }
  },
  beforeDestroy() {
    // Clean up all object URLs when component is destroyed
    this.selectedFiles.forEach(fileObj => URL.revokeObjectURL(fileObj.previewUrl));
    this.compressedResults.forEach(result => URL.revokeObjectURL(result.compressedUrl));
  }
};
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
  margin: 0;
  color: var(--text);
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
  color: var(--primary);
}

.upload-prompt p {
  color: var(--text-light);
  margin: 8px 0 0;
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

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
  display: block;
}

.file-item:hover .file-preview img {
  transform: scale(1.05);
}

.file-info {
  padding: 8px;
  text-align: center;
  background-color: var(--surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
  font-size: 14px;
  color: var(--text);
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
}

.quality-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-light);
}

/* Format Buttons */
.format-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.format-btn {
  padding: 8px 12px;
  background-color: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  transition: all 0.2s;
  border-radius: 4px;
}

.format-btn:hover {
  border-color: var(--border-hover);
}

.format-btn.active {
  background-color: var(--primary);
  color: white;
  border-color: var(--primary);
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

.result-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
  display: block;
}

.result-item:hover .result-preview img {
  transform: scale(1.05);
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

.loader-small {
  width: 16px;
  height: 16px;
  border-width: 2px;
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
  
  .format-controls {
    flex-direction: column;
  }
  
  .format-btn {
    width: 100%;
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
}
</style>