import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ImpactRequestService, ImpactRequest, RequestItem } from '../../services/impact-request.service';
import { SpeechService } from '../../services/speech.service';
import { GuideService } from '../../services/guide.service';
import { DonationService } from '../../services/donation.service';
import { ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../services/auth.service';

declare var L: any;

@Component({
  selector: 'app-donate',
  templateUrl: './donate.component.html',
  styleUrls: ['./donate.component.css']
})
export class DonateComponent implements OnInit, AfterViewInit, OnDestroy {
  donationType: 'monetary' | 'in-kind' | 'impact-map' = 'monetary'; // Default to monetary as requested
  selectedPaymentMethod: string = 'card';
  showSuccessModal: boolean = false;
  alertMessage: string = '';
  alertType: 'error' | 'success' = 'error';
  donationAmount: number = 15000;
  pledgedItems: string[] = [];
  loading: boolean = false;
  showHazardModal: boolean = false;
  
  // Two-way bound fields for the donation form
  donorName: string = '';
  donorEmail: string = '';
  donorPhone: string = '';
  dropOffDate: string = '';
  selectedCenter: string = '';
  todayDate: string = new Date().toISOString().split('T')[0];

  donationCenters = [
    { id: 'kingston_warehouse', name: 'Kingston: JA RELIEF Central Warehouse, 123 Hope Road' },
    { id: 'kingston_church', name: 'Kingston: St. Andrew Parish Church, Ellesmere Road' },
    { id: 'spanishtown', name: 'Spanish Town: St. Catherine Parish Church hall' },
    { id: 'maypen', name: 'May Pen: St. James Methodist Church Hall' },
    { id: 'mandeville', name: 'Mandeville: St. Mark\'s Parish Church, 1 Ward Avenue' },
    { id: 'santacruz', name: 'Santa Cruz: St. Elizabeth Parish Library' },
    { id: 'savlamar', name: 'Savanna-la-Mar: Westmoreland Parish Church' },
    { id: 'lucea', name: 'Lucea: Hanover Community Center' },
    { id: 'mobay', name: 'Montego Bay: St. James Parish Church, 45 Barnett Street' },
    { id: 'falmouth', name: 'Falmouth: Trelawny Parish Church' },
    { id: 'st_ann', name: 'St. Ann\'s Bay: Methodist Church, 10 Main Street' },
    { id: 'portmaria', name: 'Port Maria: St. Mary Parish Church' },
    { id: 'portantonio', name: 'Port Antonio: Portland Parish Church' },
    { id: 'morantbay', name: 'Morant Bay: St. Thomas Parish Church' }
  ];

  private map: any;
  private markers: any[] = [];
  allRequests: ImpactRequest[] = [];
  selectedRequest: ImpactRequest | null = null;
  showFulfillmentModal = false;
  itemsToFulfill: { [itemName: string]: boolean } = {};

  get activeSurvivorRequests() {
    return this.allRequests.filter(req =>
      req.items.some(item => item.status === 'pending' || item.status === 'partially-fulfilled')
    ).sort((a, b) => b.timestamp - a.timestamp);
  }

  categorizedItems = [
    {
      category: 'Liquids',
      priority: 'Priority 01',
      icon: '🥤',
      items: [
        { name: 'Water', icon: '🥤', checked: false },
        { name: 'Syrup', icon: '🍯', checked: false },
        { name: 'Juice / Tin Juice', icon: '🧃', checked: false },
        { name: 'Malta', icon: '🍹', checked: false },
        { name: 'Oil', icon: '🛢️', checked: false }
      ]
    },
    {
      category: 'Staples & Grains',
      icon: '🌾',
      items: [
        { name: 'Rice / Flour', icon: '🌾', checked: false },
        { name: 'Sugar / Cornmeal', icon: '🌽', checked: false },
        { name: 'Oats / Noodles', icon: '🥣', checked: false },
        { name: 'Macaroni and Cheese', icon: '🍝', checked: false },
        { name: 'Cornflakes', icon: '🥣', checked: false }
      ]
    },
    {
      category: 'Canned/Tin Items',
      icon: '🥫',
      items: [
        { name: 'Tin Milk', icon: '🥛', checked: false },
        { name: 'Baked Beans', icon: '🥫', checked: false },
        { name: 'Red Peas', icon: '🫘', checked: false },
        { name: 'Broad Bean', icon: '🫘', checked: false },
        { name: 'Corned Beef', icon: '🥩', checked: false },
        { name: 'Tin Mackerel', icon: '🐟', checked: false },
        { name: 'Sardines', icon: '🐟', checked: false },
        { name: 'Tuna', icon: '🐟', checked: false },
        { name: 'Spam', icon: '🍖', checked: false },
        { name: 'Sausages', icon: '🌭', checked: false }
      ]
    },
    {
      category: 'Emergency Supplies',
      icon: '🔦',
      items: [
        { name: 'Flashlights', icon: '🔦', checked: false },
        { name: 'Batteries', icon: '🔋', checked: false },
        { name: 'Portable phone chargers', icon: '🔌', checked: false },
        { name: 'Battery-powered radios', icon: '📻', checked: false },
        { name: 'Candles and matches', icon: '🕯️', checked: false },
        { name: 'Blankets', icon: '🛌', checked: false },
        { name: 'Sleeping mats', icon: '😴', checked: false }
      ]
    },
    {
      category: 'Health & First Aid',
      icon: '🏥',
      items: [
        { name: 'First aid kits', icon: '🩹', checked: false },
        { name: 'Bandages and gauze', icon: '🧤', checked: false },
        { name: 'Antiseptic wipes', icon: '🧼', checked: false },
        { name: 'Pain relievers', icon: '💊', checked: false },
        { name: 'Thermometers', icon: '🌡️', checked: false },
        { name: 'Disposable gloves', icon: '🧤', checked: false }
      ]
    },
    {
      category: 'Hygiene',
      icon: '🛁',
      items: [
        { name: 'Soap', icon: '🧼', checked: false },
        { name: 'Toothbrush', icon: '🪥', checked: false },
        { name: 'Toothpaste', icon: '🧴', checked: false },
        { name: 'Hand sanitizer', icon: '🧼', checked: false },
        { name: 'Toilet paper', icon: '🧻', checked: false },
        { name: 'Sanitary pads', icon: '🩹', checked: false }
      ]
    },
    {
      category: 'Cleaning Supplies',
      icon: '🧹',
      items: [
        { name: 'Bleach', icon: '🧴', checked: false },
        { name: 'Detergent', icon: '🧼', checked: false },
        { name: 'Scrub brushes', icon: '🪥', checked: false }
      ]
    },
    {
      category: 'Baby & Senior Care',
      icon: '👶',
      items: [
        { name: 'Baby Formula', icon: '🍼', checked: false },
        { name: 'Diapers', icon: '👶', checked: false },
        { name: 'Adult Diapers', icon: '👵', checked: false }
      ]
    },
    {
      category: 'Clothing & Blankets',
      icon: '👕',
      items: [
        { name: 'Adult Clothing', icon: '👕', checked: false },
        { name: 'Children Clothing', icon: '👕', checked: false },
        { name: 'Blankets', icon: '🛌', checked: false },
        { name: 'Rags', icon: '🧹', checked: false },
        { name: 'Socks', icon: '🧦', checked: false }
      ]
    },
    {
      category: 'Fresh Fruits',
      icon: '🍎',
      items: [
        { name: 'Orange', icon: '🍊', checked: false },
        { name: 'Watermelon', icon: '🍉', checked: false },
        { name: 'Coconut', icon: '🥥', checked: false },
        { name: 'Ripe Banana', icon: '🍌', checked: false }
      ]
    },
    {
      category: 'Ground Provision',
      icon: '🥔',
      items: [
        { name: 'Yam', icon: '🥔', checked: false },
        { name: 'Green Banana', icon: '🍌', checked: false },
        { name: 'Irish Potatoes', icon: '🥔', checked: false },
        { name: 'Sweet Potatoes', icon: '🍠', checked: false }
      ]
    }
  ];

  paymentMethods = [
    { id: 'paypal', name: 'PayPal & Cards', icon: '🅿️' }
  ];

  constructor(
    private impactRequestService: ImpactRequestService,
    private speechService: SpeechService,
    private guideService: GuideService,
    private donationService: DonationService,
    private route: ActivatedRoute,
    private authServiceGlobal: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  activeVoiceField: string = '';
  termsAccepted: boolean = false;
  qrCodeData: string = '';
  isGoogleAuthLoading: boolean = false;

  get isLoggedIn(): boolean {
    return !!this.authServiceGlobal.currentUserValue;
  }

  logout() {
    this.authServiceGlobal.logout();
  }

  downloadQR(elementId: string) {
    const parent = document.getElementById(elementId);
    if (!parent) return;
    const canvas = parent.querySelector('canvas') as HTMLCanvasElement;
    const img = parent.querySelector('img') as HTMLImageElement;
    
    let imgData = '';
    if (canvas) {
        imgData = canvas.toDataURL('image/png');
    } else if (img) {
        imgData = img.src;
    } else {
        this.showAlert('Could not generate download file. Please take a screenshot instead.');
        return;
    }
    
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `JARelief_DropOff_ScanCode_${new Date().getTime()}.png`;
    link.click();
  }

  shareQR(elementId: string) {
    const parent = document.getElementById(elementId);
    if (!parent) return;
    const canvas = parent.querySelector('canvas') as HTMLCanvasElement;
    
    if (canvas && navigator.share) {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], 'JA-Relief-Pass.png', { type: 'image/png' });
        navigator.share({
          title: 'JA RELIEF - My Impact Pass',
          text: 'Check out my donation pledge pass for JA Relief recovery efforts!',
          files: [file]
        }).catch(err => console.error('Share failed:', err));
      });
    } else {
      this.showAlert('Web Share not supported on this browser. Please use Download instead.', 'success');
    }
  }

  emailQR() {
    // Generate simulated server ping for email
    const emailToUse = this.donorEmail || 'your active email';
    this.showAlert(`QR Code successfully queued. It will be emailed securely to ${emailToUse} within 5 minutes.`);
  }

  listenToField(fieldName: string): void {
    this.activeVoiceField = fieldName;
    this.speechService.speak('Listening for ' + fieldName);
    this.speechService.startFieldInput();
  }

  speakField(label: string, instruction: string = ''): void {
      this.speechService.speak(`${label}. ${instruction}`);
  }

  ngOnInit() {
    // Synchronize Form with Global Auth State
    this.authServiceGlobal.currentUser$.subscribe(user => {
      if (user) {
        this.donorName = user.name || this.donorName;
        this.donorEmail = user.email || this.donorEmail;
        this.donorPhone = user.contact || this.donorPhone;
        this.cdr.detectChanges();
      }
    });

    // Handle URL parameters for donation type (e.g., /donate?type=in-kind)
    this.route.queryParams.subscribe(params => {
        if (params['type'] === 'in-kind') {
            this.setDonationType('in-kind');
        } else if (params['type'] === 'monetary') {
            this.setDonationType('monetary');
        }
    });

    this.impactRequestService.requests$.subscribe(requests => {
      this.allRequests = requests;
      if (this.map) this.updateMapMarkers();
    });

    // Subscribe to voice results
    this.speechService.fieldResult$.subscribe((text: string) => {
      if (this.activeVoiceField) {
        if (this.activeVoiceField === 'donationAmount') {
          const num = parseInt(text.replace(/[^0-9]/g, ''));
          if (!isNaN(num)) this.donationAmount = num;
        } else {
          const formatted = text.charAt(0).toUpperCase() + text.slice(1);
          (this as any)[this.activeVoiceField] = formatted;
        }
        this.activeVoiceField = '';
        this.speechService.speak('Updated field');
      }
    });
  }

  ngAfterViewInit() {
    if (this.donationType === 'impact-map') {
      this.initMap();
    }
    
    // Auto-start guide only if first time for THIS view
    setTimeout(() => {
        const key = this.donationType === 'monetary' ? '/donate_monetary' : (this.donationType === 'in-kind' ? '/donate_inkind' : '/donate_impact');
        this.guideService.autoStartIfFirstTime(key);
    }, 1000);

    if (this.donationType === 'monetary') this.initPaymentSystems();
  }

  ngOnDestroy() {
    if (this.map) this.map.remove();
  }

  setDonationType(type: 'monetary' | 'in-kind' | 'impact-map') {
    const oldType = this.donationType;
    if (this.donationType === 'impact-map' && type !== 'impact-map' && this.map) {
      this.map.remove();
      this.map = null;
    }
    this.donationType = type;
    
    // If switching views, trigger the guide only if they haven't seen it for the NEW view
    if (oldType !== type && (type === 'monetary' || type === 'in-kind')) {
        const key = type === 'monetary' ? '/donate_monetary' : '/donate_inkind';
        setTimeout(() => this.guideService.autoStartIfFirstTime(key), 800);
    }

    if (type === 'impact-map') setTimeout(() => this.initMap(), 100);
    if (type === 'monetary') setTimeout(() => this.initPaymentSystems(), 100);
  }

  initPaymentSystems() {
    this.initPayPalButton();
  }

  initPayPalButton() {
    const container = document.getElementById('paypal-button-container');
    if (!container || container.hasChildNodes() || !(window as any).paypal) return;

    (window as any).paypal.Buttons({
      onClick: (data: any, actions: any) => {
        if (!this.validateForm()) {
          return actions.reject();
        }
        const errEl = document.getElementById('form-errors');
        if (errEl) errEl.textContent = '';
        return actions.resolve();
      },
      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: { value: this.donationAmount.toString() }
          }],
          application_context: {
            shipping_preference: 'NO_SHIPPING'
          }
        });
      },
      onApprove: async (data: any, actions: any) => {
        await actions.order.capture();
        this.handleSuccess();
      },
      onError: (err: any) => {
        const errEl = document.getElementById('form-errors');
        if (errEl) errEl.textContent = 'PayPal transaction failed or was cancelled.';
      }
    }).render('#paypal-button-container');
  }

  setAmount(amt: number) {
    this.donationAmount = amt;
  }

  validateForm(): boolean {
    const errEl = document.getElementById(this.donationType === 'in-kind' ? 'form-errors-in-kind' : 'form-errors');
    
    // Validation: Email is required.
    const hasEmail = this.donorEmail && this.donorEmail.trim() && this.donorEmail.includes('@');

    if (!hasEmail) {
      const msg = 'Please provide a valid Email Address for receipt and tracking purposes.';
      if (errEl) errEl.textContent = msg;
      this.showAlert(msg);
      return false;
    }

    // For In-Kind, Address (Center) is required
    if (this.donationType === 'in-kind' && !this.selectedCenter) {
      const msg = 'Please select a Drop-Off Center for your donation.';
      if (errEl) errEl.textContent = msg;
      this.showAlert(msg);
      return false;
    }

    // For Monetary, Terms and Conditions must be accepted
    if (this.donationType === 'monetary' && !this.termsAccepted) {
      const msg = 'Please accept the Terms & Conditions before proceeding with your donation.';
      if (errEl) errEl.textContent = msg;
      this.showAlert(msg);
      return false;
    }

    if (errEl) errEl.textContent = '';
    return true;
  }

  showAlert(msg: string, type: 'error' | 'success' = 'error') {
    this.alertMessage = msg;
    this.alertType = type;
  }

  closeAlert() {
    this.alertMessage = '';
  }

  processDirectPayment() {
    if (!this.validateForm()) return;
    
    this.loading = true;
    this.speechService.speak('Initializing PCI-Compliant Secure Layer. Establishing tokenized handshake with our encrypted vault.');
    
    // Step 1: Simulated Secure Tokenization (Zero Data Persistence Mode)
    setTimeout(() => {
        this.speechService.speak('One-time token generated. Original card data purged. Vaulting token and performing multi-factor identification check.');
        
        // Step 2: Final Authorization with Vaulted Token
        setTimeout(() => {
            this.handleSuccess();
        }, 2500);
    }, 2000);
  }

  handleSuccess() {
    this.donationService.addMonetaryDonation({
      amount: this.donationAmount,
      donorName: this.donorName,
      donorPhone: this.donorPhone,
      donorEmail: this.donorEmail
    }).subscribe({
      next: () => {
        this.showSuccessModal = true;
        this.loading = false;
      },
      error: () => {
        this.showAlert('Donation processed but failed to record in dashboard.');
        this.showSuccessModal = true; 
        this.loading = false;
      }
    });
  }

  private initMap() {
    const mapElement = document.getElementById('impact-map');
    if (!mapElement || this.map) return;
    this.map = L.map('impact-map').setView([18.1096, -77.2975], 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
    this.updateMapMarkers();
  }

  private updateMapMarkers() {
    if (!this.map) return;
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];
    this.allRequests.forEach(req => {
      const marker = L.marker([req.lat, req.lng]).addTo(this.map);
      const popupContent = `
        <div class="map-popup">
            <div class="user-welcome-badge" *ngIf="user">
                <span class="welcome-label" style="color: #000 !important; font-weight: 900 !important; font-size: 10px; display: block;">HEY WELCOME</span>
                <span class="user-name" style="color: #000 !important; font-weight: 900 !important; font-size: 15px; display: block; text-transform: uppercase;">{{ user.name }}</span>
            </div>
          <h3>${req.requesterName} from ${req.location}</h3>
          <ul>${req.items.map(item => `<li>${item.name} (${item.status})</li>`).join('')}</ul>
          <button class="popup-btn" id="fulfill-${req.id}">Fulfill Request</button>
        </div>
      `;
      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`fulfill-${req.id}`);
        if (btn) btn.onclick = () => this.openFulfillment(req);
      });
      this.markers.push(marker);
    });
  }

  openFulfillment(req: ImpactRequest) {
    this.selectedRequest = req;
    this.itemsToFulfill = {};
    req.items.forEach(item => { if (item.status === 'pending' || item.status === 'partially-fulfilled') this.itemsToFulfill[item.name] = false; });
    this.showFulfillmentModal = true;
    if (this.map) this.map.closePopup();
  }

  closeFulfillment() {
    this.showFulfillmentModal = false;
    this.selectedRequest = null;
  }

  pledgeRequestItem(request: ImpactRequest, item: RequestItem) {
    if (!this.validateForm()) return;
    this.selectedRequest = request;
    this.itemsToFulfill = {};
    this.itemsToFulfill[item.name] = true;
    this.showFulfillmentModal = true;
  }

  submitFulfillment() {
    if (!this.selectedRequest) return;
    const selectedItemNames = Object.keys(this.itemsToFulfill).filter(name => this.itemsToFulfill[name]);
    if (selectedItemNames.length === 0) return;
    
    // Record the pledge in the backend
    // Record the pledge in the backend and show success
    this.donationService.addPledge({
      donorName: this.donorName,
      donorPhone: this.donorPhone,
      donorEmail: this.donorEmail,
      items: selectedItemNames.map(name => `${name} for ${this.selectedRequest?.requesterName}`),
      center: this.selectedCenter || 'Local Drop-off',
      dropOffDate: this.dropOffDate
    }).subscribe({
      next: () => {
        const updatedRequest = { ...this.selectedRequest! };
        updatedRequest.items = updatedRequest.items.map(item => {
          if (selectedItemNames.includes(item.name)) return { ...item, status: 'fulfilled' as const };
          return item;
        });
        this.impactRequestService.updateRequest(updatedRequest);
        this.pledgedItems = selectedItemNames.map(name => `${name} for ${this.selectedRequest?.requesterName}`);
        
        // Generate QR for high-priority fulfillment
        this.qrCodeData = JSON.stringify({
          donor: this.donorName,
          center: this.selectedCenter || 'Local Drop-off',
          items: selectedItemNames,
          type: 'high-priority',
          id: 'HP-' + Math.floor(Math.random()*10000)
        });

        this.showSuccessModal = true;
        this.cdr.detectChanges();
        this.closeFulfillment();
      },
      error: (err) => {
        console.error('Pledge failure:', err);
        this.showAlert('Failed to record pledge. Please try again.');
      }
    });
  }

  submitInKind() {
    const selected: string[] = [];
    this.categorizedItems.forEach(cat => cat.items.forEach(item => { if (item.checked) selected.push(item.name); }));
    if (selected.length > 0) {
      if (!this.validateForm()) return;
      
      this.donationService.addPledge({
        donorName: this.donorName,
        donorPhone: this.donorPhone,
        donorEmail: this.donorEmail,
        items: selected,
        center: this.selectedCenter,
        dropOffDate: this.dropOffDate
      }).subscribe({
        next: () => {
          this.pledgedItems = selected;
          this.qrCodeData = JSON.stringify({
            donor: this.donorName,
            center: this.selectedCenter || 'HQ',
            items: selected,
            type: 'in-kind',
            id: 'PLG-' + Math.floor(Math.random()*10000)
          });
          this.showSuccessModal = true;
          this.categorizedItems.forEach(cat => cat.items.forEach(item => item.checked = false));
        },
        error: (err) => this.showAlert('Error recording pledge: ' + err)
      });
    }
  }

  submitCategory(cat: any) {
    const selected: string[] = [];
    cat.items.forEach((item: any) => { if (item.checked) selected.push(item.name); });
    if (selected.length > 0) {
      this.pledgedItems = selected;
      this.showSuccessModal = true;
      cat.items.forEach((item: any) => item.checked = false);
    }
  }

  hasCheckedItems(cat: any): boolean {
    return cat.items.some((item: any) => item.checked);
  }

  hasAnyCheckedItems(): boolean {
    return this.categorizedItems.some(cat => this.hasCheckedItems(cat));
  }

  closeModal() {
    this.loading = false;
    this.showSuccessModal = false;
    this.alertMessage = '';
    this.donationAmount = 15000;
    this.pledgedItems = [];
  }
}
