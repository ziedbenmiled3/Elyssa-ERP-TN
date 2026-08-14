import React, { useState, useMemo } from 'react';
import { Product, Supplier, StockMovement } from '../types';
import IframePrintHelper from './IframePrintHelper';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { 
  Package, 
  Truck, 
  History, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Edit, 
  Trash2, 
  CheckCircle,
  TrendingUp,
  X,
  FileSpreadsheet,
  Layers,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Printer,
  Sliders,
  DollarSign,
  CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StockManagerProps {
  products: Product[];
  suppliers: Supplier[];
  stockMovements: StockMovement[];
  onUpdateProducts: (products: Product[]) => void;
  onUpdateSuppliers: (suppliers: Supplier[]) => void;
  onUpdateStockMovements: (movements: StockMovement[]) => void;
  readOnly?: boolean;
  companyLocations: any[];
  onUpdateCompanyLocations: (locs: any[]) => void;
}

export default function StockManager({
  products,
  suppliers,
  stockMovements,
  onUpdateProducts,
  onUpdateSuppliers,
  onUpdateStockMovements,
  readOnly = false,
  companyLocations,
  onUpdateCompanyLocations
}: StockManagerProps) {
  // Tabs: 'products' | 'movements' | 'suppliers' | 'settings' | 'inventory'
  const [subTab, setSubTab] = useState<'products' | 'movements' | 'suppliers' | 'settings' | 'inventory'>('products');

  const saveLocations = (locs: any[]) => {
    onUpdateCompanyLocations(locs);
    localStorage.setItem('elyssa_company_locations', JSON.stringify(locs));
    window.dispatchEvent(new Event('storage'));
  };

  // Inventory states
  const [selectedInventoryLocation, setSelectedInventoryLocation] = useState<string>('all');
  const [countedStocks, setCountedStocks] = useState<Record<string, string>>({});


  // Configurable Stock Cost States
  const [holdingCostPercentage, setHoldingCostPercentage] = useState<number>(() => {
    const saved = localStorage.getItem('carthage_stock_holding_cost');
    return saved ? Number(saved) : 18; // Default 18% carrying cost
  });
  const [stockoutCostPerDay, setStockoutCostPerDay] = useState<number>(() => {
    const saved = localStorage.getItem('carthage_stock_stockout_cost');
    return saved ? Number(saved) : 25; // Default 25 TND per unit/day shortage cost
  });

  const updateHoldingCostPercentage = (val: number) => {
    setHoldingCostPercentage(val);
    localStorage.setItem('carthage_stock_holding_cost', String(val));
  };
  const updateStockoutCostPerDay = (val: number) => {
    setStockoutCostPerDay(val);
    localStorage.setItem('carthage_stock_stockout_cost', String(val));
  };

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState('All'); // 'All' | 'Low' | 'Normal'

  // Visual Stock Alert Charts States
  const [chartFilter, setChartFilter] = useState<'all' | 'critical' | 'warning'>('critical');
  const [isChartExpanded, setIsChartExpanded] = useState<boolean>(true);

  // States for printing support
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printDocName, setPrintDocName] = useState('');
  const [printDocTab, setPrintDocTab] = useState('stock');
  const [printTarget, setPrintTarget] = useState('');
  const [printTargetId, setPrintTargetId] = useState('');
  const [selectedPrintSupplier, setSelectedPrintSupplier] = useState<Supplier | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUri = params.get('id');
    if (idFromUri) {
      return suppliers.find(s => s.id === idFromUri) || null;
    }
    return null;
  });

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [newMovementProductId, setNewMovementProductId] = useState('');
  const [newMovementType, setNewMovementType] = useState<'In' | 'Out' | 'Correction'>('In');
  const [newMovementQty, setNewMovementQty] = useState<number>(0);
  const [newMovementRef, setNewMovementRef] = useState('');

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form Fields - Product
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodCategory, setProdCategory] = useState('Matières Premières');
  const [prodStock, setProdStock] = useState<number>(0);
  const [prodMinStock, setProdMinStock] = useState<number>(100);
  const [prodUnitPrice, setProdUnitPrice] = useState<number>(0);
  const [prodCostPrice, setProdCostPrice] = useState<number>(0);
  const [prodMarginPercentage, setProdMarginPercentage] = useState<number>(0);
  const [prodSupplierId, setProdSupplierId] = useState('');
  const [prodUnit, setProdUnit] = useState('Kg');
  const [prodWarehouseId, setProdWarehouseId] = useState('');
  const [prodAisle, setProdAisle] = useState('');
  const [prodShelf, setProdShelf] = useState('');
  const [prodBin, setProdBin] = useState('');

  // Form Fields - Supplier
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supCategory, setSupCategory] = useState('Matériaux');
  const [supStatus, setSupStatus] = useState<'Active' | 'Inactive'>('Active');

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Categories lists
  const productCategories = ['All', 'Matières Premières', 'Produits Finis', 'Emballages', 'Pièces de Rechange'];
  const supplierCategories = ['Matériaux', 'Chimie', 'Emballage', 'Textile', 'Logistique', 'Services'];

  // Handle Product Save (Add / Edit)
  const openProductForm = (p: Product | null) => {
    if (p) {
      setEditingProduct(p);
      setProdName(p.name);
      setProdSku(p.sku);
      setProdCategory(p.category);
      setProdStock(p.stockLevel);
      setProdMinStock(p.minStockLevel);
      setProdUnitPrice(p.unitPrice);
      setProdCostPrice(p.costPrice);
      setProdMarginPercentage(p.marginPercentage !== undefined ? p.marginPercentage : (p.costPrice > 0 ? Math.round(((p.unitPrice - p.costPrice) / p.costPrice) * 100 * 100) / 100 : 0));
      setProdSupplierId(p.supplierId);
      setProdUnit(p.unit);
      setProdWarehouseId(p.warehouseId || '');
      setProdAisle(p.aisle || '');
      setProdShelf(p.shelf || '');
      setProdBin(p.bin || '');
    } else {
      setEditingProduct(null);
      setProdName('');
      setProdSku(`PROD-${Math.floor(Math.random() * 9000) + 1000}`);
      setProdCategory('Matières Premières');
      setProdStock(0);
      setProdMinStock(100);
      setProdUnitPrice(0);
      setProdCostPrice(0);
      setProdMarginPercentage(0);
      setProdSupplierId(suppliers[0]?.id || '');
      setProdUnit('Kg');
      setProdWarehouseId(companyLocations.find(l => l.isWarehouse || l.id.includes('depot'))?.id || companyLocations[0]?.id || '');
      setProdAisle('');
      setProdShelf('');
      setProdBin('');
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodSku.trim()) {
      triggerToast('Le nom et le SKU sont requis.');
      return;
    }

    const selectedSupplier = suppliers.find(s => s.id === prodSupplierId);
    const supplierName = selectedSupplier ? selectedSupplier.name : 'Inconnu';

    if (editingProduct) {
      // Edit
      const updated = products.map(p => p.id === editingProduct.id ? {
        ...p,
        name: prodName,
        sku: prodSku,
        category: prodCategory,
        stockLevel: prodStock,
        minStockLevel: prodMinStock,
        unitPrice: prodUnitPrice,
        costPrice: prodCostPrice,
        marginPercentage: prodMarginPercentage,
        supplierId: prodSupplierId,
        supplierName,
        unit: prodUnit,
        warehouseId: prodWarehouseId,
        aisle: prodAisle,
        shelf: prodShelf,
        bin: prodBin,
      } as Product : p);

      // Log correction movement if stock was manually updated
      if (prodStock !== editingProduct.stockLevel) {
        const diff = prodStock - editingProduct.stockLevel;
        const newMov: StockMovement = {
          id: `mov_${Date.now()}`,
          productId: editingProduct.id,
          productName: prodName,
          type: 'Correction',
          quantity: Math.abs(diff),
          date: new Date().toISOString().split('T')[0],
          reference: `Correction manuelle de stock (Diff: ${diff})`,
          operator: 'Zied Ben Miled'
        };
        onUpdateStockMovements([newMov, ...stockMovements]);
      }

      onUpdateProducts(updated);
      triggerToast(`Produit "${prodName}" mis à jour avec succès.`);
    } else {
      // Add
      const newP: Product = {
        id: `prod_${Date.now()}`,
        name: prodName,
        sku: prodSku,
        category: prodCategory,
        stockLevel: prodStock,
        minStockLevel: prodMinStock,
        unitPrice: prodUnitPrice,
        costPrice: prodCostPrice,
        marginPercentage: prodMarginPercentage,
        supplierId: prodSupplierId,
        supplierName,
        unit: prodUnit,
        warehouseId: prodWarehouseId,
        aisle: prodAisle,
        shelf: prodShelf,
        bin: prodBin,
        createdDate: new Date().toISOString().split('T')[0]
      };
      
      onUpdateProducts([newP, ...products]);

      // Add movement if initial stock Level > 0
      if (prodStock > 0) {
        const newMov: StockMovement = {
          id: `mov_${Date.now()}`,
          productId: newP.id,
          productName: newP.name,
          type: 'In',
          quantity: prodStock,
          date: new Date().toISOString().split('T')[0],
          reference: 'Initialisation du stock de départ',
          operator: 'Zied Ben Miled'
        };
        onUpdateStockMovements([newMov, ...stockMovements]);
      }

      triggerToast(`Nouveau produit "${prodName}" créé.`);
    }
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`Êtes-vous certain de vouloir archiver ou supprimer le produit "${name}" ?`)) {
      onUpdateProducts(products.filter(p => p.id !== id));
      triggerToast(`Produit "${name}" a été supprimé.`);
    }
  };

  // Handle Supplier Save (Add / Edit)
  const openSupplierForm = (s: Supplier | null) => {
    if (s) {
      setEditingSupplier(s);
      setSupName(s.name);
      setSupContact(s.contactName);
      setSupEmail(s.email);
      setSupPhone(s.phone);
      setSupAddress(s.address);
      setSupCategory(s.category);
      setSupStatus(s.status);
    } else {
      setEditingSupplier(null);
      setSupName('');
      setSupContact('');
      setSupEmail('');
      setSupPhone('');
      setSupAddress('');
      setSupCategory('Matériaux');
      setSupStatus('Active');
    }
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) {
      triggerToast('Le nom du fournisseur est obligatoire.');
      return;
    }

    if (editingSupplier) {
      const updated = suppliers.map(s => s.id === editingSupplier.id ? {
        ...s,
        name: supName,
        contactName: supContact,
        email: supEmail,
        phone: supPhone,
        address: supAddress,
        category: supCategory,
        status: supStatus,
      } as Supplier : s);
      onUpdateSuppliers(updated);
      triggerToast(`Fournisseur "${supName}" mis à jour.`);
    } else {
      const newS: Supplier = {
        id: `sup_${Date.now()}`,
        name: supName,
        contactName: supContact,
        email: supEmail,
        phone: supPhone,
        address: supAddress,
        category: supCategory,
        status: supStatus,
        createdDate: new Date().toISOString().split('T')[0]
      };
      onUpdateSuppliers([newS, ...suppliers]);
      triggerToast(`Nouveau fournisseur "${supName}" enregistré.`);
    }
    setIsSupplierModalOpen(false);
  };

  const handleDeleteSupplier = (id: string, name: string) => {
    const isBound = products.some(p => p.supplierId === id);
    if (isBound) {
      alert(`Impossible de supprimer le fournisseur "${name}" car des produits y sont associés. Modifiez d'abord ces produits.`);
      return;
    }

    if (confirm(`Confirmez-vous la suppression du fournisseur "${name}" ?`)) {
      onUpdateSuppliers(suppliers.filter(s => s.id !== id));
      triggerToast(`Fournisseur "${name}" supprimé.`);
    }
  };

  // High-fidelity print handler
  const triggerPrint = (elementId: string, docName: string, activeSupplierId?: string) => {
    const isIframe = window.self !== window.top;
    if (isIframe) {
      setPrintDocName(docName);
      setPrintDocTab('stock'); // tab associated with StockManager is 'stock' in App.tsx
      setPrintTarget(elementId);
      setPrintTargetId(activeSupplierId || '');
      setIsPrintModalOpen(true);
      return;
    }

    const printContent = document.getElementById(elementId);
    if (printContent) {
      const clone = printContent.cloneNode(true) as HTMLElement;
      clone.id = 'temp-print-root';
      clone.className = 'temp-print-root ' + (printContent.className || '').replace(/\bhidden\b/g, '');
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
  };

  const triggerPrintSupplier = (sup: Supplier) => {
    setSelectedPrintSupplier(sup);
    setTimeout(() => {
      triggerPrint('printable-supplier-sheet', `Fiche Fournisseur - ${sup.name}`, sup.id);
    }, 150);
  };

  // Handle Save Stock Movement
  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const targetedProd = products.find(p => p.id === newMovementProductId);
    if (!targetedProd) {
      triggerToast('Veuillez sélectionner un produit.');
      return;
    }
    if (newMovementQty <= 0) {
      triggerToast('La quantité doit être supérieure à zéro.');
      return;
    }

    // Verify stock availability if OUT movement
    if (newMovementType === 'Out' && targetedProd.stockLevel < newMovementQty) {
      triggerToast(`Stock insuffisant. Stock disponible: ${targetedProd.stockLevel} ${targetedProd.unit}.`);
      return;
    }

    // Calculate new stock level on targeted product
    let finalStock = targetedProd.stockLevel;
    if (newMovementType === 'In') finalStock += newMovementQty;
    if (newMovementType === 'Out') finalStock -= newMovementQty;
    if (newMovementType === 'Correction') {
      finalStock = newMovementQty; // In correction, we force set the new stock level
    }

    // Record Stock Movement
    const newM: StockMovement = {
      id: `mov_${Date.now()}`,
      productId: newMovementProductId,
      productName: targetedProd.name,
      type: newMovementType,
      quantity: newMovementQty,
      date: new Date().toISOString().split('T')[0],
      reference: newMovementRef || (newMovementType === 'In' ? 'Bon de réception' : 'Prélèvement interne'),
      operator: 'Zied Ben Miled'
    };

    // Update States
    const updatedProducts = products.map(p => p.id === targetedProd.id ? {
      ...p,
      stockLevel: finalStock
    } as Product : p);

    onUpdateProducts(updatedProducts);
    onUpdateStockMovements([newM, ...stockMovements]);
    triggerToast(`Mouvement enregistré. Stock de "${targetedProd.name}" mis à jour.`);
    
    // Reset fields
    setNewMovementProductId('');
    setNewMovementQty(0);
    setNewMovementRef('');
    setIsMovementModalOpen(false);
  };

  // CSV Mass Import and Export Handlers
  const downloadCSVTemplate = () => {
    const headers = ["sku", "name", "category", "stockLevel", "minStockLevel", "costPrice", "marginPercentage", "unitPrice", "unit", "supplierName"];
    const rows = [
      ["TX-EL-50-GRS", "Fil d'Élasthanne Premium GRS", "Produits Finis", "1200", "500", "15.200", "61.18", "24.500", "Kg", "Cotonière du Nord"],
      ["CH-ET-99", "Solvant d'Ethanol Purifié 99%", "Matières Premières", "450", "600", "5.400", "62.96", "8.800", "Litre", "Tunisie Chimie Industrielle (TCI)"],
      ["EM-CO-DC", "Carton Ondulé Isolé Double Cannelure", "Emballages", "8500", "2000", "0.720", "73.61", "1.250", "Pièce", "Med Pack Sousse"],
      ["TX-CO-30", "Fil de Coton Bio Peigné Ne 30/1", "Produits Finis", "3200", "800", "10.100", "60.40", "16.200", "Kg", "Cotonière du Nord"]
    ];
    
    // We use a semicolon separator which is fully compliant with Excel French/Tunisian default settings
    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "modele_catalogue_stock.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Modèle CSV téléchargé. Remplissez-le ou mettez-le à jour dans Excel !");
  };

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          triggerToast("Le fichier importé est vide.");
          return;
        }

        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length <= 1) {
          triggerToast("Aucune donnée d'article trouvée dans le fichier.");
          return;
        }

        // Detect separator: comma or semicolon or tab
        const firstLine = lines[0];
        let separator = ';';
        if (firstLine.includes(',')) {
          separator = ',';
        } else if (firstLine.includes('\t')) {
          separator = '\t';
        }

        // Parse headers lowercased to be key-agnostic
        const rawHeaders = firstLine.split(separator).map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
        
        const getIndex = (keys: string[]) => rawHeaders.findIndex(h => keys.includes(h));
        
        const skuIndex = getIndex(['sku', 'code', 'u_sku', 'référence', 'reference', 'art_code']);
        const nameIndex = getIndex(['name', 'nom', 'designation', 'désignation', 'article', 'intitulé']);
        const categoryIndex = getIndex(['category', 'categorie', 'catégorie']);
        const stockLevelIndex = getIndex(['stocklevel', 'stock', 'quantite', 'quantité', 'stockactuel', 'en_stock']);
        const minStockLevelIndex = getIndex(['minstocklevel', 'stockmin', 'seuil', 'stock_minimum', 'alerte_stock']);
        const unitPriceIndex = getIndex(['unitprice', 'prixvente', 'pv', 'prix_vente', 'prix_unitaire']);
        const costPriceIndex = getIndex(['costprice', 'prixachat', 'pa', 'prix_achat', 'prixrevient', 'prix_revient', 'cout', 'coût']);
        const marginPercentageIndex = getIndex(['marginpercentage', 'marge', '% marge', 'margebénéficiaire', 'margebeneficiaire', '% marge bénéficiaire', '% marge beneficiaire', 'marge_bénéficiaire', 'marge_beneficiaire', '% marge bénéficière', 'marge bénéficière']);
        const unitIndex = getIndex(['unit', 'unite', 'unité', 'mesure']);
        const supplierNameIndex = getIndex(['suppliername', 'fournisseur', 'nom_fournisseur']);

        if (skuIndex === -1 || nameIndex === -1) {
          triggerToast("Les colonnes minimales requises (sku ou code, name ou désignation) sont introuvables.");
          return;
        }

        const importedProducts: Product[] = [...products];
        const newSuppliers: Supplier[] = [...suppliers];
        const newMovements: StockMovement[] = [];

        let addedCount = 0;
        let updatedCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          
          let parts: string[] = [];
          if (separator === ';') {
            parts = line.split(';').map(p => p.replace(/^["']|["']$/g, '').trim());
          } else if (separator === '\t') {
            parts = line.split('\t').map(p => p.replace(/^["']|["']$/g, '').trim());
          } else {
            // Comma split-quote safe helper
            const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            if (matches) {
              parts = matches.map(p => p.replace(/^["']|["']$/g, '').trim());
            } else {
              parts = line.split(',').map(p => p.replace(/^["']|["']$/g, '').trim());
            }
          }

          // Skip malformed rows
          if (parts.length === 0 || !parts[skuIndex]) continue;

          const sku = parts[skuIndex];
          const name = parts[nameIndex] || `Article ${sku}`;
          const category = (categoryIndex !== -1 && parts[categoryIndex]) || "Matières Premières";
          const stockLevel = parseInt((stockLevelIndex !== -1 && parts[stockLevelIndex]) || "0") || 0;
          const minStockLevel = parseInt((minStockLevelIndex !== -1 && parts[minStockLevelIndex]) || "100") || 100;
          const costPrice = parseFloat((costPriceIndex !== -1 && parts[costPriceIndex]) || "0") || 0;
          const rawMarginStr = marginPercentageIndex !== -1 && parts[marginPercentageIndex] ? parts[marginPercentageIndex].replace('%', '').trim() : '';
          let marginPercentage = rawMarginStr ? parseFloat(rawMarginStr) : undefined;
          
          let unitPrice = parseFloat((unitPriceIndex !== -1 && parts[unitPriceIndex]) || "0") || 0;
          if (marginPercentage !== undefined && !isNaN(marginPercentage)) {
            const computedPrice = costPrice * (1 + marginPercentage / 100);
            unitPrice = Math.round(computedPrice * 1000) / 1000;
          } else if (costPrice > 0 && unitPrice > 0) {
            marginPercentage = Math.round(((unitPrice - costPrice) / costPrice) * 100 * 100) / 100;
          } else {
            marginPercentage = 0;
          }
          const unit = (unitIndex !== -1 && parts[unitIndex]) || "Kg";
          const supplierName = (supplierNameIndex !== -1 && parts[supplierNameIndex]) || "";

          // Resolve supplier details and auto-create if missing
          let supplierId = "";
          let finalSupplierName = "Inconnu";
          if (supplierName) {
            let existingSupplier = newSuppliers.find(s => s.name.toLowerCase() === supplierName.toLowerCase());
            if (!existingSupplier) {
              // Create a brand new active supplier for relation safety
              const newSup: Supplier = {
                id: `sup_csv_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                name: supplierName,
                contactName: "Interlocuteur Importé",
                email: `contact@${supplierName.toLowerCase().replace(/[^a-z0-9]/g, '')}.tn`,
                phone: "--",
                address: "Créé automatiquement via Importation Catalogue CSV",
                category: "Matériaux",
                status: "Active",
                createdDate: new Date().toISOString().split('T')[0]
              };
              newSuppliers.push(newSup);
              existingSupplier = newSup;
            }
            supplierId = existingSupplier.id;
            finalSupplierName = existingSupplier.name;
          } else {
            // Fall back to first available supplier
            if (newSuppliers.length > 0) {
              supplierId = newSuppliers[0].id;
              finalSupplierName = newSuppliers[0].name;
            }
          }

          // Match by SKU to update or insert
          const existingProductIndex = importedProducts.findIndex(p => p.sku.toLowerCase() === sku.toLowerCase());

          if (existingProductIndex !== -1) {
            const oldProduct = importedProducts[existingProductIndex];
            const oldStock = oldProduct.stockLevel;
            
            importedProducts[existingProductIndex] = {
              ...oldProduct,
              name,
              category,
              stockLevel,
              minStockLevel,
              unitPrice,
              costPrice,
              marginPercentage,
              unit,
              supplierId,
              supplierName: finalSupplierName
            };

            // Log stock movement delta automatically
            if (oldStock !== stockLevel) {
              const diff = stockLevel - oldStock;
              newMovements.push({
                id: `mov_csv_${Date.now()}_${i}`,
                productId: oldProduct.id,
                productName: name,
                type: 'Correction',
                quantity: Math.abs(diff),
                date: new Date().toISOString().split('T')[0],
                reference: `MàJ simultanée Import CSV (Ancien: ${oldStock} -> Nouveau: ${stockLevel})`,
                operator: 'Zied Ben Miled (CSV)'
              });
            }
            updatedCount++;
          } else {
            // Insert new product
            const newId = `prod_csv_${Date.now()}_${i}`;
            const newProd: Product = {
              id: newId,
              sku,
              name,
              category,
              stockLevel,
              minStockLevel,
              unitPrice,
              costPrice,
              marginPercentage,
              unit,
              supplierId,
              supplierName: finalSupplierName,
              createdDate: new Date().toISOString().split('T')[0]
            };
            importedProducts.push(newProd);

            // Log initial stock as positive movement
            if (stockLevel > 0) {
              newMovements.push({
                id: `mov_csv_${Date.now()}_${i}`,
                productId: newId,
                productName: name,
                type: 'In',
                quantity: stockLevel,
                date: new Date().toISOString().split('T')[0],
                reference: 'Stock initial par import massif CSV de catalogue',
                operator: 'Zied Ben Miled (CSV)'
              });
            }
            addedCount++;
          }
        }

        // Apply bulk state updates to the context
        onUpdateProducts(importedProducts);
        if (newSuppliers.length > suppliers.length) {
          onUpdateSuppliers(newSuppliers);
        }
        if (newMovements.length > 0) {
          onUpdateStockMovements([...newMovements, ...stockMovements]);
        }

        triggerToast(`Importation réussie : ${addedCount} créés, ${updatedCount} mis à jour simultanément.`);
        event.target.value = '';
      } catch (err: any) {
        console.error(err);
        triggerToast("Format de fichier CSV incorrect ou incompatible.");
      }
    };

    reader.readAsText(file, "UTF-8");
  };

  // Filters logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    
    let matchesStatus = true;
    if (stockStatusFilter === 'Low') {
      matchesStatus = p.stockLevel <= p.minStockLevel;
    } else if (stockStatusFilter === 'Normal') {
      matchesStatus = p.stockLevel > p.minStockLevel;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredSuppliers = suppliers.filter(s => {
    return s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           s.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           s.category.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredMovements = stockMovements.filter(m => {
    return m.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           m.reference.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Calculate high level metrics
  const totalStockValue = products.reduce((acc, p) => acc + (p.stockLevel * p.costPrice), 0);
  const lowStockProductsCount = products.filter(p => p.stockLevel <= p.minStockLevel).length;
  const activeSuppliersCount = suppliers.filter(s => s.status === 'Active').length;

  // Custom high-contrast tooltip for safety stock chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isUnderThreshold = data.stockLevel <= data.minStockLevel;
      
      return (
        <div className="bg-slate-900 border border-slate-800 text-white p-3 rounded-lg shadow-xl text-xs space-y-1 font-sans">
          <p className="font-extrabold text-slate-100">{data.name}</p>
          <p className="text-slate-400 font-mono text-[9px]">SKU: {data.sku}</p>
          <div className="h-px bg-slate-800 my-1" />
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Stock Réel :</span>
            <span className={`font-mono font-bold ${isUnderThreshold ? 'text-rose-450' : 'text-emerald-400'}`}>
              {data.stockLevel.toLocaleString('fr-Fr')} {data.unit}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Seuil d'Alerte :</span>
            <span className="font-mono font-bold text-amber-400">
              {data.minStockLevel.toLocaleString('fr-Fr')} {data.unit}
            </span>
          </div>
          {isUnderThreshold ? (
            <div className="mt-1 text-center bg-rose-950/40 text-rose-300 text-[10px] p-1 rounded font-bold uppercase tracking-wider">
              Stock critique !
            </div>
          ) : (
            <div className="mt-1 text-center bg-emerald-950/40 text-emerald-300 text-[10px] p-1 rounded font-bold">
              Stock normal
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Computes the stock data points, filtered by category selection, search query, and chart toggles, limited to 15 entries for great density
  const stockChartData = useMemo(() => {
    let list = [...products];

    // Align with category filter
    if (categoryFilter !== 'All') {
      list = list.filter(p => p.category === categoryFilter);
    }

    // Align with search query
    if (searchQuery.trim() !== '') {
      list = list.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Chart filter state: "critical", "warning", or "all"
    if (chartFilter === 'critical') {
      list = list.filter(p => p.stockLevel <= p.minStockLevel);
    } else if (chartFilter === 'warning') {
      list = list.filter(p => p.stockLevel <= p.minStockLevel * 1.5);
    }

    // Map properties for Recharts and sort by critical ratio (urgency) ascending page-wise
    return list
      .map(p => {
        const ratio = p.minStockLevel > 0 ? (p.stockLevel / p.minStockLevel) : 999;
        return {
          id: p.id,
          name: p.name,
          displayName: p.name.length > 20 ? p.name.substring(0, 18) + '...' : p.name,
          sku: p.sku,
          stockLevel: p.stockLevel,
          minStockLevel: p.minStockLevel,
          unit: p.unit,
          category: p.category,
          ratio
        };
      })
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, 15);
  }, [products, categoryFilter, searchQuery, chartFilter]);

  return (
    <div id="stock-manager-container" className="space-y-6">
      
      {/* Toast Alert Popups */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-4 z-50 bg-emerald-600 text-white rounded-xl shadow-xl px-4 py-3 text-xs font-bold flex items-center space-x-2 border border-emerald-500"
          >
            <CheckCircle className="w-4 h-4 text-white" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Banner Hero */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden border border-slate-850 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center space-x-1.5 bg-indigo-500/25 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-indigo-300">
            <Package className="w-3.5 h-3.5" />
            <span>Gestion de la Supply Chain & Catalogue</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black font-display tracking-tight leading-none text-white">
            Produits par Catégories, Stocks & Fournisseurs
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
            Pilotez votre catalogue de marchandises en temps réel. Gérez l'état de vos stocks, enregistrez les flux ou les corrections d'inventaire, et suivez la base de données de vos partenaires fournisseurs.
          </p>
        </div>

        {/* Global actions */}
        {!readOnly && (
          <div className="flex flex-wrap gap-3 shrink-0">
            <button 
              onClick={() => openProductForm(null)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-3 px-4 rounded-xl text-xs flex items-center space-x-2 transition shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Produit</span>
            </button>
            <button
              onClick={() => {
                setNewMovementType('In');
                setNewMovementQty(0);
                if (products.length > 0) setNewMovementProductId(products[0].id);
                setIsMovementModalOpen(true);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold p-3 px-4 rounded-xl text-xs flex items-center space-x-2 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Mouvement de Stock</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Valeur Globale du Stock (P.A.)</span>
            <div className="text-xl font-black text-slate-900 font-mono">
              {totalStockValue.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} <span className="text-xs font-semibold text-slate-500">TND</span>
            </div>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Stock critique & Alertes</span>
            <div className="text-xl font-black text-rose-650 flex items-center space-x-2">
              <span>{lowStockProductsCount} {lowStockProductsCount > 1 ? 'Articles' : 'Article'}</span>
              {lowStockProductsCount > 0 && (
                <span className="animate-ping inline-flex h-2.5 w-2.5 rounded-full bg-red-400 opacity-75"></span>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-xl ${lowStockProductsCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Fournisseurs Actifs</span>
            <div className="text-xl font-black text-slate-900">
              {activeSuppliersCount} <span className="text-xs font-semibold text-slate-500">Sociétés</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Truck className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Tabs Selection */}
      <div className="border-b border-slate-100 flex items-center space-x-4">
        <button
          onClick={() => { setSubTab('products'); setSearchQuery(''); }}
          className={`pb-3 font-bold text-xs tracking-tight transition-all relative cursor-pointer flex items-center space-x-2 ${
            subTab === 'products' ? 'text-indigo-605' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Produits & Catégories</span>
          {subTab === 'products' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></span>
          )}
        </button>

        <button
          onClick={() => { setSubTab('movements'); setSearchQuery(''); }}
          className={`pb-3 font-bold text-xs tracking-tight transition-all relative cursor-pointer flex items-center space-x-2 ${
            subTab === 'movements' ? 'text-indigo-605' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Mouvements de Stocks</span>
          {subTab === 'movements' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></span>
          )}
        </button>

        <button
          onClick={() => { setSubTab('suppliers'); setSearchQuery(''); }}
          className={`pb-3 font-bold text-xs tracking-tight transition-all relative cursor-pointer flex items-center space-x-2 ${
            subTab === 'suppliers' ? 'text-indigo-605' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Annuaire Fournisseurs</span>
          {subTab === 'suppliers' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></span>
          )}
        </button>

        <button
          onClick={() => { setSubTab('settings'); setSearchQuery(''); }}
          className={`pb-3 font-bold text-xs tracking-tight transition-all relative cursor-pointer flex items-center space-x-2 ${
            subTab === 'settings' ? 'text-indigo-605' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Configuration Stocks</span>
          {subTab === 'settings' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></span>
          )}
        </button>

        <button
          onClick={() => { setSubTab('inventory'); setSearchQuery(''); }}
          className={`pb-3 font-bold text-xs tracking-tight transition-all relative cursor-pointer flex items-center space-x-2 ${
            subTab === 'inventory' ? 'text-indigo-605' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Inventaire Annuel</span>
          {subTab === 'inventory' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></span>
          )}
        </button>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input 
            type="text" 
            placeholder={
              subTab === 'products' ? "Rechercher un produit (SKU, Intitulé)..." :
              subTab === 'suppliers' ? "Rechercher un fournisseur..." : "Rechercher un mouvement..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
          />
        </div>

        {subTab === 'products' && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Category selection */}
            <div className="flex items-center space-x-1">
              <span className="text-[10px] font-bold text-slate-400 flex items-center space-x-1">
                <Layers className="w-3 h-3" />
                <span>Catégorie :</span>
              </span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="p-1 px-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg"
              >
                {productCategories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'All' ? 'Toutes' : cat}</option>
                ))}
              </select>
            </div>

            {/* Stock Level selection */}
            <div className="flex items-center space-x-1 border-l border-slate-100 pl-3">
              <span className="text-[10px] font-bold text-slate-400 flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Statut Stock :</span>
              </span>
              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value)}
                className="p-1 px-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="All">Tous les niveaux</option>
                <option value="Low">Critique (Alerte min)</option>
                <option value="Normal">Normal</option>
              </select>
            </div>
          </div>
        )}

        {subTab === 'suppliers' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerPrint('printable-supplier-list', `Annuaire Fournisseurs - ${filteredSuppliers.length} Partenaires`)}
              className="bg-indigo-55/60 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 font-bold p-2 px-4 rounded-xl text-xs flex items-center space-x-2 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer l'Annuaire ({filteredSuppliers.length})</span>
            </button>
            <button
              onClick={() => openSupplierForm(null)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-2 px-4 rounded-xl text-xs flex items-center space-x-2 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau Fournisseur</span>
            </button>
          </div>
        )}
      </div>

      {/* CSV Mass Import / Update Tools */}
      {subTab === 'products' && (
        <div className="bg-indigo-50/20 p-4 border border-indigo-150/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800">Mise à jour rapide & Importation de masse</h4>
              <p className="text-[11px] text-slate-500">Mettez à jour ou créez des fiches articles simultanément en important notre modèle Excel/CSV (séparateur point-virgule).</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={downloadCSVTemplate}
              className="p-2.5 px-3.5 bg-white hover:bg-slate-50 text-indigo-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Télécharger le modèle CSV</span>
            </button>
            
            <label className="p-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition cursor-pointer shadow-md inline-flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 text-white mr-1.5" />
              <span>Importer CSV complété</span>
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleCSVImport} 
                className="hidden" 
              />
            </label>
          </div>
        </div>
      )}

      {/* Visual Stock Alert Chart section */}
      {subTab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-start space-x-2.5">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 flex items-center space-x-1.5 font-display tracking-tight">
                  <span>Analyse des Niveaux de Stock Critiques & Alertes</span>
                  <span className="p-0.5 px-2 bg-rose-100 text-rose-700 text-[9px] font-extrabold rounded-full uppercase tracking-wider">
                    {products.filter(p => p.stockLevel <= p.minStockLevel).length} alertes
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">Comparez le stock réel disponible face au seuil d'alerte configuré pour pallier aux ruptures.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setChartFilter('critical')}
                  className={`p-1.5 px-2.5 text-[10px] font-extrabold rounded-lg transition-all ${
                    chartFilter === 'critical' 
                      ? 'bg-white text-rose-650 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-850'
                  }`}
                >
                  Rupture ({products.filter(p => {
                    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
                    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchesCategory && matchesSearch && p.stockLevel <= p.minStockLevel;
                  }).length})
                </button>
                <button
                  type="button"
                  onClick={() => setChartFilter('warning')}
                  className={`p-1.5 px-2.5 text-[10px] font-extrabold rounded-lg transition-all ${
                    chartFilter === 'warning' 
                      ? 'bg-white text-amber-600 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-850'
                  }`}
                >
                  Proche ({products.filter(p => {
                    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
                    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchesCategory && matchesSearch && p.stockLevel <= p.minStockLevel * 1.5;
                  }).length})
                </button>
                <button
                  type="button"
                  onClick={() => setChartFilter('all')}
                  className={`p-1.5 px-2.5 text-[10px] font-extrabold rounded-lg transition-all ${
                    chartFilter === 'all' 
                      ? 'bg-white text-indigo-700 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-850'
                  }`}
                >
                  Tous ({
                    products.filter(p => {
                      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
                      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
                      return matchesCategory && matchesSearch;
                    }).length
                  })
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsChartExpanded(!isChartExpanded)}
                className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition border border-slate-200 flex items-center justify-center text-xs font-bold gap-1 cursor-pointer"
              >
                {isChartExpanded ? 'Masquer' : 'Afficher'}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isChartExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {stockChartData.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                    <p className="font-bold text-slate-700">Aucun produit critique pour cette sélection.</p>
                    <p className="text-slate-450">Félicitations, vos niveaux d'inventaire respectent vos marges de sécurité !</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Responsive Recharts Container */}
                    <div className="h-64 sm:h-72 w-full font-sans text-[10px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={stockChartData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="displayName" 
                            stroke="#94a3b8" 
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#64748b', fontSize: 10 }}
                          />
                          <YAxis 
                            stroke="#94a3b8"
                            tickLine={false}
                            axisLine={false} 
                            tick={{ fill: '#64748b', fontSize: 10 }}
                          />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} />
                          <Legend 
                            verticalAlign="top" 
                            height={32}
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: 10, fontWeight: 700, color: '#475569' }}
                          />
                          {/* Current stock bar */}
                          <Bar 
                            name="Stock Réel Disponible" 
                            dataKey="stockLevel" 
                            radius={[4, 4, 0, 0]}
                            maxBarSize={28}
                          >
                            {stockChartData.map((entry, index) => {
                              const isLow = entry.stockLevel <= entry.minStockLevel;
                              const isWarning = entry.stockLevel <= entry.minStockLevel * 1.5;
                              // Colors: Crimson for low, Amber for warning, Indigo for standard
                              const barColor = isLow ? '#e11d48' : isWarning ? '#d97706' : '#3b82f6';
                              return <Cell key={`cell-${index}`} fill={barColor} />;
                            })}
                          </Bar>
                          {/* Alert threshold bar */}
                          <Bar 
                            name="Seuil d'Alerte (Min Stock)" 
                            dataKey="minStockLevel" 
                            fill="#cbd5e1" 
                            radius={[4, 4, 0, 0]}
                            maxBarSize={28}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Chart Legend Explanation & Action tips */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-500">
                      <div className="flex items-center space-x-3.5 flex-wrap gap-y-1">
                        <span className="font-extrabold text-slate-700">Légende :</span>
                        <span className="inline-flex items-center space-x-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
                          <span className="text-rose-700 font-bold">Rupture / Alerte critique</span>
                        </span>
                        <span className="inline-flex items-center space-x-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block"></span>
                          <span className="text-amber-700 font-bold">Alerte proche</span>
                        </span>
                        <span className="inline-flex items-center space-x-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                          <span className="text-blue-700 font-bold">Niveau adéquat</span>
                        </span>
                        <span className="inline-flex items-center space-x-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"></span>
                          <span>Seuil de sécurité (Min)</span>
                        </span>
                      </div>
                      
                      <div className="text-indigo-700 font-bold flex items-center space-x-1">
                        <span>💡 Anticipation :</span>
                        <span className="text-slate-600 font-medium">Recommandez auprès de vos fournisseurs les références rouges aujourd'hui.</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Dynamic Tabs Content Views */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        
        {/* VIEW 1: PRODUCTS TAB */}
        {subTab === 'products' && (
          <div className="overflow-x-auto">
            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs py-16 space-y-2">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-bold">Aucun produit ne correspond aux filtres.</p>
                <p className="text-slate-500">Essayez de réinitialiser vos recherches ou créez un nouveau produit.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    <th className="py-4 px-6">SKU / Code</th>
                    <th className="py-4 px-6">Nom de l'Article</th>
                    <th className="py-4 px-6">Catégorie</th>
                    <th className="py-4 px-6">Stock Actuel</th>
                    <th className="py-4 px-6 text-right">Prix Unitaire (Achat/Vente)</th>
                    <th className="py-4 px-6 text-right">Valeur du Stock</th>
                    <th className="py-4 px-6">Fournisseur</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredProducts.map(prod => {
                    const isLow = prod.stockLevel <= prod.minStockLevel;
                    const stockValue = prod.stockLevel * prod.costPrice;
                    const profitPercentage = prod.costPrice > 0 ? ((prod.unitPrice - prod.costPrice) / prod.costPrice) * 100 : 0;
                    
                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/25 transition">
                        <td className="py-4 px-6 font-mono font-bold text-indigo-650">
                          {prod.sku}
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <div className="font-bold text-slate-900">{prod.name}</div>
                            <div className="text-[10px] text-slate-400">Ajouté le: {prod.createdDate}</div>
                            {prod.warehouseId && (
                              <div className="text-[10px] text-indigo-650 font-bold mt-1.5 flex items-center gap-1 bg-indigo-50/40 p-1 px-2 rounded-md max-w-xs border border-indigo-100/30">
                                <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                                <span className="truncate">
                                  {companyLocations.find(l => l.id === prod.warehouseId)?.name || 'Dépôt'}
                                  {(prod.aisle || prod.shelf || prod.bin) && ' | '}
                                  {prod.aisle && `R:${prod.aisle}`}
                                  {prod.shelf && ` É:${prod.shelf}`}
                                  {prod.bin && ` C:${prod.bin}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="p-1 px-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-650">
                            {prod.category}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <span className={`font-mono font-black text-sm ${isLow ? 'text-rose-650 font-extrabold' : 'text-slate-800'}`}>
                              {prod.stockLevel.toLocaleString('fr-FR')} {prod.unit}
                            </span>
                            {isLow ? (
                              <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wider uppercase animate-pulse flex items-center space-x-1 border border-rose-100">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span>Alerte Stock</span>
                              </span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-bold">OK</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right font-mono">
                          <div>
                            <span className="text-slate-400">P.A: </span>
                            <strong className="text-slate-800">{prod.costPrice.toFixed(3)} TND</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">P.V: </span>
                            <strong className="text-indigo-600">{prod.unitPrice.toFixed(3)} TND</strong>
                          </div>
                          <span className="text-[10px] text-emerald-600 font-bold">+{profitPercentage.toFixed(0)}% marge</span>
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-bold text-slate-900">
                          {stockValue.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} <span className="text-[10px] text-slate-400">TND</span>
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-600">
                          {prod.supplierName}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => openProductForm(prod)}
                              className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-bold text-slate-700 flex items-center space-x-1 transition"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Modifier</span>
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
                              className="p-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded text-[11px] font-bold flex items-center space-x-1 transition"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* VIEW 2: MOVEMENTS TAB */}
        {subTab === 'movements' && (
          <div className="overflow-x-auto">
            {filteredMovements.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs py-16 space-y-2">
                <History className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-bold">Aucun mouvement de stock enregistré.</p>
                <p className="text-slate-500">Utilisez le bouton en haut à droite pour enregistrer une entrée ou une sortie.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Produit concerné</th>
                    <th className="py-4 px-6">Type</th>
                    <th className="py-4 px-6 text-right">Quantité</th>
                    <th className="py-4 px-6">Référence / Objet</th>
                    <th className="py-4 px-6">Opérateur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredMovements.map(m => {
                    const isIncoming = m.type === 'In';
                    const isOutgoing = m.type === 'Out';
                    
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/25 transition">
                        <td className="py-4 px-6 font-mono font-bold text-slate-500">
                          {m.date}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {m.productName}
                        </td>
                        <td className="py-4 px-6">
                          {isIncoming && (
                            <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 p-1 px-2.5 rounded-full font-bold text-[10px] uppercase tracking-wider">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>Entrée / Log</span>
                            </span>
                          )}
                          {isOutgoing && (
                            <span className="inline-flex items-center space-x-1 bg-rose-50 text-rose-700 p-1 px-2.5 rounded-full font-bold text-[10px] uppercase tracking-wider">
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                              <span>Sortie / Livr</span>
                            </span>
                          )}
                          {m.type === 'Correction' && (
                            <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-700 p-1 px-2.5 rounded-full font-bold text-[10px] uppercase tracking-wider">
                              <RefreshCw className="w-3 h-3" />
                              <span>Correction</span>
                            </span>
                          )}
                        </td>
                        <td className={`py-4 px-6 text-right font-mono font-black text-sm ${isIncoming ? 'text-emerald-700' : isOutgoing ? 'text-rose-650' : 'text-amber-600'}`}>
                          {isIncoming ? '+' : isOutgoing ? '-' : ''}{m.quantity.toLocaleString('fr-FR')}
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-600">
                          {m.reference}
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                          {m.operator}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* VIEW 3: SUPPLIERS TAB */}
        {subTab === 'suppliers' && (
          <div className="overflow-x-auto">
            {filteredSuppliers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs py-16 space-y-2">
                <Truck className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-bold">Aucun partenaire fournisseur enregistré.</p>
                <p className="text-slate-500">Ajoutez votre premier fournisseur de matières premières.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    <th className="py-4 px-6">Société / Raison</th>
                    <th className="py-4 px-6">Catégorie</th>
                    <th className="py-4 px-6">Contact Principal</th>
                    <th className="py-4 px-6">Adresse Établissement</th>
                    <th className="py-4 px-6">Statut</th>
                    <th className="py-4 px-6 text-center">Nombre Produits</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredSuppliers.map(sup => {
                    const countProducts = products.filter(p => p.supplierId === sup.id).length;
                    const isActive = sup.status === 'Active';
                    
                    return (
                      <tr key={sup.id} className="hover:bg-slate-50/25 transition">
                        <td className="py-4 px-6">
                          <div>
                            <div className="font-black text-slate-900 text-sm">{sup.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">Enregistré le: {sup.createdDate}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="p-1 px-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-650">
                            {sup.category}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="font-bold text-slate-800">{sup.contactName}</div>
                            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-mono">
                              <Phone className="w-3 h-3 shrink-0" />
                              <span>{sup.phone}</span>
                            </div>
                            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-mono">
                              <Mail className="w-3 h-3 shrink-0" />
                              <span>{sup.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 max-w-xs truncate text-slate-500 font-semibold">
                          <div className="flex items-start space-x-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                            <span className="whitespace-normal leading-normal">{sup.address}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {isActive ? (
                            <span className="bg-emerald-50 text-emerald-700 p-1 px-2.5 rounded-full font-bold text-[9px] uppercase tracking-wider border border-emerald-100">Actif</span>
                          ) : (
                            <span className="bg-slate-100 text-slate-450 p-1 px-2.5 rounded-full font-bold text-[9px] uppercase tracking-wider">Inactif</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center font-mono font-bold text-slate-900 text-sm">
                          {countProducts} {countProducts > 1 ? 'fiches' : 'fiche'}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => triggerPrintSupplier(sup)}
                              className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-150 rounded text-[11px] font-bold text-indigo-700 flex items-center space-x-1 transition cursor-pointer"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Imprimer</span>
                            </button>
                            <button
                              onClick={() => openSupplierForm(sup)}
                              className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-bold text-slate-700 flex items-center space-x-1 transition"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Modifier</span>
                            </button>
                            <button
                              onClick={() => handleDeleteSupplier(sup.id, sup.name)}
                              className="p-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded text-[11px] font-bold flex items-center space-x-1 transition"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {subTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1">
            {/* Carrying and Shortage Costs */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <h3 className="text-sm font-black text-slate-900 border-b pb-2 flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                <span>Paramètres des Coûts Logistiques & de Stockage</span>
              </h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Configurez les paramètres financiers pour l'analyse des coûts de détention et d'opportunité en cas de rupture de stock (Stockout).
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5 font-mono">
                  <label className="text-[10.5px] font-sans font-extrabold text-slate-500 block">Taux de Détention Annuel (%) :</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="100"
                      value={holdingCostPercentage}
                      onChange={(e) => updateHoldingCostPercentage(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                  </div>
                </div>
                <div className="space-y-1.5 font-mono">
                  <label className="text-[10.5px] font-sans font-extrabold text-slate-500 block">Coût de Rupture /Jour /Unité :</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={stockoutCostPerDay}
                      onChange={(e) => updateStockoutCostPerDay(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pl-12 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">TND</span>
                  </div>
                </div>
              </div>

              {/* Financial Metrics Live Preview */}
              {(() => {
                const totalStockValue = products.reduce((acc, p) => acc + (p.stockLevel * p.costPrice), 0);
                const estimatedAnnualHoldingCost = totalStockValue * (holdingCostPercentage / 100);
                const lowStockItems = products.filter(p => p.stockLevel < p.minStockLevel);
                const totalEstimatedDailyShortageRisk = lowStockItems.reduce((acc, p) => acc + ((p.minStockLevel - p.stockLevel) * stockoutCostPerDay), 0);

                return (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3.5 mt-2">
                    <span className="text-[10.5px] font-black uppercase tracking-wider text-indigo-700 block">Simulation Financière Elyssa ERP</span>
                    <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                      <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-150">
                        <span className="text-slate-400 text-[9.5px] uppercase block">Valeur Globale du Stock :</span>
                        <span className="text-sm font-black font-mono text-slate-900">{totalStockValue.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND</span>
                      </div>
                      <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-150">
                        <span className="text-slate-400 text-[9.5px] uppercase block">Coût de Détention Annuel :</span>
                        <span className="text-sm font-black font-mono text-rose-600">{estimatedAnnualHoldingCost.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND</span>
                      </div>
                    </div>
                    {lowStockItems.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs space-y-1">
                        <span className="text-amber-800 font-extrabold flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Risque de Rupture Actuel ({lowStockItems.length} articles)</span>
                        </span>
                        <p className="text-amber-700 text-[10.5px] leading-normal font-semibold">
                          Le coût estimé de pénalité / d'opportunité en cas de non-réapprovisionnement immédiat s'élève à <strong className="font-mono">{totalEstimatedDailyShortageRisk.toLocaleString('fr-FR')} TND</strong> par jour de rupture.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Default Category Minimum Alerts */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <h3 className="text-sm font-black text-slate-900 border-b pb-2 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-indigo-650" />
                <span>Seuils d'Alerte de Stock minimal par catégorie</span>
              </h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Configurez et appliquez automatiquement des seuils minimaux de réapprovisionnement pour vos articles selon leur famille.
              </p>
              
              {/* Table or list to quickly inspect categories and update min stocks */}
              <div className="space-y-3 pt-1">
                {productCategories.filter(cat => cat !== 'All').map((cat) => {
                  const itemsCount = products.filter(p => p.category === cat).length;
                  const avgMinStock = itemsCount > 0 
                    ? Math.round(products.filter(p => p.category === cat).reduce((acc, p) => acc + p.minStockLevel, 0) / itemsCount)
                    : 100;

                  return (
                    <div key={cat} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-150 rounded-xl">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black text-slate-800 block">{cat}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{itemsCount} articles répertoriés</span>
                      </div>
                      <div className="flex items-center space-x-2 font-mono">
                        <span className="text-[10px] text-slate-400 font-sans font-bold">Seuil Moyen :</span>
                        <input
                          type="number"
                          value={avgMinStock}
                          onChange={(e) => {
                            const newMin = Number(e.target.value);
                            const updated = products.map(p => {
                              if (p.category === cat) {
                                  return { ...p, minStockLevel: newMin };
                              }
                              return p;
                            });
                            onUpdateProducts(updated);
                          }}
                          className="w-20 p-1.5 bg-white border border-slate-200 rounded text-center text-xs font-extrabold text-indigo-650 outline-none"
                        />
                        <span className="text-[10px] text-slate-400 font-sans font-bold">unités</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-indigo-600/70 leading-relaxed font-semibold">
                * Note : La modification d'un seuil moyen mettra à jour en cascade la quantité d'alerte minimale pour tous les articles appartenant à cette famille de produits.
              </p>
            </div>
          </div>
        )}

        {/* VIEW 5: ANNUAL INVENTORY TAB */}
        {subTab === 'inventory' && (
          <div className="p-6 space-y-6">
            
            {/* INVENTORY HEADER SUMMARY BAR */}
            {(() => {
              const inventoryProducts = products.filter(p => selectedInventoryLocation === 'all' || p.warehouseId === selectedInventoryLocation);
              
              // Discrepancy analytics
              const countedItems = Object.keys(countedStocks).filter(pid => countedStocks[pid] !== '' && inventoryProducts.some(p => p.id === pid));
              let totalDiscrepancyQty = 0;
              let totalDiscrepancyValue = 0;
              
              countedItems.forEach(pid => {
                const prod = products.find(p => p.id === pid);
                if (prod) {
                  const physicalQty = parseInt(countedStocks[pid]) || 0;
                  const diff = physicalQty - prod.stockLevel;
                  totalDiscrepancyQty += diff;
                  totalDiscrepancyValue += diff * prod.costPrice;
                }
              });

              return (
                <div className="space-y-4">
                  
                  {/* UPPER CONFIG BAR */}
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                        <CheckSquare className="w-5 h-5 animate-bounce" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Inventaire de Fin d'Année Elyssa ERP</h3>
                        <p className="text-[11px] text-slate-400 font-medium">Reconciliation physique par rayon et étagère des dépôts.</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center space-x-2 text-xs font-semibold">
                        <span className="text-slate-550 font-sans">Filtrer par Dépôt :</span>
                        <select
                          value={selectedInventoryLocation}
                          onChange={(e) => {
                            setSelectedInventoryLocation(e.target.value);
                            setCountedStocks({}); // Clear counts on switch to avoid confusion
                          }}
                          className="bg-white border border-slate-200 text-xs rounded-lg p-2 font-bold text-slate-800 outline-none"
                        >
                          <option value="all">-- Tous les sites --</option>
                          {companyLocations.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => triggerPrint('printable-inventory-sheet', `Feuille de Comptage - ${new Date().getFullYear()}`)}
                        className="p-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition cursor-pointer"
                      >
                        <Printer className="w-4 h-4 text-slate-500" />
                        <span>Fiche de Comptage Vierge</span>
                      </button>
                    </div>
                  </div>

                  {/* LOWER LIVE STATS BANNER */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-1">
                      <span className="text-slate-450 text-[9.5px] uppercase block font-black font-sans tracking-wide">Avancement Comptage</span>
                      <div className="text-sm font-black text-slate-800 font-mono">
                        {countedItems.length} <span className="text-slate-400 text-xs font-sans font-medium">/ {inventoryProducts.length} articles saisis</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-1">
                      <span className="text-slate-450 text-[9.5px] uppercase block font-black font-sans tracking-wide">Écart Quantités</span>
                      <div className={`text-sm font-black font-mono ${totalDiscrepancyQty === 0 ? 'text-slate-650' : totalDiscrepancyQty > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {totalDiscrepancyQty > 0 ? `+${totalDiscrepancyQty}` : totalDiscrepancyQty} <span className="text-slate-400 text-xs font-sans font-medium">unités</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-1">
                      <span className="text-slate-450 text-[9.5px] uppercase block font-black font-sans tracking-wide">Valorisation Écart Global</span>
                      <div className={`text-sm font-black font-mono ${totalDiscrepancyValue === 0 ? 'text-slate-650' : totalDiscrepancyValue > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {totalDiscrepancyValue > 0 ? '+' : ''}{totalDiscrepancyValue.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND
                      </div>
                    </div>
                  </div>

                  {/* INTERACTIVE COMPTAGE LIST TABLE */}
                  <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white mt-4">
                    {inventoryProducts.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                        <Package className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="font-bold">Aucun article n'est affecté à cet emplacement.</p>
                        <p className="text-slate-400">Pour classifier un article, éditez-le et spécifiez son dépôt.</p>
                      </div>
                    ) : (
                      <>
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50/70 border-b border-slate-150 text-[9.5px] font-extrabold uppercase tracking-wider text-slate-450">
                              <th className="py-3 px-4">Classification (Rayon / Étagère / Casier)</th>
                              <th className="py-3 px-4">SKU Code</th>
                              <th className="py-3 px-4">Désignation Produit</th>
                              <th className="py-3 px-4 text-right">Stock Système (Théorique)</th>
                              <th className="py-3 px-4 text-center w-40">Stock Physique Saisi</th>
                              <th className="py-3 px-4 text-right">Écart</th>
                              <th className="py-3 px-4 text-right">Écart Valorisé</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-sans">
                            {inventoryProducts
                              .slice()
                              .sort((a, b) => {
                                // Sort by aisle, shelf, bin for logical physical path walking!
                                const strA = `${a.aisle || 'ZZ'}-${a.shelf || 'ZZ'}-${a.bin || 'ZZ'}`;
                                const strB = `${b.aisle || 'ZZ'}-${b.shelf || 'ZZ'}-${b.bin || 'ZZ'}`;
                                return strA.localeCompare(strB);
                              })
                              .map(prod => {
                                const theoretical = prod.stockLevel;
                                const isCounted = countedStocks[prod.id] !== undefined && countedStocks[prod.id] !== '';
                                const physical = isCounted ? (parseInt(countedStocks[prod.id]) || 0) : theoretical;
                                const diff = physical - theoretical;
                                const valDiff = diff * prod.costPrice;

                                return (
                                  <tr key={prod.id} className={`hover:bg-slate-50/25 transition-colors ${isCounted ? 'bg-indigo-50/15' : ''}`}>
                                    <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-slate-650">
                                      {prod.aisle || prod.shelf || prod.bin ? (
                                        <div className="flex items-center space-x-1.5">
                                          <span className="bg-slate-100 p-1 px-1.5 rounded text-slate-600 font-extrabold text-[10px]">
                                            R: {prod.aisle || '-'}
                                          </span>
                                          <span className="bg-slate-100 p-1 px-1.5 rounded text-slate-600 font-extrabold text-[10px]">
                                            É: {prod.shelf || '-'}
                                          </span>
                                          <span className="bg-slate-100 p-1 px-1.5 rounded text-slate-600 font-extrabold text-[10px]">
                                            C: {prod.bin || '-'}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-slate-400 italic font-sans font-medium">Non classifié</span>
                                      )}
                                    </td>
                                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-650">{prod.sku}</td>
                                    <td className="py-3.5 px-4">
                                      <div className="font-bold text-slate-900">{prod.name}</div>
                                      <div className="text-[10px] text-slate-400 font-medium">Coût Unitaire : {prod.costPrice.toFixed(3)} TND</div>
                                    </td>
                                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-600">
                                      {theoretical} <span className="text-[10px] text-slate-400 font-sans font-medium">{prod.unit}</span>
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                      <div className="inline-flex items-center space-x-1 font-mono">
                                        <input
                                          type="number"
                                          min="0"
                                          placeholder={theoretical.toString()}
                                          value={countedStocks[prod.id] || ''}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setCountedStocks(prev => ({
                                              ...prev,
                                              [prod.id]: val
                                            }));
                                          }}
                                          className="w-20 p-1 bg-white border border-slate-200 rounded text-center text-xs font-black text-slate-800 outline-none focus:border-indigo-500"
                                        />
                                        <span className="text-[10px] text-slate-400 font-sans font-bold">{prod.unit}</span>
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-4 text-right font-mono font-black">
                                      {!isCounted ? (
                                        <span className="text-slate-400">-</span>
                                      ) : diff === 0 ? (
                                        <span className="text-emerald-600 font-extrabold">Juste</span>
                                      ) : diff > 0 ? (
                                        <span className="text-emerald-600">+{diff}</span>
                                      ) : (
                                        <span className="text-rose-600">{diff}</span>
                                      )}
                                    </td>
                                    <td className="py-3.5 px-4 text-right font-mono font-black">
                                      {!isCounted ? (
                                        <span className="text-slate-400">-</span>
                                      ) : valDiff === 0 ? (
                                        <span className="text-slate-400">0.000 TND</span>
                                      ) : valDiff > 0 ? (
                                        <span className="text-emerald-600 font-extrabold">+{valDiff.toFixed(3)} TND</span>
                                      ) : (
                                        <span className="text-rose-600 font-extrabold">{valDiff.toFixed(3)} TND</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>

                        {/* SUBMIT BUTTON BAR */}
                        <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-between items-center text-xs">
                          <p className="text-slate-450 leading-relaxed max-w-lg font-medium">
                            * En enregistrant et validant, Elyssa ERP mettra à jour en cascade la fiche des stocks physiques et générera automatiquement des mouvements correctifs comptabilisés.
                          </p>

                          <button
                            type="button"
                            onClick={() => {
                              const itemsCounted = Object.keys(countedStocks).filter(pid => countedStocks[pid] !== '');
                              if (itemsCounted.length === 0) {
                                triggerToast("Veuillez saisir au moins une quantité physique d'inventaire.");
                                return;
                              }

                              if (confirm(`Voulez-vous valider et rapprocher les stocks de fin d'année pour ${itemsCounted.length} articles ?`)) {
                                let correctedList = [...products];
                                let addedMovements = [...stockMovements];

                                itemsCounted.forEach(pid => {
                                  const prod = correctedList.find(p => p.id === pid);
                                  if (prod) {
                                    const physicalQty = parseInt(countedStocks[pid]) || 0;
                                    const diff = physicalQty - prod.stockLevel;

                                    if (diff !== 0) {
                                      // Correct product stock level
                                      correctedList = correctedList.map(p => p.id === pid ? {
                                        ...p,
                                        stockLevel: physicalQty
                                      } : p);

                                      // Log automatic Correction movement
                                      const autoMov: StockMovement = {
                                        id: `mov_inv_${Date.now()}_${pid}`,
                                        productId: pid,
                                        productName: prod.name,
                                        type: 'Correction',
                                        quantity: Math.abs(diff),
                                        date: new Date().toISOString().split('T')[0],
                                        reference: `Rapprochement d'inventaire annuel de fin d'année (Ecart: ${diff})`,
                                        operator: 'Zied Ben Miled (Dir. Logistique)'
                                      };
                                      addedMovements = [autoMov, ...addedMovements];
                                    }
                                  }
                                });

                                onUpdateProducts(correctedList);
                                onUpdateStockMovements(addedMovements);
                                triggerToast("Rapprochement d'inventaire annuel validé et enregistré ! Les mouvements de correction ont été générés.");
                                setCountedStocks({}); // Clear input form on success
                              }
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black p-3 px-6 rounded-xl transition cursor-pointer flex items-center space-x-1"
                          >
                            <CheckSquare className="w-4 h-4" />
                            <span>Rapprocher & Valider l'Inventaire ({countedItems.length})</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

      </div>

      {/* POPUP 1: ADD/EDIT PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between col-span-2">
              <h3 className="font-black font-display text-slate-900 text-base">
                {editingProduct ? 'Modifier la Fiche Article' : 'Créer une Fiche Article'}
              </h3>
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Désignation du Produit / Article</label>
                  <input 
                    type="text" 
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="ex: Fil d'Élasthanne Recyclé GRS 40D"
                    className="w-full text-xs p-2.5"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">SKU / Code Technique</label>
                  <input 
                    type="text" 
                    required
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    placeholder="ex: TX-EL-40-GRS"
                    className="w-full text-xs p-2.5 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Unité de mesure</label>
                  <select 
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    className="w-full text-xs p-2.5 font-semibold"
                  >
                    <option value="Kg">Kilogramme (Kg)</option>
                    <option value="Litre">Litre (L)</option>
                    <option value="Pièce">Pièce (Pce)</option>
                    <option value="Tonne">Tonne (T)</option>
                    <option value="Mètre">Mètre (m)</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Catégorie Métier</label>
                  <select 
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full text-xs p-2.5 font-semibold"
                  >
                    <option value="Matières Premières">Matières Premières</option>
                    <option value="Produits Finis">Produits Finis</option>
                    <option value="Emballages">Emballages</option>
                    <option value="Pièces de Rechange">Pièces de Rechange</option>
                  </select>
                </div>

                <div className="col-span-2 grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Prix d'achat (HT TND)</label>
                    <input 
                      type="number" 
                      step="0.001"
                      min="0"
                      required
                      value={prodCostPrice}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setProdCostPrice(val);
                        const computed = val * (1 + prodMarginPercentage / 100);
                        setProdUnitPrice(Math.round(computed * 1000) / 1000);
                      }}
                      className="w-full text-xs p-2.5 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">% Marge Bénéficiaire</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        step="0.01"
                        min="-100"
                        value={prodMarginPercentage}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setProdMarginPercentage(val);
                          const computed = prodCostPrice * (1 + val / 100);
                          setProdUnitPrice(Math.round(computed * 1000) / 1000);
                        }}
                        className="w-full text-xs p-2.5 pr-8 font-mono"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Prix de Vente (TND)</label>
                    <input 
                      type="number" 
                      step="0.001"
                      min="0"
                      required
                      value={prodUnitPrice}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setProdUnitPrice(val);
                        if (prodCostPrice > 0) {
                          const calculatedMargin = ((val - prodCostPrice) / prodCostPrice) * 100;
                          setProdMarginPercentage(Math.round(calculatedMargin * 100) / 100);
                        }
                      }}
                      className="w-full text-xs p-2.5 font-mono"
                    />
                  </div>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Fournisseur d'Approvisionnement principal</label>
                  <select 
                    value={prodSupplierId}
                    onChange={(e) => setProdSupplierId(e.target.value)}
                    className="w-full text-xs p-2.5 font-semibold"
                  >
                    <option value="">-- Sélectionner un fournisseur --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Stock Initial</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(parseInt(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455 block">Seuil d'Alerte (Stock Min)</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={prodMinStock}
                    onChange={(e) => setProdMinStock(parseInt(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 font-mono border-rose-100"
                  />
                </div>

                {/* Physical Warehouse and Classification */}
                <div className="col-span-2 border-t border-slate-100 pt-3 mt-1 space-y-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 block">Localisation & Classification Physique</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Entrepôt / Dépôt de Stockage</label>
                      <select 
                        value={prodWarehouseId}
                        onChange={(e) => setProdWarehouseId(e.target.value)}
                        className="w-full text-xs p-2.5 font-semibold bg-white border border-slate-200 rounded-lg"
                      >
                        <option value="">-- Non Affecté / Sans dépôt --</option>
                        {companyLocations.map(loc => {
                          const isWH = loc.isWarehouse || loc.id.includes('depot') || loc.id.includes('warehouse') || loc.name.toLowerCase().includes('dépôt') || loc.name.toLowerCase().includes('entrepôt');
                          return (
                            <option key={loc.id} value={loc.id}>
                              {loc.name} {isWH ? '(Dépôt)' : '(Succursale)'}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455 block">Rayon (Aisle)</label>
                      <input 
                        type="text" 
                        value={prodAisle}
                        onChange={(e) => setProdAisle(e.target.value)}
                        placeholder="ex: Rayon A-1"
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455 block">Étagère (Shelf)</label>
                      <input 
                        type="text" 
                        value={prodShelf}
                        onChange={(e) => setProdShelf(e.target.value)}
                        placeholder="ex: Niveau 3"
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-semibold"
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455 block">Casier / Emplacement (Bin / Slot)</label>
                      <input 
                        type="text" 
                        value={prodBin}
                        onChange={(e) => setProdBin(e.target.value)}
                        placeholder="ex: Casier B-42"
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-2.5 px-4 rounded-xl text-xs"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-2.5 px-6 rounded-xl text-xs flex items-center space-x-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Enregistrer l'Article</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* POPUP 2: MANUAL MOVEMENT MODAL */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black font-display text-slate-900 text-base">
                Enregistrer un flux d'inventaire
              </h3>
              <button 
                onClick={() => setIsMovementModalOpen(false)}
                className="p-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="p-6 space-y-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Article concerné</label>
                  <select 
                    value={newMovementProductId}
                    onChange={(e) => setNewMovementProductId(e.target.value)}
                    className="w-full text-xs p-2.5 font-semibold"
                    required
                  >
                    <option value="">-- Sélectionner un produit --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} [{p.sku}] - Stock actuel: {p.stockLevel} {p.unit}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Type de Flux</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewMovementType('In')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        newMovementType === 'In'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'border-slate-200 text-slate-500 bg-slate-50'
                      }`}
                    >
                      Entrée (+)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMovementType('Out')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        newMovementType === 'Out'
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : 'border-slate-200 text-slate-500 bg-slate-50'
                      }`}
                    >
                      Sortie (-)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMovementType('Correction')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        newMovementType === 'Correction'
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : 'border-slate-200 text-slate-500 bg-slate-50'
                      }`}
                    >
                      Correction (=)
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">
                    {newMovementType === 'Correction' ? 'Nouveau Niveau Forcé' : 'Quantité du flux'}
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={newMovementQty}
                    onChange={(e) => setNewMovementQty(parseInt(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Référence Technique / Note commerciale</label>
                  <input 
                    type="text" 
                    required
                    placeholder="ex: BL-894 / Prélèvement client"
                    value={newMovementRef}
                    onChange={(e) => setNewMovementRef(e.target.value)}
                    className="w-full text-xs p-2.5"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-2.5 px-4 rounded-xl text-xs"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-2.5 px-6 rounded-xl text-xs"
                >
                  Valider le mouvement
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* POPUP 3: ADD/EDIT SUPPLIER MODAL */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between col-span-2">
              <h3 className="font-black font-display text-slate-900 text-base">
                {editingSupplier ? 'Modifier la Fiche Fournisseur' : 'Enregistrer un nouveau Fournisseur'}
              </h3>
              <button 
                onClick={() => setIsSupplierModalOpen(false)}
                className="p-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Raison Sociale / Société</label>
                  <input 
                    type="text" 
                    required
                    value={supName}
                    onChange={(e) => setSupName(e.target.value)}
                    placeholder="ex: Tunisie Chimie Industrielle (TCI)"
                    className="w-full text-xs p-2.5"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Interlocuteur Principal</label>
                  <input 
                    type="text" 
                    required
                    value={supContact}
                    onChange={(e) => setSupContact(e.target.value)}
                    placeholder="ex: M. Hédi Boussaid"
                    className="w-full text-xs p-2.5"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Catégorie d'activité</label>
                  <select 
                    value={supCategory}
                    onChange={(e) => setSupCategory(e.target.value)}
                    className="w-full text-xs p-2.5 font-semibold"
                  >
                    {supplierCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455 block">Ligne Téléphonique</label>
                  <input 
                    type="text" 
                    required
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    placeholder="+216 ..."
                    className="w-full text-xs p-2.5 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455 block">Courrier Électronique</label>
                  <input 
                    type="email" 
                    required
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    placeholder="contact@fournisseur.tn"
                    className="w-full text-xs p-2.5 font-mono"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Adresse de Retrait / Siège</label>
                  <input 
                    type="text" 
                    required
                    value={supAddress}
                    onChange={(e) => setSupAddress(e.target.value)}
                    placeholder="ex: GP1 Route du Sud, Sfax, Tunisie"
                    className="w-full text-xs p-2.5"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Statut du Partenaire</label>
                  <select 
                    value={supStatus}
                    onChange={(e) => setSupStatus(e.target.value as 'Active' | 'Inactive')}
                    className="w-full text-xs p-2.5 font-semibold"
                  >
                    <option value="Active">Actif / Conventionné</option>
                    <option value="Inactive">Inactif / Suspendu</option>
                  </select>
                </div>
              </div>

               <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-2.5 px-4 rounded-xl text-xs"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-2.5 px-6 rounded-xl text-xs flex items-center space-x-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Enregistrer</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ==================== PRINT TEMPLATES (SCREEN HIDDEN, PRINT VISIBLE) ==================== */}

      {/* 1. Printed Supplier Fiche */}
      {selectedPrintSupplier && (
        <div id="printable-supplier-sheet" className="hidden">
          <div className="p-8 bg-white text-slate-900 space-y-6">
            {/* Header */}
            <div className="border-b-2 border-indigo-600 pb-4 flex justify-between items-center">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">CARTHAGE CRM - FICHE FOURNISSEUR</h1>
                <p className="text-[10px] text-slate-400 font-mono">ID Partenaire : {selectedPrintSupplier.id} — Document interne confidentiel — Généré le {new Date().toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="text-right">
                <span className="p-1 px-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-extrabold text-[10px] uppercase font-mono">
                  {selectedPrintSupplier.category}
                </span>
              </div>
            </div>

            {/* Profile Summary */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50 border border-slate-150 p-4 rounded-xl text-xs">
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-800 border-b pb-1">Identité de l'Entreprise</h3>
                <p><strong>Raison Sociale :</strong> <span className="font-bold text-slate-900 text-sm">{selectedPrintSupplier.name}</span></p>
                <p><strong>Catégorie d'Activité :</strong> {selectedPrintSupplier.category}</p>
                <p><strong>Statut Operationnel :</strong> {selectedPrintSupplier.status === 'Active' ? 'Actif / Conventionné' : 'Suspendu / En veille'}</p>
              </div>
              <div className="space-y-1.5 border-l pl-4 border-slate-250">
                <h3 className="text-xs font-bold text-slate-800 border-b pb-1">Coordonnées Partenaire</h3>
                <p><strong>Responsable principal :</strong> {selectedPrintSupplier.contactName || "Non renseigné"}</p>
                <p><strong>E-mail d'Assistance :</strong> {selectedPrintSupplier.email || "Non renseigné"}</p>
                <p><strong>Téléphone direct :</strong> <span className="font-mono">{selectedPrintSupplier.phone || "Non renseigné"}</span></p>
                <p><strong>Adresse d'Enlèvement :</strong> {selectedPrintSupplier.address || "Non renseigné"}</p>
              </div>
            </div>

            {/* Catalog of Associated Products */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Catalogue Articles Liés & Sous-traités (
                {products.filter(p => p.supplierId === selectedPrintSupplier.id).length}
                )
              </h3>
              {products.filter(p => p.supplierId === selectedPrintSupplier.id).length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg">Aucun article catalogué pour ce fournisseur.</p>
              ) : (
                <div className="border border-slate-150 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-250 text-slate-505 font-bold uppercase tracking-wider text-[9px]">
                        <th className="p-3">Référence SKU</th>
                        <th className="p-3">Désignation</th>
                        <th className="p-3">Catégorie</th>
                        <th className="p-3 text-right">Prix Achat unitaire</th>
                        <th className="p-3 text-right">Seuil d'Alerte</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 bg-white">
                      {products
                        .filter(p => p.supplierId === selectedPrintSupplier.id)
                        .map(p => (
                          <tr key={p.id}>
                            <td className="p-3 font-mono font-bold text-indigo-700">{p.sku}</td>
                            <td className="p-3 font-semibold text-slate-800">{p.name}</td>
                            <td className="p-3 text-slate-500">{p.category}</td>
                            <td className="p-3 text-right font-mono font-bold text-slate-700">{p.costPrice ? `${p.costPrice.toLocaleString('fr-FR')} TND` : '-'}</td>
                            <td className="p-3 text-right font-mono text-slate-400">{p.minStockLevel} unités</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Note & Conditions */}
            <div className="space-y-1.5 pt-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Clauses logistiques & Conditions de Paiement</h3>
              <p className="text-xs text-slate-500 italic leading-relaxed">
                Les conditions de règlement, de livraison et d'enlèvement d'usine sont soumises à la Charte Qualité Elyssa CRM. Toute altération sur les délais ou les prix convenus doit faire l'objet d'un avenant commercial signé par les deux directions.
              </p>
            </div>

            {/* Page Footer for print */}
            <div className="pt-12 text-center text-[10px] text-slate-400 border-t border-dashed mt-auto">
              <p>Elyssa CRM - Direction de la Logistique & de la Chaîne d'Approvisionnement</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Printed Supplier List */}
      <div id="printable-supplier-list" className="hidden">
        <div className="p-8 bg-white text-slate-900 space-y-6">
          {/* Header */}
          <div className="border-b-2 border-indigo-600 pb-4 flex justify-between items-center text-slate-800">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">ELYSSA ERP - ANNUAIRE DES FOURNISSEURS</h1>
              <p className="text-[10px] text-slate-400 font-mono">Annuaire Professionnel — Généré le {new Date().toLocaleDateString('fr-FR')}</p>
            </div>
            <div className="text-right">
              <span className="font-extrabold text-xs text-slate-550 font-mono">
                Total : {suppliers.length} fournisseurs conventionnés
              </span>
            </div>
          </div>

          {/* Table Listing */}
          <div className="border border-slate-150 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                  <th className="p-3">Raison Sociale</th>
                  <th className="p-3">Interlocuteur</th>
                  <th className="p-3">Catégorie</th>
                  <th className="p-3">Coordonnées Téléphoniques & Mail</th>
                  <th className="p-3">Adresse / Siège</th>
                  <th className="p-3 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 bg-white">
                {suppliers.map(sup => (
                  <tr key={sup.id}>
                    <td className="p-3 font-bold text-slate-800">{sup.name}</td>
                    <td className="p-3 text-slate-650 font-semibold">{sup.contactName || '-'}</td>
                    <td className="p-3 text-slate-500 uppercase text-[10px] font-bold">{sup.category}</td>
                    <td className="p-3 leading-tight font-mono text-[10px]">
                      <div>{sup.phone || '-'}</div>
                      <div className="text-slate-400">{sup.email || '-'}</div>
                    </td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">{sup.address || '-'}</td>
                    <td className="p-3 text-right">
                      <span className="text-[10px] font-bold text-slate-600">
                        {sup.status === 'Active' ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="pt-8 text-center text-[10px] text-slate-400 border-t border-dashed">
            <p>Elyssa ERP - Gestion Chaine Logistique - Document Confidentiel Officiel</p>
          </div>
        </div>
      </div>

      {/* 3. Printed Inventory Count Sheet */}
      <div id="printable-inventory-sheet" className="hidden">
        <div className="p-8 bg-white text-slate-900 space-y-6">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-center text-slate-800">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">ELYSSA ERP — FICHE DE COMPTAGE PHYSIQUE</h1>
              <p className="text-[10px] text-slate-400 font-mono">
                Inventaire de Fin d'Année — Généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
              </p>
            </div>
            <div className="text-right text-[11px] font-bold">
              <div>Site : {selectedInventoryLocation === 'all' ? 'Tous les dépôts' : (companyLocations.find(l => l.id === selectedInventoryLocation)?.name || 'Dépôt')}</div>
              <div className="text-slate-400 font-medium">Responsable : Zied Ben Miled</div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed italic">
            Instruction au magasinier : Veuillez parcourir méthodiquement les rayons, étagères et casiers dans l'ordre indiqué ci-dessous. Inscrivez lisiblement au stylo à bille la quantité physique réellement constatée dans la colonne "Quantité Comptée (Physique)". Signez la fiche en fin de parcours.
          </p>

          {/* Table Listing */}
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[9px]">
                  <th className="p-3 border-r border-slate-200">Emplacement (Rayon / Étagère / Casier)</th>
                  <th className="p-3 border-r border-slate-200">SKU Code</th>
                  <th className="p-3 border-r border-slate-200">Désignation de l'Article</th>
                  <th className="p-3 border-r border-slate-200 text-right">Système (Théorique)</th>
                  <th className="p-3 border-r border-slate-200 text-center w-40 bg-slate-50 font-black">Compté (Physique)</th>
                  <th className="p-3">Observations / Écarts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white font-mono text-[11px]">
                {products
                  .filter(p => selectedInventoryLocation === 'all' || p.warehouseId === selectedInventoryLocation)
                  .slice()
                  .sort((a, b) => {
                    const strA = `${a.aisle || 'ZZ'}-${a.shelf || 'ZZ'}-${a.bin || 'ZZ'}`;
                    const strB = `${b.aisle || 'ZZ'}-${b.shelf || 'ZZ'}-${b.bin || 'ZZ'}`;
                    return strA.localeCompare(strB);
                  })
                  .map(prod => (
                    <tr key={prod.id} className="h-10">
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-800">
                        {prod.aisle || prod.shelf || prod.bin ? (
                          <span>R:{prod.aisle || '-'} | É:{prod.shelf || '-'} | C:{prod.bin || '-'}</span>
                        ) : (
                          <span className="text-slate-400 italic">Non classifié</span>
                        )}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-indigo-700 font-bold">{prod.sku}</td>
                      <td className="p-2 border-r border-slate-200 font-sans font-semibold text-slate-900">{prod.name}</td>
                      <td className="p-2 border-r border-slate-200 text-right text-slate-500 font-sans">
                        {prod.stockLevel} {prod.unit}
                      </td>
                      <td className="p-2 border-r border-slate-200 bg-slate-50 text-center text-slate-300">
                        [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] {prod.unit}
                      </td>
                      <td className="p-2 text-slate-300 font-sans">
                        __________________________
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Signatures section */}
          <div className="grid grid-cols-2 gap-8 pt-12 text-xs">
            <div className="border border-slate-200 rounded-lg p-4 h-32 space-y-2">
              <span className="font-extrabold uppercase text-slate-650 tracking-wider text-[9px] block">Visa de l'Opérateur (Magasinier) :</span>
              <div className="text-slate-400 italic text-[10px] pt-12">Signature :</div>
            </div>
            <div className="border border-slate-200 rounded-lg p-4 h-32 space-y-2">
              <span className="font-extrabold uppercase text-slate-650 tracking-wider text-[9px] block">Visa du Contrôleur d'Inventaire :</span>
              <div className="text-slate-400 italic text-[10px] pt-12">Signature :</div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-8 text-center text-[10px] text-slate-400 border-t border-dashed">
            <p>Elyssa ERP - Direction Chaine Logistique & Approvisionnements - Document Soumis à Audit</p>
          </div>
        </div>
      </div>

      <IframePrintHelper
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        activeTab={printDocTab}
        documentName={printDocName}
        printTarget={printTarget}
        targetId={printTargetId}
      />
    </div>
  );
}
