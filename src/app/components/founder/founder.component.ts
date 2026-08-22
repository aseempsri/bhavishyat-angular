import { Component, inject, DOCUMENT } from '@angular/core';

@Component({
  selector: 'app-founder',
  templateUrl: './founder.component.html',
  styleUrl: './founder.component.css'
})
export class FounderComponent {
  private document = inject(DOCUMENT);

  readonly portraitSrc = this.getBaseHref() + 'assets/shubhram.png';

  private getBaseHref(): string {
    const baseTag = this.document.querySelector('base');
    return baseTag?.getAttribute('href') || '/';
  }
}
