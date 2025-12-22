<template>
  <div class="container">
    <aside class="sidebar">
      <div class="header-section">
        <div class="logo-wrapper">
          <h1 class="logo">Pages</h1>
          <span class="page-count">{{ filteredPages.length }}</span>
        </div>
      </div>

      <div class="search-wrapper">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input v-model="searchQuery" type="text" placeholder="Search..." class="search-input">
        <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn" aria-label="Clear search">
          ×
        </button>
      </div>

      <nav class="nav-list">
        <nuxt-link v-for="page in filteredPages" :key="page.route" :to="page.route" class="nav-item"
          exact-active-class="active">
          <span class="nav-label">{{ page.name }}</span>
          <svg class="nav-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </nuxt-link>

        <div v-if="filteredPages.length === 0" class="no-results">
          <svg class="no-results-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <p>No pages found</p>
        </div>
      </nav>
    </aside>

    <main class="content">
      <div class="empty-state">
        <div class="empty-icon">📄</div>
        <h2>Select a page</h2>
        <p>Choose from the list on the left to view details</p>
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
        { name: 'Compressor', route: '/compressor' },
        { name: 'Gold', route: '/gold' },
        { name: 'MPG', route: '/mpg' },
        { name: 'Phone', route: '/phone' },
        { name: 'KHQR', route: '/qr' },
        { name: 'Text Converter', route: '/text-converter' },
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
  width: 320px;
  background: linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%);
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header-section {
  padding: 32px 24px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.logo-wrapper {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.logo {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: -0.5px;
  margin: 0;
}

.page-count {
  font-size: 13px;
  font-weight: 600;
  color: white;
  background: #3b82f6;
  padding: 5px 10px;
  border-radius: 6px;
  min-width: 32px;
  text-align: center;
}

.search-wrapper {
  position: relative;
  padding: 16px 12px;
  border-bottom: 1px solid #e5e7eb;
}

.search-icon {
  position: absolute;
  left: 20px;
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
  padding: 10px 12px 10px 40px;
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
}

.search-input::placeholder {
  color: #d1d5db;
}

.clear-btn {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 20px;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  width: 32px;
  height: 32px;
}

.clear-btn:hover {
  color: #6b7280;
}

.nav-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  color: #6b7280;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-left: 3px solid transparent;
}

.nav-label {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.nav-arrow {
  width: 16px;
  height: 16px;
  margin-left: 8px;
  opacity: 0;
  transition: all 0.2s ease;
  flex-shrink: 0;
  stroke-width: 2.5;
}

.nav-item:hover {
  background: rgba(59, 130, 246, 0.08);
  color: #1f2937;
}

.nav-item:hover .nav-arrow {
  opacity: 1;
  transform: translateX(4px);
}

.nav-item.active {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  font-weight: 600;
  border-left-color: #3b82f6;
}

.nav-item.active .nav-arrow {
  opacity: 1;
  color: #3b82f6;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  text-align: center;
  color: #9ca3af;
}

.no-results-icon {
  width: 32px;
  height: 32px;
  margin-bottom: 12px;
  opacity: 0.4;
  stroke-width: 2;
}

.no-results p {
  font-size: 13px;
  font-weight: 500;
  margin: 0;
}

.content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  background: #fff;
}

.empty-state {
  text-align: center;
  max-width: 400px;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 24px;
  animation: float 3s ease-in-out infinite;
}

.empty-state h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.empty-state p {
  color: #9ca3af;
  font-size: 15px;
  font-weight: 500;
  margin: 0;
  line-height: 1.6;
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

@keyframes float {

  0%,
  100% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(-10px);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    max-height: 50vh;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }

  .header-section {
    padding: 20px 16px 16px;
  }

  .logo {
    font-size: 20px;
  }

  .nav-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    padding: 8px;
  }

  .nav-item {
    justify-content: center;
    border-left: none;
    border-bottom: 3px solid transparent;
  }

  .nav-item:hover {
    border-bottom-color: transparent;
  }

  .nav-item.active {
    border-left: none;
    border-bottom-color: #3b82f6;
  }

  .nav-arrow {
    display: none;
  }

  .content {
    flex: 1;
    padding: 40px 20px;
  }

  .empty-state {
    width: 100%;
  }

  .empty-icon {
    font-size: 40px;
    margin-bottom: 16px;
  }

  .empty-state h2 {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .sidebar {
    max-height: 45vh;
  }

  .nav-list {
    grid-template-columns: 1fr;
  }

  .logo-wrapper {
    gap: 8px;
  }

  .logo {
    font-size: 18px;
  }

  .search-input {
    font-size: 16px;
    /* Prevents zoom on iOS */
  }
}
</style>