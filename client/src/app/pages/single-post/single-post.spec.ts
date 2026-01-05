import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { SinglePost } from './single-post';
import { Posts } from '../../services/posts/posts';
import { Comments as CommentsApi } from '../../services/comments/comments';
import { Users } from '../../services/users/users';

describe('SinglePost', () => {
  let postsApi: any;
  let commentsApi: any;

  const mockPost = {
    _id: 'p1',
    body: 'Hello world',
    createdAt: '2024-01-01',
    creator: { _id: 'u1', fullName: 'Alice', profilePhoto: null },
    comments: [],
  };

  beforeEach(async () => {
    postsApi = {
      getPost: vi.fn(),
    };

    commentsApi = {
      createComment: vi.fn(),
      deleteComment: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SinglePost],
      providers: [
        { provide: Posts, useValue: postsApi },
        { provide: CommentsApi, useValue: commentsApi },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: vi.fn().mockReturnValue('p1'),
              },
            },
          },
        },
        {
          provide: Users,
          useValue: {
            isBookmarked: vi.fn().mockReturnValue(false),
            getUser: vi
              .fn()
              .mockReturnValue(of({ _id: 'u1', fullName: 'User', profilePhoto: null })),
          },
        },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    postsApi.getPost.mockReturnValue(of(mockPost));

    const fixture = TestBed.createComponent(SinglePost);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load post on init', () => {
    postsApi.getPost.mockReturnValue(of(mockPost));

    const fixture = TestBed.createComponent(SinglePost);
    fixture.detectChanges();

    const cmp = fixture.componentInstance;
    expect(postsApi.getPost).toHaveBeenCalledWith('p1');
    expect(cmp.post()?._id).toBe('p1');
  });

  it('should set error when loading fails', () => {
    postsApi.getPost.mockReturnValue(throwError(() => ({ error: { message: 'Boom' } })));

    const fixture = TestBed.createComponent(SinglePost);
    fixture.detectChanges();

    const cmp = fixture.componentInstance;
    expect(cmp.error()).toBe('Boom');
  });

  it('should create a comment and prepend it', () => {
    postsApi.getPost.mockReturnValue(of(mockPost));

    const newComment = {
      _id: 'c1',
      comment: 'Nice post',
      creator: 'u1',
    };

    commentsApi.createComment.mockReturnValue(of(newComment));

    const fixture = TestBed.createComponent(SinglePost);
    fixture.detectChanges();

    const cmp = fixture.componentInstance;
    cmp.commentText.set('Nice post');
    cmp.createComment();

    expect(commentsApi.createComment).toHaveBeenCalledWith('p1', 'Nice post');
    expect(cmp.comments()[0]._id).toBe('c1');
    expect(cmp.commentText()).toBe('');
  });

  it('should delete a comment', () => {
    postsApi.getPost.mockReturnValue(
      of({ ...mockPost, comments: [{ _id: 'c1', comment: 'Hi', creator: 'u1' }] })
    );

    commentsApi.deleteComment.mockReturnValue(of(null));

    const fixture = TestBed.createComponent(SinglePost);
    fixture.detectChanges();

    const cmp = fixture.componentInstance;
    cmp.deleteComment('c1');

    expect(commentsApi.deleteComment).toHaveBeenCalledWith('c1');
    expect(cmp.comments().length).toBe(0);
  });
});
