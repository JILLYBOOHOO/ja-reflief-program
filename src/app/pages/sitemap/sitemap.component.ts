import { Component } from '@angular/core';

@Component({
  selector: 'app-sitemap',
  templateUrl: './sitemap.component.html',
  styleUrls: ['./sitemap.component.css']
})
export class SitemapComponent {
  links = [
    { name: 'Home', path: '/', description: 'JA Relief main page' },
    { name: 'Donate', path: '/donate', description: 'Support disaster relief efforts' },
    { name: 'Request Aid', path: '/help', description: 'Apply for assistance' },
    { name: 'Wifi Access', path: '/wifi-access', description: 'Get emergency internet vouchers' },
    { name: 'Register', path: '/register', description: 'Create a new account' },
    { name: 'Login', path: '/login', description: 'Access your survivor dashboard' },
    { name: 'General Information', path: '/info', description: 'Frequently asked questions' }
  ];
}
