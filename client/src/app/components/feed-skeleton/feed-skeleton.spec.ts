import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { FeedSkeleton } from './feed-skeleton';

describe('FeedSkeleton', () => {
  let fixture: ComponentFixture<FeedSkeleton>;
  let component: FeedSkeleton;

  const countArticles = () =>
    fixture.nativeElement.querySelectorAll('article.feed.skeleton').length;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedSkeleton],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedSkeleton);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render default count (3) on init', () => {
    fixture.detectChanges();
    expect(component.items.length).toBe(3);
    expect(countArticles()).toBe(3);
  });

  it('should render the provided count on init', () => {
    component.count = 5;
    fixture.detectChanges();
    expect(component.items.length).toBe(5);
    expect(countArticles()).toBe(5);
  });

  it('should update items when count changes', () => {
    const fixture = TestBed.createComponent(FeedSkeleton);

    fixture.componentRef.setInput('count', 3);
    fixture.detectChanges();

    expect(fixture.componentInstance.items).toEqual([0, 1, 2]);

    fixture.componentRef.setInput('count', 1);
    fixture.detectChanges();

    expect(fixture.componentInstance.items).toEqual([0]);
  });

  it('should handle count = 0', () => {
    component.count = 0;
    fixture.detectChanges();
    expect(component.items).toEqual([]);
    expect(countArticles()).toBe(0);
  });
});
