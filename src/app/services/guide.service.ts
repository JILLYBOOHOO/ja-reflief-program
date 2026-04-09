import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { driver, DriveStep } from 'driver.js';
import { SpeechService } from './speech.service';
import { AccessibilityService } from './accessibility.service';


@Injectable({
  providedIn: 'root'
})
export class GuideService {
  constructor(
    private router: Router,
    private speechService: SpeechService,
    private accessibilityService: AccessibilityService
  ) {}

  private currentDriver: any;

  public startGuideForCurrentPage(force = true, key?: string) {
    const currentUrl = this.router.url.split('?')[0];
    const storageKey = key ? `guide_seen_${key}` : `guide_seen_${currentUrl}`;

    // Check if auto-start and already shown
    if (!force) {
        const hasSeen = localStorage.getItem(storageKey);
        if (hasSeen) return;
    }

    let steps: DriveStep[] = [];

    switch (currentUrl) {
      case '/':
        steps = [
          { element: '.accessibility-bar', popover: { title: 'Accessibility Toolbar', description: 'Use these controls to change font size, launch this Page Guide, or enable voice navigation. The A, A+, and A++ buttons make text bigger.' } },
          { element: '.hero-overlay', popover: { title: 'Welcome to JA Relief', description: 'This is the homepage of the Jamaica Relief disaster assistance platform. It helps Jamaicans access free WiFi, register for aid, and get emergency information.' } },
          { element: '.actions-stack', popover: { title: 'Quick Actions', description: 'These buttons let you Get WiFi Access, Make Donations, Log In to your account, or find Emergency Information. Click any button to go to that page.' } },
          { element: '.features-grid', popover: { title: 'Key Features', description: 'These cards show the main features: access free WiFi at Starlink hubs, request emergency aid supplies, or donate to help families in need.' } },
        ];
        break;

      case '/wifi-access':
        steps = [
          { element: '.accessibility-bar', popover: { title: 'Accessibility Tools', description: 'Change text size with A, A+ or A++. Click Page Guide anytime to replay this tour. Use Nav button for voice commands.' } },
          { element: '.hero-pattern', popover: { title: 'Starlink WiFi Hub', description: 'Welcome to the JA Relief Starlink Hub page. Here you can get your WiFi access code and connect to the internet for free.' } },
          { element: '.bg-white.rounded-\\[2\\.5rem\\]', popover: { title: 'Your WiFi Voucher Code', description: 'This card shows your WiFi access code. Use this code to connect to any Starlink emergency WiFi hub across Jamaica. Click Copy Code to copy it.' } },
          { element: '.grid.grid-cols-1.md\\:grid-cols-2.gap-8', popover: { title: 'WiFi Features', description: 'These cards explain the high speed access and secure encrypted connection features available at each hub location.' } },
          { element: '.lg\\:col-span-4', popover: { title: 'Dashboard and Support', description: 'On the right side you can view your voucher, check network status, see the Jamaica hub map, and contact support if you need help.' } },
        ];
        break;

      case '/register':
        steps = [
          { element: '.register-header', popover: { title: 'Registration Page', description: 'Fill out this form to register for disaster assistance. All fields marked with a star are required. You can also use voice input by clicking the microphone icons.' } },
          { element: '#fullName', popover: { title: 'Full Name', description: 'Enter your complete legal name as it appears on your ID. You can also tap the microphone icon on the right to speak your name instead of typing.' } },
          { element: '#phone', popover: { title: 'Contact Number', description: 'Enter your 10 digit Jamaican phone number so relief teams can reach you in case of emergency.' } },
          { element: '#parish_group', popover: { title: 'Select Your Parish', description: 'Choose which parish you are currently located in from the dropdown list.' } },
          { element: '#damageLevel', popover: { title: 'Damage Level', description: 'Select how severely your property or situation has been impacted. Choose Low for minor damage, Medium for moderate, or High for severe impact.' } },
          { element: '.border-emerald-100', popover: { title: 'Emergency Medical Info', description: 'This section is optional. You can provide your blood type, weight, allergies, medications, and emergency contact. This creates a digital emergency card for first responders.' } },
          { element: '.submit-btn', popover: { title: 'Submit Registration', description: 'Once all required fields are filled, click this button to complete your registration. You will then receive access to your personal dashboard.' } },
        ];
        break;

      case '/donate':
        const isInKindView = !!document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-3.gap-8');
        
        if (isInKindView) {
            steps = [
               { element: '#impact-tracker', popover: { title: 'Impact Tracker', description: 'Watch the live progress of community impact and funds raised in real time.' } },
               { element: '#high-priority-sidebar', popover: { title: 'High Priority Needs', description: 'Review the most urgent requests from families in St. Elizabeth and surrounding parishes. These items need immediate attention.' } },
               { element: '#contact-details', popover: { title: 'Your Contact Details', description: 'Enter your name, phone, and email so our fulfillment team can acknowledge your contribution.' } },
               { element: '#item-selection', popover: { title: 'In-Kind Categories', description: 'Browse and select physical items you wish to donate, such as food, water, or medical supplies.' } },
               { element: '#pledge-summary', popover: { title: 'Pledge Summary', description: 'Review your selected items and quantities, then click Confirm Pledge to finalize your donation.' } }
            ];
        } else {
            steps = [
               { element: '.donation-options', popover: { title: 'Choose Donation Type', description: 'Select between making a Monetary donation via card/PayPal, or donating In-Kind supplies like food and water.' } },
               { element: '.bg-white.rounded-3xl', popover: { title: 'Funds Live Progress', description: 'See how much has been raised and the tangible impact your donation makes on Jamaican communities.' } },
               { element: '.lg\\:col-span-8 .space-y-4', popover: { title: 'Custom Amount', description: 'Select a pre-set amount or enter a custom amount you wish to contribute to the recovery efforts.' } },
               { element: '.grid-cols-1.sm\\:grid-cols-2.gap-4', popover: { title: 'Payment Method', description: 'Choose your preferred payment method. We support PayPal and all major credit/debit cards.' } },
               { element: '.signature-gradient', popover: { title: 'Secure Payment', description: 'Click this button to go to the secure payment portal and complete your donation.' } }
            ];
        }
        break;

      case '/contact-us':
      case '/help':
        steps = [
          { element: '.contact-section h2, h1', popover: { title: 'Contact and Support', description: 'Use this page to reach out to the JA Relief team for help, report issues, or request emergency supplies.' } },
          { element: '.form-group, form', popover: { title: 'Fill the Form', description: 'Enter your name, email, location, and a message describing what assistance you need.' } },
          { element: '.submit-btn, button[type=submit]', popover: { title: 'Send Your Request', description: 'Click this button to send your request to the JA Relief operations center. You will receive a confirmation once submitted.' } }
        ];
        break;

      case '/information':
        steps = [
          { element: '.weather-animation-container', popover: { title: 'Emergency Information', description: 'This page provides live disaster alerts, emergency protocols, and contact numbers for all essential services across Jamaica.' } },
          { element: '.alert-panel', popover: { title: 'Real-time Alerts', description: 'These are the latest disaster warnings from ODPEM and the Meteorological Service of Jamaica. Stay informed and take action.' } },
          { element: '.contacts-grid', popover: { title: 'Emergency Numbers', description: 'Quickly call police at 119, fire and ambulance at 110, or the ODPEM disaster response hotline for immediate help.' } },
          { element: '.protocols-section', popover: { title: 'Safety Protocols', description: 'Learn step by step what to do during hurricanes, earthquakes, flooding, and fires to keep yourself and your family safe.' } },
          { element: '.services-section', popover: { title: 'Hospitals and Shelters', description: 'Find directions to the nearest hospitals, pharmacies, and emergency shelters on the island.' } }
        ];
        break;

      case '/login':
        steps = [
          { element: 'form, .login-form', popover: { title: 'Login Page', description: 'Enter your registered phone number and password to access your personal dashboard. From there you can view your aid status, emergency medical card, and voucher information.' } },
        ];
        break;
      
      case '/dashboard':
        steps = [
          { element: '.bg-surface-container-lowest.rounded-3xl.p-8', popover: { title: 'Success Alert', description: 'Your registration was successful. This message disappears after a few seconds.' } },
          { element: '.grid-cols-1.lg\\:grid-cols-12.gap-8', popover: { title: 'Survivor Dashboard', description: 'Welcome to your relief portal. Browse categories on the left and select items you need. The summary card on the right tracks your request.' } },
          { element: 'aside.lg\\:col-span-3.sticky', popover: { title: 'Item Selection', description: 'Use this sidebar to quickly jump between categories like Food, Water, and Medical Supplies.' } },
          { element: '#survivor-notes, textarea', popover: { title: 'Special Requirements', description: 'List any specific needs here, like prescribed medications or dietary restrictions.' } },
          { element: '.impact-btn-group button.bg-primary', popover: { title: 'Submit Request', description: 'Once you have selected all required supplies, click this button to submit your aid request to the command center.' } }
        ];
        break;

      case '/admin':
        steps = [
          { element: '.stats-grid, .grid-cols-1.md\\:grid-cols-4', popover: { title: 'Command Center Stats', description: 'Monitor total survivor registrations, total funds raised, and aid fulfillment status across the island in real-time.' } },
          { element: '.danger-zones-section', popover: { title: 'Danger Zone Management', description: 'Review reports of flooding, landslides, and road blockages. High priority areas are highlighted for immediate action.' } },
          { element: '.donations-chart', popover: { title: 'Donation Analytics', description: 'Analyze donation trends and fund allocation to ensure help reaches the most affected areas efficiently.' } },
          { element: '.survivor-requests-table, .requests-list', popover: { title: 'Request Queue', description: 'Review and approve individual requests from families. You can filter by priority, location, and urgently needed items.' } }
        ];
        break;

      default:
        steps = [
          { element: 'body', popover: { title: 'Page Guide', description: 'Welcome! Click Next to learn about the features on this page. Each step will highlight a section and explain how to use it with both text and voice.' } }
        ];
    }

    this.currentDriver = driver({
      showProgress: true,
      animate: true,
      steps: steps,
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: 'Done ✓',
      onNextClick: (element, step, { config, state }) => {
          if (state.activeIndex === (config.steps?.length || 0) - 1) {
              localStorage.setItem(storageKey, 'true');
          }
          this.currentDriver.moveNext();
      },
      onDestroyStarted: () => {
        window.speechSynthesis.cancel();
        // Also mark as seen if user closes it early (skipped)
        localStorage.setItem(storageKey, 'true');
        this.currentDriver.destroy();
        this.currentDriver = null;
      },
      onHighlightStarted: (element, step) => {
        // Page Guide ONLY speaks if audio is enabled
        if (step.popover?.description && this.accessibilityService.isAudioEnabled) {
            window.speechSynthesis.cancel();
            this.speechService.speak((step.popover.title || '') + '. ' + step.popover.description);
        }
      }
    });

    this.currentDriver.drive();
  }

  public prevStep() {
    if (this.currentDriver) {
      this.currentDriver.movePrevious();
    }
  }

  public autoStartIfFirstTime(key?: string) {
    // Guide is only shown on explicit user request — not auto-started
  }

  public resetGuideStatus(path: string) {
    localStorage.removeItem(`guide_seen_${path}`);
  }
}
