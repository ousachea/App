<template>
  <div class="credentials-page-wrapper">
    <div class="credentials-grid">
      <!-- Header -->
      <div class="credentials-header">
        <div class="header-content">
          <h1 class="main-title">Credentials Manager</h1>
          <p class="header-subtitle">Your secure credentials vault</p>
        </div>
        <div class="header-actions">
          <button 
            @click="toggleShowAllPasswords"
            class="btn-icon"
            :title="showAllPasswords ? 'Hide all passwords' : 'Show all passwords'"
            v-if="credentials.length > 0"
          >
            <svg v-if="!showAllPasswords" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/>
            </svg>
          </button>
          <button 
            @click="exportCredentials" 
            class="btn-icon" 
            title="Export (⌘E)"
            :disabled="credentials.length === 0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
          </button>
          <button 
            @click="triggerImport" 
            class="btn-icon" 
            title="Import (⌘I)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
          </button>
          <button 
            @click="showAddForm = !showAddForm" 
            class="btn-primary"
            :class="{ active: showAddForm }"
            title="New Credential (⌘N)"
          >
            <span class="btn-plus">{{ showAddForm ? '✕' : '+' }}</span>
          </button>
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            style="display: none"
            @change="importCredentials"
          />
        </div>
      </div>

      <!-- Search -->
      <div class="search-wrapper">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search credentials... (⌘K)"
          class="search-input"
        />
        <button 
          v-if="searchQuery" 
          @click="searchQuery = ''" 
          class="search-clear"
          title="Clear search"
        >
          ✕
        </button>
      </div>

      <!-- Add/Edit Form Modal -->
      <transition name="modal-slide">
        <div v-if="showAddForm" class="modal-overlay" @click.self="cancelAdd">
          <div class="modal-content add-form">
            <div class="modal-header">
              <div>
                <h2>{{ editingId ? 'Edit Credential' : 'Add New Credential' }}</h2>
                <p class="modal-subtitle">{{ editingId ? 'Update the details below' : 'Fill in the details below' }}</p>
              </div>
              <button @click="cancelAdd" class="modal-close" title="Close (Esc)">
                ✕
              </button>
            </div>
            <form @submit.prevent="addCredential">
              <div class="form-group">
                <label>Group *</label>
                <input
                  v-model.trim="newCred.group"
                  type="text"
                  placeholder="e.g., DIGITAL TEAM"
                  class="input"
                  required
                  maxlength="100"
                  list="groupsList"
                />
                <datalist id="groupsList">
                  <option v-for="group in uniqueGroups" :key="group" :value="group" />
                </datalist>
              </div>

              <div class="form-group">
                <label>Role/Name *</label>
                <input
                  v-model.trim="newCred.name"
                  type="text"
                  placeholder="e.g., Digital Manager"
                  class="input"
                  required
                  maxlength="100"
                />
              </div>

              <div class="form-group">
                <label>Email or Username</label>
                <input
                  v-model.trim="newCred.username"
                  type="text"
                  placeholder="your.email@example.com"
                  class="input"
                  maxlength="255"
                />
              </div>

              <div class="form-group">
                <label>URL</label>
                <input
                  v-model.trim="newCred.link"
                  type="url"
                  placeholder="https://example.com"
                  class="input"
                />
              </div>

              <div class="form-group">
                <label>Password</label>
                <div class="password-input-wrapper">
                  <input
                    v-model="newCred.password"
                    :type="showNewPassword ? 'text' : 'password'"
                    placeholder="Enter password"
                    class="input"
                    maxlength="255"
                    @input="updatePasswordStrength"
                  />
                  <button
                    type="button"
                    @click="showNewPassword = !showNewPassword"
                    class="toggle-password-btn"
                    tabindex="-1"
                  >
                    <svg v-if="!showNewPassword" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    @click="generatePassword"
                    class="generate-password-btn"
                    title="Generate strong password"
                    tabindex="-1"
                  >
                    🎲
                  </button>
                </div>
                <!-- Password Strength Meter -->
                <div v-if="newCred.password" class="password-strength">
                  <div class="strength-bar">
                    <div class="strength-fill" :class="`strength-${passwordStrength.level}`" :style="{ width: passwordStrength.percent + '%' }"></div>
                  </div>
                  <span class="strength-text" :class="`strength-${passwordStrength.level}`">
                    {{ passwordStrength.text }}
                  </span>
                </div>
              </div>

              <div class="form-group">
                <label>Notes</label>
                <textarea
                  v-model.trim="newCred.notes"
                  placeholder="Add any additional notes..."
                  class="input textarea"
                  rows="3"
                  maxlength="1000"
                ></textarea>
              </div>

              <div class="form-actions">
                <button 
                  type="button" 
                  @click="cancelAdd" 
                  class="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  class="btn-submit"
                >
                  <span class="btn-text">{{ editingId ? 'Update' : 'Add' }} Credential</span>
                  <span class="btn-icon-right">→</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </transition>

      <!-- Cards Grid -->
      <div v-if="filteredGroupedCredentials.length > 0" class="cards-container">
        <TransitionGroup name="stagger" tag="div">
          <div
            v-for="(group, groupIndex) in filteredGroupedCredentials"
            :key="group.key"
            class="group-section"
            :style="{ '--group-index': groupIndex }"
          >
            <div class="group-header">
              <h2 class="group-title">{{ group.name }}</h2>
              <span class="group-count">{{ group.credentials.length }}</span>
            </div>
            <div class="credentials-list">
              <TransitionGroup name="card-pop" tag="div">
                <div
                  v-for="(cred, credIndex) in group.credentials"
                  :key="cred.id"
                  class="credential-row"
                  :class="{ expanded: expandedId === cred.id }"
                  :style="{ '--cred-index': credIndex }"
                  @mouseenter="hoveredCard = cred.id"
                  @mouseleave="hoveredCard = null"
                >
                  <!-- Main Row -->
                  <div class="row-main" @click="toggleExpanded(cred.id)">
                    <!-- Role/Name -->
                    <div class="row-cell role-cell">
                      <div class="cell-value role-value">{{ cred.name }}</div>
                    </div>

                    <!-- Email -->
                    <div v-if="cred.username" class="row-cell email-cell">
                      <div class="cell-value">
                        <span class="email-text" :title="cred.username">{{ truncate(cred.username, 18) }}</span>
                        <button
                          @click.stop="copyToClipboard(cred.username, 'Email')"
                          class="btn-copy-mini"
                          title="Copy email"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <!-- Password -->
                    <div v-if="cred.password" class="row-cell password-cell">
                      <div class="cell-value">
                        <span class="password">{{ (showAllPasswords || showPasswords[cred.id]) ? cred.password : '••••••' }}</span>
                        <button
                          @click.stop="togglePassword(cred.id)"
                          class="btn-copy-mini"
                          :title="(showAllPasswords || showPasswords[cred.id]) ? 'Hide' : 'Show'"
                        >
                          <svg v-if="!(showAllPasswords || showPasswords[cred.id])" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                          <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/>
                          </svg>
                        </button>
                        <button
                          @click.stop="copyToClipboard(cred.password, 'Password')"
                          class="btn-copy-mini"
                          title="Copy password"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <!-- URL - Full Link -->
                    <div v-if="cred.link" class="row-cell url-cell">
                      <div class="cell-value url-value">

                          {{ truncate(cred.link, 32) }}
                        </a>
                        <button
                          @click.stop="copyToClipboard(cred.link, 'URL')"
                          class="btn-copy-mini"
                          title="Copy URL"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="row-actions">
                      <button
                        @click.stop="duplicateCredential(cred)"
                        class="btn-row-action"
                        title="Duplicate (D)"
                      >
                        📋
                      </button>
                      <button
                        @click.stop="startEdit(cred)"
                        class="btn-row-action"
                        title="Edit (E)"
                      >
                        ✏️
                      </button>
                      <button
                        @click.stop="deleteCredential(cred.id)"
                        class="btn-row-delete"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <!-- Expanded Details -->
                  <transition name="expand">
                    <div v-if="expandedId === cred.id" class="row-expanded">
                      <div v-if="cred.notes" class="expanded-field">
                        <span class="expanded-label">Notes:</span>
                        <span class="expanded-text">{{ cred.notes }}</span>
                      </div>
                      <div class="expanded-field">
                        <span class="expanded-label">Email:</span>
                        <span class="expanded-text">{{ cred.username || 'N/A' }}</span>
                      </div>
                      <div class="expanded-field">
                        <span class="expanded-label">Full URL:</span>
                        <span class="expanded-text url-full">{{ cred.link || 'N/A' }}</span>
                      </div>
                    </div>
                  </transition>
                </div>
              </TransitionGroup>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">📋</div>
        <p v-if="searchQuery" class="empty-text">No credentials found for "{{ searchQuery }}"</p>
        <div v-else class="empty-content">
          <p class="empty-text">No credentials yet. Let's get started!</p>
          <div class="empty-tips">
            <div class="tip">
              <span class="tip-icon">⌘N</span>
              <span class="tip-text">Press <strong>⌘N</strong> to add your first credential</span>
            </div>
            <div class="tip">
              <span class="tip-icon">⌘K</span>
              <span class="tip-text">Press <strong>⌘K</strong> to search credentials</span>
            </div>
            <div class="tip">
              <span class="tip-icon">⌘I</span>
              <span class="tip-text">Press <strong>⌘I</strong> to import from file</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast Notification -->
      <transition name="toast-slide">
        <div v-if="toast.show" class="toast" :class="toast.type">
          <span class="toast-icon">{{ toast.type === 'success' ? '✓' : '!' }}</span>
          <span class="toast-message">{{ toast.message }}</span>
          <button v-if="toast.undoAction" @click="toast.undoAction" class="toast-undo">
            Undo
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CredentialsPage',
  data() {
    return {
      credentials: [],
      searchQuery: '',
      showAddForm: false,
      showNewPassword: false,
      showPasswords: {},
      showAllPasswords: false,
      hoveredCard: null,
      expandedId: null,
      editingId: null,
      passwordStrength: { level: 'weak', percent: 0, text: 'Weak' },
      newCred: {
        group: '',
        name: '',
        username: '',
        password: '',
        link: '',
        notes: ''
      },
      toast: {
        show: false,
        message: '',
        type: 'info',
        undoAction: null
      },
      deletedCredentials: []
    }
  },

  computed: {
    uniqueGroups() {
      return [...new Set(this.credentials.map(c => c.group))].sort()
    },

    filteredGroupedCredentials() {
      let filtered = this.credentials

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(c =>
          c.name.toLowerCase().includes(query) ||
          c.group.toLowerCase().includes(query) ||
          c.username.toLowerCase().includes(query)
        )
      }

      const grouped = filtered.reduce((acc, cred) => {
        if (!acc[cred.group]) {
          acc[cred.group] = []
        }
        acc[cred.group].push(cred)
        return acc
      }, {})

      return Object.entries(grouped).map(([name, creds]) => ({
        key: name,
        name,
        credentials: creds
      }))
    }
  },

  methods: {
    updatePasswordStrength() {
      const pass = this.newCred.password
      let strength = 0
      let level = 'weak'
      let text = 'Weak'

      if (pass.length >= 8) strength += 20
      if (pass.length >= 12) strength += 20
      if (/[a-z]/.test(pass)) strength += 15
      if (/[A-Z]/.test(pass)) strength += 15
      if (/[0-9]/.test(pass)) strength += 15
      if (/[^a-zA-Z0-9]/.test(pass)) strength += 15

      if (strength < 30) { level = 'weak'; text = 'Weak' }
      else if (strength < 60) { level = 'fair'; text = 'Fair' }
      else if (strength < 80) { level = 'good'; text = 'Good' }
      else { level = 'strong'; text = 'Strong' }

      this.passwordStrength = { level, percent: Math.min(strength, 100), text }
    },

    toggleShowAllPasswords() {
      this.showAllPasswords = !this.showAllPasswords
    },

    toggleExpanded(id) {
      this.expandedId = this.expandedId === id ? null : id
    },

    startEdit(cred) {
      this.editingId = cred.id
      this.newCred = { ...cred }
      this.showAddForm = true
    },

    duplicateCredential(cred) {
      this.newCred = {
        group: cred.group,
        name: cred.name + ' (copy)',
        username: cred.username,
        password: cred.password,
        link: cred.link,
        notes: cred.notes
      }
      this.editingId = null
      this.showAddForm = true
      this.showToast('Fill in the form and click Add', 'info')
    },

    addCredential() {
      if (!this.newCred.group || !this.newCred.name) {
        this.showToast('Please fill required fields', 'error')
        return
      }

      if (this.editingId) {
        const index = this.credentials.findIndex(c => c.id === this.editingId)
        if (index !== -1) {
          this.credentials[index] = { ...this.newCred, id: this.editingId }
          this.showToast('Credential updated', 'success')
        }
        this.editingId = null
      } else {
        const credential = {
          id: Date.now().toString(),
          group: this.newCred.group,
          name: this.newCred.name,
          username: this.newCred.username,
          password: this.newCred.password,
          link: this.newCred.link,
          notes: this.newCred.notes
        }
        this.credentials.push(credential)
        this.showToast('Credential added successfully', 'success')
      }

      this.saveToLocalStorage()
      this.resetForm()
      this.showAddForm = false
    },

    deleteCredential(id) {
      const cred = this.credentials.find(c => c.id === id)
      if (!cred) return

      this.deletedCredentials.push({ id, cred, timestamp: Date.now() })
      this.credentials = this.credentials.filter(c => c.id !== id)
      this.saveToLocalStorage()

      this.showToast('Credential deleted', 'success')
      
      setTimeout(() => {
        const index = this.deletedCredentials.findIndex(d => d.id === id)
        if (index !== -1) {
          this.deletedCredentials.splice(index, 1)
        }
      }, 5000)
    },

    undoDelete() {
      const last = this.deletedCredentials.pop()
      if (last) {
        this.credentials.push(last.cred)
        this.saveToLocalStorage()
        this.showToast('Credential restored', 'success')
      }
    },

    togglePassword(id) {
      this.$set(this.showPasswords, id, !this.showPasswords[id])
    },

    copyToClipboard(text, label) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast(`${label} copied! ✓`, 'success')
      }).catch(() => {
        this.showToast('Failed to copy', 'error')
      })
    },

    generatePassword() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
      let password = ''
      for (let i = 0; i < 16; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      this.newCred.password = password
      this.updatePasswordStrength()
    },

    exportCredentials() {
      const json = JSON.stringify(this.credentials, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `credentials-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      this.showToast('Credentials exported!', 'success')
    },

    importCredentials(event) {
      const file = event.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result)
          if (Array.isArray(imported)) {
            this.credentials = [...this.credentials, ...imported]
            this.saveToLocalStorage()
            this.showToast(`${imported.length} credentials imported!`, 'success')
          }
        } catch {
          this.showToast('Invalid file format', 'error')
        }
      }
      reader.readAsText(file)
      this.$refs.fileInput.value = ''
    },

    triggerImport() {
      this.$refs.fileInput?.click()
    },

    cancelAdd() {
      this.showAddForm = false
      this.resetForm()
      this.editingId = null
    },

    resetForm() {
      this.newCred = {
        group: '',
        name: '',
        username: '',
        password: '',
        link: '',
        notes: ''
      }
      this.showNewPassword = false
      this.passwordStrength = { level: 'weak', percent: 0, text: 'Weak' }
    },

    ensureProtocol(url) {
      if (!url) return ''
      return url.startsWith('http') ? url : `https://${url}`
    },

    truncate(text, length) {
      if (!text) return ''
      return text.length > length ? text.substring(0, length) + '...' : text
    },

    showToast(message, type = 'info', undoAction = null) {
      this.toast = { show: true, message, type, undoAction }
      setTimeout(() => {
        this.toast.show = false
      }, 4000)
    },

    saveToLocalStorage() {
      localStorage.setItem('credentials', JSON.stringify(this.credentials))
    },

    loadFromLocalStorage() {
      const stored = localStorage.getItem('credentials')
      if (stored) {
        try {
          this.credentials = JSON.parse(stored)
        } catch {
          console.error('Failed to load credentials')
        }
      }
    },

    handleKeydown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        this.$nextTick(() => document.querySelector('.search-input')?.focus())
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        this.showAddForm = !this.showAddForm
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault()
        this.exportCredentials()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault()
        this.triggerImport()
      }
      if (e.key === 'Escape' && this.showAddForm) {
        this.cancelAdd()
      }
    }
  },

  mounted() {
    this.loadFromLocalStorage()
    window.addEventListener('keydown', this.handleKeydown)
  },

  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown)
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes popIn {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes expandDown {
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    max-height: 500px;
    transform: translateY(0);
  }
}

@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateX(100px) translateY(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0) translateY(0);
  }
}

.credentials-page-wrapper {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #f0f4f8 100%);
  animation: fadeInDown 0.6s ease-out;
}

.credentials-grid {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.credentials-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 48px;
  gap: 24px;
  animation: fadeInDown 0.6s ease-out 0.1s both;
}

.header-content {
  flex: 1;
}

.main-title {
  margin: 0 0 12px 0;
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.5px;
}

.header-subtitle {
  margin: 0;
  font-size: 14px;
  color: #6a737d;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  animation: slideInRight 0.6s ease-out 0.2s both;
}

.btn-icon {
  width: 40px;
  height: 40px;
  border: 1px solid #e1e4e8;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #586069;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.btn-icon:hover:not(:disabled) {
  background: white;
  border-color: #0366d6;
  color: #0366d6;
  box-shadow: 0 4px 12px rgba(3, 102, 214, 0.2);
  transform: translateY(-2px);
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  width: 44px;
  height: 44px;
  border: none;
  background: linear-gradient(135deg, #0366d6 0%, #0550ae 100%);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 20px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(3, 102, 214, 0.3);
}

.btn-plus {
  position: relative;
  z-index: 2;
  display: inline-block;
  transition: transform 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(3, 102, 214, 0.4);
}

.btn-primary.active {
  background: linear-gradient(135deg, #d73a49 0%, #cb2431 100%);
  box-shadow: 0 4px 12px rgba(215, 58, 73, 0.3);
}

.search-wrapper {
  position: relative;
  margin-bottom: 32px;
  animation: fadeInDown 0.6s ease-out 0.2s both;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6a737d;
  pointer-events: none;
  transition: all 0.3s ease;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 40px;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #0366d6;
  box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.1);
  background: white;
}

.search-clear {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6a737d;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  transition: all 0.2s ease;
}

.search-clear:hover {
  color: #1a1a1a;
  transform: translateY(-50%) rotate(90deg);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 28px 24px;
  border-bottom: 1px solid #f0f2f5;
  gap: 16px;
}

.modal-header h2 {
  margin: 0 0 6px 0;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}

.modal-subtitle {
  margin: 0;
  font-size: 13px;
  color: #6a737d;
}

.modal-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #6a737d;
  cursor: pointer;
  font-size: 20px;
  border-radius: 6px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.modal-close:hover {
  background: #f0f2f5;
  color: #d73a49;
  transform: rotate(90deg);
}

.add-form form {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 12px;
  font-weight: 600;
  color: #1a1a1a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
}

.input:focus {
  outline: none;
  border-color: #0366d6;
  box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.1);
  background: white;
}

.input.textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.password-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.password-input-wrapper .input {
  flex: 1;
  margin: 0;
  min-width: 150px;
}

.toggle-password-btn,
.generate-password-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #e1e4e8;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #586069;
  transition: all 0.2s ease;
  padding: 0;
  font-size: 16px;
}

.toggle-password-btn:hover,
.generate-password-btn:hover {
  background: #f0f2f5;
  border-color: #0366d6;
  color: #0366d6;
  transform: scale(1.1);
}

.password-strength {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  margin-top: -4px;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: #e1e4e8;
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
}

.strength-fill.strength-weak {
  background: #d73a49;
  width: 25%;
}

.strength-fill.strength-fair {
  background: #f0883e;
  width: 50%;
}

.strength-fill.strength-good {
  background: #6f42c1;
  width: 75%;
}

.strength-fill.strength-strong {
  background: #28a745;
  width: 100%;
}

.strength-text {
  font-weight: 600;
  min-width: 50px;
  text-align: right;
}

.strength-text.strength-weak {
  color: #d73a49;
}

.strength-text.strength-fair {
  color: #f0883e;
}

.strength-text.strength-good {
  color: #6f42c1;
}

.strength-text.strength-strong {
  color: #28a745;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn-secondary,
.btn-submit {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.btn-secondary {
  background: #f0f2f5;
  color: #1a1a1a;
  border: 1px solid #e1e4e8;
}

.btn-secondary:hover {
  background: #e1e4e8;
  border-color: #d1d5da;
  transform: translateY(-2px);
}

.btn-submit {
  background: linear-gradient(135deg, #0366d6 0%, #0550ae 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(3, 102, 214, 0.3);
}

.btn-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(3, 102, 214, 0.4);
}

.cards-container {
  display: flex;
  flex-direction: column;
  gap: 56px;
}

.group-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
  animation: fadeInDown 0.6s ease-out calc(0.3s + var(--group-index) * 0.1s) both;
  margin: 24px 0;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e1e4e8;
  transition: all 0.3s ease;
}

.group-header:hover {
  border-bottom-color: #0366d6;
}

.group-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.group-header:hover .group-title {
  color: #0366d6;
}

.group-count {
  font-size: 12px;
  font-weight: 600;
  color: #6a737d;
  background: #f0f2f5;
  padding: 4px 10px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.group-header:hover .group-count {
  background: #0366d6;
  color: white;
}

.credentials-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.credential-row {
  background: white;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: popIn 0.5s ease-out calc(0.3s + (var(--cred-index) * 0.08s)) both;
  overflow: hidden;
  margin: 0 0 8px 0;
}

.credential-row.expanded {
  border-color: #0366d6;
  box-shadow: 0 8px 24px rgba(3, 102, 214, 0.15);
}

.row-main {
  display: grid;
  grid-template-columns: 1.5fr 1.2fr 1fr 1.5fr auto;
  gap: 18px;
  align-items: center;
  padding: 14px 18px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.credential-row:hover .row-main {
  background: linear-gradient(135deg, #ffffff 0%, #f0f8ff 100%);
}

.row-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.cell-value {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
  font-size: 13px;
  color: #1a1a1a;
}

.role-cell .cell-value {
  font-weight: 600;
  color: #0366d6;
}

.role-value {
  flex: none;
}

.cell-value span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-value .password {
  font-family: 'SF Mono', monospace;
  letter-spacing: 1px;
}

.url-link {
  color: #0366d6;
  text-decoration: none;
  transition: all 0.3s ease;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  position: relative;
  font-size: 13px;
  font-weight: 500;
  display: block;
  max-width: 100%;
}

.url-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: #0366d6;
  transition: width 0.3s ease;
}

.url-link:hover::after {
  width: 100%;
}

.url-link:hover {
  color: #0550ae;
}

.btn-copy-mini {
  width: 26px;
  height: 26px;
  border: none;
  background: #f0f2f5;
  color: #586069;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.btn-copy-mini:hover {
  background: #e1e4e8;
  color: #0366d6;
  transform: scale(1.1);
}

.btn-copy-mini svg {
  transition: transform 0.2s ease;
}

.btn-copy-mini:hover svg {
  transform: scale(1.2);
}

.row-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  flex-shrink: 0;
}

.btn-row-action {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  opacity: 0.6;
}

.btn-row-action:hover {
  background: #f0f2f5;
  opacity: 1;
  transform: scale(1.1);
}

.btn-row-delete {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #6a737d;
  cursor: pointer;
  font-size: 16px;
  border-radius: 4px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  padding: 0;
  opacity: 0.6;
}

.btn-row-delete:hover {
  background: #ffeef0;
  color: #d73a49;
  transform: scale(1.15);
  opacity: 1;
}

.row-expanded {
  border-top: 1px solid #f0f2f5;
  padding: 14px 18px;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: expandDown 0.3s ease;
}

.expanded-field {
  display: flex;
  gap: 12px;
  font-size: 13px;
}

.expanded-label {
  font-weight: 600;
  color: #6a737d;
  min-width: 100px;
  flex-shrink: 0;
}

.expanded-text {
  color: #1a1a1a;
  word-break: break-all;
  flex: 1;
}

.expanded-text.url-full {
  color: #0366d6;
  font-family: 'SF Mono', monospace;
  font-size: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  color: #6a737d;
  text-align: center;
  background: white;
  border: 2px dashed #e1e4e8;
  border-radius: 12px;
  min-height: 400px;
  animation: fadeInDown 0.6s ease-out 0.3s both;
  transition: all 0.3s ease;
}

.empty-state:hover {
  border-color: #0366d6;
  background: linear-gradient(135deg, rgba(3, 102, 214, 0.02) 0%, rgba(3, 102, 214, 0.05) 100%);
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 20px;
  animation: popIn 0.5s ease-out 0.4s both;
}

.empty-text {
  margin: 0 0 24px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.empty-content {
  width: 100%;
}

.empty-tips {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.tip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: #f0f2f5;
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.3s ease;
}

.tip:hover {
  background: #e1e4e8;
  transform: translateX(4px);
}

.tip-icon {
  font-weight: 700;
  color: #0366d6;
  min-width: 40px;
  text-align: center;
}

.tip-text {
  text-align: left;
  color: #1a1a1a;
}

.toast {
  position: fixed;
  bottom: 32px;
  right: 32px;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: white;
  padding: 14px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
  z-index: 2000;
  max-width: 360px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: toastSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-icon {
  font-weight: 700;
  font-size: 16px;
}

.toast-message {
  flex: 1;
}

.toast-undo {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  text-decoration: underline;
  font-size: 12px;
  font-weight: 600;
  padding: 0 8px;
  transition: all 0.2s ease;
}

.toast-undo:hover {
  opacity: 0.8;
}

.toast.success {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
}

.toast.error {
  background: linear-gradient(135deg, #d73a49 0%, #f85149 100%);
}

.toast.info {
  background: linear-gradient(135deg, #0366d6 0%, #0550ae 100%);
}

.modal-slide-enter-active,
.modal-slide-leave-active {
  transition: opacity 0.3s ease;
}

.modal-slide-enter-active .modal-content,
.modal-slide-leave-active .modal-content {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-slide-enter,
.modal-slide-leave-to {
  opacity: 0;
}

.modal-slide-enter .modal-content,
.modal-slide-leave-to .modal-content {
  transform: scale(0.95) translateY(20px);
}

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s ease;
}

.toast-slide-enter,
.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(100px) translateY(100px);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
}

.expand-enter,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.stagger-enter-active,
.stagger-leave-active {
  transition: all 0.3s ease;
}

.stagger-enter,
.stagger-leave-to {
  opacity: 0;
}

.card-pop-enter-active,
.card-pop-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-pop-enter,
.card-pop-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

@media (max-width: 1024px) {
  .row-main {
    grid-template-columns: 1.2fr 1fr 1fr 1fr auto;
  }
}

@media (max-width: 768px) {
  .credentials-grid {
    padding: 20px 16px;
  }

  .credentials-header {
    flex-wrap: wrap;
    margin-bottom: 32px;
    gap: 16px;
  }

  .search-wrapper {
    margin-bottom: 24px;
  }

  .cards-container {
    gap: 40px;
  }

  .credentials-list {
    gap: 12px;
  }

  .row-main {
    grid-template-columns: 1fr 1fr auto;
    gap: 12px;
    padding: 12px 14px;
  }

  .email-cell,
  .url-cell {
    display: none;
  }

  .role-cell {
    grid-column: 1 / -1;
  }

  .password-cell {
    grid-column: 1 / -1;
  }
}

@media (max-width: 480px) {
  .credentials-header {
    flex-direction: column;
    align-items: stretch;
    margin-bottom: 24px;
  }

  .main-title {
    font-size: 24px;
  }

  .header-actions {
    justify-content: flex-end;
  }

  .row-main {
    grid-template-columns: 1fr auto;
    gap: 8px;
    padding: 10px 12px;
  }

  .row-cell {
    grid-column: 1 / -1;
    gap: 6px;
  }

  .cell-value {
    gap: 6px;
  }

  .group-header {
    padding-bottom: 12px;
  }

  .group-title {
    font-size: 16px;
  }

  .credentials-list {
    gap: 10px;
  }

  .empty-tips {
    gap: 10px;
  }

  .tip {
    padding: 8px 12px;
    font-size: 12px;
  }
}
</style>