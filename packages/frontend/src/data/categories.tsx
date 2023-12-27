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
  { id: CategoryId.Groceries,      name: 'Groceries',      icon: '🛒' },
  { id: CategoryId.Restaurants,    name: 'Restaurants',    icon: '🍽️' },
  { id: CategoryId.Bars,           name: 'Bars',           icon: '🍺' },
  { id: CategoryId.Entertainment,  name: 'Entertainment',  icon: '🎡', },
  { id: CategoryId.Cinema,         name: 'Cinema',         icon: '🎬'},
  { id: CategoryId.Shopping,       name: 'Shopping',       icon: '🛍️' },
  { id: CategoryId.Travel,         name: 'Travel',         icon: '🌍' },
  { id: CategoryId.Transportation, name: 'Transportation', icon: '🚇' },
  { id: CategoryId.Hobbies,        name: 'Hobbies',        icon: '✨'},
  { id: CategoryId.Home,           name: 'Home',           icon: '🏠'},
  { id: CategoryId.Rent,           name: 'Rent',           icon: '💶'},
  { id: CategoryId.Utilities,      name: 'Utilities',      icon: '⚡️'},
  { id: CategoryId.Other,          name: 'Other',          icon: '❓'},
  { id: CategoryId.Transfer,       name: 'Transfer',       icon: '💳' },
  { id: CategoryId.Income,         name: 'Income',         icon: '🏦' },
];

export const categoryById = Object.fromEntries(
  categories.map((category) => [category.id, category]),
);
