import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputComponent } from '../../ui/input/input.component';
import { IndianCitiesService } from '../../services/indian-cities.service';

@Component({
  selector: 'app-birth-details-modal',
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent],
  templateUrl: './birth-details-modal.component.html',
  styleUrl: './birth-details-modal.component.css'
})
export class BirthDetailsModalComponent implements OnInit {
  @Input() userName: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<{ dateOfBirth: string; timeOfBirth: string; placeOfBirth: string }>();

  dateOfBirth: string = '';
  timeOfBirth: string = '';
  placeOfBirth: string = '';
  placeSuggestions: string[] = [];
  showSuggestions: boolean = false;
  error: string = '';
  maxDate: string = ''; // For date input max attribute

  constructor(private indianCitiesService: IndianCitiesService) {}

  ngOnInit(): void {
    // Set default time to current time
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    this.timeOfBirth = `${hours}:${minutes}`;
    
    // Set max date to today for date input
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.maxDate = `${year}-${month}-${day}`;
  }

  onPlaceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const query = input.value;
    
    if (query.length >= 2) {
      this.placeSuggestions = this.indianCitiesService.searchCities(query);
      this.showSuggestions = this.placeSuggestions.length > 0;
    } else {
      this.placeSuggestions = [];
      this.showSuggestions = false;
    }
  }

  selectPlace(place: string): void {
    this.placeOfBirth = place;
    this.showSuggestions = false;
  }

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    this.error = '';
    
    if (!this.dateOfBirth) {
      this.error = 'Please enter your date of birth';
      return;
    }
    
    if (!this.timeOfBirth) {
      this.error = 'Please enter your time of birth';
      return;
    }
    
    if (!this.placeOfBirth) {
      this.error = 'Please enter your place of birth';
      return;
    }

    // Validate date is not in the future
    const selectedDate = new Date(this.dateOfBirth);
    const today = new Date();
    if (selectedDate > today) {
      this.error = 'Date of birth cannot be in the future';
      return;
    }

    this.submit.emit({
      dateOfBirth: this.dateOfBirth,
      timeOfBirth: this.timeOfBirth,
      placeOfBirth: this.placeOfBirth
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onClose();
    }
  }
}
