import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  title = 'bhavishyat-angular';
  private trail: HTMLElement[] = [];
  private positions: { x: number; y: number }[] = [];
  private trailLength = 20;
  private mouseX = 0;
  private mouseY = 0;
  private animationFrameId: number | null = null;
  private mouseMoveHandler = (event: MouseEvent) => this.onMouseMove(event);
  private isInitialized = false;

  ngOnInit() {
    // Wait for DOM to be ready
    if (typeof window !== 'undefined') {
      this.mouseX = window.innerWidth / 2;
      this.mouseY = window.innerHeight / 2;
    }
  }

  ngAfterViewInit() {
    // Initialize after view is ready
    setTimeout(() => {
      this.initializeTrail();
    }, 100);
  }

  ngOnDestroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('mousemove', this.mouseMoveHandler);
    }
    this.trail.forEach(particle => {
      if (particle && particle.parentNode) {
        particle.remove();
      }
    });
  }

  initializeTrail() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (typeof document === 'undefined' || !document.body) {
      console.error('Document or body not available');
      return;
    }

    this.createTrail();
    document.addEventListener('mousemove', this.mouseMoveHandler);
    this.animateTrail();
    console.log('Cursor trail initialized with', this.trailLength, 'particles');
  }

  onMouseMove(event: MouseEvent) {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }

  createTrail() {
    const container = document.body;
    if (!container) return;

    // Initialize positions to center of screen
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    for (let i = 0; i < this.trailLength; i++) {
      const particle = document.createElement('div');
      particle.className = 'cursor-trail';
      
      // Set initial styles directly
      particle.style.position = 'fixed';
      particle.style.width = '16px';
      particle.style.height = '16px';
      particle.style.borderRadius = '50%';
      particle.style.background = 'radial-gradient(circle, rgba(255, 201, 99, 1) 0%, rgba(255, 153, 0, 0.9) 40%, rgba(255, 201, 99, 0.4) 100%)';
      particle.style.boxShadow = '0 0 15px rgba(255, 201, 99, 0.8), 0 0 30px rgba(255, 153, 0, 0.6), 0 0 45px rgba(255, 153, 0, 0.3)';
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '99999';
      particle.style.transformOrigin = 'center';
      particle.style.willChange = 'transform, opacity';
      
      particle.style.left = centerX + 'px';
      particle.style.top = centerY + 'px';
      particle.style.opacity = '0.1';
      
      container.appendChild(particle);
      this.trail.push(particle);
      this.positions.push({ x: centerX, y: centerY });
    }
  }

  animateTrail() {
    const updateTrail = () => {
      if (!this.isInitialized) return;

      // Update positions from mouse to first particle, then each particle follows the previous one
      let targetX = this.mouseX;
      let targetY = this.mouseY;

      this.trail.forEach((particle, index) => {
        if (!particle) return;
        
        const currentPos = this.positions[index];
        
        // Smoothly interpolate towards the target position
        currentPos.x += (targetX - currentPos.x) * 0.3;
        currentPos.y += (targetY - currentPos.y) * 0.3;

        // Update target for next particle
        targetX = currentPos.x;
        targetY = currentPos.y;

        // Calculate scale and opacity based on position in trail
        const scale = 1 - (index / this.trailLength) * 0.8;
        const opacity = Math.max(0.1, 1 - (index / this.trailLength) * 0.9);

        // Apply styles
        particle.style.left = currentPos.x + 'px';
        particle.style.top = currentPos.y + 'px';
        particle.style.opacity = opacity.toString();
        particle.style.transform = `scale(${scale}) translate(-50%, -50%)`;
      });

      this.animationFrameId = requestAnimationFrame(updateTrail);
    };

    updateTrail();
  }
}
