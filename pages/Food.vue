<template>
  <div class="container">
    <!-- Background decorative elements -->
    <div class="bg-decoration">
      <div class="floating-icon" v-for="n in 6" :key="n" :style="getFloatingStyle(n)">
        {{ getRandomEmoji() }}
      </div>
    </div>

    <div class="food-picker">
      <!-- Header section -->
      <div class="header">
        <div class="icon-wrapper">
          <div class="main-icon">🎯</div>
        </div>
        <h1 class="title">Food Roulette</h1>
        <p class="subtitle">Discover your next delicious adventure</p>
      </div>
      
      <!-- Main picker display -->
      <div class="picker-section">
        <div class="picker-display">
          <div class="selected-restaurant" :class="{ 'spinning': isSpinning, 'has-result': hasResult }">
            <div class="restaurant-text">
              {{ selectedRestaurant }}
            </div>
            <div v-if="hasResult && !isSpinning" class="result-decoration">
              <div class="sparkle" v-for="n in 3" :key="n"></div>
            </div>
          </div>
        </div>

        <button 
          class="pick-button" 
          @click="pickRandomFood"
          :disabled="isSpinning"
        >
          <span class="button-icon">🎲</span>
          <span class="button-text">{{ isSpinning ? 'Spinning the wheel...' : 'Pick My Food!' }}</span>
          <div class="button-ripple" v-if="isSpinning"></div>
        </button>
      </div>

      <!-- Restaurant grid -->
      <div class="restaurant-section">
        <h3 class="section-title">
          <span class="title-icon">🏪</span>
          Your Food Options
        </h3>
        <div class="restaurant-grid">
          <div 
            v-for="(restaurant, index) in restaurants" 
            :key="index"
            class="restaurant-card"
            :class="{ 'highlighted': selectedRestaurant === restaurant && hasResult }"
          >
            <div class="card-icon">{{ getRestaurantEmoji(index) }}</div>
            <div class="card-name">{{ restaurant }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RandomFoodPicker',
  data() {
    return {
      restaurants: [
        'Kungfu',
        'Gege',
        'ស៊ុប E Hong',
        'Oudon',
        'បាយផ្សារចាស់',
        "ប្រហិត IFL",
        "ប្រហិត Orussey",
        'សាច់​គោ​អាំង Orussey'
      ],
      selectedRestaurant: 'Ready to discover your next meal?',
      isSpinning: false,
      hasResult: false,
      foodEmojis: ['🍜', '🍱', '🍛', '🥘', '🍲', '🥟', '🍤', '🥙'],
      floatingEmojis: ['🍕', '🍔', '🌮', '🍝', '🍣', '🥗', '🍱', '🥘', '🍜', '🧆']
    }
  },
  methods: {
    pickRandomFood() {
      this.isSpinning = true
      this.hasResult = false
      
      // Show random options while spinning
      const spinInterval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * this.restaurants.length)
        this.selectedRestaurant = this.restaurants[randomIndex]
      }, 100)
      
      // Final selection with dramatic reveal
      setTimeout(() => {
        clearInterval(spinInterval)
        const randomIndex = Math.floor(Math.random() * this.restaurants.length)
        this.selectedRestaurant = this.restaurants[randomIndex]
        this.isSpinning = false
        this.hasResult = true
      }, 2000)
    },
    getRestaurantEmoji(index) {
      return this.foodEmojis[index % this.foodEmojis.length]
    },
    getRandomEmoji() {
      return this.floatingEmojis[Math.floor(Math.random() * this.floatingEmojis.length)]
    },
    getFloatingStyle(n) {
      return {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 10}s`,
        animationDuration: `${15 + Math.random() * 10}s`
      }
    }
  },
  head() {
    return {
      title: 'Food Roulette - Random Restaurant Picker',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Discover your next delicious meal with our interactive food roulette!'
        }
      ]
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  position: relative;
  padding: 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow: hidden;
}

.bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.floating-icon {
  position: absolute;
  font-size: 2rem;
  opacity: 0.1;
  animation: float linear infinite;
}

@keyframes float {
  from {
    transform: translateY(100vh) rotate(0deg);
  }
  to {
    transform: translateY(-100vh) rotate(360deg);
  }
}

.food-picker {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 32px;
  padding: 48px;
  box-shadow: 
    0 32px 64px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  max-width: 600px;
  margin: 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.header {
  text-align: center;
  margin-bottom: 48px;
}

.icon-wrapper {
  margin-bottom: 16px;
}

.main-icon {
  font-size: 4rem;
  background: linear-gradient(135deg, #ff6b6b, #feca57);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: inline-block;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

.title {
  font-size: 3rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.subtitle {
  color: #64748b;
  font-size: 1.1rem;
  margin: 0;
  font-weight: 500;
}

.picker-section {
  margin: 48px 0;
}

.picker-display {
  margin-bottom: 32px;
}

.selected-restaurant {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 40px 32px;
  border-radius: 24px;
  font-size: 1.8rem;
  font-weight: 700;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 
    0 20px 40px rgba(102, 126, 234, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.selected-restaurant::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.selected-restaurant.spinning {
  animation: spinGlow 2s ease-in-out;
  transform: scale(1.02);
}

.selected-restaurant.spinning::before {
  left: 100%;
}

.selected-restaurant.has-result {
  background: linear-gradient(135deg, #ff6b6b, #feca57);
  box-shadow: 
    0 25px 50px rgba(255, 107, 107, 0.4),
    0 0 30px rgba(254, 202, 87, 0.3);
  transform: scale(1.05);
}

@keyframes spinGlow {
  0% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.08) rotate(180deg); box-shadow: 0 30px 60px rgba(102, 126, 234, 0.5); }
  100% { transform: scale(1.02) rotate(360deg); }
}

.restaurant-text {
  position: relative;
  z-index: 2;
}

.result-decoration {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.sparkle {
  position: absolute;
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: sparkle 1.5s ease-in-out infinite;
}

.sparkle:nth-child(1) { top: 20%; left: 20%; animation-delay: 0s; }
.sparkle:nth-child(2) { top: 30%; right: 25%; animation-delay: 0.5s; }
.sparkle:nth-child(3) { bottom: 25%; left: 30%; animation-delay: 1s; }

@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1); }
}

.pick-button {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  color: white;
  border: none;
  padding: 20px 40px;
  border-radius: 50px;
  font-size: 1.3rem;
  font-weight: 700;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 
    0 12px 24px rgba(79, 172, 254, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 0 auto;
  min-width: 240px;
}

.pick-button:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 
    0 20px 40px rgba(79, 172, 254, 0.6),
    0 0 20px rgba(0, 242, 254, 0.3);
}

.pick-button:active:not(:disabled) {
  transform: translateY(-1px) scale(1.02);
}

.pick-button:disabled {
  opacity: 0.8;
  cursor: not-allowed;
  transform: none;
}

.button-icon {
  font-size: 1.5rem;
  animation: wiggle 2s ease-in-out infinite;
}

@keyframes wiggle {
  0%, 7% { transform: rotateZ(0); }
  15% { transform: rotateZ(-15deg); }
  20% { transform: rotateZ(10deg); }
  25% { transform: rotateZ(-10deg); }
  30% { transform: rotateZ(6deg); }
  35% { transform: rotateZ(-4deg); }
  40%, 100% { transform: rotateZ(0); }
}

.button-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  animation: ripple 2s linear infinite;
}

@keyframes ripple {
  0% {
    width: 0;
    height: 0;
    opacity: 1;
  }
  100% {
    width: 300px;
    height: 300px;
    margin-left: -150px;
    margin-top: -150px;
    opacity: 0;
  }
}

.restaurant-section {
  margin-top: 48px;
}

.section-title {
  text-align: center;
  color: #334155;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.title-icon {
  font-size: 1.8rem;
}

.restaurant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.restaurant-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 24px 16px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: default;
  position: relative;
  overflow: hidden;
}

.restaurant-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.1), rgba(0, 242, 254, 0.1));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.restaurant-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.restaurant-card:hover::before {
  opacity: 1;
}

.restaurant-card.highlighted {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.9), rgba(254, 202, 87, 0.9));
  color: white;
  transform: translateY(-6px) scale(1.05);
  box-shadow: 
    0 20px 40px rgba(255, 107, 107, 0.4),
    0 0 30px rgba(254, 202, 87, 0.3);
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from { box-shadow: 0 20px 40px rgba(255, 107, 107, 0.4), 0 0 30px rgba(254, 202, 87, 0.3); }
  to { box-shadow: 0 25px 50px rgba(255, 107, 107, 0.6), 0 0 40px rgba(254, 202, 87, 0.5); }
}

.card-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.card-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: #334155;
  position: relative;
  z-index: 1;
}

.restaurant-card.highlighted .card-name {
  color: white;
  font-weight: 700;
}

@media (max-width: 768px) {
  .food-picker {
    padding: 32px 24px;
    margin: 20px;
  }
  
  .title {
    font-size: 2.2rem;
  }
  
  .selected-restaurant {
    font-size: 1.4rem;
    padding: 32px 24px;
    min-height: 100px;
  }
  
  .pick-button {
    padding: 16px 32px;
    font-size: 1.1rem;
    min-width: 200px;
  }
  
  .restaurant-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
  }
  
  .restaurant-card {
    padding: 20px 12px;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 10px;
  }
  
  .food-picker {
    padding: 24px 16px;
    margin: 10px;
  }
  
  .title {
    font-size: 1.8rem;
  }
  
  .restaurant-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>