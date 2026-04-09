import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd, Event } from '@angular/router';
import { filter, distinctUntilChanged } from 'rxjs/operators';
import { AccessibilityService, FontSize } from '../../services/accessibility.service';
import { SpeechService } from '../../services/speech.service';

export interface Breadcrumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.css']
})
export class BreadcrumbComponent implements OnInit {
  public breadcrumbs: Breadcrumb[] = [];
  currentSize: FontSize = 'normal';

  constructor(
    private router: Router, 
    private activatedRoute: ActivatedRoute,
    public accessibilityService: AccessibilityService,
    public speechService: SpeechService
  ) { }

  ngOnInit() {
    this.router.events.pipe(
      filter((event: Event) => event instanceof NavigationEnd),
      distinctUntilChanged()
    ).subscribe(() => {
      this.breadcrumbs = this.buildBreadcrumbs(this.activatedRoute.root);
    });
    
    // Initial build
    this.breadcrumbs = this.buildBreadcrumbs(this.activatedRoute.root);

    this.accessibilityService.fontSize$.subscribe(size => {
      this.currentSize = size;
    });
  }

  setSize(size: FontSize) {
    this.accessibilityService.setFontSize(size);
    const label = size === 'normal' ? 'Normal' : size === 'large' ? 'Large' : 'Huge';
    if (this.accessibilityService.isAudioEnabled) {
      this.speechService.speak('Font size set to ' + label);
    }
  }

  toggleAudio() {
    const isEnabled = this.accessibilityService.toggleAudio();
    if (isEnabled) {
        this.speechService.speak('Voice guide enabled.');
    } else {
        this.speechService.speak('Voice guide disabled.');
    }
  }

  toggleVoice() {
    this.speechService.toggleListening();
  }

  buildBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: Breadcrumb[] = []): Breadcrumb[] {
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      const label = child.snapshot.data['breadcrumb'];
      if (label && (!breadcrumbs.length || breadcrumbs[breadcrumbs.length - 1].label !== label)) {
        breadcrumbs.push({ label, url });
      }

      return this.buildBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }
}
