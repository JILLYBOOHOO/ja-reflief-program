import { Component, OnInit } from '@angular/core';
import { AccessibilityService, FontSize } from '../../services/accessibility.service';
import { SpeechService } from '../../services/speech.service';
import { GuideService } from '../../services/guide.service';

@Component({
  selector: 'app-accessibility-toolbar',
  templateUrl: './accessibility-toolbar.component.html',
  styleUrls: ['./accessibility-toolbar.component.css']
})
export class AccessibilityToolbarComponent implements OnInit {
  currentSize: FontSize = 'normal';

  constructor(
    public accessibilityService: AccessibilityService,
    public speechService: SpeechService,
    private guideService: GuideService
  ) {}

  ngOnInit() {
    this.accessibilityService.fontSize$.subscribe(size => {
      this.currentSize = size;
    });
  }

  setSize(size: FontSize) {
    this.accessibilityService.setFontSize(size);
  }

  toggleAudio() {
    this.accessibilityService.toggleAudio();
  }


  toggleVoice() {
    this.speechService.toggleListening('Listening');
  }

  readPage() {
    this.speechService.toggleReadPage();
  }

  startGuide() {
    this.guideService.startGuideForCurrentPage();
  }

  backStep() {
    this.guideService.prevStep();
  }
}
