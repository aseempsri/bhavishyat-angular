import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { ButtonComponent } from '../../ui/button/button.component';

@Component({
  selector: 'app-shinrin-yoku',
  imports: [CommonModule, RouterModule, HeaderComponent, ButtonComponent],
  templateUrl: './shinrin-yoku.component.html',
  styleUrl: './shinrin-yoku.component.css'
})
export class ShinrinYokuComponent {
}

