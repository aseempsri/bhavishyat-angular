import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface PanchangData {
  date: string;
  tithi: {
    name: string;
    paksha: string; // Shukla or Krishna
    endTime: string;
  };
  nakshatra: {
    name: string;
    endTime: string;
  };
  yoga: {
    name: string;
    endTime: string;
  };
  karana: {
    name: string;
    endTime: string;
  };
  sunrise: string;
  sunset: string;
  moonrise: string;
  moonset: string;
  rahuKaal: {
    start: string;
    end: string;
  };
  gulikaKaal: {
    start: string;
    end: string;
  };
  yamaganda: {
    start: string;
    end: string;
  };
  abhijitMuhurat: {
    start: string;
    end: string;
  };
  amritKaal: {
    start: string;
    end: string;
  };
  brahmaMuhurat: {
    start: string;
    end: string;
  };
  vikramSamvat: string;
  shakaSamvat: string;
  day: string; // Monday, Tuesday, etc.
  ritu: string; // Season
  ayana: string; // Uttarayan or Dakshinayan
}

@Injectable({
  providedIn: 'root'
})
export class PanchangService {
  private http = inject(HttpClient);
  private cacheKey = 'panchang_data';
  private cacheDateKey = 'panchang_date';

  /**
   * Fetches daily Panchang data
   * Uses multiple fallback strategies:
   * 1. Try to fetch from API
   * 2. Use cached data if available and from today
   * 3. Generate mock data as fallback
   */
  getDailyPanchang(location?: { lat: number; lon: number }): Observable<PanchangData> {
    const today = new Date().toISOString().split('T')[0];
    const cachedDate = localStorage.getItem(this.cacheDateKey);
    
    // Return cached data if it's from today
    if (cachedDate === today) {
      const cached = localStorage.getItem(this.cacheKey);
      if (cached) {
        try {
          return of(JSON.parse(cached));
        } catch (e) {
          console.error('Error parsing cached panchang data', e);
        }
      }
    }

    // Try to fetch from API (you can replace this with actual Panchang API)
    // For now, we'll use a mock data generator that simulates daily updates
    return this.fetchPanchangFromAPI(location).pipe(
      catchError(() => {
        // If API fails, generate realistic mock data
        console.log('API unavailable, using generated panchang data');
        return of(this.generatePanchangData());
      }),
      map(data => {
        // Cache the data
        localStorage.setItem(this.cacheKey, JSON.stringify(data));
        localStorage.setItem(this.cacheDateKey, today);
        return data;
      })
    );
  }

  private fetchPanchangFromAPI(location?: { lat: number; lon: number }): Observable<PanchangData> {
    // Example API endpoint - replace with actual Panchang API
    // Some options: Drik Panchang API, Prokerala API, etc.
    const today = new Date();
    const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
    
    // For now, return an observable that will error (to trigger fallback)
    // In production, replace with actual API call
    return this.http.get<PanchangData>(`https://api.example.com/panchang/${dateStr}`).pipe(
      catchError(() => {
        // This will trigger the fallback to generatePanchangData
        throw new Error('API unavailable');
      })
    );
  }

  /**
   * Generates realistic Panchang data based on current date
   * This simulates daily updates by varying data based on the date
   */
  private generatePanchangData(): PanchangData {
    const today = new Date();
    const dayOfYear = this.getDayOfYear(today);
    
    // Tithi names cycle through 30 tithis
    const tithiNames = [
      'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
      'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
      'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
      'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
      'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
      'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya'
    ];
    
    const nakshatraNames = [
      'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira',
      'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha',
      'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati',
      'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
      'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
      'Uttara Bhadrapada', 'Revati'
    ];
    
    const yogaNames = [
      'Vishkambha', 'Preeti', 'Ayushman', 'Saubhagya', 'Shobhana',
      'Atiganda', 'Sukarma', 'Dhriti', 'Shula', 'Ganda',
      'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra',
      'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva',
      'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma',
      'Indra', 'Vaidhriti'
    ];
    
    const karanaNames = [
      'Bava', 'Balava', 'Kaulava', 'Taitila', 'Garija',
      'Vanija', 'Visti', 'Shakuni', 'Chatushpada', 'Naga',
      'Kimstughna'
    ];
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const rituNames = ['Vasant', 'Grishma', 'Varsha', 'Sharad', 'Hemant', 'Shishir'];
    
    const tithiIndex = dayOfYear % 30;
    const paksha = tithiIndex < 15 ? 'Shukla' : 'Krishna';
    const nakshatraIndex = dayOfYear % 27;
    const yogaIndex = dayOfYear % 27;
    const karanaIndex = dayOfYear % 11;
    const rituIndex = Math.floor((today.getMonth() + 1) / 2) % 6;
    
    // Calculate sunrise/sunset times (simplified - in production use actual calculations)
    const sunriseHour = 6 + (dayOfYear % 3);
    const sunsetHour = 18 - (dayOfYear % 2);
    
    // Generate times with some variation
    const tithiEndHour = (8 + (dayOfYear * 2) % 12) % 24;
    const nakshatraEndHour = (10 + (dayOfYear * 3) % 14) % 24;
    
    return {
      date: today.toISOString().split('T')[0],
      tithi: {
        name: tithiNames[tithiIndex],
        paksha: paksha,
        endTime: `${String(tithiEndHour).padStart(2, '0')}:${String((dayOfYear * 7) % 60).padStart(2, '0')}`
      },
      nakshatra: {
        name: nakshatraNames[nakshatraIndex],
        endTime: `${String(nakshatraEndHour).padStart(2, '0')}:${String((dayOfYear * 11) % 60).padStart(2, '0')}`
      },
      yoga: {
        name: yogaNames[yogaIndex],
        endTime: `${String((12 + dayOfYear) % 24).padStart(2, '0')}:${String((dayOfYear * 13) % 60).padStart(2, '0')}`
      },
      karana: {
        name: karanaNames[karanaIndex],
        endTime: `${String((14 + dayOfYear) % 24).padStart(2, '0')}:${String((dayOfYear * 17) % 60).padStart(2, '0')}`
      },
      sunrise: `${String(sunriseHour).padStart(2, '0')}:${String(30 + (dayOfYear % 30)).padStart(2, '0')}`,
      sunset: `${String(sunsetHour).padStart(2, '0')}:${String(30 + (dayOfYear % 30)).padStart(2, '0')}`,
      moonrise: `${String((18 + dayOfYear) % 24).padStart(2, '0')}:${String((dayOfYear * 5) % 60).padStart(2, '0')}`,
      moonset: `${String((6 + dayOfYear) % 24).padStart(2, '0')}:${String((dayOfYear * 9) % 60).padStart(2, '0')}`,
      rahuKaal: {
        start: `${String(7 + (dayOfYear % 3)).padStart(2, '0')}:00`,
        end: `${String(8 + (dayOfYear % 3)).padStart(2, '0')}:30`
      },
      gulikaKaal: {
        start: `${String(12 + (dayOfYear % 2)).padStart(2, '0')}:00`,
        end: `${String(13 + (dayOfYear % 2)).padStart(2, '0')}:30`
      },
      yamaganda: {
        start: `${String(10 + (dayOfYear % 2)).padStart(2, '0')}:00`,
        end: `${String(11 + (dayOfYear % 2)).padStart(2, '0')}:30`
      },
      abhijitMuhurat: {
        start: `${String(11 + (dayOfYear % 2)).padStart(2, '0')}:45`,
        end: `${String(12 + (dayOfYear % 2)).padStart(2, '0')}:30`
      },
      amritKaal: {
        start: `${String(5 + (dayOfYear % 2)).padStart(2, '0')}:30`,
        end: `${String(7 + (dayOfYear % 2)).padStart(2, '0')}:00`
      },
      brahmaMuhurat: {
        start: `${String(4 + (dayOfYear % 2)).padStart(2, '0')}:30`,
        end: `${String(5 + (dayOfYear % 2)).padStart(2, '0')}:30`
      },
      vikramSamvat: `2081`,
      shakaSamvat: `1946`,
      day: dayNames[today.getDay()],
      ritu: rituNames[rituIndex],
      ayana: today.getMonth() < 6 ? 'Uttarayan' : 'Dakshinayan'
    };
  }

  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Clears cached Panchang data (useful for forcing refresh)
   */
  clearCache(): void {
    localStorage.removeItem(this.cacheKey);
    localStorage.removeItem(this.cacheDateKey);
  }
}

