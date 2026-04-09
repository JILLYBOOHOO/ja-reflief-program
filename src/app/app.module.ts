
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgOptimizedImage } from '@angular/common';

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SocialLoginModule, GoogleSigninButtonModule, SocialAuthServiceConfig, GoogleLoginProvider } from '@abacritt/angularx-social-login';
import { QRCodeComponent } from 'angularx-qrcode';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';

import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { HomeComponent } from './pages/home/home.component';
import { WifiAccessComponent } from './pages/wifi-access/wifi-access.component';
import { HelpComponent } from './pages/help/help.component';
import { SitemapComponent } from './pages/sitemap/sitemap.component';
import { BreadcrumbComponent } from './layout/breadcrumb/breadcrumb.component';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { JwtInterceptor } from './interceptors/jwt.interceptor';
import { PrivacyComponent } from './pages/privacy/privacy.component';
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './pages/login/login.component';
import { DonateComponent } from './pages/donate/donate.component';
import { SharedModule } from './shared/shared.module';
import { AlertComponent } from './components/alert/alert.component';
import { AccessibilityToolbarComponent } from './components/accessibility-toolbar/accessibility-toolbar.component';
import { AiChatbotComponent } from './components/ai-chatbot/ai-chatbot.component';
import { MaintenanceComponent } from './pages/maintenance/maintenance.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    HomeComponent,
    WifiAccessComponent,
    HelpComponent,
    SitemapComponent,
    BreadcrumbComponent,
    PrivacyComponent,
    AlertComponent,
    AccessibilityToolbarComponent,
    AiChatbotComponent,
    MaintenanceComponent,
    RegisterComponent,
    LoginComponent,
    DonateComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppRoutingModule,
    SharedModule,
    NgOptimizedImage,
    QRCodeComponent,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: false,
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

