

// --- Types ---

export interface Column {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
}

export interface TableSchema {
  id: string;
  label: string;
  color: string;
  columns: Column[];
  position?: { x: number; y: number };
}

export interface Relationship {
  id: string;
  source: string;
  target: string;
  type: string;
  animated?: boolean;
  style?: any;
}

// --- Schema Definition ---

export const databaseSchema: TableSchema[] = [
  {
    id: 'users',
    label: 'users',
    color: '#3b82f6', // Blue
    position: { x: 100, y: 100 },
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true },
      { name: 'email', type: 'varchar(255)' },
      { name: 'first_name', type: 'varchar(100)' },
      { name: 'last_name', type: 'varchar(100)' },
      { name: 'role', type: 'varchar(20)' },
      { name: 'phone', type: 'varchar(20)' },
      { name: 'address', type: 'varchar(255)' },
      { name: 'city', type: 'varchar(100)' },
      { name: 'country', type: 'varchar(100)' },
      { name: 'zip_code', type: 'varchar(20)' },
      { name: 'job_title', type: 'varchar(100)' },
      { name: 'department', type: 'varchar(100)' },
      { name: 'company', type: 'varchar(100)' },
      { name: 'status', type: 'varchar(20)' },
      { name: 'bio', type: 'text' },
      { name: 'metadata', type: 'jsonb' },
      { name: 'created_at', type: 'timestamp' },
      { name: 'last_login', type: 'timestamp' },
    ],
  },
  {
    id: 'categories',
    label: 'categories',
    color: '#ec4899', // Pink
    position: { x: 500, y: 400 },
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true },
      { name: 'name', type: 'varchar(100)' },
      { name: 'description', type: 'text' },
      { name: 'slug', type: 'varchar(100)' },
    ],
  },
  {
    id: 'products',
    label: 'products',
    color: '#f59e0b', // Amber
    position: { x: 500, y: 100 },
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true },
      { name: 'category_id', type: 'uuid', isForeign: true },
      { name: 'name', type: 'varchar(255)' },
      { name: 'description', type: 'text' },
      { name: 'price', type: 'decimal(10,2)' },
      { name: 'stock_quantity', type: 'integer' },
      { name: 'created_at', type: 'timestamp' },
    ],
  },
  {
    id: 'orders',
    label: 'orders',
    color: '#10b981', // Emerald
    position: { x: 900, y: 100 },
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true },
      { name: 'user_id', type: 'uuid', isForeign: true },
      { name: 'status', type: 'varchar(50)' },
      { name: 'total_amount', type: 'decimal(10,2)' },
      { name: 'shipping_address', type: 'text' },
      { name: 'created_at', type: 'timestamp' },
    ],
  },
  {
    id: 'order_items',
    label: 'order_items',
    color: '#8b5cf6', // Violet
    position: { x: 900, y: 400 },
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true },
      { name: 'order_id', type: 'uuid', isForeign: true },
      { name: 'product_id', type: 'uuid', isForeign: true },
      { name: 'quantity', type: 'integer' },
      { name: 'unit_price', type: 'decimal(10,2)' },
    ],
  },
  {
    id: 'reviews',
    label: 'reviews',
    color: '#6366f1', // Indigo
    position: { x: 100, y: 400 },
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true },
      { name: 'user_id', type: 'uuid', isForeign: true },
      { name: 'product_id', type: 'uuid', isForeign: true },
      { name: 'rating', type: 'integer' },
      { name: 'comment', type: 'text' },
      { name: 'created_at', type: 'timestamp' },
    ],
  },
];

export const databaseRelationships: Relationship[] = [
  { id: 'e_users_orders', source: 'users', target: 'orders', type: 'smoothstep', animated: true, style: { stroke: '#64748b', strokeWidth: 1.5 } },
  { id: 'e_users_reviews', source: 'users', target: 'reviews', type: 'smoothstep', animated: true, style: { stroke: '#64748b', strokeWidth: 1.5 } },
  { id: 'e_categories_products', source: 'categories', target: 'products', type: 'smoothstep', animated: true, style: { stroke: '#64748b', strokeWidth: 1.5 } },
  { id: 'e_products_order_items', source: 'products', target: 'order_items', type: 'smoothstep', animated: true, style: { stroke: '#64748b', strokeWidth: 1.5 } },
  { id: 'e_products_reviews', source: 'products', target: 'reviews', type: 'smoothstep', animated: true, style: { stroke: '#64748b', strokeWidth: 1.5 } },
  { id: 'e_orders_order_items', source: 'orders', target: 'order_items', type: 'smoothstep', animated: true, style: { stroke: '#64748b', strokeWidth: 1.5 } },
];

// --- Data Generation Helpers ---

const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'example.com'];
const streets = ['Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine St', 'Elm St', 'Washington Ave', 'Lakeview Dr'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'];
const countries = ['USA', 'Canada', 'UK', 'Australia', 'Germany', 'France', 'Japan', 'Brazil'];
const jobTitles = ['Software Engineer', 'Product Manager', 'Designer', 'Data Analyst', 'Marketing Specialist', 'Sales Manager', 'HR Coordinator', 'CEO'];
const departments = ['Engineering', 'Product', 'Design', 'Data', 'Marketing', 'Sales', 'HR', 'Executive'];
const productAdjectives = ['Premium', 'Deluxe', 'Standard', 'Basic', 'Pro', 'Ultra', 'Smart', 'Eco', 'Vintage', 'Modern'];
const productNouns = ['Widget', 'Gadget', 'Tool', 'Device', 'System', 'Module', 'Unit', 'Component', 'Accessory', 'Kit'];

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// --- Mock Data Generation ---

export const generateMockData = () => {
  // 1. Categories
  const categories = [
    { id: 'c1', name: 'Electronics', description: 'Gadgets and devices', slug: 'electronics' },
    { id: 'c2', name: 'Clothing', description: 'Apparel and fashion', slug: 'clothing' },
    { id: 'c3', name: 'Home & Garden', description: 'Furniture and decor', slug: 'home-garden' },
    { id: 'c4', name: 'Sports', description: 'Athletic gear', slug: 'sports' },
    { id: 'c5', name: 'Books', description: 'Fiction and non-fiction', slug: 'books' },
  ];

  // 2. Users (1000 records)
  const users = Array.from({ length: 1000 }).map((_, i) => {
    const first = randomItem(firstNames);
    const last = randomItem(lastNames);
    return {
      id: `u${i + 1}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@${randomItem(domains)}`,
      first_name: first,
      last_name: last,
      role: Math.random() > 0.95 ? 'admin' : 'customer',
      phone: `+1 (${randomInt(100, 999)}) ${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
      address: `${randomInt(100, 9999)} ${randomItem(streets)}`,
      city: randomItem(cities),
      country: randomItem(countries),
      zip_code: `${randomInt(10000, 99999)}`,
      job_title: randomItem(jobTitles),
      department: randomItem(departments),
      company: `${last} Inc.`,
      status: Math.random() > 0.1 ? 'active' : 'inactive',
      bio: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
      metadata: JSON.stringify({
        preferences: {
          theme: Math.random() > 0.5 ? 'dark' : 'light',
          notifications: {
            email: Math.random() > 0.5,
            sms: Math.random() > 0.5,
            push: true
          },
          language: randomItem(['en', 'es', 'fr', 'de', 'jp'])
        },
        device_info: {
          last_ip: `192.168.${randomInt(0, 255)}.${randomInt(0, 255)}`,
          user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          screen_resolution: `${randomInt(1366, 2560)}x${randomInt(768, 1440)}`
        },
        history: Array.from({ length: 5 }).map((_, idx) => ({
          action: randomItem(['login', 'view_product', 'add_to_cart', 'checkout']),
          timestamp: new Date(Date.now() - idx * 86400000).toISOString(),
          details: {
            session_id: `sess_${Math.random().toString(36).substring(7)}`,
            duration: randomInt(60, 3600)
          }
        }))
      }, null, 2),
      created_at: randomDate(new Date(2023, 0, 1), new Date()).toISOString(),
      last_login: randomDate(new Date(2024, 0, 1), new Date()).toISOString(),
    };
  });

  // 3. Products (100 records)
  const products = Array.from({ length: 100 }).map((_, i) => {
    const category = randomItem(categories);
    return {
      id: `p${i + 1}`,
      category_id: category.id,
      name: `${randomItem(productAdjectives)} ${randomItem(productNouns)} ${randomInt(100, 999)}`,
      description: `A high-quality ${category.name.toLowerCase()} item.`,
      price: Number((Math.random() * 500 + 10).toFixed(2)),
      stock_quantity: randomInt(0, 500),
      created_at: randomDate(new Date(2023, 0, 1), new Date()).toISOString(),
    };
  });

  // 4. Orders (500 records)
  const orders = Array.from({ length: 500 }).map((_, i) => {
    const user = randomItem(users);
    return {
      id: `o${i + 1}`,
      user_id: user.id,
      status: randomItem(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
      total_amount: 0, // Will calculate later
      shipping_address: `${randomInt(100, 9999)} ${randomItem(streets)}, ${randomItem(cities)}`,
      created_at: randomDate(new Date(user.created_at), new Date()).toISOString(),
    };
  });

  // 5. Order Items (1500 records)
  const orderItems = Array.from({ length: 1500 }).map((_, i) => {
    const order = randomItem(orders);
    const product = randomItem(products);
    const quantity = randomInt(1, 5);
    const unit_price = product.price;
    
    // Update order total
    // Note: This is a simple mutation for mock data generation
    const orderIndex = orders.findIndex(o => o.id === order.id);
    if (orderIndex !== -1) {
        orders[orderIndex].total_amount += quantity * unit_price;
        orders[orderIndex].total_amount = Number(orders[orderIndex].total_amount.toFixed(2));
    }

    return {
      id: `oi${i + 1}`,
      order_id: order.id,
      product_id: product.id,
      quantity,
      unit_price,
    };
  });

  // 6. Reviews (300 records)
  const reviews = Array.from({ length: 300 }).map((_, i) => {
    const user = randomItem(users);
    const product = randomItem(products);
    return {
      id: `r${i + 1}`,
      user_id: user.id,
      product_id: product.id,
      rating: randomInt(1, 5),
      comment: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      created_at: randomDate(new Date(2024, 0, 1), new Date()).toISOString(),
    };
  });

  return {
    users,
    categories,
    products,
    orders,
    orderItems,
    reviews
  };
};

export const mockDatabase = generateMockData();
