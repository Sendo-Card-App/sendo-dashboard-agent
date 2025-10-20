// Angular import
import { Component, effect, inject, input, OnInit } from '@angular/core';
import { CommonModule, Location, LocationStrategy } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

// project import
import { NavigationItem } from 'src/app/@theme/types/navigation';
import { ThemeLayoutService } from 'src/app/@theme/services/theme-layout.service';
import { HORIZONTAL, VERTICAL, COMPACT } from 'src/app/@theme/const';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MenuGroupVerticalComponent } from './menu-group/menu-group.component';
import { MenuItemVerticalComponent } from './menu-item/menu-item.component';
import { AuthenticationService } from 'src/app/@theme/services/authentication.service';
import { MenuCollapseComponent } from './menu-collapse/menu-collapse.component';
import { MeResponse } from 'src/app/@theme/models';
import { MatCheckboxChange } from '@angular/material/checkbox';

interface ContactInfo {
  icon: string;
  text: string;
  editable: boolean;
  fieldName?: keyof MeResponse;
}

interface PersonalDetail {
  group: string;
  text: string;
  editable: boolean;
  fieldName?: keyof MeResponse;
  group_2: string;
  text_2: string;
  editable_2: boolean;
  fieldName_2?: keyof MeResponse;
}
@Component({
  selector: 'app-vertical-menu',
  imports: [SharedModule, MenuGroupVerticalComponent, MenuItemVerticalComponent, MenuCollapseComponent, RouterModule, CommonModule],
  templateUrl: './vertical-menu.component.html',
  styleUrls: ['./vertical-menu.component.scss']
})
export class VerticalMenuComponent implements OnInit {
  private location = inject(Location);
  private locationStrategy = inject(LocationStrategy);
  private themeService = inject(ThemeLayoutService);
  authenticationService = inject(AuthenticationService);
  userData: MeResponse | null = null;
  userRoles = '';
  contactInfos: ContactInfo[] = [];
  personalDetails: PersonalDetail[] = [];
    isPaymentEnabled = false;

  // public props
  readonly menus = input<NavigationItem[]>();
  showUser: false;
  showContent = true;
  direction: string = 'ltr';
  userName: string = '';
  isverifiedkyc = false;

  // Constructor
  constructor(private router: Router, private Auth: AuthenticationService) {
    effect(() => {
      this.updateThemeLayout(this.themeService.layout());
    });
    effect(() => {
      this.isRtlTheme(this.themeService.directionChange());
    });
    const userData = JSON.parse(localStorage.getItem('user-info') || '{}');
    this.userName = [userData.firstname, userData.lastname].filter(Boolean).join(' ');
  }

  ngOnInit(): void {
    this.loadUserKycDocuments();
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

  // public method
  fireOutClick() {
    let current_url = this.location.path();
    const baseHref = this.locationStrategy.getBaseHref();
    if (baseHref) {
      current_url = baseHref + this.location.path();
    }
    const link = "a.nav-link[ href='" + current_url + "' ]";
    const ele = document.querySelector(link);
    if (ele !== null && ele !== undefined) {
      const parent = ele.parentElement;
      const up_parent = parent?.parentElement?.parentElement;
      const last_parent = up_parent?.parentElement;
      if (parent?.classList.contains('coded-hasmenu')) {
        parent.classList.add('coded-trigger');
        parent.classList.add('active');
      } else if (up_parent?.classList.contains('coded-hasmenu')) {
        up_parent.classList.add('coded-trigger');
        up_parent.classList.add('active');
      } else if (last_parent?.classList.contains('coded-hasmenu')) {
        last_parent.classList.add('coded-trigger');
        last_parent.classList.add('active');
      }
    }
  }

  private updateThemeLayout(layout: string) {
    if (layout == VERTICAL) {
      this.showContent = true;
    }
    if (layout == HORIZONTAL) {
      this.showContent = false;
    }
    if (layout == COMPACT) {
      this.showContent = false;
    }
  }

  private isRtlTheme(direction: string) {
    this.direction = direction;
  }

  // user Logout
  logout() {
    this.authenticationService.logout().subscribe({
        complete: () => {
            this.router.navigate(['/']);
        },
        error: (err) => {
            console.error('Logout error:', err);
            this.router.navigate(['/']);
        }
    });
}

 /** Calcule une couleur stable à partir du nom */
 private getStableColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 60%)`;
}

/** Retourne la première lettre + couleur */
createStableAvatar(): { letter: string; color: string } {
  // si firstname est vide, on tombe sur '?'
  const letter = (this.userName.charAt(0).toUpperCase() || '?');

  // concaténation simple : toujours une string
  const name = this.userName;

  return {
    letter,
    color: this.getStableColor(name)
  };
}

 togglePaymentActivation(event: MatCheckboxChange) {
    this.isPaymentEnabled = event.checked;

    if (event.checked) {
      // Logique pour activer les paiements
      console.log('Activation des paiements demandée');
      // Vous pouvez ajouter une logique de vérification supplémentaire ici
    }
  }

  startVerification() {
    // Logique pour démarrer le processus de vérification
    console.log('Démarrage du processus de vérification');
    // Redirection vers la page de vérification KYC
    this.router.navigate(['/verification']);
  }

}
