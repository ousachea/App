<template>
  <div class="container">
    <header>
      <div>
        <h1>🎬 Works Tracker</h1>
        <p>{{ artists.length }} artists · {{ totalCount }} works</p>
      </div>

      <div class="btns">
        <button @click="openAddArtistModal" title="Add new artist">➕ Artist</button>
      </div>
    </header>

    <div class="content-wrapper">
      <!-- Artist Grid View (Page 1) -->
      <div v-show="currentView === 'artists'" class="view-page">
        <div class="artist-grid">
          <button v-for="artist in sortedArtists" :key="artist.name" class="artist-card-modern"
            @click="selectArtist(artist.name)">

            <div class="artist-photo-container">
              <div class="artist-photo-modern">
                <img v-if="getRandomArtistWork(artist)" :src="getImageUrl(getRandomArtistWork(artist).code, 'pl')"
                  :alt="artist.name" @error="showPlaceholder" @load="handleImageLoad" class="artist-image-modern" />
                <div v-else class="photo-placeholder-modern">📷</div>
              </div>

              <div class="photo-overlay-gradient">
                <h3 class="artist-name-overlay">{{ artist.name }}</h3>
              </div>
            </div>

            <div class="artist-card-footer">
              <div class="breakdown-modern">
                <span v-if="artist.mainWorks?.length" class="badge-main">
                  📌 {{ artist.mainWorks.length }}
                </span>
                <span v-if="artist.compilations?.length" class="badge-comp">
                  📂 {{ artist.compilations.length }}
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Artist Works List View (Page 2) -->
      <div v-show="currentView === 'works'" class="view-page">
        <div class="page-header">
          <button @click="backToArtists" class="back-btn">← Back</button>
          <div class="page-title">
            <h2>{{ currentArtist?.name }}</h2>
            <p>{{ (currentArtist?.mainWorks?.length || 0) + (currentArtist?.compilations?.length || 0) }} works</p>
          </div>
          <button @click="openAddWorkModal" class="add-work-btn">+</button>
        </div>

        <div v-if="currentArtist?.mainWorks?.length" class="works-section">
          <h3>📌 Main Works</h3>
          <div class="works-grid-compact">
            <div v-for="work in currentArtist.mainWorks" :key="work.code" class="work-thumbnail"
              @click="openWorkView(work)">
              <img :src="getImageUrl(work.code, 'pl')" :alt="work.code" @error="showPlaceholder"
                @load="handleImageLoad" />
              <div class="work-thumbnail-overlay">
                <span class="work-code-compact">{{ work.code }}</span>
              </div>
              <span v-if="hasSimilarCode(work.code)" class="typo-warning-compact">⚠️</span>
            </div>
          </div>
        </div>

        <div v-if="currentArtist?.compilations?.length" class="works-section">
          <h3>📂 Compilations</h3>
          <div class="works-grid-compact">
            <div v-for="work in currentArtist.compilations" :key="work.code" class="work-thumbnail"
              @click="openWorkView(work)">
              <img :src="getImageUrl(work.code, 'pl')" :alt="work.code" @error="showPlaceholder"
                @load="handleImageLoad" />
              <div class="work-thumbnail-overlay">
                <span class="work-code-compact">{{ work.code }}</span>
              </div>
              <span v-if="hasSimilarCode(work.code)" class="typo-warning-compact">⚠️</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Work Detail View (Page 3) -->
      <div v-show="currentView === 'detail'" class="view-page">
        <div class="page-header detail-header">
          <button @click="backToWorks" class="back-btn">← Back</button>
          <div class="work-nav-buttons">
            <button @click="navigateWork(-1)" :disabled="!canNavigateWork(-1)" class="nav-btn">‹</button>
            <button @click="navigateWork(1)" :disabled="!canNavigateWork(1)" class="nav-btn">›</button>
          </div>
        </div>

        <div v-if="currentWork" class="work-detail-content">
          <!-- Left Column: Cover + Info + Actions -->
          <div class="work-detail-left">
            <div class="work-cover-container">
              <img :src="getImageUrl(currentWork.code, 'pl')" :alt="currentWork.code"
                @click="openLightbox(currentWork, 0)" @error="showPlaceholder" @load="handleImageLoad"
                class="work-cover-image" />
              <div class="cover-click-hint">Click to view</div>
              <div v-if="hasCustomImage(currentWork.code)" class="image-source-badge">
                Custom ✓
              </div>
            </div>

            <div class="work-info-card">
              <h2 class="work-title" @click="copyToClipboard(currentWork.code)">
                {{ currentWork.code }}
                <span v-if="hasSimilarCode(currentWork.code)" class="typo-warning">⚠️</span>
              </h2>

              <div class="work-actions">
                <button v-if="!hasCustomImage(currentWork.code)" @click="openUploadModal(currentWork.code)"
                  class="action-btn upload">📤 Image</button>
                <button v-if="hasCustomImage(currentWork.code)" @click="removeCustomImage(currentWork.code)"
                  class="action-btn remove">🗑️ Remove</button>
              </div>

              <div class="external-links">
                <button @click="openExternalLink(currentWork.code, 'missav')" class="ext-btn missav">Missav</button>
              </div>
            </div>
          </div>

          <!-- Right Column: Preview Gallery -->
          <div class="work-detail-right">
            <h3 class="gallery-title">Preview Gallery</h3>
            <div class="gallery-grid">
              <div v-for="i in 20" :key="i" class="gallery-item" @click="openLightbox(currentWork, i)">
                <img :src="getImageUrl(currentWork.code, `jp-${i}`)" @error="handleGalleryImageError"
                  :alt="`Preview ${i}`" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Work Modal -->
    <div v-if="showAddWorkModal" class="modal" @click.self="closeAddWorkModal">
      <div class="modal-box">
        <h3>Add New Work</h3>
        <label>
          Artist
          <select v-model="newWork.artist">
            <option value="">Select artist...</option>
            <option v-for="a in artists" :key="a.name" :value="a.name">{{ a.name }}</option>
          </select>
        </label>
        <label>
          Work Code
          <input v-model="newWork.code" type="text" placeholder="e.g., SONE-978" />
        </label>
        <label>
          Type
          <div class="radios">
            <label style="margin: 0">
              <input v-model="newWork.type" type="radio" value="mainWorks" />
              Main Work
            </label>
            <label style="margin: 0">
              <input v-model="newWork.type" type="radio" value="compilations" />
              Compilation
            </label>
          </div>
        </label>
        <div class="modal-btns">
          <button @click="addNewWork" class="btn btn-primary">Add</button>
          <button @click="closeAddWorkModal" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Add Artist Modal -->
    <div v-if="showAddArtistModal" class="modal" @click.self="closeAddArtistModal">
      <div class="modal-box">
        <h3>Add New Artist</h3>
        <label>
          Artist Name
          <input v-model="newArtist.name" type="text" placeholder="e.g., Jane Doe" />
        </label>
        <label>
          Photo URL (optional)
          <input v-model="newArtist.photo" type="text" placeholder="https://..." />
        </label>
        <div class="modal-btns">
          <button @click="addNewArtist" class="btn btn-primary">Add</button>
          <button @click="closeAddArtistModal" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Upload Custom Image Modal -->
    <div v-if="showUploadModal" class="modal" @click.self="closeUploadModal">
      <div class="modal-box">
        <h3>Add Custom Image</h3>
        <p style="margin-bottom: 16px; color: #666;">
          For <strong>{{ uploadingWork }}</strong>
        </p>

        <label>
          Image URL
          <input v-model="customImageUrl" type="text" placeholder="https://example.com/image.jpg"
            @keyup.enter="handleCustomImageUrl"
            style="width: 100%; padding: 10px; margin-top: 8px; border: 1px solid #ddd; border-radius: 4px;" />
        </label>
        <div style="margin-top: 12px; padding: 12px; background: #f5f5f5; border-radius: 4px; font-size: 0.85rem;">
          <strong>💡 Tips:</strong>
          <ul style="margin: 8px 0 0 20px; padding: 0;">
            <li>Paste direct image URL</li>
            <li>Must end with image extension</li>
            <li>URL saved as-is (no upload)</li>
          </ul>
        </div>
        <div class="modal-btns" style="margin-top: 16px;">
          <button @click="handleCustomImageUrl" class="btn btn-primary" :disabled="!customImageUrl.trim()">Add
            URL</button>
          <button @click="closeUploadModal" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <transition name="fade">
      <div v-if="toast.show" :class="['toast', toast.type]">
        {{ toast.message }}
      </div>
    </transition>

    <!-- Image Lightbox -->
    <div v-if="lightbox.show" class="lightbox" @click.self="closeLightbox">
      <button class="lightbox-close" @click="closeLightbox">✕</button>
      <button class="lightbox-nav lightbox-prev" @click="prevImage" v-if="lightbox.images.length > 1">‹</button>
      <button class="lightbox-nav lightbox-next" @click="nextImage" v-if="lightbox.images.length > 1">›</button>

      <div class="lightbox-content">
        <img :src="lightbox.images[lightbox.currentIndex]" :alt="lightbox.code" @error="handleLightboxError" />
        <div class="lightbox-info">
          <span class="lightbox-code">{{ lightbox.code }}</span>
          <span class="lightbox-counter">{{ lightbox.currentIndex + 1 }} / {{ lightbox.images.length }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { DEFAULT_ARTISTS } from '~/data/artists.js'
import { normalizeArtists } from '~/utils/artistHelpers.js'

// ============================================================================
// CODE PARSING CACHE
// ============================================================================
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

// ============================================================================
// INDEXEDDB HELPER
// ============================================================================
class ImageDB {
  constructor() {
    this.dbName = 'WorksTrackerDB'
    this.storeName = 'customImages'
    this.db = null
  }

  async init() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported, falling back to localStorage')
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

      request.onsuccess = () => {
        resolve(request.result?.data || null)
      }

      request.onerror = () => {
        resolve(null)
      }
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

      request.onerror = () => {
        resolve({})
      }
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
      imageDB: new ImageDB(),
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
    sortedArtists() {
      return this.artists
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
      const parent = img.parentElement
      if (parent && !parent.querySelector('.photo-placeholder')) {
        const placeholder = document.createElement('div')
        placeholder.className = 'photo-placeholder'
        placeholder.innerHTML = `
          <div style="text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 8px;">📷</div>
            <button class="upload-custom-btn" style="background: #2196F3; color: white; border: none; padding: 10px 16px; border-radius: 4px; cursor: pointer; font-size: 0.9rem; min-height: 44px;">
              📤 Upload
            </button>
          </div>
        `
        placeholder.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: rgba(128,128,128,0.1);'

        const workCode = img.alt || img.dataset.code

        const uploadBtn = placeholder.querySelector('.upload-custom-btn')
        if (uploadBtn && workCode) {
          uploadBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            this.openUploadModal(workCode)
          })
        }

        parent.appendChild(placeholder)
      }
    },

    handleGalleryImageError(e) {
      e.target.style.opacity = '0.1'
      e.target.style.filter = 'grayscale(1)'
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
      this.uploadMethod = 'url'
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

        this.showToast(`✅ Custom image URL added for ${this.uploadingWork}`, 'success')
        this.closeUploadModal()

        this.artists = [...this.artists]
      }

      img.onerror = () => {
        clearTimeout(timeout)
        this.showToast('Failed to load image from URL. Check if URL is correct and publicly accessible.', 'error')
      }

      img.src = url
    },

    handleCustomImageUpload(event) {
      const file = event.target.files?.[0]
      if (!file) return

      if (!file.type.startsWith('image/')) {
        this.showToast('Please select an image file', 'error')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        this.showToast('Image too large (max 5MB)', 'error')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target.result

        this.customImages = {
          ...this.customImages,
          [this.uploadingWork]: base64
        }

        this.showToast(`✅ Custom image uploaded for ${this.uploadingWork}`, 'success')
        this.closeUploadModal()

        this.artists = [...this.artists]
      }

      reader.onerror = () => {
        this.showToast('Failed to read image file', 'error')
      }

      reader.readAsDataURL(file)
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
    }
  }
}
</script>

<style scoped>
@import '~/assets/css/works.css';
</style>