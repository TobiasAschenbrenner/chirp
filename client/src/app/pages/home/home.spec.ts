import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Home } from './home';
import { Posts } from '../../services/posts/posts';
import { Post, PostPage } from '../../models/post.model';
import { CreatePost } from '../../components/create-post/create-post';
import { Auth } from '../../services/auth/auth';
import { Users } from '../../services/users/users';

const makePost = (id: string): Post => ({
  _id: id, creator: 'author', body: id, image: '', likes: [], comments: [],
});

describe('Home', () => {
  const postsApi = { getPosts: vi.fn(), getFollowingPosts: vi.fn(), createPost: vi.fn() };

  beforeEach(async () => {
    postsApi.getPosts.mockReset().mockReturnValue(of({ posts: [], nextCursor: null }));
    postsApi.getFollowingPosts.mockReset().mockReturnValue(of({ posts: [], nextCursor: null }));
    postsApi.createPost.mockReset();
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [{ provide: Posts, useValue: postsApi }],
    }).overrideComponent(Home, { set: { imports: [], template: '' } }).compileComponents();
  });

  function createHome() {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    return fixture;
  }

  it('appends pages without duplicates and stops at the end', () => {
    postsApi.getPosts.mockReturnValueOnce(of({ posts: [makePost('p1')], nextCursor: 'p1' }));
    const home = createHome().componentInstance;
    postsApi.getPosts.mockReturnValueOnce(of({
      posts: [makePost('p1'), makePost('p2')], nextCursor: null,
    }));
    home.loadMorePosts();
    home.loadMorePosts();
    expect(home.posts().map((post) => post._id)).toEqual(['p1', 'p2']);
    expect(postsApi.getPosts).toHaveBeenLastCalledWith('p1');
    expect(postsApi.getPosts).toHaveBeenCalledTimes(2);
    expect(home.hasMore()).toBe(false);
  });

  it('prevents duplicate requests while a page is loading', () => {
    postsApi.getPosts.mockReturnValueOnce(of({ posts: [makePost('p1')], nextCursor: 'p1' }));
    const home = createHome().componentInstance;
    const nextPage = new Subject<PostPage>();
    postsApi.getPosts.mockReturnValueOnce(nextPage);
    home.loadMorePosts();
    home.loadMorePosts();
    expect(postsApi.getPosts).toHaveBeenCalledTimes(2);
    expect(home.loadingMore()).toBe(true);
    expect(home.posts()).toHaveLength(1);
    nextPage.next({ posts: [makePost('p2')], nextCursor: null });
    nextPage.complete();
    expect(home.loadingMore()).toBe(false);
  });

  it('cancels stale requests and starts a fresh page when switching feeds', () => {
    const initialRequest = new Subject<PostPage>();
    postsApi.getPosts.mockReturnValueOnce(initialRequest);
    postsApi.getFollowingPosts.mockReturnValueOnce(of({
      posts: [makePost('following')], nextCursor: 'following-cursor',
    }));
    const home = createHome().componentInstance;
    home.onModeChange('following');
    initialRequest.next({ posts: [makePost('stale')], nextCursor: 'stale-cursor' });
    expect(home.posts().map((post) => post._id)).toEqual(['following']);
    expect(home.loading()).toBe(false);
    expect(postsApi.getFollowingPosts).toHaveBeenCalledWith(undefined);
    postsApi.getPosts.mockReturnValueOnce(of({ posts: [], nextCursor: null }));
    home.onModeChange('foryou');
    expect(postsApi.getPosts).toHaveBeenLastCalledWith(undefined);
    expect(home.posts()).toEqual([]);
    expect(home.hasMore()).toBe(false);
  });

  it('keeps loaded posts and retries the same cursor after a failed next page', () => {
    postsApi.getPosts.mockReturnValueOnce(of({ posts: [makePost('p1')], nextCursor: 'p1' }));
    const home = createHome().componentInstance;
    postsApi.getPosts.mockReturnValueOnce(throwError(() => ({
      error: { message: 'Temporarily unavailable' },
    })));
    home.loadMorePosts();
    expect(home.posts()).toHaveLength(1);
    expect(home.feedError()).toBe('Couldn’t load more posts.');
    expect(home.loadingMore()).toBe(false);
    postsApi.getPosts.mockReturnValueOnce(of({ posts: [makePost('p2')], nextCursor: null }));
    home.retryPosts();
    expect(postsApi.getPosts).toHaveBeenLastCalledWith('p1');
    expect(home.posts()).toHaveLength(2);
    expect(home.feedError()).toBe('');
  });

  it('can retry a failed initial page', () => {
    postsApi.getPosts.mockReturnValueOnce(throwError(() => new Error('Network failed')));
    const home = createHome().componentInstance;
    expect(home.feedError()).toBe('Can’t reach Chirp.');
    expect(home.loading()).toBe(false);
    postsApi.getPosts.mockReturnValueOnce(of({ posts: [makePost('p1')], nextCursor: null }));
    home.retryPosts();
    expect(postsApi.getPosts).toHaveBeenLastCalledWith(undefined);
    expect(home.posts()).toHaveLength(1);
    expect(home.feedError()).toBe('');
  });

  it('keeps the next cursor when creating or deleting a loaded post', () => {
    postsApi.getPosts.mockReturnValueOnce(of({
      posts: [makePost('p1'), makePost('p2')], nextCursor: 'p2',
    }));
    postsApi.createPost.mockReturnValueOnce(of(makePost('new')));
    const home = createHome().componentInstance;
    home.createPost(new FormData());
    home.onPostDeleted('p1');
    postsApi.getPosts.mockReturnValueOnce(of({ posts: [makePost('p3')], nextCursor: null }));
    home.loadMorePosts();
    expect(postsApi.getPosts).toHaveBeenLastCalledWith('p2');
    expect(home.posts().map((post) => post._id)).toEqual(['new', 'p2', 'p3']);
  });

  it('ignores pending responses after leaving the page', () => {
    const initialRequest = new Subject<PostPage>();
    postsApi.getPosts.mockReturnValueOnce(initialRequest);
    const fixture = createHome();
    fixture.destroy();
    initialRequest.next({ posts: [makePost('late')], nextCursor: null });
    expect(fixture.componentInstance.posts()).toEqual([]);
  });

  it('preserves the composer through failure and clears it only after a successful retry', async () => {
    await TestBed.overrideComponent(Home, { set: {
      imports: [CreatePost],
      template: '<app-create-post [error]="error()" [loading]="posting()" (createPost)="createPost($event)" />',
    } })
      .overrideProvider(Auth, { useValue: { getUserId: () => null } })
      .overrideProvider(Users, { useValue: {} })
      .compileComponents();
    const pendingPost = new Subject<Post>();
    postsApi.createPost.mockReturnValueOnce(pendingPost);
    const fixture = createHome();
    const home = fixture.componentInstance;
    const composer = fixture.debugElement.query(By.directive(CreatePost)).componentInstance as CreatePost;
    const image = new File(['image'], 'forest.png', { type: 'image/png' });
    composer.body = 'A quiet walk';
    composer.image = image;
    composer.onSubmit();
    home.createPost(new FormData());
    fixture.detectChanges();
    expect(postsApi.createPost).toHaveBeenCalledTimes(1);
    expect(home.posting()).toBe(true);
    expect(composer.body).toBe('A quiet walk');
    expect(composer.image).toBe(image);

    pendingPost.error(new HttpErrorResponse({ status: 503, error: { message: 'Internal failure' } }));
    fixture.detectChanges();
    expect(home.posting()).toBe(false);
    expect(home.error()).toBe('Couldn’t publish post.');
    expect(composer.body).toBe('A quiet walk');
    expect(composer.image).toBe(image);

    postsApi.createPost.mockReturnValueOnce(of(makePost('published')));
    composer.onSubmit();
    fixture.detectChanges();
    expect(composer.body).toBe('');
    expect(composer.image).toBeNull();
    expect(home.error()).toBe('');
    expect(home.posts()).toHaveLength(1);
  });

  it('keeps actionable validation feedback from the server', () => {
    const home = createHome().componentInstance;
    postsApi.createPost.mockReturnValueOnce(throwError(() => new HttpErrorResponse({
      status: 422, error: { message: 'Only JPG, PNG, and WEBP images are allowed' },
    })));
    home.createPost(new FormData());
    expect(home.error()).toBe('Only JPG, PNG, and WEBP images are allowed');
    expect(home.posting()).toBe(false);
  });

  it('explains an oversized upload without exposing a server error page', () => {
    const home = createHome().componentInstance;
    postsApi.createPost.mockReturnValueOnce(throwError(() => new HttpErrorResponse({
      status: 413, error: '<html>Payload Too Large</html>',
    })));
    home.createPost(new FormData());
    expect(home.error()).toBe('Image is too large.');
  });
});
