<template>
    <div class="works-container">
      <div class="header">
        <h1>🎬 All Works Sorted by Code</h1>
      </div>
  
      <div class="controls">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by code or name..."
            class="search-input"
          />
        </div>
  
        <div v-if="selectedCodes.length > 0" class="selected-codes">
          <span class="selected-label">Selected:</span>
          <div class="code-tags">
            <span v-for="code in selectedCodes" :key="code" class="code-tag">
              {{ code }}
              <button @click="removeCode(code)" class="remove-btn">×</button>
            </span>
          </div>
        </div>
      </div>
  
      <div class="results-info">
        <div class="progress-label">
          Progress: {{ checkedCount }} / {{ totalCount }} ({{ progressPercentage }}%)
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
      </div>
  
      <div class="artists-list">
        <div v-for="artist in filteredArtists" :key="artist.name" class="artist-section">
          <h2 class="artist-header">{{ artist.name }}</h2>
          <p class="artist-period">{{ artist.period }}</p>
  
          <div v-if="artist.mainWorks.length > 0" class="works-category">
            <h3 class="category-title">Main Works</h3>
            <ul class="works-list">
              <li
                v-for="work in artist.mainWorks"
                :key="work.code"
                class="work-item"
                @click="toggleCode(work.code)"
                :class="{ 'work-item-selected': selectedCodes.includes(work.code) }"
              >
                <span class="work-code">{{ work.code }}</span>
                <span class="work-name">{{ work.name }}</span>
              </li>
            </ul>
          </div>
  
          <div v-if="artist.compilations.length > 0" class="works-category">
            <h3 class="category-title">Compilations</h3>
            <ul class="works-list">
              <li
                v-for="work in artist.compilations"
                :key="work.code"
                class="work-item"
                @click="toggleCode(work.code)"
                :class="{ 'work-item-selected': selectedCodes.includes(work.code) }"
              >
                <span class="work-code">{{ work.code }}</span>
                <span class="work-name">{{ work.name }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'WorksPage',
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
              { code: 'SNIS-519', name: 'RION' },
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
      checkedCount() {
        return this.selectedCodes.length
      },
      progressPercentage() {
        if (this.totalCount === 0) return 0
        return Math.round((this.checkedCount / this.totalCount) * 100)
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
      }
    },
    mounted() {
      if (process.client && localStorage.getItem('selectedCodes')) {
        try {
          this.selectedCodes = JSON.parse(localStorage.getItem('selectedCodes'))
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
      }
    }
  }
  </script>
  
  <style scoped>
  .works-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: #f8f9fa;
    min-height: 100vh;
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
  
  .search-box {
    margin-bottom: 15px;
  }
  
  .search-input {
    width: 100%;
    padding: 12px;
    font-size: 16px;
    border: 2px solid #e0e0e0;
    border-radius: 4px;
    box-sizing: border-box;
    transition: border-color 0.3s;
  }
  
  .search-input:focus {
    outline: none;
    border-color: #2563eb;
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
  
  .results-info {
    margin-bottom: 20px;
  }
  
  .progress-label {
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
    display: flex;
    justify-content: flex-end;
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
    display: flex;
    align-items: center;
    justify-content: flex-end;
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
  
  .works-list {
    list-style: none;
    padding: 0;
    margin: 0;
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
  }
  
  .work-name {
    color: #666;
    font-size: 14px;
  }
  
  @media (max-width: 768px) {
    .works-container {
      padding: 15px;
    }
  
    .header h1 {
      font-size: 2em;
    }
  
    .works-list {
      grid-template-columns: 1fr;
    }
  }
  </style>