import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { EditPostModal } from './edit-post-modal';
import { Posts, Post } from '../../services/posts/posts';

describe('EditPostModal', () => {
  let postsApi: { getPost: any; editPost: any };

  const makePost = (overrides: Partial<Post> = {}): Post =>
    ({
      _id: 'p1',
      body: 'Hello',
      ...overrides,
    } as Post);

  beforeEach(() => {
    postsApi = {
      getPost: vi.fn(),
      editPost: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [EditPostModal],
      providers: [{ provide: Posts, useValue: postsApi }],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(EditPostModal);
    fixture.componentRef.setInput('postId', 'p1');

    postsApi.getPost.mockReturnValue(of(makePost()));

    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load post on init and set body', () => {
    const fixture = TestBed.createComponent(EditPostModal);
    fixture.componentRef.setInput('postId', 'p1');

    postsApi.getPost.mockReturnValue(of(makePost({ body: 'Loaded body' })));

    fixture.detectChanges();

    expect(postsApi.getPost).toHaveBeenCalledWith('p1');
    expect(fixture.componentInstance.body()).toBe('Loaded body');
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.error()).toBe('');
  });

  it('should set error when loading post fails', () => {
    const fixture = TestBed.createComponent(EditPostModal);
    fixture.componentRef.setInput('postId', 'p1');

    postsApi.getPost.mockReturnValue(throwError(() => ({ error: { message: 'Boom' } })));

    fixture.detectChanges();

    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.error()).toBe('Boom');
  });

  it('onBodyInput should update body signal', () => {
    const fixture = TestBed.createComponent(EditPostModal);
    fixture.componentRef.setInput('postId', 'p1');

    postsApi.getPost.mockReturnValue(of(makePost({ body: '' })));

    fixture.detectChanges();

    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = 'New text';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.body()).toBe('New text');
  });

  it('submit should not call editPost when body is empty/whitespace', () => {
    const fixture = TestBed.createComponent(EditPostModal);
    fixture.componentRef.setInput('postId', 'p1');

    postsApi.getPost.mockReturnValue(of(makePost({ body: '' })));
    postsApi.editPost.mockReturnValue(of(makePost({ body: 'x' })));

    fixture.detectChanges();

    fixture.componentInstance.body.set('   ');
    fixture.componentInstance.submit();

    expect(postsApi.editPost).not.toHaveBeenCalled();
  });

  it('submit should emit updated and closed on success', () => {
    const fixture = TestBed.createComponent(EditPostModal);
    fixture.componentRef.setInput('postId', 'p1');

    postsApi.getPost.mockReturnValue(of(makePost({ body: 'Old' })));
    postsApi.editPost.mockReturnValue(of(makePost({ body: 'Updated' })));

    const updatedSpy = vi.fn();
    const closedSpy = vi.fn();

    fixture.detectChanges();

    fixture.componentInstance.updated.subscribe(updatedSpy);
    fixture.componentInstance.closed.subscribe(closedSpy);

    fixture.componentInstance.body.set('  Updated  ');
    fixture.componentInstance.submit();

    expect(postsApi.editPost).toHaveBeenCalledWith('p1', 'Updated');
    expect(updatedSpy).toHaveBeenCalledTimes(1);
    expect(updatedSpy.mock.calls[0][0].body).toBe('Updated');
    expect(closedSpy).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('submit should set error on failure and not emit closed', () => {
    const fixture = TestBed.createComponent(EditPostModal);
    fixture.componentRef.setInput('postId', 'p1');

    postsApi.getPost.mockReturnValue(of(makePost({ body: 'Old' })));
    postsApi.editPost.mockReturnValue(throwError(() => ({ error: { message: 'Nope' } })));

    const updatedSpy = vi.fn();
    const closedSpy = vi.fn();

    fixture.detectChanges();

    fixture.componentInstance.updated.subscribe(updatedSpy);
    fixture.componentInstance.closed.subscribe(closedSpy);

    fixture.componentInstance.body.set('Updated');
    fixture.componentInstance.submit();

    expect(updatedSpy).not.toHaveBeenCalled();
    expect(closedSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.error()).toBe('Nope');
  });

  it('close should emit closed when called without event', () => {
    const fixture = TestBed.createComponent(EditPostModal);
    fixture.componentRef.setInput('postId', 'p1');
    postsApi.getPost.mockReturnValue(of(makePost()));

    const closedSpy = vi.fn();
    fixture.detectChanges();
    fixture.componentInstance.closed.subscribe(closedSpy);

    fixture.componentInstance.close();

    expect(closedSpy).toHaveBeenCalledTimes(1);
  });

  it('close should emit closed when clicking backdrop (target has class "editPost")', () => {
    const fixture = TestBed.createComponent(EditPostModal);
    fixture.componentRef.setInput('postId', 'p1');
    postsApi.getPost.mockReturnValue(of(makePost()));

    const closedSpy = vi.fn();
    fixture.detectChanges();
    fixture.componentInstance.closed.subscribe(closedSpy);

    const el = document.createElement('div');
    el.classList.add('editPost');

    fixture.componentInstance.close({ target: el } as unknown as MouseEvent);

    expect(closedSpy).toHaveBeenCalledTimes(1);
  });

  it('close should NOT emit closed when click target is not the backdrop', () => {
    const fixture = TestBed.createComponent(EditPostModal);
    fixture.componentRef.setInput('postId', 'p1');
    postsApi.getPost.mockReturnValue(of(makePost()));

    const closedSpy = vi.fn();
    fixture.detectChanges();
    fixture.componentInstance.closed.subscribe(closedSpy);

    const el = document.createElement('div');
    fixture.componentInstance.close({ target: el } as unknown as MouseEvent);

    expect(closedSpy).not.toHaveBeenCalled();
  });
});
