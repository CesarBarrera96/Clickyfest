import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient, private router: Router) { }

  login(credentials: any): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, credentials).pipe(
      map(response => {
        if (response && response.token) {
          localStorage.setItem('authToken', response.token);
          return true;
        }
        return false;
      })
    );
  }

  logout() {
    localStorage.removeItem('authToken');
    this.router.navigate(['/admin/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  validateToken(): Observable<boolean> {
    return this.http.get(`${this.apiUrl}/auth/validate-token`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}
