// Standalone floating navigation button component
// Can be imported into any Nuxt.js project

<template>
  <div class="floating-menu-container">
    <button class="floating-menu-button" @click="toggleMenu" :class="{ 'is-open': menuOpen }">
      <span class="menu-icon" :class="{ 'open': menuOpen }">
        <span></span>
        <span></span>
        <span></span>
      </span>
    </button>
    
    <div class="floating-menu" v-if="menuOpen">
      <NuxtLink 
        v-for="(item, index) in menuItems" 
        :key="index" 
        :to="item.path" 
        class="floating-menu-item" 
        @click="closeMenu"
      >
        <span v-if="item.icon" class="menu-item-icon">{{ item.icon }}</span>
        {{ item.label }}
      </NuxtLink>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FloatingNavButton',
  props: {
    menuItems: {
      type: Array,
      default: () => [
      { label: 'Home', path: '/', icon: '🏠' },
  { label: 'Compressor', path: '/compressor', icon: '🔄' },
  { label: 'Gold', path: '/gold', icon: '✨' },
  { label: 'MPG', path: '/MPG', icon: '🚗' },
  { label: 'Phone', path: '/Phone', icon: '📱' },
  { label: 'Webflow inspector', path: '/webflowinspector', icon: '🔍' },
  { label: 'Text Converter', path: '/TextConverter', icon: '📝' },
  { label: 'Food', path: '/food', icon: '🍝' }
      ]
    }
  },
  data() {
    return {
      menuOpen: false
    }
  },
  methods: {
    toggleMenu() {
      this.menuOpen = !this.menuOpen
    },
    closeMenu() {
      this.menuOpen = false
    }
  },
  watch: {
    '$route'() {
      this.closeMenu()
    }
  },
  mounted() {
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.$el.contains(e.target)) {
        this.closeMenu()
      }
    })
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeMenu)
  }
}
</script>

<style scoped>
.floating-menu-container {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
}

.floating-menu-button {
  width: 56px;
  height: 56px;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: none;
  border-radius: 50%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 
              0 0 0 1px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  position: relative;
  overflow: hidden;
}

.floating-menu-button:hover {
  background-color: rgba(255, 255, 255, 0.9);
  transform: scale(1.02);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18),
              0 0 0 1px rgba(0, 0, 0, 0.1);
}

.floating-menu-button:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15),
              0 0 0 1px rgba(0, 0, 0, 0.08);
}

.floating-menu-button.is-open {
  background-color: #f5f5f7;
}

.menu-icon {
  width: 18px;
  height: 12px;
  position: relative;
}

.menu-icon span {
  display: block;
  position: absolute;
  height: 2px;
  width: 100%;
  background: #333;
  border-radius: 4px;
  opacity: 1;
  left: 0;
  transform: rotate(0deg);
  transition: .2s cubic-bezier(0.19, 1, 0.22, 1);
}

.menu-icon span:nth-child(1) {
  top: 0px;
}

.menu-icon span:nth-child(2) {
  top: 5px;
  width: 75%;
}

.menu-icon span:nth-child(3) {
  top: 10px;
}

.menu-icon.open span:nth-child(1) {
  top: 5px;
  transform: rotate(45deg);
}

.menu-icon.open span:nth-child(2) {
  opacity: 0;
  width: 0;
}

.menu-icon.open span:nth-child(3) {
  top: 5px;
  transform: rotate(-45deg);
}

.floating-menu {
  position: absolute;
  bottom: 70px;
  right: 0;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12),
              0 0 0 1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 140px;
  animation: macOsMenuAppear 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  transform-origin: bottom right;
}

@keyframes macOsMenuAppear {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.floating-menu-item {
  color: #333;
  text-decoration: none;
  padding: 10px 16px;
  text-align: left;
  font-size: 14px;
  transition: all 0.2s cubic-bezier(0.19, 1, 0.22, 1);
  border-left: 2px solid transparent;
  display: flex;
  align-items: center;
  gap: 8px;
}

.floating-menu-item:hover, 
.floating-menu-item.nuxt-link-exact-active {
  background-color: rgba(0, 122, 255, 0.1);
  border-left: 2px solid #007AFF;
  color: #007AFF;
}

.menu-item-icon {
  font-size: 16px;
}

/* Mobile responsive adjustments */
@media (max-width: 768px) {
  .floating-menu-container {
    bottom: 20px;
    right: 20px;
  }
  
  .floating-menu-button {
    width: 48px;
    height: 48px;
  }
  
  .menu-icon {
    width: 16px;
    height: 10px;
  }
  
  .menu-icon span:nth-child(1) {
    top: 0px;
  }
  
  .menu-icon span:nth-child(2) {
    top: 4px;
  }
  
  .menu-icon span:nth-child(3) {
    top: 8px;
  }
  
  .menu-icon.open span:nth-child(1) {
    top: 4px;
  }
  
  .menu-icon.open span:nth-child(3) {
    top: 4px;
  }
}
</style>