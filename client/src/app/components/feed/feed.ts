import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { Post } from '../../services/posts/posts';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './feed.html',
  styleUrls: ['./feed.scss'],
})
export class Feed {
  @Input({ required: true }) post!: Post;
  @Output() postUpdated = new EventEmitter<Post>();

  emitUpdatedPost(updated: Post): void {
    this.postUpdated.emit(updated);
  }
}
