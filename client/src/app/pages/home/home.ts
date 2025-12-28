import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type MockPost = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home {
  posts: MockPost[] = [
    {
      id: '1',
      author: 'Alice Schneider',
      body: 'Hello this is my first post!',
      createdAt: new Date().toLocaleString(),
    },
  ];
}
