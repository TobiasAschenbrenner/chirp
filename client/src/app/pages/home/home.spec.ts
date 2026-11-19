import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Home } from './home';
import { Posts } from '../../services/posts/posts';
import { Post, PostPage } from '../../models/post.model';

const makePost = (id: string): Post => ({
  _id: id, creator: 'author', body: id, image: '', likes: [], comments: [],
});

describe('Home feed pagination', () => {
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
    expect(home.feedError()).toBe('Temporarily unavailable');
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
    expect(home.feedError()).toBe('Failed to load posts.');
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
});
