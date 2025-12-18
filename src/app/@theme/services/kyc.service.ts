// kyc.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

// ✅ Types stricts de documents KYC
export type KycDocumentType =
  | 'ID_PROOF'
  | 'ADDRESS_PROOF'
  | 'RCCM'
  | 'NIU_PROOF'
  | 'SELFIE'
  | 'ARTICLES_ASSOCIATION_PROOF';

// ✅ Interfaces de base
export interface BaseResponse {
  success: boolean;
  message: string;
  statusCode?: number;
}

// ✅ Interface de réponse KYC
export interface KycUploadResponse extends BaseResponse {
  data?: {
    id?: string;
    type?: KycDocumentType;
    fileUrls?: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class KycService {
  private apiUrl = `${environment.apiUrl}`; // conforme à ton besoin initial

  constructor(private http: HttpClient) {}

  /**
   * 📤 Upload des documents KYC
   * @param type Type de document (KYC)
   * @param files Liste des fichiers à envoyer
   */
  uploadKycDocuments(type: KycDocumentType, files: File[]): Observable<KycUploadResponse> {
    const formData = new FormData();
    formData.append('type', type);

    for (const file of files) {
      formData.append('files', file, file.name);
    }

    // ⚠️ Ne pas forcer "Content-Type: application/json" avec FormData !
    // Sinon l'upload échoue.
    return this.http.post<KycUploadResponse>(
      `${this.apiUrl}/kyc/onboarding-merchant`,
      formData,
      this.getConfigAuthorized(true)
    );
  }

  uploadAllKycDocuments(formData: FormData): Observable<KycUploadResponse> {
    return this.http.post<KycUploadResponse>(`${this.apiUrl}/kyc/onboarding-merchant`, formData,this.getConfigAuthorized(true));
  }


  /**
   * 🧾 Mise à jour d'un document KYC existant
   * @param publicId ID public du document KYC
   * @param file Nouveau fichier à remplacer
   */
  updateKycDocument(publicId: string, file: File): Observable<BaseResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.put<BaseResponse>(
      `${this.apiUrl}/kyc/${publicId}`,
      formData,
      this.getConfigAuthorized(true)
    );
  }

  /**
   * ⚙️ Configuration HTTP avec ou sans en-tête JSON
   * @param isFormData Définit si la requête envoie du FormData
   */
  private getConfigAuthorized(isFormData = false) {
    const dataRegistered = localStorage.getItem('login-sendo') || '{}';
    const data = JSON.parse(dataRegistered);

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${data.accessToken}`
    };

    // 🚫 On n'ajoute pas "Content-Type: application/json" si c’est du FormData
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    return {
      headers: new HttpHeaders(headers)
    };
  }
}
