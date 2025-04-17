<template>
  <Transition name="slide-fade">
    <div class="ios-floating-menu">
      <ul class="ios-list">
        <li><NuxtLink to="/compressor" class="ios-link">🗜️ Compressor</NuxtLink></li>
        <li><NuxtLink to="/Gold" class="ios-link">💰 Gold</NuxtLink></li>
        <li><NuxtLink to="/MPG" class="ios-link">⛽ MPG</NuxtLink></li>
        <li><NuxtLink to="/Phone" class="ios-link">📞 Phone</NuxtLink></li>
        <li><NuxtLink to="/Temperture" class="ios-link">🌡️ Temp</NuxtLink></li>
        <li><NuxtLink to="/TextConverter" class="ios-link">🔤 Text</NuxtLink></li>
      </ul>
    </div>
  </Transition>
</template>

<script setup>
// Optional: delay render if needed
</script>

<style scoped>
.ios-floating-menu {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: #ffffffcc;
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 1rem 1.25rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  z-index: 999;
  min-width: 180px;
}

.ios-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ios-link {
  display: block;
  padding: 0.6rem 0;
  color: #333;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  border-bottom: 1px solid #eee;
  transition: all 0.2s ease;
}

.ios-link:last-child {
  border-bottom: none;
}

.ios-link:hover {
  color: #007aff;
}

/* Animation classes */
.slide-fade-enter-active {
  transition: all 0.4s ease;
}
.slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px) translateX(10px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) translateX(10px);
}
</style>
