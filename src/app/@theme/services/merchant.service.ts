import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  MerchantTransaction,
  MerchantTransactionsResponse,
  TransferFundsPayload,
  TransferFundsResponse,
  Wallet
} from '../models/merchant.model';
import { environment } from 'src/environments/environment';
import { BaseResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class MerchantService {
    private baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * 🔹 Récupère toutes les transactions d’un marchand
   */
  getMerchantTransactions(
    idMerchant: number,
    page: number = 1,
    limit: number = 10,
    status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'BLOCKED',
    startDate?: string,
    endDate?: string
  ): Observable<MerchantTransactionsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) params = params.set('status', status);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<MerchantTransactionsResponse>(
      `${this.baseUrl}/merchant/transactions/${idMerchant}/all`,
      { params, ...this.getConfigAuthorized() }
    );
  }

  /**
   * 🔹 Transfère des fonds d’un compte marchand vers un portefeuille Sendo
   */
  transferFunds(payload: TransferFundsPayload, pinCode: string): Observable<TransferFundsResponse> {
    return this.http.post<TransferFundsResponse>(
      `${this.baseUrl}/merchant/transfer-funds`,
      payload, this.getConfigAuthorizedPinCode(pinCode)
    );
  }

  getMerchantTransaction(transactionId: number): Observable<{ status: number; message: string; data: MerchantTransaction }> {
    const url = `${this.baseUrl}/merchant/transactions/${transactionId}`;
    return this.http.get<{ status: number; message: string; data: MerchantTransaction }>(url, this.getConfigAuthorized());
  }

   getWalletById(walletId: string): Observable<{ status: number; message: string; data: Wallet }> {
    const url = `${this.baseUrl}/wallet/${walletId}`;
    return this.http.get<{ status: number; message: string; data: Wallet }>(url, this.getConfigAuthorized());
  }

  withdrawRequest(payload: {
  phone: string;
  amountToWithdraw: number;
  idMerchant: number;
}, pinCode: string): Observable<BaseResponse<null>> {
  return this.http.post<BaseResponse<null>>(
    `${this.baseUrl}/merchant/withdrawal-request`,
    payload,
    this.getConfigAuthorizedPinCode(pinCode)
  );
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

   private getConfigAuthorizedPinCode(passcode?: string) {
  const dataRegistered = localStorage.getItem('login-sendo') || '{}';
  const data = JSON.parse(dataRegistered);

  const headersConfig: { [header: string]: string } = {
    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.accessToken}`,
  };

  // 👉 Si un passcode est fourni, on l’ajoute dans le header
  if (passcode) {
    headersConfig['X-Passcode'] = passcode;
  }

  return {
    headers: new HttpHeaders(headersConfig)
  };
}

}
