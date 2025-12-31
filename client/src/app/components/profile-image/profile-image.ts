import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-image',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-image.html',
  styleUrls: ['./profile-image.scss'],
})
export class ProfileImage {
  @Input({ required: true }) src!: string;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
}
