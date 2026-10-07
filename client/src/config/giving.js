export const GIFT_AMOUNTS = [500, 1000, 2500, 5000];

export const GIVING_METHODS = [
  {
    id: 'bank',
    labelKey: 'bankTransfer',
    hintKey: 'bankHint',
    rows: [
      { labelKey: 'accountTitle', value: 'Zia Chitrali' },
      { labelKey: 'bankName', value: 'Meezan Bank' },
      { labelKey: 'accountNumber', value: '0123-4567890-01', copy: true },
      { labelKey: 'iban', value: 'PK36MEZN0123456789000101', copy: true },
    ],
  },
  {
    id: 'easypaisa',
    labelKey: 'easyPaisa',
    hintKey: 'walletHint',
    rows: [
      { labelKey: 'accountTitle', value: 'Zia Chitrali' },
      { labelKey: 'walletNumber', value: '0300-1234567', copy: true },
    ],
  },
  {
    id: 'jazzcash',
    labelKey: 'jazzCash',
    hintKey: 'walletHint',
    rows: [
      { labelKey: 'accountTitle', value: 'Zia Chitrali' },
      { labelKey: 'walletNumber', value: '0301-7654321', copy: true },
    ],
  },
];
