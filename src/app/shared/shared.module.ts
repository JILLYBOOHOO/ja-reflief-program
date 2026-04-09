import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HazardReportModalComponent } from '../pages/hazard-report/hazard-report-modal.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    HazardReportModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    HazardReportModalComponent
  ]
})
export class SharedModule { }
