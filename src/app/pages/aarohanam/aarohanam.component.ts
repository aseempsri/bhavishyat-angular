import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { ButtonComponent } from '../../ui/button/button.component';

@Component({
  selector: 'app-aarohanam',
  imports: [CommonModule, RouterModule, HeaderComponent, ButtonComponent],
  templateUrl: './aarohanam.component.html',
  styleUrl: './aarohanam.component.css'
})
export class AarohanamComponent {
  upcomingEvents = [
    {
      title: 'Mindful Meditation Workshop',
      date: 'March 15, 2024',
      time: '10:00 AM - 12:00 PM',
      type: 'Workshop',
      description: 'Join us for a transformative meditation session focusing on inner peace and mindfulness practices.',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80'
    },
    {
      title: 'Yoga & Wellness Webinar',
      date: 'March 20, 2024',
      time: '6:00 PM - 7:30 PM',
      type: 'Webinar',
      description: 'Explore the connection between yoga, wellness, and spiritual growth in this interactive online session.',
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80'
    },
    {
      title: 'Community Healing Circle',
      date: 'March 25, 2024',
      time: '4:00 PM - 6:00 PM',
      type: 'Event',
      description: 'A gathering for shared healing, support, and community connection in a safe and nurturing space.',
      image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&q=80'
    },
    {
      title: 'Astrology & Life Guidance Session',
      date: 'April 1, 2024',
      time: '2:00 PM - 4:00 PM',
      type: 'Workshop',
      description: 'Learn how astrology can guide your life decisions and understand your cosmic blueprint.',
      image: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=600&q=80'
    }
  ];

  wellnessArticles = [
    {
      title: 'The Power of Community in Spiritual Growth',
      author: 'Dr. Priya Sharma',
      date: 'March 10, 2024',
      category: 'Wellness',
      excerpt: 'Discover how being part of a spiritual community can accelerate your personal growth and provide support on your journey.',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80',
      readTime: '5 min read'
    },
    {
      title: 'Holistic Approaches to Mental Wellbeing',
      author: 'Swami Ananda',
      date: 'March 5, 2024',
      category: 'Mental Health',
      excerpt: 'Explore ancient wisdom and modern techniques for maintaining mental balance and emotional resilience.',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80',
      readTime: '7 min read'
    },
    {
      title: 'Integrating Mindfulness into Daily Life',
      author: 'Master Chen',
      date: 'February 28, 2024',
      category: 'Mindfulness',
      excerpt: 'Practical tips and techniques to bring mindfulness practices into your everyday routine for lasting peace.',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
      readTime: '6 min read'
    },
    {
      title: 'The Science Behind Energy Healing',
      author: 'Dr. Rajesh Kumar',
      date: 'February 20, 2024',
      category: 'Healing',
      excerpt: 'Understanding the scientific basis of energy healing practices and their impact on physical and emotional health.',
      image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&q=80',
      readTime: '8 min read'
    },
    {
      title: 'Building Resilience Through Spiritual Practices',
      author: 'Guru Meera',
      date: 'February 15, 2024',
      category: 'Spirituality',
      excerpt: 'Learn how spiritual practices can help you navigate life\'s challenges with grace and strength.',
      image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80',
      readTime: '6 min read'
    },
    {
      title: 'Nutrition for Spiritual Awakening',
      author: 'Dr. Anjali Patel',
      date: 'February 10, 2024',
      category: 'Wellness',
      excerpt: 'Discover how the right nutrition can support your spiritual journey and enhance your energy levels.',
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
      readTime: '5 min read'
    }
  ];
}

