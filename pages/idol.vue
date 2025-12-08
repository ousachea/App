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
      </div>
    </header>

    <!-- Controls -->
    <div class="controls">
      <input v-model="searchQuery" type="text" placeholder="🔍 Search..." class="search" />

      <button @click="handleExport" class="btn">📥 Export JSON</button>
      <button @click="handleImportClick" class="btn">📤 Import</button>
      <input ref="fileInput" type="file" accept=".json" @change="handleImport" hidden />
    </div>

    <!-- Artists -->
    <div v-for="artist in filteredArtists" :key="artist.name" class="artist">
      <div class="artist-info" @click="toggleArtist(artist)">
        <div>
          <h2>{{ artist.name }}</h2>
          <p>{{ (artist.mainWorks?.length || 0) + (artist.compilations?.length || 0) }} works</p>
        </div>
        <button class="toggle-btn" @click.stop>{{ artist.collapsed ? '▶' : '▼' }}</button>
      </div>

      <div v-show="!artist.collapsed">

        <!-- Main Works -->
        <div v-if="artist.mainWorks?.length">
          <h3>📌 Main Works</h3>
          <div class="grid">
            <div v-for="work in artist.mainWorks" :key="work.code" class="card">
              <div class="preview-gallery">
                <div class="preview-item">
                  <img :src="generateImageUrl(work.code, 'pl')" :alt="`${work.code} cover`" />
                </div>
                <div v-for="i in 10" :key="i" class="preview-item">
                  <img :src="generateImageUrl(work.code, `jp-${i}`)" :alt="`${work.code} preview ${i}`" />
                </div>
              </div>
              <div class="card-overlay">
                <button @click.stop="openExternalLink(work.code)" class="overlay-btn link-btn"
                  title="Open in NJAV">🔗</button>

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
                <div class="preview-item">
                  <img :src="generateImageUrl(work.code, 'pl')" :alt="`${work.code} cover`" />
                </div>
                <div v-for="i in 10" :key="i" class="preview-item">
                  <img :src="generateImageUrl(work.code, `jp-${i}`)" :alt="`${work.code} preview ${i}`" />
                </div>
              </div>
              <div class="card-overlay">
                <button @click.stop="openExternalLink(work.code)" class="overlay-btn link-btn"
                  title="Open in NJAV">🔗</button>

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
  </div>
</template>

<script>
export default {
  name: 'Works',
  data() {
    return {
      searchQuery: '',
      toast: { show: false, message: '', type: 'success' },
      artists: [
        {
          name: 'Minato Haru',
          period: '2019–2022',
          mainWorks: [
            { code: 'SONE-978' },
            { code: 'SONE-914' },
            { code: 'SONE-865' },
            { code: 'MIRD-259' },
            { code: 'OFES-013' },
            { code: 'SONE-776' },
            { code: 'SONE-508' },
            { code: 'FWAY-060' },
            { code: 'SONE-503' },
            { code: 'SONE-155' },
            { code: 'SONE-188' },
            { code: 'SONE-063' },
            { code: 'SONE-021' },
            { code: 'SSIS-978' },
            { code: 'FWAY-002' },
            { code: 'SSIS-945' },
            { code: 'SSIS-890' },
            { code: 'SSIS-889' }
          ]
        },
        {
          name: 'Moa Maeda',
          period: '2019–2022',
          mainWorks: [
            { code: 'ADN-334' },
            { code: 'MIMK-091' },
            { code: 'JUFE-300' },
            { code: 'WAAA-065' },
            { code: 'HND-991' },
            { code: 'PPPD-926' },
            { code: 'MSFH-034' },
            { code: 'MSFH-030' },
            { code: 'MSFH-024' },
            { code: 'MSFH-018' },
            { code: 'MSFH-014' },
            { code: 'MSFH-010' }
          ]
        },
        {
          name: 'Mitsuki Momota',
          period: '2019–2022',
          mainWorks: [
            { code: 'MIDA-424' },
            { code: 'MIDA-026' },
            { code: 'REBD-854' },
            { code: 'OAE-253' },
            { code: 'FWAY-047' },
            { code: 'MIDV-869' },
            { code: 'MIDV-569' },
            { code: 'MIDA-346' },
            { code: 'MIDV-668' },
            { code: 'MIDV-831' },
            { code: 'MIDV-574' },
            { code: 'MIDV-577' },
            { code: 'MIDA-102' },
            { code: 'MIDA-190' },
            { code: 'MIDV-985' },
            { code: 'MIDV-637' },
            { code: 'MIDA-305' },
            { code: 'MIDA-139' },
            { code: 'MIDA-258' },
            { code: 'MIDV-769' },
            { code: 'MDVR-325' },
            { code: 'MIDV-905' },
            { code: 'MIDV-804' },
            { code: 'MIDA-214' },
            { code: 'MIDA-064' },
            { code: 'MDVR-317' },
            { code: 'MDVR-288' },
            { code: 'MIDA-385' },
            { code: 'NAAC-032' },
            { code: 'MIDV-698' }
          ],
          compilations: [
            { code: 'OFJE-279' }
          ]
        },
        {
          name: 'Anzai Rara',
          period: '2019–2022',
          mainWorks: [
            { code: 'SSIS-025' },
            { code: 'SSIS-050' },
            { code: 'SSIS-103' },
            { code: 'SSIS-124' },
            { code: 'SSIS-136' },
            { code: 'SSIS-172' },
            { code: 'SSIS-203' },
            { code: 'SSIS-232' },
            { code: 'SSIS-262' },
            { code: 'SSIS-269' },
            { code: 'SSIS-357' },
            { code: 'SSNI-643' },
            { code: 'SSNI-671' },
            { code: 'SSNI-700' },
            { code: 'SSNI-727' },
            { code: 'SSNI-752' },
            { code: 'SSNI-777' },
            { code: 'SSNI-799' },
            { code: 'SSNI-822' }
          ],
          compilations: [
            { code: 'OFJE-279' },
            { code: 'OFJE-288' },
            { code: 'OFJE-354' },
            { code: 'OFJE-410' }
          ]
        },
        {
          name: 'RION',
          period: '2015–2018',
          mainWorks: [
            { code: 'SNIS-517' },
            { code: 'SNIS-539' },
            { code: 'SNIS-561' },
            { code: 'SNIS-594' },
            { code: 'SNIS-603' },
            { code: 'SNIS-623' },
            { code: 'SNIS-640' },
            { code: 'SNIS-656' },
            { code: 'SNIS-673' },
            { code: 'SNIS-692' },
            { code: 'SNIS-712' },
            { code: 'SNIS-731' },
            { code: 'SNIS-752' },
            { code: 'SNIS-774' },
            { code: 'SNIS-787' },
            { code: 'SNIS-811' },
            { code: 'SNIS-824' },
            { code: 'SNIS-895' },
            { code: 'SNIS-918' },
            { code: 'SNIS-939' },
            { code: 'SNIS-963' },
            { code: 'SNIS-985' },
            { code: 'SSNI-008' },
            { code: 'SSNI-029' },
            { code: 'SSNI-053' },
            { code: 'SSNI-100' },
            { code: 'SSNI-126' },
            { code: 'SSNI-151' },
            { code: 'SSNI-177' },
            { code: 'SSNI-204' },
            { code: 'SSNI-228' },
            { code: 'SSNI-241' },
            { code: 'SSNI-268' },
            { code: 'SSNI-290' },
            { code: 'EBOD-609' }
          ],
          compilations: [
            { code: 'OFJE-104' },
            { code: 'OFJE-144' },
            { code: 'OFJE-255' }
          ]
        },
        {
          name: 'Utsunomiya Shion',
          period: '2013–2014',
          mainWorks: [
            { code: 'SOE-992' },
            { code: 'SNIS-009' },
            { code: 'SNIS-027' },
            { code: 'SNIS-048' },
            { code: 'SNIS-070' },
            { code: 'SNIS-091' },
            { code: 'SNIS-110' },
            { code: 'SNIS-129' },
            { code: 'SNIS-147' },
            { code: 'SNIS-166' },
            { code: 'AVOP-004' },
            { code: 'SNIS-205' }
          ],
          compilations: [
            { code: 'ONSD-850' },
            { code: 'ONSD-899' }
          ]
        },
        {
          name: 'Hitomi Tanaka',
          period: '2013–2014',
          mainWorks: [
            { code: 'MIMK-007' }
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

      // Initialize all artists as expanded (collapsed = false)
      this.artists.forEach(artist => {
        if (artist.collapsed === undefined) {
          this.$set(artist, 'collapsed', false)
        }
      })

      window.addEventListener('keydown', this.handleModalKeydown)
    }
  },
  beforeDestroy() {
    if (process.client) window.removeEventListener('keydown', this.handleModalKeydown)
  },
  methods: {
    toggleArtist(artist) {
      this.$set(artist, 'collapsed', !artist.collapsed)
    },
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
/* Artist */
.artist {
  background: white;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.artist-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: 0.2s;
  border-radius: 6px;
}

.artist-info:hover {
  background: #f8f9fa;
}

.artist-info>div {
  flex: 1;
}

.toggle-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #2563eb;
  color: white;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: 0.2s;
  flex-shrink: 0;
}

.toggle-btn:hover {
  background: #1d4ed8;
  transform: scale(1.1);
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
    width: auto;
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