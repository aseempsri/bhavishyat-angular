import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../ui/button/button.component';

@Component({
  selector: 'app-about',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent {
  zodiacWheel = '/assets/zodiac-wheel.png';
}
