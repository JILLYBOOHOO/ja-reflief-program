import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    constructor(
        private router: Router,
        private authService: AuthService
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        const user = this.authService.currentUserValue;
        if (user) {
            // Check if route has restricted roles
            if (route.data['roles'] && route.data['roles'].indexOf(user.role) === -1) {
                // Role not authorized, so redirect to home
                this.router.navigate(['/']);
                return false;
            }

            // Authorized, so return true
            return true;
        }

        // Not logged in, so redirect to login page with the return url
        this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
    }
}
