import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HazardService, HazardReport } from '../../services/hazard.service';

@Component({
  selector: 'app-hazard-report-modal',
  template: `
    <div class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[2000]" (click)="close.emit()">
      <div class="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border-4 border-red-600 animate-in zoom-in duration-300" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="bg-red-600 p-6 flex items-center justify-between text-white">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-4xl animate-pulse">warning</span>
            <div>
              <h2 class="text-2xl font-black uppercase tracking-tighter italic">Report Danger Zone</h2>
              <p class="text-xs opacity-80 font-bold uppercase tracking-widest">Public Safety Alert System</p>
            </div>
          </div>
          <button (click)="close.emit()" class="hover:bg-white/20 p-2 rounded-full transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form (ngSubmit)="submit()" class="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <!-- Reporter Name -->
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Reporter Name (Optional)</label>
            <input type="text" [(ngModel)]="report.reporterName" name="reporterName" 
              class="w-full bg-slate-50 border-2 border-slate-100 focus:border-red-600 rounded-xl p-4 font-bold outline-none transition-all" 
              placeholder="Leave blank for Anonymous" />
          </div>

          <!-- Danger Type -->
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Hazard Type *</label>
            <select [(ngModel)]="report.dangerType" name="dangerType" required
              class="w-full bg-slate-50 border-2 border-slate-100 focus:border-red-600 rounded-xl p-4 font-bold outline-none transition-all">
              <option value="" disabled>Select Type of Danger</option>
              <option *ngFor="let type of dangerTypes" [value]="type">{{ type }}</option>
            </select>
          </div>

          <!-- Location -->
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Location / Address *</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">location_on</span>
              <input type="text" [(ngModel)]="report.location" name="location" required
                class="w-full bg-slate-50 border-2 border-slate-100 focus:border-red-600 rounded-xl p-4 pl-12 font-bold outline-none transition-all" 
                placeholder="e.g. Bog Walk Gorge, St. Catherine" />
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description of Danger *</label>
            <textarea [(ngModel)]="report.description" name="description" required rows="3"
              class="w-full bg-slate-50 border-2 border-slate-100 focus:border-red-600 rounded-xl p-4 font-bold outline-none transition-all resize-none" 
              placeholder="Describe the situation in detail..."></textarea>
          </div>

          <!-- Media Link -->
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Video/Image Link (Optional)</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">link</span>
              <input type="url" [(ngModel)]="report.mediaLink" name="mediaLink" 
                class="w-full bg-slate-50 border-2 border-slate-100 focus:border-red-600 rounded-xl p-4 pl-12 font-bold outline-none transition-all" 
                placeholder="YouTube, Imgur, or Google Drive link" />
            </div>
          </div>

          <!-- File Upload -->
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Upload Photos (Optional)</label>
            <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 hover:border-red-400 transition-all">
              <div class="flex flex-col items-center justify-center pt-5 pb-6">
                <span class="material-symbols-outlined text-4xl text-slate-300 mb-2">add_a_photo</span>
                <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">Click to upload images</p>
              </div>
              <input type="file" class="hidden" multiple (change)="onFileSelected($event)" accept="image/*" />
            </label>
            <div class="mt-4 flex flex-wrap gap-2" *ngIf="selectedFiles.length > 0">
              <span *ngFor="let file of selectedFiles; let i = index" class="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-2">
                {{ file.name }}
                <button type="button" (click)="selectedFiles.splice(i, 1)"><span class="material-symbols-outlined text-xs">close</span></button>
              </span>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="pt-4">
            <button type="submit" [disabled]="isSubmitting"
              class="w-full bg-red-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50">
              <span *ngIf="!isSubmitting">Submit Report</span>
              <span *ngIf="isSubmitting" class="animate-spin material-symbols-outlined">sync</span>
              <span *ngIf="!isSubmitting" class="material-symbols-outlined">send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    <!-- Modern UI Alert Layer -->
    <div class="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 z-[3000] animate-in fade-in duration-300" *ngIf="resultMessage" (click)="closeResult()">
      <div class="bg-black border-[3px] border-[#ffcc00] rounded-[32px] p-8 md:p-12 max-w-sm w-full shadow-2xl relative text-center" (click)="$event.stopPropagation()">
        <div class="text-7xl mb-6 material-symbols-outlined" [class.text-red-500]="resultType === 'error'" [class.text-jamaica-green]="resultType === 'success'">
          {{ resultType === 'success' ? 'check_circle' : 'warning' }}
        </div>
        <h2 class="text-2xl font-black mb-4 uppercase tracking-tighter italic" [class.text-red-500]="resultType === 'error'" [class.text-jamaica-green]="resultType === 'success'">
          {{ resultType === 'success' ? 'Respect!' : 'Danger!' }}
        </h2>
        <p class="text-white text-lg mb-8 font-medium leading-tight">{{ resultMessage }}</p>
        <button (click)="closeResult()" 
          class="w-full font-black py-4 rounded-full uppercase tracking-widest transition-all shadow-[0_4px_0_#000] active:translate-y-1 active:shadow-none"
          [class.bg-[#ffcc00]]="resultType === 'success'" [class.text-black]="resultType === 'success'"
          [class.bg-red-600]="resultType === 'error'" [class.text-white]="resultType === 'error'">
          Got it
        </button>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 8px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #ef4444; border-radius: 10px; }
    .text-jamaica-green { color: #009b3a; }
  `]
})
export class HazardReportModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();

  report: HazardReport = {
    dangerType: '',
    description: '',
    location: '',
    reporterName: ''
  };

  dangerTypes = [
    'Flooding', 
    'Landslide', 
    'Bridge Gone', 
    'Road Bad', 
    'Infrastructure Gone', 
    'Road Block', 
    'Rock Falling'
  ];

  selectedFiles: File[] = [];
  isSubmitting = false;

  // New alert state
  resultMessage = '';
  resultType: 'success' | 'error' = 'success';

  constructor(private hazardService: HazardService) {}

  onFileSelected(event: any) {
    if (event.target.files) {
      this.selectedFiles = Array.from(event.target.files);
    }
  }

  closeResult() {
    const isSuccess = this.resultType === 'success';
    this.resultMessage = '';
    if (isSuccess) {
      this.submitted.emit();
      this.close.emit();
    }
  }

  submit() {
    if (!this.report.dangerType || !this.report.description || !this.report.location) {
      this.resultMessage = 'Please fill in all required fields marked with *';
      this.resultType = 'error';
      return;
    }

    this.isSubmitting = true;
    const formData = new FormData();
    formData.append('reporterName', this.report.reporterName || 'Anonymous');
    formData.append('dangerType', this.report.dangerType);
    formData.append('description', this.report.description);
    formData.append('location', this.report.location);
    if (this.report.mediaLink) formData.append('mediaLink', this.report.mediaLink);
    
    this.selectedFiles.forEach(file => {
      formData.append('pictures', file);
    });

    this.hazardService.submitReport(formData).subscribe({
      next: () => {
        this.resultMessage = 'Hazard report submitted successfully! Admin will review it.';
        this.resultType = 'success';
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error(err);
        this.resultMessage = 'Failed to submit report. Please check your connection and try again.';
        this.resultType = 'error';
        this.isSubmitting = false;
      }
    });
  }
}
