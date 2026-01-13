       // ==========================================
// CONFIGURACIÓN DE API - JSONBIN
// ==========================================

// USAMOS LA MASTER KEY (La que tiene acceso total y nunca falla por permisos)
const API_KEY = '$2a$10$EXzKu5AnMdzNOgAfu8Fx2.SvsmKJmqlwriEoW96bMKnEEX5WMH0Ra'; 

// IDs de tus Bins
const BIN_ID = '687a974a2de0201b319ca267'; // Pedidos
const USERS_BIN_ID = '687b046c2de0201b319ccf2b'; // Usuarios
const CATEGORIES_BIN_ID = '687f2380ae596e708fb99af7'; // Categorías
const PRODUCTS_BIN_ID = '687f2362f7e7a370d1ebcc73'; // Productos

// URLs Base
const API_URL = `https://api.jsonbin.io/v3/b/`;
const CATEGORIES_API_URL = `https://api.jsonbin.io/v3/b/${CATEGORIES_BIN_ID}`;
const PRODUCTS_API_URL = `https://api.jsonbin.io/v3/b/${PRODUCTS_BIN_ID}`;

// Clave secreta para encriptación local
const SECRET_KEY = "market_secret_key_123!";

// ==========================================
// ESTADOS Y VARIABLES GLOBALES
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

function isValidName(name) {
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,}$/.test(name);
}
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidPhone(phone) {
    return /^\d{9}$/.test(phone);
}

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
// CONEXIÓN CON API (CARGAR DATOS)
// ==========================================

async function loadCategoriesData() {
    try {
        console.log("Cargando categorías con Key:", API_KEY.substring(0, 10) + "..."); // Debug
        const response = await fetch(CATEGORIES_API_URL, {
            method: 'GET',
            headers: {
                'X-Master-Key': API_KEY, // Volvemos a Master Key
                'X-Bin-Meta': 'false'
            }
        });
        if (!response.ok) throw new Error('Error al obtener las categorías');
        const data = await response.json();
        return data.categories.filter(category => category.visible);
    } catch (e) {
        console.error(e);
        showToast('Error al cargar categorías', 'error');
        return [];
    }
}

async function loadProductsData() {
    try {
        const response = await fetch(PRODUCTS_API_URL, {
            method: 'GET',
            headers: {
                'X-Master-Key': API_KEY, // Volvemos a Master Key
                'X-Bin-Meta': 'false'
            }
        });
        if (!response.ok) throw new Error('Error al obtener los productos');
        const data = await response.json();
        return data.products.filter(product => product.visible);
    } catch (e) {
        console.error(e);
        showToast('Error al cargar productos', 'error');
        return [];
    }
}

// ==========================================
// LÓGICA DE INTERFAZ (UI)
// ==========================================

async function showSection(sectionId) {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    document.querySelectorAll('section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(sectionId).classList.add('active');
    
    if (sectionId === 'store') {
        categories = await loadCategoriesData();
        products = await loadProductsData();
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

function toggleMenu() {
    document.querySelector('.nav-links').classList.toggle('active');
}

function loadCategories() {
    const container = document.getElementById('categories-container');
    const noCategoriesMsg = document.getElementById('no-visible-categories');
    
    container.innerHTML = '';
    
    if (categories.length === 0) {
        noCategoriesMsg.style.display = 'block';
        return;
    }
    
    noCategoriesMsg.style.display = 'none';

    categories.forEach(category => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.innerHTML = `
            <img src="${category.image}" alt="${category.name}" class="category-image">
            <div class="category-name">${category.name}</div>
        `;
        categoryCard.addEventListener('click', () => {
            showCategory(category.id);
        });
        container.appendChild(categoryCard);
    });
}

function showCategory(categoryId) {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;
    
    document.getElementById('category-title').textContent = category.name;
    const categoryProducts = products.filter(product => product.categoryId === categoryId && product.visible);
    
    const messagesContainer = document.getElementById('unit-messages');
    messagesContainer.innerHTML = '';
    
    const specialUnits = {
        'atado*': 'Atado*: tamaño mercado granel (6-8 veces más grande que supermercado)',
        'atado**': 'Atado**: atado de 6 unidades',
        'mano': 'Mano: equivalente a 5 unidades',
        'bolsa': 'Bolsa: 160g por bolsa',
        'cajón': 'Cajón: aproximadamente 17 kilos por cajón',
        'plancha': 'Plancha: plancha por 30 unidades'
    };
    
    const foundUnits = new Set();
    categoryProducts.forEach(product => {
        if (specialUnits[product.unit]) {
            foundUnits.add(specialUnits[product.unit]);
        }
    });
    
    if (foundUnits.size > 0) {
        foundUnits.forEach(message => {
            const messageEl = document.createElement('p');
            messageEl.textContent = message;
            messagesContainer.appendChild(messageEl);
        });
    }
    
    const container = document.getElementById('products-container');
    container.innerHTML = '';
    
    categoryProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        const isInCart = cart.some(item => item.id === product.id);
        const cartBadge = isInCart ? '<div class="in-cart-badge"><i class="fas fa-check-circle"></i> En carrito</div>' : '';

        productCard.innerHTML = `
            ${cartBadge}
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p>Cantidad:</p>
                <div class="product-actions">
                    ${getQuantityOptions(product.unit, product.id)}
                </div>
                <div style="text-align: center; margin-top: 1rem;">
                    <button class="add-to-cart" onclick="addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i> Agregar
                    </button>
                </div>
            </div>
        `;
        container.appendChild(productCard);
    });
    
    showSection('category');
}

function addToCart(productId) {
    if (!currentUser) {
        showToast('Debes iniciar sesión para agregar productos al carrito');
        showSection('login');
        return;
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const customQuantity = document.getElementById(`quantity-custom-${productId}`).value;
    let quantity;
    
    if (customQuantity && parseFloat(customQuantity) > 0) {
        quantity = parseFloat(customQuantity);
    } else {
        const quantitySelect = document.getElementById(`quantity-select-${productId}`);
        quantity = parseFloat(quantitySelect.value);
    }
    
    const cartItemId = Date.now() + Math.random();
    
    cart.push({
        cartItemId: cartItemId,
        id: product.id,
        name: product.name,
        unit: product.unit,
        quantity: quantity,
        image: product.image
    });
    
    updateCartCount();
    showToast(`Se ha agregado ${product.name} al carrito`);

    const categorySection = document.getElementById('category');
    const storeSection = document.getElementById('store');

    if (categorySection.classList.contains('active')) {
        const categoryTitle = document.getElementById('category-title').textContent;
        const currentCategory = categories.find(cat => cat.name === categoryTitle);
        if (currentCategory) {
            showCategory(currentCategory.id);
        }
    } else if (storeSection.classList.contains('active')) {
        const searchInput = document.getElementById('search-input');
        if (searchInput.value) {
            searchProducts();
        }
    }
}

function updateCartCount() {
    const totalItems = cart.reduce((total) => total + 1, 0);
    document.querySelector('.cart-count').textContent = totalItems;
}

function updateCartView() {
    const container = document.getElementById('cart-items-container');
    container.innerHTML = '';
    
    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem;">Tu carrito está vacío</p>';
        document.getElementById('checkout-btn').disabled = true;
        return;
    }
    
    cart = cart.filter(item => true);
    
    cart.forEach(item => {
        const itemTotal = item.quantity;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="item-info">
                <img src="${item.image}" alt="${item.name}" class="item-image">
                <div class="item-details">
                    <span class="item-name">${item.name}</span>
                </div>
            </div>
            <div class="item-actions">
                <span class="item-price">${itemTotal.toFixed(1)} (${item.unit})</span>
                <button class="remove-item" onclick="removeFromCart(${item.cartItemId})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        container.appendChild(cartItem);
    });
    
    const customerContent = document.getElementById('customer-info-content');
    if (currentUser) {
        customerContent.innerHTML = `
            <div class="form-group">
                <label class="form-label required" for="customer-name">Nombre Completo</label>
                <input type="text" class="form-input" id="customer-name" placeholder="Ingresa tu nombre completo" value="${currentUser.name}" oninput="validateForm()">
            </div>
            <div class="form-group">
                <label class="form-label required" for="customer-phone">Número Celular</label>
                <input type="text" class="form-input" id="customer-phone" placeholder="Ingresa tu número celular" value="${currentUser.phone}" oninput="validateForm()">
            </div>
            <div class="form-group">
                <label class="form-label required" for="customer-address">Dirección de Entrega</label>
                <input type="text" class="form-input" id="customer-address" placeholder="Ingresa tu dirección completa" value="${currentUser.address}" oninput="validateForm()">
            </div>
            <div class="form-group">
                <label class="form-label" for="customer-notes">Agregue productos adicionales:</label>
                <textarea class="form-input" id="customer-notes" placeholder="Alguna instrucción especial para la entrega" rows="3"></textarea>
            </div>
        `;
    } else {
        customerContent.innerHTML = `
            <p style="text-align: center; padding: 1rem; background: #f8d7da; border-radius: var(--radius);">
                Para realizar un pedido, debes <a href="#" style="color: var(--primary);" onclick="showSection('login')">iniciar sesión</a> o <a href="#" style="color: var(--primary);" onclick="showSection('signup')">registrarte</a>.
            </p>
        `;
    }
    
    validateForm();
}

function removeFromCart(cartItemId) {
    cart = cart.filter(item => item.cartItemId !== cartItemId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    updateCartView();
    showToast('Producto eliminado del carrito', 'info');
}

function emptyCart() {
    if (confirm('¿Estás seguro de que deseas vaciar tu carrito?')) {
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        updateCartView();
        showToast('Carrito vaciado', 'info');
    }
}

function validateForm() {
    if (!currentUser) {
        document.getElementById('checkout-btn').disabled = true;
        return;
    }
    
    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const address = document.getElementById('customer-address').value.trim();
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (name !== '' && address !== '' && phone !== '' && cart.length > 0) {
        checkoutBtn.disabled = false;
    } else {
        checkoutBtn.disabled = true;
    }
}

// ==========================================
// AUTENTICACIÓN (LOGIN/SIGNUP)
// ==========================================

async function fetchUsers() {
    try {
        const response = await fetch(`${API_URL}${USERS_BIN_ID}`, {
            method: 'GET',
            headers: {
                'X-Master-Key': API_KEY, // Volvemos a Master Key
                'X-Bin-Meta': 'false'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status}`);
        }
        
        const data = await response.json();
        return data.users || [];
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        return [];
    }
}

async function saveUsersToCloud(users) {
    try {
        const response = await fetch(`${API_URL}${USERS_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY // Volvemos a Master Key
            },
            body: JSON.stringify({ users })
        });
        
        if (!response.ok) {
            throw new Error(`Error al guardar: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error al guardar usuarios:', error);
        throw error;
    }
}

async function customerSignup() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const phone = document.getElementById('signup-phone').value.trim();
    const address = document.getElementById('signup-address').value.trim();
    const password = document.getElementById('signup-password').value;
    const errorEl = document.getElementById('signup-error');
    
    if (!name || !email || !phone || !address || !password) {
        errorEl.textContent = 'Todos los campos son obligatorios';
        errorEl.style.display = 'block';
        return;
    }
    
    if (!isValidName(name)) {
        errorEl.textContent = 'El nombre debe contener solo letras y espacios (mínimo 3 caracteres)';
        errorEl.style.display = 'block';
        return;
    }
    
    if (!isValidEmail(email)) {
        errorEl.textContent = 'Por favor ingresa un correo válido';
        errorEl.style.display = 'block';
        return;
    }
    
    if (!isValidPhone(phone)) {
        errorEl.textContent = 'El teléfono debe tener exactamente 9 dígitos numéricos';
        errorEl.style.display = 'block';
        return;
    }
    
    try {
        const users = await fetchUsers();
        
        if (users.some(user => user.email === email)) {
            errorEl.textContent = 'Este correo ya está registrado';
            errorEl.style.display = 'block';
            return;
        }
        
        let newUserId = 'U00001';
        if (users.length > 0) {
            const lastUser = users
                .map(user => {
                    const match = user.id.toString().match(/U(\d+)/);
                    return match ? parseInt(match[1]) : 0;
                })
                .reduce((max, current) => Math.max(max, current), 0);
            
            const nextNumber = lastUser + 1;
            newUserId = `U${nextNumber.toString().padStart(5, '0')}`;
        }

        const newUser = {
            id: newUserId,
            name,
            email,
            phone,
            address,
            password: encryptData(password),
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        await saveUsersToCloud(users);
        
        currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        updateAuthLinks();
        
        document.getElementById('signup-name').value = '';
        document.getElementById('signup-email').value = '';
        document.getElementById('signup-phone').value = '';
        document.getElementById('signup-address').value = '';
        document.getElementById('signup-password').value = '';
        
        showToast('¡Registro exitoso! Bienvenido a Market');
        showSection('home');
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        errorEl.textContent = 'Hubo un error al registrarse. Inténtalo de nuevo.';
        errorEl.style.display = 'block';
    }
}

async function customerLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    
    if (!email || !password) {
        errorEl.textContent = 'Por favor completa todos los campos';
        errorEl.style.display = 'block';
        return;
    }
    
    try {
        const users = await fetchUsers();
        
        const user = users.find(u => 
            u.email === email && 
            decryptData(u.password) === password
        );
        
        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            updateAuthLinks();
            
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
            errorEl.style.display = 'none';
            
            showToast(`Bienvenido de nuevo, ${user.name}!`);
            showSection('home');
        } else {
            errorEl.textContent = 'Correo o contraseña incorrectos';
            errorEl.style.display = 'block';
        }
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        errorEl.textContent = 'Hubo un error al iniciar sesión. Inténtalo de nuevo.';
        errorEl.style.display = 'block';
    }
}

function customerLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateAuthLinks();
    showToast('Has cerrado sesión correctamente');
    showSection('home');
}

// ==========================================
// PERFIL Y RECUPERACIÓN
// ==========================================

async function updateProfile() {
    const name = document.getElementById('profile-name').value.trim();
    const phone = document.getElementById('profile-phone').value.trim();
    const address = document.getElementById('profile-address').value.trim();
    const errorEl = document.getElementById('profile-error');
    
    if (!name || !phone || !address) {
        errorEl.textContent = 'Todos los campos son obligatorios';
        errorEl.style.display = 'block';
        return;
    }
    
    try {
        const users = await fetchUsers();
        const userIndex = users.findIndex(u => u.id.toString() === currentUser.id.toString());
        
        if (userIndex !== -1) {
            users[userIndex].name = name;
            users[userIndex].phone = phone;
            users[userIndex].address = address;
            
            await saveUsersToCloud(users);
            
            currentUser = users[userIndex];
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showToast('Perfil actualizado correctamente');
            errorEl.style.display = 'none';
        } else {
            errorEl.textContent = 'Usuario no encontrado';
            errorEl.style.display = 'block';
        }
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        errorEl.textContent = 'Hubo un error al actualizar el perfil. Inténtalo de nuevo.';
        errorEl.style.display = 'block';
    }
}

async function verifyUser() {
    const name = document.getElementById('recovery-name').value.trim();
    const email = document.getElementById('recovery-email').value.trim();
    const errorEl = document.getElementById('recovery-error');
    
    if (!name || !email) {
        errorEl.textContent = 'Por favor completa todos los campos';
        errorEl.style.display = 'block';
        return;
    }
    
    if (!isValidEmail(email)) {
        errorEl.textContent = 'Por favor ingresa un correo válido';
        errorEl.style.display = 'block';
        return;
    }
    
    try {
        const users = await fetchUsers();
        const user = users.find(u => u.name === name && u.email === email);
        
        if (user) {
            sessionStorage.setItem('recoveryUserId', user.id);
            showSection('new-password');
        } else {
            errorEl.textContent = 'No se encontró un usuario con esos datos. Por favor verifica.';
            errorEl.style.display = 'block';
        }
    } catch (error) {
        console.error('Error al verificar usuario:', error);
        errorEl.textContent = 'Hubo un error al verificar. Inténtalo de nuevo.';
        errorEl.style.display = 'block';
    }
}

async function updatePassword() {
    const newPassword = document.getElementById('new-password-input').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    const errorEl = document.getElementById('new-password-error');
    const userId = sessionStorage.getItem('recoveryUserId');
    
    if (!userId) {
        errorEl.textContent = 'Sesión expirada. Por favor inicia el proceso de nuevo.';
        errorEl.style.display = 'block';
        return;
    }
    
    if (!newPassword || !confirmPassword) {
        errorEl.textContent = 'Por favor completa todos los campos';
        errorEl.style.display = 'block';
        return;
    }
    
    if (newPassword !== confirmPassword) {
        errorEl.textContent = 'Las contraseñas no coinciden';
        errorEl.style.display = 'block';
        return;
    }
    
    try {
        const users = await fetchUsers();
        const userIndex = users.findIndex(u => u.id.toString() === userId.toString());
        
        if (userIndex !== -1) {
            users[userIndex].password = encryptData(newPassword);
            await saveUsersToCloud(users);
            sessionStorage.removeItem('recoveryUserId');
            showToast('Contraseña actualizada correctamente. Ahora puedes iniciar sesión.');
            showSection('login');
        } else {
            errorEl.textContent = 'Usuario no encontrado';
            errorEl.style.display = 'block';
        }
    } catch (error) {
        console.error('Error al actualizar contraseña:', error);
        errorEl.textContent = 'Hubo un error al actualizar. Inténtalo de nuevo.';
        errorEl.style.display = 'block';
    }
}

function updateAuthLinks() {
    const authLinks = document.getElementById('auth-links');
    if (currentUser) {
        authLinks.innerHTML = `
            <li><a href="#" onclick="showSection('profile')">Perfil</a></li>
            <li><a href="#" onclick="customerLogout()">Cerrar Sesión</a></li>
        `;
    } else {
        authLinks.innerHTML = `
            <li><a href="#" onclick="showSection('login')">Iniciar Sesión</a></li>
            <li><a href="#" onclick="showSection('signup')">Registrarse</a></li>
        `;
    }
}

// ==========================================
// GESTIÓN DE PEDIDOS
// ==========================================

async function fetchOrders() {
    try {
        console.log("Obteniendo pedidos con Key:", API_KEY.substring(0, 5) + "...");
        const response = await fetch(`${API_URL}${BIN_ID}`, {
            method: 'GET',
            headers: {
                'X-Master-Key': API_KEY, // Volvemos a Master Key
                'X-Bin-Meta': 'false'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status}`);
        }
        
        const data = await response.json();
        return data.orders || [];
    } catch (error) {
        console.error('Error al obtener pedidos:', error);
        return [];
    }
}

async function saveOrdersToCloud(orders) {
    try {
        const response = await fetch(`${API_URL}${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY // Volvemos a Master Key
            },
            body: JSON.stringify({ orders })
        });
        
        if (!response.ok) {
            throw new Error(`Error al guardar: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error al guardar pedidos:', error);
        throw error;
    }
}

function sendWhatsAppNotification(orderData) {
    const BUSINESS_PHONE = '51968747222';
    
    let message = `🛒 *NUEVO PEDIDO - Market*\n\n`;
    message += `📋 *Pedido:* ${orderData.id}\n`;
    message += `👤 *Cliente:* ${orderData.customer}\n`;
    message += `📱 *Teléfono:* ${orderData.phone}\n`;
    message += `📍 *Dirección:* ${orderData.address}\n`;
    message += `📦 *Cantidad de productos:* ${orderData.total}\n\n`;
    
    message += `*Productos:*\n`;
    orderData.items.forEach((item, index) => {
        message += `${index + 1}. ${item.name} - ${item.quantity} ${item.unit}\n`;
    });
    
    if (orderData.notes) {
        message += `\n📝 *Notas:* ${orderData.notes}`;
    }
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${BUSINESS_PHONE}?text=${encodedMessage}`;
    window.open(whatsappURL, '_blank');
}

async function saveOrder() {
    const name = document.getElementById('customer-name').value.trim();
    const address = document.getElementById('customer-address').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const notes = document.getElementById('customer-notes').value.trim();
    
    let subtotal = 0;
    cart.forEach(item => {
        subtotal += 1;
    });
    const total = subtotal;
    
    const now = new Date();
    
    try {
        const existingOrders = await fetchOrders();
        
        let newOrderId = 'P00001';

        if (existingOrders.length > 0) {
            const lastOrder = existingOrders
                .map(order => {
                    const match = order.id.toString().match(/P(\d+)/);
                    return match ? parseInt(match[1]) : 0;
                })
                .reduce((max, current) => Math.max(max, current), 0);
            
            const nextNumber = lastOrder + 1;
            newOrderId = `P${nextNumber.toString().padStart(5, '0')}`;
        }

        const order = {
            id: newOrderId,
            date: now.toLocaleString('es-PE', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }),
            customer: name,
            address: address,
            phone: phone,
            notes: notes,
            status: 'Pendiente',
            items: cart.map(item => ({
                name: item.name,
                unit: item.unit,
                quantity: item.quantity
            })),
            total: total,
            timestamp: now.getTime(),
            userId: currentUser.id.toString()
        };

        existingOrders.push(order);
        await saveOrdersToCloud(existingOrders);
        
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        updateCartView();
        
        showToast('¡Pedido enviado con éxito! Nuestro equipo lo procesará pronto.');
        sendWhatsAppNotification(order);
        showSection('home');
    } catch (error) {
        console.error('Error al guardar el pedido:', error);
        showToast('Hubo un error al procesar tu pedido. Por favor, inténtalo de nuevo.');
    }
}

async function loadUserOrders() {
    const container = document.getElementById('user-orders');
    if (container.closest('.profile-section').style.display !== 'none') {
        container.innerHTML = '<p>Cargando pedidos...</p>';
        try {
            const orders = await fetchOrders();
            const userOrders = orders.filter(order => order.userId.toString() === currentUser.id.toString());
            
            if (userOrders.length === 0) {
                container.innerHTML = '<p>No has realizado ningún pedido aún.</p>';
                return;
            }
            
            userOrders.sort((a, b) => b.timestamp - a.timestamp);
            
            let ordersHTML = '';
            userOrders.forEach(order => {
                let statusClass = 'order-status ';
                switch(order.status) {
                    case 'Pendiente': statusClass += 'status-pendiente'; break;
                    case 'Aceptado': statusClass += 'status-aceptado'; break;
                    case 'Completado': statusClass += 'status-completado'; break;
                    case 'Rechazado': statusClass += 'status-rechazado'; break;
                    default: statusClass += 'status-pendiente';
                }
                
                let productsList = '';
                if (order.items && order.items.length > 0) {
                    productsList = '<ul class="order-products-list">';
                    order.items.forEach(item => {
                        productsList += `
                            <li class="order-product-item">
                                <span class="product-name">${item.name}</span>
                                <span class="product-quantity">${item.quantity} ${item.unit}</span>
                            </li>
                        `;
                    });
                    productsList += '</ul>';
                } else {
                    productsList = '<p>No hay productos en este pedido.</p>';
                }
                
                ordersHTML += `
                    <div class="order-card">
                        <div class="order-header">
                            <h4>Pedido #${order.id}</h4>
                            <span class="order-date">${order.date}</span>
                        </div>
                        <div class="order-status-container">
                            <span class="${statusClass}">${order.status}</span>
                        </div>
                        <p><strong>Productos pedidos:</strong> ${order.total}</p>
                        <p><strong>Dirección de envío:</strong> ${order.address}</p>
                        <p><strong>Notas:</strong> ${order.notes || 'Ninguna'}</p>
                        <div style="margin-top: 10px;">
                            <h5 style="color: var(--primary);">Productos comprados:</h5>
                            ${productsList}
                        </div>
                    </div>
                `;
            });
            container.innerHTML = ordersHTML;
        } catch (error) {
            console.error('Error al cargar pedidos:', error);
            container.innerHTML = '<p>Error al cargar los pedidos. Inténtalo de nuevo más tarde.</p>';
        }
    }
}

function showProfileTab(tabId) {
    document.querySelectorAll('.profile-section').forEach(section => {
        section.style.display = 'none';
    });
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabId).style.display = 'block';
    event.currentTarget.classList.add('active');
    
    if (tabId === 'order-history') {
        loadUserOrders();
    }
}

function searchProducts() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const categoriesContainer = document.getElementById('categories-container');
    const productsContainer = document.getElementById('search-products-container');
    
    productsContainer.style.display = 'grid';
    categoriesContainer.style.display = 'none';
    productsContainer.innerHTML = '';
    
    if (!searchTerm) {
        productsContainer.style.display = 'none';
        categoriesContainer.style.display = 'grid';
        return;
    }
    
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) && product.visible
    );
    
    if (filteredProducts.length === 0) {
        productsContainer.innerHTML = '<p style="text-align: center; padding: 2rem; grid-column: 1 / -1;">No se encontraron productos</p>';
        return;
    }
    
    filteredProducts.forEach(product => {
        const isInCart = cart.some(item => item.id === product.id);
        const cartBadge = isInCart ? '<div class="in-cart-badge"><i class="fas fa-check-circle"></i> En carrito</div>' : '';
        
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            ${cartBadge}
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p>Cantidad:</p>
                <div class="product-actions">
                    ${getQuantityOptions(product.unit, product.id)}
                    <button class="add-to-cart" onclick="addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i> Agregar
                    </button>
                </div>
            </div>
        `;
        productsContainer.appendChild(productCard);
    });
}

function clearSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('search-products-container').style.display = 'none';
    document.getElementById('categories-container').style.display = 'grid';
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    updateAuthLinks();
    
    document.getElementById('login-password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            customerLogin();
        }
    });
    
    document.getElementById('search-input').addEventListener('input', searchProducts);
    
    window.addEventListener('load', () => {
        window.scrollTo(0, 0);
    });
});