import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { AuthorSignatureComponent } from '../../components/author-signature/author-signature.component';
import { BlogPost, BlogService } from '../../services/blog.service';

@Component({
  selector: 'app-blog-list',
  imports: [CommonModule, RouterModule, HeaderComponent, AuthorSignatureComponent],
  templateUrl: './blog-list.component.html',
  styleUrl: './blog-list.component.css'
})
export class BlogListComponent implements OnInit {
  private readonly blog = inject(BlogService);
  private readonly destroyRef = inject(DestroyRef);

  posts: BlogPost[] = [];
  loading = true;
  error = '';
  ngOnInit(): void {
    this.blog.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (posts) => {
        this.posts = posts;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'The blog is unavailable right now. Start the local API with npm run start:api and make sure MongoDB is running.';
      }
    });
  }
}

