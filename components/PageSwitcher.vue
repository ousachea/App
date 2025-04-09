<template>
  <div class="image-compressor">
    <h1>Image Compressor</h1>
    
    <input type="file" ref="fileInput" @change="handleFileUpload" multiple />
    
    <div v-if="compressedImages.length">
      <h3>Compressed Images:</h3>
      <div class="image-gallery">
        <div v-for="(image, index) in compressedImages" :key="index">
          <img :src="image" alt="Compressed Image" />
        </div>
      </div>
    </div>
    
    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
  </div>
</template>

<script>
import imageCompression from 'browser-image-compression';

export default {
  data() {
    return {
      compressedImages: [],
      errorMessage: '',
    };
  },
  methods: {
    async handleFileUpload(event) {
      this.compressedImages = [];
      this.errorMessage = '';
      const files = event.target.files;
      
      if (files.length === 0) {
        this.errorMessage = 'Please select an image.';
        return;
      }

      for (const file of files) {
        try {
          const compressedFile = await this.compressImage(file);
          const imageUrl = URL.createObjectURL(compressedFile);
          this.compressedImages.push(imageUrl);
        } catch (error) {
          this.errorMessage = 'Error compressing image.';
        }
      }
    },
    
    async compressImage(file) {
      const options = {
        maxSizeMB: 1, // 1MB
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      return await imageCompression(file, options);
    },
  },
};
</script>

<style scoped>
.image-compressor {
  text-align: center;
}

.image-gallery {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.image-gallery img {
  max-width: 200px;
  margin: 10px;
}

.error {
  color: red;
}
</style>
