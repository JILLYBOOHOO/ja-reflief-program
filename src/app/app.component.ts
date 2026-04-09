import { Component, OnInit, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AccessibilityService, FontSize } from './services/accessibility.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  isOnline: boolean = true;
  showCookieBanner = true;
  isDashboard = false;
  currentFontSize: FontSize = 'normal';
  showBackToTop = false;

  constructor(private router: Router, private accessibilityService: AccessibilityService) {
    this.isOnline = navigator.onLine;

    window.addEventListener('online', () => this.isOnline = true);
    window.addEventListener('offline', () => this.isOnline = false);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects;
      this.isDashboard = url.includes('/dashboard');
      window.scrollTo(0, 0); // Scroll to top on navigation
    });

    this.accessibilityService.fontSize$.subscribe(size => {
      this.currentFontSize = size;
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showBackToTop = window.pageYOffset > 400;
  }

  ngOnInit() {
    const consent = localStorage.getItem('cookieConsent');
    if (consent === 'true') {
      this.showCookieBanner = false;
    }
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  acceptCookies() {
    localStorage.setItem('cookieConsent', 'true');
    this.showCookieBanner = false;
  }
}
