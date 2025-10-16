import { Navigation } from 'src/app/@theme/types/navigation';
import { Role1 } from 'src/app/@theme/types/user';

export const menus: Navigation[] = [
  {
    id: 'navigation',
    title: '',
    type: 'group',
    icon: 'icon-navigation',
    role: [Role1.SUPER_ADMIN, Role1.SYSTEM_ADMIN, Role1.CARD_MANAGER, Role1.COMPLIANCE_OFFICER, Role1.CUSTOMER_ADVISER,
    Role1.MANAGEMENT_CONTROLLER, Role1.TECHNICAL_DIRECTOR
    ],
    children: [
      {
        id: 'sample-page',
        title: 'Dashboard',
        type: 'item',
        classes: 'nav-item',
        url: '/dashboard',
        icon: '#custom-status-up'
      },
    ]
  },

];
