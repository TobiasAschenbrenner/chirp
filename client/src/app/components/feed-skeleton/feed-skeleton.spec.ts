import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedSkeleton } from './feed-skeleton';

describe('FeedSkeleton', () => {
  let component: FeedSkeleton;
  let fixture: ComponentFixture<FeedSkeleton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedSkeleton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeedSkeleton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
