import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'ja-relief';
  showCookieBanner = true;
  isDashboard = false;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects;
      this.isDashboard = url.includes('/dashboard');
    });
  }

  ngOnInit() {
    const consent = localStorage.getItem('cookieConsent');
    if (consent === 'true') {
      this.showCookieBanner = false;
    }
  }

  acceptCookies() {
    localStorage.setItem('cookieConsent', 'true');
    this.showCookieBanner = false;
  }
}
