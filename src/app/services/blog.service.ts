import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface BlogPost {
  id: string;
  headline: string;
  slug: string;
  excerpt: string;
  body: string;
  publishedAt: string;
  updatedAt: string;
}

export interface AdminBlogPost extends BlogPost {
  published: boolean;
  thumbnailUrl: string | null;
}

const TOKEN_KEY = 'bhavishyat_admin_token';

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly http = inject(HttpClient);

  list() {
    return this.http.get<BlogPost[]>('/api/blogs');
  }

  get(slug: string) {
    return this.http.get<BlogPost>(`/api/blogs/${encodeURIComponent(slug)}`);
  }

  session() {
    return this.http.get<{ ok: boolean }>('/api/admin/me', { headers: this.authHeaders() });
  }

  login(password: string) {
    return this.http.post<{ ok: boolean; token: string }>('/api/admin/login', { password });
  }

  logout() {
    this.clearToken();
    return this.http.post<{ ok: boolean }>('/api/admin/logout', {});
  }

  adminList() {
    return this.http.get<AdminBlogPost[]>('/api/admin/blogs', { headers: this.authHeaders() });
  }

  save(form: FormData, id?: string) {
    if (id) {
      return this.http.put<AdminBlogPost>(`/api/admin/blogs/${id}`, form, { headers: this.authHeaders() });
    }
    return this.http.post<AdminBlogPost>('/api/admin/blogs', form, { headers: this.authHeaders() });
  }

  setPublished(id: string, published: boolean) {
    return this.http.patch<AdminBlogPost>(`/api/admin/blogs/${id}/visibility`, { published }, { headers: this.authHeaders() });
  }

  remove(id: string, password: string) {
    return this.http.delete<{ ok: boolean }>(`/api/admin/blogs/${id}`, {
      headers: this.authHeaders(),
      body: { password }
    });
  }

  rememberToken(token: string): void {
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  clearToken(): void {
    sessionStorage.removeItem(TOKEN_KEY);
  }

  private authHeaders(): HttpHeaders {
    const token = sessionStorage.getItem(TOKEN_KEY);
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
