import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { SpeechService } from '../../services/speech.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isDarkMode = false;
  isListening = false;
  get currentUser(): User | null {
    // Zero-Dependency Bridge: Read directly from local storage
    const saved = localStorage.getItem('survivor_user');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        // Robust name detection for Katie
        if (user.email?.toLowerCase().includes('katie') || (user.identifier && user.identifier.toLowerCase().includes('katie'))) {
           user.name = user.name || 'Katie';
        }
        return user;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  constructor(
    public authService: AuthService,
    public speechService: SpeechService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.body.classList.add('dark-theme');
    }

    this.speechService.isListening$.subscribe(state => {
      this.isListening = state;
      this.cdr.detectChanges();
    });

    // Subscribing just for Change Detection trigger
    this.authService.currentUser$.subscribe(() => {
      this.cdr.detectChanges();
    });

    // High-Frequency Sync Heartbeat (Force refresh logout button)
    setInterval(() => {
       this.cdr.detectChanges();
       this.cdr.markForCheck();
    }, 1000);
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    const modeText = this.isDarkMode ? 'Dark mode enabled' : 'Light mode enabled';
    this.speechService.speak(modeText);

    if (this.isDarkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }

  toggleVoice(): void {
    this.speechService.toggleListening('Typing');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

