import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterModule, NavigationEnd, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { filter } from 'rxjs';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-class-recordings',
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './class-recordings.component.html',
  styleUrl: './class-recordings.component.css'
})
export class ClassRecordingsComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);
  private document = inject(DOCUMENT);

  constructor() {
    // Scroll to top on navigation
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        this.scrollToTop();
      });
  }

  ngOnInit(): void {
    // Scroll to top when component initializes
    this.scrollToTop();
  }

  private scrollToTop(): void {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }

  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
  classes = [
    {
      id: 1,
      title: 'Class 1',
      description: 'Basics of astrology. Introduction to Rashi, Grah',
      link: 'https://drive.google.com/file/d/14XEX1K0f4rghW8-16f9Q7-E_YCI0HHvT/view?usp=drive_link',
      icon: '🌟',
      gradient: 'from-yellow-500/20 to-orange-500/20',
      borderColor: 'border-yellow-500/50',
      hoverGlow: 'hover:shadow-[0_0_30px_rgba(255,193,99,0.5)]',
      thumbnailSvg: '<svg viewBox="0 0 200 200" class="w-full h-full"><circle cx="100" cy="100" r="80" fill="url(#grad1)" opacity="0.6"/><circle cx="100" cy="100" r="50" fill="url(#grad2)" opacity="0.4"/><text x="100" y="110" text-anchor="middle" fill="white" font-size="40" font-weight="bold">♈</text><text x="100" y="140" text-anchor="middle" fill="white" font-size="20" opacity="0.8">Rashi</text><defs><linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" /><stop offset="100%" style="stop-color:#FF8C00;stop-opacity:1" /></linearGradient><linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FFA500;stop-opacity:1" /><stop offset="100%" style="stop-color:#FF6347;stop-opacity:1" /></linearGradient></defs></svg>'
    },
    {
      id: 2,
      title: 'Class 2',
      description: 'Kundali, Remedies, House Significations and Combinations',
      link: 'https://drive.google.com/file/d/1F2nc7lRIQTwbUbVqt5KoDBERPIZ72FwI/view?usp=drive_link',
      icon: '🔮',
      gradient: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/50',
      hoverGlow: 'hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]',
      thumbnailSvg: '<svg viewBox="0 0 200 200" class="w-full h-full"><rect x="20" y="20" width="160" height="160" rx="10" fill="url(#grad3)" opacity="0.6"/><circle cx="100" cy="100" r="60" fill="none" stroke="white" stroke-width="3" opacity="0.5"/><circle cx="100" cy="100" r="40" fill="none" stroke="white" stroke-width="2" opacity="0.5"/><line x1="100" y1="40" x2="100" y2="160" stroke="white" stroke-width="2" opacity="0.5"/><line x1="40" y1="100" x2="160" y2="100" stroke="white" stroke-width="2" opacity="0.5"/><text x="100" y="110" text-anchor="middle" fill="white" font-size="30" font-weight="bold">🏠</text><text x="100" y="140" text-anchor="middle" fill="white" font-size="16" opacity="0.8">Houses</text><defs><linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#9333EA;stop-opacity:1" /><stop offset="100%" style="stop-color:#EC4899;stop-opacity:1" /></linearGradient></defs></svg>'
    },
    {
      id: 3,
      title: 'Class 3',
      description: 'Grah Yuti (conjunction of planets) and its effects',
      link: 'https://drive.google.com/file/d/1j8EBwOSjtglZWj2aDDPS0qtdE3LzLGZ8/view?usp=drive_link',
      icon: '⚡',
      gradient: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-500/50',
      hoverGlow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]',
      thumbnailSvg: '<svg viewBox="0 0 200 200" class="w-full h-full"><circle cx="80" cy="80" r="25" fill="url(#grad4)" opacity="0.8"/><circle cx="120" cy="120" r="25" fill="url(#grad5)" opacity="0.8"/><circle cx="100" cy="100" r="35" fill="none" stroke="white" stroke-width="2" opacity="0.3"/><path d="M 80 80 Q 100 100 120 120" stroke="white" stroke-width="3" fill="none" opacity="0.6"/><text x="100" y="110" text-anchor="middle" fill="white" font-size="24" font-weight="bold">⚡</text><text x="100" y="140" text-anchor="middle" fill="white" font-size="14" opacity="0.8">Conjunction</text><defs><linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" /><stop offset="100%" style="stop-color:#06B6D4;stop-opacity:1" /></linearGradient><linearGradient id="grad5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#06B6D4;stop-opacity:1" /><stop offset="100%" style="stop-color:#3B82F6;stop-opacity:1" /></linearGradient></defs></svg>'
    },
    {
      id: 4,
      title: 'Class 4',
      description: 'Sun and Rahu. Conjunction with other planets',
      link: 'https://drive.google.com/file/d/1XrLVZob8RAmbclEvrc88v3rr7C5lLlcs/view?usp=drive_link',
      icon: '☀️',
      gradient: 'from-orange-500/20 to-red-500/20',
      borderColor: 'border-orange-500/50',
      hoverGlow: 'hover:shadow-[0_0_30px_rgba(255,153,0,0.5)]',
      thumbnailSvg: '<svg viewBox="0 0 200 200" class="w-full h-full"><circle cx="100" cy="100" r="50" fill="url(#grad6)" opacity="0.9"/><circle cx="100" cy="100" r="35" fill="url(#grad7)" opacity="0.7"/><circle cx="70" cy="70" r="20" fill="url(#grad8)" opacity="0.6"/><path d="M 100 50 L 100 30 M 100 170 L 100 150 M 50 100 L 30 100 M 170 100 L 150 100 M 70.7 70.7 L 56.6 56.6 M 129.3 129.3 L 143.4 143.4 M 70.7 129.3 L 56.6 143.4 M 129.3 70.7 L 143.4 56.6" stroke="white" stroke-width="2" opacity="0.5"/><text x="100" y="110" text-anchor="middle" fill="white" font-size="35" font-weight="bold">☉</text><text x="100" y="140" text-anchor="middle" fill="white" font-size="14" opacity="0.8">Sun & Rahu</text><defs><linearGradient id="grad6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FF8C00;stop-opacity:1" /><stop offset="100%" style="stop-color:#FF4500;stop-opacity:1" /></linearGradient><linearGradient id="grad7" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FFA500;stop-opacity:1" /><stop offset="100%" style="stop-color:#FF6347;stop-opacity:1" /></linearGradient><linearGradient id="grad8" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#9370DB;stop-opacity:1" /><stop offset="100%" style="stop-color:#8B008B;stop-opacity:1" /></linearGradient></defs></svg>'
    },
    {
      id: 5,
      title: 'Class 5',
      description: 'Saturn and conjunction',
      link: 'https://drive.google.com/file/d/1eQ_RE3c435cgCgz6IF_8nO3JbLLtMvIa/view?usp=drive_link',
      icon: '🪐',
      gradient: 'from-gray-500/20 to-slate-500/20',
      borderColor: 'border-gray-500/50',
      hoverGlow: 'hover:shadow-[0_0_30px_rgba(112,128,144,0.5)]',
      thumbnailSvg: '<svg viewBox="0 0 200 200" class="w-full h-full"><circle cx="100" cy="100" r="60" fill="url(#grad9)" opacity="0.7"/><ellipse cx="100" cy="100" rx="60" ry="40" fill="url(#grad10)" opacity="0.5"/><ellipse cx="100" cy="100" rx="50" ry="30" fill="none" stroke="white" stroke-width="2" opacity="0.4"/><ellipse cx="100" cy="100" rx="40" ry="20" fill="none" stroke="white" stroke-width="1" opacity="0.3"/><text x="100" y="110" text-anchor="middle" fill="white" font-size="40" font-weight="bold">♄</text><text x="100" y="140" text-anchor="middle" fill="white" font-size="16" opacity="0.8">Saturn</text><defs><linearGradient id="grad9" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#708090;stop-opacity:1" /><stop offset="100%" style="stop-color:#2F4F4F;stop-opacity:1" /></linearGradient><linearGradient id="grad10" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#778899;stop-opacity:1" /><stop offset="100%" style="stop-color:#4682B4;stop-opacity:1" /></linearGradient></defs></svg>'
    },
    {
      id: 6,
      title: 'Class 6',
      description: 'Jupiter and conjunction',
      link: 'https://drive.google.com/file/d/1c4quLS_08VnRuzZ9OQjqs7JJbCXVJK-m/view?usp=drive_link',
      icon: '♃',
      gradient: 'from-amber-500/20 to-yellow-500/20',
      borderColor: 'border-amber-500/50',
      hoverGlow: 'hover:shadow-[0_0_30px_rgba(255,193,99,0.5)]',
      thumbnailSvg: '<svg viewBox="0 0 200 200" class="w-full h-full"><circle cx="100" cy="100" r="55" fill="url(#grad11)" opacity="0.8"/><circle cx="100" cy="100" r="45" fill="url(#grad12)" opacity="0.6"/><circle cx="100" cy="100" r="35" fill="none" stroke="white" stroke-width="2" opacity="0.4"/><circle cx="80" cy="80" r="15" fill="url(#grad13)" opacity="0.7"/><circle cx="120" cy="120" r="15" fill="url(#grad14)" opacity="0.7"/><text x="100" y="110" text-anchor="middle" fill="white" font-size="45" font-weight="bold">♃</text><text x="100" y="140" text-anchor="middle" fill="white" font-size="16" opacity="0.8">Jupiter</text><defs><linearGradient id="grad11" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FFC163;stop-opacity:1" /><stop offset="100%" style="stop-color:#FFA500;stop-opacity:1" /></linearGradient><linearGradient id="grad12" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" /><stop offset="100%" style="stop-color:#FF8C00;stop-opacity:1" /></linearGradient><linearGradient id="grad13" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FFA500;stop-opacity:1" /><stop offset="100%" style="stop-color:#FF6347;stop-opacity:1" /></linearGradient><linearGradient id="grad14" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FF8C00;stop-opacity:1" /><stop offset="100%" style="stop-color:#FF4500;stop-opacity:1" /></linearGradient></defs></svg>'
    },
    {
      id: 7,
      title: 'Class 7',
      description: 'Moon',
      link: 'https://drive.google.com/file/d/1H2Q6ElufX8THSmvHi0A-OiS1Ouq6GlYB/view?usp=drive_link',
      icon: '🌙',
      gradient: 'from-indigo-500/20 to-purple-500/20',
      borderColor: 'border-indigo-500/50',
      hoverGlow: 'hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]',
      thumbnailSvg: '<svg viewBox="0 0 200 200" class="w-full h-full"><circle cx="100" cy="100" r="50" fill="url(#grad15)" opacity="0.8"/><path d="M 100 50 Q 130 100 100 150 Q 70 100 100 50" fill="url(#grad16)" opacity="0.6"/><circle cx="120" cy="90" r="8" fill="white" opacity="0.6"/><circle cx="110" cy="110" r="6" fill="white" opacity="0.5"/><circle cx="115" cy="125" r="5" fill="white" opacity="0.4"/><text x="100" y="110" text-anchor="middle" fill="white" font-size="40" font-weight="bold">☽</text><text x="100" y="140" text-anchor="middle" fill="white" font-size="16" opacity="0.8">Moon</text><defs><linearGradient id="grad15" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#6366F1;stop-opacity:1" /><stop offset="100%" style="stop-color:#9333EA;stop-opacity:1" /></linearGradient><linearGradient id="grad16" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#818CF8;stop-opacity:1" /><stop offset="100%" style="stop-color:#A78BFA;stop-opacity:1" /></linearGradient></defs></svg>'
    },
    {
      id: 8,
      title: 'Class 8',
      description: 'Rahu and Ketu',
      link: 'https://drive.google.com/file/d/1082VCiFkqJi0w8eD95BugBJZjwvt1j7K/view?usp=drive_link',
      icon: '🌌',
      gradient: 'from-violet-500/20 to-purple-500/20',
      borderColor: 'border-violet-500/50',
      hoverGlow: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]',
      thumbnailSvg: '<svg viewBox="0 0 200 200" class="w-full h-full"><circle cx="80" cy="100" r="30" fill="url(#grad17)" opacity="0.7"/><circle cx="120" cy="100" r="30" fill="url(#grad18)" opacity="0.7"/><path d="M 80 100 L 120 100" stroke="white" stroke-width="3" opacity="0.5"/><circle cx="100" cy="100" r="5" fill="white" opacity="0.6"/><circle cx="100" cy="100" r="40" fill="none" stroke="white" stroke-width="2" stroke-dasharray="5,5" opacity="0.3"/><text x="100" y="110" text-anchor="middle" fill="white" font-size="28" font-weight="bold">☊☋</text><text x="100" y="140" text-anchor="middle" fill="white" font-size="14" opacity="0.8">Rahu & Ketu</text><defs><linearGradient id="grad17" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:1" /><stop offset="100%" style="stop-color:#9333EA;stop-opacity:1" /></linearGradient><linearGradient id="grad18" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#7C3AED;stop-opacity:1" /><stop offset="100%" style="stop-color:#6D28D9;stop-opacity:1" /></linearGradient></defs></svg>'
    },
    {
      id: 9,
      title: 'Class 9',
      description: 'Mercury',
      link: 'https://drive.google.com/file/d/1COmLabNQFy7hz41U6kj52jIc6Xirq9EE/view?usp=drive_link',
      icon: '☿',
      gradient: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/50',
      hoverGlow: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]',
      thumbnailSvg: '<svg viewBox="0 0 200 200" class="w-full h-full"><circle cx="100" cy="100" r="50" fill="url(#grad19)" opacity="0.8"/><circle cx="100" cy="100" r="40" fill="url(#grad20)" opacity="0.6"/><path d="M 100 50 L 100 30 M 100 170 L 100 150 M 50 100 L 30 100 M 170 100 L 150 100" stroke="white" stroke-width="2" opacity="0.4"/><circle cx="100" cy="100" r="8" fill="white" opacity="0.7"/><text x="100" y="110" text-anchor="middle" fill="white" font-size="40" font-weight="bold">☿</text><text x="100" y="140" text-anchor="middle" fill="white" font-size="16" opacity="0.8">Mercury</text><defs><linearGradient id="grad19" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#22C55E;stop-opacity:1" /><stop offset="100%" style="stop-color:#10B981;stop-opacity:1" /></linearGradient><linearGradient id="grad20" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#34D399;stop-opacity:1" /><stop offset="100%" style="stop-color:#059669;stop-opacity:1" /></linearGradient></defs></svg>'
    }
  ];

  openClass(link: string): void {
    window.open(link, '_blank');
  }
}

