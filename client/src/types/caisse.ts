// client/src/types/caisse.ts
export interface Service {
  id: number;
  nom: string;
  prix: number;
  category?: string;
}

export interface Product {
  id: number;
  nom: string;
  prix: number;
  stock: number;
}

export interface Client {
  id: number;
  nom: string;
  prenom: string;
}

export interface Supplier {
  id: number;
  name: string;
}

export interface CartItem {
  uniqueId: string;
  type: 'SERVICE' | 'PRODUIT';
  id: number;
  name: string;
  price: number;
  quantity: number;
}