<template>
  <div class="app">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <h1>My Artists</h1>
        
        <div class="header-actions">
          <button @click="exportData" class="icon-btn" title="Export">
            <span>↓</span>
          </button>
          <button @click="triggerImport" class="icon-btn" title="Import">
            <span>↑</span>
          </button>
          <input 
            ref="fileInput" 
            type="file" 
            accept=".json" 
            @change="importData" 
            style="display: none"
          />
          <button @click="showAddForm = !showAddForm" class="btn-add">
            + Add Artist
          </button>
        </div>
      </div>
    </header>

    <!-- Add Artist Modal -->
    <div v-if="showAddForm" class="modal" @click="showAddForm = false">
      <div class="modal-content" @click.stop>
        <h2>Add Artist</h2>
        <form @submit.prevent="addArtist">
          <input
            v-model="newArtist.name"
            type="text"
            placeholder="Artist name"
            required
            class="input"
            autofocus
          />
          <input
            v-model="newArtist.profileImage"
            type="url"
            placeholder="Profile image URL"
            required
            class="input"
          />
          <div class="modal-actions">
            <button type="button" @click="showAddForm = false" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              Add
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Artist Modal -->
    <div v-if="showEditArtistForm" class="modal" @click="showEditArtistForm = false">
      <div class="modal-content" @click.stop>
        <h2>Edit Artist</h2>
        <form @submit.prevent="updateArtist">
          <input
            v-model="editArtist.name"
            type="text"
            placeholder="Artist name"
            required
            class="input"
            autofocus
          />
          <input
            v-model="editArtist.profileImage"
            type="url"
            placeholder="Profile image URL"
            required
            class="input"
          />
          <div class="modal-actions">
            <button type="button" @click="showEditArtistForm = false" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Work Modal -->
    <div v-if="showEditWorkForm" class="modal" @click="showEditWorkForm = false">
      <div class="modal-content" @click.stop>
        <h2>Edit Work</h2>
        <form @submit.prevent="updateWork">
          <input
            v-model="editWork.title"
            type="text"
            placeholder="Work title"
            required
            class="input"
            autofocus
          />
          <input
            v-model="editWork.code"
            type="text"
            placeholder="Medium (e.g., Oil on canvas, Digital art)"
            required
            class="input"
          />
          <input
            v-model="editWork.link"
            type="url"
            placeholder="Link (optional)"
            class="input"
          />
          <input
            v-model="editWork.coverImage"
            type="url"
            placeholder="Cover image URL"
            required
            class="input"
          />
          <div class="modal-actions">
            <button type="button" @click="showEditWorkForm = false" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add Work Modal -->
    <div v-if="showAddWorkForm" class="modal" @click="showAddWorkForm = false">
      <div class="modal-content" @click.stop>
        <h2>Add Work</h2>
        <p class="modal-subtitle">for {{ currentArtist.name }}</p>
        <form @submit.prevent="addWork">
          <input
            v-model="newWork.title"
            type="text"
            placeholder="Work title"
            required
            class="input"
            autofocus
          />
          <input
            v-model="newWork.code"
            type="text"
            placeholder="Medium (e.g., Oil on canvas, Digital art)"
            required
            class="input"
          />
          <input
            v-model="newWork.link"
            type="url"
            placeholder="Link (optional)"
            class="input"
          />
          <input
            v-model="newWork.coverImage"
            type="url"
            placeholder="Cover image URL"
            required
            class="input"
          />
          <div class="modal-actions">
            <button type="button" @click="showAddWorkForm = false" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              Add
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Image Lightbox -->
    <div v-if="lightboxImage" class="lightbox" @click="closeLightbox">
      <button class="lightbox-close" @click="closeLightbox">×</button>
      <div class="lightbox-content" @click.stop>
        <img :src="lightboxImage.src" :alt="lightboxImage.alt" class="lightbox-image" />
        <div v-if="lightboxImage.title" class="lightbox-info">
          <h3>{{ lightboxImage.title }}</h3>
          <p v-if="lightboxImage.artist">{{ lightboxImage.artist }}</p>
          <p v-if="lightboxImage.medium" class="lightbox-medium">{{ lightboxImage.medium }}</p>
        </div>
      </div>
      <div class="lightbox-hint">Click anywhere to close</div>
    </div>

    <!-- Main Content -->
    <main class="main">
      <div v-if="artists.length > 0" class="artists-list">
        <!-- Loop through each artist -->
        <article v-for="artist in artists" :key="artist.id" class="artist-block">
          
          <!-- Artist Header - Compact -->
          <div class="artist-header">
            <div class="artist-profile">
              <div class="artist-avatar-wrapper" @click="openLightbox(artist.profileImage, artist.name, null, null)">
                <img
                  v-if="artist.profileImage"
                  :src="artist.profileImage"
                  :alt="artist.name"
                  class="artist-avatar"
                />
                <div class="avatar-zoom-hint">
                  <span>🔍</span>
                </div>
              </div>
              <div class="artist-info">
                <h2>{{ artist.name }}</h2>
                <p class="work-count">{{ artist.works.length }} {{ artist.works.length === 1 ? 'work' : 'works' }}</p>
              </div>
            </div>
            
            <div class="artist-controls">
              <button @click="openEditArtistForm(artist)" class="btn-icon-edit" title="Edit Artist">
                <span>✎</span>
              </button>
              <button @click="openAddWorkForm(artist)" class="btn btn-primary btn-icon">
                <span>+</span> Add Work
              </button>
              <button @click="deleteArtist(artist.id)" class="btn-icon-only" title="Delete Artist">
                <span>×</span>
              </button>
            </div>
          </div>

          <!-- Works Gallery -->
          <div v-if="artist.works.length > 0" class="works-grid">
            <div
              v-for="work in artist.works"
              :key="work.id"
              class="work-item"
            >
              <div class="work-image-container">
                <img
                  v-if="work.coverImage"
                  :src="work.coverImage"
                  :alt="work.title"
                  class="work-image"
                  @click="openLightbox(work.coverImage, work.title, artist.name, work.code)"
                />
                <div class="work-actions">
                  <button
                    class="work-action-btn"
                    @click="openEditWorkForm(artist, work)"
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    class="work-action-btn"
                    @click="deleteWork(artist.id, work.id)"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
                <div class="image-zoom-hint">
                  <span>🔍</span>
                </div>
              </div>
              <div class="work-details">
                <h3>{{ work.title }}</h3>
                <p class="work-medium">{{ work.code }}</p>
                <a
                  v-if="work.link"
                  :href="work.link"
                  target="_blank"
                  class="work-link"
                >
                  View →
                </a>
              </div>
            </div>
          </div>

          <!-- Empty Works State -->
          <div v-else class="empty-works">
            <p>No works yet</p>
            <button @click="openAddWorkForm(artist)" class="btn btn-secondary btn-sm">
              Add First Work
            </button>
          </div>
        </article>
      </div>

      <!-- Empty State -->
      <div v-else class="empty">
        <div class="empty-content">
          <h2>No Artists Yet</h2>
          <p>Start by adding your first favorite artist</p>
          <button @click="showAddForm = true" class="btn btn-primary">
            + Add Artist
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  data() {
    return {
      artists: [],
      currentArtist: null,
      showAddForm: false,
      showAddWorkForm: false,
      showEditArtistForm: false,
      showEditWorkForm: false,
      lightboxImage: null,
      newArtist: {
        name: '',
        profileImage: ''
      },
      editArtist: {
        id: null,
        name: '',
        profileImage: ''
      },
      newWork: {
        title: '',
        code: '',
        link: '',
        coverImage: ''
      },
      editWork: {
        id: null,
        artistId: null,
        title: '',
        code: '',
        link: '',
        coverImage: ''
      }
    }
  },
  mounted() {
    this.loadArtists()
  },
  methods: {
    loadArtists() {
      const saved = localStorage.getItem('favoriteArtists')
      if (saved) {
        this.artists = JSON.parse(saved)
      }
    },
    saveArtists() {
      localStorage.setItem('favoriteArtists', JSON.stringify(this.artists))
    },
    addArtist() {
      const artist = {
        id: Date.now(),
        name: this.newArtist.name,
        profileImage: this.newArtist.profileImage,
        works: []
      }
      this.artists.push(artist)
      this.saveArtists()
      this.newArtist = { name: '', profileImage: '' }
      this.showAddForm = false
    },
    deleteArtist(id) {
      if (confirm('Delete this artist and all their works?')) {
        this.artists = this.artists.filter(a => a.id !== id)
        this.saveArtists()
      }
    },
    openAddWorkForm(artist) {
      this.currentArtist = artist
      this.showAddWorkForm = true
    },
    openEditArtistForm(artist) {
      this.editArtist = {
        id: artist.id,
        name: artist.name,
        profileImage: artist.profileImage
      }
      this.showEditArtistForm = true
    },
    openEditWorkForm(artist, work) {
      this.editWork = {
        id: work.id,
        artistId: artist.id,
        title: work.title,
        code: work.code,
        link: work.link,
        coverImage: work.coverImage
      }
      this.showEditWorkForm = true
    },
    updateArtist() {
      const index = this.artists.findIndex(a => a.id === this.editArtist.id)
      if (index !== -1) {
        this.artists[index].name = this.editArtist.name
        this.artists[index].profileImage = this.editArtist.profileImage
        this.saveArtists()
      }
      this.showEditArtistForm = false
      this.editArtist = { id: null, name: '', profileImage: '' }
    },
    updateWork() {
      const artist = this.artists.find(a => a.id === this.editWork.artistId)
      if (artist) {
        const workIndex = artist.works.findIndex(w => w.id === this.editWork.id)
        if (workIndex !== -1) {
          artist.works[workIndex] = {
            id: this.editWork.id,
            title: this.editWork.title,
            code: this.editWork.code,
            link: this.editWork.link,
            coverImage: this.editWork.coverImage
          }
          this.saveArtists()
        }
      }
      this.showEditWorkForm = false
      this.editWork = { id: null, artistId: null, title: '', code: '', link: '', coverImage: '' }
    },
    openLightbox(src, title, artist, medium) {
      this.lightboxImage = {
        src: src,
        title: title,
        artist: artist,
        medium: medium
      }
    },
    closeLightbox() {
      this.lightboxImage = null
    },
    addWork() {
      const work = {
        id: Date.now(),
        title: this.newWork.title,
        code: this.newWork.code,
        link: this.newWork.link,
        coverImage: this.newWork.coverImage
      }
      
      this.currentArtist.works.push(work)
      
      const index = this.artists.findIndex(a => a.id === this.currentArtist.id)
      if (index !== -1) {
        this.artists[index] = this.currentArtist
        this.saveArtists()
      }
      
      this.newWork = { title: '', code: '', link: '', coverImage: '' }
      this.showAddWorkForm = false
      this.currentArtist = null
    },
    deleteWork(artistId, workId) {
      if (confirm('Delete this work?')) {
        const artist = this.artists.find(a => a.id === artistId)
        if (artist) {
          artist.works = artist.works.filter(w => w.id !== workId)
          this.saveArtists()
        }
      }
    },
    exportData() {
      const dataStr = JSON.stringify(this.artists, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `artists-backup-${Date.now()}.json`
      link.click()
      URL.revokeObjectURL(url)
    },
    triggerImport() {
      this.$refs.fileInput.click()
    },
    importData(event) {
      const file = event.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result)
          if (Array.isArray(imported)) {
            if (confirm('This will replace all current data. Continue?')) {
              this.artists = imported
              this.saveArtists()
              alert('Data imported successfully!')
            }
          } else {
            alert('Invalid file format')
          }
        } catch (error) {
          alert('Error reading file')
        }
      }
      reader.readAsText(file)
      event.target.value = ''
    }
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app {
  min-height: 100vh;
  background: #0a0a0a;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

/* Header */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header-content {
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.3px;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.icon-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.btn-add {
  background: #fff;
  color: #000;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
}

/* Main Content */
.main {
  padding: 24px;
  margin: 0 auto;
}

/* Artists List */
.artists-list {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.artist-block {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s;
}

.artist-block:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.12);
}

/* Artist Header */
.artist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 20px;
  flex-wrap: wrap;
}

.artist-profile {
  display: flex;
  align-items: center;
  gap: 16px;
}

.artist-avatar {
  width: 96px;
  height: 96px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.2s;
}

.artist-info h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 4px;
  letter-spacing: -0.5px;
}

.work-count {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
}

.artist-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Works Grid */
.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.work-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s;
}

.work-item:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.work-image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 3/2;
  background: rgba(0, 0, 0, 0.3);
}

.work-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s;
}

.work-image:hover {
  transform: scale(1.02);
}

.work-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s;
}

.work-item:hover .work-actions {
  opacity: 1;
}

.work-action-btn {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border: none;
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.work-action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.work-action-btn:last-child:hover {
  background: #dc3545;
}

.work-details {
  padding: 16px;
}

.work-details h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: #fff;
}

.work-medium {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 10px;
}

.work-link {
  color: #fff;
  text-decoration: none;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  transition: all 0.2s;
}

.work-link:hover {
  background: rgba(255, 255, 255, 0.12);
}

/* Empty Works */
.empty-works {
  padding: 60px 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  border: 2px dashed rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.empty-works p {
  margin-bottom: 16px;
  font-size: 0.95rem;
}

/* Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
}

.modal-content {
  background: #1a1a1a;
  border-radius: 16px;
  padding: 32px;
  max-width: 480px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-content h2 {
  font-size: 1.5rem;
  margin-bottom: 8px;
  font-weight: 600;
}

.modal-subtitle {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  margin-bottom: 20px;
}

/* Forms */
.input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  font-size: 0.95rem;
  margin-bottom: 12px;
  transition: all 0.2s;
}

.input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.25);
}

.input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 0.85rem;
}

.btn-icon {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-icon span {
  font-size: 1.1rem;
  line-height: 1;
}

.btn-primary {
  background: #fff;
  color: #000;
}

.btn-primary:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.12);
}

.btn-icon-only {
  background: rgba(220, 53, 69, 0.15);
  border: 1px solid rgba(220, 53, 69, 0.3);
  color: #ff6b7a;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.3rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon-only:hover {
  background: rgba(220, 53, 69, 0.25);
}

.btn-icon-edit {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon-edit:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.05);
}

/* Empty State */
.empty {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-content {
  text-align: center;
  max-width: 400px;
}

.empty-content h2 {
  font-size: 1.75rem;
  margin-bottom: 12px;
  color: rgba(255, 255, 255, 0.9);
}

.empty-content p {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 24px;
}

/* Lightbox */
.lightbox {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  cursor: pointer;
  padding: 20px;
}

.lightbox-close {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 2rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 301;
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.lightbox-content {
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: default;
}

.lightbox-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.lightbox-info {
  margin-top: 20px;
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  padding: 20px 30px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.lightbox-info h3 {
  font-size: 1.5rem;
  margin-bottom: 8px;
  font-weight: 600;
}

.lightbox-info p {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 4px;
}

.lightbox-medium {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
}

.lightbox-hint {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  pointer-events: none;
}

/* Zoom Hints */
.image-zoom-hint {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 6px 10px;
  border-radius: 6px;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
  font-size: 0.9rem;
}

.work-item:hover .image-zoom-hint {
  opacity: 1;
}

.artist-avatar-wrapper {
  position: relative;
  cursor: pointer;
}

.avatar-zoom-hint {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 4px 6px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
  font-size: 0.8rem;
}

.artist-avatar-wrapper:hover .avatar-zoom-hint {
  opacity: 1;
}

.artist-avatar-wrapper:hover .artist-avatar {
  transform: scale(1.02);
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    padding: 12px 16px;
  }

  .header h1 {
    font-size: 1.1rem;
  }

  .btn-add {
    padding: 6px 12px;
    font-size: 0.85rem;
  }

  .main {
    padding: 16px;
  }

  .artists-list {
    gap: 24px;
  }

  .artist-block {
    padding: 16px;
  }

  .artist-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .artist-controls {
    width: 100%;
    justify-content: space-between;
  }

  .works-grid {
    grid-template-columns: 1fr;
  }

  .artist-avatar {
    width: 80px;
    height: 80px;
  }

  .artist-info h2 {
    font-size: 1.25rem;
  }
}
</style>