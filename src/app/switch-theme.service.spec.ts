import { TestBed } from '@angular/core/testing';

import { SwitchThemeService } from './switch-theme.service';

describe('SwitchThemeService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SwitchThemeService = TestBed.get(SwitchThemeService);
    expect(service).toBeTruthy();
  });
});
