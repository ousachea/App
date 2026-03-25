<template>
    <div class="app">
      <!-- Top Bar -->
      <header class="bar">
        <div class="bar-left">
          <button v-if="currentView !== 'artists'" @click="goBack" class="btn-back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div v-if="currentView === 'artists'" class="stats">
            <span class="stat"><b>{{ artists.length }}</b> artists</span>
            <span class="stat-sep">/</span>
            <span class="stat"><b>{{ totalCount }}</b> works</span>
            <span class="stat-sep">/</span>
            <span class="stat"><b>{{ viewedWorks.length }}</b> viewed</span>
          </div>
          <!-- Artist avatar + name in bar for works/detail -->
          <div v-if="currentView === 'works' && currentArtist" class="bar-artist">
            <div class="bar-avatar">
              <img v-if="getProgressiveImage(currentArtist).full" :src="getProgressiveImage(currentArtist).full" @error="onImgError"/>
              <span v-else>{{ currentArtist.name.charAt(0) }}</span>
            </div>
            <span class="bar-title">{{ currentArtist.name }}</span>
          </div>
          <span v-if="currentView === 'detail' && currentWork" class="bar-title mono">{{ currentWork.code }}</span>
        </div>
        <div class="bar-right">
          <div class="search-box">
            <svg class="search-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
            <input ref="searchInput" v-model="searchQuery" type="text" :placeholder="currentView === 'works' ? 'Filter works...' : 'Search...'" @input="handleSearch"/>
            <button v-if="searchQuery" @click="searchQuery = ''" class="search-x">&times;</button>
          </div>
          <!-- Viewed filter toggle -->
          <button v-if="currentView === 'works' || currentView === 'artists'" @click="viewFilter = viewFilter === 'all' ? 'unviewed' : viewFilter === 'unviewed' ? 'viewed' : 'all'" class="btn-filter" :class="{ active: viewFilter !== 'all' }">
            {{ viewFilter === 'all' ? 'All' : viewFilter === 'unviewed' ? 'New' : 'Seen' }}
          </button>
          <div class="menu-wrap">
            <button @click="showMenu = !showMenu" class="btn-menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
            </button>
            <transition name="drop">
              <div v-if="showMenu" class="menu-drop" @click="showMenu = false">
                <button @click="openAddArtistModal()">Add artist</button>
                <button @click="exportData()">Export data</button>
                <button @click="triggerImport()">Import data</button>
                <button @click="clearViewHistory()">Clear history</button>
                <button @click="hardRefresh()" class="menu-danger">Reset all</button>
              </div>
            </transition>
          </div>
        </div>
      </header>
  
      <div v-if="showMenu" class="menu-backdrop" @click="showMenu = false"></div>
      <input ref="fileInput" type="file" accept=".json" hidden @change="importData" />
  
      <!-- View wrapper with transitions -->
      <transition :name="viewTransition" mode="out-in">
  
      <!-- ARTISTS VIEW -->
      <main v-if="currentView === 'artists'" key="artists" class="page">
        <!-- Alphabet rail -->
        <div v-if="alphabeticalGroups.length > 3" class="alpha-rail">
          <button v-for="letter in allLetters" :key="letter" @click="scrollToLetter(letter)" :class="{ active: alphabeticalGroups.indexOf(letter) !== -1 }" :disabled="alphabeticalGroups.indexOf(letter) === -1">{{ letter }}</button>
        </div>
  
        <div v-for="letter in alphabeticalGroups" :key="letter" :ref="'group-' + letter" class="group">
          <div class="group-head">
            <span class="letter">{{ letter }}</span>
            <span class="group-n">{{ groupedArtists[letter].length }}</span>
          </div>
          <div class="grid-artists">
            <div v-for="artist in groupedArtists[letter]" :key="artist.name" class="a-card" :class="{ dim: viewedArtists.indexOf(artist.name) !== -1 && viewFilter === 'all' }" @click="selectArtist(artist.name)">
              <div class="a-img">
                <div class="skeleton"></div>
                <img v-if="getProgressiveImage(artist).full" :src="getProgressiveImage(artist).full" :alt="artist.name" loading="lazy" class="fade-img" @load="onImgLoad" @error="onImgError"/>
                <div v-else class="a-ph">{{ artist.name.charAt(0) }}</div>
                <div class="a-overlay">
                  <span class="a-name">{{ artist.name }}</span>
                  <span class="a-count">{{ getArtistWorkCount(artist) }}</span>
                </div>
                <!-- Progress bar -->
                <div v-if="getArtistWorkCount(artist) > 0" class="progress-bar">
                  <div class="progress-fill" :style="{ width: getArtistProgress(artist) + '%' }"></div>
                </div>
                <span v-if="viewedArtists.indexOf(artist.name) !== -1" class="badge-check">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
              </div>
              <button @click.stop="openArtistPhotoModal(artist.name)" class="a-edit">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
            </div>
          </div>
        </div>
        <div v-if="filteredArtists.length === 0" class="empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:.3"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M8 11h6"/></svg>
          <p>No artists found</p>
        </div>
      </main>
  
      <!-- WORKS VIEW -->
      <main v-else-if="currentView === 'works'" key="works" class="page">
        <div class="works-top">
          <div class="works-info">
            <div class="chips">
              <span v-if="currentArtist && currentArtist.mainWorks && currentArtist.mainWorks.length" class="chip">{{ currentArtist.mainWorks.length }} main</span>
              <span v-if="currentArtist && currentArtist.compilations && currentArtist.compilations.length" class="chip">{{ currentArtist.compilations.length }} comp</span>
              <span class="chip chip-progress">{{ getArtistProgress(currentArtist) }}% viewed</span>
            </div>
          </div>
          <div class="works-actions">
            <!-- Sort control -->
            <select v-model="workSortBy" class="sort-select">
              <option value="default">Default</option>
              <option value="codeAsc">Code A-Z</option>
              <option value="codeDesc">Code Z-A</option>
              <option value="newest">Newest</option>
              <option value="unviewed">Unviewed first</option>
            </select>
            <button @click="openAddWorkModal" class="btn-add">+ Add</button>
          </div>
        </div>
  
        <template v-for="section in workSections">
          <div v-if="section.items.length" :key="section.key" class="w-section">
            <div class="w-head">
              <span class="w-label">{{ section.label }}</span>
              <span class="w-n">{{ section.items.length }}</span>
            </div>
            <div class="grid-works">
              <div v-for="work in section.items" :key="work.code" class="w-card" :class="{ dim: viewedWorks.indexOf(work.code) !== -1 && viewFilter === 'all' }" @click="openWorkView(work)">
                <div class="w-img">
                  <div class="skeleton"></div>
                  <img :src="getProgressiveWorkImage(work).full" :alt="work.code" loading="lazy" class="fade-img" @load="onImgLoad" @error="onImgError"/>
                  <span v-if="isCoverWork(currentArtist.name, work.code)" class="badge-star">*</span>
                  <span v-if="viewedWorks.indexOf(work.code) !== -1" class="badge-check tl">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                </div>
                <span class="w-code">{{ work.code }}</span>
              </div>
            </div>
          </div>
        </template>
  
        <div v-if="filteredMainWorks.length === 0 && filteredCompilations.length === 0" class="empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:.3"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9l6 6M15 9l-6 6"/></svg>
          <p>{{ searchQuery || viewFilter !== 'all' ? 'No matches' : 'No works yet' }}</p>
        </div>
      </main>
  
      <!-- DETAIL VIEW with swipe -->
      <main v-else-if="currentView === 'detail'" key="detail" class="page" @touchstart="onDetailTouchStart" @touchend="onDetailTouchEnd">
        <div class="detail">
          <div class="detail-left">
            <div class="big-img" @click="openLightbox(currentWork, 0)">
              <div class="skeleton"></div>
              <img :src="getProgressiveWorkImage(currentWork).full" :alt="currentWork.code" class="fade-img" @load="onImgLoad" @error="onImgError"/>
            </div>
            <div class="actions">
              <button @click="setCoverWork(currentArtist.name, currentWork.code)" class="act" :class="{ on: isCoverWork(currentArtist.name, currentWork.code) }">
                {{ isCoverWork(currentArtist.name, currentWork.code) ? '* Cover' : 'Set cover' }}
              </button>
              <button @click="openUploadModal(currentWork.code)" class="act">
                {{ hasCustomImage(currentWork.code) ? 'Update image' : 'Add image' }}
              </button>
              <button @click="copyToClipboard(currentWork.code)" class="act">Copy code</button>
              <button @click="deleteCurrentWork()" class="act act-danger">Delete</button>
            </div>
          </div>
  
          <div class="detail-right">
            <h1 class="d-code">{{ currentWork.code }}</h1>
  
            <div class="links-box">
              <span class="box-label">Watch on</span>
              <div class="link-grid">
                <button v-for="link in externalLinks" :key="link.key" @click="openExternalLink(currentWork.code, link.key)" class="link-btn">{{ link.label }}</button>
              </div>
            </div>
  
            <div v-if="currentWorkList.length > 1" class="nav-row">
              <button @click="navigateWork(-1)" :disabled="!canNavigateWork(-1)" class="nav-btn">&lt;</button>
              <span class="nav-pos">{{ currentWorkIndex + 1 }} <small>of {{ currentWorkList.length }}</small></span>
              <button @click="navigateWork(1)" :disabled="!canNavigateWork(1)" class="nav-btn">&gt;</button>
            </div>
  
            <div class="gallery-box">
              <div class="gallery-top">
                <span class="box-label">Gallery</span>
                <button @click="preloadAllGallery" class="btn-sm" :disabled="isPreloading">{{ isPreloading ? '...' : 'Load all' }}</button>
              </div>
              <div class="gallery">
                <div v-for="i in 20" :key="i" class="thumb" @click="openLightbox(currentWork, i)">
                  <div class="skeleton"></div>
                  <img :src="getImageUrl(currentWork.code, 'jp-' + i)" :alt="currentWork.code + ' ' + i" loading="lazy" class="fade-img" @load="onImgLoad" @error="onImgError"/>
                  <span class="t-n">{{ i }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
  
      </transition>
  
      <!-- MODALS -->
      <transition name="m">
        <div v-if="showAddWorkModal" class="overlay" @click.self="closeAddWorkModal">
          <div class="modal">
            <div class="m-head"><h3>Add work</h3><button @click="closeAddWorkModal" class="m-x">&times;</button></div>
            <div class="m-body">
              <label class="field"><span>Artist</span>
                <select v-model="newWork.artist"><option value="">Select...</option><option v-for="a in artists" :key="a.name" :value="a.name">{{ a.name }}</option></select>
              </label>
              <label class="field"><span>Code</span><input v-model="newWork.code" placeholder="e.g. ABC-123"/></label>
              <div class="radios">
                <label class="radio"><input v-model="newWork.type" type="radio" value="mainWorks"/><span>Main</span></label>
                <label class="radio"><input v-model="newWork.type" type="radio" value="compilations"/><span>Compilation</span></label>
              </div>
            </div>
            <div class="m-foot">
              <button @click="closeAddWorkModal" class="btn-flat">Cancel</button>
              <button @click="addNewWork" class="btn-fill">Add</button>
            </div>
          </div>
        </div>
      </transition>
  
      <!-- Add Artist Modal -->
      <transition name="m">
        <div v-if="showAddArtistModal" class="overlay" @click.self="showAddArtistModal = false">
          <div class="modal">
            <div class="m-head"><h3>Add artist</h3><button @click="showAddArtistModal = false" class="m-x">&times;</button></div>
            <div class="m-body">
              <label class="field"><span>Name</span><input v-model="newArtistName" placeholder="Artist name" @keyup.enter="addNewArtist"/></label>
            </div>
            <div class="m-foot">
              <button @click="showAddArtistModal = false" class="btn-flat">Cancel</button>
              <button @click="addNewArtist" class="btn-fill">Add</button>
            </div>
          </div>
        </div>
      </transition>
  
      <transition name="m">
        <div v-if="showUploadModal" class="overlay" @click.self="closeUploadModal">
          <div class="modal">
            <div class="m-head"><h3>Custom image</h3><button @click="closeUploadModal" class="m-x">&times;</button></div>
            <div class="m-body">
              <p class="m-sub">{{ uploadingWork }}</p>
              <label class="field"><span>Image URL</span><input v-model="customImageUrl" placeholder="https://..." @keyup.enter="handleCustomImageUrl"/></label>
              <p class="hint">Leave empty to remove</p>
            </div>
            <div class="m-foot">
              <button @click="closeUploadModal" class="btn-flat">Cancel</button>
              <button @click="handleCustomImageUrl" class="btn-fill">{{ customImageUrl.trim() ? 'Save' : 'Remove' }}</button>
            </div>
          </div>
        </div>
      </transition>
  
      <transition name="m">
        <div v-if="showArtistPhotoModal" class="overlay" @click.self="closeArtistPhotoModal">
          <div class="modal">
            <div class="m-head"><h3>Artist photo</h3><button @click="closeArtistPhotoModal" class="m-x">&times;</button></div>
            <div class="m-body">
              <p class="m-sub">{{ editingArtistName }}</p>
              <label class="field"><span>Photo URL</span><input v-model="artistPhotoUrl" placeholder="https://..." @keyup.enter="updateArtistPhoto"/></label>
              <p class="hint">Leave empty to remove</p>
            </div>
            <div class="m-foot">
              <button @click="closeArtistPhotoModal" class="btn-flat">Cancel</button>
              <button @click="updateArtistPhoto" class="btn-fill">{{ artistPhotoUrl.trim() ? 'Save' : 'Remove' }}</button>
            </div>
          </div>
        </div>
      </transition>
  
      <!-- LIGHTBOX -->
      <transition name="fade">
        <div v-if="lightbox.show" class="lb" @click.self="closeLightbox">
          <button class="lb-close" @click="closeLightbox">&times;</button>
          <button v-if="lightbox.images.length > 1" class="lb-arr left" @click="prevImage" :disabled="lightbox.currentIndex === 0">&lt;</button>
          <div class="lb-main"><img :src="lightbox.images[lightbox.currentIndex]" :alt="lightbox.code" @error="onImgError"/></div>
          <button v-if="lightbox.images.length > 1" class="lb-arr right" @click="nextImage" :disabled="lightbox.currentIndex === lightbox.images.length - 1">&gt;</button>
          <span class="lb-count">{{ lightbox.currentIndex + 1 }} / {{ lightbox.images.length }}</span>
        </div>
      </transition>
  
      <!-- TOAST -->
      <transition name="toast">
        <div v-if="toast.show" class="toast" :class="toast.type">{{ toast.message }}</div>
      </transition>
    </div>
  </template>
  
  <script>
  import { DEFAULT_ARTISTS } from '~/data/artists.js'
  import { normalizeArtists } from '~/utils/artistHelpers.js'
  
  var codeCache = new Map()
  var parseCode = function(code) {
    if (!code) return null
    if (codeCache.has(code)) return codeCache.get(code)
    var clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
    var m = clean.match(/^([A-Z]+)(\d+)$/)
    var r = m
      ? { full: clean, prefix: m[1].toLowerCase(), number: m[2], rawNumber: parseInt(m[2], 10) }
      : { full: clean, prefix: clean.toLowerCase(), number: '001', rawNumber: 1 }
    codeCache.set(code, r)
    return r
  }
  
  function ImageDB() { this.dbName = 'WorksTrackerDB'; this.storeName = 'customImages'; this.db = null }
  ImageDB.prototype.init = function() {
    var self = this
    return new Promise(function(res) {
      if (!window.indexedDB) return res(false)
      var req = indexedDB.open(self.dbName, 1)
      req.onerror = function() { res(false) }
      req.onsuccess = function() { self.db = req.result; res(true) }
      req.onupgradeneeded = function(e) {
        var db = e.target.result
        if (!db.objectStoreNames.contains(self.storeName)) db.createObjectStore(self.storeName, { keyPath: 'code' })
      }
    })
  }
  ImageDB.prototype.getAll = function() {
    if (!this.db) return Promise.resolve({})
    var store = this.storeName; var db = this.db
    return new Promise(function(res) { var t = db.transaction([store], 'readonly').objectStore(store).getAll(); t.onsuccess = function() { var r = {}; t.result.forEach(function(i) { r[i.code] = i.data }); res(r) }; t.onerror = function() { res({}) } })
  }
  ImageDB.prototype.set = function(code, data) {
    if (!this.db) return Promise.resolve(false)
    var store = this.storeName; var db = this.db
    return new Promise(function(res) { var t = db.transaction([store], 'readwrite').objectStore(store).put({ code: code, data: data }); t.onsuccess = function() { res(true) }; t.onerror = function() { res(false) } })
  }
  ImageDB.prototype.clear = function() {
    if (!this.db) return Promise.resolve(false)
    var store = this.storeName; var db = this.db
    return new Promise(function(res) { var t = db.transaction([store], 'readwrite').objectStore(store).clear(); t.onsuccess = function() { res(true) }; t.onerror = function() { res(false) } })
  }
  
  var ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  
  export default {
    name: 'WorksTracker',
    data: function() {
      return {
        currentView: 'artists',
        viewTransition: 'slide-right',
        activeTab: '',
        searchQuery: '',
        artistSortBy: 'nameAsc',
        workSortBy: 'default',
        viewFilter: 'all',
        artists: normalizeArtists(JSON.parse(JSON.stringify(DEFAULT_ARTISTS))),
        currentWork: null, currentWorkList: [], currentWorkIndex: 0,
        currentArtistList: [], currentArtistIndex: 0,
        customImages: {}, artistPhotos: {},
        viewedArtists: [], viewedWorks: [],
        showAddWorkModal: false, showUploadModal: false, showArtistPhotoModal: false,
        showAddArtistModal: false, showMenu: false,
        newWork: { artist: '', code: '', type: 'mainWorks' },
        newArtistName: '',
        uploadingWork: null, customImageUrl: '',
        editingArtistName: '', artistPhotoUrl: '',
        lightbox: { show: false, images: [], currentIndex: 0, code: '' },
        toast: { show: false, message: '', type: 'success' },
        isPreloading: false, imageDB: null,
        useLocalStorageFallback: false, customImagesLoaded: false,
        scrollPositions: {},
        touchStartX: 0, touchEndX: 0, touchStartY: 0, touchEndY: 0,
        detailTouchStartX: 0, detailTouchStartY: 0,
        handleTouchStart: null, handleTouchEnd: null,
        allLetters: ALL_LETTERS,
        externalLinks: [
          { key: 'njav', label: 'NJAV' },
          { key: 'missav', label: 'MissAV' },
          { key: '24av', label: '24AV' },
          { key: '24av-uncensor', label: '24AV UC' }
        ]
      }
    },
    computed: {
      totalCount: function() {
        return this.artists.reduce(function(s, a) { return s + ((a.mainWorks && a.mainWorks.length) || 0) + ((a.compilations && a.compilations.length) || 0) }, 0)
      },
      currentArtist: function() { var tab = this.activeTab; return this.artists.find(function(a) { return a.name === tab }) },
      sortedArtists: function() {
        var self = this; var arr = this.artists.slice()
        var sorts = {
          nameAsc: function(a, b) { return a.name.localeCompare(b.name) },
          nameDesc: function(a, b) { return b.name.localeCompare(a.name) },
          mostWorks: function(a, b) { return self.getArtistWorkCount(b) - self.getArtistWorkCount(a) },
          leastWorks: function(a, b) { return self.getArtistWorkCount(a) - self.getArtistWorkCount(b) }
        }
        return arr.sort(sorts[this.artistSortBy] || sorts.nameAsc)
      },
      filteredArtists: function() {
        var self = this
        var list = this.sortedArtists
        if (this.searchQuery.trim()) {
          var q = this.searchQuery.toLowerCase()
          list = list.filter(function(a) { return a.name.toLowerCase().indexOf(q) !== -1 })
        }
        if (this.viewFilter === 'unviewed') {
          list = list.filter(function(a) { return self.viewedArtists.indexOf(a.name) === -1 })
        } else if (this.viewFilter === 'viewed') {
          list = list.filter(function(a) { return self.viewedArtists.indexOf(a.name) !== -1 })
        }
        return list
      },
      groupedArtists: function() {
        var g = {}
        this.filteredArtists.forEach(function(a) { var l = a.name.charAt(0).toUpperCase(); if (!g[l]) g[l] = []; g[l].push(a) })
        return g
      },
      alphabeticalGroups: function() { return Object.keys(this.groupedArtists).sort() },
      filteredMainWorks: function() {
        if (!(this.currentArtist && this.currentArtist.mainWorks)) return []
        var list = this.currentArtist.mainWorks.slice()
        list = this.applySortAndFilter(list)
        return list
      },
      filteredCompilations: function() {
        if (!(this.currentArtist && this.currentArtist.compilations)) return []
        var list = this.currentArtist.compilations.slice()
        list = this.applySortAndFilter(list)
        return list
      },
      workSections: function() {
        return [
          { key: 'main', label: 'Main Works', items: this.filteredMainWorks },
          { key: 'comp', label: 'Compilations', items: this.filteredCompilations }
        ]
      }
    },
    watch: {
      artists: { handler: function(v) { if (process.client) try { localStorage.setItem('artists', JSON.stringify(v)) } catch(e){} }, deep: true },
      customImages: { handler: function(v) { this.saveCustomImagesToDB(v) }, deep: true },
      artistPhotos: { handler: function(v) { if (process.client) localStorage.setItem('artistPhotos', JSON.stringify(v)) }, deep: true },
      viewedArtists: { handler: function(v) { if (process.client) localStorage.setItem('viewedArtists', JSON.stringify(v)) }, deep: true },
      viewedWorks: { handler: function(v) { if (process.client) localStorage.setItem('viewedWorks', JSON.stringify(v)) }, deep: true },
      artistSortBy: { handler: function(v) { if (process.client) localStorage.setItem('artistSortBy', v) } }
    },
    mounted: function() {
      if (process.client) {
        this.imageDB = new ImageDB()
        this.initializeApp()
        this.setupKeyboardShortcuts()
      }
    },
    methods: {
      applySortAndFilter: function(list) {
        var self = this
        if (this.searchQuery.trim()) {
          var q = this.searchQuery.toLowerCase()
          list = list.filter(function(w) { return w.code.toLowerCase().indexOf(q) !== -1 })
        }
        if (this.viewFilter === 'unviewed') {
          list = list.filter(function(w) { return self.viewedWorks.indexOf(w.code) === -1 })
        } else if (this.viewFilter === 'viewed') {
          list = list.filter(function(w) { return self.viewedWorks.indexOf(w.code) !== -1 })
        }
        if (this.workSortBy === 'codeAsc') list.sort(function(a, b) { return a.code.localeCompare(b.code) })
        else if (this.workSortBy === 'codeDesc') list.sort(function(a, b) { return b.code.localeCompare(a.code) })
        else if (this.workSortBy === 'newest') list.sort(function(a, b) { return (b.addedAt || 0) - (a.addedAt || 0) })
        else if (this.workSortBy === 'unviewed') list.sort(function(a, b) {
          var av = self.viewedWorks.indexOf(a.code) !== -1 ? 1 : 0
          var bv = self.viewedWorks.indexOf(b.code) !== -1 ? 1 : 0
          return av - bv
        })
        return list
      },
      initializeApp: function() {
        var self = this
        this.imageDB.init().then(function(ok) {
          if (ok) { return self.imageDB.getAll().then(function(imgs) { self.customImages = imgs || {} }) }
          else { self.useLocalStorageFallback = true; var s = localStorage.getItem('customImages'); if (s) self.customImages = JSON.parse(s) }
        }).catch(function() {
          self.useLocalStorageFallback = true
          try { var s = localStorage.getItem('customImages'); if (s) self.customImages = JSON.parse(s) } catch(e2){}
        }).then(function() {
          self.customImagesLoaded = true
          var loads = [
            ['artists', function(v) { var p = JSON.parse(v); if (Array.isArray(p) && p.length) self.artists = normalizeArtists(p) }],
            ['artistPhotos', function(v) { self.artistPhotos = JSON.parse(v) }],
            ['viewedArtists', function(v) { self.viewedArtists = JSON.parse(v) }],
            ['viewedWorks', function(v) { self.viewedWorks = JSON.parse(v) }],
            ['artistSortBy', function(v) { self.artistSortBy = v }]
          ]
          loads.forEach(function(pair) { try { var v = localStorage.getItem(pair[0]); if (v) pair[1](v) } catch(e){} })
        })
      },
      setupKeyboardShortcuts: function() {
        var self = this
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') {
            if (self.showMenu) { self.showMenu = false; return }
            if (self.lightbox.show) self.closeLightbox()
            else if (self.showAddWorkModal) self.closeAddWorkModal()
            else if (self.showAddArtistModal) { self.showAddArtistModal = false }
            else if (self.showUploadModal) self.closeUploadModal()
            else if (self.showArtistPhotoModal) self.closeArtistPhotoModal()
            else if (self.currentView === 'detail') self.backToWorks()
            else if (self.currentView === 'works') self.backToArtists()
          }
          if (self.lightbox.show) { if (e.key === 'ArrowLeft') self.prevImage(); if (e.key === 'ArrowRight') self.nextImage() }
          if (self.currentView === 'detail' && !self.lightbox.show) {
            if (e.key === 'ArrowLeft' && self.canNavigateWork(-1)) self.navigateWork(-1)
            if (e.key === 'ArrowRight' && self.canNavigateWork(1)) self.navigateWork(1)
          }
        })
      },
      onImgLoad: function(e) { e.target.classList.add('loaded') },
      onImgError: function(e) { e.target.style.display = 'none' },
      handleSearch: function() {},
      goBack: function() {
        this.viewTransition = 'slide-left'
        this.currentView === 'detail' ? this.backToWorks() : this.backToArtists()
      },
      getArtistWorkCount: function(a) { return ((a.mainWorks && a.mainWorks.length) || 0) + ((a.compilations && a.compilations.length) || 0) },
      getArtistProgress: function(artist) {
        if (!artist) return 0
        var total = this.getArtistWorkCount(artist)
        if (total === 0) return 0
        var all = (artist.mainWorks || []).concat(artist.compilations || [])
        var self = this
        var seen = all.filter(function(w) { return self.viewedWorks.indexOf(w.code) !== -1 }).length
        return Math.round((seen / total) * 100)
      },
      getProgressiveImage: function(artist) {
        if (this.artistPhotos[artist.name]) return { full: this.artistPhotos[artist.name] }
        var cw = this.getCoverWork(artist)
        return cw ? this.getProgressiveWorkImage(cw) : { full: null }
      },
      getProgressiveWorkImage: function(work) {
        if (!work) return { full: null }
        if (this.customImages[work.code]) return { full: this.customImages[work.code] }
        var p = parseCode(work.code)
        if (!p) return { full: null }
        var id = p.prefix + ('00000' + p.number).slice(-5)
        if (id.length < 3) return { full: null }
        return { thumb: 'https://pics.dmm.co.jp/digital/video/' + id + '/' + id + 'ps.jpg', full: 'https://pics.dmm.co.jp/digital/video/' + id + '/' + id + 'pl.jpg' }
      },
      getImageUrl: function(code, quality) {
        if (!quality) quality = 'pl'
        if (quality === 'pl' && this.customImages[code]) return this.customImages[code]
        var p = parseCode(code)
        if (!p) return null
        var id = p.prefix + ('00000' + p.number).slice(-5)
        if (id.length < 3) return null
        if (quality !== 'pl') { var n = quality.split('-')[1] || '1'; return 'https://pics.dmm.co.jp/digital/video/' + id + '/' + id + 'jp-' + n + '.jpg' }
        return 'https://pics.dmm.co.jp/digital/video/' + id + '/' + id + 'pl.jpg'
      },
      hasCustomImage: function(code) { return !!this.customImages[code] },
      getCoverWork: function(artist) {
        if (artist.cover) {
          var all = (artist.mainWorks || []).concat(artist.compilations || [])
          var f = all.find(function(w) { return w.code === artist.cover })
          if (f) return f
        }
        return (artist.mainWorks && artist.mainWorks[0]) || (artist.compilations && artist.compilations[0]) || null
      },
      scrollToLetter: function(letter) {
        var ref = this.$refs['group-' + letter]
        if (ref && ref[0]) { ref[0].scrollIntoView({ behavior: 'smooth', block: 'start' }) }
      },
      selectArtist: function(name) {
        this.viewTransition = 'slide-right'
        this.saveScrollPosition('artists')
        if (this.viewedArtists.indexOf(name) === -1) this.viewedArtists.push(name)
        this.currentArtistList = this.filteredArtists
        this.currentArtistIndex = this.currentArtistList.findIndex(function(a) { return a.name === name })
        this.activeTab = name; this.currentView = 'works'; this.searchQuery = ''; this.workSortBy = 'default'; this.viewFilter = 'all'
        this.$nextTick(function() { window.scrollTo({ top: 0, behavior: 'instant' }) })
      },
      backToArtists: function() {
        var self = this
        this.viewTransition = 'slide-left'
        this.currentView = 'artists'; this.activeTab = ''; this.searchQuery = ''; this.viewFilter = 'all'
        this.$nextTick(function() { self.restoreScrollPosition('artists') })
      },
      openWorkView: function(work) {
        this.viewTransition = 'slide-right'
        this.saveScrollPosition('works')
        if (this.viewedWorks.indexOf(work.code) === -1) this.viewedWorks.push(work.code)
        var isMain = this.currentArtist.mainWorks && this.currentArtist.mainWorks.find(function(w) { return w.code === work.code })
        this.currentWorkList = isMain ? this.filteredMainWorks : this.filteredCompilations
        this.currentWorkIndex = this.currentWorkList.findIndex(function(w) { return w.code === work.code })
        this.currentWork = work; this.currentView = 'detail'
        this.$nextTick(function() { window.scrollTo({ top: 0, behavior: 'instant' }) })
      },
      backToWorks: function() {
        var self = this
        this.viewTransition = 'slide-left'
        this.currentView = 'works'; this.currentWork = null
        this.$nextTick(function() { self.restoreScrollPosition('works') })
      },
      saveScrollPosition: function(v) { if (process.client) this.scrollPositions[v] = window.scrollY || 0 },
      restoreScrollPosition: function(v) {
        var pos = this.scrollPositions[v] || 0
        if (process.client) requestAnimationFrame(function() { window.scrollTo({ top: pos, behavior: 'instant' }) })
      },
      navigateWork: function(dir) {
        var i = this.currentWorkIndex + dir
        if (i >= 0 && i < this.currentWorkList.length) {
          this.currentWorkIndex = i; this.currentWork = this.currentWorkList[i]
          if (this.viewedWorks.indexOf(this.currentWork.code) === -1) this.viewedWorks.push(this.currentWork.code)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      },
      canNavigateWork: function(dir) { var i = this.currentWorkIndex + dir; return i >= 0 && i < this.currentWorkList.length },
      // Detail swipe
      onDetailTouchStart: function(e) {
        this.detailTouchStartX = e.changedTouches[0].screenX
        this.detailTouchStartY = e.changedTouches[0].screenY
      },
      onDetailTouchEnd: function(e) {
        var dx = e.changedTouches[0].screenX - this.detailTouchStartX
        var dy = e.changedTouches[0].screenY - this.detailTouchStartY
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
          if (dx > 0 && this.canNavigateWork(-1)) this.navigateWork(-1)
          else if (dx < 0 && this.canNavigateWork(1)) this.navigateWork(1)
        }
      },
      isCoverWork: function(name, code) { var a = this.artists.find(function(x) { return x.name === name }); return a && a.cover === code },
      setCoverWork: function(name, code) {
        var a = this.artists.find(function(x) { return x.name === name })
        if (a) { a.cover = code; this.artists = this.artists.slice() }
        this.showToast('Cover updated')
      },
      // Delete work
      deleteCurrentWork: function() {
        if (!this.currentWork || !this.currentArtist) return
        if (!confirm('Delete ' + this.currentWork.code + '?')) return
        var code = this.currentWork.code
        var artist = this.currentArtist
        if (artist.mainWorks) { artist.mainWorks = artist.mainWorks.filter(function(w) { return w.code !== code }) }
        if (artist.compilations) { artist.compilations = artist.compilations.filter(function(w) { return w.code !== code }) }
        this.artists = this.artists.slice()
        this.showToast('Deleted ' + code)
        this.backToWorks()
      },
      // Add artist
      openAddArtistModal: function() { this.newArtistName = ''; this.showAddArtistModal = true },
      addNewArtist: function() {
        var name = this.newArtistName.trim()
        if (!name) return this.showToast('Name required', 'error')
        if (this.artists.find(function(a) { return a.name.toLowerCase() === name.toLowerCase() })) return this.showToast('Artist exists', 'error')
        this.artists.push({ name: name, mainWorks: [], compilations: [], cover: '' })
        this.artists = this.artists.slice()
        this.showAddArtistModal = false
        this.showToast('Added ' + name)
      },
      openAddWorkModal: function() { this.newWork = { artist: this.activeTab || '', code: '', type: 'mainWorks' }; this.showAddWorkModal = true },
      closeAddWorkModal: function() { this.showAddWorkModal = false },
      addNewWork: function() {
        if (!this.newWork.artist || !this.newWork.code) return this.showToast('Required fields', 'error')
        var code = this.newWork.code.toUpperCase()
        var exists = this.artists.some(function(a) {
          return (a.mainWorks || []).some(function(w) { return w.code === code }) || (a.compilations || []).some(function(w) { return w.code === code })
        })
        if (exists) return this.showToast('Code exists', 'error')
        var self = this
        var artist = this.artists.find(function(a) { return a.name === self.newWork.artist })
        if (!artist) return this.showToast('Artist not found', 'error')
        if (!artist[this.newWork.type]) artist[this.newWork.type] = []
        artist[this.newWork.type].push({ code: code, addedAt: Date.now() })
        this.artists = this.artists.slice(); this.closeAddWorkModal(); this.showToast('Added ' + code)
      },
      openUploadModal: function(code) { this.uploadingWork = code; this.customImageUrl = this.customImages[code] || ''; this.showUploadModal = true },
      closeUploadModal: function() { this.showUploadModal = false; this.uploadingWork = null; this.customImageUrl = '' },
      handleCustomImageUrl: function() {
        var self = this; var url = this.customImageUrl.trim()
        if (!url) {
          var n = Object.assign({}, this.customImages); delete n[this.uploadingWork]; this.customImages = n
          this.showToast('Image removed'); this.closeUploadModal(); return
        }
        if (url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0) return this.showToast('Must start with http(s)://', 'error')
        var img = new Image(); var to = setTimeout(function() { self.showToast('Timeout', 'error') }, 10000)
        img.onload = function() { clearTimeout(to); var c = Object.assign({}, self.customImages); c[self.uploadingWork] = url; self.customImages = c; self.showToast('Image added'); self.closeUploadModal() }
        img.onerror = function() { clearTimeout(to); self.showToast('Load failed', 'error') }
        img.src = url
      },
      openArtistPhotoModal: function(name) { this.editingArtistName = name; this.artistPhotoUrl = this.artistPhotos[name] || ''; this.showArtistPhotoModal = true },
      closeArtistPhotoModal: function() { this.showArtistPhotoModal = false; this.editingArtistName = ''; this.artistPhotoUrl = '' },
      updateArtistPhoto: function() {
        var self = this; var url = this.artistPhotoUrl.trim()
        if (!url) {
          var n = Object.assign({}, this.artistPhotos); delete n[this.editingArtistName]; this.artistPhotos = n
          localStorage.setItem('artistPhotos', JSON.stringify(this.artistPhotos)); this.showToast('Photo removed'); this.closeArtistPhotoModal(); return
        }
        var img = new Image(); var to = setTimeout(function() { self.showToast('Timeout', 'error') }, 10000)
        img.onload = function() { clearTimeout(to); var c = Object.assign({}, self.artistPhotos); c[self.editingArtistName] = url; self.artistPhotos = c; localStorage.setItem('artistPhotos', JSON.stringify(self.artistPhotos)); self.showToast('Photo updated'); self.closeArtistPhotoModal() }
        img.onerror = function() { clearTimeout(to); self.showToast('Load failed', 'error') }
        img.src = url
      },
      openLightbox: function(work, startIndex) {
        var self = this; if (startIndex === undefined) startIndex = 0
        var imgs = [this.getImageUrl(work.code)]
        for (var i = 1; i <= 20; i++) imgs.push(this.getImageUrl(work.code, 'jp-' + i))
        this.lightbox = { show: true, images: imgs, currentIndex: startIndex, code: work.code }
        if (process.client) { document.body.style.overflow = 'hidden'; this.$nextTick(function() { self.setupSwipeGestures() }) }
      },
      closeLightbox: function() { this.lightbox.show = false; if (process.client) { document.body.style.overflow = ''; this.cleanupSwipeGestures() } },
      setupSwipeGestures: function() {
        var self = this; var el = document.querySelector('.lb'); if (!el) return
        this.handleTouchStart = function(e) { self.touchStartX = e.changedTouches[0].screenX; self.touchStartY = e.changedTouches[0].screenY }
        this.handleTouchEnd = function(e) { self.touchEndX = e.changedTouches[0].screenX; self.touchEndY = e.changedTouches[0].screenY; self.handleSwipe() }
        el.addEventListener('touchstart', this.handleTouchStart, { passive: true })
        el.addEventListener('touchend', this.handleTouchEnd, { passive: true })
      },
      cleanupSwipeGestures: function() {
        var el = document.querySelector('.lb'); if (!el) return
        if (this.handleTouchStart) el.removeEventListener('touchstart', this.handleTouchStart)
        if (this.handleTouchEnd) el.removeEventListener('touchend', this.handleTouchEnd)
      },
      handleSwipe: function() {
        var dx = this.touchEndX - this.touchStartX; var dy = this.touchEndY - this.touchStartY
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) { dx > 0 ? this.prevImage() : this.nextImage() }
      },
      nextImage: function() { if (this.lightbox.currentIndex < this.lightbox.images.length - 1) this.lightbox.currentIndex++ },
      prevImage: function() { if (this.lightbox.currentIndex > 0) this.lightbox.currentIndex-- },
      preloadAllGallery: function() {
        var self = this; if (!this.currentWork) return; this.isPreloading = true
        var promises = []; for (var i = 1; i <= 20; i++) { (function(idx) { promises.push(new Promise(function(res) { var img = new Image(); img.onload = img.onerror = res; img.src = self.getImageUrl(self.currentWork.code, 'jp-' + idx) })) })(i) }
        Promise.all(promises).then(function() { self.isPreloading = false; self.showToast('Gallery loaded') })
      },
      copyToClipboard: function(code) {
        var self = this; navigator.clipboard.writeText(code).then(function() { self.showToast('Copied: ' + code) }).catch(function() { self.showToast('Copy failed', 'error') })
      },
      openExternalLink: function(code, type) {
        var c = code.toLowerCase()
        var urls = { missav: 'https://missav.ws/en/' + c, '24av': 'https://24av.net/en/v/' + c, '24av-uncensor': 'https://24av.net/en/uncensored/' + c, njav: 'https://www.njav.com/en/xvideos/' + c }
        window.open(urls[type] || urls.njav, '_blank', 'noopener,noreferrer')
      },
      clearViewHistory: function() {
        if (!confirm('Clear all viewing history?')) return
        this.viewedArtists = []; this.viewedWorks = []
        localStorage.removeItem('viewedArtists'); localStorage.removeItem('viewedWorks')
        this.showToast('History cleared')
      },
      showToast: function(msg, type) {
        var self = this; this.toast = { show: true, message: msg, type: type || 'success' }
        setTimeout(function() { self.toast.show = false }, 2500)
      },
      saveCustomImagesToDB: function(images) {
        if (!this.customImagesLoaded) return; var self = this
        if (this.useLocalStorageFallback) { try { localStorage.setItem('customImages', JSON.stringify(images)) } catch(e){} }
        else { this.imageDB.clear().then(function() { var keys = Object.keys(images); var chain = Promise.resolve(); keys.forEach(function(code) { chain = chain.then(function() { return self.imageDB.set(code, images[code]) }) }); return chain }).catch(function() {}) }
      },
      exportData: function() {
        try {
          var self = this
          var arr = this.artists.map(function(a) {
            return { name: a.name, cover: a.cover || '', url: self.artistPhotos[a.name] || '', compilations: (a.compilations || []).map(function(w) { return w.code }).sort(), mainWorks: (a.mainWorks || []).map(function(w) { return w.code }).sort() }
          }).sort(function(a, b) { return a.name.localeCompare(b.name) })
          var s = 'export const DEFAULT_ARTISTS = [\n'
          arr.forEach(function(a, i) {
            s += '  {\n    name: \'' + a.name + '\',\n    cover: \'' + a.cover + '\',\n    url: \'' + a.url + '\',\n'
            s += '    compilations: [' + a.compilations.map(function(c) { return '\'' + c + '\'' }).join(', ') + '],\n'
            s += '    mainWorks: [' + a.mainWorks.map(function(w) { return '\'' + w + '\'' }).join(', ') + ']\n'
            s += '  }' + (i < arr.length - 1 ? ',' : '') + '\n'
          })
          s += ']'
          var blob = new Blob([s], { type: 'text/javascript' }); var url = URL.createObjectURL(blob)
          var a = document.createElement('a'); a.href = url; a.download = 'artists-' + new Date().toISOString().split('T')[0] + '.js'; a.click()
          URL.revokeObjectURL(url); this.showToast('Exported')
        } catch(e) { this.showToast('Export failed', 'error') }
      },
      triggerImport: function() { this.$refs.fileInput.click() },
      importData: function(event) {
        var self = this
        try {
          var file = event.target.files && event.target.files[0]; if (!file) return
          var reader = new FileReader()
          reader.onload = function(e) {
            var data = JSON.parse(e.target.result)
            if (!data.artists || !Array.isArray(data.artists)) return self.showToast('Invalid format', 'error')
            self.artists = normalizeArtists(data.artists)
            self.customImages = data.customImages || {}; self.artistPhotos = data.artistPhotos || {}
            localStorage.setItem('artists', JSON.stringify(self.artists)); self.showToast('Imported')
          }
          reader.readAsText(file); event.target.value = ''
        } catch(e) { this.showToast('Import failed', 'error') }
      },
      hardRefresh: function() {
        if (!confirm('Reset everything? Cannot be undone.')) return
        var self = this
        ;['artists','artistPhotos','viewedArtists','viewedWorks','artistSortBy','customImages'].forEach(function(k) { localStorage.removeItem(k) })
        var p = this.imageDB ? this.imageDB.clear() : Promise.resolve()
        p.then(function() {
          self.artists = normalizeArtists(JSON.parse(JSON.stringify(DEFAULT_ARTISTS)))
          self.currentView = 'artists'; self.activeTab = ''; self.artistPhotos = {}; self.customImages = {}
          self.viewedArtists = []; self.viewedWorks = []; self.artistSortBy = 'nameAsc'
          localStorage.setItem('artists', JSON.stringify(self.artists)); self.showToast('Reset complete')
        })
      }
    }
  }
  </script>
  
  <style scoped>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --bg: #F8F6F2; --surface: #FFFFFF; --ink: #1A1A1A; --ink2: #6B6560; --ink3: #A09A93;
    --warm: #C8785A; --warm-bg: #FDF0EB; --warm-dark: #9E5A3E;
    --line: #E6E1DB; --line2: #D5CFC8;
    --r: 8px; --t: 180ms ease;
    --mono: 'IBM Plex Mono', monospace; --sans: 'DM Sans', -apple-system, sans-serif;
  }
  body { font-family: var(--sans); background: var(--bg); color: var(--ink); -webkit-font-smoothing: antialiased; }
  .app { min-height: 100vh; }
  
  /* BAR */
  .bar { position: fixed; top: 0; left: 0; right: 0; height: 54px; z-index: 100; background: var(--surface); border-bottom: 2px solid var(--ink); display: flex; align-items: center; justify-content: space-between; padding: 0 20px; gap: 12px; }
  .bar-left, .bar-right { display: flex; align-items: center; gap: 10px; }
  .bar-right { flex-shrink: 0; }
  .stats { display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--ink2); }
  .stats b { color: var(--ink); font-weight: 700; }
  .stat-sep { color: var(--line2); margin: 0 2px; }
  .bar-artist { display: flex; align-items: center; gap: 8px; }
  .bar-avatar { width: 28px; height: 28px; border-radius: 50%; overflow: hidden; background: var(--line); border: 1.5px solid var(--line2); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: var(--ink3); }
  .bar-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .bar-title { font-size: 15px; font-weight: 700; letter-spacing: -0.3px; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
  .bar-title.mono { font-family: var(--mono); font-size: 14px; letter-spacing: 0; }
  .btn-back { width: 34px; height: 34px; border: 2px solid var(--ink); border-radius: var(--r); background: var(--surface); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--ink); transition: all var(--t); }
  .btn-back:hover { background: var(--ink); color: var(--surface); }
  .search-box { position: relative; display: flex; align-items: center; }
  .search-ico { position: absolute; left: 10px; color: var(--ink3); pointer-events: none; }
  .search-box input { width: 160px; padding: 8px 28px 8px 30px; border: 2px solid var(--line); border-radius: var(--r); background: var(--bg); font: 13px var(--sans); color: var(--ink); transition: border-color var(--t); }
  .search-box input:focus { outline: none; border-color: var(--ink); }
  .search-box input::placeholder { color: var(--ink3); }
  .search-x { position: absolute; right: 6px; width: 20px; height: 20px; background: var(--line); border: none; border-radius: 50%; cursor: pointer; font-size: 14px; color: var(--ink2); display: flex; align-items: center; justify-content: center; }
  .btn-filter { padding: 6px 12px; border: 2px solid var(--line); border-radius: var(--r); background: var(--surface); font: 600 11px var(--sans); color: var(--ink2); cursor: pointer; transition: all var(--t); white-space: nowrap; }
  .btn-filter:hover { border-color: var(--ink); color: var(--ink); }
  .btn-filter.active { background: var(--warm-bg); border-color: var(--warm); color: var(--warm-dark); }
  .menu-wrap { position: relative; }
  .btn-menu { width: 34px; height: 34px; border: 2px solid var(--line); border-radius: var(--r); background: var(--surface); cursor: pointer; color: var(--ink2); display: flex; align-items: center; justify-content: center; transition: all var(--t); }
  .btn-menu:hover { border-color: var(--ink); color: var(--ink); }
  .menu-drop { position: absolute; top: 42px; right: 0; min-width: 160px; background: var(--surface); border: 2px solid var(--ink); border-radius: var(--r); overflow: hidden; z-index: 200; }
  .menu-drop button { display: block; width: 100%; padding: 12px 16px; border: none; background: none; font: 500 13px var(--sans); color: var(--ink); text-align: left; cursor: pointer; transition: background var(--t); }
  .menu-drop button:hover { background: var(--bg); }
  .menu-drop .menu-danger { color: #C44; }
  .menu-drop .menu-danger:hover { background: #FEF0F0; }
  .menu-backdrop { position: fixed; inset: 0; z-index: 99; }
  
  .page { padding: 74px 24px 48px; max-width: 1400px; margin: 0 auto; }
  
  /* SKELETON + FADE */
  .skeleton { position: absolute; inset: 0; background: linear-gradient(90deg, var(--line) 25%, var(--line2) 50%, var(--line) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: inherit; }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  .fade-img { opacity: 0; transition: opacity .3s ease; position: relative; z-index: 1; }
  .fade-img.loaded { opacity: 1; }
  
  /* ALPHABET RAIL */
  .alpha-rail { position: fixed; right: 6px; top: 54px; bottom: 0; z-index: 60; display: flex; flex-direction: column; justify-content: center; padding: 8px 0; }
  .alpha-rail button { display: block; padding: 1px 4px; border: none; background: none; font: 600 9px var(--mono); color: var(--ink3); cursor: pointer; line-height: 1.4; transition: color var(--t); }
  .alpha-rail button.active { color: var(--ink); }
  .alpha-rail button:disabled { opacity: .25; cursor: default; }
  .alpha-rail button:hover:not(:disabled) { color: var(--warm); }
  
  /* ARTISTS */
  .group { margin-bottom: 36px; }
  .group-head { position: sticky; top: 54px; z-index: 50; display: flex; align-items: baseline; gap: 8px; padding: 10px 0; margin-bottom: 16px; background: var(--bg); border-bottom: 2px solid var(--ink); }
  .letter { font-size: 28px; font-weight: 700; letter-spacing: -1.5px; line-height: 1; }
  .group-n { font-size: 13px; color: var(--ink3); font-weight: 600; }
  .grid-artists { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; padding-right: 20px; }
  .a-card { position: relative; cursor: pointer; border-radius: var(--r); overflow: hidden; transition: opacity var(--t), transform var(--t); }
  .a-card:hover { transform: translateY(-2px); }
  .a-card.dim { opacity: .4; }
  .a-card.dim:hover { opacity: .6; }
  .a-img { position: relative; width: 100%; aspect-ratio: 3/2; background: var(--line); overflow: hidden; border: 2px solid var(--line); border-radius: var(--r); transition: border-color var(--t); }
  .a-card:hover .a-img { border-color: var(--ink); }
  .a-img img { width: 100%; height: 100%; object-fit: cover; }
  .a-card:hover .a-img img { transform: scale(1.04); transition: transform .3s ease; }
  .a-ph { position: relative; z-index: 1; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 48px; font-weight: 700; color: var(--line2); background: var(--bg); }
  .a-overlay { position: absolute; bottom: 0; left: 0; right: 0; z-index: 2; padding: 24px 12px 10px; background: linear-gradient(transparent, rgba(0,0,0,.65)); display: flex; justify-content: space-between; align-items: baseline; }
  .a-name { font-size: 13px; font-weight: 700; color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,.4); }
  .a-count { font-size: 11px; font-family: var(--mono); color: rgba(255,255,255,.7); }
  .progress-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: rgba(0,0,0,.3); z-index: 3; }
  .progress-fill { height: 100%; background: var(--warm); transition: width .3s ease; border-radius: 0 2px 2px 0; }
  .badge-check { position: absolute; top: 8px; left: 8px; z-index: 4; width: 22px; height: 22px; border-radius: 50%; background: var(--warm); color: #fff; display: flex; align-items: center; justify-content: center; }
  .badge-check.tl { top: 6px; left: 6px; width: 20px; height: 20px; }
  .a-edit { position: absolute; top: 8px; right: 8px; z-index: 4; width: 26px; height: 26px; border-radius: var(--r); background: rgba(255,255,255,.9); border: none; cursor: pointer; opacity: 0; transition: opacity var(--t); display: flex; align-items: center; justify-content: center; color: var(--ink); }
  .a-card:hover .a-edit { opacity: 1; }
  .a-edit:hover { background: var(--warm); color: #fff; }
  
  /* WORKS */
  .works-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 12px; flex-wrap: wrap; }
  .works-info { flex: 1; }
  .chips { display: flex; gap: 8px; flex-wrap: wrap; }
  .chip { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; font-family: var(--mono); border: 1.5px solid var(--line2); color: var(--ink2); background: var(--surface); }
  .chip-progress { border-color: var(--warm); color: var(--warm-dark); background: var(--warm-bg); }
  .works-actions { display: flex; gap: 8px; align-items: center; }
  .sort-select { padding: 8px 12px; border: 2px solid var(--line); border-radius: var(--r); font: 600 12px var(--sans); color: var(--ink2); background: var(--surface); cursor: pointer; }
  .sort-select:focus { outline: none; border-color: var(--ink); }
  .btn-add { padding: 10px 18px; background: var(--ink); color: var(--surface); border: 2px solid var(--ink); border-radius: var(--r); font: 600 13px var(--sans); cursor: pointer; white-space: nowrap; transition: all var(--t); }
  .btn-add:hover { background: #000; }
  .w-section { margin-bottom: 36px; }
  .w-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid var(--line); }
  .w-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: var(--ink2); }
  .w-n { font-size: 12px; color: var(--ink3); font-family: var(--mono); }
  .grid-works { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
  .w-card { position: relative; cursor: pointer; transition: transform .2s ease, opacity var(--t); }
  .w-card:hover { transform: translateY(-3px); }
  .w-card.dim { opacity: .4; }
  .w-card.dim:hover { opacity: .6; }
  .w-img { position: relative; width: 100%; aspect-ratio: 3/2; border: 2px solid var(--line); border-radius: var(--r); overflow: hidden; background: var(--bg); margin-bottom: 8px; transition: border-color var(--t); }
  .w-card:hover .w-img { border-color: var(--ink); }
  .w-img img { width: 100%; height: 100%; object-fit: cover; }
  .w-card:hover .w-img img { transform: scale(1.04); transition: transform .3s ease; }
  .badge-star { position: absolute; top: 6px; right: 6px; z-index: 2; width: 22px; height: 22px; border-radius: 50%; background: var(--warm); color: #fff; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
  .w-code { font: 600 12px var(--mono); color: var(--ink); display: block; padding: 0 2px; }
  
  /* DETAIL */
  .detail { display: grid; grid-template-columns: 1fr 420px; gap: 32px; }
  .detail-left { display: flex; flex-direction: column; gap: 16px; }
  .big-img { position: relative; width: 100%; aspect-ratio: 3/2; border: 2px solid var(--ink); border-radius: var(--r); overflow: hidden; cursor: pointer; background: var(--bg); }
  .big-img img { width: 100%; height: 100%; object-fit: contain; }
  .actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .act { padding: 9px 16px; border: 2px solid var(--line); border-radius: var(--r); background: var(--surface); font: 600 12px var(--sans); color: var(--ink2); cursor: pointer; transition: all var(--t); }
  .act:hover { border-color: var(--ink); color: var(--ink); }
  .act.on { background: var(--warm-bg); border-color: var(--warm); color: var(--warm-dark); }
  .act-danger { color: #C44; }
  .act-danger:hover { border-color: #C44; color: #A22; background: #FEF0F0; }
  .detail-right { display: flex; flex-direction: column; gap: 20px; }
  .d-code { font: 700 24px var(--mono); letter-spacing: -0.5px; word-break: break-all; padding: 16px 20px; border: 2px solid var(--ink); border-radius: var(--r); }
  .links-box, .gallery-box { padding: 16px 20px; border: 2px solid var(--line); border-radius: var(--r); }
  .box-label { font: 700 10px var(--sans); text-transform: uppercase; letter-spacing: 1px; color: var(--ink3); display: block; margin-bottom: 12px; }
  .link-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .link-btn { padding: 10px 14px; border: 2px solid var(--line); border-radius: var(--r); background: var(--surface); font: 600 12px var(--sans); color: var(--ink); cursor: pointer; text-align: center; transition: all var(--t); }
  .link-btn:hover { border-color: var(--warm); color: var(--warm-dark); background: var(--warm-bg); }
  .nav-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border: 2px solid var(--line); border-radius: var(--r); }
  .nav-btn { width: 38px; height: 38px; border: 2px solid var(--line); border-radius: var(--r); background: var(--surface); font-size: 18px; font-weight: 700; cursor: pointer; color: var(--ink); transition: all var(--t); }
  .nav-btn:hover:not(:disabled) { background: var(--ink); color: var(--surface); }
  .nav-btn:disabled { opacity: .2; cursor: not-allowed; }
  .nav-pos { font: 700 16px var(--mono); }
  .nav-pos small { font-weight: 400; color: var(--ink3); }
  .gallery-top { display: flex; justify-content: space-between; align-items: center; }
  .btn-sm { padding: 5px 12px; border: 1.5px solid var(--line); border-radius: var(--r); background: var(--surface); font: 600 11px var(--sans); color: var(--ink2); cursor: pointer; transition: all var(--t); }
  .btn-sm:hover:not(:disabled) { border-color: var(--ink); color: var(--ink); }
  .btn-sm:disabled { opacity: .35; }
  .gallery { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 12px; }
  .thumb { position: relative; aspect-ratio: 3/2; border-radius: 4px; overflow: hidden; cursor: pointer; background: var(--bg); border: 1.5px solid var(--line); transition: all var(--t); }
  .thumb:hover { transform: scale(1.06); border-color: var(--warm); }
  .thumb img { width: 100%; height: 100%; object-fit: cover; }
  .t-n { position: absolute; bottom: 2px; right: 4px; font: 700 9px var(--mono); color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,.7); z-index: 2; }
  
  /* MODALS */
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; z-index: 300; padding: 20px; }
  .modal { width: 100%; max-width: 420px; background: var(--surface); border: 2px solid var(--ink); border-radius: var(--r); overflow: hidden; }
  .m-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 2px solid var(--ink); }
  .m-head h3 { font-size: 16px; font-weight: 700; }
  .m-x { width: 32px; height: 32px; border: none; background: none; font-size: 22px; cursor: pointer; color: var(--ink2); }
  .m-body { padding: 20px; }
  .m-sub { font: 500 13px var(--mono); color: var(--ink2); margin-bottom: 16px; }
  .m-foot { display: flex; gap: 8px; padding: 16px 20px; border-top: 2px solid var(--line); background: var(--bg); }
  .field { display: block; margin-bottom: 16px; }
  .field span { display: block; font: 600 11px var(--sans); text-transform: uppercase; letter-spacing: .5px; color: var(--ink2); margin-bottom: 6px; }
  .field input, .field select { width: 100%; padding: 10px 14px; border: 2px solid var(--line); border-radius: var(--r); font: 14px var(--sans); color: var(--ink); background: var(--bg); transition: border-color var(--t); }
  .field input:focus, .field select:focus { outline: none; border-color: var(--ink); }
  .hint { font-size: 11px; color: var(--ink3); margin-top: -8px; }
  .radios { display: flex; gap: 8px; }
  .radio { flex: 1; display: flex; align-items: center; gap: 8px; padding: 10px 14px; border: 2px solid var(--line); border-radius: var(--r); cursor: pointer; transition: border-color var(--t); }
  .radio:hover { border-color: var(--line2); }
  .radio input { width: 16px; height: 16px; cursor: pointer; accent-color: var(--warm); }
  .radio span { font: 500 13px var(--sans); }
  .btn-flat, .btn-fill { flex: 1; padding: 11px; border-radius: var(--r); font: 600 13px var(--sans); cursor: pointer; transition: all var(--t); border: 2px solid; }
  .btn-flat { background: var(--surface); color: var(--ink2); border-color: var(--line); }
  .btn-flat:hover { border-color: var(--ink); color: var(--ink); }
  .btn-fill { background: var(--ink); color: var(--surface); border-color: var(--ink); }
  .btn-fill:hover { background: #000; }
  
  /* LIGHTBOX */
  .lb { position: fixed; inset: 0; background: rgba(0,0,0,.95); display: flex; align-items: center; justify-content: center; z-index: 400; touch-action: pan-y pinch-zoom; }
  .lb-close { position: fixed; top: 16px; right: 16px; width: 44px; height: 44px; border-radius: 50%; border: 2px solid rgba(255,255,255,.2); background: rgba(255,255,255,.08); color: #fff; font-size: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background var(--t); }
  .lb-close:hover { background: rgba(255,255,255,.15); }
  .lb-main { max-width: 90%; max-height: 90%; }
  .lb-main img { max-width: 100%; max-height: 90vh; object-fit: contain; border-radius: var(--r); user-select: none; -webkit-user-drag: none; pointer-events: none; }
  .lb-arr { position: fixed; top: 50%; transform: translateY(-50%); width: 48px; height: 48px; border-radius: 50%; border: 2px solid rgba(255,255,255,.2); background: rgba(255,255,255,.08); color: #fff; font-size: 22px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background var(--t); }
  .lb-arr:hover:not(:disabled) { background: rgba(255,255,255,.15); }
  .lb-arr:disabled { opacity: .2; cursor: not-allowed; }
  .lb-arr.left { left: 20px; }
  .lb-arr.right { right: 20px; }
  .lb-count { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 8px 20px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); border-radius: 20px; color: #fff; font: 600 13px var(--mono); }
  
  /* TOAST */
  .toast { position: fixed; bottom: 28px; right: 28px; padding: 12px 20px; border-radius: var(--r); border: 2px solid; font: 600 13px var(--sans); z-index: 500; background: var(--surface); }
  .toast.success { border-color: var(--warm); color: var(--warm-dark); }
  .toast.error { border-color: #C44; color: #A33; }
  .toast.info { border-color: var(--ink); color: var(--ink); }
  
  /* EMPTY */
  .empty { padding: 80px 0; text-align: center; color: var(--ink3); font-size: 14px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
  
  /* TRANSITIONS */
  .fade-enter-active, .fade-leave-active { transition: opacity .2s; }
  .fade-enter, .fade-leave-to { opacity: 0; }
  .m-enter-active { transition: all .25s cubic-bezier(.4,0,.2,1); }
  .m-leave-active { transition: all .15s; }
  .m-enter { opacity: 0; transform: scale(.97); }
  .m-leave-to { opacity: 0; }
  .toast-enter-active, .toast-leave-active { transition: all .25s ease; }
  .toast-enter, .toast-leave-to { opacity: 0; transform: translateY(12px); }
  .drop-enter-active { transition: all .15s ease; }
  .drop-leave-active { transition: all .1s ease; }
  .drop-enter { opacity: 0; transform: translateY(-4px); }
  .drop-leave-to { opacity: 0; }
  /* View transitions */
  .slide-right-enter-active, .slide-right-leave-active, .slide-left-enter-active, .slide-left-leave-active { transition: opacity .2s ease, transform .2s ease; }
  .slide-right-enter { opacity: 0; transform: translateX(24px); }
  .slide-right-leave-to { opacity: 0; transform: translateX(-24px); }
  .slide-left-enter { opacity: 0; transform: translateX(-24px); }
  .slide-left-leave-to { opacity: 0; transform: translateX(24px); }
  
  /* RESPONSIVE */
  @media (max-width: 1200px) {
    .detail { grid-template-columns: 1fr; }
    .gallery { grid-template-columns: repeat(5, 1fr); }
  }
  @media (min-width: 769px) and (max-width: 1024px) {
    .search-box input { width: 130px; }
    .grid-artists { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
    .grid-works { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
  }
  @media (max-width: 768px) {
    .bar { padding: 0 14px; height: 50px; gap: 8px; }
    .stats { font-size: 12px; }
    .search-box input { width: 110px; font-size: 12px; }
    .page { padding: 66px 14px 36px; }
    .group-head { top: 50px; }
    .letter { font-size: 24px; }
    .grid-artists { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
    .grid-works { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
    .gallery { grid-template-columns: repeat(4, 1fr); }
    .link-grid { grid-template-columns: 1fr 1fr; }
    .alpha-rail { right: 2px; }
    .alpha-rail button { font-size: 8px; padding: 1px 3px; }
  }
  @media (max-width: 640px) {
    .stats { display: none; }
    .bar-title { max-width: 120px; }
    .search-box input { width: 90px; }
    .btn-filter { padding: 6px 8px; font-size: 10px; }
    .page { padding: 60px 12px 28px; }
    .group-head { top: 50px; }
    .letter { font-size: 22px; }
    .grid-artists { grid-template-columns: repeat(2, 1fr); gap: 10px; padding-right: 18px; }
    .grid-works { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .works-top { flex-direction: column; align-items: stretch; }
    .works-actions { justify-content: space-between; }
    .btn-add { flex: 1; text-align: center; }
    .actions { flex-direction: column; }
    .gallery { grid-template-columns: repeat(3, 1fr); }
    .link-grid { grid-template-columns: 1fr; }
    .toast { left: 12px; right: 12px; bottom: 12px; }
    .alpha-rail { display: none; }
  }
  </style>