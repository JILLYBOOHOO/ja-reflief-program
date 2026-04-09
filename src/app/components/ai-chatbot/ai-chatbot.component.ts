import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AiChatService } from '../../services/ai-chat.service';
import { SpeechService } from '../../services/speech.service';
import { AccessibilityService } from '../../services/accessibility.service';
import { filter } from 'rxjs/operators';

interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
}

@Component({
  selector: 'app-ai-chatbot',
  templateUrl: './ai-chatbot.component.html',
  styleUrls: ['./ai-chatbot.component.css']
})
export class AiChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  isOpen = false;
  userInput = '';
  isTalking = false;
  isListening = false;
  isTyping = false;
  hasNewMessage = true;

  // Tour State
  isTourActive = false;
  currentTourStep = 0;
  tourSteps = [
    { target: 'tour-step-1', text: "This is your Virtual ID Card. It stores your relief funds and survivor identity. You can tap it to see your secure CVV code." },
    { target: 'tour-step-2', text: "Your Emergency Medical Profile. First responders can scan the QR code to see your critical health info, including allergies and blood type." },
    { target: 'tour-step-3', text: "Need supplies? Use this section to request specific grocery or hygiene items. They will be logged for distribution teams." },
    { target: 'tour-step-4', text: "The Summary sidebar tracks your active requests in real-time. Make sure to hit 'Submit Request' when you're finished selecting items." }
  ];

  messages: ChatMessage[] = [
    { text: "Hello! I am JA-Z, your AI Relief Assistant. How can I help you today?", sender: 'bot', timestamp: Date.now() }
  ];

  constructor(
    private aiChatService: AiChatService,
    private speechService: SpeechService,
    private accessibilityService: AccessibilityService,
    private router: Router
  ) {}

  ngOnInit() {
    this.speechService.isListening$.subscribe(state => {
      this.isListening = state;
    });

    this.speechService.fieldResult$.subscribe(text => {
      if (this.isOpen && this.isListening) {
        this.userInput = text;
        this.sendMessage();
      }
    });

  }

  startTour() {
    this.isTourActive = true;
    this.currentTourStep = 0;
    this.isOpen = true;
    this.messages = [];
    this.showTourStep();
  }

  nextTourStep() {
    this.currentTourStep++;
    if (this.currentTourStep < this.tourSteps.length) {
      this.showTourStep();
    } else {
      this.finishTour();
    }
  }

  skipTour() {
    this.finishTour();
    this.messages.push({ text: "No problem! You can always ask me for help later. Welcome to your dashboard!", sender: 'bot', timestamp: Date.now() });
    this.speakResponse("Welcome to your dashboard!");
  }

  private finishTour() {
    this.isTourActive = false;
    localStorage.setItem('dashboard_tour_seen', 'true');
    this.currentTourStep = 0;
    // Remove any leftover highlights
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
  }

  private showTourStep() {
    const step = this.tourSteps[this.currentTourStep];
    this.messages.push({ text: step.text, sender: 'bot', timestamp: Date.now() });
    this.speakResponse(step.text);

    // Highlight the target element
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
    const el = document.getElementById(step.target);
    if (el) {
      el.classList.add('tour-highlight');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleOpen() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.hasNewMessage = false;
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  async sendMessage() {
    if (!this.userInput.trim()) return;

    const userText = this.userInput;
    this.messages.push({ text: userText, sender: 'user', timestamp: Date.now() });
    this.userInput = '';
    this.isTyping = true;

    // Get bot response
    const botResponse = await this.aiChatService.getResponse(userText);
    
    setTimeout(() => {
      this.isTyping = false;
      this.messages.push({ text: botResponse, sender: 'bot', timestamp: Date.now() });
      this.speakResponse(botResponse);
    }, 1000);
  }

  startVoiceChat() {
    this.speechService.startFieldInput();
  }

  private speakResponse(text: string) {
    if (!this.accessibilityService.isAudioEnabled) return;

    this.isTalking = true;
    this.speechService.speak(text);
    const duration = Math.max(2000, text.length * 80);
    setTimeout(() => {
      this.isTalking = false;
    }, duration);
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }
}
