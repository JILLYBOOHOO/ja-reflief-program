import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface PledgeDonation {
  donorName: string;
  donorPhone?: string;
  donorEmail?: string;
  items: string[];
  center: string;
  dropOffDate?: string;
  createdAt: number;
}

export interface MonetaryDonation {
  amount: number;
  donorName: string;
  donorPhone?: string;
  donorEmail?: string;
  createdAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class DonationService {
  private apiUrl = 'http://localhost:3000/api/donations';

  // In-memory live pledge feed for admin dashboard
  private pledgesSubject = new BehaviorSubject<PledgeDonation[]>([]);
  public pledges$ = this.pledgesSubject.asObservable();

  private monetarySubject = new BehaviorSubject<MonetaryDonation[]>([]);
  public monetary$ = this.monetarySubject.asObservable();

  // Running totals
  get totalMonetary(): number {
    return this.monetarySubject.value.reduce((sum, d) => sum + d.amount, 0);
  }

  constructor(private http: HttpClient) {
    this.loadFromBackend();
  }

  private loadFromBackend() {
    this.http.get<any[]>(`${this.apiUrl}/pledges`).pipe(
      catchError(() => of([]))
    ).subscribe(rows => {
      const pledges: PledgeDonation[] = rows.map(r => ({
        donorName: r.donorName,
        donorPhone: r.donorPhone,
        donorEmail: r.donorEmail,
        items: typeof r.items === 'string' ? JSON.parse(r.items) : (r.items || []),
        center: r.center,
        dropOffDate: r.dropOffDate,
        createdAt: new Date(r.createdAt).getTime()
      }));
      this.pledgesSubject.next(pledges);
    });

    this.http.get<any[]>(`${this.apiUrl}/monetary`).pipe(
      catchError(() => of([]))
    ).subscribe(rows => {
      const donations: MonetaryDonation[] = rows.map(r => ({
        amount: parseFloat(r.amount),
        donorName: r.donorName,
        donorPhone: r.donorPhone,
        donorEmail: r.donorEmail,
        createdAt: new Date(r.createdAt).getTime()
      }));
      this.monetarySubject.next(donations);
    });
  }

  addMonetaryDonation(donation: { amount: number, donorName: string, donorPhone?: string, donorEmail?: string }): Observable<any> {
    // Optimistically add to local state immediately
    const newDonation: MonetaryDonation = { ...donation, createdAt: Date.now() };
    const current = this.monetarySubject.value;
    this.monetarySubject.next([newDonation, ...current]);

    return this.http.post(`${this.apiUrl}/monetary`, donation).pipe(
      catchError(() => of({ ok: true }))
    );
  }

  addPledge(pledge: { donorName: string, donorPhone?: string, donorEmail?: string, items: string[], center: string, dropOffDate?: string }): Observable<any> {
    // Optimistically add to local state immediately
    const newPledge: PledgeDonation = { ...pledge, createdAt: Date.now() };
    const current = this.pledgesSubject.value;
    this.pledgesSubject.next([newPledge, ...current]);

    return this.http.post(`${this.apiUrl}/pledge`, pledge).pipe(
      catchError(() => of({ ok: true }))
    );
  }
}
