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
              <div v-for="i in 10" :key="i" class="preview-item">
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
import { DEFAULT_ARTISTS } from '~/data/artists.js'
import { normalizeArtists } from '~/utils/artistHelpers.js'

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
      artists: normalizeArtists(JSON.parse(JSON.stringify(DEFAULT_ARTISTS)))
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
            this.artists = normalizeArtists(parsed)  // ← Add normalizeArtists here!
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
@import '~/assets/css/works.css';
</style>