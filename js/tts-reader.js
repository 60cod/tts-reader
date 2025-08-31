/**
 * Text to Speech Reader Class
 * Handles multiple text inputs with speech synthesis functionality
 */
class TTSReader {
    constructor() {
        this.textInputCount = 0;
        this.isRepeating = false;
        this.currentUtterance = null;
        this.voices = [];
        this.selectedVoice = null;
        
        this.initializeElements();
        this.loadVoices();
        this.addTextInput(); // Add first text input
    }

    /**
     * Initialize DOM elements and event listeners
     */
    initializeElements() {
        this.textInputsContainer = document.getElementById('textInputs');
        this.addTextBtn = document.getElementById('addTextBtn');
        this.playAllBtn = document.getElementById('playAllBtn');
        this.repeatAllBtn = document.getElementById('repeatAllBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.voiceSelect = document.getElementById('voiceSelect');
        this.rateSlider = document.getElementById('rateSlider');
        this.pitchSlider = document.getElementById('pitchSlider');
        this.rateValue = document.getElementById('rateValue');
        this.pitchValue = document.getElementById('pitchValue');
        this.status = document.getElementById('status');

        // Event listeners
        this.addTextBtn.addEventListener('click', () => this.addTextInput());
        this.playAllBtn.addEventListener('click', () => this.readAllTexts());
        this.repeatAllBtn.addEventListener('click', () => this.repeatAllTexts());
        this.stopBtn.addEventListener('click', () => this.stopReading());
        this.voiceSelect.addEventListener('change', (e) => this.selectVoice(e.target.value));
        this.rateSlider.addEventListener('input', (e) => {
            this.rateValue.textContent = e.target.value;
        });
        this.pitchSlider.addEventListener('input', (e) => {
            this.pitchValue.textContent = e.target.value;
        });

        // Load voices when available
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
    }

    /**
     * Load available voices from speech synthesis
     */
    loadVoices() {
        this.voices = speechSynthesis.getVoices();
        this.populateVoiceSelect();
        this.selectDefaultVoice();
    }

    /**
     * Populate voice selection dropdown
     */
    populateVoiceSelect() {
        this.voiceSelect.innerHTML = '';
        this.voices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            this.voiceSelect.appendChild(option);
        });
    }

    /**
     * Select default US English voice
     */
    selectDefaultVoice() {
        // Try to find Google US English voice first
        const googleUsEnglishVoice = this.voices.find(voice => 
            voice.name.toLowerCase().includes('google') && 
            (voice.lang === 'en-US' || voice.lang.startsWith('en-US'))
        );
        
        if (googleUsEnglishVoice) {
            const index = this.voices.indexOf(googleUsEnglishVoice);
            this.voiceSelect.value = index;
            this.selectedVoice = googleUsEnglishVoice;
            return;
        }
        
        // Fallback to any US English voice
        const usEnglishVoice = this.voices.find(voice => 
            voice.lang === 'en-US' || voice.lang.startsWith('en-US')
        );
        
        if (usEnglishVoice) {
            const index = this.voices.indexOf(usEnglishVoice);
            this.voiceSelect.value = index;
            this.selectedVoice = usEnglishVoice;
        } else if (this.voices.length > 0) {
            this.voiceSelect.value = 0;
            this.selectedVoice = this.voices[0];
        }
    }

    /**
     * Select voice by index
     * @param {string} index - Voice index
     */
    selectVoice(index) {
        if (index !== '' && this.voices[index]) {
            this.selectedVoice = this.voices[index];
        }
    }

    /**
     * Add new text input field
     */
    addTextInput() {
        this.textInputCount++;
        const inputContainer = document.createElement('div');
        inputContainer.className = 'flex gap-2 items-start text-input-container';
        inputContainer.id = `textContainer${this.textInputCount}`;

        inputContainer.innerHTML = `
            <div class="flex-1">
                <textarea 
                    id="textInput${this.textInputCount}" 
                    placeholder="Enter text to read aloud..." 
                    class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical min-h-[100px] focus-ring"
                ></textarea>
            </div>
            <div class="flex flex-col gap-2 control-buttons">
                <button 
                    onclick="ttsReader.readText(${this.textInputCount})" 
                    class="btn-green font-medium py-2 px-3 rounded-lg transition-colors duration-200 flex items-center gap-1 text-sm button-primary"
                >
                    ${this.getSvgIcon('play')}
                    Read
                </button>
                <button 
                    onclick="ttsReader.repeatText(${this.textInputCount})" 
                    class="btn-purple font-medium py-2 px-3 rounded-lg transition-colors duration-200 flex items-center gap-1 text-sm button-primary"
                >
                    ${this.getSvgIcon('repeat')}
                    Repeat
                </button>
                ${this.textInputCount > 1 ? `
                    <button 
                        onclick="ttsReader.removeTextInput(${this.textInputCount})" 
                        class="btn-red font-medium py-2 px-3 rounded-lg transition-colors duration-200 flex items-center gap-1 text-sm button-primary"
                    >
                        ${this.getSvgIcon('delete')}
                        Remove
                    </button>
                ` : ''}
            </div>
        `;

        this.textInputsContainer.appendChild(inputContainer);
    }

    /**
     * Remove text input by ID
     * @param {number} id - Text input ID
     */
    removeTextInput(id) {
        const container = document.getElementById(`textContainer${id}`);
        if (container) {
            container.remove();
        }
    }

    /**
     * Read text from specific input
     * @param {number} id - Text input ID
     */
    readText(id) {
        const textInput = document.getElementById(`textInput${id}`);
        const text = textInput.value.trim();
        
        if (!text) {
            this.showStatus('Please enter some text to read', 'error');
            return;
        }

        this.speak(text);
    }

    /**
     * Repeat text from specific input
     * @param {number} id - Text input ID
     */
    repeatText(id) {
        const textInput = document.getElementById(`textInput${id}`);
        const text = textInput.value.trim();
        
        if (!text) {
            this.showStatus('Please enter some text to read', 'error');
            return;
        }

        this.isRepeating = true;
        this.speak(text, true);
    }

    /**
     * Read all text inputs
     */
    readAllTexts() {
        const allTexts = this.getAllTexts();
        if (allTexts.length === 0) {
            this.showStatus('Please enter some text to read', 'error');
            return;
        }

        const combinedText = allTexts.join('. ');
        this.speak(combinedText);
    }

    /**
     * Repeat all text inputs
     */
    repeatAllTexts() {
        const allTexts = this.getAllTexts();
        if (allTexts.length === 0) {
            this.showStatus('Please enter some text to read', 'error');
            return;
        }

        const combinedText = allTexts.join('. ');
        this.isRepeating = true;
        this.speak(combinedText, true);
    }

    /**
     * Get all non-empty text inputs
     * @returns {Array<string>} Array of text content
     */
    getAllTexts() {
        const texts = [];
        for (let i = 1; i <= this.textInputCount; i++) {
            const textInput = document.getElementById(`textInput${i}`);
            if (textInput && textInput.value.trim()) {
                texts.push(textInput.value.trim());
            }
        }
        return texts;
    }

    /**
     * Speak text using Speech Synthesis API
     * @param {string} text - Text to speak
     * @param {boolean} repeat - Whether to repeat continuously
     */
    speak(text, repeat = false) {
        // Stop any current speech
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set voice settings
        if (this.selectedVoice) {
            utterance.voice = this.selectedVoice;
        }
        utterance.rate = parseFloat(this.rateSlider.value);
        utterance.pitch = parseFloat(this.pitchSlider.value);

        // Event handlers
        utterance.onstart = () => {
            this.showStatus('Speaking...', 'info');
            this.currentUtterance = utterance;
        };

        utterance.onend = () => {
            this.showStatus('Finished speaking', 'success');
            this.currentUtterance = null;
            
            if (repeat && this.isRepeating) {
                setTimeout(() => {
                    if (this.isRepeating) {
                        this.speak(text, true);
                    }
                }, 500);
            } else {
                this.isRepeating = false;
            }
        };

        utterance.onerror = (event) => {
            this.showStatus(`Error: ${event.error}`, 'error');
            this.currentUtterance = null;
            this.isRepeating = false;
        };

        speechSynthesis.speak(utterance);
    }

    /**
     * Stop current speech
     */
    stopReading() {
        this.isRepeating = false;
        speechSynthesis.cancel();
        this.currentUtterance = null;
        this.showStatus('Stopped', 'info');
    }

    /**
     * Show status message
     * @param {string} message - Status message
     * @param {string} type - Message type (info, error, success)
     */
    showStatus(message, type = 'info') {
        const statusColors = {
            error: 'text-red-600',
            success: 'text-green-600',
            info: 'text-blue-600'
        };

        this.status.className = `mt-4 text-center status-message ${statusColors[type] || statusColors.info}`;
        this.status.textContent = message;
        this.status.classList.remove('hidden');
        
        setTimeout(() => {
            this.status.classList.add('hidden');
        }, 3000);
    }

    /**
     * Get SVG icon by name
     * @param {string} name - Icon name
     * @returns {string} SVG HTML
     */
    getSvgIcon(name) {
        const icons = {
            play: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M8.5 21V3l7 7-7 7z"></path></svg>',
            repeat: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>',
            delete: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>',
            plus: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>',
            speaker: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2.5 2.5 0 110 5H9V10z"></path></svg>',
            stop: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10h6v4H9z"></path></svg>'
        };
        
        return icons[name] || icons.play;
    }
}

// Initialize the TTS Reader when page loads
let ttsReader;
window.addEventListener('DOMContentLoaded', () => {
    // Check for speech synthesis support
    if (!('speechSynthesis' in window)) {
        alert('Your browser does not support text-to-speech functionality.');
        return;
    }
    
    ttsReader = new TTSReader();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TTSReader;
}