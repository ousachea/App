<template>
    <div :class="['min-h-screen p-4 md:p-8 transition-colors duration-300', darkMode ? 'bg-gray-900' : 'bg-gray-50']">
      <!-- Toast Notifications -->
      <transition name="toast">
        <div v-if="toast.show" :class="['fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2', toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white']">
          <svg v-if="toast.type === 'success'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          {{ toast.message }}
        </div>
      </transition>
  
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="flex justify-between items-center mb-4">
            <div class="flex-1"></div>
            <h1 :class="['text-3xl md:text-4xl font-light', darkMode ? 'text-white' : 'text-gray-900']">Image Compressor</h1>
            <div class="flex-1 flex justify-end">
              <button @click="toggleDarkMode" :class="['p-2 rounded-lg transition-colors', darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300']" title="Toggle dark mode">
                <svg v-if="darkMode" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
                </svg>
                <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              </button>
            </div>
          </div>
          <p :class="['text-sm md:text-base', darkMode ? 'text-gray-400' : 'text-gray-600']">Compress, resize, and optimize your images • Press Ctrl+V to paste</p>
        </div>
  
        <!-- Upload Area -->
        <div
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="$refs.fileInput.click()"
          :class="[
            'border-2 border-dashed rounded-lg p-8 md:p-12 text-center cursor-pointer transition-all',
            isDragging 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105' 
              : darkMode 
                ? 'border-gray-700 hover:border-gray-600 bg-gray-800' 
                : 'border-gray-300 hover:border-gray-400 bg-white'
          ]"
        >
          <input
            ref="fileInput"
            type="file"
            multiple
            accept="image/*"
            @change="handleFileSelect"
            class="hidden"
          />
          <div class="animate-bounce-slow">
            <svg :class="['w-12 h-12 md:w-16 md:h-16 mx-auto mb-4', darkMode ? 'text-gray-600' : 'text-gray-400']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p :class="['text-base md:text-lg mb-2', darkMode ? 'text-gray-300' : 'text-gray-700']">Drop images here or click to browse</p>
          <p :class="['text-xs md:text-sm', darkMode ? 'text-gray-500' : 'text-gray-500']">Supports JPG, PNG, WebP, GIF • Max 100MB per file</p>
        </div>
  
        <!-- Error Messages -->
        <transition-group name="fade" tag="div" class="mt-4 space-y-2">
          <div v-for="error in errors" :key="error.id" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex justify-between items-center">
            <span class="text-sm">{{ error.message }}</span>
            <button @click="removeError(error.id)" class="text-red-700 hover:text-red-900">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </transition-group>
  
        <!-- Processing Indicator -->
        <transition name="fade">
          <div v-if="isProcessing" :class="['mt-6 p-4 rounded-lg flex items-center gap-3', darkMode ? 'bg-gray-800' : 'bg-blue-50']">
            <div class="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
            <span :class="['text-sm', darkMode ? 'text-gray-300' : 'text-blue-700']">Processing {{ processingCount }} image{{ processingCount > 1 ? 's' : '' }}...</span>
          </div>
        </transition>
  
        <div v-if="images.length > 0" class="mt-8">
          <!-- Controls -->
          <div :class="['rounded-lg p-4 md:p-6 mb-6', darkMode ? 'bg-gray-800' : 'bg-white']">
            <!-- Quality Presets -->
            <div class="mb-6">
              <label :class="['block mb-3 text-sm font-medium', darkMode ? 'text-gray-300' : 'text-gray-700']">
                Quick Presets
              </label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="preset in presets"
                  :key="preset.value"
                  @click="applyPreset(preset.value)"
                  :class="[
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    quality === preset.value
                      ? 'bg-blue-600 text-white shadow-md'
                      : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  ]"
                >
                  {{ preset.name }}
                </button>
              </div>
            </div>
  
            <!-- Quality Slider -->
            <div class="mb-6">
              <div class="flex justify-between items-center mb-2">
                <label :class="['text-sm font-medium', darkMode ? 'text-gray-300' : 'text-gray-700']">
                  Quality: {{ Math.round(quality * 100) }}%
                </label>
                <button
                  @click="resetQuality"
                  :class="['text-xs px-3 py-1 rounded transition-colors', darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']"
                >
                  Reset
                </button>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                v-model.number="quality"
                @input="handleQualityChange"
                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
  
            <!-- Format Selection -->
            <div class="mb-6">
              <label :class="['block mb-2 text-sm font-medium', darkMode ? 'text-gray-300' : 'text-gray-700']">
                Output Format
              </label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="fmt in formats"
                  :key="fmt.value"
                  @click="outputFormat = fmt.value"
                  :class="[
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    outputFormat === fmt.value
                      ? 'bg-blue-600 text-white'
                      : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  ]"
                >
                  {{ fmt.name }}
                </button>
              </div>
            </div>
  
            <!-- Resize Options -->
            <div>
              <label :class="['block mb-2 text-sm font-medium', darkMode ? 'text-gray-300' : 'text-gray-700']">
                Resize (optional)
              </label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="size in resizeSizes"
                  :key="size.value"
                  @click="resizeOption = size.value"
                  :class="[
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    resizeOption === size.value
                      ? 'bg-blue-600 text-white'
                      : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  ]"
                >
                  {{ size.name }}
                </button>
              </div>
            </div>
          </div>
  
          <!-- Stats & Actions -->
          <div :class="['rounded-lg p-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4', darkMode ? 'bg-gray-800' : 'bg-white']">
            <div>
              <h2 :class="['text-lg md:text-xl font-medium mb-2', darkMode ? 'text-white' : 'text-gray-900']">
                {{ images.length }} {{ images.length === 1 ? 'Image' : 'Images' }}
              </h2>
              <div :class="['text-sm', darkMode ? 'text-gray-400' : 'text-gray-600']">
                <span class="font-medium text-green-600">{{ formatBytes(totalSaved) }} saved</span>
                <span class="mx-2">•</span>
                <span>{{ formatBytes(totalOriginalSize) }} → {{ formatBytes(totalCompressedSize) }}</span>
              </div>
            </div>
            <div class="flex flex-wrap gap-2 w-full md:w-auto">
              <button
                @click="clearAll"
                :class="['flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors', darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear All
              </button>
              <button
                @click="downloadAll"
                class="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download All
              </button>
            </div>
          </div>
  
          <!-- Image List -->
          <div class="space-y-4">
            <transition-group name="list">
              <div
                v-for="image in images"
                :key="image.id"
                :class="['rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center gap-4 transition-all', darkMode ? 'bg-gray-800' : 'bg-white']"
              >
                <!-- Image Preview with Comparison -->
                <div class="relative w-full md:w-32 h-32 flex-shrink-0">
                  <div v-if="image.showComparison" class="relative w-full h-full overflow-hidden rounded group">
                    <img
                      :src="image.original"
                      alt="Original"
                      class="absolute inset-0 w-full h-full object-cover"
                    />
                    <div 
                      class="absolute inset-0 overflow-hidden transition-all"
                      :style="{ width: comparisonPosition + '%' }"
                    >
                      <img
                        :src="image.compressed"
                        alt="Compressed"
                        class="absolute inset-0 w-full h-full object-cover"
                        :style="{ width: (10000 / comparisonPosition) + '%' }"
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      v-model="comparisonPosition"
                      class="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
                    />
                    <div 
                      class="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
                      :style="{ left: comparisonPosition + '%' }"
                    >
                      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                        <svg class="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                      </div>
                    </div>
                    <div class="absolute top-2 left-2 text-xs bg-black bg-opacity-75 text-white px-2 py-1 rounded">Before</div>
                    <div class="absolute top-2 right-2 text-xs bg-black bg-opacity-75 text-white px-2 py-1 rounded">After</div>
                  </div>
                  <img
                    v-else
                    :src="image.compressed"
                    :alt="image.name"
                    class="w-full h-full object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                    @click="toggleComparison(image.id)"
                  />
                  <button
                    @click="toggleComparison(image.id)"
                    :class="['absolute bottom-2 right-2 p-1.5 rounded-full text-xs transition-all', darkMode ? 'bg-gray-900 bg-opacity-75 text-white hover:bg-opacity-90' : 'bg-white bg-opacity-75 text-gray-700 hover:bg-opacity-90']"
                    title="Toggle comparison"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
  
                <!-- Image Info -->
                <div class="flex-1 w-full">
                  <h3 :class="['font-medium mb-1 text-sm md:text-base break-all', darkMode ? 'text-white' : 'text-gray-900']">{{ image.name }}</h3>
                  <div class="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm">
                    <span :class="darkMode ? 'text-gray-400' : 'text-gray-600'">
                      {{ formatBytes(image.originalSize) }} → {{ formatBytes(image.compressedSize) }}
                    </span>
                    <span class="text-green-600 font-medium">-{{ image.savings }}%</span>
                    <span :class="darkMode ? 'text-gray-500' : 'text-gray-500'">{{ image.dimensions }}</span>
                  </div>
                </div>
  
                <!-- Actions -->
                <div class="flex gap-2 w-full md:w-auto">
                  <button
                    @click="downloadImage(image)"
                    :class="['flex-1 md:flex-none p-2 rounded-lg transition-colors', darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-blue-50']"
                    title="Download (D)"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <button
                    @click="removeImage(image.id)"
                    :class="['flex-1 md:flex-none p-2 rounded-lg transition-colors', darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50']"
                    title="Remove (Delete)"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </transition-group>
          </div>
        </div>
  
        <!-- Keyboard Shortcuts Help -->
        <div :class="['mt-8 p-4 rounded-lg text-xs', darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600']">
          <p class="font-medium mb-2">Keyboard Shortcuts:</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div><kbd class="px-2 py-1 bg-gray-700 text-white rounded">Ctrl+V</kbd> Paste images</div>
            <div><kbd class="px-2 py-1 bg-gray-700 text-white rounded">Ctrl+D</kbd> Download all</div>
            <div><kbd class="px-2 py-1 bg-gray-700 text-white rounded">Ctrl+Shift+C</kbd> Clear all</div>
            <div><kbd class="px-2 py-1 bg-gray-700 text-white rounded">Ctrl+Shift+D</kbd> Toggle dark mode</div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ImageCompressor',
    data() {
      return {
        images: [],
        quality: 0.8,
        originalQuality: 0.8,
        outputFormat: 'auto',
        resizeOption: null,
        targetSize: null,
        isDragging: false,
        isProcessing: false,
        processingCount: 0,
        darkMode: false,
        comparisonPosition: 50,
        toast: {
          show: false,
          message: '',
          type: 'success'
        },
        errors: [],
        presets: [
          { name: 'High', value: 0.9 },
          { name: 'Medium', value: 0.7 },
          { name: 'Low', value: 0.5 }
        ],
        formats: [
          { name: 'Auto', value: 'auto' },
          { name: 'JPEG', value: 'image/jpeg' },
          { name: 'PNG', value: 'image/png' },
          { name: 'WebP', value: 'image/webp' }
        ],
        resizeSizes: [
          { name: 'Original', value: null },
          { name: '1920px', value: 1920 },
          { name: '1280px', value: 1280 },
          { name: '800px', value: 800 }
        ]
      }
    },
    computed: {
      totalOriginalSize() {
        return this.images.reduce((sum, img) => sum + img.originalSize, 0)
      },
      totalCompressedSize() {
        return this.images.reduce((sum, img) => sum + img.compressedSize, 0)
      },
      totalSaved() {
        return this.totalOriginalSize - this.totalCompressedSize
      }
    },
    mounted() {
      document.addEventListener('keydown', this.handleKeyboardShortcuts)
      document.addEventListener('paste', this.handlePaste)
      
      // Load dark mode preference
      const savedDarkMode = localStorage.getItem('darkMode')
      if (savedDarkMode !== null) {
        this.darkMode = savedDarkMode === 'true'
      }
    },
    beforeDestroy() {
      document.removeEventListener('keydown', this.handleKeyboardShortcuts)
      document.removeEventListener('paste', this.handlePaste)
    },
    methods: {
      handleDrop(e) {
        this.isDragging = false
        const files = Array.from(e.dataTransfer.files).filter(file => 
          file.type.startsWith('image/')
        )
        
        if (files.length === 0) {
          this.showToast('No valid image files found', 'error')
          return
        }
        
        this.processFiles(files)
      },
      handleFileSelect(e) {
        const files = Array.from(e.target.files)
        this.processFiles(files)
        e.target.value = ''
      },
      handlePaste(e) {
        const items = e.clipboardData?.items
        if (!items) return
        
        const files = []
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith('image/')) {
            files.push(items[i].getAsFile())
          }
        }
        
        if (files.length > 0) {
          e.preventDefault()
          this.processFiles(files)
          this.showToast(`${files.length} image${files.length > 1 ? 's' : ''} pasted`, 'success')
        }
      },
      processFiles(files) {
        const maxSize = 100 * 1024 * 1024 // 100MB
        
        files.forEach(file => {
          if (file.size > maxSize) {
            this.addError(`${file.name} is too large (max 100MB)`)
            return
          }
          
          this.isProcessing = true
          this.processingCount++
          
          const reader = new FileReader()
          reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
              this.compressImage(img, file, e.target.result)
            }
            img.onerror = () => {
              this.addError(`Failed to load ${file.name}`)
              this.processingCount--
              if (this.processingCount === 0) this.isProcessing = false
            }
            img.src = e.target.result
          }
          reader.onerror = () => {
            this.addError(`Failed to read ${file.name}`)
            this.processingCount--
            if (this.processingCount === 0) this.isProcessing = false
          }
          reader.readAsDataURL(file)
        })
      },
      compressImage(img, file, originalDataUrl) {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // Apply resize if selected
        if (this.resizeOption && width > this.resizeOption) {
          height = (height * this.resizeOption) / width
          width = this.resizeOption
        }
        
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        const format = this.outputFormat === 'auto' ? file.type : this.outputFormat
        
        canvas.toBlob((blob) => {
          const originalSize = file.size
          const compressedSize = blob.size
          const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1)
          
          this.images.push({
            id: Date.now() + Math.random(),
            name: file.name,
            original: originalDataUrl,
            compressed: URL.createObjectURL(blob),
            originalSize,
            compressedSize,
            savings,
            dimensions: `${Math.round(width)}×${Math.round(height)}`,
            blob,
            showComparison: false
          })
          
          this.processingCount--
          if (this.processingCount === 0) {
            this.isProcessing = false
            this.showToast(`${this.images.length} image${this.images.length > 1 ? 's' : ''} compressed`, 'success')
          }
        }, format, this.quality)
      },
      handleQualityChange() {
        if (this.images.length > 0) {
          this.recompressAll()
        }
      },
      recompressAll() {
        this.images.forEach(image => {
          const img = new Image()
          img.onload = () => {
            const canvas = document.createElement('canvas')
            let width = img.width
            let height = img.height
            
            if (this.resizeOption && width > this.resizeOption) {
              height = (height * this.resizeOption) / width
              width = this.resizeOption
            }
            
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, width, height)
            
            const format = this.outputFormat === 'auto' ? 'image/jpeg' : this.outputFormat
            
            canvas.toBlob((blob) => {
              const compressedSize = blob.size
              const savings = ((1 - compressedSize / image.originalSize) * 100).toFixed(1)
              
              const index = this.images.findIndex(img => img.id === image.id)
              if (index !== -1) {
                this.$set(this.images, index, {
                  ...this.images[index],
                  compressed: URL.createObjectURL(blob),
                  compressedSize,
                  savings,
                  dimensions: `${Math.round(width)}×${Math.round(height)}`,
                  blob
                })
              }
            }, format, this.quality)
          }
          img.src = image.original
        })
      },
      applyPreset(value) {
        this.quality = value
        this.handleQualityChange()
      },
      resetQuality() {
        this.quality = this.originalQuality
        this.handleQualityChange()
      },
      downloadImage(image) {
        const a = document.createElement('a')
        a.href = image.compressed
        a.download = `compressed_${image.name}`
        a.click()
        this.showToast('Image downloaded', 'success')
      },
      downloadAll() {
        if (this.images.length === 0) return
        
        this.images.forEach((image, index) => {
          setTimeout(() => {
            this.downloadImage(image)
          }, index * 100)
        })
        this.showToast(`Downloading ${this.images.length} images`, 'success')
      },
      removeImage(id) {
        this.images = this.images.filter(img => img.id !== id)
        if (this.images.length === 0) {
          this.showToast('All images removed', 'success')
        }
      },
      clearAll() {
        if (this.images.length === 0) return
        
        if (confirm(`Clear all ${this.images.length} images?`)) {
          this.images = []
          this.showToast('All images cleared', 'success')
        }
      },
      toggleComparison(id) {
        const index = this.images.findIndex(img => img.id === id)
        if (index !== -1) {
          this.$set(this.images[index], 'showComparison', !this.images[index].showComparison)
          this.comparisonPosition = 50
        }
      },
      toggleDarkMode() {
        this.darkMode = !this.darkMode
        localStorage.setItem('darkMode', this.darkMode)
      },
      showToast(message, type = 'success') {
        this.toast = { show: true, message, type }
        setTimeout(() => {
          this.toast.show = false
        }, 3000)
      },
      addError(message) {
        const id = Date.now()
        this.errors.push({ id, message })
        setTimeout(() => {
          this.removeError(id)
        }, 5000)
      },
      removeError(id) {
        this.errors = this.errors.filter(err => err.id !== id)
      },
      handleKeyboardShortcuts(e) {
        // Ctrl+D - Download all
        if (e.ctrlKey && e.key === 'd') {
          e.preventDefault()
          this.downloadAll()
        }
        // Ctrl+Shift+C - Clear all
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
          e.preventDefault()
          this.clearAll()
        }
        // Ctrl+Shift+D - Toggle dark mode
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
          e.preventDefault()
          this.toggleDarkMode()
        }
      },
      formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
      }
    }
  }
  </script>
  
  <style>
  @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
  
  * {
    box-sizing: border-box;
  }
  
  /* Slider Styles */
  input[type="range"].slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #2563eb;
    cursor: pointer;
    transition: transform 0.2s;
  }
  
  input[type="range"].slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }
  
  input[type="range"].slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #2563eb;
    cursor: pointer;
    border: none;
    transition: transform 0.2s;
  }
  
  input[type="range"].slider::-moz-range-thumb:hover {
    transform: scale(1.2);
  }
  
  /* Dark Mode Slider */
  .dark input[type="range"].slider::-webkit-slider-thumb {
    background: #3b82f6;
  }
  
  .dark input[type="range"].slider::-moz-range-thumb {
    background: #3b82f6;
  }
  
  /* Animations */
  @keyframes bounce-slow {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  
  .animate-bounce-slow {
    animation: bounce-slow 3s ease-in-out infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  /* Transitions */
  .toast-enter-active, .toast-leave-active {
    transition: all 0.3s ease;
  }
  
  .toast-enter, .toast-leave-to {
    opacity: 0;
    transform: translateY(-20px);
  }
  
  .fade-enter-active, .fade-leave-active {
    transition: all 0.3s ease;
  }
  
  .fade-enter, .fade-leave-to {
    opacity: 0;
  }
  
  .list-enter-active, .list-leave-active {
    transition: all 0.3s ease;
  }
  
  .list-enter, .list-leave-to {
    opacity: 0;
    transform: translateX(-30px);
  }
  
  .list-move {
    transition: transform 0.3s ease;
  }
  
  /* Utility Classes */
  .hidden {
    display: none;
  }
  
  .min-h-screen {
    min-height: 100vh;
  }
  
  .bg-gray-50 {
    background-color: #f9fafb;
  }
  
  .bg-gray-100 {
    background-color: #f3f4f6;
  }
  
  .bg-gray-200 {
    background-color: #e5e7eb;
  }
  
  .bg-gray-700 {
    background-color: #374151;
  }
  
  .bg-gray-800 {
    background-color: #1f2937;
  }
  
  .bg-gray-900 {
    background-color: #111827;
  }
  
  .bg-white {
    background-color: #ffffff;
  }
  
  .bg-blue-50 {
    background-color: #eff6ff;
  }
  
  .bg-blue-600 {
    background-color: #2563eb;
  }
  
  .bg-blue-700 {
    background-color: #1d4ed8;
  }
  
  .bg-red-50 {
    background-color: #fef2f2;
  }
  
  .bg-red-100 {
    background-color: #fee2e2;
  }
  
  .bg-red-500 {
    background-color: #ef4444;
  }
  
  .bg-red-600 {
    background-color: #dc2626;
  }
  
  .bg-green-500 {
    background-color: #22c55e;
  }
  
  .bg-green-600 {
    background-color: #16a34a;
  }
  
  .bg-yellow-400 {
    background-color: #facc15;
  }
  
  .bg-black {
    background-color: #000000;
  }
  
  .bg-opacity-75 {
    background-color: rgba(0, 0, 0, 0.75);
  }
  
  .bg-opacity-90 {
    background-color: rgba(0, 0, 0, 0.9);
  }
  
  .hover\:bg-gray-200:hover {
    background-color: #e5e7eb;
  }
  
  .hover\:bg-gray-300:hover {
    background-color: #d1d5db;
  }
  
  .hover\:bg-gray-600:hover {
    background-color: #4b5563;
  }
  
  .hover\:bg-gray-700:hover {
    background-color: #374151;
  }
  
  .hover\:bg-blue-50:hover {
    background-color: #eff6ff;
  }
  
  .hover\:bg-blue-700:hover {
    background-color: #1d4ed8;
  }
  
  .hover\:bg-red-50:hover {
    background-color: #fef2f2;
  }
  
  .hover\:bg-opacity-90:hover {
    background-color: rgba(0, 0, 0, 0.9);
  }
  
  .text-white {
    color: #ffffff;
  }
  
  .text-gray-300 {
    color: #d1d5db;
  }
  
  .text-gray-400 {
    color: #9ca3af;
  }
  
  .text-gray-500 {
    color: #6b7280;
  }
  
  .text-gray-600 {
    color: #4b5563;
  }
  
  .text-gray-700 {
    color: #374151;
  }
  
  .text-gray-900 {
    color: #111827;
  }
  
  .text-blue-400 {
    color: #60a5fa;
  }
  
  .text-blue-600 {
    color: #2563eb;
  }
  
  .text-blue-700 {
    color: #1d4ed8;
  }
  
  .text-red-400 {
    color: #f87171;
  }
  
  .text-red-600 {
    color: #dc2626;
  }
  
  .text-red-700 {
    color: #b91c1c;
  }
  
  .text-red-900 {
    color: #7f1d1d;
  }
  
  .text-green-600 {
    color: #16a34a;
  }
  
  .text-yellow-400 {
    color: #facc15;
  }
  
  .hover\:text-red-900:hover {
    color: #7f1d1d;
  }
  
  .border {
    border-width: 1px;
  }
  
  .border-2 {
    border-width: 2px;
  }
  
  .border-dashed {
    border-style: dashed;
  }
  
  .border-gray-300 {
    border-color: #d1d5db;
  }
  
  .border-gray-700 {
    border-color: #374151;
  }
  
  .border-blue-500 {
    border-color: #3b82f6;
  }
  
  .border-red-400 {
    border-color: #f87171;
  }
  
  .hover\:border-gray-400:hover {
    border-color: #9ca3af;
  }
  
  .hover\:border-gray-600:hover {
    border-color: #4b5563;
  }
  
  .rounded {
    border-radius: 0.25rem;
  }
  
  .rounded-lg {
    border-radius: 0.5rem;
  }
  
  .rounded-full {
    border-radius: 9999px;
  }
  
  .p-1 {
    padding: 0.25rem;
  }
  
  .p-2 {
    padding: 0.5rem;
  }
  
  .p-4 {
    padding: 1rem;
  }
  
  .p-8 {
    padding: 2rem;
  }
  
  .p-12 {
    padding: 3rem;
  }
  
  .px-2 {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
  
  .px-3 {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
  
  .px-4 {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .px-6 {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  
  .py-1 {
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
  }
  
  .py-2 {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }
  
  .py-3 {
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
  }
  
  .m-0 {
    margin: 0;
  }
  
  .mb-1 {
    margin-bottom: 0.25rem;
  }
  
  .mb-2 {
    margin-bottom: 0.5rem;
  }
  
  .mb-3 {
    margin-bottom: 0.75rem;
  }
  
  .mb-4 {
    margin-bottom: 1rem;
  }
  
  .mb-6 {
    margin-bottom: 1.5rem;
  }
  
  .mb-8 {
    margin-bottom: 2rem;
  }
  
  .mt-4 {
    margin-top: 1rem;
  }
  
  .mt-6 {
    margin-top: 1.5rem;
  }
  
  .mt-8 {
    margin-top: 2rem;
  }
  
  .mx-2 {
    margin-left: 0.5rem;
    margin-right: 0.5rem;
  }
  
  .mx-auto {
    margin-left: auto;
    margin-right: auto;
  }
  
  .max-w-6xl {
    max-width: 72rem;
  }
  
  .w-4 {
    width: 1rem;
  }
  
  .w-5 {
    width: 1.25rem;
  }
  
  .w-8 {
    width: 2rem;
  }
  
  .w-12 {
    width: 3rem;
  }
  
  .w-16 {
    width: 4rem;
  }
  
  .w-20 {
    width: 5rem;
  }
  
  .w-32 {
    width: 8rem;
  }
  
  .w-full {
    width: 100%;
  }
  
  .w-0\.5 {
    width: 0.125rem;
  }
  
  .h-2 {
    height: 0.5rem;
  }
  
  .h-4 {
    height: 1rem;
  }
  
  .h-5 {
    height: 1.25rem;
  }
  
  .h-8 {
    height: 2rem;
  }
  
  .h-12 {
    height: 3rem;
  }
  
  .h-16 {
    height: 4rem;
  }
  
  .h-20 {
    height: 5rem;
  }
  
  .h-32 {
    height: 8rem;
  }
  
  .h-full {
    height: 100%;
  }
  
  .text-xs {
    font-size: 0.75rem;
    line-height: 1rem;
  }
  
  .text-sm {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }
  
  .text-base {
    font-size: 1rem;
    line-height: 1.5rem;
  }
  
  .text-lg {
    font-size: 1.125rem;
    line-height: 1.75rem;
  }
  
  .text-xl {
    font-size: 1.25rem;
    line-height: 1.75rem;
  }
  
  .text-3xl {
    font-size: 1.875rem;
    line-height: 2.25rem;
  }
  
  .text-4xl {
    font-size: 2.25rem;
    line-height: 2.5rem;
  }
  
  .font-light {
    font-weight: 300;
  }
  
  .font-medium {
    font-weight: 500;
  }
  
  .text-center {
    text-align: center;
  }
  
  .flex {
    display: flex;
  }
  
  .flex-row {
    flex-direction: row;
  }
  
  .flex-col {
    flex-direction: column;
  }
  
  .flex-wrap {
    flex-wrap: wrap;
  }
  
  .items-start {
    align-items: flex-start;
  }
  
  .items-center {
    align-items: center;
  }
  
  .justify-start {
    justify-content: flex-start;
  }
  
  .justify-end {
    justify-content: flex-end;
  }
  
  .justify-center {
    justify-content: center;
  }
  
  .justify-between {
    justify-content: space-between;
  }
  
  .gap-2 {
    gap: 0.5rem;
  }
  
  .gap-3 {
    gap: 0.75rem;
  }
  
  .gap-4 {
    gap: 1rem;
  }
  
  .flex-1 {
    flex: 1 1 0%;
  }
  
  .flex-shrink-0 {
    flex-shrink: 0;
  }
  
  .cursor-pointer {
    cursor: pointer;
  }
  
  .cursor-ew-resize {
    cursor: ew-resize;
  }
  
  .transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
  }
  
  .transition-colors {
    transition-property: color, background-color, border-color;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
  }
  
  .transition-opacity {
    transition-property: opacity;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
  }
  
  .duration-300 {
    transition-duration: 300ms;
  }
  
  .hover\:opacity-90:hover {
    opacity: 0.9;
  }
  
  .scale-105 {
    transform: scale(1.05);
  }
  
  .transform {
    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
  }
  
  .-translate-x-1\/2 {
    --tw-translate-x: -50%;
  }
  
  .-translate-y-1\/2 {
    --tw-translate-y: -50%;
  }
  
  .appearance-none {
    appearance: none;
  }
  
  .block {
    display: block;
  }
  
  .relative {
    position: relative;
  }
  
  .absolute {
    position: absolute;
  }
  
  .fixed {
    position: fixed;
  }
  
  .inset-0 {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
  
  .top-0 {
    top: 0;
  }
  
  .top-1\/2 {
    top: 50%;
  }
  
  .top-2 {
    top: 0.5rem;
  }
  
  .top-4 {
    top: 1rem;
  }
  
  .right-2 {
    right: 0.5rem;
  }
  
  .right-4 {
    right: 1rem;
  }
  
  .bottom-0 {
    bottom: 0;
  }
  
  .bottom-2 {
    bottom: 0.5rem;
  }
  
  .left-0 {
    left: 0;
  }
  
  .left-2 {
    left: 0.5rem;
  }
  
  .left-1\/2 {
    left: 50%;
  }
  
  .z-10 {
    z-index: 10;
  }
  
  .z-50 {
    z-index: 50;
  }
  
  .opacity-0 {
    opacity: 0;
  }
  
  .shadow-lg {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
  
  .shadow-md {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  .overflow-hidden {
    overflow: hidden;
  }
  
  .object-cover {
    object-fit: cover;
  }
  
  .space-y-2 > :not([hidden]) ~ :not([hidden]) {
    margin-top: 0.5rem;
  }
  
  .space-y-4 > :not([hidden]) ~ :not([hidden]) {
    margin-top: 1rem;
  }
  
  .break-all {
    word-break: break-all;
  }
  
  .pointer-events-none {
    pointer-events: none;
  }
  
  .grid {
    display: grid;
  }
  
  .grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  
  kbd {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-family: monospace;
    border-radius: 0.25rem;
  }
  
  /* Responsive */
  @media (min-width: 768px) {
    .md\:p-6 {
      padding: 1.5rem;
    }
    
    .md\:p-8 {
      padding: 2rem;
    }
    
    .md\:p-12 {
      padding: 3rem;
    }
    
    .md\:w-16 {
      width: 4rem;
    }
    
    .md\:w-32 {
      width: 8rem;
    }
    
    .md\:w-auto {
      width: auto;
    }
    
    .md\:h-16 {
      height: 4rem;
    }
    
    .md\:text-sm {
      font-size: 0.875rem;
    }
    
    .md\:text-base {
      font-size: 1rem;
    }
    
    .md\:text-xl {
      font-size: 1.25rem;
    }
    
    .md\:text-4xl {
      font-size: 2.25rem;
    }
    
    .md\:flex-row {
      flex-direction: row;
    }
    
    .md\:items-center {
      align-items: center;
    }
    
    .md\:gap-4 {
      gap: 1rem;
    }
    
    .md\:flex-none {
      flex: none;
    }
    
    .md\:grid-cols-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  
  .group:hover .group-hover\:opacity-100 {
    opacity: 1;
  }
  
  .dark .dark\:bg-blue-900\/20 {
    background-color: rgba(30, 58, 138, 0.2);
  }
  </style>