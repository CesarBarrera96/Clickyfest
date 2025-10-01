import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../core/services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login implements OnInit {
  loginForm!: FormGroup;
  loginError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loginError = null;
      const credentials = {
        Username: this.loginForm.value.username,
        Password: this.loginForm.value.password
      };
      this.auth.login(credentials).subscribe({
        next: (success) => {
          if (success) {
            this.router.navigate(['/admin']);
          } else {
            this.loginError = 'El token no se recibió en la respuesta. Inténtalo de nuevo.';
          }
        },
        error: (err) => {
          console.error('Login failed', err);
          this.loginError = 'Credenciales inválidas o error del servidor. Por favor, inténtalo de nuevo.';
        }
      });
    }
  }
}
