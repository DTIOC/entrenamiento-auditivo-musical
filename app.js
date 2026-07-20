// Music Theory App - Pentatonic & Blues Scales
// Using Tone.js for audio synthesis

class MusicTrainingApp {
    constructor() {
        this.synth = null;
        this.keyboard = document.getElementById('keyboard');
        this.currentMelody = [];
        this.userMelody = [];
        this.scaleType = '';
        this.scaleNotes = [];
        this.isRecording = false;
        
        // Google Apps Script Webhook URL CONFIGURADA
        this.webhookURL = 'https://script.google.com/macros/s/AKfycbz4dyyFtNkyHYmkSokJDSx5pmucX2sGqaiRTZxEN4BUzOebSJUDYFVK66DxypNq81Ap/exec';
        
        this.init();
    }
    
    init() {
        this.createKeyboard();
        this.setupEventListeners();
        this.generateNewMelody();
    }
    
    async initAudio() {
        if (!this.synth) {
            await Tone.start();
            this.synth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "triangle" },
                envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 }
            }).toDestination();
            
            const reverb = new Tone.Reverb({ decay: 2, wet: 0.3 }).toDestination();
            this.synth.connect(reverb);
        }
    }
    
    createKeyboard() {
        const notes = [
            { note: 'C4', type: 'white', position: 0 },
            { note: 'C#4', type: 'black', position: 0 },
            { note: 'D4', type: 'white', position: 1 },
            { note: 'D#4', type: 'black', position: 1 },
            { note: 'E4', type: 'white', position: 2 },
            { note: 'F4', type: 'white', position: 3 },
            { note: 'F#4', type: 'black', position: 3 },
            { note: 'G4', type: 'white', position: 4 },
            { note: 'G#4', type: 'black', position: 4 },
            { note: 'A4', type: 'white', position: 5 },
            { note: 'A#4', type: 'black', position: 5 },
            { note: 'B4', type: 'white', position: 6 }
        ];
        
        notes.forEach(noteData => {
            const key = document.createElement('div');
            key.className = `key ${noteData.type}`;
            key.dataset.note = noteData.note;
            
            if (noteData.type === 'black') {
                const offset = 35 + (noteData.position * 50) - 15;
                key.style.left = `${offset}px`;
            }
            
            key.addEventListener('mousedown', () => this.handleKeyPress(noteData.note, key));
            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleKeyPress(noteData.note, key);
            });
            
            this.keyboard.appendChild(key);
        });
    }
    
    setupEventListeners() {
        document.getElementById('btnPlay').addEventListener('click', () => this.playMelody());
        document.getElementById('btnGenerate').addEventListener('click', () => this.generateNewMelody());
        document.getElementById('btnCheck').addEventListener('click', () => this.checkMelody());
        document.getElementById('btnClear').addEventListener('click', () => this.clearUserMelody());
        document.getElementById('btnSaveResult').addEventListener('click', () => this.saveToGoogleSheets());
    }
    
    generateNewMelody() {
        const scales = [
            { name: 'Pentatónica Mayor de Do', notes: ['C4', 'D4', 'E4', 'G4', 'A4'] },
            { name: 'Pentatónica Menor de La', notes: ['A4', 'C4', 'D4', 'E4', 'G4'] },
            { name: 'Blues de Do', notes: ['C4', 'D#4', 'F4', 'G4', 'G#4', 'A#4'] },
            { name: 'Blues de La', notes: ['A4', 'C4', 'D4', 'D#4', 'E4', 'G4'] }
        ];
        
        const selectedScale = scales[Math.floor(Math.random() * scales.length)];
        this.scaleType = selectedScale.name;
        this.scaleNotes = selectedScale.notes;
        
        const melodyLength = Math.floor(Math.random() * 4) + 4;
        this.currentMelody = [];
        
        for (let i = 0; i < melodyLength; i++) {
            const randomNote = this.scaleNotes[Math.floor(Math.random() * this.scaleNotes.length)];
            this.currentMelody.push(randomNote);
        }
        
        document.getElementById('scaleType').textContent = this.scaleType;
        document.getElementById('noteCount').textContent = this.currentMelody.length;
        document.getElementById('feedback').textContent = 'Presiona "Escuchar Melodía" para comenzar';
        document.getElementById('scoreDisplay').style.display = 'none';
        
        this.userMelody = [];
        this.clearKeyboardHighlights();
    }
    
    async playMelody() {
        await this.initAudio();
        const feedback = document.getElementById('feedback');
        feedback.textContent = '🎵 Escuchando melodía...';
        feedback.style.color = '#00d9a5';
        
        const now = Tone.now();
        this.currentMelody.forEach((note, index) => {
            this.synth.triggerAttackRelease(note, '8n', now + (index * 0.5));
        });
        
        setTimeout(() => {
            feedback.textContent = '✅ Ahora repite la melodía en el teclado';
            feedback.style.color = '#fff';
        }, this.currentMelody.length * 500 + 500);
    }
    
    handleKeyPress(note, keyElement) {
        this.initAudio();
        this.synth.triggerAttackRelease(note, '8n');
        keyElement.classList.add('active');
        setTimeout(() => keyElement.classList.remove('active'), 200);
        this.userMelody.push(note);
        this.updateFeedback();
    }
    
    updateFeedback() {
        const feedback = document.getElementById('feedback');
        feedback.textContent = `Notas tocadas: ${this.userMelody.join(' - ')}`;
    }
    
    clearUserMelody() {
        this.userMelody = [];
        this.updateFeedback();
        this.clearKeyboardHighlights();
        document.getElementById('scoreDisplay').style.display = 'none';
    }
    
    clearKeyboardHighlights() {
        document.querySelectorAll('.key').forEach(key => {
            key.classList.remove('correct', 'incorrect');
        });
    }
    
    checkMelody() {
        if (this.userMelody.length === 0) {
            document.getElementById('feedback').textContent = '⚠️ Primero toca algunas notas en el teclado';
            return;
        }
        const score = this.calculateScore();
        this.showResults(score);
        this.highlightKeys();
    }
    
    calculateScore() {
        let correctNotes = 0;
        const minLength = Math.min(this.currentMelody.length, this.userMelody.length);
        for (let i = 0; i < minLength; i++) {
            if (this.currentMelody[i] === this.userMelody[i]) correctNotes++;
        }
        const maxNotes = Math.max(this.currentMelody.length, this.userMelody.length);
        const percentage = Math.round((correctNotes / maxNotes) * 100);
        return { percentage, correctNotes, totalNotes: this.currentMelody.length, userNotes: this.userMelody.length };
    }
    
    showResults(score) {
        const scoreDisplay = document.getElementById('scoreDisplay');
        const scoreValue = document.getElementById('scoreValue');
        const feedbackText = document.getElementById('feedbackText');
        
        scoreDisplay.style.display = 'block';
        scoreValue.textContent = score.percentage;
        
        if (score.percentage === 100) feedbackText.textContent = '🌟 ¡Perfecto! ¡Excelente oído musical!';
        else if (score.percentage >= 80) feedbackText.textContent = '👏 ¡Muy bien! Casi perfecto';
        else if (score.percentage >= 60) feedbackText.textContent = '👍 Bien, sigue practicando';
        else if (score.percentage >= 40) feedbackText.textContent = '💪 Vas por buen camino, continúa';
        else feedbackText.textContent = '📚 Sigue practicando, ¡tú puedes!';
        
        document.getElementById('feedback').innerHTML = `Notas correctas: ${score.correctNotes}/${score.totalNotes}<br>Notas tocadas: ${score.userNotes}`;
    }
    
    highlightKeys() {
        this.clearKeyboardHighlights();
        this.userMelody.forEach((note, index) => {
            const keyElement = document.querySelector(`[data-note="${note}"]`);
            if (keyElement) {
                if (this.currentMelody[index] === note) keyElement.classList.add('correct');
                else keyElement.classList.add('incorrect');
            }
        });
    }
    
    async saveToGoogleSheets() {
        const email = document.getElementById('studentEmail').value;
        const name = document.getElementById('studentName').value;
        const group = document.getElementById('studentGroup').value;
        
        if (!this.webhookURL) {
            alert('⚠️ El webhook no está configurado.');
            return;
        }
        
        const score = this.calculateScore();
        const data = {
            timestamp: new Date().toISOString(),
            email: email || 'No especificado',
            name: name || 'No especificado',
            group: group || 'No especificado',
            scaleType: this.scaleType,
            melodyLength: this.currentMelody.length,
            score: score.percentage,
            correctNotes: score.correctNotes,
            totalNotes: score.totalNotes,
            userMelody: this.userMelody.join('-'),
            correctMelody: this.currentMelody.join('-')
        };
        
        try {
            await fetch(this.webhookURL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            alert('✅ Resultado guardado correctamente');
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error al guardar. Intenta de nuevo.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new MusicTrainingApp();
});
