import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { Comments } from './comments';

describe('Comments service', () => {
  let service: Comments;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Comments],
    });

    service = TestBed.inject(Comments);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('createComment', () => {
    it('should POST to /api/comments/:postId with { comment } and return created comment', () => {
      const postId = 'p1';
      const commentText = 'Hello there';

      const mockComment = {
        _id: 'c1',
        comment: commentText,
        createdAt: new Date().toISOString(),
        creator: 'u1',
      } as any;

      let result: any;
      service.createComment(postId, commentText).subscribe((res) => (result = res));

      const req = httpMock.expectOne(`/api/comments/${postId}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ comment: commentText });

      req.flush(mockComment);

      expect(result).toEqual(mockComment);
    });
  });

  describe('deleteComment', () => {
    it('should DELETE /api/comments/:commentId and return the response', () => {
      const commentId = 'c123';
      const mockResponse = { message: 'Deleted' };

      let result: any;
      service.deleteComment(commentId).subscribe((res) => (result = res));

      const req = httpMock.expectOne(`/api/comments/${commentId}`);
      expect(req.request.method).toBe('DELETE');

      req.flush(mockResponse);

      expect(result).toEqual(mockResponse);
    });

    it('should DELETE /api/comments/:commentId and handle empty response body', () => {
      const commentId = 'c999';

      let result: any;
      service.deleteComment(commentId).subscribe((res) => (result = res));

      const req = httpMock.expectOne(`/api/comments/${commentId}`);
      expect(req.request.method).toBe('DELETE');

      req.flush({});

      expect(result).toEqual({});
    });
  });
});
