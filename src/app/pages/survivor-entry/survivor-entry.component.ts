import { Component } from '@angular/core';

@Component({
  selector: 'app-survivor-entry',
  templateUrl: './survivor-entry.component.html',
  styleUrls: ['./survivor-entry.component.css']
})
export class SurvivorEntryComponent {
  showLink: boolean = false;

  simulateSms() {
    console.log('Simulate SMS clicked'); // 👈 debug line
    this.showLink = true;
  }
}
