<template>
  <div class="container">
    <header>
      <div>
        <h1>🎬 Works Tracker</h1>
        <p>{{ totalCount }} total works</p>
      </div>

      <div class="btns">
        <button @click="handleExport" class="btn-icon" title="Export JSON">📥</button>
        <button @click="handleImportClick" class="btn-icon" title="Import">📤</button>
        <button @click="resetToDefaults" class="btn-icon" title="Reset to default data">🔄</button>
        <button @click="openAddArtistModal" title="Add new artist">➕ Artist</button>
        <input ref="fileInput" type="file" accept=".json" @change="handleImport" hidden />
      </div>
    </header>

    <div class="content-wrapper">
      <!-- Artist Grid View (Page 1) -->
      <div v-show="currentView === 'artists'" class="view-page">
        <!-- Sort Options -->
        <div class="sort-bar">
          <label>Sort by:</label>
          <div class="sort-buttons">
            <button :class="['sort-btn', { active: artistSort === 'name-asc' }]" @click="artistSort = 'name-asc'"
              title="Name A-Z">
              A-Z
            </button>
            <button :class="['sort-btn', { active: artistSort === 'name-desc' }]" @click="artistSort = 'name-desc'"
              title="Name Z-A">
              Z-A
            </button>
            <button :class="['sort-btn', { active: artistSort === 'works-desc' }]" @click="artistSort = 'works-desc'"
              title="Most Works First">
              Most Works
            </button>
            <button :class="['sort-btn', { active: artistSort === 'works-asc' }]" @click="artistSort = 'works-asc'"
              title="Least Works First">
              Least Works
            </button>
          </div>
        </div>

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
          <button @click="backToArtists" class="back-btn">← Back to Artists</button>
          <div class="page-title">
            <h2>{{ currentArtist?.name }}</h2>
            <p>{{ (currentArtist?.mainWorks?.length || 0) + (currentArtist?.compilations?.length || 0) }} works</p>
          </div>
          <button @click="openAddWorkModal" class="add-work-btn">➕ Add Work</button>
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
        <div class="page-header">
          <button @click="backToWorks" class="back-btn">← Back to {{ currentArtist?.name }}</button>
          <div class="work-nav-buttons">
            <button @click="navigateWork(-1)" :disabled="!canNavigateWork(-1)" class="nav-btn">‹ Previous</button>
            <button @click="navigateWork(1)" :disabled="!canNavigateWork(1)" class="nav-btn">Next ›</button>
          </div>
        </div>

        <div v-if="currentWork" class="work-detail-content">
          <!-- Left Column: Cover + Info + Actions -->
          <div class="work-detail-left">
            <div class="work-cover-container">
              <img :src="getImageUrl(currentWork.code, 'pl')" :alt="currentWork.code"
                @click="openLightbox(currentWork, 0)" @error="showPlaceholder" @load="handleImageLoad"
                class="work-cover-image" />
              <div class="cover-click-hint">Click to view full size</div>
              <div v-if="hasCustomImage(currentWork.code)" class="image-source-badge">
                Custom Upload ✓
              </div>
            </div>

            <div class="work-info-card">
              <h2 class="work-title" @click="copyToClipboard(currentWork.code)">
                {{ currentWork.code }}
                <span v-if="hasSimilarCode(currentWork.code)" class="typo-warning">⚠️</span>
              </h2>

              <!-- Additional Artists Section -->
              <div v-if="currentWork.additionalArtists && currentWork.additionalArtists.length"
                class="additional-artists">
                <label>Also appears in:</label>
                <div class="artist-chips">
                  <span v-for="artistName in currentWork.additionalArtists" :key="artistName" class="artist-chip">
                    {{ artistName }}
                    <button @click="removeAdditionalArtist(currentWork, artistName)" class="chip-remove">✕</button>
                  </span>
                </div>
              </div>

              <div class="work-actions">
                <button @click="openEditWorkModal(currentWork)" class="action-btn edit">
                  ✏️ Edit
                </button>
                <button @click="openMoveWorkModal(currentWork)" class="action-btn move">
                  ➡️ Move
                </button>
                <button @click="openAddArtistToWorkModal(currentWork)" class="action-btn add-artist">
                  👥 Add Artist
                </button>
                <button v-if="!hasCustomImage(currentWork.code)" @click="openUploadModal(currentWork.code)"
                  class="action-btn upload">
                  📤 Upload Image
                </button>
                <button v-if="hasCustomImage(currentWork.code)" @click="removeCustomImage(currentWork.code)"
                  class="action-btn remove">
                  🗑️ Remove Custom
                </button>
              </div>

              <div class="external-links">
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

    <!-- Add Artist to Work Modal -->
    <div v-if="showAddArtistToWorkModal" class="modal" @click.self="closeAddArtistToWorkModal">
      <div class="modal-box">
        <h3>Add Artist to Work</h3>
        <p style="margin-bottom: 16px; color: #666;">
          Add this work to another artist's collection
        </p>
        <label>
          Select Artist
          <select v-model="addArtistToWorkData.targetArtist" class="artist-select">
            <option value="">Choose artist...</option>
            <option v-for="a in availableArtistsForWork" :key="a.name" :value="a.name">
              {{ a.name }} ({{ (a.mainWorks?.length || 0) + (a.compilations?.length || 0) }} works)
            </option>
          </select>
        </label>
        <div class="modal-btns">
          <button @click="executeAddArtistToWork" class="btn" :disabled="!addArtistToWorkData.targetArtist">Add</button>
          <button @click="closeAddArtistToWorkModal" class="btn" style="background: #666">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Move Work Modal -->
    <div v-if="showMoveWorkModal" class="modal" @click.self="closeMoveWorkModal">
      <div class="modal-box">
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
    <div v-if="showEditWorkModal" class="modal" @click.self="closeEditWorkModal">
      <div class="modal-box">
        <h3>Edit Work Code</h3>
        <label>
          Code
          <input v-model="editingWork.newCode" type="text" placeholder="e.g., SONE-978" />
        </label>
        <div class="modal-btns">
          <button @click="saveEditWork" class="btn">Save</button>
          <button @click="closeEditWorkModal" class="btn" style="background: #666">Cancel</button>
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
          <button @click="addNewWork" class="btn">Add</button>
          <button @click="closeAddWorkModal" class="btn" style="background: #666">Cancel</button>
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
          <button @click="addNewArtist" class="btn">Add</button>
          <button @click="closeAddArtistModal" class="btn" style="background: #666">Cancel</button>
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

        <div class="upload-tabs">
          <button :class="['upload-tab', { active: uploadMethod === 'url' }]" @click="uploadMethod = 'url'">
            🔗 Image URL
          </button>
          <button :class="['upload-tab', { active: uploadMethod === 'file' }]" @click="uploadMethod = 'file'">
            📁 Upload File
          </button>
        </div>

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
      currentView: 'artists',
      activeTab: '',
      artistSort: 'works-desc',
      toast: { show: false, message: '', type: 'success' },
      showAddWorkModal: false,
      showAddArtistModal: false,
      showEditWorkModal: false,
      showMoveWorkModal: false,
      showAddArtistToWorkModal: false,
      editingWork: null,
      moveWorkData: { code: '', sourceArtist: '', targetArtist: '', type: '' },
      addArtistToWorkData: { work: null, targetArtist: '' },
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
    sortedArtists() {
      const artists = [...this.artists]

      switch (this.artistSort) {
        case 'name-asc':
          return artists.sort((a, b) => {
            if (a.name === 'Collection') return 1
            if (b.name === 'Collection') return -1
            return a.name.localeCompare(b.name)
          })

        case 'name-desc':
          return artists.sort((a, b) => {
            if (a.name === 'Collection') return 1
            if (b.name === 'Collection') return -1
            return b.name.localeCompare(a.name)
          })

        case 'works-asc':
          return artists.sort((a, b) => {
            if (a.name === 'Collection') return 1
            if (b.name === 'Collection') return -1
            const aCount = (a.mainWorks?.length || 0) + (a.compilations?.length || 0)
            const bCount = (b.mainWorks?.length || 0) + (b.compilations?.length || 0)
            if (aCount !== bCount) return aCount - bCount
            return a.name.localeCompare(b.name)
          })

        case 'works-desc':
        default:
          return artists.sort((a, b) => {
            if (a.name === 'Collection') return 1
            if (b.name === 'Collection') return -1
            const aCount = (a.mainWorks?.length || 0) + (a.compilations?.length || 0)
            const bCount = (b.mainWorks?.length || 0) + (b.compilations?.length || 0)
            if (bCount !== aCount) return bCount - aCount
            return a.name.localeCompare(b.name)
          })
      }
    },
    sortedArtistsForMove() {
      return this.artists
        .filter(a => a.name !== this.activeTab)
        .sort((a, b) => a.name.localeCompare(b.name))
    },
    availableArtistsForWork() {
      if (!this.addArtistToWorkData.work) return []

      const currentWork = this.addArtistToWorkData.work
      const currentArtistName = this.activeTab
      const additionalArtists = currentWork.additionalArtists || []
      const excludedArtists = [currentArtistName, ...additionalArtists]

      return this.artists
        .filter(a => !excludedArtists.includes(a.name))
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
    },
    currentView() {
      this.scrollToTop()
    },
    artistSort(v) {
      if (process.client) {
        localStorage.setItem('artistSort', v)
      }
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

        const savedCustomImages = localStorage.getItem('customImages')
        if (savedCustomImages) {
          this.customImages = JSON.parse(savedCustomImages)
        }

        const savedSort = localStorage.getItem('artistSort')
        if (savedSort) {
          this.artistSort = savedSort
        }
      } catch (e) {
        console.warn('Failed to load artists:', e)
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
        } else if (this.currentView === 'detail') {
          if (e.key === 'ArrowLeft' && this.canNavigateWork(-1)) {
            this.navigateWork(-1)
          } else if (e.key === 'ArrowRight' && this.canNavigateWork(1)) {
            this.navigateWork(1)
          } else if (e.key === 'Escape') {
            this.backToWorks()
          }
        } else if (this.currentView === 'works' && e.key === 'Escape') {
          this.backToArtists()
        }
      })
    }
  },
  methods: {
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

    resetToDefaults() {
      this.artists = normalizeArtists(JSON.parse(JSON.stringify(DEFAULT_ARTISTS)))
      this.activeTab = this.artists[0].name
      this.customImages = {}
      this.currentWork = null
      this.currentView = 'artists'
      this.artistSort = 'works-desc'
      this.showToast('✅ Reset to default data', 'success')
    },

    getImageUrl(code, quality = 'pl') {
      if (quality === 'pl' && this.customImages[code]) {
        return this.customImages[code]
      }

      const parsed = parseWorkCode(code);
      if (!parsed) return null;

      const paddedNum = parsed.number.padStart(5, '0');
      const dmmId = `${parsed.prefix}${paddedNum}`;

      if (dmmId.length < 3) return null;

      if (quality !== 'pl') {
        const qNum = quality.split('-')[1] || '1';
        return `https://pics.dmm.co.jp/digital/video/${dmmId}/${dmmId}jp-${qNum}.jpg`;
      }

      return `https://pics.dmm.co.jp/digital/video/${dmmId}/${dmmId}pl.jpg`;
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
            <button class="upload-custom-btn" style="background: #2196F3; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">
              📤 Upload Image
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

    openWorkView(work) {
      const isMain = this.currentArtist?.mainWorks?.find(w => w.code === work.code)
      this.currentWorkList = isMain ?
        (this.currentArtist.mainWorks || []) :
        (this.currentArtist.compilations || [])

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

    openAddArtistToWorkModal(work) {
      this.addArtistToWorkData = { work, targetArtist: '' }
      this.showAddArtistToWorkModal = true
    },

    closeAddArtistToWorkModal() {
      this.showAddArtistToWorkModal = false
      this.addArtistToWorkData = { work: null, targetArtist: '' }
    },

    executeAddArtistToWork() {
      if (!this.addArtistToWorkData.targetArtist) {
        return this.showToast('Select target artist', 'error')
      }

      const work = this.addArtistToWorkData.work
      const targetArtistName = this.addArtistToWorkData.targetArtist
      const targetArtist = this.artists.find(a => a.name === targetArtistName)

      if (!targetArtist) {
        return this.showToast('Artist not found', 'error')
      }

      const currentArtist = this.artists.find(a => a.name === this.activeTab)
      let workType = 'mainWorks'
      if (currentArtist?.compilations?.find(w => w.code === work.code)) {
        workType = 'compilations'
      }

      const existsInTarget = targetArtist.mainWorks?.find(w => w.code === work.code) ||
        targetArtist.compilations?.find(w => w.code === work.code)

      if (existsInTarget) {
        return this.showToast('Work already exists in target artist', 'error')
      }

      if (!targetArtist[workType]) {
        targetArtist[workType] = []
      }

      const workCopy = { ...work }

      if (!workCopy.additionalArtists) {
        workCopy.additionalArtists = []
      }

      if (!workCopy.additionalArtists.includes(this.activeTab)) {
        workCopy.additionalArtists.push(this.activeTab)
      }

      targetArtist[workType].push(workCopy)

      if (!work.additionalArtists) {
        work.additionalArtists = []
      }
      if (!work.additionalArtists.includes(targetArtistName)) {
        work.additionalArtists.push(targetArtistName)
      }

      this.artists = [...this.artists]
      this.closeAddArtistToWorkModal()
      this.showToast(`✅ Added ${work.code} to ${targetArtistName}`, 'success')
    },

    removeAdditionalArtist(work, artistNameToRemove) {
      if (!confirm(`Remove ${work.code} from ${artistNameToRemove}?`)) {
        return
      }

      const artistToRemoveFrom = this.artists.find(a => a.name === artistNameToRemove)

      if (artistToRemoveFrom) {
        if (artistToRemoveFrom.mainWorks) {
          artistToRemoveFrom.mainWorks = artistToRemoveFrom.mainWorks.filter(w => w.code !== work.code)
        }
        if (artistToRemoveFrom.compilations) {
          artistToRemoveFrom.compilations = artistToRemoveFrom.compilations.filter(w => w.code !== work.code)
        }
      }

      if (work.additionalArtists) {
        work.additionalArtists = work.additionalArtists.filter(name => name !== artistNameToRemove)
        if (work.additionalArtists.length === 0) {
          delete work.additionalArtists
        }
      }

      this.artists.forEach(artist => {
        const allWorks = [...(artist.mainWorks || []), ...(artist.compilations || [])]
        allWorks.forEach(w => {
          if (w.code === work.code && w.additionalArtists) {
            w.additionalArtists = w.additionalArtists.filter(name => name !== artistNameToRemove)
            if (w.additionalArtists.length === 0) {
              delete w.additionalArtists
            }
          }
        })
      })

      this.artists = [...this.artists]
      this.showToast(`✅ Removed from ${artistNameToRemove}`, 'success')
    },

    openLightbox(work, startIndex = 0) {
      const images = [
        this.getImageUrl(work.code, 'pl')
      ]

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

    openEditWorkModal(work) {
      this.editingWork = { code: work.code, newCode: work.code }
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

      if (work.additionalArtists) {
        work.additionalArtists = work.additionalArtists.filter(name => name !== this.moveWorkData.sourceArtist)
        if (!work.additionalArtists.includes(this.moveWorkData.targetArtist)) {
          work.additionalArtists.push(this.moveWorkData.targetArtist)
        }
      } else {
        work.additionalArtists = []
      }

      if (!targetArtist[type]) targetArtist[type] = []
      targetArtist[type].push(work)

      this.artists.forEach(artist => {
        const allWorks = [...(artist.mainWorks || []), ...(artist.compilations || [])]
        allWorks.forEach(w => {
          if (w.code === work.code) {
            if (w.additionalArtists) {
              w.additionalArtists = w.additionalArtists.filter(name => name !== this.moveWorkData.sourceArtist)
              if (!w.additionalArtists.includes(this.moveWorkData.targetArtist)) {
                w.additionalArtists.push(this.moveWorkData.targetArtist)
              }
            }
          }
        })
      })

      this.artists = [...this.artists]
      this.closeMoveWorkModal()
      this.backToWorks()
      this.showToast(`✅ Moved ${this.moveWorkData.code} to ${this.moveWorkData.targetArtist}`, 'success')
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
        work.code = newCode
        this.currentWork.code = newCode
        this.artists = [...this.artists]
        this.closeEditWorkModal()
        this.showToast(`✅ Updated to ${newCode}`, 'success')
      }
    },
    getRandomArtistWork(artist) {
      const allWorks = [...(artist.mainWorks || []), ...(artist.compilations || [])]
      if (allWorks.length === 0) return null
      return allWorks[Math.floor(Math.random() * allWorks.length)]
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
    showToast(msg, type = 'success') {
      this.toast = { show: true, message: msg, type }
      setTimeout(() => this.toast.show = false, 3000)
    },
    handleExport() {
      try {
        const date = new Date().toISOString().split('T')[0]
        const data = {
          timestamp: new Date().toISOString(),
          version: '3.0',
          totalWorks: this.totalCount,
          artists: this.artists,
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
            photo: a.photo || '',
            mainWorks: Array.isArray(a.mainWorks) ? a.mainWorks.filter(w => w && w.code) : [],
            compilations: Array.isArray(a.compilations) ? a.compilations.filter(w => w && w.code) : []
          }))

          if (validArtists.length === 0) throw new Error('No valid artists found')

          this.artists = normalizeArtists(validArtists)

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
      this.newWork = { artist: this.activeTab || '', code: '', type: 'mainWorks' }
      this.showAddWorkModal = true
    },
    closeAddWorkModal() { this.showAddWorkModal = false },
    openAddArtistModal() {
      this.newArtist = { name: '', photo: '' }
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
      artist[this.newWork.type].push({ code })
      this.artists = [...this.artists]
      this.closeAddWorkModal()
      this.showToast(`✅ Added ${code}`, 'success')
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

    removeCustomImage(code) {
      if (confirm(`Remove custom image for ${code}?`)) {
        const newCustomImages = { ...this.customImages }
        delete newCustomImages[code]
        this.customImages = newCustomImages
        this.showToast(`Removed custom image for ${code}`, 'success')

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

/* Content Wrapper */
.content-wrapper {
  position: relative;
  min-height: calc(100vh - 120px);
}

.view-page {
  width: 100%;
  min-height: 400px;
}

/* Sort Bar */
.sort-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  padding: 16px 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.sort-bar label {
  font-weight: 600;
  color: #333;
  font-size: 1rem;
}

.sort-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.sort-btn {
  padding: 8px 16px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
}

.sort-btn:hover {
  border-color: #2196F3;
  color: #2196F3;
  background: rgba(33, 150, 243, 0.05);
}

.sort-btn.active {
  border-color: #2196F3;
  background: #2196F3;
  color: white;
  font-weight: 600;
}

/* Additional Artists Section */
.additional-artists {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
}

.additional-artists label {
  display: block;
  font-weight: 600;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 12px;
}

.artist-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.artist-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: white;
  border: 2px solid #2196F3;
  border-radius: 20px;
  color: #2196F3;
  font-size: 0.9rem;
  font-weight: 500;
}

.chip-remove {
  background: none;
  border: none;
  color: #f44336;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.chip-remove:hover {
  background: rgba(244, 67, 54, 0.1);
}

.action-btn.add-artist {
  background: #9C27B0;
}

.action-btn.add-artist:hover {
  background: #7B1FA2;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e0e0e0;
  gap: 20px;
}

.page-title {
  flex: 1;
  text-align: center;
}

.page-title h2 {
  margin: 0 0 4px 0;
  font-size: 2rem;
  color: #333;
}

.page-title p {
  margin: 0;
  color: #666;
  font-size: 1rem;
}

.back-btn {
  background: #666;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  white-space: nowrap;
}

.back-btn:hover {
  background: #555;
  transform: translateX(-4px);
}

.add-work-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  white-space: nowrap;
}

.add-work-btn:hover {
  background: #45a049;
}

.work-nav-buttons {
  display: flex;
  gap: 12px;
}

.nav-btn {
  background: #2196F3;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: #1976D2;
}

.nav-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Works Section */
.works-section {
  margin-bottom: 48px;
}

.works-section h3 {
  font-size: 1.5rem;
  margin: 0 0 20px 0;
  color: #333;
}

/* Work Detail Content */
.work-detail-content {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 32px;
}

@media (max-width: 1200px) {
  .work-detail-content {
    grid-template-columns: 1fr;
  }
}

.work-detail-left {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.work-cover-container {
  position: relative;
  width: 100%;
  aspect-ratio: 3/2;
  border-radius: 12px;
  overflow: hidden;
  background: #1a1a1a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.work-cover-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: pointer;
  transition: transform 0.3s;
}

.work-cover-image:hover {
  transform: scale(1.05);
}

.cover-click-hint {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  text-align: center;
  padding: 8px;
  font-size: 0.85rem;
  opacity: 0;
  transition: opacity 0.3s;
}

.work-cover-container:hover .cover-click-hint {
  opacity: 1;
}

.image-source-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #4CAF50;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: bold;
  z-index: 10;
}

.work-info-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.work-title {
  font-size: 1.75rem;
  margin: 0 0 20px 0;
  cursor: pointer;
  user-select: all;
  color: #333;
}

.work-title:hover {
  color: #2196F3;
}

.typo-warning {
  color: #ff9800;
  font-size: 1.2rem;
  margin-left: 8px;
}

.work-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.work-actions .action-btn:nth-child(5) {
  grid-column: 1 / -1;
}

.action-btn {
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s;
  color: white;
}

.action-btn.edit {
  background: #4CAF50;
}

.action-btn.edit:hover {
  background: #45a049;
}

.action-btn.move {
  background: #FF9800;
}

.action-btn.move:hover {
  background: #F57C00;
}

.action-btn.upload {
  background: #2196F3;
}

.action-btn.upload:hover {
  background: #1976D2;
}

.action-btn.remove {
  background: #f44336;
}

.action-btn.remove:hover {
  background: #d32f2f;
}

.external-links {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.ext-btn {
  padding: 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;
  color: white;
}

.ext-btn.njav {
  background: #9C27B0;
}

.ext-btn.njav:hover {
  background: #7B1FA2;
}

.ext-btn.missav {
  background: #E91E63;
}

.ext-btn.missav:hover {
  background: #C2185B;
}

.work-detail-right {
  min-height: 400px;
}

.gallery-title {
  font-size: 1.5rem;
  margin: 0 0 20px 0;
  color: #333;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.gallery-item {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: #1a1a1a;
  transition: transform 0.2s, box-shadow 0.2s;
}

.gallery-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.gallery-item img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: opacity 0.3s;
  background: #000;
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

.modal {
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
}

.modal-box {
  background: white;
  padding: 32px;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  z-index: 9001;
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
  z-index: 11000;
}

.lightbox-content {
  max-width: 90vw;
  max-height: 90vh;
  position: relative;
  z-index: 11001;
}

.lightbox-content img {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
}

.lightbox-close,
.lightbox-nav {
  position: fixed;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 11002;
  transition: background 0.2s;
}

.lightbox-close {
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  font-size: 1.5rem;
}

.lightbox-close:hover {
  background: rgba(255, 0, 0, 0.8);
}

.lightbox-nav {
  top: 50%;
  transform: translateY(-50%);
  width: 50px;
  height: 50px;
  font-size: 2rem;
}

.lightbox-nav:hover {
  background: rgba(0, 0, 0, 0.8);
}

.lightbox-prev {
  left: 20px;
}

.lightbox-next {
  right: 20px;
}

.lightbox-info {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  display: flex;
  gap: 20px;
  align-items: center;
}

.lightbox-code {
  font-weight: bold;
  font-size: 1.1rem;
}

.lightbox-counter {
  font-size: 0.95rem;
  opacity: 0.9;
}

.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #4CAF50;
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 10500;
  font-weight: 500;
}

.toast.error {
  background: #f44336;
}

.toast.info {
  background: #2196F3;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>