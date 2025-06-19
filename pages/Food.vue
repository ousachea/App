<template>
  <div class="container">
    <div class="food-picker">
      <h1 class="title">🍽️ Random Food Picker</h1>
      
      <div class="picker-display">
        <div class="selected-restaurant" :class="{ 'spinning': isSpinning }">
          {{ selectedRestaurant }}
        </div>
      </div>

      <button 
        class="pick-button" 
        @click="pickRandomFood"
        :disabled="isSpinning"
      >
        {{ isSpinning ? 'Picking...' : 'Pick Random Restaurant' }}
      </button>

      <div class="restaurant-list">
        <h3>Available Restaurants:</h3>
        <ul>
          <li v-for="(restaurant, index) in restaurants" :key="index">
            {{ restaurant }}
          </li>
        </ul>
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
        'E Hong',
        'Oudon',
        'By Pshar Jas',
        "P'het IFL",
        "P'het Orussey",
        'Sach ko ang Orussey'
      ],
      selectedRestaurant: '🎲 Click to pick a restaurant!',
      isSpinning: false
    }
  },
  methods: {
    pickRandomFood() {
      this.isSpinning = true
      
      // Add some suspense with a delay
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * this.restaurants.length)
        this.selectedRestaurant = this.restaurants[randomIndex]
        this.isSpinning = false
      }, 1500)
    }
  },
  head() {
    return {
      title: 'Random Food Picker',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Pick a random restaurant from your favorite list!'
        }
      ]
    }
  }
}
</script>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  font-family: 'Arial', sans-serif;
}

.food-picker {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.title {
  color: #333;
  margin-bottom: 30px;
  font-size: 2.5rem;
  font-weight: bold;
}

.picker-display {
  margin: 40px 0;
}

.selected-restaurant {
  background: linear-gradient(45deg, #ff6b6b, #ffa500);
  color: white;
  padding: 30px 20px;
  border-radius: 15px;
  font-size: 1.5rem;
  font-weight: bold;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 10px 20px rgba(255, 107, 107, 0.3);
}

.selected-restaurant.spinning {
  animation: spin 1.5s linear;
  transform: scale(1.05);
}

@keyframes spin {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.1); }
  100% { transform: rotate(360deg) scale(1); }
}

.pick-button {
  background: linear-gradient(45deg, #4facfe, #00f2fe);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 50px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 40px;
  box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
}

.pick-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(79, 172, 254, 0.6);
}

.pick-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.restaurant-list {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 25px;
  text-align: left;
}

.restaurant-list h3 {
  color: #333;
  margin-bottom: 15px;
  text-align: center;
  font-size: 1.3rem;
}

.restaurant-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.restaurant-list li {
  background: white;
  margin: 8px 0;
  padding: 12px 20px;
  border-radius: 10px;
  border-left: 4px solid #4facfe;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.restaurant-list li:hover {
  transform: translateX(5px);
}

@media (max-width: 600px) {
  .food-picker {
    padding: 20px;
  }
  
  .title {
    font-size: 2rem;
  }
  
  .selected-restaurant {
    font-size: 1.2rem;
    padding: 20px 15px;
  }
}
</style>