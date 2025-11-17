<template>
  <div class="min-h-screen p-6 md:p-10 bg-gray-50">
    <!-- Toast Notifications -->
    <transition name="toast">
      <div v-if="toast.show" :class="['fixed top-6 right-6 px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3', toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white']">
        <svg v-if="toast.type === 'success'" class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <svg v-else class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <span class="font-medium">{{ toast.message }}</span>
      </div>
    </transition>

    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-10">

        <h1 class="text-5xl font-bold text-gray-900 mb-3">Image Compressor</h1>
        <p class="text-lg text-gray-600 mb-3">Compress, resize, and optimize your images</p>
        <p class="text-sm text-gray-500">Tip: Press <kbd class="px-2.5 py-1 bg-gray-200 text-gray-800 rounded font-semibold text-xs mx-1 inline-block">Ctrl+V</kbd> to paste images directly</p>
      </div>

      <!-- Upload Area -->
      <div
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @click="$refs.fileInput.click()"
        :class="[
          'border-2 border-dashed rounded-2xl p-14 md:p-16 text-center cursor-pointer transition-all duration-200 mb-10',
          isDragging 
            ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 bg-white'
        ]"
      >
        <input ref="fileInput" type="file" multiple accept="image/*" @change="handleFileSelect" class="hidden" />
        <div class="animate-bounce-slow mb-6">
          <svg class="w-20 h-20 mx-auto text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-2">Drop images here</p>
        <p class="text-base text-gray-600 mb-4">or click to browse your computer</p>
        <p class="text-sm text-gray-500 font-medium">JPG, PNG, WebP, GIF • Up to 100MB each</p>
      </div>

      <!-- Error Messages -->
      <transition-group name="fade" tag="div" class="mb-6 space-y-3">
        <div v-for="error in errors" :key="error.id" class="bg-red-50 border-l-4 border-red-500 text-red-700 px-5 py-4 rounded flex justify-between items-center">
          <span class="font-medium">{{ error.message }}</span>
          <button @click="removeError(error.id)" class="text-red-500 hover:text-red-700 ml-4">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </transition-group>

      <!-- Processing Indicator -->
      <transition name="fade">
        <div v-if="isProcessing" class="mb-6 p-5 rounded-lg bg-blue-50 border border-blue-200">
          <div class="flex items-center gap-4 mb-3">
            <div class="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
            <span class="text-blue-700 font-semibold">Processing {{ processingCount }} image{{ processingCount > 1 ? 's' : '' }}...</span>
          </div>
          <div class="w-full h-3 rounded-full overflow-hidden bg-blue-100">
            <div class="h-full bg-blue-600 transition-all duration-300" :style="{ width: processingProgress + '%' }"></div>
          </div>
        </div>
      </transition>

      <div v-if="images.length > 0" class="space-y-6">
        <!-- Controls Panel -->
        <div class="rounded-xl p-8 bg-white shadow-sm border border-gray-200">
          <!-- Quality Presets -->
          <div class="mb-8">
            <h3 class="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Quality Presets</h3>
            <div class="flex flex-wrap gap-3">
              <button
                v-for="preset in presets"
                :key="preset.value"
                @click="applyPreset(preset.value)"
                :class="[
                  'px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200',
                  quality === preset.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
              >
                {{ preset.name }}
              </button>
            </div>
          </div>

          <!-- Quality Slider -->
          <div class="mb-8 pb-8 border-b border-gray-200">
            <div class="flex justify-between items-center mb-4">
              <label class="text-sm font-bold text-gray-900">
                Quality Level
              </label>
              <div class="flex items-center gap-3">
                <span class="text-2xl font-bold text-blue-600">{{ Math.round(quality * 100) }}%</span>
                <button
                  @click="resetQuality"
                  class="text-xs px-4 py-2 rounded-lg font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              v-model.number="quality"
              @input="handleQualityChange"
              class="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div class="flex justify-between text-xs text-gray-500 mt-2 font-medium">
              <span>Low (Smaller)</span>
              <span>High (Better Quality)</span>
            </div>
          </div>

          <!-- Format Selection -->
          <div class="mb-8 pb-8 border-b border-gray-200">
            <h3 class="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Output Format</h3>
            <div class="flex flex-wrap gap-3">
              <button
                v-for="fmt in formats"
                :key="fmt.value"
                @click="outputFormat = fmt.value; recompressAll()"
                :class="[
                  'px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200',
                  outputFormat === fmt.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
              >
                {{ fmt.name }}
              </button>
            </div>
          </div>

          <!-- Resize Options -->
          <div>
            <h3 class="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Resize (Optional)</h3>
            <div class="flex flex-wrap gap-3">
              <button
                v-for="size in resizeSizes"
                :key="size.value"
                @click="resizeOption = size.value; recompressAll()"
                :class="[
                  'px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200',
                  resizeOption === size.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
              >
                {{ size.name }}
              </button>
            </div>
          </div>
        </div>

        <!-- Stats & Actions -->
        <div class="rounded-xl p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 class="text-3xl font-bold text-gray-900 mb-2">
                {{ images.length }} {{ images.length === 1 ? 'Image' : 'Images' }}
              </h2>
              <div class="space-y-1">
                <div class="text-lg font-bold text-green-600">
                  💾 {{ formatBytes(totalSaved) }} saved
                </div>
                <div class="text-sm text-gray-600">
                  {{ formatBytes(totalOriginalSize) }} → {{ formatBytes(totalCompressedSize) }}
                </div>
              </div>
            </div>
            <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button
                @click="clearAll"
                class="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear
              </button>
              <button
                @click="downloadAll"
                class="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download All
              </button>
            </div>
          </div>
        </div>

        <!-- Image List -->
        <div class="space-y-3">
          <transition-group name="list">
            <div
              v-for="image in images"
              :key="image.id"
              class="rounded-xl p-6 bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start sm:items-center gap-6"
            >
              <!-- Image Preview -->
              <div class="w-full sm:w-24 h-24 flex-shrink-0">
                <img
                  :src="image.compressed"
                  :alt="image.name"
                  class="w-full h-full object-cover rounded-lg"
                />
              </div>

              <!-- Image Info -->
              <div class="flex-1 w-full min-w-0">
                <h3 class="font-bold text-gray-900 mb-2 truncate text-base">{{ image.name }}</h3>
                <div class="space-y-2">
                  <div class="flex flex-wrap gap-4 text-sm font-medium">
                    <div class="text-gray-600">{{ formatBytes(image.originalSize) }} → {{ formatBytes(image.compressedSize) }}</div>
                    <div class="text-green-600">-{{ image.savings }}%</div>
                    <div class="text-gray-500">{{ image.dimensions }}</div>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-3 w-full sm:w-auto">
                <button
                  @click="downloadImage(image)"
                  class="flex-1 sm:flex-none p-3 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-semibold text-sm"
                  title="Download"
                >
                  <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
                <button
                  @click="removeImage(image.id)"
                  class="flex-1 sm:flex-none p-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-semibold text-sm"
                  title="Remove"
                >
                  <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </transition-group>
        </div>
      </div>

      <!-- Keyboard Shortcuts Help -->
      <div class="mt-10 p-6 rounded-xl bg-gray-800 text-gray-300 text-sm">
        <p class="font-bold text-white mb-4">⌨️ Keyboard Shortcuts</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="flex items-center gap-3"><kbd class="px-3 py-1 bg-gray-700 text-white rounded font-mono font-bold">Ctrl+V</kbd> <span>Paste images</span></div>
          <div class="flex items-center gap-3"><kbd class="px-3 py-1 bg-gray-700 text-white rounded font-mono font-bold">Ctrl+D</kbd> <span>Download all</span></div>
          <div class="flex items-center gap-3"><kbd class="px-3 py-1 bg-gray-700 text-white rounded font-mono font-bold">Ctrl+Shift+C</kbd> <span>Clear all</span></div>
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
      isDragging: false,
      isProcessing: false,
      processingCount: 0,
      processingProgress: 0,
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
      ],
      imageCache: new Map()
    }
  },
  computed: {
    totalOriginalSize() {
      return this.images.reduce((sum, img) => sum + (img.originalSize || 0), 0)
    },
    totalCompressedSize() {
      return this.images.reduce((sum, img) => sum + (img.compressedSize || 0), 0)
    },
    totalSaved() {
      return Math.max(0, this.totalOriginalSize - this.totalCompressedSize)
    }
  },
  mounted() {
    document.addEventListener('keydown', this.handleKeyboardShortcuts)
    document.addEventListener('paste', this.handlePaste)
    this.loadSettings()
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeyboardShortcuts)
    document.removeEventListener('paste', this.handlePaste)
    this.images.forEach(img => {
      if (img.compressed) URL.revokeObjectURL(img.compressed)
      if (img.original && img.original.startsWith('blob:')) URL.revokeObjectURL(img.original)
    })
  },
  methods: {
    handleDrop(e) {
      this.isDragging = false
      const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'))
      if (files.length === 0) {
        this.showToast('No valid image files found', 'error')
        return
      }
      this.processFiles(files)
    },
    handleFileSelect(e) {
      const files = Array.from(e.target.files || [])
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
      const maxSize = 100 * 1024 * 1024
      files.forEach(file => {
        if (!file || !file.type) {
          this.addError('Invalid file detected')
          return
        }
        if (file.size > maxSize) {
          this.addError(`${file.name} is too large (max 100MB)`)
          return
        }
        this.isProcessing = true
        this.processingCount++
        this.updateProgress()
        const reader = new FileReader()
        reader.onload = (e) => {
          if (!e.target || !e.target.result) {
            this.addError(`Failed to read ${file.name}`)
            this.processingCount--
            this.updateProgress()
            return
          }
          const img = new Image()
          img.onload = () => this.compressImage(img, file, e.target.result)
          img.onerror = () => {
            this.addError(`Failed to load ${file.name}`)
            this.processingCount--
            this.updateProgress()
          }
          img.src = e.target.result
        }
        reader.onerror = () => {
          this.addError(`Failed to read ${file.name}`)
          this.processingCount--
          this.updateProgress()
        }
        reader.readAsDataURL(file)
      })
    },
    compressImage(img, file, originalDataUrl) {
      try {
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
        if (!ctx) throw new Error('Failed to get canvas context')
        ctx.drawImage(img, 0, 0, width, height)
        const finalFormat = this.outputFormat === 'auto' ? (file.type || 'image/jpeg') : this.outputFormat
        const imageData = ctx.getImageData(0, 0, width, height)
        const cacheKey = `${file.name}_${Date.now()}`
        this.imageCache.set(cacheKey, { imageData, width, height, originalSize: file.size, originalName: file.name })
        canvas.toBlob((blob) => {
          if (!blob) throw new Error('Failed to create blob')
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
            cacheKey
          })
          this.processingCount--
          this.updateProgress()
          if (this.processingCount === 0) {
            this.isProcessing = false
            this.saveSettings()
            this.showToast(`${this.images.length} image${this.images.length > 1 ? 's' : ''} compressed`, 'success')
          }
        }, finalFormat, this.quality)
      } catch (error) {
        this.addError(`Error processing ${file.name}: ${error.message}`)
        this.processingCount--
        this.updateProgress()
      }
    },
    handleQualityChange() {
      this.saveSettings()
      if (this.images.length > 0) this.recompressAll()
    },
    recompressAll() {
      this.isProcessing = true
      this.processingCount = this.images.length
      this.updateProgress()
      this.images.forEach((image) => {
        try {
          const cacheData = this.imageCache.get(image.cacheKey)
          if (!cacheData) {
            const img = new Image()
            img.onload = () => this.recompressImage(img, image, cacheData)
            img.src = image.original
          } else {
            this.recompressFromCache(cacheData, image)
          }
        } catch (error) {
          this.addError(`Error recompressing ${image.name}: ${error.message}`)
          this.processingCount--
          this.updateProgress()
        }
      })
    },
    recompressFromCache(cacheData, image) {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = cacheData.width
        canvas.height = cacheData.height
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Failed to get canvas context')
        ctx.putImageData(cacheData.imageData, 0, 0)
        const finalFormat = this.outputFormat === 'auto' ? 'image/jpeg' : this.outputFormat
        canvas.toBlob((blob) => {
          if (!blob) throw new Error('Failed to create blob')
          const compressedSize = blob.size
          const savings = ((1 - compressedSize / image.originalSize) * 100).toFixed(1)
          const index = this.images.findIndex(img => img.id === image.id)
          if (index !== -1) {
            this.$set(this.images, index, {
              ...this.images[index],
              compressed: URL.createObjectURL(blob),
              compressedSize,
              savings,
              dimensions: `${cacheData.width}×${cacheData.height}`,
              blob
            })
          }
          this.processingCount--
          this.updateProgress()
          if (this.processingCount === 0) this.isProcessing = false
        }, finalFormat, this.quality)
      } catch (error) {
        this.addError(`Error in recompression: ${error.message}`)
        this.processingCount--
        this.updateProgress()
      }
    },
    recompressImage(img, image, cacheData) {
      try {
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
        if (!ctx) throw new Error('Failed to get canvas context')
        ctx.drawImage(img, 0, 0, width, height)
        const finalFormat = this.outputFormat === 'auto' ? 'image/jpeg' : this.outputFormat
        canvas.toBlob((blob) => {
          if (!blob) throw new Error('Failed to create blob')
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
          this.processingCount--
          this.updateProgress()
          if (this.processingCount === 0) this.isProcessing = false
        }, finalFormat, this.quality)
      } catch (error) {
        this.addError(`Error recompressing: ${error.message}`)
        this.processingCount--
        this.updateProgress()
      }
    },
    updateProgress() {
      if (this.processingCount === 0) {
        this.processingProgress = 0
      } else {
        const processed = this.images.length
        this.processingProgress = (processed / (processed + this.processingCount)) * 100
      }
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
      try {
        const a = document.createElement('a')
        a.href = image.compressed
        a.download = `compressed_${image.name}`
        a.click()
        this.showToast('Image downloaded', 'success')
      } catch (error) {
        this.addError('Failed to download image')
      }
    },
    downloadAll() {
      if (this.images.length === 0) return
      this.images.forEach((image, index) => {
        setTimeout(() => this.downloadImage(image), index * 50)
      })
      this.showToast(`Downloading ${this.images.length} images`, 'success')
    },
    removeImage(id) {
      const image = this.images.find(img => img.id === id)
      if (image && image.compressed) URL.revokeObjectURL(image.compressed)
      this.images = this.images.filter(img => img.id !== id)
      this.saveSettings()
    },
    clearAll() {
      if (this.images.length === 0) return
      if (confirm(`Clear all ${this.images.length} images?`)) {
        this.images.forEach(img => {
          if (img.compressed) URL.revokeObjectURL(img.compressed)
        })
        this.images = []
        this.imageCache.clear()
        this.showToast('All images cleared', 'success')
        this.saveSettings()
      }
    },
    showToast(message, type = 'success') {
      this.toast = { show: true, message, type }
      setTimeout(() => { this.toast.show = false }, 3000)
    },
    addError(message) {
      const id = Date.now() + Math.random()
      this.errors.push({ id, message })
      setTimeout(() => this.removeError(id), 5000)
    },
    removeError(id) {
      this.errors = this.errors.filter(err => err.id !== id)
    },
    handleKeyboardShortcuts(e) {
      if (e.ctrlKey && e.key === 'd') { e.preventDefault(); this.downloadAll() }
      if (e.ctrlKey && e.shiftKey && e.key === 'C') { e.preventDefault(); this.clearAll() }
    },
    formatBytes(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    },
    saveSettings() {
      const settings = {
        quality: this.quality,
        outputFormat: this.outputFormat,
        resizeOption: this.resizeOption,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem('imageCompressor_settings', JSON.stringify(settings))
    },
    loadSettings() {
      const saved = localStorage.getItem('imageCompressor_settings')
      if (saved) {
        try {
          const settings = JSON.parse(saved)
          this.quality = settings.quality ?? 0.8
          this.outputFormat = settings.outputFormat ?? 'auto'
          this.resizeOption = settings.resizeOption ?? null
        } catch (error) {
          console.error('Failed to load settings:', error)
        }
      }
    },
  }
}
</script>

<style scoped>
@import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');

* {
  box-sizing: border-box;
}

input[type="range"].slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #2563eb;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

input[type="range"].slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

input[type="range"].slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #2563eb;
  cursor: pointer;
  border: none;
  transition: transform 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

input[type="range"].slider::-moz-range-thumb:hover {
  transform: scale(1.15);
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

.animate-bounce-slow {
  animation: bounce-slow 3s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

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
</style>