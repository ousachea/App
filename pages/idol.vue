<!-- pages/works.vue -->
<template>
  <div class="container">
    <!-- Header -->
    <header>
      <div>
        <h1>🎬 Works Tracker</h1>
        <p>{{ totalCount }} total works</p>
      </div>
      <div class="btns">
        <button @click="autoFillImages" title="Auto-fill images">🖼️</button>
        <button @click="openAddModal" title="Add item">➕</button>
      </div>
    </header>

    <!-- Controls -->
    <div class="controls">
      <input v-model="searchQuery" type="text" placeholder="🔍 Search..." class="search" />

      <button @click="handleExport" class="btn">📥 Export JSON</button>
      <button @click="handleImportClick" class="btn">📤 Import</button>
      <input ref="fileInput" type="file" accept=".json" @change="handleImport" hidden />
    </div>

    <!-- Progress -->
    <div class="progress">
      <div class="bar">
        <div class="fill" style="width: 100%" />
      </div>
      <span>{{ totalCount }} works</span>
    </div>

    <!-- Artists -->
    <div v-for="artist in filteredArtists" :key="artist.name" class="artist">
      <div class="artist-info">
        <h2>{{ artist.name }}</h2>
        <p>{{ (artist.mainWorks?.length || 0) + (artist.compilations?.length || 0) }} works</p>
      </div>

      <!-- Main Works -->
      <div v-if="artist.mainWorks?.length">
        <h3>📌 Main Works</h3>
        <div class="grid">
          <div v-for="work in artist.mainWorks" :key="work.code" class="card">
            <div class="preview-gallery">
              <div class="preview-item" @click="openSampleViewer(work, artist.name)">
                <img :src="generateImageUrl(work.code, 'pl')" :alt="`${work.code} cover`" />
              </div>
              <div v-for="i in 10" :key="i" class="preview-item" @click="openSampleViewer(work, artist.name)">
                <img :src="generateImageUrl(work.code, `jp-${i}`)" :alt="`${work.code} preview ${i}`" />
              </div>
            </div>
            <div class="card-overlay">
              <button @click.stop="openExternalLink(work.code)" class="overlay-btn link-btn"
                title="Open in NJAV">🔗</button>
              <button @click.stop="openEditModal(work, artist.name)" class="overlay-btn edit-btn"
                title="Edit">✏️</button>
            </div>
            <div class="info">
              <div>
                <strong>{{ work.code }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Compilations -->
      <div v-if="artist.compilations?.length">
        <h3>📂 Compilations</h3>
        <div class="grid">
          <div v-for="work in artist.compilations" :key="work.code" class="card">
            <div class="preview-gallery">
              <div class="preview-item" @click="openSampleViewer(work, artist.name)">
                <img :src="generateImageUrl(work.code, 'pl')" :alt="`${work.code} cover`" />
              </div>
              <div v-for="i in 10" :key="i" class="preview-item" @click="openSampleViewer(work, artist.name)">
                <img :src="generateImageUrl(work.code, `jp-${i}`)" :alt="`${work.code} preview ${i}`" />
              </div>
            </div>
            <div class="card-overlay">
              <button @click.stop="openExternalLink(work.code)" class="overlay-btn link-btn"
                title="Open in NJAV">🔗</button>
              <button @click.stop="openEditModal(work, artist.name)" class="overlay-btn edit-btn"
                title="Edit">✏️</button>
            </div>
            <div class="info">
              <div>
                <strong>{{ work.code }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!filteredArtists.length" class="empty">
      <p>❌ No results found</p>
    </div>

    <!-- Toast -->
    <transition name="fade">
      <div v-if="toast.show" :class="['toast', toast.type]">
        {{ toast.message }}
      </div>
    </transition>

    <!-- Add Modal -->
    <div v-if="showAddModal" class="modal" @click="closeAddModal">
      <div class="modal-box" @click.stop>
        <h3>➕ Add Item</h3>
        <label>
          Artist
          <select v-model="newItem.artist">
            <option value="">Select Artist</option>
            <option v-for="artist in artists" :key="artist.name" :value="artist.name">
              {{ artist.name }}
            </option>
          </select>
        </label>
        <label>
          Code
          <input v-model="newItem.code" placeholder="e.g., SSIS-001" @keyup.enter="addNewItem" />
        </label>
        <label>
          Image URL (optional)
          <input v-model="newItem.imageUrl" type="url" placeholder="https://..." />
        </label>
        <label>
          Type
          <div class="radios">
            <label><input v-model="newItem.type" type="radio" value="mainWorks" /> Main</label>
            <label><input v-model="newItem.type" type="radio" value="compilations" /> Compilation</label>
          </div>
        </label>
        <div class="modal-btns">
          <button @click="closeAddModal" class="btn">Cancel</button>
          <button @click="addNewItem" class="btn">Add</button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal" @click="closeEditModal">
      <div class="modal-box" @click.stop>
        <h3>✏️ Edit Item</h3>
        <label>
          Code
          <input v-model="editItem.code" disabled />
        </label>
        <label>
          Image URL
          <input v-model="editItem.imageUrl" type="url" placeholder="https://..." />
        </label>
        <button @click="autoGenerateEditImage" class="btn" style="width:100%;margin-bottom:15px">
          🖼️ Auto-Generate
        </button>
        <div class="modal-btns">
          <button @click="closeEditModal" class="btn">Cancel</button>
          <button @click="saveEditedItem" class="btn">Save</button>
        </div>
      </div>
    </div>

    <!-- Sample Viewer -->
    <div v-if="showSampleModal" class="modal fullscreen" @click="closeSampleViewer">
      <div class="slideshow" @click.stop>
        <div class="slideshow-header">
          <div>
            <h3>📸 {{ currentSampleCode }}</h3>
            <p>{{ currentSampleArtist }} ({{ currentSlideIndex + 1 }}/{{ sampleImages.length }})</p>
          </div>
          <button @click="closeSampleViewer">✕</button>
        </div>

        <div class="slideshow-main">
          <button @click="prevSlide" class="nav prev">❮</button>
          <div class="slides">
            <div v-for="(sample, i) in sampleImages" :key="i" :class="['slide', { active: i === currentSlideIndex }]">
              <img :src="sample.url" :alt="sample.label" />
              <p>{{ sample.label }}</p>
            </div>
          </div>
          <button @click="nextSlide" class="nav next">❯</button>
        </div>

        <div class="thumbs">
          <div v-for="(sample, i) in sampleImages" :key="i" :class="['thumb', { active: i === currentSlideIndex }]"
            @click="goToSlide(i)">
            <img :src="sample.url" :alt="sample.label" />
            <span>{{ i + 1 }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Works',
  data() {
    return {
      searchQuery: '',
      showAddModal: false,
      showEditModal: false,
      showSampleModal: false,
      currentSampleCode: null,
      currentSampleArtist: null,
      sampleImages: [],
      currentSlideIndex: 0,
      newItem: { artist: '', code: '', name: '', type: 'mainWorks', imageUrl: '' },
      editItem: { code: '', imageUrl: '', artist: '' },
      editImageError: false,
      toast: { show: false, message: '', type: 'success' },
      artists: [
        {
          name: 'Minato Haru',
          period: '2019–2022',
          mainWorks: [
            { code: 'SONE-978', name: '' },
            { code: 'SONE-914', name: 'Minato Haru' },
            { code: 'SONE-865', name: 'Minato Haru' },
            { code: 'MIRD-259', name: 'Minato Haru' },
            { code: 'OFES-013', name: 'Minato Haru' },
            { code: 'SONE-776', name: 'Minato Haru' },
            { code: 'SONE-508', name: 'Minato Haru' },
            { code: 'FWAY-060', name: 'Minato Haru' },
            { code: 'SONE-503', name: 'Minato Haru' },
            { code: 'SONE-155', name: 'Minato Haru' },
            { code: 'SONE-188', name: 'Minato Haru' },
            { code: 'SONE-063', name: 'Minato Haru' },
            { code: 'SONE-021', name: 'Minato Haru' },
            { code: 'SSIS-978', name: 'Minato Haru' },
            { code: 'FWAY-002', name: 'Minato Haru' },
            { code: 'SSIS-945', name: 'Minato Haru' },
            { code: 'SSIS-890', name: 'Minato Haru' },
            { code: 'SSIS-889', name: 'Minato Haru' }
          ]
        },
        {
          name: 'Moa Maeda',
          period: '2019–2022',
          mainWorks: [
            { code: 'ADN-334', name: 'Moa Maeda' },
            { code: 'MIMK-091', name: 'Moa Maeda' },
            { code: 'JUFE-300', name: 'Moa Maeda' },
            { code: 'WAAA-065', name: 'Moa Maeda' },
            { code: 'HND-991', name: 'Moa Maeda' },
            { code: 'PPPD-926', name: 'Moa Maeda' },
            { code: 'MSFH-034', name: 'Moa Maeda' },
            { code: 'MSFH-030', name: 'Moa Maeda' },
            { code: 'MSFH-024', name: 'Moa Maeda' },
            { code: 'MSFH-018', name: 'Moa Maeda' },
            { code: 'MSFH-014', name: 'Moa Maeda' },
            { code: 'MSFH-010', name: 'Moa Maeda' }
          ]
        },
        {
          name: 'Mitsuki Momota',
          period: '2019–2022',
          mainWorks: [
            { code: 'MIDA-424', name: 'Mitsuki Momota' },
            { code: 'MIDA-026', name: 'Mitsuki Momota' },
            { code: 'REBD-854', name: 'Mitsuki Momota' },
            { code: 'OAE-253', name: 'Mitsuki Momota' },
            { code: 'FWAY-047', name: 'Mitsuki Momota' },
            { code: 'MIDV-869', name: 'Mitsuki Momota' },
            { code: 'MIDV-569', name: 'Mitsuki Momota' },
            { code: 'MIDA-346', name: 'Mitsuki Momota' },
            { code: 'MIDV-668', name: 'Mitsuki Momota' },
            { code: 'MIDV-831', name: 'Mitsuki Momota' },
            { code: 'MIDV-574', name: 'Mitsuki Momota' },
            { code: 'MIDV-577', name: 'Mitsuki Momota' },
            { code: 'MIDA-102', name: 'Mitsuki Momota' },
            { code: 'MIDA-190', name: 'Mitsuki Momota' },
            { code: 'MIDV-985', name: 'Mitsuki Momota' },
            { code: 'MIDV-637', name: 'Mitsuki Momota' },
            { code: 'MIDA-305', name: 'Mitsuki Momota' },
            { code: 'MIDA-139', name: 'Mitsuki Momota' },
            { code: 'MIDA-258', name: 'Mitsuki Momota' },
            { code: 'MIDV-769', name: 'Mitsuki Momota' },
            { code: 'MDVR-325', name: 'Mitsuki Momota' },
            { code: 'MIDV-905', name: 'Mitsuki Momota' },
            { code: 'MIDV-804', name: 'Mitsuki Momota' },
            { code: 'MIDA-214', name: 'Mitsuki Momota' },
            { code: 'MIDA-064', name: 'Mitsuki Momota' },
            { code: 'MDVR-317', name: 'Mitsuki Momota' },
            { code: 'MDVR-288', name: 'Mitsuki Momota' },
            { code: 'MIDA-385', name: 'Mitsuki Momota' },
            { code: 'NAAC-032', name: 'Mitsuki Momota' },
            { code: 'MIDV-698', name: 'Mitsuki Momota' }
          ],
          compilations: [
            { code: 'OFJE-279', name: 'Anzai Rara' }
          ]
        },
        {
          name: 'Anzai Rara',
          period: '2019–2022',
          mainWorks: [
            { code: 'SSIS-025', name: 'Anzai Rara' },
            { code: 'SSIS-050', name: 'Anzai Rara' },
            { code: 'SSIS-103', name: 'Anzai Rara' },
            { code: 'SSIS-124', name: 'Anzai Rara' },
            { code: 'SSIS-136', name: 'Anzai Rara' },
            { code: 'SSIS-172', name: 'Anzai Rara' },
            { code: 'SSIS-203', name: 'Anzai Rara' },
            { code: 'SSIS-232', name: 'Anzai Rara' },
            { code: 'SSIS-262', name: 'Anzai Rara' },
            { code: 'SSIS-269', name: 'Anzai Rara' },
            { code: 'SSIS-357', name: 'Anzai Rara' },
            { code: 'SSNI-643', name: 'Anzai Rara' },
            { code: 'SSNI-671', name: 'Anzai Rara' },
            { code: 'SSNI-700', name: 'Anzai Rara' },
            { code: 'SSNI-727', name: 'Anzai Rara' },
            { code: 'SSNI-752', name: 'Anzai Rara' },
            { code: 'SSNI-777', name: 'Anzai Rara' },
            { code: 'SSNI-799', name: 'Anzai Rara' },
            { code: 'SSNI-822', name: 'Anzai Rara' }
          ],
          compilations: [
            { code: 'OFJE-279', name: 'Anzai Rara' },
            { code: 'OFJE-288', name: 'Anzai Rara' },
            { code: 'OFJE-354', name: 'Anzai Rara' },
            { code: 'OFJE-410', name: 'Anzai Rara' }
          ]
        },
        {
          name: 'RION',
          period: '2015–2018',
          mainWorks: [
            { code: 'SNIS-517', name: 'RION' },
            { code: 'SNIS-539', name: 'RION' },
            { code: 'SNIS-561', name: 'RION' },
            { code: 'SNIS-594', name: 'RION' },
            { code: 'SNIS-603', name: 'RION' },
            { code: 'SNIS-623', name: 'RION' },
            { code: 'SNIS-640', name: 'RION' },
            { code: 'SNIS-656', name: 'RION' },
            { code: 'SNIS-673', name: 'RION' },
            { code: 'SNIS-692', name: 'RION' },
            { code: 'SNIS-712', name: 'RION' },
            { code: 'SNIS-731', name: 'RION' },
            { code: 'SNIS-752', name: 'RION' },
            { code: 'SNIS-774', name: 'RION' },
            { code: 'SNIS-787', name: 'RION' },
            { code: 'SNIS-811', name: 'RION' },
            { code: 'SNIS-824', name: 'RION' },
            { code: 'SNIS-895', name: 'RION' },
            { code: 'SNIS-918', name: 'RION' },
            { code: 'SNIS-939', name: 'RION' },
            { code: 'SNIS-963', name: 'RION' },
            { code: 'SNIS-985', name: 'RION' },
            { code: 'SSNI-008', name: 'RION' },
            { code: 'SSNI-029', name: 'RION' },
            { code: 'SSNI-053', name: 'RION' },
            { code: 'SSNI-100', name: 'RION' },
            { code: 'SSNI-126', name: 'RION' },
            { code: 'SSNI-151', name: 'RION' },
            { code: 'SSNI-177', name: 'RION' },
            { code: 'SSNI-204', name: 'RION' },
            { code: 'SSNI-228', name: 'RION' },
            { code: 'SSNI-241', name: 'RION' },
            { code: 'SSNI-268', name: 'RION' },
            { code: 'SSNI-290', name: 'RION' },
            { code: 'EBOD-609', name: 'RION' }
          ],
          compilations: [
            { code: 'OFJE-104', name: 'RION' },
            { code: 'OFJE-144', name: 'RION' },
            { code: 'OFJE-255', name: 'RION' }
          ]
        },
        {
          name: 'Utsunomiya Shion',
          period: '2013–2014',
          mainWorks: [
            { code: 'SOE-992', name: 'Utsunomiya Shion' },
            { code: 'SNIS-009', name: 'Utsunomiya Shion' },
            { code: 'SNIS-027', name: 'Utsunomiya Shion' },
            { code: 'SNIS-048', name: 'Utsunomiya Shion' },
            { code: 'SNIS-070', name: 'Utsunomiya Shion' },
            { code: 'SNIS-091', name: 'Utsunomiya Shion' },
            { code: 'SNIS-110', name: 'Utsunomiya Shion' },
            { code: 'SNIS-129', name: 'Utsunomiya Shion' },
            { code: 'SNIS-147', name: 'Utsunomiya Shion' },
            { code: 'SNIS-166', name: 'Utsunomiya Shion' },
            { code: 'AVOP-004', name: 'Utsunomiya Shion' },
            { code: 'SNIS-205', name: 'Utsunomiya Shion' }
          ],
          compilations: [
            { code: 'ONSD-850', name: 'Utsunomiya Shion' },
            { code: 'ONSD-899', name: 'Utsunomiya Shion' }
          ]
        },
        {
          name: 'Hitomi Tanaka',
          period: '2013–2014',
          mainWorks: [
            { code: 'MIMK-007', name: 'Hitomi Tanaka' }
          ]
        }
      ]
    }
  },
  computed: {
    totalCount() {
      return this.artists.reduce((sum, a) =>
        sum + (a.mainWorks?.length || 0) + (a.compilations?.length || 0), 0)
    },
    filteredArtists() {
      const q = this.searchQuery.toLowerCase()
      return this.artists
        .map(a => ({
          ...a,
          mainWorks: (a.mainWorks || []).filter(w =>
            w.code?.toLowerCase().includes(q) || w.name?.toLowerCase().includes(q)),
          compilations: (a.compilations || []).filter(w =>
            w.code?.toLowerCase().includes(q) || w.name?.toLowerCase().includes(q))
        }))
        .filter(a => a.mainWorks.length || a.compilations.length)
    }
  },
  watch: {
    artists: { handler(v) { if (process.client) localStorage.setItem('artists', JSON.stringify(v)) }, deep: true }
  },
  mounted() {
    if (process.client) {
      const artists = localStorage.getItem('artists')
      if (artists) try {
        const parsed = JSON.parse(artists)
        if (Array.isArray(parsed) && parsed.length) this.artists = parsed
      } catch (e) { }

      window.addEventListener('keydown', this.handleModalKeydown)
    }
  },
  beforeDestroy() {
    if (process.client) window.removeEventListener('keydown', this.handleModalKeydown)
  },
  methods: {
    getImageUrl(work) {
      // Use 'pl' quality for card preview images
      return work.imageUrl || this.generateImageUrl(work.code, 'pl')
    },
    generateImageUrl(code, quality = 'pl') {
      if (!code) return null
      const upper = code.toUpperCase()
      const match = upper.match(/^([A-Z]+)-?(\d+)$/)
      if (!match) {
        const clean = code.toLowerCase().replace(/-/g, '')
        return `https://pics.dmm.co.jp/digital/video/${clean}/${clean}${quality}.jpg`
      }
      const prefix = match[1].toLowerCase()
      const number = match[2].padStart(5, '0')
      const clean = prefix + number
      return `https://pics.dmm.co.jp/digital/video/${clean}/${clean}${quality}.jpg`
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
      this.showToast('Checking images...', 'info')
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
      this.showToast(updated ? `✅ ${updated} images${failed ? ` (${failed} failed)` : ''}` : 'No missing images', updated ? 'success' : 'info')
    },
    async autoGenerateEditImage() {
      if (!this.editItem.code) return this.showToast('No code', 'error')
      const url = this.generateImageUrl(this.editItem.code, 'pl')
      if (await this.validateImageUrl(url)) {
        this.editItem.imageUrl = url
        this.showToast('✅ Generated', 'success')
      } else this.showToast('⚠️ Failed', 'error')
    },
    generateSampleUrls(code, count = 10) {
      if (!code) return []
      const upper = code.toUpperCase()
      const match = upper.match(/^([A-Z]+)-?(\d+)$/)
      if (!match) return []
      const prefix = match[1].toLowerCase()
      const number = match[2].padStart(5, '0')
      const clean = prefix + number
      const base = `https://pics.dmm.co.jp/digital/video/${clean}/${clean}`
      return [
        { url: `${base}pl.jpg`, label: 'Cover (Small)' },
        { url: `${base}ps.jpg`, label: 'Cover (Medium)' },
        { url: `${base}jp-1.jpg`, label: 'Cover (Large)' },
        ...Array.from({ length: count }, (_, i) => ({
          url: `${base}jp-${i + 2}.jpg`,
          label: `Sample ${i + 1}`
        }))
      ]
    },
    openSampleViewer(work, artist) {
      console.log('Opening sample viewer for:', work.code, artist)
      this.currentSampleCode = work.code
      this.currentSampleArtist = artist
      this.sampleImages = this.generateSampleUrls(work.code)
      console.log('Sample images generated:', this.sampleImages.length)
      this.currentSlideIndex = 0
      this.showSampleModal = true
      console.log('Modal should now be visible:', this.showSampleModal)
    },
    closeSampleViewer() {
      this.showSampleModal = false
      this.currentSampleCode = null
      this.currentSampleArtist = null
      this.sampleImages = []
      this.currentSlideIndex = 0
    },
    openExternalLink(code) {
      if (!code) return
      // Convert code to lowercase and remove hyphen for URL format
      const formattedCode = code.toLowerCase().replace(/-/g, '-')
      const url = `https://www.njav.com/en/xvideos/${formattedCode}`
      window.open(url, '_blank', 'noopener,noreferrer')
    },
    nextSlide() {
      this.currentSlideIndex = this.currentSlideIndex < this.sampleImages.length - 1
        ? this.currentSlideIndex + 1 : 0
    },
    prevSlide() {
      this.currentSlideIndex = this.currentSlideIndex > 0
        ? this.currentSlideIndex - 1 : this.sampleImages.length - 1
    },
    goToSlide(i) { this.currentSlideIndex = i },
    handleModalKeydown(e) {
      if (e.key === 'Escape') {
        if (this.showSampleModal) this.closeSampleViewer()
      }
      if (this.showSampleModal) {
        if (e.key === 'ArrowRight') this.nextSlide()
        else if (e.key === 'ArrowLeft') this.prevSlide()
      }
    },
    filterWorks(works) {
      const q = this.searchQuery.toLowerCase()
      return (works || []).filter(w =>
        w.code?.toLowerCase().includes(q) || w.name?.toLowerCase().includes(q))
    },
    showToast(msg, type = 'success') {
      this.toast = { show: true, message: msg, type }
      setTimeout(() => this.toast.show = false, 3000)
    },
    handleExport() {
      const date = new Date().toISOString().split('T')[0]
      const data = {
        timestamp: date,
        totalWorks: this.totalCount,
        artists: this.artists
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `works-tracker-${date}.json`
      a.click()
      URL.revokeObjectURL(url)
      this.showToast(`Exported ${this.totalCount} works`, 'success')
    },
    handleImportClick() { this.$refs.fileInput.click() },
    handleImport(e) {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const content = event.target.result
          const data = JSON.parse(content)

          if (data.artists && Array.isArray(data.artists)) {
            // Import full artists data
            this.artists = data.artists
            this.showToast(`Imported ${this.totalCount} works`, 'success')
          } else {
            this.showToast('Invalid JSON format', 'error')
          }
        } catch (error) {
          this.showToast('Error reading file: ' + error.message, 'error')
        }
      }
      reader.readAsText(file)
      e.target.value = ''
    },
    closeAddModal() { this.showAddModal = false },
    openEditModal(work, artist) {
      this.editItem = { code: work.code, imageUrl: work.imageUrl || '', artist }
      this.showEditModal = true
    },
    closeEditModal() { this.showEditModal = false },
    saveEditedItem() {
      const artist = this.artists.find(a => a.name === this.editItem.artist)
      if (!artist) return this.showToast('Artist not found', 'error')
      let work = artist.mainWorks?.find(w => w.code === this.editItem.code) ||
        artist.compilations?.find(w => w.code === this.editItem.code)
      if (work) {
        work.imageUrl = this.editItem.imageUrl || null
        this.artists = [...this.artists]
        this.closeEditModal()
        this.showToast(`✅ Updated`, 'success')
      }
    },
    async addNewItem() {
      if (!this.newItem.artist || !this.newItem.code)
        return this.showToast('Fill required fields', 'error')
      const code = this.newItem.code.toUpperCase()
      if (this.artists.some(a => a.mainWorks?.some(w => w.code === code) ||
        a.compilations?.some(w => w.code === code)))
        return this.showToast('Code exists', 'error')
      const artist = this.artists.find(a => a.name === this.newItem.artist)
      if (!artist) return this.showToast('Artist not found', 'error')
      let imageUrl = this.newItem.imageUrl
      if (!imageUrl) {
        const url = this.generateImageUrl(code, 'pl')
        if (await this.validateImageUrl(url)) imageUrl = url
      }
      const work = { code, name: artist.name, imageUrl }
      artist[this.newItem.type].push(work)
      this.artists = [...this.artists]
      this.closeAddModal()
      this.showToast(`✅ Added ${code}`, 'success')
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

/* Header */
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: white;
  border-radius: 10px;
  margin-bottom: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

.btns {
  display: flex;
  gap: 8px;
}

.btns button {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #f0f0f0;
  font-size: 18px;
  cursor: pointer;
  transition: 0.2s;
}

.btns button:hover {
  transform: scale(1.05);
  background: #e0e0e0;
}

/* Controls */
.controls {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.search {
  flex: 1;
  min-width: 200px;
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.btn {
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  background: white;
  font-weight: 600;
  transition: 0.2s;
}

.btn {
  border: none;
  background: #2563eb;
  color: white;
}

.btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn.danger {
  background: #dc2626;
}

.btn.danger:hover {
  background: #b91c1c;
}

/* Progress */
.progress {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  margin-bottom: 15px;
}

.bar {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #16a34a);
  transition: width 0.3s;
}

.progress span {
  font-weight: 600;
  color: #2563eb;
  min-width: 45px;
  text-align: right;
}

/* Artist */
.artist {
  background: white;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.artist-info {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.artist h2 {
  color: #2563eb;
  margin-bottom: 3px;
  font-size: 1.3em;
}

.artist-info p {
  color: #666;
  font-size: 13px;
}

.artist h3 {
  font-size: 12px;
  text-transform: uppercase;
  color: #666;
  margin: 12px 0 8px;
  letter-spacing: 0.5px;
  font-weight: 700;
}

/* Grid */
.grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: white;
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
  width: 30vw;
  height: 20vw;
  border-radius: 8px;
  overflow: hidden;
  background: #e0e0e0;
  cursor: pointer;
  transition: 0.2s;
}

.preview-item:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.link-btn {
  background: rgba(37, 99, 235, 0.9);
}

.link-btn:hover {
  background: rgba(37, 99, 235, 1);
  transform: scale(1.1);
}

.edit-btn {
  background: rgba(0, 0, 0, 0.7);
}

.edit-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: scale(1.1);
}

.info {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 8px;
}

.info div {
  flex: 1;
  min-width: 0;
}

.info strong {
  display: block;
  color: #2563eb;
  font-size: 20px;
  font-weight: 700;
}

/* Empty */
.empty {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 1.2em;
}

/* Toast */
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

/* Modal */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal.fullscreen {
  background: rgba(0, 0, 0, 0.95);
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

.modal-box input:disabled {
  background: #f0f0f0;
  color: #999;
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

.modal-btns .btn {
  flex: 1;
}

/* Slideshow */
.slideshow {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.slideshow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.slideshow-header h3 {
  font-size: 1.3em;
  color: #2563eb;
}

.slideshow-header p {
  color: #666;
  font-size: 14px;
}

.slideshow-header button {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #f0f0f0;
  font-size: 20px;
  cursor: pointer;
}

.slideshow-main {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 80px;
}

.nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  font-size: 32px;
  padding: 15px 12px;
  cursor: pointer;
  border-radius: 8px;
  z-index: 10;
}

.nav:hover {
  background: rgba(0, 0, 0, 0.8);
}

.nav.prev {
  left: 10px;
}

.nav.next {
  right: 10px;
}

.slides {
  position: relative;
  width: 100%;
  max-width: 900px;
  height: 100%;
}

.slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: 0.5s;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.slide.active {
  opacity: 1;
  pointer-events: auto;
}

.slide img {
  width: 100%;
  height: calc(100% - 40px);
  object-fit: contain;
  background: white;
  border-radius: 8px;
}

.slide p {
  text-align: center;
  font-weight: 700;
  padding: 10px;
  background: white;
  border-radius: 8px;
}

.thumbs {
  display: flex;
  gap: 8px;
  padding: 15px;
  overflow-x: auto;
  background: rgba(255, 255, 255, 0.95);
}

.thumb {
  position: relative;
  min-width: 60px;
  height: 80px;
  border: 3px solid transparent;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: 0.2s;
}

.thumb:hover {
  transform: scale(1.1);
  border-color: #2563eb;
}

.thumb.active {
  border-color: #2563eb;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb span {
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

/* Responsive */
@media (max-width: 768px) {
  header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 15px;
  }

  .controls {
    flex-direction: column;
  }

  .preview-item {
    width: 60vw;
    height: 40vw;
  }

  .slideshow-main {
    padding: 15px 50px;
  }

  .nav {
    font-size: 24px;
    padding: 10px 8px;
  }

  .nav.prev {
    left: 5px;
  }

  .nav.next {
    right: 5px;
  }

  .card-overlay {
    opacity: 1;
  }

  .container {
    padding: 10px;
  }

  .artist {
    padding: 12px;
  }

  .info {
    padding: 4px;
  }

  .info strong {
    font-size: 16px;
  }
}
</style>