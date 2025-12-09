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
        <button @click="handleExport" class="btn-icon" title="Export JSON">📥</button>
        <button @click="handleImportClick" class="btn-icon" title="Import">📤</button>
        <button @click="toggleDarkMode" class="btn-icon" title="Toggle dark mode">{{ darkMode ? '☀️' : '🌙' }}</button>
        <button @click="openAddArtistModal" title="Add new artist">➕ Artist</button>
        <input ref="fileInput" type="file" accept=".json" @change="handleImport" hidden />
      </div>
    </header>

    <!-- Tabs -->
    <div class="tabs-container">
      <div class="tabs">
        <button v-for="artist in artists" :key="artist.name" :class="['tab', { active: activeTab === artist.name }]"
          @click="activeTab = artist.name">
          {{ artist.name }}
          <span class="tab-count">{{ (artist.mainWorks?.length || 0) + (artist.compilations?.length || 0) }}</span>
        </button>
      </div>
    </div>

    <!-- Artist Content -->
    <div v-if="currentArtist" class="artist-content">
      <div class="artist-header">
        <div>
          <h2>{{ currentArtist.name }}</h2>
          <p>{{ (currentArtist.mainWorks?.length || 0) + (currentArtist.compilations?.length || 0) }} works</p>
        </div>
        <div class="header-actions">
          <select v-model="sortBy" class="sort-select" title="Sort works">
            <option value="code">Code (A-Z)</option>
            <option value="code-desc">Code (Z-A)</option>
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
                <img :src="generateImageUrl(work.code, 'pl')" :alt="`${work.code} cover`" />
              </div>
              <div v-for="i in 20" :key="i" class="preview-item">
                <img :src="generateImageUrl(work.code, `jp-${i}`)" :alt="`${work.code} preview ${i}`" />
              </div>
            </div>
            <div class="card-overlay">
              <button @click.stop="copyToClipboard(work.code)" class="overlay-btn copy-btn"
                title="Copy code">📋</button>
              <button @click.stop="openExternalLink(work.code)" class="overlay-btn link-btn"
                title="Open in NJAV">🔗</button>
            </div>
            <div class="info">
              <div>
                <strong>{{ work.code }}</strong>
                <span v-if="hasSimilarCode(work.code)" class="typo-warning" title="Similar code exists">⚠️</span>
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
                <img :src="generateImageUrl(work.code, 'pl')" :alt="`${work.code} cover`" />
              </div>
              <div v-for="i in 20" :key="i" class="preview-item">
                <img :src="generateImageUrl(work.code, `jp-${i}`)" :alt="`${work.code} preview ${i}`" />
              </div>
            </div>
            <div class="card-overlay">
              <button @click.stop="copyToClipboard(work.code)" class="overlay-btn copy-btn"
                title="Copy code">📋</button>
              <button @click.stop="openExternalLink(work.code)" class="overlay-btn link-btn"
                title="Open in NJAV">🔗</button>
            </div>
            <div class="info">
              <div>
                <strong>{{ work.code }}</strong>
                <span v-if="hasSimilarCode(work.code)" class="typo-warning" title="Similar code exists">⚠️</span>
              </div>
            </div>
          </div>
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
export default {
  name: 'Works',
  data() {
    return {
      activeTab: '',
      sortBy: 'code',
      darkMode: false,
      toast: { show: false, message: '', type: 'success' },
      showAddWorkModal: false,
      showAddArtistModal: false,
      newWork: {
        artist: '',
        code: '',
        type: 'mainWorks'
      },
      newArtist: {
        name: ''
      },
      artists: [
        {
          name: 'Minato Haru',
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
    currentArtist() {
      return this.artists.find(a => a.name === this.activeTab)
    },
    filteredCurrentMainWorks() {
      if (!this.currentArtist?.mainWorks) return []
      return this.currentArtist.mainWorks
    },
    filteredCurrentCompilations() {
      if (!this.currentArtist?.compilations) return []
      return this.currentArtist.compilations
    },
    sortedFilteredMainWorks() {
      return this.getSortedWorks(this.filteredCurrentMainWorks)
    },
    sortedFilteredCompilations() {
      return this.getSortedWorks(this.filteredCurrentCompilations)
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

      // Load dark mode preference
      const darkModePreference = localStorage.getItem('darkMode')
      if (darkModePreference === 'true') {
        this.darkMode = true
        document.documentElement.classList.add('dark-mode')
      }

      // Set first artist as active tab
      if (this.artists.length) {
        this.activeTab = this.artists[0].name
      }
    }
  },
  methods: {
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
    openExternalLink(code) {
      if (!code) return
      const formattedCode = code.toLowerCase().replace(/-/g, '-')
      const url = `https://www.njav.com/en/xvideos/${formattedCode}`
      window.open(url, '_blank', 'noopener,noreferrer')
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
            this.artists = data.artists
            if (this.artists.length) {
              this.activeTab = this.artists[0].name
            }
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
    openAddWorkModal() {
      this.newWork = { artist: '', code: '', type: 'mainWorks' }
      this.showAddWorkModal = true
    },
    closeAddWorkModal() {
      this.showAddWorkModal = false
    },
    openAddArtistModal() {
      this.newArtist = { name: '' }
      this.showAddArtistModal = true
    },
    closeAddArtistModal() {
      this.showAddArtistModal = false
    },
    async addNewWork() {
      if (!this.newWork.artist || !this.newWork.code) {
        return this.showToast('Fill required fields', 'error')
      }

      const code = this.newWork.code.toUpperCase()

      // Check if code already exists
      const exists = this.artists.some(a =>
        a.mainWorks?.some(w => w.code === code) ||
        a.compilations?.some(w => w.code === code)
      )
      if (exists) {
        return this.showToast('Code already exists', 'error')
      }

      const artist = this.artists.find(a => a.name === this.newWork.artist)
      if (!artist) {
        return this.showToast('Artist not found', 'error')
      }

      // Initialize arrays if they don't exist
      if (!artist[this.newWork.type]) {
        artist[this.newWork.type] = []
      }

      const work = { code }
      artist[this.newWork.type].push(work)

      // Trigger reactivity
      this.artists = [...this.artists]

      this.closeAddWorkModal()
      this.showToast(`✅ Added ${code}`, 'success')
    },
    addNewArtist() {
      if (!this.newArtist.name.trim()) {
        return this.showToast('Artist name required', 'error')
      }

      // Check if artist already exists
      if (this.artists.some(a => a.name === this.newArtist.name)) {
        return this.showToast('Artist already exists', 'error')
      }

      const newArtist = {
        name: this.newArtist.name.trim(),
        mainWorks: [],
        compilations: []
      }

      this.artists.push(newArtist)
      this.artists = [...this.artists]
      this.activeTab = newArtist.name

      this.closeAddArtistModal()
      this.showToast(`✅ Added ${newArtist.name}`, 'success')
    },
    toggleDarkMode() {
      this.darkMode = !this.darkMode
      if (process.client) {
        document.documentElement.classList.toggle('dark-mode', this.darkMode)
        localStorage.setItem('darkMode', this.darkMode)
      }
    },
    getSortedWorks(works) {
      const sorted = [...works]
      if (this.sortBy === 'code') {
        return sorted.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
      } else if (this.sortBy === 'code-desc') {
        return sorted.sort((a, b) => b.code.localeCompare(a.code, undefined, { numeric: true }))
      } else if (this.sortBy === 'added') {
        return sorted.reverse()
      }
      return sorted
    },
    copyToClipboard(code) {
      navigator.clipboard.writeText(code).then(() => {
        this.showToast(`Copied: ${code}`, 'success')
      }).catch(() => {
        this.showToast('Failed to copy', 'error')
      })
    },
    hasSimilarCode(code) {
      const allCodes = this.artists.flatMap(a => [
        ...(a.mainWorks || []).map(w => w.code),
        ...(a.compilations || []).map(w => w.code)
      ])

      const similar = allCodes.filter(c => {
        if (c === code) return false
        // Check if codes are similar (same prefix, off by 1-2 numbers)
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

.btns button:hover {
  transform: scale(1.05);
  background: #e0e0e0;
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
}

.btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Tabs */
.tabs-container {
  background: white;
  border-radius: 10px;
  margin-bottom: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  scrollbar-width: thin;
}

.tabs-container::-webkit-scrollbar {
  height: 6px;
}

.tabs-container::-webkit-scrollbar-track {
  background: #f0f0f0;
}

.tabs-container::-webkit-scrollbar-thumb {
  background: #2563eb;
  border-radius: 3px;
}

.tabs {
  display: flex;
  gap: 0;
  padding: 0;
}

.tab {
  flex: 1;
  min-width: 140px;
  padding: 15px 20px;
  border: none;
  background: white;
  border-bottom: 3px solid transparent;
  color: #666;
  cursor: pointer;
  transition: 0.2s;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
}

.tab:hover {
  background: #f8f9fa;
  color: #2563eb;
}

.tab.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
  background: #f8f9fa;
}

.tab-count {
  background: #e0e7ff;
  color: #2563eb;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
}

.tab.active .tab-count {
  background: #2563eb;
  color: white;
}

/* Artist Content */
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
  align-items: center;
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

.typo-warning {
  display: inline-block;
  margin-left: 8px;
  font-size: 14px;
}

.link-btn:hover {
  background: rgba(37, 99, 235, 1);
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

/* Dark Mode */
:root.dark-mode {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #e0e0e0;
  --text-secondary: #b0b0b0;
  --border-color: #404040;
  --accent: #3b82f6;
}

:root.dark-mode,
:root.dark-mode body {
  background: #1a1a1a;
  color: #e0e0e0;
}

:root.dark-mode .container {
  background: #1a1a1a;
  color: #e0e0e0;
}

:root.dark-mode header {
  background: #2d2d2d;
  color: #e0e0e0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  border-bottom: 1px solid #404040;
}

:root.dark-mode header h1 {
  color: #3b82f6;
}

:root.dark-mode header p {
  color: #b0b0b0;
}

:root.dark-mode .tabs-container {
  background: #2d2d2d;
  border: 1px solid #404040;
}

:root.dark-mode .tab {
  background: #2d2d2d;
  color: #b0b0b0;
  border-bottom-color: transparent;
}

:root.dark-mode .tab:hover {
  background: #363636;
  color: #3b82f6;
}

:root.dark-mode .tab.active {
  background: #363636;
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

:root.dark-mode .tab-count {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

:root.dark-mode .tab.active .tab-count {
  background: #3b82f6;
  color: white;
}

:root.dark-mode .artist-content {
  background: #2d2d2d;
  color: #e0e0e0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

:root.dark-mode .artist-header {
  border-bottom-color: #404040;
}

:root.dark-mode .artist-header h2 {
  color: #3b82f6;
}

:root.dark-mode .artist-header p {
  color: #b0b0b0;
}

:root.dark-mode .artist-content h3 {
  color: #b0b0b0;
}

:root.dark-mode .card {
  background: #1e1e1e;
  border-color: #404040;
}

:root.dark-mode .card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

:root.dark-mode .preview-item {
  background: #3a3a3a;
}

:root.dark-mode .info {
  color: #e0e0e0;
}

:root.dark-mode .info strong {
  color: #3b82f6;
}

:root.dark-mode .typo-warning {
  color: #fbbf24;
}

:root.dark-mode .sort-select {
  background: #1e1e1e;
  color: #e0e0e0;
  border-color: #404040;
}

:root.dark-mode .sort-select:hover {
  border-color: #3b82f6;
}

:root.dark-mode .btns button {
  background: #363636;
  color: #e0e0e0;
}

:root.dark-mode .btns button:hover {
  background: #404040;
}

:root.dark-mode .btn {
  background: #3b82f6;
  color: white;
}

:root.dark-mode .btn:hover {
  background: #2563eb;
}

:root.dark-mode .modal {
  background: rgba(0, 0, 0, 0.8);
}

:root.dark-mode .modal-box {
  background: #2d2d2d;
  color: #e0e0e0;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
}

:root.dark-mode .modal-box h3 {
  color: #3b82f6;
}

:root.dark-mode .modal-box label {
  color: #e0e0e0;
}

:root.dark-mode .modal-box input,
:root.dark-mode .modal-box select {
  background: #1e1e1e;
  color: #e0e0e0;
  border-color: #404040;
}

:root.dark-mode .modal-box input:disabled {
  background: #3a3a3a;
  color: #707070;
}

:root.dark-mode .modal-box input:focus,
:root.dark-mode .modal-box select:focus {
  outline: none;
  border-color: #3b82f6;
}

:root.dark-mode .toast {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.8);
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

/* Responsive */
@media (max-width: 768px) {
  header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 15px;
  }

  .tab {
    min-width: 100px;
    padding: 12px 15px;
    font-size: 13px;
  }

  .preview-item {
    width: auto;
    height: 40vw;
  }

  .card-overlay {
    opacity: 1;
  }

  .container {
    padding: 10px;
  }

  .artist-content {
    padding: 15px;
  }

  .info {
    padding: 4px;
  }

  .info strong {
    font-size: 16px;
  }
}
</style>