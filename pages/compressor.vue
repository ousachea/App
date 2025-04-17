<template>
  <div class="compressor-container">
    <PageSwitcher/>
    <h1 class="title">Image Compressor</h1>

    <div 
      class="drop-zone" 
      @dragover.prevent 
      @drop="handleDrop" 
      :class="{'dragging': dragging}"
      @dragenter="dragging = true"
      @dragleave="dragging = false"
    >
      <p v-if="!imageSelected" class="drop-message">
        Drag and drop an image here or click to select one.
      </p>
      <input 
        type="file" 
        @change="compressImage" 
        accept="image/*" 
        class="file-input" 
        ref="fileInput"
        @click="resetDropZone"
      />
      <label class="file-label" v-if="!imageSelected">
        <span>Choose an image to compress</span>
      </label>
      <div v-if="imageSelected" class="image-preview">
        <img :src="imagePreview" alt="Image Preview" />
        <button @click="clearImage" class="clear-button">Clear</button>
      </div>
    </div>

    <div v-if="loading" class="loading-spinner">
      <span>Compressing...</span>
    </div>

    <div v-if="compressedImage" class="compressed-image-container">
      <h3>Compressed Image:</h3>
      <img :src="compressedImage" alt="Compressed Image" class="compressed-image" />
      <a :href="compressedImage" download="compressed-image.jpg">
        <button class="download-btn">Download Compressed Image</button>
      </a>

      <div v-if="fileSizes" class="file-size-info">
        <p>Original File Size: {{ fileSizes.originalSize }} KB</p>
        <p>Compressed File Size: {{ fileSizes.compressedSize }} KB</p>
        <p>Reduction: {{ reductionPercentage }}%</p>
      </div>
    </div>
  </div>
</template>

<script>
import imageCompression from 'browser-image-compression';
import PageSwitcher from '../components/PageSwitcher.vue';

export default {
  data() {
    return {
      compressedImage: null,
      imagePreview: null,
      loading: false,
      imageSelected: false,
      dragging: false,
      fileSizes: null, // To store original and compressed file sizes
      reductionPercentage: 0, // To store the reduction percentage
    };
  },
  methods: {
    async compressImage(event) {
      const file = event.target.files[0];
      if (!file) return;

      // Get original file size in KB
      const originalSize = (file.size / 1024).toFixed(2); // Size in KB
      this.fileSizes = { originalSize: originalSize };

      this.imagePreview = URL.createObjectURL(file);
      this.imageSelected = true;
      this.compressedImage = null;
      this.loading = true;

      try {
        const options = {
          maxSizeMB: 1, // Maximum size in MB
          maxWidthOrHeight: 1024, // Maximum width or height
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        
        // Get compressed file size in KB
        const compressedSize = (compressedFile.size / 1024).toFixed(2); // Size in KB
        this.fileSizes.compressedSize = compressedSize;

        // Calculate reduction percentage
        const reduction = (((originalSize - compressedSize) / originalSize) * 100).toFixed(2);
        this.reductionPercentage = reduction;

        const compressedImageUrl = URL.createObjectURL(compressedFile);
        this.compressedImage = compressedImageUrl;
      } catch (error) {
        console.error('Error compressing image:', error);
      } finally {
        this.loading = false;
      }
    },

    handleDrop(event) {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file) {
        this.compressImage({ target: { files: [file] } });
      }
      this.dragging = false;
    },

    clearImage() {
      this.imageSelected = false;
      this.imagePreview = null;
      this.compressedImage = null;
      this.fileSizes = null;
      this.reductionPercentage = 0;
      this.$refs.fileInput.value = '';
    },

    resetDropZone() {
      this.dragging = false;
    },
  },
};
</script>

<style scoped>
.compressor-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f8f8;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.title {
  text-align: center;
  font-size: 24px;
  margin-bottom: 20px;
}

.drop-zone {
  border: 2px dashed #007bff;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.3s, border-color 0.3s;
}

.drop-zone.dragging {
  background-color: #e9f7ff;
  border-color: #0056b3;
}

.file-input {
  display: none;
}

.file-label {
  display: inline-block;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.file-label:hover {
  background-color: #0056b3;
}

.drop-message {
  font-size: 16px;
  color: #007bff;
}

.image-preview {
  margin-top: 20px;
  text-align: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 200px;
  margin-bottom: 10px;
}

.clear-button {
  padding: 5px 10px;
  background-color: #ff5c5c;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.clear-button:hover {
  background-color: #e04e4e;
}

.loading-spinner {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #007bff;
}

.compressed-image-container {
  margin-top: 20px;
  text-align: center;
}

.compressed-image {
  max-width: 100%;
  max-height: 300px;
  margin-bottom: 20px;
}

.download-btn {
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.download-btn:hover {
  background-color: #218838;
}

.file-size-info {
  margin-top: 20px;
  font-size: 16px;
}

.file-size-info p {
  margin: 5px 0;
}

.file-size-info p strong {
  font-weight: bold;
}
</style>
