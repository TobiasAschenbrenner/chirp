import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { Posts } from './posts';
import { Post } from '../../models/post.model';

describe('Posts service', () => {
  let service: Posts;
  let httpMock: HttpTestingController;

  const mockPost: Post = {
    _id: 'p1',
    creator: 'u1',
    body: 'Hello world',
    image: '',
    likes: [],
    comments: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Posts],
    });

    service = TestBed.inject(Posts);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create a post', () => {
    const formData = new FormData();
    formData.set('body', 'Hello');

    service.createPost(formData).subscribe((post) => {
      expect(post).toEqual(mockPost);
    });

    const req = httpMock.expectOne('/api/posts');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(formData);

    req.flush(mockPost);
  });

  it('should request a bounded first page and read its next cursor', () => {
    service.getPosts().subscribe((page) => {
      expect(page.posts).toEqual([mockPost]);
      expect(page.nextCursor).toBe('next-page');
    });

    const req = httpMock.expectOne((request) => request.url === '/api/posts');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limit')).toBe('20');
    expect(req.request.params.has('cursor')).toBe(false);

    req.flush([mockPost], { headers: { 'X-Next-Cursor': 'next-page' } });
  });

  it('should request the next following page and recognize the end of the feed', () => {
    service.getFollowingPosts('previous-page').subscribe((page) => {
      expect(page.posts).toEqual([mockPost]);
      expect(page.nextCursor).toBeNull();
    });

    const req = httpMock.expectOne((request) => request.url === '/api/posts/following');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limit')).toBe('20');
    expect(req.request.params.get('cursor')).toBe('previous-page');

    req.flush([mockPost]);
  });

  it('should like a post', () => {
    service.likePost('p1').subscribe((post) => {
      expect(post._id).toBe('p1');
    });

    const req = httpMock.expectOne('/api/posts/p1/like');
    expect(req.request.method).toBe('GET');

    req.flush(mockPost);
  });

  it('should get a single post', () => {
    service.getPost('p1').subscribe((post) => {
      expect(post._id).toBe('p1');
    });

    const req = httpMock.expectOne('/api/posts/p1');
    expect(req.request.method).toBe('GET');

    req.flush(mockPost);
  });

  it('should delete a post', () => {
    service.deletePost('p1').subscribe((res) => {
      expect(res.message).toBe('deleted');
    });

    const req = httpMock.expectOne('/api/posts/p1');
    expect(req.request.method).toBe('DELETE');

    req.flush({ message: 'deleted' });
  });

  it('should edit a post', () => {
    service.editPost('p1', 'Updated').subscribe((post) => {
      expect(post.body).toBe('Hello world');
    });

    const req = httpMock.expectOne('/api/posts/p1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ body: 'Updated' });

    req.flush(mockPost);
  });

  it('should toggle bookmark', () => {
    service.toggleBookmark('p1').subscribe((res) => {
      expect(res.bookmarks).toContain('p1');
    });

    const req = httpMock.expectOne('/api/posts/p1/bookmarks');
    expect(req.request.method).toBe('GET');

    req.flush({ bookmarks: ['p1'] });
  });
});
