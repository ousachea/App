<!-- pages/works.vue -->
<template>
  <div class="container" :class="{ 'dark-mode': darkMode }">
    <!-- Header -->
    <header>
      <div>
        <h1>🎬 Works Tracker</h1>
        <p>{{ totalCount }} total works</p>
      </div>
      <div class="search-box">
        <input v-model="globalSearch" type="text" placeholder="🔍 Search all works..." class="global-search" />
        <span v-if="globalSearch" class="search-results">{{ searchResults.length }} found</span>
      </div>
      <div class="image-source-toggle">
        <label class="toggle-label">
          <select v-model="imageSource" class="image-select">
            <option value="dmm">🖼️ DMM</option>
            <option value="fourhoi">🖼️ Fourhoi</option>
            <option value="mgstage">🖼️ MgStage</option>
          </select>
        </label>
      </div>
      <div class="btns">
        <button @click="autoFillImages" title="Auto-fetch posters">🖼️</button>
        <button @click="handleExport" class="btn-icon" title="Export JSON">📥</button>
        <button @click="handleImportClick" class="btn-icon" title="Import">📤</button>
        <button @click="toggleDarkMode" class="btn-icon" title="Toggle dark mode">{{ darkMode ? '☀️' : '🌙' }}</button>
        <button @click="resetToDefaults" class="btn-icon" title="Reset to default data">🔄</button>
        <button @click="openAddArtistModal" title="Add new artist">➕ Artist</button>
        <input ref="fileInput" type="file" accept=".json" @change="handleImport" hidden />
      </div>
    </header>

    <!-- Global Search Results -->
    <div v-if="globalSearch && searchResults.length" class="search-results-container">
      <div v-for="result in searchResults" :key="`${result.artistName}-${result.work.code}`" class="search-result-item">
        <strong>{{ result.artistName }}</strong> - {{ result.work.code }}
        <button @click="activeTab = result.artistName" class="goto-btn">View →</button>
      </div>
    </div>

    <!-- Artist Grid -->
    <div class="artist-grid">
      <button v-for="artist in sortedArtistsByWorkCount" :key="artist.name"
        :class="['artist-card', { active: activeTab === artist.name }]" @click="activeTab = artist.name">
        <div class="artist-photo-small">
          <img v-if="getRandomArtistWork(artist)"
            :src="generateImageUrl(getRandomArtistWork(artist).code, 'pl', getRandomArtistWork(artist).imageSource)"
            :alt="artist.name" @error="handleImageError" @load="handleImageLoad" class="artist-image" />
          <span v-else class="photo-placeholder">📷</span>
        </div>
        <div class="card-content">
          <h3>{{ artist.name }}</h3>
          <p class="work-count">{{ (artist.mainWorks?.length || 0) + (artist.compilations?.length || 0) }} works</p>
          <div class="breakdown">
            <span v-if="artist.mainWorks?.length" class="main">📌 {{ artist.mainWorks.length }}</span>
            <span v-if="artist.compilations?.length" class="comp">📂 {{ artist.compilations.length }}</span>
          </div>
          <div v-if="artist.studio" class="studio-tag">📦 {{ artist.studio }}</div>
        </div>
      </button>
    </div>

    <!-- Artist Content -->
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

      <!-- Main Works -->
      <div v-if="filteredCurrentMainWorks.length">
        <h3>📌 Main Works</h3>
        <div class="grid">
          <div v-for="work in sortedFilteredMainWorks" :key="work.code" class="card">
            <div class="preview-gallery">
              <div class="preview-item">
                <img :src="generateImageUrl(work.code, 'pl', work.imageSource)" :alt="`${work.code} cover`" />
              </div>
              <div v-for="i in 20" :key="i" class="preview-item">
                <img :src="generateImageUrl(work.code, `jp-${i}`)" :alt="`${work.code} preview ${i}`" />
              </div>
            </div>
            <div class="card-overlay">

              <div class="link-dropdown">
                <button class="overlay-btn link-btn" title="Open links">🔗</button>
                <div class="dropdown-menu">
                  <button @click.stop="openExternalLink(work.code, 'njav')" class="dropdown-item">NJAV</button>

                </div>
              </div>
              <button @click.stop="openEditWorkModal(work)" class="overlay-btn edit-btn" title="Edit code">✏️</button>
              <button @click.stop="openMoveWorkModal(work)" class="overlay-btn move-btn"
                title="Move to another artist">➡️</button>
            </div>
            <div class="info">
              <div>
                <strong>{{ work.code }}</strong>
                <span v-if="hasSimilarCode(work.code)" class="typo-warning" title="Similar code exists">⚠️</span>
                <span v-if="work.releaseDate" class="release-date">📅 {{ formatDate(work.releaseDate) }}</span>
              </div>
              <div class="work-controls">
                <select :value="work.imageSource || 'dmm'" @change="setWorkImageSource(work, $event)"
                  class="work-image-select" title="Choose image source">
                  <option value="dmm">DMM</option>
                  <option value="fourhoi">Fourhoi</option>
                  <option value="mgstage">MgStage</option>
                </select>
                <div class="link-buttons">
                  <button @click.stop="openExternalLink(work.code, 'njav')" class="link-btn-small"
                    title="Open on NJAV">NJAV</button>
                  <button @click.stop="openExternalLink(work.code, 'missav')" class="link-btn-small"
                    title="Open on Missav">Missav</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Compilations -->
      <div v-if="filteredCurrentCompilations.length">
        <h3>📂 Compilations</h3>
        <div class="grid">
          <div v-for="work in sortedFilteredCompilations" :key="work.code" class="card">
            <div class="preview-gallery">
              <div class="preview-item">
                <img :src="generateImageUrl(work.code, 'pl', work.imageSource)" :alt="`${work.code} cover`" />
              </div>
              <div v-for="i in 20" :key="i" class="preview-item">
                <img :src="generateImageUrl(work.code, `jp-${i}`)" :alt="`${work.code} preview ${i}`" />
              </div>
            </div>
            <div class="card-overlay">

              <div class="link-dropdown">
                <button class="overlay-btn link-btn" title="Open links">🔗</button>
                <div class="dropdown-menu">
                  <button @click.stop="openExternalLink(work.code, 'njav')" class="dropdown-item">NJAV</button>

                </div>
              </div>
              <button @click.stop="openEditWorkModal(work)" class="overlay-btn edit-btn" title="Edit code">✏️</button>
              <button @click.stop="openMoveWorkModal(work)" class="overlay-btn move-btn"
                title="Move to another artist">➡️</button>
            </div>
            <div class="info">
              <div>
                <strong>{{ work.code }}</strong>
                <span v-if="hasSimilarCode(work.code)" class="typo-warning" title="Similar code exists">⚠️</span>
                <span v-if="work.releaseDate" class="release-date">📅 {{ formatDate(work.releaseDate) }}</span>
              </div>
              <div class="work-controls">
                <select :value="work.imageSource || 'dmm'" @change="setWorkImageSource(work, $event)"
                  class="work-image-select" title="Choose image source">
                  <option value="dmm">DMM</option>
                  <option value="fourhoi">Fourhoi</option>
                  <option value="mgstage">MgStage</option>
                </select>
                <div class="link-buttons">
                  <button @click.stop="openExternalLink(work.code, 'njav')" class="link-btn-small"
                    title="Open on NJAV">NJAV</button>
                  <button @click.stop="openExternalLink(work.code, 'missav')" class="link-btn-small"
                    title="Open on Missav">Missav</button>
                </div>
              </div>
            </div>
          </div>
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
    <div v-if="showAddArtistModal" class="modal" @click.self="closeAddArtistModal">
      <div class="modal-box">
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

    <!-- Toast -->
    <transition name="fade">
      <div v-if="toast.show" :class="['toast', toast.type]">
        {{ toast.message }}
      </div>
    </transition>
  </div>
</template>

<script>
const DEFAULT_ARTISTS = [
  { name: 'Minato Haru', mainWorks: [{ code: 'SONE-978' }, { code: 'SONE-914' }, { code: 'SONE-865' }, { code: 'MIRD-259' }, { code: 'OFES-013' }, { code: 'SONE-776' }, { code: 'SONE-508' }, { code: 'FWAY-060' }, { code: 'SONE-503' }, { code: 'SONE-155' }, { code: 'SONE-188' }, { code: 'SONE-063' }, { code: 'SONE-021' }, { code: 'SSIS-978' }, { code: 'FWAY-002' }, { code: 'SSIS-945' }, { code: 'SSIS-890' }, { code: 'SSIS-889' }] },
  { name: 'Moa Maeda', mainWorks: [{ code: 'ADN-334' }, { code: 'MIMK-091' }, { code: 'JUFE-300' }, { code: 'WAAA-065' }, { code: 'HND-991' }, { code: 'PPPD-926' }, { code: 'MSFH-034' }, { code: 'MSFH-030' }, { code: 'MSFH-024' }, { code: 'MSFH-018' }, { code: 'MSFH-014' }, { code: 'MSFH-010' }] },
  { name: 'Mitsuki Momota', mainWorks: [{ code: 'MIDA-424' }, { code: 'MIDA-026' }, { code: 'REBD-854' }, { code: 'OAE-253' }, { code: 'FWAY-047' }, { code: 'MIDV-869' }, { code: 'MIDV-569' }, { code: 'MIDA-346' }, { code: 'MIDV-668' }, { code: 'MIDV-831' }, { code: 'MIDV-574' }, { code: 'MIDV-577' }, { code: 'MIDA-102' }, { code: 'MIDA-190' }, { code: 'MIDV-985' }, { code: 'MIDV-637' }, { code: 'MIDA-305' }, { code: 'MIDA-139' }, { code: 'MIDA-258' }, { code: 'MIDV-769' }, { code: 'MDVR-325' }, { code: 'MIDV-905' }, { code: 'MIDV-804' }, { code: 'MIDA-214' }, { code: 'MIDA-064' }, { code: 'MDVR-317' }, { code: 'MDVR-288' }, { code: 'MIDA-385' }, { code: 'NAAC-032' }, { code: 'MIDV-698' }], compilations: [{ code: 'OFJE-279' }] },
  { name: 'Anzai Rara', mainWorks: [{ code: 'SSIS-025' }, { code: 'SSIS-050' }, { code: 'SSIS-103' }, { code: 'SSIS-124' }, { code: 'SSIS-136' }, { code: 'SSIS-172' }, { code: 'SSIS-203' }, { code: 'SSIS-232' }, { code: 'SSIS-262' }, { code: 'SSIS-269' }, { code: 'SSIS-357' }, { code: 'SSNI-643' }, { code: 'SSNI-671' }, { code: 'SSNI-700' }, { code: 'SSNI-727' }, { code: 'SSNI-752' }, { code: 'SSNI-777' }, { code: 'SSNI-799' }, { code: 'SSNI-822' }], compilations: [{ code: 'OFJE-288' }, { code: 'OFJE-354' }, { code: 'OFJE-410' }] },
  { name: 'RION', mainWorks: [{ code: 'SNIS-517' }, { code: 'SNIS-539' }, { code: 'SNIS-561' }, { code: 'SNIS-594' }, { code: 'SNIS-603' }, { code: 'SNIS-623' }, { code: 'SNIS-640' }, { code: 'SNIS-656' }, { code: 'SNIS-673' }, { code: 'SNIS-692' }, { code: 'SNIS-712' }, { code: 'SNIS-731' }, { code: 'SNIS-752' }, { code: 'SNIS-774' }, { code: 'SNIS-787' }, { code: 'SNIS-811' }, { code: 'SNIS-824' }, { code: 'SNIS-895' }, { code: 'SNIS-918' }, { code: 'SNIS-939' }, { code: 'SNIS-963' }, { code: 'SNIS-985' }, { code: 'SSNI-008' }, { code: 'SSNI-029' }, { code: 'SSNI-053' }, { code: 'SSNI-100' }, { code: 'SSNI-126' }, { code: 'SSNI-151' }, { code: 'SSNI-177' }, { code: 'SSNI-204' }, { code: 'SSNI-228' }, { code: 'SSNI-241' }, { code: 'SSNI-268' }, { code: 'SSNI-290' }, { code: 'EBOD-609' }], compilations: [{ code: 'OFJE-104' }, { code: 'OFJE-144' }, { code: 'OFJE-255' }] },
  { name: 'Utsunomiya Shion', mainWorks: [{ code: 'SOE-992' }, { code: 'SNIS-009' }, { code: 'SNIS-027' }, { code: 'SNIS-048' }, { code: 'SNIS-070' }, { code: 'SNIS-091' }, { code: 'SNIS-110' }, { code: 'SNIS-129' }, { code: 'SNIS-147' }, { code: 'SNIS-166' }, { code: 'AVOP-004' }, { code: 'SNIS-205' }], compilations: [{ code: 'ONSD-850' }, { code: 'ONSD-899' }] },
  { name: 'Hitomi Tanaka', mainWorks: [{ code: 'MIMK-007' }] },
  { name: 'Ai Samaya', mainWorks: [{ code: 'JUFE-101' }] },
  { name: 'Touka Rinne', mainWorks: [{ code: 'KTB-303' }] },
  { name: 'Sakura Kirishima', mainWorks: [{ code: 'MKMP-001' }] },
  { name: 'Yuri Oshikawa', mainWorks: [{ code: 'PPPD-666' }] },
  { name: 'Satomi Mioka', mainWorks: [{ code: 'BARE-009' }] },
  { name: 'Mizuno Asai', mainWorks: [{ code: 'JUL-546' }] },
  { name: 'Ayami Shunka', mainWorks: [{ code: 'SSNI-318' }] },
  { name: 'Miu Shiramine', mainWorks: [{ code: 'PRED-685' }] },
  { name: 'Miina Wakatsuki', mainWorks: [{ code: 'NGOD-113' }] },
  { name: 'Meguri', mainWorks: [{ code: 'JUR-531' }] },
  { name: 'Koibuchi Momona', mainWorks: [{ code: 'START-168' }] },
  {
    name: 'Collection',
    mainWorks: [
      { code: 'ABP-447' }, { code: 'ARA-412' }, { code: 'NNPJ-514' }, { code: 'BONY-007' },
      { code: 'MFC-117' }, { code: 'IND-063' }, { code: 'MFC-169' }, { code: 'MAAN-632' },
      { code: 'SUKE-053' }, { code: 'FC2-PPV-2864495' }, { code: 'ECB-109' }, { code: 'JUFE-028' },
      { code: 'GES-038' }, { code: 'XVSR-487' }, { code: 'VGD-192' }, { code: 'NITR-209' },
      { code: 'CLUB-855' }, { code: 'SUKE-043' }, { code: 'HAWA-325' }, { code: 'DLDSS-362' },
      { code: 'BDST-027' }, { code: 'MAAN-982' }, { code: 'DDHP-044' }, { code: 'GANA-2100' },
      { code: 'GANA-2858' }, { code: 'GANA-1026' }, { code: 'GANA-1996' }, { code: 'TOUKA-01' },
      { code: 'MAAN-387' }, { code: 'NHMSG-031' }, { code: 'ADN-630' }, { code: 'APAA-387' },
      { code: 'NTK-391' }, { code: 'MIUM-811' }, { code: 'MIUM-681' }, { code: 'MIUM-742' },
      { code: 'BSY-022' }, { code: 'KTB-018' }, { code: 'VEC-340' }, { code: 'SIRO-3954' },
      { code: 'GANA-2156' }, { code: 'STCV-240' }, { code: 'NTK-637' }, { code: 'AKDL-247' },
      { code: '259LUXU-1511' }, { code: '259LUXU-1518' }, { code: '259LUXU-743' }, { code: '259LUXU-688' },
      { code: '259LUXU-1571' }, { code: '259LUXU-1631' }, { code: '259LUXU-1618' }, { code: '259LUXU-1621' },
      { code: '259LUXU-1610' }, { code: 'SRTD-349' }, { code: 'ORECO-079' }, { code: 'MIUM-908' },
      { code: 'ION-162' }, { code: 'MAAN-836' }, { code: 'MIUM-865' }, { code: 'SIRO-4820' },
      { code: 'FLC-004' }, { code: 'PKPD-217' }, { code: 'JAC-175' }, { code: 'MIUM-862' },
      { code: 'SRTD-345' }, { code: 'AKDL-213' }, { code: 'AKDL-193' }, { code: 'HMT-018' },
      { code: 'MAAN-955' }, { code: 'GERK-350' }, { code: 'SPAY-241' }, { code: 'LUXU-1572' },
      { code: 'SUN-071' }, { code: 'GANA-2705' }, { code: 'HAWA-287' }, { code: 'MRPA-006' },
      { code: 'UZU-004' }, { code: 'ZOZO-165' }, { code: 'GVH-477' }, { code: 'BARE-009' },
      { code: 'DFDM-041' }, { code: 'FC2-PPV-1046522' }, { code: 'SSNI-362' }, { code: 'MIUM-801' },
      { code: 'KTKC-074' }, { code: 'IND-022' }, { code: 'MIUM-495' }, { code: 'SUKE-062' },
      { code: 'MAAN-842' }, { code: 'JUL-442' }, { code: 'JUL-872' }, { code: 'ORECS-132' }
    ]
  }
]

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
      editingWork: null,
      moveWorkData: { code: '', sourceArtist: '', targetArtist: '', type: '' },
      newWork: { artist: '', code: '', type: 'mainWorks', releaseDate: '' },
      newArtist: { name: '', studio: '', photo: '' },
      artists: JSON.parse(JSON.stringify(DEFAULT_ARTISTS))
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
        // Collection always goes last
        if (a.name === 'Collection') return 1
        if (b.name === 'Collection') return -1
        // Sort rest alphabetically
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
    }
  },
  mounted() {
    if (process.client) {
      try {
        const saved = localStorage.getItem('artists')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.artists = parsed
          }
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
    }
  },
  methods: {
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    },
    resetToDefaults() {
      this.artists = JSON.parse(JSON.stringify(DEFAULT_ARTISTS))
      this.activeTab = this.artists[0].name
      this.showToast('✅ Reset to default data', 'success')
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
      // Find which type this work is
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

      // Remove from source
      sourceArtist[type] = sourceArtist[type].filter(w => w.code !== this.moveWorkData.code)

      // Add to target
      if (!targetArtist[type]) targetArtist[type] = []
      targetArtist[type].push(work)

      this.artists = [...this.artists]
      this.closeMoveWorkModal()
      this.showToast(`✅ Moved ${this.moveWorkData.code} to ${this.moveWorkData.targetArtist}`, 'success')
    },
    setWorkImageSource(work, event) {
      work.imageSource = event.target.value
      this.artists = [...this.artists]
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
    getArtistImageUrl(artist) {
      const work = this.getRandomArtistWork(artist)
      if (!work) return null
      // Try different quality levels in order: pl (cover) -> jp-1 to jp-10
      const qualities = ['pl', 'jp-1', 'jp-2', 'jp-3', 'jp-4', 'jp-5']
      return { work: work.code, qualities }
    },
    getImageWithFallback(code, quality) {
      // Try the requested quality first
      const url = this.generateImageUrl(code, quality)
      // If that fails, fallback to cover image (pl)
      if (quality !== 'pl') {
        return `url('${url}'), url('${this.generateImageUrl(code, 'pl')}')`
      }
      return url
    },
    handleImageError(e) {
      e.target.style.display = 'none'
      const parent = e.target.parentElement
      if (parent) {
        const span = document.createElement('span')
        span.className = 'photo-placeholder'
        span.textContent = '📷'
        parent.appendChild(span)
      }
    },
    handleImageLoad(e) {
      e.target.style.opacity = '1'
    },
    generateImageUrl(code, quality = 'pl', workImageSource = null) {
      if (!code) return null

      // Use work-specific source if provided, otherwise use global setting
      const source = workImageSource || this.imageSource

      const upper = code.toUpperCase()
      const match = upper.match(/^([A-Z0-9]+)-?(\d+)$/)

      if (source === 'mgstage') {
        // MgStage pattern
        if (!match) {
          return null
        }
        const prefix = match[1].toLowerCase()
        const number = match[2]
        const code_lower = code.toLowerCase()

        let frame = '0'
        if (quality === 'jp-1') frame = '2'
        else if (quality === 'jp-2') frame = '3'
        else if (quality === 'jp-3') frame = '4'
        else if (quality === 'jp-4') frame = '5'
        else if (quality === 'jp-5') frame = '6'
        else if (quality.startsWith('jp-')) {
          const num = parseInt(quality.split('-')[1])
          frame = Math.min(num + 1, 9).toString()
        }

        const studioMap = {
          'luxu': '259luxu', 'sone': 'sone', 'ssni': 'ssni', 'ssis': 'ssis',
          'midv': 'midv', 'mida': 'mida', 'jufe': 'jufe', 'adn': 'adn'
        }
        const studio = studioMap[prefix.slice(0, 4)] || prefix

        return `https://image.mgstage.com/images/luxutv/${studio}/${number}/cap_e_${frame}_${code_lower}.jpg`
      } else if (source === 'fourhoi') {
        // Fourhoi pattern
        if (!match) {
          const clean = code.toLowerCase().replace(/-/g, '')
          return `https://fourhoi.com/${clean}/cover-n.jpg`
        }
        const prefix = match[1].toLowerCase()
        const number = match[2]
        const clean = prefix + '-' + number

        let suffix = 'cover-n'
        if (quality === 'jp-1') suffix = 'cover-a'
        else if (quality === 'jp-2') suffix = 'cover-b'
        else if (quality === 'jp-3') suffix = 'cover-c'
        else if (quality === 'jp-4') suffix = 'cover-d'
        else if (quality === 'jp-5') suffix = 'cover-e'
        else if (quality.startsWith('jp-')) {
          const num = parseInt(quality.split('-')[1])
          const suffixes = ['cover-a', 'cover-b', 'cover-c', 'cover-d', 'cover-e', 'cover-f', 'cover-g', 'cover-h']
          suffix = suffixes[Math.min(num - 1, suffixes.length - 1)]
        }

        return `https://fourhoi.com/${clean}/${suffix}.jpg`
      } else {
        // DMM pattern (default)
        if (!match) {
          const clean = code.toLowerCase().replace(/-/g, '')
          return `https://pics.dmm.co.jp/digital/video/${clean}/${clean}${quality}.jpg`
        }
        const prefix = match[1].toLowerCase()
        const number = match[2].padStart(5, '0')
        const clean = prefix + number
        return `https://pics.dmm.co.jp/digital/video/${clean}/${clean}${quality}.jpg`
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
          if (!work.imageUrl) {
            const url = this.generateImageUrl(work.code, 'pl')
            if (await this.validateImageUrl(url)) {
              work.imageUrl = url
              updated++
            } else failed++
          }
        }
      }
      this.artists = [...this.artists]
      this.showToast(updated ? `✅ ${updated} posters${failed ? ` (${failed} failed)` : ''}` : 'No missing posters', updated ? 'success' : 'info')
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
        const data = { timestamp: new Date().toISOString(), version: '2.0', totalWorks: this.totalCount, artists: this.artists }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `works-tracker-${date}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        this.showToast(`✅ Exported ${this.totalCount} works`, 'success')
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
          this.artists = validArtists
          if (this.artists.length) this.activeTab = this.artists[0].name
          const totalCount = validArtists.reduce((sum, a) => sum + (a.mainWorks?.length || 0) + (a.compilations?.length || 0), 0)
          this.showToast(`✅ Imported ${validArtists.length} artists, ${totalCount} works`, 'success')
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

.container {
  min-height: 100vh;
  padding: 15px;
  background: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: white;
  border-radius: 10px;
  margin-bottom: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  gap: 20px;
  flex-wrap: wrap;
}

header h1 {
  font-size: 1.5em;
  margin-bottom: 3px;
  color: #2563eb;
}

header p {
  color: #666;
  font-size: 0.85em;
}

.search-box {
  flex: 1;
  min-width: 200px;
  position: relative;
}

.image-source-toggle {
  display: flex;
  align-items: center;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 0;
  background: transparent;
  border-radius: 0;
  font-size: 13px;
  font-weight: 600;
  transition: 0.2s;
}

.image-select {
  padding: 8px 12px;
  background: #f0f0f0;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.image-select:hover {
  background: #e0e0e0;
}

.global-search {
  width: 100%;
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.search-results {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #2563eb;
  font-weight: 600;
}

.search-results-container {
  background: white;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
}

.search-result-item {
  padding: 10px;
  margin-bottom: 8px;
  background: #f5f5f5;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goto-btn {
  padding: 4px 12px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btns {
  display: flex;
  gap: 8px;
}

.btns button {
  border: none;
  border-radius: 8px;
  background: #f0f0f0;
  cursor: pointer;
  transition: 0.2s;
  font-weight: 500;
}

.btns button:first-child {
  width: 40px;
  height: 40px;
  font-size: 18px;
  padding: 0;
}

.btn-icon {
  width: 40px;
  height: 40px;
  padding: 0;
  font-size: 18px;
}

.btns button:not(.btn-icon) {
  height: 40px;
  padding: 0 12px;
  font-size: 14px;
}

.btns button:hover {
  transform: scale(1.05);
  background: #e0e0e0;
}

.artist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 15px;
}

.artist-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px;
  cursor: pointer;
  transition: 0.2s;
  text-align: left;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.artist-card:hover {
  transform: translateY(-2px);
  border-color: #2563eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.artist-card.active {
  background: #e0e7ff;
  border-color: #2563eb;
  color: #2563eb;
}

.artist-photo {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
  background: #e0e0e0;
}

.artist-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artist-photo-small {
  width: 100%;
  height: 120px;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 8px;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
}

.artist-photo-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artist-photo-small.empty {
  background: #f0f0f0;
  color: #999;
}

.photo-placeholder {
  font-size: 40px;
  color: #999;
}

.artist-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease-in;
}

.artist-image:not([src]) {
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

.artist-photo-large {
  width: 120px;
  height: 120px;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
  background: #e0e0e0;
  flex-shrink: 0;
}

.artist-photo-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.artist-card h3 {
  margin: 0;
  font-size: 1.1em;
  color: #2563eb;
  word-break: break-word;
}

.artist-card.active h3 {
  color: #1d4ed8;
}

.work-count {
  margin: 0;
  font-size: 0.9em;
  color: #666;
  font-weight: 700;
}

.artist-card.active .work-count {
  color: #2563eb;
}

.breakdown {
  display: flex;
  gap: 8px;
  font-size: 0.85em;
  flex-wrap: wrap;
}

.breakdown span {
  background: #f0f0f0;
  padding: 3px 8px;
  border-radius: 4px;
  color: #666;
  font-weight: 600;
}

.breakdown .main {
  background: #fef3c7;
  color: #92400e;
}

.breakdown .comp {
  background: #dbeafe;
  color: #0c4a6e;
}

.studio-tag {
  font-size: 0.8em;
  color: #666;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
  width: fit-content;
}

.artist-card.active .breakdown span {
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
}

.artist-content {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.artist-header {
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.artist-info {
  display: flex;
  gap: 15px;
  flex: 1;
}

.artist-photo-large {
  width: 120px;
  height: 120px;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
  background: #e0e0e0;
  flex-shrink: 0;
}

.artist-photo-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artist-header h2 {
  font-size: 1.8em;
  color: #2563eb;
  margin-bottom: 5px;
}

.artist-header p {
  color: #666;
  font-size: 14px;
}

.studio-info {
  margin-top: 5px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.sort-select {
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  cursor: pointer;
  transition: 0.2s;
}

.sort-select:hover {
  border-color: #2563eb;
}

.add-work-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: white;
  font-size: 18px;
  cursor: pointer;
  transition: 0.2s;
  flex-shrink: 0;
}

.add-work-btn:hover {
  background: #1d4ed8;
  transform: scale(1.05);
}

.artist-content h3 {
  font-size: 12px;
  text-transform: uppercase;
  color: #666;
  margin: 20px 0 12px;
  letter-spacing: 0.5px;
  font-weight: 700;
}

.artist-content h3:first-of-type {
  margin-top: 0;
}

.grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8f9fa;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: 0.2s;
  position: relative;
}

.card:hover {
  transform: translateY(-2px);
  border-color: #2563eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.preview-gallery {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: thin;
}

.preview-gallery::-webkit-scrollbar {
  height: 6px;
}

.preview-gallery::-webkit-scrollbar-track {
  background: #f0f0f0;
}

.preview-gallery::-webkit-scrollbar-thumb {
  background: #2563eb;
  border-radius: 3px;
}

.preview-item {
  flex-shrink: 0;
  width: auto;
  height: 20vw;
  border-radius: 8px;
  overflow: hidden;
  background: #e0e0e0;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  align-items: center;
}

.preview-item:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.preview-item img {
  height: 100%;
  width: auto;
  object-fit: contain;
  display: block;
}

.card-overlay {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: 0.2s;
  z-index: 10;
}

.card:hover .card-overlay {
  opacity: 1;
}

.overlay-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: 0.2s;
}

.copy-btn {
  background: rgba(100, 116, 139, 0.9);
}

.copy-btn:hover {
  background: rgba(100, 116, 139, 1);
  transform: scale(1.1);
}

.link-btn {
  background: rgba(37, 99, 235, 0.9);
}

.link-btn:hover {
  background: rgba(37, 99, 235, 1);
  transform: scale(1.1);
}




.info {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
}

.info div:first-child {
  flex: 1;
  min-width: 0;
}

.info strong {
  display: block;
  color: #2563eb;
  font-size: 20px;
  font-weight: 700;
}

.work-controls {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
}

.work-image-select {
  padding: 6px 10px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.work-image-select:hover {
  background: #f5f5f5;
  border-color: #2563eb;
}

.link-buttons {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.link-btn-small {
  padding: 6px 12px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.link-btn-small:hover {
  background: #1d4ed8;
  transform: scale(1.05);
}

.typo-warning {
  display: inline-block;
  margin-left: 8px;
  font-size: 14px;
}

.release-date {
  display: block;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-box {
  background: white;
  border-radius: 12px;
  padding: 25px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-box h3 {
  margin-bottom: 20px;
  color: #2563eb;
}

.modal-box label {
  display: block;
  margin-bottom: 15px;
  font-weight: 600;
  font-size: 14px;
}

.modal-box input,
.modal-box select {
  width: 100%;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  margin-top: 5px;
  font-size: 14px;
}

.artist-select {
  width: 100%;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.radios {
  display: flex;
  gap: 15px;
  margin-top: 8px;
}

.radios label {
  margin: 0;
  font-weight: normal;
}

.modal-btns {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn {
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  background: #2563eb;
  color: white;
  font-weight: 600;
  transition: 0.2s;
  flex: 1;
}

.btn:hover {
  background: #1d4ed8;
}

.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.toast.success {
  background: #16a34a;
}

.toast.error {
  background: #dc2626;
}

.toast.info {
  background: #2563eb;
}

.fade-enter-active,
.fade-leave-active {
  transition: 0.3s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.dark-mode {
  background: #1a1a1a;
  color: #e0e0e0;
}

.dark-mode header,
.dark-mode .artist-content {
  background: #2d2d2d;
  color: #e0e0e0;
}

.dark-mode .global-search {
  background: #1e1e1e;
  color: #e0e0e0;
  border-color: #404040;
}

.dark-mode .artist-card {
  background: #1e1e1e;
  border-color: #404040;
}

.dark-mode .artist-card.active {
  background: rgba(59, 130, 246, 0.15);
  border-color: #3b82f6;
}

.dark-mode .card {
  background: #1e1e1e;
  border-color: #404040;
}

.dark-mode .sort-select {
  background: #1e1e1e;
  color: #e0e0e0;
  border-color: #404040;
}

.dark-mode .modal-box {
  background: #2d2d2d;
  color: #3b82f6;
}

.dark-mode .work-image-select {
  background: #2d2d2d;
  color: #e0e0e0;
  border-color: #404040;
}

.dark-mode .work-image-select:hover {
  background: #3a3a3a;
  border-color: #3b82f6;
}

@media (max-width: 768px) {
  header {
    flex-direction: column;
    gap: 12px;
  }

  .artist-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }

  .artist-header {
    flex-direction: column;
  }

  .preview-item {
    height: 40vw;
  }
}
</style>