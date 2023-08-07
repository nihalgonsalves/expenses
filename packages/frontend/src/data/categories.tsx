import {
  MdApartment,
  MdAttractions,
  MdAutoAwesome,
  MdCommute,
  MdElectricBolt,
  MdHome,
  MdLocalBar,
  MdLocalDining,
  MdLocalGroceryStore,
  MdMovie,
  MdPayments,
  MdQuestionMark,
  MdStore,
  MdToll,
  MdTravelExplore,
} from 'react-icons/md';

type Category = {
  id: CategoryId;
  name: string;
  icon: React.ReactNode;
};

export enum CategoryId {
  Groceries = 'groceries',
  Restaurants = 'restaurants',
  Bars = 'bars',
  Entertainment = 'entertainment',
  Cinema = 'cinema',
  Shopping = 'shopping',
  Travel = 'travel',
  Transportation = 'transportation',
  Hobbies = 'hobbies',
  Home = 'home',
  Rent = 'rent',
  Utilities = 'utilities',
  Other = 'other',
  Transfer = 'transfer',
  Income = 'income',
}

// prettier-ignore
export const categories: Category[] = [
  { id: CategoryId.Groceries,      name: 'Groceries',      icon: <MdLocalGroceryStore /> },
  { id: CategoryId.Restaurants,    name: 'Restaurants',    icon: <MdLocalDining /> },
  { id: CategoryId.Bars,           name: 'Bars',           icon: <MdLocalBar /> },
  { id: CategoryId.Entertainment,  name: 'Entertainment',  icon: <MdAttractions />, },
  { id: CategoryId.Cinema,         name: 'Cinema',         icon: <MdMovie /> },
  { id: CategoryId.Shopping,       name: 'Shopping',       icon: <MdStore /> },
  { id: CategoryId.Travel,         name: 'Travel',         icon: <MdTravelExplore /> },
  { id: CategoryId.Transportation, name: 'Transportation', icon: <MdCommute /> },
  { id: CategoryId.Hobbies,        name: 'Hobbies',        icon: <MdAutoAwesome /> },
  { id: CategoryId.Home,           name: 'Home',           icon: <MdHome /> },
  { id: CategoryId.Rent,           name: 'Rent',           icon: <MdApartment /> },
  { id: CategoryId.Utilities,      name: 'Utilities',      icon: <MdElectricBolt /> },
  { id: CategoryId.Other,          name: 'Other',          icon: <MdQuestionMark /> },
  { id: CategoryId.Transfer,       name: 'Transfer',       icon: <MdPayments /> },
  { id: CategoryId.Income,         name: 'Income',         icon: <MdToll /> },
];

export const categoryById = Object.fromEntries(
  categories.map((category) => [category.id, category]),
);
