<template>
  <div class="container">
    <aside class="sidebar">
      <div class="header-section">
        <h1 class="logo">Pages</h1>
        <span class="page-count">{{ filteredPages.length }}</span>
      </div>

      <div class="search-wrapper">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input v-model="searchQuery" type="text" placeholder="Search pages..." class="search-input">
        <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn" aria-label="Clear search">
          ×
        </button>
      </div>

      <nav class="nav-list">
        <nuxt-link v-for="page in filteredPages" :key="page.route" :to="page.route" class="nav-item"
          exact-active-class="active">
          <span class="nav-label">{{ page.name }}</span>
        </nuxt-link>

        <div v-if="filteredPages.length === 0" class="no-results">
          No pages found
        </div>
      </nav>
    </aside>

    <main class="content">
      <div class="empty-state">
        <div class="empty-icon">→</div>
        <p>Select a page from the sidebar to get started</p>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'PagesNavigator',
  data() {
    return {
      searchQuery: '',
      pages: [
        { name: 'Home', route: '/' },
        { name: 'Best', route: '/best' },
        { name: 'Compressor', route: '/compressor' },
        { name: 'Compressor V2', route: '/compressor-v2' },
        { name: 'Food', route: '/food' },
        { name: 'Gold', route: '/gold' },
        { name: 'Idol', route: '/idol' },
        { name: 'MPG', route: '/mpg' },
        { name: 'Phone', route: '/phone' },
        { name: 'QR', route: '/qr' },
        { name: 'Silver', route: '/silver' },
        { name: 'Slide', route: '/slide' },
        { name: 'Text Converter', route: '/text-converter' },
        { name: 'User', route: '/user' },
        { name: 'Webflow Inspector', route: '/webflow-inspector' },
      ],
    };
  },
  computed: {
    filteredPages() {
      if (!this.searchQuery) return this.pages;
      return this.pages.filter(page =>
        page.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    },
  },
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  background: #fff;
}

.container {
  display: flex;
  height: 100vh;
  background: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.sidebar {
  width: 300px;
  background: #fafbfc;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 1px 0 0 rgba(0, 0, 0, 0.02);
}

.header-section {
  padding: 28px 20px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: -0.3px;
  margin: 0;
}

.page-count {
  font-size: 12px;
  font-weight: 600;
  color: #9ca3af;
  background: #e5e7eb;
  padding: 4px 8px;
  border-radius: 4px;
  min-width: 24px;
  text-align: center;
}

.search-wrapper {
  position: relative;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.search-icon {
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #9ca3af;
  pointer-events: none;
  stroke-width: 2.5;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  transition: all 0.2s ease;
  color: #1f2937;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: white;
}

.search-input::placeholder {
  color: #d1d5db;
}

.clear-btn {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 18px;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.clear-btn:hover {
  color: #6b7280;
}

.nav-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 11px 14px;
  color: #6b7280;
  text-decoration: none;
  border-radius: 7px;
  margin-bottom: 2px;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  position: relative;
}

.nav-label {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-item:hover {
  background: #e5e7eb;
  color: #374151;
}

.nav-item.active {
  background: #3b82f6;
  color: white;
  font-weight: 600;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: white;
  border-radius: 0 3px 3px 0;
}

.no-results {
  padding: 20px 14px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  font-weight: 500;
}

.content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #fff;
}

.empty-state {
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.3;
  animation: slide-in 0.6s ease-out;
}

.empty-state p {
  color: #9ca3af;
  font-size: 15px;
  font-weight: 500;
  margin: 0;
}

/* Scrollbar styling */
.nav-list::-webkit-scrollbar {
  width: 6px;
}

.nav-list::-webkit-scrollbar-track {
  background: transparent;
}

.nav-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.nav-list::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }

  to {
    opacity: 0.3;
    transform: translateX(0);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    max-height: 45vh;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }

  .container {
    flex-direction: column;
  }

  .nav-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
  }

  .nav-item {
    justify-content: center;
    margin-bottom: 0;
  }

  .nav-item.active::before {
    display: none;
  }

  .nav-item.active {
    border-bottom: 3px solid white;
  }

  .content {
    flex: 1;
  }
}
</style>