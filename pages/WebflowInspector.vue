<template>
  <div class="app">
    <!-- Minimal Header -->
    <div class="header">
      <h1>📋 Clipboard Inspector</h1>
      <p>Analyze clipboard content</p>
    </div>

    <!-- Main Content -->
    <div class="container">
      <!-- Simple Action -->
      <div class="action-section">
        <button 
          @click="readClipboard" 
          :disabled="isLoading"
          class="inspect-button"
          :class="{ 'loading': isLoading }"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          <span class="button-text">{{ isLoading ? 'Analyzing clipboard...' : 'Inspect Clipboard' }}</span>
        </button>
        
        <button 
          v-if="hasResults"
          @click="clearSession"
          class="clear-button"
        >
          Clear Session
        </button>
        
        <div class="hint">Press Ctrl+V to paste</div>
      </div>

      <!-- Results -->
      <div v-if="hasResults" class="results">
        <div class="results-header">
          Results ({{ records.length }})
        </div>

        <div class="items">
          <div 
            v-for="(item, index) in records" 
            :key="index" 
            class="item"
          >
            <!-- Item Header -->
            <div class="item-header">
              <div class="item-info">
                <span class="item-icon">{{ getIcon(item.type) }}</span>
                <div>
                  <div class="item-title">{{ formatType(item.type) }}</div>
                  <div class="item-meta">{{ getItemMeta(item) }}</div>
                </div>
              </div>
              
              <div class="item-controls">
                <button
                  v-if="canExpand(item, index)"
                  @click="toggleExpanded(index)"
                  class="control-button"
                >
                  {{ isExpanded(index) ? 'Collapse' : 'Expand' }}
                </button>
                
                <button
                  @click="copyItem(item, index)"
                  :disabled="copyingIndex === index"
                  class="control-button copy-button"
                  :class="{ 'copied': copyingIndex === index }"
                >
                  {{ copyingIndex === index ? 'Copied' : 'Copy' }}
                </button>
              </div>
            </div>

            <!-- Item Content -->
            <div class="item-content">
              <!-- Text Content -->
              <div v-if="item.kind === 'string'">
                <div 
                  v-if="shouldTruncate(item, index)"
                  class="content-preview"
                >
                  <div class="preview-text">{{ getPreview(item.data) }}</div>
                  <button @click="toggleExpanded(index)" class="expand-link">
                    Show more...
                  </button>
                </div>
                
                <div v-else class="content-full">
                  <pre 
                    v-if="isJson(item.type)"
                    class="code-block json"
                    v-html="formatJson(item.data)"
                  ></pre>
                  <pre v-else class="code-block">{{ item.data }}</pre>
                </div>
              </div>

              <!-- File Content -->
              <div v-else-if="item.kind === 'file'">
                <div class="file-info">
                  <div class="file-row">
                    <span class="label">Name:</span>
                    <span>{{ item.data.name }}</span>
                  </div>
                  <div class="file-row">
                    <span class="label">Type:</span>
                    <span>{{ item.data.type || 'Unknown' }}</span>
                  </div>
                  <div class="file-row">
                    <span class="label">Size:</span>
                    <span>{{ formatFileSize(item.data.size) }}</span>
                  </div>
                </div>
                
                <div v-if="item.dataURL" class="image-container">
                  <img :src="item.dataURL" :alt="item.data.name" class="image" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!isLoading" class="empty">
        <div class="empty-icon">📋</div>
        <h3>Ready to inspect</h3>
        <p>Copy content from anywhere, then click inspect or press Ctrl+V</p>
        
        <div class="examples">
          <span>HTML/CSS</span>
          <span>JSON</span>
          <span>Images</span>
          <span>Text</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  head() {
    return {
      title: 'Clipboard Inspector',
      meta: [
        { name: 'description', content: 'Inspect and analyze clipboard content from any source' }
      ]
    }
  },

  data() {
    return {
      records: [],
      copyingIndex: null,
      isLoading: false,
      expandedItems: new Set()
    }
  },

  computed: {
    hasResults() {
      return this.records.length > 0
    }
  },

  mounted() {
    window.addEventListener('paste', this.handlePaste)
  },

  beforeDestroy() {
    window.removeEventListener('paste', this.handlePaste)
  },

  methods: {
    handlePaste(event) {
      event.preventDefault()
      this.readClipboard(event.clipboardData)
    },

    async readClipboard(clipboardData = null) {
      this.isLoading = true
      this.records = []
      this.expandedItems.clear()
      
      // Only add delay for button clicks, not paste events
      if (!clipboardData) {
        await new Promise(resolve => setTimeout(resolve, 600))
      }
      
      try {
        let clipboard = clipboardData

        if (!clipboard) {
          if (!navigator.clipboard) {
            throw new Error('Clipboard API not supported in this browser')
          }

          const permission = await navigator.permissions.query({ name: 'clipboard-read' })
          if (permission.state === 'denied') {
            throw new Error('Clipboard access denied. Please use Ctrl+V to paste instead.')
          }

          try {
            if (navigator.clipboard.read) {
              const clipboardItems = await navigator.clipboard.read()
              
              for (const item of clipboardItems) {
                for (const type of item.types) {
                  if (type.startsWith('text/') || type === 'application/json') {
                    const blob = await item.getType(type)
                    const text = await blob.text()
                    if (text && text.trim()) {
                      this.records.push({
                        type,
                        kind: 'string',
                        data: text.trim()
                      })
                    }
                  } else if (type.startsWith('image/')) {
                    const blob = await item.getType(type)
                    const file = new File([blob], 'clipboard-image', { type })
                    const record = {
                      type,
                      kind: 'file',
                      data: file,
                      dataURL: null
                    }
                    
                    const reader = new FileReader()
                    reader.onload = () => { record.dataURL = reader.result }
                    reader.readAsDataURL(blob)
                    
                    this.records.push(record)
                  }
                }
              }
            } else {
              const text = await navigator.clipboard.readText()
              if (text && text.trim()) {
                this.records.push({
                  type: 'text/plain',
                  kind: 'string',
                  data: text.trim()
                })
              }
            }
          } catch (clipboardError) {
            throw new Error('Failed to read clipboard. Try using Ctrl+V to paste content instead.')
          }
        } else {
          const types = Array.from(clipboard.types || [])
          
          types.forEach(type => {
            if (type.startsWith('text') || type === 'application/json') {
              const data = clipboard.getData(type)
              if (data && data.trim()) {
                this.records.push({ 
                  type, 
                  kind: 'string', 
                  data: data.trim() 
                })
              }
            }
          })

          if (clipboard.files && clipboard.files.length) {
            Array.from(clipboard.files).forEach(file => {
              const record = { 
                type: file.type || 'application/octet-stream', 
                kind: 'file', 
                data: file, 
                dataURL: null 
              }
              
              if (file.type && file.type.startsWith('image/')) {
                const reader = new FileReader()
                reader.onload = () => { record.dataURL = reader.result }
                reader.readAsDataURL(file)
              }
              
              this.records.push(record)
            })
          }
        }

        if (this.records.length === 0) {
          this.records.push({
            type: 'text/plain',
            kind: 'string',
            data: 'No content found in clipboard. Try copying something first, then use Ctrl+V to paste here.'
          })
        }

      } catch (error) {
        console.error('Clipboard error:', error)
        
        this.records.push({
          type: 'error',
          kind: 'string',
          data: `⚠️ ${error.message}\n\nFor best results:\n1. Copy content from any app\n2. Press Ctrl+V (or Cmd+V) on this page\n3. Or try the inspect button again`
        })
      } finally {
        this.isLoading = false
      }
    },

    async copyItem(item, index) {
      try {
        const text = item.kind === 'string' ? item.data : `[File: ${item.data.name}]`
        await navigator.clipboard.writeText(text)
        
        this.copyingIndex = index
        setTimeout(() => { this.copyingIndex = null }, 1500)
      } catch (error) {
        console.error('Copy failed:', error)
      }
    },

    clearSession() {
      this.records = []
      this.expandedItems.clear()
      this.copyingIndex = null
      this.isLoading = false
    },

    toggleExpanded(index) {
      if (this.expandedItems.has(index)) {
        this.expandedItems.delete(index)
      } else {
        this.expandedItems.add(index)
      }
      this.$forceUpdate()
    },

    isExpanded(index) {
      return this.expandedItems.has(index)
    },

    canExpand(item, index) {
      return item.kind === 'string' && item.data.length > 200
    },

    shouldTruncate(item, index) {
      return item.kind === 'string' && item.data.length > 200 && !this.isExpanded(index)
    },

    getPreview(text) {
      const maxLength = 200
      if (text.length <= maxLength) return text
      
      const truncated = text.substring(0, maxLength)
      const lastSpace = truncated.lastIndexOf(' ')
      const lastNewline = truncated.lastIndexOf('\n')
      
      const breakPoint = Math.max(lastSpace, lastNewline)
      if (breakPoint > maxLength * 0.7) {
        return text.substring(0, breakPoint)
      }
      
      return truncated
    },

    getItemMeta(item) {
      if (item.kind === 'string') {
        return `${this.formatLength(item.data.length)}`
      } else {
        return `${this.formatFileSize(item.data.size)}`
      }
    },

    getIcon(type) {
      if (type.includes('json')) return '💾'
      if (type.includes('html')) return '🌐'
      if (type.includes('image')) return '🖼️'
      if (type.includes('css')) return '🎨'
      if (type === 'error') return '⚠️'
      return '📝'
    },

    formatType(type) {
      const cleanType = type.replace(/^(text\/|application\/)/, '')
      const typeMap = {
        'plain': 'Text',
        'html': 'HTML',
        'json': 'JSON',
        'css': 'CSS',
        'javascript': 'JS',
        'error': 'Error'
      }
      return typeMap[cleanType] || cleanType.toUpperCase()
    },

    isJson(type) {
      return type === 'application/json' || type === 'text/json'
    },

    formatLength(length) {
      if (length < 1000) return `${length} chars`
      if (length < 1000000) return `${Math.round(length/1000)}K chars`
      return `${Math.round(length/1000000)}M chars`
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i]
    },

    formatJson(text) {
      try {
        const parsed = JSON.parse(text)
        const formatted = JSON.stringify(parsed, null, 2)
        return this.highlightJson(formatted)
      } catch {
        return this.escapeHtml(text)
      }
    },

    highlightJson(json) {
      return json.replace(
        /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        (match) => {
          let className = 'json-number'
          if (/^"/.test(match)) {
            className = /:$/.test(match) ? 'json-key' : 'json-string'
          } else if (/true|false/.test(match)) {
            className = 'json-boolean'
          } else if (/null/.test(match)) {
            className = 'json-null'
          }
          return `<span class="${className}">${match}</span>`
        }
      )
    },

    escapeHtml(text) {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    }
  }
}
</script>

<style scoped>
/* Reset */
* {
  box-sizing: border-box;
}

/* App */
.app {
  min-height: 100vh;
  background: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  color: #333333;
}

/* Header */
.header {
  text-align: center;
  padding: 40px 20px 20px;
  border-bottom: 1px solid #e5e5e5;
}

.header h1 {
  font-size: 1.8rem;
  font-weight: 500;
  margin: 0 0 8px 0;
  color: #333333;
}

.header p {
  font-size: 1rem;
  margin: 0;
  color: #666666;
}

/* Container */
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* Action Section */
.action-section {
  text-align: center;
  margin-bottom: 40px;
}

.inspect-button {
  background: #000000;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 32px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 12px;
  margin-right: 12px;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 180px;
  justify-content: center;
}

.inspect-button:hover:not(:disabled) {
  background: #333333;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.inspect-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.inspect-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.inspect-button.loading {
  background: #333333;
  cursor: wait;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.button-text {
  transition: opacity 0.2s ease;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.clear-button {
  background: #ffffff;
  color: #666666;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 12px;
}

.clear-button:hover {
  background: #f5f5f5;
  color: #333333;
  border-color: #cccccc;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.clear-button:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.hint {
  color: #666666;
  font-size: 0.9rem;
}

/* Results */
.results {
  margin-bottom: 40px;
}

.results-header {
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 20px;
  color: #333333;
}

.items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Item */
.item {
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  background: #ffffff;
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.item-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.item-title {
  font-weight: 500;
  color: #333333;
  font-size: 1rem;
}

.item-meta {
  color: #666666;
  font-size: 0.85rem;
  margin-top: 2px;
}

.item-controls {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.control-button {
  background: #f5f5f5;
  border: 1px solid #e5e5e5;
  color: #333333;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-button:hover {
  background: #eeeeee;
}

.copy-button.copied {
  background: #f0f9ff;
  border-color: #0ea5e9;
  color: #0ea5e9;
}

/* Content */
.item-content {
  padding: 20px;
}

.content-preview {
  margin-bottom: 12px;
}

.preview-text {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #444444;
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 8px;
}

.expand-link {
  background: none;
  border: none;
  color: #0ea5e9;
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.expand-link:hover {
  color: #0284c7;
}

.content-full {
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  overflow: hidden;
}

.code-block {
  margin: 0;
  padding: 16px;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  color: #333333;
  background: #fafafa;
  white-space: pre-wrap;
  word-break: break-word;
  overflow: auto;
  max-height: 400px;
}

.code-block.json {
  background: #f8f9fa;
}

/* File Content */
.file-info {
  margin-bottom: 16px;
}

.file-row {
  display: flex;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.label {
  font-weight: 500;
  color: #666666;
  min-width: 50px;
  margin-right: 8px;
}

.image-container {
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  overflow: hidden;
  background: #fafafa;
}

.image {
  width: 100%;
  height: auto;
  max-height: 300px;
  object-fit: contain;
}

/* Empty State */
.empty {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty h3 {
  font-size: 1.5rem;
  font-weight: 500;
  margin: 0 0 12px 0;
  color: #333333;
}

.empty p {
  color: #666666;
  margin: 0 0 32px 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.examples {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.examples span {
  color: #666666;
  font-size: 0.9rem;
  padding: 4px 8px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  background: #fafafa;
}

/* JSON Syntax Highlighting */
.json-string { color: #059669; }
.json-number { color: #2563eb; }
.json-boolean { color: #dc6317; }
.json-null { color: #6b7280; }
.json-key { color: #7c3aed; font-weight: 500; }

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: 20px 16px;
  }
  
  .action-section .inspect-button,
  .action-section .clear-button {
    display: block;
    width: 100%;
    margin-right: 0;
    margin-bottom: 8px;
  }
  
  .item-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .item-controls {
    align-self: stretch;
  }
  
  .control-button {
    flex: 1;
  }
  
  .examples {
    gap: 12px;
  }
}
</style>