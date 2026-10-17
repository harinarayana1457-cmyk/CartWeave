export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiresInHours: number;
  category: 'Produce' | 'Dairy & Alt' | 'Protein' | 'Pantry Staple' | 'Grains';
  estimatedValueUsd: number;
  storageLocation: 'Fridge Crisper' | 'Fridge Top Shelf' | 'Deli Drawer' | 'Dry Pantry';
  urgencyLevel: 'critical' | 'warning' | 'fresh';
}

export interface Recipe {
  id: string;
  title: string;
  subtitle: string;
  prepTimeMinutes: number;
  servings: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  estimatedCostUsd: number;
  dietaryTags: string[];
  pantryIngredientsUsed: string[];
  missingIngredients: string[];
  chefNote: string;
  badgeText: string;
}

export interface StoreItemQuote {
  ingredientName: string;
  amazonFresh: {
    sku: string;
    brandName: string;
    packageSize: string;
    priceUsd: number;
    primeMemberPriceUsd: number;
    inStock: boolean;
    substitutionNote?: string;
  };
  wholeFoods: {
    sku: string;
    brandName: string;
    packageSize: string;
    priceUsd: number;
    primeMemberPriceUsd: number;
    inStock: boolean;
    substitutionNote?: string;
  };
  localCoop: {
    sku: string;
    brandName: string;
    packageSize: string;
    priceUsd: number;
    primeMemberPriceUsd: number;
    inStock: boolean;
    substitutionNote?: string;
  };
}

export const INITIAL_PANTRY_ITEMS: PantryItem[] = [
  {
    id: 'pantry-spinach',
    name: 'Organic Baby Spinach',
    quantity: 200,
    unit: 'g',
    expiresInHours: 18,
    category: 'Produce',
    estimatedValueUsd: 4.49,
    storageLocation: 'Fridge Crisper',
    urgencyLevel: 'critical',
  },
  {
    id: 'pantry-yogurt',
    name: 'Strained 0% Greek Yogurt',
    quantity: 500,
    unit: 'g',
    expiresInHours: 24,
    category: 'Dairy & Alt',
    estimatedValueUsd: 5.99,
    storageLocation: 'Fridge Top Shelf',
    urgencyLevel: 'critical',
  },
  {
    id: 'pantry-paneer',
    name: 'Artisan Fresh Paneer Block',
    quantity: 250,
    unit: 'g',
    expiresInHours: 36,
    category: 'Protein',
    estimatedValueUsd: 6.49,
    storageLocation: 'Deli Drawer',
    urgencyLevel: 'critical',
  },
  {
    id: 'pantry-avocado',
    name: 'Ripe Hass Avocados',
    quantity: 2,
    unit: 'pcs',
    expiresInHours: 40,
    category: 'Produce',
    estimatedValueUsd: 3.50,
    storageLocation: 'Fridge Crisper',
    urgencyLevel: 'warning',
  },
  {
    id: 'pantry-tofu',
    name: 'Organic Super-Firm Tofu',
    quantity: 350,
    unit: 'g',
    expiresInHours: 58,
    category: 'Protein',
    estimatedValueUsd: 3.99,
    storageLocation: 'Deli Drawer',
    urgencyLevel: 'warning',
  },
  {
    id: 'pantry-quinoa',
    name: 'Tri-Color Organic Quinoa',
    quantity: 600,
    unit: 'g',
    expiresInHours: 720,
    category: 'Grains',
    estimatedValueUsd: 5.49,
    storageLocation: 'Dry Pantry',
    urgencyLevel: 'fresh',
  },
  {
    id: 'pantry-chickpeas',
    name: 'Slow-Simmered Garbanzo Beans',
    quantity: 2,
    unit: 'cans',
    expiresInHours: 1440,
    category: 'Pantry Staple',
    estimatedValueUsd: 3.20,
    storageLocation: 'Dry Pantry',
    urgencyLevel: 'fresh',
  },
  {
    id: 'pantry-garlic-olive',
    name: 'Roasted Garlic & EVOO Base',
    quantity: 300,
    unit: 'ml',
    expiresInHours: 960,
    category: 'Pantry Staple',
    estimatedValueUsd: 7.50,
    storageLocation: 'Dry Pantry',
    urgencyLevel: 'fresh',
  },
];

export const RECIPE_CATALOG: Recipe[] = [
  {
    id: 'recipe-palak-paneer-protein-bowl',
    title: 'Charred Palak Paneer & Red Lentil Power Bowl',
    subtitle: 'Uses expiring Baby Spinach (18h) & Fresh Paneer (36h) with spiced red lentil mash',
    prepTimeMinutes: 25,
    servings: 2,
    calories: 560,
    proteinGrams: 42,
    carbsGrams: 44,
    fatGrams: 22,
    estimatedCostUsd: 10.40,
    dietaryTags: ['vegetarian', 'gluten-free', 'high-protein'],
    pantryIngredientsUsed: ['Organic Baby Spinach', 'Artisan Fresh Paneer Block', 'Roasted Garlic & EVOO Base'],
    missingIngredients: ['Split Red Lentils', 'Garam Masala & Ginger Paste', 'Vine-Ripened Roma Tomatoes'],
    chefNote: 'Rescues $10.98 of critical-expiry spinach and paneer in one high-protein skillet dinner.',
    badgeText: 'Rescues 2 Critical Items',
  },
  {
    id: 'recipe-greek-yogurt-harissa-chickpea-flatbread',
    title: 'Whipped Greek Yogurt, Roasted Harissa Chickpea & Avocado Tartine',
    subtitle: 'Uses expiring Greek Yogurt (24h) & Hass Avocados (40h) over toasted sprouted grain flatbread',
    prepTimeMinutes: 20,
    servings: 2,
    calories: 590,
    proteinGrams: 38,
    carbsGrams: 52,
    fatGrams: 21,
    estimatedCostUsd: 10.80,
    dietaryTags: ['vegetarian', 'high-protein'],
    pantryIngredientsUsed: ['Strained 0% Greek Yogurt', 'Ripe Hass Avocados', 'Slow-Simmered Garbanzo Beans'],
    missingIngredients: ['Sprouted Protein Flatbreads', 'Smoky Rose Harissa Paste', 'Hemp Hearts & Pepitas'],
    chefNote: 'High-protein whipped labneh-style base using 500g Greek yogurt before tomorrow’s expiry.',
    badgeText: 'Zero-Waste 24h Rescue',
  },
  {
    id: 'recipe-spinach-edamame-pesto-protein-pasta',
    title: 'Wilted Spinach, Hemp-Basil Pesto & Lupini Bean Rigatoni',
    subtitle: 'Uses remaining Baby Spinach (18h) & Quinoa crunch with high-protein legume rigatoni',
    prepTimeMinutes: 22,
    servings: 2,
    calories: 540,
    proteinGrams: 37,
    carbsGrams: 54,
    fatGrams: 18,
    estimatedCostUsd: 10.20,
    dietaryTags: ['vegetarian', 'dairy-free', 'high-protein'],
    pantryIngredientsUsed: ['Organic Baby Spinach', 'Roasted Garlic & EVOO Base', 'Tri-Color Organic Quinoa'],
    missingIngredients: ['Chickpea & Lupini Protein Rigatoni', 'Shelled Edamame Beans', 'Nutritional Yeast Flakes'],
    chefNote: 'Dairy-free, plant-protein packed dinner that finishes off all remaining baby spinach.',
    badgeText: '37g Plant Protein',
  },
  {
    id: 'recipe-crispy-tofu-sesame-quinoa-bowl',
    title: 'Crispy Tofu & Edamame Sesame Quinoa Glow Bowl',
    subtitle: 'Dairy-free <520 kcal swap using Super-Firm Tofu, Hass Avocado & Tri-Color Quinoa',
    prepTimeMinutes: 18,
    servings: 2,
    calories: 480,
    proteinGrams: 36,
    carbsGrams: 41,
    fatGrams: 17,
    estimatedCostUsd: 9.50,
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'gluten-free', 'high-protein', 'low-calorie'],
    pantryIngredientsUsed: ['Organic Super-Firm Tofu', 'Ripe Hass Avocados', 'Tri-Color Organic Quinoa'],
    missingIngredients: ['Shelled Edamame Beans', 'Toasted Black Sesame & Tamari Glaze', 'Persian Cucumbers'],
    chefNote: 'Light, 480-calorie dairy-free powerhouse with 36g complete plant protein.',
    badgeText: 'Dairy-Free • 480 kcal',
  },
  {
    id: 'recipe-mediterranean-tempeh-stuffed-peppers',
    title: 'Mediterranean Smoked Tempeh & Quinoa Stuffed Bell Peppers',
    subtitle: 'Dairy-free, gluten-free high-protein bake under 500 calories',
    prepTimeMinutes: 30,
    servings: 2,
    calories: 495,
    proteinGrams: 35,
    carbsGrams: 46,
    fatGrams: 16,
    estimatedCostUsd: 11.10,
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'gluten-free', 'high-protein', 'low-calorie'],
    pantryIngredientsUsed: ['Tri-Color Organic Quinoa', 'Slow-Simmered Garbanzo Beans', 'Roasted Garlic & EVOO Base'],
    missingIngredients: ['Organic Three-Grain Tempeh', 'Red Bell Peppers (4-Pack)', 'Kalamata Olives & Capers'],
    chefNote: 'Rich Mediterranean flavors with zero dairy and 35g protein per serving.',
    badgeText: 'Allergen-Safe • 495 kcal',
  },
  {
    id: 'recipe-tandoori-paneer-yogurt-skewers',
    title: 'Char-Grilled Tandoori Yogurt Paneer & Warm Quinoa Tabbouleh',
    subtitle: 'Marinated in expiring Greek Yogurt & Fresh Paneer with lemon-herb quinoa',
    prepTimeMinutes: 25,
    servings: 2,
    calories: 575,
    proteinGrams: 44,
    carbsGrams: 42,
    fatGrams: 23,
    estimatedCostUsd: 11.60,
    dietaryTags: ['vegetarian', 'gluten-free', 'high-protein'],
    pantryIngredientsUsed: ['Strained 0% Greek Yogurt', 'Artisan Fresh Paneer Block', 'Tri-Color Organic Quinoa'],
    missingIngredients: ['Red Bell Peppers (4-Pack)', 'Garam Masala & Ginger Paste', 'Persian Cucumbers'],
    chefNote: '44g protein per serving with zero food waste from expiring dairy.',
    badgeText: '44g Protein Max',
  },
  {
    id: 'recipe-black-bean-avocado-lime-chili',
    title: 'Smoky Three-Bean & Quinoa Protein Chili with Avocado Crema',
    subtitle: 'Hearty one-pot vegetarian chili topped with expiring Hass Avocados & Greek Yogurt',
    prepTimeMinutes: 28,
    servings: 2,
    calories: 510,
    proteinGrams: 33,
    carbsGrams: 58,
    fatGrams: 15,
    estimatedCostUsd: 8.90,
    dietaryTags: ['vegetarian', 'gluten-free', 'high-protein', 'low-calorie'],
    pantryIngredientsUsed: ['Ripe Hass Avocados', 'Strained 0% Greek Yogurt', 'Slow-Simmered Garbanzo Beans'],
    missingIngredients: ['Fire-Roasted Crushed Tomatoes', 'Organic Black Beans', 'Hemp Hearts & Pepitas'],
    chefNote: 'Budget-friendly under $9 dinner that stretches pantry staples.',
    badgeText: 'Budget Saver • $8.90',
  },
  {
    id: 'recipe-wild-mushroom-tofu-stroganoff',
    title: 'Creamy Cashew & Seared Tofu Wild Mushroom Skillet',
    subtitle: 'Dairy-free, soy-protein rich skillet with wilted baby spinach',
    prepTimeMinutes: 24,
    servings: 2,
    calories: 490,
    proteinGrams: 34,
    carbsGrams: 40,
    fatGrams: 19,
    estimatedCostUsd: 11.40,
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'high-protein', 'low-calorie'],
    pantryIngredientsUsed: ['Organic Baby Spinach', 'Organic Super-Firm Tofu', 'Roasted Garlic & EVOO Base'],
    missingIngredients: ['Chickpea & Lupini Protein Rigatoni', 'Cremini & Shiitake Mushrooms', 'Nutritional Yeast Flakes'],
    chefNote: 'Rich umami comfort dish under 500 calories and 100% dairy-free.',
    badgeText: 'Dairy-Free Umami',
  },
];

export const STORE_PRICE_CATALOG: Record<string, StoreItemQuote> = {
  'Split Red Lentils': {
    ingredientName: 'Split Red Lentils',
    amazonFresh: {
      sku: 'AF-LENTIL-16OZ',
      brandName: 'Amazon Fresh Organic Red Lentils',
      packageSize: '16 oz bag',
      priceUsd: 2.79,
      primeMemberPriceUsd: 2.49,
      inStock: true,
      substitutionNote: '365 Everyday Value available at same price',
    },
    wholeFoods: {
      sku: 'WFM-365-LENTIL',
      brandName: '365 by Whole Foods Organic Red Lentils',
      packageSize: '16 oz bag',
      priceUsd: 3.49,
      primeMemberPriceUsd: 3.14,
      inStock: true,
    },
    localCoop: {
      sku: 'COOP-BULK-LENTIL',
      brandName: 'Bulk Bin Heirloom Red Lentils',
      packageSize: '1 lb refill bag',
      priceUsd: 3.25,
      primeMemberPriceUsd: 3.25,
      inStock: true,
    },
  },
  'Garam Masala & Ginger Paste': {
    ingredientName: 'Garam Masala & Ginger Paste',
    amazonFresh: {
      sku: 'AF-SPICE-GINGER',
      brandName: 'Aplenty Organic Ginger & Garam Masala Duo',
      packageSize: '4 oz jar',
      priceUsd: 3.49,
      primeMemberPriceUsd: 3.19,
      inStock: true,
      substitutionNote: 'Smart Sub: Saves $1.30 vs name-brand jar',
    },
    wholeFoods: {
      sku: 'WFM-SPICELAB-GM',
      brandName: 'Frontier Co-op Garam Masala & Fresh Ginger',
      packageSize: '4 oz jar',
      priceUsd: 4.79,
      primeMemberPriceUsd: 4.31,
      inStock: true,
    },
    localCoop: {
      sku: 'COOP-SPICE-GM',
      brandName: 'Small-Batch Stoneground Garam Masala',
      packageSize: '3.5 oz tin',
      priceUsd: 4.99,
      primeMemberPriceUsd: 4.99,
      inStock: true,
    },
  },
  'Vine-Ripened Roma Tomatoes': {
    ingredientName: 'Vine-Ripened Roma Tomatoes',
    amazonFresh: {
      sku: 'AF-ROMA-4PK',
      brandName: 'Amazon Fresh Greenhouse Roma Tomatoes',
      packageSize: '1.5 lb pack',
      priceUsd: 2.69,
      primeMemberPriceUsd: 2.39,
      inStock: true,
    },
    wholeFoods: {
      sku: 'WFM-ORG-ROMA',
      brandName: 'Organic Vine Roma Tomatoes',
      packageSize: '1.5 lb pack',
      priceUsd: 3.69,
      primeMemberPriceUsd: 3.32,
      inStock: true,
    },
    localCoop: {
      sku: 'COOP-FARM-ROMA',
      brandName: 'Valley Farmstead Heirloom Romas',
      packageSize: '1.5 lb basket',
      priceUsd: 3.10,
      primeMemberPriceUsd: 3.10,
      inStock: true,
      substitutionNote: 'Harvested yesterday (Local Farm Partner)',
    },
  },
  'Sprouted Protein Flatbreads': {
    ingredientName: 'Sprouted Protein Flatbreads',
    amazonFresh: {
      sku: 'AF-FLATBREAD-PRO',
      brandName: 'Food For Life Ezekiel Sprouted Lavash',
      packageSize: '4 count (10 oz)',
      priceUsd: 4.29,
      primeMemberPriceUsd: 3.89,
      inStock: true,
    },
    wholeFoods: {
      sku: 'WFM-ANGELIC-FLAT',
      brandName: 'Angelic Bakehouse Sprouted 7-Grain Flatbread',
      packageSize: '4 count (9.5 oz)',
      priceUsd: 4.99,
      primeMemberPriceUsd: 4.49,
      inStock: true,
    },
    localCoop: {
      sku: 'COOP-BAKERY-FLAT',
      brandName: 'Wood-Fired Sourdough Protein Pita',
      packageSize: '4 count pack',
      priceUsd: 5.25,
      primeMemberPriceUsd: 5.25,
      inStock: true,
    },
  },
  'Smoky Rose Harissa Paste': {
    ingredientName: 'Smoky Rose Harissa Paste',
    amazonFresh: {
      sku: 'AF-HARISSA-6OZ',
      brandName: 'Aplenty Tunisian Harissa Chili Paste',
      packageSize: '6.7 oz jar',
      priceUsd: 3.29,
      primeMemberPriceUsd: 2.99,
      inStock: true,
      substitutionNote: 'Smart Sub: Aplenty store brand saves $2.00',
    },
    wholeFoods: {
      sku: 'WFM-MINA-HARISSA',
      brandName: 'Mina Moroccan Red Pepper Harissa',
      packageSize: '7 oz jar',
      priceUsd: 5.49,
      primeMemberPriceUsd: 4.94,
      inStock: true,
    },
    localCoop: {
      sku: 'COOP-HARISSA-ART',
      brandName: 'Artisan Smoked Chili Rose Harissa',
      packageSize: '6 oz jar',
      priceUsd: 5.75,
      primeMemberPriceUsd: 5.75,
      inStock: true,
    },
  },
  'Hemp Hearts & Pepitas': {
    ingredientName: 'Hemp Hearts & Pepitas',
    amazonFresh: {
      sku: 'AF-HEMP-PEPITA',
      brandName: 'Happy Belly Shelled Hemp & Roasted Pepitas',
      packageSize: '8 oz pouch',
      priceUsd: 4.49,
      primeMemberPriceUsd: 3.99,
      inStock: true,
    },
    wholeFoods: {
      sku: 'WFM-MANITOBA-HEMP',
      brandName: '365 Organic Hemp Hearts & Pumpkin Seeds',
      packageSize: '8 oz pouch',
      priceUsd: 5.29,
      primeMemberPriceUsd: 4.76,
      inStock: true,
    },
    localCoop: {
      sku: 'COOP-BULK-SEEDS',
      brandName: 'Organic Raw Hemp & Sprouted Pepita Mix',
      packageSize: '8 oz tub',
      priceUsd: 4.60,
      primeMemberPriceUsd: 4.60,
      inStock: true,
    },
  },
  'Chickpea & Lupini Protein Rigatoni': {
    ingredientName: 'Chickpea & Lupini Protein Rigatoni',
    amazonFresh: {
      sku: 'AF-BANZA-RIGATONI',
      brandName: 'Banza / Brami High-Protein Legume Rigatoni',
      packageSize: '8 oz box',
      priceUsd: 3.49,
      primeMemberPriceUsd: 3.15,
      inStock: true,
      substitutionNote: 'Prime deal: 24g protein per 2oz serving',
    },
    wholeFoods: {
      sku: 'WFM-BRAMI-LUPINI',
      brandName: 'Brami Italian Protein Lupini Rigatoni',
      packageSize: '8 oz box',
      priceUsd: 4.29,
      primeMemberPriceUsd: 3.86,
      inStock: true,
    },
    localCoop: {
      sku: 'COOP-PASTA-CHICKPEA',
      brandName: 'Artisan Chickpea & Red Lentil Penne',
      packageSize: '8 oz box',
      priceUsd: 4.50,
      primeMemberPriceUsd: 4.50,
      inStock: true,
    },
  },
  'Shelled Edamame Beans': {
    ingredientName: 'Shelled Edamame Beans',
    amazonFresh: {
      sku: 'AF-EDAMAME-12OZ',
      brandName: 'Amazon Fresh Organic Shelled Edamame',
      packageSize: '12 oz steam bag',
      priceUsd: 2.49,
      primeMemberPriceUsd: 2.19,
      inStock: true,
    },
    wholeFoods: {
      sku: 'WFM-365-EDAMAME',
      brandName: '365 Organic Shelled Edamame Soybeans',
      packageSize: '16 oz bag',
      priceUsd: 3.29,
      primeMemberPriceUsd: 2.96,
      inStock: true,
    },
    localCoop: {
      sku: 'COOP-FROZEN-EDAMAME',
      brandName: 'Pacific Northwest Non-GMO Edamame',
      packageSize: '12 oz bag',
      priceUsd: 3.40,
      primeMemberPriceUsd: 3.40,
      inStock: true,
    },
  },
  'Nutritional Yeast Flakes': {
    ingredientName: 'Nutritional Yeast Flakes',
    amazonFresh: {
      sku: 'AF-NOOCH-5OZ',
      brandName: 'Bragg Premium Nutritional Yeast',
      packageSize: '4.5 oz shaker',
      priceUsd: 4.19,
      primeMemberPriceUsd: 3.79,
      inStock: true,
    },
    wholeFoods: {
      sku: 'WFM-365-NOOCH',
      brandName: '365 Fortified Nutritional Yeast Flakes',
      packageSize: '5 oz shaker',
      priceUsd: 4.49,
      primeMemberPriceUsd: 4.04,
      inStock: true,
    },
    localCoop: {
      sku: 'COOP-BULK-NOOCH',
      brandName: 'Bulk Bin B12 Nutritional Yeast',
      packageSize: '4 oz jar',
      priceUsd: 3.65,
      primeMemberPriceUsd: 3.65,
      inStock: true,
      substitutionNote: 'Lowest unit price in bulk bin',
    },
  },
  'Toasted Black Sesame & Tamari Glaze': {
    ingredientName: 'Toasted Black Sesame & Tamari Glaze',
    amazonFresh: {
      sku: 'AF-TAMARI-SESAME',
      brandName: 'San-J Organic Gluten-Free Tamari & Sesame',
      packageSize: '10 oz bottle',
      priceUsd: 3.69,
      primeMemberPriceUsd: 3.29,
      inStock: true,
    },
    wholeFoods: {
      sku: 'WFM-365-TAMARI',
      brandName: '365 Organic Tamari & Toasted Sesame Oil',
      packageSize: '10 oz bottle',
      priceUsd: 4.19,
      primeMemberPriceUsd: 3.77,
      inStock: true,
    },
    localCoop: {
      sku: 'COOP-TAMARI-ART',
      brandName: 'Cedar Barrel Aged Shoyu & Black Sesame',
      packageSize: '8 oz bottle',
      priceUsd: 4.80,
      primeMemberPriceUsd: 4.80,
      inStock: true,
    },
  },
  'Persian Cucumbers': {
    ingredientName: 'Persian Cucumbers',
    amazonFresh: {
      sku: 'AF-CUKE-PERSIAN',
      brandName: 'Amazon Fresh Mini Persian Cucumbers',
      packageSize: '1 lb pouch',
      priceUsd: 2.39,
      primeMemberPriceUsd: 2.09,
      inStock: true,
    },
    wholeFoods: {
      sku: 'WFM-ORG-CUKE',
      brandName: 'Organic Mini Persian Cucumbers',
      packageSize: '1 lb tray',
      priceUsd: 3.29,
      primeMemberPriceUsd: 2.96,
      inStock: true,
    },
    localCoop: {
      sku: 'COOP-FARM-CUKE',
      brandName: 'Hydroponic Crunch Persian Cucumbers',
      packageSize: '1 lb bag',
      priceUsd: 2.75,
      primeMemberPriceUsd: 2.75,
      inStock: true,
    },
  },
  'Organic Three-Grain Tempeh': {
    ingredientName: 'Organic Three-Grain Tempeh',
    amazonFresh: {
      sku: 'AF-LIGHTLIFE-TEMPEH',
      brandName: 'Lightlife Organic Three-Grain Tempeh',
      packageSize: '8 oz pack',
      priceUsd: 3.19,
      primeMemberPriceUsd: 2.89,
      inStock: true,
    },
    wholeFoods: {
      sku: 'WFM-365-TEMPEH',
      brandName: '365 Organic Soy & Grain Tempeh',
      packageSize: '8 oz pack',
      priceUsd: 3.69,
      primeMemberPriceUsd: 3.32,
      inStock: true,
    },
    localCoop: {
      sku: 'COOP-TEMPEH-LOCAL',
      brandName: 'Small-Batch Fermented Grain Tempeh',
      packageSize: '8 oz pack',
      priceUsd: 3.95,
      primeMemberPriceUsd: 3.95,
      inStock: true,
    },
  },
  'Red Bell Peppers (4-Pack)': {
    ingredientName: 'Red Bell Peppers (4-Pack)',
    amazonFresh: {
      sku: 'AF-BELL-4PK',
      brandName: 'Amazon Fresh Sweet Red Bell Peppers',
      packageSize: '4 count bag',
      priceUsd: 4.49,
      primeMemberPriceUsd: 3.99,
      inStock: true,
    },
    wholeFoods: {
      sku: 'WFM-ORG-BELL4',
      brandName: 'Organic Sweet Red Bell Peppers',
      packageSize: '4 count pack',
      priceUsd: 5.99,
      primeMemberPriceUsd: 5.39,
      inStock: true,
    },
    localCoop: {
      sku: 'COOP-FARM-BELL',
      brandName: 'Greenhouse Sweet Bell Peppers',
      packageSize: '4 count basket',
      priceUsd: 4.85,
      primeMemberPriceUsd: 4.85,
      inStock: true,
    },
  },
  'Kalamata Olives & Capers': {
    ingredientName: 'Kalamata Olives & Capers',
    amazonFresh: {
      sku: 'AF-KALAMATA-JAR',
      brandName: 'Aplenty Pitted Greek Kalamata Olives',
      packageSize: '6 oz jar',
      priceUsd: 3.29,
      primeMemberPriceUsd: 2.95,
      inStock: true,
    },
    wholeFoods: {
      sku: 'WFM-DIVINA-KAL',
      brandName: 'Divina Organic Pitted Kalamata Olives',
      packageSize: '6 oz jar',
      priceUsd: 4.79,
      primeMemberPriceUsd: 4.31,
      inStock: true,
    },
    localCoop: {
      sku: 'COOP-OLIVE-BAR',
      brandName: 'Mediterranean Olive Bar Mix',
      packageSize: '6 oz tub',
      priceUsd: 4.40,
      primeMemberPriceUsd: 4.40,
      inStock: true,
    },
  },
  'Fire-Roasted Crushed Tomatoes': {
    ingredientName: 'Fire-Roasted Crushed Tomatoes',
    amazonFresh: {
      sku: 'AF-TOM-ROAST28',
      brandName: 'Happy Belly Fire-Roasted Crushed Tomatoes',
      packageSize: '28 oz can',
      priceUsd: 2.19,
      primeMemberPriceUsd: 1.89,
      inStock: true,
    },
    wholeFoods: {
      sku: 'WFM-MUIRGLEN-28',
      brandName: 'Muir Glen Organic Fire-Roasted Tomatoes',
      packageSize: '28 oz can',
      priceUsd: 3.29,
      primeMemberPriceUsd: 2.96,
      inStock: true,
    },
    localCoop: {
      sku: 'COOP-TOM-CAN',
      brandName: 'Regional Organic Crushed Tomatoes',
      packageSize: '28 oz can',
      priceUsd: 2.95,
      primeMemberPriceUsd: 2.95,
      inStock: true,
    },
  },
  'Organic Black Beans': {
    ingredientName: 'Organic Black Beans',
    amazonFresh: {
      sku: 'AF-BLKBEAN-15',
      brandName: 'Amazon Fresh Organic Black Beans',
      packageSize: '15 oz can',
      priceUsd: 1.29,
      primeMemberPriceUsd: 1.09,
      inStock: true,
    },
    wholeFoods: {
      sku: 'WFM-365-BLKBEAN',
      brandName: '365 Organic Low-Sodium Black Beans',
      packageSize: '15 oz can',
      priceUsd: 1.69,
      primeMemberPriceUsd: 1.52,
      inStock: true,
    },
    localCoop: {
      sku: 'COOP-BEAN-BLK',
      brandName: 'Co-op Basics Organic Black Beans',
      packageSize: '15 oz can',
      priceUsd: 1.75,
      primeMemberPriceUsd: 1.75,
      inStock: true,
    },
  },
  'Cremini & Shiitake Mushrooms': {
    ingredientName: 'Cremini & Shiitake Mushrooms',
    amazonFresh: {
      sku: 'AF-MUSH-GOURMET',
      brandName: 'Amazon Fresh Sliced Baby Bella & Shiitake',
      packageSize: '10 oz pack',
      priceUsd: 3.79,
      primeMemberPriceUsd: 3.39,
      inStock: true,
    },
    wholeFoods: {
      sku: 'WFM-ORG-MUSH',
      brandName: 'Organic Chef’s Mushroom Medley',
      packageSize: '10 oz pack',
      priceUsd: 4.99,
      primeMemberPriceUsd: 4.49,
      inStock: true,
    },
    localCoop: {
      sku: 'COOP-FORAGE-MUSH',
      brandName: 'Local Mycology Farm Cremini & Shiitake',
      packageSize: '10 oz punnet',
      priceUsd: 4.25,
      primeMemberPriceUsd: 4.25,
      inStock: true,
    },
  },
};

export function getQuoteForIngredient(ingredientName: string): StoreItemQuote {
  const existing = STORE_PRICE_CATALOG[ingredientName];
  if (existing) {
    return existing;
  }
  const normalized = Object.keys(STORE_PRICE_CATALOG).find(
    (key) => key.toLowerCase().includes(ingredientName.toLowerCase()) || ingredientName.toLowerCase().includes(key.toLowerCase())
  );
  if (normalized) {
    return STORE_PRICE_CATALOG[normalized];
  }
  const slug = ingredientName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'ITEM';
  return {
    ingredientName,
    amazonFresh: {
      sku: `AF-${slug}-STD`,
      brandName: `Amazon Fresh ${ingredientName}`,
      packageSize: '12 oz pack',
      priceUsd: 3.29,
      primeMemberPriceUsd: 2.95,
      inStock: true,
      substitutionNote: 'Prime Smart Value Match',
    },
    wholeFoods: {
      sku: `WFM-${slug}-ORG`,
      brandName: `365 by Whole Foods Organic ${ingredientName}`,
      packageSize: '12 oz pack',
      priceUsd: 4.19,
      primeMemberPriceUsd: 3.77,
      inStock: true,
    },
    localCoop: {
      sku: `COOP-${slug}-LOC`,
      brandName: `Local Co-op Farmstead ${ingredientName}`,
      packageSize: '12 oz pack',
      priceUsd: 3.99,
      primeMemberPriceUsd: 3.99,
      inStock: true,
    },
  };
}

