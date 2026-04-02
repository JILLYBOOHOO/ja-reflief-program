import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WifiAccessComponent } from './pages/wifi-access/wifi-access.component';

import { HomeComponent } from './pages/home/home.component';
import { SurvivorEntryComponent } from './pages/survivor-entry/survivor-entry.component';
import { DonateComponent } from './pages/donate/donate.component';


import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { InfoComponent } from './pages/info/info.component';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard.component';
import { SitemapComponent } from './pages/sitemap/sitemap.component';
import { PrivacyComponent } from './pages/privacy/privacy.component';

import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
    { path: '', component: HomeComponent, data: { breadcrumb: 'Home' } },
    { path: 'help', component: SurvivorEntryComponent, data: { breadcrumb: 'Request Aid' } },
    { path: 'donate', component: DonateComponent, data: { breadcrumb: 'Donate' } },
    { path: 'wifi-access', component: WifiAccessComponent, data: { breadcrumb: 'Wifi Vouchers' } },
    { path: 'register', component: RegisterComponent, data: { breadcrumb: 'Register' } },
    { path: 'login', component: LoginComponent, data: { breadcrumb: 'Login' } },
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard], data: { breadcrumb: 'Dashboard' } },
    { path: 'info', component: InfoComponent, canActivate: [AuthGuard], data: { breadcrumb: 'Information' } },
    { path: 'sitemap', component: SitemapComponent, data: { breadcrumb: 'Sitemap' } },
    { path: 'privacy', component: PrivacyComponent, data: { breadcrumb: 'Privacy Statement' } },
    { path: 'admin', component: AdminDashboardComponent, canActivate: [AuthGuard], data: { roles: ['admin'], breadcrumb: 'Admin Portal' } }
];


@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
