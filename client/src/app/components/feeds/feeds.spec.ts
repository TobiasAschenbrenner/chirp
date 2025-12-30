import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Feeds } from './feeds';

describe('Feeds', () => {
  let component: Feeds;
  let fixture: ComponentFixture<Feeds>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Feeds]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Feeds);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
