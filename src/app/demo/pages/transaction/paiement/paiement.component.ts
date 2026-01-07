import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Interfaces et services
import { MerchantTransaction, TransferFundsPayload, Wallet } from 'src/app/@theme/models/merchant.model';
import { MerchantService } from 'src/app/@theme/services/merchant.service';
import { AuthenticationService } from 'src/app/@theme/services/authentication.service';
import { ConfirmDialogComponent } from 'src/app/@theme/components/confirm-dialog/confirm-dialog.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-paiement',
  imports: [CommonModule, FormsModule, MatPaginator, RouterModule],
  templateUrl: './paiement.component.html',
  styleUrls: ['./paiement.component.scss']
})
export class PaiementComponent implements OnInit {
  // Propriétés pour les transactions
  transactions: MerchantTransaction[] = [];
  isLoading = false;
  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 10;

  // Filtres avec FormGroup-like structure
  filters = {
    status: '' as 'PENDING' | 'COMPLETED' | 'FAILED' | 'BLOCKED' | '',
    startDate: '',
    endDate: '',
    searchText: ''
  };

  // Propriétés pour le transfert
  showTransferSection = false;
  transferData = {
    toWallet: '',
    amount: null as number | null
  };
  isVerifyingWallet = false;
  walletInfo: Wallet | null = null;
  walletError = '';

  // Propriétés pour le retrait
  showWithdrawalSection = false;
  withdrawalData = {
    phone: '',
    amount: null as number | null,
    walletType: '' as 'MAIN' | 'COMMISSION' | ''
  };
  withdrawalError = '';

  // Propriétés pour le PIN
  showPinModal = false;
  pinDigits: string[] = ['', '', '', ''];
  isPinComplete = false;
  pinError = '';
  isProcessingTransfer = false;
  isProcessingWithdrawal = false;
  currentAction: 'transfer' | 'withdrawal' = 'transfer';

  // Subject pour la recherche avec debounce
  private searchSubject = new Subject<string>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private merchantService: MerchantService,
    private authService: AuthenticationService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.setupFilterListeners();
    this.loadTransactions();
  }

  private setupFilterListeners(): void {
    // Recherche avec debounce (300ms)
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ).subscribe(searchText => {
      this.currentPage = 1;
      this.loadTransactions();
    });
  }

  // 🔹 Chargement des transactions avec l'ID du merchant
  loadTransactions(): void {
    this.isLoading = true;

    this.authService.getUserIdentifiant().subscribe({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: (userResponse: any) => {
        const merchantId = userResponse.data.merchant?.id;

        if (!merchantId) {
          this.snackBar.open('ID marchand non trouvé', 'Fermer', { duration: 3000 });
          this.isLoading = false;
          return;
        }

        this.merchantService.getMerchantTransactions(
          merchantId,
          this.currentPage,
          this.itemsPerPage,
          this.filters.status || undefined,
          this.filters.startDate,
          this.filters.endDate
        ).pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: (response) => {
            this.transactions = response.data.items;
            this.totalItems = response.data.totalItems;
          },
          error: (error) => {
            console.error('Erreur chargement transactions:', error);
            this.snackBar.open('Erreur lors du chargement des transactions', 'Fermer', {
              duration: 3000
            });
          }
        });
      },
      error: (error) => {
        console.error('Erreur récupération utilisateur:', error);
        this.isLoading = false;
        this.snackBar.open('Erreur lors de la récupération des informations utilisateur', 'Fermer', {
          duration: 3000
        });
      }
    });
  }

  maskPhone(phone: string): string {
    if (!phone) return '';

    const cleaned = phone.toString().trim(); // au cas où on reçoit un number
    const length = cleaned.length;

    if (length <= 4) {
      // Si le numéro fait 4 chiffres ou moins, on ne masque rien
      return cleaned;
    }

    const visible = cleaned.slice(-4);
    const maskedPart = '*'.repeat(length - 4);

    return maskedPart + visible;
  }

  // 🔹 Gestion de la pagination
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.itemsPerPage = event.pageSize;
    this.loadTransactions();
  }

  // 🔹 Application des filtres
  applyFilters(): void {
    this.currentPage = 1;
    this.loadTransactions();
  }

  // 🔹 Recherche avec debounce
  applySearch(value: string): void {
    this.filters.searchText = value.trim().toLowerCase();
    this.searchSubject.next(this.filters.searchText);
  }

  // 🔹 Réinitialisation des filtres
  clearFilters(): void {
    this.filters = {
      status: '',
      startDate: '',
      endDate: '',
      searchText: ''
    };
    this.currentPage = 1;
    this.loadTransactions();
  }

  // 🔹 Vérification de l'identité du wallet
  verifyWallet(): void {
    if (!this.transferData.toWallet.trim()) {
      this.walletError = 'Veuillez saisir un matricule';
      return;
    }

    this.isVerifyingWallet = true;
    this.walletError = '';
    this.walletInfo = null;

    const walletId = this.transferData.toWallet;

    this.merchantService.getWalletById(walletId).subscribe({
      next: (response) => {
        this.walletInfo = response.data;
        this.isVerifyingWallet = false;
      },
      error: (error) => {
        console.error('Erreur vérification wallet:', error);
        this.walletError = 'Matricule non trouvé';
        this.isVerifyingWallet = false;
      }
    });
  }

  // 🔹 Initialisation du transfert
  initiateTransfer(): void {
    if (!this.walletInfo || !this.transferData.amount || this.transferData.amount <= 0) {
      this.snackBar.open('Veuillez vérifier les informations du transfert', 'Fermer', {
        duration: 3000
      });
      return;
    }

    this.currentAction = 'transfer';

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation du dépôt',
        message: `Êtes-vous sûr de vouloir transférer ${this.formatCurrency(this.transferData.amount)} à ${this.walletInfo.user.firstname} ${this.walletInfo.user.lastname} ?`,
        confirmText: 'Confirmer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.showPinModal = true;
      }
    });
  }

  // 🔹 Initialisation du retrait
  initiateWithdrawal(): void {
    if (
      !this.withdrawalData.phone || 
      !this.withdrawalData.amount || 
      this.withdrawalData.amount <= 0 ||
      this.withdrawalData.walletType == ''
    ) {
      this.snackBar.open('Veuillez vérifier les informations du retrait', 'Fermer', {
        duration: 3000
      });
      return;
    }

    this.currentAction = 'withdrawal';
    console.log('Données retrait:', this.withdrawalData);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation du retrait',
        message: `Êtes-vous sûr de vouloir effectuer un retrait de ${this.formatCurrency(this.withdrawalData.amount)} FCFA de votre ${this.getLabelWallet(this.withdrawalData.walletType)} vers le numéro ${this.withdrawalData.phone} ?`,
        confirmText: 'Confirmer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.showPinModal = true;
      }
    });
  }

  // 🔹 Gestion de la saisie du PIN
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPinInput(index: number, event: any, nextInput: any): void {
    const value = event.target.value;

    if (!/^\d*$/.test(value)) {
      event.target.value = '';
      this.pinDigits[index] = '';
      return;
    }

    this.pinDigits[index] = value;

    if (value && nextInput) {
      nextInput.focus();
    }

    this.checkPinComplete();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPinKeyDown(index: number, event: any): void {
    if (event.key === 'Backspace' && !this.pinDigits[index] && index > 0) {
      const prevInput = event.target.previousElementSibling;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }

  checkPinComplete(): void {
    this.isPinComplete = this.pinDigits.every(digit => digit !== '');
    this.pinError = '';
  }

  // 🔹 Confirmation avec PIN
  confirmWithPin(): void {
    if (!this.isPinComplete) {
      this.pinError = 'Veuillez saisir votre code PIN complet';
      return;
    }

    const pinCode = this.pinDigits.join('');

    if (pinCode.length !== 4) {
      this.pinError = 'Le code PIN doit contenir exactement 4 chiffres';
      return;
    }

    if (this.currentAction === 'transfer') {
      this.confirmTransferWithPin(pinCode);
    } else {
      this.confirmWithdrawalWithPin(pinCode);
    }
  }

  // 🔹 Confirmation du transfert avec PIN
  confirmTransferWithPin(pinCode: string): void {
    this.isProcessingTransfer = true;

    const payload: TransferFundsPayload = {
      toWallet: this.transferData.toWallet,
      amount: this.transferData.amount!
    };

    this.merchantService.transferFunds(payload, pinCode).subscribe({
      next: () => {
        this.isProcessingTransfer = false;
        this.showPinModal = false;
        this.resetTransferForm();

        this.snackBar.open('Transfert effectué avec succès!', 'Fermer', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });

        this.loadTransactions();
      },
      error: (error) => {
        this.isProcessingTransfer = false;

        if (error('Passcode')) {
          this.pinError = 'Code PIN incorrect ou non configuré';
          this.snackBar.open('Code PIN incorrect ou non configuré', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        } else {
          this.pinError = 'Erreur lors du transfert';
          this.snackBar.open('Erreur lors du transfert: ' + (error || 'Erreur inconnue'), 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      }
    });
  }

  // 🔹 Confirmation du retrait avec PIN
  confirmWithdrawalWithPin(pinCode: string): void {
    this.isProcessingWithdrawal = true;

    this.authService.getUserIdentifiant().subscribe({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: (userResponse: any) => {
        const merchantId = userResponse.data.merchant?.id;

        if (!merchantId) {
          this.snackBar.open('ID marchand non trouvé', 'Fermer', { duration: 3000 });
          this.isProcessingWithdrawal = false;
          return;
        }

        const payload = {
          phone: this.withdrawalData.phone,
          amountToWithdraw: this.withdrawalData.amount!,
          idMerchant: merchantId
        };

        this.merchantService.withdrawRequest(payload, pinCode).subscribe({
          next: () => {
            this.isProcessingWithdrawal = false;
            this.showPinModal = false;
            this.resetWithdrawalForm();

            this.snackBar.open('Demande de retrait effectuée avec succès!', 'Fermer', {
              duration: 5000,
              panelClass: ['success-snackbar']
            });

            this.loadTransactions();
          },
          error: (error) => {
            this.isProcessingWithdrawal = false;
            console.log('Erreur retrait:', error);

            if (error.includes('Passcode')) {
              this.pinError = 'Code PIN incorrect ou non configuré';
              this.snackBar.open('Code PIN incorrect ou non configuré', 'Fermer', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
            } else {
              this.pinError = 'Erreur lors du retrait';
              this.snackBar.open('Erreur lors du retrait: ' + (error || 'Erreur inconnue'), 'Fermer', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
            }
          }
        });
      },
      error: () => {
        this.isProcessingWithdrawal = false;
        this.snackBar.open('Erreur lors de la récupération des informations utilisateur', 'Fermer', {
          duration: 3000
        });
      }
    });
  }

  // 🔹 Réinitialisation du formulaire de transfert
  resetTransferForm(): void {
    this.transferData = {
      toWallet: '',
      amount: null
    };
    this.walletInfo = null;
    this.walletError = '';
    this.pinDigits = ['', '', '', ''];
    this.isPinComplete = false;
    this.pinError = '';
  }

  // 🔹 Réinitialisation du formulaire de retrait
  resetWithdrawalForm(): void {
    this.withdrawalData = {
      phone: '',
      amount: null,
      walletType: ''
    };
    this.withdrawalError = '';
    this.pinDigits = ['', '', '', ''];
    this.isPinComplete = false;
    this.pinError = '';
  }

  // 🔹 Annulation du transfert
  cancelTransfer(): void {
    this.showTransferSection = false;
    this.resetTransferForm();
  }

  // 🔹 Annulation du retrait
  cancelWithdrawal(): void {
    this.showWithdrawalSection = false;
    this.resetWithdrawalForm();
  }

  // 🔹 Fermeture de la modal PIN
  closePinModal(): void {
    this.showPinModal = false;
    if (this.currentAction === 'transfer') {
      this.resetTransferForm();
    } else {
      this.resetWithdrawalForm();
    }
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
      case 'BLOCKED': return '#9e9e9e';
      default: return '#9e9e9e';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'check_circle';
      case 'PENDING': return 'schedule';
      case 'FAILED': return 'cancel';
      case 'BLOCKED': return 'block';
      default: return 'help';
    }
  }

  getLabelWallet(walletType: 'MAIN' | 'COMMISSION' | ''): string {
    switch (walletType) {
      case 'MAIN': return 'solde principale';
      case 'COMMISSION': return 'solde des commissions';
      default: return 'solde principale';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'Validé';
      case 'PENDING': return 'En attente';
      case 'FAILED': return 'Échoué';
      case 'BLOCKED': return 'Bloqué';
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
