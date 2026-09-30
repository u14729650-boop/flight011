import { useState, type FormEvent, type ReactNode } from 'react';
import { PAYMENT_METHODS, type PaymentMethod } from '../../lib/apiTypes';
import { formatINR } from '../../lib/format';
import { Button } from '../ui/Button';
import { FormAlert, SelectField, TextField } from '../ui/Fields';
import { BankIcon, CardIcon, LockIcon, UpiIcon, WalletIcon } from '../ui/Icons';

const ICONS: Record<PaymentMethod, ReactNode> = {
  UPI: <UpiIcon />,
  CREDIT_CARD: <CardIcon />,
  DEBIT_CARD: <CardIcon />,
  NET_BANKING: <BankIcon />,
  WALLET: <WalletIcon />,
};

const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'Bank of Baroda', 'Punjab National Bank'];
const WALLETS = ['Paytm Wallet', 'PhonePe Wallet', 'Amazon Pay', 'Mobikwik'];

function luhn(num: string) {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = Number(num[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export interface PaymentSubmit {
  method: PaymentMethod;
  /** Demo only: the tester chose a failure scenario (fail@demo / 4000 0000 0000 0002). */
  simulateFailure: boolean;
}

/**
 * Payment method selector + (demo) details form. In demo mode, details are
 * validated for format only and are never sent to the server.
 */
export function PaymentCard({
  amount,
  demo,
  loading,
  error,
  onPay,
}: {
  amount: number;
  demo: boolean;
  loading: boolean;
  error: string | null;
  onPay: (p: PaymentSubmit) => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [upi, setUpi] = useState('');
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [bank, setBank] = useState('');
  const [wallet, setWallet] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    let simulateFailure = false;
    if (demo) {
      if (method === 'UPI') {
        if (!/^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(upi.trim())) errs.upi = 'Enter a UPI ID like name@okbank.';
        simulateFailure = upi.trim().toLowerCase() === 'fail@demo';
      } else if (method === 'CREDIT_CARD' || method === 'DEBIT_CARD') {
        const digits = card.number.replace(/\s/g, '');
        if (!/^\d{13,19}$/.test(digits) || !luhn(digits)) errs.number = 'Enter a valid card number.';
        if (card.name.trim().length < 2) errs.name = 'Enter the name on the card.';
        const m = card.expiry.match(/^(\d{2})\s*\/\s*(\d{2})$/);
        const now = new Date();
        if (!m || +m[1] < 1 || +m[1] > 12 || new Date(2000 + +m[2], +m[1]) <= now) errs.expiry = 'Enter a valid future expiry (MM/YY).';
        if (!/^\d{3,4}$/.test(card.cvv)) errs.cvv = 'Enter the 3 or 4 digit CVV.';
        simulateFailure = digits === '4000000000000002';
      } else if (method === 'NET_BANKING') {
        if (!bank) errs.bank = 'Choose your bank.';
      } else if (!wallet) errs.wallet = 'Choose a wallet.';
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onPay({ method, simulateFailure });
  };

  const fmtCard = (v: string) =>
    v
      .replace(/\D/g, '')
      .slice(0, 19)
      .replace(/(\d{4})(?=\d)/g, '$1 ');

  return (
    <form className="pay-card card card--pad" onSubmit={onSubmit} noValidate>
      <h2 className="pay-card__h">Payment method</h2>
      <div className="pay-methods" role="radiogroup" aria-label="Payment method">
        {(Object.keys(PAYMENT_METHODS) as PaymentMethod[]).map((m) => (
          <label key={m} className={`pay-method ${method === m ? 'is-active' : ''}`}>
            <input type="radio" name="method" value={m} checked={method === m} onChange={() => (setMethod(m), setErrors({}))} />
            <span className="pay-method__icon">{ICONS[m]}</span>
            {PAYMENT_METHODS[m]}
          </label>
        ))}
      </div>

      {demo && (
        <div className="pay-card__fields">
          {method === 'UPI' && (
            <TextField label="UPI ID" placeholder="yourname@okbank" value={upi} onChange={(e) => setUpi(e.target.value)} error={errors.upi} autoComplete="off" />
          )}
          {(method === 'CREDIT_CARD' || method === 'DEBIT_CARD') && (
            <div className="form-grid">
              <TextField
                className="span-all"
                label="Card number"
                inputMode="numeric"
                placeholder="4111 1111 1111 1111"
                value={card.number}
                onChange={(e) => setCard({ ...card, number: fmtCard(e.target.value) })}
                error={errors.number}
                autoComplete="off"
              />
              <TextField className="span-all" label="Name on card" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} error={errors.name} autoComplete="off" />
              <TextField
                label="Expiry (MM/YY)"
                inputMode="numeric"
                placeholder="08/29"
                value={card.expiry}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
                  setCard({ ...card, expiry: v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v });
                }}
                error={errors.expiry}
                autoComplete="off"
              />
              <TextField
                label="CVV"
                inputMode="numeric"
                type="password"
                maxLength={4}
                value={card.cvv}
                onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })}
                error={errors.cvv}
                autoComplete="off"
              />
            </div>
          )}
          {method === 'NET_BANKING' && (
            <SelectField label="Bank" value={bank} onChange={(e) => setBank(e.target.value)} error={errors.bank}>
              <option value="" disabled>
                Choose your bank
              </option>
              {BANKS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </SelectField>
          )}
          {method === 'WALLET' && (
            <SelectField label="Wallet" value={wallet} onChange={(e) => setWallet(e.target.value)} error={errors.wallet}>
              <option value="" disabled>
                Choose a wallet
              </option>
              {WALLETS.map((w) => (
                <option key={w}>{w}</option>
              ))}
            </SelectField>
          )}
          <p className="xs muted">
            Demo tip: use UPI ID <code>fail@demo</code> or card <code>4000 0000 0000 0002</code> to test a declined payment. Test card <code>4111 1111 1111 1111</code> succeeds.
          </p>
        </div>
      )}

      {error && <FormAlert>{error}</FormAlert>}

      <Button type="submit" size="lg" block loading={loading} icon={<LockIcon width={18} />} arrow="right">
        {demo ? `Pay ${formatINR(amount)} (demo)` : `Pay ${formatINR(amount)}`}
      </Button>
      <p className="pay-card__secure">
        <LockIcon width={14} /> {demo ? 'Demo mode — no money is charged and card details never leave your browser.' : 'Payments are processed securely by our payment partner.'}
      </p>
    </form>
  );
}
