<template>
  <div class="works-app">
    <!-- Enhanced Top Bar with better mobile support -->
    <header class="top-bar">
      <div class="top-left">
        <button v-if="currentView !== 'artists'" @click="goBack" class="back-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span class="back-text">Back</span>
        </button>
        <button v-else @click="resetToHome" class="logo-btn">
          <span class="logo-text">WORKS</span>
          <span class="logo-count">{{ artists.length }}/{{ totalCount }}</span>
        </button>
      </div>
      
      <div class="top-right">
        <!-- Search with icon -->
        <div class="search-wrapper">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input 
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            :placeholder="currentView === 'works' ? 'Filter works...' : 'Search artists...'"
            class="search-input"
            @input="handleSearch"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="search-clear">×</button>
        </div>
        
        <!-- Sort dropdown (artists view only) -->
        <select v-if="currentView === 'artists'" v-model="artistSortBy" class="sort-select">
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        
        <!-- Menu button for mobile -->
        <button @click="showMenu = !showMenu" class="menu-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="1"/>
            <circle cx="12" cy="5" r="1"/>
            <circle cx="12" cy="19" r="1"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- Menu Dropdown -->
    <transition name="menu-slide">
      <div v-if="showMenu" class="menu-dropdown">
        <button @click="exportData(); showMenu = false" class="menu-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          Export Data
        </button>
        
        <button @click="triggerImport(); showMenu = false" class="menu-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
          Import Data
        </button>
        
        <button @click="clearViewHistory(); showMenu = false" class="menu-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
          Clear History
        </button>
        
        <div class="menu-divider"></div>
        
        <button @click="hardRefresh(); showMenu = false" class="menu-item danger">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8M3 12l2.26 2.26A9.75 9.75 0 0012 21a9 9 0 009-9"/>
          </svg>
          Reset All Data
        </button>
      </div>
    </transition>

    <input ref="fileInput" type="file" accept=".json" hidden @change="importData" />

    <!-- ARTISTS VIEW - Enhanced grid -->
    <main v-if="currentView === 'artists'" class="content artists-view">
      <!-- Stats bar -->
      <div v-if="!searchQuery" class="stats-bar">
        <div class="stat-item">
          <span class="stat-value">{{ artists.length }}</span>
          <span class="stat-label">Artists</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ totalCount }}</span>
          <span class="stat-label">Works</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ viewedWorks.length }}</span>
          <span class="stat-label">Viewed</span>
        </div>
      </div>

      <div v-for="letter in alphabeticalGroups" :key="letter" class="artist-section">
        <div class="section-header">
          <h2 class="section-letter">{{ letter }}</h2>
          <span class="section-count">{{ groupedArtists[letter].length }}</span>
        </div>
        
        <div class="artist-grid">
          <div 
            v-for="artist in groupedArtists[letter]" 
            :key="artist.name"
            class="artist-card"
            :class="{ viewed: viewedArtists.includes(artist.name) }"
            @click="selectArtist(artist.name)"
          >
            <div class="card-image">
              <img 
                v-if="getProgressiveImage(artist).full"
                :src="getProgressiveImage(artist).full" 
                :alt="artist.name"
                loading="lazy"
              />
              <div v-else class="image-placeholder">
                {{ artist.name.charAt(0) }}
              </div>
              <div v-if="viewedArtists.includes(artist.name)" class="viewed-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </div>
            
            <div class="card-content">
              <h3 class="card-title">{{ artist.name }}</h3>
              <div class="card-meta">
                <span v-if="getArtistWorkCount(artist)" class="meta-badge">
                  {{ getArtistWorkCount(artist) }} works
                </span>
              </div>
            </div>
            
            <button @click.stop="openArtistPhotoModal(artist.name)" class="card-edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredArtists.length === 0" class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <p class="empty-title">No artists found</p>
        <p class="empty-text">Try adjusting your search</p>
      </div>
    </main>

    <!-- WORKS VIEW - Improved layout -->
    <main v-else-if="currentView === 'works'" class="content works-view">
      <div class="works-header">
        <div class="header-info">
          <h1 class="works-title">{{ currentArtist?.name }}</h1>
          <div class="works-stats">
            <span v-if="currentArtist?.mainWorks?.length" class="stat-chip main">
              {{ currentArtist.mainWorks.length }} Main
            </span>
            <span v-if="currentArtist?.compilations?.length" class="stat-chip comp">
              {{ currentArtist.compilations.length }} Compilations
            </span>
          </div>
        </div>
        <button @click="openAddWorkModal" class="add-work-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Add Work</span>
        </button>
      </div>

      <!-- Main Works Section -->
      <div v-if="filteredMainWorks.length" class="works-section">
        <div class="section-title">
          <h3>Main Works</h3>
          <span class="title-count">{{ filteredMainWorks.length }}</span>
        </div>
        
        <div class="works-grid">
          <div 
            v-for="work in filteredMainWorks"
            :key="work.code"
            class="work-card"
            :class="{ viewed: viewedWorks.includes(work.code) }"
            @click="openWorkView(work)"
          >
            <div class="work-image">
              <img 
                :src="getProgressiveWorkImage(work).full"
                :alt="work.code"
                loading="lazy"
              />
              <div v-if="isCoverWork(currentArtist.name, work.code)" class="cover-star">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <div v-if="viewedWorks.includes(work.code)" class="viewed-overlay">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </div>
            <div class="work-code">{{ work.code }}</div>
          </div>
        </div>
      </div>

      <!-- Compilations Section -->
      <div v-if="filteredCompilations.length" class="works-section">
        <div class="section-title">
          <h3>Compilations</h3>
          <span class="title-count">{{ filteredCompilations.length }}</span>
        </div>
        
        <div class="works-grid">
          <div 
            v-for="work in filteredCompilations"
            :key="work.code"
            class="work-card"
            :class="{ viewed: viewedWorks.includes(work.code) }"
            @click="openWorkView(work)"
          >
            <div class="work-image">
              <img 
                :src="getProgressiveWorkImage(work).full"
                :alt="work.code"
                loading="lazy"
              />
              <div v-if="isCoverWork(currentArtist.name, work.code)" class="cover-star">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <div v-if="viewedWorks.includes(work.code)" class="viewed-overlay">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </div>
            <div class="work-code">{{ work.code }}</div>
          </div>
        </div>
      </div>

      <div v-if="filteredMainWorks.length === 0 && filteredCompilations.length === 0" class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
        </svg>
        <p class="empty-title">No works found</p>
        <p class="empty-text">{{ workSearchQuery ? 'Try adjusting your search' : 'Add your first work' }}</p>
      </div>
    </main>

    <!-- DETAIL VIEW - Enhanced single work view -->
    <main v-else-if="currentView === 'detail'" class="content detail-view">
      <div class="detail-container">
        <!-- Main Image Section -->
        <div class="detail-main">
          <div class="main-image" @click="openLightbox(currentWork, 0)">
            <img 
              :src="getProgressiveWorkImage(currentWork).full"
              :alt="currentWork.code"
            />
            <div class="image-overlay">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 3 21 3 21 9"/>
                <polyline points="9 21 3 21 3 15"/>
                <line x1="21" y1="3" x2="14" y2="10"/>
                <line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="quick-actions">
            <button 
              @click="setCoverWork(currentArtist.name, currentWork.code)"
              class="action-chip"
              :class="{ active: isCoverWork(currentArtist.name, currentWork.code) }"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              {{ isCoverWork(currentArtist.name, currentWork.code) ? 'Cover' : 'Set Cover' }}
            </button>
            
            <button @click="openUploadModal(currentWork.code)" class="action-chip">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              {{ hasCustomImage(currentWork.code) ? 'Update' : 'Add Image' }}
            </button>

            <button @click="copyToClipboard(currentWork.code)" class="action-chip">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              Copy Code
            </button>
          </div>
        </div>

        <!-- Info Sidebar -->
        <div class="detail-sidebar">
          <div class="detail-code">
            <h1>{{ currentWork.code }}</h1>
          </div>

          <!-- External Links -->
          <div class="external-links">
            <h4>Watch On</h4>
            <div class="link-group">
              <button @click="openExternalLink(currentWork.code, 'njav')" class="link-btn njav">
                NJAV
              </button>
              <button @click="openExternalLink(currentWork.code, 'missav')" class="link-btn missav">
                MissAV
              </button>
              <button @click="openExternalLink(currentWork.code, '24av')" class="link-btn av24">
                24AV
              </button>
            </div>
          </div>

          <!-- Navigation -->
          <div v-if="currentWorkList.length > 1" class="detail-nav">
            <button 
              @click="navigateWork(-1)" 
              :disabled="!canNavigateWork(-1)"
              class="nav-arrow"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            
            <div class="nav-info">
              <span class="nav-current">{{ currentWorkIndex + 1 }}</span>
              <span class="nav-separator">/</span>
              <span class="nav-total">{{ currentWorkList.length }}</span>
            </div>
            
            <button 
              @click="navigateWork(1)" 
              :disabled="!canNavigateWork(1)"
              class="nav-arrow"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          <!-- Gallery Preview -->
          <div class="gallery-section">
            <div class="gallery-header">
              <h4>Gallery</h4>
              <button @click="preloadAllGallery" class="preload-btn" :disabled="isPreloading">
                {{ isPreloading ? 'Loading...' : 'Load All' }}
              </button>
            </div>
            
            <div class="gallery-grid">
              <div 
                v-for="i in 20" 
                :key="i"
                class="gallery-thumb"
                @click="openLightbox(currentWork, i)"
              >
                <img 
                  :src="getImageUrl(currentWork.code, `jp-${i}`)"
                  :alt="`${currentWork.code} ${i}`"
                  loading="lazy"
                />
                <span class="thumb-label">{{ i }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- MODALS - Improved design -->
    <transition name="modal">
      <div v-if="showAddWorkModal" class="modal-overlay" @click.self="closeAddWorkModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Add New Work</h3>
            <button @click="closeAddWorkModal" class="modal-close">×</button>
          </div>
          
          <div class="modal-body">
            <div class="form-group">
              <label>Artist</label>
              <select v-model="newWork.artist" class="form-control">
                <option value="">Select artist...</option>
                <option v-for="a in artists" :key="a.name" :value="a.name">{{ a.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Work Code</label>
              <input v-model="newWork.code" placeholder="e.g. ABC-123" class="form-control" />
            </div>

            <div class="form-group">
              <label>Type</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input v-model="newWork.type" type="radio" value="mainWorks" />
                  <span>Main Work</span>
                </label>
                <label class="radio-label">
                  <input v-model="newWork.type" type="radio" value="compilations" />
                  <span>Compilation</span>
                </label>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="closeAddWorkModal" class="btn-secondary">Cancel</button>
            <button @click="addNewWork" class="btn-primary">Add Work</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="modal">
      <div v-if="showUploadModal" class="modal-overlay" @click.self="closeUploadModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Custom Image</h3>
            <button @click="closeUploadModal" class="modal-close">×</button>
          </div>
          
          <div class="modal-body">
            <p class="modal-subtitle">{{ uploadingWork }}</p>
            
            <div class="form-group">
              <label>Image URL</label>
              <input 
                v-model="customImageUrl" 
                placeholder="https://example.com/image.jpg"
                class="form-control"
                @keyup.enter="handleCustomImageUrl"
              />
              <p class="form-hint">Leave empty to remove custom image</p>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="closeUploadModal" class="btn-secondary">Cancel</button>
            <button @click="handleCustomImageUrl" class="btn-primary">
              {{ customImageUrl.trim() ? 'Save' : 'Remove' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="modal">
      <div v-if="showArtistPhotoModal" class="modal-overlay" @click.self="closeArtistPhotoModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Artist Photo</h3>
            <button @click="closeArtistPhotoModal" class="modal-close">×</button>
          </div>
          
          <div class="modal-body">
            <p class="modal-subtitle">{{ editingArtistName }}</p>
            
            <div class="form-group">
              <label>Photo URL</label>
              <input 
                v-model="artistPhotoUrl" 
                placeholder="https://example.com/photo.jpg"
                class="form-control"
                @keyup.enter="updateArtistPhoto"
              />
              <p class="form-hint">Leave empty to remove photo</p>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="closeArtistPhotoModal" class="btn-secondary">Cancel</button>
            <button @click="updateArtistPhoto" class="btn-primary">
              {{ artistPhotoUrl.trim() ? 'Save' : 'Remove' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- LIGHTBOX - Enhanced viewer -->
    <transition name="fade">
      <div v-if="lightbox.show" class="lightbox" @click.self="closeLightbox">
        <button class="lightbox-close" @click="closeLightbox">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        
        <button 
          v-if="lightbox.images.length > 1"
          class="lightbox-arrow prev"
          @click="prevImage"
          :disabled="lightbox.currentIndex === 0"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        
        <div class="lightbox-content">
          <img :src="lightbox.images[lightbox.currentIndex]" :alt="lightbox.code" />
        </div>
        
        <button 
          v-if="lightbox.images.length > 1"
          class="lightbox-arrow next"
          @click="nextImage"
          :disabled="lightbox.currentIndex === lightbox.images.length - 1"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
        
        <div class="lightbox-counter">
          {{ lightbox.currentIndex + 1 }} / {{ lightbox.images.length }}
        </div>
      </div>
    </transition>

    <!-- TOAST - Refined notifications -->
    <transition name="toast">
      <div v-if="toast.show" class="toast" :class="`toast-${toast.type}`">
        <svg v-if="toast.type === 'success'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <svg v-else-if="toast.type === 'error'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ toast.message }}</span>
      </div>
    </transition>

    <!-- Click outside to close menu -->
    <div v-if="showMenu" class="menu-backdrop" @click="showMenu = false"></div>
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
  name: 'WorksImproved',
  data() {
    return {
      currentView: 'artists',
      activeTab: '',
      searchQuery: '',
      workSearchQuery: '',
      artistSortBy: 'nameAsc',
      showMenu: false,
      
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
      if (!this.searchQuery.trim()) return this.currentArtist.mainWorks
      const query = this.searchQuery.toLowerCase()
      return this.currentArtist.mainWorks.filter(work =>
        work.code.toLowerCase().includes(query)
      )
    },
    filteredCompilations() {
      if (!this.currentArtist?.compilations) return []
      if (!this.searchQuery.trim()) return this.currentArtist.compilations
      const query = this.searchQuery.toLowerCase()
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
    },
    currentView(newView) {
      if (newView === 'works') {
        this.$nextTick(() => {
          this.workSearchQuery = ''
        })
      }
    },
    showMenu(val) {
      if (process.client) {
        document.body.style.overflow = val ? 'hidden' : ''
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
  beforeDestroy() {
    if (process.client) {
      document.body.style.overflow = ''
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
          else if (this.showMenu) this.showMenu = false
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
      // Reactive search handled by computed properties
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
      this.saveScrollPosition('artists')
      
      if (!this.viewedArtists.includes(name)) {
        this.viewedArtists.push(name)
      }

      this.currentArtistList = this.filteredArtists
      this.currentArtistIndex = this.currentArtistList.findIndex(a => a.name === name)

      this.activeTab = name
      this.currentView = 'works'
      this.workSearchQuery = ''
      this.searchQuery = ''

      this.$nextTick(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
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
        
        if (!this.viewedWorks.includes(this.currentWork.code)) {
          this.viewedWorks.push(this.currentWork.code)
        }
        
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
      
      const viewer = document.querySelector('.lightbox')
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
      
      const viewer = document.querySelector('.lightbox')
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
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0) {
            this.prevImage()
          } else {
            this.nextImage()
          }
        }
      }
    },

    nextImage() {
      if (this.lightbox.currentIndex < this.lightbox.images.length - 1) {
        this.lightbox.currentIndex++
      }
    },

    prevImage() {
      if (this.lightbox.currentIndex > 0) {
        this.lightbox.currentIndex--
      }
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
      setTimeout(() => this.toast.show = false, 3000)
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

        let exportString = 'export const DEFAULT_ARTISTS = [\n'
        
        transformedArtists.forEach((artist, index) => {
          exportString += '  {\n'
          exportString += `    name: '${artist.name}',\n`
          exportString += `    cover: '${artist.cover}',\n`
          exportString += `    url: '${artist.url}',\n`
          
          if (artist.compilations.length > 0) {
            exportString += `    compilations: [${artist.compilations.map(c => `'${c}'`).join(', ')}],\n`
          } else {
            exportString += `    compilations: [],\n`
          }
          
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --bg-primary: #fef7ff;
  --bg-secondary: #ffffff;
  --bg-tertiary: #fef3ff;
  --bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --bg-gradient-alt: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --bg-gradient-soft: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --text-tertiary: #999999;
  
  --accent-primary: #8b5cf6;
  --accent-hover: #7c3aed;
  --accent-light: #f5f3ff;
  --accent-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  
  --secondary-accent: #ec4899;
  --secondary-hover: #db2777;
  --secondary-light: #fdf2f8;
  
  --tertiary-accent: #14b8a6;
  --tertiary-hover: #0d9488;
  --tertiary-light: #f0fdfa;
  
  --border-light: #e9d5ff;
  --border-medium: #d8b4fe;
  --border-dark: #c084fc;
  
  --success: #10b981;
  --error: #ef4444;
  --warning: #f59e0b;
  
  --shadow-sm: 0 1px 2px 0 rgb(139 92 246 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(139 92 246 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(139 92 246 / 0.15);
  --shadow-xl: 0 20px 25px -5px rgb(139 92 246 / 0.2);
  --shadow-glow: 0 0 20px rgb(139 92 246 / 0.3);
  
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  
  --transition: 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.works-app {
  min-height: 100vh;
  padding-bottom: 40px;
}

/* ===== TOP BAR ===== */
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 100;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: var(--shadow-sm);
}

.top-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  transition: all var(--transition);
}

.back-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-medium);
}

.back-text {
  font-weight: 500;
}

.logo-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 0;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.5px;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-count {
  font-size: 13px;
  color: var(--text-tertiary);
  font-weight: 500;
}

.top-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-input {
  width: 280px;
  padding: 10px 36px 10px 36px;
  background: var(--bg-tertiary);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-primary);
  font-family: inherit;
  transition: all var(--transition);
}

.search-input:focus {
  outline: none;
  background: var(--bg-secondary);
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.search-clear {
  position: absolute;
  right: 8px;
  width: 24px;
  height: 24px;
  background: var(--border-medium);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
}

.search-clear:hover {
  background: var(--border-dark);
  color: var(--text-primary);
}

.sort-select {
  padding: 10px 36px 10px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-primary);
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23666666' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  transition: all var(--transition);
}

.sort-select:hover {
  border-color: var(--border-medium);
  background-color: var(--bg-tertiary);
}

.sort-select:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.menu-btn {
  width: 40px;
  height: 40px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
  color: var(--text-secondary);
}

.menu-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-medium);
  color: var(--text-primary);
}

/* ===== MENU DROPDOWN ===== */
.menu-dropdown {
  position: fixed;
  top: 72px;
  right: 24px;
  width: 240px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 200;
  overflow: hidden;
}

.menu-item {
  width: 100%;
  padding: 14px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all var(--transition);
  text-align: left;
  font-family: inherit;
}

.menu-item:hover {
  background: var(--bg-tertiary);
}

.menu-item.danger {
  color: var(--error);
}

.menu-item.danger:hover {
  background: #fef2f2;
}

.menu-divider {
  height: 1px;
  background: var(--border-light);
  margin: 4px 0;
}

.menu-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 150;
}

/* ===== CONTENT ===== */
.content {
  padding: 88px 24px 40px;
}

/* ===== STATS BAR ===== */
.stats-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  padding: 20px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  border-radius: var(--radius-md);
  position: relative;
  overflow: hidden;
}

.stat-item:nth-child(1) {
  background: linear-gradient(135deg, #667eea20 0%, #764ba240 100%);
  border: 2px solid #667eea40;
}

.stat-item:nth-child(2) {
  background: linear-gradient(135deg, #f093fb20 0%, #f5576c40 100%);
  border: 2px solid #f093fb40;
}

.stat-item:nth-child(3) {
  background: linear-gradient(135deg, #a8edea20 0%, #fed6e340 100%);
  border: 2px solid #a8edea40;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: var(--text-tertiary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ===== ARTIST SECTION ===== */
.artist-section {
  margin-bottom: 48px;
}

.section-header {
  position: sticky;
  top: 64px;
  z-index: 50;
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 16px 0;
  margin-bottom: 20px;
  background: var(--bg-primary);
  border-bottom: 2px solid var(--border-light);
}

.section-letter {
  font-size: 36px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -1px;
}

.section-count {
  font-size: 16px;
  color: var(--text-tertiary);
  font-weight: 600;
}

/* ===== ARTIST GRID ===== */
.artist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.artist-card {
  position: relative;
  background: var(--bg-secondary);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition);
}

.artist-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lg), var(--shadow-glow);
  border-color: var(--accent-primary);
}

.artist-card.viewed {
  opacity: 0.5;
}

.artist-card.viewed:hover {
  opacity: 0.7;
}

.card-image {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  background: var(--bg-tertiary);
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition);
}

.artist-card:hover .card-image img {
  transform: scale(1.05);
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64px;
  font-weight: 700;
  color: var(--accent-primary);
  background: linear-gradient(135deg, #f5f3ff 0%, #fdf4ff 100%);
}

.viewed-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.card-content {
  padding: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  line-height: 1.3;
}

.card-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-badge {
  padding: 4px 10px;
  background: linear-gradient(135deg, var(--accent-light) 0%, var(--secondary-light) 100%);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-primary);
}

.card-edit {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all var(--transition);
  color: var(--text-secondary);
}

.artist-card:hover .card-edit {
  opacity: 1;
}

.card-edit:hover {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: white;
  box-shadow: var(--shadow-md);
}

/* ===== WORKS VIEW ===== */
.works-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  gap: 20px;
}

.header-info {
  flex: 1;
}

.works-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 12px;
  letter-spacing: -0.5px;
  color: var(--text-primary);
}

.works-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.stat-chip {
  padding: 6px 14px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3px;
  border: 2px solid;
}

.stat-chip.main {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #2563eb;
  border-color: #93c5fd;
}

.stat-chip.comp {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #d97706;
  border-color: #fcd34d;
}

.add-work-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--accent-gradient);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: white;
  font-family: inherit;
  transition: all var(--transition);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.add-work-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
}

/* ===== WORKS SECTION ===== */
.works-section {
  margin-bottom: 48px;
}

.section-title {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--border-light);
}

.section-title h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.title-count {
  font-size: 14px;
  color: var(--text-tertiary);
  font-weight: 600;
}

/* ===== WORKS GRID ===== */
.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.work-card {
  position: relative;
  cursor: pointer;
  transition: all var(--transition);
}

.work-card:hover {
  transform: translateY(-4px);
}

.work-card.viewed {
  opacity: 0.4;
}

.work-card.viewed:hover {
  opacity: 0.6;
}

.work-image {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  background: var(--bg-secondary);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 8px;
  transition: all var(--transition);
}

.work-card:hover .work-image {
  border-color: var(--accent-primary);
  box-shadow: 0 8px 16px rgba(139, 92, 246, 0.2);
}

.work-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition);
}

.work-card:hover .work-image img {
  transform: scale(1.05);
}

.cover-star {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.5);
}

.viewed-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.work-code {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
  letter-spacing: 0.3px;
}

/* ===== DETAIL VIEW ===== */
.detail-container {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 32px;
}

.detail-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.main-image {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition);
}

.main-image:hover {
  box-shadow: var(--shadow-lg);
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.image-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 64px;
  height: 64px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all var(--transition);
  color: white;
}

.main-image:hover .image-overlay {
  opacity: 1;
}

.quick-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  font-family: inherit;
  transition: all var(--transition);
}

.action-chip:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-medium);
  color: var(--text-primary);
}

.action-chip.active {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #fbbf24;
  color: #d97706;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
}

/* ===== DETAIL SIDEBAR ===== */
.detail-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-code {
  padding: 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
}

.detail-code h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
  letter-spacing: -0.5px;
  word-break: break-all;
}

.external-links {
  padding: 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
}

.external-links h4 {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-tertiary);
  margin-bottom: 12px;
}

.link-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.link-btn {
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: inherit;
  transition: all var(--transition);
  text-align: left;
}

.link-btn:hover {
  transform: translateX(4px);
  box-shadow: var(--shadow-md);
}

.link-btn.njav:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: white;
}

.link-btn.missav:hover {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-color: #f093fb;
  color: white;
}

.link-btn.av24:hover {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  border-color: #a8edea;
  color: white;
}

.detail-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
}

.nav-arrow {
  width: 44px;
  height: 44px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  transition: all var(--transition);
}

.nav-arrow:hover:not(:disabled) {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: white;
}

.nav-arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-info {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
}

.nav-current {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.nav-separator {
  font-size: 16px;
  color: var(--text-tertiary);
}

.nav-total {
  font-size: 16px;
  color: var(--text-secondary);
}

/* ===== GALLERY SECTION ===== */
.gallery-section {
  padding: 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.gallery-header h4 {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-tertiary);
}

.preload-btn {
  padding: 6px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  font-family: inherit;
  transition: all var(--transition);
}

.preload-btn:hover:not(:disabled) {
  background: var(--accent-light);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.preload-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.gallery-thumb {
  position: relative;
  aspect-ratio: 3 / 2;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition);
}

.gallery-thumb:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

.gallery-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-label {
  position: absolute;
  bottom: 4px;
  right: 4px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  color: white;
  font-size: 10px;
  font-weight: 700;
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
}

/* ===== MODALS ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 20px;
}

.modal-card {
  width: 100%;
  max-width: 480px;
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--border-light);
}

.modal-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.modal-close {
  width: 36px;
  height: 36px;
  background: var(--bg-tertiary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  color: var(--text-secondary);
  transition: all var(--transition);
}

.modal-close:hover {
  background: var(--border-medium);
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
}

.modal-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 20px;
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-control {
  width: 100%;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-primary);
  font-family: inherit;
  transition: all var(--transition);
}

.form-control:focus {
  outline: none;
  background: var(--bg-secondary);
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.form-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 6px;
}

.radio-group {
  display: flex;
  gap: 12px;
}

.radio-label {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: var(--bg-tertiary);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition);
}

.radio-label:hover {
  background: var(--bg-secondary);
  border-color: var(--border-medium);
}

.radio-label input[type="radio"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.radio-label span {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  background: var(--bg-tertiary);
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 14px 20px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  transition: all var(--transition);
  border: none;
}

.btn-primary {
  background: var(--accent-gradient);
  color: white;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-light);
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-medium);
  color: var(--text-primary);
}

/* ===== LIGHTBOX ===== */
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
  z-index: 400;
  touch-action: pan-y pinch-zoom;
}

.lightbox-close {
  position: fixed;
  top: 24px;
  right: 24px;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.lightbox-content {
  max-width: 90%;
  max-height: 90%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-content img {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: var(--radius-lg);
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}

.lightbox-arrow {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
}

.lightbox-arrow:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-50%) scale(1.1);
}

.lightbox-arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.lightbox-arrow.prev {
  left: 24px;
}

.lightbox-arrow.next {
  right: 24px;
}

.lightbox-counter {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-lg);
  color: white;
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  font-weight: 600;
}

/* ===== TOAST ===== */
.toast {
  position: fixed;
  bottom: 32px;
  right: 32px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  z-index: 500;
}

.toast-success {
  border-color: var(--success);
  color: var(--success);
}

.toast-error {
  border-color: var(--error);
  color: var(--error);
}

.toast-info {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

/* ===== EMPTY STATE ===== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--text-tertiary);
}

.empty-state svg {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.empty-text {
  font-size: 14px;
  color: var(--text-tertiary);
}

/* ===== TRANSITIONS ===== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.modal-enter-active {
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-leave-active {
  transition: all 200ms cubic-bezier(0.4, 0, 1, 1);
}

.modal-enter {
  opacity: 0;
  transform: scale(0.95);
}

.modal-leave-to {
  opacity: 0;
}

.menu-slide-enter-active,
.menu-slide-leave-active {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-slide-enter,
.menu-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter,
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1200px) {
  .detail-container {
    grid-template-columns: 1fr;
  }
  
  .gallery-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (max-width: 768px) {
  .top-bar {
    padding: 0 16px;
    height: 56px;
  }
  
  .search-input {
    width: 200px;
    font-size: 13px;
    padding: 8px 32px 8px 32px;
  }
  
  .sort-select {
    font-size: 13px;
    padding: 8px 28px 8px 10px;
  }
  
  .content {
    padding: 72px 16px 32px;
  }
  
  .stats-bar {
    padding: 16px;
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .artist-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
  
  .works-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
  }
  
  .works-title {
    font-size: 24px;
  }
  
  .gallery-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .lightbox-arrow {
    width: 48px;
    height: 48px;
  }
  
  .lightbox-arrow.prev {
    left: 16px;
  }
  
  .lightbox-arrow.next {
    right: 16px;
  }
}

@media (max-width: 640px) {
  .top-bar {
    padding: 0 12px;
  }
  
  .back-text {
    display: none;
  }
  
  .search-input {
    width: 160px;
  }
  
  .sort-select {
    display: none;
  }
  
  .content {
    padding: 68px 12px 24px;
  }
  
  .artist-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .works-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .works-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .add-work-btn {
    width: 100%;
    justify-content: center;
  }
  
  .quick-actions {
    flex-direction: column;
  }
  
  .action-chip {
    justify-content: center;
  }
  
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .modal-card {
    max-width: 100%;
  }
  
  .toast {
    left: 12px;
    right: 12px;
    bottom: 12px;
  }
  
  .lightbox-close {
    top: 16px;
    right: 16px;
    width: 40px;
    height: 40px;
  }
  
  .lightbox-arrow {
    width: 40px;
    height: 40px;
  }
  
  .lightbox-arrow.prev {
    left: 12px;
  }
  
  .lightbox-arrow.next {
    right: 12px;
  }
}
</style>