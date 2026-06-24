export type Product = {
  id: number;
  name: string;
  image: string;
  price: string;
};

export type Restaurant = {
  id: number;
  name: string;
  city: string;
  cuisine: string;
  rating: string;
  eta: string;
  cover: string;
  description: string;
  address: string;
  minOrder: string;
  deliveryFee: string;
  offers: string[];
  products: Product[];
};

export type CityAvailability = {
  name: string;
  isAvailable: boolean;
};
