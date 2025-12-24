<template>
  <div class="container">
    <!-- HEADER -->
    <header>
      <div class="header-content">
        <div class="header-left">
          <h1>🎬 Works Tracker</h1>
          <p class="header-stats">{{ artists.length }} artists · {{ totalCount }} works</p>
        </div>
        <div class="header-controls">
          <button @click="hardRefresh" class="btn-refresh" title="Hard refresh data">🔄 Refresh</button>
          <button @click="openAddArtistModal" class="btn-add-artist">➕ Add Artist</button>
        </div>
      </div>
    </header>

    <!-- MAIN CONTENT -->
    <div class="content-wrapper">
      <!-- PAGE 1: ARTIST GRID -->
      <div v-show="currentView === 'artists'" class="view-page artists-page">
        <div v-if="artists.length === 0" class="empty-state">
          <div class="empty-icon">🎨</div>
          <p>No artists yet. Add your first artist!</p>
        </div>

        <div v-else class="artist-grid">
          <button v-for="artist in sortedArtists" :key="artist.name" class="artist-card"
            @click="selectArtist(artist.name)">

            <div class="artist-image-wrapper">
              <img v-if="getRandomArtistWork(artist)" :src="getImageUrl(getRandomArtistWork(artist).code, 'pl')"
                :alt="artist.name" @error="showPlaceholder" @load="handleImageLoad" class="artist-image" />
              <div v-else class="artist-placeholder">📷</div>

              <div class="artist-overlay">
                <h3 class="artist-name">{{ artist.name }}</h3>
                <div class="artist-counts">
                  <span v-if="artist.mainWorks?.length" class="count-badge main">
                    {{ artist.mainWorks.length }} Main
                  </span>
                  <span v-if="artist.compilations?.length" class="count-badge comp">
                    {{ artist.compilations.length }} Comp
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- PAGE 2: ARTIST WORKS -->
      <div v-show="currentView === 'works'" class="view-page works-page">
        <div class="page-header">
          <button @click="backToArtists" class="btn-nav">← Artists</button>
          <div class="page-title">
            <h2>{{ currentArtist?.name }}</h2>
            <p>{{ (currentArtist?.mainWorks?.length || 0) + (currentArtist?.compilations?.length || 0) }} works</p>
          </div>
          <button @click="openAddWorkModal" class="btn-add-work">➕</button>
        </div>

        <div v-if="currentArtist?.mainWorks?.length" class="works-section">
          <h3 class="section-title">📌 Main Works</h3>
          <div class="works-grid">
            <div v-for="work in sortedMainWorks" :key="work.code" class="work-card" @click="openWorkView(work)">
              <div class="work-image-container">
                <img :src="getImageUrl(work.code, 'pl')" :alt="work.code" @error="showPlaceholder"
                  @load="handleImageLoad" />
                <div v-if="hasSimilarCode(work.code)" class="warning-badge">⚠️</div>
                <div v-if="hasCustomImage(work.code)" class="custom-badge">✓</div>
              </div>
              <div class="work-code">{{ work.code }}</div>
            </div>
          </div>
        </div>

        <div v-if="currentArtist?.compilations?.length" class="works-section">
          <h3 class="section-title">📂 Compilations</h3>
          <div class="works-grid">
            <div v-for="work in sortedCompilations" :key="work.code" class="work-card" @click="openWorkView(work)">
              <div class="work-image-container">
                <img :src="getImageUrl(work.code, 'pl')" :alt="work.code" @error="showPlaceholder"
                  @load="handleImageLoad" />
                <div v-if="hasSimilarCode(work.code)" class="warning-badge">⚠️</div>
                <div v-if="hasCustomImage(work.code)" class="custom-badge">✓</div>
              </div>
              <div class="work-code">{{ work.code }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- PAGE 3: WORK DETAIL -->
      <div v-show="currentView === 'detail'" class="view-page detail-page">
        <div class="detail-header">
          <button @click="backToWorks" class="btn-nav">← Back</button>
          <div class="nav-controls">
            <button @click="navigateWork(-1)" :disabled="!canNavigateWork(-1)" class="btn-arrow">‹</button>
            <span class="nav-counter">{{ currentWorkIndex + 1 }} / {{ currentWorkList.length }}</span>
            <button @click="navigateWork(1)" :disabled="!canNavigateWork(1)" class="btn-arrow">›</button>
          </div>
        </div>

        <div v-if="currentWork" class="detail-grid">
          <!-- MAIN IMAGE -->
          <div class="detail-main">
            <div class="main-cover">
              <img :src="getImageUrl(currentWork.code, 'pl')" :alt="currentWork.code"
                @click="openLightbox(currentWork, 0)" @error="showPlaceholder" @load="handleImageLoad"
                class="cover-image" />
              <div class="cover-overlay">Click to enlarge</div>
            </div>

            <div class="work-info">
              <h2 class="work-title" @click="copyToClipboard(currentWork.code)">
                {{ currentWork.code }}
                <span v-if="hasSimilarCode(currentWork.code)" class="warning">⚠️</span>
              </h2>

              <div class="action-buttons">
                <button v-if="!hasCustomImage(currentWork.code)" @click="openUploadModal(currentWork.code)"
                  class="btn-action primary">📤 Upload Image</button>
                <button v-if="hasCustomImage(currentWork.code)" @click="removeCustomImage(currentWork.code)"
                  class="btn-action danger">🗑️ Remove</button>
                <button @click="openExternalLink(currentWork.code, 'missav')" class="btn-action secondary">
                  🔗 Missav
                </button>
              </div>
            </div>
          </div>

          <!-- GALLERY PREVIEW -->
          <div class="detail-gallery">
            <h3 class="gallery-title">Preview Gallery</h3>
            <div class="gallery-grid">
              <div v-for="i in 20" :key="i" class="gallery-thumb" @click="openLightbox(currentWork, i)">
                <img :src="getImageUrl(currentWork.code, `jp-${i}`)" :alt="`Preview ${i}`"
                  @error="handleGalleryImageError" />
                <span class="thumb-number">{{ i }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODALS -->
    <div v-if="showAddArtistModal" class="modal-overlay" @click.self="closeAddArtistModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Add Artist</h3>
          <button @click="closeAddArtistModal" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <label>
            Name
            <input v-model="newArtist.name" type="text" placeholder="e.g., Jane Doe" />
          </label>
          <label>
            Photo URL (optional)
            <input v-model="newArtist.photo" type="text" placeholder="https://..." />
          </label>
        </div>
        <div class="modal-footer">
          <button @click="addNewArtist" class="btn-primary">Add</button>
          <button @click="closeAddArtistModal" class="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>

    <div v-if="showAddWorkModal" class="modal-overlay" @click.self="closeAddWorkModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Add Work</h3>
          <button @click="closeAddWorkModal" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <label>
            Artist
            <select v-model="newWork.artist">
              <option value="">Select...</option>
              <option v-for="a in artists" :key="a.name" :value="a.name">{{ a.name }}</option>
            </select>
          </label>
          <label>
            Work Code
            <input v-model="newWork.code" type="text" placeholder="e.g., SONE-978" />
          </label>
          <label>
            Type
            <div class="radio-group">
              <label class="radio-item">
                <input v-model="newWork.type" type="radio" value="mainWorks" />
                Main Work
              </label>
              <label class="radio-item">
                <input v-model="newWork.type" type="radio" value="compilations" />
                Compilation
              </label>
            </div>
          </label>
        </div>
        <div class="modal-footer">
          <button @click="addNewWork" class="btn-primary">Add</button>
          <button @click="closeAddWorkModal" class="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>

    <div v-if="showUploadModal" class="modal-overlay" @click.self="closeUploadModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Add Custom Image</h3>
          <button @click="closeUploadModal" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <p class="upload-info">For <strong>{{ uploadingWork }}</strong></p>
          <label>
            Image URL
            <input v-model="customImageUrl" type="text" placeholder="https://example.com/image.jpg"
              @keyup.enter="handleCustomImageUrl" />
          </label>
          <div class="upload-hint">
            <strong>💡 Tips:</strong>
            <ul>
              <li>Paste direct image URL</li>
              <li>Must end with image extension (.jpg, .png, etc.)</li>
              <li>URL saved as-is</li>
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="handleCustomImageUrl" class="btn-primary" :disabled="!customImageUrl.trim()">
            Add URL
          </button>
          <button @click="closeUploadModal" class="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>

    <!-- LIGHTBOX -->
    <div v-if="lightbox.show" class="lightbox" @click.self="closeLightbox">
      <button class="lightbox-close" @click="closeLightbox">✕</button>
      <button v-if="lightbox.images.length > 1" class="lightbox-prev" @click="prevImage">‹</button>
      <button v-if="lightbox.images.length > 1" class="lightbox-next" @click="nextImage">›</button>

      <div class="lightbox-content">
        <img :src="lightbox.images[lightbox.currentIndex]" :alt="lightbox.code" @error="handleLightboxError" />
      </div>

      <div class="lightbox-info">
        <span class="lightbox-code">{{ lightbox.code }}</span>
        <span class="lightbox-counter">{{ lightbox.currentIndex + 1 }} / {{ lightbox.images.length }}</span>
      </div>
    </div>

    <!-- TOAST -->
    <transition name="fade">
      <div v-if="toast.show" :class="['toast', toast.type]">
        {{ toast.message }}
      </div>
    </transition>
  </div>
</template>

<script>
import { DEFAULT_ARTISTS } from '~/data/artists.js'
import { normalizeArtists } from '~/utils/artistHelpers.js'

const codeParseCache = new Map()

const parseWorkCode = (code) => {
  if (!code) return null
  if (codeParseCache.has(code)) {
    return codeParseCache.get(code)
  }

  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const match = clean.match(/^([A-Z]+)(\d+)$/)

  const parsed = match
    ? {
      full: clean,
      prefix: match[1].toLowerCase(),
      number: match[2],
      rawNumber: parseInt(match[2], 10)
    }
    : {
      full: clean,
      prefix: clean.toLowerCase(),
      number: '001',
      rawNumber: 1
    }

  codeParseCache.set(code, parsed)
  return parsed
}

class ImageDB {
  constructor() {
    this.dbName = 'WorksTrackerDB'
    this.storeName = 'customImages'
    this.db = null
  }

  async init() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported')
        resolve(false)
        return
      }

      const request = indexedDB.open(this.dbName, 1)

      request.onerror = () => {
        console.warn('IndexedDB open failed')
        reject(new Error('IndexedDB failed'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve(true)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'code' })
        }
      }
    })
  }

  async get(code) {
    if (!this.db) return null
    return new Promise((resolve) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(code)
      request.onsuccess = () => resolve(request.result?.data || null)
      request.onerror = () => resolve(null)
    })
  }

  async set(code, data) {
    if (!this.db) return false
    return new Promise((resolve) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put({ code, data })
      request.onsuccess = () => resolve(true)
      request.onerror = () => resolve(false)
    })
  }

  async delete(code) {
    if (!this.db) return false
    return new Promise((resolve) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(code)
      request.onsuccess = () => resolve(true)
      request.onerror = () => resolve(false)
    })
  }

  async getAll() {
    if (!this.db) return {}
    return new Promise((resolve) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()
      request.onsuccess = () => {
        const result = {}
        request.result.forEach((item) => {
          result[item.code] = item.data
        })
        resolve(result)
      }
      request.onerror = () => resolve({})
    })
  }

  async clear() {
    if (!this.db) return false
    return new Promise((resolve) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()
      request.onsuccess = () => resolve(true)
      request.onerror = () => resolve(false)
    })
  }
}

export default {
  name: 'Works',
  data() {
    return {
      currentView: 'artists',
      activeTab: '',
      toast: { show: false, message: '', type: 'success' },
      showAddWorkModal: false,
      showAddArtistModal: false,
      newWork: { artist: '', code: '', type: 'mainWorks' },
      newArtist: { name: '', photo: '' },
      artists: normalizeArtists(JSON.parse(JSON.stringify(DEFAULT_ARTISTS))),
      currentWork: null,
      currentWorkList: [],
      currentWorkIndex: 0,
      lightbox: {
        show: false,
        images: [],
        currentIndex: 0,
        code: ''
      },
      customImages: {},
      customImagesLoaded: false,
      showUploadModal: false,
      uploadingWork: null,
      customImageUrl: '',
      imageDB: null,
      useLocalStorageFallback: false
    }
  },
  computed: {
    totalCount() {
      return this.artists.reduce((sum, a) => sum + (a.mainWorks?.length || 0) + (a.compilations?.length || 0), 0)
    },
    currentArtist() {
      return this.artists.find(a => a.name === this.activeTab)
    },
    sortedMainWorks() {
      if (!this.currentArtist?.mainWorks) return []
      return [...this.currentArtist.mainWorks].sort((a, b) => a.code.localeCompare(b.code))
    },
    sortedCompilations() {
      if (!this.currentArtist?.compilations) return []
      return [...this.currentArtist.compilations].sort((a, b) => a.code.localeCompare(b.code))
    },
    sortedArtists() {
      const sorted = [...this.artists]
      sorted.sort((a, b) => a.name.localeCompare(b.name))
      return sorted
    }
  },
  watch: {
    artists: {
      handler(v) {
        if (process.client) {
          try {
            localStorage.setItem('artists', JSON.stringify(v))
          } catch (e) {
            console.warn('Failed to save to localStorage:', e)
          }
        }
      },
      deep: true
    },
    customImages: {
      handler(v) {
        this.saveCustomImagesToDB(v)
      },
      deep: true
    },
    currentView() {
      this.scrollToTop()
    }
  },
  mounted() {
    if (process.client) {
      this.imageDB = new ImageDB()
      this.initializeApp()
    }
  },
  methods: {
    async initializeApp() {
      try {
        const dbInitialized = await this.imageDB.init()
        if (dbInitialized) {
          const dbImages = await this.imageDB.getAll()
          this.customImages = dbImages || {}
        } else {
          this.useLocalStorageFallback = true
          const savedCustomImages = localStorage.getItem('customImages')
          if (savedCustomImages) {
            this.customImages = JSON.parse(savedCustomImages)
          }
        }
        this.customImagesLoaded = true
      } catch (e) {
        console.warn('Failed to initialize image storage:', e)
        this.useLocalStorageFallback = true
        try {
          const savedCustomImages = localStorage.getItem('customImages')
          if (savedCustomImages) {
            this.customImages = JSON.parse(savedCustomImages)
          }
        } catch (e2) {
          console.warn('localStorage fallback also failed:', e2)
        }
        this.customImagesLoaded = true
      }

      try {
        const saved = localStorage.getItem('artists')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.artists = normalizeArtists(parsed)
          }
        }
      } catch (e) {
        console.warn('Failed to load artists:', e)
      }

      if (this.artists.length && !this.activeTab) {
        this.activeTab = this.artists[0].name
      }

      this.setupKeyboardShortcuts()
    },

    setupKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        if (this.lightbox.show) {
          if (e.key === 'ArrowLeft') this.prevImage()
          else if (e.key === 'ArrowRight') this.nextImage()
          else if (e.key === 'Escape') this.closeLightbox()
        } else if (this.currentView === 'detail') {
          if (e.key === 'ArrowLeft' && this.canNavigateWork(-1)) this.navigateWork(-1)
          else if (e.key === 'ArrowRight' && this.canNavigateWork(1)) this.navigateWork(1)
          else if (e.key === 'Escape') this.backToWorks()
        } else if (this.currentView === 'works' && e.key === 'Escape') {
          this.backToArtists()
        }
      })
    },

    async saveCustomImagesToDB(images) {
      if (!this.customImagesLoaded) return
      if (this.useLocalStorageFallback) {
        try {
          localStorage.setItem('customImages', JSON.stringify(images))
        } catch (e) {
          console.warn('Failed to save custom images to localStorage:', e)
        }
      } else {
        try {
          await this.imageDB.clear()
          for (const [code, data] of Object.entries(images)) {
            await this.imageDB.set(code, data)
          }
        } catch (e) {
          console.warn('Failed to save custom images to IndexedDB:', e)
        }
      }
    },

    scrollToTop() {
      if (process.client) {
        window.scrollTo({ top: 0, behavior: 'instant' })
      }
    },

    selectArtist(name) {
      this.activeTab = name
      this.currentView = 'works'
    },

    backToArtists() {
      this.currentView = 'artists'
      this.activeTab = ''
    },

    backToWorks() {
      this.currentView = 'works'
      this.currentWork = null
    },

    openWorkView(work) {
      const isMain = this.currentArtist?.mainWorks?.find(w => w.code === work.code)
      this.currentWorkList = isMain
        ? (this.currentArtist.mainWorks || [])
        : (this.currentArtist.compilations || [])
      this.currentWorkIndex = this.currentWorkList.findIndex(w => w.code === work.code)
      this.currentWork = work
      this.currentView = 'detail'
    },

    navigateWork(direction) {
      const newIndex = this.currentWorkIndex + direction
      if (newIndex >= 0 && newIndex < this.currentWorkList.length) {
        this.currentWorkIndex = newIndex
        this.currentWork = this.currentWorkList[newIndex]
        this.scrollToTop()
      }
    },

    canNavigateWork(direction) {
      const newIndex = this.currentWorkIndex + direction
      return newIndex >= 0 && newIndex < this.currentWorkList.length
    },

    getImageUrl(code, quality = 'pl') {
      if (quality === 'pl' && this.customImages[code]) {
        return this.customImages[code]
      }
      const parsed = parseWorkCode(code)
      if (!parsed) return null
      const paddedNum = parsed.number.padStart(5, '0')
      const dmmId = `${parsed.prefix}${paddedNum}`
      if (dmmId.length < 3) return null
      if (quality !== 'pl') {
        const qNum = quality.split('-')[1] || '1'
        return `https://pics.dmm.co.jp/digital/video/${dmmId}/${dmmId}jp-${qNum}.jpg`
      }
      return `https://pics.dmm.co.jp/digital/video/${dmmId}/${dmmId}pl.jpg`
    },

    showPlaceholder(e) {
      const img = e.target
      img.style.display = 'none'
    },

    handleGalleryImageError(e) {
      e.target.style.opacity = '0.2'
    },

    handleImageLoad(e) {
      e.target.style.opacity = '1'
    },

    hasCustomImage(code) {
      return !!this.customImages[code]
    },

    openLightbox(work, startIndex = 0) {
      const images = [this.getImageUrl(work.code, 'pl')]
      for (let i = 1; i <= 20; i++) {
        images.push(this.getImageUrl(work.code, `jp-${i}`))
      }
      this.lightbox = {
        show: true,
        images: images,
        currentIndex: startIndex,
        code: work.code
      }
      if (process.client) {
        document.body.style.overflow = 'hidden'
      }
    },

    closeLightbox() {
      this.lightbox.show = false
      if (process.client) {
        document.body.style.overflow = ''
      }
    },

    nextImage() {
      this.lightbox.currentIndex = (this.lightbox.currentIndex + 1) % this.lightbox.images.length
    },

    prevImage() {
      this.lightbox.currentIndex = (this.lightbox.currentIndex - 1 + this.lightbox.images.length) % this.lightbox.images.length
    },

    handleLightboxError(e) {
      e.target.style.opacity = '0.3'
    },

    openAddWorkModal() {
      this.newWork = { artist: this.activeTab || '', code: '', type: 'mainWorks' }
      this.showAddWorkModal = true
    },

    closeAddWorkModal() {
      this.showAddWorkModal = false
    },

    openAddArtistModal() {
      this.newArtist = { name: '', photo: '' }
      this.showAddArtistModal = true
    },

    closeAddArtistModal() {
      this.showAddArtistModal = false
    },

    openUploadModal(code) {
      this.uploadingWork = code
      this.customImageUrl = ''
      this.showUploadModal = true
    },

    closeUploadModal() {
      this.showUploadModal = false
      this.uploadingWork = null
      this.customImageUrl = ''
    },

    addNewArtist() {
      if (!this.newArtist.name.trim()) return this.showToast('Artist name required', 'error')
      if (this.artists.some(a => a.name === this.newArtist.name)) return this.showToast('Artist already exists', 'error')
      const newArtist = { name: this.newArtist.name.trim(), photo: this.newArtist.photo || '', mainWorks: [], compilations: [] }
      this.artists.push(newArtist)
      this.artists = [...this.artists]
      this.activeTab = newArtist.name
      this.closeAddArtistModal()
      this.showToast(`✅ Added ${newArtist.name}`, 'success')
    },

    getRandomArtistWork(artist) {
      const allWorks = [...(artist.mainWorks || []), ...(artist.compilations || [])]
      if (allWorks.length === 0) return null
      return allWorks[Math.floor(Math.random() * allWorks.length)]
    },

    async addNewWork() {
      if (!this.newWork.artist || !this.newWork.code) return this.showToast('Fill required fields', 'error')
      const code = this.newWork.code.toUpperCase()
      if (this.artists.some(a => a.mainWorks?.some(w => w.code === code) || a.compilations?.some(w => w.code === code))) {
        return this.showToast('Code already exists', 'error')
      }
      const artist = this.artists.find(a => a.name === this.newWork.artist)
      if (!artist) return this.showToast('Artist not found', 'error')
      if (!artist[this.newWork.type]) artist[this.newWork.type] = []
      artist[this.newWork.type].push({ code })
      this.artists = [...this.artists]
      this.closeAddWorkModal()
      this.showToast(`✅ Added ${code}`, 'success')
    },

    hasSimilarCode(code) {
      const allCodes = this.artists.flatMap(a => [...(a.mainWorks || []).map(w => w.code), ...(a.compilations || []).map(w => w.code)])
      const similar = allCodes.filter(c => {
        if (c === code) return false
        const codeMatch = code.match(/^([A-Z]+)-?(\d+)$/)
        const checkMatch = c.match(/^([A-Z]+)-?(\d+)$/)
        if (!codeMatch || !checkMatch) return false
        const [, prefix1, num1] = codeMatch
        const [, prefix2, num2] = checkMatch
        if (prefix1 !== prefix2) return false
        const diff = Math.abs(parseInt(num1) - parseInt(num2))
        return diff === 1 || diff === 2
      })
      return similar.length > 0
    },

    copyToClipboard(code) {
      navigator.clipboard.writeText(code).then(() => {
        this.showToast(`Copied: ${code}`, 'success')
      }).catch(() => {
        this.showToast('Failed to copy', 'error')
      })
    },

    openExternalLink(code, type = 'njav') {
      if (!code) return
      const formattedCode = code.toLowerCase().replace(/-/g, '-')
      let url
      if (type === 'missav') {
        url = `https://missav.ws/en/${formattedCode}`
      } else {
        url = `https://www.njav.com/en/xvideos/${formattedCode}`
      }
      window.open(url, '_blank', 'noopener,noreferrer')
    },

    async handleCustomImageUrl() {
      const url = this.customImageUrl.trim()
      if (!url) {
        this.showToast('Please enter an image URL', 'error')
        return
      }
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        this.showToast('URL must start with http:// or https://', 'error')
        return
      }

      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
      const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().includes(ext))
      if (!hasImageExtension) {
        const proceed = confirm('URL does not end with a common image extension. Continue anyway?')
        if (!proceed) return
      }

      const img = new Image()
      const timeout = setTimeout(() => {
        this.showToast('Image URL took too long to load', 'error')
      }, 10000)

      img.onload = () => {
        clearTimeout(timeout)
        this.customImages = {
          ...this.customImages,
          [this.uploadingWork]: url
        }
        this.showToast(`✅ Custom image added for ${this.uploadingWork}`, 'success')
        this.closeUploadModal()
        this.artists = [...this.artists]
      }

      img.onerror = () => {
        clearTimeout(timeout)
        this.showToast('Failed to load image from URL. Check if URL is correct and publicly accessible.', 'error')
      }

      img.src = url
    },

    async removeCustomImage(code) {
      if (confirm(`Remove custom image for ${code}?`)) {
        const newCustomImages = { ...this.customImages }
        delete newCustomImages[code]
        this.customImages = newCustomImages
        this.showToast(`Removed custom image for ${code}`, 'success')
        this.artists = [...this.artists]
      }
    },

    showToast(msg, type = 'success') {
      this.toast = { show: true, message: msg, type }
      setTimeout(() => this.toast.show = false, 3000)
    },

    async hardRefresh() {
      try {
        this.showToast('Refreshing data...', 'info')

        // Clear everything
        localStorage.removeItem('artists')

        // Reset to default data
        this.artists = normalizeArtists(JSON.parse(JSON.stringify(DEFAULT_ARTISTS)))
        this.currentView = 'artists'
        this.activeTab = ''

        // Save fresh data
        localStorage.setItem('artists', JSON.stringify(this.artists))

        this.showToast('✅ Data refreshed to default state', 'success')
      } catch (e) {
        console.error('Hard refresh failed:', e)
        this.showToast('Failed to refresh data', 'error')
      }
    }
  }
}
</script>

<style scoped>
/* RESET & BASE */
* {
  box-sizing: border-box;
}

.container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  background: #fff;
}

/* HEADER */
header {
  padding: 20px;
  border-bottom: 1px solid #e5e5e5;
  background: #fafafa;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.header-left h1 {
  margin: 0;
  font-size: 1.8rem;
  color: #1a1a1a;
}

.header-stats {
  margin: 4px 0 0 0;
  color: #666;
  font-size: 0.9rem;
}

.header-controls {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.btn-refresh {
  padding: 10px 14px;
  background: #ff9800;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  min-height: 44px;
  transition: background 0.2s;
}

.btn-refresh:hover {
  background: #f57c00;
}

.btn-add-artist {
  padding: 10px 16px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  min-height: 44px;
  transition: background 0.2s;
}

.btn-add-artist:hover {
  background: #1976D2;
}

/* CONTENT WRAPPER */
.content-wrapper {
  padding: 24px 20px;
}

.view-page {
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* EMPTY STATE */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* ARTIST GRID */
.artist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

@media (max-width: 480px) {
  .artist-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .artist-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

.artist-card {
  position: relative;
  aspect-ratio: 3 / 2;
  border: none;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  background: #000;
  padding: 0;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.artist-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.artist-image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.artist-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artist-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  opacity: 0.3;
}

.artist-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  padding: 16px 12px;
  color: white;
}

.artist-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
  margin-bottom: 8px;
}

.artist-counts {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.count-badge {
  font-size: 0.7rem;
  padding: 3px 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  font-weight: 500;
}

.page-header,
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e5e5;
  gap: 12px;
}

.page-title {
  flex: 1;
  text-align: center;
  min-width: 0;
}

.page-title h2 {
  margin: 0 0 4px 0;
  font-size: 1.3rem;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (min-width: 480px) {
  .page-title h2 {
    font-size: 1.6rem;
  }
}

.page-title p {
  margin: 0;
  color: #666;
  font-size: 0.85rem;
}

.btn-nav {
  padding: 10px 14px;
  background: #666;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  min-height: 44px;
  white-space: nowrap;
  transition: background 0.2s;
}

.btn-nav:hover {
  background: #555;
}

.btn-add-work {
  padding: 10px 14px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  min-height: 44px;
  min-width: 44px;
  transition: background 0.2s;
}

.btn-add-work:hover {
  background: #45a049;
}

.nav-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-counter {
  font-size: 0.9rem;
  color: #666;
  min-width: 60px;
  text-align: center;
}

.btn-arrow {
  padding: 10px 12px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1rem;
  min-height: 44px;
  min-width: 44px;
  transition: background 0.2s;
  font-weight: bold;
}

.btn-arrow:hover:not(:disabled) {
  background: #1976D2;
}

.btn-arrow:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* WORKS SECTION */
.works-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 1.1rem;
  margin: 0 0 16px 0;
  color: #1a1a1a;
  font-weight: 600;
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

@media (min-width: 480px) {
  .works-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 14px;
  }
}

@media (min-width: 768px) {
  .works-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

.work-card {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.work-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.work-image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  background: #000;
  overflow: hidden;
}

.work-image-container img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.warning-badge,
.custom-badge {
  position: absolute;
  font-size: 0.9rem;
  padding: 4px 6px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
  color: white;
}

.warning-badge {
  top: 6px;
  right: 6px;
}

.custom-badge {
  bottom: 6px;
  right: 6px;
}

.work-code {
  padding: 8px;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #333;
  background: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* DETAIL PAGE */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
  margin-bottom: 32px;
}

@media (min-width: 1000px) {
  .detail-grid {
    grid-template-columns: 380px 1fr;
  }
}

.detail-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-cover {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  background: #000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.cover-image {
  width: 100%;
  height: auto;
  object-fit: contain;
  max-height: 500px;
  cursor: pointer;
  display: block;
  transition: transform 0.3s;
}

.cover-image:hover {
  transform: scale(1.03);
}

.cover-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  text-align: center;
  padding: 8px;
  font-size: 0.8rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.main-cover:hover .cover-overlay {
  opacity: 1;
}

.work-info {
  background: #f8f8f8;
  padding: 16px;
  border-radius: 8px;
}

.work-title {
  margin: 0 0 16px 0;
  font-size: 1.4rem;
  color: #1a1a1a;
  cursor: pointer;
  user-select: all;
  word-break: break-word;
  transition: color 0.2s;
}

.work-title:hover {
  color: #2196F3;
}

.work-title .warning {
  margin-left: 8px;
  color: #ff9800;
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

@media (min-width: 480px) {
  .action-buttons {
    grid-template-columns: 1fr 1fr;
  }
}

.btn-action {
  padding: 12px 14px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  color: white;
  min-height: 44px;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-action.primary {
  background: #2196F3;
}

.btn-action.primary:hover {
  background: #1976D2;
}

.btn-action.danger {
  background: #f44336;
}

.btn-action.danger:hover {
  background: #d32f2f;
}

.btn-action.secondary {
  background: #ff9800;
  grid-column: 1 / -1;
}

.btn-action.secondary:hover {
  background: #f57c00;
}

/* GALLERY */
.detail-gallery {
  min-height: 300px;
}

.gallery-title {
  font-size: 1.1rem;
  margin: 0 0 16px 0;
  color: #1a1a1a;
  font-weight: 600;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

@media (max-width: 480px) {
  .gallery-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
}

@media (min-width: 768px) {
  .gallery-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

.gallery-thumb {
  position: relative;
  aspect-ratio: 3 / 2;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  background: #f0f0f0;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.gallery-thumb:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.gallery-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.thumb-number {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 0.65rem;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 2px 4px;
  border-radius: 2px;
}

/* MODALS */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
  padding: 16px;
}

.modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  max-width: 450px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  z-index: 9001;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e5e5;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #1a1a1a;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  min-height: auto;
  min-width: auto;
}

.btn-close:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.modal-body label {
  display: block;
  margin-bottom: 16px;
  font-weight: 500;
  color: #333;
}

.modal-body input,
.modal-body select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  margin-top: 6px;
}

.modal-body input:focus,
.modal-body select:focus {
  outline: none;
  border-color: #2196F3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.radio-group {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-weight: 400;
  margin: 0;
}

.radio-item input {
  width: auto;
  margin: 0;
  cursor: pointer;
}

.upload-info {
  margin: 0 0 16px 0;
  color: #666;
  font-size: 0.9rem;
}

.upload-hint {
  margin: 12px 0 0 0;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 6px;
  font-size: 0.8rem;
}

.upload-hint strong {
  display: block;
  margin-bottom: 6px;
}

.upload-hint ul {
  margin: 0;
  padding-left: 18px;
}

.upload-hint li {
  margin: 4px 0;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #e5e5e5;
  display: flex;
  gap: 10px;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  min-height: 44px;
  transition: background 0.2s;
}

.btn-primary {
  background: #2196F3;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1976D2;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e5e5e5;
  color: #333;
}

.btn-secondary:hover {
  background: #d5d5d5;
}

/* LIGHTBOX */
.lightbox {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.98);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 11000;
  padding: 10px;
}

.lightbox-content {
  max-width: 100%;
  max-height: 100%;
  position: relative;
  z-index: 11001;
}

.lightbox-content img {
  max-width: 100%;
  max-height: 85vh;
  object-fit: contain;
}

.lightbox-close,
.lightbox-prev,
.lightbox-next {
  position: fixed;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  cursor: pointer;
  z-index: 11002;
  transition: background 0.2s;
  min-height: 44px;
  min-width: 44px;
}

.lightbox-close {
  top: 12px;
  right: 12px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.lightbox-close:hover {
  background: rgba(255, 0, 0, 0.6);
}

.lightbox-prev,
.lightbox-next {
  top: 50%;
  transform: translateY(-50%);
  width: 50px;
  height: 50px;
  border-radius: 6px;
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.lightbox-prev:hover,
.lightbox-next:hover {
  background: rgba(255, 255, 255, 0.2);
}

.lightbox-prev {
  left: 12px;
}

.lightbox-next {
  right: 12px;
}

.lightbox-info {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  display: flex;
  gap: 16px;
  align-items: center;
  font-size: 0.9rem;
}

.lightbox-code {
  font-weight: 600;
}

.lightbox-counter {
  opacity: 0.8;
}

/* TOAST */
.toast {
  position: fixed;
  bottom: 20px;
  right: 16px;
  background: #4CAF50;
  color: white;
  padding: 14px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 10500;
  font-weight: 500;
  font-size: 0.9rem;
  max-width: 90vw;
  animation: slideIn 0.3s;
}

.toast.error {
  background: #f44336;
}

.toast.info {
  background: #2196F3;
}

@keyframes slideIn {
  from {
    transform: translateY(100px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .content-wrapper {
    padding: 16px 12px;
  }

  header {
    padding: 16px;
  }

  .header-left h1 {
    font-size: 1.5rem;
  }
}
</style>