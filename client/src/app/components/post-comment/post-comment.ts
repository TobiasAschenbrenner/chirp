import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Comment, PostUser } from '../../services/posts/posts';

@Component({
  selector: 'app-post-comment',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './post-comment.html',
  styleUrls: ['./post-comment.scss'],
})
export class PostComment {
  @Input({ required: true }) comment!: Comment;
  @Output() delete = new EventEmitter<string>();

  creator(): PostUser | null {
    return typeof this.comment.creator === 'string' ? null : this.comment.creator;
  }

  onDelete(): void {
    this.delete.emit(this.comment._id);
  }
}
