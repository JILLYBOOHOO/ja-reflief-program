import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';

export interface User {
  id: number;
  idNumber: string;
  name: string;
  role: 'survivor' | 'admin' | 'agent';
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private apiUrl = 'http://localhost:3000/api/survivors';

  constructor(private http: HttpClient) {
    const savedUser = localStorage.getItem('survivor_user');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(idNumber: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { idNumber, password })
      .pipe(map(response => {
        if (response.token) {
          localStorage.setItem('access_token', response.token);
          localStorage.setItem('survivor_user', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
        return response;
      }));
  }

  register(survivorData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, survivorData);
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('survivor_user');
    this.currentUserSubject.next(null);
  }

  updateUser(updatedData: Partial<User>): void {
    const current = this.currentUserSubject.value;
    if (current) {
      const newUser = { ...current, ...updatedData } as User;
      localStorage.setItem('survivor_user', JSON.stringify(newUser));
      this.currentUserSubject.next(newUser);
    }
  }
}


