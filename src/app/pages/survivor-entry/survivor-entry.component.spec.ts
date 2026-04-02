import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SurvivorEntryComponent } from './survivor-entry.component';

describe('SurvivorEntryComponent', () => {
  let component: SurvivorEntryComponent;
  let fixture: ComponentFixture<SurvivorEntryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SurvivorEntryComponent]
    });
    fixture = TestBed.createComponent(SurvivorEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
