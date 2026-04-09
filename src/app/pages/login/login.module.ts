import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './login.component';
import { SocialLoginModule, GoogleSigninButtonModule } from '@abacritt/angularx-social-login';

const routes: Routes = [{ path: '', component: LoginComponent }];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SocialLoginModule,
    GoogleSigninButtonModule,
    RouterModule.forChild(routes)
  ]
})
export class LoginModule { }
