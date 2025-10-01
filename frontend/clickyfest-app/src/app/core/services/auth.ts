import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {

  constructor(private http: HttpClient, private router: Router) { }

  login(credentials: any): Observable<boolean> {
    return this.http.post<any>('/api/auth/login', credentials).pipe(
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
    return this.http.get('/api/auth/validate-token').pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}
