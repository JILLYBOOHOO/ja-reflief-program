import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './app/pages/home/home.component';
import { DonateComponent } from './app/pages/donate/donate.component';
import { WifiAccessComponent } from './app/pages/wifi-access/wifi-access.component';
import { HelpComponent } from './app/pages/help/help.component';
import { RegisterComponent } from './app/pages/register/register.component';
import { LoginComponent } from './app/pages/login/login.component';

const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'contact-us', component: HelpComponent },
    { path: 'wifi-access', component: WifiAccessComponent },
    { path: 'donate', component: DonateComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'login', component: LoginComponent },
    {
        path: 'information',
        loadChildren: () => import('./app/pages/info/info.module').then(m => m.InfoModule)
    },
    {
        path: 'dashboard',
        loadChildren: () => import('./app/pages/dashboard/dashboard.module').then(m => m.DashboardModule)
    },
    {
        path: 'admin',
        loadChildren: () => import('./app/pages/admin/admin.module').then(m => m.AdminModule)
    },
    {
        path: 'survivor-entry',
        loadChildren: () => import('./app/pages/survivor-entry/survivor-entry.module').then(m => m.SurvivorEntryModule)
    },
    { path: '**', redirectTo: '' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
