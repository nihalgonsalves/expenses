import {
  Apartment,
  Attractions,
  AutoAwesome,
  Commute,
  ElectricBolt,
  Home,
  LocalBar,
  LocalDining,
  LocalGroceryStore,
  Movie,
  Payments,
  QuestionMark,
  Store,
  TravelExplore,
} from '@mui/icons-material';

type Category = {
  id: CategoryId;
  name: string;
  icon: React.ReactNode;
};

export enum CategoryId {
  Groceries = 'groceries',
  Restauraunts = 'restaurants',
  Bars = 'bars',
  Entertainment = 'entertainment',
  Cinema = 'cinema',
  Shopping = 'shopping',
  Travel = 'travel',
  Transportation = 'transportation',
  Hobbies = 'hobbies',
  // false positive?
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Home = 'home',
  Rent = 'rent',
  Utilities = 'utilities',
  Other = 'other',
  Transfer = 'transfer',
}

// prettier-ignore
export const categories: Category[] = [
  { id: CategoryId.Groceries,      name: 'Groceries',      icon: <LocalGroceryStore /> },
  { id: CategoryId.Restauraunts,   name: 'Restauraunts',   icon: <LocalDining /> },
  { id: CategoryId.Bars,           name: 'Bars',           icon: <LocalBar /> },
  { id: CategoryId.Entertainment,  name: 'Entertainment',  icon: <Attractions />, },
  { id: CategoryId.Cinema,         name: 'Cinema',         icon: <Movie /> },
  { id: CategoryId.Shopping,       name: 'Shopping',       icon: <Store /> },
  { id: CategoryId.Travel,         name: 'Travel',         icon: <TravelExplore /> },
  { id: CategoryId.Transportation, name: 'Transportation', icon: <Commute /> },
  { id: CategoryId.Hobbies,        name: 'Hobbies',        icon: <AutoAwesome /> },
  { id: CategoryId.Home,           name: 'Home',           icon: <Home /> },
  { id: CategoryId.Rent,           name: 'Rent',           icon: <Apartment /> },
  { id: CategoryId.Utilities,      name: 'Utilities',      icon: <ElectricBolt /> },
  { id: CategoryId.Other,          name: 'Other',          icon: <QuestionMark /> },
  { id: CategoryId.Transfer,       name: 'Transfer',       icon: <Payments /> },
];

export const categoryById = Object.fromEntries(
  categories.map((category) => [category.id, category]),
);
