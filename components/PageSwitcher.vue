<template>
  <div class="fab-container">
    <button class="fab" @click="toggleMenu">
      <span class="fab-icon" :class="{ 'open': menuOpen }">✦</span>
    </button>
    <transition name="fade">
      <div v-if="menuOpen" class="fab-menu">
        <ul>
          <li v-for="page in pages" :key="page.path">
            <NuxtLink :to="page.path" class="fab-link" @click="closeMenu">
              <span class="icon">🔗</span> {{ page.name }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const pages = [
  { name: 'Home', path: '/' },
  { name: 'Gold', path: '/gold' },
  { name: 'Phone', path: '/phone' },
  { name: 'MPG', path: '/mpg' },
  { name: 'Text Converter', path: '/textconverter' },
  { name: 'Temperture', path: '/temperture' }
];

const menuOpen = ref(false);

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value;
};

const closeMenu = () => {
  menuOpen.value = false;
};
</script>

<style scoped>
.fab-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.fab {
  background: linear-gradient(135deg, #00DC82, #00875A);
  color: white;
  border: none;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease-in-out;
  display: flex;
  justify-content: center;
  align-items: center;
}

.fab:hover {
  background: #00875A;
}

.fab-icon {
  transition: transform 0.3s ease-in-out;
  font-size: 28px;
}

.fab-icon.open {
  transform: rotate(180deg);
}

.fab-menu {
  background: white;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  position: absolute;
  bottom: 70px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

li {
  display: flex;
  align-items: center;
}

.fab-link {
  text-decoration: none;
  color: #333;
  font-size: 16px;
  padding: 10px 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.3s ease-in-out;
}

.fab-link:hover {
  background: #00DC82;
  color: white;
}

.icon {
  font-size: 18px;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease-in-out;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
