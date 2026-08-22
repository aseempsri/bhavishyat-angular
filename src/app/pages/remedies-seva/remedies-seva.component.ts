import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren, inject, DOCUMENT } from '@angular/core';

import { HeaderComponent } from '../../components/header/header.component';
import { AdBannerComponent } from '../../components/ad-banner/ad-banner.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  openWhatsApp,
  WHATSAPP_CONSULTATION_MESSAGE,
  WHATSAPP_DISPLAY
} from '../../core/contact/contact.config';

interface RemedyProgram {
    id: string;
    title: string;
    description: string;
    icon: string;
    image: string;
    features: string[];
    donationAmounts: number[];
    impact: string;
}

interface LaganRemedy {
    id: string;
    name: string;
    description: string;
    suggestedPrograms: string[];
    benefits: string[];
}

interface CarouselMedia {
    type: 'image' | 'video';
    src: string;
}

@Component({
    selector: 'app-remedies-seva',
    imports: [HeaderComponent, CommonModule, FormsModule, AdBannerComponent],
    templateUrl: './remedies-seva.component.html',
    styleUrl: './remedies-seva.component.css'
})
export class RemediesSevaComponent implements OnInit, AfterViewInit, OnDestroy {
    readonly whatsappDisplay = WHATSAPP_DISPLAY;

    connectViaWhatsApp(event: Event): void {
        event.preventDefault();
        openWhatsApp(WHATSAPP_CONSULTATION_MESSAGE, 'connect-with-us');
    }

    @ViewChildren('naulaVideo') naulaVideos!: QueryList<ElementRef<HTMLVideoElement>>;

    private document = inject(DOCUMENT);
    private carouselTimer?: ReturnType<typeof setInterval>;
    private naulaAdvanceTimer?: ReturnType<typeof setTimeout>;

    selectedLagan: string = '';
    selectedProgram: string = '';
    donationAmount: number = 0;
    customAmount: number = 0;
    showCustomAmount: boolean = false;
    donorName: string = '';
    donorEmail: string = '';
    donorPhone: string = '';
    donorMessage: string = '';

    naulaCarouselIndex = 0;
    naulaMedia: CarouselMedia[] = (
        [
            { type: 'image', src: 'assets/naula-dhara/01.jpg' },
            { type: 'image', src: 'assets/naula-dhara/02.jpg' },
            { type: 'image', src: 'assets/naula-dhara/03.jpg' },
            { type: 'image', src: 'assets/naula-dhara/04.jpg' },
            { type: 'image', src: 'assets/naula-dhara/05.jpg' },
            { type: 'image', src: 'assets/naula-dhara/06.jpg' },
            { type: 'image', src: 'assets/naula-dhara/07.jpg' },
            { type: 'video', src: 'assets/naula-dhara/v01.mp4' },
            { type: 'video', src: 'assets/naula-dhara/v02.mp4' },
            { type: 'video', src: 'assets/naula-dhara/v03.mp4' }
        ] as const
    ).map((item): CarouselMedia => ({
        type: item.type,
        src: this.getBaseHref() + item.src
    }));

    gaushalaCarouselIndex = 0;
    gaushalaImages: string[] = [
        'assets/gaushala/01.jpg',
        'assets/gaushala/02.jpg'
    ].map((path) => this.getBaseHref() + path);

    templeCarouselIndex = 0;
    templeImages: string[] = [
        'assets/temple/01.jpg'
    ].map((path) => this.getBaseHref() + path);

    treeCarouselIndex = 0;
    treeImages: string[] = [
        'assets/tree-plantation/01.jpg',
        'assets/tree-plantation/02.jpg',
        'assets/tree-plantation/03.jpg',
        'assets/tree-plantation/04.jpg'
    ].map((path) => this.getBaseHref() + path);

    remedyPrograms: RemedyProgram[] = [
        {
            id: 'water',
            title: 'Water Reservoir / Naula Restoration',
            description: 'Support the restoration of ancient water sources (Naulas) and construction of water reservoirs to ensure clean water access for communities.',
            icon: '💧',
            image: this.getBaseHref() + 'assets/naula-dhara/01.jpg',
            features: [
                'Restoration of traditional water sources',
                'Community water access improvement',
                'Sustainable water management',
                'Heritage conservation'
            ],
            donationAmounts: [500, 1000, 2500, 5000, 10000],
            impact: 'Each donation helps restore water sources that serve hundreds of families'
        },
        {
            id: 'tree',
            title: 'Tree Plantation with Geo-Tagging',
            description: 'Plant trees with complete geo-tagging, unique ID profiling, and receive monthly development updates on your tree\'s growth.',
            icon: '🌳',
            image: this.getBaseHref() + 'assets/tree-plantation/01.jpg',
            features: [
                'Geo-tagged tree location',
                'Unique ID for each tree',
                'Monthly growth updates',
                'Photo documentation',
                'Environmental impact tracking'
            ],
            donationAmounts: [200, 500, 1000, 2500, 5000],
            impact: 'Track your tree\'s journey from sapling to maturity with regular updates'
        },
        {
            id: 'gaushala',
            title: 'Gaushala Donation & Support',
            description: 'Support cow shelters (Gaushalas) that provide care for abandoned and rescued cows, preserving this sacred tradition.',
            icon: '🐄',
            image: this.getBaseHref() + 'assets/gaushala/01.jpg',
            features: [
                'Daily feed and care support',
                'Medical treatment for cows',
                'Shelter maintenance',
                'Sustainable gaushala operations'
            ],
            donationAmounts: [300, 500, 1000, 2500, 10000],
            impact: 'Your contribution ensures proper care and nutrition for rescued cows'
        },
        {
            id: 'temple',
            title: 'Temple Restoration Support',
            description: 'Contribute to the restoration and maintenance of ancient temples, preserving our cultural and spiritual heritage.',
            icon: '🕉️',
            image: this.getBaseHref() + 'assets/temple/01.jpg',
            features: [
                'Temple structure restoration',
                'Heritage conservation',
                'Ritual support',
                'Community spiritual spaces'
            ],
            donationAmounts: [500, 1000, 5000, 10000, 25000],
            impact: 'Help preserve sacred spaces for future generations'
        }
    ];

    laganRemedies: LaganRemedy[] = [
        {
            id: 'mangal',
            name: 'Mangal Dosh Remedies',
            description: 'Remedies for Mars-related afflictions in your birth chart',
            suggestedPrograms: ['water', 'temple'],
            benefits: [
                'Reduces Mangal Dosh effects',
                'Brings peace and harmony',
                'Improves relationships'
            ]
        },
        {
            id: 'shani',
            name: 'Shani Dosh Remedies',
            description: 'Remedies for Saturn-related challenges in your horoscope',
            suggestedPrograms: ['tree', 'gaushala'],
            benefits: [
                'Mitigates Shani\'s negative effects',
                'Brings stability and growth',
                'Reduces obstacles in life'
            ]
        },
        {
            id: 'rahu',
            name: 'Rahu-Ketu Remedies',
            description: 'Remedies for Rahu and Ketu related issues',
            suggestedPrograms: ['water', 'temple', 'tree'],
            benefits: [
                'Balances Rahu-Ketu energies',
                'Removes illusions and confusion',
                'Brings clarity and purpose'
            ]
        },
        {
            id: 'general',
            name: 'General Spiritual Remedies',
            description: 'General remedies for overall spiritual well-being',
            suggestedPrograms: ['tree', 'gaushala', 'temple'],
            benefits: [
                'Enhances spiritual growth',
                'Brings positive karma',
                'Creates lasting impact'
            ]
        }
    ];

    selectLagan(laganId: string): void {
        this.selectedLagan = laganId;
        const lagan = this.laganRemedies.find(r => r.id === laganId);
        if (lagan && lagan.suggestedPrograms.length > 0) {
            this.selectedProgram = lagan.suggestedPrograms[0];
        }
    }

    ngOnInit(): void {
        this.startFeatureCarousels();
        this.scheduleNaulaAdvance();
    }

    ngAfterViewInit(): void {
        this.syncNaulaVideos();
    }

    ngOnDestroy(): void {
        this.stopFeatureCarousels();
        this.clearNaulaAdvance();
        this.pauseAllNaulaVideos();
    }

    get waterProgram(): RemedyProgram | undefined {
        return this.remedyPrograms.find((program) => program.id === 'water');
    }

    get gaushalaProgram(): RemedyProgram | undefined {
        return this.remedyPrograms.find((program) => program.id === 'gaushala');
    }

    get templeProgram(): RemedyProgram | undefined {
        return this.remedyPrograms.find((program) => program.id === 'temple');
    }

    get treeProgram(): RemedyProgram | undefined {
        return this.remedyPrograms.find((program) => program.id === 'tree');
    }

    get otherPrograms(): RemedyProgram[] {
        return this.remedyPrograms.filter(
            (program) =>
                program.id !== 'water' &&
                program.id !== 'gaushala' &&
                program.id !== 'temple' &&
                program.id !== 'tree'
        );
    }

    nextNaulaSlide(event?: Event): void {
        event?.stopPropagation();
        this.advanceNaulaSlide();
    }

    prevNaulaSlide(event?: Event): void {
        event?.stopPropagation();
        this.naulaCarouselIndex =
            (this.naulaCarouselIndex - 1 + this.naulaMedia.length) % this.naulaMedia.length;
        this.afterNaulaSlideChange();
    }

    goToNaulaSlide(index: number, event?: Event): void {
        event?.stopPropagation();
        this.naulaCarouselIndex = index;
        this.afterNaulaSlideChange();
    }

    onNaulaVideoEnded(): void {
        this.advanceNaulaSlide();
    }

    nextGaushalaSlide(event?: Event): void {
        event?.stopPropagation();
        this.gaushalaCarouselIndex = (this.gaushalaCarouselIndex + 1) % this.gaushalaImages.length;
        this.restartFeatureCarousels();
    }

    prevGaushalaSlide(event?: Event): void {
        event?.stopPropagation();
        this.gaushalaCarouselIndex =
            (this.gaushalaCarouselIndex - 1 + this.gaushalaImages.length) % this.gaushalaImages.length;
        this.restartFeatureCarousels();
    }

    goToGaushalaSlide(index: number, event?: Event): void {
        event?.stopPropagation();
        this.gaushalaCarouselIndex = index;
        this.restartFeatureCarousels();
    }

    nextTempleSlide(event?: Event): void {
        event?.stopPropagation();
        if (this.templeImages.length < 2) {
            return;
        }
        this.templeCarouselIndex = (this.templeCarouselIndex + 1) % this.templeImages.length;
        this.restartFeatureCarousels();
    }

    prevTempleSlide(event?: Event): void {
        event?.stopPropagation();
        if (this.templeImages.length < 2) {
            return;
        }
        this.templeCarouselIndex =
            (this.templeCarouselIndex - 1 + this.templeImages.length) % this.templeImages.length;
        this.restartFeatureCarousels();
    }

    goToTempleSlide(index: number, event?: Event): void {
        event?.stopPropagation();
        this.templeCarouselIndex = index;
        this.restartFeatureCarousels();
    }

    nextTreeSlide(event?: Event): void {
        event?.stopPropagation();
        this.treeCarouselIndex = (this.treeCarouselIndex + 1) % this.treeImages.length;
        this.restartFeatureCarousels();
    }

    prevTreeSlide(event?: Event): void {
        event?.stopPropagation();
        this.treeCarouselIndex =
            (this.treeCarouselIndex - 1 + this.treeImages.length) % this.treeImages.length;
        this.restartFeatureCarousels();
    }

    goToTreeSlide(index: number, event?: Event): void {
        event?.stopPropagation();
        this.treeCarouselIndex = index;
        this.restartFeatureCarousels();
    }

    private advanceNaulaSlide(): void {
        this.naulaCarouselIndex = (this.naulaCarouselIndex + 1) % this.naulaMedia.length;
        this.afterNaulaSlideChange();
    }

    private afterNaulaSlideChange(): void {
        this.scheduleNaulaAdvance();
        // Wait a tick so the active video element is in the DOM with the new index.
        setTimeout(() => this.syncNaulaVideos(), 0);
    }

    private scheduleNaulaAdvance(): void {
        this.clearNaulaAdvance();
        const current = this.naulaMedia[this.naulaCarouselIndex];
        if (!current || this.naulaMedia.length < 2) {
            return;
        }

        // Images auto-advance after 1s; videos advance when playback ends.
        if (current.type === 'image') {
            this.naulaAdvanceTimer = setTimeout(() => this.advanceNaulaSlide(), 2000);
        }
    }

    private clearNaulaAdvance(): void {
        if (this.naulaAdvanceTimer) {
            clearTimeout(this.naulaAdvanceTimer);
            this.naulaAdvanceTimer = undefined;
        }
    }

    private syncNaulaVideos(): void {
        const videoEls = this.naulaVideos?.toArray() ?? [];
        let videoOrdinal = 0;

        this.naulaMedia.forEach((item, mediaIndex) => {
            if (item.type !== 'video') {
                return;
            }

            const video = videoEls[videoOrdinal]?.nativeElement;
            videoOrdinal += 1;
            if (!video) {
                return;
            }

            if (mediaIndex === this.naulaCarouselIndex) {
                video.muted = true;
                video.currentTime = 0;
                const playPromise = video.play();
                if (playPromise) {
                    playPromise.catch(() => {
                        // Autoplay can be blocked; keep muted retry soft-fail.
                    });
                }
            } else {
                video.pause();
                video.currentTime = 0;
            }
        });
    }

    private pauseAllNaulaVideos(): void {
        this.naulaVideos?.forEach((ref) => {
            ref.nativeElement.pause();
        });
    }

    private startFeatureCarousels(): void {
        this.stopFeatureCarousels();
        this.carouselTimer = setInterval(() => {
            if (this.gaushalaImages.length > 1) {
                this.gaushalaCarouselIndex =
                    (this.gaushalaCarouselIndex + 1) % this.gaushalaImages.length;
            }
            if (this.templeImages.length > 1) {
                this.templeCarouselIndex =
                    (this.templeCarouselIndex + 1) % this.templeImages.length;
            }
            if (this.treeImages.length > 1) {
                this.treeCarouselIndex = (this.treeCarouselIndex + 1) % this.treeImages.length;
            }
        }, 2000);
    }

    private stopFeatureCarousels(): void {
        if (this.carouselTimer) {
            clearInterval(this.carouselTimer);
            this.carouselTimer = undefined;
        }
    }

    private restartFeatureCarousels(): void {
        this.startFeatureCarousels();
    }

    private getBaseHref(): string {
        const baseTag = this.document.querySelector('base');
        return baseTag?.getAttribute('href') || '/';
    }

    selectProgram(programId: string): void {
        this.selectedProgram = programId;
        this.donationAmount = 0;
        this.showCustomAmount = false;
    }

    selectDonationAmount(amount: number): void {
        this.donationAmount = amount;
        this.showCustomAmount = false;
        this.customAmount = 0;
    }

    toggleCustomAmount(): void {
        this.showCustomAmount = !this.showCustomAmount;
        if (this.showCustomAmount) {
            this.donationAmount = 0;
        }
    }

    submitDonation(): void {
        const finalAmount = this.showCustomAmount && this.customAmount > 0 
            ? this.customAmount 
            : this.donationAmount;

        if (!finalAmount || finalAmount <= 0) {
            alert('Please select or enter a donation amount');
            return;
        }

        if (!this.selectedProgram) {
            alert('Please select a program to support');
            return;
        }

        // Here you would integrate with payment gateway
        console.log('Donation Details:', {
            program: this.selectedProgram,
            amount: finalAmount,
            lagan: this.selectedLagan,
            donor: {
                name: this.donorName,
                email: this.donorEmail,
                phone: this.donorPhone,
                message: this.donorMessage
            }
        });

        alert(`Thank you for your donation of ₹${finalAmount}! You will receive a confirmation email shortly.`);
        
        // Reset form
        this.resetForm();
    }

    resetForm(): void {
        this.donationAmount = 0;
        this.customAmount = 0;
        this.showCustomAmount = false;
        this.donorName = '';
        this.donorEmail = '';
        this.donorPhone = '';
        this.donorMessage = '';
    }

    get selectedProgramData(): RemedyProgram | undefined {
        return this.remedyPrograms.find(p => p.id === this.selectedProgram);
    }

    get selectedLaganData(): LaganRemedy | undefined {
        return this.laganRemedies.find(r => r.id === this.selectedLagan);
    }

    getSelectedProgram(): RemedyProgram | undefined {
        return this.selectedProgramData;
    }

    getSelectedLaganRemedy(): LaganRemedy | undefined {
        return this.selectedLaganData;
    }

    handleImageError(event: Event): void {
        const img = event.target as HTMLImageElement;
        if (img) {
            img.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80';
        }
    }
}

