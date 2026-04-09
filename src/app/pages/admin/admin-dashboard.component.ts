import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WeatherService, WeatherState } from '../../services/weather.service';
import { UpdateService, AlertUpdate } from '../../services/update.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ImpactRequestService, ImpactRequest, RequestItem } from '../../services/impact-request.service';
import { HazardService, HazardReport } from '../../services/hazard.service';
import { GuideService } from '../../services/guide.service';
import { DonationService, PledgeDonation } from '../../services/donation.service';
import { HttpClient } from '@angular/common/http';


// Full pantry inventory list matching Donate In-Kind page
const FULL_PANTRY: { name: string; emoji: string; category: string; quantity: number; unit: string }[] = [
  // Beverages/Liquids
  { name: 'Water', emoji: '💧', category: 'Liquids', quantity: 450, unit: 'units' },
  { name: 'Syrup', emoji: '🍯', category: 'Liquids', quantity: 80, unit: 'bottles' },
  { name: 'Juice / Tin Juice', emoji: '🧃', category: 'Liquids', quantity: 120, unit: 'tins' },
  { name: 'Malta', emoji: '🥤', category: 'Liquids', quantity: 95, unit: 'bottles' },
  { name: 'Oil', emoji: '🛢️', category: 'Liquids', quantity: 60, unit: 'bottles' },
  // Staples & Grains
  { name: 'Rice / Flour', emoji: '🌾', category: 'Staples & Grains', quantity: 120, unit: 'bags' },
  { name: 'Sugar / Cornmeal', emoji: '🌽', category: 'Staples & Grains', quantity: 75, unit: 'bags' },
  { name: 'Oats / Noodles', emoji: '🥣', category: 'Staples & Grains', quantity: 55, unit: 'packs' },
  { name: 'Macaroni and Cheese', emoji: '🍝', category: 'Staples & Grains', quantity: 40, unit: 'boxes' },
  { name: 'Cornflakes', emoji: '🥣', category: 'Staples & Grains', quantity: 30, unit: 'boxes' },
  // Canned/Tin Items
  { name: 'Tin Milk', emoji: '🥛', category: 'Canned/Tin Items', quantity: 215, unit: 'tins' },
  { name: 'Baked Beans', emoji: '🥫', category: 'Canned/Tin Items', quantity: 180, unit: 'tins' },
  { name: 'Red Peas', emoji: '🫘', category: 'Canned/Tin Items', quantity: 145, unit: 'tins' },
  { name: 'Broad Bean', emoji: '🫘', category: 'Canned/Tin Items', quantity: 90, unit: 'tins' },
  { name: 'Corned Beef', emoji: '🥩', category: 'Canned/Tin Items', quantity: 110, unit: 'tins' },
  { name: 'Tin Mackerel', emoji: '🐟', category: 'Canned/Tin Items', quantity: 135, unit: 'tins' },
  { name: 'Sardines', emoji: '🐟', category: 'Canned/Tin Items', quantity: 98, unit: 'tins' },
  { name: 'Tuna', emoji: '🐟', category: 'Canned/Tin Items', quantity: 76, unit: 'tins' },
  { name: 'Spam', emoji: '🍖', category: 'Canned/Tin Items', quantity: 55, unit: 'tins' },
  { name: 'Sausages', emoji: '🌭', category: 'Canned/Tin Items', quantity: 40, unit: 'packs' },
  // Emergency Supplies
  { name: 'Flashlights', emoji: '🔦', category: 'Emergency Supplies', quantity: 65, unit: 'units' },
  { name: 'Batteries', emoji: '🔋', category: 'Emergency Supplies', quantity: 200, unit: 'packs' },
  { name: 'Portable phone chargers', emoji: '🔌', category: 'Emergency Supplies', quantity: 30, unit: 'units' },
  { name: 'Battery-powered radios', emoji: '📻', category: 'Emergency Supplies', quantity: 18, unit: 'units' },
  { name: 'Candles and matches', emoji: '🕯️', category: 'Emergency Supplies', quantity: 90, unit: 'packs' },
  { name: 'Blankets', emoji: '🛌', category: 'Emergency Supplies', quantity: 75, unit: 'units' },
  { name: 'Sleeping mats', emoji: '😴', category: 'Emergency Supplies', quantity: 45, unit: 'units' },
  // Health & First Aid
  { name: 'First aid kits', emoji: '🩹', category: 'Health & First Aid', quantity: 45, unit: 'kits' },
  { name: 'Bandages and gauze', emoji: '🧤', category: 'Health & First Aid', quantity: 120, unit: 'rolls' },
  { name: 'Antiseptic wipes', emoji: '🧼', category: 'Health & First Aid', quantity: 85, unit: 'packs' },
  { name: 'Pain relievers', emoji: '💊', category: 'Health & First Aid', quantity: 60, unit: 'boxes' },
  { name: 'Thermometers', emoji: '🌡️', category: 'Health & First Aid', quantity: 25, unit: 'units' },
  { name: 'Disposable gloves', emoji: '🧤', category: 'Health & First Aid', quantity: 150, unit: 'boxes' },
  // Hygiene
  { name: 'Soap', emoji: '🧼', category: 'Hygiene', quantity: 200, unit: 'bars' },
  { name: 'Toothbrush', emoji: '🪥', category: 'Hygiene', quantity: 120, unit: 'units' },
  { name: 'Toothpaste', emoji: '🧴', category: 'Hygiene', quantity: 90, unit: 'tubes' },
  { name: 'Hand sanitizer', emoji: '🧼', category: 'Hygiene', quantity: 75, unit: 'bottles' },
  { name: 'Toilet paper', emoji: '🧻', category: 'Hygiene', quantity: 300, unit: 'rolls' },
  { name: 'Sanitary pads', emoji: '🩹', category: 'Hygiene', quantity: 80, unit: 'packs' },
  // Cleaning Supplies
  { name: 'Bleach', emoji: '🧴', category: 'Cleaning Supplies', quantity: 55, unit: 'bottles' },
  { name: 'Detergent', emoji: '🧼', category: 'Cleaning Supplies', quantity: 40, unit: 'boxes' },
  { name: 'Scrub brushes', emoji: '🪥', category: 'Cleaning Supplies', quantity: 30, unit: 'units' },
  // Baby & Senior Care
  { name: 'Baby Formula', emoji: '🍼', category: 'Baby & Senior Care', quantity: 35, unit: 'tins' },
  { name: 'Diapers', emoji: '👶', category: 'Baby & Senior Care', quantity: 80, unit: 'packs' },
  { name: 'Adult Diapers', emoji: '👵', category: 'Baby & Senior Care', quantity: 25, unit: 'packs' },
  // Clothing & Blankets
  { name: 'Adult Clothing', emoji: '👕', category: 'Clothing & Blankets', quantity: 150, unit: 'items' },
  { name: 'Children Clothing', emoji: '👕', category: 'Clothing & Blankets', quantity: 95, unit: 'items' },
  { name: 'Blankets', emoji: '🛌', category: 'Clothing & Blankets', quantity: 85, unit: 'units' },
  { name: 'Rags', emoji: '🧹', category: 'Clothing & Blankets', quantity: 60, unit: 'pieces' },
  { name: 'Socks', emoji: '🧦', category: 'Clothing & Blankets', quantity: 120, unit: 'pairs' },
  // Fresh Fruits
  { name: 'Orange', emoji: '🍊', category: 'Fresh Fruits', quantity: 200, unit: 'units' },
  { name: 'Watermelon', emoji: '🍉', category: 'Fresh Fruits', quantity: 30, unit: 'units' },
  { name: 'Coconut', emoji: '🥥', category: 'Fresh Fruits', quantity: 60, unit: 'units' },
  { name: 'Ripe Banana', emoji: '🍌', category: 'Fresh Fruits', quantity: 80, unit: 'bunches' },
  // Ground Provision
  { name: 'Yam', emoji: '🥔', category: 'Ground Provision', quantity: 70, unit: 'lbs' },
  { name: 'Green Banana', emoji: '🍌', category: 'Ground Provision', quantity: 55, unit: 'bunches' },
  { name: 'Irish Potatoes', emoji: '🥔', category: 'Ground Provision', quantity: 45, unit: 'lbs' },
  { name: 'Sweet Potatoes', emoji: '🍠', category: 'Ground Provision', quantity: 40, unit: 'lbs' },
];

// Group pantry by category for display
function groupByCategory(items: typeof FULL_PANTRY) {
  const map: { [cat: string]: typeof FULL_PANTRY } = {};
  items.forEach(item => {
    if (!map[item.category]) map[item.category] = [];
    map[item.category].push(item);
  });
  return Object.entries(map).map(([category, items]) => ({ category, items }));
}

@Component({
    selector: 'app-admin-dashboard',
    templateUrl: './admin-dashboard.component.html',
    styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
    updateForm: FormGroup;
    editForm: FormGroup;
    currentWeather: WeatherState = 'sunny';
    updates: AlertUpdate[] = [];
    allRequests: ImpactRequest[] = [];
    hazardReports: HazardReport[] = [];
    isEditModalOpen = false;
    editingUpdate: AlertUpdate | null = null;

    // Live pledge donations from DonationService
    livePledges: PledgeDonation[] = [];
    totalMonetary: number = 0;

    // Full pantry inventory (all items from donate page)
    pantryCategories = groupByCategory(FULL_PANTRY);
    get totalPantryUnits() {
      return FULL_PANTRY.reduce((sum, i) => sum + i.quantity, 0);
    }

    stats: any = {
      monetary: { total: 0 },
      pledges: [],
      survivors: [],
      inventoryCount: 0
    };

    // Platform analytics KPIs
    analytics = {
      visitors: 1247,
      visitorsToday: 83,
      registered: 318,
      registeredToday: 12,
      donations: 47,
      donationsMonetary: 23,
      donationsInKind: 24,
      failedLogins: 7
    };

    // Pantry search & filter state
    pantrySearch: string = '';
    pantryFilter: string = 'all';
    pantryFilterCategories: string[] = [
      'all', 'Liquids', 'Staples & Grains', 'Canned/Tin Items',
      'Emergency Supplies', 'Health & First Aid', 'Hygiene',
      'Cleaning Supplies', 'Baby & Senior Care', 'Clothing & Blankets',
      'Fresh Fruits', 'Ground Provision'
    ];
    filteredPantryItems = [...FULL_PANTRY];

    isScannerOpen = false;
    scannerStatus = 'Waiting for QR Code...';

    openScanner() {
      this.isScannerOpen = true;
      this.scannerStatus = 'Scanning for QR Code...';
      
      // Simulate finding a QR code after a delay
      setTimeout(() => {
        this.scannerStatus = 'QR Code Detected. Verifying...';
        
        // Simulate verification and inventory update
        setTimeout(() => {
          this.scannerStatus = 'Verified! Items added to Inventory.';
          
          // Add some mock items from the scan
          const water = FULL_PANTRY.find(i => i.name === 'Water (5L)');
          if (water) water.quantity += 5;
          const blankets = FULL_PANTRY.find(i => i.name === 'Blankets');
          if (blankets) blankets.quantity += 3;
          
          this.applyPantryFilter();
          
          // Close after showing success
          setTimeout(() => {
            this.closeScanner();
          }, 1500);
        }, 1500);
      }, 2000);
    }

    closeScanner() {
      this.isScannerOpen = false;
      this.scannerStatus = 'Waiting for QR Code...';
    }

    onPantrySearch() {
      this.applyPantryFilter();
    }

    setPantryFilter(cat: string) {
      this.pantryFilter = cat;
      this.applyPantryFilter();
    }

    private applyPantryFilter() {
      const q = this.pantrySearch.toLowerCase().trim();
      this.filteredPantryItems = FULL_PANTRY.filter(item => {
        const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
        const matchesFilter = this.pantryFilter === 'all' || item.category === this.pantryFilter;
        return matchesSearch && matchesFilter;
      });
    }

    constructor(
        private fb: FormBuilder,
        private weatherService: WeatherService,
        private updateService: UpdateService,
        private authService: AuthService,
        private impactRequestService: ImpactRequestService,
        private hazardService: HazardService,
        private router: Router,
        private guideService: GuideService,
        private donationService: DonationService,
        private http: HttpClient
    ) {
        this.updateForm = this.fb.group({
            title: ['', Validators.required],
            source: ['ODPEM', Validators.required],
            content: ['', Validators.required],
            status: ['info', Validators.required]
        });

        this.editForm = this.fb.group({
            id: [''],
            title: ['', Validators.required],
            source: ['', Validators.required],
            content: ['', Validators.required],
            status: ['info', Validators.required]
        });
    }

    ngOnInit() {
        // Only allow admins
        const user = this.authService.currentUserValue;
        if (!user || (user.role !== 'admin' && user.role !== 'agent')) {
            this.router.navigate(['/login']);
            return;
        }

        this.weatherService.weather$.subscribe(w => this.currentWeather = w);
        this.updateService.updates$.subscribe(u => this.updates = u);
        this.impactRequestService.requests$.subscribe(r => this.allRequests = r);

        // Subscribe to live donation feeds from DonationService
        this.donationService.pledges$.subscribe(pledges => {
          this.livePledges = pledges;
          // Also update stats.pledges to keep the in-kind table populated
          this.stats = {
            ...this.stats,
            pledges: pledges.map(p => ({
              donorName: p.donorName,
              donorPhone: p.donorPhone,
              items: Array.isArray(p.items) ? p.items.join(', ') : p.items,
              center: p.center,
              createdAt: p.createdAt
            }))
          };
        });

        this.donationService.monetary$.subscribe(donations => {
          this.totalMonetary = donations.reduce((sum, d) => sum + d.amount, 0) || 15450;
          this.stats = { ...this.stats, monetary: { total: this.totalMonetary } };
        });

        this.fetchHazardReports();
        this.fetchDashboardStats();
        this.fetchPantryRequests();
        
        // AUTO-REFRESH FOR PANTRY LOGISTICS
        setInterval(() => this.fetchPantryRequests(), 5000);
    }

    pantryRequests: any[] = [];
    fetchPantryRequests() {
      this.authService.getAllPantryRequests().subscribe({
        next: (reqs) => this.pantryRequests = reqs,
        error: (err) => console.error('Failed to fetch pantry requests:', err)
      });
    }

    updatePantryStatus(id: number, status: string) {
      this.authService.updatePantryRequestStatus(id, status).subscribe({
        next: () => this.fetchPantryRequests(),
        error: (err) => alert('Status update failed: ' + err)
      });
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.guideService.autoStartIfFirstTime();
        }, 1000);
    }

    fetchDashboardStats() {
      this.http.get('http://localhost:3000/api/admin/dashboard-stats').subscribe({
        next: (res: any) => {
          this.stats = {
            ...res,
            // Merge live pledges from DonationService if backend has fewer entries
            pledges: res.pledges?.length > 0 ? res.pledges : this.stats.pledges
          };
          if (!this.stats.monetary?.total) {
            this.stats.monetary = { total: this.totalMonetary || 15450 };
          }
        },
        error: () => {
          console.warn('Backend for stats unreachable - using live donation service data');
          if (this.stats.pledges.length === 0) {
            this.stats = {
              ...this.stats,
              monetary: { total: this.totalMonetary || 15450 },
              pledges: [
                { donorName: 'John Doe', items: 'Rice, Flour, Water', center: 'Kingston Hub', createdAt: Date.now() - 3600000 },
                { donorName: 'Sarah Smith', items: 'Medical Supplies', center: 'St. James Center', createdAt: Date.now() - 7200000 }
              ]
            };
          }
        }
      });
    }

    fetchHazardReports() {
        this.hazardService.getAllReports().subscribe({
          next: reports => {
            this.hazardReports = reports;
            if (this.hazardReports.length === 0) this.hazardReports = this.getMockHazards();
          },
          error: () => this.hazardReports = this.getMockHazards()
        });
    }

    private getMockHazards(): HazardReport[] {
      return [{
        id: 999,
        dangerType: 'Flooding',
        description: 'SEVERE FLOODING - DANGER ZONE',
        location: 'Bog Walk Gorge',
        status: 'Reported',
        createdAt: new Date().toISOString()
      }, {
        id: 1000,
        dangerType: 'Landslide',
        description: 'LANDSLIDE BLOCKED ROAD',
        location: 'Castleton, St. Mary',
        status: 'Under Review',
        createdAt: new Date().toISOString()
      }];
    }

    updateHazardStatus(id: number, status: string) {
        this.hazardService.updateStatus(id, status).subscribe(() => {
            this.fetchHazardReports();
        });
    }

    get recentUpdates() {
        return this.updates.slice(0, 5);
    }

    setWeather(state: string) {
        this.weatherService.setWeather(state as WeatherState);
    }

    openEditModal(update: AlertUpdate) {
        this.editingUpdate = update;
        this.editForm.patchValue({
            id: update.id,
            title: update.title,
            source: update.source,
            content: update.content,
            status: update.status
        });
        this.isEditModalOpen = true;
    }

    closeEditModal() {
        this.isEditModalOpen = false;
        this.editingUpdate = null;
    }

    onUpdateSave() {
        if (this.editForm.valid) {
            this.updateService.updateUpdate(this.editForm.value);
            this.closeEditModal();
        }
    }

    onSubmit() {
        if (this.updateForm.valid) {
            this.updateService.addUpdate(this.updateForm.value);
            this.updateForm.reset({ source: 'ODPEM', status: 'info' });
        }
    }

    deleteUpdate(id: string) {
        if (confirm('Delete this broadcast?')) {
            this.updateService.deleteUpdate(id);
            if (this.isEditModalOpen) this.closeEditModal();
        }
    }

    markAsReceived(request: ImpactRequest, item: RequestItem) {
        const updatedRequest = { ...request };
        updatedRequest.items = updatedRequest.items.map(i => {
            if (i.name === item.name) {
                return { ...i, status: 'received' as const };
            }
            return i;
        });
        this.impactRequestService.updateRequest(updatedRequest);
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
