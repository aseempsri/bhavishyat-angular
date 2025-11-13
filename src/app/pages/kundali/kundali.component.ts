import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { HeaderComponent } from '../../components/header/header.component';
import { AstrologyService, KundaliData } from '../../services/astrology.service';

@Component({
  selector: 'app-kundali',
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './kundali.component.html',
  styleUrl: './kundali.component.css'
})
export class KundaliComponent implements OnInit {
  private router = inject(Router);
  private astrologyService = inject(AstrologyService);

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
    // Load kundali data from localStorage
    this.loadKundaliData();
  }

  private loadKundaliData(): void {
    const savedKundaliData = localStorage.getItem('kundaliData');
    if (savedKundaliData) {
      try {
        const kundaliData: KundaliData = JSON.parse(savedKundaliData);
        this.birthDetails = kundaliData.birthDetails;
        this.houses = kundaliData.houses;
        this.planets = kundaliData.planets;
        this.varshphalData = kundaliData.varshphal;
        this.predictions2025 = kundaliData.predictions2025;
        this.predictions2026 = kundaliData.predictions2026;
        this.cosmicJourneySummary = kundaliData.cosmicJourneySummary;
      } catch (error) {
        console.error('Error loading kundali data:', error);
      }
    }
  }

  private scrollToTop(): void {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }
  Math = Math; // Make Math available in template
  birthDetails = {
    date: '',
    place: '',
    time: '',
    lagna: '',
    rashi: '',
    nakshatra: '',
    nakshatraLord: ''
  };
  cosmicJourneySummary: string = '';

  houses: Array<{
    number: number;
    name: string;
    sign: string;
    angle: number;
    signSymbol: string;
    description: string;
  }> = [
    { number: 1, name: 'Lagna', sign: 'Scorpio', angle: 0, signSymbol: '♏', description: 'Self, personality, physical appearance. Strong placement indicates leadership qualities and determination. Mars as lord gives courage and determination.' },
    { number: 2, name: 'Dhana', sign: 'Sagittarius', angle: 30, signSymbol: '♐', description: 'Wealth, family, speech. Indicates financial stability and family values. Jupiter as lord brings wisdom and prosperity.' },
    { number: 3, name: 'Sahaja', sign: 'Capricorn', angle: 60, signSymbol: '♑', description: 'Siblings, courage, communication. Shows relationship with siblings and communication skills. Saturn as lord brings discipline and patience.' },
    { number: 4, name: 'Sukha', sign: 'Aquarius', angle: 90, signSymbol: '♒', description: 'Mother, home, education. Represents comfort, property, and maternal relationships. Saturn as lord indicates stability in property matters.' },
    { number: 5, name: 'Putra', sign: 'Pisces', angle: 120, signSymbol: '♓', description: 'Children, creativity, intelligence. Indicates progeny, creative pursuits, and wisdom. Jupiter as lord brings blessings in education and children.' },
    { number: 6, name: 'Ari', sign: 'Aries', angle: 150, signSymbol: '♈', description: 'Enemies, health, service. Represents obstacles, health matters, and service to others. Mars as lord gives strength to overcome enemies.' },
    { number: 7, name: 'Kalatra', sign: 'Taurus', angle: 180, signSymbol: '♉', description: 'Spouse, partnerships, marriage. Shows marital life and business partnerships. Venus as lord brings harmony and beauty in relationships.' },
    { number: 8, name: 'Ayush', sign: 'Gemini', angle: 210, signSymbol: '♊', description: 'Longevity, transformation, occult. Represents life span and spiritual transformation. Mercury as lord indicates interest in occult sciences.' },
    { number: 9, name: 'Bhagya', sign: 'Cancer', angle: 240, signSymbol: '♋', description: 'Fortune, father, dharma. Indicates luck, father figure, and righteous path. Moon as lord brings emotional intelligence and fortune.' },
    { number: 10, name: 'Karma', sign: 'Leo', angle: 270, signSymbol: '♌', description: 'Career, profession, reputation. Shows professional success and public image. Sun as lord brings leadership and recognition.' },
    { number: 11, name: 'Labha', sign: 'Virgo', angle: 300, signSymbol: '♍', description: 'Gains, income, friends. Represents financial gains and friendships. Mercury as lord brings intelligence in financial matters.' },
    { number: 12, name: 'Vyaya', sign: 'Libra', angle: 330, signSymbol: '♎', description: 'Expenses, losses, spirituality. Indicates expenditures and spiritual pursuits. Venus as lord brings artistic and spiritual inclinations.' }
  ];

  planets: Array<{
    name: string;
    symbol: string;
    house: number;
    sign: string;
    degree: string;
    color: string;
    description: string;
  }> = [
    { name: 'Sun', symbol: '☉', house: 10, sign: 'Leo', degree: '15°23\'', color: '#FFD700', description: 'Represents soul, ego, authority, father, government. Strong placement indicates leadership qualities.' },
    { name: 'Moon', symbol: '☽', house: 9, sign: 'Cancer', degree: '12°45\'', color: '#C0C0C0', description: 'Represents mind, emotions, mother, public. Influences mental state and emotional well-being.' },
    { name: 'Mars', symbol: '♂', house: 1, sign: 'Scorpio', degree: '8°12\'', color: '#FF4500', description: 'Represents energy, courage, aggression, younger siblings. Gives determination and fighting spirit.' },
    { name: 'Mercury', symbol: '☿', house: 11, sign: 'Virgo', degree: '22°56\'', color: '#32CD32', description: 'Represents intellect, communication, business, siblings. Influences learning and analytical abilities.' },
    { name: 'Jupiter', symbol: '♃', house: 2, sign: 'Sagittarius', degree: '18°34\'', color: '#FFA500', description: 'Represents wisdom, knowledge, guru, fortune. Brings blessings and spiritual growth.' },
    { name: 'Venus', symbol: '♀', house: 7, sign: 'Taurus', degree: '25°18\'', color: '#FF69B4', description: 'Represents love, beauty, marriage, luxury. Influences relationships and artistic pursuits.' },
    { name: 'Saturn', symbol: '♄', house: 3, sign: 'Capricorn', degree: '9°47\'', color: '#708090', description: 'Represents discipline, karma, delays, longevity. Teaches patience and perseverance.' },
    { name: 'Rahu', symbol: '☊', house: 5, sign: 'Pisces', degree: '14°29\'', color: '#9370DB', description: 'Represents desires, material pursuits, foreign connections. Brings sudden changes and material gains.' },
    { name: 'Ketu', symbol: '☋', house: 11, sign: 'Virgo', degree: '14°29\'', color: '#8B4513', description: 'Represents spirituality, detachment, past life karma. Brings spiritual awakening and intuition.' }
  ];

  varshphalData: Array<{
    icon: string;
    title: string;
    description: string;
    planet: string;
    period: string;
  }> = [
    {
      icon: '⭐',
      title: 'Career & Profession',
      description: 'The year 2025 brings significant career growth. Jupiter\'s transit in the 10th house favors professional advancement. New opportunities in leadership roles may emerge around mid-year. Focus on networking and skill development. Saturn\'s aspect brings discipline and long-term success.',
      planet: 'Jupiter',
      period: 'Mid-year peak'
    },
    {
      icon: '💑',
      title: 'Relationships & Marriage',
      description: 'Venus placement in the 7th house indicates harmony in relationships. Married life will be peaceful with deeper emotional bonding. Singles may find meaningful connections, especially in the second half of the year. Family bonds strengthen, especially with elders.',
      planet: 'Venus',
      period: 'Second half favorable'
    },
    {
      icon: '💰',
      title: 'Finance & Wealth',
      description: 'Financial stability improves significantly. Jupiter in the 2nd house brings wealth accumulation. Saturn\'s influence suggests careful planning is essential. Avoid impulsive investments. Savings and long-term investments will yield good returns. Property investments are favorable.',
      planet: 'Jupiter + Saturn',
      period: 'Steady growth'
    },
    {
      icon: '🏥',
      title: 'Health & Wellbeing',
      description: 'Overall health remains stable. Mars in the 1st house gives vitality but requires attention to stress management. Pay attention to digestive health. Regular exercise and balanced diet are recommended. Preventive care is important this year. Yoga and meditation will be beneficial.',
      planet: 'Mars',
      period: 'Maintain routine'
    },
    {
      icon: '📚',
      title: 'Education & Learning',
      description: 'Excellent period for students and those pursuing higher education. Mercury in the 11th house enhances learning abilities. Academic achievements are likely. New learning opportunities will present themselves. Rahu in the 5th house may bring interest in modern technologies.',
      planet: 'Mercury + Rahu',
      period: 'Year-round favorable'
    },
    {
      icon: '🌍',
      title: 'Travel & Movement',
      description: 'Travel opportunities may arise, especially for professional purposes. Long-distance journeys are favorable. Some relocation or change of residence is possible. Rahu\'s influence may bring foreign connections or travel abroad.',
      planet: 'Rahu',
      period: 'Unexpected opportunities'
    }
  ];

  predictions2025: Array<{
    title: string;
    description: string;
  }> = [
    {
      title: 'Career Transformation',
      description: 'The first half of 2025 brings a major shift in your professional life. Jupiter\'s favorable position in the 10th house indicates promotions, recognition, and new responsibilities. You may take on leadership roles or start a new venture. Mid-year (June-July) is particularly auspicious for career moves.'
    },
    {
      title: 'Financial Growth',
      description: 'Your financial situation improves significantly. Multiple income sources may develop. However, Saturn\'s influence requires disciplined spending. Avoid unnecessary expenses and focus on savings. Investment in property or long-term assets is favorable.'
    },
    {
      title: 'Relationship Harmony',
      description: 'Venus transits through favorable houses, bringing peace and happiness in relationships. Married couples will experience deeper bonding. Singles may find a compatible partner, especially in the second half of the year. Family relationships strengthen.'
    },
    {
      title: 'Health & Wellness',
      description: 'Overall health remains good, but minor issues related to digestion or stress may surface. Regular exercise and meditation are recommended. Pay attention to mental health and work-life balance. Preventive health checkups are advised.'
    },
    {
      title: 'Spiritual Growth',
      description: 'This year marks significant spiritual development. You may feel drawn to meditation, yoga, or spiritual practices. Inner peace and clarity increase. This is an excellent time for self-reflection and personal growth.'
    },
    {
      title: 'Educational Pursuits',
      description: 'If you are a student or pursuing further education, 2025 is highly favorable. Academic success is likely. New learning opportunities, certifications, or skill development courses will benefit your career.'
    }
  ];

  predictions2026: Array<{
    title: string;
    description: string;
  }> = [
    {
      title: 'Professional Excellence',
      description: '2026 brings even greater professional success. Your hard work from previous years pays off. You may achieve a significant milestone or recognition in your field. International opportunities or collaborations may arise. The year favors entrepreneurship and innovation.'
    },
    {
      title: 'Wealth Accumulation',
      description: 'Financial prosperity reaches new heights. Multiple revenue streams develop. Property investments yield good returns. However, maintain financial discipline. Charitable giving and helping others financially will bring positive karma.'
    },
    {
      title: 'Marital Bliss & Family',
      description: 'Family life flourishes. If married, relationships deepen with mutual understanding. For those seeking marriage, 2026 is highly favorable, especially the period from March to September. Family expansion is possible. Relationships with children improve significantly.'
    },
    {
      title: 'Health Optimization',
      description: 'Health remains stable with proper care. Focus on preventive measures and regular health checkups. Adopt a holistic approach to wellness. Mental and physical health both need attention. Yoga and meditation will be particularly beneficial.'
    },
    {
      title: 'Social Recognition',
      description: 'Your reputation and social standing improve. You may receive awards, recognition, or public appreciation. Networking and social connections prove valuable. Community involvement brings fulfillment and opportunities.'
    },
    {
      title: 'Personal Transformation',
      description: '2026 marks a period of significant personal growth and transformation. You develop greater wisdom and maturity. Life experiences teach valuable lessons. This is an excellent time for making important life decisions with confidence.'
    }
  ];
}

