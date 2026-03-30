"use client";
import React, { useState, useEffect } from 'react';
import { transactionService } from '@/services/transactionService';
import axios from '@/lib/axios';
import { CartItem, Service, Client, Supplier } from '@/types/caisse';
import { Wallet, TrendingDown, PlusCircle, Search, Scissors, User, X } from 'lucide-react';
import { useTranslations } from 'next-intl'; // <--- IMPORT

const formatPrice = (p: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(p);

export default function CaisseSystem() {
  const t = useTranslations('CaisseSystem'); // <--- HOOK
  const [activeTab, setActiveTab] = useState<'VENTE' | 'DEPENSE'>('VENTE');
  
  // Données
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [balance, setBalance] = useState<number>(0);

  const [searchService, setSearchService] = useState('');

  // Panier
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [passantName, setPassantName] = useState('');
  const [isPassant, setIsPassant] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('ESPECES');

  // Dépense
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseReason, setExpenseReason] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [isNewSupplier, setIsNewSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');

  // Modal
  const [showFondModal, setShowFondModal] = useState(false);
  const [fondAmount, setFondAmount] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [srvRes, cliRes, supRes, caisseRes] = await Promise.all([
        axios.get('/services'),
        axios.get('/clients'),
        transactionService.getSuppliers(),
        transactionService.getCashRegister()
      ]);

      setServices(srvRes.data);
      setClients(cliRes.data);
      setSuppliers(supRes.data);
      setBalance(caisseRes.data.balance);
    } catch (error) {
      console.error("Erreur chargement données", error);
    }
  };

  const addToCart = (service: Service) => {
    const newItem: CartItem = {
      uniqueId: Date.now().toString(),
      type: 'SERVICE',
      id: service.id,
      name: service.nom,
      price: Number(service.prix),
      quantity: 1
    };
    setCart([...cart, newItem]);
  };

  const removeFromCart = (uid: string) => {
    setCart(cart.filter(i => i.uniqueId !== uid));
  };

  const totalCart = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleSale = async () => {
    if (cart.length === 0) return alert(t('sale.alerts.emptyCart'));
    if (!isPassant && !selectedClientId) return alert(t('sale.alerts.noClient'));

    try {
      await transactionService.createTransaction({
        items: cart,
        amount: totalCart,
        payment_method: paymentMethod,
        client_id: isPassant ? null : selectedClientId,
        client_name: isPassant ? (passantName || 'Cliente Passante') : undefined,
        description: "Encaissement Salon"
      });
      alert(t('sale.alerts.success'));
      setCart([]);
      setPassantName('');
      setSelectedClientId(null);
      loadData(); 
    } catch (error) {
      alert("Erreur lors de l'encaissement.");
    }
  };

  const handleExpense = async () => {
    if (!expenseAmount || !expenseReason) return alert(t('expense.alerts.missing'));
    try {
      let finalSupplierId = selectedSupplierId;
      if (isNewSupplier && newSupplierName) {
        const res = await transactionService.createSupplier({ name: newSupplierName });
        finalSupplierId = res.data.id;
      }
      await transactionService.createExpense({
        amount: parseFloat(expenseAmount),
        category: "Sortie Caisse",
        description: expenseReason,
        supplier_id: finalSupplierId,
        payment_method: 'ESPECES'
      });
      alert(t('expense.alerts.success'));
      setExpenseAmount('');
      setExpenseReason('');
      setNewSupplierName('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur dépense");
    }
  };

  const handleFondDeCaisse = async () => {
      if (!fondAmount) return;
      try {
          await axios.post('/caisse', {
            amount: parseFloat(fondAmount),
            type: 'DEPOT', 
            description: "Ouverture de Caisse / Fond de caisse",
            payment_method: 'ESPECES'
          });
          alert(t('fundModal.success'));
          setShowFondModal(false);
          setFondAmount('');
          loadData();
      } catch (error) {
          alert("Erreur ouverture caisse");
      }
  };

  const filteredServices = services.filter(s => 
      s.nom.toLowerCase().includes(searchService.toLowerCase()) && s.actif
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 p-4 md:p-6 rounded-xl min-h-screen">
      
      {/* HEADER : SOLDE & OUVERTURE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2"><Scissors/> {t('title')}</h1>
            <p className="text-gray-400 text-xs md:text-sm">{t('subtitle')}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button 
                onClick={() => setShowFondModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-4 py-3 rounded-lg hover:bg-blue-100 transition whitespace-nowrap"
            >
                <PlusCircle size={18}/> {t('fund')}
            </button>

            <div className="flex-1 sm:flex-none bg-gray-900 text-white px-6 py-3 rounded-lg text-center shadow-lg min-w-[140px]">
                <div className="text-[10px] text-gray-400 font-bold uppercase">{t('balance')}</div>
                <div className={`text-xl md:text-2xl font-bold ${balance < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {formatPrice(balance)}
                </div>
            </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 md:gap-4 mb-6">
        <button onClick={() => setActiveTab('VENTE')} className={`flex-1 py-3 md:py-4 rounded-xl font-bold text-sm md:text-lg shadow-sm transition flex items-center justify-center gap-2 ${activeTab === 'VENTE' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
          <Wallet size={18}/> {t('tabs.sale')}
        </button>
        <button onClick={() => setActiveTab('DEPENSE')} className={`flex-1 py-3 md:py-4 rounded-xl font-bold text-sm md:text-lg shadow-sm transition flex items-center justify-center gap-2 ${activeTab === 'DEPENSE' ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
          <TrendingDown size={18}/> {t('tabs.expense')}
        </button>
      </div>

      {/* ZONE PRINCIPALE */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 flex-grow">
        
        {/* === GAUCHE === */}
        <div className="lg:col-span-2 order-2 lg:order-1 bg-white rounded-xl shadow-sm p-4 md:p-6 flex flex-col h-auto lg:h-[650px]">
          
          {activeTab === 'VENTE' ? (
            <>
              {/* Recherche */}
              <div className="relative mb-4">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                  <input 
                    type="text" 
                    placeholder={t('sale.searchPlaceholder')} 
                    className="w-full ps-10 pe-4 py-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black outline-none font-medium"
                    value={searchService}
                    onChange={e => setSearchService(e.target.value)}
                  />
              </div>

              {/* Liste Grille */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto content-start flex-grow pr-1 max-h-[400px] lg:max-h-none">
                {filteredServices.map(srv => (
                  <button
                    key={srv.id}
                    onClick={() => addToCart(srv)}
                    className="p-3 border rounded-xl hover:bg-gray-900 hover:text-white hover:border-black transition text-left rtl:text-right group flex flex-col justify-between h-24 sm:h-28"
                  >
                    <div className="font-bold text-xs sm:text-sm leading-tight line-clamp-2">{srv.nom}</div>
                    <div className="font-medium text-gray-500 group-hover:text-gray-300 text-sm">{srv.prix} Dhs</div>
                  </button>
                ))}
                {filteredServices.length === 0 && <p className="col-span-full text-center text-gray-400 py-10">{t('sale.emptyServices')}</p>}
              </div>
            </>
          ) : (
            // FORMULAIRE DÉPENSE
            <div className="max-w-md mx-auto w-full py-6">
              <h2 className="text-xl font-bold text-red-600 mb-6 border-b pb-2">{t('expense.title')}</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t('expense.amount')}</label>
                  <input type="number" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} className="w-full p-4 border-2 border-red-100 rounded-xl focus:border-red-500 focus:outline-none text-2xl font-bold" placeholder="0.00"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t('expense.reason')}</label>
                  <input type="text" value={expenseReason} onChange={e => setExpenseReason(e.target.value)} className="w-full p-3 border rounded-lg" placeholder="Ex: Café..."/>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-gray-700">{t('expense.supplier')}</label>
                    <button onClick={() => setIsNewSupplier(!isNewSupplier)} className="text-xs text-blue-600 font-bold underline">
                        {isNewSupplier ? t('expense.existingSupplier') : t('expense.newSupplier')}
                    </button>
                  </div>
                  {isNewSupplier ? (
                    <input type="text" value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} className="w-full p-2 border rounded bg-white" placeholder="Nom"/>
                  ) : (
                    <select value={selectedSupplierId || ''} onChange={e => setSelectedSupplierId(Number(e.target.value))} className="w-full p-2 border rounded bg-white">
                      <option value="">{t('expense.divers')}</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  )}
                </div>
                <button onClick={handleExpense} className="w-full py-4 bg-red-600 text-white font-bold rounded-xl shadow-lg mt-4">{t('expense.submit')}</button>
              </div>
            </div>
          )}
        </div>

        {/* === DROITE : TICKET (PANIER) === */}
        {activeTab === 'VENTE' && (
          <div className="order-1 lg:order-2 bg-white rounded-xl shadow-sm p-4 md:p-6 flex flex-col h-auto lg:h-[650px] border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b flex items-center justify-between">
                <span>{t('sale.ticket')}</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">{cart.length}</span>
            </h2>
            
            {/* Choix Client */}
            <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><User size={12}/> {t('sale.client')}</label>
                <button onClick={() => setIsPassant(!isPassant)} className="text-xs text-blue-600 font-bold hover:underline">
                  {isPassant ? t('sale.clientPlaceholder') : t('sale.clientWalkin')}
                </button>
              </div>
              
              {isPassant ? (
                <input 
                  type="text" placeholder={t('sale.clientNamePlaceholder')} className="w-full p-2 text-sm border rounded-lg"
                  value={passantName} onChange={e => setPassantName(e.target.value)}
                />
              ) : (
                <select 
                  className="w-full p-2 text-sm border rounded-lg bg-white"
                  onChange={e => setSelectedClientId(Number(e.target.value))} value={selectedClientId || ''}
                >
                  <option value="">{t('sale.selectClient')}</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nom} {c.prenom}</option>)}
                </select>
              )}
            </div>

            {/* Liste Panier */}
            <div className="flex-grow overflow-y-auto space-y-2 mb-4 pr-1 scrollbar-thin max-h-[200px] lg:max-h-none">
              {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center h-20 lg:h-full text-gray-300 text-sm">
                    {t('sale.emptyCart')}
                </div>
              )}
              {cart.map((item) => (
                <div key={item.uniqueId} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg group text-sm">
                  <div className="font-bold text-gray-800">{item.name}</div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">{item.price}</span>
                    <button onClick={() => removeFromCart(item.uniqueId)} className="text-gray-400 hover:text-red-500"><X size={16}/></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total et Paiement */}
            <div className="border-t pt-4 mt-auto">
              <div className="flex justify-between text-2xl font-bold mb-4 text-gray-900">
                <span>{t('sale.total')}</span>
                <span>{formatPrice(totalCart)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {['ESPECES', 'CB', 'VIREMENT', 'AUTRE'].map(method => (
                  <button key={method} onClick={() => setPaymentMethod(method)} className={`py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg border ${paymentMethod === method ? 'bg-black text-white' : 'bg-white text-gray-500'}`}>
                    {t(`sale.methods.${method}`)}
                  </button>
                ))}
              </div>

              <button onClick={handleSale} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg text-lg">
                {t('sale.pay')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL FOND DE CAISSE */}
      {showFondModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 px-4">
              <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-2xl animate-in zoom-in-95">
                  <h3 className="text-lg font-bold mb-4">{t('fundModal.title')}</h3>
                  <input type="number" placeholder={t('fundModal.placeholder')} className="w-full p-3 border rounded-lg mb-4 text-xl font-bold" value={fondAmount} onChange={e => setFondAmount(e.target.value)} />
                  <div className="flex gap-2">
                      <button onClick={() => setShowFondModal(false)} className="flex-1 py-3 bg-gray-100 rounded-lg font-bold">{t('fundModal.cancel')}</button>
                      <button onClick={handleFondDeCaisse} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold">{t('fundModal.validate')}</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}