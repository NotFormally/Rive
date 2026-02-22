// Recipe & Ingredient Cost data model
// Links menu items to their ingredient costs for food cost calculation

export type Ingredient = {
  name: string;
  unitCost: number;     // cost per unit (e.g., per kg, per L, per unit)
  unit: string;          // kg, L, unité, botte
};

export type RecipeIngredient = {
  ingredientName: string;
  quantity: number;
  unit: string;
};

export type Recipe = {
  menuItemId: string;
  ingredients: RecipeIngredient[];
};

export type FoodCostResult = {
  menuItemId: string;
  menuItemName: string;
  sellingPrice: number;
  ingredientCost: number;
  margin: number;          // percentage
  marginAmount: number;    // dollar amount
  status: 'healthy' | 'warning' | 'critical';
};

// Sample ingredient price database (simulating data from scanned receipts)
export const INGREDIENT_PRICES: Record<string, Ingredient> = {
  'Oignons':            { name: 'Oignons',            unitCost: 2.50,  unit: 'kg' },
  'Bouillon de bœuf':   { name: 'Bouillon de bœuf',   unitCost: 4.00,  unit: 'L' },
  'Gruyère':            { name: 'Gruyère',            unitCost: 28.00, unit: 'kg' },
  'Pain croûton':       { name: 'Pain croûton',       unitCost: 5.00,  unit: 'kg' },
  'Beurre':             { name: 'Beurre',             unitCost: 12.00, unit: 'kg' },
  'Saumon frais':       { name: 'Saumon frais',       unitCost: 38.00, unit: 'kg' },
  'Avocat':             { name: 'Avocat',             unitCost: 3.50,  unit: 'unité' },
  'Câpres':             { name: 'Câpres',             unitCost: 18.00, unit: 'kg' },
  'Agrumes':            { name: 'Agrumes',            unitCost: 4.00,  unit: 'kg' },
  'Bavette de bœuf':    { name: 'Bavette de bœuf',    unitCost: 32.00, unit: 'kg' },
  'Pommes de terre':    { name: 'Pommes de terre',    unitCost: 2.20,  unit: 'kg' },
  'Poivre vert':        { name: 'Poivre vert',        unitCost: 45.00, unit: 'kg' },
  'Crème':              { name: 'Crème',              unitCost: 6.00,  unit: 'L' },
  'Riz arborio':        { name: 'Riz arborio',        unitCost: 8.00,  unit: 'kg' },
  'Champignons sauvages': { name: 'Champignons sauvages', unitCost: 35.00, unit: 'kg' },
  'Parmesan':           { name: 'Parmesan',           unitCost: 42.00, unit: 'kg' },
  'Huile de truffe':    { name: 'Huile de truffe',    unitCost: 120.00, unit: 'L' },
  'Œufs':               { name: 'Œufs',               unitCost: 0.50,  unit: 'unité' },
  'Vanille':            { name: 'Vanille',            unitCost: 350.00, unit: 'kg' },
  'Sucre':              { name: 'Sucre',              unitCost: 1.80,  unit: 'kg' },
  'Vin rouge':          { name: 'Vin rouge',          unitCost: 8.00,  unit: 'L' },
};

// Sample recipes linking menu items to ingredients
export const RECIPES: Recipe[] = [
  {
    menuItemId: '1', // Soupe à l'oignon gratinée
    ingredients: [
      { ingredientName: 'Oignons', quantity: 0.3, unit: 'kg' },
      { ingredientName: 'Bouillon de bœuf', quantity: 0.35, unit: 'L' },
      { ingredientName: 'Gruyère', quantity: 0.05, unit: 'kg' },
      { ingredientName: 'Pain croûton', quantity: 0.03, unit: 'kg' },
      { ingredientName: 'Beurre', quantity: 0.02, unit: 'kg' },
    ]
  },
  {
    menuItemId: '2', // Tartare de Saumon
    ingredients: [
      { ingredientName: 'Saumon frais', quantity: 0.15, unit: 'kg' },
      { ingredientName: 'Avocat', quantity: 0.5, unit: 'unité' },
      { ingredientName: 'Câpres', quantity: 0.01, unit: 'kg' },
      { ingredientName: 'Agrumes', quantity: 0.05, unit: 'kg' },
    ]
  },
  {
    menuItemId: '3', // Bavette de Bœuf Grillée
    ingredients: [
      { ingredientName: 'Bavette de bœuf', quantity: 0.25, unit: 'kg' },
      { ingredientName: 'Pommes de terre', quantity: 0.2, unit: 'kg' },
      { ingredientName: 'Poivre vert', quantity: 0.005, unit: 'kg' },
      { ingredientName: 'Crème', quantity: 0.05, unit: 'L' },
      { ingredientName: 'Beurre', quantity: 0.02, unit: 'kg' },
    ]
  },
  {
    menuItemId: '4', // Risotto aux Champignons Sauvages
    ingredients: [
      { ingredientName: 'Riz arborio', quantity: 0.1, unit: 'kg' },
      { ingredientName: 'Champignons sauvages', quantity: 0.08, unit: 'kg' },
      { ingredientName: 'Parmesan', quantity: 0.03, unit: 'kg' },
      { ingredientName: 'Beurre', quantity: 0.03, unit: 'kg' },
      { ingredientName: 'Crème', quantity: 0.05, unit: 'L' },
      { ingredientName: 'Huile de truffe', quantity: 0.003, unit: 'L' },
    ]
  },
  {
    menuItemId: '5', // Crème Brûlée
    ingredients: [
      { ingredientName: 'Crème', quantity: 0.15, unit: 'L' },
      { ingredientName: 'Œufs', quantity: 3, unit: 'unité' },
      { ingredientName: 'Vanille', quantity: 0.002, unit: 'kg' },
      { ingredientName: 'Sucre', quantity: 0.04, unit: 'kg' },
    ]
  },
  {
    menuItemId: '6', // Vin Rouge Maison
    ingredients: [
      { ingredientName: 'Vin rouge', quantity: 0.15, unit: 'L' },
    ]
  },
];

// Calculate food cost for a single recipe
export function calculateItemFoodCost(recipe: Recipe, sellingPrice: number, menuItemName: string): FoodCostResult {
  let totalCost = 0;

  for (const ri of recipe.ingredients) {
    const ingredient = INGREDIENT_PRICES[ri.ingredientName];
    if (ingredient) {
      totalCost += ingredient.unitCost * ri.quantity;
    }
  }

  const marginAmount = sellingPrice - totalCost;
  const margin = sellingPrice > 0 ? ((marginAmount / sellingPrice) * 100) : 0;

  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (margin < 60) status = 'critical';
  else if (margin < 70) status = 'warning';

  return {
    menuItemId: recipe.menuItemId,
    menuItemName,
    sellingPrice,
    ingredientCost: Math.round(totalCost * 100) / 100,
    margin: Math.round(margin * 10) / 10,
    marginAmount: Math.round(marginAmount * 100) / 100,
    status,
  };
}
