// ==========================================
// CONFIGURACIÓN DE API - MySQL (PROPIO)
// ==========================================

// TU URL REAL
const API_BASE_URL = 'api.php?resource='; 

// Nombres de los Recursos
const BASKET_ORDERS = 'carritoCompra';
const BASKET_USERS = 'usuarios';
const BASKET_CATEGORIES = 'categorias';
const BASKET_PRODUCTS = 'productos';

// Clave secreta
const SECRET_KEY = "market_secret_key_123!";

// ==========================================
// ESTADOS GLOBALES
// ==========================================

let categories = [];
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function encryptData(data) {
    return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
}
function decryptData(encryptedData) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}

function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3500);
}

function isValidName(name) { return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,}$/.test(name); }
function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function isValidPhone(phone) { return /^\d{9}$/.test(phone); }

function getSelectOptions(unit) {
    switch (unit) {
        case 'kilo': return [1, 2, 3, 4, 5].map(v => `<option value="${v}">${v} kilo${v > 1 ? 's' : ''}</option>`).join('');
        case 'atado*': return [1, 2, 3, 4, 5].map(v => `<option value="${v}">${v} atado*</option>`).join('');
        case 'atado**': return [1, 2, 3, 4, 5].map(v => `<option value="${v}">${v} atado**</option>`).join('');
        case 'mano': return [1, 2, 3, 4, 5].map(v => `<option value="${v}">${v} mano${v > 1 ? 's' : ''}</option>`).join('');
        case 'bolsa': return [1, 2, 3, 4, 5].map(v => `<option value="${v}">${v} bolsa${v > 1 ? 's' : ''}</option>`).join('');
        case 'atado': return [1, 2, 3, 4, 5].map(v => `<option value="${v}">${v} atado${v > 1 ? 's' : ''}</option>`).join('');
        case 'docena': return [1, 2, 3, 4, 5].map(v => `<option value="${v}">${v} docena${v > 1 ? 's' : ''}</option>`).join('');
        case 'cajón': return [1, 2, 3, 4, 5].map(v => `<option value="${v}">${v} cajón${v > 1 ? 'es' : ''}</option>`).join('');
        case 'plancha': return [1, 2, 3, 4, 5].map(v => `<option value="${v}">${v} plancha${v > 1 ? 's' : ''}</option>`).join('');
        case 'unidad': return Array.from({length: 10}, (_, i) => `<option value="${i+1}">${i+1} unidad${i > 0 ? 'es' : ''}</option>`).join('');
        case 'bandeja': return [1, 2, 3, 4, 5].map(v => `<option value="${v}">${v} bandeja${v > 1 ? 's' : ''}</option>`).join('');
        default: return `<option value="1">1</option>`;
    }
}

function getQuantityOptions(unit, productId) {
    const selectOptions = getSelectOptions(unit);
    return `
        <div class="quantity-container">
            <select class="quantity-select" id="quantity-select-${productId}">
                ${selectOptions}
            </select>
            <div class="quantity-or">o</div>
            <input type="number" class="quantity-custom" id="quantity-custom-${productId}" 
                min="0.1" step="0.1" placeholder="Cantidad personalizada">
        </div>
    `;
}

// ==========================================
// CONEXIÓN API
// ==========================================

async function fetchFromPantry(basketName) {
    try {
        const response = await fetch(`${API_BASE_URL}${basketName}`);
        if (!response.ok) return null;
        const data = await response.json();
        
        if (basketName === BASKET_ORDERS && data.orders) return data.orders;
        if (basketName === BASKET_USERS && data.users) return data.users;
        if (basketName === BASKET_CATEGORIES && data.categories) return data.categories;
        if (basketName === BASKET_PRODUCTS && data.products) return data.products;
        
        return [];
    } catch (error) {
        console.error(`Error leyendo ${basketName}`, error);
        return [];
    }
}

async function saveToPantry(basketName, payload) {
    try {
        const response = await fetch(`${API_BASE_URL}${basketName}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error('Error en servidor');
        return await response.json();
    } catch (error) {
        console.error(error);
        return { success: false };
    }
}

async function loadCategoriesData() {
    const data = await fetchFromPantry(BASKET_CATEGORIES);
    return (data || []).filter(c => c.visible);
}

async function loadProductsData() {
    const data = await fetchFromPantry(BASKET_PRODUCTS);
    return (data || []).filter(p => p.visible);
}

// ==========================================
// LÓGICA UI Y NAVEGACIÓN
// ==========================================

async function showSection(sectionId, updateHistory = true) {
    
    // VALIDACIÓN DE SEGURIDAD PARA CARRITO
    if (sectionId === 'cart' && !currentUser) {
        showToast('Debes iniciar sesión para ver el carrito');
        showSection('login'); // Redirigir al login
        return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    } else {
        document.getElementById('home').classList.add('active');
        sectionId = 'home';
    }
    
    if (updateHistory) {
        history.pushState(null, null, `#${sectionId}`);
    }
    
    if (sectionId === 'store') {
        if (categories.length === 0 || products.length === 0) {
            categories = await loadCategoriesData();
            products = await loadProductsData();
        }
        loadCategories();
    }
    
    if (sectionId === 'cart') {
        updateCartView();
    }
    
    if (sectionId === 'profile') {
        if (!currentUser) {
            showToast('Debes iniciar sesión para ver el perfil');
            showSection('login');
            return;
        }
        document.getElementById('profile-name').value = currentUser.name;
        document.getElementById('profile-email').value = currentUser.email;
        document.getElementById('profile-phone').value = currentUser.phone;
        document.getElementById('profile-address').value = currentUser.address;
        loadUserOrders();
    }
    
    document.querySelector('.nav-links').classList.remove('active');
}

function toggleMenu() { document.querySelector('.nav-links').classList.toggle('active'); }

function loadCategories() {
    const container = document.getElementById('categories-container');
    container.innerHTML = '';
    
    const noCatMsg = document.getElementById('no-visible-categories');
    if (categories.length === 0) {
        if(noCatMsg) noCatMsg.style.display = 'block';
        return;
    }
    if(noCatMsg) noCatMsg.style.display = 'none';

    categories.forEach(c => {
        const div = document.createElement('div');
        div.className = 'category-card';
        div.innerHTML = `<img src="${c.image}" class="category-image"><div class="category-name">${c.name}</div>`;
        div.onclick = () => showCategory(c.id);
        container.appendChild(div);
    });
}

// Busca la función showCategory existente y reemplázala con esta:
function showCategory(id, autoScroll = true) {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    
    document.getElementById('category-title').textContent = cat.name;
    const catProducts = products.filter(p => p.categoryId === id && p.visible);
    
    const container = document.getElementById('products-container');
    container.innerHTML = '';
    
    // Mensajes especiales
    const msgs = document.getElementById('unit-messages');
    msgs.innerHTML = '';
    const specialUnits = {
        'atado*': 'Atado*: tamaño mercado granel (6-8 veces más grande que supermercado)',
        'atado**': 'Atado**: atado de 6 unidades',
        'mano': 'Mano: equivalente a 5 unidades',
        'bolsa': 'Bolsa: 160g por bolsa',
        'cajón': 'Cajón: aproximadamente 17 kilos por cajón',
        'plancha': 'Plancha: plancha por 30 unidades'
    };
    const foundUnits = new Set();
    catProducts.forEach(p => { if (specialUnits[p.unit]) foundUnits.add(specialUnits[p.unit]); });
    foundUnits.forEach(m => {
        const p = document.createElement('p'); p.textContent = m; msgs.appendChild(p);
    });

    catProducts.forEach(p => {
        const div = document.createElement('div');
        div.className = 'product-card';
        const badge = cart.some(i => i.id === p.id) ? '<div class="in-cart-badge"><i class="fas fa-check"></i> En carrito</div>' : '';
        div.innerHTML = `
            ${badge}
            <img src="${p.image}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">${p.name}</h3>
                <p>Cantidad:</p>
                <div class="product-actions">${getQuantityOptions(p.unit, p.id)}</div>
                <div style="text-align:center; margin-top:1rem;">
                    <button class="add-to-cart" onclick="addToCart(${p.id})"><i class="fas fa-cart-plus"></i> Agregar</button>
                </div>
            </div>`;
        container.appendChild(div);
    });
    
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.getElementById('category').classList.add('active');

    // AQUÍ ESTÁ EL CAMBIO: Solo sube si autoScroll es verdadero
    if (autoScroll) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if(window.location.hash !== `#category-${id}`) {
         history.pushState(null, null, `#category-${id}`);
    }
}

// ==========================================
// CARRITO
// ==========================================

// Busca la función addToCart existente y reemplázala con esta:
function addToCart(id) {
    if (!currentUser) { showToast('Inicia sesión para comprar'); showSection('login'); return; }
    
    const p = products.find(x => x.id === id);
    if (!p) return;
    
    const custom = document.getElementById(`quantity-custom-${id}`).value;
    const qty = (custom && parseFloat(custom) > 0) ? parseFloat(custom) : parseFloat(document.getElementById(`quantity-select-${id}`).value);
    
    cart.push({
        cartItemId: Date.now() + Math.random(),
        id: p.id,
        name: p.name,
        unit: p.unit,
        quantity: qty,
        image: p.image
    });
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    updateCartCount();
    showToast(`${p.name} agregado`);
    
    // AQUÍ ESTÁ EL CAMBIO: Pasamos 'false' para evitar el salto
    if(document.getElementById('category').classList.contains('active')) {
        showCategory(p.categoryId, false); 
    } else if(document.getElementById('store').classList.contains('active')) {
        searchProducts();
    }
}

function updateCartCount() {
    document.querySelector('.cart-count').textContent = cart.length;
}

function updateCartView() {
    const container = document.getElementById('cart-items-container');
    container.innerHTML = '';
    
    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:2rem;">Carrito vacío</p>';
        document.getElementById('checkout-btn').disabled = true;
        return;
    }
    
    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="item-info">
                <img src="${item.image}" class="item-image">
                <div class="item-details"><span class="item-name">${item.name}</span></div>
            </div>
            <div class="item-actions">
                <span class="item-price">${item.quantity} (${item.unit})</span>
                <button class="remove-item" onclick="removeFromCart(${item.cartItemId})"><i class="fas fa-times"></i></button>
            </div>`;
        container.appendChild(div);
    });
    
    const infoDiv = document.getElementById('customer-info-content');
    if (currentUser) {
        infoDiv.innerHTML = `
            <div class="form-group"><label class="form-label required">Nombre</label><input id="customer-name" class="form-input" value="${currentUser.name}" oninput="validateForm()"></div>
            <div class="form-group"><label class="form-label required">Celular</label><input id="customer-phone" class="form-input" value="${currentUser.phone}" oninput="validateForm()"></div>
            <div class="form-group"><label class="form-label required">Dirección</label><input id="customer-address" class="form-input" value="${currentUser.address}" oninput="validateForm()"></div>
            <div class="form-group"><label class="form-label">Notas</label><textarea id="customer-notes" class="form-input" rows="3"></textarea></div>
        `;
    } else {
        infoDiv.innerHTML = '<p style="padding:1rem; background:#f8d7da; border-radius:8px; text-align:center;">Debes iniciar sesión.</p>';
    }
    validateForm();
}

function removeFromCart(id) {
    cart = cart.filter(i => i.cartItemId !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    updateCartView();
}

function emptyCart() {
    if(confirm('¿Vaciar carrito?')) {
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        updateCartView();
    }
}

function validateForm() {
    if (!currentUser) { document.getElementById('checkout-btn').disabled = true; return; }
    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const addr = document.getElementById('customer-address').value.trim();
    document.getElementById('checkout-btn').disabled = !(name && phone && addr && cart.length > 0);
}

// ==========================================
// AUTENTICACIÓN
// ==========================================

async function fetchUsers() {
    const data = await fetchFromPantry(BASKET_USERS);
    return data || [];
}

async function customerSignup() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const phone = document.getElementById('signup-phone').value.trim();
    const address = document.getElementById('signup-address').value.trim();
    const pass = document.getElementById('signup-password').value;
    
    if(!name || !email || !phone || !address || !pass) return alert('Todos los campos son obligatorios');
    
    try {
        const users = await fetchUsers();
        if(users.some(u => u.email === email)) return alert('Correo ya registrado');
        
        const lastId = users.reduce((max, u) => Math.max(max, parseInt(u.id.replace('U','')) || 0), 0);
        const newUser = {
            id: `U${(lastId + 1).toString().padStart(5,'0')}`,
            name, email, phone, address, 
            password: encryptData(pass),
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        await saveToPantry(BASKET_USERS, { users: users });
        
        currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        updateAuthLinks();
        showToast('Bienvenido');
        showSection('home');
    } catch(e) { console.error(e); alert('Error al registrar'); }
}

async function customerLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value;
    
    try {
        const users = await fetchUsers();
        const user = users.find(u => u.email === email && decryptData(u.password) === pass);
        
        if(user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            updateAuthLinks();
            showToast(`Hola ${user.name}`);
            showSection('home');
        } else {
            document.getElementById('login-error').style.display = 'block';
            document.getElementById('login-error').textContent = 'Credenciales incorrectas';
        }
    } catch(e) { console.error(e); }
}

function customerLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateAuthLinks();
    showToast('Has cerrado sesión correctamente');
    showSection('home');
}

// RESTAURADA ESTRUCTURA ORIGINAL: LI dentro de UL (sin div extra)
function updateAuthLinks() {
    const authLinks = document.getElementById('auth-links');
    
    if (currentUser) {
        // Enlaces para usuario logueado
        authLinks.innerHTML = `
            <li><a href="#" onclick="showSection('profile'); return false;">Perfil</a></li>
            <li><a href="#" onclick="customerLogout(); return false;">Cerrar Sesión</a></li>
        `;
    } else {
        // Enlaces originales (Inicia Sesión / Registrarse)
        // Manteniendo la estructura de listas
        authLinks.innerHTML = `
            <li><a href="#login" onclick="showSection('login'); return false;">Iniciar Sesión</a></li>
            <li><a href="#signup" onclick="showSection('signup'); return false;">Registrarse</a></li>
        `;
    }
}

async function updateProfile() {
    const name = document.getElementById('profile-name').value.trim();
    const phone = document.getElementById('profile-phone').value.trim();
    const address = document.getElementById('profile-address').value.trim();
    
    if(!name || !phone || !address) return alert('Campos obligatorios');
    
    const users = await fetchUsers();
    const idx = users.findIndex(u => u.id === currentUser.id);
    if(idx > -1) {
        users[idx] = { ...users[idx], name, phone, address };
        await saveToPantry(BASKET_USERS, { users: users });
        currentUser = users[idx];
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showToast('Perfil actualizado');
    }
}

// ==========================================
// PEDIDOS
// ==========================================

async function fetchOrders() {
    const data = await fetchFromPantry(BASKET_ORDERS);
    return data || [];
}

async function saveOrder() {
    const name = document.getElementById('customer-name').value.trim();
    const address = document.getElementById('customer-address').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const notes = document.getElementById('customer-notes').value.trim();
    
    try {
        let existingOrders = await fetchOrders();
        if (!Array.isArray(existingOrders)) existingOrders = [];

        const lastId = existingOrders.reduce((max, o) => Math.max(max, parseInt(o.id.replace('P','')) || 0), 0);
        const newId = `P${(lastId + 1).toString().padStart(5,'0')}`;

        const newOrder = {
            id: newId,
            date: new Date().toLocaleString('es-PE'),
            customer: name,
            address: address,
            phone: phone,
            notes: notes,
            status: 'Pendiente',
            items: cart.map(i => ({ name: i.name, unit: i.unit, quantity: i.quantity })),
            total: cart.length, 
            timestamp: Date.now(),
            userId: currentUser.id
        };

        await saveToPantry(BASKET_ORDERS, { orders: [newOrder] });
        
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        updateCartView();
        
        showToast('Pedido enviado correctamente');
        sendWhatsApp(newOrder); 
        showSection('home');

    } catch (error) {
        console.error(error);
        showToast('Error al enviar pedido', 'error');
    }
}

function sendWhatsApp(order) {
    const phone = '51968747222';
    let text = `🛒 *NUEVO PEDIDO ${order.id}*\n👤 ${order.customer}\n📍 ${order.address}\n\n`;
    order.items.forEach(i => text += `- ${i.name}: ${i.quantity} ${i.unit}\n`);
    if(order.notes) text += `\n📝 ${order.notes}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
}

async function loadUserOrders() {
    const div = document.getElementById('user-orders');
    div.innerHTML = 'Cargando...';
    const orders = await fetchOrders();
    const myOrders = orders.filter(o => o.userId === currentUser.id).sort((a,b) => b.timestamp - a.timestamp);
    
    if(myOrders.length === 0) { div.innerHTML = 'Sin pedidos aún.'; return; }
    
    div.innerHTML = myOrders.map(o => `
        <div class="order-card">
            <div class="order-header"><h4>${o.id}</h4><span>${o.date}</span></div>
            <span class="order-status status-${o.status.toLowerCase()}">${o.status}</span>
            <div style="margin-top:10px">
                ${o.items.map(i => `<div>${i.name} - ${i.quantity} ${i.unit}</div>`).join('')}
            </div>
        </div>
    `).join('');
}

function searchProducts() {
    const term = document.getElementById('search-input').value.toLowerCase();
    const pContainer = document.getElementById('search-products-container');
    const cContainer = document.getElementById('categories-container');
    
    if(!term) {
        pContainer.style.display = 'none';
        cContainer.style.display = 'grid';
        return;
    }
    
    cContainer.style.display = 'none';
    pContainer.style.display = 'grid';
    pContainer.innerHTML = '';
    
    const found = products.filter(p => p.name.toLowerCase().includes(term) && p.visible);
    
    if(found.length === 0) { pContainer.innerHTML = '<p style="grid-column:1/-1; text-align:center">No encontrado</p>'; return; }
    
    found.forEach(p => {
        const div = document.createElement('div');
        div.className = 'product-card';
        div.innerHTML = `<img src="${p.image}" class="product-image">
            <div class="product-info"><h3>${p.name}</h3>
            <div class="product-actions">${getQuantityOptions(p.unit, p.id)}</div>
            <button class="add-to-cart" onclick="addToCart(${p.id})">Agregar</button></div>`;
        pContainer.appendChild(div);
    });
}

function showProfileTab(id) {
    document.querySelectorAll('.profile-section').forEach(s => s.style.display='none');
    document.querySelectorAll('.profile-tab').forEach(b => b.classList.remove('active'));
    document.getElementById(id).style.display='block';
    event.currentTarget.classList.add('active');
    if(id === 'order-history') loadUserOrders();
}

document.addEventListener('DOMContentLoaded', async () => {
    updateCartCount();
    updateAuthLinks();
    
    // Función inteligente de Routing
    const handleRouting = async () => {
        const hash = window.location.hash.substring(1); // Quitar el '#'

        if (hash.startsWith('category-')) {
            // CASO: Recarga directa en una categoría (ej: #category-1)
            const catId = parseInt(hash.split('-')[1]);
            
            // Si acabamos de recargar, los arrays están vacíos. Hay que llenarlos.
            if (categories.length === 0 || products.length === 0) {
                categories = await loadCategoriesData();
                products = await loadProductsData();
            }
            
            showCategory(catId);
        } else if (hash) {
            // CASO: Sección normal (store, cart, profile)
            showSection(hash, false);
        } else {
            // CASO: Sin hash, ir al inicio
            showSection('home', false);
        }
    };

    // Escuchar cambios en los botones Adelante/Atrás del navegador
    window.addEventListener('popstate', handleRouting);

    // Ejecutar al cargar la página por primera vez
    await handleRouting();
    
    // Listeners de Inputs
    document.getElementById('login-password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') customerLogin();
    });
    
    document.getElementById('search-input').addEventListener('input', searchProducts);
});