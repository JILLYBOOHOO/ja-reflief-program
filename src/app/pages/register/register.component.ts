
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { SurvivorService } from './survivor.service';
import { AuthService } from '../../services/auth.service';
import { PersistenceService } from '../../services/persistence.service';
import { SpeechService } from '../../services/speech.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  survivorForm!: FormGroup;
  today: string = '';

  parishesList: string[] = [
    'Kingston', 'St Andrew', 'St Catherine', 'Clarendon', 'Manchester',
    'St Elizabeth', 'Westmoreland', 'Hanover', 'St James', 'Trelawny',
    'St Ann', 'St Mary', 'Portland', 'St Thomas'
  ];

  constructor(
    private fb: FormBuilder,
    private survivorService: SurvivorService,
    private authService: AuthService,
    private persistenceService: PersistenceService,
    private speechService: SpeechService,
    private router: Router
  ) { }

  isVoiceEnabled = false;

  toggleVoice(): void {
    this.isVoiceEnabled = !this.isVoiceEnabled;
    if (this.isVoiceEnabled) {
      this.speechService.speak('Voice guidance activated. Focus on any field to hear it read.');
    } else {
      this.speechService.speak('Voice guidance deactivated.');
    }
  }

  speakField(label: string, instruction: string = ''): void {
    if (this.isVoiceEnabled) {
      this.speechService.speak(`${label}. ${instruction}`);
    }
  }


  ngOnInit(): void {
    // Prevent future DOB
    this.today = new Date().toISOString().split('T')[0];

    // Form setup
    this.survivorForm = this.fb.group({
      fullName: ['', Validators.required],
      contact: ['', [Validators.required, Validators.pattern('^\\+?[0-9]{7,}$')]],
      idType: ['', Validators.required],
      idNumber: ['', Validators.required],
      provisional: [false],
      parish: ['', Validators.required],
      address: [''],
      dob: ['', Validators.required],
      damageLevel: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Restore saved form data
    const savedData = this.persistenceService.restoreForm('register');
    if (savedData) {
      this.survivorForm.patchValue(savedData, { emitEvent: false });
    }

    // Save on change
    this.survivorForm.valueChanges.subscribe(val => {
      this.persistenceService.saveForm('register', val);
    });

    // Conditional ID validation
    this.survivorForm.get('provisional')?.valueChanges.subscribe(isProv => {
      const idType = this.survivorForm.get('idType');
      const idNumber = this.survivorForm.get('idNumber');

      if (isProv) {
        idType?.clearValidators();
        idNumber?.clearValidators();
      } else {
        idType?.setValidators(Validators.required);
        idNumber?.setValidators(Validators.required);
      }

      idType?.updateValueAndValidity();
      idNumber?.updateValueAndValidity();
    });
  }



  showSuccessModal = false;

  // Submit form
  submit(): void {
    if (this.survivorForm.invalid) {
      this.survivorForm.markAllAsTouched();
      // Keep simple alert for validation errors or convert to toast later
      alert('Please complete all required fields');
      return;
    }

    const formData = new FormData();

    Object.entries(this.survivorForm.value).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value as string);
      }
    });

    this.authService.register(formData).subscribe({
      next: (response) => {
        // MODERN SUCCESS FLOW
        this.showSuccessModal = true;
        this.persistenceService.clearForm('register');
        
        if (this.isVoiceEnabled) {
          this.speechService.speak('Registration successful. Welcome to J.A. Relief. Redirecting you to your dashboard.');
        }

        // Silent login and redirect after a short delay so they see the success message
        const idNumber = this.survivorForm.get('idNumber')?.value || 'provisional';
        const password = this.survivorForm.get('password')?.value;

        setTimeout(() => {
          this.authService.login(idNumber, password).subscribe({
            next: (loginRes) => {
              if (loginRes && loginRes.token) {
                this.router.navigate(['/dashboard']);
              }
            },
            error: () => this.router.navigate(['/login'])
          });
        }, 3000);
      },
      error: (err) => {
        console.error('Registration error:', err);
        alert(err || 'Registration failed. Please try again.');
      }
    });

  }
}
