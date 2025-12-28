import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './create-post.html',
  styleUrls: ['./create-post.scss'],
})
export class CreatePost {
  @Input() error = '';
  @Output() createPost = new EventEmitter<FormData>();

  body = '';
  image: File | null = null;

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.image = input.files[0];
    }
  }

  onSubmit(): void {
    const postData = new FormData();
    postData.set('body', this.body);

    if (this.image) {
      postData.set('image', this.image);
    }

    this.createPost.emit(postData);

    this.body = '';
    this.image = null;
  }
}
