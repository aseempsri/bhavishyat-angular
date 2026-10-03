import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminBlogPost, BlogService } from '../../services/blog.service';

@Component({
  selector: 'app-admin-articles',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-articles.component.html'
})
export class AdminArticlesComponent implements OnInit {
  private readonly blog = inject(BlogService);
  private readonly destroyRef = inject(DestroyRef);

  checking = true;
  authed = false;
  password = '';
  loginError = '';

  posts: AdminBlogPost[] = [];
  listError = '';
  notice = '';
  busyId = '';
  deletingId = '';
  deletePassword = '';
  deleteError = '';

  ngOnInit(): void {
    this.blog.session().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (session) => {
        this.authed = session.ok;
        this.checking = false;
        if (session.ok) this.loadPosts();
      },
      error: () => {
        this.checking = false;
        this.loginError = 'The blog API is not running. Start it with npm run start:api.';
      }
    });
  }

  get visiblePosts(): AdminBlogPost[] {
    return this.posts.filter((post) => post.published);
  }

  get hiddenPosts(): AdminBlogPost[] {
    return this.posts.filter((post) => !post.published);
  }

  signIn(): void {
    this.loginError = '';
    this.blog.login(this.password).subscribe({
      next: (result) => {
        this.blog.rememberToken(result.token);
        this.password = '';
        this.authed = true;
        this.loadPosts();
      },
      error: (err) => {
        this.loginError = err?.error?.error || 'Could not sign in.';
      }
    });
  }

  signOut(): void {
    this.blog.logout().subscribe({
      next: () => this.resetSession(),
      error: () => this.resetSession()
    });
  }

  setVisibility(post: AdminBlogPost, published: boolean): void {
    this.listError = '';
    this.notice = '';
    this.busyId = post.id;
    this.blog.setPublished(post.id, published).subscribe({
      next: () => {
        this.busyId = '';
        this.notice = published ? 'Article is visible on the blog.' : 'Article is hidden from the blog.';
        this.loadPosts();
      },
      error: (err) => {
        this.busyId = '';
        this.listError = err?.error?.error || 'Could not update the article.';
      }
    });
  }

  askDelete(post: AdminBlogPost): void {
    this.deletingId = post.id;
    this.deletePassword = '';
    this.deleteError = '';
    this.notice = '';
  }

  cancelDelete(): void {
    this.deletingId = '';
    this.deletePassword = '';
    this.deleteError = '';
  }

  confirmDelete(post: AdminBlogPost): void {
    this.deleteError = '';
    if (!this.deletePassword) {
      this.deleteError = 'Enter the delete password.';
      return;
    }
    this.busyId = post.id;
    this.blog.remove(post.id, this.deletePassword).subscribe({
      next: () => {
        this.busyId = '';
        this.cancelDelete();
        this.notice = 'Article deleted.';
        this.loadPosts();
      },
      error: (err) => {
        this.busyId = '';
        this.deleteError = err?.error?.error || 'Could not delete the article.';
      }
    });
  }

  private loadPosts(): void {
    this.listError = '';
    this.blog.adminList().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (posts) => {
        this.posts = posts;
      },
      error: () => {
        this.listError = 'Could not load articles.';
      }
    });
  }

  private resetSession(): void {
    this.blog.clearToken();
    this.authed = false;
    this.posts = [];
    this.cancelDelete();
  }
}
