import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SpeechService {
    private recognition: any;
    private isListeningSource = new Subject<boolean>();
    isListening$ = this.isListeningSource.asObservable();

    constructor(private router: Router, private zone: NgZone) {
        const { webkitSpeechRecognition }: any = window;
        if (webkitSpeechRecognition) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event: any) => {
                const lastResult = event.results[event.results.length - 1];
                if (lastResult.isFinal) {
                    const command = lastResult[0].transcript.toLowerCase().trim();
                    console.log('Voice command received:', command);
                    this.handleCommand(command);
                }
            };

            this.recognition.onend = () => {
                this.isListeningSource.next(false);
            };
        }
    }

    private getNaturalVoice(): SpeechSynthesisVoice | null {
        const voices = window.speechSynthesis.getVoices();
        // Look for "Google" or "Premium" or just specific English variants
        return voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
            voices.find(v => v.name.includes('Natural') && v.lang.startsWith('en')) ||
            voices.find(v => v.lang.startsWith('en')) ||
            voices[0] || null;
    }

    speak(text: string): void {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Clear any pending speech
            const utterance = new SpeechSynthesisUtterance(text);
            const voice = this.getNaturalVoice();
            if (voice) utterance.voice = voice;
            utterance.rate = 1;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
        }
    }

    toggleListening(): void {
        if (!this.recognition) return;

        if (this.isListeningSource.observed && (this.recognition as any).started) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    private startListening(): void {
        try {
            this.recognition.start();
            this.isListeningSource.next(true);
            this.speak('Voice navigation enabled.');
        } catch (e) {
            console.error('Speech recognition error:', e);
        }
    }

    private stopListening(): void {
        if (this.recognition) {
            this.recognition.abort(); // Instant stop
        }
        window.speechSynthesis.cancel(); // Instant silence
        this.isListeningSource.next(false);
        this.speak('Voice navigation disabled.');
    }

    private handleCommand(command: string): void {
        this.zone.run(() => {
            if (command.includes('home')) {
                this.router.navigate(['/']);
                this.speak('Navigating home');
            } else if (command.includes('wifi') || command.includes('voucher')) {
                this.router.navigate(['/wifi-access']);
                this.speak('Opening WiFi access');
            } else if (command.includes('donate')) {
                this.router.navigate(['/donate']);
                this.speak('Opening donation page');
            } else if (command.includes('login')) {
                this.router.navigate(['/login']);
                this.speak('Opening login page');
            } else if (command.includes('register')) {
                this.router.navigate(['/register']);
                this.speak('Opening registration');
            } else if (command.includes('help') || command.includes('info')) {
                this.router.navigate(['/info-page']);
                this.speak('Opening information page');
            }
        });
    }
}
