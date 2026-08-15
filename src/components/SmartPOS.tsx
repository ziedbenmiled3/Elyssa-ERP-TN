import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Calculator, 
  Package, 
  Coins, 
  AlertTriangle, 
  History, 
  RefreshCw, 
  CheckCircle, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  QrCode, 
  FileText, 
  ArrowRight, 
  User, 
  Check, 
  TrendingUp, 
  Search, 
  Lock, 
  Sliders, 
  Play, 
  Settings,
  XOctagon,
  Download,
  Percent,
  Printer,
  ChevronRight,
  Truck,
  Warehouse,
  MapPin,
  ShoppingCart
} from 'lucide-react';
import { Product, Client, StockMovement, BankTransaction, TransactionMethod, Invoice } from '../types';
import { db } from '../utils/firebase';
import { doc, setDoc } from 'firebase/firestore';

// Let's define the Tunisian currency denominations type
export interface Denomination {
  value: number; // in TND, e.g. 50, 20, 10, 5 (Notes) and 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01 (Coins)
  label: string; // e.g. "50 DT", "20 DT", "5 DT (Pièce)", "0.500 DT"
  isNote: boolean;
  count: number; // stock in drawer
  threshold: number; // minimum safe count
}

export interface POSSession {
  id: string;
  openedAt: string;
  closedAt: string | null;
  openedBy: string;
  startingDrawer: Denomination[];
  currentDrawer: Denomination[];
  theoreticalCash: number;
  realCash: number | null;
  discrepancy: number | null;
  status: 'Open' | 'Closed';
}

export interface POSPayment {
  method: 'cash' | 'flouci' | 'card' | 'cheque' | 'credit';
  amount: number;
  details?: {
    chequeNumber?: string;
    bankName?: string;
    authCode?: string;
    referenceCode?: string;
    clientId?: string;
  };
}

export interface POSTransaction {
  id: string;
  ticketNumber: string;
  sessionId: string;
  date: string;
  items: {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    total: number;
  }[];
  subtotal: number;
  tvaAmount: number;
  totalTTC: number;
  payments: POSPayment[];
  clientId: string | null;
  clientName: string | null;
  status: 'Validated' | 'Cancelled';
  cancelledByAvoir?: string; // Links to the cancellation avoir
  originalTicketNumber?: string; // If this IS an avoir, links to the original ticket
  needsDelivery?: boolean;
  warehouseLocation?: string;
  deliveryAddress?: string;
  operator: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

interface SmartPOSProps {
  products: Product[];
  suppliers: any[];
  stockMovements: StockMovement[];
  onUpdateProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  onUpdateStockMovements: React.Dispatch<React.SetStateAction<StockMovement[]>>;
  clients: Client[];
  onUpdateClients: React.Dispatch<React.SetStateAction<Client[]>>;
  invoices: any[];
  onUpdateInvoices: React.Dispatch<React.SetStateAction<any[]>>;
  bankAccounts: any[];
  bankTransactions: BankTransaction[];
  onUpdateBankAccounts: React.Dispatch<React.SetStateAction<any[]>>;
  onUpdateBankTransactions: React.Dispatch<React.SetStateAction<BankTransaction[]>>;
  currentUser: any;
  adminSettings: any;
  collaborators?: any[];
  tenantId?: string;
}

// Complete list of Tunisian currency denominations
const DEFAULT_TUNISIAN_DENOMINATIONS: Omit<Denomination, 'count' | 'threshold'>[] = [
  // Billets (Banknotes)
  { value: 50.0, label: '50 DT (Billet)', isNote: true },
  { value: 20.0, label: '20 DT (Billet)', isNote: true },
  { value: 10.0, label: '10 DT (Billet)', isNote: true },
  { value: 5.0, label: '5 DT (Billet)', isNote: true },
  // Pièces (Coins)
  { value: 5.0, label: '5 DT (Pièce)', isNote: false },
  { value: 2.0, label: '2 DT (Pièce)', isNote: false },
  { value: 1.0, label: '1 DT (Pièce)', isNote: false },
  { value: 0.5, label: '0.500 DT (Pièce)', isNote: false },
  { value: 0.2, label: '0.200 DT (Pièce)', isNote: false },
  { value: 0.1, label: '0.100 DT (Pièce)', isNote: false },
  { value: 0.05, label: '0.050 DT (Pièce)', isNote: false },
  { value: 0.02, label: '0.020 DT (Pièce)', isNote: false },
  { value: 0.01, label: '0.010 DT (Pièce)', isNote: false },
];

export default function SmartPOS({
  products,
  stockMovements,
  onUpdateProducts,
  onUpdateStockMovements,
  clients,
  onUpdateClients,
  invoices = [],
  onUpdateInvoices,
  bankAccounts,
  bankTransactions,
  onUpdateBankAccounts,
  onUpdateBankTransactions,
  currentUser,
  adminSettings,
  collaborators = [],
  tenantId
}: SmartPOSProps) {
  // Tabs for sub-sections
  const [posTab, setPosTab] = useState<'register' | 'history' | 'inventory' | 'sessions' | 'audit'>('register');

  // PIN Verification State
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  
  // Find if the current user has an entry in collaborators with a PIN
  const userCollab = useMemo(() => {
    if (!collaborators || !currentUser) return null;
    return collaborators.find(c => c.email.toLowerCase() === currentUser.email.toLowerCase());
  }, [collaborators, currentUser]);

  const requiredPin = useMemo(() => {
    // Only require PIN code for non-managers who are assigned the caisse module and have a pinCode set
    if (userCollab && userCollab.role !== 'Manager' && userCollab.pinCode) {
      return userCollab.pinCode;
    }
    return null;
  }, [userCollab]);

  const [isUnlocked, setIsUnlocked] = useState(() => {
    // If there is no PIN required for this user, it's auto-unlocked
    if (currentUser?.role === 'Manager' || currentUser?.role === 'SuperAdmin') return true;
    
    const savedPin = localStorage.getItem(`elyssa_pos_unlocked_${currentUser?.id || 'guest'}`);
    return savedPin === 'true';
  });

  // Load Session and Local Drawer inventory
  const [activeSession, setActiveSession] = useState<POSSession | null>(() => {
    const saved = localStorage.getItem('elyssa_pos_active_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [sessionHistory, setSessionHistory] = useState<POSSession[]>(() => {
    const saved = localStorage.getItem('elyssa_pos_session_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<POSTransaction[]>(() => {
    const saved = localStorage.getItem('elyssa_pos_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('elyssa_pos_audit_logs');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'aud_1',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        action: 'INITIALISATION',
        user: currentUser?.name || 'Administrateur',
        details: 'Module de Caisse Intelligente initialisé avec succès.',
        severity: 'info'
      }
    ];
  });

  // Automatically check PIN when pinInput reaches 4 digits
  useEffect(() => {
    if (requiredPin && pinInput.length === 4) {
      if (pinInput === requiredPin) {
        setIsUnlocked(true);
        localStorage.setItem(`elyssa_pos_unlocked_${currentUser?.id || 'guest'}`, 'true');
        setPinError('');
        
        // Add security audit log
        const log: AuditLog = {
          id: `aud_${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          action: 'DÉVERROUILLAGE_PIN',
          user: currentUser?.name || 'Collaborateur',
          details: 'Connexion sécurisée au terminal de caisse POS via authentification par Code PIN.',
          severity: 'info'
        };
        setAuditLogs(prev => {
          const updated = [log, ...prev];
          localStorage.setItem('elyssa_pos_audit_logs', JSON.stringify(updated));
          return updated;
        });
      } else {
        setPinError('Code PIN de caisse invalide. Veuillez réessayer.');
        setPinInput('');
        
        // Add security warning log
        const log: AuditLog = {
          id: `aud_${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          action: 'ÉCHEC_DÉVERROUILLAGE',
          user: currentUser?.name || 'Collaborateur',
          details: 'Tentative infructueuse de connexion au terminal de caisse (PIN incorrect).',
          severity: 'warning'
        };
        setAuditLogs(prev => {
          const updated = [log, ...prev];
          localStorage.setItem('elyssa_pos_audit_logs', JSON.stringify(updated));
          return updated;
        });
      }
    }
  }, [pinInput, requiredPin, currentUser]);

  // State to handle custom threshold configurations for cash denominations
  const [denominationThresholds, setDenominationThresholds] = useState<Record<number, number>>(() => {
    const saved = localStorage.getItem('elyssa_pos_denomination_thresholds');
    if (saved) return JSON.parse(saved);
    // Defaults: minimum 5 for big notes, minimum 15 for critical return coins like 1, 2, 0.5 TND
    return {
      50: 3,
      20: 5,
      10: 8,
      5: 10,
      2: 15,
      1: 20,
      0.5: 20,
      0.2: 25,
      0.1: 25,
      0.05: 15,
      0.02: 10,
      0.01: 5
    };
  });

  // Active drawer denomination counts for Session Initialization
  const [initDrawerCounts, setInitDrawerCounts] = useState<Record<number, number>>(() => {
    // default starting amounts
    return {
      50: 2,  // 100 DT
      20: 5,  // 100 DT
      10: 10, // 100 DT
      5: 10,  // 50 DT (billet)
      2: 15,  // 30 DT (pièce)
      1: 25,  // 25 DT
      0.5: 30, // 15 DT
      0.2: 40, // 8 DT
      0.1: 50, // 5 DT
      0.05: 40, // 2 DT
      0.02: 50, // 1 DT
      0.01: 50  // 0.5 DT
    };
  });

  // Save states helper
  const savePOSStates = (
    sess: POSSession | null, 
    hist: POSSession[], 
    txs: POSTransaction[], 
    logs: AuditLog[]
  ) => {
    if (sess) {
      localStorage.setItem('elyssa_pos_active_session', JSON.stringify(sess));
    } else {
      localStorage.removeItem('elyssa_pos_active_session');
    }
    localStorage.setItem('elyssa_pos_session_history', JSON.stringify(hist));
    localStorage.setItem('elyssa_pos_transactions', JSON.stringify(txs));
    localStorage.setItem('elyssa_pos_audit_logs', JSON.stringify(logs));
    
    setActiveSession(sess);
    setSessionHistory(hist);
    setTransactions(txs);
    setAuditLogs(logs);
  };

  const addAuditLog = (action: string, details: string, severity: 'info' | 'warning' | 'critical' = 'info') => {
    const newLog: AuditLog = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      action,
      user: currentUser?.name || 'Caissier',
      details,
      severity
    };
    const updated = [newLog, ...auditLogs];
    setAuditLogs(updated);
    localStorage.setItem('elyssa_pos_audit_logs', JSON.stringify(updated));
  };

  // Cashier Cart state
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [barcodeInput, setBarcodeInput] = useState('');
  
  // Selected Client
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Payments State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [payments, setPayments] = useState<POSPayment[]>([]);
  const [activePaymentMethod, setActivePaymentMethod] = useState<'cash' | 'flouci' | 'card' | 'cheque' | 'credit'>('cash');
  
  // Received Cash state for the interactive Cash change calculator
  const [receivedCashCounts, setReceivedCashCounts] = useState<Record<number, number>>({
    50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0, 0.5: 0, 0.2: 0, 0.1: 0, 0.05: 0, 0.02: 0, 0.01: 0
  });
  const [customCashReceived, setCustomCashReceived] = useState<string>('');

  // Form states for non-cash payment details
  const [flouciRef, setFlouciRef] = useState('');
  const [cardAuth, setCardAuth] = useState('');
  const [chequeNum, setChequeNum] = useState('');
  const [chequeBank, setChequeBank] = useState('');

  // Session Closing Modal States
  const [isCloseSessionOpen, setIsCloseSessionOpen] = useState(false);
  const [physicalCashCounts, setPhysicalCashCounts] = useState<Record<number, number>>({
    50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0, 0.5: 0, 0.2: 0, 0.1: 0, 0.05: 0, 0.02: 0, 0.01: 0
  });

  // Alert State for successful validation
  const [validationSuccess, setValidationSuccess] = useState<POSTransaction | null>(null);

  // Quick Client Creation States
  const [showQuickClientForm, setShowQuickClientForm] = useState(false);
  const [showSuccessQuickClientForm, setShowSuccessQuickClientForm] = useState(false);
  const [quickClientName, setQuickClientName] = useState('');
  const [quickClientEmail, setQuickClientEmail] = useState('');
  const [quickClientPhone, setQuickClientPhone] = useState('');
  const [quickClientAddress, setQuickClientAddress] = useState('');
  const [quickClientMF, setQuickClientMF] = useState('');
  const [quickClientCategory, setQuickClientCategory] = useState<'Local' | 'Export'>('Local');

  // Preview tab state in Success Modal
  const [activePreviewTab, setActivePreviewTab] = useState<'ticket' | 'invoice'>('ticket');

  // Delivery & Carrier Dispatch Interconnection State
  const [needsDelivery, setNeedsDelivery] = useState(false);
  const [warehouseLocation, setWarehouseLocation] = useState('Magasin Principal & Showroom Tunis');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Auto pre-fill client address if selected
  useEffect(() => {
    if (selectedClient?.address && !deliveryAddress) {
      setDeliveryAddress(selectedClient.address);
    }
  }, [selectedClient]);

  // Categories list
  const categories = useMemo(() => {
    const cats = products.map(p => p.category);
    return ['All', ...Array.from(new Set(cats))];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const isFinishedGood = p.type !== 'MATIERE_PREMIERE' && p.category !== 'Matières Premières';
      return matchesSearch && matchesCategory && isFinishedGood;
    });
  }, [products, searchQuery, selectedCategory]);

  // Totals calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.unitPrice * item.quantity, 0);
  }, [cart]);

  const cartTva = useMemo(() => {
    // 19% standard Tunisian VAT
    return cartSubtotal * 0.19;
  }, [cartSubtotal]);

  const cartTotalTTC = useMemo(() => {
    return cartSubtotal + cartTva;
  }, [cartSubtotal, cartTva]);

  // Check how much is already paid in current transaction
  const paidTotal = useMemo(() => {
    return payments.reduce((acc, p) => acc + p.amount, 0);
  }, [payments]);

  const remainingToPay = useMemo(() => {
    return Math.max(0, cartTotalTTC - paidTotal);
  }, [cartTotalTTC, paidTotal]);

  // Compute total cash received by counts
  const receivedCashTotal = useMemo(() => {
    if (customCashReceived && parseFloat(customCashReceived) > 0) {
      return parseFloat(customCashReceived);
    }
    return Object.entries(receivedCashCounts).reduce((acc, [valStr, count]) => {
      return acc + (parseFloat(valStr) * Number(count));
    }, 0);
  }, [receivedCashCounts, customCashReceived]);

  // Change due calculations
  const cashChangeDue = useMemo(() => {
    if (activePaymentMethod === 'cash') {
      const cashNeeded = remainingToPay;
      const rawChange = Math.max(0, receivedCashTotal - cashNeeded);
      // In Tunisia, physical cash transactions round to the nearest 10 millimes (0.010 DT = 2 decimal places)
      return Math.round(rawChange * 100) / 100;
    }
    return 0;
  }, [receivedCashTotal, remainingToPay, activePaymentMethod]);


  // ==========================================
  // 2. GREEDY OPTIMAL CASH-MAKING ALGORITHM
  // ==========================================
  const changeDistribution = useMemo(() => {
    if (cashChangeDue <= 0 || !activeSession) return { possible: true, list: [] as { denomination: Denomination; count: number }[], remainder: 0 };

    // Format target change to integer millimes to avoid floating point issues (1 TND = 1000 millimes)
    let changeInMillimes = Math.round(cashChangeDue * 1000);
    
    // Sort active drawer denominations descending
    const sortedDrawer = [...activeSession.currentDrawer].sort((a, b) => b.value - a.value);
    
    const suggestedReturn: { denomination: Denomination; count: number }[] = [];
    
    for (const denom of sortedDrawer) {
      const denomInMillimes = Math.round(denom.value * 1000);
      if (denomInMillimes > changeInMillimes) continue;

      // How many units of this denomination could we use?
      const maxUnitsNeeded = Math.floor(changeInMillimes / denomInMillimes);
      // How many are actually available in the physical cash drawer inventory?
      const unitsToUse = Math.min(maxUnitsNeeded, denom.count);

      if (unitsToUse > 0) {
        suggestedReturn.push({
          denomination: denom,
          count: unitsToUse
        });
        changeInMillimes -= (unitsToUse * denomInMillimes);
      }
    }

    const possible = changeInMillimes === 0;

    return {
      possible,
      list: suggestedReturn,
      remainder: changeInMillimes / 1000
    };
  }, [cashChangeDue, activeSession]);


  // Handle interactive clicking on received cash notes/coins
  const handleAddReceivedCash = (value: number) => {
    setCustomCashReceived(''); // Reset text override if clicking buttons
    setReceivedCashCounts(prev => ({
      ...prev,
      [value]: (prev[value] || 0) + 1
    }));
  };

  const handleClearReceivedCash = () => {
    setReceivedCashCounts({
      50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0, 0.5: 0, 0.2: 0, 0.1: 0, 0.05: 0, 0.02: 0, 0.01: 0
    });
    setCustomCashReceived('');
  };

  // Add Item to cart
  const handleAddToCart = (product: Product) => {
    if (product.stockLevel <= 0) {
      alert(`⚠️ Attention: Le produit "${product.name}" est en rupture de stock ! (Stock: 0)`);
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  // Barcode quick add scanner simulation
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    const found = products.find(
      p => p.sku.toLowerCase() === barcodeInput.trim().toLowerCase() ||
           p.name.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (found) {
      handleAddToCart(found);
      setBarcodeInput('');
    } else {
      alert(`❌ Code-barres ou produit "${barcodeInput}" introuvable.`);
    }
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQ = item.quantity + delta;
          return newQ > 0 ? { ...item, quantity: newQ } : null;
        }
        return item;
      }).filter(Boolean) as any;
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Handle Session Opening
  const handleOpenSession = () => {
    const openingDrawer: Denomination[] = DEFAULT_TUNISIAN_DENOMINATIONS.map(d => ({
      ...d,
      count: initDrawerCounts[d.value] || 0,
      threshold: denominationThresholds[d.value] || 10
    }));

    const totalOpeningCash = openingDrawer.reduce((acc, d) => acc + (d.value * d.count), 0);

    const newSession: POSSession = {
      id: `sess_${Date.now()}`,
      openedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      closedAt: null,
      openedBy: currentUser?.name || 'Caissier',
      startingDrawer: openingDrawer,
      currentDrawer: JSON.parse(JSON.stringify(openingDrawer)), // clone
      theoreticalCash: totalOpeningCash,
      realCash: null,
      discrepancy: null,
      status: 'Open'
    };

    savePOSStates(newSession, sessionHistory, transactions, auditLogs);
    addAuditLog('OUVERTURE_SESSION', `Ouverture de caisse avec un fond initial de ${totalOpeningCash.toFixed(3)} DT.`, 'info');
  };

  // Register Payment
  const handleAddPaymentSegment = () => {
    let amountToRegister = 0;
    let paymentDetails: any = {};

    if (activePaymentMethod === 'cash') {
      if (receivedCashTotal < remainingToPay) {
        amountToRegister = receivedCashTotal;
      } else {
        amountToRegister = remainingToPay;
      }
      
      if (amountToRegister <= 0) {
        alert("Saisissez d'abord un montant ou des coupures reçues.");
        return;
      }

      // Check if we can make change if they gave more cash than total
      if (receivedCashTotal > remainingToPay) {
        if (!changeDistribution.possible) {
          alert("⚠️ Impossible de valider : Stock de monnaie insuffisant dans le tiroir-caisse pour rendre la monnaie exacte !");
          return;
        }
      }

      paymentDetails = {
        receivedCashCounts: { ...receivedCashCounts }
      };

    } else if (activePaymentMethod === 'flouci') {
      amountToRegister = remainingToPay;
      if (!flouciRef.trim()) {
        alert("Veuillez saisir le code de référence Flouci.");
        return;
      }
      paymentDetails = { referenceCode: flouciRef };
      
    } else if (activePaymentMethod === 'card') {
      amountToRegister = remainingToPay;
      if (!cardAuth.trim()) {
        alert("Veuillez saisir le code d'autorisation du terminal TPE.");
        return;
      }
      paymentDetails = { authCode: cardAuth };

    } else if (activePaymentMethod === 'cheque') {
      amountToRegister = remainingToPay;
      if (!chequeNum.trim() || !chequeBank.trim()) {
        alert("Numéro de chèque et Banque émettrice obligatoires.");
        return;
      }
      paymentDetails = { chequeNumber: chequeNum, bankName: chequeBank };

    } else if (activePaymentMethod === 'credit') {
      amountToRegister = remainingToPay;
      if (!selectedClient) {
        alert("Sélectionnez obligatoirement un Client de la fiche CRM pour lui affecter ce crédit.");
        return;
      }
      paymentDetails = { clientId: selectedClient.id };
    }

    const newPayment: POSPayment = {
      method: activePaymentMethod,
      amount: amountToRegister,
      details: paymentDetails
    };

    setPayments(prev => [...prev, newPayment]);
    
    // Reset specific input states
    setFlouciRef('');
    setCardAuth('');
    setChequeNum('');
    setChequeBank('');
    handleClearReceivedCash();
  };

  const handleRemovePaymentSegment = (index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  };


  // ========================================================
  // 5. & 6. FINALIZING THE TRANSACTION & BROADCASTING EVENTS
  // ========================================================
  const handleValidateSale = async () => {
    if (!activeSession) return;
    if (remainingToPay > 0) {
      alert(`Règlement incomplet. Il reste encore ${remainingToPay.toFixed(3)} DT à solder.`);
      return;
    }

    const ticketId = `TK-${Date.now().toString().slice(-6)}`;
    
    // Create new POS transaction record
    const newTx: POSTransaction = {
      id: `tx_${Date.now()}`,
      ticketNumber: ticketId,
      sessionId: activeSession.id,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        unitPrice: item.product.unitPrice,
        quantity: item.quantity,
        total: item.product.unitPrice * item.quantity
      })),
      subtotal: cartSubtotal,
      tvaAmount: cartTva,
      totalTTC: cartTotalTTC,
      payments: [...payments],
      clientId: selectedClient ? selectedClient.id : null,
      clientName: selectedClient ? selectedClient.name : null,
      needsDelivery: needsDelivery,
      warehouseLocation: warehouseLocation,
      deliveryAddress: deliveryAddress,
      status: 'Validated',
      operator: currentUser?.name || 'Caissier'
    };

    // Update Drawer Cash Inventory
    let updatedDrawer = JSON.parse(JSON.stringify(activeSession.currentDrawer)) as Denomination[];
    let extraCashAddedToDrawer = 0;

    // 1. Process cash segment details
    const cashSegments = payments.filter(p => p.method === 'cash');
    cashSegments.forEach(seg => {
      extraCashAddedToDrawer += seg.amount; // total net cash increase
      
      // If cashier tracked exact counts, increment drawer counts
      const counts = (seg.details as any)?.receivedCashCounts || {};
      Object.entries(counts).forEach(([valStr, count]) => {
        const value = parseFloat(valStr);
        const match = updatedDrawer.find(d => Math.abs(d.value - value) < 0.001);
        if (match) {
          match.count += (count as number);
        }
      });
    });

    // 2. Subtract change from greedy coin stock distribution
    if (cashChangeDue > 0 && changeDistribution.possible) {
      changeDistribution.list.forEach(returnItem => {
        const match = updatedDrawer.find(d => Math.abs(d.value - returnItem.denomination.value) < 0.001);
        if (match) {
          match.count -= returnItem.count;
          if (match.count < 0) match.count = 0; // Guard
        }
      });
    }

    const newTheoreticalCash = activeSession.theoreticalCash + extraCashAddedToDrawer - cashChangeDue;

    const updatedSession: POSSession = {
      ...activeSession,
      currentDrawer: updatedDrawer,
      theoreticalCash: newTheoreticalCash
    };

    // -------------------------------------------------------------
    // INTERCONNECTIONS CONFORMITE ET COMPTABILITE (6)
    // -------------------------------------------------------------

    // A. STOCK MANAGER DECREMENT & STOCKMOVEMENT
    const updatedProducts = products.map(p => {
      const boughtItem = cart.find(item => item.product.id === p.id);
      if (boughtItem) {
        return {
          ...p,
          stockLevel: Math.max(0, p.stockLevel - boughtItem.quantity)
        };
      }
      return p;
    });
    onUpdateProducts(updatedProducts);

    const newStockMovements: StockMovement[] = cart.map((item, idx) => ({
      id: `mov_pos_${Date.now()}_${idx}`,
      productId: item.product.id,
      productName: item.product.name,
      type: 'Out' as const,
      quantity: item.quantity,
      date: new Date().toISOString().split('T')[0],
      reference: `Vente POS Ticket ${ticketId}`,
      operator: currentUser?.name || 'Caisse Intelligente'
    }));
    onUpdateStockMovements(prev => [...newStockMovements, ...prev]);

    // B. CLIENT MANAGER CRM UPDATE
    if (selectedClient) {
      const isClientCreditPayment = payments.some(p => p.method === 'credit');
      const creditAmount = payments.filter(p => p.method === 'credit').reduce((sum, p) => sum + p.amount, 0);

      const updatedClients = clients.map(c => {
        if (c.id === selectedClient.id) {
          // Append automatic commercial engagement to customer CRM log
          const newEngagement = {
            id: `eng_pos_${Date.now()}`,
            type: 'Note' as const,
            title: `Achat POS - Ticket ${ticketId}`,
            description: `Achat au comptoir d'un montant de ${cartTotalTTC.toFixed(3)} DT (TVA comprise). Modes : ${payments.map(p => p.method.toUpperCase()).join(', ')}.${isClientCreditPayment ? ` Montant enregistré à crédit : ${creditAmount.toFixed(3)} DT.` : ''}`,
            dueDate: new Date().toISOString().split('T')[0],
            status: 'Met' as const
          };
          return {
            ...c,
            revenuePotential: c.revenuePotential + cartTotalTTC,
            engagements: [newEngagement, ...(c.engagements || [])]
          };
        }
        return c;
      });
      onUpdateClients(updatedClients as any);
    }

    // C. FINANCE MANAGER DOUBLE-ENTRY ACCOUNTING TRANSACTIONS
    const accountingEntries: BankTransaction[] = [];
    payments.forEach((payment, idx) => {
      let journalAccount = 'Caisse Centrale Espèces';
      let targetBankAccountId = 'bank_caisse_cash';

      if (payment.method === 'card') {
        journalAccount = 'Compte Courant (TPE)';
        targetBankAccountId = 'bank_1'; // Standard bank
      } else if (payment.method === 'flouci') {
        journalAccount = 'Portefeuille Flouci Pay';
        targetBankAccountId = 'bank_2'; // Secondary
      } else if (payment.method === 'cheque') {
        journalAccount = 'Chèques à Encaisser';
        targetBankAccountId = 'bank_1';
      }


      let method: TransactionMethod = 'Especes';
      if (payment.method === 'cheque') method = 'Cheque';
      else if (payment.method === 'card' || payment.method === 'flouci' || payment.method === 'credit') method = 'Autre';

      accountingEntries.push({
        id: `tx_fin_pos_${Date.now()}_${idx}`,
        accountId: targetBankAccountId,
        accountName: journalAccount,
        date: new Date().toISOString().split('T')[0],
        description: `Vente au comptoir POS - Ticket ${ticketId} [${payment.method.toUpperCase()}]`,
        type: 'In', // Income flow
        amount: payment.amount,
        method: method,
        reference: ticketId,
        beneficiaryOrIssuer: selectedClient ? selectedClient.name : 'Client Anonyme Comptoir',
        category: 'Vente',
        status: 'Cleared',
      });
    });

    onUpdateBankTransactions([...accountingEntries, ...bankTransactions]);

    // Generate Invoice/BL for multi-channel sales and logistics synchronization
    const defaultWarehouse = warehouseLocation.trim() || 'Magasin Principal & Showroom Tunis';
    const finalDeliveryAddr = needsDelivery ? (deliveryAddress.trim() || selectedClient?.address || 'Adresse à préciser') : '';

    const newInvoice: Invoice = {
      id: `FAC-${ticketId}`,
      clientId: selectedClient ? selectedClient.id : 'CLI-POS-ANON',
      clientName: selectedClient ? selectedClient.name : 'Client Comptoir POS',
      invoiceNumber: `FAC-${ticketId}`,
      amountHT: cartSubtotal,
      vatRate: 19,
      vatAmount: cartTva,
      withholdingTaxRate: 0,
      withholdingAmount: 0,
      amountNetToPay: cartTotalTTC,
      amountTTC: cartTotalTTC,
      status: 'Paid',
      sales_channel: 'pos',
      delivery_status: needsDelivery ? 'en_attente' : 'non_requis',
      warehouse_location: defaultWarehouse,
      delivery_address: finalDeliveryAddr,
      issuedDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      collectedAmount: cartTotalTTC,
      recouvrementSteps: [],
      withholdingCertificateReceived: false
    };

    if (onUpdateInvoices) {
      onUpdateInvoices(prev => [newInvoice, ...prev]);
    }

    if (tenantId) {
      try {
        await setDoc(doc(db, 'company_erp_data', tenantId, 'invoices', newInvoice.id), newInvoice, { merge: true });
      } catch (err) {
        console.warn('Error saving POS invoice to Firestore:', err);
      }
    }

    // Save transaction and session
    const updatedTxs = [newTx, ...transactions];
    savePOSStates(updatedSession, sessionHistory, updatedTxs, auditLogs);
    
    // Add success audit
    addAuditLog(
      'VALIDATION_VENTE', 
      `Vente ${ticketId} validée. Total: ${cartTotalTTC.toFixed(3)} DT. Stock décrémenté, écritures financières publiées.`, 
      'info'
    );

    // Trigger success receipts view
    setValidationSuccess(newTx);
    
    // Reset Cart and Checkout states
    setCart([]);
    setPayments([]);
    setSelectedClient(null);
    setNeedsDelivery(false);
    setDeliveryAddress('');
    setIsCheckoutOpen(false);
    setActivePreviewTab('ticket');
    setShowSuccessQuickClientForm(false);
  };

  const handleCreateQuickClient = () => {
    if (!quickClientName.trim()) {
      alert('Veuillez saisir le nom du client.');
      return;
    }

    const newClient: Client = {
      id: `client_pos_${Date.now()}`,
      name: quickClientName.trim(),
      email: quickClientEmail.trim() || `${quickClientName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      phone: quickClientPhone.trim() || '216000000',
      address: quickClientAddress.trim() || 'Tunisie',
      category: quickClientCategory,
      sector: 'Commerce de détail',
      revenuePotential: 0,
      engagements: [],
      status: 'Active',
      notes: quickClientMF.trim() ? `MF: ${quickClientMF.trim()}` : '',
      createdDate: new Date().toISOString().split('T')[0]
    };

    onUpdateClients(prev => [...prev, newClient]);
    setSelectedClient(newClient);
    
    // Clear states and close form
    setQuickClientName('');
    setQuickClientEmail('');
    setQuickClientPhone('');
    setQuickClientAddress('');
    setQuickClientMF('');
    setQuickClientCategory('Local');
    setShowQuickClientForm(false);
    
    addAuditLog(
      'CREATION_CLIENT',
      `Nouveau client créé depuis la caisse : ${newClient.name}`,
      'info'
    );
  };

  const handleAssignClientToSuccessTx = (client: Client) => {
    if (!validationSuccess) return;

    const ticketId = validationSuccess.ticketNumber;

    // Create updated transaction
    const updatedTx: POSTransaction = {
      ...validationSuccess,
      clientId: client.id,
      clientName: client.name
    };

    // 1. Update state
    setValidationSuccess(updatedTx);

    // 2. Update transactions array
    const updatedTxs = transactions.map(t => t.id === validationSuccess.id ? updatedTx : t);
    setTransactions(updatedTxs);
    savePOSStates(activeSession, sessionHistory, updatedTxs, auditLogs);

    // 3. Add CRM Log
    const updatedClients = clients.map(c => {
      if (c.id === client.id) {
        const newEngagement = {
          id: `eng_pos_${Date.now()}`,
          type: 'Note' as const,
          title: `Achat POS - Ticket ${ticketId}`,
          description: `Facture générée d'un montant de ${validationSuccess.totalTTC.toFixed(3)} DT (TVA comprise). Modes : ${validationSuccess.payments.map(p => p.method.toUpperCase()).join(', ')}.`,
          dueDate: new Date().toISOString().split('T')[0],
          status: 'Met' as const
        };
        return {
          ...c,
          revenuePotential: c.revenuePotential + validationSuccess.totalTTC,
          engagements: [newEngagement, ...(c.engagements || [])]
        };
      }
      return c;
    });
    onUpdateClients(updatedClients as any);

    // 4. Create invoice in ERP billing system
    if (onUpdateInvoices) {
      const newInvoice: Invoice = {
        id: `inv_pos_${Date.now()}`,
        clientId: client.id,
        clientName: client.name,
        invoiceNumber: `FAC-${ticketId}`,
        amountHT: validationSuccess.subtotal,
        vatRate: 19,
        vatAmount: validationSuccess.tvaAmount,
        withholdingTaxRate: 0,
        withholdingAmount: 0,
        amountNetToPay: validationSuccess.totalTTC,
        amountTTC: validationSuccess.totalTTC,
        status: 'Paid',
        issuedDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        collectedAmount: validationSuccess.totalTTC,
        recouvrementSteps: [],
        withholdingCertificateReceived: false
      };
      onUpdateInvoices(prev => [newInvoice, ...prev]);
    }

    addAuditLog(
      'FAC_ASSOC_CLIENT',
      `Facture de vente générée pour le client : ${client.name} (Ticket : ${ticketId})`,
      'info'
    );
  };


  // ==========================================
  // 5. TICKET ANNULATION & FISCAL RESTORATION
  // ==========================================
  const handleCancelTransaction = (originalTx: POSTransaction) => {
    if (!activeSession) {
      alert("Ouvrez d'abord une session de caisse pour effectuer un remboursement/avoir.");
      return;
    }
    const confirmCancel = window.confirm(
      `⚠️ CONFORMITÉ FISCALE TUNISIENNE : Vous allez générer un Ticket d'Annulation (Contre-passation / Avoir) pour le ticket ${originalTx.ticketNumber}.\n` +
      `Cette opération va annuler l'impact financier de ${originalTx.totalTTC.toFixed(3)} DT, restituer les articles vendus dans le stock et ajuster l'inventaire des espèces.\n` +
      `Voulez-vous continuer ?`
    );

    if (!confirmCancel) return;

    const avoirId = `AV-${Date.now().toString().slice(-6)}`;

    // Create Avoir Transaction linked to original ticket
    const avoirTx: POSTransaction = {
      id: `tx_${Date.now()}`,
      ticketNumber: avoirId,
      sessionId: activeSession.id,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      items: originalTx.items.map(item => ({
        ...item,
        quantity: -item.quantity, // Negative quantities
        total: -item.total
      })),
      subtotal: -originalTx.subtotal,
      tvaAmount: -originalTx.tvaAmount,
      totalTTC: -originalTx.totalTTC,
      payments: originalTx.payments.map(p => ({
        ...p,
        amount: -p.amount // Negative flow
      })),
      clientId: originalTx.clientId,
      clientName: originalTx.clientName,
      status: 'Validated',
      originalTicketNumber: originalTx.ticketNumber,
      operator: currentUser?.name || 'Caissier'
    };

    // Restore Stock quantities
    const restoredProducts = products.map(p => {
      const cancelledItem = originalTx.items.find(item => item.productId === p.id);
      if (cancelledItem) {
        return {
          ...p,
          stockLevel: p.stockLevel + cancelledItem.quantity // Add back
        };
      }
      return p;
    });
    onUpdateProducts(restoredProducts);

    // Log Stock Restoration Movements
    const returnStockMovements: StockMovement[] = originalTx.items.map((item, idx) => ({
      id: `mov_pos_cancel_${Date.now()}_${idx}`,
      productId: item.productId,
      productName: item.productName,
      type: 'In' as const, // return in
      quantity: item.quantity,
      date: new Date().toISOString().split('T')[0],
      reference: `Contre-passation POS ${avoirId}`,
      operator: currentUser?.name || 'Caisse Intelligente'
    }));
    onUpdateStockMovements(prev => [...returnStockMovements, ...prev]);

    // Reverse cash drawer inventory if cash was paid
    let updatedDrawer = JSON.parse(JSON.stringify(activeSession.currentDrawer)) as Denomination[];
    let cashRefundedFromDrawer = 0;

    const cashPayments = originalTx.payments.filter(p => p.method === 'cash');
    cashPayments.forEach(pay => {
      cashRefundedFromDrawer += pay.amount;
    });

    // Deduct the cash from the drawer using greedy coin deduction logic
    if (cashRefundedFromDrawer > 0) {
      let refundMillimes = Math.round(cashRefundedFromDrawer * 1000);
      const sortedDrawer = [...updatedDrawer].sort((a, b) => b.value - a.value);
      
      for (const denom of sortedDrawer) {
        const denomMills = Math.round(denom.value * 1000);
        if (denomMills > refundMillimes) continue;

        const maxRefundUnits = Math.floor(refundMillimes / denomMills);
        const unitsToRefund = Math.min(maxRefundUnits, denom.count);

        if (unitsToRefund > 0) {
          denom.count -= unitsToRefund;
          refundMillimes -= (unitsToRefund * denomMills);
        }
      }
    }

    const newTheoreticalCash = activeSession.theoreticalCash - cashRefundedFromDrawer;

    const updatedSession: POSSession = {
      ...activeSession,
      currentDrawer: updatedDrawer,
      theoreticalCash: newTheoreticalCash
    };

    // Update original transaction status
    const updatedTransactions = transactions.map(t => {
      if (t.id === originalTx.id) {
        return {
          ...t,
          status: 'Cancelled' as const,
          cancelledByAvoir: avoirId
        };
      }
      return t;
    });

    // Post Negative Finance entries
    const financeEntries: BankTransaction[] = originalTx.payments.map((payment, idx) => {
      let journalAccount = 'Caisse Centrale Espèces';
      let targetBankAccountId = 'bank_caisse_cash';

      if (payment.method === 'card') {
        journalAccount = 'Compte Courant (TPE)';
        targetBankAccountId = 'bank_1';
      } else if (payment.method === 'flouci') {
        journalAccount = 'Portefeuille Flouci Pay';
        targetBankAccountId = 'bank_2';
      } else if (payment.method === 'cheque') {
        journalAccount = 'Chèques à Encaisser';
        targetBankAccountId = 'bank_1';
      }

      let method: TransactionMethod = 'Especes';
      if (payment.method === 'cheque') method = 'Cheque';
      else if (payment.method === 'card' || payment.method === 'flouci' || payment.method === 'credit') method = 'Autre';

      return {
        id: `tx_fin_pos_avoir_${Date.now()}_${idx}`,
        accountId: targetBankAccountId,
        accountName: journalAccount,
        date: new Date().toISOString().split('T')[0],
        description: `Contre-passation POS ${avoirId} (Avoir du Ticket ${originalTx.ticketNumber})`,
        type: 'Out', // Negative flow (refund)
        amount: payment.amount,
        method: method,
        reference: avoirId,
        beneficiaryOrIssuer: originalTx.clientName || 'Client Comptoir',
        category: 'Autre',
        status: 'Cleared',
      };
    });

    onUpdateBankTransactions([...financeEntries, ...bankTransactions]);

    // Save both avoir and updated transactions list
    const finalTransactionsList = [avoirTx, ...updatedTransactions];
    savePOSStates(updatedSession, sessionHistory, finalTransactionsList, auditLogs);

    addAuditLog(
      'CONTRE_PASSATION_TICKET', 
      `Ticket d'Avoir ${avoirId} généré pour annuler le ticket ${originalTx.ticketNumber}. Espèces et stocks restaurés.`, 
      'critical'
    );

    alert(`✅ Ticket d'annulation ${avoirId} validé avec succès. Les stocks et tiroirs-caisses sont mis à jour !`);
    
    // Automatically trigger print/preview modal for the newly generated Avoir ticket
    setValidationSuccess(avoirTx);
    setActivePreviewTab('ticket');
  };


  // ==========================================
  // 5. SESSION CLOSURE & DISCREPANCY RECONCILIATION
  // ==========================================
  const handleCloseSession = () => {
    if (!activeSession) return;

    // Calculate actual physical cash in drawer entered by user
    const physicalTotalCash = Object.entries(physicalCashCounts).reduce((acc, [valStr, count]) => {
      return acc + (parseFloat(valStr) * Number(count));
    }, 0);

    const discrepancy = physicalTotalCash - activeSession.theoreticalCash;

    const closedSession: POSSession = {
      ...activeSession,
      closedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      realCash: physicalTotalCash,
      discrepancy: discrepancy,
      status: 'Closed'
    };

    const updatedHistory = [closedSession, ...sessionHistory];
    
    savePOSStates(null, updatedHistory, transactions, auditLogs);
    
    // Log in Security dashboard / audits
    addAuditLog(
      'CLOTURE_SESSION', 
      `Session de caisse fermée. Théorique: ${activeSession.theoreticalCash.toFixed(3)} TND | Réel: ${physicalTotalCash.toFixed(3)} TND | Écart: ${discrepancy.toFixed(3)} TND.`, 
      Math.abs(discrepancy) > 1 ? 'critical' : 'info'
    );

    setIsCloseSessionOpen(false);
    setPhysicalCashCounts({
      50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0, 0.5: 0, 0.2: 0, 0.1: 0, 0.05: 0, 0.02: 0, 0.01: 0
    });

    alert(
      `🔒 Caisse Clôturée (Z de caisse généré) !\n\n` +
      `• Solde Théorique Espèces : ${activeSession.theoreticalCash.toFixed(3)} DT\n` +
      `• Solde Réel Recompté : ${physicalTotalCash.toFixed(3)} DT\n` +
      `• Écart constaté : ${discrepancy.toFixed(3)} DT ${discrepancy === 0 ? '(Parfait)' : discrepancy > 0 ? '(Excédent)' : '(Déficit)'}`
    );
  };

  // Re-charge / refill drawer denominations (action for alerts)
  const handleRefillDenomination = (value: number, countToAdd = 20) => {
    if (!activeSession) return;
    
    const updatedDrawer = activeSession.currentDrawer.map(d => {
      if (Math.abs(d.value - value) < 0.001) {
        return { ...d, count: d.count + countToAdd };
      }
      return d;
    });

    const refillTotal = value * countToAdd;

    const updatedSession: POSSession = {
      ...activeSession,
      currentDrawer: updatedDrawer,
      theoreticalCash: activeSession.theoreticalCash + refillTotal
    };

    savePOSStates(updatedSession, sessionHistory, transactions, auditLogs);
    addAuditLog(
      'RECHARGE_DENOMINATION', 
      `Alimentation de la caisse : Ajout de ${countToAdd} x ${value.toFixed(3)} DT (+${refillTotal.toFixed(3)} DT).`, 
      'info'
    );

    alert(`Refill de ${countToAdd} unités de ${value.toFixed(3)} TND effectué !`);
  };

  // Trigger quick refills of all alerts
  const handleRefillAllAlerts = () => {
    if (!activeSession) return;
    
    let refilledSomething = false;
    const updatedDrawer = activeSession.currentDrawer.map(d => {
      const threshold = denominationThresholds[d.value] || 10;
      if (d.count < threshold) {
        refilledSomething = true;
        return { ...d, count: d.count + 30 }; // Refill 30 units
      }
      return d;
    });

    if (!refilledSomething) {
      alert("Aucune coupure n'est en dessous du seuil d'alerte.");
      return;
    }

    const totalBefore = activeSession.currentDrawer.reduce((acc, d) => acc + (d.value * d.count), 0);
    const totalAfter = updatedDrawer.reduce((acc, d) => acc + (d.value * d.count), 0);
    const refillTotal = totalAfter - totalBefore;

    const updatedSession: POSSession = {
      ...activeSession,
      currentDrawer: updatedDrawer,
      theoreticalCash: activeSession.theoreticalCash + refillTotal
    };

    savePOSStates(updatedSession, sessionHistory, transactions, auditLogs);
    addAuditLog(
      'RECHARGE_ALERTE_GLOBALE', 
      `Alimentation d'appoint collective : Reflux de pièces pour un total de +${refillTotal.toFixed(3)} DT.`, 
      'info'
    );

    alert(`Alimentation d'appoint collective effectuée avec succès ! (+${refillTotal.toFixed(3)} DT ajoutés).`);
  };

  // Calculate critical alerts count
  const criticalAlertsCount = useMemo(() => {
    if (!activeSession) return 0;
    return activeSession.currentDrawer.filter(d => {
      const threshold = denominationThresholds[d.value] || 10;
      return d.count < threshold;
    }).length;
  }, [activeSession, denominationThresholds]);

  if (requiredPin && !isUnlocked) {
    return (
      <div className="h-full min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black select-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl p-8 space-y-8 text-center"
        >
          {/* Padlock Icon Header */}
          <div className="space-y-2">
            <div className="inline-flex p-4 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20 shadow-inner">
              <Lock className="w-10 h-10 animate-pulse text-indigo-400" />
            </div>
            <h3 className="text-xl font-extrabold text-white tracking-tight font-sans">Terminal de Caisse Sécurisé</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Bonjour <strong className="text-indigo-400">{currentUser?.name}</strong>. Veuillez saisir votre code PIN de caisse à 4 chiffres pour déverrouiller l'accès.
            </p>
          </div>

          {/* Bullet visualizers */}
          <div className="flex justify-center space-x-4">
            {[0, 1, 2, 3].map((index) => {
              const hasDigit = pinInput.length > index;
              return (
                <div 
                  key={index} 
                  className={`w-4.5 h-4.5 rounded-full transition-all duration-150 ${
                    hasDigit 
                      ? 'bg-indigo-500 scale-110 shadow-[0_0_8px_rgba(99,102,241,0.5)]' 
                      : 'bg-slate-800 border border-slate-700'
                  }`} 
                />
              );
            })}
          </div>

          {pinError && (
            <p className="text-xs text-red-400 font-bold bg-red-950/40 p-2.5 rounded-xl border border-red-500/20 animate-bounce">
              ⚠️ {pinError}
            </p>
          )}

          {/* Keypad numbers */}
          <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  if (pinInput.length < 4) {
                    setPinError('');
                    setPinInput(prev => prev + num);
                  }
                }}
                className="w-16 h-16 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-lg flex items-center justify-center transition-all cursor-pointer border border-slate-800 hover:border-indigo-500/30 shadow-md active:scale-95 animate-none"
              >
                {num}
              </button>
            ))}
            
            {/* Backspace */}
            <button
              key={10}
              type="button"
              onClick={() => {
                setPinError('');
                setPinInput(prev => prev.slice(0, -1));
              }}
              className="w-16 h-16 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold text-sm flex items-center justify-center transition cursor-pointer border border-slate-800 active:scale-95"
              title="Effacer"
            >
              ⌫
            </button>

            {/* Zero */}
            <button
              key={0}
              type="button"
              onClick={() => {
                if (pinInput.length < 4) {
                  setPinError('');
                  setPinInput(prev => prev + '0');
                }
              }}
              className="w-16 h-16 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-lg flex items-center justify-center transition cursor-pointer border border-slate-800 active:scale-95"
            >
              0
            </button>

            {/* Clear */}
            <button
              key={11}
              type="button"
              onClick={() => {
                setPinError('');
                setPinInput('');
              }}
              className="w-16 h-16 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center transition cursor-pointer border border-slate-800 active:scale-95"
              title="Vider"
            >
              Annuler
            </button>
          </div>

          <div className="pt-2">
            <span className="text-[10px] text-slate-500 font-mono font-bold tracking-widest uppercase">
              ELYSSA SECURE POS v1.3
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-900 text-slate-100 min-h-screen flex flex-col font-sans antialiased">
      
      {/* Tab Navigation header for POS */}
      <div className="border-b border-slate-800 bg-slate-950 p-4 shrink-0 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-inner shadow-indigo-400 text-white">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Caisse Intelligente</span>
              <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                Smart POS
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">Terminal Point de Vente inter-connecté Elyssa.pro</p>
          </div>
        </div>

        {/* Live Session Status Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {activeSession ? (
            <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-900/50 p-2 px-3 rounded-xl text-xs font-bold text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Session Ouverte par {activeSession.openedBy} ({activeSession.theoreticalCash.toFixed(3)} TND)</span>
              {criticalAlertsCount > 0 && (
                <div className="flex items-center gap-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full animate-bounce">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{criticalAlertsCount} Alertes Monnaie</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-rose-950/40 border border-rose-900/50 p-2 px-3 rounded-xl text-xs font-bold text-rose-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Caisse Fermée</span>
            </div>
          )}

          {activeSession && (
            <button
              onClick={() => setIsCloseSessionOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold p-2 px-3 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm border border-red-500/40"
            >
              <Lock className="w-4 h-4" />
              <span>Clôturer Caisse (Z)</span>
            </button>
          )}

          {requiredPin && (
            <button
              onClick={() => {
                setIsUnlocked(false);
                setPinInput('');
                localStorage.removeItem(`elyssa_pos_unlocked_${currentUser?.id || 'guest'}`);
                
                // Add security lock log
                const log: AuditLog = {
                  id: `aud_${Date.now()}`,
                  timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                  action: 'VERROUILLAGE_MANUEL',
                  user: currentUser?.name || 'Collaborateur',
                  details: 'Terminal de caisse POS verrouillé manuellement.',
                  severity: 'info'
                };
                setAuditLogs(prev => {
                  const updated = [log, ...prev];
                  localStorage.setItem('elyssa_pos_audit_logs', JSON.stringify(updated));
                  return updated;
                });
              }}
              className="bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white font-bold p-2 px-3 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm border border-slate-750/70"
              title="Verrouiller l'accès"
            >
              <Lock className="w-4 h-4 text-slate-400" />
              <span>Verrouiller</span>
            </button>
          )}
        </div>
      </div>

      {/* POS Sub Navigation Tabs */}
      <div className="bg-slate-950/60 border-b border-slate-800 shrink-0 flex overflow-x-auto p-2 gap-1.5">
        <button
          onClick={() => setPosTab('register')}
          className={`flex items-center gap-2 p-2 px-4 rounded-lg text-xs font-bold transition ${
            posTab === 'register' ? 'bg-slate-850 text-white border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Saisie & Vente</span>
        </button>
        <button
          onClick={() => setPosTab('history')}
          className={`flex items-center gap-2 p-2 px-4 rounded-lg text-xs font-bold transition ${
            posTab === 'history' ? 'bg-slate-850 text-white border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Tickets & Avoirs</span>
        </button>
        <button
          onClick={() => setPosTab('inventory')}
          className={`flex items-center gap-2 p-2 px-4 rounded-lg text-xs font-bold transition ${
            posTab === 'inventory' ? 'bg-slate-850 text-white border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Fond de Tiroir & Seuils {criticalAlertsCount > 0 && <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[9px] font-black">{criticalAlertsCount}</span>}</span>
        </button>
        <button
          onClick={() => setPosTab('sessions')}
          className={`flex items-center gap-2 p-2 px-4 rounded-lg text-xs font-bold transition ${
            posTab === 'sessions' ? 'bg-slate-850 text-white border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Sessions Précédentes</span>
        </button>
        <button
          onClick={() => setPosTab('audit')}
          className={`flex items-center gap-2 p-2 px-4 rounded-lg text-xs font-bold transition ${
            posTab === 'audit' ? 'bg-slate-850 text-white border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Journal d'Audit SecOps</span>
        </button>
      </div>

      {/* Main Content Areas */}
      <div className="flex-1 overflow-hidden">
        
        {/* If session closed, force open session screen */}
        {!activeSession && posTab !== 'sessions' && posTab !== 'audit' ? (
          <div className="h-full flex items-center justify-center p-6 bg-slate-900 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl w-full bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 text-center space-y-6"
            >
              <div className="inline-flex p-4 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                <Lock className="w-10 h-10 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-white">Ouverture de Session de Caisse</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Veuillez initialiser le tiroir-caisse avec le stock de coupures physiques de départ avant d'enregistrer des ventes.
                </p>
              </div>

              {/* Starting drawer cash counts configuration table */}
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-850 space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <Coins className="w-4 h-4 text-indigo-400" />
                    <span>Coupures Disponibles au Dinar Tunisien (TND)</span>
                  </h4>
                  <span className="text-[11px] text-indigo-300 font-bold font-mono">
                    Fond total : {Object.entries(initDrawerCounts).reduce((acc, [v, q]) => acc + (parseFloat(v) * Number(q)), 0).toFixed(3)} DT
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {DEFAULT_TUNISIAN_DENOMINATIONS.map(denom => (
                    <div key={denom.label} className="bg-slate-950 p-2 rounded-lg border border-slate-850 flex flex-col justify-between items-center gap-1.5">
                      <span className={`text-[10px] font-bold ${denom.isNote ? 'text-indigo-300' : 'text-slate-400'}`}>
                        {denom.value.toFixed(denom.value < 1 ? 3 : 1)} DT
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => setInitDrawerCounts(prev => ({ ...prev, [denom.value]: Math.max(0, (prev[denom.value] || 0) - 1) }))}
                          className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono font-bold w-6 text-center text-white">{initDrawerCounts[denom.value] || 0}</span>
                        <button
                          onClick={() => setInitDrawerCounts(prev => ({ ...prev, [denom.value]: (prev[denom.value] || 0) + 1 }))}
                          className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  onClick={handleOpenSession}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold p-3 px-8 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/20 border border-indigo-500/35"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Initialiser & Ouvrir la Caisse</span>
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="h-full">
            
            {/* ==================== REGISTER (SAISIE & VENTE) TAB ==================== */}
            {posTab === 'register' && (
              <div className="h-full flex flex-col lg:flex-row">
                
                {/* Left side: Products grid */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 border-r border-slate-800">
                  <div className="flex flex-col sm:flex-row gap-3">
                    
                    {/* Barcode / Search Input bar */}
                    <form onSubmit={handleBarcodeSubmit} className="flex-1 flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Rechercher produit par nom, SKU ou scanner code-barres..."
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 pl-10 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-medium"
                          value={barcodeInput}
                          onChange={(e) => {
                            setBarcodeInput(e.target.value);
                            setSearchQuery(e.target.value);
                          }}
                        />
                      </div>
                      <button 
                        type="submit"
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 rounded-xl text-xs font-bold transition shrink-0"
                      >
                        Scanner
                      </button>
                    </form>

                    {/* Category Filter */}
                    <div className="flex gap-1 overflow-x-auto pb-1 shrink-0">
                      {categories.slice(0, 5).map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`p-1.5 px-3 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                            selectedCategory === cat ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40' : 'bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {cat === 'All' ? 'Tous' : cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredProducts.map(p => {
                      const isLowStock = p.stockLevel <= p.minStockLevel;
                      const isOutOfStock = p.stockLevel <= 0;
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleAddToCart(p)}
                          className={`bg-slate-950 border p-3 rounded-xl flex flex-col justify-between gap-3 text-left transition cursor-pointer hover:border-indigo-500/60 hover:shadow-lg ${
                            isOutOfStock 
                              ? 'border-slate-850 opacity-55' 
                              : isLowStock 
                                ? 'border-amber-500/30 bg-amber-500/2' 
                                : 'border-slate-850'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-1">
                              <span className="text-[10px] text-slate-500 font-mono font-bold truncate block">{p.sku}</span>
                              {isOutOfStock ? (
                                <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full">Rupture</span>
                              ) : isLowStock ? (
                                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full animate-pulse">Alerte Stock</span>
                              ) : null}
                            </div>
                            <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">{p.name}</h4>
                            <p className="text-[9px] text-slate-400 font-medium">{p.category}</p>
                          </div>

                          <div className="flex justify-between items-end">
                            <span className="text-xs font-black text-indigo-400 font-mono">{p.unitPrice.toFixed(3)} DT</span>
                            <span className={`text-[9px] font-bold ${isOutOfStock ? 'text-red-400' : isLowStock ? 'text-amber-400' : 'text-slate-500'}`}>
                              Qte: {p.stockLevel}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right side: Shopping cart panel */}
                <div className="w-full lg:w-96 bg-slate-950 border-l border-slate-850 flex flex-col justify-between overflow-hidden">
                  
                  {/* Cart Header */}
                  <div className="p-4 border-b border-slate-850 space-y-3 shrink-0">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-indigo-400" />
                        <span>Panier Ticket</span>
                      </h3>
                      <button
                        onClick={() => setCart([])}
                        className="text-[10px] font-bold text-red-400 hover:text-red-300 transition flex items-center gap-1 cursor-pointer"
                        disabled={cart.length === 0}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Vider</span>
                      </button>
                    </div>

                    {/* CRM Client Assign Select */}
                    <div className="relative">
                      <User className="absolute left-2.5 top-2 w-4 h-4 text-slate-500" />
                      <select
                        className="w-full bg-slate-900 border border-slate-800 text-slate-300 pl-9 pr-3 py-1.5 rounded-lg text-[11px] focus:outline-none focus:border-indigo-500 font-bold"
                        value={selectedClient ? selectedClient.id : ''}
                        onChange={(e) => {
                          const found = clients.find(c => c.id === e.target.value);
                          setSelectedClient(found || null);
                        }}
                      >
                        <option value="">-- Assigner à un Client CRM (Facultatif) --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Cart Items list */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-10">
                        <Calculator className="w-8 h-8 text-slate-650 animate-pulse" />
                        <p className="text-xs text-slate-500 font-bold">Panier vide. Cliquez sur des articles pour les ajouter.</p>
                      </div>
                    ) : (
                      cart.map(item => (
                        <div key={item.product.id} className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-850 flex justify-between items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <h5 className="text-[11px] font-bold text-white truncate leading-tight">{item.product.name}</h5>
                            <span className="text-[10px] text-indigo-400 font-mono font-bold">
                              {(item.product.unitPrice * item.quantity).toFixed(3)} DT
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              onClick={() => handleUpdateQuantity(item.product.id, -1)}
                              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-mono font-bold w-5 text-center text-white">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.product.id, 1)}
                              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleRemoveFromCart(item.product.id)}
                              className="p-1 text-red-400 hover:bg-slate-800 rounded cursor-pointer ml-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Cart Summary & Checkout button */}
                  <div className="p-4 bg-slate-950 border-t border-slate-850 space-y-4 shrink-0">
                    <div className="space-y-1.5 text-xs font-bold text-slate-400">
                      <div className="flex justify-between">
                        <span>Sous-total (HT)</span>
                        <span className="font-mono text-slate-200">{cartSubtotal.toFixed(3)} DT</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TVA (19%)</span>
                        <span className="font-mono text-slate-200">{cartTva.toFixed(3)} DT</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-800 pt-1.5 text-white">
                        <span className="text-xs font-black uppercase">Total TTC</span>
                        <span className="text-sm font-black text-indigo-400 font-mono">{cartTotalTTC.toFixed(3)} DT</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsCheckoutOpen(true)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold p-3 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-indigo-600/10"
                      disabled={cart.length === 0}
                    >
                      <span>Encaisser Règlement</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TICKETS & AVOIRS TAB ==================== */}
            {posTab === 'history' && (
              <div className="p-6 h-full overflow-y-auto space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-white">Historique de Ventes & Conformité Comptable</h3>
                    <p className="text-xs text-slate-400">Réglementation fiscale : Aucune suppression ou modification directe de ticket n'est autorisée. Effectuez une contre-passation d'avoir.</p>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="p-3">Numéro Ticket</th>
                        <th className="p-3">Date / Session</th>
                        <th className="p-3">Client CRM</th>
                        <th className="p-3">Articles</th>
                        <th className="p-3">Montant TTC</th>
                        <th className="p-3">Mode(s) de Règlement</th>
                        <th className="p-3">Statut fiscal</th>
                        <th className="p-3 text-center">Actions de conformité</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500 font-bold">Aucune transaction enregistrée.</td>
                        </tr>
                      ) : (
                        transactions.map(tx => {
                          const isAvoir = tx.ticketNumber.startsWith('AV-') || tx.totalTTC < 0;
                          return (
                            <tr key={tx.id} className={`hover:bg-slate-900/30 ${tx.status === 'Cancelled' ? 'opacity-50 line-through' : ''}`}>
                              <td className="p-3 font-mono font-bold text-white">
                                <div className="flex flex-col">
                                  <span>{tx.ticketNumber}</span>
                                  {tx.originalTicketNumber && (
                                    <span className="text-[9px] text-amber-400 font-semibold leading-tight">Avoir de {tx.originalTicketNumber}</span>
                                  )}
                                  {tx.cancelledByAvoir && (
                                    <span className="text-[9px] text-red-400 font-semibold leading-tight">Annulé par {tx.cancelledByAvoir}</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex flex-col">
                                  <span>{tx.date}</span>
                                  <span className="text-[9px] text-slate-500 font-mono font-bold truncate w-20">{tx.sessionId}</span>
                                </div>
                              </td>
                              <td className="p-3 font-semibold">
                                {tx.clientName ? (
                                  <span className="text-indigo-300">{tx.clientName}</span>
                                ) : (
                                  <span className="text-slate-500">Comptoir Anonyme</span>
                                )}
                              </td>
                              <td className="p-3 max-w-xs truncate font-medium">
                                {tx.items.map(it => `${Math.abs(it.quantity)}x ${it.productName}`).join(', ')}
                              </td>
                              <td className={`p-3 font-mono font-black ${isAvoir ? 'text-amber-400' : 'text-slate-100'}`}>
                                {tx.totalTTC.toFixed(3)} DT
                              </td>
                              <td className="p-3 font-bold uppercase text-[10px]">
                                <div className="flex flex-wrap gap-1">
                                  {tx.payments.map((p, pIdx) => (
                                    <span key={pIdx} className="bg-slate-900 border border-slate-800 text-slate-400 p-0.5 px-2 rounded">
                                      {p.method} : {p.amount.toFixed(3)}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="p-3">
                                {tx.status === 'Cancelled' ? (
                                  <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold p-0.5 px-2 rounded-full">ANNULÉ</span>
                                ) : isAvoir ? (
                                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold p-0.5 px-2 rounded-full">AVOIR / COMM</span>
                                ) : (
                                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold p-0.5 px-2 rounded-full">CONFORME</span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setValidationSuccess(tx);
                                      setActivePreviewTab('ticket');
                                    }}
                                    title="Imprimer le Ticket"
                                    className="bg-indigo-600/15 hover:bg-indigo-600 text-indigo-400 hover:text-white p-1 px-2.5 border border-indigo-500/20 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                                  >
                                    <Printer className="w-3 h-3" />
                                    <span>Imprimer</span>
                                  </button>

                                  {!isAvoir && tx.status !== 'Cancelled' && (
                                    <button
                                      onClick={() => handleCancelTransaction(tx)}
                                      className="bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-white p-1 px-3 border border-red-500/20 rounded-lg text-[10px] font-bold transition cursor-pointer"
                                    >
                                      Annuler (Avoir)
                                    </button>
                                  )}
                                  {tx.status === 'Cancelled' && (
                                    <span className="text-[10px] font-semibold text-slate-500">Contre-passé</span>
                                  )}
                                  {isAvoir && (
                                    <span className="text-[10px] font-semibold text-amber-400">Rectificatif</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==================== INVENTORY & THRESHOLDS TAB ==================== */}
            {posTab === 'inventory' && (
              <div className="p-6 h-full overflow-y-auto space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-white">Inventaire des Monnaies & Coupures du Tiroir-Caisse</h3>
                    <p className="text-xs text-slate-400">Paramétrez des seuils de réserve critiques pour que le caissier anticipe le manque de pièces pour le rendu monnaie.</p>
                  </div>
                  {activeSession && (
                    <button
                      onClick={handleRefillAllAlerts}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Refaire l'Appoint Collectivement (+30u)</span>
                    </button>
                  )}
                </div>

                {/* Main alerts bar */}
                {activeSession && criticalAlertsCount > 0 && (
                  <div className="bg-amber-950/40 border border-amber-900/50 p-4 rounded-xl text-xs text-amber-300 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <h4 className="font-bold">⚠️ Réserve de monnaie critique ({criticalAlertsCount} Alertes) !</h4>
                      <p className="mt-0.5 text-slate-400 text-[11px]">Certaines coupures de pièces sont tombées en-dessous du seuil d'alimentation minimal pour garantir le calcul glouton optimal de rendu-monnaie.</p>
                    </div>
                  </div>
                )}

                {/* Drawer Inventory List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {activeSession ? (
                    activeSession.currentDrawer.map(denom => {
                      const threshold = denominationThresholds[denom.value] || 10;
                      const isAlert = denom.count < threshold;
                      return (
                        <div
                          key={denom.label}
                          className={`p-4 rounded-xl border bg-slate-950 flex flex-col justify-between gap-3 text-left ${
                            isAlert ? 'border-amber-500/40 bg-amber-500/2' : 'border-slate-800'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-xs font-bold text-slate-300 leading-tight">{denom.label}</h4>
                              <p className="text-[10px] text-slate-500">{denom.isNote ? 'Billet de banque' : 'Pièce de monnaie'}</p>
                            </div>
                            {isAlert && (
                              <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[8px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse">
                                Alerte Réserve
                              </span>
                            )}
                          </div>

                          <div className="flex justify-between items-end">
                            <div>
                              <span className="text-[10px] text-slate-500 block leading-none mb-1">Stock physique</span>
                              <strong className={`text-lg font-mono font-extrabold ${isAlert ? 'text-amber-400' : 'text-slate-100'}`}>
                                {denom.count} unités
                              </strong>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 block leading-none mb-1">Valeur tiroir</span>
                              <strong className="text-xs font-mono font-bold text-indigo-400">
                                {(denom.value * denom.count).toFixed(3)} DT
                              </strong>
                            </div>
                          </div>

                          {/* Quick adjustment controls */}
                          <div className="border-t border-slate-900 pt-3 flex justify-between items-center gap-2">
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-slate-500 font-bold">Seuil :</span>
                              <input
                                type="number"
                                className="w-10 bg-slate-900 border border-slate-800 text-slate-200 p-0.5 rounded text-[10px] text-center font-bold"
                                value={threshold}
                                onChange={(e) => {
                                  const val = Math.max(0, parseInt(e.target.value) || 0);
                                  setDenominationThresholds(prev => {
                                    const next = { ...prev, [denom.value]: val };
                                    localStorage.setItem('elyssa_pos_denomination_thresholds', JSON.stringify(next));
                                    return next;
                                  });
                                }}
                              />
                            </div>
                            <button
                              onClick={() => handleRefillDenomination(denom.value, 15)}
                              className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white p-1 px-2.5 border border-slate-800 rounded-lg text-[9px] font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3 text-emerald-400" />
                              <span>Alimenter (+15)</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full p-8 text-center text-slate-500 font-bold bg-slate-950/40 rounded-xl border border-slate-850">
                      Ouvrez d'abord une session pour gérer l'inventaire physique des coupures.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== HISTORIC SESSIONS TAB ==================== */}
            {posTab === 'sessions' && (
              <div className="p-6 h-full overflow-y-auto space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-white">Journal Historique des Sessions (Z de Caisse)</h3>
                    <p className="text-xs text-slate-400">Consultez l'historique des fermetures, les recomptages de fin de journée et le calcul des écarts.</p>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="p-3">ID Session</th>
                        <th className="p-3">Opérateur</th>
                        <th className="p-3">Ouverture</th>
                        <th className="p-3">Clôture</th>
                        <th className="p-3">Théorique Espèces</th>
                        <th className="p-3">Réel Recompté</th>
                        <th className="p-3">Écart de caisse</th>
                        <th className="p-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 font-medium">
                      {sessionHistory.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500 font-bold">Aucune session clôturée trouvée dans l'historique local.</td>
                        </tr>
                      ) : (
                        sessionHistory.map(sess => {
                          const disc = sess.discrepancy || 0;
                          return (
                            <tr key={sess.id} className="hover:bg-slate-900/30">
                              <td className="p-3 font-mono font-bold text-white">{sess.id}</td>
                              <td className="p-3 font-semibold">{sess.openedBy}</td>
                              <td className="p-3 text-slate-400">{sess.openedAt}</td>
                              <td className="p-3 text-slate-400">{sess.closedAt || 'Non clôturée'}</td>
                              <td className="p-3 font-mono">{sess.theoreticalCash.toFixed(3)} DT</td>
                              <td className="p-3 font-mono">{sess.realCash?.toFixed(3) || '0.000'} DT</td>
                              <td className={`p-3 font-mono font-bold ${disc === 0 ? 'text-slate-100' : disc > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {disc === 0 ? '0.000' : disc > 0 ? `+${disc.toFixed(3)}` : disc.toFixed(3)} DT
                                {disc !== 0 && (
                                  <span className="text-[10px] font-normal block">
                                    {disc > 0 ? 'Excédent de caisse' : 'Déficit de caisse'}
                                  </span>
                                )}
                              </td>
                              <td className="p-3">
                                <span className="bg-slate-900 border border-slate-800 text-slate-400 text-[9px] font-bold p-0.5 px-2 rounded-full">CLÔTURÉE</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==================== AUDIT LOGS TAB ==================== */}
            {posTab === 'audit' && (
              <div className="p-6 h-full overflow-y-auto space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-white">Journal de Contrôle Fiscal & Sécurité (SecOps)</h3>
                    <p className="text-xs text-slate-400">Trassabilité complète de toutes les opérations sensibles : ouvertures, rectifications, contre-passations d'avoirs et écarts de caisse.</p>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-850">
                  {auditLogs.map(log => (
                    <div key={log.id} className="p-3.5 hover:bg-slate-900/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`p-0.5 px-2 rounded-full text-[9px] font-black uppercase border ${
                            log.severity === 'critical' 
                              ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse' 
                              : log.severity === 'warning' 
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}>
                            {log.action}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono font-bold">{log.timestamp}</span>
                        </div>
                        <p className="text-slate-300 font-medium">{log.details}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-500 block">Opérateur</span>
                        <strong className="text-slate-400 font-semibold">{log.user}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* ========================================================
          CHECKOUT MODAL PANEL (MULTI-MODE & COMPUTE CHANGE)
          ======================================================== */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-800 max-h-[90vh] overflow-hidden"
          >
            {/* Left side modal: select payment segment details */}
            <div className="flex-1 p-6 overflow-y-auto space-y-5">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-5 h-5 text-indigo-400" />
                  <span>Enregistrer les Paiements</span>
                </h3>
                <span className="text-xs text-indigo-400 font-black font-mono">
                  Total : {cartTotalTTC.toFixed(3)} TND
                </span>
              </div>

              {/* Grid of payment methods */}
              <div className="grid grid-cols-5 gap-2 shrink-0">
                {[
                  { id: 'cash', label: 'Espèces', icon: <Coins className="w-4 h-4" /> },
                  { id: 'flouci', label: 'Flouci', icon: <QrCode className="w-4 h-4" /> },
                  { id: 'card', label: 'Carte/TPE', icon: <CreditCard className="w-4 h-4" /> },
                  { id: 'cheque', label: 'Chèque', icon: <FileText className="w-4 h-4" /> },
                  { id: 'credit', label: 'Crédit', icon: <User className="w-4 h-4" /> },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setActivePaymentMethod(m.id as any);
                      handleClearReceivedCash();
                    }}
                    className={`p-2 rounded-xl flex flex-col items-center gap-1.5 text-[10px] font-bold border transition cursor-pointer ${
                      activePaymentMethod === m.id 
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' 
                        : 'bg-slate-950 text-slate-400 border-slate-850 hover:text-slate-200'
                    }`}
                  >
                    {m.icon}
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Dynamic input configurations for the active mode */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-4">
                
                {/* A. CASH MODE INPUTS AND INTERACTIVE DENOMINATIONS */}
                {activePaymentMethod === 'cash' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Coupures Reçues :</span>
                      <button
                        onClick={handleClearReceivedCash}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-300 transition cursor-pointer"
                      >
                        Effacer saisie
                      </button>
                    </div>

                    {/* interactive clicking denominations */}
                    <div className="grid grid-cols-4 gap-2">
                      {[50, 20, 10, 5, 2, 1, 0.5, 0.2].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleAddReceivedCash(val)}
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-2 text-xs font-mono font-black text-slate-200 rounded-lg text-center cursor-pointer active:scale-95 transition"
                        >
                          +{val.toFixed(val < 1 ? 3 : 1)}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-500 block mb-1">Total espèces reçu calculé</span>
                        <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center font-mono font-black text-sm text-indigo-400">
                          {receivedCashTotal.toFixed(3)} DT
                        </div>
                      </div>
                      <div className="w-6 text-center text-slate-600 font-black">OU</div>
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-500 block mb-1">Saisie libre du montant (DT)</span>
                        <input
                          type="number"
                          placeholder="Ex: 80.000"
                          step="0.005"
                          className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2 text-xs text-center font-mono font-black focus:outline-none focus:border-indigo-500"
                          value={customCashReceived}
                          onChange={(e) => {
                            setCustomCashReceived(e.target.value);
                            // Clear denomination counts if typing directly
                            setReceivedCashCounts({
                              50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0, 0.5: 0, 0.2: 0, 0.1: 0, 0.05: 0, 0.02: 0, 0.01: 0
                            });
                          }}
                        />
                      </div>
                    </div>

                    {/* Greedy Return-money output display */}
                    {cashChangeDue > 0 && (
                      <div className="border-t border-slate-900 pt-3 space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-400">Monnaie à rendre :</span>
                          <strong className="text-sm font-mono text-emerald-400">{cashChangeDue.toFixed(3)} DT</strong>
                        </div>

                        {changeDistribution.possible ? (
                          <div className="bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-xl space-y-1.5 text-left">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#10b981] block">Distribution suggérée ( Greedy ) :</span>
                            <div className="flex flex-wrap gap-1.5">
                              {changeDistribution.list.map((item, idx) => (
                                <span key={idx} className="bg-slate-900 border border-slate-800 text-[10px] font-bold p-1 px-2.5 rounded font-mono text-slate-300">
                                  {item.count} x {item.denomination.label.replace(' (Pièce)', '').replace(' (Billet)', '')}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-red-950/40 border border-red-900/50 p-3 rounded-xl text-[11px] text-red-300 font-bold leading-normal text-left">
                            ⚠️ STOCK DE MONNAIE INSUFFISANT ! Impossible de rendre la monnaie exacte. Veuillez demander l'appoint ou recharger les pièces.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* B. FLOUCI PAY INPUTS */}
                {activePaymentMethod === 'flouci' && (
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Portefeuille Électronique Flouci :</span>
                    <p className="text-[10px] text-slate-500 leading-normal">Faites scanner le QR code de paiement Flouci par le client, puis saisissez le code de transaction / référence reçu.</p>
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <div className="p-2 bg-white rounded-lg shrink-0">
                        {/* simulated QR code */}
                        <QrCode className="w-16 h-16 text-slate-900" />
                      </div>
                      <div className="flex-1 w-full space-y-2">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Référence Transaction *</label>
                        <input
                          type="text"
                          placeholder="Ex: FLOUCI-TRX-87654"
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg text-xs font-bold focus:outline-none focus:border-indigo-500"
                          value={flouciRef}
                          onChange={(e) => setFlouciRef(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* C. CREDIT CARD / TPE INPUTS */}
                {activePaymentMethod === 'card' && (
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Terminal Carte Bancaire TPE :</span>
                    <div className="space-y-2">
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Code d'autorisation de la transaction *</label>
                      <input
                        type="text"
                        placeholder="Ex: AUTH-43219"
                        className="w-full bg-slate-900 border border-slate-800 text-slate-250 p-2.5 rounded-lg text-xs font-bold focus:outline-none focus:border-indigo-500 font-mono"
                        value={cardAuth}
                        onChange={(e) => setCardAuth(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* D. CHEQUE INPUTS */}
                {activePaymentMethod === 'cheque' && (
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Encaissement par Chèque :</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase">Numéro du Chèque *</label>
                        <input
                          type="text"
                          placeholder="Ex: 8765432"
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded-lg text-xs font-bold focus:outline-none"
                          value={chequeNum}
                          onChange={(e) => setChequeNum(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase">Banque Émettrice *</label>
                        <input
                          type="text"
                          placeholder="Ex: BIAT, Amen Bank..."
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded-lg text-xs font-bold focus:outline-none"
                          value={chequeBank}
                          onChange={(e) => setChequeBank(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* E. CLIENT CREDIT DEBT */}
                {activePaymentMethod === 'credit' && (
                  <div className="space-y-2 text-left">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Acompte / Crédit Client :</span>
                    {selectedClient ? (
                      <div className="bg-indigo-950/20 border border-indigo-900/35 p-3 rounded-xl space-y-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 block">Fiche CRM de destination :</span>
                        <div className="text-xs font-bold text-white">
                          {selectedClient.name}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">L'encours de crédit client sera augmenté de {remainingToPay.toFixed(3)} DT à la validation.</p>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center text-[11px] text-amber-400 font-bold">
                        ⚠️ Sélectionnez d'abord un Client dans le menu déroulant du panier pour pouvoir lui affecter ce crédit.
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Add payment segment action button */}
              <button
                type="button"
                onClick={handleAddPaymentSegment}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold p-2 px-4 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer border border-slate-700/60"
              >
                + Ajouter ce Règlement de {remainingToPay.toFixed(3)} DT
              </button>
            </div>

            {/* Right side modal: Summary of scinded segments and validation */}
            <div className="w-full md:w-80 p-6 bg-slate-950/65 flex flex-col justify-between overflow-y-auto space-y-6">
              <div className="space-y-5">
                
                {/* Client / Facturation de Caisse */}
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-850 space-y-3 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      <span>Client / Facturation</span>
                    </span>
                    {!showQuickClientForm && (
                      <button
                        type="button"
                        onClick={() => setShowQuickClientForm(true)}
                        className="text-[9px] font-black text-indigo-400 hover:text-indigo-300 transition cursor-pointer flex items-center gap-0.5 border border-indigo-500/20 px-1.5 py-0.5 rounded bg-indigo-500/5 hover:bg-indigo-500/10 animate-pulse"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>Créer Client</span>
                      </button>
                    )}
                  </div>

                  {showQuickClientForm ? (
                    <div className="space-y-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                      <p className="text-[8px] font-extrabold text-indigo-400 uppercase tracking-wider">Nouveau Client Caisse</p>
                      <input
                        type="text"
                        placeholder="Nom complet / Raison Sociale *"
                        className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-1.5 rounded text-[10px] focus:outline-none focus:border-indigo-500 font-bold"
                        value={quickClientName}
                        onChange={(e) => setQuickClientName(e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Matricule Fiscal (M.F.)"
                        className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-1.5 rounded text-[10px] focus:outline-none focus:border-indigo-500 font-mono"
                        value={quickClientMF}
                        onChange={(e) => setQuickClientMF(e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-1">
                        <input
                          type="text"
                          placeholder="Téléphone"
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-1.5 rounded text-[10px] focus:outline-none"
                          value={quickClientPhone}
                          onChange={(e) => setQuickClientPhone(e.target.value)}
                        />
                        <select
                          className="w-full bg-slate-900 border border-slate-800 text-slate-300 p-1.5 rounded text-[10px] focus:outline-none font-bold"
                          value={quickClientCategory}
                          onChange={(e) => setQuickClientCategory(e.target.value as any)}
                        >
                          <option value="Local">Local</option>
                          <option value="Export">Export</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="Adresse physique"
                        className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-1.5 rounded text-[10px] focus:outline-none"
                        value={quickClientAddress}
                        onChange={(e) => setQuickClientAddress(e.target.value)}
                      />
                      <div className="flex gap-1 pt-1">
                        <button
                          type="button"
                          onClick={handleCreateQuickClient}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold p-1 px-2 rounded text-[9px] transition cursor-pointer"
                        >
                          Enregistrer
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowQuickClientForm(false);
                            setQuickClientName('');
                            setQuickClientMF('');
                            setQuickClientPhone('');
                            setQuickClientAddress('');
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-400 p-1 px-2 rounded text-[9px] transition cursor-pointer"
                        >
                          Fermer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <select
                        className="w-full bg-slate-950 border border-slate-850 text-slate-300 px-2 py-1 rounded text-[10px] focus:outline-none focus:border-indigo-500 font-bold"
                        value={selectedClient ? selectedClient.id : ''}
                        onChange={(e) => {
                          const found = clients.find(c => c.id === e.target.value);
                          setSelectedClient(found || null);
                        }}
                      >
                        <option value="">-- Client Comptoir Anonyme --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
                        ))}
                      </select>

                      {selectedClient && (
                        <div className="bg-slate-955 border border-slate-850 p-2 rounded-lg text-[10px] flex justify-between items-center">
                          <div>
                            <p className="font-extrabold text-slate-200 truncate max-w-[130px]">{selectedClient.name}</p>
                            <p className="text-slate-500 text-[8px]">
                              {selectedClient.category} • {selectedClient.phone || 'Pas de tél'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedClient(null)}
                            className="text-red-450 hover:text-red-400 hover:bg-slate-900 p-1 rounded transition cursor-pointer"
                            title="Retirer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 🚚 Shipping & Delivery Interconnection Section */}
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2.5">
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={needsDelivery}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setNeedsDelivery(checked);
                        if (checked && !deliveryAddress && selectedClient?.address) {
                          setDeliveryAddress(selectedClient.address);
                        }
                      }}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
                      id="pos-delivery-checkbox"
                    />
                    <span className="text-xs font-extrabold text-slate-200 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>🚚 Nécessite une livraison par transporteur</span>
                    </span>
                  </label>

                  {needsDelivery && (
                    <div className="space-y-2 pt-2 border-t border-slate-850">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider flex items-center gap-1">
                          <Warehouse className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>Entrepôt / Magasin de départ</span>
                        </label>
                        <input
                          type="text"
                          value={warehouseLocation}
                          onChange={(e) => setWarehouseLocation(e.target.value)}
                          placeholder="Ex: Magasin Principal & Showroom Tunis"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                          <span>Adresse de livraison du client</span>
                        </label>
                        <input
                          type="text"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Ex: Z.I. Charguia II, Lot 14, Tunis"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                  Paiements Scindés
                </h4>

                {payments.length === 0 ? (
                  <p className="text-xs text-slate-500 font-medium text-center py-6">Aucune ligne de règlement ajoutée. Choisissez un mode à gauche.</p>
                ) : (
                  <div className="space-y-2">
                    {payments.map((p, idx) => (
                      <div key={idx} className="bg-slate-900 p-2 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                        <div className="text-left font-bold uppercase">
                          <span className="text-[10px] text-slate-400 block">Ségment {idx+1}</span>
                          <span className="text-indigo-400">{p.method}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-white font-black">{p.amount.toFixed(3)} DT</span>
                          <button
                            onClick={() => handleRemovePaymentSegment(idx)}
                            className="text-red-400 hover:bg-slate-800 p-1 rounded cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Solde summary calculations */}
                <div className="space-y-2 border-t border-slate-800 pt-4 text-xs font-semibold text-slate-400">
                  <div className="flex justify-between">
                    <span>Total du ticket :</span>
                    <span className="font-mono text-slate-200">{cartTotalTTC.toFixed(3)} DT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payé :</span>
                    <span className="font-mono text-slate-200">{paidTotal.toFixed(3)} DT</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2 text-white">
                    <span className="font-black">Reste à payer :</span>
                    <span className={`font-mono font-black ${remainingToPay === 0 ? 'text-emerald-400' : 'text-indigo-400'}`}>
                      {remainingToPay.toFixed(3)} DT
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer action buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleValidateSale}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold p-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg disabled:opacity-40 disabled:pointer-events-none"
                  disabled={remainingToPay > 0}
                >
                  Valider la Vente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    setPayments([]);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-bold p-2 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Annuler / Retour
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}


      {/* ========================================================
          SESSION CLÔTURE MODAL (Z-DE-CAISSE RECONCILIATION)
          ======================================================== */}
      {isCloseSessionOpen && activeSession && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-6"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-5 h-5 text-red-500" />
                <span>Reconciliation de Clôture (Z de Caisse)</span>
              </h3>
              <button 
                onClick={() => setIsCloseSessionOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Pour assurer la conformité avec le SecurityDashboard et le FinanceManager, veuillez recompter le tiroir-caisse physique et saisir le nombre précis de chaque coupure ci-dessous :
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4 text-left">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-xs font-bold text-slate-300">
                <span>Réglementations & Saisies</span>
                <span className="text-indigo-400 font-mono">
                  Saisi réel : {Object.entries(physicalCashCounts).reduce((acc, [v, q]) => acc + (parseFloat(v) * Number(q)), 0).toFixed(3)} TND
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[30vh] overflow-y-auto pr-1">
                {DEFAULT_TUNISIAN_DENOMINATIONS.map(denom => (
                  <div key={denom.label} className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400">{denom.label.replace(' (Pièce)', '').replace(' (Billet)', '')}</span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setPhysicalCashCounts(prev => ({ ...prev, [denom.value]: Math.max(0, (prev[denom.value] || 0) - 1) }))}
                        className="p-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-mono font-bold w-6 text-center text-white">{physicalCashCounts[denom.value] || 0}</span>
                      <button
                        onClick={() => setPhysicalCashCounts(prev => ({ ...prev, [denom.value]: (prev[denom.value] || 0) + 1 }))}
                        className="p-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reconciliation values */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 grid grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Solde Théorique</span>
                <strong className="text-sm font-mono text-slate-200">{activeSession.theoreticalCash.toFixed(3)} DT</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Solde Réel</span>
                <strong className="text-sm font-mono text-indigo-400">
                  {Object.entries(physicalCashCounts).reduce((acc, [v, q]) => acc + (parseFloat(v) * Number(q)), 0).toFixed(3)} DT
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Écart Constaté</span>
                {(() => {
                  const r = Object.entries(physicalCashCounts).reduce((acc, [v, q]) => acc + (parseFloat(v) * Number(q)), 0);
                  const disc = r - activeSession.theoreticalCash;
                  return (
                    <strong className={`text-sm font-mono font-black ${disc === 0 ? 'text-slate-300' : disc > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {disc === 0 ? '0.000' : disc > 0 ? `+${disc.toFixed(3)}` : disc.toFixed(3)} DT
                    </strong>
                  );
                })()}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsCloseSessionOpen(false)}
                className="bg-slate-950 hover:bg-slate-850 text-slate-400 font-bold p-2 px-4 rounded-xl text-xs uppercase cursor-pointer"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleCloseSession}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold p-2.5 px-6 rounded-xl text-xs uppercase cursor-pointer shadow-lg shadow-red-600/10"
              >
                Confirmer la Clôture & Z-Caisse
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========================================================
          TICKET VALIDATION / PRINTER SIMULATOR MODAL
          ======================================================== */}
      {validationSuccess && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-6 text-center"
          >
            <div className="inline-flex p-3 bg-emerald-500/15 text-emerald-400 rounded-full border border-emerald-500/20">
              <Check className="w-8 h-8 animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-base font-extrabold text-white">Vente Enregistrée !</h4>
              <p className="text-xs text-slate-400">Le ticket a été validé. Stock et écritures comptables synchronisés.</p>
            </div>

            {/* Toggle Preview Mode */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
              <button
                type="button"
                onClick={() => setActivePreviewTab('ticket')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activePreviewTab === 'ticket'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ticket de Caisse
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('invoice')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activePreviewTab === 'invoice'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Facture Officielle
              </button>
            </div>

            {/* Simulated Printed Paper (TICKET) */}
            {activePreviewTab === 'ticket' && (
              <div id="pos-ticket-print" className="bg-white text-slate-900 p-4 rounded-xl border border-slate-200 text-left font-mono text-[10px] space-y-3 shadow-inner">
                <div className="text-center border-b border-dashed border-slate-300 pb-2 space-y-1">
                  <strong className="text-xs font-black uppercase tracking-tight">{adminSettings?.companyName || 'ELYSSA ENTERPRISES'}</strong>
                  <p className="text-[9px] text-slate-500">{adminSettings?.companyAddress || 'Tunis, Tunisie'}</p>
                  <p className="text-[9px] text-slate-500">M.F. : {adminSettings?.companyMF || '1234567A/M/A/000'}</p>
                </div>

                <div className="space-y-0.5">
                  <p><strong>TICKET :</strong> {validationSuccess.ticketNumber}</p>
                  <p><strong>DATE :</strong> {validationSuccess.date}</p>
                  <p><strong>CAISSIER :</strong> {validationSuccess.operator}</p>
                  <p><strong>CLIENT :</strong> {validationSuccess.clientName || 'CLIENT COMPTOIR'}</p>
                </div>

                <div className="border-t border-b border-dashed border-slate-300 py-1.5 space-y-1">
                  {validationSuccess.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.quantity} x {item.productName.slice(0, 20)}</span>
                      <span>{item.total.toFixed(3)} DT</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-0.5 font-bold text-right">
                  <div className="flex justify-between">
                    <span>Sous-total HT :</span>
                    <span>{validationSuccess.subtotal.toFixed(3)} DT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TVA (19%) :</span>
                    <span>{validationSuccess.tvaAmount.toFixed(3)} DT</span>
                  </div>
                  <div className="flex justify-between text-xs font-black border-t border-slate-200 pt-1">
                    <span>TOTAL TTC :</span>
                    <span>{validationSuccess.totalTTC.toFixed(3)} DT</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-300 pt-2 space-y-0.5">
                  <p className="font-bold">RÈGLEMENTS :</p>
                  {validationSuccess.payments.map((p, idx) => (
                    <div key={idx} className="flex justify-between text-slate-600">
                      <span className="uppercase">{p.method}</span>
                      <span>{p.amount.toFixed(3)} DT</span>
                    </div>
                  ))}
                </div>

                {validationSuccess.needsDelivery && (
                  <div className="border-t border-dashed border-slate-300 pt-2 space-y-0.5 text-[8px] text-slate-700 font-bold bg-amber-50 p-2 rounded border border-amber-200">
                    <p className="text-amber-800 flex items-center gap-1 font-black">🚚 EXPÉDITION & LIVRAISON REQUISE</p>
                    <p><span className="text-slate-500">Magasin de départ :</span> {validationSuccess.warehouseLocation}</p>
                    <p><span className="text-slate-500">Adresse de livraison :</span> {validationSuccess.deliveryAddress || 'Non renseignée'}</p>
                    <p className="text-emerald-700 font-bold">Statut Logistique : Transmis aux Expéditions (En attente)</p>
                  </div>
                )}

                <div className="text-center pt-3 border-t border-dashed border-slate-200 text-[8px] text-slate-400">
                  <span>Elyssa.pro POS - Merci pour votre visite !</span>
                </div>
              </div>
            )}

            {/* Invoice Assignment view if no client associated */}
            {activePreviewTab === 'invoice' && !validationSuccess.clientId && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4 text-left">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="text-[11px] font-black uppercase tracking-wider">Client requis pour Facturation</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Cette vente a été enregistrée de manière anonyme ("Client Comptoir"). Pour éditer et imprimer une Facture officielle tunisienne, veuillez associer un compte client ci-dessous :
                </p>

                {showSuccessQuickClientForm ? (
                  <div className="space-y-2 bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Création Client Rapide</p>
                    <input
                      type="text"
                      placeholder="Nom complet / Raison Sociale *"
                      className="w-full bg-slate-955 border border-slate-800 text-slate-200 p-1.5 rounded text-[10px] focus:outline-none focus:border-indigo-500 font-bold"
                      value={quickClientName}
                      onChange={(e) => setQuickClientName(e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Matricule Fiscal (M.F.)"
                      className="w-full bg-slate-955 border border-slate-800 text-slate-200 p-1.5 rounded text-[10px] focus:outline-none focus:border-indigo-500 font-mono"
                      value={quickClientMF}
                      onChange={(e) => setQuickClientMF(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        placeholder="Téléphone"
                        className="w-full bg-slate-955 border border-slate-800 text-slate-200 p-1.5 rounded text-[10px] focus:outline-none"
                        value={quickClientPhone}
                        onChange={(e) => setQuickClientPhone(e.target.value)}
                      />
                      <select
                        className="w-full bg-slate-955 border border-slate-800 text-slate-300 p-1.5 rounded text-[10px] focus:outline-none"
                        value={quickClientCategory}
                        onChange={(e) => setQuickClientCategory(e.target.value as any)}
                      >
                        <option value="Local">Local</option>
                        <option value="Export">Export</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      placeholder="Adresse"
                      className="w-full bg-slate-955 border border-slate-800 text-slate-200 p-1.5 rounded text-[10px] focus:outline-none"
                      value={quickClientAddress}
                      onChange={(e) => setQuickClientAddress(e.target.value)}
                    />
                    <div className="flex gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (!quickClientName.trim()) {
                            alert('Veuillez saisir le nom.');
                            return;
                          }
                          const newClient: Client = {
                            id: `client_pos_${Date.now()}`,
                            name: quickClientName.trim(),
                            email: quickClientEmail.trim() || `${quickClientName.toLowerCase().replace(/\s+/g, '')}@example.com`,
                            phone: quickClientPhone.trim() || '216000000',
                            address: quickClientAddress.trim() || 'Tunisie',
                            category: quickClientCategory,
                            sector: 'Commerce de détail',
                            revenuePotential: 0,
                            engagements: [],
                            status: 'Active',
                            notes: quickClientMF.trim() ? `MF: ${quickClientMF.trim()}` : '',
                            createdDate: new Date().toISOString().split('T')[0]
                          };
                          onUpdateClients(prev => [...prev, newClient]);
                          handleAssignClientToSuccessTx(newClient);
                          
                          setQuickClientName('');
                          setQuickClientMF('');
                          setQuickClientPhone('');
                          setQuickClientAddress('');
                          setQuickClientEmail('');
                          setShowSuccessQuickClientForm(false);
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold p-1 px-2 rounded text-[10px] transition cursor-pointer"
                      >
                        Créer & Assigner
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSuccessQuickClientForm(false);
                        }}
                        className="bg-slate-800 hover:bg-slate-750 text-slate-400 p-1 px-2 rounded text-[10px] transition cursor-pointer"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <select
                      className="w-full bg-slate-900 border border-slate-800 text-slate-300 px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-bold"
                      value=""
                      onChange={(e) => {
                        const client = clients.find(c => c.id === e.target.value);
                        if (client) {
                          handleAssignClientToSuccessTx(client);
                        }
                      }}
                    >
                      <option value="">-- Sélectionner un Client CRM existant --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
                      ))}
                    </select>

                    <div className="text-center">
                      <span className="text-slate-500 text-[10px] font-bold block mb-1.5">— OU —</span>
                      <button
                        type="button"
                        onClick={() => setShowSuccessQuickClientForm(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-1.5 px-3 rounded-lg text-[10px] transition cursor-pointer"
                      >
                        + Créer Nouveau Client de Caisse
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Simulated Printed Paper (INVOICE) */}
            {activePreviewTab === 'invoice' && validationSuccess.clientId && (
              <div id="pos-invoice-print" className="bg-white text-slate-900 p-5 rounded-xl border border-slate-200 text-left font-mono text-[9px] space-y-4 shadow-inner leading-relaxed">
                {/* Header Facture */}
                <div className="flex justify-between items-start border-b border-slate-300 pb-3">
                  <div>
                    <h3 className="text-[12px] font-black uppercase text-indigo-900 tracking-wider">ELYSSA ERP</h3>
                    <p className="text-[8px] text-slate-500 font-bold uppercase">{adminSettings?.companyName || 'ELYSSA ENTERPRISES'}</p>
                    <p className="text-[8px] text-slate-500">{adminSettings?.companyAddress || 'Tunis, Tunisie'}</p>
                    <p className="text-[8px] text-slate-500">M.F. : {adminSettings?.companyMF || '1234567A/M/A/000'}</p>
                  </div>
                  <div className="text-right">
                    <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">FACTURE DE VENTE</h4>
                    <p className="font-bold text-indigo-600">N° FAC-{validationSuccess.ticketNumber}</p>
                    <p className="text-[8px] text-slate-500">Date : {validationSuccess.date}</p>
                  </div>
                </div>

                {/* Seller / Buyer details */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">ÉMETTEUR</span>
                    <strong className="text-[8px] text-slate-700 uppercase">{adminSettings?.companyName || 'ELYSSA ENTERPRISES'}</strong>
                    <p className="text-[8px] text-slate-500">{adminSettings?.companyAddress || 'Tunis, Tunisie'}</p>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">FACTURÉ À</span>
                    <strong className="text-[8px] text-slate-800 uppercase">
                      {validationSuccess.clientName}
                    </strong>
                    {(() => {
                      const clientObj = clients.find(c => c.id === validationSuccess.clientId);
                      const mfVal = clientObj?.notes?.includes('MF:') ? clientObj.notes.replace('MF:', '').trim() : (clientObj?.notes || '');
                      return (
                        <>
                          <p className="text-[8px] text-slate-650">{clientObj?.address || 'Tunisie'}</p>
                          {clientObj?.phone && <p className="text-[8px] text-slate-650">Tél : {clientObj.phone}</p>}
                          {mfVal && <p className="text-[8px] text-indigo-800 font-bold">M.F. : {mfVal}</p>}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left text-[8px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-500 font-bold uppercase text-[7px]">
                      <th className="pb-1">Désignation</th>
                      <th className="pb-1 text-center">Qté</th>
                      <th className="pb-1 text-right">P.U. HT</th>
                      <th className="pb-1 text-right">TVA</th>
                      <th className="pb-1 text-right">Total TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationSuccess.items.map((item, idx) => {
                      const itemHT = item.total / 1.19;
                      const puHT = item.unitPrice / 1.19;
                      return (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="py-1.5 pr-2 font-bold text-slate-800">{item.productName}</td>
                          <td className="py-1.5 text-center text-slate-700">{item.quantity}</td>
                          <td className="py-1.5 text-right text-slate-700 font-mono">{puHT.toFixed(3)}</td>
                          <td className="py-1.5 text-right text-slate-700 font-mono">19%</td>
                          <td className="py-1.5 text-right font-bold text-slate-900 font-mono">{item.total.toFixed(3)} DT</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Summary Calculations */}
                <div className="flex justify-end pt-2">
                  <div className="w-48 space-y-1 text-right text-[8px] font-bold text-slate-600">
                    <div className="flex justify-between">
                      <span>Total HT :</span>
                      <span className="font-mono text-slate-800">{validationSuccess.subtotal.toFixed(3)} DT</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TVA (19%) :</span>
                      <span className="font-mono text-slate-800">{validationSuccess.tvaAmount.toFixed(3)} DT</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Timbre Fiscal :</span>
                      <span className="font-mono text-slate-800">1.000 DT</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black text-slate-900 border-t border-slate-200 pt-1.5">
                      <span>Net à Payer (TTC) :</span>
                      <span className="font-mono text-indigo-700">{(validationSuccess.totalTTC + 1.0).toFixed(3)} DT</span>
                    </div>
                  </div>
                </div>

                {/* Payments & Legal Note */}
                <div className="border-t border-dashed border-slate-300 pt-3 flex justify-between items-center">
                  <div className="text-[7px] text-slate-400">
                    <p className="font-bold text-emerald-600 uppercase tracking-wider">Facture Payée / Acquittée</p>
                    <p>Règlement : {validationSuccess.payments.map(p => `${p.method.toUpperCase()} (${p.amount.toFixed(3)} DT)`).join(' + ')}</p>
                  </div>
                  <div className="text-right text-[7px] text-slate-400">
                    <span>Logiciel Certifié Elyssa ERP</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                disabled={activePreviewTab === 'invoice' && !validationSuccess.clientId}
                onClick={() => {
                  try {
                    const printTargetId = activePreviewTab === 'invoice' ? 'pos-invoice-print' : 'pos-ticket-print';
                    const printContent = document.getElementById(printTargetId);
                    if (printContent) {
                      const clone = printContent.cloneNode(true) as HTMLElement;
                      clone.id = 'temp-print-root';
                      clone.className = 'temp-print-root ' + (printContent.className || '');
                      document.body.appendChild(clone);
                      document.body.classList.add('print-mode-active');
                      
                      setTimeout(() => {
                        try {
                          window.print();
                        } catch (e) {
                          console.error('Print error:', e);
                        } finally {
                          document.body.classList.remove('print-mode-active');
                          const tempElement = document.getElementById('temp-print-root');
                          if (tempElement) {
                            document.body.removeChild(tempElement);
                          }
                        }
                      }, 150);
                    } else {
                      window.print();
                    }
                  } catch (e) {
                    console.error('Print trigger error:', e);
                  }
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 font-bold p-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer</span>
              </button>
              <button
                type="button"
                onClick={() => setValidationSuccess(null)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 px-4 rounded-xl text-xs transition cursor-pointer"
              >
                Nouveau Ticket
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
