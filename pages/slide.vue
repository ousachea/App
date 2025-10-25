<template>
  <div class="sp-presentation">
    <div class="sp-slide-container">
      <div :key="currentSlide" class="sp-slide-wrapper">
        <div class="sp-slide-number">
          {{ String(currentSlide + 1).padStart(2, '0') }} / {{ String(slides.length).padStart(2, '0') }}
        </div>
        
        <h1 class="sp-slide-title">{{ currentSlideData.title }}</h1>
        <p class="sp-slide-subtitle">{{ currentSlideData.subtitle }}</p>

        <div class="sp-points-list">
          <div
            v-for="(point, index) in currentSlideData.points"
            :key="index"
            class="sp-point-card"
          >
            <h3 class="sp-point-title">{{ point.title }}</h3>
            <p class="sp-point-description">{{ point.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="sp-controls">
      <div class="sp-controls-inner">
        <button 
          class="sp-nav-button" 
          :disabled="currentSlide === 0"
          aria-label="Previous slide"
          @click="prevSlide"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        <div class="sp-indicators">
          <button
            v-for="(slide, index) in slides"
            :key="index"
            :class="['sp-indicator', { 'sp-active': index === currentSlide }]"
            :aria-label="'Go to slide ' + (index + 1)"
            @click="goToSlide(index)"
          />
        </div>

        <button 
          class="sp-nav-button" 
          :disabled="currentSlide === slides.length - 1"
          aria-label="Next slide"
          @click="nextSlide"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SharePointPresentation',
  
  data() {
    return {
      currentSlide: 0,
      slides: [
        {
          title: "Why Move to SharePoint?",
          subtitle: "Streamline Your Team's Collaboration",
          points: [
            {
              title: "One Secure Central Hub",
              description: "All files stored in a single, secure location—no more version confusion or lost documents."
            },
            {
              title: "Unified Team Collaboration",
              description: "Everyone works from the same document, ensuring consistency and eliminating conflicts."
            },
            {
              title: "Instant Access & Efficiency",
              description: "Stop wasting time searching or asking 'who has the latest version?'—it's always available."
            }
          ]
        },
        {
          title: "How It Helps Your Team",
          subtitle: "Real Benefits for Daily Work",
          points: [
            {
              title: "Share Smart, Not Hard",
              description: "Send secure links instead of bulky email attachments—faster and more professional."
            },
            {
              title: "Real-Time Collaboration",
              description: "Work together on the same file simultaneously with live edits and instant updates."
            },
            {
              title: "Work From Anywhere",
              description: "Access your files from office, home, or mobile—productivity never stops."
            }
          ]
        },
        {
          title: "How We'll Make It Easy",
          subtitle: "Your Smooth Transition Plan",
          points: [
            {
              title: "Simple, Intuitive Structure",
              description: "Clear organization with plain language—no confusing technical jargon or complexity."
            },
            {
              title: "Hands-On Training",
              description: "Short, practical demos and ongoing friendly support to build your confidence."
            },
            {
              title: "Department Champions",
              description: "Dedicated helpers in every department ready to guide and support their colleagues."
            }
          ]
        }
      ]
    }
  },

  head() {
    return {
      title: 'SharePoint Migration Presentation',
      meta: [
        { hid: 'description', name: 'description', content: 'SharePoint Migration Presentation for Department Heads' }
      ]
    }
  },

  computed: {
    currentSlideData() {
      return this.slides[this.currentSlide]
    }
  },

  mounted() {
    if (process.client) {
      window.addEventListener('keydown', this.handleKeydown)
    }
  },

  beforeDestroy() {
    if (process.client) {
      window.removeEventListener('keydown', this.handleKeydown)
    }
  },

  methods: {
    nextSlide() {
      if (this.currentSlide < this.slides.length - 1) {
        this.currentSlide++
      }
    },

    prevSlide() {
      if (this.currentSlide > 0) {
        this.currentSlide--
      }
    },

    goToSlide(index) {
      this.currentSlide = index
    },

    handleKeydown(e) {
      if (e.key === 'ArrowRight') this.nextSlide()
      if (e.key === 'ArrowLeft') this.prevSlide()
    }
  }
}
</script>

<style scoped>
.sp-presentation {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #ffffff;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.sp-presentation * {
  box-sizing: border-box;
}

.sp-slide-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}

.sp-slide-wrapper {
  width: 100%;
  max-width: 900px;
  animation: sp-fadeIn 0.6s ease-out;
}

@keyframes sp-fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sp-slide-number {
  font-size: 0.875rem;
  color: #94a3b8;
  font-weight: 500;
  margin-bottom: 2rem;
  letter-spacing: 0.05em;
}

.sp-slide-title {
  font-size: 3rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 1rem 0;
  line-height: 1.2;
}

.sp-slide-subtitle {
  font-size: 1.25rem;
  color: #64748b;
  margin: 0 0 4rem 0;
  font-weight: 400;
}

.sp-points-list {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.sp-point-card {
  opacity: 0;
  animation: sp-slideUp 0.6s ease-out forwards;
}

.sp-point-card:nth-child(1) { animation-delay: 0.1s; }
.sp-point-card:nth-child(2) { animation-delay: 0.2s; }
.sp-point-card:nth-child(3) { animation-delay: 0.3s; }

@keyframes sp-slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sp-point-title {
  font-size: 1.375rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.sp-point-description {
  font-size: 1.0625rem;
  color: #475569;
  line-height: 1.7;
  margin: 0;
}

.sp-controls {
  padding: 2rem;
  border-top: 1px solid #e2e8f0;
}

.sp-controls-inner {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sp-nav-button {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  transition: color 0.2s ease;
  padding: 0.5rem;
}

.sp-nav-button:hover {
  color: #0f172a;
}

.sp-nav-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.sp-nav-button svg {
  width: 24px;
  height: 24px;
  display: block;
}

.sp-indicators {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.sp-indicator {
  background: #e2e8f0;
  border: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.sp-indicator:hover {
  background: #cbd5e1;
}

.sp-indicator.sp-active {
  background: #0f172a;
  width: 32px;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .sp-slide-container {
    padding: 2rem 1.5rem;
  }

  .sp-slide-title {
    font-size: 2rem;
  }

  .sp-slide-subtitle {
    font-size: 1.0625rem;
    margin-bottom: 2.5rem;
  }

  .sp-point-title {
    font-size: 1.125rem;
  }

  .sp-point-description {
    font-size: 0.9375rem;
  }

  .sp-points-list {
    gap: 2rem;
  }
}
</style>