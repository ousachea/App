<!-- pages/works.vue -->
<template>
  <div class="works-container">
    <div class="container">
      <div class="header">
        <h1>🎬 All Works Sorted by Code</h1>
      </div>

      <!-- Controls Section -->
      <div class="controls">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by code or name..."
          class="search-input"
        />

        <div class="button-group">
          <button
            @click="handleExport"
            :disabled="selectedCodes.length === 0"
            class="btn btn-primary"
          >
            <span class="icon">⬇</span>
            Export ({{ selectedCodes.length }})
          </button>
          <button
            @click="handleImportClick"
            class="btn btn-success"
          >
            <span class="icon">⬆</span>
            Import
          </button>
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            @change="handleImport"
            class="hidden-input"
          />
        </div>

        <!-- Selected Codes Tags -->
        <div v-if="selectedCodes.length > 0" class="selected-codes">
          <p class="selected-label">Selected:</p>
          <div class="code-tags">
            <span
              v-for="code in selectedCodes"
              :key="code"
              class="code-tag"
            >
              {{ code }}
              <button
                @click="removeCode(code)"
                class="remove-btn"
              >
                ×
              </button>
            </span>
          </div>
        </div>
      </div>

      <!-- Progress Section -->
      <div class="progress-section">
        <p class="progress-label">
          Progress: {{ selectedCodes.length }} / {{ totalCount }} ({{ progressPercentage }}%)
        </p>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: progressPercentage + '%' }"
          />
        </div>
      </div>

      <!-- Artists List -->
      <div class="artists-list">
        <div
          v-for="artist in filteredArtists"
          :key="artist.name"
          class="artist-section"
        >
          <h2 class="artist-header">{{ artist.name }}</h2>
          <p class="artist-period">{{ artist.period }}</p>

          <!-- Main Works -->
          <div v-if="artist.mainWorks.length > 0" class="works-category">
            <h3 class="category-title">Main Works</h3>
            <div class="works-grid">
              <div
                v-for="work in artist.mainWorks"
                :key="work.code"
                @click="toggleCode(work.code)"
                :class="['work-item', { 'work-item-selected': selectedCodes.includes(work.code) }]"
              >
                <p class="work-code">{{ work.code }}</p>
                <p class="work-name">{{ work.name }}</p>
              </div>
            </div>
          </div>

          <!-- Compilations -->
          <div v-if="artist.compilations.length > 0" class="works-category">
            <h3 class="category-title">Compilations</h3>
            <div class="works-grid">
              <div
                v-for="work in artist.compilations"
                :key="work.code"
                @click="toggleCode(work.code)"
                :class="['work-item', { 'work-item-selected': selectedCodes.includes(work.code) }]"
              >
                <p class="work-code">{{ work.code }}</p>
                <p class="work-name">{{ work.name }}</p>
              </div>
            </div>
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
      selectedCodes: [],
      artists: [
        {
          name: 'Anzai Rara (安斎らら)',
          period: '2019–2022 (25–28)',
          mainWorks: [
            { code: 'SSIS-025', name: 'Anzai Rara (安斎らら)' },
            { code: 'SSIS-050', name: 'Anzai Rara (安斎らら)' },
            { code: 'SSIS-103', name: 'Anzai Rara (安斎らら)' },
            { code: 'SSIS-124', name: 'Anzai Rara (安斎らら)' },
            { code: 'SSIS-136', name: 'Anzai Rara (安斎らら)' },
            { code: 'SSIS-172', name: 'Anzai Rara (安斎らら)' },
            { code: 'SSIS-203', name: 'Anzai Rara (安斎らら)' },
            { code: 'SSIS-232', name: 'Anzai Rara (安斎らら)' },
            { code: 'SSIS-262', name: 'Anzai Rara (安斎らら)' },
            { code: 'SSIS-269', name: 'Anzai Rara (安斎らら)' },
            { code: 'SSIS-357', name: 'Anzai Rara (安斎らら)' },
            { code: 'SSNI-643', name: 'Anzai Rara (安斎らら)' },
            { code: 'SSNI-671', name: 'Anzai Rara (安斎らら)' },
            { code: 'SSNI-700', name: 'Anzai Rara (安斎らら)' },
            { code: 'SSNI-727', name: 'Anzai Rara (安斎らら)' },
            { code: 'SSNI-752', name: 'Anzai Rara (安斎らら)' },
            { code: 'SSNI-777', name: 'Anzai Rara (安斎らら)' },
            { code: 'SSNI-799', name: 'Anzai Rara (安斎らら)' },
            { code: 'SSNI-822', name: 'Anzai Rara (安斎らら)' }
          ],
          compilations: [
            { code: 'OFJE-279', name: 'Anzai Rara (安斎らら)' },
            { code: 'OFJE-288', name: 'Anzai Rara (安斎らら)' },
            { code: 'OFJE-354', name: 'Anzai Rara (安斎らら)' },
            { code: 'OFJE-410', name: 'Anzai Rara (安斎らら)' }
          ]
        },
        {
          name: 'RION',
          period: '2015–2018 (21–24)',
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
          name: 'Utsunomiya Shion (宇都宮しをん)',
          period: '2013–2014 (19–20)',
          mainWorks: [
            { code: 'SOE-992', name: 'Utsunomiya Shion (宇都宮しをん)' },
            { code: 'SNIS-009', name: 'Utsunomiya Shion (宇都宮しをん)' },
            { code: 'SNIS-027', name: 'Utsunomiya Shion (宇都宮しをん)' },
            { code: 'SNIS-048', name: 'Utsunomiya Shion (宇都宮しをん)' },
            { code: 'SNIS-070', name: 'Utsunomiya Shion (宇都宮しをん)' },
            { code: 'SNIS-091', name: 'Utsunomiya Shion (宇都宮しをん)' },
            { code: 'SNIS-110', name: 'Utsunomiya Shion (宇都宮しをん)' },
            { code: 'SNIS-129', name: 'Utsunomiya Shion (宇都宮しをん)' },
            { code: 'SNIS-147', name: 'Utsunomiya Shion (宇都宮しをん)' },
            { code: 'SNIS-166', name: 'Utsunomiya Shion (宇都宮しをん)' },
            { code: 'AVOP-004', name: 'Utsunomiya Shion (宇都宮しをん)' },
            { code: 'SNIS-205', name: 'Utsunomiya Shion (宇都宮しをん)' }
          ],
          compilations: [
            { code: 'ONSD-850', name: 'Utsunomiya Shion (宇都宮しをん)' },
            { code: 'ONSD-899', name: 'Utsunomiya Shion (宇都宮しをん)' }
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
        localStorage.setItem('selectedCodes', JSON.stringify(newVal))
      },
      deep: true
    }
  },
  mounted() {
    const stored = localStorage.getItem('selectedCodes')
    if (stored) {
      try {
        this.selectedCodes = JSON.parse(stored)
      } catch (e) {
        console.error('Error loading selected codes:', e)
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
          const data = JSON.parse(event.target.result)
          if (data.codes && Array.isArray(data.codes)) {
            this.selectedCodes = data.codes
            alert(`Imported ${data.codes.length} items from ${data.timestamp}`)
          } else {
            alert('Invalid file format')
          }
        } catch (error) {
          alert('Error reading file: ' + error.message)
        }
      }
      reader.readAsText(file)
      e.target.value = ''
    }
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.works-container {
  background: #f8f9fa;
  min-height: 100vh;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 2.5em;
  color: #333;
  margin: 0;
}

.controls {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 4px;
  transition: border-color 0.3s;
  margin-bottom: 15px;
}

.search-input:focus {
  outline: none;
  border-color: #2563eb;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #2563eb;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-success {
  background-color: #16a34a;
  color: white;
}

.btn-success:hover {
  background-color: #15803d;
}

.icon {
  font-size: 16px;
}

.hidden-input {
  display: none;
}

.selected-codes {
  margin-top: 15px;
}

.selected-label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 14px;
  margin: 0 0 8px 0;
}

.code-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.code-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #2563eb;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.remove-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 18px;
  padding: 0;
  line-height: 1;
  display: flex;
  align-items: center;
}

.remove-btn:hover {
  opacity: 0.8;
}

.progress-section {
  margin-bottom: 20px;
}

.progress-label {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  display: flex;
  justify-content: flex-end;
  margin: 0 0 8px 0;
}

.progress-bar {
  width: 100%;
  height: 24px;
  background: #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #1d4ed8);
  transition: width 0.3s ease;
}

.artists-list {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.artist-section {
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.artist-header {
  font-size: 1.8em;
  color: #2563eb;
  margin: 0 0 5px 0;
}

.artist-period {
  color: #666;
  margin: 0 0 20px 0;
  font-size: 14px;
}

.works-category {
  margin-bottom: 20px;
}

.works-category:last-child {
  margin-bottom: 0;
}

.category-title {
  font-size: 1.1em;
  color: #444;
  margin: 15px 0 10px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 10px;
}

.work-item {
  padding: 10px 12px;
  background: #f8f9fa;
  border-left: 4px solid #2563eb;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: all 0.2s;
  cursor: pointer;
  user-select: none;
}

.work-item:hover {
  background: #eff6ff;
}

.work-item-selected {
  background: #dbeafe;
  border-left-color: #1d4ed8;
  box-shadow: 0 0 0 2px #2563eb;
}

.work-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 15px;
  margin: 0;
}

.work-name {
  color: #666;
  font-size: 14px;
  margin: 0;
}

@media (max-width: 768px) {
  .works-container {
    padding: 15px;
  }

  .header h1 {
    font-size: 2em;
  }

  .works-grid {
    grid-template-columns: 1fr;
  }

  .button-group {
    flex-wrap: wrap;
  }

  .btn {
    flex: 1;
    min-width: 150px;
  }
}
</style>