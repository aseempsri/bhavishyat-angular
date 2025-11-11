import { Component } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';

interface EscapeItem {
    name: string;
    location: string;
    adults: number;
    rooms: number;
    priceOriginal?: number;
    pricePerNight: number;
    rating?: number;
    images: string[];
    bookingUrl: string;
}

@Component({
    selector: 'app-escape-retreats',
    imports: [HeaderComponent],
    templateUrl: './escape-retreats.component.html',
    styleUrl: './escape-retreats.component.css'
})
export class EscapeRetreatsComponent {
    // NOTE: Content summarized & adapted from ezyescape.com rather than full copy to respect copyright.
    escapes: EscapeItem[] = [
        {
            name: 'Aipan Homestays',
            location: 'Mukteshwar',
            adults: 4,
            rooms: 2,
            priceOriginal: 3000,
            pricePerNight: 2281,
            rating: 4.8,
            images: [
                'https://ezyescape.com/admin/upload/PHOTO-2023-09-09-00-02-55%202.jpg',
                'https://ezyescape.com/admin/upload/175b6073-3aab-459e-8663-50785a20ab65.webp'
            ],
            bookingUrl: 'https://ezyescape.com/escape.php'
        },
        {
            name: 'Gulmohar Homes',
            location: 'Mukteshwar',
            adults: 8,
            rooms: 2,
            priceOriginal: 3000,
            pricePerNight: 2500,
            rating: 4.8,
            images: [
                'https://ezyescape.com/admin/upload/GULMOHAR%20DRONE.jpg',
                'https://ezyescape.com/admin/upload/GULMOHAR%20DRONE.jpg'
            ],
            bookingUrl: 'https://ezyescape.com/escape.php'
        },
        {
            name: 'Manav Hill Resort',
            location: 'Himachal Pradesh',
            adults: 27,
            rooms: 9,
            priceOriginal: 3000,
            pricePerNight: 2500,
            rating: 4.8,
            images: [
                'https://ezyescape.com/admin/upload/manav%20hill%20himachal.jpg',
                'https://ezyescape.com/admin/upload/manav%201.avif'
            ],
            bookingUrl: 'https://ezyescape.com/escape.php'
        },
        {
            name: 'Mer Homestay',
            location: 'Mukteshwar',
            adults: 8,
            rooms: 2,
            priceOriginal: 3000,
            pricePerNight: 3000,
            rating: 4.8,
            images: [
                'https://ezyescape.com/admin/upload/anand%20out.jpg',
                'https://ezyescape.com/admin/upload/anand%20outer.jpg'
            ],
            bookingUrl: 'https://ezyescape.com/escape.php'
        },
        {
            name: 'Ram Niwas',
            location: 'Varanasi',
            adults: 18,
            rooms: 7,
            priceOriginal: 3000,
            pricePerNight: 1800,
            rating: 4.8,
            images: [
                'https://ezyescape.com/admin/upload/1748510139_im.jpg',
                'https://ezyescape.com/admin/upload/1748510139_im3.jpg'
            ],
            bookingUrl: 'https://ezyescape.com/escape.php'
        }
    ];
}
