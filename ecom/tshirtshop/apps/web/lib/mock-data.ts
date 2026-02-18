/**
 * Mock product data for frontend mockup.
 * Replace with API calls when DB-003 and CAT-001 are implemented.
 */

export interface MockProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  tag?: "LIMITED" | "NEW DROP" | "SOLD OUT";
}

export interface MockCategory {
  id: string;
  name: string;
  slug: string;
}

export const MOCK_CATEGORIES: MockCategory[] = [
  { id: "1", name: "T-Shirts", slug: "t-shirts" },
  { id: "2", name: "Hoodies", slug: "hoodies" },
  { id: "3", name: "Hats", slug: "hats" },
  { id: "4", name: "Accessories", slug: "accessories" },
  { id: "5", name: "Posters", slug: "posters" },
];

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "1",
    name: "Infernal D20 Tee",
    price: 48,
    imageUrl: "https://placehold.co/600x600/1a1a1a/ffffff?text=Infernal+D20",
    category: "t-shirts",
    tag: "NEW DROP",
  },
  {
    id: "2",
    name: "Shadow Realm Hoodie",
    price: 98,
    imageUrl: "https://placehold.co/600x600/1a1a1a/ffffff?text=Shadow+Realm",
    category: "hoodies",
    tag: "LIMITED",
  },
  {
    id: "3",
    name: "Arcane Script Cap",
    price: 38,
    imageUrl: "https://placehold.co/600x600/1a1a1a/ffffff?text=Arcane+Cap",
    category: "hats",
  },
  {
    id: "4",
    name: "Dragon Scale Tee",
    price: 52,
    imageUrl: "https://placehold.co/600x600/1a1a1a/ffffff?text=Dragon+Scale",
    category: "t-shirts",
    tag: "LIMITED",
  },
  {
    id: "5",
    name: "Void Walker Hoodie",
    price: 108,
    imageUrl: "https://placehold.co/600x600/1a1a1a/ffffff?text=Void+Walker",
    category: "hoodies",
  },
  {
    id: "6",
    name: "Critical Hit Poster",
    price: 28,
    imageUrl: "https://placehold.co/600x600/1a1a1a/ffffff?text=Critical+Hit",
    category: "posters",
  },
];

export const FEATURED_PRODUCTS = MOCK_PRODUCTS.slice(0, 4);
