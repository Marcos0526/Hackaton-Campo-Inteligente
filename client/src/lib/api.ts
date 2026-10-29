import { API_URL } from './auth-client';

export interface Offer {
  id: string;
  producerId: string;
  productName: string;
  quantity: number;
  unit: string;
  quality: string;
  pricePerUnit: number;
  availableDate: string;
  status: string;
  producer?: { id: string; name: string };
}

export interface BuyerRequest {
  id: string;
  buyerId: string;
  productName: string;
  quantity: number;
  unit: string;
  targetPriceMin: number;
  targetPriceMax: number;
  deliveryDate: string;
  status: string;
  buyer?: { id: string; name: string };
}

export interface TransportQuote {
  id: string;
  origin: string;
  destination: string;
  distanceKm: number;
  quotedPrice: number;
  status: string;
  transporter?: {
    id: string;
    baseLocation: string;
    vehicleType: string;
    loadCapacityKg: number;
    user?: { id: string; name: string };
  };
}

export interface Operation {
  id: string;
  offerId?: string | null;
  buyerId?: string | null;
  status: string;
  agreedPrice?: number | null;
  quantity?: number | null;
  createdAt: string;
  offer?: {
    id: string;
    producerId: string;
    productName: string;
    quantity: number;
    unit: string;
    quality: string;
    pricePerUnit: number;
    producer?: {
      id: string;
      name: string;
      producerProfile?: { farmName: string; location: string } | null;
    };
  } | null;
  buyer?: {
    id: string;
    name: string;
    buyerProfile?: { companyName: string; deliveryLocation: string } | null;
  } | null;
  transportQuotes: TransportQuote[];
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  producerProfile?: {
    farmName: string;
    location: string;
    totalLand: number;
    cultivatedLand: number;
    crops: string;
    storageCapacity?: string | null;
  } | null;
  transporterProfile?: {
    baseLocation: string;
    vehicleType: string;
    loadCapacityKg: number;
    routes: string;
  } | null;
  buyerProfile?: {
    companyName: string;
    deliveryLocation: string;
    preferredCrops: string;
  } | null;
}

export interface AssistantResponse {
  answer: string;
  offers: Offer[];
  requests: BuyerRequest[];
  provider?: string;
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = await res.json();
      message = body.message || body.error || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export const api = {
  getOffers: () => request<Offer[]>('/offers'),
  getMyOffers: () => request<Offer[]>('/offers/mine'),
  createOffer: (data: Record<string, unknown>) =>
    request<Offer>('/offers', { method: 'POST', body: JSON.stringify(data) }),
  getRequests: () => request<BuyerRequest[]>('/requests'),
  getMyRequests: () => request<BuyerRequest[]>('/requests/mine'),
  createRequest: (data: Record<string, unknown>) =>
    request<BuyerRequest>('/requests', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => request<Profile>('/profile'),
  buy: (offerId: string, quantity: number) =>
    request<Operation>('/operations/buy', {
      method: 'POST',
      body: JSON.stringify({ offerId, quantity }),
    }),
  getAvailableOperations: () => request<Operation[]>('/operations/available'),
  acceptTransport: (operationId: string) =>
    request<TransportQuote>(`/operations/${operationId}/accept-transport`, { method: 'POST' }),
  getMyOperations: () => request<Operation[]>('/operations/mine'),
  updateOperationStatus: (operationId: string, status: string) =>
    request<Operation>(`/operations/${operationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  chat: (message: string, history: ChatHistoryItem[]) =>
    request<AssistantResponse>('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),
};
