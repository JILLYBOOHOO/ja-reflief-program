import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PersistenceService } from './persistence.service';

export interface RequestItem {
    name: string;
    quantity: number;
    status: 'pending' | 'partially-fulfilled' | 'fulfilled' | 'received';
    fulfilledBy?: string[];
}

export interface ImpactRequest {
    id: string;
    requesterName: string;
    location: string; // Parish name
    lat: number;
    lng: number;
    items: RequestItem[];
    timestamp: number;
}

export const PARISH_COORDS: { [key: string]: { lat: number, lng: number } } = {
    'Kingston': { lat: 17.9714, lng: -76.7936 },
    'St. Andrew': { lat: 18.0441, lng: -76.8041 },
    'St. Catherine': { lat: 18.0167, lng: -76.9500 },
    'Clarendon': { lat: 17.9667, lng: -77.2167 },
    'Manchester': { lat: 18.0333, lng: -77.5000 },
    'St. Elizabeth': { lat: 18.0500, lng: -77.7500 },
    'Westmoreland': { lat: 18.2333, lng: -78.1667 },
    'Hanover': { lat: 18.4167, lng: -78.1333 },
    'St. James': { lat: 18.4500, lng: -77.8833 },
    'Trelawny': { lat: 18.3833, lng: -77.5500 },
    'St. Ann': { lat: 18.3500, lng: -77.2833 },
    'St. Mary': { lat: 18.3000, lng: -76.9667 },
    'Portland': { lat: 18.1333, lng: -76.4833 },
    'St. Thomas': { lat: 17.9333, lng: -76.4333 }
};

@Injectable({
    providedIn: 'root'
})
export class ImpactRequestService {
    private requestsSubject = new BehaviorSubject<ImpactRequest[]>([]);
    public requests$ = this.requestsSubject.asObservable();

    constructor(private persistenceService: PersistenceService) {
        this.loadRequests();
    }

    private loadRequests() {
        const saved = this.persistenceService.restoreForm('impact_requests');
        if (saved) {
            this.requestsSubject.next(saved);
        } else {
            // Mock some initial data
            const mockRequests: ImpactRequest[] = [
                {
                    id: '1',
                    requesterName: 'Pam',
                    location: 'St. Elizabeth',
                    lat: PARISH_COORDS['St. Elizabeth'].lat,
                    lng: PARISH_COORDS['St. Elizabeth'].lng,
                    items: [
                        { name: 'Rice', quantity: 5, status: 'pending' },
                        { name: 'Water', quantity: 10, status: 'pending' },
                        { name: 'Oil', quantity: 2, status: 'pending' }
                    ],
                    timestamp: Date.now()
                }
            ];
            this.requestsSubject.next(mockRequests);
            this.saveRequests(mockRequests);
        }
    }

    private saveRequests(requests: ImpactRequest[]) {
        this.persistenceService.saveForm('impact_requests', requests);
    }

    addRequest(request: ImpactRequest) {
        const current = this.requestsSubject.value;
        const updated = [...current, request];
        this.requestsSubject.next(updated);
        this.saveRequests(updated);
    }

    updateRequest(updatedRequest: ImpactRequest) {
        const current = this.requestsSubject.value;
        const index = current.findIndex(r => r.id === updatedRequest.id);
        if (index !== -1) {
            current[index] = updatedRequest;
            this.requestsSubject.next([...current]);
            this.saveRequests(current);
        }
    }

    getRequests(): ImpactRequest[] {
        return this.requestsSubject.value;
    }
}
