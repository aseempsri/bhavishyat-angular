import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';

interface House {
  number: number;
  name: string;
  sanskritName: string;
  significations: string[];
  keywords: string[];
  bodyParts: string[];
  color: string;
  gradient: string;
  icon: string;
  angle: number; // For circular positioning
}

@Component({
  selector: 'app-house-signification',
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './house-signification.component.html',
  styleUrl: './house-signification.component.css'
})
export class HouseSignificationComponent implements OnInit {
  selectedHouse: House | null = null;
  isExpanded = false;

  houses: House[] = [];
  housePositions: Map<number, { x: number; y: number }> = new Map();

  constructor() {
    // Initialize houses with positions
    const housesData: Omit<House, 'angle'>[] = [
    {
      number: 1,
      name: 'House of Self',
      sanskritName: 'Lagna Bhava',
      significations: [
        'Physical appearance and body',
        'Personality and character',
        'Health and vitality',
        'Head and face',
        'Overall life direction',
        'Self-identity and ego',
        'General fortune'
      ],
      keywords: ['Self', 'Identity', 'Appearance', 'Health', 'Vitality', 'Personality'],
      bodyParts: ['Head', 'Face', 'Brain'],
      color: '#FFC163',
      gradient: 'from-yellow-500/30 to-orange-500/30',
      icon: '👤'
    },
    {
      number: 2,
      name: 'House of Wealth',
      sanskritName: 'Dhana Bhava',
      significations: [
        'Wealth and finances',
        'Family and relatives',
        'Speech and communication',
        'Food and nourishment',
        'Right eye',
        'Movable assets',
        'Banking and savings'
      ],
      keywords: ['Wealth', 'Family', 'Speech', 'Food', 'Assets', 'Finances'],
      bodyParts: ['Right Eye', 'Face', 'Mouth', 'Tongue'],
      color: '#FF9900',
      gradient: 'from-orange-500/30 to-amber-500/30',
      icon: '💰'
    },
    {
      number: 3,
      name: 'House of Siblings',
      sanskritName: 'Sahaja Bhava',
      significations: [
        'Siblings and relatives',
        'Courage and valor',
        'Communication and writing',
        'Short journeys',
        'Right ear',
        'Hands and arms',
        'Mental abilities'
      ],
      keywords: ['Siblings', 'Courage', 'Communication', 'Journeys', 'Writing', 'Valor'],
      bodyParts: ['Right Ear', 'Arms', 'Hands', 'Shoulders'],
      color: '#FF6347',
      gradient: 'from-red-500/30 to-pink-500/30',
      icon: '🤝'
    },
    {
      number: 4,
      name: 'House of Home',
      sanskritName: 'Sukha Bhava',
      significations: [
        'Home and property',
        'Mother and maternal relations',
        'Education and learning',
        'Vehicles and conveyances',
        'Chest and heart',
        'Land and immovable property',
        'Comfort and happiness'
      ],
      keywords: ['Home', 'Mother', 'Property', 'Education', 'Vehicles', 'Comfort'],
      bodyParts: ['Chest', 'Heart', 'Lungs', 'Breast'],
      color: '#9333EA',
      gradient: 'from-purple-500/30 to-violet-500/30',
      icon: '🏠'
    },
    {
      number: 5,
      name: 'House of Progeny',
      sanskritName: 'Putra Bhava',
      significations: [
        'Children and progeny',
        'Education and learning',
        'Intelligence and wisdom',
        'Speculation and gambling',
        'Stomach and digestion',
        'Creative pursuits',
        'Romance and love affairs'
      ],
      keywords: ['Children', 'Education', 'Intelligence', 'Creativity', 'Romance', 'Wisdom'],
      bodyParts: ['Stomach', 'Liver', 'Spleen', 'Pancreas'],
      color: '#EC4899',
      gradient: 'from-pink-500/30 to-rose-500/30',
      icon: '👶'
    },
    {
      number: 6,
      name: 'House of Enemies',
      sanskritName: 'Ari Bhava',
      significations: [
        'Enemies and opponents',
        'Diseases and health issues',
        'Service and servitude',
        'Debts and obstacles',
        'Lower abdomen',
        'Legal disputes',
        'Competition and rivals'
      ],
      keywords: ['Enemies', 'Diseases', 'Service', 'Debts', 'Obstacles', 'Competition'],
      bodyParts: ['Lower Abdomen', 'Intestines', 'Kidneys', 'Waist'],
      color: '#EF4444',
      gradient: 'from-red-600/30 to-orange-600/30',
      icon: '⚔️'
    },
    {
      number: 7,
      name: 'House of Partnership',
      sanskritName: 'Kalatra Bhava',
      significations: [
        'Spouse and marriage',
        'Partnerships and business',
        'Public relations',
        'Foreign lands and travel',
        'Genitals and reproductive organs',
        'Trade and commerce',
        'Contracts and agreements'
      ],
      keywords: ['Spouse', 'Marriage', 'Partnership', 'Business', 'Travel', 'Contracts'],
      bodyParts: ['Genitals', 'Reproductive Organs', 'Lower Back'],
      color: '#3B82F6',
      gradient: 'from-blue-500/30 to-cyan-500/30',
      icon: '💑'
    },
    {
      number: 8,
      name: 'House of Longevity',
      sanskritName: 'Ayur Bhava',
      significations: [
        'Longevity and lifespan',
        'Occult and mysticism',
        'Inheritance and legacies',
        'Transformation and regeneration',
        'Thighs and hips',
        'Unexpected gains',
        'Research and investigation'
      ],
      keywords: ['Longevity', 'Occult', 'Inheritance', 'Transformation', 'Mysticism', 'Research'],
      bodyParts: ['Thighs', 'Hips', 'Buttocks'],
      color: '#8B5CF6',
      gradient: 'from-violet-500/30 to-purple-500/30',
      icon: '🔮'
    },
    {
      number: 9,
      name: 'House of Fortune',
      sanskritName: 'Bhagya Bhava',
      significations: [
        'Fortune and luck',
        'Father and paternal relations',
        'Higher education and philosophy',
        'Religion and spirituality',
        'Hips and thighs',
        'Long journeys',
        'Guru and teachers'
      ],
      keywords: ['Fortune', 'Father', 'Education', 'Religion', 'Philosophy', 'Spirituality'],
      bodyParts: ['Hips', 'Thighs', 'Buttocks'],
      color: '#10B981',
      gradient: 'from-green-500/30 to-emerald-500/30',
      icon: '🌟'
    },
    {
      number: 10,
      name: 'House of Career',
      sanskritName: 'Karma Bhava',
      significations: [
        'Career and profession',
        'Status and reputation',
        'Authority and power',
        'Honor and recognition',
        'Knees and joints',
        'Government and administration',
        'Achievements and success'
      ],
      keywords: ['Career', 'Status', 'Authority', 'Reputation', 'Success', 'Achievement'],
      bodyParts: ['Knees', 'Joints', 'Bones'],
      color: '#F59E0B',
      gradient: 'from-amber-500/30 to-yellow-500/30',
      icon: '👑'
    },
    {
      number: 11,
      name: 'House of Gains',
      sanskritName: 'Labha Bhava',
      significations: [
        'Gains and income',
        'Friends and social circle',
        'Aspirations and desires',
        'Elder siblings',
        'Legs and ankles',
        'Networking and connections',
        'Fulfillment of wishes'
      ],
      keywords: ['Gains', 'Friends', 'Income', 'Aspirations', 'Networking', 'Desires'],
      bodyParts: ['Legs', 'Ankles', 'Shins'],
      color: '#06B6D4',
      gradient: 'from-cyan-500/30 to-blue-500/30',
      icon: '📈'
    },
    {
      number: 12,
      name: 'House of Losses',
      sanskritName: 'Vyaya Bhava',
      significations: [
        'Expenses and losses',
        'Spiritual liberation',
        'Foreign lands and travel',
        'Bed pleasures and sleep',
        'Feet and toes',
        'Hospitalization',
        'Moksha and enlightenment'
      ],
      keywords: ['Expenses', 'Losses', 'Spirituality', 'Liberation', 'Travel', 'Moksha'],
      bodyParts: ['Feet', 'Toes', 'Left Eye'],
      color: '#6366F1',
      gradient: 'from-indigo-500/30 to-purple-500/30',
      icon: '🌙'
    }
    ];

    // Initialize houses with angles and positions
    const angles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    this.houses = housesData.map((house, index) => ({
      ...house,
      angle: angles[index]
    }));

    // Calculate positions for all houses
    this.houses.forEach(house => {
      this.housePositions.set(house.number, this.getHousePosition(house));
    });
  }

  ngOnInit(): void {
    // Initialize with first house selected
    this.selectedHouse = this.houses[0];
  }

  selectHouse(house: House): void {
    this.selectedHouse = house;
    this.isExpanded = true;
  }

  closeExpanded(): void {
    this.isExpanded = false;
  }

  getHousePosition(house: House): { x: number; y: number } {
    const radius = 28; // Distance from center in percentage
    const centerX = 50; // Percentage
    const centerY = 50; // Percentage
    const angleRad = (house.angle * Math.PI) / 180;
    const x = centerX + radius * Math.cos(angleRad);
    const y = centerY + radius * Math.sin(angleRad);
    return { x, y };
  }

  getPosition(houseNumber: number): { x: number; y: number } {
    return this.housePositions.get(houseNumber) || { x: 50, y: 50 };
  }
}

