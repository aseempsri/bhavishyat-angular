import { Component } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { HeroComponent } from '../../components/hero/hero.component';
import { AboutComponent } from '../../components/about/about.component';
import { ServicesComponent } from '../../components/services/services.component';
import { CtaComponent } from '../../components/cta/cta.component';

@Component({
  selector: 'app-home',
  imports: [HeaderComponent, HeroComponent, AboutComponent, ServicesComponent, CtaComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
}
