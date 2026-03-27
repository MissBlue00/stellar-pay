'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import {
  CreditCard,
  Building2,
  Coins,
  Copy,
  CheckCircle2,
  Shield,
  Clock,
  ExternalLink,
  ChevronDown,
  Loader2,
  Lock,
  Check,
} from 'lucide-react';
import { Button } from '../components/ui/button';

type PaymentMethod = 'card' | 'bank' | 'crypto';
type PaymentState = 'initial' | 'processing' | 'confirming' | 'success';
type CryptoToken = 'BTC' | 'ETH' | 'USDC';

interface PaymentDetails {
  merchantName: string;
  merchantLogo: string;
  amount: number;
  currency: string;
  description: string;
}

export default function PaymentCheckout() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [paymentState, setPaymentState] = useState<PaymentState>('initial');
  const [selectedToken, setSelectedToken] = useState<CryptoToken>('USDC');
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes
  const [copied, setCopied] = useState(false);
  const [confirmations, setConfirmations] = useState(0);
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
  });

  // Mock payment details
  const paymentDetails: PaymentDetails = {
    merchantName: 'Acme Corporation',
    merchantLogo: 'AC',
    amount: 1299.99,
    currency: 'USD',
    description: 'Enterprise Annual Subscription',
  };

  const processingFee = paymentMethod === 'crypto' ? 2.5 : 3.99;
  const totalAmount = paymentDetails.amount + processingFee;

  // Crypto addresses for different tokens
  const cryptoAddresses = {
    BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    ETH: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    USDC: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  };

  const networkInfo = {
    BTC: 'Bitcoin Mainnet',
    ETH: 'Ethereum Mainnet',
    USDC: 'Ethereum (ERC-20)',
  };

  const tokenAmounts = {
    BTC: (totalAmount / 45000).toFixed(8),
    ETH: (totalAmount / 2400).toFixed(6),
    USDC: totalAmount.toFixed(2),
  };

  // Timer countdown for bank transfer
  useEffect(() => {
    if (paymentMethod === 'bank' && paymentState === 'processing') {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [paymentMethod, paymentState]);

  // Mock crypto confirmation progress
  useEffect(() => {
    if (paymentState === 'confirming') {
      const intervals = [2000, 3000, 4000];
      let currentStep = 0;

      const progressTimer = setInterval(() => {
        currentStep++;
        setConfirmations(currentStep);

        if (currentStep >= 3) {
          clearInterval(progressTimer);
          setTimeout(() => setPaymentState('success'), 1000);
        }
      }, intervals[currentStep] || 3000);

      return () => clearInterval(progressTimer);
    }
  }, [paymentState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCardPayment = () => {
    if (!cardData.number || !cardData.expiry || !cardData.cvv || !cardData.name) {
      return;
    }
    setPaymentState('processing');
    setTimeout(() => setPaymentState('success'), 2500);
  };

  const handleBankPayment = () => {
    setPaymentState('processing');
    // Simulate bank transfer detection after 5 seconds
    setTimeout(() => setPaymentState('success'), 5000);
  };

  const handleCryptoDetection = () => {
    setPaymentState('confirming');
  };

  if (paymentState === 'success') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-lg w-full"
        >
          <div className="relative bg-gradient-to-b from-zinc-900 to-black border border-zinc-800/50 rounded-3xl p-10 overflow-hidden">
            {/* Gradient orb background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-b from-emerald-500/10 to-transparent blur-3xl pointer-events-none" />

            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 rounded-full flex items-center justify-center border border-emerald-500/20"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-400" strokeWidth={2} />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl text-white mb-3 text-center tracking-tight"
              >
                Payment Successful
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="text-zinc-400 mb-10 text-center"
              >
                Your payment has been confirmed and processed
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 mb-8 backdrop-blur-sm"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Transaction ID</span>
                    <span className="text-white font-mono text-sm">TXN-2847291</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Amount Paid</span>
                    <span className="text-white text-lg">
                      ${totalAmount.toFixed(2)} {paymentDetails.currency}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Payment Method</span>
                    <span className="text-white capitalize">{paymentMethod}</span>
                  </div>
                  {paymentMethod === 'crypto' && (
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400 text-sm">Network</span>
                      <span className="text-white text-sm">{networkInfo[selectedToken]}</span>
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="space-y-3"
              >
                {paymentMethod === 'crypto' && (
                  <Button
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 h-12 rounded-xl transition-all duration-200"
                    onClick={() =>
                      window.open('https://etherscan.io/tx/0x1234567890abcdef', '_blank')
                    }
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Block Explorer
                  </Button>
                )}

                <Button
                  className="w-full bg-white hover:bg-zinc-100 text-black h-12 rounded-xl transition-all duration-200"
                  onClick={() => window.location.reload()}
                >
                  Return to {paymentDetails.merchantName}
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl blur-xl" />
              <div className="relative w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-white/10">
                <span className="text-black text-2xl tracking-tight">
                  {paymentDetails.merchantLogo}
                </span>
              </div>
            </div>
          </div>
          <h1 className="text-xl text-zinc-400 mb-2">{paymentDetails.merchantName}</h1>
          <p className="text-sm text-zinc-500 mb-6">{paymentDetails.description}</p>
          <div className="text-5xl tracking-tight mb-4">
            <span className="bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">
              ${paymentDetails.amount.toFixed(2)}
            </span>
          </div>
          <div className="inline-flex items-center px-4 py-2 bg-zinc-900/50 border border-zinc-800/50 rounded-full backdrop-blur-sm">
            <Shield className="w-4 h-4 mr-2 text-emerald-400" />
            <span className="text-zinc-400 text-sm">Secured by StellarPay</span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Main Payment Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-2"
          >
            <div className="relative bg-gradient-to-b from-zinc-900/50 to-zinc-950/50 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-sm overflow-hidden">
              {/* Subtle gradient orb */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-zinc-700/5 to-transparent blur-3xl pointer-events-none" />

              <div className="relative">
                {/* Payment Method Selection */}
                {paymentState === 'initial' && (
                  <>
                    <div className="mb-8">
                      <h3 className="text-sm uppercase tracking-wider text-zinc-500 mb-4">
                        Payment Method
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'card' as PaymentMethod, icon: CreditCard, label: 'Card' },
                          { id: 'bank' as PaymentMethod, icon: Building2, label: 'Bank' },
                          { id: 'crypto' as PaymentMethod, icon: Coins, label: 'Crypto' },
                        ].map((method) => (
                          <motion.button
                            key={method.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setPaymentMethod(method.id)}
                            className={`relative p-5 rounded-2xl border transition-all duration-300 ${
                              paymentMethod === method.id
                                ? 'border-white bg-white/5 shadow-lg shadow-white/5'
                                : 'border-zinc-800/50 hover:border-zinc-700 bg-zinc-900/30'
                            }`}
                          >
                            {paymentMethod === method.id && (
                              <motion.div
                                layoutId="activeMethod"
                                className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl"
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                              />
                            )}
                            <div className="relative">
                              <method.icon
                                className={`w-6 h-6 mx-auto mb-3 transition-colors ${
                                  paymentMethod === method.id ? 'text-white' : 'text-zinc-500'
                                }`}
                                strokeWidth={1.5}
                              />
                              <div
                                className={`text-sm transition-colors ${
                                  paymentMethod === method.id ? 'text-white' : 'text-zinc-400'
                                }`}
                              >
                                {method.label}
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {/* Card Payment */}
                      {paymentMethod === 'card' && (
                        <motion.div
                          key="card"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-5"
                        >
                          <div>
                            <label className="block text-sm text-zinc-400 mb-2.5 tracking-wide">
                              Card Number
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="1234 5678 9012 3456"
                                value={cardData.number}
                                onChange={(e) =>
                                  setCardData({ ...cardData, number: e.target.value })
                                }
                                className="w-full bg-black/40 border border-zinc-800/50 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:bg-black/60 transition-all duration-200"
                              />
                              <CreditCard
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600"
                                strokeWidth={1.5}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-zinc-400 mb-2.5 tracking-wide">
                                Expiry
                              </label>
                              <input
                                type="text"
                                placeholder="MM / YY"
                                value={cardData.expiry}
                                onChange={(e) =>
                                  setCardData({ ...cardData, expiry: e.target.value })
                                }
                                className="w-full bg-black/40 border border-zinc-800/50 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:bg-black/60 transition-all duration-200"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-zinc-400 mb-2.5 tracking-wide">
                                CVC
                              </label>
                              <input
                                type="text"
                                placeholder="123"
                                value={cardData.cvv}
                                onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                                className="w-full bg-black/40 border border-zinc-800/50 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:bg-black/60 transition-all duration-200"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm text-zinc-400 mb-2.5 tracking-wide">
                              Cardholder Name
                            </label>
                            <input
                              type="text"
                              placeholder="Name on card"
                              value={cardData.name}
                              onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                              className="w-full bg-black/40 border border-zinc-800/50 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:bg-black/60 transition-all duration-200"
                            />
                          </div>

                          <Button
                            onClick={handleCardPayment}
                            className="w-full bg-white hover:bg-zinc-100 text-black h-14 rounded-xl mt-8 text-base transition-all duration-200 shadow-lg shadow-white/10"
                          >
                            <Lock className="w-4 h-4 mr-2" strokeWidth={2} />
                            Pay ${totalAmount.toFixed(2)}
                          </Button>

                          <div className="flex items-center justify-center pt-2">
                            <div className="flex items-center text-xs text-zinc-500">
                              <Lock className="w-3 h-3 mr-1.5" />
                              Secured with 256-bit SSL encryption
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Bank Transfer */}
                      {paymentMethod === 'bank' && (
                        <motion.div
                          key="bank"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-5"
                        >
                          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-amber-400 text-sm tracking-wide">
                                Payment Reference
                              </span>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleCopy('SPR-2847291-XZ')}
                                className="text-xs bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center"
                              >
                                {copied ? (
                                  <>
                                    <Check className="w-3 h-3 mr-1.5" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 mr-1.5" />
                                    Copy
                                  </>
                                )}
                              </motion.button>
                            </div>
                            <div className="text-2xl font-mono text-white tracking-tight">
                              SPR-2847291-XZ
                            </div>
                          </div>

                          <div className="bg-black/40 border border-zinc-800/50 rounded-2xl p-5">
                            <div className="space-y-4 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-zinc-500">Bank Name</span>
                                <span className="text-white">Chase Bank</span>
                              </div>
                              <div className="h-px bg-zinc-800/50" />
                              <div className="flex justify-between items-center">
                                <span className="text-zinc-500">Account Number</span>
                                <span className="text-white font-mono">**** **** 4892</span>
                              </div>
                              <div className="h-px bg-zinc-800/50" />
                              <div className="flex justify-between items-center">
                                <span className="text-zinc-500">Routing Number</span>
                                <span className="text-white font-mono">021000021</span>
                              </div>
                              <div className="h-px bg-zinc-800/50" />
                              <div className="flex justify-between items-center">
                                <span className="text-zinc-500">Transfer Amount</span>
                                <span className="text-white text-base">
                                  ${totalAmount.toFixed(2)} {paymentDetails.currency}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/10 rounded-2xl p-5">
                            <div className="flex items-center text-blue-400 mb-3">
                              <Clock className="w-4 h-4 mr-2" />
                              <span className="text-sm">Time Remaining</span>
                            </div>
                            <div className="text-3xl text-white font-mono tracking-tight">
                              {formatTime(timeRemaining)}
                            </div>
                          </div>

                          <Button
                            onClick={handleBankPayment}
                            className="w-full bg-white hover:bg-zinc-100 text-black h-14 rounded-xl mt-6 text-base transition-all duration-200 shadow-lg shadow-white/10"
                          >
                            I&apos;ve Completed the Transfer
                          </Button>

                          <p className="text-xs text-zinc-500 text-center pt-2">
                            Include the reference code SPR-2847291-XZ in your transfer
                          </p>
                        </motion.div>
                      )}

                      {/* Crypto Payment */}
                      {paymentMethod === 'crypto' && (
                        <motion.div
                          key="crypto"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-5"
                        >
                          {/* Token Selector */}
                          <div>
                            <label className="block text-sm text-zinc-400 mb-2.5 tracking-wide">
                              Select Token
                            </label>
                            <div className="relative">
                              <select
                                value={selectedToken}
                                onChange={(e) => setSelectedToken(e.target.value as CryptoToken)}
                                className="w-full bg-black/40 border border-zinc-800/50 rounded-xl px-4 py-3.5 text-white appearance-none cursor-pointer focus:outline-none focus:border-zinc-600 focus:bg-black/60 transition-all duration-200"
                              >
                                <option value="BTC">Bitcoin (BTC)</option>
                                <option value="ETH">Ethereum (ETH)</option>
                                <option value="USDC">USD Coin (USDC)</option>
                              </select>
                              <ChevronDown
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none"
                                strokeWidth={1.5}
                              />
                            </div>
                            <p className="text-xs text-zinc-600 mt-2">
                              Network: {networkInfo[selectedToken]}
                            </p>
                          </div>

                          {/* QR Code */}
                          <div className="flex justify-center py-4">
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 blur-2xl rounded-3xl" />
                              <div className="relative bg-white p-6 rounded-2xl shadow-2xl shadow-white/10">
                                <QRCodeSVG
                                  value={cryptoAddresses[selectedToken]}
                                  size={220}
                                  level="H"
                                  className="rounded-lg"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Wallet Address */}
                          <div>
                            <label className="block text-sm text-zinc-400 mb-2.5 tracking-wide">
                              Wallet Address
                            </label>
                            <div className="flex items-center bg-black/40 border border-zinc-800/50 rounded-xl px-4 py-3.5 group hover:border-zinc-700 transition-all duration-200">
                              <span className="text-white font-mono text-sm flex-1 truncate">
                                {cryptoAddresses[selectedToken]}
                              </span>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleCopy(cryptoAddresses[selectedToken])}
                                className="ml-3 text-zinc-400 hover:text-white transition-colors"
                              >
                                {copied ? (
                                  <Check className="w-5 h-5" strokeWidth={2} />
                                ) : (
                                  <Copy className="w-5 h-5" strokeWidth={1.5} />
                                )}
                              </motion.button>
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/10 rounded-2xl p-5">
                            <div className="text-zinc-400 text-sm mb-2 tracking-wide">
                              Send Exactly
                            </div>
                            <div className="text-3xl text-white tracking-tight mb-1">
                              {tokenAmounts[selectedToken]} {selectedToken}
                            </div>
                            <div className="text-zinc-500 text-sm">
                              ≈ ${totalAmount.toFixed(2)} {paymentDetails.currency}
                            </div>
                          </div>

                          <Button
                            onClick={handleCryptoDetection}
                            className="w-full bg-white hover:bg-zinc-100 text-black h-14 rounded-xl mt-6 text-base transition-all duration-200 shadow-lg shadow-white/10"
                          >
                            I&apos;ve Sent the Payment
                          </Button>

                          <p className="text-xs text-zinc-500 text-center pt-2">
                            Send the exact amount to ensure successful processing
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}

                {/* Processing State */}
                {paymentState === 'processing' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <div className="relative w-16 h-16 mx-auto mb-6">
                      <Loader2 className="w-16 h-16 animate-spin text-white" strokeWidth={1.5} />
                      <div className="absolute inset-0 bg-white/5 blur-xl rounded-full" />
                    </div>
                    <h3 className="text-2xl mb-3 tracking-tight">
                      {paymentMethod === 'bank' ? 'Awaiting Transfer' : 'Processing Payment'}
                    </h3>
                    <p className="text-zinc-400">
                      {paymentMethod === 'bank'
                        ? 'Monitoring for your bank transfer...'
                        : 'Confirming your payment details...'}
                    </p>
                  </motion.div>
                )}

                {/* Crypto Confirmation Progress */}
                {paymentState === 'confirming' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12">
                    <div className="text-center mb-10">
                      <div className="relative w-16 h-16 mx-auto mb-6">
                        <Loader2 className="w-16 h-16 animate-spin text-white" strokeWidth={1.5} />
                        <div className="absolute inset-0 bg-white/5 blur-xl rounded-full" />
                      </div>
                      <h3 className="text-2xl mb-3 tracking-tight">Confirming Transaction</h3>
                      <p className="text-zinc-400">Waiting for blockchain confirmations...</p>
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: 'Transaction Broadcast', step: 1 },
                        { label: 'First Confirmation', step: 2 },
                        { label: 'Payment Confirmed', step: 3 },
                      ].map((item, index) => (
                        <motion.div
                          key={item.step}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center"
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                              confirmations >= item.step
                                ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30'
                                : 'bg-zinc-900/50 border border-zinc-800/50'
                            }`}
                          >
                            {confirmations >= item.step ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" strokeWidth={2} />
                            ) : (
                              <div className="w-2 h-2 bg-zinc-700 rounded-full" />
                            )}
                          </div>
                          <div className="ml-4 flex-1">
                            <div
                              className={`transition-colors ${
                                confirmations >= item.step ? 'text-white' : 'text-zinc-500'
                              }`}
                            >
                              {item.label}
                            </div>
                            {confirmations === item.step && (
                              <div className="text-sm text-zinc-500 mt-0.5">In progress...</div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Summary Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-1"
          >
            <div className="sticky top-8">
              <div className="relative bg-gradient-to-b from-zinc-900/50 to-zinc-950/50 border border-zinc-800/50 rounded-3xl p-6 backdrop-blur-sm overflow-hidden">
                {/* Subtle gradient */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-zinc-800/10 to-transparent pointer-events-none" />

                <div className="relative">
                  <h3 className="text-sm uppercase tracking-wider text-zinc-500 mb-6">
                    Order Summary
                  </h3>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-start text-sm">
                      <span className="text-zinc-400">Product</span>
                      <span className="text-white text-right max-w-[60%]">
                        {paymentDetails.description}
                      </span>
                    </div>
                    <div className="h-px bg-zinc-800/50" />
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Subtotal</span>
                      <span className="text-white">${paymentDetails.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Processing Fee</span>
                      <span className="text-white">${processingFee.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-zinc-800/50" />
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-white">Total</span>
                      <span className="text-white text-2xl tracking-tight">
                        ${totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-500/5 to-green-500/5 border border-emerald-500/10 rounded-2xl p-4 mb-6">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center mr-3 flex-shrink-0">
                        <Shield className="w-4 h-4 text-emerald-400" strokeWidth={2} />
                      </div>
                      <div>
                        <div className="text-sm text-white mb-1">Secure Payment</div>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                          Your information is protected with enterprise-grade encryption
                        </p>
                      </div>
                    </div>
                  </div>

                  <button className="text-sm text-zinc-400 hover:text-white transition-colors w-full text-center py-2">
                    Need help? <span className="underline underline-offset-2">Contact support</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
