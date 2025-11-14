import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

// Interfaces et services
import { WithdrawalItem, WithdrawalListResponse } from 'src/app/@theme/models/merchant.model';
import { MerchantService } from 'src/app/@theme/services/merchant.service';
import { AuthenticationService } from 'src/app/@theme/services/authentication.service';
import { SharedModule } from 'src/app/demo/shared/shared.module';

@Component({
  selector: 'app-withdrawal-request',
  imports: [CommonModule, SharedModule],
  templateUrl: './withdrawal-request.component.html',
  styleUrls: ['./withdrawal-request.component.scss']
})
export class WithdrawalRequestComponent implements OnInit {
  // Propriétés pour les demandes de retrait
  withdrawalRequests: WithdrawalItem[] = [];
  isLoading = false;
  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 10;

  // Informations du merchant
  merchantId: number | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  merchantInfo: any = null;

  // Filtres
  filters = {
    status: '' as 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | ''
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private merchantService: MerchantService,
    private authService: AuthenticationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadMerchantInfo();
  }

  // 🔹 Chargement des informations du merchant
  loadMerchantInfo(): void {
    this.isLoading = true;

    this.authService.getUserIdentifiant().subscribe({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: (userResponse: any) => {
        this.merchantId = userResponse.data.merchant?.id;
        this.merchantInfo = userResponse.data.merchant;

        if (!this.merchantId) {
          this.snackBar.open('ID marchand non trouvé', 'Fermer', { duration: 3000 });
          this.isLoading = false;
          return;
        }

        this.loadWithdrawalRequests();
      },
      error: (error) => {
        console.error('Erreur récupération utilisateur:', error);
        this.isLoading = false;
        this.snackBar.open('Erreur lors de la récupération des informations', 'Fermer', {
          duration: 3000
        });
      }
    });
  }

  // 🔹 Chargement des demandes de retrait
  loadWithdrawalRequests(): void {
    if (!this.merchantId) return;

    this.isLoading = true;

    this.merchantService.getWithdrawalRequests(
      this.merchantId,
      this.currentPage,
      this.itemsPerPage,
      this.filters.status || undefined
    ).subscribe({
      next: (response: WithdrawalListResponse) => {
        this.withdrawalRequests = response.data.items;
        this.totalItems = response.data.totalItems;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement demandes de retrait:', error);
        this.snackBar.open('Erreur lors du chargement des demandes de retrait', 'Fermer', {
          duration: 3000
        });
        this.isLoading = false;
      }
    });
  }

  // 🔹 Gestion de la pagination
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.itemsPerPage = event.pageSize;
    this.loadWithdrawalRequests();
  }

  // 🔹 Application des filtres
  applyFilters(): void {
    this.currentPage = 1;
    this.loadWithdrawalRequests();
  }

  // 🔹 Réinitialisation des filtres
  clearFilters(): void {
    this.filters.status = '';
    this.currentPage = 1;
    this.loadWithdrawalRequests();
  }

  // 🔹 Formatage des montants
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // 🔹 Formatage des dates
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 🔹 Obtention du statut avec couleur
  getStatusColor(status: string): string {
    switch (status) {
      case 'COMPLETED': return '#4caf50';
      case 'PENDING': return '#ff9800';
      case 'FAILED': return '#f44336';
      case 'CANCELLED': return '#9e9e9e';
      default: return '#9e9e9e';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'check_circle';
      case 'PENDING': return 'schedule';
      case 'FAILED': return 'cancel';
      case 'CANCELLED': return 'block';
      default: return 'help';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'Terminé';
      case 'PENDING': return 'En attente';
      case 'FAILED': return 'Échoué';
      case 'CANCELLED': return 'Annulé';
      default: return status;
    }
  }

  // 🔹 Création d'avatar stable
  getStableColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, 70%, 60%)`;
  }

  createStableAvatar(name: string): { letter: string; color: string } {
    const firstLetter = name ? name.charAt(0).toUpperCase() : '?';
    return {
      letter: firstLetter,
      color: this.getStableColor(name)
    };
  }
}
