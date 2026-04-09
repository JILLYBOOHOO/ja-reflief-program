import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SpeechService {
    private recognition: any;
    private isListeningSource = new BehaviorSubject<boolean>(false);
    isListening$ = this.isListeningSource.asObservable();
    private isReadingSource = new BehaviorSubject<boolean>(false);
    isReading$ = this.isReadingSource.asObservable();
    private lastProcessedIndex = -1;

    constructor(private router: Router, private zone: NgZone) {
        const { webkitSpeechRecognition }: any = window;
        if (webkitSpeechRecognition) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event: any) => {
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal && i > this.lastProcessedIndex) {
                        this.lastProcessedIndex = i;
                        const command = event.results[i][0].transcript.toLowerCase().trim();
                        console.log('Voice command received:', command);
                        this.handleCommand(command);
                    }
                }
            };

            this.recognition.onstart = () => {
                this.zone.run(() => this.isListeningSource.next(true));
                (this.recognition as any).started = true;
            };

            this.recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    this.speak('Microphone access denied. Please allow microphone permissions in your browser.');
                }
                this.zone.run(() => this.isListeningSource.next(false));
                (this.recognition as any).started = false;
            };

            this.recognition.onend = () => {
                this.zone.run(() => this.isListeningSource.next(false));
                (this.recognition as any).started = false;
            };
        }

        // Pre-load and lock in the best female voice
        if ('speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = () => {
                this.getNaturalVoice(); // Trigger caching
            };
            this.getNaturalVoice();
        }
    }

    private cachedVoice: SpeechSynthesisVoice | null = null;

    private getNaturalVoice(): SpeechSynthesisVoice | null {
        if (this.cachedVoice) return this.cachedVoice;
        
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) return null;

        // Strict priority for professional female voices
        const femaleVoice = 
            // 1. Google/Online Premium Female voices
            voices.find(v => v.name.toLowerCase().includes('female') && (v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Google'))) ||
            // 2. Well-known Female Voice names
            voices.find(v => (v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Susan') || v.name.includes('Victoria') || v.name.includes('Hazel') || v.name.includes('Catherine')) && v.lang.includes('en')) ||
            // 3. Any standard Female voice
            voices.find(v => v.name.toLowerCase().includes('female') && v.lang.includes('en')) ||
            // 4. Fallback to any English voice (risky but better than nothing)
            voices.find(v => v.lang.startsWith('en')) ||
            voices[0];
            
        this.cachedVoice = femaleVoice;
        return femaleVoice;
    }

    speak(text: string): void {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Clear any pending speech
            const utterance = new SpeechSynthesisUtterance(text);
            const voice = this.getNaturalVoice();
            if (voice) utterance.voice = voice;
            
            // Refined feminine pitch and rate for consistency
            utterance.rate = 1.0; 
            utterance.pitch = 1.1; // Slightly higher pitch for clarity/femininity
            utterance.volume = 1;
            
            window.speechSynthesis.speak(utterance);
        }
    }

    toggleListening(feedback: string = 'Listening'): void {
        if (!this.recognition) return;

        if (this.isListeningSource.observed && (this.recognition as any).started) {
            this.stopListening();
        } else {
            this.startListening(feedback);
        }
    }

    private fieldResultSource = new Subject<string>();
    fieldResult$ = this.fieldResultSource.asObservable();

    private isFieldInputMode = false;

    startFieldInput(): void {
        if (!this.recognition) return;
        this.isFieldInputMode = true;
        this.startListening();
    }

    stopFieldInput(): void {
        this.isFieldInputMode = false;
        this.stopListening();
    }

    private startListening(feedback: string = 'Listening'): void {
        try {
            if ((this.recognition as any).started) return;
            this.lastProcessedIndex = -1; // Reset to prevent processing old results
            this.recognition.start();
            if (!this.isFieldInputMode) this.speak(feedback);
        } catch (e) {
            console.error('Speech recognition error:', e);
        }
    }

    private stopListening(): void {
        if (this.recognition) {
            this.recognition.abort();
        }
        if (!this.isFieldInputMode) window.speechSynthesis.cancel();
        if (!this.isFieldInputMode) this.speak('Stopped');
    }

    private handleCommand(command: string): void {
        const input = command.toLowerCase();
        console.log('Voice engine identifying command:', input);

        if (this.isFieldInputMode) {
            this.zone.run(() => {
                this.fieldResultSource.next(input);
                this.stopFieldInput();
            });
            return;
        }

        this.zone.run(() => {
            // Enhanced keyword matching with Jamaican accent/phonetic support
            if (input.includes('home') || input.includes('om')) {
                this.router.navigate(['/']);
                this.speak('Navigating home');
            } else if (input.includes('get wifi') || input.includes('wifi access') || input.includes('wifi') || input.includes('eifi') || input.includes('waifai')) {
                this.router.navigate(['/wifi-access']);
                this.speak('Opening WiFi access');
            } else if (input.includes('donate items') || input.includes('donate item') || input.includes('donate itme') || input.includes('donte item') || input.includes('donation items')) {
                this.router.navigate(['/donate'], { queryParams: { type: 'in-kind' } });
                this.speak('Opening Donate Items portal');
            } else if (input.includes('monetary') || input.includes('donate') || input.includes('donte')) {
                this.router.navigate(['/donate']);
                this.speak('Opening Monetary Donations portal');
            } else if (input.includes('login') || input.includes('log in') || input.includes('lagin')) {
                this.router.navigate(['/login']);
                this.speak('Opening login page');
            } else if (input.includes('dashboard') || input.includes('dash board') || input.includes('dashbaad')) {
                this.router.navigate(['/dashboard']);
                this.speak('Opening dashboard');
            } else if (input.includes('admin') || input.includes('portal') || input.includes('command center')) {
                this.router.navigate(['/admin']);
                this.speak('Opening admin portal');
            } else if (input.includes('register') || input.includes('regista')) {
                this.router.navigate(['/register']);
                this.speak('Opening registration');
            } else if (input.includes('help') || input.includes('halp') || input.includes('request aid') || input.includes('aid')) {
                this.router.navigate(['/help']);
                this.speak('Opening aid request page');
            } else if (input.includes('emergency') || input.includes('information') || input.includes('info')) {
                this.router.navigate(['/information']);
                this.speak('Opening emergency information');
            } else if (input.includes('privacy')) {
                this.router.navigate(['/privacy']);
                this.speak('Opening privacy statement');
            } else if (input.includes('sitemap')) {
                this.router.navigate(['/sitemap']);
                this.speak('Opening site map');
            } else if (input.includes('scroll down') || input.includes('go down')) {
                window.scrollBy({ top: 500, behavior: 'smooth' });
                this.speak('Scrolling down');
            } else if (input.includes('scroll up') || input.includes('go up')) {
                window.scrollBy({ top: -500, behavior: 'smooth' });
                this.speak('Scrolling up');
            } else if (input.includes('submit') || input.includes('confirm') || input.includes('done')) {
                const submitBtn = document.querySelector('button[type="submit"], .submit-btn, .signature-gradient') as HTMLElement;
                if (submitBtn) {
                    submitBtn.click();
                    this.speak('Submitting form');
                }
            } else if (input.includes('back') || input.includes('go back')) {
                window.history.back();
                this.speak('Going back');
            } else {
                console.log('No command matched for:', input);
                this.speak('Sorry, I did not recognize that command. Please try home, donate, or help.');
            }
        });
    }

    toggleReadPage(): void {
        if (this.isReadingSource.value) {
            window.speechSynthesis.cancel();
            this.isReadingSource.next(false);
            this.speak('Stopped reading');
        } else {
            const mainContent = document.getElementById('main') || document.body;
            const text = (mainContent.innerText || mainContent.textContent || '').substring(0, 15000); // safety cap
            if (text) {
                this.isReadingSource.next(true);
                this.speak('Reading. ');
                
                const utterance = new SpeechSynthesisUtterance(text);
                const voice = this.getNaturalVoice();
                if (voice) utterance.voice = voice;
                utterance.rate = 1.0; utterance.pitch = 1.1;
                utterance.onend = () => this.zone.run(() => this.isReadingSource.next(false));
                utterance.onerror = () => this.zone.run(() => this.isReadingSource.next(false));
                window.speechSynthesis.speak(utterance);
            }
        }
    }
}
