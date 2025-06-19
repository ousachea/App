<!-- pages/index.vue -->
<template>
    <div class="app-container">
      <div class="main-content">
        <!-- Header -->
        <div class="header">
          <h1 class="title">QuickLink</h1>
          <p class="subtitle">Transform long URLs into short, shareable links</p>
        </div>
  
        <!-- Mode Toggle -->
        <div class="mode-toggle-container">
          <div class="mode-toggle">
            <button
              @click="activeMode = 'single'"
              :class="['mode-btn', activeMode === 'single' ? 'mode-btn-active' : '']"
            >
              Single URL
            </button>
            <button
              @click="activeMode = 'bulk'"
              :class="['mode-btn', activeMode === 'bulk' ? 'mode-btn-active' : '']"
            >
              Bulk URLs
            </button>
          </div>
        </div>
  
        <!-- Single URL Form -->
        <div v-if="activeMode === 'single'" class="form-container">
          <div class="form-card">
            <form @submit.prevent="shortenUrl" class="form">
              <div class="input-group">
                <label for="url" class="label">
                  Enter your long URL
                </label>
                <input
                  id="url"
                  v-model="longUrl"
                  type="url"
                  required
                  placeholder="https://example.com/very/long/url/path"
                  class="input"
                />
              </div>
              
              <div class="input-row">
                <div class="input-group">
                  <label for="customAlias" class="label">
                    Custom alias (optional)
                  </label>
                  <input
                    id="customAlias"
                    v-model="customAlias"
                    type="text"
                    placeholder="my-link"
                    pattern="[a-zA-Z0-9-_]+"
                    class="input"
                  />
                </div>
                
                <div class="input-group">
                  <label for="expiryDays" class="label">
                    Expires in (days)
                  </label>
                  <select
                    id="expiryDays"
                    v-model="expiryDays"
                    class="input select"
                  >
                    <option value="0">Never</option>
                    <option value="1">1 day</option>
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                  </select>
                </div>
              </div>
  
              <button
                type="submit"
                :disabled="!longUrl || isLoading"
                class="submit-btn"
              >
                <span v-if="isLoading" class="loading-content">
                  <svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Shortening...
                </span>
                <span v-else>Shorten URL</span>
              </button>
            </form>
          </div>
  
          <!-- Single URL Result -->
          <div v-if="shortenedUrl && activeMode === 'single'" class="result-card">
            <div class="result-content">
              <h3 class="result-title">Your shortened URL is ready!</h3>
              <div class="url-result">
                <div class="url-display">
                  <code class="short-url">{{ shortenedUrl }}</code>
                  <button
                    @click="copyToClipboard"
                    class="copy-btn"
                    :title="copied ? 'Copied!' : 'Click to copy URL'"
                  >
                    {{ copied ? '✓ Copied!' : '📋 Copy' }}
                  </button>
                </div>
              </div>
              
              <!-- QR Code Section -->
              <div class="qr-section">
                <div class="stats-section">
                  <div class="stats-grid">
                    <div class="stat-item">
                      <span class="stat-label">Clicks:</span> {{ currentLink ? currentLink.clicks : 0 }}
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">Created:</span> {{ formatDate(currentLink ? currentLink.createdAt : null) }}
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">Expires:</span> 
                      {{ currentLink && currentLink.expiresAt ? formatDate(currentLink.expiresAt) : 'Never' }}
                    </div>
                  </div>
                </div>
                
                <div class="qr-container">
                  <h4 class="qr-title">QR Code</h4>
                  <div class="qr-canvas-container">
                    <canvas ref="qrCanvas" class="qr-canvas"></canvas>
                  </div>
                  <button
                    @click="downloadQR"
                    class="qr-download-btn"
                  >
                    Download QR
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Bulk URL Form -->
        <div v-else class="bulk-container">
          <div class="form-card">
            <h3 class="bulk-title">Bulk URL Shortener</h3>
            <form @submit.prevent="bulkShortenUrls" class="form">
              <div class="input-group">
                <label for="bulkUrls" class="label">
                  Enter URLs (one per line)
                </label>
                <textarea
                  id="bulkUrls"
                  v-model="bulkUrls"
                  rows="8"
                  required
                  placeholder="https://example.com/page1&#10;https://example.com/page2&#10;https://example.com/page3"
                  class="textarea"
                ></textarea>
                <p class="url-count">{{ bulkUrlCount }} URLs detected</p>
              </div>
  
              <div class="input-row">
                <div class="input-group">
                  <label for="bulkPrefix" class="label">
                    Custom prefix (optional)
                  </label>
                  <input
                    id="bulkPrefix"
                    v-model="bulkPrefix"
                    type="text"
                    placeholder="project-"
                    pattern="[a-zA-Z0-9-_]+"
                    class="input"
                  />
                </div>
                
                <div class="input-group">
                  <label for="bulkExpiryDays" class="label">
                    Expires in (days)
                  </label>
                  <select
                    id="bulkExpiryDays"
                    v-model="bulkExpiryDays"
                    class="input select"
                  >
                    <option value="0">Never</option>
                    <option value="1">1 day</option>
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                  </select>
                </div>
              </div>
  
              <button
                type="submit"
                :disabled="bulkUrlCount === 0 || isBulkLoading"
                class="submit-btn bulk-btn"
              >
                <span v-if="isBulkLoading" class="loading-content">
                  <svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing {{ bulkProgress }}/{{ bulkUrlCount }}...
                </span>
                <span v-else>Shorten All URLs</span>
              </button>
            </form>
          </div>
  
          <!-- Bulk Results -->
          <div v-if="bulkResults.length > 0 && activeMode === 'bulk'" class="results-card">
            <div class="results-header">
              <h3 class="results-title">Bulk Shortening Results</h3>
              <div class="results-actions">
                <button
                  @click="downloadBulkCSV"
                  class="action-btn csv-btn"
                >
                  Download CSV
                </button>
                <button
                  @click="copyAllBulkUrls"
                  class="action-btn copy-all-btn"
                >
                  {{ bulkCopied ? 'Copied!' : 'Copy All' }}
                </button>
              </div>
            </div>
            
            <div class="table-container">
              <table class="results-table">
                <thead>
                  <tr class="table-header">
                    <th class="table-cell header-cell">Original URL</th>
                    <th class="table-cell header-cell">Short URL</th>
                    <th class="table-cell header-cell">Status</th>
                    <th class="table-cell header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody class="table-body">
                  <tr v-for="result in bulkResults" :key="result.id" class="table-row">
                    <td class="table-cell url-cell">
                      {{ result.originalUrl }}
                    </td>
                    <td class="table-cell">
                      <code class="table-short-url">{{ result.shortUrl }}</code>
                    </td>
                    <td class="table-cell">
                      <span :class="['status-badge', result.success ? 'status-success' : 'status-error']">
                        {{ result.success ? 'Success' : 'Failed' }}
                      </span>
                    </td>
                    <td class="table-cell">
                      <button
                        v-if="result.success"
                        @click="copyToClipboard(result.shortUrl)"
                        class="table-copy-btn"
                      >
                        <svg class="copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
  
        <!-- Recent Links -->
        <div v-if="recentLinks.length > 0" class="recent-links-container">
          <div class="recent-links-card">
            <h3 class="recent-title">Recent Links</h3>
            <div class="recent-links-list">
              <div
                v-for="link in recentLinks"
                :key="link.id"
                class="recent-link-item"
              >
                <div class="recent-link-content">
                  <div class="recent-link-header">
                    <code class="recent-short-url">{{ link.shortUrl }}</code>
                    <button
                      @click="copyToClipboard(link.shortUrl)"
                      class="recent-copy-btn"
                    >
                      <svg class="recent-copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                      </svg>
                    </button>
                  </div>
                  <p class="recent-original-url">{{ link.originalUrl }}</p>
                </div>
                <div class="recent-link-stats">
                  <div class="recent-clicks">{{ link.clicks }} clicks</div>
                  <div class="recent-date">{{ formatDate(link.createdAt) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    // Meta for Nuxt 2
    head() {
      return {
        title: 'QuickLink - URL Shortener',
        meta: [
          { hid: 'description', name: 'description', content: 'Transform long URLs into short, shareable links with analytics and QR codes' }
        ]
      }
    },
  
    data() {
      return {
        // Mode
        activeMode: 'single',
        
        // Single URL data
        longUrl: '',
        customAlias: '',
        expiryDays: 0,
        shortenedUrl: '',
        currentLink: null,
        recentLinks: [],
        isLoading: false,
        copied: false,
  
        // Bulk URL data
        bulkUrls: '',
        bulkPrefix: '',
        bulkExpiryDays: 0,
        bulkResults: [],
        isBulkLoading: false,
        bulkProgress: 0,
        bulkCopied: false
      }
    },
  
    computed: {
      bulkUrlCount() {
        if (!this.bulkUrls.trim()) return 0
        return this.bulkUrls.trim().split('\n').filter(url => url.trim().length > 0).length
      }
    },
  
    mounted() {
      // Load recent links from localStorage
      if (process.client) {
        const saved = localStorage.getItem('quicklink-recent')
        if (saved) {
          this.recentLinks = JSON.parse(saved)
        }
      }
    },
  
    methods: {
      // Generate random short code
      generateShortCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let result = ''
        for (let i = 0; i < 6; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
      },
  
      // Generate QR Code
      generateQRCode(text) {
        // Wait for next tick to ensure canvas is mounted
        this.$nextTick(() => {
          if (!this.$refs.qrCanvas) {
            console.log('Canvas not found, retrying...')
            setTimeout(() => this.generateQRCode(text), 100)
            return
          }
          
          try {
            const canvas = this.$refs.qrCanvas
            const ctx = canvas.getContext('2d')
            const size = 128
            canvas.width = size
            canvas.height = size
            
            // Simple QR code pattern generator
            const moduleCount = 21
            const moduleSize = size / moduleCount
            
            // Create a simple pattern matrix
            const modules = Array(moduleCount).fill().map(() => Array(moduleCount).fill(false))
            
            // Add finder patterns (corners)
            const addFinderPattern = (x, y) => {
              for (let i = 0; i < 7; i++) {
                for (let j = 0; j < 7; j++) {
                  if ((i === 0 || i === 6 || j === 0 || j === 6) || 
                      (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
                    if (x + i < moduleCount && y + j < moduleCount) {
                      modules[x + i][y + j] = true
                    }
                  }
                }
              }
            }
            
            addFinderPattern(0, 0)  // Top-left
            addFinderPattern(0, 14) // Top-right
            addFinderPattern(14, 0) // Bottom-left
            
            // Add some data pattern based on URL hash
            let hash = 0
            for (let i = 0; i < text.length; i++) {
              hash = ((hash << 5) - hash + text.charCodeAt(i)) & 0xffffffff
            }
            
            // Fill data modules with pattern based on hash
            for (let i = 9; i < 12; i++) {
              for (let j = 9; j < 12; j++) {
                if (i < moduleCount && j < moduleCount) {
                  modules[i][j] = (hash & (1 << ((i * 3 + j) % 16))) !== 0
                }
              }
            }
            
            // Add timing patterns
            for (let i = 8; i < 13; i++) {
              if (i < moduleCount) {
                modules[6][i] = i % 2 === 0
                modules[i][6] = i % 2 === 0
              }
            }
            
            // Clear canvas with white background
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, size, size)
            
            // Draw modules in black
            ctx.fillStyle = '#000000'
            for (let row = 0; row < moduleCount; row++) {
              for (let col = 0; col < moduleCount; col++) {
                if (modules[row] && modules[row][col]) {
                  ctx.fillRect(
                    Math.floor(col * moduleSize), 
                    Math.floor(row * moduleSize), 
                    Math.ceil(moduleSize), 
                    Math.ceil(moduleSize)
                  )
                }
              }
            }
            
            console.log('QR Code generated successfully for:', text)
          } catch (error) {
            console.error('Error generating QR code:', error)
          }
        })
      },
  
      // Download QR Code
      downloadQR() {
        try {
          if (!this.$refs.qrCanvas) {
            alert('QR code not generated yet. Please wait and try again.')
            return
          }
          
          const canvas = this.$refs.qrCanvas
          const link = document.createElement('a')
          link.download = `qr-code-${Date.now()}.png`
          link.href = canvas.toDataURL('image/png')
          
          // Trigger download
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          console.log('QR code downloaded successfully')
        } catch (error) {
          console.error('Error downloading QR code:', error)
          alert('Failed to download QR code. Please try again.')
        }
      },
  
      // Shorten single URL
      async shortenUrl() {
        if (!this.longUrl) return
        
        this.isLoading = true
        
        try {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const shortCode = this.customAlias || this.generateShortCode()
          const baseUrl = 'https://qlink.co'
          const shortUrl = `${baseUrl}/${shortCode}`
          
          const now = new Date()
          const expiresAt = this.expiryDays > 0 
            ? new Date(now.getTime() + (this.expiryDays * 24 * 60 * 60 * 1000))
            : null
          
          const linkData = {
            id: Date.now().toString(),
            originalUrl: this.longUrl,
            shortUrl: shortUrl,
            shortCode: shortCode,
            clicks: 0,
            createdAt: now.toISOString(),
            expiresAt: expiresAt ? expiresAt.toISOString() : null
          }
          
          // Add to recent links
          this.recentLinks.unshift(linkData)
          if (this.recentLinks.length > 10) {
            this.recentLinks = this.recentLinks.slice(0, 10)
          }
          
          // Save to localStorage
          if (process.client) {
            localStorage.setItem('quicklink-recent', JSON.stringify(this.recentLinks))
          }
          
          // Set current result and generate QR code
          this.shortenedUrl = shortUrl
          this.currentLink = linkData
          
          // Generate QR code after DOM update with multiple attempts
          this.$nextTick(() => {
            setTimeout(() => {
              this.generateQRCode(shortUrl)
            }, 100)
          })
          
          // Reset form
          this.longUrl = ''
          this.customAlias = ''
          this.expiryDays = 0
          
        } catch (error) {
          console.error('Error shortening URL:', error)
        } finally {
          this.isLoading = false
        }
      },
  
      // Bulk URL shortening
      async bulkShortenUrls() {
        if (!this.bulkUrls.trim()) return
        
        const urls = this.bulkUrls.trim().split('\n').filter(url => url.trim().length > 0)
        this.isBulkLoading = true
        this.bulkProgress = 0
        this.bulkResults = []
        
        try {
          for (let i = 0; i < urls.length; i++) {
            const url = urls[i].trim()
            this.bulkProgress = i + 1
            
            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 200))
            
            try {
              // Validate URL
              new URL(url)
              
              const shortCode = this.bulkPrefix 
                ? `${this.bulkPrefix}${i + 1}` 
                : this.generateShortCode()
              const baseUrl = 'https://qlink.co'
              const shortUrl = `${baseUrl}/${shortCode}`
              
              const now = new Date()
              const expiresAt = this.bulkExpiryDays > 0 
                ? new Date(now.getTime() + (this.bulkExpiryDays * 24 * 60 * 60 * 1000))
                : null
              
              const linkData = {
                id: `bulk-${Date.now()}-${i}`,
                originalUrl: url,
                shortUrl: shortUrl,
                shortCode: shortCode,
                clicks: 0,
                createdAt: now.toISOString(),
                expiresAt: expiresAt ? expiresAt.toISOString() : null,
                success: true
              }
              
              // Add to recent links
              this.recentLinks.unshift(linkData)
              this.bulkResults.push(linkData)
              
            } catch (error) {
              // Invalid URL
              this.bulkResults.push({
                id: `bulk-error-${Date.now()}-${i}`,
                originalUrl: url,
                shortUrl: '',
                success: false,
                error: 'Invalid URL format'
              })
            }
          }
          
          // Keep only recent 50 links
          if (this.recentLinks.length > 50) {
            this.recentLinks = this.recentLinks.slice(0, 50)
          }
          
          // Save to localStorage
          if (process.client) {
            localStorage.setItem('quicklink-recent', JSON.stringify(this.recentLinks))
          }
          
          // Reset form
          this.bulkUrls = ''
          this.bulkPrefix = ''
          this.bulkExpiryDays = 0
          
        } catch (error) {
          console.error('Error in bulk shortening:', error)
        } finally {
          this.isBulkLoading = false
        }
      },
  
      // Copy to clipboard
      async copyToClipboard(url = this.shortenedUrl) {
        try {
          // Check if clipboard API is available
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(url)
          } else {
            // Fallback for older browsers or non-HTTPS
            const textArea = document.createElement('textarea')
            textArea.value = url
            textArea.style.position = 'fixed'
            textArea.style.left = '-999999px'
            textArea.style.top = '-999999px'
            document.body.appendChild(textArea)
            textArea.focus()
            textArea.select()
            document.execCommand('copy')
            textArea.remove()
          }
          
          this.copied = true
          setTimeout(() => {
            this.copied = false
          }, 2000)
          
          // Show success message
          console.log('URL copied to clipboard:', url)
        } catch (error) {
          console.error('Failed to copy:', error)
          // Show fallback - select the text for manual copy
          this.showCopyFallback(url)
        }
      },
  
      // Fallback copy method
      showCopyFallback(url) {
        const message = `Copy this URL manually: ${url}`
        if (window.prompt) {
          window.prompt('Copy this URL:', url)
        } else {
          alert(message)
        }
      },
  
      // Copy all bulk URLs
      async copyAllBulkUrls() {
        const successfulUrls = this.bulkResults
          .filter(result => result.success)
          .map(result => result.shortUrl)
          .join('\n')
        
        if (!successfulUrls) {
          alert('No successful URLs to copy')
          return
        }
        
        try {
          // Check if clipboard API is available
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(successfulUrls)
          } else {
            // Fallback for older browsers or non-HTTPS
            const textArea = document.createElement('textarea')
            textArea.value = successfulUrls
            textArea.style.position = 'fixed'
            textArea.style.left = '-999999px'
            textArea.style.top = '-999999px'
            document.body.appendChild(textArea)
            textArea.focus()
            textArea.select()
            document.execCommand('copy')
            textArea.remove()
          }
          
          this.bulkCopied = true
          setTimeout(() => {
            this.bulkCopied = false
          }, 2000)
          
          console.log('All URLs copied to clipboard')
        } catch (error) {
          console.error('Failed to copy bulk URLs:', error)
          // Show fallback
          if (window.prompt) {
            window.prompt('Copy these URLs:', successfulUrls)
          } else {
            alert(`Copy these URLs manually:\n${successfulUrls}`)
          }
        }
      },
  
      // Download bulk results as CSV
      downloadBulkCSV() {
        try {
          if (this.bulkResults.length === 0) {
            alert('No results to download')
            return
          }
          
          const headers = ['Original URL', 'Short URL', 'Status', 'Created At', 'Expires At']
          const csvContent = [
            headers.join(','),
            ...this.bulkResults.map(result => [
              `"${result.originalUrl.replace(/"/g, '""')}"`, // Escape quotes
              `"${result.shortUrl.replace(/"/g, '""')}"`,
              result.success ? 'Success' : 'Failed',
              result.createdAt ? this.formatDate(result.createdAt) : '',
              result.expiresAt ? this.formatDate(result.expiresAt) : 'Never'
            ].join(','))
          ].join('\n')
          
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `bulk-shortened-urls-${new Date().toISOString().split('T')[0]}.csv`
          
          // Trigger download
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          
          console.log('CSV downloaded successfully')
        } catch (error) {
          console.error('Error downloading CSV:', error)
          alert('Failed to download CSV. Please try again.')
        }
      },
  
      // Format date helper
      formatDate(dateString) {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      }
    }
  }
  </script>
  
  <style scoped>
  /* Reset and base styles */
  * {
    box-sizing: border-box;
  }
  
  .app-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }
  
  .main-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
  
  /* Header styles */
  .header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .title {
    font-size: 2.5rem;
    font-weight: bold;
    color: #1f2937;
    margin-bottom: 1rem;
  }
  
  .subtitle {
    color: #4b5563;
    font-size: 1.125rem;
    margin: 0;
  }
  
  /* Mode toggle styles */
  .mode-toggle-container {
    max-width: 32rem;
    margin: 0 auto 2rem auto;
  }
  
  .mode-toggle {
    display: flex;
    background: white;
    border-radius: 0.75rem;
    padding: 0.25rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
  
  .mode-btn {
    flex: 1;
    padding: 0.5rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #4b5563;
    background: transparent;
  }
  
  .mode-btn:hover {
    color: #1f2937;
  }
  
  .mode-btn-active {
    background: #2563eb !important;
    color: white !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  /* Form container styles */
  .form-container {
    max-width: 32rem;
    margin: 0 auto;
  }
  
  .bulk-container {
    max-width: 64rem;
    margin: 0 auto;
  }
  
  .form-card {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    padding: 2rem;
    margin-bottom: 2rem;
  }
  
  .bulk-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 1.5rem;
  }
  
  /* Form styles */
  .form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .input-group {
    display: flex;
    flex-direction: column;
  }
  
  .input-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  @media (max-width: 768px) {
    .input-row {
      grid-template-columns: 1fr;
    }
  }
  
  .label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
  }
  
  .input, .select, .textarea {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1rem;
    transition: all 0.2s ease;
  }
  
  .input:focus, .select:focus, .textarea:focus {
    outline: none;
    border-color: transparent;
    box-shadow: 0 0 0 2px #3b82f6;
  }
  
  .textarea {
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    resize: vertical;
  }
  
  .url-count {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.5rem;
    margin-bottom: 0;
  }
  
  /* Button styles */
  .submit-btn {
    width: 100%;
    background: linear-gradient(90deg, #2563eb 0%, #4f46e5 100%);
    color: white;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .submit-btn:hover:not(:disabled) {
    background: linear-gradient(90deg, #1d4ed8 0%, #4338ca 100%);
  }
  
  .submit-btn:focus {
    outline: none;
    box-shadow: 0 0 0 2px #3b82f6, 0 0 0 4px rgba(59, 130, 246, 0.5);
  }
  
  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .bulk-btn {
    background: linear-gradient(90deg, #16a34a 0%, #059669 100%);
  }
  
  .bulk-btn:hover:not(:disabled) {
    background: linear-gradient(90deg, #15803d 0%, #047857 100%);
  }
  
  .loading-content {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .spinner {
    width: 1.25rem;
    height: 1.25rem;
    margin-right: 0.75rem;
    animation: spin 1s linear infinite;
  }
  
  .spinner-circle {
    opacity: 0.25;
  }
  
  .spinner-path {
    opacity: 0.75;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  /* Result card styles */
  .result-card {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    padding: 2rem;
    margin-bottom: 2rem;
  }
  
  .result-content {
    text-align: center;
  }
  
  .result-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 1rem;
  }
  
  .url-result {
    background: #f9fafb;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .url-display {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  
  @media (max-width: 640px) {
    .url-display {
      flex-direction: column;
      gap: 0.5rem;
    }
  }
  
  .short-url {
    color: #2563eb;
    font-family: 'Courier New', monospace;
    font-size: 1.125rem;
    flex: 1;
    word-break: break-all;
  }
  
  .copy-btn {
    background: #2563eb;
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .copy-btn:hover {
    background: #1d4ed8;
  }
  
  .copy-btn:focus {
    outline: none;
    box-shadow: 0 0 0 2px #3b82f6;
  }
  
  /* QR Section styles */
  .qr-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  @media (max-width: 1024px) {
    .qr-section {
      grid-template-columns: 1fr;
    }
  }
  
  .stats-section {
    text-align: left;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  @media (min-width: 768px) {
    .stats-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  
  .stat-item {
    font-size: 0.875rem;
    color: #4b5563;
  }
  
  .stat-label {
    font-weight: 500;
  }
  
  .qr-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .qr-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.75rem;
  }
  
  .qr-canvas-container {
    background: white;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 2px solid #e5e7eb;
    margin-bottom: 0.75rem;
  }
  
  .qr-canvas {
    max-width: 100%;
    height: auto;
  }
  
  .qr-download-btn {
    font-size: 0.875rem;
    background: #4b5563;
    color: white;
    padding: 0.25rem 0.75rem;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .qr-download-btn:hover {
    background: #374151;
  }
  
  .qr-download-btn:focus {
    outline: none;
    box-shadow: 0 0 0 2px #6b7280;
  }
  
  /* Results card styles */
  .results-card {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    padding: 2rem;
    margin-bottom: 2rem;
  }
  
  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  @media (max-width: 640px) {
    .results-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }
  }
  
  .results-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }
  
  .results-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .action-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .csv-btn {
    background: #16a34a;
    color: white;
  }
  
  .csv-btn:hover {
    background: #15803d;
  }
  
  .copy-all-btn {
    background: #2563eb;
    color: white;
  }
  
  .copy-all-btn:hover {
    background: #1d4ed8;
  }
  
  .action-btn:focus {
    outline: none;
    box-shadow: 0 0 0 2px #3b82f6;
  }
  
  /* Table styles */
  .table-container {
    overflow-x: auto;
  }
  
  .results-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .table-header {
    background: #f9fafb;
  }
  
  .table-cell {
    padding: 0.75rem 1rem;
    text-align: left;
    font-size: 0.875rem;
  }
  
  .header-cell {
    font-weight: 500;
    color: #374151;
  }
  
  .table-body {
    border-top: 1px solid #e5e7eb;
  }
  
  .table-row {
    border-bottom: 1px solid #e5e7eb;
    transition: background-color 0.2s ease;
  }
  
  .table-row:hover {
    background: #f9fafb;
  }
  
  .url-cell {
    color: #1f2937;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .table-short-url {
    color: #2563eb;
    font-family: 'Courier New', monospace;
  }
  
  .status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .status-success {
    color: #16a34a;
    background: #dcfce7;
  }
  
  .status-error {
    color: #dc2626;
    background: #fee2e2;
  }
  
  .table-copy-btn {
    color: #2563eb;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: color 0.2s ease;
  }
  
  .table-copy-btn:hover {
    color: #1e40af;
  }
  
  .table-copy-btn:focus {
    outline: none;
    box-shadow: 0 0 0 2px #3b82f6;
  }
  
  .copy-icon {
    width: 1rem;
    height: 1rem;
  }
  
  /* Recent links styles */
  .recent-links-container {
    max-width: 64rem;
    margin: 0 auto;
  }
  
  .recent-links-card {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    padding: 2rem;
  }
  
  .recent-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 1.5rem;
  }
  
  .recent-links-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .recent-link-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.5rem;
    transition: background-color 0.2s ease;
  }
  
  .recent-link-item:hover {
    background: #f3f4f6;
  }
  
  .recent-link-content {
    flex: 1;
    min-width: 0;
  }
  
  .recent-link-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.25rem;
  }
  
  .recent-short-url {
    color: #2563eb;
    font-family: 'Courier New', monospace;
  }
  
  .recent-copy-btn {
    color: #9ca3af;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: color 0.2s ease;
  }
  
  .recent-copy-btn:hover {
    color: #4b5563;
  }
  
  .recent-copy-btn:focus {
    outline: none;
    color: #4b5563;
  }
  
  .recent-copy-icon {
    width: 1rem;
    height: 1rem;
  }
  
  .recent-original-url {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .recent-link-stats {
    text-align: right;
    font-size: 0.875rem;
    color: #4b5563;
    flex-shrink: 0;
    margin-left: 1rem;
  }
  
  .recent-clicks {
    margin-bottom: 0.25rem;
  }
  
  .recent-date {
    font-size: 0.75rem;
    color: #9ca3af;
  }
  
  /* Responsive adjustments */
  @media (max-width: 640px) {
    .main-content {
      padding: 1rem;
    }
    
    .title {
      font-size: 2rem;
    }
    
    .subtitle {
      font-size: 1rem;
    }
    
    .form-card, .result-card, .results-card, .recent-links-card {
      padding: 1.5rem;
    }
    
    .recent-link-item {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }
    
    .recent-link-stats {
      text-align: left;
      margin-left: 0;
    }
    
    .results-actions {
      flex-direction: column;
    }
    
    .action-btn {
      width: 100%;
    }
  }
  
  @media (max-width: 480px) {
    .mode-toggle {
      flex-direction: column;
    }
    
    .mode-btn {
      margin-bottom: 0.25rem;
    }
    
    .mode-btn:last-child {
      margin-bottom: 0;
    }
  }
  </style>