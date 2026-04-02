



import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';

import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { HomeComponent } from './pages/home/home.component';
import { SurvivorEntryComponent } from './pages/survivor-entry/survivor-entry.component';
import { DonateComponent } from './pages/donate/donate.component';
import { WifiAccessComponent } from './pages/wifi-access/wifi-access.component';
import { HelpComponent } from './pages/help/help.component';
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { InfoComponent } from './pages/info/info.component';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard.component';
import { SitemapComponent } from './pages/sitemap/sitemap.component';
import { BreadcrumbComponent } from './layout/breadcrumb/breadcrumb.component';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { JwtInterceptor } from './interceptors/jwt.interceptor';
import { PrivacyComponent } from './pages/privacy/privacy.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    HomeComponent,
    SurvivorEntryComponent,
    DonateComponent,
    WifiAccessComponent,
    HelpComponent,
    RegisterComponent,
    LoginComponent,
    DashboardComponent,
    InfoComponent,
    AdminDashboardComponent,
    SitemapComponent,
    BreadcrumbComponent,
    PrivacyComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,           // ✅ Added for [(ngModel)]
    ReactiveFormsModule,   // ✅ MUST BE HERE
    HttpClientModule,
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

