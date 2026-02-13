<template>
  <div class="works-app">
    <!-- Top Bar -->
    <header class="top-bar">
      <div class="top-left">
        <button v-if="currentView === 'works' || currentView === 'detail'" @click="goBack" class="back-btn-fixed">
          ← Back
        </button>
        <button v-else @click="resetToHome" class="logo-btn">
          <span class="logo-text">WORKS</span>
          <span class="logo-count">{{ artists.length }}/{{ totalCount }}</span>
        </button>
      </div>
      
      <div class="top-controls">
        <input 
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          placeholder="Search..."
          class="search-compact"
          @input="handleSearch"
        />
        
        <select v-model="artistSortBy" class="sort-compact">
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        
        <button @click="exportData" class="header-btn" title="Export">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
        </button>
        
        <button @click="triggerImport" class="header-btn" title="Import">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
        </button>
        
        <button @click="clearViewHistory" class="header-btn" title="Clear History">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
        
        <button @click="hardRefresh" class="header-btn danger" title="Reset">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8M3 12l2.26 2.26A9.75 9.75 0 0012 21a9 9 0 009-9"/>
          </svg>
        </button>
      </div>
    </header>

    <input ref="fileInput" type="file" accept=".json" hidden @change="importData" />

    <!-- ARTISTS VIEW -->
    <main v-if="currentView === 'artists'" class="content artists-content">
      <div v-for="letter in alphabeticalGroups" :key="letter" class="artist-group">
        <h2 class="group-letter">{{ letter }}</h2>
        <div class="image-grid">
          <div 
            v-for="artist in groupedArtists[letter]" 
            :key="artist.name"
            class="grid-item"
            :class="{ seen: viewedArtists.includes(artist.name) }"
            @click="selectArtist(artist.name)"
          >
            <div class="item-photo">
              <img 
                v-if="getProgressiveImage(artist).full"
                :src="getProgressiveImage(artist).full" 
                :alt="artist.name"
                loading="lazy"
              />
              <div v-else class="photo-empty">
                {{ artist.name.charAt(0) }}
              </div>
            </div>
            <div class="item-label">
              <span class="label-name">{{ artist.name }}</span>
              <span class="label-meta">{{ getArtistWorkCount(artist) }}</span>
            </div>
            <button @click.stop="openArtistPhotoModal(artist.name)" class="item-edit">✎</button>
          </div>
        </div>
      </div>

      <div v-if="filteredArtists.length === 0" class="empty">
        <p>No results</p>
      </div>
    </main>

    <!-- WORKS VIEW -->
    <main v-else-if="currentView === 'works'" class="content works-content">
      <div class="content-header">
        <div class="header-title">
          <h1>{{ currentArtist?.name }}</h1>
          <div class="title-tags">
            <span v-if="currentArtist?.mainWorks?.length">{{ currentArtist.mainWorks.length }} main</span>
            <span v-if="currentArtist?.compilations?.length">{{ currentArtist.compilations.length }} comp</span>
          </div>
        </div>
        <button @click="openAddWorkModal" class="nav-add">+</button>
      </div>

      <div class="search-inline">
        <input 
          v-model="workSearchQuery"
          type="text"
          placeholder="Filter works..."
          class="search-field"
        />
      </div>

      <div v-if="filteredMainWorks.length" class="works-block">
        <h3 class="block-title">MAIN</h3>
        <div class="image-grid tight">
          <div 
            v-for="work in filteredMainWorks"
            :key="work.code"
            class="grid-item"
            :class="{ seen: viewedWorks.includes(work.code) }"
            @click="openWorkView(work)"
          >
            <div class="item-photo">
              <img 
                :src="getProgressiveWorkImage(work).full"
                :alt="work.code"
                loading="lazy"
              />
              <div v-if="isCoverWork(currentArtist.name, work.code)" class="photo-star">★</div>
            </div>
            <div class="item-label compact">
              <span class="label-name">{{ work.code }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="filteredCompilations.length" class="works-block">
        <h3 class="block-title">COMPILATIONS</h3>
        <div class="image-grid tight">
          <div 
            v-for="work in filteredCompilations"
            :key="work.code"
            class="grid-item"
            :class="{ seen: viewedWorks.includes(work.code) }"
            @click="openWorkView(work)"
          >
            <div class="item-photo">
              <img 
                :src="getProgressiveWorkImage(work).full"
                :alt="work.code"
                loading="lazy"
              />
              <div v-if="isCoverWork(currentArtist.name, work.code)" class="photo-star">★</div>
            </div>
            <div class="item-label compact">
              <span class="label-name">{{ work.code }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- DETAIL VIEW -->
    <main v-else-if="currentView === 'detail'" class="content detail-content">
      <div class="detail-layout">
        <div class="detail-hero">
          <div class="hero-image" @click="openLightbox(currentWork, 0)">
            <img 
              :src="getProgressiveWorkImage(currentWork).full"
              :alt="currentWork.code"
            />
          </div>

          <div class="hero-info">
            <h1 class="info-code" @click="copyToClipboard(currentWork.code)">
              {{ currentWork.code }}
            </h1>
            
            <div class="info-actions">
              <button 
                @click="setCoverWork(currentArtist.name, currentWork.code)"
                class="action-btn"
                :class="{ active: isCoverWork(currentArtist.name, currentWork.code) }"
              >
                ★ {{ isCoverWork(currentArtist.name, currentWork.code) ? 'COVER' : 'SET COVER' }}
              </button>
              
              <button @click="openUploadModal(currentWork.code)" class="action-btn">
                {{ hasCustomImage(currentWork.code) ? 'UPDATE IMG' : 'ADD IMG' }}
              </button>
            </div>

            <div class="info-links">
              <button @click="openExternalLink(currentWork.code, 'njav')" class="link-pill">NJAV</button>
              <button @click="openExternalLink(currentWork.code, 'missav')" class="link-pill">MissAV</button>
              <button @click="openExternalLink(currentWork.code, '24av')" class="link-pill">24AV</button>
            </div>

            <div v-if="currentWorkList.length > 1" class="info-nav">
              <button 
                @click="navigateWork(-1)" 
                :disabled="!canNavigateWork(-1)"
                class="nav-btn"
              >
                ←
              </button>
              <span class="nav-label">{{ currentWorkIndex + 1 }}/{{ currentWorkList.length }}</span>
              <button 
                @click="navigateWork(1)" 
                :disabled="!canNavigateWork(1)"
                class="nav-btn"
              >
                →
              </button>
            </div>
          </div>
        </div>

        <div class="detail-gallery">
          <div class="gallery-bar">
            <h3>GALLERY</h3>
            <button @click="preloadAllGallery" class="gallery-load" :disabled="isPreloading">
              {{ isPreloading ? 'Loading...' : 'Load All' }}
            </button>
          </div>
          
          <div class="gallery-thumbs">
            <div 
              v-for="i in 20" 
              :key="i"
              class="thumb-box"
              @click="openLightbox(currentWork, i)"
            >
              <img 
                :src="getImageUrl(currentWork.code, `jp-${i}`)"
                :alt="`${currentWork.code} ${i}`"
                loading="lazy"
              />
              <span class="thumb-num">{{ i }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- MODALS -->
    <transition name="fade">
      <div v-if="showAddWorkModal" class="modal-wrap" @click.self="closeAddWorkModal">
        <div class="modal-box">
          <h3>Add Work</h3>
          <select v-model="newWork.artist" class="field">
            <option value="">Select artist...</option>
            <option v-for="a in artists" :key="a.name" :value="a.name">{{ a.name }}</option>
          </select>
          <input v-model="newWork.code" placeholder="Work Code" class="field" />
          <div class="radio-row">
            <label>
              <input v-model="newWork.type" type="radio" value="mainWorks" />
              <span>Main</span>
            </label>
            <label>
              <input v-model="newWork.type" type="radio" value="compilations" />
              <span>Compilation</span>
            </label>
          </div>
          <div class="modal-btns">
            <button @click="addNewWork" class="btn-solid">Add</button>
            <button @click="closeAddWorkModal" class="btn-ghost">Cancel</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showUploadModal" class="modal-wrap" @click.self="closeUploadModal">
        <div class="modal-box">
          <h3>Custom Image</h3>
          <p class="modal-sub">{{ uploadingWork }}</p>
          <input 
            v-model="customImageUrl" 
            placeholder="Image URL"
            class="field"
            @keyup.enter="handleCustomImageUrl"
          />
          <div class="modal-btns">
            <button @click="handleCustomImageUrl" class="btn-solid" :disabled="!customImageUrl.trim()">
              {{ customImageUrl.trim() ? 'Add' : 'Remove' }}
            </button>
            <button @click="closeUploadModal" class="btn-ghost">Cancel</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showArtistPhotoModal" class="modal-wrap" @click.self="closeArtistPhotoModal">
        <div class="modal-box">
          <h3>Artist Photo</h3>
          <p class="modal-sub">{{ editingArtistName }}</p>
          <input 
            v-model="artistPhotoUrl" 
            placeholder="Photo URL (empty to remove)"
            class="field"
            @keyup.enter="updateArtistPhoto"
          />
          <div class="modal-btns">
            <button @click="updateArtistPhoto" class="btn-solid">
              {{ artistPhotoUrl.trim() ? 'Update' : 'Remove' }}
            </button>
            <button @click="closeArtistPhotoModal" class="btn-ghost">Cancel</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- LIGHTBOX -->
    <transition name="fade">
      <div v-if="lightbox.show" class="viewer" @click.self="closeLightbox">
        <button class="viewer-x" @click="closeLightbox">×</button>
        <button 
          v-if="lightbox.images.length > 1"
          class="viewer-arrow prev"
          @click="prevImage"
        >
          ←
        </button>
        <img :src="lightbox.images[lightbox.currentIndex]" :alt="lightbox.code" />
        <button 
          v-if="lightbox.images.length > 1"
          class="viewer-arrow next"
          @click="nextImage"
        >
          →
        </button>
        <div class="viewer-count">
          {{ lightbox.currentIndex + 1 }} / {{ lightbox.images.length }}
        </div>
      </div>
    </transition>

    <!-- TOAST -->
    <transition name="toast">
      <div v-if="toast.show" class="toast" :class="`toast-${toast.type}`">
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
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        resolve(false)
        return
      }

      const request = indexedDB.open(this.dbName, 1)
      request.onerror = () => resolve(false)
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
  name: 'WorksRetro',
  data() {
    return {
      currentView: 'artists',
      activeTab: '',
      searchQuery: '',
      workSearchQuery: '',
      artistSortBy: 'nameAsc',
      
      artists: normalizeArtists(JSON.parse(JSON.stringify(DEFAULT_ARTISTS))),
      currentWork: null,
      currentWorkList: [],
      currentWorkIndex: 0,
      currentArtistList: [],
      currentArtistIndex: 0,
      
      customImages: {},
      artistPhotos: {},
      viewedArtists: [],
      viewedWorks: [],
      
      showAddWorkModal: false,
      showUploadModal: false,
      showArtistPhotoModal: false,
      newWork: { artist: '', code: '', type: 'mainWorks' },
      uploadingWork: null,
      customImageUrl: '',
      editingArtistName: '',
      artistPhotoUrl: '',
      
      lightbox: { show: false, images: [], currentIndex: 0, code: '' },
      toast: { show: false, message: '', type: 'success' },
      
      isPreloading: false,
      imageDB: null,
      useLocalStorageFallback: false,
      customImagesLoaded: false,
      
      scrollPositions: {},
      
      // Touch gesture tracking
      touchStartX: 0,
      touchEndX: 0,
      touchStartY: 0,
      touchEndY: 0,
      handleTouchStart: null,
      handleTouchEnd: null,

      sortOptions: [
        { label: 'Name A→Z', value: 'nameAsc' },
        { label: 'Name Z→A', value: 'nameDesc' },
        { label: 'Most Works', value: 'mostWorks' },
        { label: 'Least Works', value: 'leastWorks' }
      ]
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
      return groups
    },
    alphabeticalGroups() {
      return Object.keys(this.groupedArtists).sort()
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
      this.initializeApp()
      this.setupKeyboardShortcuts()
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

      try {
        const savedArtistSort = localStorage.getItem('artistSortBy')
        if (savedArtistSort) this.artistSortBy = savedArtistSort
      } catch (e) {
        console.warn('Failed to load artist sort preference:', e)
      }
    },

    setupKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (this.lightbox.show) this.closeLightbox()
          else if (this.showAddWorkModal) this.closeAddWorkModal()
          else if (this.showUploadModal) this.closeUploadModal()
          else if (this.showArtistPhotoModal) this.closeArtistPhotoModal()
          else if (this.currentView === 'detail') this.backToWorks()
          else if (this.currentView === 'works') this.backToArtists()
        }

        if (this.lightbox.show) {
          if (e.key === 'ArrowLeft') this.prevImage()
          if (e.key === 'ArrowRight') this.nextImage()
        }

        if (this.currentView === 'detail' && !this.lightbox.show) {
          if (e.key === 'ArrowLeft' && this.canNavigateWork(-1)) this.navigateWork(-1)
          if (e.key === 'ArrowRight' && this.canNavigateWork(1)) this.navigateWork(1)
        }
      })
    },

    handleSearch() {
      // Reactive search
    },

    goBack() {
      if (this.currentView === 'detail') {
        this.backToWorks()
      } else if (this.currentView === 'works') {
        this.backToArtists()
      }
    },

    resetToHome() {
      this.currentView = 'artists'
      this.activeTab = ''
      this.searchQuery = ''
      this.workSearchQuery = ''
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },

    getArtistWorkCount(artist) {
      return (artist.mainWorks?.length || 0) + (artist.compilations?.length || 0)
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
      if (!work) return { full: null, thumb: null }
      
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

    selectArtist(name) {
      // Save scroll position before navigating
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
        window.scrollTo({ top: 0, behavior: 'instant' })
      })
    },

    backToArtists() {
      this.currentView = 'artists'
      this.activeTab = ''
      
      this.$nextTick(() => {
        this.restoreScrollPosition('artists')
      })
    },

    openWorkView(work) {
      // Save scroll position before navigating
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
        window.scrollTo({ top: 0, behavior: 'instant' })
      })
    },

    backToWorks() {
      this.currentView = 'works'
      this.currentWork = null
      
      this.$nextTick(() => {
        this.restoreScrollPosition('works')
      })
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

    navigateWork(direction) {
      const newIndex = this.currentWorkIndex + direction
      if (newIndex >= 0 && newIndex < this.currentWorkList.length) {
        this.currentWorkIndex = newIndex
        this.currentWork = this.currentWorkList[newIndex]
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    },

    canNavigateWork(direction) {
      const newIndex = this.currentWorkIndex + direction
      return newIndex >= 0 && newIndex < this.currentWorkList.length
    },

    isCoverWork(artistName, workCode) {
      const artist = this.artists.find(a => a.name === artistName)
      return artist?.cover === workCode
    },

    setCoverWork(artistName, workCode) {
      const artist = this.artists.find(a => a.name === artistName)
      if (artist) {
        artist.cover = workCode
        this.artists = [...this.artists]
      }
      this.showToast('Cover updated', 'success')
    },

    openAddWorkModal() {
      this.newWork = { artist: this.activeTab || '', code: '', type: 'mainWorks' }
      this.showAddWorkModal = true
    },

    closeAddWorkModal() {
      this.showAddWorkModal = false
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

      artist[this.newWork.type].push({
        code,
        addedAt: Date.now()
      })

      this.artists = [...this.artists]
      this.closeAddWorkModal()
      this.showToast(`Added ${code}`, 'success')
    },

    openUploadModal(code) {
      this.uploadingWork = code
      this.customImageUrl = this.customImages[code] || ''
      this.showUploadModal = true
    },

    closeUploadModal() {
      this.showUploadModal = false
      this.uploadingWork = null
      this.customImageUrl = ''
    },

    async handleCustomImageUrl() {
      const url = this.customImageUrl.trim()
      if (!url) {
        const newCustomImages = { ...this.customImages }
        delete newCustomImages[this.uploadingWork]
        this.customImages = newCustomImages
        this.showToast('Image removed', 'success')
        this.closeUploadModal()
        return
      }

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return this.showToast('Must start with http:// or https://', 'error')
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
      }

      img.onerror = () => {
        clearTimeout(timeout)
        this.showToast('Failed to load image', 'error')
      }

      img.src = url
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
      
      if (!url) {
        const newPhotos = { ...this.artistPhotos }
        delete newPhotos[this.editingArtistName]
        this.artistPhotos = newPhotos
        localStorage.setItem('artistPhotos', JSON.stringify(this.artistPhotos))
        this.showToast('Photo removed', 'success')
        this.closeArtistPhotoModal()
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
        this.showToast('Photo updated', 'success')
        this.closeArtistPhotoModal()
      }

      img.onerror = () => {
        clearTimeout(timeout)
        this.showToast('Photo load failed', 'error')
      }

      img.src = url
    },

    openLightbox(work, startIndex = 0) {
      const images = [this.getImageUrl(work.code)]
      for (let i = 1; i <= 20; i++) {
        images.push(this.getImageUrl(work.code, `jp-${i}`))
      }
      this.lightbox = { show: true, images, currentIndex: startIndex, code: work.code }
      if (process.client) {
        document.body.style.overflow = 'hidden'
        // Setup touch events for swipe gestures
        this.$nextTick(() => {
          this.setupSwipeGestures()
        })
      }
    },

    closeLightbox() {
      this.lightbox.show = false
      if (process.client) {
        document.body.style.overflow = ''
        this.cleanupSwipeGestures()
      }
    },

    setupSwipeGestures() {
      if (!process.client) return
      
      this.touchStartX = 0
      this.touchEndX = 0
      this.touchStartY = 0
      this.touchEndY = 0
      
      const viewer = document.querySelector('.viewer')
      if (!viewer) return
      
      this.handleTouchStart = (e) => {
        this.touchStartX = e.changedTouches[0].screenX
        this.touchStartY = e.changedTouches[0].screenY
      }
      
      this.handleTouchEnd = (e) => {
        this.touchEndX = e.changedTouches[0].screenX
        this.touchEndY = e.changedTouches[0].screenY
        this.handleSwipe()
      }
      
      viewer.addEventListener('touchstart', this.handleTouchStart, { passive: true })
      viewer.addEventListener('touchend', this.handleTouchEnd, { passive: true })
    },

    cleanupSwipeGestures() {
      if (!process.client) return
      
      const viewer = document.querySelector('.viewer')
      if (!viewer) return
      
      if (this.handleTouchStart) {
        viewer.removeEventListener('touchstart', this.handleTouchStart)
      }
      if (this.handleTouchEnd) {
        viewer.removeEventListener('touchend', this.handleTouchEnd)
      }
    },

    handleSwipe() {
      const deltaX = this.touchEndX - this.touchStartX
      const deltaY = this.touchEndY - this.touchStartY
      const minSwipeDistance = 50
      
      // Check if horizontal swipe is more significant than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0) {
            // Swipe right - previous image
            this.prevImage()
          } else {
            // Swipe left - next image
            this.nextImage()
          }
        }
      }
    },

    nextImage() {
      this.lightbox.currentIndex = (this.lightbox.currentIndex + 1) % this.lightbox.images.length
    },

    prevImage() {
      this.lightbox.currentIndex = (this.lightbox.currentIndex - 1 + this.lightbox.images.length) % this.lightbox.images.length
    },

    async preloadAllGallery() {
      if (!this.currentWork) return
      this.isPreloading = true

      const promises = []
      for (let i = 1; i <= 20; i++) {
        const img = new Image()
        const url = this.getImageUrl(this.currentWork.code, `jp-${i}`)
        const promise = new Promise((resolve) => {
          img.onload = () => resolve()
          img.onerror = () => resolve()
          img.src = url
        })
        promises.push(promise)
      }

      await Promise.all(promises)
      this.isPreloading = false
      this.showToast('Gallery loaded', 'success')
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
      } else {
        url = `https://www.njav.com/en/xvideos/${formattedCode}`
      }

      window.open(url, '_blank', 'noopener,noreferrer')
    },

    clearViewHistory() {
      if (confirm('Clear all viewing history?')) {
        this.viewedArtists = []
        this.viewedWorks = []
        localStorage.removeItem('viewedArtists')
        localStorage.removeItem('viewedWorks')
        this.showToast('History cleared', 'success')
      }
    },

    showToast(msg, type = 'success') {
      this.toast = { show: true, message: msg, type }
      setTimeout(() => this.toast.show = false, 2500)
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

    exportData() {
      try {
        // Transform and sort artists data
        const transformedArtists = this.artists
          .map(artist => ({
            name: artist.name,
            cover: artist.cover || '',
            url: this.artistPhotos[artist.name] || '',
            compilations: (artist.compilations || [])
              .map(w => w.code)
              .sort((a, b) => a.localeCompare(b)),
            mainWorks: (artist.mainWorks || [])
              .map(w => w.code)
              .sort((a, b) => a.localeCompare(b))
          }))
          .sort((a, b) => a.name.localeCompare(b.name))

        // Create the export string in JavaScript format
        let exportString = 'export const DEFAULT_ARTISTS = [\n'
        
        transformedArtists.forEach((artist, index) => {
          exportString += '  {\n'
          exportString += `    name: '${artist.name}',\n`
          exportString += `    cover: '${artist.cover}',\n`
          exportString += `    url: '${artist.url}',\n`
          
          // Compilations
          if (artist.compilations.length > 0) {
            exportString += `    compilations: [${artist.compilations.map(c => `'${c}'`).join(', ')}],\n`
          } else {
            exportString += `    compilations: [],\n`
          }
          
          // Main works
          if (artist.mainWorks.length > 0) {
            exportString += `    mainWorks: [${artist.mainWorks.map(w => `'${w}'`).join(', ')}]\n`
          } else {
            exportString += `    mainWorks: []\n`
          }
          
          exportString += '  }'
          if (index < transformedArtists.length - 1) {
            exportString += ','
          }
          exportString += '\n'
        })
        
        exportString += ']'

        const blob = new Blob([exportString], { type: 'text/javascript' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `artists-${new Date().toISOString().split('T')[0]}.js`
        a.click()
        URL.revokeObjectURL(url)
        this.showToast('Exported as .js', 'success')
      } catch (e) {
        console.error('Export error:', e)
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

    async hardRefresh() {
      if (!confirm('Reset everything? Cannot be undone.')) return

      try {
        this.showToast('Refreshing...', 'info')
        localStorage.removeItem('artists')
        localStorage.removeItem('artistPhotos')
        localStorage.removeItem('viewedArtists')
        localStorage.removeItem('viewedWorks')
        localStorage.removeItem('artistSortBy')
        localStorage.removeItem('customImages')
        
        if (this.imageDB) {
          await this.imageDB.clear()
        }
        
        this.artists = normalizeArtists(JSON.parse(JSON.stringify(DEFAULT_ARTISTS)))
        this.currentView = 'artists'
        this.activeTab = ''
        this.artistPhotos = {}
        this.customImages = {}
        this.viewedArtists = []
        this.viewedWorks = []
        this.artistSortBy = 'nameAsc'
        localStorage.setItem('artists', JSON.stringify(this.artists))
        this.showToast('Reset complete', 'success')
      } catch (e) {
        this.showToast('Reset failed', 'error')
      }
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=IBM+Plex+Mono:wght@400;600&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --cream: #faf8f5;
  --ink: #1a1a1a;
  --gray: #6b6b6b;
  --red: #ff3b3b;
  --blue: #0066ff;
  --border: #e0e0e0;
  
  --font-sans: 'DM Sans', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
  
  --ease: cubic-bezier(0.23, 1, 0.32, 1);
}

body {
  background: var(--cream);
  color: var(--ink);
  font-family: var(--font-sans);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

.works-app {
  min-height: 100vh;
}

/* TOP BAR */
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--cream);
  border-bottom: 2px solid var(--ink);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 100;
}

.top-left {
  display: flex;
  align-items: center;
}

.logo-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.back-btn-fixed {
  padding: 10px 20px;
  background: white;
  border: 2px solid var(--ink);
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--ink);
  transition: all 0.2s var(--ease);
}

.back-btn-fixed:hover {
  background: var(--ink);
  color: var(--cream);
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--ink);
  font-family: var(--font-mono);
}

.logo-count {
  font-size: 12px;
  color: var(--gray);
  font-family: var(--font-mono);
  font-weight: 400;
}

.top-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-compact {
  width: 200px;
  padding: 8px 12px;
  background: white;
  border: 2px solid var(--ink);
  font-size: 13px;
  font-family: var(--font-sans);
  color: var(--ink);
  font-weight: 500;
  outline: none;
}

.search-compact:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgba(26, 26, 26, 0.15);
}

.search-compact::placeholder {
  color: var(--gray);
}

.sort-compact {
  padding: 8px 12px;
  background: white;
  border: 2px solid var(--ink);
  font-size: 13px;
  font-family: var(--font-sans);
  color: var(--ink);
  font-weight: 500;
  cursor: pointer;
  appearance: none;
  padding-right: 28px;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%231a1a1a' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  outline: none;
}

.sort-compact:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgba(26, 26, 26, 0.15);
}

.icon-btn {
  width: 40px;
  height: 40px;
  background: none;
  border: 2px solid var(--ink);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s var(--ease);
}

.icon-btn:hover,
.icon-btn.active {
  background: var(--ink);
}

.icon-btn:hover svg,
.icon-btn.active svg {
  stroke: var(--cream);
}

.header-btn {
  width: 40px;
  height: 40px;
  background: white;
  border: 2px solid var(--ink);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s var(--ease);
}

.header-btn:hover {
  background: var(--ink);
}

.header-btn:hover svg {
  stroke: var(--cream);
}

.header-btn.danger:hover {
  background: var(--red);
  border-color: var(--red);
}

.header-btn.danger:hover svg {
  stroke: white;
}

/* CONTENT */
.content {
  padding: 80px 20px 40px;
  width: 100%;
  margin: 0 auto;
}

.search-inline {
  margin-bottom: 32px;
}

/* ARTIST GROUPING */
.artist-group {
  margin-bottom: 56px;
}

.group-letter {
  position: sticky;
  top: 60px;
  z-index: 50;
  font-size: 48px;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--ink);
  background: var(--cream);
  margin-bottom: 24px;
  padding: 16px 0 12px;
  border-bottom: 3px solid var(--ink);
  letter-spacing: -2px;
}

.search-inline .search-field {
  width: 100%;
  padding: 12px 16px;
  background: white;
  border: 2px solid var(--ink);
  font-size: 15px;
  font-family: var(--font-sans);
  color: var(--ink);
  font-weight: 500;
  outline: none;
}

.search-inline .search-field:focus {
  outline: none;
  border-color: var(--ink);
  box-shadow: 0 0 0 4px rgba(26, 26, 26, 0.15);
}

.search-inline .search-field::placeholder {
  color: var(--gray);
}

/* IMAGE GRID */
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 28px;
}

.image-grid.tight {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.grid-item {
  cursor: pointer;
  position: relative;
  transition: all 0.3s var(--ease);
}

.grid-item:hover {
  transform: translateY(-4px);
}

.grid-item.seen {
  opacity: 0.4;
}

.grid-item.seen::before {
  content: '✓';
  position: absolute;
  top: 12px;
  left: 12px;
  width: 32px;
  height: 32px;
  background: var(--ink);
  color: var(--cream);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  z-index: 10;
}

.grid-item.seen .item-photo {
  border-color: var(--gray);
}

.item-photo {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  background: white;
  border: 2px solid var(--ink);
  overflow: hidden;
  margin-bottom: 8px;
}

.item-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.photo-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: 700;
  color: var(--gray);
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
}

.photo-star {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  background: var(--ink);
  color: var(--cream);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  z-index: 10;
}

.item-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.item-label.compact {
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}

.label-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
  font-family: var(--font-mono);
}

.label-meta {
  font-size: 12px;
  color: var(--gray);
  font-family: var(--font-mono);
}

.item-edit {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  background: white;
  border: 2px solid var(--ink);
  cursor: pointer;
  font-size: 16px;
  color: var(--ink);
  opacity: 0;
  transition: all 0.2s var(--ease);
}

.grid-item:hover .item-edit {
  opacity: 1;
}

.item-edit:hover {
  background: var(--ink);
  color: var(--cream);
}

/* CONTENT HEADER */
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  gap: 20px;
}

.nav-add {
  padding: 12px 20px;
  background: white;
  border: 2px solid var(--ink);
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--ink);
  transition: all 0.2s var(--ease);
}

.nav-add:hover {
  background: var(--ink);
  color: var(--cream);
}

.header-title {
  flex: 1;
}

.header-title h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
  letter-spacing: -0.5px;
}

.title-tags {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: var(--gray);
  font-family: var(--font-mono);
}

/* WORKS BLOCK */
.works-block {
  margin-bottom: 56px;
}

.block-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--gray);
  margin-bottom: 16px;
  font-family: var(--font-mono);
  padding-bottom: 8px;
  border-bottom: 2px solid var(--border);
}

/* DETAIL VIEW */
.detail-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 48px;
}

.detail-hero {
  display: grid;
  grid-template-columns: 600px 1fr;
  gap: 32px;
  max-width: 100%;
}

.hero-image {
  width: 100%;
  aspect-ratio: 3 / 2;
  background: white;
  border: 2px solid var(--ink);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s var(--ease);
}

.hero-image:hover {
  box-shadow: 0 8px 0 var(--ink);
}

.hero-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.hero-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-code {
  font-size: 24px;
  font-weight: 700;
  font-family: var(--font-mono);
  cursor: pointer;
  padding: 12px 16px;
  background: white;
  border: 2px solid var(--ink);
  transition: all 0.2s var(--ease);
  user-select: all;
}

.info-code:hover {
  background: var(--ink);
  color: var(--cream);
}

.info-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 12px 20px;
  background: white;
  border: 2px solid var(--ink);
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--ink);
  transition: all 0.2s var(--ease);
}

.action-btn:hover {
  background: var(--ink);
  color: var(--cream);
}

.action-btn.active {
  background: var(--ink);
  color: var(--cream);
}

.info-links {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.link-pill {
  padding: 8px 16px;
  background: var(--ink);
  color: var(--cream);
  border: 2px solid var(--ink);
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  font-family: var(--font-mono);
  transition: all 0.2s var(--ease);
}

.link-pill:hover {
  background: var(--red);
  border-color: var(--red);
}

.info-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
  background: white;
  border: 2px solid var(--ink);
}

.nav-btn {
  width: 40px;
  height: 40px;
  background: var(--ink);
  color: var(--cream);
  border: none;
  font-size: 18px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.2s var(--ease);
}

.nav-btn:hover:not(:disabled) {
  background: var(--red);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-label {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
}

/* GALLERY */
.detail-gallery {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.gallery-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.gallery-bar h3 {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--gray);
  font-family: var(--font-mono);
}

.gallery-load {
  padding: 8px 16px;
  background: white;
  border: 2px solid var(--ink);
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--ink);
  transition: all 0.2s var(--ease);
}

.gallery-load:hover:not(:disabled) {
  background: var(--ink);
  color: var(--cream);
}

.gallery-load:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gallery-thumbs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.thumb-box {
  position: relative;
  aspect-ratio: 3 / 2;
  background: white;
  border: 2px solid var(--ink);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s var(--ease);
}

.thumb-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 0 var(--ink);
}

.thumb-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.thumb-num {
  position: absolute;
  bottom: 4px;
  right: 4px;
  padding: 2px 6px;
  background: var(--ink);
  color: var(--cream);
  font-size: 10px;
  font-family: var(--font-mono);
  font-weight: 700;
}

/* MODALS */
.modal-wrap {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(26, 26, 26, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 20px;
}

.modal-box {
  width: 100%;
  max-width: 480px;
  background: var(--cream);
  border: 3px solid var(--ink);
  padding: 32px;
}

.modal-box h3 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--ink);
}

.modal-sub {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--ink);
  margin-bottom: 20px;
  opacity: 0.7;
}

.field {
  width: 100%;
  padding: 12px 16px;
  background: white;
  border: 2px solid var(--ink);
  font-size: 15px;
  font-family: var(--font-sans);
  color: var(--ink);
  margin-bottom: 16px;
  font-weight: 500;
  outline: none;
}

.field:focus {
  outline: none;
  border-color: var(--ink);
  box-shadow: 0 0 0 4px rgba(26, 26, 26, 0.15);
}

.field::placeholder {
  color: var(--gray);
}

.radio-row {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.radio-row label {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: white;
  border: 2px solid var(--ink);
  cursor: pointer;
  transition: all 0.2s var(--ease);
}

.radio-row label:hover {
  background: var(--ink);
  color: var(--cream);
}

.radio-row input[type="radio"] {
  width: 18px;
  height: 18px;
}

.radio-row span {
  font-size: 14px;
  font-weight: 600;
}

.modal-btns {
  display: flex;
  gap: 12px;
}

.btn-solid,
.btn-ghost {
  flex: 1;
  padding: 14px 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  font-family: var(--font-mono);
  transition: all 0.2s var(--ease);
}

.btn-solid {
  background: var(--ink);
  color: var(--cream);
  border: 2px solid var(--ink);
}

.btn-solid:hover:not(:disabled) {
  background: var(--red);
  border-color: var(--red);
}

.btn-solid:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-ghost {
  background: white;
  color: var(--ink);
  border: 2px solid var(--ink);
}

.btn-ghost:hover {
  background: var(--ink);
  color: var(--cream);
}

/* VIEWER */
.viewer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.96);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 400;
  padding: 40px;
  touch-action: pan-y pinch-zoom;
}

.viewer img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border: 4px solid var(--cream);
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}

.viewer-x {
  position: fixed;
  top: 32px;
  right: 32px;
  width: 64px;
  height: 64px;
  background: var(--cream);
  border: 3px solid var(--ink);
  color: var(--ink);
  font-size: 40px;
  cursor: pointer;
  font-weight: 300;
  line-height: 1;
  transition: all 0.2s var(--ease);
}

.viewer-x:hover {
  background: var(--red);
  border-color: var(--red);
  color: white;
  transform: scale(1.1);
}

.viewer-arrow {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  width: 80px;
  height: 80px;
  background: var(--cream);
  border: 4px solid var(--ink);
  color: var(--ink);
  font-size: 36px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.2s var(--ease);
  display: flex;
  align-items: center;
  justify-content: center;
}

.viewer-arrow:hover {
  background: var(--ink);
  color: var(--cream);
  transform: translateY(-50%) scale(1.1);
}

.viewer-arrow.prev {
  left: 32px;
}

.viewer-arrow.next {
  right: 32px;
}

.viewer-count {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  padding: 14px 28px;
  background: var(--cream);
  border: 4px solid var(--ink);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 700;
}

/* TOAST */
.toast {
  position: fixed;
  bottom: 32px;
  right: 32px;
  padding: 16px 24px;
  background: var(--ink);
  color: var(--cream);
  border: 3px solid var(--ink);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  z-index: 500;
}

.toast-error {
  background: var(--red);
  border-color: var(--red);
}

.toast-info {
  background: var(--blue);
  border-color: var(--blue);
}

.toast-success {
  background: var(--ink);
  border-color: var(--ink);
}

/* EMPTY STATE */
.empty {
  text-align: center;
  padding: 80px 20px;
  color: var(--gray);
}

/* TRANSITIONS */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s var(--ease);
}

.expand-enter,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s var(--ease);
}

.toast-enter,
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* RESPONSIVE */
@media (max-width: 1200px) {
  .detail-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .search-compact {
    width: 150px;
    font-size: 12px;
    padding: 8px 10px;
  }
  
  .sort-compact {
    font-size: 12px;
    padding: 8px 10px;
    padding-right: 26px;
  }
  
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
  }
  
  .image-grid.tight {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
  
  .content-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .gallery-thumbs {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
  
  .viewer-arrow {
    width: 64px;
    height: 64px;
    font-size: 28px;
  }
  
  .viewer-x {
    width: 56px;
    height: 56px;
    font-size: 32px;
  }
}

@media (max-width: 640px) {
  .top-bar {
    padding: 0 12px;
  }
  
  .back-btn-fixed {
    padding: 8px 16px;
    font-size: 13px;
  }
  
  .search-compact {
    display: none;
  }
  
  .sort-compact {
    width: 100px;
    font-size: 11px;
    padding: 8px;
    padding-right: 24px;
  }
  
  .header-btn {
    width: 36px;
    height: 36px;
  }
  
  .header-btn svg {
    width: 14px;
    height: 14px;
  }
  
  .content {
    padding: 80px 12px 32px;
  }
  
  .image-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .image-grid.tight {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .modal-box {
    padding: 24px;
  }
  
  .viewer-arrow {
    width: 56px;
    height: 56px;
    font-size: 24px;
  }
  
  .viewer-arrow.prev {
    left: 16px;
  }
  
  .viewer-arrow.next {
    right: 16px;
  }
  
  .viewer-x {
    width: 48px;
    height: 48px;
    font-size: 28px;
    top: 16px;
    right: 16px;
  }
  
  .toast {
    left: 12px;
    right: 12px;
    bottom: 12px;
  }
}
</style>