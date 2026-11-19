import { afterNextRender, Component, inject, Injector, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { CommonModule, DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import { Navbar } from './components/navbar/navbar';
import { Auth } from './services/auth/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('chirp-client');

  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private lastPagePath = '';

  constructor(public auth: Auth) {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        const pagePath = event.urlAfterRedirects.split(/[?#]/)[0];
        if (pagePath === this.lastPagePath) return;
        this.lastPagePath = pagePath;
        if (this.router.parseUrl(event.urlAfterRedirects).fragment) return;

        afterNextRender(() => this.focusPage({ preventScroll: true }), { injector: this.injector });
      });
  }

  skipToContent(event: MouseEvent): void {
    event.preventDefault();
    this.focusPage();
  }

  private focusPage(options?: FocusOptions): void {
    const main = this.document.getElementById('main-content');
    const heading = main?.querySelector<HTMLElement>('h1');
    (heading ?? main)?.focus(options);
  }
}
