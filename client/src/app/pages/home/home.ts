import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../../components/sidebar/sidebar';
import { CreatePost } from '../../components/create-post/create-post';
import { Posts } from '../../services/posts/posts';

type PostItem = any;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, Sidebar, CreatePost],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home {
  error = '';

  posts: PostItem[] = [
    {
      id: '1',
      author: 'Alice Schneider',
      body: 'Hello this is my first post!',
      createdAt: new Date().toLocaleString(),
    },
  ];

  constructor(private postsApi: Posts) {}

  openThemes(): void {
    console.log('Open themes modal (todo)');
  }

  createPost(data: FormData): void {
    this.error = '';

    this.postsApi.createPost(data).subscribe({
      next: (newPost) => {
        this.posts = [newPost, ...this.posts];
      },
      error: (err) => {
        const msg = err?.error?.message || 'Failed to create post.';
        this.error =
          msg === "TypeError: Cannot read properties of null (reading 'image')"
            ? 'Please upload an image'
            : msg;
      },
    });
  }
}
