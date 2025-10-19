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
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by code or name..."
            class="search-input"
          />
        </div>

        <div class="button-group">
          <button
            @click="handleExport"
            :disabled="selectedCodes.length === 0"
            class="btn btn-primary"
          >
            📥 JSON
          </button>
          <button
            @click="handleExportCSV"
            :disabled="selectedCodes.length === 0"
            class="btn btn-primary"
          >
            📊 CSV
          </button>
          <button
            @click="handleImportClick"
            class="btn btn-success"
          >
            📤 Import
          </button>
          <button
            v-if="selectedCodes.length > 0"
            @click="clearAll"
            class="btn btn-danger"
          >
            🗑️ Clear
          </button>
          <input
            ref="fileInput"
            type="file"
            accept=".json,.csv"
            @change="handleImport"
            class="hidden-input"
          />
        </div>
      </div>

      <!-- Selected Tags -->
      <div v-if="selectedCodes.length > 0" class="selected-tags-wrapper">
        <p class="tags-label">Selected: {{ selectedCodes.length }} items</p>
        <div class="code-tags">
          <span
            v-for="code in selectedCodes"
            :key="code"
            class="code-tag"
          >
            {{ code }}
            <button
              @click="removeCode(code)"
              class="tag-remove"
            >
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
          <div
            class="progress-fill"
            :style="{ width: progressPercentage + '%' }"
          />
        </div>
        <span class="progress-percentage">{{ progressPercentage }}%</span>
      </div>

      <!-- Artists List -->
      <div class="artists-list">
        <div
          v-for="artist in filteredArtists"
          :key="artist.name"
          class="artist-card"
        >
          <div class="artist-header-info">
            <h2 class="artist-name">{{ artist.name }}</h2>
            <p class="artist-period">{{ artist.period }}</p>
            <p class="artist-count">{{ artist.mainWorks.length + artist.compilations.length }} works</p>
          </div>

          <!-- Main Works -->
          <div v-if="artist.mainWorks.length > 0" class="works-section">
            <h3 class="section-title">📌 Main Works</h3>
            <div class="works-grid">
              <div
                v-for="work in artist.mainWorks"
                :key="work.code"
                :class="['work-card', { 'work-card-selected': selectedCodes.includes(work.code) }]"
              >
                <template v-if="work.imageUrl">
                  <div
                    class="work-image-large"
                    @click.stop="toggleCode(work.code)"
                  >
                    <img :src="work.imageUrl" :alt="work.code" class="work-img" onerror="this.style.display='none'">
                  </div>
                </template>
                <template v-else>
                  <div
                    class="work-image-large work-image-placeholder"
                    @click.stop="toggleCode(work.code)"
                  >
                    <span>📷</span>
                  </div>
                </template>
                <div class="work-card-overlay">
                  <button
                    @click.stop="openEditModal(work, artist.name)"
                    class="edit-btn"
                    title="Edit item"
                  >
                    ✏️
                  </button>
                </div>
                <div class="work-card-content">
                  <div class="work-checkbox">
                    <input
                      type="checkbox"
                      :checked="selectedCodes.includes(work.code)"
                      @change="toggleCode(work.code)"
                    />
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
          <div v-if="artist.compilations.length > 0" class="works-section">
            <h3 class="section-title">📂 Compilations</h3>
            <div class="works-grid">
              <div
                v-for="work in artist.compilations"
                :key="work.code"
                :class="['work-card', { 'work-card-selected': selectedCodes.includes(work.code) }]"
              >
                <template v-if="work.imageUrl">
                  <div
                    class="work-image-large"
                    @click.stop="toggleCode(work.code)"
                  >
                    <img :src="work.imageUrl" :alt="work.code" class="work-img" onerror="this.style.display='none'">
                  </div>
                </template>
                <template v-else>
                  <div
                    class="work-image-large work-image-placeholder"
                    @click.stop="toggleCode(work.code)"
                  >
                    <span>📷</span>
                  </div>
                </template>
                <div class="work-card-overlay">
                  <button
                    @click.stop="openEditModal(work, artist.name)"
                    class="edit-btn"
                    title="Edit item"
                  >
                    ✏️
                  </button>
                </div>
                <div class="work-card-content">
                  <div class="work-checkbox">
                    <input
                      type="checkbox"
                      :checked="selectedCodes.includes(work.code)"
                      @change="toggleCode(work.code)"
                    />
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
              <input
                v-model="newItem.code"
                type="text"
                placeholder="e.g., SSIS-001"
                class="form-input"
                @keyup.enter="addNewItem"
              />
            </div>

            <div class="form-group">
              <label>Image URL</label>
              <input
                v-model="newItem.imageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                class="form-input"
              />
              <div v-if="newItem.imageUrl" class="image-preview">
                <img :src="newItem.imageUrl" alt="Preview" @error="imageError = true">
                <span v-if="imageError" class="image-error">❌ Image failed to load</span>
              </div>
            </div>

            <div class="form-group">
              <label>Type</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input
                    v-model="newItem.type"
                    type="radio"
                    value="mainWorks"
                  />
                  📌 Main Works
                </label>
                <label class="radio-label">
                  <input
                    v-model="newItem.type"
                    type="radio"
                    value="compilations"
                  />
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
              <input
                v-model="editItem.code"
                type="text"
                class="form-input"
                disabled
              />
            </div>

            <div class="form-group">
              <label>Image URL</label>
              <input
                v-model="editItem.imageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                class="form-input"
              />
              <div v-if="editItem.imageUrl" class="image-preview">
                <img :src="editItem.imageUrl" alt="Preview" @error="editImageError = true">
                <span v-if="editImageError" class="image-error">❌ Image failed to load</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closeEditModal" class="btn btn-secondary">Cancel</button>
            <button @click="saveEditedItem" class="btn btn-primary">Save Changes</button>
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
      toast: {
        show: false,
        message: '',
        type: 'success'
      },
      artists: [
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
        }
      ]
    }
  },
  computed: {
    totalCount() {
      return this.artists.reduce(
        (sum, artist) =>
          sum + artist.mainWorks.length + artist.compilations.length,
        0
      )
    },
    progressPercentage() {
      if (this.totalCount === 0) return 0
      return Math.round((this.selectedCodes.length / this.totalCount) * 100)
    },
    filteredArtists() {
      return this.artists
        .map(artist => ({
          ...artist,
          mainWorks: this.filterWorks(artist.mainWorks),
          compilations: this.filterWorks(artist.compilations)
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
      const stored = localStorage.getItem('selectedCodes')
      if (stored) {
        try {
          this.selectedCodes = JSON.parse(stored)
        } catch (e) {
          console.error('Error loading selected codes:', e)
        }
      }

      const darkModeStored = localStorage.getItem('darkMode')
      if (darkModeStored) {
        this.darkMode = JSON.parse(darkModeStored)
      }

      const artistsStored = localStorage.getItem('artists')
      if (artistsStored) {
        try {
          this.artists = JSON.parse(artistsStored)
        } catch (e) {
          console.error('Error loading artists:', e)
        }
      }
    }
  },
  methods: {
    filterWorks(works) {
      const query = this.searchQuery.toLowerCase()
      return works.filter(
        work =>
          work.code.toLowerCase().includes(query) ||
          work.name.toLowerCase().includes(query)
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
          
          const mainWork = artist.mainWorks.find(w => w.code === code)
          if (mainWork) {
            csv += `${mainWork.code},"${mainWork.name}","${artist.name}","Main Works","${mainWork.imageUrl || ''}"\n`
            found = true
          }
          
          if (!found) {
            const compilation = artist.compilations.find(w => w.code === code)
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
          
          // Check if it's JSON
          if (file.name.endsWith('.json')) {
            const data = JSON.parse(content)
            if (data.codes && Array.isArray(data.codes)) {
              this.selectedCodes = data.codes
              this.showToast(`Imported ${data.codes.length} items from ${data.timestamp}`, 'success')
            } else {
              this.showToast('Invalid JSON format', 'error')
            }
          } 
          // Check if it's CSV
          else if (file.name.endsWith('.csv')) {
            const lines = content.split('\n')
            if (lines.length < 2) {
              this.showToast('Invalid CSV format', 'error')
              return
            }
            
            const codes = []
            // Skip header row (line 0)
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim()
              if (!line) continue
              
              // Parse CSV line, handling quoted fields
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
            
            // Validate codes exist in current data
            const validCodes = codes.filter(code => 
              this.artists.some(artist =>
                artist.mainWorks.some(w => w.code === code) ||
                artist.compilations.some(w => w.code === code)
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

      let work = artist.mainWorks.find(w => w.code === this.editItem.code)
      let isMainWork = true
      
      if (!work) {
        work = artist.compilations.find(w => w.code === this.editItem.code)
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
    addNewItem() {
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
        artist.mainWorks.some(w => w.code === code) ||
        artist.compilations.some(w => w.code === code)
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

      const work = {
        code: code,
        name: artist.name,
        imageUrl: this.newItem.imageUrl || null
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
      this.showToast(`✅ Added ${code}`, 'success')
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
  margin: 0;
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
}

.search-wrapper {
  flex: 1;
  min-width: 250px;
  position: relative;
  display: flex;
  align-items: center;
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
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
}

.work-card {
  display: flex;
  flex-direction: column;
  padding: 14px;
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
  margin-bottom: 10px;
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
}

.work-card:hover .work-card-overlay {
  opacity: 1;
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
  padding: 24px;
  border-bottom: 2px solid #f0f0f0;
}

.works-container.dark-mode .modal-header {
  border-bottom-color: #3a3a4e;
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
  padding: 20px 24px;
  border-top: 2px solid #f0f0f0;
}

.works-container.dark-mode .modal-footer {
  border-top-color: #3a3a4e;
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
  }

  .button-group {
    width: 100%;
  }

  .btn {
    flex: 1;
  }

  .works-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }

  .modal-content,
  .modal-compact {
    max-width: 90%;
  }

  .toast {
    left: 10px;
    right: 10px;
    bottom: 10px;
  }
}
</style>