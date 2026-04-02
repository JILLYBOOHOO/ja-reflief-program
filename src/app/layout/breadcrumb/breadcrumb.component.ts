import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd, Event } from '@angular/router';
import { filter, distinctUntilChanged } from 'rxjs/operators';

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

  constructor(private router: Router, private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    this.router.events.pipe(
      filter((event: Event) => event instanceof NavigationEnd),
      distinctUntilChanged()
    ).subscribe(() => {
      this.breadcrumbs = this.buildBreadcrumbs(this.activatedRoute.root);
    });
    
    // Initial build
    this.breadcrumbs = this.buildBreadcrumbs(this.activatedRoute.root);
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
      if (label) {
        breadcrumbs.push({ label, url });
      }

      return this.buildBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }
}
