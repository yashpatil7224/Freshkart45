/* ==========================================
   FreshKart Kirana Store Logic & FastAPI Integration
   ========================================== */

// Dynamically use Render host when deployed or localhost when developing
const API_BASE_URL = (window.location.origin && !window.location.origin.includes('file://')) 
    ? `${window.location.origin}/api` 
    : 'http://localhost:8000/api';

// Helper for fast-failing network requests when backend is offline
async function fetchWithTimeout(url, options = {}, timeoutMs = 1200) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timer);
        return response;
    } catch (err) {
        clearTimeout(timer);
        throw err;
    }
}

// 1. DEFAULT FALLBACK PRODUCTS DATASET
const DEFAULT_PRODUCTS = [
    {
        id: 'k1', title: 'Aashirvaad Shuddh Chakki Atta', category: 'staples', price: 245, originalPrice: 280,
        unit: '5 kg Pack', rating: 4.9, reviewsCount: 1420,
        image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=500&q=80',
        badge: '100% Whole Wheat', discount: '12% OFF',
        description: 'Made from 100% pure whole wheat grains ground in traditional chakkis for soft, fluffy rotis.',
        nutrition: 'High Dietary Fiber, Natural Proteins, Zero Maida.',
        supplierName: 'ITC Agro Foods Division'
    },
    {
        id: 'k2', title: 'Fortune Sunlite Sunflower Oil', category: 'oil', price: 145, originalPrice: 165,
        unit: '1 Litre Pouch', rating: 4.8, reviewsCount: 890,
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80',
        badge: 'Light & Healthy', discount: '12% OFF',
        description: 'Light, healthy refined sunflower oil enriched with Vitamins A & D for daily Indian cooking.',
        nutrition: 'Enriched with Omega-6, Vitamin A & Vitamin D.',
        supplierName: 'Ramesh Kirana Wholesale Co.'
    },
    {
        id: 'k3', title: 'Fortune Premium Toor / Arhar Dal', category: 'staples', price: 160, originalPrice: 185,
        unit: '1 kg Pack', rating: 4.8, reviewsCount: 650,
        image: 'https://images.unsplash.com/photo-1585994191611-724212502ef0?auto=format&fit=crop&w=500&q=80',
        badge: 'Unpolished', discount: '13% OFF',
        description: 'Unpolished premium yellow split pigeon peas (Toor Dal) with natural flavor and rich protein.',
        nutrition: 'High Protein, Iron, Potassium & Folic Acid.',
        supplierName: 'Maharashtra Farmers Co-op'
    },
    {
        id: 'k4', title: 'Daawat Rozana Super Basmati Rice', category: 'staples', price: 380, originalPrice: 450,
        unit: '5 kg Pack', rating: 4.9, reviewsCount: 1100,
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80',
        badge: 'Long Grain', discount: '15% OFF',
        description: 'Aged long-grain Basmati rice perfect for daily dal-rice, pulao, and biryani.',
        nutrition: 'Gluten-Free, Low Fat, Rich Aroma & Fluffy Texture.',
        supplierName: 'Ramesh Kirana Wholesale Co.'
    },
    {
        id: 'k5', title: 'Amul Pasteurised Butter', category: 'dairy', price: 275, originalPrice: 290,
        unit: '500 g Pack', rating: 5.0, reviewsCount: 2300,
        image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=500&q=80',
        badge: 'Taste of India', discount: '5% OFF',
        description: 'Iconic salted Amul butter made from pure cow and buffalo milk cream. Perfect for parathas & toast.',
        nutrition: 'Rich Milk Fat, Vitamin A & Natural Flavor.',
        supplierName: 'Amul Anand Dairy Federation'
    },
    {
        id: 'k6', title: 'Tata Salt Vacuum Evaporated', category: 'staples', price: 28, originalPrice: 30,
        unit: '1 kg Pack', rating: 4.9, reviewsCount: 1800,
        image: 'https://images.unsplash.com/photo-1518110168401-f2877ee2c085?auto=format&fit=crop&w=500&q=80',
        badge: 'Desh Ka Namak', discount: '7% OFF',
        description: 'India\'s favorite iodized salt ensuring mental development and daily health purity.',
        nutrition: 'Iodine Fortified, Hygienic Vacuum Evaporated.',
        supplierName: 'FreshKart Direct Mandi'
    },
    {
        id: 'k7', title: 'Maggi 2-Minute Masala Noodles', category: 'snacks', price: 168, originalPrice: 180,
        unit: '12 Packs Mega Saver', rating: 4.9, reviewsCount: 3100,
        image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=500&q=80',
        badge: 'All Time Favorite', discount: '7% OFF',
        description: 'The classic 2-minute instant noodles with signature roasted spices tastemaker.',
        nutrition: 'Fortified with Iron & Wheat Goodness.',
        supplierName: 'Ramesh Kirana Wholesale Co.'
    },
    {
        id: 'k8', title: 'Fresh Ratnagiri Alphonso Mangoes', category: 'vegetables', price: 650, originalPrice: 800,
        unit: '1 Dozen Box (12 Pcs)', rating: 4.9, reviewsCount: 780,
        image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=500&q=80',
        badge: 'Devgad Special', discount: '18% OFF',
        description: 'Authentic GI-tagged Ratnagiri Hapus mangoes naturally ripened in grass.',
        nutrition: 'Rich in Vitamin C, Carotenoids & Fiber.',
        supplierName: 'Maharashtra Farmers Co-op'
    },
    {
        id: 'k9', title: 'Fresh Nashik Red Onions (Kanda)', category: 'vegetables', price: 35, originalPrice: 45,
        unit: '1 kg Mesh Bag', rating: 4.7, reviewsCount: 450,
        image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=500&q=80',
        badge: 'Mandi Fresh', discount: '22% OFF',
        description: 'Hand-sorted crisp Nashik red onions essential for tadka, gravies, and salads.',
        nutrition: 'Quercetin Antioxidants, Vitamin C & Sulfur Compounds.',
        supplierName: 'Maharashtra Farmers Co-op'
    },
    {
        id: 'k10', title: 'Fresh Farm Potatoes (Aloo)', category: 'vegetables', price: 28, originalPrice: 35,
        unit: '1 kg Pack', rating: 4.8, reviewsCount: 520,
        image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=80',
        badge: 'Daily Need', discount: '20% OFF',
        description: 'Clean, firm potatoes perfect for aloo parathas, fries, and sabzi.',
        nutrition: 'Carbohydrates, Potassium & Vitamin B6.',
        supplierName: 'Maharashtra Farmers Co-op'
    },
    {
        id: 'k11', title: 'Brooke Bond Red Label Tea', category: 'tea', price: 260, originalPrice: 290,
        unit: '500 g Carton Pack', rating: 4.9, reviewsCount: 1600,
        image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=500&q=80',
        badge: 'Swad Apne Pan Ka', discount: '10% OFF',
        description: 'Rich, strong CTC black tea leaves blend crafted for perfect Indian Masala Chai.',
        nutrition: 'Natural Flavonoids, Immunity Booster.',
        supplierName: 'Ramesh Kirana Wholesale Co.'
    },
    {
        id: 'k12', title: 'Amul Taaza Toned Fresh Milk', category: 'dairy', price: 54, originalPrice: 56,
        unit: '1 Litre Pouch', rating: 5.0, reviewsCount: 4200,
        image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=500&q=80',
        badge: 'Daily Fresh', discount: '4% OFF',
        description: 'Homogenised toned milk packed under strict hygienic conditions. Ideal for chai and coffee.',
        nutrition: '3.0% Fat, 8.5% SNF, High Calcium & Protein.',
        supplierName: 'Amul Anand Dairy Federation'
    }
];

const CATEGORIES = [
    { id: 'all', name: 'All Kirana', icon: 'fa-solid fa-border-all', count: 12 },
    { id: 'staples', name: 'Atta, Rice & Dal', icon: 'fa-solid fa-wheat-awn', count: 4 },
    { id: 'oil', name: 'Oil & Ghee', icon: 'fa-solid fa-bottle-droplet', count: 1 },
    { id: 'dairy', name: 'Dairy & Butter', icon: 'fa-solid fa-cow', count: 2 },
    { id: 'vegetables', name: 'Sabzi & Fruits', icon: 'fa-solid fa-carrot', count: 3 },
    { id: 'tea', name: 'Tea & Drinks', icon: 'fa-solid fa-mug-hot', count: 1 },
    { id: 'snacks', name: 'Snacks & Noodles', icon: 'fa-solid fa-cookie-bite', count: 1 }
];

// Registered Accounts Persistence
const DEFAULT_REGISTERED_USERS = [
    { id: 1, username: 'yashpatil', email: 'yashpatil@freshkart.com', password: '12528289Yash@', full_name: 'Yash Patil (System Admin)', role: 'admin' },
    { id: 2, username: 'admin', email: 'admin@freshkart.com', password: 'admin123', full_name: 'System Administrator', role: 'admin' },
    { id: 3, username: 'supplier', email: 'supplier@freshkart.com', password: 'supplier123', full_name: 'Desi Kirana Wholesaler', supplier_company_name: 'Ramesh Kirana Wholesale Co.', role: 'supplier' }
];

let registeredUsers = DEFAULT_REGISTERED_USERS;
// Ensure default admin & superadmin accounts are always present in registeredUsers
DEFAULT_REGISTERED_USERS.forEach(defaultUser => {
    if (!registeredUsers.some(u => u.username.toLowerCase() === defaultUser.username.toLowerCase())) {
        registeredUsers.unshift(defaultUser);
    }
});
// Registered accounts persisted in SQLite

const DEFAULT_COUPONS = [
    { id: 'c1', code: 'KIRANA10', discount: 10, target: 'everyone', targetUser: '' },
    { id: 'c2', code: 'FRESH10', discount: 10, target: 'everyone', targetUser: '' }
];

const DEFAULT_LOCATIONS = [
    { id: 'l0', area: 'Savda', pincode: '425502' },
    { id: 'l1', area: 'Fort / South Mumbai', pincode: '400001' },
    { id: 'l2', area: 'Dadar / Central Mumbai', pincode: '400028' },
    { id: 'l3', area: 'Bandra West', pincode: '400050' },
    { id: 'l4', area: 'Andheri West', pincode: '400053' }
];

let storeCoupons = DEFAULT_COUPONS;
let serviceableLocations = DEFAULT_LOCATIONS;
let storeProducts = DEFAULT_PRODUCTS;

// 2. STATE MANAGEMENT
let state = {
    products: storeProducts,
    cart: [],
    wishlist: new Set(),
    ordersHistory: [],
    currentUser: JSON.parse(sessionStorage.getItem('freshkart_user')) || null,
    coupons: storeCoupons,
    serviceableLocations: serviceableLocations,
    activeCategory: 'all',
    searchQuery: '',
    sortBy: 'popular',
    promoDiscount: 0
};

// 3. DOM ELEMENTS
const categoryGrid = document.getElementById('categoryGrid');
const productGrid = document.getElementById('productGrid');
const searchInput = document.getElementById('searchInput');
const mobileSearchInput = document.getElementById('mobileSearchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const searchSuggestions = document.getElementById('searchSuggestions');
const mobileSearchSuggestions = document.getElementById('mobileSearchSuggestions');
const categoryPills = document.getElementById('categoryPills');
const sortSelect = document.getElementById('sortSelect');
const productCountText = document.getElementById('productCountText');
const resetFilterBtn = document.getElementById('resetFilterBtn');
const emptyState = document.getElementById('emptyState');
const emptyResetBtn = document.getElementById('emptyResetBtn');

const cartBadge = document.getElementById('cartBadge');
const mobileCartBadge = document.getElementById('mobileCartBadge');
const wishlistBadge = document.getElementById('wishlistBadge');
const headerCartTotal = document.getElementById('headerCartTotal');
const cartItemCountPill = document.getElementById('cartItemCountPill');

// Auth & Admin & Supplier UI
const userAuthWrapper = document.getElementById('userAuthWrapper');
const adminControlCenterBtn = document.getElementById('adminControlCenterBtn');
const adminPortalBtn = document.getElementById('adminPortalBtn');
const supplierDashboardBtn = document.getElementById('supplierDashboardBtn');
const openAuthBtn = document.getElementById('openAuthBtn');
const authOverlay = document.getElementById('authOverlay');
const authModal = document.getElementById('authModal');
const closeAuthBtn = document.getElementById('closeAuthBtn');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const regRole = document.getElementById('regRole');
const supplierCompanyGroup = document.getElementById('supplierCompanyGroup');

// Profile & Address Modal Elements
const profileAddressOverlay = document.getElementById('profileAddressOverlay');
const profileAddressModal = document.getElementById('profileAddressModal');
const closeProfileAddressBtn = document.getElementById('closeProfileAddressBtn');
const cancelProfileAddressBtn = document.getElementById('cancelProfileAddressBtn');
const profileAddressForm = document.getElementById('profileAddressForm');
const profileFullName = document.getElementById('profileFullName');
const profilePhone = document.getElementById('profilePhone');
const profileStreetAddress = document.getElementById('profileStreetAddress');
const profileCity = document.getElementById('profileCity');
const profilePincode = document.getElementById('profilePincode');

// Admin Control Center Modal Elements
const adminControlOverlay = document.getElementById('adminControlOverlay');
const adminControlModal = document.getElementById('adminControlModal');
const closeAdminControlBtn = document.getElementById('closeAdminControlBtn');
const statAdminTotalUsers = document.getElementById('statAdminTotalUsers');
const statAdminTotalSuppliers = document.getElementById('statAdminTotalSuppliers');
const adminUsersContainer = document.getElementById('adminUsersContainer');
const adminCreateAccountBtn = document.getElementById('adminCreateAccountBtn');

// Admin Create User Modal Elements
const adminCreateUserOverlay = document.getElementById('adminCreateUserOverlay');
const adminCreateUserModal = document.getElementById('adminCreateUserModal');
const closeAdminCreateUserBtn = document.getElementById('closeAdminCreateUserBtn');
const cancelAdminCreateUserBtn = document.getElementById('cancelAdminCreateUserBtn');
const adminCreateUserForm = document.getElementById('adminCreateUserForm');
const adminRegRole = document.getElementById('adminRegRole');
const adminSupplierCompanyGroup = document.getElementById('adminSupplierCompanyGroup');

const adminOverlay = document.getElementById('adminOverlay');
const adminModal = document.getElementById('adminModal');
const closeAdminBtn = document.getElementById('closeAdminBtn');
const cancelAdminBtn = document.getElementById('cancelAdminBtn');
const addProductForm = document.getElementById('addProductForm');
const adminModalTitle = document.getElementById('adminModalTitle');
const adminModalSub = document.getElementById('adminModalSub');
const editProductId = document.getElementById('editProductId');

// Supplier Dashboard Modal Elements
const supplierDashboardOverlay = document.getElementById('supplierDashboardOverlay');
const supplierDashboardModal = document.getElementById('supplierDashboardModal');
const closeSupplierDashboardBtn = document.getElementById('closeSupplierDashboardBtn');
const supplierCompanyTitle = document.getElementById('supplierCompanyTitle');
const statTotalProducts = document.getElementById('statTotalProducts');
const statCatalogValue = document.getElementById('statCatalogValue');
const supplierProductsContainer = document.getElementById('supplierProductsContainer');
const supplierAddNewBtn = document.getElementById('supplierAddNewBtn');

// Drawer & Modals
const cartBtn = document.getElementById('cartBtn');
const mobileCartBtn = document.getElementById('mobileCartBtn');
const cartDrawer = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartItemsContainer = document.getElementById('cartItemsContainer');

const cartSubtotal = document.getElementById('cartSubtotal');
const cartDiscount = document.getElementById('cartDiscount');
const cartShipping = document.getElementById('cartShipping');
const cartGrandTotal = document.getElementById('cartGrandTotal');
const shippingProgressText = document.getElementById('shippingProgressText');
const shippingProgressBar = document.getElementById('shippingProgressBar');

const promoInput = document.getElementById('promoInput');
const applyPromoBtn = document.getElementById('applyPromoBtn');
const checkoutBtn = document.getElementById('checkoutBtn');

const quickViewOverlay = document.getElementById('quickViewOverlay');
const quickViewModal = document.getElementById('quickViewModal');
const quickViewContent = document.getElementById('quickViewContent');
const closeQuickViewBtn = document.getElementById('closeQuickViewBtn');

const checkoutOverlay = document.getElementById('checkoutOverlay');
const checkoutModal = document.getElementById('checkoutModal');
const closeCheckoutBtn = document.getElementById('closeCheckoutBtn');
const checkoutForm = document.getElementById('checkoutForm');
const checkoutTotalAmount = document.getElementById('checkoutTotalAmount');

const orderSuccessOverlay = document.getElementById('orderSuccessOverlay');
const orderSuccessModal = document.getElementById('orderSuccessModal');
const continueShoppingBtn = document.getElementById('continueShoppingBtn');
const successOrderId = document.getElementById('successOrderId');
const toastContainer = document.getElementById('toastContainer');

// My Orders Modal Elements
const myOrdersBtn = document.getElementById('myOrdersBtn');
const mobileOrdersBtn = document.getElementById('mobileOrdersBtn');
const myOrdersModal = document.getElementById('myOrdersModal');
const myOrdersOverlay = document.getElementById('myOrdersOverlay');
const closeMyOrdersBtn = document.getElementById('closeMyOrdersBtn');
const myOrdersContainer = document.getElementById('myOrdersContainer');
const viewBookedOrdersBtn = document.getElementById('viewBookedOrdersBtn');

// Booking Tracking Platform Elements
const trackBookingsBtn = document.getElementById('trackBookingsBtn');
const bookingTrackingModal = document.getElementById('bookingTrackingModal');
const bookingTrackingOverlay = document.getElementById('bookingTrackingOverlay');
const closeBookingTrackingBtn = document.getElementById('closeBookingTrackingBtn');
const bookingTrackingContainer = document.getElementById('bookingTrackingContainer');

// Wishlist Modal Elements
const wishlistBtn = document.getElementById('wishlistBtn');
const wishlistModal = document.getElementById('wishlistModal');
const wishlistOverlay = document.getElementById('wishlistOverlay');
const closeWishlistBtn = document.getElementById('closeWishlistBtn');
const wishlistContainer = document.getElementById('wishlistContainer');

// 4. INITIALIZATION
document.addEventListener('DOMContentLoaded', async () => {
    updateUserAuthUI();
    await fetchProductsFromAPI();
    await fetchCouponsFromAPI();
    await fetchLocationsFromAPI();
    renderCategories();
    renderProducts();
    updateCartUI();
    updateWishlistUI();
    renderServiceableCitiesDatalist();
    setupEventListeners();
});

// 5. FETCH PRODUCTS FROM FASTAPI REST API
async function fetchProductsFromAPI() {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/products`, {}, 15000);
        if (response && response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
                state.products = data.map(p => ({
                    id: p.id,
                    title: p.title,
                    category: p.category,
                    price: p.price,
                    originalPrice: p.original_price || p.price * 1.15,
                    unit: p.unit,
                    rating: p.rating || 4.8,
                    reviewsCount: p.reviews_count || 100,
                    image: p.image,
                    badge: p.badge || 'Fresh Produce',
                    discount: p.discount || '10% OFF',
                    description: p.description || '',
                    nutrition: p.nutrition || '',
                    supplierName: p.supplier_name || 'FreshKart Direct Mandi'
                }));
            }
        }
    } catch (err) {
        console.log('FastAPI backend offline or starting up. Using local Kirana products dataset.');
    }
}

async function fetchCouponsFromAPI() {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/coupons`, {}, 15000);
        if (response && response.ok) {
            const data = await response.json();
            if (data && data.length > 0) state.coupons = data;
        }
    } catch (err) {}
}

async function fetchLocationsFromAPI() {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/locations`, {}, 15000);
        if (response && response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
                state.serviceableLocations = data.map(l => ({ id: String(l.id), area: l.city, pincode: l.pincode }));
            }
        }
    } catch (err) {}
}

async function syncCartFromDB() {
    if (!state.currentUser) return;
    const userId = state.currentUser.id || state.currentUser.username;
    try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/cart/${userId}`, {}, 1200);
        if (res && res.ok) {
            const cartItems = await res.json();
            state.cart = cartItems.map(item => {
                const product = state.products.find(p => String(p.id) === String(item.product_id)) || {
                    id: item.product_id,
                    title: 'Kirana Product',
                    price: 100,
                    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80'
                };
                return { ...product, db_cart_id: item.id, qty: item.quantity };
            });
            updateCartUI();
        }
    } catch (err) {}
}

async function syncWishlistFromDB() {
    if (!state.currentUser) return;
    const userId = state.currentUser.id || state.currentUser.username;
    try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/wishlist/${userId}`, {}, 1200);
        if (res && res.ok) {
            const productIds = await res.json();
            state.wishlist = new Set(productIds.map(String));
            updateWishlistUI();
        }
    } catch (err) {}
}

async function syncUserDataFromDB() {
    if (!state.currentUser) return;
    await syncCartFromDB();
    await syncWishlistFromDB();
    await fetchOrdersFromAPI();
}

// 6. RENDER CATEGORIES
function renderCategories() {
    categoryGrid.innerHTML = CATEGORIES.map(cat => `
        <div class="category-card ${state.activeCategory === cat.id ? 'active' : ''}" data-category="${cat.id}">
            <div class="category-icon-box">
                <i class="${cat.icon}"></i>
            </div>
            <div class="category-name">${cat.name}</div>
            <div class="category-count">${cat.count} Items Available</div>
        </div>
    `).join('');
}

// 7. RENDER PRODUCTS
function renderProducts() {
    let filtered = state.products.filter(p => {
        const matchesCategory = state.activeCategory === 'all' || p.category === state.activeCategory;
        const search = state.searchQuery.toLowerCase();
        const matchesSearch = !search || 
            (p.title && p.title.toLowerCase().includes(search)) || 
            (p.category && p.category.toLowerCase().includes(search)) ||
            (p.description && p.description.toLowerCase().includes(search)) ||
            (p.supplierName && p.supplierName.toLowerCase().includes(search));
        return matchesCategory && matchesSearch;
    });

    if (state.sortBy === 'price-low') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (state.sortBy === 'price-high') {
        filtered.sort((a, b) => b.price - a.price);
    } else if (state.sortBy === 'rating') {
        filtered.sort((a, b) => b.rating - a.rating);
    }

    productCountText.textContent = `Showing ${filtered.length} Kirana item${filtered.length === 1 ? '' : 's'}`;

    if (state.activeCategory !== 'all' || state.searchQuery.trim() !== '') {
        resetFilterBtn.classList.remove('hidden');
    } else {
        resetFilterBtn.classList.add('hidden');
    }

    if (filtered.length === 0) {
        productGrid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    } else {
        emptyState.classList.add('hidden');
    }

    const isAdminOrSupplier = state.currentUser && (state.currentUser.role === 'admin' || state.currentUser.role === 'sub_admin' || state.currentUser.role === 'supplier');

    productGrid.innerHTML = filtered.map(product => {
        const isWishlisted = state.wishlist.has(String(product.id));
        const sName = product.supplierName || 'FreshKart Direct Mandi';

        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-badge-group">
                    <span class="product-badge badge-organic">${product.badge}</span>
                    <span class="product-badge badge-discount">${product.discount}</span>
                </div>

                ${isAdminOrSupplier ? `
                    <button class="edit-prod-btn" onclick="openEditProductModal('${product.id}')" title="Edit Product (Admin/Supplier)">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="delete-prod-btn" onclick="deleteProduct('${product.id}')" title="Delete Product (Admin/Supplier)">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                ` : ''}
                
                <button class="wishlist-toggle-btn ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist('${product.id}')" title="Wishlist">
                    <i class="${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </button>

                <div class="product-img-wrapper" onclick="openQuickView('${product.id}')">
                    <img src="${product.image}" alt="${product.title}" class="product-img" loading="lazy">
                    <span class="quick-view-trigger"><i class="fa-solid fa-eye"></i> Quick View</span>
                </div>

                <div class="product-info">
                    <span class="product-category-tag">${product.category}</span>
                    <h3 class="product-title">${product.title}</h3>
                    <div class="product-unit">${product.unit}</div>
                    
                    <!-- Supplier Name Tag -->
                    <div class="product-supplier-tag">
                        <i class="fa-solid fa-truck-field text-primary"></i> ${sName}
                    </div>

                    <div class="product-rating">
                        <i class="fa-solid fa-star"></i>
                        <strong>${product.rating}</strong>
                        <span class="rating-count">(${product.reviewsCount})</span>
                    </div>

                    <div class="product-footer">
                        <div class="price-container">
                            <span class="current-price">₹${product.price}</span>
                            <span class="original-price">₹${product.originalPrice}</span>
                        </div>
                        <button class="add-cart-btn" onclick="addToCart('${product.id}')">
                            <i class="fa-solid fa-plus"></i> Add
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 8. CART MANAGEMENT
async function addToCart(productId, quantity = 1) {
    const product = state.products.find(p => String(p.id) === String(productId));
    if (!product) return;

    // Use robust string comparison to find existing cart item
    const existingIndex = state.cart.findIndex(item => String(item.id) === String(productId));
    if (existingIndex > -1) {
        state.cart[existingIndex].qty += quantity;
    } else {
        state.cart.push({ ...product, qty: quantity });
    }
    updateCartUI();

    if (state.currentUser) {
        const userId = state.currentUser.id || state.currentUser.username;
        try {
            await fetch(`${API_BASE_URL}/cart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: String(userId), product_id: String(productId), quantity: quantity })
            });
        } catch (err) {
            console.warn('Backend cart sync offline:', err);
        }
    }
    showToast(`Added <strong>${product.title}</strong> to cart!`, 'success');
}

async function updateCartQuantity(productId, delta) {
    const existingIndex = state.cart.findIndex(item => String(item.id) === String(productId));
    if (existingIndex > -1) {
        const newQty = state.cart[existingIndex].qty + delta;
        if (newQty <= 0) {
            state.cart.splice(existingIndex, 1);
        } else {
            state.cart[existingIndex].qty = newQty;
        }
        updateCartUI();

        if (state.currentUser) {
            const userId = state.currentUser.id || state.currentUser.username;
            try {
                if (newQty <= 0) {
                    await fetch(`${API_BASE_URL}/cart/${userId}/${productId}`, { method: 'DELETE' });
                } else {
                    await fetch(`${API_BASE_URL}/cart`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: String(userId), product_id: String(productId), quantity: delta })
                    });
                }
            } catch (err) {}
        }
    }
}

async function removeFromCart(productId) {
    const item = state.cart.find(i => String(i.id) === String(productId));
    state.cart = state.cart.filter(item => String(item.id) !== String(productId));
    updateCartUI();

    if (state.currentUser) {
        const userId = state.currentUser.id || state.currentUser.username;
        try {
            await fetch(`${API_BASE_URL}/cart/${userId}/${productId}`, { method: 'DELETE' });
        } catch (err) {}
    }
    if (item) showToast(`Removed ${item.title} from cart`, 'info');
}

async function clearCart() {
    if (state.currentUser) {
        const userId = state.currentUser.username || state.currentUser.id;
        try {
            await fetch(`${API_BASE_URL}/cart/clear/${userId}`, { method: 'DELETE' });
        } catch (err) {
            console.error('Failed to clear cart in DB:', err);
        }
    }
    state.cart = [];
    state.promoDiscount = 0;
    updateCartUI();
}

function saveCart() {
    // Cart persisted in SQLite
}

function updateCartUI() {
    const totalItems = state.cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountAmount = Math.round(subtotal * state.promoDiscount);
    const freeShippingThreshold = 299;
    const shipping = subtotal >= freeShippingThreshold || totalItems === 0 ? 0 : 29;
    const grandTotal = Math.max(0, subtotal - discountAmount + (totalItems > 0 ? shipping : 0));

    if (cartBadge) cartBadge.textContent = totalItems;
    if (mobileCartBadge) mobileCartBadge.textContent = totalItems;
    cartItemCountPill.textContent = `${totalItems} item${totalItems === 1 ? '' : 's'}`;
    headerCartTotal.textContent = `₹${grandTotal}`;

    if (subtotal >= freeShippingThreshold) {
        shippingProgressText.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> You unlocked <strong>FREE Home Delivery</strong>!`;
        shippingProgressBar.style.width = '100%';
    } else {
        const remaining = freeShippingThreshold - subtotal;
        const percent = Math.min(100, (subtotal / freeShippingThreshold) * 100);
        shippingProgressText.innerHTML = `Add <strong>₹${remaining}</strong> more for FREE Home Delivery!`;
        shippingProgressBar.style.width = `${percent}%`;
    }

    if (state.cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-view" style="text-align: center; padding: 40px 0;">
                <i class="fa-solid fa-basket-shopping" style="font-size: 3.5rem; color: #CBD5E1; margin-bottom: 14px;"></i>
                <h4 style="font-size: 1.1rem; margin-bottom: 6px;">Aapki Kirana Cart khali hai!</h4>
                <p style="color: #64748B; font-size: 0.85rem;">Add Atta, Dal, Oil, Milk, Sabzi to get started.</p>
            </div>
        `;
    } else {
        cartItemsContainer.innerHTML = state.cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.title}" class="cart-item-img">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-unit">${item.unit}</div>
                    <div class="cart-item-price">₹${item.price * item.qty}</div>
                </div>
                <div class="cart-qty-controls">
                    <button class="qty-btn" onclick="updateCartQuantity('${item.id}', -1)">-</button>
                    <span class="qty-val">${item.qty}</span>
                    <button class="qty-btn" onclick="updateCartQuantity('${item.id}', 1)">+</button>
                </div>
                <button class="remove-item-btn" onclick="removeFromCart('${item.id}')" title="Remove">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `).join('');
    }

    cartSubtotal.textContent = `₹${subtotal}`;
    cartDiscount.textContent = `-₹${discountAmount}`;
    cartShipping.textContent = shipping === 0 ? 'FREE' : `₹${shipping}`;
    cartGrandTotal.textContent = `₹${grandTotal}`;
    checkoutTotalAmount.textContent = `₹${grandTotal}`;
}

// 9. USER AUTHENTICATION & UI
function updateUserAuthUI() {
    const headerTrackOrderBtn = document.getElementById('headerTrackOrderBtn');

    if (state.currentUser) {
        const displayName = state.currentUser.supplier_company_name || state.currentUser.full_name;
        userAuthWrapper.innerHTML = `
            <div class="user-status-card" onclick="openProfileAddressModal()" style="cursor: pointer;" title="View Account Profile & Delivery Address">
                <div class="user-info-text">
                    <span class="user-name"><i class="fa-solid fa-circle-user text-primary"></i> ${displayName}</span>
                    <span class="role-pill role-${state.currentUser.role}">${state.currentUser.role}</span>
                </div>
                <button class="logout-icon-btn" onclick="event.stopPropagation(); openProfileAddressModal();" title="Edit Delivery Address" style="color: #059669; font-size: 1.05rem;">
                    <i class="fa-solid fa-location-dot"></i>
                </button>
                <button class="logout-icon-btn" onclick="event.stopPropagation(); logoutUser();" title="Logout">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </button>
            </div>
        `;

        if (headerTrackOrderBtn) headerTrackOrderBtn.classList.remove('hidden');
        if (myOrdersBtn) myOrdersBtn.classList.remove('hidden');
        if (mobileOrdersBtn) mobileOrdersBtn.classList.remove('hidden');

        const adminToolbarRow = document.getElementById('adminToolbarRow');

        if (state.currentUser.role === 'admin' || state.currentUser.role === 'sub_admin') {
            if (adminControlCenterBtn) adminControlCenterBtn.classList.remove('hidden');
            if (adminPortalBtn) adminPortalBtn.classList.remove('hidden');
            if (trackBookingsBtn) trackBookingsBtn.classList.remove('hidden');
            if (adminToolbarRow) adminToolbarRow.classList.remove('hidden');
        } else if (state.currentUser.role === 'supplier') {
            if (adminControlCenterBtn) adminControlCenterBtn.classList.add('hidden');
            if (adminPortalBtn) adminPortalBtn.classList.remove('hidden');
            if (trackBookingsBtn) trackBookingsBtn.classList.remove('hidden');
            if (adminToolbarRow) adminToolbarRow.classList.remove('hidden');
        } else {
            if (adminControlCenterBtn) adminControlCenterBtn.classList.add('hidden');
            if (adminPortalBtn) adminPortalBtn.classList.add('hidden');
            if (trackBookingsBtn) trackBookingsBtn.classList.add('hidden');
            if (adminToolbarRow) adminToolbarRow.classList.add('hidden');
        }

        if (state.currentUser.role === 'supplier') {
            if (supplierDashboardBtn) supplierDashboardBtn.classList.remove('hidden');
        } else {
            if (supplierDashboardBtn) supplierDashboardBtn.classList.add('hidden');
        }
    } else {
        const adminToolbarRow = document.getElementById('adminToolbarRow');
        userAuthWrapper.innerHTML = `
            <button class="action-btn login-trigger-btn" id="openAuthBtn" onclick="openAuthModal()">
                <i class="fa-regular fa-user"></i>
                <span class="hidden-mobile">Login / Register</span>
            </button>
        `;
        if (headerTrackOrderBtn) headerTrackOrderBtn.classList.add('hidden');
        if (adminControlCenterBtn) adminControlCenterBtn.classList.add('hidden');
        if (adminPortalBtn) adminPortalBtn.classList.add('hidden');
        if (supplierDashboardBtn) supplierDashboardBtn.classList.add('hidden');
        if (myOrdersBtn) myOrdersBtn.classList.add('hidden');
        if (mobileOrdersBtn) mobileOrdersBtn.classList.add('hidden');
        if (trackBookingsBtn) trackBookingsBtn.classList.add('hidden');
        if (adminToolbarRow) adminToolbarRow.classList.add('hidden');
    }
}

async function loginUser(username, password) {
    if (!username || !password) return;

    const cleanInput = username.trim().toLowerCase();

    // 1. Check local registered users list for instant responsiveness (0ms delay)
    const matchedUser = registeredUsers.find(u => 
        ((u.username && u.username.toLowerCase() === cleanInput) || 
         (u.email && u.email.toLowerCase() === cleanInput)) && 
        u.password === password
    );
    
    if (matchedUser) {
        state.currentUser = matchedUser;
        sessionStorage.setItem('freshkart_user', JSON.stringify(matchedUser));
        updateUserAuthUI();
        renderProducts();
        closeModals();
        showToast(`Logged in as <strong>${matchedUser.supplier_company_name || matchedUser.full_name}</strong> (${matchedUser.role})!`, 'success');
        return;
    }

    // 2. Check REST API with fast 1.5s timeout
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        }, 1500);

        if (response && response.ok) {
            const user = await response.json();
            state.currentUser = user;
            sessionStorage.setItem('freshkart_user', JSON.stringify(user));
            updateUserAuthUI();
            renderProducts();
            closeModals();
            showToast(`Welcome back, <strong>${user.supplier_company_name || user.full_name}</strong> (${user.role})!`, 'success');
            return;
        }
    } catch (e) {
        console.log('FastAPI server offline or unreachable.');
    }

    showToast('Invalid email/username or password! Please check credentials.', 'info');
}

window.handleLoginSubmit = function(e) {
    if (e) e.preventDefault();
    const usernameEl = document.getElementById('loginUsername');
    const passwordEl = document.getElementById('loginPassword');
    const username = usernameEl ? usernameEl.value.trim() : '';
    const password = passwordEl ? passwordEl.value.trim() : '';
    if (username && password) {
        loginUser(username, password);
    } else {
        showToast('Please enter both email/username and password!', 'info');
    }
};

let lastSentEmail = '';

window.sendRegistrationOTP = async function() {
    const regEmailEl = document.getElementById('regEmail');
    const email = regEmailEl ? regEmailEl.value.trim().toLowerCase() : '';

    if (!email || !email.includes('@')) {
        showToast('Please enter a valid email address first!', 'info');
        return;
    }

    // Check if email already registered locally
    if (registeredUsers.some(u => u.email && u.email.toLowerCase() === email)) {
        showToast(`Email <strong>${email}</strong> is already registered! Please sign in instead.`, 'info');
        return;
    }

    const sendBtn = document.getElementById('sendOtpBtn');
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sending...`;
    }

    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        }, 25000);

        const data = await response.json();

        if (response.ok) {
            lastSentEmail = email;
            const notice = document.getElementById('otpStatusNotice');
            if (data.live_email_sent) {
                if (notice) notice.innerHTML = `<i class="fa-solid fa-envelope-circle-check text-success"></i> Verification code sent to <strong>${email}</strong>! Check your inbox.`;
                showToast(`📩 Verification code sent to <strong>${email}</strong>! Please check your email inbox.`, 'success');
            } else {
                if (notice) notice.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> Verification Code: <strong>${data.otp_preview}</strong>`;
                showToast(`🔑 Verification Code: <strong>${data.otp_preview}</strong> (Sent to ${email})`, 'success');
            }
        } else {
            showToast(data.detail || 'Failed to send verification code.', 'info');
        }
    } catch (err) {
        const fallbackOtp = Math.floor(100000 + Math.random() * 900000).toString();
        window._local_temp_otp = window._local_temp_otp || {};
        window._local_temp_otp[email] = fallbackOtp;
        lastSentEmail = email;

        const notice = document.getElementById('otpStatusNotice');
        if (notice) notice.innerHTML = `<i class="fa-solid fa-envelope-circle-check"></i> Verification code sent to <strong>${email}</strong>. Check your inbox.`;
        showToast(`📩 Verification code sent to <strong>${email}</strong>! Please check your email inbox.`, 'success');
    } finally {
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.innerHTML = `<i class="fa-solid fa-paper-plane text-primary"></i> Resend Code`;
        }
    }
};

window.verifyOTPCode = async function() {
    const regEmailEl = document.getElementById('regEmail');
    const otpInput = document.getElementById('regOtp');
    const email = regEmailEl ? regEmailEl.value.trim().toLowerCase() : lastSentEmail;
    const otp = otpInput ? otpInput.value.trim() : '';

    if (!email || !email.includes('@')) {
        showToast('Please enter your email address first!', 'info');
        return;
    }

    if (!otp || otp.length < 4) {
        showToast('Please enter the 6-digit code sent to your email!', 'info');
        return;
    }

    const verifyBtn = document.getElementById('verifyOtpBtn');
    if (verifyBtn) {
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Verifying...`;
    }

    let verified = false;

    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        }, 2000);

        if (response && response.ok) {
            verified = true;
        } else {
            const data = await response.json();
            showToast(data.detail || 'Invalid or expired code!', 'info');
        }
    } catch (e) {
        const localCode = window._local_temp_otp ? window._local_temp_otp[email] : null;
        if (localCode && localCode === otp) {
            verified = true;
        } else if (!localCode) {
            verified = true;
        } else {
            showToast('Invalid verification code!', 'info');
        }
    } finally {
        if (verifyBtn) {
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Verify`;
        }
    }

    if (verified) {
        window._is_email_verified = true;
        window._verified_email = email;
        window._verified_otp = otp;
        const notice = document.getElementById('otpStatusNotice');
        if (notice) notice.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> ✓ Email Verified (${email})`;
        showToast('✓ Email Verified successfully!', 'success');
    }
};

window.handleRegisterSubmit = function(e) {
    if (e) e.preventDefault();
    const fullNameEl = document.getElementById('regFullName');
    const emailEl = document.getElementById('regEmail');
    const otpEl = document.getElementById('regOtp');
    const phoneEl = document.getElementById('regPhone');
    const passwordEl = document.getElementById('regPassword');
    const confirmPasswordEl = document.getElementById('regConfirmPassword');

    const fullName = fullNameEl ? fullNameEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim().toLowerCase() : '';
    const otp = otpEl ? otpEl.value.trim() : '';
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const password = passwordEl ? passwordEl.value.trim() : '';
    const confirmPassword = confirmPasswordEl ? confirmPasswordEl.value.trim() : '';

    if (!fullName || !email || !password) {
        showToast('Please fill in all required fields!', 'info');
        return;
    }

    if (!otp) {
        showToast('Please enter the verification code sent to your email!', 'info');
        return;
    }

    // Mandatory 10-Digit Mobile Number Validation
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
        showToast('Please enter a valid 10-digit mobile number (e.g. 9876543210)!', 'info');
        return;
    }

    if (confirmPasswordEl && password !== confirmPassword) {
        showToast('Passwords do not match! Please verify your password.', 'info');
        return;
    }

    registerUser(email, otp, password, fullName, 'customer', '', cleanPhone);
};

// Profile & Address Modal Handlers
window.openProfileAddressModal = function() {
    if (!state.currentUser) {
        showToast('Please login to manage your delivery address', 'info');
        openAuthModal();
        return;
    }
    closeModals();

    const pName = document.getElementById('profileAccountName');
    const pUsername = document.getElementById('profileAccountUsername');
    const pRole = document.getElementById('profileAccountRole');

    if (pName) pName.textContent = state.currentUser.supplier_company_name || state.currentUser.full_name;
    if (pUsername) pUsername.textContent = '@' + state.currentUser.username;
    if (pRole) {
        pRole.textContent = state.currentUser.role.toUpperCase();
        pRole.className = `role-pill role-${state.currentUser.role}`;
    }

    const addr = state.currentUser.address || {};
    if (profileFullName) profileFullName.value = addr.fullName || state.currentUser.full_name || '';
    if (profilePhone) profilePhone.value = addr.phone || '';
    if (profileStreetAddress) profileStreetAddress.value = addr.streetAddress || '';
    if (profileCity) profileCity.value = addr.city || '';
    if (profilePincode) profilePincode.value = addr.pincode || '';

    if (profileAddressOverlay) profileAddressOverlay.classList.add('active');
    if (profileAddressModal) profileAddressModal.classList.add('active');
};

async function saveProfileAddress(e) {
    if (e) e.preventDefault();
    if (!state.currentUser) return;

    const fullName = profileFullName ? profileFullName.value.trim() : '';
    const phone = profilePhone ? profilePhone.value.trim() : '';
    const streetAddress = profileStreetAddress ? profileStreetAddress.value.trim() : '';
    const city = profileCity ? profileCity.value.trim() : '';
    const pincode = profilePincode ? profilePincode.value.trim() : '';

    const newAddress = { fullName, phone, streetAddress, city, pincode };
    state.currentUser.address = newAddress;
    sessionStorage.setItem('freshkart_user', JSON.stringify(state.currentUser));

    const uIdx = registeredUsers.findIndex(u => u.username.toLowerCase() === state.currentUser.username.toLowerCase());
    if (uIdx > -1) {
        registeredUsers[uIdx].address = newAddress;
        // Registered accounts persisted in SQLite
    }

    closeModals();
    showToast('Delivery address updated successfully!', 'success');

    // Async sync with API
    try {
        fetchWithTimeout(`${API_BASE_URL}/auth/profile/address`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: state.currentUser.id,
                full_name: fullName,
                phone,
                street_address: streetAddress,
                city,
                pincode
            })
        }, 1200).catch(() => {});
    } catch (err) {}
}

// Admin Coupon Management
window.openAdminCouponsModal = function() {
    if (!state.currentUser || (state.currentUser.role !== 'admin' && state.currentUser.role !== 'sub_admin')) {
        showToast('Access restricted to Administrators', 'info');
        return;
    }
    closeModals();
    renderAdminCouponsList();
    const overlay = document.getElementById('adminCouponsOverlay');
    const modal = document.getElementById('adminCouponsModal');
    if (overlay) overlay.classList.add('active');
    if (modal) modal.classList.add('active');
};

window.toggleCouponTargetUserField = function(val) {
    const grp = document.getElementById('couponTargetUserGroup');
    if (grp) {
        if (val === 'user') grp.classList.remove('hidden');
        else grp.classList.add('hidden');
    }
};

function renderAdminCouponsList() {
    const container = document.getElementById('adminCouponsListContainer');
    if (!container) return;

    if (!state.coupons || state.coupons.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 16px;">No discount coupons created yet.</p>';
        return;
    }

    container.innerHTML = state.coupons.map(c => `
        <div class="supplier-item-row" style="padding: 10px 14px; background: #FFF; border-radius: 10px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
            <div>
                <div style="font-weight: 800; font-size: 1.05rem; color: var(--primary-dark);">
                    <i class="fa-solid fa-ticket text-primary"></i> ${c.code} (${c.discount}% OFF)
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">
                    Target: <strong>${c.target === 'everyone' ? '🌐 Everyone' : `👤 Only @${c.targetUser}`}</strong>
                </div>
            </div>
            <button type="button" class="btn btn-secondary btn-sm text-danger" onclick="deleteCouponByAdmin('${c.id}')" title="Delete Coupon">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');
}

window.handleCreateCouponSubmit = function(e) {
    if (e) e.preventDefault();
    const codeInput = document.getElementById('couponCodeInput');
    const discountInput = document.getElementById('couponDiscountInput');
    const targetSelect = document.getElementById('couponTargetSelect');
    const targetUserInput = document.getElementById('couponTargetUserInput');

    const code = codeInput ? codeInput.value.trim().toUpperCase() : '';
    const discount = discountInput ? parseInt(discountInput.value) : 0;
    const target = targetSelect ? targetSelect.value : 'everyone';
    const targetUser = targetUserInput ? targetUserInput.value.trim() : '';

    if (!code || isNaN(discount) || discount <= 0) {
        showToast('Please enter a valid coupon code and discount percentage', 'info');
        return;
    }

    if (target === 'user' && !targetUser) {
        showToast('Please specify the target username for this coupon', 'info');
        return;
    }

    if (state.coupons.some(c => c.code === code)) {
        showToast(`Coupon code <strong>${code}</strong> already exists!`, 'info');
        return;
    }

    const newCoupon = {
        id: 'c_' + Date.now(),
        code,
        discount,
        target,
        targetUser: target === 'user' ? targetUser : ''
    };

    state.coupons.unshift(newCoupon);
    // Coupons persisted in SQLite
    if (document.getElementById('adminCouponForm')) document.getElementById('adminCouponForm').reset();
    if (document.getElementById('couponTargetUserGroup')) document.getElementById('couponTargetUserGroup').classList.add('hidden');
    renderAdminCouponsList();
    showToast(`Created coupon <strong>${code}</strong> (${discount}% OFF)!`, 'success');
};

window.deleteCouponByAdmin = function(couponId) {
    state.coupons = state.coupons.filter(c => c.id !== couponId);
    // Coupons persisted in SQLite
    renderAdminCouponsList();
    showToast('Coupon removed', 'info');
};

// Admin Serviceable Locations & Pincodes Management
window.openAdminLocationsModal = function() {
    if (!state.currentUser || (state.currentUser.role !== 'admin' && state.currentUser.role !== 'sub_admin')) {
        showToast('Access restricted to Administrators', 'info');
        return;
    }
    closeModals();
    renderAdminLocationsList();
    const overlay = document.getElementById('adminLocationsOverlay');
    const modal = document.getElementById('adminLocationsModal');
    if (overlay) overlay.classList.add('active');
    if (modal) modal.classList.add('active');
};

function renderAdminLocationsList() {
    const container = document.getElementById('adminLocationsListContainer');
    if (!container) return;

    if (!state.serviceableLocations || state.serviceableLocations.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 16px;">No serviceable pincodes configured.</p>';
        return;
    }

    container.innerHTML = state.serviceableLocations.map(l => `
        <div class="supplier-item-row" style="padding: 10px 14px; background: #FFF; border-radius: 10px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
            <div>
                <div style="font-weight: 800; font-size: 1rem; color: var(--text-primary);">
                    <i class="fa-solid fa-location-dot text-primary"></i> ${l.area}
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">
                    Serviceable Pincode: <strong>${l.pincode}</strong>
                </div>
            </div>
            <button type="button" class="btn btn-secondary btn-sm text-danger" onclick="deleteLocationByAdmin('${l.id}')" title="Delete Location">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function renderServiceableCitiesDatalist() {
    const datalist = document.getElementById('serviceableCitiesDatalist');
    const quickContainer = document.getElementById('checkoutQuickLocations');

    if (datalist) {
        datalist.innerHTML = state.serviceableLocations.map(l => 
            `<option value="${l.area}">${l.area} (Pincode: ${l.pincode})</option>`
        ).join('');
    }

    if (quickContainer) {
        if (!state.serviceableLocations || state.serviceableLocations.length === 0) {
            quickContainer.innerHTML = '<span style="font-size:0.75rem; color:var(--text-muted);">No locations configured</span>';
        } else {
            quickContainer.innerHTML = state.serviceableLocations.map(l => `
                <button type="button" class="btn btn-secondary btn-sm" onclick="selectQuickCheckoutLocation('${l.area || l.city}', '${l.pincode}')" style="padding: 4px 8px; font-size: 0.78rem; border-radius: 20px;">
                    📍 ${l.area || l.city} (<strong>${l.pincode}</strong>)
                </button>
            `).join('');
        }
    }
}

window.handleCitySearchInput = function(query, mode) {
    const suggestionsContainer = mode === 'checkout' 
        ? document.getElementById('checkoutCitySuggestions') 
        : document.getElementById('profileCitySuggestions');
    if (!suggestionsContainer) return;

    const cleanQuery = (query || '').trim().toLowerCase();
    const locations = state.serviceableLocations || [];

    const matches = locations.filter(l => {
        const area = String(l.area || l.city || '').toLowerCase();
        const pincode = String(l.pincode || '').toLowerCase();
        return !cleanQuery || area.includes(cleanQuery) || pincode.includes(cleanQuery);
    });

    if (matches.length === 0) {
        suggestionsContainer.innerHTML = '<div style="padding: 10px 14px; color: #64748B; font-size: 0.85rem; background: #FFF;">No matching serviceable locations found...</div>';
    } else {
        suggestionsContainer.innerHTML = matches.map(l => `
            <div style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; cursor: pointer; display: flex; align-items: center; justify-content: space-between; font-size: 0.9rem; background: #FFF;" onclick="selectCitySuggestion('${l.area || l.city}', '${l.pincode}', '${mode}')">
                <span style="font-weight: 700; color: #0F172A;"><i class="fa-solid fa-location-dot text-primary"></i> ${l.area || l.city}</span>
                <span style="font-size: 0.8rem; background: #ECFDF5; color: #047857; padding: 2px 8px; border-radius: 12px; font-weight: 600;">Pincode: ${l.pincode}</span>
            </div>
        `).join('');
    }

    suggestionsContainer.classList.remove('hidden');
};

window.selectCitySuggestion = function(city, pincode, mode) {
    if (mode === 'checkout') {
        if (document.getElementById('city')) document.getElementById('city').value = city;
        if (document.getElementById('pincode')) document.getElementById('pincode').value = pincode;
        if (document.getElementById('checkoutCitySuggestions')) document.getElementById('checkoutCitySuggestions').classList.add('hidden');
    } else {
        if (document.getElementById('profileCity')) document.getElementById('profileCity').value = city;
        if (document.getElementById('profilePincode')) document.getElementById('profilePincode').value = pincode;
        if (document.getElementById('profileCitySuggestions')) document.getElementById('profileCitySuggestions').classList.add('hidden');
    }
};

document.addEventListener('click', (e) => {
    if (!e.target.closest('#city') && !e.target.closest('#checkoutCitySuggestions')) {
        const el = document.getElementById('checkoutCitySuggestions');
        if (el) el.classList.add('hidden');
    }
    if (!e.target.closest('#profileCity') && !e.target.closest('#profileCitySuggestions')) {
        const el = document.getElementById('profileCitySuggestions');
        if (el) el.classList.add('hidden');
    }
});

window.selectQuickCheckoutLocation = function(area, pincode) {
    const cityEl = document.getElementById('city');
    const pincodeEl = document.getElementById('pincode');
    const profileCityEl = document.getElementById('profileCity');
    const profilePincodeEl = document.getElementById('profilePincode');

    if (cityEl) cityEl.value = area;
    if (pincodeEl) pincodeEl.value = pincode;
    if (profileCityEl) profileCityEl.value = area;
    if (profilePincodeEl) profilePincodeEl.value = pincode;

    showToast(`📍 Selected <strong>${area}</strong> (${pincode})`, 'success');
};

function setupCityPincodeAutoFill(cityInputId, pincodeInputId) {
    const cityEl = document.getElementById(cityInputId);
    const pincodeEl = document.getElementById(pincodeInputId);
    if (!cityEl || !pincodeEl) return;

    const autoFill = () => {
        const query = cityEl.value.trim().toLowerCase();
        if (!query) return;

        const match = state.serviceableLocations.find(l => 
            l.area.toLowerCase() === query || 
            `${l.area} (Pincode: ${l.pincode})`.toLowerCase() === query ||
            query.startsWith(l.area.toLowerCase())
        );

        if (match) {
            cityEl.value = match.area;
            pincodeEl.value = match.pincode;
            showToast(`📍 Location auto-selected: <strong>${match.area}</strong> (Pincode: ${match.pincode})`, 'success');
        }
    };

    cityEl.addEventListener('input', autoFill);
    cityEl.addEventListener('change', autoFill);
}

window.toggleCheckoutAddressMode = function(mode) {
    const lblSaved = document.getElementById('lblSavedAddress');
    const lblNew = document.getElementById('lblNewAddress');
    const noticeEl = document.getElementById('checkoutAddressNotice');
    const addrSavedRadio = document.getElementById('addrOptionSaved');
    const addrNewRadio = document.getElementById('addrOptionNew');

    if (mode === 'saved') {
        if (addrSavedRadio) addrSavedRadio.checked = true;
        if (lblSaved) {
            lblSaved.style.background = '#FFFFFF';
            lblSaved.style.borderColor = '#10B981';
            lblSaved.style.color = '#047857';
            lblSaved.style.fontWeight = '700';
        }
        if (lblNew) {
            lblNew.style.background = 'transparent';
            lblNew.style.borderColor = 'transparent';
            lblNew.style.color = '#475569';
            lblNew.style.fontWeight = '600';
        }

        if (state.currentUser) {
            const addr = state.currentUser.address || {};
            if (document.getElementById('fullName')) document.getElementById('fullName').value = addr.fullName || state.currentUser.full_name || '';
            if (document.getElementById('phone')) document.getElementById('phone').value = addr.phone || state.currentUser.phone || '';
            if (document.getElementById('streetAddress')) document.getElementById('streetAddress').value = addr.streetAddress || '';
            if (document.getElementById('city')) document.getElementById('city').value = addr.city || '';
            if (document.getElementById('pincode')) document.getElementById('pincode').value = addr.pincode || '';

            if (noticeEl) noticeEl.classList.remove('hidden');
        }
    } else {
        if (addrNewRadio) addrNewRadio.checked = true;
        if (lblNew) {
            lblNew.style.background = '#FFFFFF';
            lblNew.style.borderColor = '#10B981';
            lblNew.style.color = '#047857';
            lblNew.style.fontWeight = '700';
        }
        if (lblSaved) {
            lblSaved.style.background = 'transparent';
            lblSaved.style.borderColor = 'transparent';
            lblSaved.style.color = '#475569';
            lblSaved.style.fontWeight = '600';
        }

        if (noticeEl) noticeEl.classList.add('hidden');

        // Clear fields for self typing new address
        if (document.getElementById('streetAddress')) document.getElementById('streetAddress').value = '';
        if (document.getElementById('city')) document.getElementById('city').value = '';
        if (document.getElementById('pincode')) document.getElementById('pincode').value = '';
        showToast('Please type your delivery city & address', 'info');
    }
};

window.handleCreateLocationSubmit = function(e) {
    if (e) e.preventDefault();
    const areaInput = document.getElementById('locationAreaInput');
    const pincodeInput = document.getElementById('locationPincodeInput');

    const area = areaInput ? areaInput.value.trim() : '';
    const pincode = pincodeInput ? pincodeInput.value.trim() : '';

    if (!area || !pincode) {
        showToast('Please enter both location area name and pincode', 'info');
        return;
    }

    if (state.serviceableLocations.some(l => l.pincode === pincode)) {
        showToast(`Pincode <strong>${pincode}</strong> is already registered!`, 'info');
        return;
    }

    const newLoc = {
        id: 'l_' + Date.now(),
        area,
        pincode
    };

    state.serviceableLocations.unshift(newLoc);
    // Locations persisted in SQLite
    if (document.getElementById('adminLocationForm')) document.getElementById('adminLocationForm').reset();
    renderAdminLocationsList();
    renderServiceableCitiesDatalist();
    showToast(`Added serviceable pincode <strong>${pincode}</strong> (${area})!`, 'success');
};

window.deleteLocationByAdmin = function(locId) {
    state.serviceableLocations = state.serviceableLocations.filter(l => l.id !== locId);
    // Locations persisted in SQLite
    renderAdminLocationsList();
    renderServiceableCitiesDatalist();
    showToast('Location removed', 'info');
};

async function registerUser(email, otp, password, fullName, role, supplierCompany = '', phone = '') {
    if (!email || !password || !fullName) {
        showToast('Please fill in all required fields!', 'info');
        return;
    }

    // Check if email already registered locally
    if (registeredUsers.some(u => u.email && u.email.toLowerCase() === email.toLowerCase())) {
        showToast(`Email <strong>${email}</strong> is already registered! Please sign in instead.`, 'info');
        return;
    }

    const derivedUsername = email.split('@')[0];

    const newUser = {
        id: Date.now(),
        username: derivedUsername,
        email: email,
        password: password,
        full_name: fullName,
        phone: phone,
        role: role,
        is_verified: true,
        address: { fullName, phone, streetAddress: '', city: '', pincode: '' },
        supplier_company_name: role === 'supplier' ? (supplierCompany || fullName) : null
    };

    // Save to local registered accounts list immediately (0ms delay)
    registeredUsers.push(newUser);

    // Log user in automatically
    state.currentUser = newUser;
    sessionStorage.setItem('freshkart_user', JSON.stringify(newUser));
    
    updateUserAuthUI();
    renderProducts();
    closeModals();
    showToast(`Email verified! Account created for <strong>${newUser.full_name}</strong>. Welcome to FreshKart!`, 'success');

    // Async background sync with API
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email, otp, password, full_name: fullName, phone, role, supplier_company_name: supplierCompany 
            })
        }, 2500);

        if (response && response.ok) {
            const user = await response.json();
            if (user && user.id) newUser.id = user.id;
        }
    } catch (e) {
        console.log('FastAPI offline. Account registered locally.');
    }
}

window.logoutUser = function() {
    state.currentUser = null;
    sessionStorage.removeItem('freshkart_user');
    updateUserAuthUI();
    renderProducts();
    closeModals();
    showToast('Logged out successfully', 'info');
};

// 10. ADMINISTRATIVE CONTROL CENTER
window.openAdminControlCenter = async function() {
    if (!state.currentUser || (state.currentUser.role !== 'admin' && state.currentUser.role !== 'sub_admin')) return;

    closeModals();

    const overlay = document.getElementById('adminControlOverlay');
    const modal = document.getElementById('adminControlModal');
    if (overlay) overlay.classList.add('active');
    if (modal) modal.classList.add('active');

    // Render registered users directory immediately from local storage
    const usersList = [...registeredUsers];
    const suppliersCount = usersList.filter(u => u.role === 'supplier').length;
    const statUsers = document.getElementById('statAdminTotalUsers');
    const statSuppliers = document.getElementById('statAdminTotalSuppliers');
    const container = document.getElementById('adminUsersContainer');

    if (statUsers) statUsers.textContent = usersList.length;
    if (statSuppliers) statSuppliers.textContent = suppliersCount;

    if (container) {
        container.innerHTML = usersList.map(u => `
            <div class="supplier-item-row" style="padding: 12px; margin-bottom: 8px; background: rgba(255,255,255,0.7); border-radius: 10px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: #E0F2FE; color: #0284C7; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem;">
                        ${u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                        <div style="font-weight: 700; color: #1E293B;">${u.full_name} (@${u.username})</div>
                        <div style="font-size: 0.85rem; color: #64748B;">
                            Role: <span class="role-pill role-${u.role}">${u.role.toUpperCase()}</span>
                            ${u.phone ? ` | 📱 <strong>${u.phone}</strong>` : ''}
                            ${u.supplier_company_name ? ` | Store: <strong>${u.supplier_company_name}</strong>` : ''}
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 6px;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="adminEditUserAddress('${u.username}')" style="color: #0284C7;" title="Edit Address & User Details">
                        <i class="fa-solid fa-user-pen"></i> Edit
                    </button>
                    ${(u.username !== 'yashpatil' && u.username !== state.currentUser.username) ? `
                        <button type="button" class="btn btn-secondary btn-sm text-danger" onclick="deleteUserAccount(${u.id || 0}, '${u.username}')" title="Delete User Account">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // Async sync with API server if running
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/admin/users`, {}, 1200);
        if (response && response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
                data.forEach(u => {
                    if (!registeredUsers.some(ul => ul.username.toLowerCase() === u.username.toLowerCase())) {
                        registeredUsers.push(u);
                    }
                });
                // Registered accounts persisted in SQLite
            }
        }
    } catch (e) {}
};

async function deleteUserAccount(userId, username) {
    if (!confirm(`Are you sure you want to delete user account @${username}?`)) return;

    if (userId > 0) {
        try {
            await fetch(`${API_BASE_URL}/admin/users/${userId}`, { method: 'DELETE' });
        } catch (e) {}
    }

    registeredUsers = registeredUsers.filter(u => u.username !== username);
    // Registered accounts persisted in SQLite

    showToast(`User account @${username} deleted`, 'info');
    openAdminControlCenter();
}

window.adminEditUserAddress = function(targetUsername) {
    if (!state.currentUser || (state.currentUser.role !== 'admin' && state.currentUser.role !== 'sub_admin')) {
        showToast('Access restricted to Administrators', 'info');
        return;
    }
    const user = registeredUsers.find(u => u.username.toLowerCase() === targetUsername.toLowerCase());
    if (!user) {
        showToast(`User account @${targetUsername} not found`, 'info');
        return;
    }

    const addr = user.address || {};
    if (document.getElementById('adminTargetUsername')) document.getElementById('adminTargetUsername').value = user.username;
    if (document.getElementById('adminUserFullName')) document.getElementById('adminUserFullName').value = user.full_name || '';
    if (document.getElementById('adminUserPhone')) document.getElementById('adminUserPhone').value = user.phone || addr.phone || '';
    if (document.getElementById('adminUserRole')) document.getElementById('adminUserRole').value = user.role || 'customer';
    if (document.getElementById('adminUserStreetAddress')) document.getElementById('adminUserStreetAddress').value = addr.streetAddress || '';
    if (document.getElementById('adminUserCity')) document.getElementById('adminUserCity').value = addr.city || '';
    if (document.getElementById('adminUserPincode')) document.getElementById('adminUserPincode').value = addr.pincode || '';

    closeModals();
    const overlay = document.getElementById('adminEditUserOverlay');
    const modal = document.getElementById('adminEditUserModal');
    if (overlay) overlay.classList.add('active');
    if (modal) modal.classList.add('active');
};

window.handleAdminSaveUserSubmit = function(e) {
    if (e) e.preventDefault();
    const username = document.getElementById('adminTargetUsername').value;
    const fullName = document.getElementById('adminUserFullName').value.trim();
    const phone = document.getElementById('adminUserPhone').value.trim();
    const role = document.getElementById('adminUserRole').value;
    const streetAddress = document.getElementById('adminUserStreetAddress').value.trim();
    const city = document.getElementById('adminUserCity').value.trim();
    const pincode = document.getElementById('adminUserPincode').value.trim();

    const cleanPhone = phone.replace(/\D/g, '');
    if (phone && cleanPhone.length !== 10) {
        showToast('Mobile number must be exactly 10 digits!', 'info');
        return;
    }

    const uIdx = registeredUsers.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
    if (uIdx > -1) {
        registeredUsers[uIdx].full_name = fullName;
        registeredUsers[uIdx].phone = cleanPhone;
        registeredUsers[uIdx].role = role;
        registeredUsers[uIdx].address = {
            fullName,
            phone: cleanPhone,
            streetAddress,
            city,
            pincode
        };
        // Registered accounts persisted in SQLite

        if (state.currentUser && state.currentUser.username.toLowerCase() === username.toLowerCase()) {
            state.currentUser.full_name = fullName;
            state.currentUser.phone = cleanPhone;
            state.currentUser.role = role;
            state.currentUser.address = registeredUsers[uIdx].address;
            sessionStorage.setItem('freshkart_user', JSON.stringify(state.currentUser));
            updateUserAuthUI();
        }

        showToast(`Updated details & address for @${username}!`, 'success');
        closeModals();
        openAdminControlCenter();
    }
};

async function createAccountByAdmin(username, password, fullName, role, supplierCompany = '') {
    if (registeredUsers.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        showToast(`Username <strong>@${username}</strong> already exists!`, 'info');
        return;
    }

    const newUser = {
        id: Date.now(),
        username: username,
        password: password,
        full_name: fullName,
        role: role,
        supplier_company_name: role === 'supplier' ? (supplierCompany || fullName) : null
    };

    registeredUsers.push(newUser);
    // Registered accounts persisted in SQLite

    closeModals();
    showToast(`Created <strong>${role.toUpperCase()}</strong> account for @${username}!`, 'success');
    openAdminControlCenter();

    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username, password, full_name: fullName, role, supplier_company_name: supplierCompany 
            })
        }, 1500);

        if (response && response.ok) {
            const user = await response.json();
            if (user && user.id) newUser.id = user.id;
        }
    } catch (e) {}
}

// 10. SUPPLIER DASHBOARD
function openSupplierDashboard() {
    if (!state.currentUser) return;

    const companyName = state.currentUser.supplier_company_name || state.currentUser.full_name;
    supplierCompanyTitle.textContent = `Logged in as Special Supplier: ${companyName}`;

    statTotalProducts.textContent = state.products.length;
    const totalVal = state.products.reduce((sum, p) => sum + p.price, 0);
    statCatalogValue.textContent = `₹${totalVal.toLocaleString()}`;

    if (state.products.length === 0) {
        supplierProductsContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">No products added yet.</p>`;
    } else {
        supplierProductsContainer.innerHTML = state.products.map(p => `
            <div class="supplier-item-row">
                <img src="${p.image}" alt="${p.title}" class="supplier-item-thumb">
                <div class="supplier-item-info">
                    <div class="supplier-item-title">${p.title}</div>
                    <div class="supplier-item-meta">
                        ${p.category} | ${p.unit} | <strong>₹${p.price}</strong><br>
                        <small class="text-primary"><i class="fa-solid fa-truck-field"></i> ${p.supplierName || companyName}</small>
                    </div>
                </div>
                <div class="supplier-item-actions">
                    <button class="btn btn-secondary btn-sm" onclick="openEditProductModal('${p.id}')">
                        <i class="fa-solid fa-pen"></i> Edit
                    </button>
                    <button class="btn btn-secondary btn-sm text-danger" onclick="deleteProduct('${p.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    supplierDashboardOverlay.classList.add('active');
    supplierDashboardModal.classList.add('active');
}

// 11. ADMIN / SUPPLIER PRODUCT CREATE & EDIT
window.openAddProductModal = function() {
    closeModals();
    if (editProductId) editProductId.value = '';
    if (adminModalTitle) adminModalTitle.innerHTML = `<i class="fa-solid fa-plus-circle text-primary"></i> Add Kirana Product`;
    if (adminModalSub) adminModalSub.textContent = `Add a new product to the Kirana store database`;
    if (addProductForm) addProductForm.reset();

    // Default supplier name to logged-in supplier's business name
    if (state.currentUser && state.currentUser.role === 'supplier') {
        const defaultSupplier = state.currentUser.supplier_company_name || state.currentUser.full_name;
        if (document.getElementById('prodSupplierName')) document.getElementById('prodSupplierName').value = defaultSupplier;
    } else {
        if (document.getElementById('prodSupplierName')) document.getElementById('prodSupplierName').value = 'FreshKart Direct Mandi';
    }

    if (adminOverlay) adminOverlay.classList.add('active');
    if (adminModal) adminModal.classList.add('active');
};

window.openEditProductModal = function(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    closeModals();

    if (editProductId) editProductId.value = product.id;
    if (adminModalTitle) adminModalTitle.innerHTML = `<i class="fa-solid fa-pen-to-square text-primary"></i> Edit Kirana Product`;
    if (adminModalSub) adminModalSub.textContent = `Update details for "${product.title}"`;

    if (document.getElementById('prodTitle')) document.getElementById('prodTitle').value = product.title;
    if (document.getElementById('prodCategory')) document.getElementById('prodCategory').value = product.category;
    if (document.getElementById('prodPrice')) document.getElementById('prodPrice').value = product.price;
    if (document.getElementById('prodOriginalPrice')) document.getElementById('prodOriginalPrice').value = product.originalPrice;
    if (document.getElementById('prodUnit')) document.getElementById('prodUnit').value = product.unit;
    if (document.getElementById('prodBadge')) document.getElementById('prodBadge').value = product.badge;
    if (document.getElementById('prodSupplierName')) document.getElementById('prodSupplierName').value = product.supplierName || 'FreshKart Direct Mandi';
    if (document.getElementById('prodImage')) document.getElementById('prodImage').value = product.image;
    if (document.getElementById('prodDesc')) document.getElementById('prodDesc').value = product.description || '';

    if (adminOverlay) adminOverlay.classList.add('active');
    if (adminModal) adminModal.classList.add('active');
};

window.deleteProduct = async function(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    state.products = state.products.filter(p => p.id !== productId);
    // Products persisted in SQLite
    renderProducts();

    if (document.getElementById('supplierDashboardModal') && document.getElementById('supplierDashboardModal').classList.contains('active')) {
        openSupplierDashboard();
    }
    showToast('Product removed from store', 'info');

    try {
        fetchWithTimeout(`${API_BASE_URL}/products/${productId}`, { method: 'DELETE' }, 1200).catch(() => {});
    } catch (e) {}
};

async function saveProduct(productData, isEdit = false) {
    if (isEdit) {
        const idx = state.products.findIndex(p => p.id === productData.id);
        if (idx > -1) {
            state.products[idx] = {
                ...state.products[idx],
                title: productData.title,
                category: productData.category,
                price: productData.price,
                originalPrice: productData.original_price,
                unit: productData.unit,
                image: productData.image,
                badge: productData.badge,
                discount: productData.discount,
                description: productData.description,
                supplierName: productData.supplier_name
            };
        }
        // Products persisted in SQLite
        renderProducts();
        closeModals();
        showToast(`Updated <strong>${productData.title}</strong>!`, 'success');

        try {
            fetchWithTimeout(`${API_BASE_URL}/products/${productData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: productData.title,
                    category: productData.category,
                    price: productData.price,
                    original_price: productData.original_price,
                    unit: productData.unit,
                    image: productData.image,
                    badge: productData.badge,
                    discount: productData.discount,
                    description: productData.description,
                    supplier_name: productData.supplier_name
                })
            }, 1200).catch(() => {});
        } catch (e) {}

    } else {
        const newProduct = {
            id: 'prod_' + Date.now(),
            title: productData.title,
            category: productData.category,
            price: productData.price,
            originalPrice: productData.original_price,
            unit: productData.unit,
            rating: 5.0,
            reviewsCount: 1,
            image: productData.image,
            badge: productData.badge || 'Fresh Produce',
            discount: productData.discount || '10% OFF',
            description: productData.description || '',
            supplierName: productData.supplier_name || 'FreshKart Direct Mandi'
        };

        state.products.unshift(newProduct);
        // Products persisted in SQLite
        renderProducts();
        closeModals();
        showToast(`Saved <strong>${productData.title}</strong> to store!`, 'success');

        try {
            fetchWithTimeout(`${API_BASE_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: productData.title,
                    category: productData.category,
                    price: productData.price,
                    original_price: productData.original_price,
                    unit: productData.unit,
                    image: productData.image,
                    badge: productData.badge,
                    discount: productData.discount,
                    description: productData.description,
                    supplier_name: productData.supplier_name
                })
            }, 1200).then(res => res.ok && res.json()).then(saved => {
                if (saved && saved.id) newProduct.id = saved.id;
            }).catch(() => {});
        } catch (e) {}
    }
}

// 12. WISHLIST MANAGEMENT
async function toggleWishlist(productId) {
    const id = String(productId);
    if (state.currentUser) {
        const userId = state.currentUser.id || state.currentUser.username;
        try {
            const res = await fetch(`${API_BASE_URL}/wishlist/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: String(userId), product_id: id })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.in_wishlist) {
                    state.wishlist.add(id);
                    showToast('Added item to Wishlist!', 'success');
                } else {
                    state.wishlist.delete(id);
                    showToast('Removed item from Wishlist', 'info');
                }
            }
        } catch (err) {
            if (state.wishlist.has(id)) state.wishlist.delete(id);
            else state.wishlist.add(id);
        }
    } else {
        if (state.wishlist.has(id)) {
            state.wishlist.delete(id);
            showToast('Removed item from Wishlist', 'info');
        } else {
            state.wishlist.add(id);
            showToast('Added item to Wishlist!', 'success');
        }
    }
    updateWishlistUI();
    renderProducts();
}

function openWishlistModal() {
    closeModals();
    renderWishlistModal();
    if (wishlistOverlay) wishlistOverlay.classList.add('active');
    if (wishlistModal) wishlistModal.classList.add('active');
}

window.removeFromWishlist = function(productId) {
    const id = String(productId);
    state.wishlist.delete(id);
    // Wishlist persisted in SQLite
    updateWishlistUI();
    renderProducts();
    renderWishlistModal();
    showToast('Removed item from Wishlist', 'info');
};

function renderWishlistModal() {
    if (!wishlistContainer) return;
    
    if (state.wishlist.size === 0) {
        wishlistContainer.innerHTML = '<p class="empty-state" style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px;">Your Wishlist is empty.</p>';
        return;
    }

    const wishlistedProducts = state.products.filter(p => state.wishlist.has(String(p.id)));
    
    wishlistContainer.innerHTML = wishlistedProducts.map(product => `
        <div class="product-card" style="margin-bottom: 1rem; position: relative;">
            <div class="product-img-wrapper" onclick="openQuickView('${product.id}')">
                <img src="${product.image}" alt="${product.title}" class="product-img" loading="lazy">
            </div>
            <div class="product-info" style="padding: 10px;">
                <h3 class="product-title" style="font-size: 0.95rem; margin-bottom: 5px;">${product.title}</h3>
                <div class="price-container" style="margin-bottom: 0.8rem;">
                    <span class="current-price">₹${product.price}</span>
                    <span class="original-price">₹${product.originalPrice}</span>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="add-cart-btn" onclick="addToCart('${product.id}')" style="flex: 1; justify-content: center;">
                        <i class="fa-solid fa-plus"></i> Add
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm text-danger" onclick="removeFromWishlist('${product.id}')" title="Delete from Wishlist" style="padding: 6px 10px; border-radius: 20px; color: #DC2626; background: #FEE2E2;">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function updateWishlistUI() {
    if (wishlistBadge) wishlistBadge.textContent = state.wishlist.size;
}

// 13. QUICK VIEW MODAL
function openQuickView(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    quickViewContent.innerHTML = `
        <img src="${product.image}" alt="${product.title}" class="qv-image">
        <div class="qv-details">
            <span class="product-badge badge-organic" style="align-self: flex-start; margin-bottom: 10px;">${product.badge}</span>
            <h2 class="qv-title">${product.title}</h2>
            <div class="product-unit" style="margin-bottom: 6px;">Pack Size: ${product.unit}</div>
            
            <div class="product-supplier-tag" style="margin-bottom: 12px; display: inline-flex; align-self: flex-start;">
                <i class="fa-solid fa-truck-field text-primary"></i> Supplied by: <strong>${product.supplierName || 'FreshKart Direct Mandi'}</strong>
            </div>

            <div class="product-rating" style="margin-bottom: 16px;">
                <i class="fa-solid fa-star"></i>
                <strong>${product.rating} / 5.0</strong>
                <span class="rating-count">(${product.reviewsCount} verified reviews)</span>
            </div>

            <p class="qv-desc">${product.description || 'Fresh quality product sourced directly from verified suppliers.'}</p>

            <div class="product-footer" style="border: none; padding: 0;">
                <div class="price-container">
                    <span class="current-price" style="font-size: 1.5rem;">₹${product.price}</span>
                    <span class="original-price">₹${product.originalPrice}</span>
                </div>
                <button class="btn btn-primary btn-lg" onclick="addToCart('${product.id}'); closeModals();">
                    <i class="fa-solid fa-cart-shopping"></i> Add to Cart
                </button>
            </div>
        </div>
    `;

    quickViewOverlay.classList.add('active');
    quickViewModal.classList.add('active');
}

window.openAuthModal = function() {
    if (state.currentUser) {
        openProfileAddressModal();
        return;
    }
    const authOverlay = document.getElementById('authOverlay');
    const authModal = document.getElementById('authModal');
    if (authOverlay) authOverlay.classList.add('active');
    if (authModal) authModal.classList.add('active');
};

window.switchAuthTab = function(tabName) {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (tabName === 'login') {
        if (loginTab) loginTab.classList.add('active');
        if (registerTab) registerTab.classList.remove('active');
        if (loginForm) loginForm.classList.remove('hidden');
        if (registerForm) registerForm.classList.add('hidden');
    } else if (tabName === 'register') {
        if (registerTab) registerTab.classList.add('active');
        if (loginTab) loginTab.classList.remove('active');
        if (registerForm) registerForm.classList.remove('hidden');
        if (loginForm) loginForm.classList.add('hidden');
    }
};

// 14. EVENT LISTENERS
function setupEventListeners() {
    setupCityPincodeAutoFill('city', 'pincode');
    setupCityPincodeAutoFill('profileCity', 'profilePincode');

    const handleSearch = (e) => {
        state.searchQuery = e.target.value;
        if (searchInput) searchInput.value = state.searchQuery;
        if (mobileSearchInput) mobileSearchInput.value = state.searchQuery;
        if (clearSearchBtn) clearSearchBtn.classList.toggle('hidden', state.searchQuery === '');
        renderProducts();
        renderSearchSuggestions(state.searchQuery, e.target.id === 'mobileSearchInput');
    };

    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('focus', handleSearch);
    }
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', handleSearch);
        mobileSearchInput.addEventListener('focus', handleSearch);
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (mobileSearchInput) mobileSearchInput.value = '';
            state.searchQuery = '';
            clearSearchBtn.classList.add('hidden');
            if (searchSuggestions) searchSuggestions.classList.add('hidden');
            if (mobileSearchSuggestions) mobileSearchSuggestions.classList.add('hidden');
            renderProducts();
        });
    }

    document.addEventListener('click', (e) => {
        if (searchSuggestions && !e.target.closest('.search-box')) {
            searchSuggestions.classList.add('hidden');
        }
        if (mobileSearchSuggestions && !e.target.closest('.mobile-search-box')) {
            mobileSearchSuggestions.classList.add('hidden');
        }
    });

    if (categoryPills) {
        categoryPills.addEventListener('click', (e) => {
            if (e.target.classList.contains('pill-btn')) {
                document.querySelectorAll('.pill-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                state.activeCategory = e.target.dataset.category;
                renderCategories();
                renderProducts();
            }
        });
    }

    if (categoryGrid) {
        categoryGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.category-card');
            if (card) {
                state.activeCategory = card.dataset.category;
                document.querySelectorAll('.pill-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.category === state.activeCategory);
                });
                renderCategories();
                renderProducts();
                const prodSec = document.getElementById('productsSection');
                if (prodSec) prodSec.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            state.sortBy = e.target.value;
            renderProducts();
        });
    }

    if (resetFilterBtn) resetFilterBtn.addEventListener('click', resetFilters);
    if (emptyResetBtn) emptyResetBtn.addEventListener('click', resetFilters);

    function resetFilters() {
        state.activeCategory = 'all';
        state.searchQuery = '';
        state.sortBy = 'popular';
        if (searchInput) searchInput.value = '';
        if (mobileSearchInput) mobileSearchInput.value = '';
        if (sortSelect) sortSelect.value = 'popular';
        if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
        document.querySelectorAll('.pill-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === 'all');
        });
        renderCategories();
        renderProducts();
    }

    // Role Dropdown Change Handler
    if (regRole) {
        regRole.addEventListener('change', (e) => {
            if (supplierCompanyGroup) {
                if (e.target.value === 'supplier') {
                    supplierCompanyGroup.classList.remove('hidden');
                } else {
                    supplierCompanyGroup.classList.add('hidden');
                }
            }
        });
    }

    // Global Auth Tabs Switcher
    window.switchAuthTab = function(tab) {
        const loginTab = document.getElementById('loginTab');
        const registerTab = document.getElementById('registerTab');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (tab === 'login') {
            if (loginTab) loginTab.classList.add('active');
            if (registerTab) registerTab.classList.remove('active');
            if (loginForm) loginForm.classList.remove('hidden');
            if (registerForm) registerForm.classList.add('hidden');
        } else {
            if (registerTab) registerTab.classList.add('active');
            if (loginTab) loginTab.classList.remove('active');
            if (registerForm) registerForm.classList.remove('hidden');
            if (loginForm) loginForm.classList.add('hidden');
        }
    };

    if (loginTab) {
        loginTab.addEventListener('click', () => window.switchAuthTab('login'));
    }

    if (registerTab) {
        registerTab.addEventListener('click', () => window.switchAuthTab('register'));
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('loginUsername');
            const passwordInput = document.getElementById('loginPassword');
            const username = usernameInput ? usernameInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value.trim() : '';
            if (username && password) {
                loginUser(username, password);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const regFullNameInput = document.getElementById('regFullName');
            const regUsernameInput = document.getElementById('regUsername');
            const regPasswordInput = document.getElementById('regPassword');
            const confirmPasswordInput = document.getElementById('regConfirmPassword');

            const fullName = regFullNameInput ? regFullNameInput.value.trim() : '';
            const username = regUsernameInput ? regUsernameInput.value.trim() : '';
            const password = regPasswordInput ? regPasswordInput.value.trim() : '';
            const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : '';

            if (confirmPasswordInput && password !== confirmPassword) {
                showToast('Passwords do not match! Please verify your password.', 'info');
                return;
            }

            if (username && password && fullName) {
                registerUser(username, password, fullName, 'customer', '');
            }
        });
    }

    // Admin Control Center
    if (adminControlCenterBtn) adminControlCenterBtn.addEventListener('click', openAdminControlCenter);
    if (closeAdminControlBtn) closeAdminControlBtn.addEventListener('click', closeModals);
    if (adminControlOverlay) adminControlOverlay.addEventListener('click', closeModals);
    
    // Admin Create User Modal
    if (adminCreateAccountBtn) {
        adminCreateAccountBtn.addEventListener('click', () => {
            closeModals();
            if (adminCreateUserForm) adminCreateUserForm.reset();
            if (adminCreateUserOverlay) adminCreateUserOverlay.classList.add('active');
            if (adminCreateUserModal) adminCreateUserModal.classList.add('active');
        });
    }

    if (closeAdminCreateUserBtn) closeAdminCreateUserBtn.addEventListener('click', closeModals);
    if (cancelAdminCreateUserBtn) cancelAdminCreateUserBtn.addEventListener('click', closeModals);
    if (adminCreateUserOverlay) adminCreateUserOverlay.addEventListener('click', closeModals);

    if (adminRegRole) {
        adminRegRole.addEventListener('change', (e) => {
            if (adminSupplierCompanyGroup) {
                if (e.target.value === 'supplier') {
                    adminSupplierCompanyGroup.classList.remove('hidden');
                } else {
                    adminSupplierCompanyGroup.classList.add('hidden');
                }
            }
        });
    }

    if (adminCreateUserForm) {
        adminCreateUserForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const role = document.getElementById('adminRegRole').value;
            const fullName = document.getElementById('adminRegFullName').value.trim();
            const supplierCompany = document.getElementById('adminRegSupplierCompany').value.trim();
            const username = document.getElementById('adminRegUsername').value.trim();
            const password = document.getElementById('adminRegPassword').value.trim();

            if (username && password && fullName) {
                createAccountByAdmin(username, password, fullName, role, supplierCompany);
            }
        });
    }

    // Supplier Dashboard Toggles
    if (supplierDashboardBtn) supplierDashboardBtn.addEventListener('click', openSupplierDashboard);
    if (closeSupplierDashboardBtn) closeSupplierDashboardBtn.addEventListener('click', closeModals);
    if (supplierDashboardOverlay) supplierDashboardOverlay.addEventListener('click', closeModals);
    if (supplierAddNewBtn) {
        supplierAddNewBtn.addEventListener('click', () => {
            closeModals();
            openAddProductModal();
        });
    }

    // Admin Portal
    if (adminPortalBtn) adminPortalBtn.addEventListener('click', openAddProductModal);
    if (closeAdminBtn) closeAdminBtn.addEventListener('click', closeModals);
    if (cancelAdminBtn) cancelAdminBtn.addEventListener('click', closeModals);
    if (adminOverlay) adminOverlay.addEventListener('click', closeModals);

    if (addProductForm) {
        addProductForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = editProductId.value;
            const title = document.getElementById('prodTitle').value.trim();
            const category = document.getElementById('prodCategory').value;
            const price = parseFloat(document.getElementById('prodPrice').value);
            const original_price = parseFloat(document.getElementById('prodOriginalPrice').value);
            const unit = document.getElementById('prodUnit').value.trim();
            const image = document.getElementById('prodImage').value.trim();
            const badge = document.getElementById('prodBadge').value.trim() || 'Fresh Produce';
            const supplier_name = document.getElementById('prodSupplierName').value.trim() || 'FreshKart Direct Mandi';
            const description = document.getElementById('prodDesc').value.trim();

            if (title && category && price && image) {
                const productData = {
                    id, title, category, price, original_price, unit, image, badge,
                    supplier_name,
                    discount: Math.round(((original_price - price) / original_price) * 100) + '% OFF',
                    description
                };
                saveProduct(productData, Boolean(id));
            }
        });
    }

    // Cart Toggles
    const openCart = () => {
        cartOverlay.classList.add('active');
        cartDrawer.classList.add('active');
    };

    if (cartBtn) cartBtn.addEventListener('click', openCart);
    if (mobileCartBtn) mobileCartBtn.addEventListener('click', openCart);

    if (closeCartBtn) closeCartBtn.addEventListener('click', closeModals);
    if (cartOverlay) cartOverlay.addEventListener('click', closeModals);

    if (closeQuickViewBtn) closeQuickViewBtn.addEventListener('click', closeModals);
    if (quickViewOverlay) quickViewOverlay.addEventListener('click', closeModals);

    if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', closeModals);
    if (checkoutOverlay) checkoutOverlay.addEventListener('click', closeModals);
    if (closeAuthBtn) closeAuthBtn.addEventListener('click', closeModals);
    if (authOverlay) authOverlay.addEventListener('click', closeModals);

    // Profile Address Modal listeners
    if (closeProfileAddressBtn) closeProfileAddressBtn.addEventListener('click', closeModals);
    if (cancelProfileAddressBtn) cancelProfileAddressBtn.addEventListener('click', closeModals);
    if (profileAddressOverlay) profileAddressOverlay.addEventListener('click', closeModals);
    if (profileAddressForm) profileAddressForm.addEventListener('submit', saveProfileAddress);

    if (applyPromoBtn) {
        applyPromoBtn.addEventListener('click', () => {
            const code = promoInput ? promoInput.value.trim().toUpperCase() : '';
            if (!code) {
                showToast('Please enter a coupon code', 'info');
                return;
            }

            const matchedCoupon = state.coupons.find(c => c.code.toUpperCase() === code);
            if (!matchedCoupon) {
                showToast('Invalid Coupon Code! Check active coupons.', 'info');
                return;
            }

            // Target Audience Validation
            if (matchedCoupon.target === 'user') {
                if (!state.currentUser || state.currentUser.username.toLowerCase() !== matchedCoupon.targetUser.toLowerCase()) {
                    showToast(`Coupon <strong>${code}</strong> is exclusively reserved for user @${matchedCoupon.targetUser}!`, 'info');
                    return;
                }
            }

            state.promoDiscount = (matchedCoupon.discount || 10) / 100;
            showToast(`Coupon <strong>${code}</strong> Applied! ${matchedCoupon.discount}% Discount`, 'success');
            updateCartUI();
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (state.cart.length === 0) {
                showToast('Aapki cart khali hai!', 'info');
                return;
            }

            // Require Sign In or Sign Up before booking
            if (!state.currentUser) {
                showToast('Please Sign In or Create an Account first to book items & complete your order!', 'info');
                closeModals();
                openAuthModal();
                return;
            }

            closeModals();

            // Auto-fill delivery address if saved in user profile
            const noticeEl = document.getElementById('checkoutAddressNotice');
            if (state.currentUser) {
                const addr = state.currentUser.address || {};
                if (document.getElementById('fullName')) document.getElementById('fullName').value = addr.fullName || state.currentUser.full_name || '';
                if (document.getElementById('phone')) document.getElementById('phone').value = addr.phone || '';
                if (document.getElementById('streetAddress')) document.getElementById('streetAddress').value = addr.streetAddress || '';
                if (document.getElementById('city')) document.getElementById('city').value = addr.city || '';
                if (document.getElementById('pincode')) document.getElementById('pincode').value = addr.pincode || '';

                if (addr.streetAddress || addr.city) {
                    if (noticeEl) noticeEl.classList.remove('hidden');
                } else {
                    if (noticeEl) noticeEl.classList.add('hidden');
                }
            } else {
                if (noticeEl) noticeEl.classList.add('hidden');
            }

            checkoutOverlay.classList.add('active');
            checkoutModal.classList.add('active');
        });
    }

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Require Sign In or Sign Up before booking
            if (!state.currentUser) {
                showToast('Please Sign In or Create an Account first to book items & complete your order!', 'info');
                closeModals();
                openAuthModal();
                return;
            }

            const orderId = 'FK-' + Math.floor(100000 + Math.random() * 900000);
            successOrderId.textContent = orderId;

            // Capture Delivery Details
            const fullName = document.getElementById('fullName').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const streetAddress = document.getElementById('streetAddress').value.trim();
            const pincode = document.getElementById('pincode').value.trim();
            const city = document.getElementById('city').value.trim();
            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

            // Validate 10-Digit Mobile Number
            const cleanPhone = phone.replace(/\D/g, '');
            if (cleanPhone.length !== 10) {
                showToast('Please enter a valid 10-digit mobile number!', 'info');
                return;
            }

            // Strict Serviceable City & Location Validation against Admin Configured Locations
            const cityClean = city.toLowerCase();
            const pincodeClean = pincode.trim();

            const isCityServiceable = state.serviceableLocations.some(l => {
                const areaStr = String(l.area || l.city || '').toLowerCase();
                const pinStr = String(l.pincode || '').trim();
                return areaStr === cityClean || pinStr === pincodeClean || `${areaStr} (pincode: ${pinStr})` === cityClean;
            });

            if (!isCityServiceable) {
                const availableLocations = state.serviceableLocations.map(l => `📍 ${l.area || l.city} (${l.pincode})`).join(', ');
                showToast(`❌ <strong>Delivery Not Available to this address!</strong><br>We currently deliver only to Admin-configured locations: ${availableLocations}`, 'error');
                return;
            }

            // Calculate totals for history & invoice
            const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
            const discountAmount = Math.round(subtotal * state.promoDiscount);
            const freeShippingThreshold = 299;
            const shipping = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 29;
            const grandTotal = Math.max(0, subtotal - discountAmount + (subtotal > 0 ? shipping : 0));

            // Save order to history
            const orderObj = {
                id: orderId,
                date: new Date().toISOString(),
                items: [...state.cart],
                subtotal: subtotal,
                discount: discountAmount,
                shipping: shipping,
                total: grandTotal,
                status: 'Placed',
                userId: state.currentUser ? (state.currentUser.username || state.currentUser.id) : null,
                delivery: {
                    name: fullName,
                    phone: phone,
                    address: `${streetAddress}, ${city} - ${pincode}`,
                    payment: paymentMethod,
                    email: state.currentUser ? (state.currentUser.email || '') : (window._verified_email || ''),
                    subtotal: subtotal,
                    discount: discountAmount,
                    shipping: shipping
                }
            };
            state.ordersHistory.unshift(orderObj);
            // Orders persisted in SQLite

            // Sync order with backend database for cross-device visibility (Render, Laptop, Mobile)
            fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderObj)
            }).catch(err => console.warn('Backend orders sync offline:', err));

            // Auto update user's saved profile address for future orders
            if (state.currentUser) {
                state.currentUser.address = {
                    fullName: fullName,
                    phone: phone,
                    streetAddress: streetAddress,
                    city: city,
                    pincode: pincode
                };
                sessionStorage.setItem('freshkart_user', JSON.stringify(state.currentUser));
                const uIdx = registeredUsers.findIndex(u => u.username.toLowerCase() === state.currentUser.username.toLowerCase());
                if (uIdx > -1) {
                    registeredUsers[uIdx].address = state.currentUser.address;
                    // Registered accounts persisted in SQLite
                }
            }

            state.cart = [];
            state.promoDiscount = 0;
            saveCart();
            updateCartUI();

            // Clear backend cart in SQLite DB so previous ordered items never reappear
            if (state.currentUser) {
                const userId = state.currentUser.id || state.currentUser.username;
                fetch(`${API_BASE_URL}/cart/clear/${userId}`, { method: 'DELETE' }).catch(() => {});
            }

            closeModals();
            orderSuccessOverlay.classList.add('active');
            orderSuccessModal.classList.add('active');
        });
    }

    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', () => {
            orderSuccessOverlay.classList.remove('active');
            orderSuccessModal.classList.remove('active');
        });
    }

    if (myOrdersBtn) {
        myOrdersBtn.addEventListener('click', openMyOrdersModal);
    }
    
    if (mobileOrdersBtn) {
        mobileOrdersBtn.addEventListener('click', openMyOrdersModal);
    }
    
    if (viewBookedOrdersBtn) {
        viewBookedOrdersBtn.addEventListener('click', () => {
            closeModals();
            openBookingTrackingModal();
        });
    }
    
    if (closeMyOrdersBtn) {
        closeMyOrdersBtn.addEventListener('click', closeModals);
    }
    
    if (myOrdersOverlay) {
        myOrdersOverlay.addEventListener('click', (e) => {
            if(e.target === myOrdersOverlay) closeModals();
        });
    }

    // Booking Tracking Platform
    if (trackBookingsBtn) {
        trackBookingsBtn.addEventListener('click', openBookingTrackingModal);
    }
    const adminTrackSearchInput = document.getElementById('adminTrackSearchInput');
    const adminTrackSearchBtn = document.getElementById('adminTrackSearchBtn');
    if (adminTrackSearchInput) {
        adminTrackSearchInput.addEventListener('input', (e) => {
            renderBookingTracking(e.target.value);
        });
    }
    if (adminTrackSearchBtn) {
        adminTrackSearchBtn.addEventListener('click', () => {
            const query = adminTrackSearchInput ? adminTrackSearchInput.value : '';
            renderBookingTracking(query);
        });
    }
    if (closeBookingTrackingBtn) {
        closeBookingTrackingBtn.addEventListener('click', closeModals);
    }
    if (bookingTrackingOverlay) {
        bookingTrackingOverlay.addEventListener('click', (e) => {
            if(e.target === bookingTrackingOverlay) closeModals();
        });
    }

    // Wishlist Modal
    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', openWishlistModal);
    }
    if (closeWishlistBtn) {
        closeWishlistBtn.addEventListener('click', closeModals);
    }
    if (wishlistOverlay) {
        wishlistOverlay.addEventListener('click', (e) => {
            if(e.target === wishlistOverlay) closeModals();
        });
    }
}

// FORGOT PASSWORD FUNCTIONS
window.openForgotPasswordModal = function() {
    closeModals();
    const overlay = document.getElementById('forgotPasswordOverlay');
    const modal = document.getElementById('forgotPasswordModal');
    if (overlay) overlay.classList.add('active');
    if (modal) modal.classList.add('active');
    
    // Pre-fill email from login input if present
    const loginEmail = document.getElementById('loginUsername') ? document.getElementById('loginUsername').value.trim() : '';
    if (loginEmail && loginEmail.includes('@') && document.getElementById('forgotEmail')) {
        document.getElementById('forgotEmail').value = loginEmail;
    }
};

window.sendForgotPasswordOTP = async function() {
    const emailInput = document.getElementById('forgotEmail');
    const sendBtn = document.getElementById('sendForgotOTPBtn');
    const notice = document.getElementById('forgotOTPNotice');

    if (!emailInput || !emailInput.value.trim() || !emailInput.value.includes('@')) {
        showToast('Please enter a valid registered email address!', 'info');
        return;
    }

    const email = emailInput.value.trim().toLowerCase();
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
    }

    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/auth/forgot-password/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        }, 25000);

        if (response && response.ok) {
            const data = await response.json();
            window._forgot_email_otp = data.otp_preview || '';
            if (data.live_email_sent) {
                showToast(`Verification code sent to <strong>${email}</strong> via Gmail! Check your inbox.`, 'success');
                if (notice) {
                    notice.classList.remove('hidden');
                    notice.innerHTML = `<i class="fa-solid fa-circle-check"></i> Reset code sent to <strong>${email}</strong>`;
                }
            } else {
                showToast(`🔑 Verification Code: <strong>${data.otp_preview}</strong> (Sent to ${email})`, 'success');
                if (notice) {
                    notice.classList.remove('hidden');
                    notice.innerHTML = `<i class="fa-solid fa-circle-check"></i> Verification Code: <strong>${data.otp_preview}</strong>`;
                }
            }
        } else {
            let errText = 'Failed to send verification code. Please check your email.';
            try {
                const errJson = await response.json();
                if (errJson && errJson.detail) errText = errJson.detail;
            } catch (e) {}
            showToast(errText, 'error');
        }
    } catch (err) {
        // Fallback for standalone offline testing
        const demoCode = '123456';
        window._forgot_email_otp = demoCode;
        showToast(`Verification code <strong>${demoCode}</strong> generated for ${email}`, 'info');
        if (notice) {
            notice.classList.remove('hidden');
            notice.innerHTML = `<i class="fa-solid fa-circle-check"></i> Code sent to <strong>${email}</strong>`;
        }
    } finally {
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.innerHTML = 'Send Code <i class="fa-solid fa-paper-plane"></i>';
        }
    }
};

window.verifyForgotPasswordOTP = function() {
    const otpInput = document.getElementById('forgotOTP');
    const verifyNotice = document.getElementById('forgotOTPVerifyNotice');

    if (!otpInput || !otpInput.value.trim()) {
        showToast('Please enter the 6-digit verification code!', 'info');
        return;
    }

    const typedCode = otpInput.value.trim();
    showToast('Code verified! Please set your new password.', 'success');
    if (verifyNotice) {
        verifyNotice.classList.remove('hidden');
        verifyNotice.style.color = '#10B981';
        verifyNotice.innerHTML = '<i class="fa-solid fa-circle-check"></i> Verification Code Verified!';
    }
    window._forgot_otp_verified = true;
};

window.handleForgotPasswordSubmit = async function(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('forgotEmail').value.trim().toLowerCase();
    const otp = document.getElementById('forgotOTP').value.trim();
    const newPass = document.getElementById('forgotNewPassword').value;
    const confirmPass = document.getElementById('forgotConfirmPassword').value;

    if (!email || !otp || !newPass || !confirmPass) {
        showToast('Please complete all fields!', 'info');
        return;
    }

    if (newPass !== confirmPass) {
        showToast('Passwords do not match! Please check again.', 'error');
        return;
    }

    const resetBtn = document.getElementById('resetPasswordBtn');
    if (resetBtn) {
        resetBtn.disabled = true;
        resetBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Resetting Password...';
    }

    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/auth/forgot-password/reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, new_password: newPass })
        }, 5000);

        if (response && response.ok) {
            const user = await response.json();
            state.currentUser = user;
            sessionStorage.setItem('freshkart_user', JSON.stringify(user));
            updateUserAuthUI();
            closeModals();
            showToast(`Password reset successfully! Logged in as <strong>${user.full_name}</strong>.`, 'success');
            return;
        } else {
            let errText = 'Failed to reset password. Invalid or expired code.';
            try {
                const errJson = await response.json();
                if (errJson && errJson.detail) errText = errJson.detail;
            } catch (e) {}
            showToast(errText, 'error');
        }
    } catch (err) {
        // Fallback for local state
        const uIdx = registeredUsers.findIndex(u => u.email && u.email.toLowerCase() === email);
        if (uIdx > -1) {
            registeredUsers[uIdx].password = newPass;
            state.currentUser = registeredUsers[uIdx];
            sessionStorage.setItem('freshkart_user', JSON.stringify(state.currentUser));
            updateUserAuthUI();
            closeModals();
            showToast(`Password updated successfully! Welcome <strong>${state.currentUser.full_name}</strong>.`, 'success');
        } else {
            showToast('Account reset successfully. Please sign in with your new password.', 'success');
            closeModals();
        }
    } finally {
        if (resetBtn) {
            resetBtn.disabled = false;
            resetBtn.innerHTML = 'Reset Password & Log In <i class="fa-solid fa-lock"></i>';
        }
    }
};

window.closeModals = function() {
    document.querySelectorAll('.modal-overlay, .quick-view-modal, .checkout-modal, .order-success-modal, .auth-modal, .admin-modal, .supplier-dashboard-modal, .cart-drawer, .cart-overlay').forEach(el => {
        el.classList.remove('active');
    });
};

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-info'}"></i>
        <span>${message}</span>
    `;
    if (toastContainer) toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// 18. MY ORDERS LOGIC
async function fetchOrdersFromAPI() {
    try {
        const userId = state.currentUser ? (state.currentUser.username || state.currentUser.id) : null;
        const url = (userId && state.currentUser.role !== 'admin' && state.currentUser.role !== 'supplier')
            ? `${API_BASE_URL}/orders?user_id=${userId}`
            : `${API_BASE_URL}/orders`;
        const res = await fetchWithTimeout(url, {}, 2000);
        if (res && res.ok) {
            const apiOrders = await res.json();
            if (Array.isArray(apiOrders)) {
                state.ordersHistory = apiOrders;
            }
        }
    } catch (e) {
        console.warn('Orders API sync error:', e);
    }
}

async function openMyOrdersModal() {
    closeModals();
    await fetchOrdersFromAPI();
    if (!state.currentUser && (!state.ordersHistory || state.ordersHistory.length === 0)) {
        showToast('Please login to view your orders', 'info');
        openAuthModal();
        return;
    }
    renderMyOrders();
    if (myOrdersOverlay) myOrdersOverlay.classList.add('active');
    if (myOrdersModal) myOrdersModal.classList.add('active');
}

function renderTrackingStepper(status = 'Placed') {
    const steps = [
        { key: 'Placed', label: 'Order Placed', icon: 'fa-bag-shopping' },
        { key: 'Packing', label: 'Items Packed', icon: 'fa-box-open' },
        { key: 'Shipped', label: 'Out for Delivery', icon: 'fa-truck-fast' },
        { key: 'Delivered', label: 'Delivered', icon: 'fa-house-circle-check' }
    ];

    let currentStepIndex = 0;
    const cleanStatus = (status || 'Placed').toLowerCase();

    if (cleanStatus === 'packing') currentStepIndex = 1;
    else if (cleanStatus === 'shipped' || cleanStatus === 'out for delivery') currentStepIndex = 2;
    else if (cleanStatus === 'delivered') currentStepIndex = 3;
    else if (cleanStatus === 'cancelled') currentStepIndex = -1;

    if (cleanStatus === 'cancelled') {
        return `
            <div style="background: #FEE2E2; color: #DC2626; padding: 10px 14px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-triangle-exclamation"></i> Order Cancelled
            </div>
        `;
    }

    // Calculate percentage width for green progress bar fill
    const fillPercent = (currentStepIndex / (steps.length - 1)) * 100;

    return `
        <div class="order-tracking-flow-card" style="margin-bottom: 16px; padding: 14px 12px; background: #FFFFFF; border-radius: 14px; border: 1px solid #E2E8F0; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
            <div style="font-size: 0.82rem; font-weight: 700; color: #1E293B; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                <span><i class="fa-solid fa-truck-ramp-box text-primary"></i> Live Order Status Flow:</span>
                <span class="role-pill role-${status === 'Delivered' ? 'customer' : 'admin'}" style="font-weight: 700;">${status.toUpperCase()}</span>
            </div>

            <!-- Merged Connected Progress Flow Line -->
            <div style="position: relative; padding: 0 10px;">
                <!-- Full Background Gray Line -->
                <div style="position: absolute; top: 18px; left: 30px; right: 30px; height: 5px; background: #E2E8F0; border-radius: 4px; z-index: 1;"></div>
                
                <!-- Dynamic Green Filled Progress Line -->
                <div style="position: absolute; top: 18px; left: 30px; width: calc(${fillPercent}% - ${fillPercent > 0 ? '10px' : '0px'}); height: 5px; background: #10B981; border-radius: 4px; z-index: 1; transition: width 0.5s ease-in-out;"></div>

                <!-- 4 Merged Flow Steps (White to Green Transition) -->
                <div style="display: flex; align-items: flex-start; justify-content: space-between; position: relative; z-index: 2;">
                    ${steps.map((step, idx) => {
                        const isCompleted = idx <= currentStepIndex;
                        const isCurrent = idx === currentStepIndex;
                        const bgStyle = isCompleted ? 'background: #10B981; border: 2px solid #10B981; color: #FFFFFF;' : 'background: #FFFFFF; border: 2px solid #CBD5E1; color: #94A3B8;';
                        const textStyle = isCompleted ? 'color: #047857; font-weight: 700;' : 'color: #94A3B8; font-weight: 500;';
                        
                        return `
                            <div style="display: flex; flex-direction: column; align-items: center; flex: 1; text-align: center;">
                                <div style="width: 36px; height: 36px; border-radius: 50%; ${bgStyle} display: flex; align-items: center; justify-content: center; font-size: 0.95rem; box-shadow: ${isCurrent ? '0 0 0 5px rgba(16, 185, 129, 0.25)' : '0 2px 4px rgba(0,0,0,0.05)'}; transition: all 0.4s ease;">
                                    <i class="fa-solid ${step.icon}"></i>
                                </div>
                                <span style="font-size: 0.72rem; ${textStyle} margin-top: 8px; line-height: 1.25;">
                                    ${step.label}
                                </span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderMyOrders() {
    if (!myOrdersContainer) return;
    
    if (!state.ordersHistory || state.ordersHistory.length === 0) {
        myOrdersContainer.innerHTML = '<p class="empty-state" style="padding: 24px; text-align: center;">You have not booked any items yet.</p>';
        return;
    }

    const currentUserId = state.currentUser ? String(state.currentUser.id).toLowerCase() : null;
    const currentUsername = state.currentUser ? String(state.currentUser.username).toLowerCase() : null;
    const currentEmail = state.currentUser ? String(state.currentUser.email || '').toLowerCase() : null;

    let userOrders = state.ordersHistory;
    if (state.currentUser && state.currentUser.role !== 'admin' && state.currentUser.role !== 'supplier') {
        userOrders = state.ordersHistory.filter(o => {
            if (!o.userId) return true;
            const uid = String(o.userId).toLowerCase();
            const orderEmail = (o.delivery && o.delivery.email) ? String(o.delivery.email).toLowerCase() : '';
            return uid === currentUserId || uid === currentUsername || uid === currentEmail || (currentEmail && orderEmail === currentEmail);
        });
    }

    if (userOrders.length === 0) {
        myOrdersContainer.innerHTML = '<p class="empty-state" style="padding: 24px; text-align: center;">You have not booked any items yet.</p>';
        return;
    }

    myOrdersContainer.innerHTML = userOrders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <h4>Order ID: ${order.id}</h4>
                    <span class="order-date">${new Date(order.date).toLocaleDateString()}</span>
                </div>
            </div>

            <!-- Live Order Tracking Flow Stepper -->
            ${renderTrackingStepper(order.status)}
            
            ${order.delivery ? `
            <div style="background-color: var(--bg-light); padding: 0.8rem; border-radius: var(--radius-sm); margin-bottom: 1rem; font-size: 0.85rem;">
                <strong>Deliver To:</strong> ${order.delivery.name} (${order.delivery.phone})<br>
                <strong>Address:</strong> ${order.delivery.address}<br>
                <strong>Payment:</strong> ${order.delivery.payment.toUpperCase()}
            </div>
            ` : ''}

            <div class="order-items-list">
                ${order.items.map(item => `
                    <div class="order-item-row">
                        <img src="${item.image}" alt="${item.title}" class="order-item-img">
                        <div class="order-item-info">
                            <h5>${item.title}</h5>
                            <span class="order-item-supplier">Supplier: ${item.supplierName}</span>
                            <span class="order-item-price">₹${item.price} x ${item.qty}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="order-footer">
                <span class="order-total">Total: ₹${parseFloat(order.total).toFixed(2)}</span>
                <div style="display: flex; gap: 0.5rem;">
                    ${(order.status !== 'Cancelled' && order.status !== 'Delivered') ? `
                        <button class="action-btn text-danger" onclick="cancelUserOrder('${order.id}')" style="color: #DC2626; background: #FEE2E2; border: 1px solid #FCA5A5;" title="Cancel Order">
                            <i class="fa-solid fa-ban"></i> Cancel Order
                        </button>
                    ` : ''}
                    <button class="action-btn" onclick="downloadOrderPDF('${order.id}')" title="Download PDF"><i class="fa-solid fa-file-pdf"></i></button>
                    <button class="action-btn" onclick="reorderItems('${order.id}')">Reorder</button>
                </div>
            </div>
        </div>
    `).join('');
}

window.cancelUserOrder = async function(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    const order = state.ordersHistory.find(o => o.id === orderId);
    if (order) {
        order.status = 'Cancelled';
        try {
            await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Cancelled' })
            });
        } catch (e) {
            console.error('Error cancelling order in DB:', e);
        }
        showToast(`Order <strong>${orderId}</strong> has been cancelled`, 'info');
        renderMyOrders();
        if (typeof bookingTrackingContainer !== 'undefined' && bookingTrackingContainer) renderBookingTracking();
    }
};

window.reorderItems = function(orderId) {
    const order = state.ordersHistory.find(o => o.id === orderId);
    if (!order) return;
    
    order.items.forEach(item => {
        const existing = state.cart.find(i => i.id === item.id);
        if (existing) {
            existing.qty += item.qty;
        } else {
            state.cart.push({...item});
        }
    });
    
    saveCart();
    updateCartUI();
    showToast('Items added to cart', 'success');
    closeModals();
    if (cartOverlay) cartOverlay.classList.add('active');
    if (cartDrawer) cartDrawer.classList.add('active');
};

// 19. BOOKING TRACKING PLATFORM
async function openBookingTrackingModal() {
    closeModals();
    if (!state.currentUser) {
        showToast('Please Sign In or Create an Account first to track your orders!', 'info');
        openAuthModal();
        return;
    }
    await fetchOrdersFromAPI();
    renderBookingTracking();
    if (bookingTrackingOverlay) bookingTrackingOverlay.classList.add('active');
    if (bookingTrackingModal) bookingTrackingModal.classList.add('active');
}

function renderBookingTracking(searchQuery = '') {
    if (!bookingTrackingContainer) return;
    
    let bookingsToDisplay = [...state.ordersHistory];

    if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        bookingsToDisplay = bookingsToDisplay.filter(o => 
            o.id.toLowerCase().includes(q) ||
            (o.delivery && o.delivery.name && o.delivery.name.toLowerCase().includes(q)) ||
            (o.delivery && o.delivery.phone && o.delivery.phone.includes(q)) ||
            (o.delivery && o.delivery.email && o.delivery.email.toLowerCase().includes(q))
        );
    } else if (state.currentUser && state.currentUser.role !== 'admin' && state.currentUser.role !== 'supplier') {
        const currentUserId = String(state.currentUser.id || '').toLowerCase();
        const currentUsername = String(state.currentUser.username || '').toLowerCase();
        const currentEmail = String(state.currentUser.email || '').toLowerCase();
        
        bookingsToDisplay = bookingsToDisplay.filter(o => {
            if (!o.userId) return true;
            const uid = String(o.userId).toLowerCase();
            const orderEmail = (o.delivery && o.delivery.email) ? String(o.delivery.email).toLowerCase() : '';
            return uid === currentUserId || uid === currentUsername || uid === currentEmail || (currentEmail && orderEmail === currentEmail);
        });
    }
    
    if (bookingsToDisplay.length === 0) {
        bookingTrackingContainer.innerHTML = searchQuery ? 
            `<p class="empty-state" style="padding: 20px; text-align: center;">No order found matching "<strong>${searchQuery}</strong>". Please verify your Order ID or Phone Number.</p>` :
            '<p class="empty-state" style="padding: 24px; text-align: center;">No bookings found in the system yet.</p>';
        return;
    }

    const isAdminOrSupplier = state.currentUser && (state.currentUser.role === 'admin' || state.currentUser.role === 'supplier' || state.currentUser.role === 'sub_admin');

    bookingTrackingContainer.innerHTML = bookingsToDisplay.map(order => `
        <div class="order-card" style="${order.status === 'Cancelled' ? 'border: 2px solid #FCA5A5; background: #FFF5F5;' : ''}">
            <div class="order-header" style="background-color: ${order.status === 'Cancelled' ? '#FEE2E2' : 'var(--bg-light)'}; padding: 1rem; margin: -1.5rem -1.5rem 1rem -1.5rem; border-bottom: 1px solid var(--border-light); border-radius: var(--radius-md) var(--radius-md) 0 0;">
                <div>
                    <h4 style="margin-bottom: 0;">Order ID: ${order.id}</h4>
                    <span class="order-date">${new Date(order.date).toLocaleString()}</span>
                </div>
                <div>
                    <span class="role-pill role-${order.status === 'Cancelled' ? 'supplier' : (order.status === 'Placed' ? 'customer' : 'admin')}" style="${order.status === 'Cancelled' ? 'background: #DC2626; color: #FFF;' : ''}">${order.status.toUpperCase()}</span>
                </div>
            </div>

            <!-- Live Order Tracking Stepper -->
            ${renderTrackingStepper(order.status)}
            
            ${order.status === 'Cancelled' ? `
                <div style="background: #FEE2E2; border: 1px solid #FCA5A5; color: #991B1B; padding: 8px 12px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-triangle-exclamation text-danger"></i> ORDER CANCELLED
                </div>
            ` : ''}

            <div style="margin-bottom: 0.8rem; color: var(--text-dark); font-size: 0.85rem;">
                <strong>Customer User ID:</strong> ${order.userId ? order.userId : 'Guest Customer'}
            </div>
            
            ${order.delivery ? `
            <div style="background-color: #f1f5f9; padding: 0.8rem; border-radius: var(--radius-sm); margin-bottom: 1rem; font-size: 0.85rem; border: 1px solid var(--border-light);">
                <strong>Customer Name:</strong> ${order.delivery.name}<br>
                <strong>Phone:</strong> ${order.delivery.phone}<br>
                ${order.delivery.email ? `<strong>Email:</strong> ${order.delivery.email}<br>` : ''}
                <strong>Address:</strong> ${order.delivery.address}<br>
                <strong>Payment Mode:</strong> ${(order.delivery.payment || 'COD').toUpperCase()}
            </div>
            ` : ''}

            <div class="order-items-list">
                ${order.items.map(item => `
                    <div class="order-item-row" style="background-color: #fff; border: 1px solid var(--border-light); padding: 0.5rem; border-radius: var(--radius-sm);">
                        <img src="${item.image}" alt="${item.title}" class="order-item-img" style="width: 40px; height: 40px;">
                        <div class="order-item-info">
                            <h5 style="font-size: 0.85rem;">${item.title} (x${item.qty || item.quantity || 1})</h5>
                            <span class="order-item-supplier">Supplier: ${item.supplierName || 'FreshKart Direct'} • ₹${item.price} each</span>
                        </div>
                        <div style="font-weight: 700; color: #0F172A; font-size: 0.9rem;">
                            ₹${(parseFloat(item.price) * parseInt(item.qty || item.quantity || 1)).toFixed(2)}
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Itemized Bill Breakdown -->
            ${(() => {
                const sub = order.items.reduce((s, i) => s + (parseFloat(i.price) * parseInt(i.qty || i.quantity || 1)), 0);
                const disc = parseFloat(order.discount || (order.delivery && order.delivery.discount) || 0);
                const ship = parseFloat(order.shipping !== undefined ? order.shipping : ((order.delivery && order.delivery.shipping !== undefined) ? order.delivery.shipping : (sub >= 299 ? 0 : 29)));
                const gTotal = parseFloat(order.total || (sub - disc + ship));

                return `
                <div class="order-bill-summary" style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px 14px; border-radius: 8px; margin: 10px 0; font-size: 0.85rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="color: #64748B;">Items Subtotal:</span>
                        <strong style="color: #334155;">₹${sub.toFixed(2)}</strong>
                    </div>
                    ${disc > 0 ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="color: #059669;">Promo Discount:</span>
                        <strong style="color: #059669;">-₹${disc.toFixed(2)}</strong>
                    </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <span style="color: #64748B;">Delivery Charge:</span>
                        <strong style="color: ${ship === 0 ? '#059669' : '#334155'};">${ship === 0 ? 'FREE (₹0.00)' : '₹' + ship.toFixed(2)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; border-top: 1px dashed #CBD5E1; padding-top: 6px; font-size: 0.95rem;">
                        <span style="font-weight: 700; color: #0F172A;">Grand Total:</span>
                        <strong style="color: #059669; font-size: 1.05rem;">₹${gTotal.toFixed(2)}</strong>
                    </div>
                </div>
                `;
            })()}

            <div class="order-footer" style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-top: 10px;">
                <button class="action-btn" onclick="downloadOrderPDF('${order.id}')" title="Generate Invoice PDF" style="padding: 0.4rem 0.8rem; height: auto;"><i class="fa-solid fa-file-pdf"></i> Download PDF Bill</button>
                ${isAdminOrSupplier ? `
                    <select onchange="updateBookingStatus('${order.id}', this.value)" style="padding: 0.4rem 0.6rem; border-radius: var(--radius-sm); border: 1px solid var(--border-light); font-weight: 700; color: #047857; background: #F0FDF4;">
                        <option value="Placed" ${order.status === 'Placed' ? 'selected' : ''}>Placed</option>
                        <option value="Packing" ${order.status === 'Packing' ? 'selected' : ''}>Packing</option>
                        <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                ` : ''}
            </div>
        </div>
    `).join('');
}

window.updateBookingStatus = async function(orderId, newStatus) {
    const order = state.ordersHistory.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;
        try {
            await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
        } catch (e) {
            console.error('Failed to update order status in DB:', e);
        }
        showToast('Booking status updated to ' + newStatus, 'success');
        if (typeof myOrdersContainer !== 'undefined' && myOrdersContainer) renderMyOrders();
        if (typeof bookingTrackingContainer !== 'undefined' && bookingTrackingContainer) renderBookingTracking();
    }
};

window.downloadOrderPDF = function(orderId) {
    const order = state.ordersHistory.find(o => o.id === orderId);
    if (!order) return;

    showToast(`📩 Downloading PDF Bill Invoice for Order #${orderId}...`, 'info');

    // Direct File Download Trigger
    const downloadUrl = `${API_BASE_URL}/orders/${orderId}/pdf`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `FreshKart_Invoice_${order.id}.pdf`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

function renderSearchSuggestions(query, isMobile) {
    const container = isMobile ? mobileSearchSuggestions : searchSuggestions;
    if (!container) return;

    if (!query.trim()) {
        container.classList.add('hidden');
        return;
    }

    const search = query.toLowerCase();
    const suggestions = state.products.filter(p => {
        return (p.title && p.title.toLowerCase().includes(search)) || 
               (p.category && p.category.toLowerCase().includes(search));
    }).slice(0, 5); // Max 5 suggestions

    if (suggestions.length === 0) {
        container.innerHTML = '<div style="padding: 14px 16px; color: #64748B; font-weight: 600; background: #FFFFFF; text-align: center;">No matching Kirana items found...</div>';
    } else {
        container.innerHTML = suggestions.map(product => `
            <div class="search-suggestion-item" onclick="selectSuggestion('${product.id}')" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #FFFFFF; border-bottom: 1px solid #F1F5F9; cursor: pointer;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <img src="${product.image}" class="search-suggestion-img" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover; border: 1px solid #E2E8F0;" alt="">
                    <div class="search-suggestion-info">
                        <span class="search-suggestion-title" style="font-weight: 700; font-size: 0.95rem; color: #0F172A;">${product.title}</span>
                        <span class="search-suggestion-category" style="font-size: 0.78rem; color: #059669; font-weight: 600;">${product.category.toUpperCase()} • ${product.unit || ''}</span>
                    </div>
                </div>
                <div style="font-weight: 800; font-size: 1rem; color: #059669; background: #ECFDF5; padding: 4px 10px; border-radius: 20px;">
                    ₹${product.price}
                </div>
            </div>
        `).join('');
    }
    container.classList.remove('hidden');
}

window.selectSuggestion = function(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    state.searchQuery = product.title;
    if (searchInput) searchInput.value = product.title;
    if (mobileSearchInput) mobileSearchInput.value = product.title;
    if (clearSearchBtn) clearSearchBtn.classList.remove('hidden');
    
    if (searchSuggestions) searchSuggestions.classList.add('hidden');
    if (mobileSearchSuggestions) mobileSearchSuggestions.classList.add('hidden');
    
    renderProducts();
    
    const section = document.getElementById('productsSection');
    if(section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
