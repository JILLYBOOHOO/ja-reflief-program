import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AlertUpdate {
    id: string;
    title: string;
    source: string;
    time: string;
    content: string;
    status: 'info' | 'warning' | 'danger';
}

@Injectable({
    providedIn: 'root'
})
export class UpdateService {
    private updatesSubject = new BehaviorSubject<AlertUpdate[]>([
        {
            id: '1',
            title: 'Current Weather Situation',
            source: 'Jamaica Meteorological Service',
            time: 'March 18, 2026 - 1:30 PM',
            content: 'Light rain expected across most parishes. No active flash flood warnings at this time.',
            status: 'info'
        },
        {
            id: '2',
            title: 'Preparedness Notice',
            source: 'ODPEM',
            time: 'Ongoing',
            content: 'Residents in flood-prone areas should remain vigilant and monitor local weather reports.',
            status: 'warning'
        }
    ]);
    public updates$ = this.updatesSubject.asObservable();

    addUpdate(update: Omit<AlertUpdate, 'id' | 'time'>) {
        const newUpdate: AlertUpdate = {
            ...update,
            id: Date.now().toString(),
            time: new Date().toLocaleString()
        };
        const current = this.updatesSubject.value;
        this.updatesSubject.next([newUpdate, ...current]);
    }

    deleteUpdate(id: string) {
        const filtered = this.updatesSubject.value.filter(u => u.id !== id);
        this.updatesSubject.next(filtered);
    }
}
