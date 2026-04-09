import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DashboardComponent } from './dashboard.component';
import { QRCodeComponent } from 'angularx-qrcode';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [{ path: '', component: DashboardComponent }];

@NgModule({
  declarations: [DashboardComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    QRCodeComponent, 
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class DashboardModule { }
