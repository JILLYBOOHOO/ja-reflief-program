import { Component } from '@angular/core';

@Component({
  selector: 'app-maintenance',
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.css']
})
export class MaintenanceComponent {
  currentTime = new Date();

  refreshTime() {
    this.currentTime = new Date();
  }
}
