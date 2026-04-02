import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { SurvivorEntryComponent } from './pages/survivor-entry/survivor-entry.component';
import { DonateComponent } from './pages/donate/donate.component';

const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'help', component: SurvivorEntryComponent },
    { path: 'donate', component: DonateComponent }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
