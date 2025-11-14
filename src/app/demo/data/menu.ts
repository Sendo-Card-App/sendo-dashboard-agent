import { Navigation } from 'src/app/@theme/types/navigation';
// import { Role1 } from 'src/app/@theme/types/user';

export const menus: Navigation[] = [
  {
    id: 'navigation',
    title: '',
    type: 'group',
    icon: 'icon-navigation',
    // role: [Role1.MERCHANT],
    children: [
      {
        id: 'sample-page',
        title: 'Dashboard',
        type: 'item',
        classes: 'nav-item',
        url: '/dashboard',
        icon: '#custom-status-up'
      },

      {
        id: 'transaction-page',
        title: 'Transaction',
        type: 'item',
        classes: 'nav-item',
        url: '/transaction',
        icon: '#custom-presentation-chart'
      },
      {
        id: 'withdrawal-page',
        title: 'Demande de Retrait',
        type: 'item',
        classes: 'nav-item',
        url: '/withdrawal',
        icon: '#custom-document-filter'
      },
    ]
  },

];
