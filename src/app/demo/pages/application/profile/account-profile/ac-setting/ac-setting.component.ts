import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PingService } from 'src/app/@theme/services/ping.service';

@Component({
  selector: 'app-ac-setting',
  imports: [CommonModule, SharedModule, ReactiveFormsModule],
  templateUrl: './ac-setting.component.html',
  styleUrls: ['../account-profile.scss', './ac-setting.component.scss']
})
export class AcSettingComponent implements OnInit {
  // Formulaires
  pincodeForm: FormGroup;
  passcodeForm: FormGroup;
  verifyPincodeForm: FormGroup;

  // États
  hasPincode = false;
  isLoading = false;
  isVerifyingPincode = false;
  showPincodeSection = false;
  showPasscodeSection = false;
  showVerifyPincodeSection = false;

  // Champs pincode
  pincodeDigits: string[] = ['', '', '', ''];
  isPincodeComplete = false;
  pincodeError = '';

  // Champs passcode (MAINTENANT 4 CHIFFRES)
  passcodeDigits: string[] = ['', '', '', ''];
  isPasscodeComplete = false;
  passcodeError = '';

  // Champs vérification pincode
  verifyPincodeDigits: string[] = ['', '', '', ''];
  isVerifyPincodeComplete = false;
  verifyPincodeError = '';

  constructor(
    private fb: FormBuilder,
    private pingService: PingService,
    private snackBar: MatSnackBar
  ) {
    this.pincodeForm = this.fb.group({
      pincode: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(4)]]
    });

    this.passcodeForm = this.fb.group({
      passcode: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(4)]] // Changé à 4
    });

    this.verifyPincodeForm = this.fb.group({
      verifyPincode: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(4)]]
    });
  }

  ngOnInit(): void {
    this.checkUserPincode();
  }

  // Vérifier si l'utilisateur a un pincode
  checkUserPincode(): void {
    this.isLoading = true;
    this.pingService.checkUserPincode().subscribe({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: (response: any) => {
        this.hasPincode = response.status === 200;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur vérification pincode:', error);
        this.hasPincode = false;
        this.isLoading = false;
      }
    });
  }

  // Afficher/masquer les sections
  togglePincodeSection(): void {
    this.showPincodeSection = !this.showPincodeSection;
    this.showPasscodeSection = false;
    this.showVerifyPincodeSection = false;
    this.resetPincodeForms();
  }

  togglePasscodeSection(): void {
    this.showPasscodeSection = !this.showPasscodeSection;
    this.showPincodeSection = false;
    this.showVerifyPincodeSection = false;
    this.resetPasscodeForms();
  }

  toggleVerifyPincodeSection(): void {
    this.showVerifyPincodeSection = !this.showVerifyPincodeSection;
    this.showPincodeSection = false;
    this.showPasscodeSection = false;
    this.resetVerifyPincodeForms();
  }

  // Gestion de la saisie du pincode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPincodeInput(index: number, event: any, nextInput: any): void {
    const value = event.target.value;

    if (!/^\d*$/.test(value)) {
      event.target.value = '';
      this.pincodeDigits[index] = '';
      return;
    }

    this.pincodeDigits[index] = value;

    if (value && nextInput) {
      nextInput.focus();
    }

    this.checkPincodeComplete();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPincodeKeyDown(index: number, event: any): void {
    if (event.key === 'Backspace' && !this.pincodeDigits[index] && index > 0) {
      const prevInput = event.target.previousElementSibling;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }

  checkPincodeComplete(): void {
    this.isPincodeComplete = this.pincodeDigits.every(digit => digit !== '');
    this.pincodeError = '';
  }

  // Gestion de la saisie du passcode (MAINTENANT 4 CHIFFRES)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPasscodeInput(index: number, event: any, nextInput: any): void {
    const value = event.target.value;

    if (!/^\d*$/.test(value)) {
      event.target.value = '';
      this.passcodeDigits[index] = '';
      return;
    }

    this.passcodeDigits[index] = value;

    if (value && nextInput) {
      nextInput.focus();
    }

    this.checkPasscodeComplete();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPasscodeKeyDown(index: number, event: any): void {
    if (event.key === 'Backspace' && !this.passcodeDigits[index] && index > 0) {
      const prevInput = event.target.previousElementSibling;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }

  checkPasscodeComplete(): void {
    this.isPasscodeComplete = this.passcodeDigits.every(digit => digit !== '');
    this.passcodeError = '';
  }

  // Gestion de la vérification pincode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onVerifyPincodeInput(index: number, event: any, nextInput: any): void {
    const value = event.target.value;

    if (!/^\d*$/.test(value)) {
      event.target.value = '';
      this.verifyPincodeDigits[index] = '';
      return;
    }

    this.verifyPincodeDigits[index] = value;

    if (value && nextInput) {
      nextInput.focus();
    }

    this.checkVerifyPincodeComplete();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onVerifyPincodeKeyDown(index: number, event: any): void {
    if (event.key === 'Backspace' && !this.verifyPincodeDigits[index] && index > 0) {
      const prevInput = event.target.previousElementSibling;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }

  checkVerifyPincodeComplete(): void {
    this.isVerifyPincodeComplete = this.verifyPincodeDigits.every(digit => digit !== '');
    this.verifyPincodeError = '';
  }

  // Vérifier le pincode
  verifyPincode(): void {
    if (!this.isVerifyPincodeComplete) {
      this.verifyPincodeError = 'Veuillez saisir votre code PIN complet';
      return;
    }

    const pincode = parseInt(this.verifyPincodeDigits.join(''), 10);

    if (isNaN(pincode) || pincode.toString().length !== 4) {
      this.verifyPincodeError = 'Le code PIN doit contenir exactement 4 chiffres';
      return;
    }

    this.isVerifyingPincode = true;

    this.pingService.checkPincode(pincode).subscribe({

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: (response: any) => {
        this.isVerifyingPincode = false;
        
        if (response.status === 200) {
          this.snackBar.open('Code PIN vérifié avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.hasPincode = true;
          this.showVerifyPincodeSection = false;
          this.resetVerifyPincodeForms();
        } else {
          this.verifyPincodeError = 'Code PIN incorrect';
        }
      },
      error: () => {
        this.isVerifyingPincode = false;
        this.verifyPincodeError = 'Erreur lors de la vérification du code PIN';
        this.snackBar.open('Erreur lors de la vérification du code PIN', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // Envoyer le passcode (MAINTENANT 4 CHIFFRES)
  sendPasscode(): void {
    if (!this.isPasscodeComplete) {
      this.passcodeError = 'Veuillez saisir votre passcode complet';
      return;
    }

    const passcode = parseInt(this.passcodeDigits.join(''), 10);

    if (isNaN(passcode) || passcode.toString().length !== 4) {
      this.passcodeError = 'Le passcode doit contenir exactement 4 chiffres';
      return;
    }

    this.isLoading = true;

    this.pingService.sendPasscode(passcode).subscribe({

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: (response: any) => {
        this.isLoading = false;
        
        if (response.status === 200) {
          this.snackBar.open('Passcode envoyé avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.showPasscodeSection = false;
          this.resetPasscodeForms();
        } else {
          this.passcodeError = response.message || 'Erreur lors de l\'envoi du passcode';
        }
      },
      error: () => {
        this.isLoading = false;
        this.passcodeError = 'Erreur lors de l\'envoi du passcode';
        this.snackBar.open('Erreur lors de l\'envoi du passcode', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // Réinitialiser les formulaires
  resetPincodeForms(): void {
    this.pincodeDigits = ['', '', '', ''];
    this.isPincodeComplete = false;
    this.pincodeError = '';
  }

  resetPasscodeForms(): void {
    this.passcodeDigits = ['', '', '', '']; // Changé à 4 éléments
    this.isPasscodeComplete = false;
    this.passcodeError = '';
  }

  resetVerifyPincodeForms(): void {
    this.verifyPincodeDigits = ['', '', '', ''];
    this.isVerifyPincodeComplete = false;
    this.verifyPincodeError = '';
  }

  // Annuler les opérations
  cancelPincode(): void {
    this.showPincodeSection = false;
    this.resetPincodeForms();
  }

  cancelPasscode(): void {
    this.showPasscodeSection = false;
    this.resetPasscodeForms();
  }

  cancelVerifyPincode(): void {
    this.showVerifyPincodeSection = false;
    this.resetVerifyPincodeForms();
  }
}