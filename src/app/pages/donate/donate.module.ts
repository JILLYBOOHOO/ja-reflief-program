import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DonateComponent } from './donate.component';
import { SharedModule } from '../../shared/shared.module';
import { QRCodeComponent } from 'angularx-qrcode';
import { GoogleSigninButtonModule } from '@abacritt/angularx-social-login';

const routes: Routes = [{ path: '', component: DonateComponent }];

@NgModule({
  declarations: [DonateComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    QRCodeComponent,
    GoogleSigninButtonModule,
    RouterModule.forChild(routes)
  ]
})
export class DonateModule { }
