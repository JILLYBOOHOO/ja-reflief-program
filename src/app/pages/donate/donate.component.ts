import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ImpactRequestService, ImpactRequest, RequestItem } from '../../services/impact-request.service';

declare var L: any;

@Component({
  selector: 'app-donate',
  templateUrl: './donate.component.html',
  styleUrls: ['./donate.component.css']
})
export class DonateComponent implements OnInit, AfterViewInit, OnDestroy {
  donationType: 'monetary' | 'in-kind' | 'impact-map' = 'monetary'; // Default to monetary as requested
  selectedPaymentMethod: string = 'paypal';
  showSuccessModal: boolean = false;
  alertMessage: string = '';
  donationAmount: number = 1000;
  pledgedItems: string[] = [];
  loading: boolean = false;

  donorName: string = '';
  donorPhone: string = '';
  donorEmail: string = '';
  dropOffDate: string = '';
  selectedCenter: string = '';

  donationCenters = [
    { id: 'kingston', name: 'Kingston: JA RELIEF Warehouse, 123 Hope Road' },
    { id: 'mobay', name: 'Montego Bay: Community Center, 45 Barnett Street' },
    { id: 'mandeville', name: 'Mandeville: Parish Church Hall, 1 Ward Avenue' },
    { id: 'st_ann', name: 'St. Ann\'s Bay: Methodist Church, 10 Main Street' }
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
      category: 'Liquid',
      icon: '🧃',
      items: [
        { name: 'Water', icon: '💧', checked: false },
        { name: 'Juice', icon: '🧃', checked: false },
        { name: 'Syrup', icon: '🍯', checked: false },
        { name: 'Oil', icon: '🛢️', checked: false }
      ]
    },
    {
      category: 'Dry Food',
      icon: '🌾',
      items: [
        { name: 'Oats', icon: '🥣', checked: false },
        { name: 'Macaroni', icon: '🍝', checked: false },
        { name: 'Noodles', icon: '🍜', checked: false },
        { name: 'Flour', icon: '🌾', checked: false },
        { name: 'Rice', icon: '🍚', checked: false },
        { name: 'Cornmeal', icon: '🌽', checked: false },
        { name: 'Cornflakes', icon: '🥣', checked: false }
      ]
    },
    {
      category: 'Canned/Tin Items',
      icon: '🥫',
      items: [
        { name: 'Baked Beans', icon: '🥫', checked: false },
        { name: 'Red Peas', icon: '🫘', checked: false },
        { name: 'Broad Bean', icon: '🫘', checked: false },
        { name: 'Sardines', icon: '🐟', checked: false },
        { name: 'Tin Mackerel', icon: '🐟', checked: false },
        { name: 'Spam', icon: '🍖', checked: false },
        { name: 'Corned Beef', icon: '🥩', checked: false },
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
        { name: 'Blankets', icon: '🛌', checked: false }
      ]
    }
  ];

  paymentMethods = [
    { id: 'paypal', name: 'PayPal & Cards', icon: '🅿️' }
  ];

  constructor(private impactRequestService: ImpactRequestService) { }

  ngOnInit() {
    this.impactRequestService.requests$.subscribe(requests => {
      this.allRequests = requests;
      if (this.map) this.updateMapMarkers();
    });
  }

  ngAfterViewInit() {
    if (this.donationType === 'impact-map') this.initMap();
    if (this.donationType === 'monetary') this.initPaymentSystems();
  }

  ngOnDestroy() {
    if (this.map) this.map.remove();
  }

  setDonationType(type: 'monetary' | 'in-kind' | 'impact-map') {
    if (this.donationType === 'impact-map' && type !== 'impact-map' && this.map) {
      this.map.remove();
      this.map = null;
    }
    this.donationType = type;
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
    const errEl = document.getElementById('form-errors');
    if (!this.donorName || !this.donorName.trim()) {
      const msg = 'Please enter your Full Name.';
      if (errEl) errEl.textContent = msg;
      this.showAlert(msg);
      return false;
    }
    if (!this.donorPhone || !this.donorPhone.trim()) {
      const msg = 'Please enter your Phone Number.';
      if (errEl) errEl.textContent = msg;
      this.showAlert(msg);
      return false;
    }
    if (!this.donorEmail || !this.donorEmail.trim() || !this.donorEmail.includes('@')) {
      const msg = 'Please enter a valid Email Address.';
      if (errEl) errEl.textContent = msg;
      this.showAlert(msg);
      return false;
    }
    if (errEl) errEl.textContent = '';
    return true;
  }

  showAlert(msg: string) {
    this.alertMessage = msg;
  }

  closeAlert() {
    this.alertMessage = '';
  }

  handleSuccess() {
    this.showSuccessModal = true;
    this.loading = false;
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
    this.selectedRequest = request;
    this.itemsToFulfill = {};
    this.itemsToFulfill[item.name] = true;
    this.showFulfillmentModal = true;
  }

  submitFulfillment() {
    if (!this.selectedRequest) return;
    const selectedItemNames = Object.keys(this.itemsToFulfill).filter(name => this.itemsToFulfill[name]);
    if (selectedItemNames.length === 0) return;
    const updatedRequest = { ...this.selectedRequest };
    updatedRequest.items = updatedRequest.items.map(item => {
      if (selectedItemNames.includes(item.name)) return { ...item, status: 'fulfilled' as const };
      return item;
    });
    this.impactRequestService.updateRequest(updatedRequest);
    this.pledgedItems = selectedItemNames.map(name => `${name} for ${this.selectedRequest?.requesterName}`);
    this.showSuccessModal = true;
    this.closeFulfillment();
  }

  submitInKind() {
    const selected: string[] = [];
    this.categorizedItems.forEach(cat => cat.items.forEach(item => { if (item.checked) selected.push(item.name); }));
    if (selected.length > 0) {
      this.pledgedItems = selected;
      this.showSuccessModal = true;
      this.categorizedItems.forEach(cat => cat.items.forEach(item => item.checked = false));
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
    this.donationAmount = 25;
    this.pledgedItems = [];
  }
}
