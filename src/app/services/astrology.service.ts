import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface BirthDetails {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
}

export interface KundaliData {
  birthDetails: {
    date: string;
    time: string;
    place: string;
    lagna: string;
    rashi: string;
    nakshatra: string;
    nakshatraLord: string;
  };
  houses: Array<{
    number: number;
    name: string;
    sign: string;
    angle: number;
    signSymbol: string;
    description: string;
  }>;
  planets: Array<{
    name: string;
    symbol: string;
    house: number;
    sign: string;
    degree: string;
    color: string;
    description: string;
  }>;
  varshphal: Array<{
    icon: string;
    title: string;
    description: string;
    planet: string;
    period: string;
  }>;
  predictions2025: Array<{
    title: string;
    description: string;
  }>;
  predictions2026: Array<{
    title: string;
    description: string;
  }>;
  cosmicJourneySummary: string;
}

@Injectable({
  providedIn: 'root'
})
export class AstrologyService {
  private apiUrl = 'https://api.vedicastroapi.com/v3'; // Example API - replace with actual API

  constructor(private http: HttpClient) { }

  calculateKundali(birthDetails: BirthDetails): Observable<KundaliData> {
    // For now, we'll use a mock calculation
    // In production, you would call an actual astrology API
    return this.calculateKundaliMock(birthDetails);
  }

  private calculateKundaliMock(birthDetails: BirthDetails): Observable<KundaliData> {
    // Parse birth details
    const birthDate = new Date(birthDetails.dateOfBirth);
    const [hours, minutes] = birthDetails.timeOfBirth.split(':').map(Number);
    
    // Calculate basic astrological data
    // This is a simplified mock - in production, use a real astrology library/API
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();
    const hour = hours;
    
    // Simplified calculations (these are mock values - use real astrology calculations)
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                   'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const signSymbols = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
    const nakshatras = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
                       'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
                       'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
                       'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
                       'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'];
    const planetNames = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
    const planetSymbols = ['☉', '☽', '♂', '☿', '♃', '♀', '♄', '☊', '☋'];
    const planetColors = ['#FFD700', '#C0C0C0', '#FF4500', '#32CD32', '#FFA500', '#FF69B4', '#708090', '#9370DB', '#8B4513'];
    
    const lagnaIndex = (month + day + hour) % 12;
    const rashiIndex = (month + day) % 12;
    const nakshatraIndex = (day + hour) % 27;
    
    const lagna = signs[lagnaIndex];
    const rashi = signs[rashiIndex];
    const nakshatra = nakshatras[nakshatraIndex];
    const nakshatraLords = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
    const nakshatraLord = nakshatraLords[Math.floor(nakshatraIndex / 3) % 9];

    // Generate houses
    const houses = signs.map((sign, index) => {
      const houseIndex = (lagnaIndex + index) % 12;
      const houseSign = signs[houseIndex];
      const houseSymbol = signSymbols[houseIndex];
      const houseNames = ['Lagna', 'Dhana', 'Sahaja', 'Sukha', 'Putra', 'Ari',
                          'Kalatra', 'Ayush', 'Bhagya', 'Karma', 'Labha', 'Vyaya'];
      const houseDescriptions = [
        'Self, personality, physical appearance. Strong placement indicates leadership qualities and determination.',
        'Wealth, family, speech. Indicates financial stability and family values.',
        'Siblings, courage, communication. Shows relationship with siblings and communication skills.',
        'Mother, home, education. Represents comfort, property, and maternal relationships.',
        'Children, creativity, intelligence. Indicates progeny, creative pursuits, and wisdom.',
        'Enemies, health, service. Represents obstacles, health matters, and service to others.',
        'Spouse, partnerships, marriage. Shows marital life and business partnerships.',
        'Longevity, transformation, occult. Represents life span and spiritual transformation.',
        'Fortune, father, dharma. Indicates luck, father figure, and righteous path.',
        'Career, profession, reputation. Shows professional success and public image.',
        'Gains, income, friends. Represents financial gains and friendships.',
        'Expenses, losses, spirituality. Indicates expenditures and spiritual pursuits.'
      ];
      
      return {
        number: index + 1,
        name: houseNames[index],
        sign: houseSign,
        angle: index * 30,
        signSymbol: houseSymbol,
        description: houseDescriptions[index]
      };
    });

    // Generate planets
    const planets = planetNames.map((name, index) => {
      const planetHouse = (lagnaIndex + index * 2) % 12 + 1;
      const planetSignIndex = (lagnaIndex + index * 3) % 12;
      const planetSign = signs[planetSignIndex];
      const degree = `${(day + index * 5) % 30}°${(hour + index * 3) % 60}'`;
      
      const planetDescriptions = [
        'Represents soul, ego, authority, father, government. Strong placement indicates leadership qualities.',
        'Represents mind, emotions, mother, public. Influences mental state and emotional well-being.',
        'Represents energy, courage, aggression, younger siblings. Gives determination and fighting spirit.',
        'Represents intellect, communication, business, siblings. Influences learning and analytical abilities.',
        'Represents wisdom, knowledge, guru, fortune. Brings blessings and spiritual growth.',
        'Represents love, beauty, marriage, luxury. Influences relationships and artistic pursuits.',
        'Represents discipline, karma, delays, longevity. Teaches patience and perseverance.',
        'Represents desires, material pursuits, foreign connections. Brings sudden changes and material gains.',
        'Represents spirituality, detachment, past life karma. Brings spiritual awakening and intuition.'
      ];
      
      return {
        name,
        symbol: planetSymbols[index],
        house: planetHouse,
        sign: planetSign,
        degree,
        color: planetColors[index],
        description: planetDescriptions[index]
      };
    });

    // Varshphal data
    const varshphal = [
      {
        icon: '⭐',
        title: 'Career & Profession',
        description: `The year 2025 brings significant career growth for ${birthDetails.name}. Jupiter's transit in the 10th house favors professional advancement. New opportunities in leadership roles may emerge around mid-year. Focus on networking and skill development. Saturn's aspect brings discipline and long-term success.`,
        planet: 'Jupiter',
        period: 'Mid-year peak'
      },
      {
        icon: '💑',
        title: 'Relationships & Marriage',
        description: `Venus placement in the 7th house indicates harmony in relationships for ${birthDetails.name}. Married life will be peaceful with deeper emotional bonding. Singles may find meaningful connections, especially in the second half of the year. Family bonds strengthen, especially with elders.`,
        planet: 'Venus',
        period: 'Second half favorable'
      },
      {
        icon: '💰',
        title: 'Finance & Wealth',
        description: `Financial stability improves significantly for ${birthDetails.name}. Jupiter in the 2nd house brings wealth accumulation. Saturn's influence suggests careful planning is essential. Avoid impulsive investments. Savings and long-term investments will yield good returns. Property investments are favorable.`,
        planet: 'Jupiter + Saturn',
        period: 'Steady growth'
      },
      {
        icon: '🏥',
        title: 'Health & Wellbeing',
        description: `Overall health remains stable for ${birthDetails.name}. Mars in the 1st house gives vitality but requires attention to stress management. Pay attention to digestive health. Regular exercise and balanced diet are recommended. Preventive care is important this year. Yoga and meditation will be beneficial.`,
        planet: 'Mars',
        period: 'Maintain routine'
      },
      {
        icon: '📚',
        title: 'Education & Learning',
        description: `Excellent period for students and those pursuing higher education. Mercury in the 11th house enhances learning abilities for ${birthDetails.name}. Academic achievements are likely. New learning opportunities will present themselves. Rahu in the 5th house may bring interest in modern technologies.`,
        planet: 'Mercury + Rahu',
        period: 'Year-round favorable'
      },
      {
        icon: '🌍',
        title: 'Travel & Movement',
        description: `Travel opportunities may arise for ${birthDetails.name}, especially for professional purposes. Long-distance journeys are favorable. Some relocation or change of residence is possible. Rahu's influence may bring foreign connections or travel abroad.`,
        planet: 'Rahu',
        period: 'Unexpected opportunities'
      }
    ];

    const predictions2025 = [
      {
        title: 'Career Transformation',
        description: `The first half of 2025 brings a major shift in ${birthDetails.name}'s professional life. Jupiter's favorable position in the 10th house indicates promotions, recognition, and new responsibilities. You may take on leadership roles or start a new venture. Mid-year (June-July) is particularly auspicious for career moves.`
      },
      {
        title: 'Financial Growth',
        description: `Your financial situation improves significantly. Multiple income sources may develop. However, Saturn's influence requires disciplined spending. Avoid unnecessary expenses and focus on savings. Investment in property or long-term assets is favorable.`
      },
      {
        title: 'Relationship Harmony',
        description: `Venus transits through favorable houses, bringing peace and happiness in relationships. Married couples will experience deeper bonding. Singles may find a compatible partner, especially in the second half of the year. Family relationships strengthen.`
      },
      {
        title: 'Health & Wellness',
        description: `Overall health remains good, but minor issues related to digestion or stress may surface. Regular exercise and meditation are recommended. Pay attention to mental health and work-life balance. Preventive health checkups are advised.`
      },
      {
        title: 'Spiritual Growth',
        description: `This year marks significant spiritual development. You may feel drawn to meditation, yoga, or spiritual practices. Inner peace and clarity increase. This is an excellent time for self-reflection and personal growth.`
      },
      {
        title: 'Educational Pursuits',
        description: `If you are a student or pursuing further education, 2025 is highly favorable. Academic success is likely. New learning opportunities, certifications, or skill development courses will benefit your career.`
      }
    ];

    const predictions2026 = [
      {
        title: 'Professional Excellence',
        description: `2026 brings even greater professional success for ${birthDetails.name}. Your hard work from previous years pays off. You may achieve a significant milestone or recognition in your field. International opportunities or collaborations may arise. The year favors entrepreneurship and innovation.`
      },
      {
        title: 'Wealth Accumulation',
        description: `Financial prosperity reaches new heights. Multiple revenue streams develop. Property investments yield good returns. However, maintain financial discipline. Charitable giving and helping others financially will bring positive karma.`
      },
      {
        title: 'Marital Bliss & Family',
        description: `Family life flourishes. If married, relationships deepen with mutual understanding. For those seeking marriage, 2026 is highly favorable, especially the period from March to September. Family expansion is possible. Relationships with children improve significantly.`
      },
      {
        title: 'Health Optimization',
        description: `Health remains stable with proper care. Focus on preventive measures and regular health checkups. Adopt a holistic approach to wellness. Mental and physical health both need attention. Yoga and meditation will be particularly beneficial.`
      },
      {
        title: 'Social Recognition',
        description: `Your reputation and social standing improve. You may receive awards, recognition, or public appreciation. Networking and social connections prove valuable. Community involvement brings fulfillment and opportunities.`
      },
      {
        title: 'Personal Transformation',
        description: `2026 marks a period of significant personal growth and transformation. You develop greater wisdom and maturity. Life experiences teach valuable lessons. This is an excellent time for making important life decisions with confidence.`
      }
    ];

    const cosmicJourneySummary = `${birthDetails.name}, your cosmic journey is guided by the ${lagna} Lagna and ${rashi} Rashi, with the ${nakshatra} Nakshatra ruled by ${nakshatraLord}. Your birth chart reveals a path of ${lagna === 'Scorpio' ? 'transformation and depth' : 'growth and discovery'}. The planetary positions indicate strong potential in ${planets.find(p => p.house === 10)?.sign || 'career'} matters, with ${planets.find(p => p.house === 7)?.name || 'Venus'} blessing your relationships. Your journey through 2025 and 2026 will be marked by significant growth in professional and personal spheres, with spiritual evolution playing a key role in your transformation.`;

    return of({
      birthDetails: {
        date: this.formatDate(birthDate),
        time: birthDetails.timeOfBirth,
        place: birthDetails.placeOfBirth,
        lagna,
        rashi,
        nakshatra,
        nakshatraLord
      },
      houses,
      planets,
      varshphal,
      predictions2025,
      predictions2026,
      cosmicJourneySummary
    });
  }

  private formatDate(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const suffix = this.getDaySuffix(day);
    return `${day}${suffix} ${month} ${year}`;
  }

  private getDaySuffix(day: number): string {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }
}
