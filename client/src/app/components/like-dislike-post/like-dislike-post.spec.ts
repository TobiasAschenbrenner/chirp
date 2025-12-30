import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LikeDislikePost } from './like-dislike-post';

describe('LikeDislikePost', () => {
  let component: LikeDislikePost;
  let fixture: ComponentFixture<LikeDislikePost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LikeDislikePost]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LikeDislikePost);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
