// client/src/services/transactionService.ts
import axios from '@/lib/axios'; // On utilise ton axios configuré

const API_URL = '/caisse'; // Ton axios a déjà l'URL de base normalement

export const transactionService = {
  // 1. Récupérer le solde et l'historique
  getCashRegister: async () => {
    return axios.get(`${API_URL}`);
  },

  // 2. Encaisser une vente
  createTransaction: async (data: any) => {
    return axios.post(`${API_URL}`, data);
  },

  // 3. Créer une dépense
  createExpense: async (data: any) => {
    return axios.post(`${API_URL}/expenses`, data);
  },

  // 4. Récupérer les fournisseurs
  getSuppliers: async () => {
    return axios.get(`${API_URL}/suppliers`);
  },

  // 5. Créer un fournisseur
  createSupplier: async (data: { name: string, contactName?: string }) => {
    return axios.post(`${API_URL}/suppliers`, data);
  }
};