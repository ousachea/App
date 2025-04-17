<template>
  <div :class="['min-h-screen transition-colors duration-300', darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gradient-to-b from-blue-50 to-indigo-50']">
    <!-- Notification -->
    <div v-if="notification" class="fixed top-4 right-4 z-50 notification shadow-xl">
      <div :class="['flex items-center px-4 py-3 rounded-lg', notificationType === 'success' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100']">
        <div class="mr-3">
          <svg v-if="notificationType === 'success'" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <svg v-else class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
        </div>
        {{ notification }}
      </div>
    </div>
    
    <div class="container mx-auto p-6">
      <!-- Header with dark mode toggle -->
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl md:text-4xl font-bold tracking-tight">
          <span :class="darkMode ? 'text-blue-400' : 'text-blue-600'">Text</span>
          <span :class="darkMode ? 'text-purple-400' : 'text-purple-600'">Diff</span>
        </h1>
        <div class="flex items-center space-x-4">
          <button 
            @click="toggleDarkMode" 
            class="p-2 rounded-full focus:outline-none"
            :class="darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-blue-100 text-gray-800'"
          >
            <svg v-if="darkMode" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Settings bar with examples and view options -->
      <div :class="['flex flex-wrap items-center justify-between p-3 mb-5 rounded-lg', darkMode ? 'bg-gray-800' : 'bg-white shadow-sm']">
        <div class="flex items-center space-x-3 mb-2 sm:mb-0">
          <button 
            @click="loadExamples" 
            :class="['flex items-center px-3 py-1.5 text-sm rounded transition-colors', 
              darkMode ? 'hover:bg-gray-700 text-blue-300' : 'hover:bg-blue-50 text-blue-600']"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Examples
          </button>
          <button 
            @click="clearAll" 
            :class="['flex items-center px-3 py-1.5 text-sm rounded transition-colors',
              darkMode ? 'hover:bg-gray-700 text-red-300' : 'hover:bg-red-50 text-red-600']"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear
          </button>
        </div>
        
        <div class="flex items-center space-x-2">
          <label :class="['text-sm', darkMode ? 'text-gray-300' : 'text-gray-600']">View Mode:</label>
          <div :class="['flex p-0.5 rounded-md', darkMode ? 'bg-gray-700' : 'bg-gray-100']">
            <button 
              @click="viewMode = 'split'"
              :class="[
                'px-3 py-1 text-xs rounded-md transition-colors',
                viewMode === 'split' 
                  ? (darkMode ? 'bg-gray-600 text-white' : 'bg-white shadow-sm text-gray-800') 
                  : (darkMode ? 'text-gray-400' : 'text-gray-600')
              ]"
            >
              Split
            </button>
            <button 
              @click="viewMode = 'unified'"
              :class="[
                'px-3 py-1 text-xs rounded-md transition-colors',
                viewMode === 'unified' 
                  ? (darkMode ? 'bg-gray-600 text-white' : 'bg-white shadow-sm text-gray-800') 
                  : (darkMode ? 'text-gray-400' : 'text-gray-600')
              ]"
            >
              Unified
            </button>
          </div>
        </div>
      </div>
      
      <!-- Main content area -->
      <div :class="['rounded-xl overflow-hidden transition-shadow', darkMode ? 'bg-gray-800 shadow-xl' : 'bg-white shadow-lg']">
        <!-- Text input area -->
        <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x" :class="darkMode ? 'divide-gray-700' : 'divide-gray-200'">
          <!-- Text Input 1 -->
          <div class="p-5">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <h2 :class="['text-lg font-semibold', darkMode ? 'text-gray-100' : 'text-gray-800']">Original Text</h2>
              </div>
              <span :class="['text-xs', darkMode ? 'text-gray-400' : 'text-gray-500']">
                {{ textLength(text1) }} characters
              </span>
            </div>
            <div :class="['relative overflow-hidden rounded-lg transition-colors', darkMode ? 'bg-gray-900' : 'bg-gray-50']">
              <textarea
                v-model="text1"
                :class="[
                  'w-full p-4 h-64 transition-colors focus:outline-none resize-none',
                  darkMode 
                    ? 'bg-gray-900 text-gray-100 placeholder-gray-500' 
                    : 'bg-gray-50 text-gray-800 placeholder-gray-400'
                ]"
                placeholder="Enter original text here..."
              ></textarea>
              <div 
                :class="['absolute right-2 bottom-2 text-xs px-2 py-1 rounded-md opacity-70', darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600']"
              >
                Original
              </div>
            </div>
          </div>
          
          <!-- Text Input 2 -->
          <div class="p-5">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                <h2 :class="['text-lg font-semibold', darkMode ? 'text-gray-100' : 'text-gray-800']">Modified Text</h2>
              </div>
              <span :class="['text-xs', darkMode ? 'text-gray-400' : 'text-gray-500']">
                {{ textLength(text2) }} characters
              </span>
            </div>
            <div :class="['relative overflow-hidden rounded-lg transition-colors', darkMode ? 'bg-gray-900' : 'bg-gray-50']">
              <textarea
                v-model="text2"
                :class="[
                  'w-full p-4 h-64 transition-colors focus:outline-none resize-none',
                  darkMode 
                    ? 'bg-gray-900 text-gray-100 placeholder-gray-500' 
                    : 'bg-gray-50 text-gray-800 placeholder-gray-400'
                ]"
                placeholder="Enter modified text here..."
              ></textarea>
              <div 
                :class="['absolute right-2 bottom-2 text-xs px-2 py-1 rounded-md opacity-70', darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600']"
              >
                Modified
              </div>
            </div>
          </div>
        </div>
        
        <!-- Compare button area -->
        <div :class="['flex justify-center p-5 border-t', darkMode ? 'border-gray-700' : 'border-gray-200']">
          <button 
            @click="compareTexts" 
            :class="[
              'flex items-center px-6 md:px-8 py-3 rounded-full font-semibold shadow-md transform transition hover:scale-105 duration-200 focus:outline-none',
              darkMode 
                ? 'bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white' 
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
            ]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
            </svg>
            Compare Texts
          </button>
        </div>
      </div>
      
      <!-- Comparison Results -->
      <div v-if="hasComparisonResults" class="mt-8 mb-6 transform transition-transform duration-300">
        <div :class="['rounded-xl overflow-hidden transition-shadow', darkMode ? 'bg-gray-800 shadow-xl' : 'bg-white shadow-lg']">
          <!-- Results header -->
          <div :class="['flex justify-between items-center p-5 border-b', darkMode ? 'border-gray-700' : 'border-gray-200']">
            <h2 :class="['text-lg font-semibold', darkMode ? 'text-gray-100' : 'text-gray-800']">Comparison Result</h2>
            
            <div class="flex items-center space-x-3">
              <div class="flex items-center">
                <span :class="['inline-block w-3 h-3 rounded mr-1', darkMode ? 'bg-red-800 border border-red-600' : 'bg-red-100 border border-red-300']"></span>
                <span :class="['text-xs', darkMode ? 'text-gray-300' : 'text-gray-600']">Removed</span>
              </div>
              <div class="flex items-center">
                <span :class="['inline-block w-3 h-3 rounded mr-1', darkMode ? 'bg-green-800 border border-green-600' : 'bg-green-100 border border-green-300']"></span>
                <span :class="['text-xs', darkMode ? 'text-gray-300' : 'text-gray-600']">Added</span>
              </div>
            </div>
          </div>
          
          <!-- Results statistics -->
          <div :class="['flex justify-between text-xs px-5 pt-3', darkMode ? 'text-gray-400' : 'text-gray-500']">
            <span>{{ getDiffStats }}</span>
            <span class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Use arrow keys to navigate changes</span>
            </span>
          </div>
          
          <!-- Split view or unified view -->
          <div v-if="viewMode === 'split' && hasComparisonResults" class="p-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Original text with removals -->
              <div :class="['p-4 rounded-lg overflow-auto max-h-96', darkMode ? 'bg-gray-900' : 'bg-gray-50']">
                <div class="font-mono text-sm whitespace-pre-wrap">
                  <span v-for="(part, index) in safeComparisonResult" 
                        v-if="!partAdded(part)"
                        :key="'left-' + index" 
                        :class="{
                          'px-1 py-0.5 rounded-sm bg-opacity-50': partRemoved(part),
                          [darkMode ? 'bg-red-900 text-red-300 border border-red-700' : 'bg-red-100 text-red-800 border border-red-200']: partRemoved(part),
                          [darkMode ? 'text-gray-300' : 'text-gray-800']: !partRemoved(part)
                        }">
                    {{ part.value || '' }}
                  </span>
                </div>
              </div>
              
              <!-- Modified text with additions -->
              <div :class="['p-4 rounded-lg overflow-auto max-h-96', darkMode ? 'bg-gray-900' : 'bg-gray-50']">
                <div class="font-mono text-sm whitespace-pre-wrap">
                  <span v-for="(part, index) in safeComparisonResult" 
                        v-if="!partRemoved(part)"
                        :key="'right-' + index" 
                        :class="{
                          'px-1 py-0.5 rounded-sm bg-opacity-50': partAdded(part),
                          [darkMode ? 'bg-green-900 text-green-300 border border-green-700' : 'bg-green-100 text-green-800 border border-green-200']: partAdded(part),
                          [darkMode ? 'text-gray-300' : 'text-gray-800']: !partAdded(part)
                        }">
                    {{ part.value || '' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Unified view -->
          <div v-else class="p-5">
            <div :class="['p-4 rounded-lg overflow-auto max-h-96', darkMode ? 'bg-gray-900' : 'bg-gray-50']">
              <div class="comparison-result font-mono text-sm">
                <span 
                  v-for="(part, index) in safeComparisonResult" 
                  :key="index"
                  :class="{
                    'px-1 py-0.5 rounded-sm bg-opacity-50': partAdded(part) || partRemoved(part),
                    [darkMode ? 'bg-green-900 text-green-300 border border-green-700' : 'bg-green-100 text-green-800 border border-green-200']: partAdded(part),
                    [darkMode ? 'bg-red-900 text-red-300 border border-red-700' : 'bg-red-100 text-red-800 border border-red-200']: partRemoved(part),
                    [darkMode ? 'text-gray-300' : 'text-gray-800']: !partAdded(part) && !partRemoved(part)
                  }"
                >{{ part.value || '' }}</span>
              </div>
            </div>
          </div>
          
          <!-- Results actions -->
          <div :class="['flex justify-between p-5 border-t', darkMode ? 'border-gray-700' : 'border-gray-200']">
            <div class="flex space-x-2">
              <button
                class="flex items-center transition"
                :class="[
                  'px-3 py-1.5 text-sm rounded-md',
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                ]"
                @click="$event => { compareTexts(); }"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
            
            <div class="flex space-x-2">
              <button
                @click="copyToClipboard"
                class="flex items-center transition"
                :class="[
                  'px-3 py-1.5 text-sm rounded-md',
                  darkMode 
                    ? 'bg-blue-900 hover:bg-blue-800 text-blue-200' 
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                ]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Result
              </button>
              
              <button
                @click="exportDiff"
                class="flex items-center transition"
                :class="[
                  'px-3 py-1.5 text-sm rounded-md',
                  darkMode 
                    ? 'bg-purple-900 hover:bg-purple-800 text-purple-200' 
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-700'
                ]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div :class="['text-center mt-8', darkMode ? 'text-gray-400' : 'text-gray-500']">
        <p class="text-sm">Made with <span class="text-red-500">♥</span> using Nuxt.js</p>
        <p class="mt-1 text-xs">Text comparison powered by diff library</p>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import { diffWords } from 'diff'

export default defineComponent({
  setup() {
    const text1 = ref('')
    const text2 = ref('')
    const comparisonResult = ref([])
    const notification = ref('')
    const notificationType = ref('success')
    const darkMode = ref(false)
    const viewMode = ref('unified') // 'unified' or 'split'

    // Safe accessor helpers
    const textLength = (text) => {
      return text && typeof text === 'string' ? text.length : 0;
    };
    
    const partAdded = (part) => {
      return part && part.added === true;
    };
    
    const partRemoved = (part) => {
      return part && part.removed === true;
    };
    
    // Safe comparison result accessor
    const safeComparisonResult = computed(() => {
      return Array.isArray(comparisonResult.value) ? comparisonResult.value : [];
    });
    
    // Check if we have comparison results
    const hasComparisonResults = computed(() => {
      return Array.isArray(comparisonResult.value) && comparisonResult.value.length > 0;
    });

    // Computed property to get diff statistics
    const getDiffStats = computed(() => {
      if (!Array.isArray(comparisonResult.value) || comparisonResult.value.length === 0) {
        return 'No differences found';
      }
      
      const addedCount = comparisonResult.value.filter(part => part && part.added).length;
      const removedCount = comparisonResult.value.filter(part => part && part.removed).length;
      const unchangedCount = comparisonResult.value.filter(part => part && !part.added && !part.removed).length;
      
      return `${addedCount} additions, ${removedCount} deletions, ${unchangedCount} unchanged parts`;
    });

    // Toggle dark mode
    const toggleDarkMode = () => {
      darkMode.value = !darkMode.value;
    };

    const compareTexts = () => {
      // Reset notification
      notification.value = ''
      
      // Validate that both inputs have content
      if (!text1.value || !text2.value || !text1.value.trim() || !text2.value.trim()) {
        showNotification('Please enter text in both fields', 'error');
        return;
      }
      
      // Use diff library to compare the texts
      try {
        const differences = diffWords(text1.value, text2.value);
        comparisonResult.value = differences;
        
        // Scroll to results
        setTimeout(() => {
          const resultElement = document.querySelector('.comparison-result');
          if (resultElement) {
            resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } catch (error) {
        showNotification('Error comparing texts: ' + (error.message || 'Unknown error'), 'error');
        comparisonResult.value = [];
      }
    }
    
    // Function to show notifications
    const showNotification = (message, type = 'success') => {
      notification.value = message;
      notificationType.value = type;
      setTimeout(() => {
        notification.value = '';
      }, 3000);
    };
    
    // Function to copy comparison result to clipboard
    const copyToClipboard = () => {
      if (!Array.isArray(comparisonResult.value) || comparisonResult.value.length === 0) {
        showNotification('No comparison result to copy', 'error');
        return;
      }
      
      try {
        // Create a string representation of the comparison result
        const resultText = comparisonResult.value
          .map(part => part && part.value ? part.value : '')
          .join('');
        
        // Copy to clipboard
        navigator.clipboard.writeText(resultText)
          .then(() => {
            showNotification('Result copied to clipboard!');
          })
          .catch(err => {
            showNotification('Failed to copy. Please try again.', 'error');
          });
      } catch (error) {
        showNotification('Error copying to clipboard', 'error');
      }
    }
    
    // Function to export diff as HTML
    const exportDiff = () => {
      if (!Array.isArray(comparisonResult.value) || comparisonResult.value.length === 0) {
        showNotification('No comparison result to export', 'error');
        return;
      }
      
      try {
        // Create HTML content with styling
        let htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Text Comparison Result</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .added { background-color: #d1fae5; color: #065f46; padding: 1px 4px; border-radius: 2px; }
              .removed { background-color: #fee2e2; color: #991b1b; padding: 1px 4px; border-radius: 2px; }
              .content { white-space: pre-wrap; font-family: monospace; line-height: 1.6; }
              .header { margin-bottom: 20px; }
              .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Text Comparison Result</h1>
              <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
            <div class="content">`;
        
        // Add each part with appropriate styling
        comparisonResult.value.forEach(part => {
          if (!part || !part.value) return;
          
          if (part.added) {
            htmlContent += `<span class="added">${part.value}</span>`;
          } else if (part.removed) {
            htmlContent += `<span class="removed">${part.value}</span>`;
          } else {
            htmlContent += part.value;
          }
        });
        
        // Close HTML tags
        htmlContent += `
            </div>
            <div class="footer">
              <p>Generated by TextDiff tool</p>
            </div>
          </body>
          </html>
        `;
        
        // Create a Blob and download link
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'text-comparison-result.html';
        a.click();
        
        // Clean up
        URL.revokeObjectURL(url);
        showNotification('Comparison result exported successfully!');
      } catch (error) {
        showNotification('Failed to export: ' + (error.message || 'Unknown error'), 'error');
      }
    };
    
    // Function to clear all inputs and results
    const clearAll = () => {
      text1.value = '';
      text2.value = '';
      comparisonResult.value = [];
    }
    
    // Examples for quick testing
    const loadExamples = () => {
      text1.value = 'This is a sample text. It demonstrates how text comparison works.\nIt has some words that will be changed, removed, or kept the same.\nYou can see additions and deletions highlighted in different colors.';
      text2.value = 'This is a modified sample text. It demonstrates how our advanced text comparison works.\nIt has some new words that have been added.\nYou can see additions and deletions highlighted in different colors with improved visibility.';
    }

    return {
      text1,
      text2,
      comparisonResult,
      notification,
      notificationType,
      darkMode,
      viewMode,
      getDiffStats,
      safeComparisonResult,
      hasComparisonResults,
      textLength,
      partAdded,
      partRemoved,
      toggleDarkMode,
      compareTexts,
      copyToClipboard,
      exportDiff,
      clearAll,
      loadExamples,
      showNotification
    }
  }
})
</script>

<style scoped>
.comparison-result {
  white-space: pre-wrap;
  line-height: 1.6;
  overflow-x: auto;
}

/* Custom scrollbar styling */
.comparison-result::-webkit-scrollbar,
textarea::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.comparison-result::-webkit-scrollbar-track,
textarea::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.comparison-result::-webkit-scrollbar-thumb,
textarea::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 4px;
}

.dark .comparison-result::-webkit-scrollbar-thumb,
.dark textarea::-webkit-scrollbar-thumb {
  background: #475569;
}

.comparison-result::-webkit-scrollbar-thumb:hover,
textarea::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

/* Notification animation */
@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(-20px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-20px); }
}

.notification {
  animation: fadeInOut 3s ease-in-out;
}

/* Text area focus styles */
textarea:focus {
  outline: none;
}

/* Card hover effect */
.card-hover:hover {
  transform: translateY(-2px);
  transition-duration: 200ms;
}
</style>