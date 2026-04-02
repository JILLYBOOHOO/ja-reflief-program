import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class PersistenceService {
    saveForm(key: string, value: any): void {
        localStorage.setItem(`form_persist_${key}`, JSON.stringify(value));
    }

    restoreForm(key: string): any {
        const data = localStorage.getItem(`form_persist_${key}`);
        return data ? JSON.parse(data) : null;
    }

    clearForm(key: string): void {
        localStorage.removeItem(`form_persist_${key}`);
    }
}
