import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SpeechService } from '../../services/speech.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isDarkMode = false;
  isListening = false;

  constructor(
    public authService: AuthService,
    public speechService: SpeechService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.body.classList.add('dark-theme');
    }

    this.speechService.isListening$.subscribe(state => {
      this.isListening = state;
    });
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
    this.speechService.toggleListening();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

