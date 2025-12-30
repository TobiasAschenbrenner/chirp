import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feed-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feed-skeleton.html',
  styleUrls: ['./feed-skeleton.scss'],
})
export class FeedSkeleton {
  @Input() count = 3;
  items: number[] = [];

  ngOnChanges(): void {
    this.items = Array.from({ length: this.count }, (_, i) => i);
  }

  ngOnInit(): void {
    this.items = Array.from({ length: this.count }, (_, i) => i);
  }
}
