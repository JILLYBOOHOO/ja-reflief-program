import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WifiAccessComponent } from './wifi-access.component';

describe('WifiAccessComponent', () => {
  let component: WifiAccessComponent;
  let fixture: ComponentFixture<WifiAccessComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WifiAccessComponent]
    });
    fixture = TestBed.createComponent(WifiAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
