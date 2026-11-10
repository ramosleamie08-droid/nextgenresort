export type PaymentMethod = 'gcash' | 'maya' | 'bank';
export type PaymentType = 'down' | 'full';

export interface PaymentInfo {
  id: PaymentMethod;
  label: string;
  accountName: string;
  accountNo: string;
  extra?: string;
}

// PALITAN lahat ng account details
export const PAYMENT_METHODS: PaymentInfo[] = [
  { id: 'gcash', label: 'GCash', accountName: 'NextGen Pascual Resort', accountNo: '09XX XXX XXXX' },
  { id: 'maya', label: 'Maya', accountName: 'NextGen Pascual Resort', accountNo: '09XX XXX XXXX' },
  { id: 'bank', label: 'Bank', accountName: 'NextGen Pascual Resort', accountNo: 'XXXX-XXXX-XXXX', extra: 'Bank: PALITAN' },
];