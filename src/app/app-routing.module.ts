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
import { MaintenanceComponent } from './pages/maintenance/maintenance.component';

import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
    { path: '', component: HomeComponent, data: { breadcrumb: 'Home' } },
    { path: 'help', loadChildren: () => import('./pages/survivor-entry/survivor-entry.module').then(m => m.SurvivorEntryModule), data: { breadcrumb: 'Request Aid' } },
    { path: 'donate', component: DonateComponent, data: { breadcrumb: 'Donate' } },
    { path: 'wifi-access', component: WifiAccessComponent, data: { breadcrumb: 'Wifi Vouchers' } },
    { path: 'register', component: RegisterComponent, data: { breadcrumb: 'Register' } },
    { path: 'login', component: LoginComponent, data: { breadcrumb: 'Login' } },
    { path: 'dashboard', loadChildren: () => import('./pages/dashboard/dashboard.module').then(m => m.DashboardModule), canActivate: [AuthGuard], data: { breadcrumb: 'Dashboard' } },
    { path: 'information', loadChildren: () => import('./pages/info/info.module').then(m => m.InfoModule), data: { breadcrumb: 'Information' } },
    { path: 'sitemap', component: SitemapComponent, data: { breadcrumb: 'Sitemap' } },
    { path: 'privacy', component: PrivacyComponent, data: { breadcrumb: 'Privacy Statement' } },
    { path: 'admin', loadChildren: () => import('./pages/admin/admin.module').then(m => m.AdminModule), canActivate: [AuthGuard], data: { roles: ['admin'], breadcrumb: 'Admin Portal' } },
    { path: 'maintenance', component: MaintenanceComponent, data: { breadcrumb: 'System Status' } },
    { path: '**', redirectTo: '' }
];


@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
