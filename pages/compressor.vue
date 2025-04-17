<template>
  <div class="compressor-container">
    <PageSwitcher />
    <h1 class="title">Image Compressor</h1>
    
    <div 
      class="drop-zone" 
      @dragover.prevent 
      @drop="handleDrop" 
      :class="{'dragging': dragging, 'has-image': imageSelected}"
      @dragenter="dragging = true"
      @dragleave="dragging = false"
    >
      <div v-if="!imageSelected" class="upload-section">
        <div class="icon-container">
          <svg class="upload-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>
        <p class="drop-message">Drag and drop an image here</p>
        <p class="drop-message-secondary">or</p>
        <label class="file-label">
          Browse Files
          <input 
            type="file" 
            @change="compressImage" 
            accept="image/*" 
            class="file-input" 
            ref="fileInput"
            @click="resetDropZone"
          />
        </label>
        <p class="file-type-hint">Supports: JPG, PNG, GIF, WebP</p>
      </div>
      
      <div v-if="imageSelected" class="image-preview">
        <img :src="imagePreview" alt="Image Preview" />
        <div class="preview-controls">
          <button @click="clearImage" class="control-button remove-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Remove
          </button>
        </div>
      </div>
    </div>

    <div v-if="imageSelected && !compressedImage && !loading" class="compression-options">
      <h3 class="options-title">Compression Options</h3>
      <div class="option-group">
        <label for="quality-slider">Quality: {{ quality }}%</label>
        <input 
          type="range" 
          id="quality-slider" 
          v-model="quality" 
          min="30" 
          max="90" 
          class="quality-slider"
        />
      </div>
      <div class="option-group">
        <label for="max-size">Max Size:</label>
        <select id="max-size" v-model="maxSizeMB" class="select-option">
          <option value="0.5">0.5 MB</option>
          <option value="1">1 MB</option>
          <option value="2">2 MB</option>
        </select>
      </div>
      <button @click="performCompression" class="compress-button">
        Compress Image
      </button>
    </div>

    <div v-if="loading" class="loading-spinner">
      <div class="spinner"></div>
      <span>Compressing your image...</span>
    </div>

    <div v-if="compressedImage" class="compressed-image-container">
      <h3 class="result-title">Compression Result</h3>
      
      <div class="result-stats">
        <div class="stat-item">
          <span class="stat-label">Original</span>
          <span class="stat-value">{{ fileSizes.originalSize }} KB</span>
        </div>
        <div class="stat-arrow">→</div>
        <div class="stat-item">
          <span class="stat-label">Compressed</span>
          <span class="stat-value">{{ fileSizes.compressedSize }} KB</span>
        </div>
        <div class="stat-reduction">
          <span class="reduction-badge">{{ reductionPercentage }}% smaller</span>
        </div>
      </div>
      
      <div class="result-image">
        <img :src="compressedImage" alt="Compressed Image" class="compressed-image" />
      </div>
      
      <div class="action-buttons">
        <a :href="compressedImage" download="compressed-image.jpg" class="download-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download
        </a>
        <button @click="clearImage" class="restart-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 2v6h6"></path>
            <path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path>
            <path d="M21 22v-6h-6"></path>
            <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path>
          </svg>
          Start Over
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import imageCompression from 'browser-image-compression';
import PageSwitcher from '../components/PageSwitcher.vue';

export default {
  components: {
    PageSwitcher
  },
  data() {
    return {
      compressedImage: null,
      imagePreview: null,
      loading: false,
      imageSelected: false,
      dragging: false,
      fileSizes: null,
      reductionPercentage: 0,
      quality: 75,
      maxSizeMB: 1,
      selectedFile: null // Store the selected file here
    };
  },
  methods: {
    async compressImage(event) {
      const file = event.target.files[0];
      if (!file) return;

      // Store the file reference
      this.selectedFile = file;

      // Get original file size in KB
      const originalSize = (file.size / 1024).toFixed(2);
      this.fileSizes = { originalSize: originalSize };

      this.imagePreview = URL.createObjectURL(file);
      this.imageSelected = true;
      this.compressedImage = null;
    },

    async performCompression() {
      if (!this.imageSelected || !this.selectedFile) return;
      
      this.loading = true;
      
      try {
        const options = {
          maxSizeMB: parseFloat(this.maxSizeMB),
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          quality: this.quality / 100
        };
        
        const compressedFile = await imageCompression(this.selectedFile, options);
        
        // Get compressed file size in KB
        const compressedSize = (compressedFile.size / 1024).toFixed(2);
        this.fileSizes.compressedSize = compressedSize;

        // Calculate reduction percentage
        const reduction = (((this.fileSizes.originalSize - compressedSize) / this.fileSizes.originalSize) * 100).toFixed(1);
        this.reductionPercentage = reduction;

        const compressedImageUrl = URL.createObjectURL(compressedFile);
        this.compressedImage = compressedImageUrl;
      } catch (error) {
        console.error('Error compressing image:', error);
        alert('Failed to compress image. Please try again with a different image.');
      } finally {
        this.loading = false;
      }
    },

    handleDrop(event) {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        this.compressImage({ target: { files: [file] } });
      } else {
        alert('Please drop an image file.');
      }
      this.dragging = false;
    },

    clearImage() {
      this.imageSelected = false;
      this.imagePreview = null;
      this.compressedImage = null;
      this.fileSizes = null;
      this.reductionPercentage = 0;
      this.selectedFile = null;
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
      this.quality = 75;
      this.maxSizeMB = 1;
    },

    resetDropZone() {
      this.dragging = false;
    },
  },
};
</script>

<style scoped>
.compressor-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.title {
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 32px;
  color: #1a202c;
}

.drop-zone {
  border: 2px dashed #cbd5e0;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f7fafc;
}

.drop-zone.dragging {
  background-color: #e6f7ff;
  border-color: #40a9ff;
}

.drop-zone.has-image {
  background-color: #fff;
  border-style: solid;
  border-color: #e2e8f0;
}

.upload-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.icon-container {
  margin-bottom: 16px;
}

.upload-icon {
  width: 64px;
  height: 64px;
  color: #4299e1;
}

.drop-message {
  font-size: 18px;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 8px;
}

.drop-message-secondary {
  font-size: 16px;
  color: #718096;
  margin-bottom: 16px;
}

.file-input {
  display: none;
}

.file-label {
  display: inline-block;
  padding: 12px 24px;
  background-color: #4299e1;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background-color 0.3s;
  margin-bottom: 16px;
}

.file-label:hover {
  background-color: #3182ce;
}

.file-type-hint {
  font-size: 14px;
  color: #a0aec0;
}

.image-preview {
  position: relative;
}

.image-preview img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview-controls {
  margin-top: 16px;
}

.control-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  background-color: transparent;
}

.control-button svg {
  margin-right: 6px;
}

.remove-button {
  color: #e53e3e;
  background-color: #fff5f5;
}

.remove-button:hover {
  background-color: #fed7d7;
}

.compression-options {
  margin-top: 32px;
  padding: 24px;
  background-color: #f7fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.options-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #2d3748;
}

.option-group {
  margin-bottom: 16px;
}

.option-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 16px;
  color: #4a5568;
}

.quality-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e2e8f0;
  outline: none;
  -webkit-appearance: none;
}

.quality-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #4299e1;
  cursor: pointer;
}

.quality-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #4299e1;
  cursor: pointer;
  border: none;
}

.select-option {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  font-size: 16px;
  color: #4a5568;
  background-color: white;
}

.compress-button {
  display: block;
  width: 100%;
  padding: 12px;
  margin-top: 24px;
  background-color: #4299e1;
  color: white;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.compress-button:hover {
  background-color: #3182ce;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 32px 0;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(66, 153, 225, 0.2);
  border-radius: 50%;
  border-top-color: #4299e1;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-spinner span {
  font-size: 16px;
  font-weight: 500;
  color: #4a5568;
}

.compressed-image-container {
  margin-top: 32px;
  padding: 24px;
  background-color: #f7fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.result-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #2d3748;
}

.result-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 14px;
  color: #718096;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
}

.stat-arrow {
  margin: 0 16px;
  font-size: 20px;
  color: #a0aec0;
}

.stat-reduction {
  margin-left: 24px;
}

.reduction-badge {
  display: inline-block;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  background-color: #48bb78;
  border-radius: 16px;
}

.result-image {
  text-align: center;
  margin-bottom: 24px;
}

.compressed-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.download-btn, .restart-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.download-btn {
  background-color: #48bb78;
  color: white;
  border: none;
}

.download-btn:hover {
  background-color: #38a169;
}

.restart-btn {
  background-color: #f7fafc;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

.restart-btn:hover {
  background-color: #edf2f7;
}

.download-btn svg, .restart-btn svg {
  margin-right: 8px;
}
</style>