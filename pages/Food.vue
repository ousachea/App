<!-- pages/index.vue -->
<template>
    <div class="app-container">
      <div class="main-container">
        <!-- Header -->
        <div class="header">
          <h1 class="main-title">
            🍜 តើញាំអ្វីថ្ងៃនេះ?
          </h1>
          <p class="subtitle">Random Khmer Food Selector</p>
          <p class="subtitle-khmer">ជ្រើសរើសម្ហូបខ្មែរដោយចៃដន្យ</p>
        </div>
  
        <!-- Main Content -->
        <div class="content-wrapper">
          <!-- Food Display Card -->
          <div class="food-card">
            <div v-if="selectedFood" class="food-display">
              <div class="food-emoji">{{ selectedFood.emoji }}</div>
              <h2 class="food-name">
                {{ selectedFood.name }}
              </h2>
              <p class="food-khmer">{{ selectedFood.khmer }}</p>
              <p class="food-description">{{ selectedFood.description }}</p>
              <div class="tags-container">
                <span 
                  v-for="tag in selectedFood.tags" 
                  :key="tag"
                  class="tag"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
            <div v-else class="empty-state">
              <div class="empty-emoji">🍽️</div>
              <p class="empty-text">Click the button to discover your meal!</p>
            </div>
          </div>
  
          <!-- Action Button -->
          <div class="button-container">
            <button
              @click="selectRandomFood"
              :disabled="isSpinning"
              class="select-button"
            >
              <span v-if="!isSpinning">🎲 ជ្រើសម្ហូប (Pick Food)</span>
              <span v-else class="button-content">
                <svg class="loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Selecting...
              </span>
            </button>
          </div>
  
          <!-- Food Grid -->
          <div class="food-grid">
            <div 
              v-for="food in khmerFoods" 
              :key="food.id"
              class="food-item"
              @click="selectedFood = food"
            >
              <div class="food-item-content">
                <div class="food-item-emoji">{{ food.emoji }}</div>
                <h3 class="food-item-name">{{ food.name }}</h3>
                <p class="food-item-khmer">{{ food.khmer }}</p>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Footer -->
        <div class="footer">
          <p>🇰🇭 Celebrating the rich flavors of Cambodia</p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  // Import ref from Vue
  import { ref, onMounted } from 'vue'
  
  // Reactive data
  const selectedFood = ref(null)
  const isSpinning = ref(false)
  
  // Khmer food data - comprehensive collection
  const khmerFoods = ref([
    // Main Dishes
    {
      id: 1,
      name: 'Amok Trey',
      khmer: 'អាម៉ុកត្រី',
      emoji: '🐟',
      description: 'Steamed fish curry in banana leaves with coconut milk and aromatic spices',
      tags: ['Fish', 'Curry', 'Traditional', 'Coconut']
    },
    {
      id: 2,
      name: 'Beef Lok Lak',
      khmer: 'លុកឡាក់',
      emoji: '🥩',
      description: 'Sautéed beef cubes served with rice, vegetables, and lime-pepper sauce',
      tags: ['Beef', 'Stir-fry', 'Rice', 'Popular']
    },
    {
      id: 3,
      name: 'Samlor Korko',
      khmer: 'សម្លកកូរ',
      emoji: '🥘',
      description: 'Thick vegetable soup with roasted ground rice and various meats',
      tags: ['Soup', 'Vegetables', 'Traditional', 'Hearty']
    },
    {
      id: 4,
      name: 'Samlor Machu',
      khmer: 'សម្លម្ជូរ',
      emoji: '🍅',
      description: 'Sweet and sour soup with tamarind, vegetables, and fish or pork',
      tags: ['Soup', 'Sweet & Sour', 'Tamarind', 'Traditional']
    },
    {
      id: 5,
      name: 'Fish Amok Curry',
      khmer: 'កូរីអាម៉ុក',
      emoji: '🍛',
      description: 'Rich coconut fish curry without banana leaves, served with rice',
      tags: ['Fish', 'Curry', 'Coconut', 'Spicy']
    },
    {
      id: 6,
      name: 'Khorak',
      khmer: 'ខរក់',
      emoji: '🍖',
      description: 'Slow-cooked meat stew with vegetables and spices',
      tags: ['Stew', 'Meat', 'Slow-cooked', 'Hearty']
    },
    {
      id: 7,
      name: 'Samlor Kako',
      khmer: 'សម្លកកូវ',
      emoji: '🥬',
      description: 'Mixed vegetable soup with ground rice and pork',
      tags: ['Soup', 'Vegetables', 'Pork', 'Healthy']
    },
    
    // Noodle Dishes
    {
      id: 8,
      name: 'Nom Banh Chok',
      khmer: 'នំបញ្ចុក',
      emoji: '🍜',
      description: 'Fresh rice noodles topped with fish-based green curry and herbs',
      tags: ['Noodles', 'Curry', 'Breakfast', 'Fresh']
    },
    {
      id: 9,
      name: 'Kuy Teav',
      khmer: 'គុយទាវ',
      emoji: '🍲',
      description: 'Noodle soup with pork or beef broth, herbs, and vegetables',
      tags: ['Noodles', 'Soup', 'Breakfast', 'Comfort Food']
    },
    {
      id: 10,
      name: 'Mi Cha',
      khmer: 'មីចា',
      emoji: '🍝',
      description: 'Stir-fried wheat noodles with vegetables and meat',
      tags: ['Noodles', 'Stir-fry', 'Vegetables', 'Quick']
    },
    {
      id: 11,
      name: 'Mi Katang',
      khmer: 'មីកាតាំង',
      emoji: '🍜',
      description: 'Wheat noodles in rich coconut curry soup',
      tags: ['Noodles', 'Coconut', 'Curry', 'Rich']
    },
    {
      id: 12,
      name: 'Nom Banh Chok Sach Mouan',
      khmer: 'នំបញ្ចុកសាច់មាន់',
      emoji: '🐔',
      description: 'Rice noodles with chicken curry',
      tags: ['Noodles', 'Chicken', 'Curry', 'Traditional']
    },
    
    // Rice Dishes
    {
      id: 13,
      name: 'Bai Sach Chrouk',
      khmer: 'បាយសាច់ជ្រូក',
      emoji: '🍚',
      description: 'Grilled pork over rice with pickled vegetables and clear soup',
      tags: ['Pork', 'Grilled', 'Rice', 'Breakfast']
    },
    {
      id: 14,
      name: 'Bobor',
      khmer: 'បបរ',
      emoji: '🥣',
      description: 'Rice porridge, often served with herbs and condiments',
      tags: ['Rice', 'Porridge', 'Comfort', 'Simple']
    },
    {
      id: 15,
      name: 'Kralan',
      khmer: 'ក្រឡាន់',
      emoji: '🎋',
      description: 'Sticky rice cooked in bamboo with coconut milk and beans',
      tags: ['Sticky Rice', 'Bamboo', 'Coconut', 'Traditional']
    },
    {
      id: 16,
      name: 'Bai Cha',
      khmer: 'បាយចា',
      emoji: '🍛',
      description: 'Fried rice with various ingredients',
      tags: ['Rice', 'Fried', 'Mixed', 'Quick']
    },
    {
      id: 17,
      name: 'Bai Sach Mouan',
      khmer: 'បាយសាច់មាន់',
      emoji: '🐔',
      description: 'Chicken rice with ginger and soy sauce',
      tags: ['Chicken', 'Rice', 'Ginger', 'Simple']
    },
    
    // Salads & Fresh Dishes
    {
      id: 18,
      name: 'Pleah Sach Ko',
      khmer: 'ភ្លាសាច់គោ',
      emoji: '🥗',
      description: 'Beef salad with lime, herbs, and vegetables',
      tags: ['Beef', 'Salad', 'Fresh', 'Spicy']
    },
    {
      id: 19,
      name: 'Pleah Trei',
      khmer: 'ភ្លាត្រី',
      emoji: '🐟',
      description: 'Fish salad with banana flower and herbs',
      tags: ['Fish', 'Salad', 'Fresh', 'Herbs']
    },
    {
      id: 20,
      name: 'Nhoam Svay',
      khmer: 'ញាំស្វាយ',
      emoji: '🥭',
      description: 'Green mango salad with fish sauce dressing',
      tags: ['Mango', 'Salad', 'Fresh', 'Tangy']
    },
    {
      id: 21,
      name: 'Nhoam Kroeung',
      khmer: 'ញាំក្រឿង',
      emoji: '🥒',
      description: 'Mixed vegetable salad with spicy dressing',
      tags: ['Vegetables', 'Salad', 'Spicy', 'Fresh']
    },
    
    // Grilled & BBQ
    {
      id: 22,
      name: 'Ang Dtray-Meuk',
      khmer: 'អាំងត្រីមឹក',
      emoji: '🦑',
      description: 'Grilled squid with lime, salt, and pepper',
      tags: ['Seafood', 'Grilled', 'Simple', 'Tasty']
    },
    {
      id: 23,
      name: 'Trei Aing',
      khmer: 'ត្រីអាំង',
      emoji: '🐟',
      description: 'Grilled fish, often served whole with herbs and dipping sauce',
      tags: ['Fish', 'Grilled', 'Herbs', 'Traditional']
    },
    {
      id: 24,
      name: 'Sach Chrouk Aing',
      khmer: 'សាច់ជ្រូកអាំង',
      emoji: '🥓',
      description: 'Grilled pork with traditional spices',
      tags: ['Pork', 'Grilled', 'Spices', 'Smoky']
    },
    {
      id: 25,
      name: 'Mouan Aing',
      khmer: 'មាន់អាំង',
      emoji: '🍗',
      description: 'Grilled chicken marinated in lemongrass and spices',
      tags: ['Chicken', 'Grilled', 'Lemongrass', 'Aromatic']
    },
    {
      id: 26,
      name: 'Damrei Aing',
      khmer: 'ដំរីអាំង',
      emoji: '🦆',
      description: 'Grilled duck with tamarind sauce',
      tags: ['Duck', 'Grilled', 'Tamarind', 'Rich']
    },
    
    // Snacks & Street Food
    {
      id: 27,
      name: 'Nom Kroch',
      khmer: 'នំក្រុច',
      emoji: '🥯',
      description: 'Crispy rice crackers, often topped with meat or shrimp',
      tags: ['Snack', 'Crispy', 'Rice', 'Street Food']
    },
    {
      id: 28,
      name: 'Nom Pang',
      khmer: 'នំប៉័ង',
      emoji: '🥖',
      description: 'Cambodian sandwich with pâté, vegetables, and meat',
      tags: ['Bread', 'Sandwich', 'Pâté', 'Quick']
    },
    {
      id: 29,
      name: 'Bong Ea Pong',
      khmer: 'ពងអាប៉ុង',
      emoji: '🥚',
      description: 'Duck egg embryo, a popular street snack',
      tags: ['Egg', 'Street Food', 'Protein', 'Traditional']
    },
    {
      id: 30,
      name: 'Nom Ansom',
      khmer: 'នំអន្សម',
      emoji: '🌴',
      description: 'Sticky rice cake wrapped in banana leaves',
      tags: ['Rice Cake', 'Banana Leaves', 'Traditional', 'Sweet']
    },
    {
      id: 31,
      name: 'Num Banhchev',
      khmer: 'នំបាញ់ឆើវ',
      emoji: '🥟',
      description: 'Steamed rice flour dumplings with coconut',
      tags: ['Dumplings', 'Rice Flour', 'Coconut', 'Steamed']
    },
    
    // Desserts
    {
      id: 32,
      name: 'Cha Houy Teuk',
      khmer: 'ចាហួយទឹក',
      emoji: '🍮',
      description: 'Sweet jelly dessert with coconut milk, often served with ice',
      tags: ['Dessert', 'Sweet', 'Coconut', 'Cold']
    },
    {
      id: 33,
      name: 'Nom Krok',
      khmer: 'នំក្រុក',
      emoji: '🥥',
      description: 'Small coconut pancakes cooked in special pans, crispy outside and soft inside',
      tags: ['Dessert', 'Coconut', 'Sweet', 'Snack']
    },
    {
      id: 34,
      name: 'Lot Lak',
      khmer: 'លត់ឡាក់',
      emoji: '🍡',
      description: 'Sweet sticky rice balls in coconut milk',
      tags: ['Dessert', 'Sticky Rice', 'Coconut', 'Sweet']
    },
    {
      id: 35,
      name: 'Nom Plae Ai',
      khmer: 'នំប្លាយអ៊ី',
      emoji: '🌽',
      description: 'Sweet corn pudding dessert',
      tags: ['Dessert', 'Corn', 'Pudding', 'Sweet']
    },
    {
      id: 36,
      name: 'Bobor Chhay',
      khmer: 'បបរឆាយ',
      emoji: '🥛',
      description: 'Sweet rice porridge with sugar and coconut milk',
      tags: ['Dessert', 'Rice', 'Coconut', 'Sweet']
    },
    {
      id: 37,
      name: 'Nom Leb',
      khmer: 'នំលាប',
      emoji: '🧁',
      description: 'Small cupcake-like dessert with coconut',
      tags: ['Dessert', 'Cupcake', 'Coconut', 'Sweet']
    },
    
    // Regional Specialties
    {
      id: 38,
      name: 'Spider (A-Ping)',
      khmer: 'អាពីង',
      emoji: '🕷️',
      description: 'Deep-fried spiders, a specialty from Skuon',
      tags: ['Spider', 'Fried', 'Skuon', 'Unusual']
    },
    {
      id: 39,
      name: 'Prahok Ktis',
      khmer: 'ប្រហុកកិត',
      emoji: '🐟',
      description: 'Steamed fish paste with coconut cream and pork',
      tags: ['Fish Paste', 'Coconut', 'Pork', 'Traditional']
    },
    {
      id: 40,
      name: 'Trey Chean Chet',
      khmer: 'ត្រីឆាន់ចិត្ត',
      emoji: '🐠',
      description: 'Sour fish stew with vegetables',
      tags: ['Fish', 'Stew', 'Sour', 'Vegetables']
    },
    {
      id: 41,
      name: 'Samlor Prohear',
      khmer: 'សម្លព្រះរ',
      emoji: '🥣',
      description: 'Royal soup with shrimp and lemongrass',
      tags: ['Soup', 'Shrimp', 'Lemongrass', 'Royal']
    },
    {
      id: 42,
      name: 'Kroeung',
      khmer: 'ក្រឿង',
      emoji: '🌿',
      description: 'Spice paste curry with meat or vegetables',
      tags: ['Curry', 'Spices', 'Traditional', 'Aromatic']
    },
    
    // Drinks & Beverages
    {
      id: 43,
      name: 'Teuk Roluos',
      khmer: 'ទឹករលុស',
      emoji: '🧊',
      description: 'Shaved ice with colorful syrups and toppings',
      tags: ['Drink', 'Ice', 'Sweet', 'Cold']
    },
    {
      id: 44,
      name: 'Teuk Ampil',
      khmer: 'ទឹកអំបិល',
      emoji: '🥤',
      description: 'Tamarind juice drink',
      tags: ['Drink', 'Tamarind', 'Sweet', 'Refreshing']
    },
    {
      id: 45,
      name: 'Num Voan',
      khmer: 'នំវាន',
      emoji: '🍹',
      description: 'Sweet dessert drink with green noodles',
      tags: ['Drink', 'Dessert', 'Sweet', 'Colorful']
    },
    
    // Preserved & Fermented
    {
      id: 46,
      name: 'Prahok',
      khmer: 'ប្រហុក',
      emoji: '🐟',
      description: 'Fermented fish paste used as condiment',
      tags: ['Fish Paste', 'Fermented', 'Condiment', 'Traditional']
    },
    {
      id: 47,
      name: 'Trei Ngeat',
      khmer: 'ត្រីង៉ាត់',
      emoji: '🐟',
      description: 'Fermented fish, often eaten with vegetables',
      tags: ['Fish', 'Fermented', 'Pungent', 'Traditional']
    },
    
    // Celebration Food
    {
      id: 48,
      name: 'Kralan Khchei',
      khmer: 'ក្រឡាន់ខ្ជី',
      emoji: '🎋',
      description: 'Sweet sticky rice in bamboo for festivals',
      tags: ['Sticky Rice', 'Festival', 'Sweet', 'Traditional']
    },
    {
      id: 49,
      name: 'Num Ansom Sach Chrouk',
      khmer: 'នំអន្សមសាច់ជ្រូក',
      emoji: '🌴',
      description: 'Sticky rice cake with pork for special occasions',
      tags: ['Rice Cake', 'Pork', 'Festival', 'Wrapped']
    },
    {
      id: 50,
      name: 'Bay Damrong',
      khmer: 'បាយដំរង',
      emoji: '🍚',
      description: 'Mixed rice with various toppings',
      tags: ['Rice', 'Mixed', 'Toppings', 'Hearty']
    }
  ])
  
  // Function to select random food with animation
  const selectRandomFood = () => {
    isSpinning.value = true
    
    // Simulate loading with random selection
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * khmerFoods.value.length)
      selectedFood.value = khmerFoods.value[randomIndex]
    }, 100)
  
    // Stop after 1 second and select final food
    setTimeout(() => {
      clearInterval(interval)
      const finalIndex = Math.floor(Math.random() * khmerFoods.value.length)
      selectedFood.value = khmerFoods.value[finalIndex]
      isSpinning.value = false
    }, 1000)
  }
  
  // Select a random food on page load
  onMounted(() => {
    selectRandomFood()
  })
  </script>
  
  <style scoped>
  .app-container {
    min-height: 100vh;
    background: linear-gradient(to bottom right, #fef2f2, #fff7ed);
  }
  
  .main-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
  
  .header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .main-title {
    font-size: 2.25rem;
    font-weight: 700;
    color: #b91c1c;
    margin-bottom: 1rem;
  }
  
  @media (min-width: 768px) {
    .main-title {
      font-size: 3.75rem;
    }
  }
  
  .subtitle {
    font-size: 1.25rem;
    color: #4b5563;
    margin-bottom: 0.5rem;
  }
  
  .subtitle-khmer {
    font-size: 1.125rem;
    color: #6b7280;
  }
  
  .content-wrapper {
    max-width: 42rem;
    margin: 0 auto;
  }
  
  .food-card {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    margin-bottom: 2rem;
    border: 2px solid #fecaca;
  }
  
  .food-display {
    text-align: center;
  }
  
  .food-emoji {
    font-size: 3.75rem;
    margin-bottom: 1rem;
  }
  
  .food-name {
    font-size: 1.875rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }
  
  .food-khmer {
    font-size: 1.5rem;
    color: #dc2626;
    margin-bottom: 1rem;
  }
  
  .food-description {
    color: #4b5563;
    font-size: 1.125rem;
    margin-bottom: 1rem;
  }
  
  .tags-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .tag {
    padding: 0.25rem 0.75rem;
    background-color: #fecaca;
    color: #b91c1c;
    border-radius: 9999px;
    font-size: 0.875rem;
  }
  
  .empty-state {
    text-align: center;
    color: #6b7280;
  }
  
  .empty-emoji {
    font-size: 3.75rem;
    margin-bottom: 1rem;
  }
  
  .empty-text {
    font-size: 1.25rem;
  }
  
  .button-container {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .select-button {
    background-color: #dc2626;
    color: white;
    font-weight: 700;
    padding: 1rem 2rem;
    border-radius: 0.5rem;
    font-size: 1.25rem;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    transform: scale(1);
  }
  
  .select-button:hover:not(:disabled) {
    background-color: #b91c1c;
    transform: scale(1.05);
  }
  
  .select-button:disabled {
    background-color: #f87171;
    transform: scale(1);
    cursor: not-allowed;
  }
  
  .button-content {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .loading-spinner {
    animation: spin 1s linear infinite;
    margin-left: -0.25rem;
    margin-right: 0.75rem;
    height: 1.25rem;
    width: 1.25rem;
    color: white;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  .food-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  @media (min-width: 768px) {
    .food-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  
  @media (min-width: 1024px) {
    .food-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  
  .food-item {
    background: white;
    border-radius: 0.5rem;
    padding: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .food-item:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-color: #fecaca;
  }
  
  .food-item-content {
    text-align: center;
  }
  
  .food-item-emoji {
    font-size: 1.875rem;
    margin-bottom: 0.5rem;
  }
  
  .food-item-name {
    font-weight: 600;
    color: #1f2937;
    font-size: 0.875rem;
  }
  
  .food-item-khmer {
    color: #dc2626;
    font-size: 0.75rem;
  }
  
  .footer {
    text-align: center;
    margin-top: 3rem;
    color: #6b7280;
  }
  </style>