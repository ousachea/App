<template>
  <div class="app">
    <!-- HEADER -->
    <header class="header">
      <div class="header-inner">
        <div>
          <h1>🎬 Works Tracker</h1>
          <p class="text-muted">{{ artists.length }} artists · {{ totalCount }} works</p>
        </div>
        <div class="header-actions">
          <button @click="exportData" class="btn btn-sm btn-success">💾</button>
          <button @click="triggerImport" class="btn btn-sm btn-success">📥</button>
          <input ref="fileInput" type="file" accept=".json" hidden @change="importData" />
          <button @click="hardRefresh" class="btn btn-sm btn-warning">🔄</button>
          <button @click="openAddArtistModal" class="btn btn-primary">➕ Add Artist</button>
        </div>
      </div>
    </header>

    <!-- ARTISTS VIEW -->
    <main v-if="currentView === 'artists'" class="main-content">
      <div class="artist-grid">
        <div v-for="artist in sortedArtists" :key="artist.name" class="artist-card" @click="selectArtist(artist.name)">
          <div class="artist-img">
            <img v-if="artistPhotos[artist.name]" :src="artistPhotos[artist.name]" :alt="artist.name" @error="hideImage"
              @load="showImage" />
            <img v-else-if="getCoverWork(artist)" :src="getImageUrl(getCoverWork(artist).code)" :alt="artist.name"
              @error="hideImage" @load="showImage" />
            <div v-else class="img-placeholder">📷</div>
            <div class="artist-info">
              <h3>{{ artist.name }}</h3>
              <div class="artist-stats">
                <span v-if="artist.mainWorks?.length">{{ artist.mainWorks.length }} Main</span>
                <span v-if="artist.compilations?.length">{{ artist.compilations.length }} Comp</span>
              </div>
            </div>
            <button @click.stop="openArtistPhotoModal(artist.name)" class="edit-photo-btn">📷</button>
          </div>
        </div>
      </div>
    </main>

    <!-- WORKS VIEW -->
    <main v-else-if="currentView === 'works'" class="main-content">
      <div class="page-nav">
        <button @click="backToArtists" class="btn">← Back</button>
        <div class="page-info">
          <h2>{{ currentArtist.name }}</h2>
          <p class="text-muted">{{ (currentArtist.mainWorks?.length || 0) + (currentArtist.compilations?.length || 0) }}
            works</p>
        </div>
        <button @click="openAddWorkModal" class="btn btn-primary">➕ Add</button>
      </div>

      <section v-if="sortedMainWorks.length" class="works-section">
        <h3 class="section-title">Main Works · {{ sortedMainWorks.length }}</h3>
        <div class="works-grid">
          <div v-for="work in sortedMainWorks" :key="work.code" class="work-card" @click="openWorkView(work)">
            <div class="work-img">
              <span v-if="hasSimilarCode(work.code)" class="work-badge warn">⚠️</span>
              <span v-if="hasCustomImage(work.code)" class="work-badge custom">📷</span>
              <span v-if="isCoverWork(currentArtist.name, work.code)" class="work-badge cover">★</span>
              <img :src="getImageUrl(work.code)" :alt="work.code" @error="hideImage" @load="showImage" />
            </div>
            <div class="work-code">{{ work.code }}</div>
            <button @click.stop="setCoverWork(currentArtist.name, work.code)" class="btn-set-cover"
              :class="{ active: isCoverWork(currentArtist.name, work.code) }">
              {{ isCoverWork(currentArtist.name, work.code) ? '★ Cover' : 'Set Cover' }}
            </button>
          </div>
        </div>
      </section>

      <section v-if="sortedCompilations.length" class="works-section">
        <h3 class="section-title">Compilations · {{ sortedCompilations.length }}</h3>
        <div class="works-grid">
          <div v-for="work in sortedCompilations" :key="work.code" class="work-card" @click="openWorkView(work)">
            <div class="work-img">
              <span v-if="hasSimilarCode(work.code)" class="work-badge warn">⚠️</span>
              <span v-if="hasCustomImage(work.code)" class="work-badge custom">📷</span>
              <span v-if="isCoverWork(currentArtist.name, work.code)" class="work-badge cover">★</span>
              <img :src="getImageUrl(work.code)" :alt="work.code" @error="hideImage" @load="showImage" />
            </div>
            <div class="work-code">{{ work.code }}</div>
            <button @click.stop="setCoverWork(currentArtist.name, work.code)" class="btn-set-cover"
              :class="{ active: isCoverWork(currentArtist.name, work.code) }">
              {{ isCoverWork(currentArtist.name, work.code) ? '★ Cover' : 'Set Cover' }}
            </button>
          </div>
        </div>
      </section>
    </main>

    <!-- DETAIL VIEW -->
    <main v-else-if="currentView === 'detail'" class="main-content detail-view">
      <div class="page-nav">
        <button @click="backToWorks" class="btn">← Back</button>
        <div class="work-nav">
          <button @click="navigateWork(-1)" :disabled="!canNavigateWork(-1)" class="btn btn-sm">‹</button>
          <span class="text-muted">{{ currentWorkIndex + 1 }} / {{ currentWorkList.length }}</span>
          <button @click="navigateWork(1)" :disabled="!canNavigateWork(1)" class="btn btn-sm">›</button>
        </div>
      </div>

      <div class="detail-container">
        <aside class="detail-sidebar">
          <div class="cover-box" @click="openLightbox(currentWork, 0)">
            <img :src="getImageUrl(currentWork.code)" :alt="currentWork.code" @error="hideImage" @load="showImage" />
            <div class="cover-overlay">Click to enlarge</div>
          </div>

          <div class="info-card">
            <h2 class="detail-title" @click="copyToClipboard(currentWork.code)">
              {{ currentWork.code }}
              <span v-if="hasSimilarCode(currentWork.code)" class="warn-icon">⚠️</span>
              <span v-if="isCoverWork(currentArtist.name, currentWork.code)" class="cover-icon">★</span>
            </h2>

            <div class="action-grid">
              <button @click="setCoverWork(currentArtist.name, currentWork.code)" class="btn btn-block"
                :class="isCoverWork(currentArtist.name, currentWork.code) ? 'btn-success' : 'btn-secondary'">
                {{ isCoverWork(currentArtist.name, currentWork.code) ? '★ Current Cover' : 'Set as Cover' }}
              </button>
              <button @click="openExternalLink(currentWork.code, 'njav')" class="btn btn-primary btn-block">🔗
                NJAV</button>
              <button @click="openExternalLink(currentWork.code, 'missav')" class="btn btn-primary btn-block">🔗
                MissAV</button>
              <button @click="openUploadModal(currentWork.code)" class="btn btn-warning btn-block">
                {{ hasCustomImage(currentWork.code) ? '📷 Update' : '📷 Add' }}
              </button>
              <button v-if="hasCustomImage(currentWork.code)" @click="removeCustomImage(currentWork.code)"
                class="btn btn-danger btn-block">
                🗑️ Remove
              </button>
            </div>
          </div>
        </aside>

        <section class="detail-gallery">
          <h3 class="section-title">Gallery · 20 images</h3>
          <div class="gallery-grid">
            <div v-for="i in 20" :key="i" class="gallery-thumb" @click="openLightbox(currentWork, i)">
              <img :src="getImageUrl(currentWork.code, `jp-${i}`)" :alt="`${currentWork.code} - ${i}`" @error="dimImage"
                @load="showImage" />
              <span class="thumb-num">{{ i }}</span>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- MODALS -->
    <div v-if="showAddArtistModal" class="modal-backdrop" @click.self="closeAddArtistModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Add Artist</h3>
          <button @click="closeAddArtistModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <label>Name<input v-model="newArtist.name" placeholder="Artist name" /></label>
          <label>Photo URL<input v-model="newArtist.photo" placeholder="https://..." /></label>
        </div>
        <div class="modal-footer">
          <button @click="addNewArtist" class="btn btn-primary">Add</button>
          <button @click="closeAddArtistModal" class="btn">Cancel</button>
        </div>
      </div>
    </div>

    <div v-if="showAddWorkModal" class="modal-backdrop" @click.self="closeAddWorkModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Add Work</h3>
          <button @click="closeAddWorkModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <label>
            Artist
            <select v-model="newWork.artist">
              <option value="">Select artist...</option>
              <option v-for="a in artists" :key="a.name" :value="a.name">{{ a.name }}</option>
            </select>
          </label>
          <label>Work Code<input v-model="newWork.code" placeholder="SONE-978" /></label>
          <label>
            Type
            <div class="radio-row">
              <label><input v-model="newWork.type" type="radio" value="mainWorks" /> Main</label>
              <label><input v-model="newWork.type" type="radio" value="compilations" /> Compilation</label>
            </div>
          </label>
        </div>
        <div class="modal-footer">
          <button @click="addNewWork" class="btn btn-primary">Add</button>
          <button @click="closeAddWorkModal" class="btn">Cancel</button>
        </div>
      </div>
    </div>

    <div v-if="showUploadModal" class="modal-backdrop" @click.self="closeUploadModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Custom Image</h3>
          <button @click="closeUploadModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <p class="text-muted">For <strong>{{ uploadingWork }}</strong></p>
          <label>Image URL<input v-model="customImageUrl" placeholder="https://example.com/image.jpg"
              @keyup.enter="handleCustomImageUrl" /></label>
        </div>
        <div class="modal-footer">
          <button @click="handleCustomImageUrl" class="btn btn-primary" :disabled="!customImageUrl.trim()">Add</button>
          <button @click="closeUploadModal" class="btn">Cancel</button>
        </div>
      </div>
    </div>

    <div v-if="showArtistPhotoModal" class="modal-backdrop" @click.self="closeArtistPhotoModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Artist Photo</h3>
          <button @click="closeArtistPhotoModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <p class="text-muted">For <strong>{{ editingArtistName }}</strong></p>
          <label>Photo URL<input v-model="artistPhotoUrl" placeholder="https://example.com/photo.jpg"
              @keyup.enter="updateArtistPhoto" /></label>
        </div>
        <div class="modal-footer">
          <button @click="updateArtistPhoto" class="btn btn-primary" :disabled="!artistPhotoUrl.trim()">Update</button>
          <button @click="closeArtistPhotoModal" class="btn">Cancel</button>
        </div>
      </div>
    </div>

    <!-- LIGHTBOX -->
    <div v-if="lightbox.show" class="lightbox" @click.self="closeLightbox">
      <button class="lb-close" @click="closeLightbox">✕</button>
      <button v-if="lightbox.images.length > 1" class="lb-nav lb-prev" @click="prevImage">‹</button>
      <button v-if="lightbox.images.length > 1" class="lb-nav lb-next" @click="nextImage">›</button>
      <img :src="lightbox.images[lightbox.currentIndex]" :alt="lightbox.code" @error="dimImage" />
      <div class="lb-info">
        <span>{{ lightbox.code }}</span>
        <span class="text-muted">{{ lightbox.currentIndex + 1 }} / {{ lightbox.images.length }}</span>
      </div>
    </div>

    <!-- TOAST -->
    <transition name="fade">
      <div v-if="toast.show" :class="['toast', `toast-${toast.type}`]">{{ toast.message }}</div>
    </transition>
  </div>
</template>

<script>
import { DEFAULT_ARTISTS } from '~/data/artists.js'
import { normalizeArtists } from '~/utils/artistHelpers.js'

const codeParseCache = new Map()

const parseWorkCode = (code) => {
  if (!code) return null
  if (codeParseCache.has(code)) return codeParseCache.get(code)

  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const match = clean.match(/^([A-Z]+)(\d+)$/)

  const parsed = match
    ? { full: clean, prefix: match[1].toLowerCase(), number: match[2], rawNumber: parseInt(match[2], 10) }
    : { full: clean, prefix: clean.toLowerCase(), number: '001', rawNumber: 1 }

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
      lightbox: { show: false, images: [], currentIndex: 0, code: '' },
      customImages: {},
      customImagesLoaded: false,
      showUploadModal: false,
      uploadingWork: null,
      customImageUrl: '',
      imageDB: null,
      useLocalStorageFallback: false,
      artistPhotos: {},
      showArtistPhotoModal: false,
      editingArtistName: '',
      artistPhotoUrl: '',
      coverWorks: {
        'Airi Hinata': 'VENU-662',
        'Kanno Sayuki': 'MDYD-789',
        'Shio Asami/Kanon Hinano': 'IPZZ-736',
        'Ruri Saijo': 'TYOD-255',
        'Hana Himesaki': 'NSFS-012',
        'Sena Kasumi': 'BONY-007',
        'Satomi Mioka': 'APNS-293',
        'Honoka Mihara': 'NDRA-059',
        'Minato Haru': 'SONE-865'
      }
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
      return [...this.artists].sort((a, b) => a.name.localeCompare(b.name))
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
      if (process.client) window.scrollTo({ top: 0, behavior: 'instant' })
    },
    artistPhotos: {
      handler(v) {
        if (process.client) localStorage.setItem('artistPhotos', JSON.stringify(v))
      },
      deep: true
    },
    coverWorks: {
      handler(v) {
        if (process.client) localStorage.setItem('coverWorks', JSON.stringify(v))
      },
      deep: true
    }
  },
  mounted() {
    if (process.client) {
      this.imageDB = new ImageDB()
      try {
        const saved = localStorage.getItem('artistPhotos')
        if (saved) this.artistPhotos = JSON.parse(saved)
      } catch (e) {
        console.warn('Failed to load artist photos:', e)
      }
      try {
        const saved = localStorage.getItem('coverWorks')
        if (saved) this.coverWorks = JSON.parse(saved)
      } catch (e) {
        console.warn('Failed to load cover works:', e)
      }
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
          if (savedCustomImages) this.customImages = JSON.parse(savedCustomImages)
        }
        this.customImagesLoaded = true
      } catch (e) {
        console.warn('Failed to initialize image storage:', e)
        this.useLocalStorageFallback = true
        try {
          const savedCustomImages = localStorage.getItem('customImages')
          if (savedCustomImages) this.customImages = JSON.parse(savedCustomImages)
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
      this.currentWorkList = isMain ? (this.currentArtist.mainWorks || []) : (this.currentArtist.compilations || [])
      this.currentWorkIndex = this.currentWorkList.findIndex(w => w.code === work.code)
      this.currentWork = work
      this.currentView = 'detail'
    },

    navigateWork(direction) {
      const newIndex = this.currentWorkIndex + direction
      if (newIndex >= 0 && newIndex < this.currentWorkList.length) {
        this.currentWorkIndex = newIndex
        this.currentWork = this.currentWorkList[newIndex]
      }
    },

    canNavigateWork(direction) {
      const newIndex = this.currentWorkIndex + direction
      return newIndex >= 0 && newIndex < this.currentWorkList.length
    },

    getImageUrl(code, quality = 'pl') {
      if (quality === 'pl' && this.customImages[code]) return this.customImages[code]
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

    hideImage(e) {
      e.target.style.display = 'none'
    },

    dimImage(e) {
      e.target.style.opacity = '0.2'
    },

    showImage(e) {
      e.target.style.opacity = '1'
    },

    hasCustomImage(code) {
      return !!this.customImages[code]
    },

    openLightbox(work, startIndex = 0) {
      const images = [this.getImageUrl(work.code)]
      for (let i = 1; i <= 20; i++) {
        images.push(this.getImageUrl(work.code, `jp-${i}`))
      }
      this.lightbox = { show: true, images, currentIndex: startIndex, code: work.code }
      if (process.client) document.body.style.overflow = 'hidden'
    },

    closeLightbox() {
      this.lightbox.show = false
      if (process.client) document.body.style.overflow = ''
    },

    nextImage() {
      this.lightbox.currentIndex = (this.lightbox.currentIndex + 1) % this.lightbox.images.length
    },

    prevImage() {
      this.lightbox.currentIndex = (this.lightbox.currentIndex - 1 + this.lightbox.images.length) % this.lightbox.images.length
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

    getCoverWork(artist) {
      // Priority 1: Check if cover work is set in coverWorks
      if (this.coverWorks[artist.name]) {
        const allWorks = [...(artist.mainWorks || []), ...(artist.compilations || [])]
        const coverWork = allWorks.find(w => w.code === this.coverWorks[artist.name])
        if (coverWork) return coverWork
      }

      // Priority 2: Fall back to first work in mainWorks
      if (artist.mainWorks?.length > 0) {
        return artist.mainWorks[0]
      }

      // Priority 3: Fall back to first work in compilations
      if (artist.compilations?.length > 0) {
        return artist.compilations[0]
      }

      // No works available
      return null
    },

    setCoverWork(artistName, workCode) {
      this.coverWorks = { ...this.coverWorks, [artistName]: workCode }
      this.showToast(`✅ Set ${workCode} as cover for ${artistName}`, 'success')
    },

    isCoverWork(artistName, workCode) {
      return this.coverWorks[artistName] === workCode
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
      const url = type === 'missav'
        ? `https://missav.ws/en/${formattedCode}`
        : `https://www.njav.com/en/xvideos/${formattedCode}`
      window.open(url, '_blank', 'noopener,noreferrer')
    },

    async handleCustomImageUrl() {
      const url = this.customImageUrl.trim()
      if (!url) return this.showToast('Please enter an image URL', 'error')
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return this.showToast('URL must start with http:// or https://', 'error')
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
        this.customImages = { ...this.customImages, [this.uploadingWork]: url }
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

    exportData() {
      try {
        const data = {
          artists: this.artists,
          customImages: this.customImages,
          artistPhotos: this.artistPhotos,
          coverWorks: this.coverWorks
        }
        const json = JSON.stringify(data, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `works-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
        this.showToast('✅ Data exported successfully', 'success')
      } catch (e) {
        console.error('Export failed:', e)
        this.showToast('Failed to export data', 'error')
      }
    },

    triggerImport() {
      this.$refs.fileInput.click()
    },

    importData(event) {
      try {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target.result
          const data = JSON.parse(content)

          if (!data.artists || !Array.isArray(data.artists)) {
            this.showToast('Invalid backup file format', 'error')
            return
          }

          this.artists = normalizeArtists(data.artists)
          this.customImages = data.customImages || {}
          this.artistPhotos = data.artistPhotos || {}
          this.coverWorks = data.coverWorks || {}
          localStorage.setItem('artists', JSON.stringify(this.artists))
          this.showToast('✅ Data imported successfully', 'success')
        }
        reader.readAsText(file)
        event.target.value = ''
      } catch (e) {
        console.error('Import failed:', e)
        this.showToast('Failed to import data. Invalid file format.', 'error')
      }
    },

    openArtistPhotoModal(artistName) {
      this.editingArtistName = artistName
      this.artistPhotoUrl = this.artistPhotos[artistName] || ''
      this.showArtistPhotoModal = true
    },

    closeArtistPhotoModal() {
      this.showArtistPhotoModal = false
      this.editingArtistName = ''
      this.artistPhotoUrl = ''
    },

    updateArtistPhoto() {
      const url = this.artistPhotoUrl.trim()
      if (!url) return

      const img = new Image()
      const timeout = setTimeout(() => {
        this.showToast('Image URL took too long to load', 'error')
      }, 10000)

      img.onload = () => {
        clearTimeout(timeout)
        this.artistPhotos = { ...this.artistPhotos, [this.editingArtistName]: url }
        localStorage.setItem('artistPhotos', JSON.stringify(this.artistPhotos))
        this.showToast(`✅ Artist photo updated`, 'success')
        this.closeArtistPhotoModal()
      }

      img.onerror = () => {
        clearTimeout(timeout)
        this.showToast('Failed to load image URL', 'error')
      }

      img.src = url
    },

    async hardRefresh() {
      try {
        this.showToast('Refreshing data...', 'info')
        localStorage.removeItem('artists')
        localStorage.removeItem('artistPhotos')
        localStorage.removeItem('coverWorks')
        this.artists = normalizeArtists(JSON.parse(JSON.stringify(DEFAULT_ARTISTS)))
        this.currentView = 'artists'
        this.activeTab = ''
        this.artistPhotos = {}
        this.coverWorks = {}
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
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.app {
  min-height: 100vh;
  background: #f8f9fa;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-inner {
  max-width: 1600px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.header h1 {
  font-size: 1.5rem;
  color: #111827;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.main-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 32px 24px;
}

.page-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  gap: 16px;
}

.page-info {
  flex: 1;
  text-align: center;
}

.page-info h2 {
  font-size: 1.75rem;
  color: #111827;
  font-weight: 700;
}

.work-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.artist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.artist-card {
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  transition: all 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.artist-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.artist-img {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  background: #000;
  overflow: hidden;
}

.artist-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  opacity: 0.2;
}

.artist-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
  padding: 20px 16px;
  color: #fff;
}

.artist-info h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.artist-stats {
  display: flex;
  gap: 8px;
  font-size: 0.75rem;
  opacity: 0.9;
}

.artist-stats span {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
}

.edit-photo-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
}

.artist-card:hover .edit-photo-btn {
  opacity: 1;
}

.works-section {
  margin-bottom: 48px;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.work-card {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
}

.work-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.work-card:hover .btn-set-cover {
  opacity: 1;
}

.work-img {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  background: #000;
  overflow: hidden;
}

.work-img img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.work-badge {
  position: absolute;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  z-index: 5;
}

.work-badge.warn {
  top: 8px;
  right: 8px;
}

.work-badge.custom {
  top: 36px;
  right: 8px;
}

.work-badge.cover {
  top: 8px;
  left: 8px;
  background: rgba(255, 193, 7, 0.9);
  color: #000;
}

.work-code {
  padding: 12px;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.btn-set-cover {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  opacity: 0;
  transition: all 0.2s;
  z-index: 10;
  white-space: nowrap;
}

.btn-set-cover.active {
  background: #ffc107;
  color: #000;
  opacity: 1;
}

.btn-set-cover:hover {
  background: #ffc107;
  color: #000;
}

.detail-view {
  padding: 24px;
}

.detail-container {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 32px;
}

.detail-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cover-box {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  aspect-ratio: 3 / 2;
}

.cover-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.cover-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  text-align: center;
  padding: 12px;
  font-size: 0.875rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.cover-box:hover .cover-overlay {
  opacity: 1;
}

.info-card {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.detail-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 20px;
  cursor: pointer;
  user-select: all;
  transition: color 0.2s;
}

.detail-title:hover {
  color: #2563eb;
}

.warn-icon {
  color: #f59e0b;
  margin-left: 8px;
}

.cover-icon {
  color: #ffc107;
  margin-left: 8px;
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.detail-gallery {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.gallery-thumb {
  position: relative;
  aspect-ratio: 3 / 2;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
  cursor: pointer;
  transition: transform 0.2s;
}

.gallery-thumb:hover {
  transform: scale(1.05);
}

.gallery-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.thumb-num {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.btn {
  padding: 10px 16px;
  background: #6b7280;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn:hover {
  background: #4b5563;
}

.btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.btn-sm {
  padding: 8px 12px;
  font-size: 0.875rem;
}

.btn-primary {
  background: #2563eb;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-secondary {
  background: #6b7280;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-success {
  background: #10b981;
}

.btn-success:hover {
  background: #059669;
}

.btn-warning {
  background: #f59e0b;
}

.btn-warning:hover {
  background: #d97706;
}

.btn-danger {
  background: #ef4444;
  grid-column: 1 / -1;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-block {
  width: 100%;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: #fff;
  border-radius: 16px;
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 24px;
}

.modal-body label {
  display: block;
  margin-bottom: 20px;
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.modal-body input,
.modal-body select {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-top: 6px;
  transition: border-color 0.2s;
}

.modal-body input:focus,
.modal-body select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.radio-row {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.radio-row label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  cursor: pointer;
  font-weight: 400;
}

.radio-row input {
  width: auto;
  margin: 0;
  cursor: pointer;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
}

.modal-footer .btn {
  flex: 1;
}

.lightbox {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.lightbox img {
  max-width: 90%;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 8px;
}

.lb-close {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.lb-close:hover {
  background: rgba(239, 68, 68, 0.8);
}

.lb-nav {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 2rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.lb-nav:hover {
  background: rgba(255, 255, 255, 0.2);
}

.lb-prev {
  left: 20px;
}

.lb-next {
  right: 20px;
}

.lb-info {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  gap: 20px;
  font-size: 0.875rem;
}

.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #10b981;
  color: #fff;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.3);
  z-index: 3000;
  font-weight: 500;
  font-size: 0.875rem;
  max-width: 400px;
}

.toast-error {
  background: #ef4444;
}

.toast-info {
  background: #2563eb;
}

.text-muted {
  color: #6b7280;
  font-size: 0.875rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1024px) {
  .detail-container {
    grid-template-columns: 1fr;
  }

  .detail-sidebar {
    max-width: 500px;
    margin: 0 auto;
  }

  .artist-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  .header-inner {
    padding: 12px 16px;
  }

  .main-content {
    padding: 20px 16px;
  }

  .artist-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
  }

  .works-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .action-grid {
    grid-template-columns: 1fr;
  }

  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
  }
}
</style>