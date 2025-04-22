<template>
  <div class="app">
    <PageSwitcher />
    <h1 class="title">Image Compressor</h1>
    
    <!-- Drop Zone -->
    <div 
      v-if="!selected"
      class="drop-zone" 
      :class="{ 'active': activeDropArea }"
      @dragover.prevent 
      @drop="handleDrop" 
      @dragenter="activeDropArea = true"
      @dragleave="activeDropArea = false"
      @click="$refs.fileInput.click()"
    >
      <div class="upload-content">
        <svg class="upload-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <p class="drop-text">Drop images here or click to browse</p>
        <p class="hint">Supports: JPG, PNG, GIF, WebP</p>
      </div>
    </div>
    
    <!-- Selected Images -->
    <div v-if="selected && !compressed && !loading" class="card">
      <div class="card-section">
        <div class="section-header">
          <h3>Selected Images ({{ files.length }})</h3>
        </div>
        <div class="thumbnails">
          <div v-for="(file, i) in files" :key="i" class="thumbnail">
            <img :src="getThumbnail(file)" alt="Thumbnail" />
            <div class="thumbnail-actions">
              <button class="icon-btn crop" @click="openCrop(i)" title="Crop">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 2v14a2 2 0 0 0 2 2h14"></path>
                  <path d="M18 22V8a2 2 0 0 0-2-2H2"></path>
                </svg>
              </button>
              <button class="icon-btn remove" @click="removeFile(i)" title="Remove">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="thumbnail-info">{{ formatSize(file.size) }}</div>
          </div>
          <div class="add-thumbnail" @click="$refs.fileInput.click()">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </div>
        </div>
      </div>
      
      <div class="card-section">
        <div class="section-header">
          <h3>Compression Settings</h3>
        </div>
        <div class="setting-group">
          <label for="max-size">Maximum Output Size</label>
          <select id="max-size" v-model="maxSize" class="select">
            <option value="0.1">100 KB</option>
            <option value="0.25">250 KB</option>
            <option value="0.5">500 KB</option>
            <option value="1">1 MB</option>
            <option value="2">2 MB</option>
          </select>
        </div>
        
        <div class="actions">
          <button @click="files = []; selected = false;" class="btn secondary">Cancel</button>
          <button @click="compress()" class="btn primary">Compress Images</button>
        </div>
      </div>
    </div>
    
    <!-- Crop Modal -->
    <div v-if="showCrop" class="modal" @click="closeCrop">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Crop Image</h3>
          <button class="close-btn" @click="closeCrop">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="crop-area" ref="cropContainer">
          <div class="crop-wrapper" ref="cropWrapper">
            <img v-if="cropImg" ref="cropEl" :src="cropImg" @load="initCrop" class="crop-img" alt="Crop" />
            <div v-if="cropImg" ref="cropBox" class="crop-box"></div>
          </div>
        </div>
        
        <div class="ratio-controls">
          <div class="ratio-header">Aspect Ratio</div>
          <div class="ratio-buttons">
            <button 
              v-for="r in ratios" 
              :key="r.value"
              @click="setRatio(r.value)"
              :class="['ratio-btn', ratio === r.value ? 'active' : '']"
            >
              {{ r.label }}
            </button>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeCrop" class="btn secondary">Cancel</button>
          <button @click="applyCrop" class="btn primary">Apply Crop</button>
        </div>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="card loading-card">
      <div class="spinner-container">
        <div class="spinner"></div>
        <p>Compressing images...</p>
      </div>
      
      <div class="progress-container">
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" :style="{ width: `${progress}%` }"></div>
        </div>
        <div class="progress-text">
          {{ progress }}%
          <span v-if="files.length > 1">(Image {{ currentIndex + 1 }} of {{ files.length }})</span>
        </div>
      </div>
      
      <button @click="cancelled = true; loading = false;" class="btn cancel">Cancel</button>
    </div>
    
    <!-- Results -->
    <div v-if="compressed" class="card">
      <div class="card-section">
        <div class="section-header">
          <h3>Compression Complete</h3>
        </div>
        
        <div class="stats-container">
          <div class="stats">
            <div class="stat">
              <span class="stat-label">Original</span>
              <span class="stat-value">{{ formatSize(originalSize) }}</span>
            </div>
            <div class="arrow">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
            <div class="stat">
              <span class="stat-label">Compressed</span>
              <span class="stat-value">{{ formatSize(compressedSize) }}</span>
            </div>
          </div>
          <div class="reduction">{{ reduction }}% smaller</div>
        </div>
      </div>
      
      <div class="card-section">
        <div class="result-files">
          <div v-for="(file, i) in compressedFiles" :key="i" class="result-item">
            <div class="result-preview">
              <img :src="file.url" alt="Compressed" />
            </div>
            
            <div class="result-info">
              <div class="result-name">{{ file.name }}</div>
              <div class="result-size">
                {{ formatSize(file.originalSize) }} → {{ formatSize(file.compressedSize) }}
              </div>
            </div>
            
            <button @click="download(i)" class="download-btn" title="Download">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="actions">
          <button @click="reset()" class="btn secondary">Start Over</button>
          <button @click="downloadAll()" class="btn primary">Download All</button>
        </div>
      </div>
    </div>
    
    <!-- Notifications -->
    <div v-if="error" class="notification error">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <div class="notification-text">{{ error }}</div>
      <button class="notification-close" @click="error = ''">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    
    <div v-if="success" class="notification success">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <div class="notification-text">{{ success }}</div>
      <button class="notification-close" @click="success = ''">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    
    <input type="file" @change="handleFiles" accept="image/*" multiple class="hidden" ref="fileInput" />
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import PageSwitcher from '../components/PageSwitcher.vue';

// Lazy-load image compression library
const getCompressor = () => import('browser-image-compression').then(m => m.default);

export default defineComponent({
  name: 'ImageCompressor',
  components: { PageSwitcher },
  
  setup() {
    // Core state
    const files = ref([]);
    const compressedFiles = ref([]);
    const selected = ref(false);
    const compressed = ref(false);
    const loading = ref(false);
    const error = ref('');
    const success = ref('');
    const activeDropArea = ref(false);
    const progress = ref(0);
    const currentIndex = ref(0);
    const cancelled = ref(false);
    const thumbnails = ref({});
    
    // Compression options
    const quality = 75; // Fixed quality value
    const maxSize = ref(0.5);
    
    // Crop state
    const showCrop = ref(false);
    const cropImg = ref(null);
    const cropIndex = ref(-1);
    const cropContainer = ref(null);
    const cropWrapper = ref(null);
    const cropEl = ref(null);
    const cropBox = ref(null);
    const ratio = ref('free');
    const cropDragging = ref(false);
    const cropResizing = ref(false);
    const resizePos = ref('');
    const startX = ref(0);
    const startY = ref(0);
    
    // Aspect ratio options
    const ratios = [
      { label: 'Free', value: 'free' },
      { label: '1:1', value: 1 },
      { label: '4:3', value: 4/3 },
      { label: '16:9', value: 16/9 },
      { label: '3:2', value: 3/2 }
    ];
    
    // Computed values
    const originalSize = computed(() => files.value.reduce((sum, f) => sum + f.size, 0));
    const compressedSize = computed(() => compressedFiles.value.reduce((sum, f) => sum + f.compressedSize, 0));
    const reduction = computed(() => {
      if (!compressedFiles.value.length) return 0;
      return ((originalSize.value - compressedSize.value) / originalSize.value * 100).toFixed(1);
    });
    
    // Size formatter
    const formatSize = (bytes) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / 1048576).toFixed(2) + ' MB';
    };
    
    // Get thumbnail URL
    const getThumbnail = (file) => {
      if (thumbnails.value[file.name]) return thumbnails.value[file.name];
      const url = URL.createObjectURL(file);
      thumbnails.value[file.name] = url;
      return url;
    };
    
    // Handle file selection
    const handleFiles = (event) => {
      const newFiles = Array.from(event.target.files || event.dataTransfer.files)
        .filter(file => file.type.startsWith('image/'));
      
      if (newFiles.length === 0) {
        error.value = 'Please select valid image files';
        return;
      }
      
      newFiles.forEach(file => file.originalType = file.type);
      
      if (selected.value) {
        files.value = [...files.value, ...newFiles];
      } else {
        files.value = newFiles;
        selected.value = true;
      }
      
      compressed.value = false;
      compressedFiles.value = [];
    };
    
    const handleDrop = (event) => {
      event.preventDefault();
      activeDropArea.value = false;
      handleFiles(event);
    };
    
    // Remove a file
    const removeFile = (index) => {
      const fileName = files.value[index].name;
      if (thumbnails.value[fileName]) {
        URL.revokeObjectURL(thumbnails.value[fileName]);
        delete thumbnails.value[fileName];
      }
      
      files.value.splice(index, 1);
      
      if (files.value.length === 0) {
        selected.value = false;
      }
    };
    
    // Crop methods
    const openCrop = (index) => {
      cropIndex.value = index;
      cropImg.value = getThumbnail(files.value[index]);
      showCrop.value = true;
    };
    
    const closeCrop = () => {
      showCrop.value = false;
      cropIndex.value = -1;
      cropImg.value = null;
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopDragResize);
    };
    
    const initCrop = () => {
      nextTick(() => {
        const img = cropEl.value;
        const container = cropWrapper.value;
        const box = cropBox.value;
        
        if (!img || !container || !box) return;
        
        // Set initial crop area (70% of image)
        const imgWidth = img.clientWidth;
        const imgHeight = img.clientHeight;
        
        const cropWidth = imgWidth * 0.7;
        const cropHeight = imgHeight * 0.7;
        
        box.style.left = ((imgWidth - cropWidth) / 2) + 'px';
        box.style.top = ((imgHeight - cropHeight) / 2) + 'px';
        box.style.width = cropWidth + 'px';
        box.style.height = cropHeight + 'px';
        
        // Add resize handles
        const handles = ['nw', 'ne', 'se', 'sw'];
        handles.forEach(pos => {
          const handle = document.createElement('div');
          handle.className = `handle ${pos}`;
          handle.dataset.pos = pos;
          box.appendChild(handle);
        });
        
        // Set up event listeners
        box.addEventListener('mousedown', startDrag);
        
        const handleElements = box.querySelectorAll('.handle');
        handleElements.forEach(h => {
          h.addEventListener('mousedown', startResize);
        });
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopDragResize);
      });
    };
    
    const startDrag = (event) => {
      if (event.target.classList.contains('handle')) return;
      
      event.preventDefault();
      const box = cropBox.value;
      if (!box) return;
      
      cropDragging.value = true;
      
      const rect = box.getBoundingClientRect();
      startX.value = event.clientX - rect.left;
      startY.value = event.clientY - rect.top;
    };
    
    const startResize = (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      cropResizing.value = true;
      resizePos.value = event.target.dataset.pos;
      
      startX.value = event.clientX;
      startY.value = event.clientY;
    };
    
    const handleMouseMove = (event) => {
      if (cropDragging.value) {
        dragCrop(event);
      } else if (cropResizing.value) {
        resizeCrop(event);
      }
    };
    
    const dragCrop = (event) => {
      const box = cropBox.value;
      const container = cropWrapper.value;
      if (!box || !container) return;
      
      const containerRect = container.getBoundingClientRect();
      const boxRect = box.getBoundingClientRect();
      
      let left = event.clientX - containerRect.left - startX.value;
      let top = event.clientY - containerRect.top - startY.value;
      
      // Keep within bounds
      left = Math.max(0, Math.min(left, containerRect.width - boxRect.width));
      top = Math.max(0, Math.min(top, containerRect.height - boxRect.height));
      
      box.style.left = left + 'px';
      box.style.top = top + 'px';
    };
    
    const resizeCrop = (event) => {
      const box = cropBox.value;
      const container = cropWrapper.value;
      if (!box || !container) return;
      
      const dx = event.clientX - startX.value;
      const dy = event.clientY - startY.value;
      
      startX.value = event.clientX;
      startY.value = event.clientY;
      
      const currentLeft = parseInt(box.style.left || '0', 10);
      const currentTop = parseInt(box.style.top || '0', 10);
      const currentWidth = parseInt(box.style.width || '0', 10);
      const currentHeight = parseInt(box.style.height || '0', 10);
      
      let newLeft = currentLeft;
      let newTop = currentTop;
      let newWidth = currentWidth;
      let newHeight = currentHeight;
      
      const aspect = ratio.value === 'free' ? null : ratio.value;
      
      // Adjust dimensions based on handle position
      switch (resizePos.value) {
        case 'nw':
          newWidth = Math.max(50, currentWidth - dx);
          newLeft = currentLeft + dx;
          newHeight = aspect ? newWidth / aspect : Math.max(50, currentHeight - dy);
          newTop = aspect ? currentTop + (currentHeight - newHeight) : currentTop + dy;
          break;
        case 'ne':
          newWidth = Math.max(50, currentWidth + dx);
          newHeight = aspect ? newWidth / aspect : Math.max(50, currentHeight - dy);
          newTop = aspect ? currentTop + (currentHeight - newHeight) : currentTop + dy;
          break;
        case 'se':
          newWidth = Math.max(50, currentWidth + dx);
          newHeight = aspect ? newWidth / aspect : Math.max(50, currentHeight + dy);
          break;
        case 'sw':
          newWidth = Math.max(50, currentWidth - dx);
          newLeft = currentLeft + dx;
          newHeight = aspect ? newWidth / aspect : Math.max(50, currentHeight + dy);
          break;
      }
      
      const containerRect = container.getBoundingClientRect();
      
      // Ensure within bounds
      if (newLeft < 0) {
        newWidth += newLeft;
        newLeft = 0;
      }
      
      if (newTop < 0) {
        newHeight += newTop;
        newTop = 0;
      }
      
      if (newLeft + newWidth > containerRect.width) {
        newWidth = containerRect.width - newLeft;
      }
      
      if (newTop + newHeight > containerRect.height) {
        newHeight = containerRect.height - newTop;
      }
      
      // Apply new dimensions
      box.style.left = newLeft + 'px';
      box.style.top = newTop + 'px';
      box.style.width = newWidth + 'px';
      box.style.height = newHeight + 'px';
    };
    
    const stopDragResize = () => {
      cropDragging.value = false;
      cropResizing.value = false;
    };
    
    const setRatio = (value) => {
      ratio.value = value;
      
      const box = cropBox.value;
      if (!box || value === 'free') return;
      
      // Adjust to new ratio
      const currentWidth = parseInt(box.style.width || '0', 10);
      let newHeight = currentWidth / value;
      
      const container = cropWrapper.value;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      
      // If too tall, adjust width instead
      if (newHeight > containerRect.height) {
        newHeight = containerRect.height;
        const newWidth = newHeight * value;
        box.style.width = newWidth + 'px';
      }
      
      box.style.height = newHeight + 'px';
      
      // Center in current position
      const currentLeft = parseInt(box.style.left || '0', 10);
      const currentTop = parseInt(box.style.top || '0', 10);
      const currentHeight = parseInt(box.style.height || '0', 10);
      
      if (newHeight !== currentHeight) {
        box.style.top = (currentTop + (currentHeight - newHeight) / 2) + 'px';
      }
    };
    
    const applyCrop = async () => {
      if (!cropEl.value || !cropBox.value || cropIndex.value < 0) return;
      
      try {
        const img = cropEl.value;
        const box = cropBox.value;
        
        // Calculate crop coordinates relative to the original image
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        const displayWidth = img.clientWidth;
        const displayHeight = img.clientHeight;
        
        // Get box coordinates
        const boxLeft = parseInt(box.style.left || '0', 10);
        const boxTop = parseInt(box.style.top || '0', 10);
        const boxWidth = parseInt(box.style.width || '0', 10);
        const boxHeight = parseInt(box.style.height || '0', 10);
        
        // Convert to original image coordinates
        const sourceX = (boxLeft / displayWidth) * imgWidth;
        const sourceY = (boxTop / displayHeight) * imgHeight;
        const sourceWidth = (boxWidth / displayWidth) * imgWidth;
        const sourceHeight = (boxHeight / displayHeight) * imgHeight;
        
        // Create a canvas to perform the crop
        const canvas = document.createElement('canvas');
        canvas.width = sourceWidth;
        canvas.height = sourceHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(
          img, 
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, sourceWidth, sourceHeight
        );
        
        // Convert to blob
        const blob = await new Promise(resolve => {
          canvas.toBlob(resolve, 'image/jpeg', 0.95);
        });
        
        if (!blob) {
          error.value = 'Failed to process cropped image';
          return;
        }
        
        // Replace the original file
        const originalFile = files.value[cropIndex.value];
        const croppedFile = new File([blob], originalFile.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        croppedFile.originalType = originalFile.originalType || originalFile.type;
        
        // Update thumbnail
        if (thumbnails.value[originalFile.name]) {
          URL.revokeObjectURL(thumbnails.value[originalFile.name]);
          delete thumbnails.value[originalFile.name];
        }
        
        files.value.splice(cropIndex.value, 1, croppedFile);
        thumbnails.value[croppedFile.name] = URL.createObjectURL(croppedFile);
        
        closeCrop();
        success.value = 'Image cropped successfully';
      } catch (err) {
        console.error('Error cropping:', err);
        error.value = 'Failed to crop image';
      }
    };
    
    // Compression
    const compress = async () => {
      if (files.value.length === 0) return;
      
      loading.value = true;
      progress.value = 0;
      currentIndex.value = 0;
      compressedFiles.value = [];
      cancelled.value = false;
      
      try {
        const compressor = await getCompressor();
        
        for (let i = 0; i < files.value.length; i++) {
          if (cancelled.value) {
            loading.value = false;
            return;
          }
          
          currentIndex.value = i;
          const file = files.value[i];
          
          const options = {
            maxSizeMB: parseFloat(maxSize.value),
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            quality: quality / 100,
            fileType: 'image/webp',
            onProgress: (p) => {
              const fileProgress = p / 100;
              const overall = (i + fileProgress) / files.value.length;
              progress.value = Math.round(overall * 100);
            }
          };
          
          try {
            const compressed = await compressor(file, options);
            
            compressedFiles.value.push({
              file: compressed,
              name: file.name,
              originalSize: file.size,
              compressedSize: compressed.size,
              type: compressed.type,
              originalType: file.type,
              url: URL.createObjectURL(compressed)
            });
            
            progress.value = Math.round(((i + 1) / files.value.length) * 100);
          } catch (err) {
            console.error(`Error compressing ${file.name}:`, err);
            
            compressedFiles.value.push({
              name: file.name,
              originalSize: file.size,
              originalType: file.type,
              compressedSize: file.size,
              failed: true,
              error: err.message
            });
          }
        }
        
        if (compressedFiles.value.length > 0) {
          compressed.value = true;
          success.value = `Compressed ${compressedFiles.value.length} image${compressedFiles.value.length > 1 ? 's' : ''}`;
        }
      } catch (err) {
        error.value = 'Compression failed: ' + err.message;
      } finally {
        loading.value = false;
      }
    };
    
    // Download functions
    const download = (index) => {
      const file = compressedFiles.value[index];
      if (!file || file.failed) return;
      
      const link = document.createElement('a');
      link.href = file.url;
      
      const ext = file.type.split('/')[1];
      const name = file.name.substring(0, file.name.lastIndexOf('.'));
      link.download = `${name}-compressed.${ext}`;
      
      link.click();
    };
    
    const downloadAll = async () => {
      if (compressedFiles.value.length === 1) {
        download(0);
        return;
      }
      
      success.value = 'Downloading files...';
      
      for (let i = 0; i < compressedFiles.value.length; i++) {
        if (compressedFiles.value[i].failed) continue;
        
        download(i);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    };
    
    // Reset app
    const reset = () => {
      // Clean up URLs
      Object.values(thumbnails.value).forEach(url => URL.revokeObjectURL(url));
      compressedFiles.value.forEach(file => {
        if (file.url) URL.revokeObjectURL(file.url);
      });
      
      files.value = [];
      compressedFiles.value = [];
      selected.value = false;
      compressed.value = false;
      thumbnails.value = {};
      
      const fileInput = document.querySelector('.hidden');
      if (fileInput) fileInput.value = '';
    };
    
    // Set up and clean up
    onMounted(() => {
      document.addEventListener('dragover', e => e.preventDefault());
    });
    
    onBeforeUnmount(() => {
      Object.values(thumbnails.value).forEach(url => URL.revokeObjectURL(url));
      compressedFiles.value.forEach(file => {
        if (file.url) URL.revokeObjectURL(file.url);
      });
      
      document.removeEventListener('dragover', e => e.preventDefault());
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopDragResize);
    });
    
    return {
      // Core state
      files,
      compressedFiles,
      selected,
      compressed,
      loading,
      error,
      success,
      activeDropArea,
      progress,
      currentIndex,
      cancelled,
      
      // Crop state
      showCrop,
      cropImg,
      cropIndex,
      cropContainer,
      cropWrapper,
      cropEl,
      cropBox,
      ratio,
      ratios,
      
      // Computed
      originalSize,
      compressedSize,
      reduction,
      
      // Compression options
      maxSize,
      
      // Functions
      formatSize,
      getThumbnail,
      handleFiles,
      handleDrop,
      removeFile,
      compress,
      download,
      downloadAll,
      reset,
      
      // Crop functions
      openCrop,
      closeCrop,
      setRatio,
      applyCrop,
      initCrop
    };
  }
});
</script>

<style scoped>
:root {
  --bg-main: #0f172a;
  --bg-card: #1e293b;
  --bg-elevated: #334155;
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e0;
  --text-tertiary: #94a3b8;
  --accent: #0ea5e9;
  --accent-hover: #38bdf8;
  --accent-muted: rgba(14, 165, 233, 0.2);
  --success: #10b981;
  --error: #ef4444;
  --border: #334155;
  --border-light: #475569;
}

/* Core styles */
.app {
  max-width: 640px;
  margin: 0 auto;
  padding: 24px;
  background: #0f172a; /* Dark blue background */
  border-radius: 16px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  color: #f8fafc;
}

.title {
  text-align: center;
  font-size: 26px;
  font-weight: 600;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hidden { display: none; }

/* Button styles */
.btn {
  padding: 12px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.primary {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: white;
  flex: 2;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.primary:hover {
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  transform: translateY(-1px);
  box-shadow: 0 6px 15px rgba(14, 165, 233, 0.4);
}

.secondary {
  background: #334155;
  color: #e2e8f0;
  flex: 1;
  border: 1px solid #475569;
}

.secondary:hover {
  background: #475569;
}

.cancel {
  padding: 10px 16px;
  background: transparent;
  color: #f87171;
  border: 1px solid #f87171;
  margin-top: 16px;
}

.cancel:hover {
  background: rgba(248, 113, 113, 0.1);
}

.icon-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
}

.icon-btn.crop {
  background: rgba(14, 165, 233, 0.3);
  color: #38bdf8;
}

.icon-btn.crop:hover {
  background: rgba(14, 165, 233, 0.4);
}

.icon-btn.remove {
  background: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.icon-btn.remove:hover {
  background: rgba(239, 68, 68, 0.4);
}

.download-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: rgba(14, 165, 233, 0.2);
  color: #38bdf8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.download-btn:hover {
  background: rgba(14, 165, 233, 0.3);
  transform: translateY(-1px);
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #e2e8f0;
}

/* Card Styles */
.card {
  background: #1e293b;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  margin-bottom: 24px;
}

.card-section {
  padding: 20px;
  border-bottom: 1px solid #334155;
}

.card-section:last-child {
  border-bottom: none;
}

.section-header {
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #f8fafc;
  margin: 0;
}

/* Drop Zone */
.drop-zone {
  border: 2px dashed #475569;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  background: #1e293b;
  margin-bottom: 24px;
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.drop-zone::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.05), transparent);
  z-index: 0;
}

.drop-zone:hover, .drop-zone.active {
  border-color: #0ea5e9;
  background: #1e293b;
  box-shadow: 0 0 20px rgba(14, 165, 233, 0.2);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: #0ea5e9;
  margin-bottom: 16px;
  filter: drop-shadow(0 0 6px rgba(14, 165, 233, 0.4));
}

.drop-text {
  font-size: 18px;
  font-weight: 500;
  color: #e2e8f0;
  margin-bottom: 8px;
}

.hint {
  font-size: 14px;
  color: #94a3b8;
  margin-top: 8px;
}

/* Thumbnails */
.thumbnails {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.thumbnail {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 10px;
  overflow: hidden;
  background: #334155;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.thumbnail:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 12px rgba(0, 0, 0, 0.3);
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-actions {
  position: absolute;
  top: 5px;
  right: 5px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.thumbnail:hover .thumbnail-actions {
  opacity: 1;
}

.thumbnail-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(15, 23, 42, 0.8);
  color: #e2e8f0;
  padding: 4px 6px;
  font-size: 11px;
  text-align: center;
  backdrop-filter: blur(2px);
}

.add-thumbnail {
  width: 80px;
  height: 80px;
  border-radius: 10px;
  border: 2px dashed #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #94a3b8;
  background: rgba(14, 165, 233, 0.05);
  transition: all 0.2s ease;
}

.add-thumbnail:hover {
  border-color: #0ea5e9;
  color: #38bdf8;
  background: rgba(14, 165, 233, 0.1);
  transform: translateY(-2px);
}

/* Settings */
.setting-group {
  margin-bottom: 20px;
}

.setting-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #e2e8f0;
}

.select {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #475569;
  font-size: 14px;
  color: #e2e8f0;
  background: #334155;
  outline: none;
  transition: border-color 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.select:focus {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2);
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

/* Crop Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(6px);
}

.modal-content {
  background: #1e293b;
  border-radius: 16px;
  max-width: 90%;
  width: 640px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #334155;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #f8fafc;
}

.crop-area {
  padding: 20px;
  flex: 1;
  overflow: hidden;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
}

.crop-wrapper {
  position: relative;
  display: inline-block;
  max-width: 100%;
  max-height: 60vh;
  overflow: hidden;
}

.crop-img {
  display: block;
  max-width: 100%;
  max-height: 60vh;
}

.crop-box {
  position: absolute;
  border: 2px dashed #0ea5e9;
  background: rgba(14, 165, 233, 0.2);
  box-sizing: border-box;
  cursor: move;
}

.handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #f8fafc;
  border: 2px solid #0ea5e9;
  border-radius: 50%;
  z-index: 10;
}

.handle.nw {
  top: -6px;
  left: -6px;
  cursor: nw-resize;
}

.handle.ne {
  top: -6px;
  right: -6px;
  cursor: ne-resize;
}

.handle.se {
  bottom: -6px;
  right: -6px;
  cursor: se-resize;
}

.handle.sw {
  bottom: -6px;
  left: -6px;
  cursor: sw-resize;
}

.ratio-controls {
  padding: 16px 20px;
  border-top: 1px solid #334155;
}

.ratio-header {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 12px;
}

.ratio-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.ratio-btn {
  padding: 8px 14px;
  background: #334155;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ratio-btn:hover {
  background: #475569;
}

.ratio-btn.active {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: white;
  box-shadow: 0 2px 6px rgba(14, 165, 233, 0.3);
}

.modal-footer {
  padding: 16px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid #334155;
}

/* Loading */
.loading-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(14, 165, 233, 0.1);
  border-radius: 50%;
  border-top-color: #0ea5e9;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.progress-container {
  width: 100%;
  margin-bottom: 16px;
}

.progress-bar-bg {
  width: 100%;
  height: 8px;
  background: #334155;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(to right, #0ea5e9, #38bdf8);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 14px;
  color: #94a3b8;
}

/* Results */
.stats-container {
  background: #0f172a;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
}

.stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 12px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #f8fafc;
}

.arrow {
  color: #64748b;
}

.reduction {
  padding: 6px 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border-radius: 20px;
  font-weight: 600;
  font-size: 13px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
}

.result-files {
  max-height: 300px;
  overflow-y: auto;
  border-radius: 8px;
  background: #0f172a;
  margin-bottom: 16px;
}

.result-item {
  display: flex;
  padding: 12px;
  border-bottom: 1px solid #334155;
  align-items: center;
}

.result-item:last-child {
  border-bottom: none;
}

.result-preview {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  margin-right: 12px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
}

.result-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-info {
  flex: 1;
}

.result-name {
  font-size: 14px;
  font-weight: 500;
  color: #f8fafc;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}

.result-size {
  font-size: 12px;
  color: #94a3b8;
}

/* Notifications */
.notification {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  max-width: 420px;
  backdrop-filter: blur(8px);
  gap: 12px;
}

.error {
  background: rgba(239, 68, 68, 0.15);
  border-left: 4px solid #ef4444;
}

.success {
  background: rgba(16, 185, 129, 0.15);
  border-left: 4px solid #10b981;
}

.notification svg {
  flex-shrink: 0;
}

.error svg {
  color: #ef4444;
}

.success svg {
  color: #10b981;
}

.notification-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
}

.error .notification-text {
  color: #fca5a5;
}

.success .notification-text {
  color: #6ee7b7;
}

.notification-close {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  color: #94a3b8;
  transition: color 0.2s ease;
}

.notification-close:hover {
  color: #e2e8f0;
}

/* Responsive */
@media (max-width: 640px) {
  .app {
    padding: 16px;
    width: 95%;
  }
  
  .title {
    font-size: 22px;
    margin-bottom: 20px;
  }
  
  .drop-zone {
    padding: 20px;
    min-height: 160px;
  }
  
  .upload-icon {
    width: 40px;
    height: 40px;
  }
  
  .thumbnail, .add-thumbnail {
    width: 70px;
    height: 70px;
  }
  
  .thumbnail-actions {
    opacity: 1;
    top: 3px;
    right: 3px;
  }
  
  .result-name {
    max-width: 180px;
  }
  
  .actions {
    flex-direction: column;
  }
  
  .ratio-buttons {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
  
  .modal-content {
    height: 90vh;
    width: 95%;
  }
}
</style>