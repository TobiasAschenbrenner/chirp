import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForYouOrFollowing } from './for-you-or-following';

describe('ForYouOrFollowing', () => {
  let component: ForYouOrFollowing;
  let fixture: ComponentFixture<ForYouOrFollowing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForYouOrFollowing]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForYouOrFollowing);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
