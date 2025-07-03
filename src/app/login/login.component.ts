import { Component } from '@angular/core';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    NgIf
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  username = '';
  password = '';
  error = '';

  // Credenciales ficticias (puedes ajustar)
  private readonly validUser = 'ecuador';
  private readonly validPass = 'quito2025';

  constructor(private router: Router) {}

  login(): void {
    console.log('Intentando iniciar sesión con:', this.username, this.password);
    if (this.username === this.validUser && this.password === this.validPass) {
      this.error = '';
      localStorage.setItem('loggedIn', 'true');// ✅ se guarda hasta que se cierre la pestaña
      this.router.navigate(['/proformas']); // o '/dashboard' si usas esa ruta
    } else {
      this.error = 'Usuario o contraseña incorrectos';
    }
  }



}
