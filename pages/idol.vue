<!-- pages/works.vue -->
<template>
  <div :class="['works-container', { 'dark-mode': darkMode }]">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <h1>🎬 Works Tracker</h1>
          <p class="subtitle">Manage and track your collection</p>
        </div>
        <div class="header-controls">
          <button @click="autoFillImages" class="icon-btn auto-fill-btn" title="Auto-fill missing images">
            🖼️
          </button>
          <button @click="openAddModal" class="icon-btn add-btn" title="Add new item">
            ➕
          </button>
          <button @click="toggleDarkMode" class="icon-btn theme-btn" :title="darkMode ? 'Light Mode' : 'Dark Mode'">
            {{ darkMode ? '☀️' : '🌙' }}
          </button>
        </div>
      </div>

      <!-- Main Controls -->
      <div class="controls-wrapper">
        <div class="search-wrapper">
          <span class="search-icon">🔍</span>
          <input v-model="searchQuery" type="text" placeholder="Search by code or name..." class="search-input" />
        </div>

        <div class="quality-selector">
          <label for="quality-select">Image Quality:</label>
          <select v-model="imageQuality" id="quality-select" class="quality-select">
            <option value="pl">Small (pl)</option>
            <option value="ps">Medium (ps)</option>
            <option value="jp-1">Large (jp-1)</option>
          </select>
        </div>

        <div class="button-group">
          <button @click="handleExport" :disabled="selectedCodes.length === 0" class="btn btn-primary">
            📥 JSON
          </button>
          <button @click="handleExportCSV" :disabled="selectedCodes.length === 0" class="btn btn-primary">
            📊 CSV
          </button>
          <button @click="handleImportClick" class="btn btn-success">
            📤 Import
          </button>
          <button v-if="selectedCodes.length > 0" @click="clearAll" class="btn btn-danger">
            🗑️ Clear
          </button>
          <input ref="fileInput" type="file" accept=".json,.csv" @change="handleImport" class="hidden-input" />
        </div>
      </div>

      <!-- Selected Tags -->
      <div v-if="selectedCodes.length > 0" class="selected-tags-wrapper">
        <p class="tags-label">Selected: {{ selectedCodes.length }} items</p>
        <div class="code-tags">
          <span v-for="code in selectedCodes" :key="code" class="code-tag">
            {{ code }}
            <button @click="removeCode(code)" class="tag-remove">
              ✕
            </button>
          </span>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-wrapper">
        <div class="progress-info">
          <span class="progress-text">Progress</span>
          <span class="progress-percent">{{ selectedCodes.length }} / {{ totalCount }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }" />
        </div>
        <span class="progress-percentage">{{ progressPercentage }}%</span>
      </div>

      <!-- Artists List -->
      <div class="artists-list">
        <div v-for="artist in filteredArtists" :key="artist.name" class="artist-card">
          <div class="artist-header-info">
            <h2 class="artist-name">{{ artist.name }}</h2>
            <p class="artist-period">{{ artist.period }}</p>
            <p class="artist-count">{{ (artist.mainWorks?.length || 0) + (artist.compilations?.length || 0) }} works</p>
          </div>

          <!-- Main Works -->
          <div v-if="artist.mainWorks && artist.mainWorks.length > 0" class="works-section">
            <h3 class="section-title">📌 Main Works</h3>
            <div class="works-grid">
              <div v-for="work in artist.mainWorks" :key="work.code"
                :class="['work-card', { 'work-card-selected': selectedCodes.includes(work.code) }]">
                <template v-if="work.imageUrl">
                  <div class="work-image-large" @click.stop="openSampleViewer(work, artist.name)">
                    <img :src="work.imageUrl" :alt="work.code" class="work-img" onerror="this.style.display='none'">
                  </div>
                </template>
                <template v-else>
                  <div class="work-image-large work-image-placeholder"
                    @click.stop="openSampleViewer(work, artist.name)">
                    <span>📷</span>
                  </div>
                </template>
                <div class="work-card-overlay">
                  <button @click.stop="openVideoPreview(work, artist.name)" class="preview-btn" title="Preview video">
                    ▶️
                  </button>
                  <button @click.stop="openEditModal(work, artist.name)" class="edit-btn" title="Edit item">
                    ✏️
                  </button>
                </div>
                <div class="work-card-content">
                  <div class="work-checkbox">
                    <input type="checkbox" :checked="selectedCodes.includes(work.code)"
                      @change="toggleCode(work.code)" />
                  </div>
                  <div class="work-info">
                    <p class="work-code">{{ work.code }}</p>
                    <p class="work-name">{{ work.name }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Compilations -->
          <div v-if="artist.compilations && artist.compilations.length > 0" class="works-section">
            <h3 class="section-title">📂 Compilations</h3>
            <div class="works-grid">
              <div v-for="work in artist.compilations" :key="work.code"
                :class="['work-card', { 'work-card-selected': selectedCodes.includes(work.code) }]">
                <template v-if="work.imageUrl">
                  <div class="work-image-large" @click.stop="openSampleViewer(work, artist.name)">
                    <img :src="work.imageUrl" :alt="work.code" class="work-img" onerror="this.style.display='none'">
                  </div>
                </template>
                <template v-else>
                  <div class="work-image-large work-image-placeholder"
                    @click.stop="openSampleViewer(work, artist.name)">
                    <span>📷</span>
                  </div>
                </template>
                <div class="work-card-overlay">
                  <button @click.stop="openVideoPreview(work, artist.name)" class="preview-btn" title="Preview video">
                    ▶️
                  </button>
                  <button @click.stop="openEditModal(work, artist.name)" class="edit-btn" title="Edit item">
                    ✏️
                  </button>
                </div>
                <div class="work-card-content">
                  <div class="work-checkbox">
                    <input type="checkbox" :checked="selectedCodes.includes(work.code)"
                      @change="toggleCode(work.code)" />
                  </div>
                  <div class="work-info">
                    <p class="work-code">{{ work.code }}</p>
                    <p class="work-name">{{ work.name }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredArtists.length === 0" class="empty-state">
        <p>❌ No results found</p>
        <p class="empty-text">Try adjusting your search</p>
      </div>
    </div>

    <!-- Toast Notification -->
    <transition name="toast">
      <div v-if="toast.show" :class="['toast', `toast-${toast.type}`]">
        {{ toast.message }}
      </div>
    </transition>

    <!-- Clear Modal -->
    <transition name="modal">
      <div v-if="showConfirmModal" class="modal-overlay" @click="showConfirmModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Clear All Selections?</h3>
          </div>
          <div class="modal-body">
            <p>This will remove all <strong>{{ selectedCodes.length }}</strong> selected items.</p>
            <p class="warning">⚠️ This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button @click="showConfirmModal = false" class="btn btn-secondary">Cancel</button>
            <button @click="confirmClearAll" class="btn btn-danger">Clear All</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Add Item Modal -->
    <transition name="modal">
      <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
        <div class="modal-content modal-compact" @click.stop>
          <div class="modal-header">
            <h3>➕ Add New Item</h3>
            <button @click="closeAddModal" class="modal-close">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Artist</label>
              <select v-model="newItem.artist" class="form-input">
                <option value="">-- Select Artist --</option>
                <option v-for="artist in artists" :key="artist.name" :value="artist.name">
                  {{ artist.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Code</label>
              <input v-model="newItem.code" type="text" placeholder="e.g., SSIS-001" class="form-input"
                @keyup.enter="addNewItem" />
            </div>

            <div class="form-group">
              <label>Image URL (optional - will auto-generate if empty)</label>
              <input v-model="newItem.imageUrl" type="url" placeholder="https://example.com/image.jpg"
                class="form-input" />
              <div v-if="newItem.imageUrl" class="image-preview">
                <img :src="newItem.imageUrl" alt="Preview" @error="imageError = true">
                <span v-if="imageError" class="image-error">❌ Image failed to load</span>
              </div>
            </div>

            <div class="form-group">
              <label>Type</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input v-model="newItem.type" type="radio" value="mainWorks" />
                  📌 Main Works
                </label>
                <label class="radio-label">
                  <input v-model="newItem.type" type="radio" value="compilations" />
                  📂 Compilations
                </label>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closeAddModal" class="btn btn-secondary">Cancel</button>
            <button @click="addNewItem" class="btn btn-primary">Add Item</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Edit Item Modal -->
    <transition name="modal">
      <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
        <div class="modal-content modal-compact" @click.stop>
          <div class="modal-header">
            <h3>✏️ Edit Item</h3>
            <button @click="closeEditModal" class="modal-close">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Code</label>
              <input v-model="editItem.code" type="text" class="form-input" disabled />
            </div>

            <div class="form-group">
              <label>Image URL</label>
              <input v-model="editItem.imageUrl" type="url" placeholder="https://example.com/image.jpg"
                class="form-input" />
              <div v-if="editItem.imageUrl" class="image-preview">
                <img :src="editItem.imageUrl" alt="Preview" @error="editImageError = true">
                <span v-if="editImageError" class="image-error">❌ Image failed to load</span>
              </div>
              <button @click="autoGenerateEditImage" class="btn btn-secondary" style="margin-top: 10px; width: 100%;">
                🖼️ Auto-Generate Image URL
              </button>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closeEditModal" class="btn btn-secondary">Cancel</button>
            <button @click="saveEditedItem" class="btn btn-primary">Save Changes</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Sample Images Slideshow Modal -->
    <transition name="modal">
      <div v-if="showSampleModal" class="modal-overlay" @click="closeSampleViewer">
        <div class="modal-content modal-slideshow" @click.stop>
          <div class="modal-header">
            <div>
              <h3>📸 Sample Images</h3>
              <p class="sample-modal-subtitle">
                {{ currentSampleCode }} - {{ currentSampleArtist }}
                <span class="slide-counter">({{ currentSlideIndex + 1 }} / {{ sampleImages.length }})</span>
              </p>
            </div>
            <button @click="closeSampleViewer" class="modal-close">✕</button>
          </div>

          <div class="slideshow-container">
            <!-- Previous Button -->
            <button @click="prevSlide" class="slide-nav slide-prev" title="Previous (←)">
              ❮
            </button>

            <!-- Main Slide Image -->
            <div class="slide-main">
              <div v-for="(sample, index) in sampleImages" :key="index"
                :class="['slide-item', { active: index === currentSlideIndex }]">
                <div class="slide-image-wrapper">
                  <img :src="sample.url" :alt="sample.label" class="slide-image"
                    @error="$event.target.parentElement.classList.add('image-failed')"
                    @load="$event.target.parentElement.classList.add('image-loaded')" />
                  <div class="slide-loading">Loading...</div>
                  <div class="slide-error">❌ Image not available</div>
                </div>
                <p class="slide-label">{{ sample.label }}</p>
              </div>
            </div>

            <!-- Next Button -->
            <button @click="nextSlide" class="slide-nav slide-next" title="Next (→)">
              ❯
            </button>
          </div>

          <!-- Thumbnail Navigation -->
          <div class="slide-thumbnails">
            <div v-for="(sample, index) in sampleImages" :key="index"
              :class="['thumbnail-item', { active: index === currentSlideIndex }]" @click="goToSlide(index)"
              :title="sample.label">
              <img :src="sample.url" :alt="sample.label" class="thumbnail-img" />
              <span class="thumbnail-number">{{ index + 1 }}</span>
            </div>
          </div>

          <div class="modal-footer">
            <div class="slideshow-info">
              Use ← → arrow keys or click thumbnails to navigate
            </div>
            <button @click="closeSampleViewer" class="btn btn-secondary">Close (Esc)</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Video Preview Modal -->
    <transition name="modal">
      <div v-if="showVideoModal" class="modal-overlay" @click="closeVideoPreview">
        <div class="modal-content modal-video" @click.stop>
          <div class="modal-header">
            <div>
              <h3>🎬 Video Preview</h3>
              <p class="sample-modal-subtitle">
                {{ currentVideoCode }} - {{ currentVideoArtist }}
              </p>
            </div>
            <button @click="closeVideoPreview" class="modal-close">✕</button>
          </div>

          <div class="video-container">
            <div v-if="videoLoading" class="video-loading">
              <span>⏳ Loading video...</span>
            </div>

            <div v-if="videoError" class="video-error">
              <span>❌ Video not available</span>
              <p>This preview video may not exist or is unavailable.</p>
            </div>

            <video v-show="!videoLoading && !videoError" :src="videoUrl" controls autoplay
              @loadeddata="handleVideoLoaded" @error="handleVideoError" class="video-player">
              Your browser does not support the video tag.
            </video>
          </div>

          <div class="modal-footer">
            <button @click="closeVideoPreview" class="btn btn-secondary">Close (Esc)</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'Works',
  data() {
    return {
      searchQuery: '',
      selectedCodes: [],
      darkMode: false,
      showConfirmModal: false,
      showAddModal: false,
      showEditModal: false,
      showSampleModal: false,
      showVideoModal: false,
      currentSampleCode: null,
      currentSampleArtist: null,
      currentVideoCode: null,
      currentVideoArtist: null,
      sampleImages: [],
      currentSlideIndex: 0,
      videoUrl: null,
      videoLoading: false,
      videoError: false,
      newItem: {
        artist: '',
        code: '',
        name: '',
        type: 'mainWorks',
        imageUrl: ''
      },
      editItem: {
        code: '',
        imageUrl: '',
        artist: ''
      },
      imageError: false,
      editImageError: false,
      searchTimeout: null,
      imageQuality: 'ps',
      toast: {
        show: false,
        message: '',
        type: 'success'
      },
      artists: [
        {
          name: 'Minato Haru',
          period: '2019–2022 (25–28)',
          mainWorks: [
            { code: 'SONE-978', name: '', imageUrl: 'https://pics.dmm.co.jp/digital/video/sone00978/sone00978pl.jpg' },
            { code: 'SONE-914', name: 'Minato Haru', imageUrl: 'https://pics.dmm.co.jp/digital/video/sone00914/sone00914pl.jpg' },
            { code: 'SONE-865', name: 'Minato Haru', imageUrl: 'https://pics.dmm.co.jp/digital/video/sone00865/sone00865pl.jpg' },
            { code: 'MIRD-259', name: 'Minato Haru', imageUrl: 'https://pics.dmm.co.jp/digital/video/mird00259/mird00259pl.jpg' },
            { code: 'OFES-013', name: 'Minato Haru', imageUrl: 'https://pics.dmm.co.jp/digital/video/ofes00013/ofes00013pl.jpg' },
            { code: 'SONE-776', name: 'Minato Haru', imageUrl: 'https://pics.dmm.co.jp/digital/video/sone00776/sone00776pl.jpg' },
            { code: 'SONE-508', name: 'Minato Haru', imageUrl: 'https://pics.dmm.co.jp/digital/video/sone00508/sone00508pl.jpg' },
            { code: 'FWAY-060', name: 'Minato Haru', imageUrl: 'https://pics.dmm.co.jp/digital/video/fway00060/fway00060pl.jpg' },
            { code: 'SONE-503', name: 'Minato Haru', imageUrl: 'https://pics.dmm.co.jp/digital/video/sone00503/sone00503pl.jpg' },
            { code: 'SONE-155', name: 'Minato Haru', imageUrl: 'https://pics.dmm.co.jp/digital/video/sone00155/sone00155pl.jpg' },
            { code: 'SONE-188', name: 'Minato Haru', imageUrl: 'https://pics.dmm.co.jp/digital/video/sone00188/sone00188pl.jpg' },
            { code: 'SONE-063', name: 'Minato Haru', imageUrl: 'https://pics.dmm.co.jp/digital/video/sone00063/sone00063pl.jpg' },
            { code: 'SONE-021', name: 'Minato Haru', imageUrl: 'https://pics.dmm.co.jp/digital/video/sone00021/sone00021pl.jpg' },
            { code: 'SSIS-978', name: 'Minato Haru', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssis00978/ssis00978pl.jpg' },
            { code: 'FWAY-002', name: 'Minato Haru', imageUrl: 'https://pics.dmm.co.jp/digital/video/fway00002/fway00002pl.jpg' },
            { code: 'SSIS-945', name: 'Minato Haru', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssis00945/ssis00945pl.jpg' },
            { code: 'SSIS-890', name: 'Minato Haru', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssis00890/ssis00890pl.jpg' },
            { code: 'SSIS-889', name: 'Minato Haru', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssis00889/ssis00889pl.jpg' },

          ],
        },
        {
          name: 'Moa Maeda',
          period: '2019–2022 (25–28)',
          mainWorks: [
            { code: 'ADN-334', name: 'Moa Maeda', imageUrl: 'https://pics.dmm.co.jp/digital/video/adn00334/adn00334pl.jpg' },
            { code: 'MIMK-091', name: 'Moa Maeda', imageUrl: 'https://pics.dmm.co.jp/digital/video/mimk00091/mimk00091pl.jpg' },
            { code: 'JUFE-300', name: 'Moa Maeda', imageUrl: 'https://pics.dmm.co.jp/digital/video/jufe00300/jufe00300pl.jpg' },
            { code: 'WAAA-065', name: 'Moa Maeda', imageUrl: 'https://pics.dmm.co.jp/digital/video/waaa00065/waaa00065pl.jpg' },
            { code: 'HND-991', name: 'Moa Maeda', imageUrl: 'https://pics.dmm.co.jp/digital/video/hnd00991/hnd00991pl.jpg' },
            { code: 'PPPD-926', name: 'Moa Maeda', imageUrl: 'https://pics.dmm.co.jp/digital/video/pppd00926/pppd00926pl.jpg' },
            { code: 'MSFH-034', name: 'Moa Maeda', imageUrl: 'https://pics.dmm.co.jp/digital/video/msfh00034/msfh00034pl.jpg' },
            { code: 'MSFH-030', name: 'Moa Maeda', imageUrl: 'https://pics.dmm.co.jp/digital/video/msfh00030/msfh00030pl.jpg' },
            { code: 'MSFH-024', name: 'Moa Maeda', imageUrl: 'https://pics.dmm.co.jp/digital/video/msfh00024/msfh00024pl.jpg' },
            { code: 'MSFH-018', name: 'Moa Maeda', imageUrl: 'https://pics.dmm.co.jp/digital/video/msfh00018/msfh00018pl.jpg' },
            { code: 'MSFH-014', name: 'Moa Maeda', imageUrl: 'https://pics.dmm.co.jp/digital/video/msfh00014/msfh00014pl.jpg' },
            { code: 'MSFH-010', name: 'Moa Maeda', imageUrl: 'https://pics.dmm.co.jp/digital/video/msfh00010/msfh00010pl.jpg' },

          ],
        },
        {
          name: 'Mitsuki Momota (百田光稀)',
          period: '2019–2022 (25–28)',
          mainWorks: [
            { code: 'MIDA-424', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/mida00424/mida00424pl.jpg' },
            { code: 'MIDA-026', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/mida00026/mida00026pl.jpg' },
            { code: 'REBD-854', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://awsimgsrc.dmm.co.jp/pics_dig/digital/video/h_346rebd00854/h_346rebd00854pl.jpg' },
            { code: 'OAE-253', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/oae00253/oae00253pl.jpg' },
            { code: 'FWAY-047', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/fway00047/fway00047pl.jpg' },
            { code: 'MIDV-869', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/midv00869/midv00869pl.jpg' },
            { code: 'MIDV-569', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/midv00569/midv00569pl.jpg' },
            { code: 'MIDA-346', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/mida00346/mida00346pl.jpg' },
            { code: 'MIDV-668', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/midv00668/midv00668pl.jpg' },
            { code: 'MIDV-831', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/midv00831/midv00831pl.jpg' },
            { code: 'MIDV-574', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/midv00574/midv00574pl.jpg' },
            { code: 'MIDV-577', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/midv00577/midv00577pl.jpg' },
            { code: 'MIDA-102', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/mida00102/mida00102pl.jpg' },
            { code: 'MIDA-190', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/mida00190/mida00190pl.jpg' },
            { code: 'MIDV-985', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/midv00985/midv00985pl.jpg' },
            { code: 'MIDV-637', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/midv00637/midv00637pl.jpg' },
            { code: 'MIDA-305', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/mida00305/mida00305pl.jpg' },
            { code: 'MIDA-139', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/mida00139/mida00139pl.jpg' },
            { code: 'MIDA-258', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/mida00258/mida00258pl.jpg' },
            { code: 'MIDV-769', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/midv00769/midv00769pl.jpg' },
            { code: 'MDVR-325', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/mdvr00325/mdvr00325pl.jpg' },
            { code: 'MIDV-905', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/midv00905/midv00905pl.jpg' },
            { code: 'MIDV-804', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/midv00804/midv00804pl.jpg' },
            { code: 'MIDA-214', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/mida00214/mida00214pl.jpg' },
            { code: 'MIDA-026', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/mida00026/mida00026pl.jpg' },
            { code: 'MIDA-064', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/mida00064/mida00064pl.jpg' },
            { code: 'MDVR-317', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/mdvr00317/mdvr00317pl.jpg' },
            { code: 'MDVR-288', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/mdvr00288/mdvr00288pl.jpg' },
            { code: 'MIDA-385', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/mida00385/mida00385pl.jpg' },
            { code: 'NAAC-032', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://awsimgsrc.dmm.co.jp/pics_dig/digital/video/h_706naac00032b/h_706naac00032bpl.jpg' },
            { code: 'MIDV-698', name: 'Mitsuki Momota (百田光稀)', imageUrl: 'https://pics.dmm.co.jp/digital/video/midv00698/midv00698pl.jpg' },

          ],
          compilations: [
            { code: 'OFJE-279', name: 'Anzai Rara (安斎らら)', imageUrl: 'https://pics.dmm.co.jp/digital/video/ofje00279/ofje00279pl.jpg' },

          ]
        },
        {
          name: 'Anzai Rara (安斎らら)',
          period: '2019–2022 (25–28)',
          mainWorks: [
            { code: 'SSIS-025', name: 'Anzai Rara (安斎らら)', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssis00025/ssis00025pl.jpg' },
            { code: 'SSIS-050', name: 'Anzai Rara (安斎らら)', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssis00050/ssis00050pl.jpg' },
            { code: 'SSIS-103', name: 'Anzai Rara (安斎らら)', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssis00103/ssis00103pl.jpg' },
            { code: 'SSIS-124', name: 'Anzai Rara (安斎らら)', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssis00124/ssis00124pl.jpg' },
            { code: 'SSIS-136', name: 'Anzai Rara (安斎らら)', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssis00136/ssis00136pl.jpg' },
            { code: 'SSIS-172', name: 'Anzai Rara (安斎らら)', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssis00172/ssis00172pl.jpg' },
            { code: 'SSIS-203', name: 'Anzai Rara (安斎らら)', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssis00203/ssis00203pl.jpg' },
            { code: 'SSIS-232', name: 'Anzai Rara (安斎らら)', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssis00232/ssis00232pl.jpg' },
            { code: 'SSIS-262', name: 'Anzai Rara (安斎らら)', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssis00262/ssis00262pl.jpg' },
            { code: 'SSIS-269', name: 'Anzai Rara (安斎らら)', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssis00269/ssis00269pl.jpg' },
            { code: 'SSIS-357', name: 'Anzai Rara (安斎らら)', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssis00357/ssis00357pl.jpg' },
            { code: 'SSNI-643', name: 'Anzai Rara (安斎らら)', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssni00643/ssni00643pl.jpg' },
            { code: 'SSNI-671', name: 'Anzai Rara (安斎らら)', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssni00671/ssni00671pl.jpg' },
            { code: 'SSNI-700', name: 'Anzai Rara (安斎らら)', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssni00700/ssni00700pl.jpg' },
            { code: 'SSNI-727', name: 'Anzai Rara (安斎らら)', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssni00727/ssni00727pl.jpg' },
            { code: 'SSNI-752', name: 'Anzai Rara (安斎らら)', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssni00752/ssni00752pl.jpg' },
            { code: 'SSNI-777', name: 'Anzai Rara (安斎らら)', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssni00777/ssni00777pl.jpg' },
            { code: 'SSNI-799', name: 'Anzai Rara (安斎らら)', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssni00799/ssni00799pl.jpg' },
            { code: 'SSNI-822', name: 'Anzai Rara (安斎らら)', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssni00822/ssni00822pl.jpg' }
          ],
          compilations: [
            { code: 'OFJE-279', name: 'Anzai Rara (安斎らら)', imageUrl: 'https://pics.dmm.co.jp/digital/video/ofje00279/ofje00279pl.jpg' },
            { code: 'OFJE-288', name: 'Anzai Rara (安斎らら)', imageUrl: 'https://pics.dmm.co.jp/digital/video/ofje00288/ofje00288pl.jpg' },
            { code: 'OFJE-354', name: 'Anzai Rara (安斎らら)', imageUrl: 'https://pics.dmm.co.jp/digital/video/ofje00354/ofje00354pl.jpg' },
            { code: 'OFJE-410', name: 'Anzai Rara (安斎らら)', imageUrl: 'https://pics.dmm.co.jp/digital/video/ofje00410/ofje00410pl.jpg' }
          ]
        },
        {
          name: 'RION',
          period: '2015–2018 (21–24)',
          mainWorks: [
            { code: 'SNIS-517', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00517/snis00517pl.jpg' },
            { code: 'SNIS-539', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00539/snis00539pl.jpg' },
            { code: 'SNIS-561', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00561/snis00561pl.jpg' },
            { code: 'SNIS-594', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00594/snis00594pl.jpg' },
            { code: 'SNIS-603', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00603/snis00603pl.jpg' },
            { code: 'SNIS-623', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00623/snis00623pl.jpg' },
            { code: 'SNIS-640', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00640/snis00640pl.jpg' },
            { code: 'SNIS-656', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00656/snis00656pl.jpg' },
            { code: 'SNIS-673', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00673/snis00673pl.jpg' },
            { code: 'SNIS-692', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00692/snis00692pl.jpg' },
            { code: 'SNIS-712', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00712/snis00712pl.jpg' },
            { code: 'SNIS-731', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00731/snis00731pl.jpg' },
            { code: 'SNIS-752', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00752/snis00752pl.jpg' },
            { code: 'SNIS-774', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00774/snis00774pl.jpg' },
            { code: 'SNIS-787', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00787/snis00787pl.jpg' },
            { code: 'SNIS-811', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00811/snis00811pl.jpg' },
            { code: 'SNIS-824', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00824/snis00824pl.jpg' },
            { code: 'SNIS-895', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00895/snis00895pl.jpg' },
            { code: 'SNIS-918', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00918/snis00918pl.jpg' },
            { code: 'SNIS-939', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00939/snis00939pl.jpg' },
            { code: 'SNIS-963', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00963/snis00963pl.jpg' },
            { code: 'SNIS-985', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00985/snis00985pl.jpg' },
            { code: 'SSNI-008', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssni00008/ssni00008pl.jpg' },
            { code: 'SSNI-029', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssni00029/ssni00029pl.jpg' },
            { code: 'SSNI-053', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssni00053/ssni00053pl.jpg' },
            { code: 'SSNI-100', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssni00100/ssni00100pl.jpg' },
            { code: 'SSNI-126', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssni00126/ssni00126pl.jpg' },
            { code: 'SSNI-151', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssni00151/ssni00151pl.jpg' },
            { code: 'SSNI-177', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssni00177/ssni00177pl.jpg' },
            { code: 'SSNI-204', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssni00204/ssni00204pl.jpg' },
            { code: 'SSNI-228', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssni00228/ssni00228pl.jpg' },
            { code: 'SSNI-241', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssni00241/ssni00241pl.jpg' },
            { code: 'SSNI-268', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssni00268/ssni00268pl.jpg' },
            { code: 'SSNI-290', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/ssni00290/ssni00290pl.jpg' },
            { code: 'EBOD-609', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/ebod00609/ebod00609pl.jpg' }
          ],
          compilations: [
            { code: 'OFJE-104', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/ofje00104/ofje00104pl.jpg' },
            { code: 'OFJE-144', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/ofje00144/ofje00144pl.jpg' },
            { code: 'OFJE-255', name: 'RION', imageUrl: 'https://pics.dmm.co.jp/digital/video/ofje00255/ofje00255pl.jpg' }
          ]
        },
        {
          name: 'Utsunomiya Shion (宇都宮しをん)',
          period: '2013–2014 (19–20)',
          mainWorks: [
            { code: 'SOE-992', name: 'Utsunomiya Shion (宇都宮しをん)', imageUrl: 'https://pics.dmm.co.jp/digital/video/soe00992/soe00992pl.jpg' },
            { code: 'SNIS-009', name: 'Utsunomiya Shion (宇都宮しをん)', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00009/snis00009pl.jpg' },
            { code: 'SNIS-027', name: 'Utsunomiya Shion (宇都宮しをん)', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00027/snis00027pl.jpg' },
            { code: 'SNIS-048', name: 'Utsunomiya Shion (宇都宮しをん)', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00048/snis00048pl.jpg' },
            { code: 'SNIS-070', name: 'Utsunomiya Shion (宇都宮しをん)', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00070/snis00070pl.jpg' },
            { code: 'SNIS-091', name: 'Utsunomiya Shion (宇都宮しをん)', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00091/snis00091pl.jpg' },
            { code: 'SNIS-110', name: 'Utsunomiya Shion (宇都宮しをん)', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00110/snis00110pl.jpg' },
            { code: 'SNIS-129', name: 'Utsunomiya Shion (宇都宮しをん)', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00129/snis00129pl.jpg' },
            { code: 'SNIS-147', name: 'Utsunomiya Shion (宇都宮しをん)', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00147/snis00147pl.jpg' },
            { code: 'SNIS-166', name: 'Utsunomiya Shion (宇都宮しをん)', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00166/snis00166pl.jpg' },
            { code: 'AVOP-004', name: 'Utsunomiya Shion (宇都宮しをん)', imageUrl: 'https://pics.dmm.co.jp/digital/video/avop00004/avop00004pl.jpg' },
            { code: 'SNIS-205', name: 'Utsunomiya Shion (宇都宮しをん)', imageUrl: 'https://pics.dmm.co.jp/digital/video/snis00205/snis00205pl.jpg' }
          ],
          compilations: [
            { code: 'ONSD-850', name: 'Utsunomiya Shion (宇都宮しをん)', imageUrl: 'https://pics.dmm.co.jp/digital/video/onsd00850/onsd00850pl.jpg' },
            { code: 'ONSD-899', name: 'Utsunomiya Shion (宇都宮しをん)', imageUrl: 'https://pics.dmm.co.jp/digital/video/onsd00899/onsd00899pl.jpg' }
          ]
        },
        {
          name: 'Hitomi Tanaka',
          period: '2013–2014 (19–20)',
          mainWorks: [
            { code: 'MIMK-007', name: 'Hitomi Tanaka', imageUrl: 'https://pics.dmm.co.jp/digital/video/mimk00007/mimk00007pl.jpg' },
          ],

        }
      ]
    }
  },
  computed: {
    totalCount() {
      if (!Array.isArray(this.artists)) return 0
      return this.artists.reduce(
        (sum, artist) =>
          sum + (artist.mainWorks?.length || 0) + (artist.compilations?.length || 0),
        0
      )
    },
    progressPercentage() {
      if (this.totalCount === 0) return 0
      return Math.round((this.selectedCodes.length / this.totalCount) * 100)
    },
    filteredArtists() {
      if (!Array.isArray(this.artists)) return []
      return this.artists
        .map(artist => ({
          ...artist,
          mainWorks: this.filterWorks(artist.mainWorks || []),
          compilations: this.filterWorks(artist.compilations || [])
        }))
        .filter(
          artist =>
            artist.mainWorks.length > 0 || artist.compilations.length > 0
        )
    }
  },
  watch: {
    selectedCodes: {
      handler(newVal) {
        if (process.client) {
          localStorage.setItem('selectedCodes', JSON.stringify(newVal))
        }
      },
      deep: true
    },
    darkMode(newVal) {
      if (process.client) {
        localStorage.setItem('darkMode', JSON.stringify(newVal))
      }
    },
    imageQuality(newVal) {
      if (process.client) {
        localStorage.setItem('imageQuality', newVal)
      }
    },
    artists: {
      handler(newVal) {
        if (process.client) {
          localStorage.setItem('artists', JSON.stringify(newVal))
        }
      },
      deep: true
    }
  },
  mounted() {
    if (process.client) {
      // Load selected codes
      const stored = localStorage.getItem('selectedCodes')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            this.selectedCodes = parsed
          }
        } catch (e) {
          console.error('Error loading selected codes:', e)
          this.selectedCodes = []
        }
      }

      // Load dark mode
      const darkModeStored = localStorage.getItem('darkMode')
      if (darkModeStored) {
        try {
          this.darkMode = JSON.parse(darkModeStored)
        } catch (e) {
          console.error('Error loading dark mode:', e)
          this.darkMode = false
        }
      }

      // Load image quality preference
      const qualityStored = localStorage.getItem('imageQuality')
      if (qualityStored) {
        this.imageQuality = qualityStored
      }

      // Load artists - only if valid data exists
      const artistsStored = localStorage.getItem('artists')
      if (artistsStored) {
        try {
          const parsed = JSON.parse(artistsStored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Validate structure
            const isValid = parsed.every(artist =>
              artist.name &&
              Array.isArray(artist.mainWorks) &&
              Array.isArray(artist.compilations)
            )
            if (isValid) {
              this.artists = parsed
            }
          }
        } catch (e) {
          console.error('Error loading artists:', e)
          // Keep the default artists data if loading fails
        }
      }

      // Add keyboard event listener for modals
      window.addEventListener('keydown', this.handleModalKeydown)
    }
  },
  beforeDestroy() {
    if (process.client) {
      window.removeEventListener('keydown', this.handleModalKeydown)
    }
  },
  methods: {
    /**
     * Auto-generate image URL based on code pattern
     */
    generateImageUrl(code, quality = 'pl') {
      if (!code) return null

      const upperCode = code.toUpperCase()
      const match = upperCode.match(/^([A-Z]+)-?(\d+)$/)

      if (!match) {
        const cleanCode = code.toLowerCase().replace(/-/g, '')
        return `https://pics.dmm.co.jp/digital/video/${cleanCode}/${cleanCode}${quality}.jpg`
      }

      const prefix = match[1].toLowerCase()
      const number = match[2].padStart(5, '0')
      const cleanCode = prefix + number

      return `https://pics.dmm.co.jp/digital/video/${cleanCode}/${cleanCode}${quality}.jpg`
    },

    /**
     * Generate video preview URL based on code
     * Pattern: https://cc3001.dmm.co.jp/litevideo/freepv/{first_letter}/{first_three_letters}/{code_lower}/{code_lower}_dmb_w.mp4
     */
    generateVideoUrl(code) {
      if (!code) return null

      const upperCode = code.toUpperCase()
      const match = upperCode.match(/^([A-Z]+)-?(\d+)$/)

      if (!match) {
        const cleanCode = code.toLowerCase().replace(/-/g, '')
        const firstLetter = cleanCode[0]
        const firstThree = cleanCode.substring(0, 3)
        return `https://cc3001.dmm.co.jp/litevideo/freepv/${firstLetter}/${firstThree}/${cleanCode}/${cleanCode}_dmb_w.mp4`
      }

      const prefix = match[1].toLowerCase()
      const number = match[2].padStart(5, '0')
      const cleanCode = prefix + number

      const firstLetter = prefix[0]
      const firstThree = prefix.substring(0, 3)

      return `https://cc3001.dmm.co.jp/litevideo/freepv/${firstLetter}/${firstThree}/${cleanCode}/${cleanCode}_dmb_w.mp4`
    },

    /**
     * Validate if generated URL actually exists
     */
    async validateImageUrl(url) {
      return new Promise((resolve) => {
        const img = new Image()
        const timeout = setTimeout(() => {
          resolve(false)
        }, 5000)

        img.onload = () => {
          clearTimeout(timeout)
          resolve(true)
        }
        img.onerror = () => {
          clearTimeout(timeout)
          resolve(false)
        }
        img.src = url
      })
    },

    /**
     * Auto-fill missing images for all works
     */
    async autoFillImages() {
      let updated = 0
      let failed = 0

      this.showToast('Checking images...', 'info')

      for (const artist of this.artists) {
        if (artist.mainWorks) {
          for (const work of artist.mainWorks) {
            if (!work.imageUrl) {
              const generatedUrl = this.generateImageUrl(work.code, this.imageQuality)
              const isValid = await this.validateImageUrl(generatedUrl)

              if (isValid) {
                work.imageUrl = generatedUrl
                updated++
              } else {
                failed++
              }
            }
          }
        }

        if (artist.compilations) {
          for (const work of artist.compilations) {
            if (!work.imageUrl) {
              const generatedUrl = this.generateImageUrl(work.code, this.imageQuality)
              const isValid = await this.validateImageUrl(generatedUrl)

              if (isValid) {
                work.imageUrl = generatedUrl
                updated++
              } else {
                failed++
              }
            }
          }
        }
      }

      this.artists = [...this.artists]

      if (updated > 0) {
        this.showToast(`✅ Auto-filled ${updated} images${failed > 0 ? ` (${failed} failed)` : ''}`, 'success')
      } else {
        this.showToast('No missing images found', 'info')
      }
    },

    /**
     * Auto-fill image for a single work when code changes
     */
    async autoFillSingleImage(code) {
      const generatedUrl = this.generateImageUrl(code, this.imageQuality)
      const isValid = await this.validateImageUrl(generatedUrl)
      return isValid ? generatedUrl : null
    },

    /**
     * Auto-generate image URL for the item being edited
     */
    async autoGenerateEditImage() {
      if (!this.editItem.code) {
        this.showToast('No code available', 'error')
        return
      }

      this.showToast('Generating image URL...', 'info')
      const generatedUrl = this.generateImageUrl(this.editItem.code, this.imageQuality)
      const isValid = await this.validateImageUrl(generatedUrl)

      if (isValid) {
        this.editItem.imageUrl = generatedUrl
        this.editImageError = false
        this.showToast('✅ Image URL generated successfully', 'success')
      } else {
        this.showToast('⚠️ Could not generate valid image URL', 'error')
      }
    },

    /**
     * Generate sample image URLs for a code
     */
    generateSampleUrls(code, count = 10) {
      if (!code) return []

      const upperCode = code.toUpperCase()
      const match = upperCode.match(/^([A-Z]+)-?(\d+)$/)

      if (!match) return []

      const prefix = match[1].toLowerCase()
      const number = match[2].padStart(5, '0')
      const cleanCode = prefix + number

      const samples = []

      samples.push({
        url: `https://pics.dmm.co.jp/digital/video/${cleanCode}/${cleanCode}pl.jpg`,
        label: 'Cover (Small)',
        type: 'cover'
      })
      samples.push({
        url: `https://pics.dmm.co.jp/digital/video/${cleanCode}/${cleanCode}ps.jpg`,
        label: 'Cover (Medium)',
        type: 'cover'
      })
      samples.push({
        url: `https://pics.dmm.co.jp/digital/video/${cleanCode}/${cleanCode}jp-1.jpg`,
        label: 'Cover (Large)',
        type: 'cover'
      })

      for (let i = 2; i <= count + 1; i++) {
        samples.push({
          url: `https://pics.dmm.co.jp/digital/video/${cleanCode}/${cleanCode}jp-${i}.jpg`,
          label: `Sample ${i - 1}`,
          type: 'sample'
        })
      }

      return samples
    },

    /**
     * Open sample image viewer
     */
    async openSampleViewer(work, artistName) {
      this.currentSampleCode = work.code
      this.currentSampleArtist = artistName
      this.sampleImages = this.generateSampleUrls(work.code)
      this.currentSlideIndex = 0
      this.showSampleModal = true
    },

    /**
     * Close sample image viewer
     */
    closeSampleViewer() {
      this.showSampleModal = false
      this.currentSampleCode = null
      this.currentSampleArtist = null
      this.sampleImages = []
      this.currentSlideIndex = 0
    },

    /**
     * Open video preview modal
     */
    openVideoPreview(work, artistName) {
      this.currentVideoCode = work.code
      this.currentVideoArtist = artistName
      this.videoUrl = this.generateVideoUrl(work.code)
      this.videoLoading = true
      this.videoError = false
      this.showVideoModal = true
    },

    /**
     * Close video preview modal
     */
    closeVideoPreview() {
      this.showVideoModal = false
      this.currentVideoCode = null
      this.currentVideoArtist = null
      this.videoUrl = null
      this.videoLoading = false
      this.videoError = false
    },

    /**
     * Handle video loaded
     */
    handleVideoLoaded() {
      this.videoLoading = false
      this.videoError = false
    },

    /**
     * Handle video error
     */
    handleVideoError() {
      this.videoLoading = false
      this.videoError = true
    },

    /**
     * Go to next slide
     */
    nextSlide() {
      if (this.currentSlideIndex < this.sampleImages.length - 1) {
        this.currentSlideIndex++
      } else {
        this.currentSlideIndex = 0
      }
    },

    /**
     * Go to previous slide
     */
    prevSlide() {
      if (this.currentSlideIndex > 0) {
        this.currentSlideIndex--
      } else {
        this.currentSlideIndex = this.sampleImages.length - 1
      }
    },

    /**
     * Go to specific slide
     */
    goToSlide(index) {
      this.currentSlideIndex = index
    },

    /**
     * Handle keyboard navigation for all modals
     */
    handleModalKeydown(event) {
      if (event.key === 'Escape') {
        if (this.showVideoModal) {
          this.closeVideoPreview()
        } else if (this.showSampleModal) {
          this.closeSampleViewer()
        }
      }

      if (this.showSampleModal) {
        if (event.key === 'ArrowRight') {
          this.nextSlide()
        } else if (event.key === 'ArrowLeft') {
          this.prevSlide()
        }
      }
    },

    filterWorks(works) {
      if (!Array.isArray(works)) return []
      const query = this.searchQuery.toLowerCase()
      return works.filter(
        work =>
          work.code?.toLowerCase().includes(query) ||
          work.name?.toLowerCase().includes(query)
      )
    },
    toggleCode(code) {
      const index = this.selectedCodes.indexOf(code)
      if (index > -1) {
        this.selectedCodes.splice(index, 1)
      } else {
        this.selectedCodes.push(code)
      }
    },
    removeCode(code) {
      this.selectedCodes = this.selectedCodes.filter(c => c !== code)
    },
    showToast(message, type = 'success') {
      this.toast = {
        show: true,
        message,
        type
      }
      setTimeout(() => {
        this.toast.show = false
      }, 3000)
    },
    handleExport() {
      const timestamp = new Date().toISOString().split('T')[0]
      const data = {
        timestamp,
        count: this.selectedCodes.length,
        total: this.totalCount,
        percentage: this.progressPercentage,
        codes: this.selectedCodes
      }

      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `works-tracker-${timestamp}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      this.showToast(`Exported ${this.selectedCodes.length} items as JSON`, 'success')
    },
    handleExportCSV() {
      const timestamp = new Date().toISOString().split('T')[0]

      let csv = 'Code,Name,Artist,Type,Image URL\n'

      this.selectedCodes.forEach(code => {
        for (const artist of this.artists) {
          let found = false

          const mainWork = artist.mainWorks?.find(w => w.code === code)
          if (mainWork) {
            csv += `${mainWork.code},"${mainWork.name}","${artist.name}","Main Works","${mainWork.imageUrl || ''}"\n`
            found = true
          }

          if (!found) {
            const compilation = artist.compilations?.find(w => w.code === code)
            if (compilation) {
              csv += `${compilation.code},"${compilation.name}","${artist.name}","Compilation","${compilation.imageUrl || ''}"\n`
              found = true
            }
          }

          if (found) break
        }
      })

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `works-tracker-${timestamp}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      this.showToast(`Exported ${this.selectedCodes.length} items as CSV`, 'success')
    },
    handleImportClick() {
      this.$refs.fileInput.click()
    },
    handleImport(e) {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const content = event.target.result

          if (file.name.endsWith('.json')) {
            const data = JSON.parse(content)
            if (data.codes && Array.isArray(data.codes)) {
              this.selectedCodes = data.codes
              this.showToast(`Imported ${data.codes.length} items from ${data.timestamp}`, 'success')
            } else {
              this.showToast('Invalid JSON format', 'error')
            }
          }
          else if (file.name.endsWith('.csv')) {
            const lines = content.split('\n')
            if (lines.length < 2) {
              this.showToast('Invalid CSV format', 'error')
              return
            }

            const codes = []
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim()
              if (!line) continue

              const matches = line.match(/"([^"]*)"|([^,]+)/g)
              if (matches && matches.length > 0) {
                let code = matches[0].replace(/"/g, '').trim()
                codes.push(code)
              }
            }

            if (codes.length === 0) {
              this.showToast('No valid codes found in CSV', 'error')
              return
            }

            const validCodes = codes.filter(code =>
              this.artists.some(artist =>
                artist.mainWorks?.some(w => w.code === code) ||
                artist.compilations?.some(w => w.code === code)
              )
            )

            if (validCodes.length === 0) {
              this.showToast('No matching codes found in your collection', 'error')
              return
            }

            this.selectedCodes = validCodes
            this.showToast(`Imported ${validCodes.length} items from CSV`, 'success')
          } else {
            this.showToast('Please upload a JSON or CSV file', 'error')
          }
        } catch (error) {
          this.showToast('Error reading file: ' + error.message, 'error')
        }
      }
      reader.readAsText(file)
      e.target.value = ''
    },
    clearAll() {
      this.showConfirmModal = true
    },
    confirmClearAll() {
      const count = this.selectedCodes.length
      this.selectedCodes = []
      this.showConfirmModal = false
      this.showToast(`Cleared ${count} selections`, 'info')
    },
    toggleDarkMode() {
      this.darkMode = !this.darkMode
    },
    openAddModal() {
      this.newItem = {
        artist: '',
        code: '',
        name: '',
        type: 'mainWorks',
        imageUrl: ''
      }
      this.imageError = false
      this.showAddModal = true
    },
    closeAddModal() {
      this.showAddModal = false
    },
    openEditModal(work, artistName) {
      this.editItem = {
        code: work.code,
        imageUrl: work.imageUrl || '',
        artist: artistName
      }
      this.editImageError = false
      this.showEditModal = true
    },
    closeEditModal() {
      this.showEditModal = false
    },
    saveEditedItem() {
      if (!this.editItem.code.trim()) {
        this.showToast('Code is required', 'error')
        return
      }

      const artist = this.artists.find(a => a.name === this.editItem.artist)
      if (!artist) {
        this.showToast('Artist not found', 'error')
        return
      }

      let work = artist.mainWorks?.find(w => w.code === this.editItem.code)
      let isMainWork = true

      if (!work) {
        work = artist.compilations?.find(w => w.code === this.editItem.code)
        isMainWork = false
      }

      if (work) {
        work.imageUrl = this.editItem.imageUrl || null

        if (isMainWork) {
          artist.mainWorks = [...artist.mainWorks]
        } else {
          artist.compilations = [...artist.compilations]
        }

        this.artists = [...this.artists]
        this.closeEditModal()
        this.showToast(`✅ Updated ${this.editItem.code}`, 'success')
      } else {
        this.showToast('Item not found', 'error')
      }
    },
    async addNewItem() {
      if (!this.newItem.artist.trim()) {
        this.showToast('Please select an artist', 'error')
        return
      }
      if (!this.newItem.code.trim()) {
        this.showToast('Please enter code', 'error')
        return
      }

      const code = this.newItem.code.toUpperCase()

      const codeExists = this.artists.some(artist =>
        artist.mainWorks?.some(w => w.code === code) ||
        artist.compilations?.some(w => w.code === code)
      )

      if (codeExists) {
        this.showToast(`Code ${code} already exists`, 'error')
        return
      }

      const artist = this.artists.find(a => a.name === this.newItem.artist)
      if (!artist) {
        this.showToast('Artist not found', 'error')
        return
      }

      let imageUrl = this.newItem.imageUrl
      if (!imageUrl) {
        this.showToast('Generating image URL...', 'info')
        imageUrl = await this.autoFillSingleImage(code)
        if (!imageUrl) {
          this.showToast('⚠️ Could not auto-generate valid image', 'error')
        }
      }

      const work = {
        code: code,
        name: artist.name,
        imageUrl: imageUrl
      }

      if (this.newItem.type === 'mainWorks') {
        artist.mainWorks.push(work)
        artist.mainWorks = [...artist.mainWorks]
      } else {
        artist.compilations.push(work)
        artist.compilations = [...artist.compilations]
      }

      this.artists = [...this.artists]
      this.showAddModal = false
      this.showToast(`✅ Added ${code}${imageUrl ? ' with image' : ''}`, 'success')
    }
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
}

.works-container {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif;
  transition: background 0.3s;
}

.works-container.dark-mode {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #e0e0e0;
}

.container {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 20px;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  padding: 30px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.works-container.dark-mode .header {
  background: #2a2a3e;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.header-content h1 {
  font-size: 2.2em;
  margin: 0 0 5px 0;
  color: #2563eb;
}

.works-container.dark-mode .header-content h1 {
  color: #64b5f6;
}

.subtitle {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 0.95em;
}

.works-container.dark-mode .subtitle {
  color: #aaa;
}

.header-controls {
  display: flex;
  gap: 12px;
}

.icon-btn {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  border: 2px solid #e0e0e0;
  background: white;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.works-container.dark-mode .icon-btn {
  border-color: #444;
  background: #3a3a4e;
}

.icon-btn:hover {
  transform: scale(1.05);
  border-color: #2563eb;
  background: #f0f7ff;
}

.works-container.dark-mode .icon-btn:hover {
  border-color: #64b5f6;
  background: #1d3a5c;
}

.auto-fill-btn {
  border-color: #8b5cf6;
}

.auto-fill-btn:hover {
  border-color: #8b5cf6;
  background: #f5f3ff;
}

.works-container.dark-mode .auto-fill-btn:hover {
  border-color: #8b5cf6;
  background: #2e1065;
}

.add-btn {
  border-color: #16a34a;
}

.add-btn:hover {
  border-color: #16a34a;
  background: #f0fdf4;
}

.works-container.dark-mode .add-btn:hover {
  border-color: #16a34a;
  background: #1d4e1d;
}

/* Controls */
.controls-wrapper {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.search-wrapper {
  flex: 1;
  min-width: 250px;
  position: relative;
  display: flex;
  align-items: center;
}

.quality-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.quality-selector label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.works-container.dark-mode .quality-selector label {
  color: #e0e0e0;
}

.quality-select {
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  color: #333;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.works-container.dark-mode .quality-select {
  background: #3a3a4e;
  color: #e0e0e0;
  border-color: #444;
}

.quality-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.quality-select:hover {
  border-color: #2563eb;
}

.search-icon {
  position: absolute;
  left: 15px;
  font-size: 18px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 12px 15px 12px 45px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 15px;
  background: white;
  color: #333;
  transition: all 0.3s;
}

.works-container.dark-mode .search-input {
  background: #3a3a4e;
  color: #e0e0e0;
  border-color: #444;
}

.search-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 18px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-primary {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-success {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(22, 163, 74, 0.4);
}

.btn-danger {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
  transform: translateY(-2px);
}

.hidden-input {
  display: none;
}

/* Selected Tags */
.selected-tags-wrapper {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.works-container.dark-mode .selected-tags-wrapper {
  background: #2a2a3e;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.tags-label {
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
  font-size: 14px;
}

.works-container.dark-mode .tags-label {
  color: #e0e0e0;
}

.code-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.code-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  display: flex;
  align-items: center;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.tag-remove:hover {
  opacity: 1;
}

/* Progress */
.progress-wrapper {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.works-container.dark-mode .progress-wrapper {
  background: #2a2a3e;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
}

.progress-text {
  color: #333;
}

.works-container.dark-mode .progress-text {
  color: #e0e0e0;
}

.progress-percent {
  color: #2563eb;
  font-size: 14px;
}

.progress-bar {
  width: 100%;
  height: 10px;
  background: #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 8px;
  position: relative;
}

.works-container.dark-mode .progress-bar {
  background: #3a3a4e;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb 0%, #1d4ed8 50%, #16a34a 100%);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 8px rgba(37, 99, 235, 0.5);
}

.progress-percentage {
  display: block;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: #2563eb;
}

/* Artists List */
.artists-list {
  display: grid;
  gap: 20px;
}

.artist-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.works-container.dark-mode .artist-card {
  background: #2a2a3e;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.artist-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

.artist-header-info {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.works-container.dark-mode .artist-header-info {
  border-bottom-color: #3a3a4e;
}

.artist-name {
  font-size: 1.6em;
  color: #2563eb;
  margin: 0 0 5px 0;
}

.works-container.dark-mode .artist-name {
  color: #64b5f6;
}

.artist-period {
  color: #666;
  font-size: 13px;
  margin: 5px 0;
}

.works-container.dark-mode .artist-period {
  color: #aaa;
}

.artist-count {
  color: #999;
  font-size: 13px;
  margin: 5px 0;
}

.works-container.dark-mode .artist-count {
  color: #777;
}

/* Works Sections */
.works-section {
  margin-bottom: 25px;
}

.works-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 1em;
  font-weight: 700;
  color: #444;
  margin: 0 0 15px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.works-container.dark-mode .section-title {
  color: #bbb;
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.work-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  position: relative;
}

.works-container.dark-mode .work-card {
  background: #3a3a4e;
  border-color: #444;
}

.work-card:hover {
  border-color: #2563eb;
  background: #eff6ff;
}

.works-container.dark-mode .work-card:hover {
  background: #1d3a5c;
  border-color: #64b5f6;
}

.work-card-selected {
  background: #dbeafe;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.works-container.dark-mode .work-card-selected {
  background: #1d3a5c;
  border-color: #64b5f6;
}

.work-image-large {
  width: 100%;
  aspect-ratio: 3/2;
  border-radius: 8px;
  overflow: hidden;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.work-image-large::after {
  content: '🔍 Click to view samples';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.3s;
}

.work-image-large:hover::after {
  opacity: 1;
}

.work-image-large:hover {
  transform: scale(1.02);
}

.works-container.dark-mode .work-image-large {
  background: #4a4a5e;
}

.work-image-placeholder {
  font-size: 32px;
}

.work-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.work-card-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  gap: 6px;
}

.work-card:hover .work-card-overlay {
  opacity: 1;
}

.preview-btn {
  background: rgba(37, 99, 235, 0.8);
  border: none;
  border-radius: 6px;
  width: 36px;
  height: 36px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
}

.preview-btn:hover {
  background: rgba(37, 99, 235, 1);
  transform: scale(1.1);
}

.edit-btn {
  background: rgba(0, 0, 0, 0.6);
  border: none;
  border-radius: 6px;
  width: 36px;
  height: 36px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
}

.edit-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

.work-card-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.work-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  min-width: 20px;
}

.work-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #2563eb;
}

.work-info {
  flex: 1;
}

.work-code {
  font-weight: 700;
  color: #2563eb;
  font-size: 14px;
  margin: 0;
}

.work-name {
  color: #666;
  font-size: 13px;
  margin: 3px 0 0 0;
}

.works-container.dark-mode .work-name {
  color: #aaa;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.works-container.dark-mode .empty-state {
  color: #aaa;
}

.empty-state p:first-child {
  font-size: 2em;
  margin-bottom: 10px;
}

.empty-text {
  font-size: 14px;
  color: #999;
}

.works-container.dark-mode .empty-text {
  color: #777;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 16px 20px;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-width: 350px;
  animation: toastSlide 0.3s ease;
}

@keyframes toastSlide {
  from {
    opacity: 0;
    transform: translateX(100px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.toast-success {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
}

.toast-error {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
}

.toast-info {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

/* Modal */
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
  z-index: 999;
  animation: fadeIn 0.2s ease;
  padding: 0;
}

/* Fullscreen overlay for slideshow */
.modal-overlay:has(.modal-slideshow) {
  background: rgba(0, 0, 0, 0.95);
  padding: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 450px;
  width: 90%;
  animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-compact {
  max-width: 400px;
}

.modal-video {
  max-width: 900px;
  width: 90%;
}

.modal-slideshow {
  max-width: 100vw;
  width: 100vw;
  max-height: 100vh;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin: 0;
  border-radius: 0;
}

.sample-modal-subtitle {
  margin: 5px 0 0 0;
  font-size: 14px;
  font-weight: 400;
  color: #666;
}

.works-container.dark-mode .sample-modal-subtitle {
  color: #aaa;
}

.slide-counter {
  font-weight: 600;
  color: #2563eb;
  margin-left: 8px;
}

.works-container.dark-mode .slide-counter {
  color: #64b5f6;
}

/* Video Container */
.video-container {
  position: relative;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.video-player {
  width: 100%;
  height: auto;
  display: block;
  max-height: 70vh;
}

.video-loading,
.video-error {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.video-error p {
  font-size: 14px;
  font-weight: 400;
  color: #ccc;
  margin: 0;
}

/* Slideshow Container */
.slideshow-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 80px;
  background: #f9fafb;
  flex: 1;
  overflow: hidden;
}

.works-container.dark-mode .slideshow-container {
  background: #1a1a2e;
}

/* Navigation Buttons */
.slide-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  font-size: 32px;
  padding: 20px 15px;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s;
  border-radius: 8px;
  user-select: none;
}

.slide-nav:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: translateY(-50%) scale(1.1);
}

.slide-prev {
  left: 10px;
}

.slide-next {
  right: 10px;
}

/* Main Slide */
.slide-main {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 900px;
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slide-item {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
  display: flex;
  flex-direction: column;
  gap: 15px;
  pointer-events: none;
}

.slide-item.active {
  opacity: 1;
  pointer-events: auto;
}

.slide-image-wrapper {
  position: relative;
  width: 100%;
  flex: 1;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.works-container.dark-mode .slide-image-wrapper {
  background: #2a2a3e;
}

.slide-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: none;
}

.slide-image-wrapper.image-loaded .slide-image {
  display: block;
}

.slide-image-wrapper.image-loaded .slide-loading {
  display: none;
}

.slide-loading {
  position: absolute;
  color: #999;
  font-size: 16px;
  font-weight: 600;
}

.works-container.dark-mode .slide-loading {
  color: #666;
}

.slide-image-wrapper.image-loaded .slide-loading,
.slide-image-wrapper.image-failed .slide-loading {
  display: none;
}

.slide-error {
  position: absolute;
  color: #dc2626;
  font-size: 16px;
  font-weight: 600;
  display: none;
}

.slide-image-wrapper.image-failed .slide-error {
  display: block;
}

.slide-image-wrapper.image-failed .slide-image {
  display: none;
}

.slide-label {
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin: 0;
  padding: 10px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.works-container.dark-mode .slide-label {
  color: #e0e0e0;
  background: #2a2a3e;
}

/* Thumbnail Navigation */
.slide-thumbnails {
  display: flex;
  gap: 8px;
  padding: 15px 20px;
  overflow-x: auto;
  background: rgba(255, 255, 255, 0.95);
  border-top: 2px solid #f0f0f0;
  scrollbar-width: thin;
  flex-shrink: 0;
}

.works-container.dark-mode .slide-thumbnails {
  background: rgba(42, 42, 62, 0.95);
  border-top-color: #3a3a4e;
}

.slide-thumbnails::-webkit-scrollbar {
  height: 6px;
}

.slide-thumbnails::-webkit-scrollbar-track {
  background: #f0f0f0;
}

.works-container.dark-mode .slide-thumbnails::-webkit-scrollbar-track {
  background: #3a3a4e;
}

.slide-thumbnails::-webkit-scrollbar-thumb {
  background: #2563eb;
  border-radius: 3px;
}

.thumbnail-item {
  position: relative;
  min-width: 60px;
  height: 80px;
  border: 3px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  background: #f0f0f0;
}

.works-container.dark-mode .thumbnail-item {
  background: #3a3a4e;
}

.thumbnail-item:hover {
  transform: scale(1.1);
  border-color: #2563eb;
}

.thumbnail-item.active {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-number {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}

.slideshow-info {
  flex: 1;
  color: #666;
  font-size: 13px;
  display: flex;
  align-items: center;
}

.works-container.dark-mode .slideshow-info {
  color: #aaa;
}

.works-container.dark-mode .modal-content {
  background: #2a2a3e;
  color: #e0e0e0;
}

@keyframes modalPop {
  from {
    opacity: 0;
    transform: scale(0.9);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 2px solid #f0f0f0;
  flex-shrink: 0;
  background: white;
}

.modal-slideshow .modal-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.works-container.dark-mode .modal-header {
  border-bottom-color: #3a3a4e;
  background: #2a2a3e;
}

.works-container.dark-mode .modal-slideshow .modal-header {
  background: rgba(42, 42, 62, 0.95);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.3em;
  color: #333;
}

.works-container.dark-mode .modal-header h3 {
  color: #e0e0e0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f0f0f0;
}

.works-container.dark-mode .modal-close {
  color: #aaa;
}

.works-container.dark-mode .modal-close:hover {
  background: #3a3a4e;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 15px 30px;
  border-top: 2px solid #f0f0f0;
  flex-shrink: 0;
  background: white;
}

.modal-slideshow .modal-footer {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.works-container.dark-mode .modal-footer {
  border-top-color: #3a3a4e;
  background: #2a2a3e;
}

.works-container.dark-mode .modal-slideshow .modal-footer {
  background: rgba(42, 42, 62, 0.95);
}

/* Form */
.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  color: #333;
  font-size: 14px;
}

.works-container.dark-mode .form-group label {
  color: #e0e0e0;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  color: #333;
  transition: all 0.3s;
}

.works-container.dark-mode .form-input {
  background: #3a3a4e;
  color: #e0e0e0;
  border-color: #444;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-input:disabled {
  background: #f0f0f0;
  color: #999;
  cursor: not-allowed;
}

.works-container.dark-mode .form-input:disabled {
  background: #3a3a4e;
  color: #777;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.works-container.dark-mode .radio-label {
  color: #e0e0e0;
}

.radio-label input[type="radio"] {
  accent-color: #2563eb;
  cursor: pointer;
}

.modal-body .warning {
  color: #dc2626;
  font-weight: 600;
  font-size: 13px;
}

.image-preview {
  margin-top: 10px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e0e0e0;
  background: #f9fafb;
  max-height: 150px;
}

.works-container.dark-mode .image-preview {
  border-color: #444;
  background: #3a3a4e;
}

.image-preview img {
  width: 100%;
  max-height: 150px;
  object-fit: contain;
  display: block;
}

.image-error {
  display: block;
  padding: 10px;
  text-align: center;
  color: #dc2626;
  font-weight: 600;
  font-size: 13px;
}

/* Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter,
.modal-leave-to {
  opacity: 0;
}

.modal-enter .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95);
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

/* Responsive */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 15px;
  }

  .header-content h1 {
    font-size: 1.8em;
  }

  .controls-wrapper {
    flex-direction: column;
    align-items: stretch;
  }

  .quality-selector {
    justify-content: space-between;
  }

  .button-group {
    width: 100%;
  }

  .btn {
    flex: 1;
  }

  .works-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }

  .modal-content,
  .modal-compact {
    max-width: 90%;
  }

  .modal-video {
    max-width: 95%;
  }

  .video-container {
    min-height: 300px;
  }

  .video-player {
    max-height: 60vh;
  }

  .modal-slideshow {
    max-width: 100vw;
    width: 100vw;
    max-height: 100vh;
    height: 100vh;
  }

  .modal-header {
    padding: 15px 20px;
  }

  .modal-footer {
    padding: 12px 20px;
  }

  .slideshow-container {
    padding: 15px 45px;
  }

  .slide-nav {
    font-size: 24px;
    padding: 12px 8px;
  }

  .slide-prev {
    left: 5px;
  }

  .slide-next {
    right: 5px;
  }

  .slide-main {
    max-width: 100%;
  }

  .slide-label {
    font-size: 13px;
    padding: 8px;
  }

  .slide-thumbnails {
    padding: 10px 15px;
  }

  .thumbnail-item {
    min-width: 50px;
    height: 70px;
  }

  .slideshow-info {
    display: none;
  }

  .work-card-overlay {
    opacity: 1;
  }

  .preview-btn,
  .edit-btn {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .toast {
    left: 10px;
    right: 10px;
    bottom: 10px;
  }
}
</style>