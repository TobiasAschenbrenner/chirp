import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Feed } from '../feed/feed';
import { Post } from '../../services/posts/posts';

@Component({
  selector: 'app-feeds',
  standalone: true,
  imports: [CommonModule, Feed],
  templateUrl: './feeds.html',
  styleUrls: ['./feeds.scss'],
})
export class Feeds {
  @Input() posts: Post[] = [];
  @Output() postUpdated = new EventEmitter<Post>();

  onPostUpdated(updated: Post): void {
    this.postUpdated.emit(updated);
  }
}
