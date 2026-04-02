import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type WeatherState = 'sunny' | 'rainy' | 'stormy' | 'thunder';

@Injectable({
    providedIn: 'root'
})
export class WeatherService {
    private weatherSubject = new BehaviorSubject<WeatherState>('sunny');
    public weather$ = this.weatherSubject.asObservable();

    setWeather(state: WeatherState) {
        this.weatherSubject.next(state);
    }

    getCurrentWeather(): WeatherState {
        return this.weatherSubject.value;
    }
}
