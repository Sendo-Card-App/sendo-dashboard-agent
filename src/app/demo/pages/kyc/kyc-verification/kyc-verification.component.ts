// kyc-verification.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { KycService, KycDocumentType, KycUploadResponse } from 'src/app/@theme/services/kyc.service';
import { MatSnackBar } from '@angular/material/snack-bar';

interface KycStep {
  id: KycDocumentType;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  files: File[];
  isUploading: boolean;
  uploadSuccess: boolean;
}

@Component({
  selector: 'app-kyc-verification',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './kyc-verification.component.html',
  styleUrls: ['./kyc-verification.component.scss']
})
export class KycVerificationComponent {
  currentStep = 0;
  progress = 0;
  allDocumentsSubmitted = false;

  kycSteps: KycStep[] = [
    {
      id: 'ID_PROOF',
      title: 'Pièce d\'identité',
      description: 'Téléchargez une copie recto-verso de votre pièce d\'identité nationale ou passeport en cours de validité.',
      icon: 'badge',
      completed: false,
      files: [],
      isUploading: false,
      uploadSuccess: false
    },
    {
      id: 'ADRESS_PROOF',
      title: 'Justificatif de domicile',
      description: 'Facture récente (électricité, eau, téléphone) de moins de 3 mois prouvant votre adresse.',
      icon: 'home',
      completed: false,
      files: [],
      isUploading: false,
      uploadSuccess: false
    },
    {
      id: 'RCCM',
      title: 'Extrait RCCM',
      description: 'Document officiel attestant de l\'immatriculation de votre entreprise au registre du commerce.',
      icon: 'business_center',
      completed: false,
      files: [],
      isUploading: false,
      uploadSuccess: false
    },
    {
      id: 'NIU_PROOF',
      title: 'Attestation NIU',
      description: 'Document justificatif de votre Numéro d\'Identification Unique auprès des impôts.',
      icon: 'assignment',
      completed: false,
      files: [],
      isUploading: false,
      uploadSuccess: false
    },
    {
      id: 'SELFIE',
      title: 'Selfie de vérification',
      description: 'Une photo de vous tenant votre pièce d\'identité à côté de votre visage pour confirmation.',
      icon: 'face',
      completed: false,
      files: [],
      isUploading: false,
      uploadSuccess: false
    },
    {
      id: 'ARTICLES_ASSOCIATION_PROOF',
      title: 'Statuts de l\'entreprise',
      description: 'Copie des statuts signés et certifiés conformes de votre structure.',
      icon: 'description',
      completed: false,
      files: [],
      isUploading: false,
      uploadSuccess: false
    }
  ];

  constructor(private kycService: KycService, private snackbar: MatSnackBar) {
    this.calculateProgress();
  }

  calculateProgress(): void {
    const completedSteps = this.kycSteps.filter(step => step.completed).length;
    this.progress = Math.round((completedSteps / this.kycSteps.length) * 100);
    this.allDocumentsSubmitted = this.progress === 100;
  }

  onFileSelected(event: Event, stepIndex: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      const step = this.kycSteps[stepIndex];

      // Validation des types de fichiers
      const validFiles = files.filter(file =>
        file.type.startsWith('image/') || file.type === 'application/pdf'
      );

      if (validFiles.length !== files.length) {
        this.snackbar.open('Seuls les fichiers images et PDF sont acceptés.', 'Fermer', {
          duration: 3000
        });
        return;
      }

      // Validation de la taille des fichiers (max 10MB)
      const oversizedFiles = validFiles.filter(file => file.size > 10 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        this.snackbar.open('Certains fichiers dépassent la taille maximale de 10MB.', 'Fermer', {
          duration: 3000
        });
        return;
      }

      // Ajouter les nouveaux fichiers aux fichiers existants
      step.files = [...step.files, ...validFiles];

      this.snackbar.open(`${validFiles.length} fichier(s) ajouté(s)`, 'Fermer', {
        duration: 2000
      });
    }
  }

  removeFile(stepIndex: number, fileIndex: number): void {
    const step = this.kycSteps[stepIndex];
    step.files.splice(fileIndex, 1);
    step.uploadSuccess = false; // Réinitialiser le statut d'upload si on supprime un fichier

    this.snackbar.open('Fichier supprimé', 'Fermer', {
      duration: 2000
    });
  }

  uploadStepDocuments(stepIndex: number): void {
    const step = this.kycSteps[stepIndex];

    if (step.files.length === 0) {
      this.snackbar.open('Veuillez sélectionner au moins un fichier pour cette étape.', 'Fermer', {
        duration: 3000
      });
      return;
    }

    step.isUploading = true;

    this.kycService.uploadKycDocuments(step.id, step.files).subscribe({
      next: (response: KycUploadResponse) => {
        step.isUploading = false;

        if (response.success) {
          step.uploadSuccess = true;
          step.completed = true;
          this.calculateProgress();

          this.snackbar.open('Documents uploadés avec succès !', 'Fermer', {
            duration: 3000
          });

          // Passer automatiquement à l'étape suivante si ce n'est pas la dernière
          if (this.currentStep < this.kycSteps.length - 1) {
            setTimeout(() => {
              this.currentStep++;
            }, 1000);
          }
        } else {
          this.snackbar.open('Erreur lors de l\'upload: ' + response.message, 'Fermer', {
            duration: 5000
          });
        }
      },
      error: (error) => {
        step.isUploading = false;
        console.error('Erreur upload:', error);
        this.snackbar.open('Une erreur est survenue lors de l\'envoi des documents.', 'Fermer', {
          duration: 5000
        });
      }
    });
  }

  navigateToStep(stepIndex: number): void {
    this.currentStep = stepIndex;
  }

  getFileIcon(file: File): string {
    if (file.type === 'application/pdf') return 'picture_as_pdf';
    if (file.type.startsWith('image/')) return 'image';
    return 'insert_drive_file';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Méthode pour gérer le drag & drop
  onDrop(event: DragEvent, stepIndex: number): void {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      const inputEvent = { target: { files: event.dataTransfer.files } } as unknown as Event;
      this.onFileSelected(inputEvent, stepIndex);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  get completedStepsCount(): number {
    return this.kycSteps.filter(s => s.completed).length;
  }

  get currentStepData(): KycStep {
    return this.kycSteps[this.currentStep];
  }
}
