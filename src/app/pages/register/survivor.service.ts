import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SurvivorService {

    private apiUrl = 'http://localhost:3000/api/survivors';

    constructor(private http: HttpClient) { }

    registerSurvivor(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, data);
    }
}
