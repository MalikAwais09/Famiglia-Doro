interface CardPaymentData {
  cardholderName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export const paymentService = {
  validateCard: (data: CardPaymentData): { valid: boolean; error?: string } => {
    if (!data.cardholderName.trim()) return { valid: false, error: 'Cardholder name required' };
    const cardNum = data.cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cardNum)) return { valid: false, error: 'Card number must be 13-19 digits' };
    if (!/^\d{2}\/\d{2}$/.test(data.expiry)) return { valid: false, error: 'Expiry must be MM/YY' };
    const [month, year] = data.expiry.split('/').map(Number);
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    if (year < currentYear || (year === currentYear && month < currentMonth)) return { valid: false, error: 'Card has expired' };
    if (month < 1 || month > 12) return { valid: false, error: 'Invalid expiry month' };
    if (!/^\d{3,4}$/.test(data.cvv)) return { valid: false, error: 'CVV must be 3-4 digits' };
    return { valid: true };
  },

  processCardPayment: async (amount: number, data: CardPaymentData): Promise<{ success: boolean; error?: string; transactionId?: string }> => {
    const validation = paymentService.validateCard(data);
    if (!validation.valid) return { success: false, error: validation.error };
    await new Promise(resolve => setTimeout(resolve, 1200));
    if (Math.random() > 0.05) {
      return { success: true, transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
    }
    return { success: false, error: 'Card declined. Please try another card.' };
  },

  formatCardForDisplay: (cardNumber: string): string => {
    const digits = cardNumber.replace(/\s/g, '');
    return `****-****-****-${digits.slice(-4)}`;
  },

  maskCardNumber: (cardNumber: string): string => {
    const digits = cardNumber.replace(/\s/g, '');
    return digits.replace(/\d(?=\d{4})/g, '*');
  },

  getCardType: (cardNumber: string): string => {
    const num = cardNumber.replace(/\s/g, '');
    if (/^4/.test(num)) return 'Visa';
    if (/^5[1-5]/.test(num)) return 'Mastercard';
    if (/^3[47]/.test(num)) return 'American Express';
    if (/^6(?:011|5)/.test(num)) return 'Discover';
    return 'Card';
  },

  getProcessingFee: (amount: number): number => Math.round((amount * 0.029 + 0.3) * 100) / 100,

  getTotalWithFees: (amount: number): number => amount + paymentService.getProcessingFee(amount),
};
