import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// Interfaces et services
import { MerchantTransaction } from 'src/app/@theme/models/merchant.model';
import { MerchantService } from 'src/app/@theme/services/merchant.service';

@Component({
  selector: 'app-paiement-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './paiement-detail.component.html',
  styleUrls: ['./paiement-detail.component.scss']
})
export class PaiementDetailComponent implements OnInit {
  transaction: MerchantTransaction | null = null;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private merchantService: MerchantService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const transactionId = params.get('id');
      if (transactionId) {
        this.loadTransaction(+transactionId);
      } else {
        this.router.navigate(['/transaction']);
      }
    });
  }

  private loadTransaction(transactionId: number): void {
    this.isLoading = true;

    this.merchantService.getMerchantTransaction(transactionId).subscribe({
      next: (response) => {
        this.transaction = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement transaction:', error);
        this.snackBar.open('Erreur lors du chargement de la transaction', 'Fermer', {
          duration: 3000
        });
        this.router.navigate(['/transaction']);
        this.isLoading = false;
      }
    });
  }

  // Formatage des montants
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // Formatage des dates
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Classes pour les statuts
  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'status-completed';
      case 'PENDING': return 'status-pending';
      case 'FAILED': return 'status-failed';
      case 'BLOCKED': return 'status-blocked';
      default: return 'status-unknown';
    }
  }

  // Libellés des statuts
  getStatusLabel(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'Terminé';
      case 'PENDING': return 'En attente';
      case 'FAILED': return 'Échoué';
      case 'BLOCKED': return 'Bloqué';
      default: return status;
    }
  }

  // Retour à la liste
  goBack(): void {
    this.router.navigate(['/transaction']);
  }

  // Copier dans le presse-papier
  copyToClipboard(text: string): void {
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open('Copié dans le presse-papier', 'Fermer', {
        duration: 2000
      });
    });
  }
}
