import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import { SurvivorService } from './survivor.service';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';
import { PersistenceService } from '../../services/persistence.service';
import { SpeechService } from '../../services/speech.service';

// Custom Validator for common sequences (123, abc, etc.)
export function sequenceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value || typeof value !== 'string') return null;
    if (value.length < 4) return null; // Very short values are allowed if otherwise unique
    
    const commonSequences = ['1234', '2345', '3456', '4567', '5678', '6789', 'abcd', 'qwerty', 'password'];
    const isCommon = commonSequences.some(seq => value.toLowerCase().includes(seq));
    
    // Check for repetitive chars like 1111
    const isRepetitive = /^(.)\1+$/.test(value) || /(.)\1\1\1/.test(value);
    
    if (isCommon || isRepetitive) {
      return { simpleSequence: true };
    }
    return null;
  };
}

// Custom Validator for password complexity
export function passwordComplexityValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    
    const commonSequences = ['123', '234', '345', '456', '567', '678', '789', 'abc', 'qwerty', 'password'];
    const isCommon = commonSequences.some(seq => value.toLowerCase().includes(seq));
    const isRepetitive = /(.)\1\1/.test(value);
    
    if (isCommon || isRepetitive) {
      return { simplePassword: true };
    }
    return null;
  };
}

// Custom Validator for DOB (at least 1 month old)
export function dobValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    
    const selectedDate = new Date(value);
    const selectedYear = selectedDate.getFullYear();
    
    // Prevent DOB 2018 to present
    if (selectedYear >= 2018) {
      return { tooYoung: true };
    }
    return null;
  };
}

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
    private alertService: AlertService,
    private persistenceService: PersistenceService,
    private speechService: SpeechService,
    private router: Router
  ) { }

  isVoiceEnabled = false;

  toggleVoice(): void {
    this.isVoiceEnabled = !this.isVoiceEnabled;
    this.speechService.toggleListening();
    if (this.isVoiceEnabled) {
      this.speechService.speak('Voice guidance and navigation activated. You can now use voice commands like Go Home, Go to Donate, Scroll Down, or Back. To fill a field, focus it and wait for the instruction.');
    } else {
      this.speechService.speak('Voice guidance deactivated.');
    }
  }

  private getFieldLabel(key: string): string {
    const labels: { [key: string]: string } = {
        fullName: 'Full Name',
        contact: 'Contact Number',
        idType: 'ID Type',
        idNumber: 'ID Number',
        parish: 'Parish',
        address: 'Address',
        dob: 'Date of Birth',
        damageLevel: 'Damage Level',
        password: 'Password'
    };
    return labels[key] || key;
  }

  speakField(label: string, instruction: string = ''): void {
    if (this.isVoiceEnabled) {
      this.speechService.speak(`${label}. ${instruction}`);
    }
  }


  ngOnInit(): void {
    // Prevent DOB from 2018 to present - Max date is Dec 31, 2017
    this.today = '2017-12-31';

    // Form setup
    this.survivorForm = this.fb.group({
      fullName: ['', Validators.required],
      contact: ['', [Validators.required, Validators.pattern('^\\+?[0-9]{7,}$'), sequenceValidator()]],
      idType: ['', Validators.required],
      idNumber: ['', [Validators.required, sequenceValidator()]],
      provisional: [false],
      parish: ['', Validators.required],
      address: [''],
      email: ['', [Validators.required, Validators.email]],
      dob: ['', [Validators.required, dobValidator()]],
      damageLevel: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6), passwordComplexityValidator()]],
      // Emergency Medical Fields (Optional)
      weight: [''],
      emergencyContact: [''],
      emergencyContactPhone: [''],
      bloodType: [''],
      currentMedications: [''],
      medicalConditions: [''],
      allergies: [''],
      preferredDoctorName: [''],
      doctorContactNumber: [''],
      medicalConsent: [false],
      website: [''] // Honeypot field
    });

    // Restore saved form data
    const savedData = this.persistenceService.restoreForm('register');
    if (savedData) {
      this.survivorForm.patchValue(savedData, { emitEvent: false });
    }

    // Subscribe to voice results for fields
    this.speechService.fieldResult$.subscribe(text => {
      if (this.activeVoiceField) {
        // Basic capitalizing for names/address
        const formatted = text.charAt(0).toUpperCase() + text.slice(1);
        this.survivorForm.get(this.activeVoiceField)?.setValue(formatted);
        this.activeVoiceField = '';
        this.speechService.speak('Added ' + formatted);
      }
    });

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

  activeVoiceField: string = '';

  listenToField(fieldName: string): void {
    this.activeVoiceField = fieldName;
    this.speechService.speak('Listening for ' + fieldName);
    this.speechService.startFieldInput();
  }



  resetForm(): void {
    this.survivorForm.reset();
    this.persistenceService.clearForm('register');
    this.showSuccessModal = false;
    this.alertService.close();
    if (this.isVoiceEnabled) {
      this.speechService.speak('Form has been completely cleared and reset.');
    }
  }

  showSuccessModal = false;

  // Submit form
  submit(): void {
    if (this.survivorForm.invalid) {
      this.survivorForm.markAllAsTouched();
      
      const missingFields: string[] = [];
      let firstInvalidId = '';

      Object.keys(this.survivorForm.controls).forEach(key => {
        const control = this.survivorForm.get(key);
        if (control?.invalid) {
          missingFields.push(this.getFieldLabel(key));
          if (!firstInvalidId) firstInvalidId = key;
        }
      });

      const errorMsg = `Please complete the following required fields: ${missingFields.join(', ')}.`;
      
      if (this.isVoiceEnabled) {
          this.speechService.speak(errorMsg);
      }
      
      this.alertService.show({
        type: 'error',
        title: 'Missing Information',
        message: errorMsg,
        btnText: 'Let me fix those'
      });

      if (firstInvalidId) {
          // Find the specific control element
          const element = document.getElementById(firstInvalidId) || document.querySelector(`[formControlName="${firstInvalidId}"]`) as HTMLElement;
          
          if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              element.focus({ preventScroll: true });
              
              // Add a visual shake/error highlight briefly
              element.classList.add('error-shake');
              setTimeout(() => element.classList.remove('error-shake'), 1000);
          }
      }
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
        const loginIdentifier = this.survivorForm.get('email')?.value || this.survivorForm.get('fullName')?.value;
        const password = this.survivorForm.get('password')?.value;

        setTimeout(() => {
          this.authService.login(loginIdentifier, password).subscribe({
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
        const errorMsg = typeof err === 'string' ? err : (err?.error?.error || err?.error?.message || err?.message || 'Registration failed. Please try again.');
        this.alertService.error('Registration Failed', errorMsg);
      }
    });

  }
}
