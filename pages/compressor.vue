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
        <p class="hint">Supports: JPG, PNG, GIF, WebP, AVIF</p>
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
              <button class="icon-btn resize" @click="openResize(i)" title="Resize">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 3h6v6"></path>
                  <path d="M9 21H3v-6"></path>
                  <path d="M21 3l-7 7"></path>
                  <path d="M3 21l7-7"></path>
                </svg>
              </button>
              <button class="icon-btn remove" @click="removeFile(i)" title="Remove">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <!-- Add metadata view indicator -->
            <div class="thumbnail-badge" v-if="file.hasMetadata" @click="viewMetadata(i)" title="Has metadata">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
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
      
      <!-- Compression Settings -->
      <div class="card-section">
        <div class="section-header">
          <h3>Compression Settings</h3>
          <div class="tabs">
            <button 
              v-for="tab in settingTabs" 
              :key="tab.id" 
              :class="['tab-btn', activeTab === tab.id ? 'active' : '']"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- Basic settings tab -->
        <div v-if="activeTab === 'basic'" class="setting-content">
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
          
          <div class="setting-group">
            <label for="output-format">Output Format</label>
            <select id="output-format" v-model="outputFormat" class="select">
              <option value="original">Same as original</option>
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
              <option value="avif">AVIF</option>
              <option value="gif">GIF</option>
            </select>
          </div>
        </div>

        <!-- Advanced settings tab -->
        <div v-if="activeTab === 'advanced'" class="setting-content">
          <div class="setting-group">
            <label for="quality-slider">Quality: {{ quality }}%</label>
            <div class="slider-container">
              <input 
                type="range" 
                id="quality-slider" 
                v-model="quality" 
                min="5" 
                max="100" 
                step="5" 
                class="slider"
              />
              <div class="slider-labels">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>
          
          <div class="setting-group">
            <label>Compression Profile</label>
            <div class="profile-buttons">
              <button 
                v-for="profile in compressionProfiles" 
                :key="profile.id"
                :class="['profile-btn', currentProfile === profile.id ? 'active' : '']"
                @click="setCompressionProfile(profile.id)"
              >
                {{ profile.name }}
              </button>
            </div>
          </div>
          
          <div class="setting-group">
            <label class="toggle-label">
              <input type="checkbox" v-model="preserveMetadata" class="toggle-checkbox" />
              <span class="toggle-switch"></span>
              Preserve Metadata (EXIF)
            </label>
          </div>
        </div>

        <!-- Resize settings tab -->
        <div v-if="activeTab === 'resize'" class="setting-content">
          <div class="setting-group">
            <label for="resize-mode">Resize Mode</label>
            <select id="resize-mode" v-model="resizeMode" class="select">
              <option value="percentage">Percentage</option>
              <option value="dimensions">Custom Dimensions</option>
              <option value="none">No Resizing</option>
            </select>
          </div>
          
          <div v-if="resizeMode === 'percentage'" class="setting-group">
            <label for="resize-percentage">Scale: {{ resizePercentage }}%</label>
            <div class="slider-container">
              <input 
                type="range" 
                id="resize-percentage" 
                v-model="resizePercentage" 
                min="10" 
                max="100" 
                step="5" 
                class="slider"
              />
            </div>
          </div>
          
          <div v-if="resizeMode === 'dimensions'" class="dimension-controls">
            <div class="dimension-group">
              <label for="width">Width (px)</label>
              <input 
                type="number" 
                id="width" 
                v-model="resizeWidth" 
                placeholder="Width" 
                min="1" 
                class="dimension-input"
              />
            </div>
            
            <div class="dimension-group">
              <label for="height">Height (px)</label>
              <input 
                type="number" 
                id="height" 
                v-model="resizeHeight" 
                placeholder="Height" 
                min="1" 
                class="dimension-input"
              />
            </div>
            
            <div class="aspect-ratio-toggle">
              <label class="toggle-label">
                <input type="checkbox" v-model="maintainAspectRatio" class="toggle-checkbox" />
                <span class="toggle-switch"></span>
                Maintain Aspect Ratio
              </label>
            </div>
          </div>
        </div>

        <!-- Renaming settings tab -->
        <div v-if="activeTab === 'rename'" class="setting-content">
          <div class="setting-group">
            <label for="rename-pattern">Renaming Pattern</label>
            <input 
              type="text" 
              id="rename-pattern" 
              v-model="renamePattern" 
              placeholder="e.g., vacation-{number}" 
              class="text-input"
            />
            <div class="rename-hint">
              Use {number} for sequential numbering, {date} for current date
            </div>
          </div>
          
          <div class="prefix-suffix-container">
            <div class="setting-group half">
              <label for="prefix">Prefix</label>
              <input 
                type="text" 
                id="prefix" 
                v-model="prefixText" 
                placeholder="Add before filename" 
                class="text-input"
              />
            </div>
            
            <div class="setting-group half">
              <label for="suffix">Suffix</label>
              <input 
                type="text" 
                id="suffix" 
                v-model="suffixText" 
                placeholder="Add after filename" 
                class="text-input"
              />
            </div>
          </div>
          
          <div class="setting-group">
            <label class="toggle-label">
              <input type="checkbox" v-model="convertToLowercase" class="toggle-checkbox" />
              <span class="toggle-switch"></span>
              Convert to lowercase
            </label>
          </div>
          
          <div class="setting-group">
            <label class="toggle-label">
              <input type="checkbox" v-model="replaceSpaces" class="toggle-checkbox" />
              <span class="toggle-switch"></span>
              Replace spaces with dash
            </label>
          </div>
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
    
    <!-- Resize Modal -->
    <div v-if="showResize" class="modal" @click="closeResize">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Resize Image</h3>
          <button class="close-btn" @click="closeResize">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="resize-preview">
          <div class="preview-container">
            <img v-if="resizeImg" :src="resizeImg" class="resize-preview-img" alt="Preview" />
            <div class="image-dimensions">{{ currentImageWidth }} × {{ currentImageHeight }} px</div>
          </div>
          
          <div class="resize-controls">
            <div class="setting-group">
              <label>Resize Method</label>
              <div class="resize-method-buttons">
                <button 
                  v-for="method in resizeMethods" 
                  :key="method.id"
                  :class="['method-btn', currentResizeMethod === method.id ? 'active' : '']"
                  @click="setResizeMethod(method.id)"
                >
                  {{ method.name }}
                </button>
              </div>
            </div>
            
            <div v-if="currentResizeMethod === 'percentage'" class="setting-group">
              <label>Scale: {{ singleResizePercentage }}%</label>
              <div class="slider-container">
                <input 
                  type="range" 
                  v-model="singleResizePercentage" 
                  min="10" 
                  max="100" 
                  step="5" 
                  class="slider"
                  @input="updateResizePreview"
                />
              </div>
            </div>
            
            <div v-if="currentResizeMethod === 'dimensions'" class="setting-group">
              <div class="dimension-controls">
                <div class="dimension-group">
                  <label>Width (px)</label>
                  <input 
                    type="number" 
                    v-model="currentResizeWidth" 
                    min="1" 
                    class="dimension-input"
                    @input="updateResizeDimensions('width')"
                  />
                </div>
                
                <div class="dimension-group">
                  <label>Height (px)</label>
                  <input 
                    type="number" 
                    v-model="currentResizeHeight" 
                    min="1" 
                    class="dimension-input"
                    @input="updateResizeDimensions('height')"
                  />
                </div>
              </div>
              
              <div class="aspect-ratio-toggle">
                <label class="toggle-label">
                  <input type="checkbox" v-model="keepAspectRatio" class="toggle-checkbox" @change="updateResizePreview" />
                  <span class="toggle-switch"></span>
                  Maintain Aspect Ratio
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeResize" class="btn secondary">Cancel</button>
          <button @click="applyResize" class="btn primary">Apply Resize</button>
        </div>
      </div>
    </div>
    
    <!-- Metadata Modal -->
    <div v-if="showMetadata" class="modal" @click="closeMetadata">
      <div class="modal-content metadata-modal" @click.stop>
        <div class="modal-header">
          <h3>Image Metadata</h3>
          <button class="close-btn" @click="closeMetadata">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="metadata-content">
          <div class="metadata-summary">
            <div class="metadata-image">
              <img v-if="metadataImg" :src="metadataImg" alt="Image with metadata" />
            </div>
            <div class="metadata-info">
              <div class="metadata-item">
                <strong>Filename:</strong> {{ currentMetadataFile ? currentMetadataFile.name : '' }}
              </div>
              <div class="metadata-item">
                <strong>Size:</strong> {{ currentMetadataFile ? formatSize(currentMetadataFile.size) : '' }}
              </div>
              <div class="metadata-item">
                <strong>Type:</strong> {{ currentMetadataFile ? currentMetadataFile.type : '' }}
              </div>
              <div class="metadata-item" v-if="imageMetadata.dimensions">
                <strong>Dimensions:</strong> {{ imageMetadata.dimensions.width }} × {{ imageMetadata.dimensions.height }} px
              </div>
            </div>
          </div>
          
          <div class="metadata-details">
            <div class="metadata-section" v-if="imageMetadata.exif && Object.keys(imageMetadata.exif).length">
              <h4>EXIF Data</h4>
              <div class="metadata-table">
                <div v-for="(value, key) in imageMetadata.exif" :key="key" class="metadata-row">
                  <div class="metadata-key">{{ formatMetadataKey(key) }}</div>
                  <div class="metadata-value">{{ formatMetadataValue(value) }}</div>
                </div>
              </div>
            </div>
            
            <div class="metadata-section" v-if="imageMetadata.gps && Object.keys(imageMetadata.gps).length">
              <h4>Location Data</h4>
              <div class="metadata-table">
                <div v-for="(value, key) in imageMetadata.gps" :key="key" class="metadata-row">
                  <div class="metadata-key">{{ formatMetadataKey(key) }}</div>
                  <div class="metadata-value">{{ formatMetadataValue(value) }}</div>
                </div>
              </div>
            </div>
            
            <div class="metadata-actions">
              <label class="toggle-label">
                <input type="checkbox" v-model="stripMetadataOnExport" class="toggle-checkbox" />
                <span class="toggle-switch"></span>
                Strip metadata on export
              </label>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeMetadata" class="btn primary">Close</button>
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
              <div class="result-format" v-if="file.originalType !== file.type">
                {{ getFormatName(file.originalType) }} → {{ getFormatName(file.type) }}
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
import { defineComponent, ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import PageSwitcher from '../components/PageSwitcher.vue';

// Lazy-load image compression library
const getCompressor = () => import('browser-image-compression').then(m => m.default);
// Lazy-load EXIF parser library
const getExifParser = () => import('exif-parser').then(m => m.default);

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

    // Tab navigation for settings
    const activeTab = ref('basic');
    const settingTabs = [
      { id: 'basic', label: 'Basic' },
      { id: 'advanced', label: 'Advanced' },
      { id: 'resize', label: 'Resize' },
      { id: 'rename', label: 'Rename' }
    ];
    
    // Compression options
    const quality = ref(75);
    const maxSize = ref(0.5);
    const outputFormat = ref('original');
    const preserveMetadata = ref(false);
    const currentProfile = ref('standard');
    
    // Compression profiles
    const compressionProfiles = [
      { id: 'standard', name: 'Standard', quality: 75, format: 'original' },
      { id: 'web', name: 'Web', quality: 80, format: 'webp' },
      { id: 'social', name: 'Social Media', quality: 85, format: 'jpeg' },
      { id: 'minimal', name: 'Minimal', quality: 50, format: 'webp' },
      { id: 'maximum', name: 'Maximum Quality', quality: 95, format: 'original' }
    ];
    
    // Resize options
    const resizeMode = ref('none');
    const resizePercentage = ref(80);
    const resizeWidth = ref(1280);
    const resizeHeight = ref(720);
    const maintainAspectRatio = ref(true);
    
    // Rename options
    const renamePattern = ref('');
    const prefixText = ref('');
    const suffixText = ref('');
    const convertToLowercase = ref(false);
    const replaceSpaces = ref(false);
    
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
    
    // Resize modal state
    const showResize = ref(false);
    const resizeImg = ref(null);
    const resizeIndex = ref(-1);
    const currentResizeMethod = ref('percentage');
    const singleResizePercentage = ref(100);
    const currentResizeWidth = ref(0);
    const currentResizeHeight = ref(0);
    const originalImageWidth = ref(0);
    const originalImageHeight = ref(0);
    const currentImageWidth = ref(0);
    const currentImageHeight = ref(0);
    const keepAspectRatio = ref(true);
    const originalAspectRatio = ref(1);
    
    const resizeMethods = [
      { id: 'percentage', name: 'Percentage' },
      { id: 'dimensions', name: 'Dimensions' }
    ];
    
    // Metadata state
    const showMetadata = ref(false);
    const metadataImg = ref(null);
    const metadataIndex = ref(-1);
    const currentMetadataFile = ref(null);
    const imageMetadata = ref({
      exif: {},
      gps: {},
      dimensions: null
    });
    const stripMetadataOnExport = ref(false);
    
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
    
    // Get format name
    const getFormatName = (mimeType) => {
      if (!mimeType) return 'Unknown';
      const format = mimeType.split('/')[1];
      return format.toUpperCase();
    };
    
    // Get thumbnail URL
    const getThumbnail = (file) => {
      if (thumbnails.value[file.name]) return thumbnails.value[file.name];
      const url = URL.createObjectURL(file);
      thumbnails.value[file.name] = url;
      return url;
    };
    
    // Watch for compression profile changes
    const setCompressionProfile = (profileId) => {
      const profile = compressionProfiles.find(p => p.id === profileId);
      if (profile) {
        currentProfile.value = profileId;
        quality.value = profile.quality;
        outputFormat.value = profile.format;
      }
    };
    
    // Handle file selection
    const handleFiles = async (event) => {
      const newFiles = Array.from(event.target.files || event.dataTransfer.files)
        .filter(file => file.type.startsWith('image/'));
      
      if (newFiles.length === 0) {
        error.value = 'Please select valid image files';
        return;
      }
      
      // Process each file to extract metadata
      for (const file of newFiles) {
        file.originalType = file.type;
        file.hasMetadata = false;
        
        try {
          // Create an image to get dimensions
          const imageUrl = URL.createObjectURL(file);
          const img = new Image();
          await new Promise((resolve) => {
            img.onload = () => {
              file.dimensions = {
                width: img.naturalWidth,
                height: img.naturalHeight
              };
              resolve();
            };
            img.onerror = resolve; // Continue even if error
            img.src = imageUrl;
          });
          
          // Try to extract EXIF metadata
          if (file.type === 'image/jpeg' || file.type === 'image/tiff') {
            const buffer = await file.arrayBuffer();
            try {
              const parser = (await getExifParser()).create(new Uint8Array(buffer));
              const result = parser.parse();
              if (result && (result.tags || result.gpsTags)) {
                file.metadata = {
                  exif: result.tags || {},
                  gps: result.gpsTags || {}
                };
                file.hasMetadata = true;
              }
            } catch (err) {
              console.warn('Unable to parse EXIF data:', err);
            }
          }
        } catch (err) {
          console.warn('Error processing image metadata:', err);
        }
      }
      
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
    
    // Format a filename according to patterns and options
    const formatFilename = (originalName, index) => {
      let filename = originalName;
      const extension = filename.substring(filename.lastIndexOf('.'));
      let nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
      
      // Apply pattern if exists
      if (renamePattern.value) {
        nameWithoutExt = renamePattern.value
          .replace('{number}', String(index + 1).padStart(2, '0'))
          .replace('{date}', new Date().toISOString().split('T')[0]);
      }
      
      // Apply prefix/suffix
      if (prefixText.value) {
        nameWithoutExt = prefixText.value + nameWithoutExt;
      }
      
      if (suffixText.value) {
        nameWithoutExt = nameWithoutExt + suffixText.value;
      }
      
      // Apply case conversion
      if (convertToLowercase.value) {
        nameWithoutExt = nameWithoutExt.toLowerCase();
      }
      
      // Replace spaces
      if (replaceSpaces.value) {
        nameWithoutExt = nameWithoutExt.replace(/\s+/g, '-');
      }
      
      return nameWithoutExt + extension;
    };
    
    // View and edit metadata
    const viewMetadata = (index) => {
      const file = files.value[index];
      if (!file) return;
      
      metadataIndex.value = index;
      metadataImg.value = getThumbnail(file);
      currentMetadataFile.value = file;
      
      // Set metadata info
      imageMetadata.value = {
        exif: file.metadata?.exif || {},
        gps: file.metadata?.gps || {},
        dimensions: file.dimensions || null
      };
      
      showMetadata.value = true;
    };
    
    const closeMetadata = () => {
      showMetadata.value = false;
      metadataIndex.value = -1;
      metadataImg.value = null;
      currentMetadataFile.value = null;
      imageMetadata.value = { exif: {}, gps: {}, dimensions: null };
    };
    
    // Format metadata keys and values for display
    const formatMetadataKey = (key) => {
      return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
    };
    
    const formatMetadataValue = (value) => {
      if (value === null || value === undefined) return 'N/A';
      if (typeof value === 'object') return JSON.stringify(value);
      if (typeof value === 'number' && key.toLowerCase().includes('date')) {
        return new Date(value * 1000).toLocaleString();
      }
      return value.toString();
    };
    
    // Open resize modal for a specific image
    const openResize = (index) => {
      const file = files.value[index];
      if (!file) return;
      
      resizeIndex.value = index;
      resizeImg.value = getThumbnail(file);
      
      // Set up initial dimensions
      if (file.dimensions) {
        originalImageWidth.value = file.dimensions.width;
        originalImageHeight.value = file.dimensions.height;
        currentImageWidth.value = file.dimensions.width;
        currentImageHeight.value = file.dimensions.height;
        currentResizeWidth.value = file.dimensions.width;
        currentResizeHeight.value = file.dimensions.height;
        originalAspectRatio.value = file.dimensions.width / file.dimensions.height;
      } else {
        // Default to 1:1 aspect ratio if dimensions unknown
        originalImageWidth.value = 1000;
        originalImageHeight.value = 1000;
        currentImageWidth.value = 1000;
        currentImageHeight.value = 1000;
        currentResizeWidth.value = 1000;
        currentResizeHeight.value = 1000;
        originalAspectRatio.value = 1;
      }
      
      singleResizePercentage.value = 100; // Reset to 100%
      showResize.value = true;
    };
    
    const closeResize = () => {
      showResize.value = false;
      resizeIndex.value = -1;
      resizeImg.value = null;
    };
    
    // Resize methods
    const setResizeMethod = (method) => {
      currentResizeMethod.value = method;
      
      // Reset dimensions when switching methods
      if (method === 'percentage') {
        singleResizePercentage.value = 100;
        updateResizePreview();
      } else if (method === 'dimensions') {
        currentResizeWidth.value = originalImageWidth.value;
        currentResizeHeight.value = originalImageHeight.value;
        updateResizePreview();
      }
    };
    
    const updateResizePreview = () => {
      if (currentResizeMethod.value === 'percentage') {
        const scale = singleResizePercentage.value / 100;
        currentImageWidth.value = Math.round(originalImageWidth.value * scale);
        currentImageHeight.value = Math.round(originalImageHeight.value * scale);
      } else {
        // Dimensions method is handled by updateResizeDimensions
        currentImageWidth.value = currentResizeWidth.value;
        currentImageHeight.value = currentResizeHeight.value;
      }
    };
    
    const updateResizeDimensions = (changedDimension) => {
      if (!keepAspectRatio.value) {
        // If not maintaining aspect ratio, just update the preview
        currentImageWidth.value = currentResizeWidth.value;
        currentImageHeight.value = currentResizeHeight.value;
        return;
      }
      
      // When maintaining aspect ratio, update the other dimension
      if (changedDimension === 'width') {
        const newHeight = Math.round(currentResizeWidth.value / originalAspectRatio.value);
        currentResizeHeight.value = newHeight;
        currentImageHeight.value = newHeight;
      } else {
        const newWidth = Math.round(currentResizeHeight.value * originalAspectRatio.value);
        currentResizeWidth.value = newWidth;
        currentImageWidth.value = newWidth;
      }
    };
    
    // Apply resize to the selected image
    const applyResize = async () => {
      if (resizeIndex.value < 0 || !files.value[resizeIndex.value]) {
        closeResize();
        return;
      }
      
      try {
        const file = files.value[resizeIndex.value];
        const img = new Image();
        
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = getThumbnail(file);
        });
        
        // Create canvas with new dimensions
        const canvas = document.createElement('canvas');
        canvas.width = currentImageWidth.value;
        canvas.height = currentImageHeight.value;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to blob
        const blob = await new Promise(resolve => {
          canvas.toBlob(resolve, file.type, 0.95);
        });
        
        if (!blob) {
          error.value = 'Failed to resize image';
          return;
        }
        
        // Replace the original file
        const originalType = file.originalType || file.type;
        const resizedFile = new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now()
        });
        
        resizedFile.originalType = originalType;
        
        // Update dimensions
        resizedFile.dimensions = {
          width: currentImageWidth.value,
          height: currentImageHeight.value
        };
        
        // Preserve metadata
        if (file.metadata) {
          resizedFile.metadata = file.metadata;
          resizedFile.hasMetadata = file.hasMetadata;
        }
        
        // Update thumbnail
        if (thumbnails.value[file.name]) {
          URL.revokeObjectURL(thumbnails.value[file.name]);
          delete thumbnails.value[file.name];
        }
        
        files.value.splice(resizeIndex.value, 1, resizedFile);
        thumbnails.value[resizedFile.name] = URL.createObjectURL(resizedFile);
        
        closeResize();
        success.value = 'Image resized successfully';
      } catch (err) {
        console.error('Error resizing:', err);
        error.value = 'Failed to resize image';
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
        
        // Update dimensions
        croppedFile.dimensions = {
          width: sourceWidth,
          height: sourceHeight
        };
        
        // Preserve metadata if it exists
        if (originalFile.metadata) {
          croppedFile.metadata = originalFile.metadata;
          croppedFile.hasMetadata = originalFile.hasMetadata;
        }
        
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
          
          // Determine output format
          let outputFileType = file.type;
          if (outputFormat.value !== 'original') {
            outputFileType = 'image/' + outputFormat.value;
          }
          
          // Quality setting from advanced options
          const qualitySetting = quality.value / 100;
          
          // Configure compression options
          const options = {
            maxSizeMB: parseFloat(maxSize.value),
            maxWidthOrHeight: 1920, // Default max dimension
            useWebWorker: true,
            quality: qualitySetting,
            fileType: outputFileType,
            onProgress: (p) => {
              const fileProgress = p / 100;
              const overall = (i + fileProgress) / files.value.length;
              progress.value = Math.round(overall * 100);
            }
          };
          
          // Apply resize if enabled
          if (resizeMode.value !== 'none') {
            if (resizeMode.value === 'percentage') {
              // Calculate max dimensions based on percentage
              const scale = resizePercentage.value / 100;
              if (file.dimensions) {
                options.maxWidthOrHeight = Math.max(
                  file.dimensions.width * scale,
                  file.dimensions.height * scale
                );
              }
            } else if (resizeMode.value === 'dimensions') {
              // Use custom dimensions
              options.maxWidthOrHeight = Math.max(resizeWidth.value, resizeHeight.value);
              
              // If maintaining aspect ratio, we'll handle special resize after compression
              options.maintainAspectRatio = maintainAspectRatio.value;
            }
          }
          
          try {
            let compressed = await compressor(file, options);
            
            // Handle metadata stripping/preservation
            if (file.hasMetadata && preserveMetadata.value) {
              // Approach for preserving metadata would depend on library
              // As a placeholder, we're just noting it would happen here
              console.log('Metadata preservation would happen here');
            }
            
            // Generate final filename with renaming patterns
            const filename = formatFilename(file.name, i);
            
            // Create final compressed file
            compressed = new File([compressed], filename, {
              type: compressed.type,
              lastModified: Date.now()
            });
            
            compressedFiles.value.push({
              file: compressed,
              name: filename,
              originalSize: file.size,
              compressedSize: compressed.size,
              type: compressed.type,
              originalType: file.originalType || file.type,
              url: URL.createObjectURL(compressed)
            });
            
            progress.value = Math.round(((i + 1) / files.value.length) * 100);
          } catch (err) {
            console.error(`Error compressing ${file.name}:`, err);
            
            compressedFiles.value.push({
              name: file.name,
              originalSize: file.size,
              originalType: file.originalType || file.type,
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
      link.download = `${name}.${ext}`;
      
      link.click();
    };
    
    const downloadAll = async () => {
      if (compressedFiles.value.length === 1) {
        download(0);
        return;
      }
      
      success.value = 'Downloading files...';
      
      // Check if browser supports a more efficient way than multiple downloads
      if (window.showSaveFilePicker && compressedFiles.value.length > 3) {
        try {
          // For browsers that support it, create a zip
          const JSZip = await import('jszip').then(m => m.default);
          const zip = new JSZip();
          
          for (let i = 0; i < compressedFiles.value.length; i++) {
            const file = compressedFiles.value[i];
            if (file.failed) continue;
            
            const fileData = await fetch(file.url).then(r => r.blob());
            const ext = file.type.split('/')[1];
            const name = file.name.substring(0, file.name.lastIndexOf('.'));
            zip.file(`${name}.${ext}`, fileData);
          }
          
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          const zipUrl = URL.createObjectURL(zipBlob);
          
          const link = document.createElement('a');
          link.href = zipUrl;
          link.download = 'compressed_images.zip';
          link.click();
          
          // Clean up
          setTimeout(() => URL.revokeObjectURL(zipUrl), 1000);
        } catch (err) {
          console.error('Failed to create zip, falling back to individual downloads', err);
          downloadIndividually();
        }
      } else {
        // Fall back to individual downloads
        downloadIndividually();
      }
    };
    
    const downloadIndividually = async () => {
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
      
      // Reset to default tab
      activeTab.value = 'basic';
      
      const fileInput = document.querySelector('.hidden');
      if (fileInput) fileInput.value = '';
    };
    
    // Set up and clean up
    onMounted(() => {
      document.addEventListener('dragover', e => e.preventDefault());
      
      // Check for browser support of advanced features
      try {
        // Check for AVIF support
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const supported = canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
        
        if (!supported) {
          console.log('AVIF is not supported in this browser');
        }
      } catch (e) {
        console.log('Error checking format support', e);
      }
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
      
      // Tab navigation
      activeTab,
      settingTabs,
      
      // Compression options
      quality,
      maxSize,
      outputFormat,
      preserveMetadata,
      currentProfile,
      compressionProfiles,
      
      // Resize options
      resizeMode,
      resizePercentage,
      resizeWidth,
      resizeHeight,
      maintainAspectRatio,
      
      // Rename options
      renamePattern,
      prefixText,
      suffixText,
      convertToLowercase,
      replaceSpaces,
      
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
      
      // Resize modal state
      showResize,
      resizeImg,
      resizeIndex,
      currentResizeMethod,
      resizeMethods,
      singleResizePercentage,
      currentResizeWidth,
      currentResizeHeight,
      currentImageWidth,
      currentImageHeight,
      keepAspectRatio,
      
      // Metadata state
      showMetadata,
      metadataImg,
      metadataIndex,
      currentMetadataFile,
      imageMetadata,
      stripMetadataOnExport,
      
      // Computed
      originalSize,
      compressedSize,
      reduction,
      
      // Functions
      formatSize,
      getFormatName,
      getThumbnail,
      handleFiles,
      handleDrop,
      removeFile,
      compress,
      download,
      downloadAll,
      downloadIndividually,
      reset,
      
      // Compression profile
      setCompressionProfile,
      
      // Crop functions
      openCrop,
      closeCrop,
      setRatio,
      applyCrop,
      initCrop,
      
      // Resize functions
      openResize,
      closeResize,
      setResizeMethod,
      updateResizePreview,
      updateResizeDimensions,
      applyResize,
      
      // Metadata functions
      viewMetadata,
      closeMetadata,
      formatMetadataKey,
      formatMetadataValue
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

.icon-btn.resize {
  background: rgba(16, 185, 129, 0.3);
  color: #34d399;
}

.icon-btn.resize:hover {
  background: rgba(16, 185, 129, 0.4);
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.section-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #f8fafc;
  margin: 0;
}

/* Tab Navigation */
.tabs {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.tab-btn {
  padding: 6px 12px;
  background: #334155;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: #cbd5e0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: #475569;
}

.tab-btn.active {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: white;
  box-shadow: 0 2px 6px rgba(14, 165, 233, 0.3);
}

.setting-content {
  margin-bottom: 16px;
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

.thumbnail-badge {
  position: absolute;
  bottom: 22px;
  right: 5px;
  background: rgba(16, 185, 129, 0.8);
  color: white;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
}

.thumbnail-badge:hover {
  background: #10b981;
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

.text-input {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #475569;
  font-size: 14px;
  color: #e2e8f0;
  background: #334155;
  outline: none;
  transition: border-color 0.2s ease;
}

.text-input:focus {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2);
}

.rename-hint {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 6px;
}

.prefix-suffix-container {
  display: flex;
  gap: 12px;
}

.setting-group.half {
  flex: 1;
}

/* Toggle Switch */
.toggle-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #e2e8f0;
}

.toggle-checkbox {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
  background: #475569;
  border-radius: 20px;
  margin-right: 10px;
  transition: all 0.2s ease;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  top: 2px;
  left: 2px;
  transition: all 0.2s ease;
}

.toggle-checkbox:checked + .toggle-switch {
  background: #0ea5e9;
}

.toggle-checkbox:checked + .toggle-switch::after {
  left: 18px;
}

/* Slider */
.slider-container {
  position: relative;
  width: 100%;
}

.slider {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #475569;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #0ea5e9;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(14, 165, 233, 0.3);
  transition: background 0.2s ease;
}

.slider::-webkit-slider-thumb:hover {
  background: #38bdf8;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 12px;
  color: #94a3b8;
}

/* Profile Buttons */
.profile-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.profile-btn {
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

.profile-btn:hover {
  background: #475569;
}

.profile-btn.active {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: white;
  box-shadow: 0 2px 6px rgba(14, 165, 233, 0.3);
}

/* Dimension Controls */
.dimension-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.dimension-group {
  flex: 1;
}

.dimension-input {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #475569;
  font-size: 14px;
  color: #e2e8f0;
  background: #334155;
  outline: none;
  transition: border-color 0.2s ease;
}

.dimension-input:focus {
  border-color: #0ea5e9;
}

.aspect-ratio-toggle {
  margin-top: 8px;
}

/* Methods Buttons */
.resize-method-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.method-btn {
  flex: 1;
  padding: 8px 0;
  background: #334155;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.method-btn:hover {
  background: #475569;
}

.method-btn.active {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: white;
  box-shadow: 0 2px 6px rgba(14, 165, 233, 0.3);
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

/* Resize Modal */
.resize-preview {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #0f172a;
  padding: 20px;
  border-radius: 8px;
}

.resize-preview-img {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
}

.image-dimensions {
  margin-top: 12px;
  font-size: 14px;
  color: #94a;
}
</style>