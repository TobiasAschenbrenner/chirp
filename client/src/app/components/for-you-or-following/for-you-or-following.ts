import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

type FeedMode = 'foryou' | 'following';

@Component({
  selector: 'app-for-you-or-following',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './for-you-or-following.html',
  styleUrls: ['./for-you-or-following.scss'],
})
export class ForYouOrFollowing {
  @Input() active: FeedMode = 'foryou';
  @Output() modeChange = new EventEmitter<FeedMode>();

  setMode(mode: FeedMode): void {
    if (mode === this.active) return;
    this.modeChange.emit(mode);
  }
}
