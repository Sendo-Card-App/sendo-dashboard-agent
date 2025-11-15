import { AuthenticationService } from './../../../../@theme/services/authentication.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// project import
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { AdminService } from 'src/app/@theme/services/admin.service';

export interface StatisticsData {
  merchant: {
    id: number;
    balance: number;
    typeAccount: string;
    status: string;
    user: {
      name: string;
      email: string;
      phone: string;
    };
  };
  summary: {
    totalFees: number;
    totalWithdrawn: number;
    availableBalance: number;
    pendingWithdrawals: number;
    totalTransactions: number;
  };
  recentFees: Array<{
    id: number;
    amount: number;
    isWithdrawn: boolean;
    createdAt: string;
    transaction: {
      id: string;
      amount: number;
      status: string;
    };
  }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentWithdrawals: Array<any>;
}

export interface DashboardSummaryItem {
  icon: string;
  background: string;
  title: string;
  value: string;
  percentage?: string;
  color?: string;
  trend?: 'up' | 'down' | 'stable';
}

@Component({
  selector: 'app-online-dashboard',
  imports: [
    SharedModule,
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './online-dashboard.component.html',
  styleUrls: ['./online-dashboard.component.scss']
})
export class OnlineDashboardComponent implements OnInit {

  // Propriétés existantes
  isverifiedkyc = false;
  currencySymbol = 'XAF';

  // Nouvelles propriétés pour les statistiques
  statisticsData: StatisticsData | null = null;
  isLoading = false;
  dateFilter = {
    startDate: '',
    endDate: ''
  };

  // Données pour les graphiques
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  balanceDistributionData: any = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transactionTrendsData: any = {};

  // Cartes de résumé
  dashboard_summary: DashboardSummaryItem[] = [];

  constructor(
    private adminService: AdminService,
    private Auth: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.loadUserKycDocuments();
    this.loadStatistics();
    this.initializeChartData();
  }

  loadUserKycDocuments(): void {
    this.Auth.getUserIdentifiant().subscribe({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: (response: any) => {
        if (response.data?.isVerifiedKYC === true) {
          this.isverifiedkyc = true;
        }
      },
      error: (error) => {
        console.error('Erreur chargement KYC:', error);
      }
    });
  }

  loadStatistics(): void {
    this.isLoading = true;

    this.Auth.getUserIdentifiant().subscribe({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: (userResponse: any) => {
        const merchantId = userResponse.data.merchant?.id;

        if (!merchantId) {
          console.error('ID marchand non trouvé');
          this.isLoading = false;
          return;
        }

        this.adminService.getStatistics(
          merchantId,
          this.dateFilter.startDate || undefined,
          this.dateFilter.endDate || undefined
        ).subscribe({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          next: (response: any) => {
            this.statisticsData = response.data;
            this.updateDashboardSummary();
            this.updateChartData();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Erreur chargement statistiques:', error);
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Erreur récupération utilisateur:', error);
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.loadStatistics();
  }

  clearFilters(): void {
    this.dateFilter = {
      startDate: '',
      endDate: ''
    };
    this.loadStatistics();
  }

  private updateDashboardSummary(): void {
    if (!this.statisticsData) return;

    const { summary } = this.statisticsData;

    this.dashboard_summary = [
      {
        icon: '#custom-card',
        background: 'bg-primary-50 text-primary-500',
        title: 'Solde Disponible',
        value: this.formatCurrency(summary.availableBalance),
        percentage: '+2.5%',
        color: 'text-success',
        trend: 'up'
      },
      {
        icon: '#custom-receipt',
        background: 'bg-success-50 text-success-500',
        title: 'Total Transactions',
        value: summary.totalTransactions.toString(),
        percentage: '+12.5%',
        color: 'text-success',
        trend: 'up'
      },
      {
        icon: '#custom-money',
        background: 'bg-warning-50 text-warning-500',
        title: 'Total commission',
        value: this.formatCurrency(summary.totalFees),
        percentage: '-5.2%',
        color: 'text-warn-500',
        trend: 'down'
      },
      {
        icon: '#custom-wallet',
        background: 'bg-info-50 text-info-500',
        title: 'Retraits en Attente',
        value: summary.pendingWithdrawals.toString(),
        percentage: '0%',
        color: 'text-info-500',
        trend: 'stable'
      }
    ];
  }

  private initializeChartData(): void {
    // Données par défaut pour les graphiques
    this.balanceDistributionData = {
      series: [70, 20, 10],
      labels: ['Disponible', 'Frais', 'En attente'],
      colors: ['#218366', '#FF9800', '#2196F3']
    };

    this.transactionTrendsData = {
      series: [30, 40, 35, 50, 49, 60, 70],
      categories: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    };
  }

  private updateChartData(): void {
    if (!this.statisticsData) return;

    const { summary, merchant } = this.statisticsData;

    // Mise à jour du graphique de répartition
    const total = merchant.balance;
    const availablePercent = (summary.availableBalance / total) * 100;
    const feesPercent = (summary.totalFees / total) * 100;
    const pendingPercent = (summary.pendingWithdrawals / total) * 100;

    this.balanceDistributionData = {
      series: [availablePercent, feesPercent, pendingPercent],
      labels: ['Disponible', 'Frais', 'En attente'],
      colors: ['#218366', '#FF9800', '#2196F3']
    };
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: this.currencySymbol,
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'status-completed';
      case 'PENDING': return 'status-pending';
      case 'FAILED': return 'status-failed';
      default: return 'status-unknown';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'Terminé';
      case 'PENDING': return 'En attente';
      case 'FAILED': return 'Échoué';
      default: return status;
    }
  }
}
