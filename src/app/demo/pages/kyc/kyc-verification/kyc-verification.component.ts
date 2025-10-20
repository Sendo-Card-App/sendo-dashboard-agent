// kyc-verification.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { KycService, KycDocumentType } from 'src/app/@theme/services/kyc.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthenticationService } from 'src/app/@theme/services/authentication.service';

interface KycDocument {
  id: number;
  type: KycDocumentType;
  typeAccount: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  url: string;
  publicId: string;
  idDocumentNumber: string | null;
  taxIdNumber: string | null;
  rejectionReason: string | null;
  reviewedById: number | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

interface KycStep {
  id: KycDocumentType;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  files: File[];
  isUploading: boolean;
  uploadSuccess: boolean;
  submittedDocuments?: KycDocument[];
  canSubmit: boolean;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
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
export class KycVerificationComponent implements OnInit {
  currentStep = 0;
  progress = 0;
  allDocumentsSubmitted = false;
  hasRejectedDocuments = false;
  userKycDocuments: KycDocument[] = [];

  kycSteps: KycStep[] = [
    {
      id: 'ID_PROOF',
      title: 'Pièce d\'identité',
      description: 'Téléchargez une copie recto-verso de votre pièce d\'identité nationale ou passeport en cours de validité.',
      icon: 'badge',
      completed: false,
      files: [],
      isUploading: false,
      uploadSuccess: false,
      submittedDocuments: [],
      canSubmit: true
    },
    {
      id: 'ADDRESS_PROOF',
      title: 'Justificatif de domicile',
      description: 'Facture récente (électricité, eau, téléphone) de moins de 3 mois prouvant votre adresse.',
      icon: 'home',
      completed: false,
      files: [],
      isUploading: false,
      uploadSuccess: false,
      submittedDocuments: [],
      canSubmit: true
    },
    {
      id: 'RCCM',
      title: 'Extrait RCCM',
      description: 'Document officiel attestant de l\'immatriculation de votre entreprise au registre du commerce.',
      icon: 'business_center',
      completed: false,
      files: [],
      isUploading: false,
      uploadSuccess: false,
      submittedDocuments: [],
      canSubmit: true
    },
    {
      id: 'NIU_PROOF',
      title: 'Attestation NIU',
      description: 'Document justificatif de votre Numéro d\'Identification Unique auprès des impôts.',
      icon: 'assignment',
      completed: false,
      files: [],
      isUploading: false,
      uploadSuccess: false,
      submittedDocuments: [],
      canSubmit: true
    },
    {
      id: 'SELFIE',
      title: 'Selfie de vérification',
      description: 'Une photo de vous tenant votre pièce d\'identité à côté de votre visage pour confirmation.',
      icon: 'face',
      completed: false,
      files: [],
      isUploading: false,
      uploadSuccess: false,
      submittedDocuments: [],
      canSubmit: true
    },
    {
      id: 'ARTICLES_ASSOCIATION_PROOF',
      title: 'Statuts de l\'entreprise',
      description: 'Copie des statuts signés et certifiés conformes de votre structure.',
      icon: 'description',
      completed: false,
      files: [],
      isUploading: false,
      uploadSuccess: false,
      submittedDocuments: [],
      canSubmit: true
    }
  ];

  constructor(
    private kycService: KycService,
    private snackbar: MatSnackBar,
    private authService: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.loadUserKycDocuments();
  }

  loadUserKycDocuments(): void {
    this.authService.getUserIdentifiant().subscribe({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: (response: any) => {
        if (response.data?.kycDocuments) {
          this.userKycDocuments = response.data.kycDocuments;
          this.updateStepsWithExistingDocuments();
        }
        this.calculateProgress();
      },
      error: (error) => {
        console.error('Erreur chargement documents KYC:', error);
        this.calculateProgress();
      }
    });
  }

  updateStepsWithExistingDocuments(): void {
    this.hasRejectedDocuments = false;

    this.kycSteps.forEach(step => {
      const existingDoc = this.userKycDocuments.find(doc => doc.type === step.id);

      if (existingDoc) {
        step.submittedDocuments = [existingDoc];
        step.status = existingDoc.status;
        step.rejectionReason = existingDoc.rejectionReason;

        // Marquer comme complété si le document est PENDING ou APPROVED
        if (existingDoc.status === 'PENDING' || existingDoc.status === 'APPROVED') {
          step.completed = true;
          step.canSubmit = false; // Empêcher la soumission d'un nouveau document
        }
        // Si REJECTED, permettre la soumission d'un nouveau document
        else if (existingDoc.status === 'REJECTED') {
          step.completed = false;
          step.canSubmit = true;
          this.hasRejectedDocuments = true;
        }
      } else {
        // Aucun document existant, permettre la soumission
        step.completed = false;
        step.canSubmit = true;
        step.status = undefined;
        step.rejectionReason = undefined;
      }
    });

    this.calculateProgress();
  }

  calculateProgress(): void {
    const completedSteps = this.kycSteps.filter(step =>
      step.completed || (step.status && step.status !== 'REJECTED')
    ).length;
    this.progress = Math.round((completedSteps / this.kycSteps.length) * 100);
    this.allDocumentsSubmitted = this.progress === 100;
  }

  onFileSelected(event: Event, stepIndex: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      const step = this.kycSteps[stepIndex];

      // Empêcher l'ajout de fichiers si l'étape ne permet pas la soumission
      if (!step.canSubmit) {
        this.snackbar.open('Vous ne pouvez pas ajouter de fichiers pour cette étape.', 'Fermer', {
          duration: 3000
        });
        return;
      }

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

    // Empêcher la suppression si l'étape ne permet pas la modification
    if (!step.canSubmit) {
      this.snackbar.open('Vous ne pouvez pas modifier les fichiers pour cette étape.', 'Fermer', {
        duration: 3000
      });
      return;
    }

    step.files.splice(fileIndex, 1);
    step.uploadSuccess = false;

    this.snackbar.open('Fichier supprimé', 'Fermer', {
      duration: 2000
    });
  }

  uploadStepDocuments(stepIndex: number): void {
    const step = this.kycSteps[stepIndex];

    // Empêcher l'upload si l'étape ne permet pas la soumission
    if (!step.canSubmit) {
      this.snackbar.open('Vous ne pouvez pas soumettre de documents pour cette étape.', 'Fermer', {
        duration: 3000
      });
      return;
    }

    if (step.files.length === 0) {
      this.snackbar.open('Veuillez sélectionner au moins un fichier pour cette étape.', 'Fermer', {
        duration: 3000
      });
      return;
    }

    step.isUploading = true;

    console.log('Début upload pour:', step.id, 'Fichiers:', step.files);

    this.kycService.uploadKycDocuments(step.id, step.files).subscribe({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: (response: any) => {
        step.isUploading = false;
        console.log('Réponse API complète:', response);

        // Vérification basée sur la structure réelle de la réponse
        const isSuccess = response.status === 201 || response.status === 200;

        if (isSuccess) {
          step.uploadSuccess = true;
          step.completed = true;
          step.canSubmit = false; // Empêcher les nouvelles soumissions
          step.submittedDocuments = response.data;
          step.status = 'PENDING'; // Statut par défaut après soumission
          step.rejectionReason = undefined;

          this.calculateProgress();

          this.snackbar.open(response.message || 'Documents uploadés avec succès !', 'Fermer', {
            duration: 3000
          });

          // Recharger les documents utilisateur pour mettre à jour l'état
          this.loadUserKycDocuments();

          // Passer automatiquement à l'étape suivante si ce n'est pas la dernière
          if (this.currentStep < this.kycSteps.length - 1) {
            setTimeout(() => {
              this.currentStep++;
            }, 1500);
          }
        } else {
          const errorMessage = response.message || 'Erreur inconnue lors de l\'upload';
          console.error('Erreur détaillée:', response);
          this.snackbar.open('Erreur lors de l\'upload: ' + errorMessage, 'Fermer', {
            duration: 5000
          });
        }
      },
      error: (error) => {
        step.isUploading = false;
        console.error('Erreur HTTP complète:', error);

        let errorMessage = 'Une erreur est survenue lors de l\'envoi des documents.';

        if (error.status === 500) {
          errorMessage = 'Erreur serveur (500). Veuillez réessayer plus tard.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.snackbar.open(errorMessage, 'Fermer', {
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

  getStatusIcon(status: string): string {
    switch (status) {
      case 'APPROVED': return 'check_circle';
      case 'REJECTED': return 'cancel';
      case 'PENDING': return 'schedule';
      default: return 'help';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'APPROVED': return '#4caf50';
      case 'REJECTED': return '#f44336';
      case 'PENDING': return '#ff9800';
      default: return '#9e9e9e';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'APPROVED': return 'Approuvé';
      case 'REJECTED': return 'Rejeté';
      case 'PENDING': return 'En attente';
      default: return 'Inconnu';
    }
  }

  // Méthode pour gérer le drag & drop
  onDrop(event: DragEvent, stepIndex: number): void {
    event.preventDefault();

    const step = this.kycSteps[stepIndex];

    // Empêcher le drop si l'étape ne permet pas la soumission
    if (!step.canSubmit) {
      this.snackbar.open('Vous ne pouvez pas ajouter de fichiers pour cette étape.', 'Fermer', {
        duration: 3000
      });
      return;
    }

    if (event.dataTransfer?.files) {
      const inputEvent = { target: { files: event.dataTransfer.files } } as unknown as Event;
      this.onFileSelected(inputEvent, stepIndex);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  get completedStepsCount(): number {
    return this.kycSteps.filter(s => s.completed || (s.status && s.status !== 'REJECTED')).length;
  }

  get currentStepData(): KycStep {
    return this.kycSteps[this.currentStep];
  }
}
