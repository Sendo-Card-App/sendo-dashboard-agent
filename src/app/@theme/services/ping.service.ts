import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseResponse } from './kyc.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PingService {
  private baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * 📤 Envoie le passcode de l'utilisateur connecté
   */
  sendPasscode(passcode: number): Observable<BaseResponse> {
    const url = `${this.baseUrl}/users/send-passcode`;
    const body = { passcode };
    return this.http.post<BaseResponse>(url, body, this.getConfigAuthorized());
  }

  /**
   * 🔍 Vérifie le pincode d'un compte utilisateur
   */
  checkPincode(pincode: number): Observable<BaseResponse> {
    const url = `${this.baseUrl}/users/check-pincode/${pincode}`;
    return this.http.get<BaseResponse>(url, this.getConfigAuthorized());
  }

  /**
   * 🔍 Vérifie si l'utilisateur a un pincode
   */
  checkUserPincode(): Observable<BaseResponse> {
    const url = `${this.baseUrl}/users/check-pincode`;
    return this.http.get<BaseResponse>(url, this.getConfigAuthorized());
  }

   private getConfigAuthorized() {
        const dataRegistered = localStorage.getItem('login-sendo') || '{}'
        const data = JSON.parse(dataRegistered)
        return {
          headers: new HttpHeaders(
            {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
              "Content-Type": "application/json",
              'Authorization': `Bearer ${data.accessToken}`
            }
          )
        }
      }
}
