<template>
  <div class="app">
    <!-- HEADER -->
    <header class="header">
      <div class="header-inner">
        <div class="header-title">
          <h1>Works</h1>
          <span class="header-stats">{{ artists.length }} artists · {{ totalCount }} works</span>
        </div>
        <div class="header-actions">
          <button @click="exportData" title="Export" class="icon-btn">↓</button>
          <button @click="triggerImport" title="Import" class="icon-btn">↑</button>
          <input ref="fileInput" type="file" accept=".json" hidden @change="importData" />
          <button @click="hardRefresh" title="Reset" class="icon-btn">⟳</button>
        </div>
      </div>
    </header>

    <!-- ARTISTS VIEW -->
    <main v-if="currentView === 'artists'" class="main">
      <div class="view-header">
        <h2>Artists</h2>
        <div class="header-right">
          <input v-model="searchQuery" type="text" placeholder="Search artists..." class="search-input"
            @input="handleSearch" />
          <div class="stats-pills">
            <span class="pill">{{ filteredArtists.length }} / {{ artists.length }}</span>
            <span class="pill">{{ totalMainWorks }} main</span>
            <span class="pill">{{ totalCompilations }} compilations</span>
          </div>
        </div>
      </div>

      <div v-if="searchQuery && filteredArtists.length === 0" class="no-results">
        <p>No artists found for "{{ searchQuery }}"</p>
      </div>

      <div class="artists-grid">
        <div v-for="artist in filteredArtists" :key="artist.name" class="artist-item"
          @click="selectArtist(artist.name)">
          <div class="artist-cover">
            <img v-if="artistPhotos[artist.name]" :src="artistPhotos[artist.name]" :alt="artist.name"
              @error="hideImage" />
            <img v-else-if="getCoverWork(artist)" :src="getImageUrl(getCoverWork(artist).code)" :alt="artist.name"
              @error="hideImage" />
            <div v-else class="placeholder">—</div>
          </div>
          <div class="artist-meta">
            <h2>{{ artist.name }}</h2>
            <p>{{ getArtistWorkCount(artist) }} works</p>
          </div>
          <button @click.stop="openArtistPhotoModal(artist.name)" class="edit-btn">📷</button>
        </div>
      </div>
    </main>

    <!-- WORKS VIEW -->
    <main v-else-if="currentView === 'works'" class="main">
      <div class="works-header">
        <button @click="backToArtists" class="back-btn">← Back</button>
        <div class="title-block">
          <h1>{{ currentArtist.name }}</h1>
          <div class="work-stats">
            <span class="count">{{ getArtistWorkCount(currentArtist) }} total</span>
            <span class="count-detail" v-if="currentArtist.mainWorks?.length">{{ currentArtist.mainWorks.length }}
              main</span>
            <span class="count-detail" v-if="currentArtist.compilations?.length">{{ currentArtist.compilations.length }}
              compilations</span>
          </div>
          <input v-model="workSearchQuery" type="text" placeholder="Search works..." class="search-input work-search"
            @input="handleWorkSearch" />
        </div>
        <button @click="openAddWorkModal" class="primary-btn">+ Add</button>
      </div>

      <div v-if="workSearchQuery && filteredMainWorks.length === 0 && filteredCompilations.length === 0"
        class="no-results">
        <p>No works found for "{{ workSearchQuery }}"</p>
      </div>

      <section v-if="filteredMainWorks.length" class="works-section">
        <h3>Main ({{ filteredMainWorks.length }})</h3>
        <div class="works-grid">
          <div v-for="work in filteredMainWorks" :key="work.code" class="work-item" @click="openWorkView(work)">
            <div class="work-cover">
              <img :src="getImageUrl(work.code)" :alt="work.code" @error="hideImage" />
              <div class="work-badges">
                <span v-if="isCoverWork(currentArtist.name, work.code)" class="badge cover">★</span>
                <span v-if="hasSimilarCode(work.code)" class="badge warn">!</span>
              </div>
            </div>
            <p>{{ work.code }}</p>
          </div>
        </div>
      </section>

      <section v-if="filteredCompilations.length" class="works-section">
        <h3>Compilations ({{ filteredCompilations.length }})</h3>
        <div class="works-grid">
          <div v-for="work in filteredCompilations" :key="work.code" class="work-item" @click="openWorkView(work)">
            <div class="work-cover">
              <img :src="getImageUrl(work.code)" :alt="work.code" @error="hideImage" />
              <div class="work-badges">
                <span v-if="isCoverWork(currentArtist.name, work.code)" class="badge cover">★</span>
                <span v-if="hasSimilarCode(work.code)" class="badge warn">!</span>
              </div>
            </div>
            <p>{{ work.code }}</p>
          </div>
        </div>
      </section>
    </main>

    <!-- DETAIL VIEW -->
    <main v-else-if="currentView === 'detail'" class="main detail">
      <button @click="backToWorks" class="back-btn">← Back</button>

      <div class="detail-grid">
        <div class="detail-left">
          <div class="cover-large" @click="openLightbox(currentWork, 0)">
            <img :src="getImageUrl(currentWork.code)" :alt="currentWork.code" @error="hideImage" />
          </div>

          <div class="detail-meta">
            <h2 @click="copyToClipboard(currentWork.code)" class="code-title">
              {{ currentWork.code }}
            </h2>
            <div class="detail-type">
              <span class="type-badge">{{ getWorkType(currentWork.code) }}</span>
            </div>
            <div class="meta-row">
              <button @click="setCoverWork(currentArtist.name, currentWork.code)" class="set-cover-btn"
                :class="{ active: isCoverWork(currentArtist.name, currentWork.code) }">
                {{ isCoverWork(currentArtist.name, currentWork.code) ? '★ Cover' : 'Set Cover' }}
              </button>
            </div>
            <div class="button-group">
              <button @click="openExternalLink(currentWork.code, 'njav')" class="link-btn">NJAV</button>
              <button @click="openExternalLink(currentWork.code, 'missav')" class="link-btn">MissAV</button>
              <button @click="openUploadModal(currentWork.code)" class="link-btn">{{ hasCustomImage(currentWork.code) ?
            'Update' : 'Add Image' }}</button>
              <button @click="deleteWork(currentWork.code)" class="link-btn delete-btn">Delete Work</button>
            </div>
            <div class="nav-row" v-if="currentWorkList.length > 1">
              <button @click="navigateWork(-1)" :disabled="!canNavigateWork(-1)" class="nav-btn">‹</button>
              <span class="nav-count">{{ currentWorkIndex + 1 }} / {{ currentWorkList.length }}</span>
              <button @click="navigateWork(1)" :disabled="!canNavigateWork(1)" class="nav-btn">›</button>
            </div>
          </div>
        </div>

        <div class="detail-right">
          <h3>Gallery</h3>
          <div class="gallery-grid">
            <div v-for="i in 20" :key="i" class="gallery-item" @click="openLightbox(currentWork, i)">
              <img :src="getImageUrl(currentWork.code, `jp-${i}`)" :alt="`${currentWork.code} - ${i}`"
                @error="dimImage" />
              <span>{{ i }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- MODALS -->
    <div v-if="showAddArtistModal" class="modal-overlay" @click.self="closeAddArtistModal">
      <div class="modal">
        <h3>Add Artist</h3>
        <input v-model="newArtist.name" placeholder="Name" class="input" />
        <input v-model="newArtist.photo" placeholder="Photo URL" class="input" />
        <div class="modal-actions">
          <button @click="addNewArtist" class="primary-btn">Add</button>
          <button @click="closeAddArtistModal" class="secondary-btn">Cancel</button>
        </div>
      </div>
    </div>

    <div v-if="showAddWorkModal" class="modal-overlay" @click.self="closeAddWorkModal">
      <div class="modal">
        <h3>Add Work</h3>
        <select v-model="newWork.artist" class="input">
          <option value="">Select artist...</option>
          <option v-for="a in artists" :key="a.name" :value="a.name">{{ a.name }}</option>
        </select>
        <input v-model="newWork.code" placeholder="Code (e.g., SONE-978)" class="input" />
        <div class="radio-group">
          <label><input v-model="newWork.type" type="radio" value="mainWorks" /> Main</label>
          <label><input v-model="newWork.type" type="radio" value="compilations" /> Compilation</label>
        </div>
        <div class="modal-actions">
          <button @click="addNewWork" class="primary-btn">Add</button>
          <button @click="closeAddWorkModal" class="secondary-btn">Cancel</button>
        </div>
      </div>
    </div>

    <div v-if="showUploadModal" class="modal-overlay" @click.self="closeUploadModal">
      <div class="modal">
        <h3>Custom Image</h3>
        <p class="modal-label">{{ uploadingWork }}</p>
        <input v-model="customImageUrl" placeholder="Image URL" class="input" @keyup.enter="handleCustomImageUrl" />
        <div class="modal-actions">
          <button @click="handleCustomImageUrl" class="primary-btn" :disabled="!customImageUrl.trim()">Add</button>
          <button @click="closeUploadModal" class="secondary-btn">Cancel</button>
        </div>
      </div>
    </div>

    <div v-if="showArtistPhotoModal" class="modal-overlay" @click.self="closeArtistPhotoModal">
      <div class="modal">
        <h3>Artist Photo</h3>
        <p class="modal-label">{{ editingArtistName }}</p>
        <input v-model="artistPhotoUrl" placeholder="Photo URL" class="input" @keyup.enter="updateArtistPhoto" />
        <div class="modal-actions">
          <button @click="updateArtistPhoto" class="primary-btn" :disabled="!artistPhotoUrl.trim()">Update</button>
          <button @click="closeArtistPhotoModal" class="secondary-btn">Cancel</button>
        </div>
      </div>
    </div>

    <!-- LIGHTBOX -->
    <div v-if="lightbox.show" class="lightbox" @click.self="closeLightbox">
      <button class="lb-close" @click="closeLightbox">✕</button>
      <button v-if="lightbox.images.length > 1" class="lb-btn lb-prev" @click="prevImage">‹</button>
      <img :src="lightbox.images[lightbox.currentIndex]" :alt="lightbox.code" />
      <button v-if="lightbox.images.length > 1" class="lb-btn lb-next" @click="nextImage">›</button>
      <div class="lb-counter">{{ lightbox.currentIndex + 1 }} / {{ lightbox.images.length }}</div>
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
        resolve(false)
        return
      }

      const request = indexedDB.open(this.dbName, 1)
      request.onerror = () => reject(new Error('IndexedDB failed'))
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
      coverImageUrl: '',
      showArtistUrlModal: false,
      artistCustomUrl: '',
      searchQuery: '',
      workSearchQuery: ''
    }
  },
  computed: {
    totalCount() {
      return this.artists.reduce((sum, a) => sum + (a.mainWorks?.length || 0) + (a.compilations?.length || 0), 0)
    },
    totalMainWorks() {
      return this.artists.reduce((sum, a) => sum + (a.mainWorks?.length || 0), 0)
    },
    totalCompilations() {
      return this.artists.reduce((sum, a) => sum + (a.compilations?.length || 0), 0)
    },
    currentArtist() {
      return this.artists.find(a => a.name === this.activeTab)
    },
    sortedArtists() {
      return [...this.artists].sort((a, b) => a.name.localeCompare(b.name))
    },
    filteredArtists() {
      if (!this.searchQuery.trim()) return this.sortedArtists
      const query = this.searchQuery.toLowerCase()
      return this.sortedArtists.filter(artist =>
        artist.name.toLowerCase().includes(query)
      )
    },
    sortedMainWorks() {
      if (!this.currentArtist?.mainWorks) return []
      return [...this.currentArtist.mainWorks].sort((a, b) => a.code.localeCompare(b.code))
    },
    sortedCompilations() {
      if (!this.currentArtist?.compilations) return []
      return [...this.currentArtist.compilations].sort((a, b) => a.code.localeCompare(b.code))
    },
    filteredMainWorks() {
      if (!this.workSearchQuery.trim()) return this.sortedMainWorks
      const query = this.workSearchQuery.toLowerCase()
      return this.sortedMainWorks.filter(work =>
        work.code.toLowerCase().includes(query)
      )
    },
    filteredCompilations() {
      if (!this.workSearchQuery.trim()) return this.sortedCompilations
      const query = this.workSearchQuery.toLowerCase()
      return this.sortedCompilations.filter(work =>
        work.code.toLowerCase().includes(query)
      )
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
    artistPhotos: {
      handler(v) {
        if (process.client) localStorage.setItem('artistPhotos', JSON.stringify(v))
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

    getArtistWorkCount(artist) {
      return (artist.mainWorks?.length || 0) + (artist.compilations?.length || 0)
    },

    getWorkType(code) {
      if (!this.currentArtist) return ''
      const isMain = this.currentArtist.mainWorks?.some(w => w.code === code)
      return isMain ? 'Main Work' : 'Compilation'
    },

    selectArtist(name) {
      this.activeTab = name
      this.currentView = 'works'
      this.workSearchQuery = ''
    },

    backToArtists() {
      this.currentView = 'artists'
      this.activeTab = ''
      this.searchQuery = ''
    },

    backToWorks() {
      this.currentView = 'works'
      this.currentWork = null
    },

    handleSearch() {
      // Search is reactive via computed property
    },

    handleWorkSearch() {
      // Search is reactive via computed property
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
      if (!this.newArtist.name.trim()) return this.showToast('Name required', 'error')
      if (this.artists.some(a => a.name === this.newArtist.name)) return this.showToast('Artist exists', 'error')
      const newArtist = { name: this.newArtist.name.trim(), photo: this.newArtist.photo || '', mainWorks: [], compilations: [] }
      this.artists.push(newArtist)
      this.artists = [...this.artists]
      this.activeTab = newArtist.name
      this.closeAddArtistModal()
      this.showToast(`Added ${newArtist.name}`, 'success')
    },

    getCoverWork(artist) {
      if (artist.cover) {
        const allWorks = [...(artist.mainWorks || []), ...(artist.compilations || [])]
        const coverWork = allWorks.find(w => w.code === artist.cover)
        if (coverWork) return coverWork
      }

      if (artist.mainWorks?.length > 0) {
        return artist.mainWorks[0]
      }

      if (artist.compilations?.length > 0) {
        return artist.compilations[0]
      }

      return null
    },

    setCoverWork(artistName, workCode) {
      const artist = this.artists.find(a => a.name === artistName)
      if (artist) {
        artist.cover = workCode
        this.artists = [...this.artists]
      }
      this.showToast('Cover updated', 'success')
    },

    isCoverWork(artistName, workCode) {
      const artist = this.artists.find(a => a.name === artistName)
      return artist?.cover === workCode
    },

    async addNewWork() {
      if (!this.newWork.artist || !this.newWork.code) return this.showToast('Required fields', 'error')
      const code = this.newWork.code.toUpperCase()
      if (this.artists.some(a => a.mainWorks?.some(w => w.code === code) || a.compilations?.some(w => w.code === code))) {
        return this.showToast('Code exists', 'error')
      }
      const artist = this.artists.find(a => a.name === this.newWork.artist)
      if (!artist) return this.showToast('Artist not found', 'error')
      if (!artist[this.newWork.type]) artist[this.newWork.type] = []
      artist[this.newWork.type].push({ code })
      this.artists = [...this.artists]
      this.closeAddWorkModal()
      this.showToast(`Added ${code}`, 'success')
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
        this.showToast('Copy failed', 'error')
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
      if (!url) return this.showToast('Enter URL', 'error')
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return this.showToast('Must start with http:// or https://', 'error')
      }

      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
      const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().includes(ext))
      if (!hasImageExtension) {
        const proceed = confirm('URL does not end with image extension. Continue?')
        if (!proceed) return
      }

      const img = new Image()
      const timeout = setTimeout(() => {
        this.showToast('Load timeout', 'error')
      }, 10000)

      img.onload = () => {
        clearTimeout(timeout)
        this.customImages = { ...this.customImages, [this.uploadingWork]: url }
        this.showToast('Image added', 'success')
        this.closeUploadModal()
        this.artists = [...this.artists]
      }

      img.onerror = () => {
        clearTimeout(timeout)
        this.showToast('Failed to load image', 'error')
      }

      img.src = url
    },

    async removeCustomImage(code) {
      if (confirm(`Remove custom image?`)) {
        const newCustomImages = { ...this.customImages }
        delete newCustomImages[code]
        this.customImages = newCustomImages
        this.showToast('Removed', 'success')
        this.artists = [...this.artists]
      }
    },

    showToast(msg, type = 'success') {
      this.toast = { show: true, message: msg, type }
      setTimeout(() => this.toast.show = false, 2500)
    },

    exportData() {
      try {
        const data = {
          artists: this.artists,
          customImages: this.customImages,
          artistPhotos: this.artistPhotos
        }
        const json = JSON.stringify(data, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `works-tracker-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
        this.showToast('Exported', 'success')
      } catch (e) {
        this.showToast('Export failed', 'error')
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
            this.showToast('Invalid format', 'error')
            return
          }

          this.artists = normalizeArtists(data.artists)
          this.customImages = data.customImages || {}
          this.artistPhotos = data.artistPhotos || {}
          localStorage.setItem('artists', JSON.stringify(this.artists))
          this.showToast('Imported', 'success')
        }
        reader.readAsText(file)
        event.target.value = ''
      } catch (e) {
        this.showToast('Import failed', 'error')
      }
    },

    openArtistPhotoModal(artistName) {
      this.editingArtistName = artistName
      this.artistPhotoUrl = this.artistPhotos[artistName] || ''
      const artist = this.artists.find(a => a.name === artistName)
      this.coverImageUrl = artist?.url || ''
      this.showArtistPhotoModal = true
    },

    openArtistUrl(url) {
      if (!url) return
      window.open(url, '_blank', 'noopener,noreferrer')
    },

    closeArtistPhotoModal() {
      this.showArtistPhotoModal = false
      this.editingArtistName = ''
      this.artistPhotoUrl = ''
      this.coverImageUrl = ''
    },

    openArtistUrlModal(artistName) {
      this.editingArtistName = artistName
      const artist = this.artists.find(a => a.name === artistName)
      this.artistCustomUrl = artist?.url || ''
      this.showArtistUrlModal = true
    },

    closeArtistUrlModal() {
      this.showArtistUrlModal = false
      this.editingArtistName = ''
      this.artistCustomUrl = ''
    },

    updateArtistUrl() {
      const artist = this.artists.find(a => a.name === this.editingArtistName)
      if (artist) {
        artist.url = this.artistCustomUrl.trim()
        this.artists = [...this.artists]
        this.showToast('URL updated', 'success')
        this.closeArtistUrlModal()
      }
    },

    updateArtistPhoto() {
      const url = this.artistPhotoUrl.trim()
      if (!url) {
        this.updateCoverImage()
        return
      }

      const img = new Image()
      const timeout = setTimeout(() => {
        this.showToast('Load timeout', 'error')
      }, 10000)

      img.onload = () => {
        clearTimeout(timeout)
        this.artistPhotos = { ...this.artistPhotos, [this.editingArtistName]: url }
        localStorage.setItem('artistPhotos', JSON.stringify(this.artistPhotos))
        this.updateCoverImage()
      }

      img.onerror = () => {
        clearTimeout(timeout)
        this.showToast('Photo load failed', 'error')
      }

      img.src = url
    },

    updateCoverImage() {
      const url = this.coverImageUrl.trim()
      if (!url) {
        this.showToast('Updated', 'success')
        this.closeArtistPhotoModal()
        return
      }

      const img = new Image()
      const timeout = setTimeout(() => {
        this.showToast('Cover load timeout', 'error')
        this.closeArtistPhotoModal()
      }, 10000)

      img.onload = () => {
        clearTimeout(timeout)
        const artist = this.artists.find(a => a.name === this.editingArtistName)
        if (artist) {
          artist.url = url
          this.artists = [...this.artists]
        }
        this.showToast('Updated', 'success')
        this.closeArtistPhotoModal()
      }

      img.onerror = () => {
        clearTimeout(timeout)
        this.showToast('Cover load failed', 'error')
      }

      img.src = url
    },

    async hardRefresh() {
      try {
        this.showToast('Refreshing...', 'info')
        localStorage.removeItem('artists')
        localStorage.removeItem('artistPhotos')
        this.artists = normalizeArtists(JSON.parse(JSON.stringify(DEFAULT_ARTISTS)))
        this.currentView = 'artists'
        this.activeTab = ''
        this.artistPhotos = {}
        localStorage.setItem('artists', JSON.stringify(this.artists))
        this.showToast('Reset to default', 'success')
      } catch (e) {
        this.showToast('Refresh failed', 'error')
      }
    },

    deleteWork(code) {
      if (!confirm(`Delete ${code}?\n\nThis action cannot be undone.`)) return

      const artist = this.currentArtist
      if (!artist) return

      // Remove from mainWorks
      if (artist.mainWorks) {
        const mainIndex = artist.mainWorks.findIndex(w => w.code === code)
        if (mainIndex !== -1) {
          artist.mainWorks.splice(mainIndex, 1)
        }
      }

      // Remove from compilations
      if (artist.compilations) {
        const compIndex = artist.compilations.findIndex(w => w.code === code)
        if (compIndex !== -1) {
          artist.compilations.splice(compIndex, 1)
        }
      }

      // If this was the cover, clear it
      if (artist.cover === code) {
        delete artist.cover
      }

      // Remove custom image if exists
      if (this.customImages[code]) {
        const newCustomImages = { ...this.customImages }
        delete newCustomImages[code]
        this.customImages = newCustomImages
      }

      this.artists = [...this.artists]
      this.showToast(`Deleted ${code}`, 'success')
      this.backToWorks()
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

:root {
  --bg: #fff;
  --bg-alt: #f5f5f5;
  --text: #000;
  --text-light: #555;
  --border: #ccc;
  --accent: #000;
}

.app {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.header {
  border-bottom: 2px solid var(--text);
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg);
}

.header-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header h1 {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.3px;
}

.header-stats {
  font-size: 12px;
  color: #555;
  font-weight: 400;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #000;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  color: var(--text);
  transition: all 0.2s;
  border-radius: 2px;
}

.icon-btn:hover {
  background: #000;
  color: #fff;
}

.main {
  width: 100%;
  padding: 40px 24px;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  gap: 20px;
}

.view-header h2 {
  font-size: 16px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 2px;
  font-size: 13px;
  font-family: inherit;
  min-width: 200px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #000;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
}

.work-search {
  margin-top: 12px;
  width: 100%;
  max-width: 300px;
}

.stats-pills {
  display: flex;
  gap: 8px;
}

.pill {
  padding: 4px 12px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  font-size: 11px;
  color: #555;
  font-weight: 500;
}

.no-results {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 14px;
}

.no-results p {
  margin: 0;
}

.artists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 32px;
}

.artist-item {
  cursor: pointer;
  position: relative;
}

.artist-item:hover .artist-cover {
  border: 2px solid #000;
}

.artist-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  background: #000;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}

.artist-item:hover .artist-cover {
  filter: brightness(0.95);
}

.artist-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 32px;
  color: #ddd;
  font-weight: 300;
}

.artist-meta {
  padding: 0;
}

.artist-meta h2 {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  line-height: 1.4;
}

.artist-meta p {
  font-size: 12px;
  color: #555;
}

.edit-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 2px;
  background: #000;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
}

.artist-item:hover .edit-btn {
  opacity: 1;
}

.works-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 48px;
  gap: 20px;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #555;
  padding: 8px 0;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #000;
}

.title-block {
  flex: 1;
  text-align: center;
}

.title-block h1 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.work-stats {
  display: flex;
  justify-content: center;
  gap: 12px;
  font-size: 13px;
}

.count {
  color: #000;
  font-weight: 500;
}

.count-detail {
  color: #777;
  font-weight: 400;
}

.primary-btn {
  padding: 8px 16px;
  background: var(--text);
  color: var(--bg);
  border: none;
  border-radius: 2px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}

.primary-btn:hover {
  background: #000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.secondary-btn {
  padding: 8px 16px;
  background: transparent;
  color: #000;
  border: 1px solid #000;
  border-radius: 2px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.secondary-btn:hover {
  background: #000;
  color: #fff;
}

.works-section {
  margin-bottom: 48px;
}

.works-section h3 {
  font-size: 11px;
  font-weight: 700;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin-bottom: 20px;
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px;
}

.work-item {
  cursor: pointer;
}

.work-item:hover .work-cover {
  border: 2px solid #000;
}

.work-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  background: #000;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
  transition: filter 0.2s;
}

.work-item:hover .work-cover {
  filter: brightness(0.95);
}

.work-cover img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

.work-badges {
  position: absolute;
  top: 4px;
  left: 4px;
  display: flex;
  gap: 4px;
}

.badge {
  font-size: 11px;
  padding: 2px 4px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border-radius: 2px;
}

.badge.cover {
  background: rgba(0, 0, 0, 0.8);
}

.badge.warn {
  background: rgba(255, 100, 100, 0.8);
}

.work-item>p {
  font-size: 12px;
  color: #333;
  font-family: 'Monaco', 'Courier', monospace;
}

.detail {
  padding: 24px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 500px 1fr;
  gap: 48px;
}

.detail-left {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.cover-large {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  background: #000;
  border-radius: 2px;
  overflow: hidden;
  cursor: pointer;
  transition: opacity 0.2s;
  border: 1px solid #000;
}

.cover-large:hover {
  border: 2px solid #000;
}

.cover-large img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.detail-meta {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.code-title {
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  user-select: all;
  font-family: 'Monaco', 'Courier', monospace;
  transition: all 0.2s;
  padding: 4px 8px;
  margin: -4px -8px;
  border: 1px solid transparent;
}

.code-title:hover {
  border: 1px solid #000;
  background: #f5f5f5;
}

.detail-type {
  margin-top: -8px;
}

.type-badge {
  display: inline-block;
  padding: 4px 8px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 2px;
  font-size: 11px;
  color: #555;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.meta-row {
  display: flex;
  gap: 8px;
}

.set-cover-btn {
  padding: 8px 12px;
  background: transparent;
  border: 1px solid #000;
  border-radius: 2px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.set-cover-btn:hover {
  background: #000;
  color: #fff;
}

.set-cover-btn.active {
  background: #000;
  color: #fff;
  border-color: #000;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.link-btn {
  padding: 8px 12px;
  background: transparent;
  border: 1px solid #000;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  text-align: left;
}

.link-btn:hover {
  background: #000;
  color: #fff;
}

.delete-btn {
  border-color: #d32f2f;
  color: #d32f2f;
}

.delete-btn:hover {
  background: #d32f2f;
  color: #fff;
}

.nav-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.nav-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #000;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: #000;
  color: #fff;
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-count {
  font-size: 12px;
  color: #555;
  min-width: 40px;
  text-align: center;
}

.detail-right h3 {
  font-size: 11px;
  font-weight: 700;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin-bottom: 20px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.gallery-item {
  position: relative;
  aspect-ratio: 3 / 2;
  background: #000;
  border-radius: 2px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #000;
}

.gallery-item:hover {
  border: 2px solid #000;
}

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

.gallery-item span {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 1px 3px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: var(--bg);
  border-radius: 2px;
  max-width: 400px;
  width: 100%;
  padding: 24px;
  border: 2px solid #000;
}

.modal h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.modal-label {
  font-size: 12px;
  color: #555;
  margin-bottom: 8px;
  display: block;
}

.input {
  width: 100%;
  padding: 10px;
  border: 1px solid #000;
  border-radius: 2px;
  font-size: 13px;
  margin-bottom: 12px;
  transition: all 0.2s;
  font-family: inherit;
}

.input:focus {
  outline: none;
  border: 2px solid #000;
  box-shadow: inset 0 0 0 3px rgba(0, 0, 0, 0.05);
}

.radio-group {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
}

.radio-group input {
  cursor: pointer;
}

.modal-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.modal-actions .primary-btn {
  flex: 1;
}

.modal-actions .secondary-btn {
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
}

.lb-close {
  position: fixed;
  top: 24px;
  right: 24px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 18px;
  transition: background 0.2s;
}

.lb-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.lb-btn {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  cursor: pointer;
  font-size: 18px;
  transition: background 0.2s;
}

.lb-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.lb-prev {
  left: 24px;
}

.lb-next {
  right: 24px;
}

.lb-counter {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--text);
  color: var(--bg);
  padding: 12px 16px;
  border-radius: 2px;
  font-size: 12px;
  z-index: 3000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast-error {
  background: #d32f2f;
}

.toast-info {
  background: #1976d2;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1024px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .artists-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 24px;
  }

  .works-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }

  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}

@media (max-width: 640px) {
  .header-inner {
    padding: 16px 12px;
  }

  .header h1 {
    font-size: 18px;
  }

  .header-stats {
    font-size: 11px;
  }

  .main {
    padding: 24px 12px;
  }

  .view-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
    min-width: auto;
  }

  .stats-pills {
    justify-content: center;
  }

  .works-header {
    flex-direction: column;
  }

  .work-stats {
    flex-direction: column;
    gap: 4px;
  }

  .work-search {
    max-width: 100%;
  }

  .artists-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
  }

  .works-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 16px;
  }

  .detail-grid {
    gap: 24px;
  }

  .detail-left {
    max-width: 100%;
  }
}
</style>