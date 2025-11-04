export interface TransactionDetail {
  id: number;
  transactionId: string;
  amount: number;
  exchangeRates: number;
  sendoFees: number;
  currency: string;
  description: string;
  tva: number;
  partnerFees: number;
  totalAmount: number;
  type: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'BLOCKED';
  receiverId: number;
  receiverType: string;
  virtualCardId: number | null;
  method: string;
  provider: string;
  transactionReference: string | null;
  bankName: string | null;
  accountNumber: string | null;
  retryCount: number;
  lastChecked: string | null;
  createdAt: string;
  updatedAt: string;
  userId: number;
}

export interface MerchantTransaction {
  id: number;
  transactionId: number;
  partnerId: number;
  amount: number;
  isWithdrawn: boolean;
  createdAt: string;
  updatedAt: string;
  transaction: TransactionDetail;
}

export interface MerchantTransactionsResponse {
  status: number;
  message: string;
  data: {
    page: number;
    totalPages: number;
    totalItems: number;
    items: MerchantTransaction[];
    totalCommission: number;
  };
}

export interface TransferFundsPayload {
  toWallet: string;
  amount: number;
}

export interface TransferFundsResponse {
  status: number;
  message: string;
  data: {
    transactionId: string;
    amount: number;
    currency: string;
    createdAt: string;
  };
}

export interface WalletUser {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  picture: string | null;
}

export interface Wallet {
  id: number;
  balance: number;
  currency: string;
  status: string;
  userId: number;
  matricule: string;
  createdAt: string;
  updatedAt: string;
  user: WalletUser;
}


// Interfaces pour les statistiques
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
