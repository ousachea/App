<template>
  <div class="app-container">

    <!-- HEADER -->
    <header class="header">
      <div class="header-inner">
        <div class="header-title">
          <h1>Works</h1>
          <span class="header-stats">{{ artists.length }} artists · {{ totalCount }} works</span>
        </div>
        <div class="header-actions">
          <button @click="clearViewHistory" title="Clear History" class="icon-btn">🗑</button>
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
          <select v-model="artistSortBy" class="sort-select" @change="handleArtistSortChange">
            <option value="nameAsc">Name (A-Z)</option>
            <option value="nameDesc">Name (Z-A)</option>
            <option value="mostWorks">Most Works</option>
            <option value="leastWorks">Least Works</option>
          </select>
          <input ref="searchInput" v-model="searchQuery" type="text" placeholder="Search artists..."
            class="search-input" @input="handleSearch" />
        </div>
      </div>

      <div v-if="searchQuery && filteredArtists.length === 0" class="no-results">
        <p>No artists found for "{{ searchQuery }}"</p>
      </div>

      <!-- Artists Grid with Alphabetical Grouping -->
      <div v-for="group in groupedArtists" :key="group.letter" class="artist-group">
        <div class="group-letter">{{ group.letter }}</div>
        <div class="artists-grid">
          <div v-for="(artist, index) in group.artists" :key="artist.name"
            :class="['artist-item', { 'highlighted': viewedArtists.includes(artist.name) }]"
            @click="selectArtist(artist.name)">
            <div class="artist-cover">
              <div v-if="imageLoadingStates[artist.name] === 'loading'" class="image-loading">
                <div class="spinner"></div>
              </div>

              <img v-if="getProgressiveImage(artist).thumb && imageLoadingStates[artist.name] !== 'loaded'"
                :src="getProgressiveImage(artist).thumb" :alt="artist.name" class="image-blur"
                @load="onThumbLoad(artist.name)" />

              <img v-if="getProgressiveImage(artist).full" :src="getProgressiveImage(artist).full" :alt="artist.name"
                @load="onImageLoad(artist.name)" @error="onImageError($event, artist.name, 'artist')"
                :class="{ hidden: imageLoadingStates[artist.name] === 'loading' }" />

              <div v-if="!getProgressiveImage(artist).full && !getProgressiveImage(artist).thumb" class="placeholder">—
              </div>

              <button v-if="imageLoadingStates[artist.name] === 'error'" @click.stop="retryImage(artist.name, 'artist')"
                class="retry-btn">
                ⟳ Retry
              </button>
            </div>
            <div class="artist-meta">
              <h2><span class="index-number">{{ index + 1 }}.</span> {{ artist.name }}</h2>
              <p>{{ getArtistWorkCount(artist) }} works</p>
            </div>
            <button @click.stop="openArtistPhotoModal(artist.name)" class="edit-btn">📷</button>
          </div>
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

          <!-- Artist Navigation Row -->
          <div class="artist-nav-row" v-if="currentArtistList.length > 1">
            <button @click="navigateArtist(-1)" :disabled="!canNavigateArtist(-1)" class="nav-btn">‹</button>
            <span class="nav-count">Artist {{ currentArtistIndex + 1 }} / {{ currentArtistList.length }}</span>
            <button @click="navigateArtist(1)" :disabled="!canNavigateArtist(1)" class="nav-btn">›</button>
          </div>

          <!-- Search Row -->
          <div class="controls-row">
            <input v-model="workSearchQuery" type="text" placeholder="Search works..." class="search-input work-search"
              @input="handleWorkSearch" />
          </div>
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
          <div v-for="(work, index) in filteredMainWorks" :key="work.code"
            :class="['work-item', { 'highlighted': viewedWorks.includes(work.code) }]" @click="openWorkView(work)">
            <div class="work-cover">
              <div v-if="imageLoadingStates[work.code] === 'loading'" class="image-loading">
                <div class="spinner"></div>
              </div>

              <img v-if="getProgressiveWorkImage(work).thumb && imageLoadingStates[work.code] !== 'loaded'"
                :src="getProgressiveWorkImage(work).thumb" :alt="work.code" class="image-blur" />

              <img :src="getProgressiveWorkImage(work).full" :alt="work.code" loading="lazy"
                @load="onImageLoad(work.code)" @error="onImageError($event, work.code, 'work')"
                :class="{ hidden: imageLoadingStates[work.code] === 'loading' }" />

              <button v-if="imageLoadingStates[work.code] === 'error'" @click.stop="retryImage(work.code, 'work')"
                class="retry-btn-small">
                ⟳
              </button>
              <div class="work-badges">
                <span v-if="isCoverWork(currentArtist.name, work.code)" class="badge cover">★</span>
                <span v-if="hasSimilarCode(work.code)" class="badge warn">!</span>
              </div>
            </div>
            <p><span class="index-number">{{ index + 1 }}.</span> {{ work.code }}</p>
          </div>
        </div>
      </section>

      <section v-if="filteredCompilations.length" class="works-section">
        <h3>Compilations ({{ filteredCompilations.length }})</h3>

        <div class="works-grid">
          <div v-for="(work, index) in filteredCompilations" :key="work.code"
            :class="['work-item', { 'highlighted': viewedWorks.includes(work.code) }]" @click="openWorkView(work)">
            <div class="work-cover">
              <div v-if="imageLoadingStates[work.code] === 'loading'" class="image-loading">
                <div class="spinner"></div>
              </div>

              <img v-if="getProgressiveWorkImage(work).thumb && imageLoadingStates[work.code] !== 'loaded'"
                :src="getProgressiveWorkImage(work).thumb" :alt="work.code" class="image-blur" />

              <img :src="getProgressiveWorkImage(work).full" :alt="work.code" loading="lazy"
                @load="onImageLoad(work.code)" @error="onImageError($event, work.code, 'work')"
                :class="{ hidden: imageLoadingStates[work.code] === 'loading' }" />

              <button v-if="imageLoadingStates[work.code] === 'error'" @click.stop="retryImage(work.code, 'work')"
                class="retry-btn-small">
                ⟳
              </button>
              <div class="work-badges">
                <span v-if="isCoverWork(currentArtist.name, work.code)" class="badge cover">★</span>
                <span v-if="hasSimilarCode(work.code)" class="badge warn">!</span>
              </div>
            </div>
            <p><span class="index-number">{{ index + 1 }}.</span> {{ work.code }}</p>
          </div>
        </div>
      </section>
    </main>

    <!-- DETAIL VIEW -->
    <main v-else-if="currentView === 'detail'" class="main detail">
      <button @click="backToWorks" class="back-btn">← Back</button>

      <div v-if="currentWorkList.length > 1" class="swipe-hint">
        <span>← Swipe to navigate →</span>
      </div>

      <div class="detail-grid">
        <div class="detail-left">
          <div class="cover-large" @click="openLightbox(currentWork, 0)">
            <div v-if="imageLoadingStates[currentWork.code] === 'loading'" class="image-loading">
              <div class="spinner"></div>
            </div>

            <img v-if="getProgressiveWorkImage(currentWork).thumb && imageLoadingStates[currentWork.code] !== 'loaded'"
              :src="getProgressiveWorkImage(currentWork).thumb" :alt="currentWork.code" class="image-blur" />

            <img :src="getProgressiveWorkImage(currentWork).full" :alt="currentWork.code"
              @load="onImageLoad(currentWork.code)" @error="onImageError($event, currentWork.code, 'detail')"
              :class="{ hidden: imageLoadingStates[currentWork.code] === 'loading' }" />

            <button v-if="imageLoadingStates[currentWork.code] === 'error'"
              @click.stop="retryImage(currentWork.code, 'detail')" class="retry-btn">
              ⟳ Retry Loading
            </button>
            <div class="image-overlay">
              <span class="zoom-hint">Click to enlarge</span>
            </div>
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
              <button @click="openExternalLink(currentWork.code, '24av')" class="link-btn">24AV</button>
              <button @click="openExternalLink(currentWork.code, '24av-uncensored')" class="link-btn">24AV UC</button>
              <button @click="openUploadModal(currentWork.code)" class="link-btn">{{ hasCustomImage(currentWork.code) ?
            'Update' : 'Add Image' }}</button>
            </div>
            <div class="nav-row" v-if="currentWorkList.length > 1">
              <button @click="navigateWork(-1)" :disabled="!canNavigateWork(-1)" class="nav-btn">‹</button>
              <span class="nav-count">{{ currentWorkIndex + 1 }} / {{ currentWorkList.length }}</span>
              <button @click="navigateWork(1)" :disabled="!canNavigateWork(1)" class="nav-btn">›</button>
            </div>
          </div>
        </div>

        <div class="detail-right">
          <div class="gallery-header">
            <h3>Gallery</h3>
            <button @click="preloadAllGallery" class="preload-btn" :disabled="isPreloading">
              {{ isPreloading ? 'Loading...' : 'Load All' }}
            </button>
          </div>
          <div class="gallery-grid">
            <div v-for="i in 20" :key="i" class="gallery-item" @click="openLightbox(currentWork, i)">
              <div v-if="galleryLoadingStates[`${currentWork.code}-${i}`] === 'loading'" class="image-loading-small">
                <div class="spinner-small"></div>
              </div>
              <img :src="getImageUrl(currentWork.code, `jp-${i}`)" :alt="`${currentWork.code} - ${i}`" loading="lazy"
                @load="onGalleryImageLoad(currentWork.code, i)"
                @error="onGalleryImageError($event, currentWork.code, i)" :class="{
            hidden: galleryLoadingStates[`${currentWork.code}-${i}`] === 'loading',
            dimmed: galleryLoadingStates[`${currentWork.code}-${i}`] === 'error'
          }" />
              <span class="gallery-number">{{ i }}</span>
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
      <div v-if="lightbox.images.length > 1" class="lb-swipe-hint">← Swipe →</div>
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
      currentArtistList: [],
      currentArtistIndex: 0,
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
      workSearchQuery: '',
      artistSortBy: 'nameAsc', // nameAsc, nameDesc, mostWorks, leastWorks
      imageLoadingStates: {},
      galleryLoadingStates: {},
      isPreloading: false,
      showShortcutsHelp: false,
      touchStartX: 0,
      touchStartY: 0,
      touchEndX: 0,
      touchEndY: 0,
      minSwipeDistance: 50,
      scrollPositions: {
        artists: 0,
        works: 0
      },
      viewedArtists: [],
      viewedWorks: []
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
      const artists = [...this.artists]
      switch (this.artistSortBy) {
        case 'nameAsc':
          return artists.sort((a, b) => a.name.localeCompare(b.name))
        case 'nameDesc':
          return artists.sort((a, b) => b.name.localeCompare(a.name))
        case 'mostWorks':
          return artists.sort((a, b) => this.getArtistWorkCount(b) - this.getArtistWorkCount(a))
        case 'leastWorks':
          return artists.sort((a, b) => this.getArtistWorkCount(a) - this.getArtistWorkCount(b))
        default:
          return artists.sort((a, b) => a.name.localeCompare(b.name))
      }
    },
    filteredArtists() {
      if (!this.searchQuery.trim()) return this.sortedArtists
      const query = this.searchQuery.toLowerCase()
      return this.sortedArtists.filter(artist =>
        artist.name.toLowerCase().includes(query)
      )
    },
    groupedArtists() {
      const groups = {}

      this.filteredArtists.forEach(artist => {
        const firstLetter = artist.name.charAt(0).toUpperCase()
        if (!groups[firstLetter]) {
          groups[firstLetter] = []
        }
        groups[firstLetter].push(artist)
      })

      return Object.keys(groups)
        .sort()
        .map(letter => ({
          letter,
          artists: groups[letter]
        }))
    },
    filteredMainWorks() {
      if (!this.currentArtist?.mainWorks) return []
      if (!this.workSearchQuery.trim()) return this.currentArtist.mainWorks
      const query = this.workSearchQuery.toLowerCase()
      return this.currentArtist.mainWorks.filter(work =>
        work.code.toLowerCase().includes(query)
      )
    },
    filteredCompilations() {
      if (!this.currentArtist?.compilations) return []
      if (!this.workSearchQuery.trim()) return this.currentArtist.compilations
      const query = this.workSearchQuery.toLowerCase()
      return this.currentArtist.compilations.filter(work =>
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
    },
    viewedArtists: {
      handler(v) {
        if (process.client) localStorage.setItem('viewedArtists', JSON.stringify(v))
      },
      deep: true
    },
    viewedWorks: {
      handler(v) {
        if (process.client) localStorage.setItem('viewedWorks', JSON.stringify(v))
      },
      deep: true
    },
    artistSortBy: {
      handler(v) {
        if (process.client) localStorage.setItem('artistSortBy', v)
      }
    }
  },
  mounted() {
    if (process.client) {
      this.imageDB = new ImageDB()

      try {
        const savedArtistSort = localStorage.getItem('artistSortBy')
        if (savedArtistSort) this.artistSortBy = savedArtistSort
      } catch (e) {
        console.warn('Failed to load artist sort preference:', e)
      }

      try {
        const saved = localStorage.getItem('artistPhotos')
        if (saved) this.artistPhotos = JSON.parse(saved)
      } catch (e) {
        console.warn('Failed to load artist photos:', e)
      }

      try {
        const savedViewedArtists = localStorage.getItem('viewedArtists')
        if (savedViewedArtists) this.viewedArtists = JSON.parse(savedViewedArtists)
      } catch (e) {
        console.warn('Failed to load viewed artists:', e)
      }

      try {
        const savedViewedWorks = localStorage.getItem('viewedWorks')
        if (savedViewedWorks) this.viewedWorks = JSON.parse(savedViewedWorks)
      } catch (e) {
        console.warn('Failed to load viewed works:', e)
      }

      this.initializeApp()
    }
  },
  methods: {
    handleArtistSortChange() {
      const sortNames = {
        nameAsc: 'Name (A-Z)',
        nameDesc: 'Name (Z-A)',
        mostWorks: 'Most Works',
        leastWorks: 'Least Works'
      }
      this.showToast(`Sorted by ${sortNames[this.artistSortBy]}`, 'info')
    },

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
            // Add timestamps to existing works that don't have them
            this.migrateWorkTimestamps()
          }
        }
      } catch (e) {
        console.warn('Failed to load artists:', e)
      }

      if (this.artists.length && !this.activeTab) {
        this.activeTab = this.artists[0].name
      }

      this.setupKeyboardShortcuts()
      this.setupTouchListeners()
    },

    migrateWorkTimestamps() {
      let needsSave = false
      const now = Date.now()

      this.artists.forEach(artist => {
        ;['mainWorks', 'compilations'].forEach(type => {
          if (artist[type]?.length) {
            artist[type].forEach(work => {
              if (!work.addedAt) {
                work.addedAt = now
                needsSave = true
              }
            })
          }
        })
      })

      if (needsSave) {
        this.artists = [...this.artists]
      }
    },

    navigateArtist(direction) {
      const newIndex = this.currentArtistIndex + direction
      if (newIndex >= 0 && newIndex < this.currentArtistList.length) {
        this.currentArtistIndex = newIndex
        const newArtist = this.currentArtistList[newIndex]

        if (!this.viewedArtists.includes(newArtist.name)) {
          this.viewedArtists.push(newArtist.name)
        }

        this.activeTab = newArtist.name
        this.workSearchQuery = ''

        this.$nextTick(() => {
          window.scrollTo(0, 0)
        })
      }
    },

    canNavigateArtist(direction) {
      const newIndex = this.currentArtistIndex + direction
      return newIndex >= 0 && newIndex < this.currentArtistList.length
    },

    setupKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        if (e.key === '/' && !this.isInputFocused()) {
          e.preventDefault()
          if (this.$refs.searchInput) {
            this.$refs.searchInput.focus()
          }
        }

        if (e.key === '?' && !this.isInputFocused()) {
          e.preventDefault()
          this.showShortcutsHelp = true
        }

        if (this.lightbox.show) {
          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            this.prevImage()
          } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            this.nextImage()
          } else if (e.key === 'Escape') {
            this.closeLightbox()
          }
        }
        else if (this.currentView === 'detail') {
          if (e.key === 'ArrowLeft' && this.canNavigateWork(-1)) {
            e.preventDefault()
            this.navigateWork(-1)
          } else if (e.key === 'ArrowRight' && this.canNavigateWork(1)) {
            e.preventDefault()
            this.navigateWork(1)
          } else if (e.key === ' ' && !this.isInputFocused()) {
            e.preventDefault()
            this.openLightbox(this.currentWork, 0)
          } else if (e.key === 'Escape') {
            this.backToWorks()
          }
        }
        else if (this.currentView === 'works') {
          if (!this.isInputFocused()) {
            if (e.key === 'ArrowLeft' && this.canNavigateArtist(-1)) {
              e.preventDefault()
              this.navigateArtist(-1)
            } else if (e.key === 'ArrowRight' && this.canNavigateArtist(1)) {
              e.preventDefault()
              this.navigateArtist(1)
            }
          }

          if (e.key === 'Escape') {
            this.backToArtists()
          }
        }

        if (e.key === 'Escape') {
          if (this.showShortcutsHelp) this.showShortcutsHelp = false
          if (this.showAddWorkModal) this.closeAddWorkModal()
          if (this.showAddArtistModal) this.closeAddArtistModal()
          if (this.showUploadModal) this.closeUploadModal()
          if (this.showArtistPhotoModal) this.closeArtistPhotoModal()
        }
      })
    },

    isInputFocused() {
      const activeElement = document.activeElement
      return activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT'
      )
    },

    setupTouchListeners() {
      if (process.client) {
        document.addEventListener('touchstart', this.handleTouchStart, { passive: true })
        document.addEventListener('touchmove', this.handleTouchMove, { passive: true })
        document.addEventListener('touchend', this.handleTouchEnd, { passive: true })
      }
    },

    handleTouchStart(e) {
      this.touchStartX = e.changedTouches[0].screenX
      this.touchStartY = e.changedTouches[0].screenY
    },

    handleTouchMove(e) {
      this.touchEndX = e.changedTouches[0].screenX
      this.touchEndY = e.changedTouches[0].screenY
    },

    handleTouchEnd() {
      this.handleSwipe()
    },

    handleSwipe() {
      const deltaX = this.touchEndX - this.touchStartX
      const deltaY = this.touchEndY - this.touchStartY
      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      if (absDeltaX < this.minSwipeDistance || absDeltaY > absDeltaX) {
        return
      }

      if (this.lightbox.show) {
        if (deltaX > 0) {
          this.prevImage()
        } else {
          this.nextImage()
        }
      }
      else if (this.currentView === 'detail') {
        if (deltaX > 0 && this.canNavigateWork(-1)) {
          this.navigateWork(-1)
        } else if (deltaX < 0 && this.canNavigateWork(1)) {
          this.navigateWork(1)
        }
      }
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
      this.saveScrollPosition('artists')

      if (!this.viewedArtists.includes(name)) {
        this.viewedArtists.push(name)
      }

      this.currentArtistList = this.filteredArtists
      this.currentArtistIndex = this.currentArtistList.findIndex(a => a.name === name)

      this.activeTab = name
      this.currentView = 'works'
      this.workSearchQuery = ''

      this.$nextTick(() => {
        window.scrollTo(0, 0)
      })
    },

    backToArtists() {
      this.currentView = 'artists'
      this.activeTab = ''
      this.searchQuery = ''

      this.$nextTick(() => {
        this.restoreScrollPosition('artists')
      })
    },

    backToWorks() {
      this.currentView = 'works'
      this.currentWork = null

      this.$nextTick(() => {
        this.restoreScrollPosition('works')
      })
    },

    handleSearch() {
      // Search is reactive
    },

    handleWorkSearch() {
      // Search is reactive
    },

    onThumbLoad(key) {
      // Thumbnail loaded
    },

    onImageLoad(key) {
      this.$set(this.imageLoadingStates, key, 'loaded')
    },

    onImageError(event, key, type) {
      this.$set(this.imageLoadingStates, key, 'error')
      event.target.style.display = 'none'
    },

    retryImage(key, type) {
      this.$set(this.imageLoadingStates, key, 'loading')
      this.$nextTick(() => {
        this.$set(this.imageLoadingStates, key, null)
      })
    },

    onGalleryImageLoad(code, index) {
      const key = `${code}-${index}`
      this.$set(this.galleryLoadingStates, key, 'loaded')
    },

    onGalleryImageError(event, code, index) {
      const key = `${code}-${index}`
      this.$set(this.galleryLoadingStates, key, 'error')
      event.target.style.opacity = '0.2'
    },

    async preloadAllGallery() {
      if (!this.currentWork) return
      this.isPreloading = true

      const promises = []
      for (let i = 1; i <= 20; i++) {
        const img = new Image()
        const url = this.getImageUrl(this.currentWork.code, `jp-${i}`)
        const key = `${this.currentWork.code}-${i}`

        this.$set(this.galleryLoadingStates, key, 'loading')

        const promise = new Promise((resolve) => {
          img.onload = () => {
            this.$set(this.galleryLoadingStates, key, 'loaded')
            resolve()
          }
          img.onerror = () => {
            this.$set(this.galleryLoadingStates, key, 'error')
            resolve()
          }
          img.src = url
        })

        promises.push(promise)
      }

      await Promise.all(promises)
      this.isPreloading = false
      this.showToast('Gallery loaded', 'success')
    },

    getProgressiveImage(artist) {
      if (this.artistPhotos[artist.name]) {
        return { full: this.artistPhotos[artist.name], thumb: null }
      }

      const coverWork = this.getCoverWork(artist)
      if (!coverWork) {
        return { full: null, thumb: null }
      }

      return this.getProgressiveWorkImage(coverWork)
    },

    getProgressiveWorkImage(work) {
      if (this.customImages[work.code]) {
        return { full: this.customImages[work.code], thumb: null }
      }

      const parsed = parseWorkCode(work.code)
      if (!parsed) return { full: null, thumb: null }

      const paddedNum = parsed.number.padStart(5, '0')
      const dmmId = `${parsed.prefix}${paddedNum}`

      if (dmmId.length < 3) return { full: null, thumb: null }

      return {
        thumb: `https://pics.dmm.co.jp/digital/video/${dmmId}/${dmmId}ps.jpg`,
        full: `https://pics.dmm.co.jp/digital/video/${dmmId}/${dmmId}pl.jpg`
      }
    },

    hideImage(e) {
      e.target.style.display = 'none'
    },

    dimImage(e) {
      e.target.style.opacity = '0.2'
    },

    openWorkView(work) {
      this.saveScrollPosition('works')

      if (!this.viewedWorks.includes(work.code)) {
        this.viewedWorks.push(work.code)
      }

      const isMain = this.currentArtist.mainWorks.find(w => w.code === work.code)
      this.currentWorkList = isMain ? this.filteredMainWorks : this.filteredCompilations

      this.currentWorkIndex = this.currentWorkList.findIndex(w => w.code === work.code)
      this.currentWork = work
      this.currentView = 'detail'

      this.$nextTick(() => {
        window.scrollTo(0, 0)
        this.preloadAdjacentWorks()
      })
    },

    preloadAdjacentWorks() {
      if (this.currentWorkIndex > 0) {
        const prevWork = this.currentWorkList[this.currentWorkIndex - 1]
        const prevImages = this.getProgressiveWorkImage(prevWork)
        if (prevImages.full) {
          const img = new Image()
          img.src = prevImages.full
        }
      }

      if (this.currentWorkIndex < this.currentWorkList.length - 1) {
        const nextWork = this.currentWorkList[this.currentWorkIndex + 1]
        const nextImages = this.getProgressiveWorkImage(nextWork)
        if (nextImages.full) {
          const img = new Image()
          img.src = nextImages.full
        }
      }
    },

    navigateWork(direction) {
      const newIndex = this.currentWorkIndex + direction
      if (newIndex >= 0 && newIndex < this.currentWorkList.length) {
        this.currentWorkIndex = newIndex
        this.currentWork = this.currentWorkList[newIndex]
        this.preloadAdjacentWorks()
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

      // Add work with timestamp
      artist[this.newWork.type].push({
        code,
        addedAt: Date.now()
      })

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
      let url

      if (type === 'missav') {
        url = `https://missav.ws/en/${formattedCode}`
      } else if (type === '24av') {
        url = `https://24av.net/en/v/${formattedCode}`
      } else if (type === '24av-uncensored') {
        url = `https://24av.net/en/v/${formattedCode}-uncensored-leaked`
      } else {
        url = `https://www.njav.com/en/xvideos/${formattedCode}`
      }

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
          this.migrateWorkTimestamps()
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

    saveScrollPosition(view) {
      if (process.client) {
        this.scrollPositions[view] = window.scrollY || window.pageYOffset || 0
      }
    },

    restoreScrollPosition(view) {
      if (process.client) {
        const scrollPos = this.scrollPositions[view] || 0
        requestAnimationFrame(() => {
          window.scrollTo({
            top: scrollPos,
            behavior: 'instant'
          })
        })
      }
    },

    clearViewHistory() {
      if (confirm('Clear all viewing history? This will remove all highlights.')) {
        this.viewedArtists = []
        this.viewedWorks = []
        localStorage.removeItem('viewedArtists')
        localStorage.removeItem('viewedWorks')
        this.showToast('History cleared', 'success')
      }
    },

    async hardRefresh() {
      try {
        this.showToast('Refreshing...', 'info')
        localStorage.removeItem('artists')
        localStorage.removeItem('artistPhotos')
        localStorage.removeItem('viewedArtists')
        localStorage.removeItem('viewedWorks')
        localStorage.removeItem('artistSortBy')
        this.artists = normalizeArtists(JSON.parse(JSON.stringify(DEFAULT_ARTISTS)))
        this.currentView = 'artists'
        this.activeTab = ''
        this.artistPhotos = {}
        this.viewedArtists = []
        this.viewedWorks = []
        this.artistSortBy = 'nameAsc'
        localStorage.setItem('artists', JSON.stringify(this.artists))
        this.showToast('Reset to default', 'success')
      } catch (e) {
        this.showToast('Refresh failed', 'error')
      }
    }
  }
}
</script>

<style scoped>
/* CSS Variables */
:root {
  --bg: #ffffff;
  --bg-card: #ffffff;
  --bg-alt: #f9fafb;
  --text: #111827;
  --text-light: #6b7280;
  --border: #e5e7eb;
  --accent: #58a6ff;
  --accent-hover: #4a95e8;
  --purple: #a78bfa;
  --error: #ef4444;
  --info: #3b82f6;
  --gradient-1: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient-2: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --gradient-5: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* App Container */
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

/* Header */
.header {
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 0 0 rgba(88, 166, 255, 0.1);
  flex-shrink: 0;
}

.header-inner {
  max-width: 100%;
  margin: 0 auto;
  padding: 10px;
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
  color: var(--text-light);
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  cursor: pointer;
  font-size: 16px;
  color: var(--text-light);
  transition: all 0.2s;
  border-radius: 8px;
}

.icon-btn:hover {
  background: var(--accent);
  color: var(--bg);
  border-color: var(--accent);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(88, 166, 255, 0.4);
}

/* Main Content */
.main {
  width: 100%;
  padding: 12px;
  flex: 1;
  background: var(--bg);
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
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
  gap: 12px;
}

/* Improved Search Input */
.search-input {
  padding: 10px 16px;
  border: 2px solid var(--border);
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  min-width: 200px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--bg-card);
  color: var(--text);
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.search-input::placeholder {
  color: var(--text-light);
  opacity: 0.6;
}

.search-input:hover {
  border-color: var(--accent);
  box-shadow: 0 2px 8px rgba(88, 166, 255, 0.15);
}

.search-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(88, 166, 255, 0.15), 0 2px 12px rgba(88, 166, 255, 0.2);
  transform: translateY(-1px);
  animation: inputGlow 2s ease-in-out infinite;
}

.work-search {
  flex: 1;
  min-width: 200px;
}

/* Improved Sort Select */
.sort-select {
  padding: 10px 16px;
  padding-right: 36px;
  border: 2px solid var(--border);
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--bg-card);
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 12px;
  color: var(--text);
  cursor: pointer;
  font-weight: 500;
  min-width: 180px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.sort-select:hover {
  border-color: var(--accent);
  box-shadow: 0 2px 8px rgba(88, 166, 255, 0.15);
}

.sort-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(88, 166, 255, 0.15), 0 2px 12px rgba(88, 166, 255, 0.2);
  transform: translateY(-1px);
  animation: inputGlow 2s ease-in-out infinite;
}

.sort-select option {
  padding: 10px;
  background: var(--bg-card);
  color: var(--text);
}

/* Controls Row */
.controls-row {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  align-items: center;
}

/* No Results */
.no-results {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 14px;
}

.no-results p {
  margin: 0;
}

/* Artist Group Styles */
.artist-group {
  margin-bottom: 48px;
}

.group-letter {
  font-size: 32px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 3px solid var(--accent);
  letter-spacing: -0.5px;
  opacity: 0.9;
}

/* Artists Grid */
.artists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  padding: 4px;
}

.artist-item {
  cursor: pointer;
  position: relative;
  background: var(--bg-card);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border);
  transition: all 0.2s;
}

.artist-item:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(88, 166, 255, 0.2);
}

.artist-item:hover .artist-cover {
  filter: brightness(1.05);
}

.artist-item.highlighted {
  border-color: #fbbf24;
  box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.25);
}

.artist-item.highlighted::after {
  content: '✓';
  position: absolute;
  top: 8px;
  left: 8px;
  width: 24px;
  height: 24px;
  background: #fbbf24;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.artist-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  background: #000;
  border-radius: 12px 12px 0 0;
  overflow: hidden;
  margin-bottom: 0;
  transition: all 0.3s ease;
  border: none;
}

.artist-item:hover .artist-cover {
  filter: brightness(0.95);
}

.artist-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s;
}

.artist-cover img.hidden {
  opacity: 0;
}

.artist-meta {
  padding: 8px;
  background: var(--bg-card);
}

.artist-meta h2 {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  line-height: 1.4;
}

.artist-meta p {
  font-size: 12px;
  color: var(--text-light);
  font-weight: 500;
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

/* Index Numbers */
.index-number {
  color: var(--text-light);
  font-weight: 400;
  margin-right: 4px;
  opacity: 0.6;
}

.artist-meta .index-number {
  font-size: 13px;
}

.work-item p .index-number {
  font-size: 11px;
  font-family: inherit;
}

/* Works Section */
.works-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 48px;
  gap: 20px;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: var(--text);
  padding: 8px 0;
  transition: color 0.2s;
  font-weight: 600;
}

.back-btn:hover {
  color: var(--accent);
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

.artist-nav-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
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

/* Works Grid */
.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  padding: 4px;
}

.work-item {
  cursor: pointer;
  transition: transform 0.2s;
  background: var(--bg-card);
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid var(--border);
}

.work-item:hover {
  border-color: var(--purple);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(167, 139, 250, 0.3);
}

.work-item:hover .work-cover {
  filter: brightness(1.05);
}

.work-item.highlighted {
  border-color: #fbbf24;
  box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.25);
}

.work-item.highlighted::after {
  content: '✓';
  position: absolute;
  top: 8px;
  left: 8px;
  width: 20px;
  height: 20px;
  background: #fbbf24;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.work-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  background: #000;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
  margin-bottom: 0;
  transition: filter 0.2s;
  border: none;
}

.work-item:hover .work-cover {
  filter: brightness(0.95);
}

.work-cover img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
  transition: opacity 0.3s;
}

.work-cover img.hidden {
  opacity: 0;
}

.work-badges {
  position: absolute;
  top: 4px;
  left: 4px;
  display: flex;
  gap: 4px;
  z-index: 5;
}

.badge {
  font-size: 11px;
  padding: 2px 4px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border-radius: 2px;
  font-weight: 600;
  backdrop-filter: blur(4px);
}

.badge.cover {
  background: var(--gradient-5);
  color: white;
}

.badge.warn {
  background: var(--gradient-2);
}

.work-item>p {
  font-size: 12px;
  color: var(--text);
  font-family: 'Monaco', 'Courier', monospace;
  font-weight: 600;
  background: var(--bg-card);
  padding: 12px;
  text-align: center;
}

/* Image Loading States */
.image-blur {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  filter: blur(10px);
  transform: scale(1.1);
  z-index: 1;
}

.artist-cover img:not(.image-blur),
.work-cover img:not(.image-blur),
.cover-large img:not(.image-blur) {
  position: relative;
  z-index: 2;
}

.image-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  z-index: 3;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.image-loading-small {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  z-index: 3;
}

.spinner-small {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.retry-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  border: 1px solid #fff;
  border-radius: 2px;
  cursor: pointer;
  font-size: 12px;
  z-index: 4;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: rgba(0, 0, 0, 0.95);
}

.retry-btn-small {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  border: 1px solid #fff;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.retry-btn-small:hover {
  background: rgba(0, 0, 0, 0.95);
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 32px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 300;
  background: var(--gradient-1);
}

/* Detail View */
.detail {
  padding: 24px;
}

.swipe-hint {
  display: none;
  text-align: center;
  padding: 8px;
  margin-bottom: 16px;
  background: rgba(88, 166, 255, 0.1);
  border: 1px solid rgba(88, 166, 255, 0.2);
  border-radius: 8px;
  color: var(--text-light);
  font-size: 12px;
  animation: fadeInOut 4s ease-in-out;
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
  transition: opacity 0.3s;
}

.cover-large img.hidden {
  opacity: 0;
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, transparent 30%);
  opacity: 0;
  transition: opacity 0.3s;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 12px;
  pointer-events: none;
  z-index: 5;
}

.cover-large:hover .image-overlay {
  opacity: 1;
}

.zoom-hint {
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  background: var(--bg-alt);
  border: 2px solid var(--accent);
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  color: var(--accent);
  font-weight: 600;
}

.set-cover-btn:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.set-cover-btn.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.link-btn {
  padding: 8px 12px;
  background: var(--bg-alt);
  border: 2px solid var(--border);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  text-align: left;
  font-weight: 600;
  color: var(--text);
  border-radius: 8px;
}

.link-btn:hover {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
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
  border: 2px solid var(--accent);
  background: var(--bg-alt);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  color: var(--accent);
  font-weight: 700;
  border-radius: 6px;
}

.nav-btn:hover:not(:disabled) {
  background: var(--accent);
  color: #fff;
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-count {
  font-size: 12px;
  color: var(--text);
  min-width: 40px;
  text-align: center;
  font-weight: 600;
}

/* Gallery */
.detail-right h3 {
  font-size: 11px;
  font-weight: 700;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin-bottom: 20px;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.gallery-header h3 {
  margin-bottom: 0;
}

.preload-btn {
  padding: 6px 12px;
  background: var(--bg-alt);
  border: 2px solid var(--accent);
  border-radius: 8px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  transition: all 0.2s;
  color: var(--accent);
}

.preload-btn:hover:not(:disabled) {
  background: var(--accent);
  color: #fff;
}

.preload-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  transition: opacity 0.3s;
}

.gallery-item img.hidden {
  opacity: 0;
}

.gallery-item img.dimmed {
  opacity: 0.2;
}

.gallery-number {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 2px 4px;
  border-radius: 2px;
  pointer-events: none;
  z-index: 5;
}

/* Buttons */
.primary-btn {
  padding: 8px 16px;
  background: var(--accent);
  color: var(--bg);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(88, 166, 255, 0.4);
}

.primary-btn:hover {
  background: var(--accent-hover);
  box-shadow: 0 4px 16px rgba(88, 166, 255, 0.5);
  transform: translateY(-1px);
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.secondary-btn {
  padding: 8px 16px;
  background: var(--bg-card);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  font-weight: 600;
}

.secondary-btn:hover {
  background: var(--bg-alt);
  border-color: var(--accent);
  color: var(--accent);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: var(--bg-card);
  border-radius: 12px;
  max-width: 400px;
  width: 100%;
  padding: 24px;
  border: 2px solid var(--border);
  max-height: 90vh;
  overflow-y: auto;
}

.modal h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text);
}

.modal-label {
  font-size: 12px;
  color: var(--text);
  margin-bottom: 8px;
  display: block;
  font-weight: 600;
}

/* Improved Modal Input */
.input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border);
  border-radius: 10px;
  font-size: 14px;
  margin-bottom: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  color: var(--text);
  background: var(--bg-card);
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.input::placeholder {
  color: var(--text-light);
  opacity: 0.6;
}

.input:hover {
  border-color: var(--accent);
  box-shadow: 0 2px 8px rgba(88, 166, 255, 0.15);
}

.input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(88, 166, 255, 0.15), 0 2px 12px rgba(88, 166, 255, 0.2);
  transform: translateY(-1px);
  animation: inputGlow 2s ease-in-out infinite;
}

/* Improved Radio Group */
.radio-group {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--bg-alt);
  border-radius: 10px;
  border: 2px solid var(--border);
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
  color: var(--text);
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s;
}

.radio-group label:hover {
  background: var(--bg-card);
}

.radio-group input[type="radio"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
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

/* Lightbox */
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

.lb-swipe-hint {
  position: fixed;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(88, 166, 255, 0.3);
  color: #fff;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 500;
  display: none;
  animation: fadeInOut 4s ease-in-out;
}

/* Toast Notifications */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--accent);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 12px;
  z-index: 3000;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  font-weight: 500;
}

.toast-error {
  background: var(--error);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.toast-info {
  background: var(--info);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

/* Animations */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeInOut {

  0%,
  100% {
    opacity: 0;
  }

  10%,
  90% {
    opacity: 1;
  }
}

@keyframes inputGlow {

  0%,
  100% {
    box-shadow: 0 0 0 4px rgba(88, 166, 255, 0.15);
  }

  50% {
    box-shadow: 0 0 0 4px rgba(88, 166, 255, 0.25);
  }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .artists-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 14px;
  }

  .works-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }

  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}

@media (max-width: 768px) {
  .swipe-hint {
    display: block;
  }

  .lb-swipe-hint {
    display: block;
  }

  .lb-btn {
    opacity: 0.3;
  }
}

@media (max-width: 640px) {
  .header-inner {
    padding: 12px;
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

  .sort-select {
    width: 100%;
    min-width: auto;
  }

  .works-header {
    flex-direction: column;
  }

  .work-stats {
    flex-direction: column;
    gap: 4px;
  }

  .controls-row {
    flex-direction: column;
    width: 100%;
  }

  .work-search {
    max-width: 100%;
  }

  .artists-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }

  .works-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .detail-grid {
    gap: 24px;
  }

  .detail-left {
    max-width: 100%;
  }

  .icon-btn,
  .primary-btn,
  .secondary-btn,
  .nav-btn {
    min-height: 44px;
    min-width: 44px;
  }

  .artist-item:active,
  .work-item:active {
    transform: scale(0.98);
  }

  .primary-btn:active,
  .secondary-btn:active,
  .icon-btn:active {
    transform: scale(0.95);
  }
}
</style>