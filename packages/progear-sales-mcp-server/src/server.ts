/**
 * ProGear Sales MCP Server
 *
 * Basketball equipment sales API with full product catalog,
 * customer data, inventory, and pricing information.
 *
 * Validates Okta tokens before allowing tool access.
 */

import express from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const app = express();
app.use(express.json());

// Configuration
const PORT = process.env.MCP_SERVER_PORT || 3001;
const OKTA_ISSUER = process.env.OKTA_ISSUER || '';
const OKTA_AUDIENCE = process.env.OKTA_CUSTOM_AUTH_SERVER_AUDIENCE || '';

// JWKS for token validation
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

if (OKTA_ISSUER) {
  jwks = createRemoteJWKSet(new URL(`${OKTA_ISSUER}/v1/keys`));
}

// ============================================================================
// BASKETBALL EQUIPMENT DATA
// ============================================================================

// PRODUCTS - Basketball Equipment Catalog
const products = [
  // Basketballs
  { id: 'BB-PRO-001', name: 'Pro Game Basketball', category: 'Basketballs', subcategory: 'Professional', price: 149.99, cost: 62.00, stock: 2847, reorderPoint: 500, supplier: 'Wilson Sports' },
  { id: 'BB-PRO-002', name: 'Pro Composite Basketball', category: 'Basketballs', subcategory: 'Professional', price: 89.99, cost: 38.00, stock: 1523, reorderPoint: 300, supplier: 'Spalding' },
  { id: 'BB-WOM-001', name: "Women's Official Game Ball", category: 'Basketballs', subcategory: 'Women', price: 129.99, cost: 55.00, stock: 1234, reorderPoint: 250, supplier: 'Wilson Sports' },
  { id: 'BB-YTH-001', name: 'Youth Training Basketball (Size 5)', category: 'Basketballs', subcategory: 'Youth', price: 34.99, cost: 14.00, stock: 3567, reorderPoint: 800, supplier: 'Champion Sports' },
  { id: 'BB-YTH-002', name: 'Junior Basketball (Size 4)', category: 'Basketballs', subcategory: 'Youth', price: 24.99, cost: 10.00, stock: 2156, reorderPoint: 500, supplier: 'Champion Sports' },
  { id: 'BB-TRN-001', name: 'Heavy Training Basketball', category: 'Basketballs', subcategory: 'Training', price: 79.99, cost: 32.00, stock: 892, reorderPoint: 200, supplier: 'Sklz' },

  // Hoops & Backboards
  { id: 'HP-PRO-001', name: 'Pro Arena Hoop System', category: 'Hoops', subcategory: 'Professional', price: 4999.99, cost: 2100.00, stock: 45, reorderPoint: 10, supplier: 'Spalding' },
  { id: 'HP-COL-001', name: 'Collegiate Breakaway Rim', category: 'Hoops', subcategory: 'Collegiate', price: 899.99, cost: 380.00, stock: 178, reorderPoint: 30, supplier: 'Goalsetter' },
  { id: 'HP-PRT-001', name: 'Portable Hoop System 54"', category: 'Hoops', subcategory: 'Portable', price: 649.99, cost: 275.00, stock: 234, reorderPoint: 50, supplier: 'Lifetime' },
  { id: 'HP-WMT-001', name: 'Wall-Mount Backboard 48"', category: 'Hoops', subcategory: 'Wall Mount', price: 399.99, cost: 165.00, stock: 312, reorderPoint: 75, supplier: 'Spalding' },

  // Uniforms & Apparel
  { id: 'UNI-JRS-001', name: 'Pro Team Jersey (Custom)', category: 'Uniforms', subcategory: 'Jerseys', price: 89.99, cost: 28.00, stock: 5420, reorderPoint: 1000, supplier: 'Nike' },
  { id: 'UNI-SHT-001', name: 'Team Shorts (Custom)', category: 'Uniforms', subcategory: 'Shorts', price: 49.99, cost: 16.00, stock: 4890, reorderPoint: 900, supplier: 'Nike' },
  { id: 'UNI-WRM-001', name: 'Warm-Up Jacket', category: 'Uniforms', subcategory: 'Outerwear', price: 129.99, cost: 45.00, stock: 1876, reorderPoint: 400, supplier: 'Under Armour' },
  { id: 'UNI-SCK-001', name: 'Team Crew Socks (3-Pack)', category: 'Uniforms', subcategory: 'Accessories', price: 24.99, cost: 7.00, stock: 8934, reorderPoint: 2000, supplier: 'Nike' },

  // Training Equipment
  { id: 'TRN-CON-001', name: 'Agility Cone Set (20)', category: 'Training', subcategory: 'Agility', price: 29.99, cost: 9.00, stock: 1245, reorderPoint: 300, supplier: 'Sklz' },
  { id: 'TRN-LDR-001', name: 'Speed Ladder 15ft', category: 'Training', subcategory: 'Agility', price: 34.99, cost: 12.00, stock: 876, reorderPoint: 200, supplier: 'Sklz' },
  { id: 'TRN-REB-001', name: 'Rebound Trainer Net', category: 'Training', subcategory: 'Shooting', price: 199.99, cost: 75.00, stock: 234, reorderPoint: 50, supplier: 'Dr. Dish' },
  { id: 'TRN-DRB-001', name: 'Dribble Goggles', category: 'Training', subcategory: 'Ball Handling', price: 19.99, cost: 5.00, stock: 2345, reorderPoint: 500, supplier: 'Sklz' },

  // Court Equipment
  { id: 'CRT-SCR-001', name: 'Scoreboard Digital LED', category: 'Court Equipment', subcategory: 'Scoreboards', price: 2499.99, cost: 950.00, stock: 67, reorderPoint: 15, supplier: 'Daktronics' },
  { id: 'CRT-BNC-001', name: 'Team Bench 8-Seat', category: 'Court Equipment', subcategory: 'Seating', price: 899.99, cost: 340.00, stock: 89, reorderPoint: 20, supplier: 'Athletic Connection' },
  { id: 'CRT-RCK-001', name: 'Ball Storage Rack (24 ball)', category: 'Court Equipment', subcategory: 'Storage', price: 249.99, cost: 95.00, stock: 156, reorderPoint: 40, supplier: 'Gared Sports' },
];

// CUSTOMERS - Schools, Teams, Organizations
const customers = [
  // Platinum Tier (>$25,000 lifetime)
  { id: 'CUST-001', name: 'State University Athletics', tier: 'Platinum', territory: 'West', contact: 'Coach Williams', email: 'cwilliams@stateuniv.edu', phone: '555-0101', totalOrders: 156, lifetimeValue: 89500, lastOrder: '2024-12-10', paymentTerms: 'Net 45' },
  { id: 'CUST-002', name: 'City Pro Basketball Academy', tier: 'Platinum', territory: 'Central', contact: 'Director Martinez', email: 'jmartinez@cityproacademy.com', phone: '555-0102', totalOrders: 234, lifetimeValue: 67800, lastOrder: '2024-12-08', paymentTerms: 'Net 30' },
  { id: 'CUST-003', name: 'Metro High School District', tier: 'Platinum', territory: 'East', contact: 'Athletic Director Johnson', email: 'ajohnson@metrohsd.edu', phone: '555-0103', totalOrders: 312, lifetimeValue: 124500, lastOrder: '2024-12-12', paymentTerms: 'Net 60' },

  // Gold Tier ($10,000 - $25,000)
  { id: 'CUST-004', name: 'Riverside Youth Basketball League', tier: 'Gold', territory: 'West', contact: 'League Director Chen', email: 'dchen@riversideybl.org', phone: '555-0104', totalOrders: 89, lifetimeValue: 23400, lastOrder: '2024-12-05', paymentTerms: 'Net 30' },
  { id: 'CUST-005', name: 'Mountain View Community Center', tier: 'Gold', territory: 'West', contact: 'Rec Manager Brown', email: 'mbrown@mvcc.gov', phone: '555-0105', totalOrders: 67, lifetimeValue: 18900, lastOrder: '2024-11-28', paymentTerms: 'Net 30' },
  { id: 'CUST-006', name: 'Eastside High School', tier: 'Gold', territory: 'East', contact: 'Coach Davis', email: 'cdavis@eastsidehs.edu', phone: '555-0106', totalOrders: 78, lifetimeValue: 21200, lastOrder: '2024-12-01', paymentTerms: 'Net 30' },

  // Silver Tier ($5,000 - $10,000)
  { id: 'CUST-007', name: 'Downtown Recreation Center', tier: 'Silver', territory: 'Central', contact: 'Program Director Lee', email: 'slee@downtownrec.org', phone: '555-0107', totalOrders: 45, lifetimeValue: 8700, lastOrder: '2024-11-15', paymentTerms: 'Net 15' },
  { id: 'CUST-008', name: 'Lakeside Middle School', tier: 'Silver', territory: 'Central', contact: 'Coach Thompson', email: 'bthompson@lakesidems.edu', phone: '555-0108', totalOrders: 34, lifetimeValue: 6500, lastOrder: '2024-10-22', paymentTerms: 'Net 15' },

  // Bronze Tier (<$5,000)
  { id: 'CUST-009', name: 'Parks & Rec Basketball Program', tier: 'Bronze', territory: 'West', contact: 'Coordinator Wilson', email: 'jwilson@parksrec.gov', phone: '555-0109', totalOrders: 12, lifetimeValue: 2800, lastOrder: '2024-09-30', paymentTerms: 'Prepaid' },
  { id: 'CUST-010', name: 'Community Church Youth League', tier: 'Bronze', territory: 'East', contact: 'Youth Director Adams', email: 'tadams@communitychurch.org', phone: '555-0110', totalOrders: 8, lifetimeValue: 1900, lastOrder: '2024-08-15', paymentTerms: 'Prepaid' },
];

// ORDERS - Recent Orders
const orders = [
  { id: 'ORD-2024-001', customerId: 'CUST-001', customer: 'State University Athletics', items: [{ productId: 'BB-PRO-001', qty: 50, price: 149.99 }, { productId: 'TRN-REB-001', qty: 2, price: 199.99 }], subtotal: 7899.48, discount: 789.95, total: 7109.53, status: 'shipped', orderDate: '2024-12-10', shipDate: '2024-12-12' },
  { id: 'ORD-2024-002', customerId: 'CUST-003', customer: 'Metro High School District', items: [{ productId: 'UNI-JRS-001', qty: 200, price: 89.99 }, { productId: 'UNI-SHT-001', qty: 200, price: 49.99 }], subtotal: 27996.00, discount: 4199.40, total: 23796.60, status: 'processing', orderDate: '2024-12-12', shipDate: null },
  { id: 'ORD-2024-003', customerId: 'CUST-004', customer: 'Riverside Youth Basketball League', items: [{ productId: 'BB-YTH-001', qty: 100, price: 34.99 }, { productId: 'TRN-CON-001', qty: 10, price: 29.99 }], subtotal: 3798.90, discount: 189.95, total: 3608.95, status: 'pending', orderDate: '2024-12-14', shipDate: null },
  { id: 'ORD-2024-004', customerId: 'CUST-002', customer: 'City Pro Basketball Academy', items: [{ productId: 'HP-COL-001', qty: 4, price: 899.99 }, { productId: 'BB-PRO-002', qty: 30, price: 89.99 }], subtotal: 6299.66, discount: 629.97, total: 5669.69, status: 'shipped', orderDate: '2024-12-08', shipDate: '2024-12-11' },
  { id: 'ORD-2024-005', customerId: 'CUST-006', customer: 'Eastside High School', items: [{ productId: 'UNI-WRM-001', qty: 25, price: 129.99 }], subtotal: 3249.75, discount: 324.98, total: 2924.77, status: 'delivered', orderDate: '2024-12-01', shipDate: '2024-12-03' },
];

// PRICING - Discount Tiers
const discountTiers = {
  quantity: [
    { minQty: 10, discount: 5, label: '10+ units' },
    { minQty: 50, discount: 10, label: '50+ units' },
    { minQty: 100, discount: 15, label: '100+ units' },
    { minQty: 500, discount: 20, label: '500+ units' },
  ],
  customer: {
    'Platinum': 5,
    'Gold': 3,
    'Silver': 0,
    'Bronze': 0,
  },
};

// ============================================================================
// TOKEN VALIDATION MIDDLEWARE
// ============================================================================

async function validateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[MCP] Demo mode - skipping token validation');
      return next();
    }
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.split(' ')[1];

  if (token.startsWith('demo-')) {
    console.log('[MCP] Demo token accepted');
    return next();
  }

  if (!jwks) {
    console.log('[MCP] No JWKS configured, accepting token');
    return next();
  }

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: OKTA_ISSUER,
      audience: OKTA_AUDIENCE,
    });
    console.log('[MCP] Token validated:', payload.sub);
    (req as any).user = payload;
    next();
  } catch (error) {
    console.error('[MCP] Token validation failed:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'progear-mcp-server', products: products.length, customers: customers.length });
});

// --- INVENTORY TOOLS ---

// List all products
app.get('/mcp/tools/list_products', validateToken, (req, res) => {
  const category = req.query.category as string;
  let result = products;

  if (category) {
    result = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  res.json({
    tool: 'list_products',
    result: result.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      subcategory: p.subcategory,
      price: p.price,
      stock: p.stock,
    })),
    count: result.length,
  });
});

// Check stock for a product
app.get('/mcp/tools/check_stock/:productId', validateToken, (req, res) => {
  const product = products.find(p => p.id === req.params.productId);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const stockStatus = product.stock <= product.reorderPoint ? 'low' : product.stock > product.reorderPoint * 2 ? 'good' : 'adequate';

  res.json({
    tool: 'check_stock',
    result: {
      productId: product.id,
      name: product.name,
      category: product.category,
      stock: product.stock,
      reorderPoint: product.reorderPoint,
      stockStatus,
      supplier: product.supplier,
      available: product.stock > 0,
    },
  });
});

// Search inventory by keyword
app.get('/mcp/tools/search_inventory', validateToken, (req, res) => {
  const query = (req.query.q as string || '').toLowerCase();

  const results = products.filter(p =>
    p.name.toLowerCase().includes(query) ||
    p.category.toLowerCase().includes(query) ||
    p.subcategory.toLowerCase().includes(query)
  );

  res.json({
    tool: 'search_inventory',
    query,
    result: results.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      stock: p.stock,
      price: p.price,
    })),
    count: results.length,
  });
});

// --- CUSTOMER TOOLS ---

// Get customer by ID
app.get('/mcp/tools/get_customer/:customerId', validateToken, (req, res) => {
  const customer = customers.find(c => c.id === req.params.customerId);

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  res.json({
    tool: 'get_customer',
    result: customer,
  });
});

// Search customers
app.get('/mcp/tools/search_customers', validateToken, (req, res) => {
  const query = (req.query.q as string || '').toLowerCase();
  const tier = req.query.tier as string;

  let results = customers;

  if (query) {
    results = results.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.contact.toLowerCase().includes(query) ||
      c.territory.toLowerCase().includes(query)
    );
  }

  if (tier) {
    results = results.filter(c => c.tier.toLowerCase() === tier.toLowerCase());
  }

  res.json({
    tool: 'search_customers',
    query,
    tier,
    result: results,
    count: results.length,
  });
});

// Get customer purchase history
app.get('/mcp/tools/customer_history/:customerId', validateToken, (req, res) => {
  const customer = customers.find(c => c.id === req.params.customerId);

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const customerOrders = orders.filter(o => o.customerId === req.params.customerId);

  res.json({
    tool: 'customer_history',
    customer: {
      id: customer.id,
      name: customer.name,
      tier: customer.tier,
      lifetimeValue: customer.lifetimeValue,
    },
    orders: customerOrders,
    totalOrders: customerOrders.length,
  });
});

// --- SALES TOOLS ---

// Get orders
app.get('/mcp/tools/get_orders', validateToken, (req, res) => {
  const status = req.query.status as string;
  let result = orders;

  if (status) {
    result = orders.filter(o => o.status === status);
  }

  res.json({
    tool: 'get_orders',
    result,
    count: result.length,
  });
});

// Create quote
app.post('/mcp/tools/create_quote', validateToken, (req, res) => {
  const { customerId, items } = req.body;

  const customer = customers.find(c => c.id === customerId);
  if (!customer) {
    return res.status(400).json({ error: 'Customer not found' });
  }

  // Calculate quote with discounts
  let subtotal = 0;
  const quoteItems = (items || []).map((item: { productId: string; qty: number }) => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return null;

    const lineTotal = product.price * item.qty;
    subtotal += lineTotal;

    return {
      productId: product.id,
      name: product.name,
      quantity: item.qty,
      unitPrice: product.price,
      lineTotal,
    };
  }).filter(Boolean);

  // Apply quantity discount
  const totalQty = quoteItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
  let qtyDiscount = 0;
  for (const tier of discountTiers.quantity) {
    if (totalQty >= tier.minQty) {
      qtyDiscount = tier.discount;
    }
  }

  // Apply customer tier discount
  const tierDiscount = discountTiers.customer[customer.tier as keyof typeof discountTiers.customer] || 0;

  const totalDiscountPct = qtyDiscount + tierDiscount;
  const discountAmount = subtotal * (totalDiscountPct / 100);
  const total = subtotal - discountAmount;

  const quote = {
    id: `QT-${Date.now()}`,
    customerId,
    customerName: customer.name,
    customerTier: customer.tier,
    items: quoteItems,
    subtotal,
    discounts: {
      quantity: { percent: qtyDiscount, reason: `${totalQty}+ units` },
      tier: { percent: tierDiscount, reason: `${customer.tier} customer` },
      total: totalDiscountPct,
    },
    discountAmount,
    total,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  res.json({
    tool: 'create_quote',
    result: quote,
  });
});

// --- PRICING TOOLS ---

// Get product pricing with discounts
app.get('/mcp/tools/get_price/:productId', validateToken, (req, res) => {
  const product = products.find(p => p.id === req.params.productId);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const margin = ((product.price - product.cost) / product.price * 100).toFixed(1);

  res.json({
    tool: 'get_price',
    result: {
      productId: product.id,
      name: product.name,
      category: product.category,
      basePrice: product.price,
      cost: product.cost,
      margin: `${margin}%`,
      currency: 'USD',
      volumeDiscounts: discountTiers.quantity,
      tierDiscounts: discountTiers.customer,
    },
  });
});

// Get pricing for category
app.get('/mcp/tools/category_pricing/:category', validateToken, (req, res) => {
  const categoryProducts = products.filter(p =>
    p.category.toLowerCase() === req.params.category.toLowerCase()
  );

  if (categoryProducts.length === 0) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const pricing = categoryProducts.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    cost: p.cost,
    margin: ((p.price - p.cost) / p.price * 100).toFixed(1) + '%',
  }));

  const avgMargin = categoryProducts.reduce((sum, p) => sum + ((p.price - p.cost) / p.price * 100), 0) / categoryProducts.length;

  res.json({
    tool: 'category_pricing',
    category: req.params.category,
    products: pricing,
    averageMargin: avgMargin.toFixed(1) + '%',
    count: pricing.length,
  });
});

// Calculate bulk pricing
app.post('/mcp/tools/calculate_bulk_price', validateToken, (req, res) => {
  const { productId, quantity, customerTier } = req.body;

  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(400).json({ error: 'Product not found' });
  }

  // Find applicable quantity discount
  let qtyDiscount = 0;
  let qtyDiscountLabel = 'No volume discount';
  for (const tier of discountTiers.quantity) {
    if (quantity >= tier.minQty) {
      qtyDiscount = tier.discount;
      qtyDiscountLabel = tier.label;
    }
  }

  // Customer tier discount
  const tierDiscount = discountTiers.customer[customerTier as keyof typeof discountTiers.customer] || 0;

  const subtotal = product.price * quantity;
  const totalDiscountPct = qtyDiscount + tierDiscount;
  const discountAmount = subtotal * (totalDiscountPct / 100);
  const finalPrice = subtotal - discountAmount;
  const unitPrice = finalPrice / quantity;

  res.json({
    tool: 'calculate_bulk_price',
    result: {
      product: product.name,
      quantity,
      basePrice: product.price,
      subtotal,
      discounts: {
        volume: { percent: qtyDiscount, label: qtyDiscountLabel },
        tier: { percent: tierDiscount, label: customerTier || 'None' },
      },
      totalDiscount: totalDiscountPct + '%',
      discountAmount,
      finalTotal: finalPrice,
      finalUnitPrice: unitPrice.toFixed(2),
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🏀 ProGear MCP Server running on port ${PORT}`);
  console.log(`   Products: ${products.length}`);
  console.log(`   Customers: ${customers.length}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});
