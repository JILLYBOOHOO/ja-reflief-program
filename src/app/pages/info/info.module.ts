import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { InfoComponent } from './info.component';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [{ path: '', component: InfoComponent }];

@NgModule({
  declarations: [InfoComponent],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class InfoModule { }
