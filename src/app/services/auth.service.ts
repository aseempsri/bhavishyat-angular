import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isLoggedIn = false;
  private loginRequest$ = new Subject<string>();

  /** Emits when a component requests to open the login modal (with intended redirect path) */
  get onLoginRequest() {
    return this.loginRequest$.asObservable();
  }

  /** Request to open login modal; after login, redirect to the given path */
  requestLogin(redirectTo: string): void {
    this.loginRequest$.next(redirectTo);
  }

  setLoginState(loggedIn: boolean): void {
    this.isLoggedIn = loggedIn;
  }
}
