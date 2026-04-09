import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SurvivorEntryComponent } from './survivor-entry.component';

const routes: Routes = [{ path: '', component: SurvivorEntryComponent }];

@NgModule({
  declarations: [SurvivorEntryComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ]
})
export class SurvivorEntryModule { }
