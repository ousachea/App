<template>
    <div class="bubble-sort-container">
        <!-- Header -->
        <div class="header">
            <h1 class="title">{{ algorithmName }} Visualizer</h1>
            <p class="subtitle">Watch the algorithm in motion</p>
        </div>

        <!-- Controls Panel -->
        <div class="controls-panel">
            <div class="control-group">
                <label for="array-size" class="label">Array Size</label>
                <input id="array-size" v-model.number="arraySize" type="range" min="5" max="50" class="slider"
                    @change="resetSort" />
                <span class="value-display">{{ arraySize }}</span>
            </div>

            <div class="control-group">
                <label for="speed" class="label">Speed</label>
                <input id="speed" v-model.number="speed" type="range" min="10" max="500" class="slider"
                    @change="updateSpeed" />
                <span class="value-display">{{ 510 - speed }}ms</span>
            </div>

            <div class="control-group">
                <label for="sort-type" class="label">Sort Algorithm</label>
                <select id="sort-type" v-model="sortType" class="select" @change="resetSort" :disabled="isSorting">
                    <option value="bubble">Bubble Sort</option>
                    <option value="selection">Selection Sort</option>
                    <option value="insertion">Insertion Sort</option>
                    <option value="quick">Quick Sort</option>
                    <option value="merge">Merge Sort</option>
                    <option value="heap">Heap Sort</option>
                    <option value="shell">Shell Sort</option>
                    <option value="cocktail">Cocktail Shaker Sort</option>
                    <option value="gnome">Gnome Sort</option>
                    <option value="comb">Comb Sort</option>
                </select>
            </div>

            <div class="button-group">
                <button :class="['btn', { 'btn-active': isSorting }]" @click="startSort" :disabled="isSorting">
                    {{ isSorting ? 'Sorting...' : 'Start Sort' }}
                </button>
                <button :class="['btn', 'btn-reset']" @click="resetSort" :disabled="isSorting">
                    Reset
                </button>
                <button :class="['btn', 'btn-sound', { 'btn-sound-off': !soundEnabled }]" @click="toggleSound"
                    :disabled="isSorting" title="Toggle sound effects">
                    {{ soundEnabled ? '🔊 Sound' : '🔇 Mute' }}
                </button>
            </div>
        </div>

        <!-- Visualization Area -->
        <div class="visualization-wrapper">
            <div class="bars-container">
                <div v-for="(item, index) in array" :key="item.id" class="bar-wrapper">
                    <div class="bar" :style="getBarStyle(item, index)" :class="{
                'bar-comparing': comparingIndices.includes(index),
                'bar-sorted': sortedIndices.includes(index),
            }">
                        <span class="bar-label">{{ item.value }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Stats -->
        <div class="stats">
            <div class="stat-item">
                <span class="stat-label">Comparisons:</span>
                <span class="stat-value">{{ comparisons }}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Swaps:</span>
                <span class="stat-value">{{ swaps }}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Status:</span>
                <span class="stat-value" :class="statusClass">{{ status }}</span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'BubbleSortPage',
    data() {
        return {
            array: [],
            arraySize: 20,
            speed: 300,
            isSorting: false,
            comparisons: 0,
            swaps: 0,
            comparingIndices: [],
            sortedIndices: [],
            status: 'Ready',
            sortDelay: 200,
            audioContext: null,
            soundEnabled: true,
            sortType: 'bubble',
            colors: [
                '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
                '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#52C41A',
                '#FA8C16', '#EB2F96', '#13C2C2', '#1890FF', '#722ED1',
            ],
        };
    },
    computed: {
        statusClass() {
            if (this.status === 'Sorted') return 'status-success';
            if (this.status === 'Sorting...') return 'status-sorting';
            return 'status-ready';
        },
        algorithmName() {
            const names = {
                bubble: 'Bubble Sort',
                selection: 'Selection Sort',
                insertion: 'Insertion Sort',
                quick: 'Quick Sort',
                merge: 'Merge Sort',
                heap: 'Heap Sort',
                shell: 'Shell Sort',
                cocktail: 'Cocktail Shaker Sort',
                gnome: 'Gnome Sort',
                comb: 'Comb Sort',
            };
            return names[this.sortType];
        },
    },
    mounted() {
        this.initializeArray();
        this.initializeAudio();
    },
    methods: {
        initializeAudio() {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        },

        playCompareSound() {
            // Ascending chiming sound for comparison
            this.playChime(700, 0.1, 'sine');
        },
        playSwapSound() {
            // Different chiming pitch for swap (match found)
            this.playChime(500, 0.12, 'sine');
        },
        playSortCompleteSound() {
            // Ascending chime progression for completion
            const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C, E, G, C (higher)
            const now = this.audioContext.currentTime;

            frequencies.forEach((freq, index) => {
                setTimeout(
                    () => {
                        this.playChime(freq, 0.4, 'sine');
                    },
                    index * 100
                );
            });
        },
        playChime(frequency, duration, type = 'sine') {
            if (!this.soundEnabled || !this.audioContext) return;

            const now = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.frequency.value = frequency;
            osc.type = type;
            filter.type = 'lowpass';
            filter.frequency.value = 2000;

            // Envelope for bell-like sound
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.05, now + duration * 0.7);
            gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

            osc.start(now);
            osc.stop(now + duration);
        },
        initializeArray() {
            this.array = [];
            for (let i = 0; i < this.arraySize; i++) {
                const value = Math.floor(Math.random() * 100) + 1;
                const color = this.colors[Math.floor(Math.random() * this.colors.length)];
                this.array.push({ value, color, id: Math.random() });
            }
            this.resetStats();
        },
        resetSort() {
            this.isSorting = false;
            this.initializeArray();
            this.comparingIndices = [];
            this.sortedIndices = [];
            this.status = 'Ready';
        },
        resetStats() {
            this.comparisons = 0;
            this.swaps = 0;
        },
        updateSpeed() {
            this.sortDelay = 510 - this.speed;
        },
        getBarStyle(item, index) {
            const maxValue = Math.max(...this.array.map(a => a.value));
            const heightPercent = (item.value / maxValue) * 100;
            return {
                height: `${heightPercent}%`,
                backgroundColor: item.color,
            };
        },
        sleep(ms) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        },
        async startSort() {
            if (this.isSorting) return;

            this.isSorting = true;
            this.status = 'Sorting...';
            this.resetStats();
            this.sortedIndices = [];

            switch (this.sortType) {
                case 'bubble':
                    await this.bubbleSort();
                    break;
                case 'selection':
                    await this.selectionSort();
                    break;
                case 'insertion':
                    await this.insertionSort();
                    break;
                case 'quick':
                    await this.quickSort();
                    break;
                case 'merge':
                    await this.mergeSort();
                    break;
                case 'heap':
                    await this.heapSort();
                    break;
                case 'shell':
                    await this.shellSort();
                    break;
                case 'cocktail':
                    await this.cocktailSort();
                    break;
                case 'gnome':
                    await this.gnomeSort();
                    break;
                case 'comb':
                    await this.combSort();
                    break;
            }

            this.comparingIndices = [];
            this.isSorting = false;
            this.status = 'Sorted';
            this.playSortCompleteSound();
        },
        async bubbleSort() {
            const n = this.array.length;

            for (let i = 0; i < n; i++) {
                let swapped = false;

                for (let j = 0; j < n - i - 1; j++) {
                    this.comparingIndices = [j, j + 1];
                    this.comparisons++;
                    this.playCompareSound();

                    await this.sleep(this.sortDelay);

                    if (this.array[j].value > this.array[j + 1].value) {
                        const temp = this.array[j];
                        this.array[j] = this.array[j + 1];
                        this.array[j + 1] = temp;
                        this.swaps++;
                        swapped = true;
                        this.playSwapSound();
                    }

                    this.array = [...this.array];
                }

                this.sortedIndices.push(n - i - 1);

                if (!swapped) break;
            }

            for (let i = 0; i < n; i++) {
                if (!this.sortedIndices.includes(i)) {
                    this.sortedIndices.push(i);
                }
            }
        },
        async selectionSort() {
            const n = this.array.length;

            for (let i = 0; i < n - 1; i++) {
                let minIndex = i;

                for (let j = i + 1; j < n; j++) {
                    this.comparingIndices = [minIndex, j];
                    this.comparisons++;
                    this.playCompareSound();

                    await this.sleep(this.sortDelay);

                    if (this.array[j].value < this.array[minIndex].value) {
                        minIndex = j;
                    }
                }

                if (minIndex !== i) {
                    const temp = this.array[i];
                    this.array[i] = this.array[minIndex];
                    this.array[minIndex] = temp;
                    this.swaps++;
                    this.playSwapSound();
                }

                this.array = [...this.array];
                this.sortedIndices.push(i);
            }

            this.sortedIndices.push(n - 1);
        },
        async insertionSort() {
            const n = this.array.length;

            for (let i = 1; i < n; i++) {
                let key = this.array[i];
                let j = i - 1;

                while (j >= 0) {
                    this.comparingIndices = [j, i];
                    this.comparisons++;
                    this.playCompareSound();

                    await this.sleep(this.sortDelay);

                    if (this.array[j].value > key.value) {
                        this.array[j + 1] = this.array[j];
                        this.swaps++;
                        this.playSwapSound();
                        j--;
                    } else {
                        break;
                    }

                    this.array = [...this.array];
                }

                this.array[j + 1] = key;
                this.array = [...this.array];
                this.sortedIndices.push(i);
            }
        },
        async quickSort() {
            await this.quickSortHelper(0, this.array.length - 1);

            for (let i = 0; i < this.array.length; i++) {
                if (!this.sortedIndices.includes(i)) {
                    this.sortedIndices.push(i);
                }
            }
        },
        async quickSortHelper(low, high) {
            if (low < high) {
                const pi = await this.partition(low, high);

                await this.quickSortHelper(low, pi - 1);
                await this.quickSortHelper(pi + 1, high);
            } else if (low === high) {
                this.sortedIndices.push(low);
            }
        },
        async partition(low, high) {
            const pivot = this.array[high].value;
            let i = low - 1;

            for (let j = low; j < high; j++) {
                this.comparingIndices = [j, high];
                this.comparisons++;
                this.playCompareSound();

                await this.sleep(this.sortDelay);

                if (this.array[j].value < pivot) {
                    i++;
                    const temp = this.array[i];
                    this.array[i] = this.array[j];
                    this.array[j] = temp;
                    this.swaps++;
                    this.playSwapSound();
                    this.array = [...this.array];
                }
            }

            const temp = this.array[i + 1];
            this.array[i + 1] = this.array[high];
            this.array[high] = temp;
            this.swaps++;
            this.playSwapSound();
            this.array = [...this.array];

            return i + 1;
        },
        async mergeSort() {
            await this.mergeSortHelper(0, this.array.length - 1);

            for (let i = 0; i < this.array.length; i++) {
                if (!this.sortedIndices.includes(i)) {
                    this.sortedIndices.push(i);
                }
            }
        },
        async mergeSortHelper(left, right) {
            if (left < right) {
                const mid = Math.floor((left + right) / 2);

                await this.mergeSortHelper(left, mid);
                await this.mergeSortHelper(mid + 1, right);

                await this.merge(left, mid, right);
            }
        },
        async merge(left, mid, right) {
            const leftArr = this.array.slice(left, mid + 1);
            const rightArr = this.array.slice(mid + 1, right + 1);

            let i = 0,
                j = 0,
                k = left;

            while (i < leftArr.length && j < rightArr.length) {
                this.comparingIndices = [left + i, mid + 1 + j];
                this.comparisons++;
                this.playCompareSound();

                await this.sleep(this.sortDelay);

                if (leftArr[i].value <= rightArr[j].value) {
                    this.array[k] = leftArr[i];
                    i++;
                } else {
                    this.array[k] = rightArr[j];
                    j++;
                }

                this.swaps++;
                this.playSwapSound();
                this.array = [...this.array];
                k++;
            }

            while (i < leftArr.length) {
                this.array[k] = leftArr[i];
                this.swaps++;
                this.playSwapSound();
                i++;
                k++;
                this.array = [...this.array];
            }

            while (j < rightArr.length) {
                this.array[k] = rightArr[j];
                this.swaps++;
                this.playSwapSound();
                j++;
                k++;
                this.array = [...this.array];
            }
        },
        async heapSort() {
            const n = this.array.length;

            for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
                await this.heapify(n, i);
            }

            for (let i = n - 1; i > 0; i--) {
                this.comparingIndices = [0, i];
                const temp = this.array[0];
                this.array[0] = this.array[i];
                this.array[i] = temp;
                this.swaps++;
                this.playSwapSound();

                this.array = [...this.array];
                this.sortedIndices.push(i);

                await this.heapify(i, 0);
            }

            this.sortedIndices.push(0);
        },
        async heapify(n, i) {
            let largest = i;
            const left = 2 * i + 1;
            const right = 2 * i + 2;

            if (left < n) {
                this.comparingIndices = [largest, left];
                this.comparisons++;
                this.playCompareSound();

                await this.sleep(this.sortDelay);

                if (this.array[left].value > this.array[largest].value) {
                    largest = left;
                }
            }

            if (right < n) {
                this.comparingIndices = [largest, right];
                this.comparisons++;
                this.playCompareSound();

                await this.sleep(this.sortDelay);

                if (this.array[right].value > this.array[largest].value) {
                    largest = right;
                }
            }

            if (largest !== i) {
                const temp = this.array[i];
                this.array[i] = this.array[largest];
                this.array[largest] = temp;
                this.swaps++;
                this.playSwapSound();

                this.array = [...this.array];

                await this.heapify(n, largest);
            }
        },
        async shellSort() {
            const n = this.array.length;
            let gap = Math.floor(n / 2);

            while (gap > 0) {
                for (let i = gap; i < n; i++) {
                    const temp = this.array[i];
                    let j = i;

                    while (j >= gap) {
                        this.comparingIndices = [j - gap, j];
                        this.comparisons++;
                        this.playCompareSound();

                        await this.sleep(this.sortDelay);

                        if (this.array[j - gap].value > temp.value) {
                            this.array[j] = this.array[j - gap];
                            this.swaps++;
                            this.playSwapSound();
                            j -= gap;
                        } else {
                            break;
                        }

                        this.array = [...this.array];
                    }

                    this.array[j] = temp;
                    this.array = [...this.array];
                }

                gap = Math.floor(gap / 2);
            }

            for (let i = 0; i < n; i++) {
                this.sortedIndices.push(i);
            }
        },
        async cocktailSort() {
            let left = 0;
            let right = this.array.length - 1;
            let swapped = true;

            while (swapped && left < right) {
                swapped = false;

                for (let i = left; i < right; i++) {
                    this.comparingIndices = [i, i + 1];
                    this.comparisons++;
                    this.playCompareSound();

                    await this.sleep(this.sortDelay);

                    if (this.array[i].value > this.array[i + 1].value) {
                        const temp = this.array[i];
                        this.array[i] = this.array[i + 1];
                        this.array[i + 1] = temp;
                        this.swaps++;
                        this.playSwapSound();
                        swapped = true;
                    }

                    this.array = [...this.array];
                }

                right--;

                if (!swapped) break;

                for (let i = right; i > left; i--) {
                    this.comparingIndices = [i - 1, i];
                    this.comparisons++;
                    this.playCompareSound();

                    await this.sleep(this.sortDelay);

                    if (this.array[i - 1].value > this.array[i].value) {
                        const temp = this.array[i - 1];
                        this.array[i - 1] = this.array[i];
                        this.array[i] = temp;
                        this.swaps++;
                        this.playSwapSound();
                        swapped = true;
                    }

                    this.array = [...this.array];
                }

                left++;
            }

            for (let i = 0; i < this.array.length; i++) {
                if (!this.sortedIndices.includes(i)) {
                    this.sortedIndices.push(i);
                }
            }
        },
        async gnomeSort() {
            let pos = 0;
            const n = this.array.length;

            while (pos < n) {
                if (pos === 0 || this.array[pos].value >= this.array[pos - 1].value) {
                    pos++;
                } else {
                    this.comparingIndices = [pos - 1, pos];
                    this.comparisons++;
                    this.playCompareSound();

                    const temp = this.array[pos];
                    this.array[pos] = this.array[pos - 1];
                    this.array[pos - 1] = temp;
                    this.swaps++;
                    this.playSwapSound();

                    this.array = [...this.array];

                    await this.sleep(this.sortDelay);

                    pos--;
                }
            }

            for (let i = 0; i < n; i++) {
                this.sortedIndices.push(i);
            }
        },
        async combSort() {
            let gap = this.array.length;
            let swapped = true;

            while (gap > 1 || swapped) {
                gap = Math.floor(gap / 1.3);
                if (gap < 1) gap = 1;

                swapped = false;

                for (let i = 0; i < this.array.length - gap; i++) {
                    this.comparingIndices = [i, i + gap];
                    this.comparisons++;
                    this.playCompareSound();

                    await this.sleep(this.sortDelay);

                    if (this.array[i].value > this.array[i + gap].value) {
                        const temp = this.array[i];
                        this.array[i] = this.array[i + gap];
                        this.array[i + gap] = temp;
                        this.swaps++;
                        this.playSwapSound();
                        swapped = true;
                    }

                    this.array = [...this.array];
                }
            }

            for (let i = 0; i < this.array.length; i++) {
                this.sortedIndices.push(i);
            }
        },
        toggleSound() {
            this.soundEnabled = !this.soundEnabled;
        },
    },
};
</script>

<style scoped>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

.bubble-sort-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #f5f1e8 0%, #ece6dc 100%);
    padding: 3rem 2rem;
    font-family: 'IBM Plex Mono', monospace;
    color: #1a1a1a;
}

/* Header */
.header {
    text-align: center;
    margin-bottom: 4rem;
    padding: 2rem 0;
}

.title {
    font-size: 3rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin-bottom: 0.5rem;
    font-family: 'JetBrains Mono', monospace;
}

.subtitle {
    font-size: 1rem;
    color: #666;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 400;
}

/* Controls Panel */
.controls-panel {
    background: rgba(255, 255, 255, 0.7);
    border: 2px solid #1a1a1a;
    border-radius: 2px;
    padding: 2rem;
    margin-bottom: 3rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
    box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.05);
}

.control-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.label {
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #1a1a1a;
}

.slider {
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: #ddd;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
}

.slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #1a1a1a;
    cursor: pointer;
    border: 2px solid #f5f1e8;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
}

.slider::-webkit-slider-thumb:hover {
    width: 22px;
    height: 22px;
}

.slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #1a1a1a;
    cursor: pointer;
    border: 2px solid #f5f1e8;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
}

.slider::-moz-range-thumb:hover {
    width: 22px;
    height: 22px;
}

.value-display {
    font-size: 0.9rem;
    color: #666;
    font-weight: 500;
}

.select {
    width: 100%;
    padding: 0.6rem 0.75rem;
    border: 2px solid #1a1a1a;
    border-radius: 2px;
    background: #fff;
    color: #1a1a1a;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.select:hover:not(:disabled) {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.select:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(212, 165, 116, 0.3);
}

.select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.button-group {
    grid-column: 1 / -1;
    display: flex;
    gap: 1rem;
}

.btn {
    flex: 1;
    padding: 0.75rem 1.5rem;
    border: 2px solid #1a1a1a;
    background: #fff;
    color: #1a1a1a;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.2s ease;
    text-transform: uppercase;
}

.btn:hover:not(:disabled) {
    background: #1a1a1a;
    color: #fff;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.1);
}

.btn:active:not(:disabled) {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-active {
    background: #1a1a1a;
    color: #fff;
}

.btn-reset {
    background: #f5f1e8;
}

.btn-sound {
    background: #fff;
    font-size: 0.85rem;
    padding: 0.75rem 1rem;
}

.btn-sound-off {
    opacity: 0.7;
    border-style: dashed;
}

/* Visualization */
.visualization-wrapper {
    background: rgba(255, 255, 255, 0.5);
    border: 2px solid #1a1a1a;
    border-radius: 2px;
    padding: 3rem 2rem;
    margin-bottom: 3rem;
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
    box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.05);
}

.bars-container {
    display: flex;
    align-items: flex-end;
    justify-content: space-around;
    height: 400px;
    gap: 0.4rem;
}

.bar-wrapper {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    min-width: 0;
}

.bar {
    width: 100%;
    background: linear-gradient(180deg, #d4a574 0%, #c9935e 100%);
    border: 2px solid #1a1a1a;
    border-radius: 2px 2px 0 0;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 0.5rem 0;
    transition: all 0.15s ease;
    position: relative;
    box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.3);
}

.bar-label {
    font-size: 0.65rem;
    font-weight: 600;
    color: #fff;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
    writing-mode: vertical-rl;
    text-orientation: mixed;
    opacity: 0.8;
}

.bar-comparing {
    animation: compareFlash 0.3s ease;
    filter: brightness(0.7) saturate(1.3);
    box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.3),
        0 0 12px rgba(0, 0, 0, 0.4);
}

.bar-sorted {
    filter: brightness(1.1) saturate(0.9);
    box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.3),
        0 0 8px rgba(0, 0, 0, 0.2);
}

@keyframes compareFlash {
    0% {
        transform: scaleY(1);
    }

    50% {
        transform: scaleY(1.05);
    }

    100% {
        transform: scaleY(1);
    }
}

/* Stats */
.stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1.5rem;
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
}

.stat-item {
    background: rgba(255, 255, 255, 0.7);
    border: 2px solid #1a1a1a;
    border-radius: 2px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.05);
}

.stat-label {
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #666;
}

.stat-value {
    font-size: 1.8rem;
    font-weight: 700;
    color: #1a1a1a;
}

.status-success {
    color: #45b361;
}

.status-sorting {
    color: #e8725f;
    animation: pulse 1s infinite;
}

.status-ready {
    color: #d4a574;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.6;
    }
}

/* Responsive */
@media (max-width: 768px) {
    .bubble-sort-container {
        padding: 1.5rem 1rem;
    }

    .title {
        font-size: 2rem;
    }

    .controls-panel {
        grid-template-columns: 1fr;
        gap: 1.5rem;
        padding: 1.5rem;
    }

    .button-group {
        gap: 0.75rem;
    }

    .visualization-wrapper {
        padding: 2rem 1rem;
    }

    .bars-container {
        height: 300px;
        gap: 0.3rem;
    }

    .stats {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 480px) {
    .title {
        font-size: 1.5rem;
    }

    .bars-container {
        height: 250px;
    }

    .bar-label {
        font-size: 0.5rem;
    }
}
</style>