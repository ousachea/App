<template>
    <div class="toggle-container">
        <div class="card">
            <div class="header">
                <div class="icon-badge">🎯</div>
                <h1 class="title">The Project Triangle</h1>
                <p class="subtitle">Pick any two. You can't have all three.</p>
            </div>

            <div class="toggles">
                <div class="toggle-item" :class="{ active: cheap }">
                    <label class="toggle-label">
                        <div class="toggle-info">
                            <span class="toggle-icon">💰</span>
                            <div class="toggle-content">
                                <span class="toggle-title">Budget-Friendly</span>
                                <span class="toggle-description">Keep costs low</span>
                            </div>
                        </div>
                        <div class="toggle-switch">
                            <input type="checkbox" v-model="cheap" @change="handleToggle('cheap')" />
                            <span class="slider"></span>
                        </div>
                    </label>
                </div>

                <div class="toggle-item" :class="{ active: fast }">
                    <label class="toggle-label">
                        <div class="toggle-info">
                            <span class="toggle-icon">⚡</span>
                            <div class="toggle-content">
                                <span class="toggle-title">Quick Delivery</span>
                                <span class="toggle-description">Done rapidly</span>
                            </div>
                        </div>
                        <div class="toggle-switch">
                            <input type="checkbox" v-model="fast" @change="handleToggle('fast')" />
                            <span class="slider"></span>
                        </div>
                    </label>
                </div>

                <div class="toggle-item" :class="{ active: highQuality }">
                    <label class="toggle-label">
                        <div class="toggle-info">
                            <span class="toggle-icon">✨</span>
                            <div class="toggle-content">
                                <span class="toggle-title">Premium Quality</span>
                                <span class="toggle-description">Exceptional results</span>
                            </div>
                        </div>
                        <div class="toggle-switch">
                            <input type="checkbox" v-model="highQuality" @change="handleToggle('highQuality')" />
                            <span class="slider"></span>
                        </div>
                    </label>
                </div>
            </div>

            <transition name="fade">
                <div v-if="selectedCount > 2 || showAlert" class="warning">
                    <span class="warning-icon">⚠️</span>
                    <span>You can only choose two priorities</span>
                </div>
            </transition>

            <transition name="alert-slide">
                <div v-if="showAlert" class="custom-alert">
                    <div class="alert-content">
                        <span class="alert-icon">🎯</span>
                        <div class="alert-text">
                            <strong>Nice try!</strong>
                            <p>But the Project Triangle law says you can only pick 2 out of 3. Something has to give!
                            </p>
                        </div>
                    </div>
                </div>
            </transition>

            <transition name="slide">
                <div v-if="selectedCount === 2" class="result">
                    <div class="result-icon">{{ getResultIcon }}</div>
                    <h3>Your Trade-off</h3>
                    <p>{{ getSelectionMessage }}</p>

                    <button @click="copyResult" class="copy-button">
                        <span class="copy-icon">📋</span>
                        Copy Result
                    </button>

                    <transition name="fade">
                        <div v-if="showCopySuccess" class="copy-success">
                            ✓ Copied to clipboard!
                        </div>
                    </transition>
                </div>
            </transition>

            <div v-if="selectedCount === 0" class="empty-state">
                <p>Select your two priorities to see the trade-off</p>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'TogglePage',
    data() {
        return {
            cheap: false,
            fast: false,
            highQuality: false,
            showAlert: false,
            showCopySuccess: false,
        }
    },
    computed: {
        selectedCount() {
            return [this.cheap, this.fast, this.highQuality].filter(Boolean).length
        },
        getSelectionMessage() {
            if (this.cheap && this.fast) {
                return "Lower costs and faster delivery, but expect compromises in quality and refinement."
            }
            if (this.cheap && this.highQuality) {
                return "Affordable excellence takes patience. Budget-friendly quality requires extended timelines."
            }
            if (this.fast && this.highQuality) {
                return "Premium results delivered quickly come at a premium price. Speed and quality cost more."
            }
            return ''
        },
        getResultIcon() {
            if (this.cheap && this.fast) return '🏃‍♂️'
            if (this.cheap && this.highQuality) return '⏳'
            if (this.fast && this.highQuality) return '💎'
            return '🎯'
        },
    },
    methods: {
        handleToggle(toggleName) {
            if (this.selectedCount > 2) {
                // Show UI alert
                this.showAlert = true

                // Auto-hide alert after 4 seconds
                setTimeout(() => {
                    this.showAlert = false
                }, 4000)

                this.$nextTick(() => {
                    this[toggleName] = false
                })
            }
        },
        async copyResult() {
            const selectedOptions = []
            if (this.cheap) selectedOptions.push('Budget-Friendly')
            if (this.fast) selectedOptions.push('Quick Delivery')
            if (this.highQuality) selectedOptions.push('Premium Quality')

            const textToCopy = `My Project Priorities:
• ${selectedOptions.join(' & ')}

Trade-off: ${this.getSelectionMessage}`

            try {
                await navigator.clipboard.writeText(textToCopy)
                // Show success feedback
                this.showCopySuccess = true
                setTimeout(() => {
                    this.showCopySuccess = false
                }, 2000)
            } catch (err) {
                // Fallback for older browsers
                const textArea = document.createElement('textarea')
                textArea.value = textToCopy
                document.body.appendChild(textArea)
                textArea.select()
                document.execCommand('copy')
                document.body.removeChild(textArea)

                this.showCopySuccess = true
                setTimeout(() => {
                    this.showCopySuccess = false
                }, 2000)
            }
        },
    },
}
</script>

<style scoped>
* {
    box-sizing: border-box;
}

.toggle-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.card {
    background: white;
    border-radius: 24px;
    padding: 48px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    max-width: 560px;
    width: 100%;
}

.header {
    text-align: center;
    margin-bottom: 40px;
}

.icon-badge {
    width: 64px;
    height: 64px;
    margin: 0 auto 20px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);
}

.title {
    font-size: 36px;
    font-weight: 800;
    color: #1e293b;
    margin: 0 0 12px 0;
    letter-spacing: -0.5px;
}

.subtitle {
    font-size: 18px;
    color: #64748b;
    margin: 0;
    font-weight: 500;
}

.toggles {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
}

.toggle-item {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px 24px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-item:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.toggle-item.active {
    background: linear-gradient(135deg, #ede9fe 0%, #f3e8ff 100%);
    border-color: #a78bfa;
    box-shadow: 0 4px 16px rgba(139, 92, 246, 0.2);
}

.toggle-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    user-select: none;
}

.toggle-info {
    display: flex;
    align-items: center;
    gap: 16px;
}

.toggle-icon {
    font-size: 28px;
    line-height: 1;
}

.toggle-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.toggle-title {
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.2;
}

.toggle-description {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
}

.toggle-switch {
    position: relative;
    width: 56px;
    height: 32px;
    flex-shrink: 0;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #cbd5e1;
    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 32px;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.slider:before {
    position: absolute;
    content: "";
    height: 24px;
    width: 24px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input:checked+.slider {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 4px rgba(139, 92, 246, 0.1);
}

input:checked+.slider:before {
    transform: translateX(24px);
}

.warning {
    background: linear-gradient(135deg, #fef2f2, #fee2e2);
    border: 2px solid #fca5a5;
    color: #991b1b;
    padding: 18px 20px;
    border-radius: 12px;
    text-align: center;
    font-weight: 600;
    font-size: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 8px;
}

.warning-icon {
    font-size: 20px;
}

.custom-alert {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    max-width: 500px;
    width: calc(100% - 40px);
}

.alert-content {
    background: linear-gradient(135deg, #1e293b, #334155);
    color: white;
    padding: 20px 24px;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    gap: 16px;
    backdrop-filter: blur(10px);
}

.alert-icon {
    font-size: 32px;
    flex-shrink: 0;
}

.alert-text {
    flex: 1;
}

.alert-text strong {
    display: block;
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 4px;
    color: #fbbf24;
}

.alert-text p {
    margin: 0;
    font-size: 15px;
    line-height: 1.5;
    color: #e2e8f0;
    font-weight: 500;
}

.result {
    background: linear-gradient(135deg, #ecfdf5, #d1fae5);
    border: 2px solid #86efac;
    padding: 28px;
    border-radius: 16px;
    margin-top: 8px;
    text-align: center;
}

.result-icon {
    font-size: 48px;
    margin-bottom: 12px;
}

.result h3 {
    margin: 0 0 12px 0;
    font-size: 20px;
    font-weight: 700;
    color: #065f46;
}

.result p {
    margin: 0 0 20px 0;
    font-size: 16px;
    line-height: 1.6;
    color: #047857;
    font-weight: 500;
}

.copy-button {
    background: linear-gradient(135deg, #059669, #047857);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
    font-family: inherit;
}

.copy-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(5, 150, 105, 0.4);
}

.copy-button:active {
    transform: translateY(0);
}

.copy-icon {
    font-size: 18px;
}

.copy-success {
    margin-top: 12px;
    color: #065f46;
    font-weight: 600;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.empty-state {
    text-align: center;
    padding: 32px 20px;
    color: #94a3b8;
    font-size: 15px;
    font-weight: 500;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter,
.fade-leave-to {
    opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter {
    opacity: 0;
    transform: translateY(-20px);
}

.slide-leave-to {
    opacity: 0;
    transform: translateY(20px);
}

.alert-slide-enter-active,
.alert-slide-leave-active {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.alert-slide-enter {
    opacity: 0;
    transform: translate(-50%, -20px);
}

.alert-slide-leave-to {
    opacity: 0;
    transform: translate(-50%, -20px);
}

@media (max-width: 600px) {
    .card {
        padding: 32px 24px;
    }

    .title {
        font-size: 28px;
    }

    .subtitle {
        font-size: 16px;
    }

    .toggle-title {
        font-size: 16px;
    }

    .toggle-description {
        font-size: 13px;
    }

    .toggle-icon {
        font-size: 24px;
    }

    .icon-badge {
        width: 56px;
        height: 56px;
        font-size: 28px;
    }
}
</style>