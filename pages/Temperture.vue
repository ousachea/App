<template>
    <div class="container-mpg">
      <PageSwitcher/>
      <h2 class="title">Fuel Efficiency Converter</h2>
      <p class="description">Enter your vehicle's MPG to see its equivalent fuel consumption in L/100Km.</p>
      
      <div class="input-wrapper">
        <input
          type="number"
          v-model="mpg"
          class="input-mpg"
          min="1"
          max="100000"
          @input="validateInput"
          placeholder="Enter MPG"
        />
        <span class="unit">MPG</span>
      </div>
  
      <div class="mpg-total">
        <h1 :class="['animated-text', mpgConvertClass()]">{{ mpgConvertText() }}</h1>
        <p class="loop-animation">{{ mpgConvert() }} L/100Km</p>
        <p class="info-text">Lower L/100Km values indicate better fuel efficiency.</p>
      </div>
    </div>
  </template>
  
  <script>
  import PageSwitcher from '../components/PageSwitcher.vue';

  export default {
    data() {
      return {
        mpg: 25,
      };
    },
    methods: {
      mpgConvert() {
        let mpgValue = parseFloat(this.mpg);
        if (isNaN(mpgValue) || mpgValue < 1 || mpgValue > 100000) return "-";
        return parseFloat(235.215 / mpgValue).toFixed(1);
      },
      mpgConvertText() {
        let value = this.mpgConvert();
        if (value <= 6) return "Great Efficiency";
        if (value <= 8) return "Good Efficiency";
        return "Poor Efficiency";
      },
      mpgConvertClass() {
        let value = this.mpgConvert();
        if (value <= 6) return "great";
        if (value <= 8) return "good";
        return "bad";
      },
      validateInput(event) {
        let value = event.target.value.replace(/[^0-9]/g, '');
        value = value ? Math.min(Math.max(parseInt(value, 10), 1), 100000) : "";
        this.mpg = value;
      },
    },
  };
  </script>
  
  <style scoped>
  .container-mpg {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 50px 20px;
    margin: 0 auto;
    max-width: 400px;
    text-align: center;
    background: linear-gradient(to bottom, #f9f9f9, #e3e3e3);
    border-radius: 12px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  }
  .title {
    font-size: 22px;
    font-weight: bold;
    color: #333;
    margin-bottom: 10px;
  }
  .description {
    font-size: 14px;
    color: #666;
    margin-bottom: 20px;
  }
  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    max-width: 280px;
    width: 100%;
  }
  .input-mpg {
    font-size: 16px;
    font-weight: bold;
    padding: 14px 50px 14px 15px;
    text-align: left;
    border: 2px solid #777;
    border-radius: 8px;
    width: 100%;
    outline: none;
    transition: all 0.3s ease-in-out;
    background: #fff;
  }
  .input-mpg:focus {
    border-color: #007bff;
    box-shadow: 0 0 8px rgba(0, 123, 255, 0.3);
  }
  .unit {
    position: absolute;
    right: 15px;
    font-size: 14px;
    color: #555;
    font-weight: bold;
  }
  .mpg-total {
    display: flex;
    flex-direction: column;
    justify-items: center;
    align-items: center;
    padding-top: 30px;
  }
  .mpg-total p {
    font-size: 20px;
    font-weight: bold;
    color: #444;
  }
  .mpg-total h1 {
    font-size: 28px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 10px;
  }
  .mpg-total .great {
    color: #28a745;
  }
  .mpg-total .good {
    color: #ffc107;
  }
  .mpg-total .bad {
    color: #dc3545;
  }
  .animated-text {
    animation: fadeInOut 2s infinite alternate;
  }
  .loop-animation {
    font-size: 22px;
    font-weight: bold;
    color: #007bff;
    animation: bounce 1.5s infinite alternate;
  }
  .info-text {
    font-size: 13px;
    color: #666;
    margin-top: 10px;
  }
  @keyframes fadeInOut {
    0% { opacity: 0.5; transform: scale(0.95); }
    100% { opacity: 1; transform: scale(1.05); }
  }
  @keyframes bounce {
    0% { transform: translateY(0); }
    100% { transform: translateY(-5px); }
  }
  @media (max-width: 600px) {
    .container-mpg {
      padding: 30px 15px;
      max-width: 350px;
    }
    .input-mpg {
      font-size: 14px;
      padding: 12px;
    }
    .mpg-total p {
      font-size: 18px;
    }
    .mpg-total h1 {
      font-size: 26px;
    }
    .info-text {
      font-size: 12px;
    }
  }
  </style>
  