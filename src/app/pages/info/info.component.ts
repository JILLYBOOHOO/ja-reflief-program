import { Component, OnInit, OnDestroy } from '@angular/core';
import { WeatherService, WeatherState } from '../../services/weather.service';
import { UpdateService, AlertUpdate } from '../../services/update.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-info',
    templateUrl: './info.component.html',
    styleUrls: ['./info.component.css']
})
export class InfoComponent implements OnInit, OnDestroy {
    currentWeather: WeatherState = 'sunny';
    updates: AlertUpdate[] = [];
    private sub = new Subscription();

    constructor(
        private weatherService: WeatherService,
        private updateService: UpdateService
    ) { }

    ngOnInit() {
        this.sub.add(this.weatherService.weather$.subscribe(w => this.currentWeather = w));
        this.sub.add(this.updateService.updates$.subscribe(u => this.updates = u));
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }

    emergencyContacts = [
        { icon: '🚑', name: 'Ambulance', number: '110', link: 'tel:110' },
        { icon: '🚓', name: 'Police', number: '119', link: 'tel:119' },
        { icon: '🚒', name: 'Fire Department', number: '110', link: 'tel:110' },
        { icon: '🏥', name: 'ODPEM', number: '(876) 906-9674', link: 'tel:8769069674' }
    ];

    hospitals = [
        { name: 'University Hospital of the West Indies (UHWI)', address: 'Mona, Kingston 7', mapLink: 'https://www.google.com/maps/search/University+Hospital+of+the+West+Indies' },
        { name: 'Kingston Public Hospital (KPH)', address: 'North Street, Kingston', mapLink: 'https://www.google.com/maps/search/Kingston+Public+Hospital' },
        { name: 'Spanish Town Hospital', address: 'Burke Road, Spanish Town', mapLink: 'https://www.google.com/maps/search/Spanish+Town+Hospital' },
        { name: 'Cornwall Regional Hospital', address: 'Mt. Salem, Montego Bay', mapLink: 'https://www.google.com/maps/search/Cornwall+Regional+Hospital' },
        { name: 'Mandeville Regional Hospital', address: '32 Hargreaves Ave, Mandeville', mapLink: 'https://www.google.com/maps/search/Mandeville+Regional+Hospital' }
    ];

    shelters = [
        { name: 'Kensington Primary School', parish: 'St. Catherine', address: '3rd Street, 4 East', mapLink: 'https://www.google.com/maps/search/Kensington+Primary+School+St.+Catherine' },
        { name: 'Bridgeport High School', parish: 'St. Catherine', address: '1 Gibson Road, Portmore', mapLink: 'https://www.google.com/maps/search/Bridgeport+High+School+Portmore' },
        { name: 'Airy Castle Primary School', parish: 'St. Thomas', address: 'Airy Castle District', mapLink: 'https://www.google.com/maps/search/Airy+Castle+Primary+School' },
        { name: 'Yallahs Primary School', parish: 'St. Thomas', address: 'Phillipsfield, Yallahs', mapLink: 'https://www.google.com/maps/search/Yallahs+Primary+School' }
    ];
}
