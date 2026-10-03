import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdminBlogPost, BlogService } from '../../services/blog.service';

@Component({
  selector: 'app-admin-blog',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-blog.component.html'
})
export class AdminBlogComponent implements OnInit {
  private readonly blog = inject(BlogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  checking = true;
  authed = false;
  password = '';
  loginError = '';

  formError = '';
  notice = '';
  saving = false;

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  editingId = '';
  headline = '';
  excerpt = '';
  body = '';
  published = true;
  removeThumbnail = false;
  existingThumbnail = '';
  previewUrl = '';
  private selectedFile: File | null = null;
  private returnToArticles = false;

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

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.selectedFile = file;
    this.removeThumbnail = false;
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = file ? URL.createObjectURL(file) : '';
  }

  edit(post: AdminBlogPost): void {
    this.editingId = post.id;
    this.headline = post.headline;
    this.excerpt = post.excerpt;
    this.body = post.body;
    this.published = post.published;
    this.existingThumbnail = post.thumbnailUrl || '';
    this.removeThumbnail = false;
    this.selectedFile = null;
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = '';
    this.formError = '';
    this.notice = '';
    if (this.fileInput) this.fileInput.nativeElement.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    const goBack = this.returnToArticles && Boolean(this.editingId);
    this.editingId = '';
    this.headline = '';
    this.excerpt = '';
    this.body = '';
    this.published = true;
    this.removeThumbnail = false;
    this.existingThumbnail = '';
    this.selectedFile = null;
    this.returnToArticles = false;
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = '';
    this.formError = '';
    if (this.fileInput) this.fileInput.nativeElement.value = '';
    if (goBack) {
      this.router.navigate(['/admin/articles']);
    }
  }

  save(): void {
    this.formError = '';
    this.notice = '';
    if (!this.headline.trim() || !this.body.trim()) {
      this.formError = 'Headline and article text are required.';
      return;
    }
    const form = new FormData();
    form.set('headline', this.headline.trim());
    form.set('excerpt', this.excerpt.trim());
    form.set('body', this.body.trim());
    form.set('published', this.published ? 'true' : 'false');
    form.set('removeThumbnail', this.removeThumbnail ? 'true' : 'false');
    if (this.selectedFile) form.set('thumbnail', this.selectedFile);

    this.saving = true;
    const returnAfterSave = this.returnToArticles && Boolean(this.editingId);
    this.blog.save(form, this.editingId || undefined).subscribe({
      next: () => {
        this.saving = false;
        if (returnAfterSave) {
          this.returnToArticles = false;
          this.cancelEdit();
          this.router.navigate(['/admin/articles']);
          return;
        }
        const wasEditing = Boolean(this.editingId);
        this.cancelEdit();
        this.notice = wasEditing ? 'Article updated.' : 'Article saved.';
      },
      error: (err) => {
        this.saving = false;
        this.formError = err?.error?.error || 'Could not save the article.';
      }
    });
  }

  private loadPosts(): void {
    this.blog.adminList().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (posts) => this.openEditFromQuery(posts),
      error: () => {
        if (this.route.snapshot.queryParamMap.get('edit')) {
          this.formError = 'Could not load the article to edit.';
        }
      }
    });
  }

  private openEditFromQuery(posts: AdminBlogPost[]): void {
    const editId = this.route.snapshot.queryParamMap.get('edit');
    if (!editId) return;
    this.returnToArticles = this.route.snapshot.queryParamMap.get('from') === 'articles';
    const post = posts.find((item) => item.id === editId);
    if (post) {
      this.edit(post);
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { edit: null, from: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  private resetSession(): void {
    this.blog.clearToken();
    this.authed = false;
    this.cancelEdit();
  }
}
