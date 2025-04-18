<template>
  <div class="compressor-container" :class="{ 'dark-mode': isDarkMode }">
    <PageSwitcher />
    <h1 class="title">Image Compressor</h1>
    
    <!-- Drop Zone -->
    <div 
      v-if="!imageSelected"
      class="drop-zone" 
      @dragover.prevent 
      @drop="handleDrop" 
      :class="{
        'dragging': dragging, 
        'active-drop': activeDropArea
      }"
      @dragenter="activateDropArea"
      @dragleave="deactivateDropArea"
      @click="$refs.fileInput.click()"
      tabindex="0"
      @keydown="handleKeyDown"
      role="button"
      aria-label="Upload image area. Press Enter to browse files."
    >
      <!-- Animated Background -->
      <div class="animated-background">
        <div class="dot" v-for="n in 12" :key="n"></div>
      </div>
      
      <div class="upload-section">
        <div class="icon-container" :class="{'bounce-animation': dragging}">
          <svg class="upload-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>
        <p class="drop-message">Drag and drop images here</p>
        <p class="drop-message-secondary">or</p>
        <button class="file-button">Browse Files</button>
        <p class="file-type-hint">Supports: JPG, PNG, GIF, WebP, AVIF, HEIC</p>
        <p class="batch-hint">Tip: You can select multiple images for batch compression</p>
      </div>
    </div>
    
    <!-- Image Preview and Options -->
    <div v-if="imageSelected && !compressedImage && !loading" class="image-container">
      <div class="selected-images-preview">
        <h3 class="preview-title">Selected Images ({{ selectedFiles.length }})</h3>
        <div class="image-thumbnails">
          <div v-for="(file, index) in selectedFiles" :key="index" class="image-thumbnail">
            <img :src="getThumbnailUrl(file)" alt="Thumbnail" />
            <div class="thumbnail-info">
              <span class="thumbnail-name">{{ truncateFilename(file.name, 15) }}</span>
              <span class="thumbnail-size">{{ formatSize(file.size) }}</span>
            </div>
            <button class="remove-thumbnail" @click.stop="removeFile(index)">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="add-more-thumbnail" @click="$refs.fileInput.click()">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add More</span>
          </div>
        </div>
      </div>
      
      <div class="compression-options">
        <h3 class="options-title">Compression Settings</h3>
        
        <div class="option-group">
          <div class="slider-header">
            <label for="quality-slider">Quality: {{ quality }}%</label>
            <span class="estimated-size" v-if="estimatedSize">Est. Size: {{ formatSize(estimatedSize * 1024) }}</span>
          </div>
          <input 
            type="range" 
            id="quality-slider" 
            v-model="quality" 
            min="30" 
            max="90" 
            class="quality-slider"
            @input="updateEstimatedSize"
          />
          <div class="slider-labels">
            <span>Lower Quality</span>
            <span>Higher Quality</span>
          </div>
        </div>
        
        <div class="option-group">
          <label for="max-size">Max Size:</label>
          <select id="max-size" v-model="maxSizeMB" class="select-option" @change="updateEstimatedSize">
            <option value="0.25">0.25 MB</option>
            <option value="0.5">0.5 MB</option>
            <option value="1">1 MB</option>
            <option value="2">2 MB</option>
            <option value="5">5 MB</option>
          </select>
        </div>
        
        <div class="option-group">
          <label class="dimension-label">Resize Image (optional):</label>
          <div class="dimension-inputs">
            <div class="dimension-input-group">
              <input 
                type="number" 
                placeholder="Width" 
                v-model="resizeDimensions.width" 
                class="dimension-input" 
                min="0" 
                @input="handleDimensionChange('width')"
              />
              <span class="dimension-unit">px</span>
            </div>
            <span class="dimension-separator">×</span>
            <div class="dimension-input-group">
              <input 
                type="number" 
                placeholder="Height" 
                v-model="resizeDimensions.height" 
                class="dimension-input" 
                min="0" 
                @input="handleDimensionChange('height')"
              />
              <span class="dimension-unit">px</span>
            </div>
          </div>
          <label class="checkbox-container">
            <input type="checkbox" v-model="resizeDimensions.maintainAspect" @change="updateDimensionsWithAspect" />
            <span class="checkbox-text">Maintain aspect ratio</span>
          </label>
        </div>
        
        <div class="option-group">
          <label class="checkbox-container">
            <input type="checkbox" v-model="preserveExif" />
            <span class="checkbox-text">Preserve photo metadata (EXIF)</span>
          </label>
        </div>
        
        <div class="action-buttons">
          <button @click="clearImage" class="secondary-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Cancel
          </button>
          <button @click="performCompression" class="primary-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
              <path d="M12 12v9"></path>
              <path d="m8 17 4 4 4-4"></path>
            </svg>
            Compress Images
          </button>
        </div>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <span class="processing-text">Compressing your image<span class="dot-animation">...</span></span>
      </div>
      
      <div class="progress-container">
        <div class="progress-bar-container">
          <div class="progress-bar" :style="{ width: `${compressionProgress}%` }"></div>
        </div>
        <div class="progress-text">
          <span>{{ compressionProgress }}%</span>
          <span v-if="selectedFiles.length > 1">
            Processing image {{ currentFileIndex + 1 }} of {{ selectedFiles.length }}
          </span>
        </div>
      </div>
      
      <button @click="cancelCompression" class="cancel-button">
        Cancel
      </button>
    </div>
    
    <!-- Results -->
    <div v-if="compressedImage" class="results-container">
      <h3 class="result-title">Compression Complete</h3>
      
      <div class="result-stats">
        <div class="stat-item">
          <span class="stat-label">Original</span>
          <span class="stat-value">{{ formatSize(originalSizeTotal) }}</span>
        </div>
        <div class="stat-arrow">→</div>
        <div class="stat-item">
          <span class="stat-label">Compressed</span>
          <span class="stat-value">{{ formatSize(compressedSizeTotal) }}</span>
        </div>
        <div class="stat-reduction">
          <span class="reduction-badge">{{ reductionPercentage }}% smaller</span>
        </div>
      </div>
      
      <div class="compressed-files">
        <div v-for="(file, index) in compressedFiles" :key="index" class="compressed-file-item">
          <div class="file-preview">
            <img :src="file.url" alt="Compressed Image" />
          </div>
          
          <div class="file-info">
            <div class="file-name">{{ file.name }}</div>
            <div class="file-size-reduction">
              <span>{{ formatSize(file.originalSize) }}</span>
              <span class="arrow-icon">→</span>
              <span>{{ formatSize(file.compressedSize) }}</span>
              <span class="size-badge">-{{ file.reductionPercentage }}%</span>
            </div>
          </div>
          
          <button @click="downloadFile(index)" class="download-file-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="result-actions">
        <button @click="clearImage" class="secondary-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 2v6h6"></path>
            <path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path>
          </svg>
          Start Over
        </button>
        <button @click="downloadAllFiles" class="primary-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download All
        </button>
      </div>
    </div>
    
    <!-- Error Notification -->
    <div v-if="errorMessage" class="error-notification">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div class="error-message">{{ errorMessage }}</div>
      <button class="error-close" @click="errorMessage = ''">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    
    <!-- Success Notification -->
    <div v-if="successMessage" class="success-notification">
      <div class="success-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      <div class="success-message">{{ successMessage }}</div>
      <button class="success-close" @click="successMessage = ''">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    
    <!-- Theme toggle -->
    <button @click="toggleDarkMode" class="theme-toggle" aria-label="Toggle dark mode">
      <svg v-if="isDarkMode" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    </button>
    
    <!-- Hidden file input -->
    <input 
      type="file" 
      @change="handleFileSelected" 
      accept="image/*" 
      multiple
      class="file-input" 
      ref="fileInput"
    />
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import PageSwitcher from '../components/PageSwitcher.vue';

// Lazy-load the image compression library
const getImageCompression = () => import('browser-image-compression').then(module => module.default);

export default defineComponent({
  name: 'ImageCompressor',
  
  components: {
    PageSwitcher
  },
  
  setup() {
    // UI state
    const isDarkMode = ref(false);
    const dragging = ref(false);
    const activeDropArea = ref(false);
    const errorMessage = ref('');
    const successMessage = ref('');
    
    // Process state
    const imageSelected = ref(false);
    const loading = ref(false);
    const compressionProgress = ref(0);
    const currentFileIndex = ref(0);
    const compressionCancelled = ref(false);
    
    // Image data
    const selectedFiles = ref([]);
    const compressedFiles = ref([]);
    const compressedImage = ref(null);
    const thumbnailUrls = ref({});
    
    // Compression options
    const quality = ref(75);
    const maxSizeMB = ref(1);
    const preserveExif = ref(false);
    const resizeDimensions = ref({
      width: 0,
      height: 0,
      maintainAspect: true
    });
    const estimatedSize = ref(null);
    const averageAspectRatio = ref(1);
    
    // Computed properties
    const originalSizeTotal = computed(() => {
      return selectedFiles.value.reduce((total, file) => total + file.size, 0);
    });
    
    const compressedSizeTotal = computed(() => {
      return compressedFiles.value.reduce((total, file) => total + file.compressedSize, 0);
    });
    
    const reductionPercentage = computed(() => {
      if (!compressedFiles.value.length) return 0;
      
      const reduction = ((originalSizeTotal.value - compressedSizeTotal.value) / originalSizeTotal.value) * 100;
      return reduction.toFixed(1);
    });
    
    // Format file size helper
    const formatSize = (bytes) => {
      if (bytes < 1024) return bytes + ' B';
      else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      else return (bytes / 1048576).toFixed(2) + ' MB';
    };
    
    // Truncate filename helper
    const truncateFilename = (filename, maxLength) => {
      if (filename.length <= maxLength) return filename;
      
      const extension = filename.split('.').pop();
      const name = filename.substring(0, filename.lastIndexOf('.'));
      
      // Calculate how many characters we can keep from the name
      const availableChars = maxLength - extension.length - 3; // 3 for '...'
      
      if (availableChars <= 0) return '...' + extension;
      
      return name.substring(0, availableChars) + '...' + extension;
    };
    
    // Get thumbnail URL for preview
    const getThumbnailUrl = (file) => {
      if (thumbnailUrls.value[file.name]) {
        return thumbnailUrls.value[file.name];
      }
      
      // Create thumbnail
      const url = URL.createObjectURL(file);
      thumbnailUrls.value[file.name] = url;
      return url;
    };
    
    // Handle dimension changes for resize
    const handleDimensionChange = (dimension) => {
      // Skip if aspect ratio not maintained
      if (!resizeDimensions.value.maintainAspect) {
        updateEstimatedSize();
        return;
      }
      
      // Update other dimension based on aspect ratio
      if (dimension === 'width' && resizeDimensions.value.width > 0) {
        resizeDimensions.value.height = Math.round(resizeDimensions.value.width / averageAspectRatio.value);
      } else if (dimension === 'height' && resizeDimensions.value.height > 0) {
        resizeDimensions.value.width = Math.round(resizeDimensions.value.height * averageAspectRatio.value);
      }
      
      updateEstimatedSize();
    };
    
    // Update dimensions when toggling aspect ratio
    const updateDimensionsWithAspect = () => {
      if (resizeDimensions.value.maintainAspect && resizeDimensions.value.width > 0) {
        resizeDimensions.value.height = Math.round(resizeDimensions.value.width / averageAspectRatio.value);
      }
      updateEstimatedSize();
    };
    
    // Handle file selection
    const handleFileSelected = async (event) => {
      // Get files from event
      const files = event.dataTransfer ? 
        Array.from(event.dataTransfer.files) : 
        Array.from(event.target.files);
      
      // Filter for image files
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      
      if (imageFiles.length === 0) {
        showError('Please select valid image files');
        return;
      }
      
      // Add to existing selection or create new
      if (imageSelected.value) {
        selectedFiles.value = [...selectedFiles.value, ...imageFiles];
      } else {
        selectedFiles.value = imageFiles;
        imageSelected.value = true;
      }
      
      // Reset compression results
      compressedImage.value = null;
      compressedFiles.value = [];
      
      // Calculate average aspect ratio for the images
      let totalRatio = 0;
      
      for (const file of imageFiles) {
        const dimensions = await getImageDimensions(file);
        file.dimensions = dimensions;
        totalRatio += dimensions.ratio;
      }
      
      averageAspectRatio.value = totalRatio / imageFiles.length || 1;
      
      // Update size estimate
      updateEstimatedSize();
    };
    
    // Get image dimensions for a file
    const getImageDimensions = (file) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(img.src);
          resolve({
            width: img.width,
            height: img.height,
            ratio: img.width / img.height
          });
        };
        img.onerror = () => {
          URL.revokeObjectURL(img.src);
          resolve({ width: 0, height: 0, ratio: 1 });
        };
        img.src = URL.createObjectURL(file);
      });
    };
    
    // Update estimated output size
    const updateEstimatedSize = () => {
      if (selectedFiles.value.length === 0) {
        estimatedSize.value = null;
        return;
      }
      
      const totalOriginalSize = selectedFiles.value.reduce((total, file) => total + file.size, 0);
      
      // Apply quality factor (non-linear)
      const qualityFactor = Math.pow(quality.value / 100, 1.5);
      let estimatedSizeBytes = totalOriginalSize * qualityFactor;
      
      // Apply resize factor if dimensions are set
      if (resizeDimensions.value.width > 0 && resizeDimensions.value.height > 0) {
        const originalArea = selectedFiles.value.reduce((sum, file) => {
          const width = file.dimensions?.width || 1200;
          const height = file.dimensions?.height || 800;
          return sum + (width * height);
        }, 0) / selectedFiles.value.length;
        
        const targetArea = resizeDimensions.value.width * resizeDimensions.value.height;
        const resizeFactor = Math.min(1, targetArea / originalArea);
        
        estimatedSizeBytes *= resizeFactor;
      }
      
      // Apply max size limit if needed
      const maxSizeBytes = maxSizeMB.value * 1024 * 1024;
      if (estimatedSizeBytes > maxSizeBytes) {
        estimatedSizeBytes = maxSizeBytes;
      }
      
      // Convert to KB for display
      estimatedSize.value = Math.floor(estimatedSizeBytes / 1024);
    };
    
    // Remove a file from selection
    const removeFile = (index) => {
      // Clean up thumbnail URL if exists
      const fileName = selectedFiles.value[index].name;
      if (thumbnailUrls.value[fileName]) {
        URL.revokeObjectURL(thumbnailUrls.value[fileName]);
        delete thumbnailUrls.value[fileName];
      }
      
      // Remove file from array
      selectedFiles.value.splice(index, 1);
      
      // If no files left, reset state
      if (selectedFiles.value.length === 0) {
        imageSelected.value = false;
      } else {
        // Recalculate average aspect ratio
        let totalRatio = 0;
        selectedFiles.value.forEach(file => {
          if (file.dimensions) {
            totalRatio += file.dimensions.ratio;
          }
        });
        averageAspectRatio.value = totalRatio / selectedFiles.value.length || 1;
      }
      
      updateEstimatedSize();
    };
    
    // Start compression process
    const performCompression = async () => {
      if (selectedFiles.value.length === 0) return;
      
      loading.value = true;
      compressionProgress.value = 0;
      currentFileIndex.value = 0;
      compressedFiles.value = [];
      compressionCancelled.value = false;
      
      try {
        // Lazy load compression library
        const imageCompression = await getImageCompression();
        
        for (let i = 0; i < selectedFiles.value.length; i++) {
          // Check if compression was cancelled
          if (compressionCancelled.value) {
            loading.value = false;
            return;
          }
          
          currentFileIndex.value = i;
          const file = selectedFiles.value[i];
          
          // Calculate target dimensions
          let maxWidth = undefined;
          let maxHeight = undefined;
          
          if (resizeDimensions.value.width > 0 && resizeDimensions.value.height > 0) {
            maxWidth = resizeDimensions.value.width;
            maxHeight = resizeDimensions.value.height;
          }
          
          // Configure compression options
          const options = {
            maxSizeMB: parseFloat(maxSizeMB.value),
            maxWidthOrHeight: Math.max(maxWidth || 0, maxHeight || 0) || 1920,
            useWebWorker: true,
            quality: quality.value / 100,
            onProgress: (progress) => {
              const fileProgress = progress / 100;
              const overallProgress = ((i + fileProgress) / selectedFiles.value.length) * 100;
              compressionProgress.value = Math.round(overallProgress);
            },
            preserveExif: preserveExif.value
          };
          
          // Compress the image
          try {
            const compressedFile = await imageCompression(file, options);
            
            // Create result object with metadata
            const result = {
              name: file.name,
              originalSize: file.size,
              compressedSize: compressedFile.size,
              dimensions: file.dimensions,
              reductionPercentage: ((file.size - compressedFile.size) / file.size * 100).toFixed(1),
              url: URL.createObjectURL(compressedFile),
              file: compressedFile
            };
            
            compressedFiles.value.push(result);
          } catch (err) {
            console.error(`Error compressing ${file.name}:`, err);
            
            compressedFiles.value.push({
              name: file.name,
              originalSize: file.size,
              compressedSize: file.size,
              failed: true,
              error: err.message
            });
            
            showError(`Failed to compress ${file.name}: ${err.message}`);
          }
          
          // Update progress
          compressionProgress.value = Math.round(((i + 1) / selectedFiles.value.length) * 100);
        }
        
        // All files processed
        if (compressedFiles.value.length > 0) {
          compressedImage.value = true;
          showSuccess(`Successfully compressed ${compressedFiles.value.length} image${compressedFiles.value.length > 1 ? 's' : ''}`);
          
          // Add haptic feedback on mobile if supported
          if ('vibrate' in navigator) {
            navigator.vibrate(200);
          }
        }
      } catch (err) {
        console.error('Compression failed:', err);
        showError('Compression failed: ' + err.message);
      } finally {
        loading.value = false;
      }
    };
    
    // Cancel ongoing compression
    const cancelCompression = () => {
      compressionCancelled.value = true;
      loading.value = false;
      
      // Clean up any completed compressed files
      compressedFiles.value.forEach(file => {
        if (file.url) URL.revokeObjectURL(file.url);
      });
      compressedFiles.value = [];
    };
    
    // Download a single compressed file
    const downloadFile = (index) => {
      const fileData = compressedFiles.value[index];
      if (!fileData || fileData.failed) return;
      
      const link = document.createElement('a');
      link.href = fileData.url;
      
      // Create filename with compression info
      const fileExtension = fileData.name.split('.').pop();
      const baseName = fileData.name.substring(0, fileData.name.lastIndexOf('.'));
      const newFileName = `${baseName}-compressed-${quality.value}q.${fileExtension}`;
      
      link.download = newFileName;
      link.click();
    };
    
    
// Download all compressed files without requiring JSZip
const downloadAllFiles = async () => {
  // For single file, use simple download
  if (compressedFiles.value.length === 1) {
    downloadFile(0);
    return;
  }
  
  // For multiple files, just download one by one
  showSuccess('Downloading files individually...');
  
  for (let i = 0; i < compressedFiles.value.length; i++) {
    if (compressedFiles.value[i].failed) continue;
    
    downloadFile(i);
    
    // Add small delay between downloads to avoid browser issues
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};
    
    // Reset state
    const clearImage = () => {
      // Clean up object URLs
      for (const url in thumbnailUrls.value) {
        URL.revokeObjectURL(thumbnailUrls.value[url]);
      }
      
      compressedFiles.value.forEach(file => {
        if (file.url) URL.revokeObjectURL(file.url);
      });
      
      // Reset all state
      imageSelected.value = false;
      compressedImage.value = null;
      selectedFiles.value = [];
      compressedFiles.value = [];
      thumbnailUrls.value = {};
      
      // Reset input
      const fileInput = document.querySelector('.file-input');
      if (fileInput) fileInput.value = '';
    };
    
    // Handle drag and drop
    const activateDropArea = (event) => {
      event.preventDefault();
      dragging.value = true;
      activeDropArea.value = true;
    };
    
    const deactivateDropArea = (event) => {
      // Check if the leave event is to a child element
      if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget)) {
        return;
      }
      dragging.value = false;
      activeDropArea.value = false;
    };
    
    const handleDrop = (event) => {
      event.preventDefault();
      dragging.value = false;
      activeDropArea.value = false;
      handleFileSelected(event);
    };
    
    // Handle keyboard events
    const handleKeyDown = (event) => {
      // Enter key to trigger file browser
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!imageSelected.value) {
          document.querySelector('.file-input').click();
        }
      }
      
      // Escape key to cancel
      if (event.key === 'Escape') {
        if (loading.value) {
          cancelCompression();
        } else if (imageSelected.value) {
          clearImage();
        }
      }
    };
    
    // Toggle dark mode
    const toggleDarkMode = () => {
      isDarkMode.value = !isDarkMode.value;
      localStorage.setItem('dark-mode', isDarkMode.value ? 'true' : 'false');
      
      // Apply dark mode to document
      if (isDarkMode.value) {
        document.documentElement.classList.add('dark-theme');
      } else {
        document.documentElement.classList.remove('dark-theme');
      }
    };
    
    // Show error message
    const showError = (message) => {
      errorMessage.value = message;
      setTimeout(() => {
        errorMessage.value = '';
      }, 5000);
    };
    
    // Show success message
    const showSuccess = (message) => {
      successMessage.value = message;
      setTimeout(() => {
        successMessage.value = '';
      }, 5000);
    };
    
    // Load saved preferences
    onMounted(() => {
      // Check for dark mode preference
      const savedDarkMode = localStorage.getItem('dark-mode');
      if (savedDarkMode === 'true' || 
         (!savedDarkMode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        isDarkMode.value = true;
        document.documentElement.classList.add('dark-theme');
      }
      
      // Load compression settings
      const savedQuality = localStorage.getItem('compression-quality');
      if (savedQuality) {
        quality.value = parseInt(savedQuality);
      }
      
      const savedMaxSize = localStorage.getItem('compression-max-size');
      if (savedMaxSize) {
        maxSizeMB.value = parseFloat(savedMaxSize);
      }
      
      const savedPreserveExif = localStorage.getItem('preserve-exif');
      if (savedPreserveExif) {
        preserveExif.value = savedPreserveExif === 'true';
      }
      
      // Set up global drag event listeners
      document.addEventListener('dragenter', (e) => {
        e.preventDefault();
        if (!imageSelected.value) {
          dragging.value = true;
        }
      });
      
      document.addEventListener('dragleave', (e) => {
        if (e.clientX === 0 && e.clientY === 0) {
          // Cursor has left the window
          dragging.value = false;
          activeDropArea.value = false;
        }
      });
      
      document.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
    });
    
    // Clean up on unmount
    onBeforeUnmount(() => {
      // Clean up object URLs
      for (const url in thumbnailUrls.value) {
        URL.revokeObjectURL(thumbnailUrls.value[url]);
      }
      
      compressedFiles.value.forEach(file => {
        if (file.url) URL.revokeObjectURL(file.url);
      });
      
      // Remove event listeners
      document.removeEventListener('dragenter', () => {});
      document.removeEventListener('dragleave', () => {});
      document.removeEventListener('dragover', () => {});
    });
    
    // Save preferences when they change
    watch([quality, maxSizeMB, preserveExif], () => {
      localStorage.setItem('compression-quality', quality.value.toString());
      localStorage.setItem('compression-max-size', maxSizeMB.value.toString());
      localStorage.setItem('preserve-exif', preserveExif.value.toString());
      
      // Update estimated size
      updateEstimatedSize();
    });
    
    return {
      // UI state
      isDarkMode,
      dragging,
      activeDropArea,
      errorMessage,
      successMessage,
      
      // Process state
      imageSelected,
      loading,
      compressionProgress,
      currentFileIndex,
      
      // Image data
      selectedFiles,
      compressedFiles,
      compressedImage,
      
      // Compression options
      quality,
      maxSizeMB,
      preserveExif,
      resizeDimensions,
      estimatedSize,
      
      // Computed values
      originalSizeTotal,
      compressedSizeTotal,
      reductionPercentage,
      
      // Methods
      formatSize,
      truncateFilename,
      getThumbnailUrl,
      handleDimensionChange,
      updateDimensionsWithAspect,
      handleFileSelected,
      removeFile,
      performCompression,
      cancelCompression,
      downloadFile,
      downloadAllFiles,
      clearImage,
      activateDropArea,
      deactivateDropArea,
      handleDrop,
      handleKeyDown,
      toggleDarkMode,
      showError,
      showSuccess
    };
  }
});
</script>

<style scoped>
/* Base Styles */
.compressor-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  transition: all 0.3s ease;
  position: relative;
}

.compressor-container.dark-mode {
  background-color: #1a202c;
  color: #e2e8f0;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}

.title {
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 32px;
  color: #1a202c;
  transition: color 0.3s ease;
}

.dark-mode .title {
  color: #f7fafc;
}

/* Hidden File Input */
.file-input {
  display: none;
}

/* Drop Zone */
.drop-zone {
  position: relative;
  border: 2px dashed #cbd5e0;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f7fafc;
  overflow: hidden;
  margin-bottom: 24px;
  min-height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dark-mode .drop-zone {
  background-color: #2d3748;
  border-color: #4a5568;
}

.drop-zone.dragging {
  border-color: #4299e1;
}

.drop-zone.active-drop {
  background-color: #ebf8ff;
  border-color: #4299e1;
  border-width: 3px;
  transform: scale(1.01);
  box-shadow: 0 0 20px rgba(66, 153, 225, 0.2);
}

.dark-mode .drop-zone.active-drop {
  background-color: #2c5282;
  border-color: #63b3ed;
}

/* Animated Background */
.animated-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.dot {
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(66, 153, 225, 0.1) 0%, rgba(66, 153, 225, 0) 70%);
  animation: float 15s infinite;
  opacity: 0;
}

.dark-mode .dot {
  background: radial-gradient(circle, rgba(99, 179, 237, 0.15) 0%, rgba(99, 179, 237, 0) 70%);
}

.dot:nth-child(1) { top: 10%; left: 20%; width: 80px; height: 80px; animation-delay: 0s; }
.dot:nth-child(2) { top: 60%; left: 80%; width: 120px; height: 120px; animation-delay: 1s; }
.dot:nth-child(3) { top: 40%; left: 10%; width: 90px; height: 90px; animation-delay: 2s; }
.dot:nth-child(4) { top: 80%; left: 30%; width: 70px; height: 70px; animation-delay: 3s; }
.dot:nth-child(5) { top: 20%; left: 70%; width: 100px; height: 100px; animation-delay: 4s; }
.dot:nth-child(6) { top: 70%; left: 60%; width: 85px; height: 85px; animation-delay: 5s; }
.dot:nth-child(7) { top: 30%; left: 40%; width: 110px; height: 110px; animation-delay: 6s; }
.dot:nth-child(8) { top: 50%; left: 50%; width: 75px; height: 75px; animation-delay: 7s; }
.dot:nth-child(9) { top: 15%; left: 85%; width: 95px; height: 95px; animation-delay: 8s; }
.dot:nth-child(10) { top: 85%; left: 15%; width: 65px; height: 65px; animation-delay: 9s; }
.dot:nth-child(11) { top: 45%; left: 25%; width: 105px; height: 105px; animation-delay: 10s; }
.dot:nth-child(12) { top: 25%; left: 55%; width: 88px; height: 88px; animation-delay: 11s; }

@keyframes float {
  0% {
    transform: translateY(100%) translateX(-100%) scale(0.5);
    opacity: 0;
  }
  20% {
    opacity: 0.4;
  }
  80% {
    opacity: 0.2;
  }
  100% {
    transform: translateY(-100%) translateX(100%) scale(1);
    opacity: 0;
  }
}

.upload-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  width: 100%;
}

.icon-container {
  margin-bottom: 16px;
  transition: transform 0.3s ease;
}

.icon-container.bounce-animation {
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.upload-icon {
  width: 64px;
  height: 64px;
  color: #4299e1;
  transition: color 0.3s ease;
}

.dark-mode .upload-icon {
  color: #63b3ed;
}

.drop-message {
  font-size: 18px;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 8px;
  transition: color 0.3s ease;
}

.dark-mode .drop-message {
  color: #e2e8f0;
}

.drop-message-secondary {
  font-size: 16px;
  color: #718096;
  margin-bottom: 16px;
  transition: color 0.3s ease;
}

.dark-mode .drop-message-secondary {
  color: #a0aec0;
}

.file-button {
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
  border: none;
}

.file-button:hover {
  background-color: #3182ce;
}

.dark-mode .file-button {
  background-color: #4299e1;
}

.dark-mode .file-button:hover {
  background-color: #3182ce;
}

.file-type-hint {
  font-size: 14px;
  color: #a0aec0;
  margin-bottom: 8px;
  transition: color 0.3s ease;
}

.dark-mode .file-type-hint {
  color: #718096;
}

.batch-hint {
  font-size: 14px;
  color: #4a5568;
  font-style: italic;
  transition: color 0.3s ease;
}

.dark-mode .batch-hint {
  color: #a0aec0;
}

/* Image container with selected files */
.image-container {
  margin-top: 24px;
}

.selected-images-preview {
  margin-bottom: 24px;
  padding: 20px;
  background-color: #f7fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.dark-mode .selected-images-preview {
  background-color: #2d3748;
  border-color: #4a5568;
}

.preview-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #2d3748;
  transition: color 0.3s ease;
}

.dark-mode .preview-title {
  color: #e2e8f0;
}

.image-thumbnails {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-thumbnail {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #e2e8f0;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.dark-mode .image-thumbnail {
  background-color: #4a5568;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
}

.image-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 6px;
  font-size: 10px;
  display: flex;
  flex-direction: column;
}

.thumbnail-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.thumbnail-size {
  font-size: 9px;
  opacity: 0.8;
}

.remove-thumbnail {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.image-thumbnail:hover .remove-thumbnail {
  opacity: 1;
}

.add-more-thumbnail {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  border: 2px dashed #cbd5e0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #718096;
  transition: all 0.3s ease;
}

.dark-mode .add-more-thumbnail {
  border-color: #4a5568;
  color: #a0aec0;
}

.add-more-thumbnail:hover {
  border-color: #4299e1;
  color: #4299e1;
}

.add-more-thumbnail span {
  font-size: 12px;
  margin-top: 6px;
}

/* Compression Options */
.compression-options {
  padding: 24px;
  background-color: #f7fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-top: 24px;
  transition: all 0.3s ease;
}

.dark-mode .compression-options {
  background-color: #2d3748;
  border-color: #4a5568;
}

.options-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #2d3748;
  transition: color 0.3s ease;
}

.dark-mode .options-title {
  color: #e2e8f0;
}

.option-group {
  margin-bottom: 20px;
}

.option-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 16px;
  color: #4a5568;
  transition: color 0.3s ease;
}

.dark-mode .option-group label {
  color: #e2e8f0;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.estimated-size {
  font-size: 14px;
  font-weight: 600;
  color: #4299e1;
  background-color: #ebf8ff;
  padding: 4px 10px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.dark-mode .estimated-size {
  background-color: #2c5282;
  color: #90cdf4;
}

.quality-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e2e8f0;
  outline: none;
  -webkit-appearance: none;
  transition: background 0.3s ease;
}

.dark-mode .quality-slider {
  background: #4a5568;
}

.quality-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #4299e1;
  cursor: pointer;
  transition: background 0.3s ease;
}

.quality-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #4299e1;
  cursor: pointer;
  border: none;
  transition: background 0.3s ease;
}

.dark-mode .quality-slider::-webkit-slider-thumb {
  background: #63b3ed;
}

.dark-mode .quality-slider::-moz-range-thumb {
  background: #63b3ed;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 12px;
  color: #718096;
  transition: color 0.3s ease;
}

.dark-mode .slider-labels {
  color: #a0aec0;
}

.select-option {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  font-size: 16px;
  color: #4a5568;
  background-color: white;
  transition: all 0.3s ease;
}

.dark-mode .select-option {
  background-color: #1a202c;
  border-color: #4a5568;
  color: #e2e8f0;
}

/* Dimension inputs */
.dimension-label {
  margin-bottom: 10px;
  display: block;
  font-size: 16px;
  color: #4a5568;
  transition: color 0.3s ease;
}

.dark-mode .dimension-label {
  color: #e2e8f0;
}

.dimension-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.dimension-input-group {
  position: relative;
  flex: 1;
}

.dimension-input {
  width: 100%;
  padding: 10px;
  padding-right: 30px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  font-size: 16px;
  color: #4a5568;
  background-color: white;
  transition: all 0.3s ease;
}

.dark-mode .dimension-input {
  background-color: #1a202c;
  border-color: #4a5568;
  color: #e2e8f0;
}

.dimension-unit {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
  font-size: 14px;
  transition: color 0.3s ease;
}

.dark-mode .dimension-unit {
  color: #718096;
}

.dimension-separator {
  font-size: 16px;
  color: #718096;
  transition: color 0.3s ease;
}

.dark-mode .dimension-separator {
  color: #a0aec0;
}

/* Checkbox style */
.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #4a5568;
  transition: color 0.3s ease;
}

.dark-mode .checkbox-container {
  color: #e2e8f0;
}

.checkbox-container input[type="checkbox"] {
  margin-right: 8px;
  width: 16px;
  height: 16px;
}

.checkbox-text {
  transition: color 0.3s ease;
}

/* Action buttons */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.primary-button, .secondary-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.primary-button {
  background-color: #4299e1;
  color: white;
  flex: 2;
}

.primary-button:hover {
  background-color: #3182ce;
}

.secondary-button {
  background-color: #edf2f7;
  color: #4a5568;
  flex: 1;
}

.secondary-button:hover {
  background-color: #e2e8f0;
}

.dark-mode .primary-button {
  background-color: #4299e1;
}

.dark-mode .primary-button:hover {
  background-color: #3182ce;
}

.dark-mode .secondary-button {
  background-color: #2d3748;
  color: #e2e8f0;
}

.dark-mode .secondary-button:hover {
  background-color: #4a5568;
}

.primary-button svg, .secondary-button svg {
  margin-right: 8px;
}

/* Loading state */
.loading-container {
  padding: 32px;
  background-color: #f7fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;
}

.dark-mode .loading-container {
  background-color: #2d3748;
  border-color: #4a5568;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.spinner {
  width: 50px;
  height: 50px;
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

.processing-text {
  font-size: 18px;
  font-weight: 500;
  color: #4a5568;
  transition: color 0.3s ease;
}

.dark-mode .processing-text {
  color: #e2e8f0;
}

.dot-animation {
  animation: dots 1.5s infinite;
}

@keyframes dots {
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60%, 100% { content: '...'; }
}

.progress-container {
  width: 100%;
  margin-bottom: 24px;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
  transition: background-color 0.3s ease;
}

.dark-mode .progress-bar-container {
  background-color: #4a5568;
}

.progress-bar {
  height: 100%;
  background-color: #4299e1;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #718096;
  transition: color 0.3s ease;
}

.dark-mode .progress-text {
  color: #a0aec0;
}

.cancel-button {
  padding: 8px 16px;
  background-color: #fff;
  color: #e53e3e;
  border: 1px solid #e53e3e;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-button:hover {
  background-color: #fff5f5;
}

.dark-mode .cancel-button {
  background-color: #2d3748;
  color: #fc8181;
  border-color: #fc8181;
}

.dark-mode .cancel-button:hover {
  background-color: #3b2c2c;
}

/* Results */
.results-container {
  padding: 24px;
  background-color: #f7fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-top: 24px;
  transition: all 0.3s ease;
}

.dark-mode .results-container {
  background-color: #2d3748;
  border-color: #4a5568;
}

.result-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #2d3748;
  text-align: center;
  transition: color 0.3s ease;
}

.dark-mode .result-title {
  color: #e2e8f0;
}

.result-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
  gap: 12px;
  transition: all 0.3s ease;
}

.dark-mode .result-stats {
  background-color: #1a202c;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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
  transition: color 0.3s ease;
}

.dark-mode .stat-label {
  color: #a0aec0;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  transition: color 0.3s ease;
}

.dark-mode .stat-value {
  color: #e2e8f0;
}

.stat-arrow {
  margin: 0 12px;
  font-size: 20px;
  color: #a0aec0;
  transition: color 0.3s ease;
}

.dark-mode .stat-arrow {
  color: #718096;
}

.stat-reduction {
  margin-left: 16px;
}

.reduction-badge {
  display: inline-block;
  padding: 6px 12px;
  background-color: #48bb78;
  color: white;
  border-radius: 16px;
  font-weight: 600;
  font-size: 14px;
}

/* Compressed files list */
.compressed-files {
  margin-bottom: 24px;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: border-color 0.3s ease;
}

.dark-mode .compressed-files {
  border-color: #4a5568;
}

.compressed-file-item {
  display: flex;
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
  align-items: center;
  background-color: white;
  transition: all 0.3s ease;
}

.compressed-file-item:last-child {
  border-bottom: none;
}

.dark-mode .compressed-file-item {
  background-color: #1a202c;
  border-color: #4a5568;
}

.file-preview {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  margin-right: 16px;
  flex-shrink: 0;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-info {
  flex: 1;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #2d3748;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 500px;
  transition: color 0.3s ease;
}

.dark-mode .file-name {
  color: #e2e8f0;
}

.file-size-reduction {
  font-size: 12px;
  color: #718096;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.3s ease;
}

.dark-mode .file-size-reduction {
  color: #a0aec0;
}

.arrow-icon {
  color: #a0aec0;
  font-size: 10px;
  transition: color 0.3s ease;
}

.dark-mode .arrow-icon {
  color: #718096;
}

.size-badge {
  padding: 2px 6px;
  background-color: #48bb78;
  color: white;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.download-file-button {
  width: 36px;
  height: 36px;
  background-color: #ebf8ff;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4299e1;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 12px;
}

.download-file-button:hover {
  background-color: #bee3f8;
}

.dark-mode .download-file-button {
  background-color: #2c5282;
  color: #63b3ed;
}

.dark-mode .download-file-button:hover {
  background-color: #2b6cb0;
}

.result-actions {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

/* Notification styles */
.error-notification, .success-notification {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-width: 450px;
  animation: slide-up 0.3s ease;
}

.error-notification {
  background-color: #fff5f5;
  border-left: 4px solid #e53e3e;
}

.success-notification {
  background-color: #f0fff4;
  border-left: 4px solid #48bb78;
}

.dark-mode .error-notification {
  background-color: #3b2c2c;
  border-left: 4px solid #fc8181;
}

.dark-mode .success-notification {
  background-color: #22543d;
  border-left: 4px solid #68d391;
}

.error-icon, .success-icon {
  margin-right: 12px;
  flex-shrink: 0;
}

.error-icon {
  color: #e53e3e;
}

.success-icon {
  color: #48bb78;
}

.dark-mode .error-icon {
  color: #fc8181;
}

.dark-mode .success-icon {
  color: #68d391;
}

.error-message, .success-message {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
}

.error-message {
  color: #742a2a;
}

.success-message {
  color: #22543d;
}

.dark-mode .error-message {
  color: #fed7d7;
}

.dark-mode .success-message {
  color: #c6f6d5;
}

.error-close, .success-close {
  background: transparent;
  border: none;
  padding: 4px;
  margin-left: 12px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.error-close:hover, .success-close:hover {
  opacity: 1;
}

.error-close {
  color: #742a2a;
}

.success-close {
  color: #22543d;
}

.dark-mode .error-close {
  color: #fed7d7;
}

.dark-mode .success-close {
  color: #c6f6d5;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

/* Theme toggle button */
.theme-toggle {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: none;
  background-color: #4299e1;
  color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 100;
}

.theme-toggle:hover {
  transform: scale(1.05);
  background-color: #3182ce;
}

.theme-toggle:active {
  transform: scale(0.95);
}

.dark-mode .theme-toggle {
  background-color: #ecc94b;
}

.dark-mode .theme-toggle:hover {
  background-color: #d69e2e;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .compressor-container {
    padding: 20px;
    border-radius: 8px;
    max-width: 100%;
  }
  
  .title {
    font-size: 24px;
    margin-bottom: 20px;
  }
  
  .drop-zone {
    padding: 24px;
  }
  
  .upload-icon {
    width: 48px;
    height: 48px;
  }
  
  .drop-message {
    font-size: 16px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .primary-button, .secondary-button {
    width: 100%;
  }
  
  .image-thumbnails {
    justify-content: center;
  }
  
  .file-name {
    max-width: 200px;
  }
}

@media (max-width: 480px) {
  .compressor-container {
    padding: 16px;
  }
  
  .title {
    font-size: 20px;
    margin-bottom: 16px;
  }
  
  .drop-zone {
    padding: 16px;
    min-height: 200px;
  }
  
  .upload-icon {
    width: 40px;
    height: 40px;
  }
  
  .drop-message {
    font-size: 14px;
  }
  
  .result-stats {
    flex-direction: column;
    gap: 16px;
    padding: 12px;
  }
  
  .stat-arrow {
    transform: rotate(90deg);
    margin: 8px 0;
  }
  
  .file-name {
    max-width: 150px;
  }
  
  .theme-toggle {
    bottom: 16px;
    right: 16px;
    width: 36px;
    height: 36px;
  }
}
</style>