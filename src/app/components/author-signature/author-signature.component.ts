import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-author-signature',
  imports: [CommonModule],
  templateUrl: './author-signature.component.html',
  styleUrl: './author-signature.component.css'
})
export class AuthorSignatureComponent {
  @Input() size: 'card' | 'article' = 'card';
}
