import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';
import { ImpactRequestService, ImpactRequest, RequestItem, PARISH_COORDS } from '../../services/impact-request.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  pantryForm!: FormGroup;
  profileForm!: FormGroup;
  isEditingProfile = false;

  // Virtual card flip
  isCardFlipped = false;
  cardNumber = '';
  cvvCode = '';
  parishes = Object.keys(PARISH_COORDS);

  categorizedPantryItems = [
    {
      category: 'Food & Water',
      priority: 'Priority 01',
      icon: 'water_drop',
      items: [
        { name: 'Potable Water (Gal)', icon: '💧' },
        { name: 'Dry Grains (Rice)', icon: '🌾' },
        { name: 'Canned Proteins', icon: '🥫' },
        { name: 'Hi-Cal Biscuits', icon: '🍪' }
      ]
    },
    {
      category: 'Hygiene Kits',
      priority: 'Priority 02',
      icon: 'sanitizer',
      items: [
        { name: 'Soap Bars (3)', icon: '🧼' },
        { name: 'Toothbrush Kit', icon: '🪥' },
        { name: 'Sanitary Pads', icon: '🧴' },
        { name: 'Laundry Soap', icon: '🧺' }
      ]
    },
    {
      category: 'Tools & Shelter',
      priority: 'Priority 03',
      icon: 'emergency',
      items: [
        { name: 'Heavy Duty Tarp', icon: '⛺' },
        { name: 'Solar Lantern', icon: '🔦' },
        { name: 'Basic Tool Kit', icon: '🛠️' },
        { name: 'Batteries (AA/AAA)', icon: '🔋' }
      ]
    },
    {
      category: 'Health Support',
      priority: 'Priority 04',
      icon: 'medical_services',
      items: [
        { name: 'Bandages & Gauze', icon: '🩹' },
        { name: 'Antiseptic Wipes', icon: '🧼' },
        { name: 'Oral Rehydration', icon: '🥤' },
        { name: 'Pain Relief Pack', icon: '💊' }
      ]
    }
  ];

  get selectedItemsCount(): number {
    let count = 0;
    this.categorizedPantryItems.forEach(cat => {
      cat.items.forEach(item => {
        if (this.pantryForm?.get(item.name)?.value) {
          count++;
        }
      });
    });
    return count;
  }

  getSelectedItemsCountForCategory(categoryName: string): number {
    const category = this.categorizedPantryItems.find(c => c.category === categoryName);
    if (!category) return 0;
    let count = 0;
    category.items.forEach(item => {
      if (this.pantryForm?.get(item.name)?.value) {
        count++;
      }
    });
    return count;
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private impactRequestService: ImpactRequestService
  ) { }

  ngOnInit(): void {
    // Check if user is logged in
    this.currentUser = this.authService.currentUserValue;
    if (!this.currentUser) {
      // Redirect to login if not authenticated
      this.router.navigate(['/login']);
    }

    // Initialize the Pantry form
    const formControls: any = {};
    this.categorizedPantryItems.forEach(cat => {
      cat.items.forEach(item => {
        formControls[item.name] = [false];
      });
    });
    formControls['otherItems'] = [''];
    formControls['parish'] = ['', Validators.required];

    this.pantryForm = this.fb.group(formControls);

    // Initialize Profile form
    this.profileForm = this.fb.group({
      name: [this.currentUser?.name || ''],
      idNumber: [this.currentUser?.idNumber || '']
    });

    // Generate stable virtual card number & CVV from user id
    this.generateCardDetails();
  }

  /** Flip the virtual card to show/hide CVV */
  flipCard(): void {
    this.isCardFlipped = !this.isCardFlipped;
  }

  /** Derive a deterministic 16-digit card number and 3-digit CVV from the user's ID */
  private generateCardDetails(): void {
    const seed = this.currentUser?.idNumber || 'provisional';
    // Simple hash-like spread to fill 16 digits
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
    }
    const absHash = Math.abs(hash);
    const raw = String(absHash).padStart(16, '0').slice(0, 16).padEnd(16, '0');
    // Format as XXXX XXXX XXXX XXXX
    this.cardNumber = raw.match(/.{1,4}/g)!.join(' ');
    // CVV is last 3 digits of a secondary hash
    let cvvHash = 0;
    for (let i = seed.length - 1; i >= 0; i--) {
      cvvHash = (cvvHash * 17 + seed.charCodeAt(i)) & 0xffff;
    }
    this.cvvCode = String(Math.abs(cvvHash) % 900 + 100); // always 3 digits 100–999
  }

  submitPantryRequest(): void {
    if (this.pantryForm.invalid) {
      alert('Please fill in all required fields, including your parish.');
      return;
    }

    const selectedItems: RequestItem[] = [];
    this.categorizedPantryItems.forEach(cat => {
      cat.items.forEach(item => {
        if (this.pantryForm.value[item.name]) {
          selectedItems.push({ name: item.name, quantity: 1, status: 'pending' });
        }
      });
    });

    const otherItems = this.pantryForm.value.otherItems;
    if (otherItems) {
      selectedItems.push({ name: otherItems, quantity: 1, status: 'pending' });
    }

    if (selectedItems.length === 0) {
      alert('Please select at least one item or describe what you need.');
      return;
    }

    const parish = this.pantryForm.value.parish;

    const newRequest: ImpactRequest = {
      id: Date.now().toString(),
      requesterName: this.currentUser?.name || 'Anonymous',
      location: parish,
      lat: PARISH_COORDS[parish].lat,
      lng: PARISH_COORDS[parish].lng,
      items: selectedItems,
      timestamp: Date.now()
    };

    this.impactRequestService.addRequest(newRequest);

    alert('Your pantry request has been submitted successfully! It will now appear on the Impact Map for donors.');
    this.pantryForm.reset();
  }

  toggleEditProfile(): void {
    this.isEditingProfile = !this.isEditingProfile;
    if (this.isEditingProfile && this.currentUser) {
      this.profileForm.patchValue({
        name: this.currentUser.name,
        idNumber: this.currentUser.idNumber
      });
    }
  }

  saveProfile(): void {
    if (this.profileForm.valid && this.currentUser) {
      this.authService.updateUser({
        name: this.profileForm.value.name,
        idNumber: this.profileForm.value.idNumber
      });
      // The BehaviorSubject will instantly emit and update this.currentUser because it's synchronous
      this.currentUser = this.authService.currentUserValue;
      this.isEditingProfile = false;
      alert('Profile updated successfully!');
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
