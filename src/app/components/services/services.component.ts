import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent } from '../../ui/card/card.component';

interface Service {
  icon: string;
  title: string;
  description: string;
  badge: string;
}

@Component({
  selector: 'app-services',
  imports: [CommonModule, CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css'
})
export class ServicesComponent {
  services: Service[] = [
    {
      icon: 'sun',
      title: 'Annual Horoscope',
      description: 'Lorem Ipsum is simply dummy text of the printing industry. Lorem Ipsum has been.',
      badge: '1'
    },
    {
      icon: 'moon',
      title: 'Love Vedic Jada',
      description: 'Lorem Ipsum is simply dummy text of the printing industry. Lorem Ipsum has been.',
      badge: '2'
    },
    {
      icon: 'heart',
      title: 'Career of consultations',
      description: 'Lorem Ipsum is simply dummy text of the printing industry. Lorem Ipsum has been.',
      badge: '3'
    },
    {
      icon: 'trending-up',
      title: 'Analysis of Horoscopes',
      description: 'Lorem Ipsum is simply dummy text of the printing industry. Lorem Ipsum has been.',
      badge: '4'
    },
    {
      icon: 'compass',
      title: 'Career & Life Path',
      description: 'Discover your professional destiny and make aligned decisions for your future.',
      badge: '5'
    },
    {
      icon: 'book',
      title: 'Birth Chart Reading',
      description: 'Comprehensive analysis of your natal chart revealing your cosmic blueprint.',
      badge: '6'
    },
    {
      icon: 'zap',
      title: 'Compatibility Analysis',
      description: 'Explore relationship dynamics through detailed synastry readings.',
      badge: '7'
    },
    {
      icon: 'star',
      title: 'Planetary Transit',
      description: 'Navigate life\'s changes with planetary movement insights and guidance.',
      badge: '8'
    },
  ];

  getIconSvg(iconName: string): { paths: string[], viewBox: string } {
    const icons: { [key: string]: { paths: string[], viewBox: string } } = {
      'sun': { paths: ['M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41M17.66 17.66l-1.41-1.41M4.93 19.07l-1.41-1.41M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z'], viewBox: '0 0 24 24' },
      'moon': { paths: ['M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'], viewBox: '0 0 24 24' },
      'heart': { paths: ['M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'], viewBox: '0 0 24 24' },
      'trending-up': { paths: ['M23 6l-9.5 9.5-5-5L1 18M17 6h6v6'], viewBox: '0 0 24 24' },
      'compass': { paths: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'], viewBox: '0 0 24 24' },
      'book': { paths: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5a2.5 2.5 0 0 0 2.5 2.5H20M4 19.5V4.5A2.5 2.5 0 0 1 6.5 2H20v17.5H6.5a2.5 2.5 0 0 1-2.5-2.5z'], viewBox: '0 0 24 24' },
      'zap': { paths: ['M13 2L3 14h9l-1 8 10-12h-9l1-8z'], viewBox: '0 0 24 24' },
      'star': { paths: ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'], viewBox: '0 0 24 24' }
    };
    return icons[iconName] || icons['star'];
  }
}
