<template>
  <div>
    <div class="container" :class="{ 'dark-mode': darkMode }">
      <header>
        <div>
          <h1>🎬 Works Tracker</h1>
          <p>{{ totalCount }} total works</p>
        </div>
        <div class="search-box">
          <input v-model="globalSearch" type="text" placeholder="🔍 Search all works..." class="global-search" />
          <span v-if="globalSearch" class="search-results">{{ searchResults.length }} found</span>
        </div>

        <div class="btns">
          <button @click="autoFillImages" title="Auto-fetch posters">🖼️</button>
          <button @click="handleExport" class="btn-icon" title="Export JSON">📥</button>
          <button @click="handleImportClick" class="btn-icon" title="Import">📤</button>
          <button @click="toggleDarkMode" class="btn-icon" title="Toggle dark mode">{{ darkMode ? '☀️' : '🌙'
            }}</button>
          <button @click="resetToDefaults" class="btn-icon" title="Reset to default data">🔄</button>
          <select v-model="imageSource" class="header-select" title="Default Image Source">
            <option value="dmm">DMM (Default)</option>
            <option value="mgstage">MgStage</option>
            <option value="fourhoi">Fourhoi</option>
            <option value="pornfhd">PornFHD</option>
          </select>

          <button @click="openAddArtistModal" title="Add new artist">➕ Artist</button>
          <input ref="fileInput" type="file" accept=".json" @change="handleImport" hidden />
        </div>
      </header>

      <div v-if="globalSearch && searchResults.length" class="search-results-container">
        <div v-for="result in searchResults" :key="`${result.artistName}-${result.work.code}`"
          class="search-result-item">
          <strong>{{ result.artistName }}</strong> - {{ result.work.code }}
          <button @click="activeTab = result.artistName" class="goto-btn">View →</button>
        </div>
      </div>

      <div class="artist-grid">
        <button v-for="artist in sortedArtistsByWorkCount" :key="artist.name"
          :class="['artist-card-modern', { active: activeTab === artist.name }]" @click="activeTab = artist.name">

          <div class="artist-photo-container">
            <div class="artist-photo-modern">
              <img v-if="getRandomArtistWork(artist)"
                :src="getImageUrl(getRandomArtistWork(artist).code, 'pl', getRandomArtistWork(artist).imageSource)"
                :alt="artist.name"
                @error="(e) => handleImageErrorWithFallback(e, getRandomArtistWork(artist).code, 'pl', getRandomArtistWork(artist).imageSource)"
                @load="handleImageLoad" class="artist-image-modern" />
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
            <div v-if="artist.studio" class="studio-badge-modern">
              {{ artist.studio }}
            </div>
          </div>
        </button>
      </div>

      <div v-if="currentArtist" class="artist-content">
        <div class="artist-header">
          <div class="artist-info">
            <div v-if="currentArtist.photo" class="artist-photo-large">
              <img :src="currentArtist.photo" :alt="currentArtist.name" />
            </div>
            <div>
              <h2>{{ currentArtist.name }}</h2>
              <p>{{ (currentArtist.mainWorks?.length || 0) + (currentArtist.compilations?.length || 0) }} works</p>
              <p v-if="currentArtist.studio" class="studio-info">📦 Studio: {{ currentArtist.studio }}</p>
            </div>
          </div>
          <div class="header-actions">
            <select v-model="sortBy" class="sort-select" title="Sort works">
              <option value="code">Code (A-Z)</option>
              <option value="code-desc">Code (Z-A)</option>
              <option value="date">Release Date</option>
              <option value="added">Recently Added</option>
            </select>
            <button @click="openAddWorkModal" class="add-work-btn" title="Add new work">➕</button>
          </div>
        </div>

        <div v-if="filteredCurrentMainWorks.length">
          <h3>📌 Main Works</h3>
          <div class="works-grid-compact">
            <div v-for="work in sortedFilteredMainWorks" :key="work.code" class="work-thumbnail"
              @click="openWorkModal(work)">
              <img :src="getImageUrl(work.code, 'pl', work.imageSource)" :alt="work.code"
                @error="(e) => handleImageErrorWithFallback(e, work.code, 'pl', work.imageSource)"
                @load="handleImageLoad" />
              <div class="work-thumbnail-overlay">
                <span class="work-code-compact">{{ work.code }}</span>
                <span v-if="work.releaseDate" class="work-date-compact">
                  {{ formatDate(work.releaseDate) }}
                </span>
              </div>
              <span v-if="hasSimilarCode(work.code)" class="typo-warning-compact">⚠️</span>
            </div>
          </div>
        </div>

        <div v-if="filteredCurrentCompilations.length">
          <h3>📂 Compilations</h3>
          <div class="works-grid-compact">
            <div v-for="work in sortedFilteredCompilations" :key="work.code" class="work-thumbnail"
              @click="openWorkModal(work)">
              <img :src="getImageUrl(work.code, 'pl', work.imageSource)" :alt="work.code"
                @error="(e) => handleImageErrorWithFallback(e, work.code, 'pl', work.imageSource)"
                @load="handleImageLoad" />
              <div class="work-thumbnail-overlay">
                <span class="work-code-compact">{{ work.code }}</span>
                <span v-if="work.releaseDate" class="work-date-compact">
                  {{ formatDate(work.releaseDate) }}
                </span>
              </div>
              <span v-if="hasSimilarCode(work.code)" class="typo-warning-compact">⚠️</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Work Detail Modal -->
    <div v-if="showWorkModal" class="work-modal" @click.self="closeWorkModal" style="z-index: 8000;">
      <div class="work-modal-content" style="z-index: 8001; position: relative;">
        <button class="work-modal-close" @click="closeWorkModal" style="z-index: 8003;">✕</button>
        <button class="work-modal-nav work-modal-prev" @click="navigateWork(-1)" v-if="canNavigateWork(-1)"
          style="z-index: 8003; position: absolute;">‹</button>
        <button class="work-modal-nav work-modal-next" @click="navigateWork(1)" v-if="canNavigateWork(1)"
          style="z-index: 8003; position: absolute;">›</button>

        <div class="work-modal-body">
          <!-- Left Column: Cover + Info + Actions -->
          <div class="work-modal-left">
            <div class="work-modal-cover">
              <img :src="getImageUrl(currentWork.code, 'pl', currentWork.imageSource)" :alt="currentWork.code"
                @click="openLightbox(currentWork, 0)"
                @error="(e) => handleImageErrorWithFallback(e, currentWork.code, 'pl', currentWork.imageSource)"
                @load="handleImageLoad" />
              <div class="cover-click-hint">Click to view full size</div>
              <div v-if="hasCustomImage(currentWork.code)" class="image-source-badge" style="background: #4CAF50;">
                Custom Upload ✓
              </div>
              <div v-else-if="getWorkImageSource(currentWork.code)" class="image-source-badge">
                Source: {{ getWorkImageSource(currentWork.code).toUpperCase() }}
              </div>
            </div>

            <div class="work-modal-sidebar">
              <h2 class="work-modal-title" @click="copyToClipboard(currentWork.code)">
                {{ currentWork.code }}
                <span v-if="hasSimilarCode(currentWork.code)" class="typo-warning">⚠️</span>
              </h2>

              <div v-if="currentWork.releaseDate" class="release-date-info">
                📅 {{ formatDate(currentWork.releaseDate) }}
              </div>

              <div class="image-source-selector">
                <label>Preferred Image Source</label>
                <select :value="currentWork.imageSource || 'dmm'" @change="setWorkImageSource(currentWork, $event)"
                  class="source-select">
                  <option value="dmm">DMM</option>
                  <option value="mgstage">MgStage</option>
                  <option value="fourhoi">Fourhoi</option>
                  <option value="pornfhd">PornFHD</option>
                </select>
                <small>Auto-fallback enabled</small>
              </div>

              <div class="action-buttons">
                <button @click="openEditWorkModal(currentWork)" class="action-btn-sidebar edit">
                  ✏️ Edit
                </button>
                <button @click="openMoveWorkModal(currentWork)" class="action-btn-sidebar move">
                  ➡️ Move
                </button>
                <button v-if="!hasCustomImage(currentWork.code)" @click="openUploadModal(currentWork.code)"
                  class="action-btn-sidebar upload">
                  📤 Upload Image
                </button>
                <button v-if="hasCustomImage(currentWork.code)" @click="removeCustomImage(currentWork.code)"
                  class="action-btn-sidebar remove">
                  🗑️ Remove Custom
                </button>
              </div>

              <div class="external-links-sidebar">
                <button @click="openExternalLink(currentWork.code, 'njav')" class="ext-btn njav">
                  NJAV
                </button>
                <button @click="openExternalLink(currentWork.code, 'missav')" class="ext-btn missav">
                  Missav
                </button>
              </div>
            </div>
          </div>

          <!-- Right Column: Preview Gallery -->
          <div class="work-modal-right">
            <h3 class="gallery-title">Preview Gallery</h3>
            <div class="modal-gallery-grid">
              <div v-for="i in 20" :key="i" class="modal-gallery-item" @click="openLightbox(currentWork, i)">
                <img :src="getImageUrl(currentWork.code, `jp-${i}`, currentWork.imageSource)"
                  @error="(e) => handleGalleryImageError(e, currentWork.code, i, currentWork.imageSource)"
                  :alt="`Preview ${i}`" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Move Work Modal -->
    <div v-if="showMoveWorkModal" class="modal" @click.self="closeMoveWorkModal" style="z-index: 9000;">
      <div class="modal-box" style="z-index: 9001;">
        <h3>Move Work to Another Artist</h3>
        <label>
          Select Artist
          <select v-model="moveWorkData.targetArtist" class="artist-select">
            <option value="">Choose artist...</option>
            <option v-for="a in sortedArtistsForMove" :key="a.name" :value="a.name">
              {{ a.name }} ({{ (a.mainWorks?.length || 0) + (a.compilations?.length || 0) }} works)
            </option>
          </select>
        </label>
        <div class="modal-btns">
          <button @click="executeMoveWork" class="btn" :disabled="!moveWorkData.targetArtist">Move</button>
          <button @click="closeMoveWorkModal" class="btn" style="background: #666">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Edit Work Modal -->
    <div v-if="showEditWorkModal" class="modal" @click.self="closeEditWorkModal" style="z-index: 9000;">
      <div class="modal-box" style="z-index: 9001;">
        <h3>Edit Work Code</h3>
        <label>
          Code
          <input v-model="editingWork.newCode" type="text" placeholder="e.g., SONE-978" />
        </label>
        <label>
          Release Date (optional)
          <input v-model="editingWork.releaseDate" type="date" />
        </label>
        <div class="modal-btns">
          <button @click="saveEditWork" class="btn">Save</button>
          <button @click="closeEditWorkModal" class="btn" style="background: #666">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Add Work Modal -->
    <div v-if="showAddWorkModal" class="modal" @click.self="closeAddWorkModal" style="z-index: 9000;">
      <div class="modal-box" style="z-index: 9001;">
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
          Release Date (optional)
          <input v-model="newWork.releaseDate" type="date" />
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
          <button @click="addNewWork" class="btn">Add</button>
          <button @click="closeAddWorkModal" class="btn" style="background: #666">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Add Artist Modal -->
    <div v-if="showAddArtistModal" class="modal" @click.self="closeAddArtistModal" style="z-index: 9000;">
      <div class="modal-box" style="z-index: 9001;">
        <h3>Add New Artist</h3>
        <label>
          Artist Name
          <input v-model="newArtist.name" type="text" placeholder="e.g., Jane Doe" />
        </label>
        <label>
          Studio (optional)
          <input v-model="newArtist.studio" type="text" placeholder="e.g., S1" />
        </label>
        <label>
          Photo URL (optional)
          <input v-model="newArtist.photo" type="text" placeholder="https://..." />
        </label>
        <div class="modal-btns">
          <button @click="addNewArtist" class="btn">Add</button>
          <button @click="closeAddArtistModal" class="btn" style="background: #666">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Upload Custom Image Modal -->
    <div v-if="showUploadModal" class="modal" @click.self="closeUploadModal" style="z-index: 10000;">
      <div class="modal-box" style="z-index: 10001;">
        <h3>Add Custom Image</h3>
        <p style="margin-bottom: 16px; color: #666;">
          For <strong>{{ uploadingWork }}</strong>
        </p>

        <!-- Tab Selection -->
        <div class="upload-tabs">
          <button :class="['upload-tab', { active: uploadMethod === 'url' }]" @click="uploadMethod = 'url'">
            🔗 Image URL
          </button>
          <button :class="['upload-tab', { active: uploadMethod === 'file' }]" @click="uploadMethod = 'file'">
            📁 Upload File
          </button>
        </div>

        <!-- URL Input Method -->
        <div v-if="uploadMethod === 'url'" class="upload-method">
          <label>
            Image URL
            <input v-model="customImageUrl" type="text" placeholder="https://example.com/image.jpg"
              @keyup.enter="handleCustomImageUrl"
              style="width: 100%; padding: 10px; margin-top: 8px; border: 1px solid #ddd; border-radius: 4px;" />
          </label>
          <div style="margin-top: 12px; padding: 12px; background: #f5f5f5; border-radius: 4px; font-size: 0.85rem;">
            <strong>💡 Tips:</strong>
            <ul style="margin: 8px 0 0 20px; padding: 0;">
              <li>Paste direct image URL (jpg, png, webp)</li>
              <li>Must end with image extension</li>
              <li>URL will be saved as-is (no upload)</li>
              <li>Image must be publicly accessible</li>
            </ul>
          </div>
          <div class="modal-btns" style="margin-top: 16px;">
            <button @click="handleCustomImageUrl" class="btn" :disabled="!customImageUrl.trim()">Add URL</button>
            <button @click="closeUploadModal" class="btn" style="background: #666">Cancel</button>
          </div>
        </div>

        <!-- File Upload Method -->
        <div v-if="uploadMethod === 'file'" class="upload-method">
          <label class="file-upload-label">
            <input type="file" @change="handleCustomImageUpload" accept="image/*" ref="customImageInput"
              style="display: none;" />
            <div class="file-upload-area">
              <div style="font-size: 3rem; margin-bottom: 8px;">📤</div>
              <div style="font-weight: bold; margin-bottom: 4px;">Click to select image</div>
              <div style="font-size: 0.85rem; color: #666;">JPG, PNG, WebP (max 5MB)</div>
            </div>
          </label>
          <div style="margin-top: 12px; padding: 12px; background: #f5f5f5; border-radius: 4px; font-size: 0.85rem;">
            <strong>💡 Tips:</strong>
            <ul style="margin: 8px 0 0 20px; padding: 0;">
              <li>Images stored in browser (base64)</li>
              <li>Included in exports automatically</li>
              <li>Best size: 800x1120px (portrait)</li>
              <li>Compressed for storage efficiency</li>
            </ul>
          </div>
          <div class="modal-btns" style="margin-top: 16px;">
            <button @click="closeUploadModal" class="btn" style="background: #666">Cancel</button>
          </div>
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
    <div v-if="lightbox.show" class="lightbox" @click.self="closeLightbox" style="z-index: 11000;">
      <button class="lightbox-close" @click="closeLightbox" style="z-index: 11002;">✕</button>
      <button class="lightbox-nav lightbox-prev" @click="prevImage" v-if="lightbox.images.length > 1"
        style="z-index: 11002;">‹</button>
      <button class="lightbox-nav lightbox-next" @click="nextImage" v-if="lightbox.images.length > 1"
        style="z-index: 11002;">›</button>

      <div class="lightbox-content" style="z-index: 11001;">
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

const IMAGE_SOURCE_PRIORITY = ['dmm', 'mgstage', 'fourhoi', 'pornfhd'];

const MGS_MAKER_MAP = {
  'ssni': 's1', 'snis': 's1', 'soav': 's1', 'ofje': 's1', 'onvb': 's1', 'sone': 's1',
  'ipx': 'ideapocket', 'ipz': 'ideapocket', 'idz': 'ideapocket',
  'mide': 'moodyz', 'miaa': 'moodyz', 'migd': 'moodyz', 'mifd': 'moodyz', 'miad': 'moodyz',
  'atid': 'attackers', 'adn': 'attackers',
  'hmn': 'honnaka',
  'stars': 'sod', 'sdmu': 'sod', 'scop': 'sod',
  'pred': 'premium', 'pre': 'premium',
  'jul': 'madonna', 'juc': 'madonna',
  'ebod': 'ebody',
  'ntr': 'ntr',
  'midv': 'mida',
  'luxu': '259luxu',
  'gvg': 'gloryquest',
  'fset': 'faleno',
  'mium': 'prestigepremium', '300mium': 'prestigepremium',
  '200gana': 'ganan', 'gana': 'ganan',
  'abp': 'prestige', 'abw': 'prestige',
  'dasd': 'das',
  'bf': 'befree',
  'yrh': 'magic'
};

const parseWorkCode = (code) => {
  if (!code) return null;
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const match = clean.match(/^([A-Z]+)(\d+)$/);

  if (!match) {
    return { full: clean, prefix: clean.toLowerCase(), number: '001', rawNumber: 1 };
  }

  return {
    full: clean,
    prefix: match[1].toLowerCase(),
    number: match[2],
    rawNumber: parseInt(match[2], 10)
  };
};

export default {
  name: 'Works',
  data() {
    return {
      activeTab: '',
      sortBy: 'code',
      darkMode: false,
      imageSource: 'dmm',
      globalSearch: '',
      toast: { show: false, message: '', type: 'success' },
      showAddWorkModal: false,
      showAddArtistModal: false,
      showEditWorkModal: false,
      showMoveWorkModal: false,
      showWorkModal: false,
      editingWork: null,
      moveWorkData: { code: '', sourceArtist: '', targetArtist: '', type: '' },
      newWork: { artist: '', code: '', type: 'mainWorks', releaseDate: '' },
      newArtist: { name: '', studio: '', photo: '' },
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
      imageSourceCache: {},
      customImages: {},
      showUploadModal: false,
      uploadingWork: null,
      uploadMethod: 'url',
      customImageUrl: ''
    }
  },
  computed: {
    totalCount() {
      return this.artists.reduce((sum, a) => sum + (a.mainWorks?.length || 0) + (a.compilations?.length || 0), 0)
    },
    currentArtist() {
      return this.artists.find(a => a.name === this.activeTab)
    },
    filteredCurrentMainWorks() {
      return this.currentArtist?.mainWorks || []
    },
    filteredCurrentCompilations() {
      return this.currentArtist?.compilations || []
    },
    sortedFilteredMainWorks() {
      return this.getSortedWorks(this.filteredCurrentMainWorks)
    },
    sortedFilteredCompilations() {
      return this.getSortedWorks(this.filteredCurrentCompilations)
    },
    sortedArtistsByWorkCount() {
      return [...this.artists].sort((a, b) => {
        if (a.name === 'Collection') return 1
        if (b.name === 'Collection') return -1
        const aCount = (a.mainWorks?.length || 0) + (a.compilations?.length || 0)
        const bCount = (b.mainWorks?.length || 0) + (b.compilations?.length || 0)
        if (bCount !== aCount) return bCount - aCount
        return a.name.localeCompare(b.name)
      })
    },
    searchResults() {
      if (!this.globalSearch) return []
      const q = this.globalSearch.toLowerCase()
      const results = []
      this.artists.forEach(artist => {
        [...(artist.mainWorks || []), ...(artist.compilations || [])].forEach(work => {
          if (work.code.toLowerCase().includes(q)) {
            results.push({ artistName: artist.name, work })
          }
        })
      })
      return results
    },
    sortedArtistsForMove() {
      return this.artists
        .filter(a => a.name !== this.activeTab)
        .sort((a, b) => a.name.localeCompare(b.name))
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
    imageSourceCache: {
      handler(v) {
        if (process.client) {
          try {
            localStorage.setItem('imageSourceCache', JSON.stringify(v))
          } catch (e) {
            console.warn('Failed to save image cache:', e)
          }
        }
      },
      deep: true
    },
    customImages: {
      handler(v) {
        if (process.client) {
          try {
            localStorage.setItem('customImages', JSON.stringify(v))
          } catch (e) {
            console.warn('Failed to save custom images:', e)
          }
        }
      },
      deep: true
    }
  },
  mounted() {
    if (process.client) {
      try {
        const saved = localStorage.getItem('artists')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.artists = normalizeArtists(parsed)
          }
        }

        const cachedSources = localStorage.getItem('imageSourceCache')
        if (cachedSources) {
          this.imageSourceCache = JSON.parse(cachedSources)
        }

        const savedCustomImages = localStorage.getItem('customImages')
        if (savedCustomImages) {
          this.customImages = JSON.parse(savedCustomImages)
        }
      } catch (e) {
        console.warn('Failed to load artists:', e)
      }

      const darkModePreference = localStorage.getItem('darkMode')
      if (darkModePreference === 'true') {
        this.darkMode = true
        document.documentElement.classList.add('dark-mode')
      }

      if (this.artists.length && !this.activeTab) {
        this.activeTab = this.artists[0].name
      }

      document.addEventListener('keydown', (e) => {
        if (this.lightbox.show) {
          if (e.key === 'ArrowLeft') {
            this.prevImage()
          } else if (e.key === 'ArrowRight') {
            this.nextImage()
          } else if (e.key === 'Escape') {
            this.closeLightbox()
          }
        } else if (this.showWorkModal) {
          if (e.key === 'ArrowLeft' && this.canNavigateWork(-1)) {
            this.navigateWork(-1)
          } else if (e.key === 'ArrowRight' && this.canNavigateWork(1)) {
            this.navigateWork(1)
          } else if (e.key === 'Escape') {
            this.closeWorkModal()
          }
        }
      })
    }
  },
  methods: {
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    },
    resetToDefaults() {
      this.artists = normalizeArtists(JSON.parse(JSON.stringify(DEFAULT_ARTISTS)))
      this.activeTab = this.artists[0].name
      this.imageSourceCache = {}
      this.showToast('✅ Reset to default data', 'success')
    },

    getWorkImageSource(code) {
      return this.imageSourceCache[code] || null
    },

    getImageUrl(code, quality = 'pl', preferredSource = null) {
      // Check for custom uploaded image first (only for cover/poster)
      if (quality === 'pl' && this.customImages[code]) {
        return this.customImages[code]
      }

      const cachedSource = this.imageSourceCache[code]
      if (cachedSource) {
        return this.generateImageUrl(code, quality, cachedSource)
      }

      const source = preferredSource || this.imageSource
      return this.generateImageUrl(code, quality, source)
    },

    isPlaceholderImage(img) {
      const width = img.naturalWidth || img.width
      const height = img.naturalHeight || img.height

      if (width < 100 || height < 100) {
        return true
      }

      const placeholderSizes = [
        { w: 280, h: 392 },
        { w: 560, h: 784 },
        { w: 300, h: 300 },
        { w: 468, h: 468 },
      ]

      const isKnownPlaceholder = placeholderSizes.some(size =>
        Math.abs(width - size.w) < 5 && Math.abs(height - size.h) < 5
      )

      if (isKnownPlaceholder) {
        return true
      }

      const aspectRatio = width / height
      if (Math.abs(aspectRatio - 1) < 0.05) {
        return true
      }

      return false
    },

    handleImageErrorWithFallback(event, code, quality = 'pl', currentSource = null) {
      const img = event.target

      if (img.dataset.fallbackAttempts >= 4) {
        this.showPlaceholder(img)
        return
      }

      const attempts = parseInt(img.dataset.fallbackAttempts || '0')
      img.dataset.fallbackAttempts = attempts + 1

      const current = currentSource || this.imageSource
      const currentIndex = IMAGE_SOURCE_PRIORITY.indexOf(current)
      const nextIndex = (currentIndex + 1) % IMAGE_SOURCE_PRIORITY.length
      const nextSource = IMAGE_SOURCE_PRIORITY[nextIndex]

      if (current === 'dmm' && attempts === 0) {
        const parsed = parseWorkCode(code)
        if (parsed) {
          const unpaddedId = `${parsed.prefix}${parsed.number}`
          const newUrl = `https://pics.dmm.co.jp/digital/video/${unpaddedId}/${unpaddedId}${quality === 'pl' ? 'pl' : `jp-${quality.split('-')[1]}`}.jpg`
          img.src = newUrl
          return
        }
      }

      if (attempts < 4) {
        const newUrl = this.generateImageUrl(code, quality, nextSource)
        img.src = newUrl

        img.onload = () => {
          const isPlaceholder = this.isPlaceholderImage(img)

          if (isPlaceholder && attempts < 3) {
            img.dataset.fallbackAttempts = attempts + 1
            const nextAttemptIndex = (IMAGE_SOURCE_PRIORITY.indexOf(nextSource) + 1) % IMAGE_SOURCE_PRIORITY.length
            const nextAttemptSource = IMAGE_SOURCE_PRIORITY[nextAttemptIndex]
            const nextUrl = this.generateImageUrl(code, quality, nextAttemptSource)
            img.src = nextUrl
          } else if (!isPlaceholder) {
            this.imageSourceCache = {
              ...this.imageSourceCache,
              [code]: nextSource
            }
            img.style.opacity = '1'
          } else {
            this.showPlaceholder(img)
          }
        }
      } else {
        this.showPlaceholder(img)
      }
    },

    handleGalleryImageError(event, code, imageNumber, currentSource = null) {
      const img = event.target

      if (img.dataset.fallbackAttempts >= 2) {
        img.style.opacity = '0.1'
        img.style.filter = 'grayscale(1)'
        return
      }

      const attempts = parseInt(img.dataset.fallbackAttempts || '0')
      img.dataset.fallbackAttempts = attempts + 1

      const current = currentSource || this.imageSource
      const currentIndex = IMAGE_SOURCE_PRIORITY.indexOf(current)
      const nextIndex = (currentIndex + 1) % IMAGE_SOURCE_PRIORITY.length
      const nextSource = IMAGE_SOURCE_PRIORITY[nextIndex]

      const newUrl = this.generateImageUrl(code, `jp-${imageNumber}`, nextSource)
      img.src = newUrl

      img.onload = () => {
        if (this.isPlaceholderImage(img)) {
          if (attempts < 1) {
            img.dataset.fallbackAttempts = attempts + 1
            const nextAttemptIndex = (IMAGE_SOURCE_PRIORITY.indexOf(nextSource) + 1) % IMAGE_SOURCE_PRIORITY.length
            const nextAttemptSource = IMAGE_SOURCE_PRIORITY[nextAttemptIndex]
            const nextAttemptUrl = this.generateImageUrl(code, `jp-${imageNumber}`, nextAttemptSource)
            img.src = nextAttemptUrl
          } else {
            img.style.opacity = '0.1'
            img.style.filter = 'grayscale(1)'
          }
        }
      }
    },

    showPlaceholder(img) {
      img.style.display = 'none'
      const parent = img.parentElement
      if (parent && !parent.querySelector('.photo-placeholder')) {
        const placeholder = document.createElement('div')
        placeholder.className = 'photo-placeholder'
        placeholder.innerHTML = `
          <div style="text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 8px;">📷</div>
            <button class="upload-custom-btn" style="background: #2196F3; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">
              📤 Upload Image
            </button>
          </div>
        `
        placeholder.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: rgba(128,128,128,0.1);'

        // Get the work code from the image alt or from parent
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

    openWorkModal(work) {
      const isMain = this.currentArtist?.mainWorks?.find(w => w.code === work.code)
      this.currentWorkList = isMain ?
        this.sortedFilteredMainWorks :
        this.sortedFilteredCompilations

      this.currentWorkIndex = this.currentWorkList.findIndex(w => w.code === work.code)
      this.currentWork = work
      this.showWorkModal = true

      if (process.client) {
        document.body.style.overflow = 'hidden'
      }
    },

    closeWorkModal() {
      this.showWorkModal = false
      this.currentWork = null
      if (process.client) {
        document.body.style.overflow = ''
      }
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

    openLightbox(work, startIndex = 0) {
      const images = [
        this.getImageUrl(work.code, 'pl', work.imageSource)
      ]

      for (let i = 1; i <= 20; i++) {
        images.push(this.getImageUrl(work.code, `jp-${i}`, work.imageSource))
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

    openEditWorkModal(work) {
      this.editingWork = { code: work.code, newCode: work.code, releaseDate: work.releaseDate || '' }
      this.showEditWorkModal = true
    },
    closeEditWorkModal() {
      this.showEditWorkModal = false
      this.editingWork = null
    },
    openMoveWorkModal(work) {
      this.moveWorkData = { code: work.code, sourceArtist: this.activeTab, targetArtist: '', type: '' }
      const artist = this.artists.find(a => a.name === this.activeTab)
      if (artist?.mainWorks?.find(w => w.code === work.code)) {
        this.moveWorkData.type = 'mainWorks'
      } else if (artist?.compilations?.find(w => w.code === work.code)) {
        this.moveWorkData.type = 'compilations'
      }
      this.showMoveWorkModal = true
    },
    closeMoveWorkModal() {
      this.showMoveWorkModal = false
      this.moveWorkData = { code: '', sourceArtist: '', targetArtist: '', type: '' }
    },
    executeMoveWork() {
      if (!this.moveWorkData.targetArtist) return this.showToast('Select target artist', 'error')
      const sourceArtist = this.artists.find(a => a.name === this.moveWorkData.sourceArtist)
      const targetArtist = this.artists.find(a => a.name === this.moveWorkData.targetArtist)
      if (!sourceArtist || !targetArtist) return this.showToast('Artist not found', 'error')

      const type = this.moveWorkData.type
      const work = sourceArtist[type]?.find(w => w.code === this.moveWorkData.code)
      if (!work) return this.showToast('Work not found', 'error')

      sourceArtist[type] = sourceArtist[type].filter(w => w.code !== this.moveWorkData.code)

      if (!targetArtist[type]) targetArtist[type] = []
      targetArtist[type].push(work)

      this.artists = [...this.artists]
      this.closeMoveWorkModal()
      this.showToast(`✅ Moved ${this.moveWorkData.code} to ${this.moveWorkData.targetArtist}`, 'success')
    },
    setWorkImageSource(work, event) {
      const newSource = event.target.value
      work.imageSource = newSource

      this.imageSourceCache = {
        ...this.imageSourceCache,
        [work.code]: newSource
      }

      this.artists = [...this.artists]
      this.showToast(`Image source set to ${newSource.toUpperCase()}`, 'success')
    },
    saveEditWork() {
      if (!this.editingWork.newCode.trim()) return this.showToast('Code required', 'error')
      const newCode = this.editingWork.newCode.toUpperCase()
      if (newCode !== this.editingWork.code && this.artists.some(a => a.mainWorks?.some(w => w.code === newCode) || a.compilations?.some(w => w.code === newCode))) {
        return this.showToast('Code already exists', 'error')
      }
      const artist = this.artists.find(a => a.name === this.activeTab)
      if (!artist) return
      let work = artist.mainWorks?.find(w => w.code === this.editingWork.code) || artist.compilations?.find(w => w.code === this.editingWork.code)
      if (work) {
        if (work.code !== newCode && this.imageSourceCache[work.code]) {
          this.imageSourceCache = {
            ...this.imageSourceCache,
            [newCode]: this.imageSourceCache[work.code]
          }
          delete this.imageSourceCache[work.code]
        }

        work.code = newCode
        work.releaseDate = this.editingWork.releaseDate
        this.artists = [...this.artists]
        this.closeEditWorkModal()
        this.showToast(`✅ Updated to ${newCode}`, 'success')
      }
    },
    getSortedWorks(works) {
      const sorted = [...works]
      if (this.sortBy === 'code') {
        return sorted.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
      } else if (this.sortBy === 'code-desc') {
        return sorted.sort((a, b) => b.code.localeCompare(a.code, undefined, { numeric: true }))
      } else if (this.sortBy === 'date') {
        return sorted.sort((a, b) => {
          const dateA = new Date(a.releaseDate || '9999-12-31')
          const dateB = new Date(b.releaseDate || '9999-12-31')
          return dateB - dateA
        })
      }
      return sorted.reverse()
    },
    getRandomArtistWork(artist) {
      const allWorks = [...(artist.mainWorks || []), ...(artist.compilations || [])]
      if (allWorks.length === 0) return null
      return allWorks[Math.floor(Math.random() * allWorks.length)]
    },

    generateImageUrl(code, quality = 'pl', source = 'dmm') {
      const parsed = parseWorkCode(code);
      if (!parsed) return null;

      if (source === 'mgstage') {
        const makerId = MGS_MAKER_MAP[parsed.prefix] || parsed.prefix;
        let frame = '0';
        if (quality !== 'pl') {
          const qNum = parseInt(quality.split('-')[1] || '0');
          frame = (qNum + 1).toString();
        }
        return `https://image.mgstage.com/images/${makerId}/${parsed.prefix}/${parsed.number}/cap_e_${frame}_${parsed.prefix}${parsed.number}.jpg`;
      } else if (source === 'fourhoi') {
        const cleanCode = `${parsed.prefix}-${parsed.number}`;
        let suffix = 'cover-n';
        if (quality !== 'pl') {
          const qNum = parseInt(quality.split('-')[1] || '1');
          const char = String.fromCharCode(96 + qNum);
          suffix = `cover-${char}`;
        }
        return `https://fourhoi.com/${parsed.full.toLowerCase()}/${suffix}.jpg`;
      } else if (source === 'pornfhd') {
        const makerId = MGS_MAKER_MAP[parsed.prefix] || parsed.prefix;
        const filenameCode = `${parsed.prefix}-${parsed.number}`;
        if (quality === 'pl') {
          return `https://pics.pornfhd.com/mgs/images/${makerId}/${parsed.prefix}/${parsed.number}/pb_e_${filenameCode}.jpg`;
        } else {
          let frame = 2;
          if (quality.startsWith('jp-')) {
            const num = parseInt(quality.split('-')[1]);
            frame = num + 1;
          }
          return `https://pics.pornfhd.com/mgs/images/${makerId}/${parsed.prefix}/${parsed.number}/cap_e_${frame}_${filenameCode}.jpg`;
        }
      } else {
        const paddedNum = parsed.number.padStart(5, '0');
        const dmmId = `${parsed.prefix}${paddedNum}`;
        if (dmmId.length < 3) return null;
        if (quality !== 'pl') {
          const qNum = quality.split('-')[1] || '1';
          return `https://pics.dmm.co.jp/digital/video/${dmmId}/${dmmId}jp-${qNum}.jpg`;
        }
        return `https://pics.dmm.co.jp/digital/video/${dmmId}/${dmmId}pl.jpg`;
      }
    },

    async validateImageUrl(url) {
      return new Promise(r => {
        const img = new Image()
        const t = setTimeout(() => r(false), 5000)
        img.onload = () => { clearTimeout(t); r(true) }
        img.onerror = () => { clearTimeout(t); r(false) }
        img.src = url
      })
    },
    async autoFillImages() {
      let updated = 0, failed = 0
      this.showToast('Auto-fetching posters...', 'info')

      for (const artist of this.artists) {
        for (const work of [...(artist.mainWorks || []), ...(artist.compilations || [])]) {
          let foundSource = null
          for (const source of IMAGE_SOURCE_PRIORITY) {
            const url = this.generateImageUrl(work.code, 'pl', source)
            if (await this.validateImageUrl(url)) {
              foundSource = source
              break
            }
          }

          if (foundSource) {
            this.imageSourceCache = {
              ...this.imageSourceCache,
              [work.code]: foundSource
            }
            updated++
          } else {
            failed++
          }
        }
      }

      this.showToast(`✅ Verified ${updated} works${failed ? ` (${failed} unverified)` : ''}`, 'info')
    },
    copyToClipboard(code) {
      navigator.clipboard.writeText(code).then(() => {
        this.showToast(`Copied: ${code}`, 'success')
      }).catch(() => {
        this.showToast('Failed to copy', 'error')
      })
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
    toggleDarkMode() {
      this.darkMode = !this.darkMode
      if (process.client) {
        document.documentElement.classList.toggle('dark-mode', this.darkMode)
        localStorage.setItem('darkMode', this.darkMode)
      }
    },
    showToast(msg, type = 'success') {
      this.toast = { show: true, message: msg, type }
      setTimeout(() => this.toast.show = false, 3000)
    },
    handleExport() {
      try {
        const date = new Date().toISOString().split('T')[0]
        const data = {
          timestamp: new Date().toISOString(),
          version: '2.1',
          totalWorks: this.totalCount,
          artists: this.artists,
          imageSourceCache: this.imageSourceCache,
          customImages: this.customImages
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `works-tracker-${date}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        const customCount = Object.keys(this.customImages).length
        const msg = `✅ Exported ${this.totalCount} works${customCount ? ` (${customCount} custom images)` : ''}`
        this.showToast(msg, 'success')
      } catch (error) {
        this.showToast(`❌ Export failed: ${error.message}`, 'error')
      }
    },
    handleImportClick() { this.$refs.fileInput.click() },
    handleImport(e) {
      const file = e.target.files?.[0]
      if (!file) return
      if (!file.name.endsWith('.json')) {
        this.showToast('Please select a JSON file', 'error')
        e.target.value = ''
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result)
          if (!data.artists || !Array.isArray(data.artists)) throw new Error('Invalid file format')

          const validArtists = data.artists.filter(a => typeof a.name === 'string' && a.name.trim()).map(a => ({
            name: a.name.trim(),
            studio: a.studio || '',
            photo: a.photo || '',
            mainWorks: Array.isArray(a.mainWorks) ? a.mainWorks.filter(w => w && w.code) : [],
            compilations: Array.isArray(a.compilations) ? a.compilations.filter(w => w && w.code) : []
          }))

          if (validArtists.length === 0) throw new Error('No valid artists found')

          this.artists = normalizeArtists(validArtists)

          if (data.imageSourceCache) {
            this.imageSourceCache = data.imageSourceCache
          }

          if (data.customImages) {
            this.customImages = data.customImages
          }

          if (this.artists.length) this.activeTab = this.artists[0].name

          const totalCount = validArtists.reduce((sum, a) => sum + (a.mainWorks?.length || 0) + (a.compilations?.length || 0), 0)
          const customCount = Object.keys(data.customImages || {}).length
          const msg = `✅ Imported ${validArtists.length} artists, ${totalCount} works${customCount ? `, ${customCount} custom images` : ''}`
          this.showToast(msg, 'success')
        } catch (error) {
          this.showToast(`❌ Import failed: ${error.message}`, 'error')
        }
      }
      reader.onerror = () => this.showToast('❌ Failed to read file', 'error')
      reader.readAsText(file)
      e.target.value = ''
    },
    openAddWorkModal() {
      this.newWork = { artist: this.activeTab || '', code: '', type: 'mainWorks', releaseDate: '' }
      this.showAddWorkModal = true
    },
    closeAddWorkModal() { this.showAddWorkModal = false },
    openAddArtistModal() {
      this.newArtist = { name: '', studio: '', photo: '' }
      this.showAddArtistModal = true
    },
    closeAddArtistModal() { this.showAddArtistModal = false },
    async addNewWork() {
      if (!this.newWork.artist || !this.newWork.code) return this.showToast('Fill required fields', 'error')
      const code = this.newWork.code.toUpperCase()
      if (this.artists.some(a => a.mainWorks?.some(w => w.code === code) || a.compilations?.some(w => w.code === code))) {
        return this.showToast('Code already exists', 'error')
      }
      const artist = this.artists.find(a => a.name === this.newWork.artist)
      if (!artist) return this.showToast('Artist not found', 'error')
      if (!artist[this.newWork.type]) artist[this.newWork.type] = []
      artist[this.newWork.type].push({ code, releaseDate: this.newWork.releaseDate })
      this.artists = [...this.artists]
      this.closeAddWorkModal()
      this.showToast(`✅ Added ${code}`, 'success')
    },
    addNewArtist() {
      if (!this.newArtist.name.trim()) return this.showToast('Artist name required', 'error')
      if (this.artists.some(a => a.name === this.newArtist.name)) return this.showToast('Artist already exists', 'error')
      const newArtist = { name: this.newArtist.name.trim(), studio: this.newArtist.studio || '', photo: this.newArtist.photo || '', mainWorks: [], compilations: [] }
      this.artists.push(newArtist)
      this.artists = [...this.artists]
      this.activeTab = newArtist.name
      this.closeAddArtistModal()
      this.showToast(`✅ Added ${newArtist.name}`, 'success')
    },
    handleImageLoad(e) {
      e.target.style.opacity = '1'
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

    handleCustomImageUrl() {
      const url = this.customImageUrl.trim()

      if (!url) {
        this.showToast('Please enter an image URL', 'error')
        return
      }

      // Basic URL validation
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        this.showToast('URL must start with http:// or https://', 'error')
        return
      }

      // Check if URL looks like an image
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
      const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().includes(ext))

      if (!hasImageExtension) {
        const proceed = confirm('URL does not end with a common image extension. Continue anyway?')
        if (!proceed) return
      }

      // Validate image by trying to load it
      const img = new Image()
      const timeout = setTimeout(() => {
        this.showToast('Image URL took too long to load', 'error')
      }, 10000)

      img.onload = () => {
        clearTimeout(timeout)

        // Store the URL directly
        this.customImages = {
          ...this.customImages,
          [this.uploadingWork]: url
        }

        this.showToast(`✅ Custom image URL added for ${this.uploadingWork}`, 'success')
        this.closeUploadModal()

        // Force refresh
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

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.showToast('Please select an image file', 'error')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showToast('Image too large (max 5MB)', 'error')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target.result

        // Store the custom image
        this.customImages = {
          ...this.customImages,
          [this.uploadingWork]: base64
        }

        this.showToast(`✅ Custom image uploaded for ${this.uploadingWork}`, 'success')
        this.closeUploadModal()

        // Force refresh by triggering reactivity
        this.artists = [...this.artists]
      }

      reader.onerror = () => {
        this.showToast('Failed to read image file', 'error')
      }

      reader.readAsDataURL(file)
    },

    removeCustomImage(code) {
      if (confirm(`Remove custom image for ${code}?`)) {
        const newCustomImages = { ...this.customImages }
        delete newCustomImages[code]
        this.customImages = newCustomImages
        this.showToast(`Removed custom image for ${code}`, 'success')

        // Force refresh
        this.artists = [...this.artists]
      }
    },

    hasCustomImage(code) {
      return !!this.customImages[code]
    }
  }
}
</script>

<style scoped>
@import '~/assets/css/works.css';

.image-source-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  z-index: 10;
}

.image-source-selector small {
  display: block;
  margin-top: 4px;
  color: #4CAF50;
  font-size: 0.85rem;
}

.photo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: rgba(128, 128, 128, 0.1);
  font-size: 2rem;
  opacity: 0.3;
}

.upload-custom-btn {
  transition: all 0.2s;
}

.upload-custom-btn:hover {
  background: #1976D2 !important;
  transform: translateY(-1px);
}

.action-btn-sidebar.upload {
  background: #2196F3;
  color: white;
}

.action-btn-sidebar.upload:hover {
  background: #1976D2;
}

.action-btn-sidebar.remove {
  background: #f44336;
  color: white;
}

.action-btn-sidebar.remove:hover {
  background: #d32f2f;
}

.file-upload-label {
  cursor: pointer;
  display: block;
}

.file-upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  transition: all 0.3s;
  background: #fafafa;
}

.file-upload-area:hover {
  border-color: #2196F3;
  background: #f0f7ff;
}

.dark-mode .file-upload-area {
  background: #2a2a2a;
  border-color: #555;
}

.dark-mode .file-upload-area:hover {
  background: #1a2a3a;
  border-color: #2196F3;
}

.upload-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.upload-tab {
  flex: 1;
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
}

.upload-tab:hover {
  color: #2196F3;
  background: rgba(33, 150, 243, 0.05);
}

.upload-tab.active {
  color: #2196F3;
  border-bottom-color: #2196F3;
  font-weight: 600;
}

.upload-method {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dark-mode .upload-tabs {
  border-bottom-color: #444;
}

.dark-mode .upload-tab {
  color: #aaa;
}

.dark-mode .upload-tab:hover {
  color: #2196F3;
  background: rgba(33, 150, 243, 0.1);
}

.dark-mode .upload-tab.active {
  color: #2196F3;
}

/* Z-Index Layering System */
.modal {
  z-index: 9000 !important;
}

.modal-box {
  z-index: 9001 !important;
  position: relative;
}

.work-modal {
  z-index: 8000 !important;
}

.work-modal-content {
  z-index: 8001 !important;
  position: relative;
}

/* Upload modal should be highest among regular modals */
div[v-if="showUploadModal"].modal {
  z-index: 10000 !important;
}

/* Lightbox should be above everything */
.lightbox {
  z-index: 11000 !important;
}

.lightbox-content,
.lightbox-close,
.lightbox-nav {
  z-index: 11001 !important;
  position: relative;
}

/* Toast should be visible above everything except lightbox */
.toast {
  z-index: 10500 !important;
  position: fixed !important;
}

/* Work Modal Navigation Buttons */
.work-modal-nav {
  position: absolute !important;
  z-index: 8003 !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
}

.work-modal-prev {
  left: 20px !important;
}

.work-modal-next {
  right: 20px !important;
}

.work-modal-close {
  position: absolute !important;
  z-index: 8003 !important;
  top: 20px !important;
  right: 20px !important;
}

.work-modal-content {
  position: relative !important;
}
</style>