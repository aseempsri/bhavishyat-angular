import { Component } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

@Component({
    selector: 'app-remedies-seva',
    imports: [HeaderComponent, CommonModule, FormsModule],
    templateUrl: './remedies-seva.component.html',
    styleUrl: './remedies-seva.component.css'
})
export class RemediesSevaComponent {
    selectedLagan: string = '';
    selectedProgram: string = '';
    donationAmount: number = 0;
    customAmount: number = 0;
    showCustomAmount: boolean = false;
    donorName: string = '';
    donorEmail: string = '';
    donorPhone: string = '';
    donorMessage: string = '';

    remedyPrograms: RemedyProgram[] = [
        {
            id: 'water',
            title: 'Water Reservoir / Naula Restoration',
            description: 'Support the restoration of ancient water sources (Naulas) and construction of water reservoirs to ensure clean water access for communities.',
            icon: '💧',
            image: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
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
            image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
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
            image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
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
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
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

