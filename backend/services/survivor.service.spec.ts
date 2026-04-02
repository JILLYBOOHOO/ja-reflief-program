import { TestBed } from '@angular/core/testing';

import { SurvivorService } from './survivor.service';

describe('SurvivorService', () => {
  let service: SurvivorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SurvivorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
